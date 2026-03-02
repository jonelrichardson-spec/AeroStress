// /lib/types.ts — CONFIRMED matches Pape's API response shape

export interface Turbine {
  id: string;
  case_id: number;
  latitude: number;
  longitude: number;
  model: string;
  manufacturer: string;
  capacity_kw: number;
  year_operational: number;
  calendar_age_years: number;
  true_age_years: number;
  terrain_class: TerrainClass;
  project_name: string;
  state: string;
  county?: string;
  fleet_id?: string | null;
}

export type TerrainClass = "flat" | "moderate" | "complex" | "coastal";

export interface Fleet {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  turbines?: Turbine[];
}

// NOT YET — draft for when Pape builds inspections
export interface Inspection {
  id: string;
  turbine_id: string;
  technician_id: string;
  prediction: string;
  finding: string;
  match_status: "confirmed" | "partial" | "not_found";
  severity: number;
  notes: string;
  photos: string[];
  completed_at: string;
  synced: boolean;
}

// NOT YET — draft for when Pape builds auth
export interface UserProfile {
  id: string;
  full_name: string;
  role: "asset_manager" | "technician";
  fleet_id: string;
}
