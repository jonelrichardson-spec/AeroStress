import { API_BASE_URL, DEFAULT_PAGE_SIZE } from "./constants";
import type {
  Turbine,
  Inspection,
  UserProfile,
  StressExplanation,
  FailurePredictionsResponse,
  ProjectedSavings,
} from "./types";

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

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

  if (!response.ok) {
    throw new ApiError(
      `API request failed: ${response.statusText}`,
      response.status
    );
  }

  return response.json() as Promise<T>;
}

// ── Turbine Endpoints ──

export async function getTurbines(
  limit: number = DEFAULT_PAGE_SIZE,
  offset: number = 0
): Promise<Turbine[]> {
  return fetchApi<Turbine[]>(`/turbines?limit=${limit}&offset=${offset}`);
}

export async function getFleetTurbines(
  fleetId: string,
  sort: string = "stress"
): Promise<Turbine[]> {
  return fetchApi<Turbine[]>(`/fleets/${fleetId}/turbines?sort=${sort}`);
}

export async function getTurbineById(
  turbineId: string
): Promise<Turbine | null> {
  try {
    return await fetchApi<Turbine>(`/turbines/${turbineId}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function getStressExplanation(
  turbineId: string
): Promise<StressExplanation | null> {
  try {
    return await fetchApi<StressExplanation>(
      `/turbines/${turbineId}/stress-explanation`
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function getFailurePredictions(
  turbineId: string
): Promise<FailurePredictionsResponse | null> {
  try {
    return await fetchApi<FailurePredictionsResponse>(
      `/turbines/${turbineId}/failure-predictions`
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function getTurbineInspections(
  turbineId: string
): Promise<Inspection[]> {
  try {
    return await fetchApi<Inspection[]>(`/turbines/${turbineId}/inspections`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return [];
    }
    throw error;
  }
}

// ── Inspection Endpoints ──

export async function createInspection(
  turbineId: string,
  data: {
    conducted_at?: string;
    inspector_name?: string;
    component_inspected?: string;
    condition_found?: string;
    severity_rating?: number;
    notes?: string;
  }
): Promise<Inspection> {
  return fetchApi<Inspection>(`/turbines/${turbineId}/inspections`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function getInspectionById(
  inspectionId: string
): Promise<Inspection | null> {
  try {
    return await fetchApi<Inspection>(`/inspections/${inspectionId}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function updateInspection(
  inspectionId: string,
  data: {
    status?: "draft" | "pending" | "completed" | "cancelled";
    component_inspected?: string;
    condition_found?: string;
    severity_rating?: number;
    notes?: string;
    prediction_match?: boolean;
    attachment_url?: string;
  }
): Promise<Inspection> {
  return fetchApi<Inspection>(`/inspections/${inspectionId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function uploadInspectionAttachment(
  inspectionId: string,
  file: File
): Promise<Inspection> {
  const formData = new FormData();
  formData.append("file", file);

  return fetchApi<Inspection>(`/inspections/${inspectionId}/attachment`, {
    method: "POST",
    body: formData,
  });
}

export function getInspectionReportUrl(inspectionId: string): string {
  return `${API_BASE_URL}/inspections/${inspectionId}/report`;
}

// ── Fleet Endpoints ──

export async function getProjectedSavings(
  fleetId: string,
  annualOmPerTurbine: number = 50000
): Promise<ProjectedSavings | null> {
  try {
    return await fetchApi<ProjectedSavings>(
      `/fleets/${fleetId}/projected-savings?annual_om_per_turbine=${annualOmPerTurbine}`
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

// ── Profile Endpoints ──
// Note: These require Bearer token from Supabase Auth

export async function getProfile(token: string): Promise<UserProfile | null> {
  try {
    return await fetchApi<UserProfile>(`/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function updateProfile(
  token: string,
  data: {
    role?: "asset_manager" | "technician";
    fleet_id?: string | null;
  }
): Promise<UserProfile> {
  return fetchApi<UserProfile>(`/profile`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}
