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
    return result.data[0]


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
    return result.data[0]
