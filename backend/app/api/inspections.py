"""
GET /inspections/{id} - fetch one inspection.
GET /inspections/{id}/report - download inspection report PDF.
PATCH /inspections/{id} - update inspection (e.g. submit report). P1: prediction_match, attachment_url; notifies on submit.
POST /inspections/{id}/attachment - upload photo/file; stores in Supabase Storage and sets attachment_url (P1).
"""

import os
from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

import httpx
from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import Response

from app.config import SUPABASE_URL
from app.db import get_supabase
from app.models.schemas import (
    Inspection,
    InspectionUpdate,
    RepairCompletion,
    RepairCompletionCreate,
    RepairRecommendation,
    RepairRecommendationUpdate,
)
from app.services.pdf_reports import build_inspection_report_pdf
from app.services.stress import apply_stress_overrides

router = APIRouter(prefix="/inspections", tags=["inspections"])


def _normalize_row(row: dict) -> dict:
    if row.get("updated_at") is None and row.get("created_at") is not None:
        row = {**row, "updated_at": row["created_at"]}
    return row


@router.get("/{inspection_id}", response_model=Inspection)
def get_inspection(inspection_id: UUID):
    """Return a single inspection by ID. 404 if not found."""
    supabase = get_supabase()
    result = (
        supabase.table("inspections")
        .select("*")
        .eq("id", str(inspection_id))
        .execute()
    )
    if not result.data or len(result.data) == 0:
        raise HTTPException(status_code=404, detail="Inspection not found")
    return _normalize_row(dict(result.data[0]))


@router.get("/{inspection_id}/report")
def get_inspection_report_pdf(inspection_id: UUID):
    """Download Inspection Report as PDF."""
    supabase = get_supabase()
    insp_res = (
        supabase.table("inspections")
        .select("*")
        .eq("id", str(inspection_id))
        .execute()
    )
    if not insp_res.data or len(insp_res.data) == 0:
        raise HTTPException(status_code=404, detail="Inspection not found")
    inspection = dict(insp_res.data[0])
    turbine_id = inspection.get("turbine_id")
    if not turbine_id:
        raise HTTPException(status_code=400, detail="Inspection has no turbine_id")
    t_res = (
        supabase.table("turbines")
        .select("id, latitude, longitude, model, state, calendar_age_years")
        .eq("id", str(turbine_id))
        .execute()
    )
    if not t_res.data or len(t_res.data) == 0:
        raise HTTPException(status_code=404, detail="Turbine not found")
    turbine = dict(t_res.data[0])
    s_res = (
        supabase.table("stress_calculations")
        .select("true_age_years, terrain_class, stress_multiplier")
        .eq("turbine_id", str(turbine_id))
        .execute()
    )
    if s_res.data and len(s_res.data) > 0:
        s = s_res.data[0]
        turbine["true_age_years"] = s.get("true_age_years")
        turbine["terrain_class"] = s.get("terrain_class")
        turbine["stress_multiplier"] = s.get("stress_multiplier")
    apply_stress_overrides(supabase, [turbine])
    rec_res = (
        supabase.table("inspection_repair_recommendations")
        .select("recommended_action, estimated_cost_low, estimated_cost_high")
        .eq("inspection_id", str(inspection_id))
        .execute()
    )
    repair_rec = dict(rec_res.data[0]) if rec_res.data and len(rec_res.data) > 0 else None
    pdf_buf = build_inspection_report_pdf(inspection, turbine, repair_rec)
    return Response(
        content=pdf_buf.read(),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=inspection-report.pdf"},
    )


