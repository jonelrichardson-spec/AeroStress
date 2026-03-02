import { create } from "zustand";
import type { Turbine } from "@/lib/types";
import { getTurbines } from "@/lib/api";
import { ApiError } from "@/lib/api";

interface FarmState {
  turbines: Turbine[];
  isLoading: boolean;
  error: string | null;
  fetchTurbines: () => Promise<void>;
}

export const useFarmStore = create<FarmState>((set) => ({
  turbines: [],
  isLoading: false,
  error: null,

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
}));
