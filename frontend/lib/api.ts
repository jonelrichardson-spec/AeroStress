import { API_BASE_URL, DEFAULT_PAGE_SIZE } from "./constants";
import type { Turbine } from "./types";

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

// ── Turbine Endpoints ──

export async function getTurbines(
  limit: number = DEFAULT_PAGE_SIZE,
  offset: number = 0
): Promise<Turbine[]> {
  return fetchApi<Turbine[]>(
    `/turbines?limit=${limit}&offset=${offset}`
  );
}

export async function getFleetTurbines(
  fleetId: string,
  sort: string = "stress"
): Promise<Turbine[]> {
  return fetchApi<Turbine[]>(
    `/fleets/${fleetId}/turbines?sort=${sort}`
  );
}
