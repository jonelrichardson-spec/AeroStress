import type { Turbine } from "./types";
import { TERRAIN_CONFIG } from "./constants";
import type { TerrainClass } from "./types";

// ── GeoJSON Conversion ──
// API returns plain JSON — we convert to GeoJSON for Mapbox layers.

export interface TurbineFeatureProperties {
  id: string;
  case_id: number;
  project_name: string;
  state: string;
  terrain_class: TerrainClass;
  true_age_years: number;
  calendar_age_years: number;
  capacity_kw: number;
  manufacturer: string;
  model: string;
  stress_multiplier: number;
  color: string;
}

export type TurbineFeature = GeoJSON.Feature<
  GeoJSON.Point,
  TurbineFeatureProperties
>;

export type TurbineFeatureCollection = GeoJSON.FeatureCollection<
  GeoJSON.Point,
  TurbineFeatureProperties
>;

export function turbinesToGeoJSON(
  turbines: Turbine[]
): TurbineFeatureCollection {
  return {
    type: "FeatureCollection",
    features: turbines.map((t) => ({
      type: "Feature",
      id: t.id,
      geometry: {
        type: "Point",
        coordinates: [t.longitude, t.latitude],
      },
      properties: {
        id: t.id,
        case_id: t.case_id,
        project_name: t.project_name,
        state: t.state,
        terrain_class: t.terrain_class,
        true_age_years: t.true_age_years,
        calendar_age_years: t.calendar_age_years,
        capacity_kw: t.capacity_kw,
        manufacturer: t.manufacturer,
        model: t.model,
        stress_multiplier:
          TERRAIN_CONFIG[t.terrain_class]?.multiplier ?? 1.0,
        color: TERRAIN_CONFIG[t.terrain_class]?.color ?? "#ffffff",
      },
    })),
  };
}

// ── Layer Paint Expressions ──

export const TERRAIN_COLOR_EXPRESSION: mapboxgl.Expression = [
  "match",
  ["get", "terrain_class"],
  "flat",
  TERRAIN_CONFIG.flat.color,
  "moderate",
  TERRAIN_CONFIG.moderate.color,
  "complex",
  TERRAIN_CONFIG.complex.color,
  "coastal",
  TERRAIN_CONFIG.coastal.color,
  "#ffffff",
];

// Circle radius scales with stress multiplier: higher stress = larger dot
export const STRESS_RADIUS_EXPRESSION: mapboxgl.Expression = [
  "interpolate",
  ["linear"],
  ["get", "stress_multiplier"],
  1.0,
  5,
  1.3,
  7,
  1.5,
  9,
  1.85,
  12,
];
