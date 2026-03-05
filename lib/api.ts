import { API_BASE_URL, DEFAULT_PAGE_SIZE, USE_BACKEND_API } from "./constants";
import { supabase } from "./supabase";
import type { Turbine, TerrainClass } from "./types";

/** True when running in the browser on a non-localhost origin (e.g. Vercel). */
function isProductionBrowser(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return !window.location.origin.includes("localhost");
  } catch {
    return false;
  }
}

const SUPABASE_CONFIG_MSG =
  "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel → Settings → Environment Variables, then redeploy.";

// ── API Error ──

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function fetchApi<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`);

  if (!response.ok) {
    throw new ApiError(
      `API request failed: ${response.statusText}`,
      response.status
    );
  }

  return response.json() as Promise<T>;
}

async function getTurbinesFromSupabase(
  limit: number = DEFAULT_PAGE_SIZE,
  offset: number = 0
): Promise<Turbine[]> {
  if (!supabase) {
    throw new ApiError(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      500
    );
  }

  const { data: rows, error: turbinesError } = await supabase
    .from("turbines")
    .select(
      "id, case_id, latitude, longitude, model, manufacturer, capacity_kw, year_operational, calendar_age_years, project_name, state, county, fleet_id"
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (turbinesError) throw new ApiError(turbinesError.message, 500);
  if (!rows?.length) return [];

  const ids = rows.map((r: { id: string }) => r.id);
  const { data: stressRows } = await supabase
    .from("stress_calculations")
    .select("turbine_id, true_age_years, terrain_class, stress_multiplier")
    .in("turbine_id", ids);

  const stressByTurbine: Record<
    string,
    { true_age_years: number; terrain_class: string; stress_multiplier: number }
  > = {};
  for (const s of stressRows ?? []) {
    stressByTurbine[s.turbine_id] = {
      true_age_years: s.true_age_years ?? 0,
      terrain_class: s.terrain_class ?? "flat",
      stress_multiplier: s.stress_multiplier ?? 1,
    };
  }

  return rows.map((t: Record<string, unknown>) => {
    const stress = stressByTurbine[t.id as string];
    return {
      id: t.id as string,
      case_id: (t.case_id as number) ?? 0,
      latitude: (t.latitude as number) ?? 0,
      longitude: (t.longitude as number) ?? 0,
      model: (t.model as string) ?? "",
      manufacturer: (t.manufacturer as string) ?? "",
      capacity_kw: (t.capacity_kw as number) ?? 0,
      year_operational: (t.year_operational as number) ?? 0,
      calendar_age_years: (t.calendar_age_years as number) ?? 0,
      true_age_years: stress?.true_age_years ?? 0,
      stress_multiplier: stress?.stress_multiplier ?? 1,
      terrain_class: (stress?.terrain_class ?? "flat") as TerrainClass,
      project_name: (t.project_name as string) ?? "",
      state: (t.state as string) ?? "",
      county: t.county as string | undefined,
      fleet_id: t.fleet_id as string | null | undefined,
    } satisfies Turbine;
  });
}

function rowToTurbine(
  t: Record<string, unknown>,
  stress: { true_age_years: number; terrain_class: string; stress_multiplier: number } | undefined
): Turbine {
  return {
    id: t.id as string,
    case_id: (t.case_id as number) ?? 0,
    latitude: (t.latitude as number) ?? 0,
    longitude: (t.longitude as number) ?? 0,
    model: (t.model as string) ?? "",
    manufacturer: (t.manufacturer as string) ?? "",
    capacity_kw: (t.capacity_kw as number) ?? 0,
    year_operational: (t.year_operational as number) ?? 0,
    calendar_age_years: (t.calendar_age_years as number) ?? 0,
    true_age_years: stress?.true_age_years ?? 0,
    stress_multiplier: stress?.stress_multiplier ?? 1,
    terrain_class: (stress?.terrain_class ?? "flat") as TerrainClass,
    project_name: (t.project_name as string) ?? "",
    state: (t.state as string) ?? "",
    county: t.county as string | undefined,
    fleet_id: t.fleet_id as string | null | undefined,
  };
}

async function getTurbineByIdFromSupabase(turbineId: string): Promise<Turbine | null> {
  if (!supabase) return null;
  const { data: row, error } = await supabase
    .from("turbines")
    .select("id, case_id, latitude, longitude, model, manufacturer, capacity_kw, year_operational, calendar_age_years, project_name, state, county, fleet_id")
    .eq("id", turbineId)
    .single();
  if (error || !row) return null;
  const { data: stressRow } = await supabase
    .from("stress_calculations")
    .select("true_age_years, terrain_class, stress_multiplier")
    .eq("turbine_id", turbineId)
    .maybeSingle();
  const stress = stressRow
    ? { true_age_years: stressRow.true_age_years ?? 0, terrain_class: stressRow.terrain_class ?? "flat", stress_multiplier: stressRow.stress_multiplier ?? 1 }
    : undefined;
  return rowToTurbine(row as Record<string, unknown>, stress);
}

async function getFleetTurbinesFromSupabase(
  fleetId: string,
  sort: string
): Promise<Turbine[]> {
  if (!supabase) {
    throw new ApiError(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      500
    );
  }
  const { data: rows, error } = await supabase
    .from("turbines")
    .select("id, case_id, latitude, longitude, model, manufacturer, capacity_kw, year_operational, calendar_age_years, project_name, state, county, fleet_id")
    .eq("fleet_id", fleetId)
    .order("created_at", { ascending: false });
  if (error) throw new ApiError(error.message, 500);
  if (!rows?.length) return [];
  const ids = rows.map((r: { id: string }) => r.id);
  const { data: stressRows } = await supabase
    .from("stress_calculations")
    .select("turbine_id, true_age_years, terrain_class, stress_multiplier")
    .in("turbine_id", ids);
  const stressByTurbine: Record<string, { true_age_years: number; terrain_class: string; stress_multiplier: number }> = {};
  for (const s of stressRows ?? []) {
    stressByTurbine[s.turbine_id] = {
      true_age_years: s.true_age_years ?? 0,
      terrain_class: s.terrain_class ?? "flat",
      stress_multiplier: s.stress_multiplier ?? 1,
    };
  }
  const turbines = rows.map((t: Record<string, unknown>) =>
    rowToTurbine(t, stressByTurbine[t.id as string])
  );
  if (sort === "stress") {
    turbines.sort((a, b) => b.true_age_years - a.true_age_years);
  }
  return turbines;
}

// ── Turbine Endpoints ──

export async function getTurbines(
  limit: number = DEFAULT_PAGE_SIZE,
  offset: number = 0
): Promise<Turbine[]> {
  if (USE_BACKEND_API) {
    return fetchApi<Turbine[]>(
      `/turbines?limit=${limit}&offset=${offset}`
    );
  }
  if (supabase) {
    return getTurbinesFromSupabase(limit, offset);
  }
  // Production (e.g. Vercel) must not call localhost
  if (isProductionBrowser()) {
    throw new ApiError(SUPABASE_CONFIG_MSG, 500);
  }
  return fetchApi<Turbine[]>(
    `/turbines?limit=${limit}&offset=${offset}`
  );
}

export async function getFleetTurbines(
  fleetId: string,
  sort: string = "stress"
): Promise<Turbine[]> {
  if (!USE_BACKEND_API && supabase) {
    return getFleetTurbinesFromSupabase(fleetId, sort);
  }
  if (isProductionBrowser()) {
    throw new ApiError(SUPABASE_CONFIG_MSG, 500);
  }
  return fetchApi<Turbine[]>(
    `/fleets/${fleetId}/turbines?sort=${sort}`
  );
}

export async function getTurbineById(
  turbineId: string
): Promise<Turbine | null> {
  if (!USE_BACKEND_API && supabase) {
    return getTurbineByIdFromSupabase(turbineId);
  }
  if (isProductionBrowser()) {
    throw new ApiError(SUPABASE_CONFIG_MSG, 500);
  }
  try {
    return await fetchApi<Turbine>(`/turbines/${turbineId}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}