@router.patch("/{inspection_id}", response_model=Inspection)
def update_inspection(inspection_id: UUID, body: InspectionUpdate):
    """
    Update an inspection (e.g. add findings, or submit).
    Set status='submitted' to submit; submitted_at is set automatically.
    """
    supabase = get_supabase()
    result = (
        supabase.table("inspections")
        .select("*")
        .eq("id", str(inspection_id))
        .execute()
    )
    if not result.data or len(result.data) == 0:
        raise HTTPException(status_code=404, detail="Inspection not found")
    current = result.data[0]
    updates = {}
    if body.status is not None:
        updates["status"] = body.status
        if body.status == "submitted":
            updates["submitted_at"] = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    if body.component_inspected is not None:
        updates["component_inspected"] = body.component_inspected
    if body.condition_found is not None:
        updates["condition_found"] = body.condition_found
    if body.severity_rating is not None:
        updates["severity_rating"] = body.severity_rating
    if body.notes is not None:
        updates["notes"] = body.notes
    if body.prediction_match is not None:
        updates["prediction_match"] = body.prediction_match
    if body.attachment_url is not None:
        updates["attachment_url"] = body.attachment_url
    if not updates:
        return _normalize_row(dict(current))
    update_result = (
        supabase.table("inspections")
        .update(updates)
        .eq("id", str(inspection_id))
        .execute()
    )
    if not update_result.data or len(update_result.data) == 0:
        raise HTTPException(status_code=500, detail="Failed to update inspection")
    row = _normalize_row(dict(update_result.data[0]))
    # P1: Notify asset manager when report is submitted (optional webhook)
    if updates.get("status") == "submitted":
        _notify_inspection_submitted(inspection_id, row)
    # P2: Flag for model review when finding deviates from prediction
    if updates.get("status") == "submitted" and row.get("prediction_match") in ("partial", "not_found"):
        _flag_model_review(supabase, inspection_id, row)
    return row


def _flag_model_review(supabase, inspection_id: UUID, inspection: dict) -> None:
    """P2: Create a model_review_flag when submitted finding deviates from prediction."""
    turbine_id = inspection.get("turbine_id")
    if not turbine_id:
        return
    try:
        t = (
            supabase.table("turbines")
            .select("model")
            .eq("id", str(turbine_id))
            .execute()
        )
        s = (
            supabase.table("stress_calculations")
            .select("terrain_class")
            .eq("turbine_id", str(turbine_id))
            .execute()
        )
        model = t.data[0].get("model") if t.data else None
        terrain_class = s.data[0].get("terrain_class") if s.data else None
        supabase.table("model_review_flags").insert({
            "inspection_id": str(inspection_id),
            "turbine_id": str(turbine_id),
            "terrain_class": terrain_class,
            "turbine_model": model,
            "prediction_match": inspection.get("prediction_match"),
        }).execute()
    except Exception:
        pass  # Don't fail the request if flag insert fails


def _notify_inspection_submitted(inspection_id: UUID, inspection: dict) -> None:
    """P1: Call optional webhook so asset manager can be notified."""
    webhook = os.getenv("INSPECTION_SUBMITTED_WEBHOOK_URL")
    if not webhook:
        return
    try:
        httpx.post(
            webhook,
            json={
                "event": "inspection_submitted",
                "inspection_id": str(inspection_id),
                "turbine_id": str(inspection.get("turbine_id")),
                "inspector_name": inspection.get("inspector_name"),
                "submitted_at": inspection.get("submitted_at"),
            },
            timeout=5.0,
        )
    except Exception:
        pass  # Don't fail the request if webhook fails


@router.get("/{inspection_id}/repair-recommendation", response_model=Optional[RepairRecommendation])
def get_repair_recommendation(inspection_id: UUID):
    """P2: Get repair recommendation for this inspection (if set)."""
    supabase = get_supabase()
    r = (
        supabase.table("inspection_repair_recommendations")
        .select("*")
        .eq("inspection_id", str(inspection_id))
        .execute()
    )
    if not r.data or len(r.data) == 0:
        return None
    return r.data[0]


