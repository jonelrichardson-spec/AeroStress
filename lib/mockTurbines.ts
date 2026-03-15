/**
 * Mock turbine data (500 turbines) for when Supabase is paused or unavailable.
 * Generated deterministically so the bundle stays small.
 */

import type { Turbine, TerrainClass } from "./types";
import { TERRAIN_CONFIG } from "./constants";

const TERRAIN_CLASSES: TerrainClass[] = ["flat", "moderate", "complex", "coastal"];
const MODELS = ["GE 1.5sl", "GE 1.85-87", "Vestas V82", "Vestas V90", "Siemens 2.3", "Gamesa G87", "Nordex N90", "Suzlon S88"];
const MANUFACTURERS = ["GE Wind", "Vestas", "Siemens Gamesa", "Nordex", "Suzlon"];
const STATES = ["TX", "IA", "OK", "KS", "CA", "OR", "WA", "MN", "IL", "CO", "ND", "WY", "NM", "MT"];
const PROJECT_PREFIXES = ["Wind Farm", "Wind Project", "Wind Energy", "Renewable", "Prairie", "High Plains", "Mountain"];

function seeded(seed: number): number {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

function generateMockTurbines(): Turbine[] {
  const out: Turbine[] = [];
  const currentYear = 2025;
  for (let i = 0; i < 500; i++) {
    const terrainClass = TERRAIN_CLASSES[i % TERRAIN_CLASSES.length] as TerrainClass;
    const config = TERRAIN_CONFIG[terrainClass];
    const multiplier = config.multiplier;
    const yearOperational = 2000 + Math.floor(seeded(i * 7) * 21);
    const calendarAgeYears = currentYear - yearOperational;
    const trueAgeYears = Math.round(calendarAgeYears * multiplier * 10) / 10;
    const lat = 25 + seeded(i * 11) * 24;
    const lng = -125 + seeded(i * 13) * 59;
    const state = STATES[Math.floor(seeded(i * 17) * STATES.length)];
    const projectName = `${PROJECT_PREFIXES[i % PROJECT_PREFIXES.length]} ${state} ${(i % 20) + 1}`;
    out.push({
      id: `mock-turbine-${i + 1}`,
      case_id: 3000000 + i,
      latitude: lat,
      longitude: lng,
      model: MODELS[i % MODELS.length],
      manufacturer: MANUFACTURERS[i % MANUFACTURERS.length],
      capacity_kw: [1500, 1850, 2000, 2300, 2500, 3000][i % 6],
      year_operational: yearOperational,
      calendar_age_years: calendarAgeYears,
      true_age_years: trueAgeYears,
      stress_multiplier: multiplier,
      terrain_class: terrainClass,
      project_name: projectName,
      state,
      county: undefined,
      fleet_id: null,
    });
  }
  return out;
}

let cached: Turbine[] | null = null;

export function getMockTurbines(): Turbine[] {
  if (!cached) cached = generateMockTurbines();
  return cached;
}

export function getMockTurbinesPaginated(limit: number, offset: number): Turbine[] {
  const all = getMockTurbines();
  return all.slice(offset, offset + limit);
}

export function getMockTurbineById(id: string): Turbine | null {
  const all = getMockTurbines();
  return all.find((t) => t.id === id) ?? null;
}
