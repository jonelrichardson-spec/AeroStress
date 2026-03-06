/**
 * Client-side stress explanation and failure predictions from turbine data.
 * Mirrors backend logic so Supabase-only deployments can show these without the FastAPI API.
 */

import type { TerrainClass } from "./types";

const TERRAIN_LABELS: Record<string, string> = {
  flat: "IEC Class C (flat terrain)",
  moderate: "IEC Class B (moderate turbulence)",
  complex: "IEC Class A (complex/high turbulence)",
  coastal: "coastal/marine conditions",
};

export function getStressExplanationFromTurbine(
  trueAgeYears: number,
  calendarAgeYears: number,
  terrainClass: TerrainClass | string | undefined
): string {
  const terrainLabel = TERRAIN_LABELS[terrainClass ?? "flat"] ?? "unknown terrain";
  const trueInt = Math.round(trueAgeYears);
  const calInt = Math.round(calendarAgeYears);
  if (trueInt <= 0) {
    return `This turbine is in ${terrainLabel}. True Age is not yet calculated.`;
  }
  return (
    `This turbine has the structural wear of a ${trueInt}-year-old unit ` +
    `and is operating in ${terrainLabel}.`
  );
}

// Rules: (terrain_classes, min_true_age_years, message) — same as backend
const FAILURE_RULES: Array<{
  classes: string[] | null;
  minAge: number;
  message: string;
  severity: 1 | 2 | 3;
}> = [
  { classes: ["complex", "coastal"], minAge: 10, message: "Check main bearing for pitting and wear.", severity: 2 },
  { classes: ["complex", "coastal"], minAge: 12, message: "Look for leading-edge erosion on blades.", severity: 2 },
  { classes: ["moderate", "complex", "coastal"], minAge: 15, message: "Inspect tower base and bolted connections for fatigue.", severity: 2 },
  { classes: ["complex"], minAge: 8, message: "High turbulence: verify pitch and yaw system response.", severity: 2 },
  { classes: null, minAge: 18, message: "Aging asset: recommend full structural and electrical inspection.", severity: 3 },
];

export interface FailurePredictionItem {
  component: string;
  probability: number;
  severity: 1 | 2 | 3;
}

export function getFailurePredictionsFromTurbine(
  terrainClass: TerrainClass | string | undefined,
  trueAgeYears: number,
  _calendarAgeYears: number
): FailurePredictionItem[] {
  const age = trueAgeYears ?? 0;
  const terrain = (terrainClass ?? "flat") as string;
  const predictions: FailurePredictionItem[] = [];
  for (const rule of FAILURE_RULES) {
    if (age < rule.minAge) continue;
    if (rule.classes !== null && !rule.classes.includes(terrain)) continue;
    predictions.push({
      component: rule.message,
      probability: 0.85,
      severity: rule.severity,
    });
  }
  return predictions;
}
