"""
GET /inspections/{id} - fetch one inspection.
GET /inspections/{id}/report - download inspection report PDF.
PATCH /inspections/{id} - update inspection (e.g. submit report). P1: prediction_match, attachment_url; notifies on submit.
POST /inspections/{id}/attachment - upload photo/file; stores in Supabase Storage and sets attachment_url (P1).
"""

import os
from datetime import datetime, timezone
from uuid import UUID

import httpx
from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import Response

from app.config import SUPABASE_URL
from app.db import get_supabase
from app.models.schemas import Inspection, InspectionUpdate
from app.services.pdf_reports import build_inspection_report_pdf

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
        .select("id, latitude, longitude, model, state")
        .eq("id", str(turbine_id))
        .execute()
    )
    if not t_res.data or len(t_res.data) == 0:
        raise HTTPException(status_code=404, detail="Turbine not found")
    turbine = dict(t_res.data[0])
    s_res = (
        supabase.table("stress_calculations")
        .select("true_age_years, terrain_class")
        .eq("turbine_id", str(turbine_id))
        .execute()
    )
    if s_res.data and len(s_res.data) > 0:
        turbine["true_age_years"] = s_res.data[0].get("true_age_years")
        turbine["terrain_class"] = s_res.data[0].get("terrain_class")
    pdf_buf = build_inspection_report_pdf(inspection, turbine)
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
    return row


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
