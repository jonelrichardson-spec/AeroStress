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
  stress_multiplier: number;
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

// ✅ BUILT — Inspection interface from Pape's P1 push
export interface Inspection {
  id: string;
  turbine_id: string;
  conducted_at: string | null;
  inspector_name: string | null;
  status: "draft" | "pending" | "completed" | "cancelled";
  component_inspected: string | null;
  condition_found: string | null;
  severity_rating: number | null;
  notes: string | null;
  submitted_at: string | null;
  prediction_match: boolean | null;
  attachment_url: string | null;
  created_at: string;
  updated_at: string;
}

// ✅ BUILT — UserProfile interface from Pape's P1 push
export interface UserProfile {
  id: string;
  user_id: string; // Supabase auth.users.id
  role: "asset_manager" | "technician";
  fleet_id: string | null;
  created_at: string;
  updated_at: string;
}

// Stress explanation response
export interface StressExplanation {
  explanation: string;
}

// Failure prediction response
export interface FailurePrediction {
  component: string;
  condition: string;
}

export interface FailurePredictionsResponse {
  predictions: FailurePrediction[];
}

// Fleet projected savings response
export interface ProjectedSavings {
  fleet_id: string;
  annual_om_per_turbine: number;
  total_turbines: number;
  high_risk_turbines_top_20pct: number;
  recommended_reallocation_percent: number;
  message: string;
}
