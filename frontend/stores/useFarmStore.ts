import { create } from "zustand";
import type { Turbine, TerrainClass } from "@/lib/types";
import { getTurbines, ApiError } from "@/lib/api";

interface FarmState {
  turbines: Turbine[];
  isLoading: boolean;
  error: string | null;
  selectedTurbineId: string | null;
  terrainFilter: TerrainClass[] | null;
  mapTheme: "light" | "dark";

  fetchTurbines: () => Promise<void>;
  setSelectedTurbine: (id: string | null) => void;
  setTerrainFilter: (classes: TerrainClass[] | null) => void;
  toggleTerrainFilter: (terrainClass: TerrainClass) => void;
  setMapTheme: (theme: "light" | "dark") => void;
  toggleMapTheme: () => void;
  getFilteredTurbines: () => Turbine[];
}

export const useFarmStore = create<FarmState>((set, get) => ({
  turbines: [],
  isLoading: false,
  error: null,
  selectedTurbineId: null,
  terrainFilter: null,
  mapTheme: "light",

  fetchTurbines: async () => {
    set({ isLoading: true, error: null });
    try {
      const turbines = await getTurbines();
      set({ turbines, isLoading: false });
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Failed to load turbine data. Please try again.";
      set({ error: message, isLoading: false });
    }
  },

  setSelectedTurbine: (id) => {
    set({ selectedTurbineId: id });
  },

  setTerrainFilter: (classes) => {
    set({ terrainFilter: classes });
  },

  setMapTheme: (theme) => {
    set({ mapTheme: theme });
  },

  toggleMapTheme: () => {
    const current = get().mapTheme;
    set({ mapTheme: current === "light" ? "dark" : "light" });
  },

  toggleTerrainFilter: (terrainClass) => {
    const current = get().terrainFilter;

    if (current === null) {
      set({ terrainFilter: [terrainClass] });
      return;
    }

    const isActive = current.includes(terrainClass);

    if (isActive) {
      const next = current.filter((c) => c !== terrainClass);
      set({ terrainFilter: next.length === 0 ? null : next });
    } else {
      set({ terrainFilter: [...current, terrainClass] });
    }
  },

  getFilteredTurbines: () => {
    const { turbines, terrainFilter } = get();
    if (terrainFilter === null) return turbines;
    return turbines.filter((t) => terrainFilter.includes(t.terrain_class));
  },
}));
