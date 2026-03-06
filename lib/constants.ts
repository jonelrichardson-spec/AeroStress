import type { TerrainClass } from "./types";

// ── Terrain Configuration ──
// Locked — do not change colors or labels without team approval.

export const TERRAIN_CONFIG: Record<
  TerrainClass,
  {
    label: string;
    multiplier: number;
    color: string;
    risk: string;
  }
> = {
  flat: {
    label: "Flat (IEC Class C)",
    multiplier: 1.0,
    color: "#52b788",
    risk: "Standard",
  },
  moderate: {
    label: "Moderate (IEC Class B)",
    multiplier: 1.3,
    color: "#f4a261",
    risk: "Elevated",
  },
  complex: {
    label: "Complex / Ridge (IEC Class A)",
    multiplier: 1.85,
    color: "#e85d3a",
    risk: "High",
  },
  coastal: {
    label: "Coastal",
    multiplier: 1.5,
    color: "#48cae4",
    risk: "Elevated",
  },
} as const;

export const SCADA_COLOR = "#7b72e9";

// ── Stress Thresholds ──
export const STRESS_THRESHOLDS = {
  LOW: 1.0,
  ELEVATED: 1.3,
  HIGH: 1.5,
  CRITICAL: 1.85,
} as const;

// ── Map Defaults ──
export const MAP_DEFAULTS = {
  CENTER: [-98.5, 39.8] as [number, number],
  ZOOM: 4,
  STYLE: "mapbox://styles/mapbox/standard",
  COLOR_THEME: "default",
  LIGHT_PRESET: "night",
} as const;

// ── API ──
// Supabase-only: do not set NEXT_PUBLIC_API_BASE_URL. All features (turbines, inspections, stress, predictions) use Supabase.
const _apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
// Only use backend URL if set and not localhost (production must not call localhost)
export const API_BASE_URL =
  _apiBaseUrl && !_apiBaseUrl.startsWith("http://localhost")
    ? _apiBaseUrl
    : "http://localhost:8000";
/** When true, frontend uses the FastAPI backend. When false, app runs in Supabase-only mode. */
export const USE_BACKEND_API = Boolean(
  _apiBaseUrl && !_apiBaseUrl.startsWith("http://localhost")
);

// ── Critical Action Report ──
export const CRITICAL_ACTION_PERCENTILE = 0.05;

// ── Unit Conversion ──
export const KW_TO_MW_DIVISOR = 1000;

// ── Pagination ──
export const DEFAULT_PAGE_SIZE = 500;