@router.put("/{inspection_id}/repair-recommendation", response_model=RepairRecommendation)
def set_repair_recommendation(inspection_id: UUID, body: RepairRecommendationUpdate):
    """P2: Set or update repair recommendation and cost for this inspection."""
    supabase = get_supabase()
    insp = supabase.table("inspections").select("id").eq("id", str(inspection_id)).execute()
    if not insp.data or len(insp.data) == 0:
        raise HTTPException(status_code=404, detail="Inspection not found")
    row = {
        "inspection_id": str(inspection_id),
        "recommended_action": body.recommended_action,
        "estimated_cost_low": body.estimated_cost_low,
        "estimated_cost_high": body.estimated_cost_high,
    }
    row = {k: v for k, v in row.items() if v is not None}
    existing = (
        supabase.table("inspection_repair_recommendations")
        .select("id")
        .eq("inspection_id", str(inspection_id))
        .execute()
    )
    if existing.data and len(existing.data) > 0:
        result = (
            supabase.table("inspection_repair_recommendations")
            .update(row)
            .eq("inspection_id", str(inspection_id))
            .execute()
        )
    else:
        result = supabase.table("inspection_repair_recommendations").insert(row).execute()
    if not result.data or len(result.data) == 0:
        raise HTTPException(status_code=500, detail="Failed to save repair recommendation")
    return result.data[0]


@router.get("/{inspection_id}/repair-completions", response_model=List[RepairCompletion])
def list_repair_completions(inspection_id: UUID):
    """P2: List repair completions for this inspection (track when recommended repair was done)."""
    supabase = get_supabase()
    insp = supabase.table("inspections").select("id").eq("id", str(inspection_id)).execute()
    if not insp.data or len(insp.data) == 0:
        raise HTTPException(status_code=404, detail="Inspection not found")
    result = (
        supabase.table("repair_completions")
        .select("*")
        .eq("inspection_id", str(inspection_id))
        .order("completed_at", desc=True)
        .execute()
    )
    return result.data or []


@router.post("/{inspection_id}/repair-completions", response_model=RepairCompletion)
def create_repair_completion(inspection_id: UUID, body: RepairCompletionCreate):
    """P2: Log that the recommended repair for this inspection was completed."""
    supabase = get_supabase()
    insp = supabase.table("inspections").select("id").eq("id", str(inspection_id)).execute()
    if not insp.data or len(insp.data) == 0:
        raise HTTPException(status_code=404, detail="Inspection not found")
    row = {"inspection_id": str(inspection_id), "notes": body.notes}
    if body.completed_at is not None:
        row["completed_at"] = body.completed_at.isoformat().replace("+00:00", "Z")
    result = supabase.table("repair_completions").insert(row).execute()
    if not result.data or len(result.data) == 0:
        raise HTTPException(status_code=500, detail="Failed to create repair completion")
    return result.data[0]


@router.post("/{inspection_id}/attachment", response_model=Inspection)
async def upload_inspection_attachment(inspection_id: UUID, file: UploadFile = File(...)):
    """P1: Upload a photo/file for this inspection. Stored in Supabase Storage; attachment_url updated."""
    supabase = get_supabase()
    result = (
        supabase.table("inspections")
        .select("id, turbine_id")
        .eq("id", str(inspection_id))
        .execute()
    )
    if not result.data or len(result.data) == 0:
        raise HTTPException(status_code=404, detail="Inspection not found")
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:  # 10 MB
        raise HTTPException(status_code=400, detail="File too large (max 10 MB)")
    bucket = "inspection-attachments"
    path = f"{inspection_id}/{file.filename or 'attachment'}"
    try:
        supabase.storage.from_(bucket).upload(path, content, file_options={"content-type": file.content_type or "application/octet-stream"})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
    try:
        public = supabase.storage.from_(bucket).get_public_url(path)
    except Exception:
        public = f"{SUPABASE_URL or ''}/storage/v1/object/public/{bucket}/{path}"
    update_result = (
        supabase.table("inspections")
        .update({"attachment_url": public})
        .eq("id", str(inspection_id))
        .execute()
    )
    if not update_result.data or len(update_result.data) == 0:
        raise HTTPException(status_code=500, detail="Failed to update inspection")
    return _normalize_row(dict(update_result.data[0]))
