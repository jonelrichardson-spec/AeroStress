"""
GET /profile — current user's profile (role, fleet).
PATCH /profile — update profile (requires auth).
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from app.auth import require_current_user_id
from app.db import get_supabase
from app.models.schemas import Profile, ProfileUpdate

router = APIRouter(prefix="/profile", tags=["profile"])


def _normalize_row(row: dict) -> dict:
    if row.get("updated_at") is None and row.get("created_at") is not None:
        row = {**row, "updated_at": row["created_at"]}
    return row


@router.get("", response_model=Profile)
def get_my_profile(user_id: str = Depends(require_current_user_id)):
    """
    Return current user's profile. If none exists, create one with role=asset_manager.
    Requires Bearer token (Supabase Auth JWT).
    """
    supabase = get_supabase()
    result = (
        supabase.table("profiles")
        .select("*")
        .eq("user_id", user_id)
        .execute()
    )
    if result.data and len(result.data) > 0:
        return _normalize_row(dict(result.data[0]))
    # Create default profile for new user
    insert_result = (
        supabase.table("profiles")
        .insert({"user_id": user_id, "role": "asset_manager"})
        .execute()
    )
    if not insert_result.data or len(insert_result.data) == 0:
        raise HTTPException(status_code=500, detail="Failed to create profile")
    return _normalize_row(dict(insert_result.data[0]))


@router.patch("", response_model=Profile)
def update_my_profile(
    body: ProfileUpdate,
    user_id: str = Depends(require_current_user_id),
):
    """Update current user's profile (role, fleet_id). Requires auth."""
    supabase = get_supabase()
    result = (
        supabase.table("profiles")
        .select("*")
        .eq("user_id", user_id)
        .execute()
    )
    if not result.data or len(result.data) == 0:
        raise HTTPException(status_code=404, detail="Profile not found")
    profile_id = result.data[0]["id"]
    updates = {}
    if body.role is not None:
        updates["role"] = body.role
    if body.fleet_id is not None:
        updates["fleet_id"] = str(body.fleet_id)
    if not updates:
        return _normalize_row(dict(result.data[0]))
    update_result = (
        supabase.table("profiles")
        .update(updates)
        .eq("id", str(profile_id))
        .execute()
    )
    if not update_result.data or len(update_result.data) == 0:
        raise HTTPException(status_code=500, detail="Failed to update profile")
    return _normalize_row(dict(update_result.data[0]))
