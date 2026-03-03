from datetime import datetime
from typing import List, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field, model_validator


# --- Fleets ---
class FleetCreate(BaseModel):
    name: str = Field(..., min_length=1)


class Fleet(BaseModel):
    id: UUID
    name: str
    created_at: datetime
    updated_at: Optional[datetime] = None  # optional if DB omits it

    class Config:
        from_attributes = True
        extra = "ignore"  # allow operator_name etc. from DB


# --- Turbines ---
class TurbineCreate(BaseModel):
    identifier: Optional[str] = None
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    model: Optional[str] = None
    calendar_age_years: Optional[float] = Field(None, gt=0, le=50)
    year_operational: Optional[int] = Field(None, ge=1990, le=2025)

    @model_validator(mode="after")
    def require_age(self):
        if self.calendar_age_years is None and self.year_operational is None:
            raise ValueError("Provide calendar_age_years or year_operational")
        return self

    def get_calendar_age_years(self) -> float:
        """Resolve calendar age: from year_operational or explicit calendar_age_years."""
        if self.calendar_age_years is not None:
            return self.calendar_age_years
        if self.year_operational is not None:
            return max(0.0, 2025 - self.year_operational)
        raise ValueError("Provide calendar_age_years or year_operational")


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
    stress_multiplier: Optional[float] = None
    project_name: Optional[str]
    state: Optional[str]

    class Config:
        from_attributes = True
        extra = "ignore"


# --- Inspections (P0) ---
class InspectionCreate(BaseModel):
    conducted_at: Optional[datetime] = None  # default now()
    inspector_name: Optional[str] = None
    component_inspected: Optional[str] = None
    condition_found: Optional[str] = None
    severity_rating: Optional[int] = Field(None, ge=1, le=5)
    notes: Optional[str] = None


class InspectionUpdate(BaseModel):
    status: Optional[Literal["draft", "submitted"]] = None
    component_inspected: Optional[str] = None
    condition_found: Optional[str] = None
    severity_rating: Optional[int] = Field(None, ge=1, le=5)
    notes: Optional[str] = None
    prediction_match: Optional[Literal["confirmed", "partial", "not_found"]] = None  # P1
    attachment_url: Optional[str] = None  # P1


class Inspection(BaseModel):
    id: UUID
    turbine_id: UUID
    conducted_at: datetime
    inspector_name: Optional[str] = None
    status: str
    component_inspected: Optional[str] = None
    condition_found: Optional[str] = None
    severity_rating: Optional[int] = None
    notes: Optional[str] = None
    submitted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    prediction_match: Optional[str] = None  # P1: confirmed | partial | not_found
    attachment_url: Optional[str] = None  # P1

    class Config:
        from_attributes = True
        extra = "ignore"


# --- CSV import response ---
class CsvImportResult(BaseModel):
    created: int
    failed: int
    errors: List[str] = []
    turbines: List[TurbineListItem] = []


# --- Profiles (P0: roles) ---
class ProfileUpdate(BaseModel):
    role: Optional[Literal["asset_manager", "technician"]] = None
    fleet_id: Optional[UUID] = None


class Profile(BaseModel):
    id: UUID
    user_id: UUID
    role: str
    fleet_id: Optional[UUID] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        extra = "ignore"
