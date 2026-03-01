from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


# --- Fleets ---
class FleetCreate(BaseModel):
    name: str = Field(..., min_length=1)


class Fleet(BaseModel):
    id: UUID
    name: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# --- Turbines ---
class TurbineCreate(BaseModel):
    identifier: Optional[str] = None
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    model: Optional[str] = None
    calendar_age_years: float = Field(..., gt=0, le=50)


class Turbine(BaseModel):
    id: UUID
    fleet_id: UUID
    identifier: Optional[str]
    latitude: float
    longitude: float
    model: Optional[str]
    calendar_age_years: float
    terrain_class: Optional[str]
    stress_multiplier: Optional[float]
    true_age_years: Optional[float]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# --- GET /turbines response (with coordinates for map/dashboard) ---
class TurbineListItem(BaseModel):
    id: UUID
    case_id: Optional[int]
    latitude: float
    longitude: float
    model: Optional[str]
    manufacturer: Optional[str]
    capacity_kw: Optional[int]
    year_operational: Optional[int]
    calendar_age_years: float
    true_age_years: Optional[float]
    terrain_class: Optional[str]
    project_name: Optional[str]
    state: Optional[str]

    class Config:
        from_attributes = True
