"""
P2: Model review flags — when an inspection finding deviates from prediction.
GET /model-review-flags — list flags (optional ?resolved=false).
PATCH /model-review-flags/{id} — resolve a flag (set resolved_at, optional notes).
"""

from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query

from app.db import get_supabase
from app.models.schemas import ModelReviewFlag, ModelReviewFlagResolve

router = APIRouter(prefix="/model-review-flags", tags=["model-review"])


def _normalize_row(row: dict) -> dict:
    if row.get("resolved_at") is None and "resolved_at" in row:
        pass
    return row


@router.get("", response_model=list[ModelReviewFlag])
def list_model_review_flags(resolved: Optional[bool] = Query(None, description="Filter by resolved (true/false); omit for all")):
    """List model review flags. Optional ?resolved=false for open only."""
    supabase = get_supabase()
    q = supabase.table("model_review_flags").select("*").order("created_at", desc=True)
    if resolved is not None:
        if resolved:
            q = q.not_.is_("resolved_at", "null")
        else:
            q = q.is_("resolved_at", "null")
    result = q.execute()
    return [_normalize_row(dict(r)) for r in (result.data or [])]


@router.patch("/{flag_id}", response_model=ModelReviewFlag)
def resolve_model_review_flag(flag_id: UUID, body: ModelReviewFlagResolve):
    """Mark a model review flag as resolved (sets resolved_at, optional notes)."""
    supabase = get_supabase()
    updates = {"resolved_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")}
    if body.notes is not None:
        updates["notes"] = body.notes
    result = (
        supabase.table("model_review_flags")
        .update(updates)
        .eq("id", str(flag_id))
        .execute()
    )
    if not result.data or len(result.data) == 0:
        raise HTTPException(status_code=404, detail="Model review flag not found")
    return _normalize_row(dict(result.data[0]))
