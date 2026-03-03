from uuid import UUID

from fastapi import APIRouter, HTTPException

from app.db import get_supabase
from app.models.schemas import Fleet, FleetCreate

router = APIRouter(prefix="/fleets", tags=["fleets"])


@router.post("", response_model=Fleet)
def create_fleet(body: FleetCreate):
    supabase = get_supabase()
    result = (
        supabase.table("fleets")
        .insert({"name": body.name})
        .execute()
    )
    if not result.data or len(result.data) == 0:
        raise HTTPException(status_code=500, detail="Failed to create fleet")
    row = dict(result.data[0])
    # Normalize: some DB schemas omit updated_at
    if row.get("updated_at") is None and row.get("created_at") is not None:
        row["updated_at"] = row["created_at"]
    return row


@router.get("/{fleet_id}", response_model=Fleet)
def get_fleet(fleet_id: UUID):
    supabase = get_supabase()
    result = (
        supabase.table("fleets")
        .select("*")
        .eq("id", str(fleet_id))
        .execute()
    )
    if not result.data or len(result.data) == 0:
        raise HTTPException(status_code=404, detail="Fleet not found")
    row = dict(result.data[0])
    if row.get("updated_at") is None and row.get("created_at") is not None:
        row["updated_at"] = row["created_at"]
    return row
