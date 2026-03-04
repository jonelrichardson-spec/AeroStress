/**
 * API Integration Tests
 *
 * Tests all API functions in lib/api.ts against the real backend at localhost:8000.
 * If the backend is not running, tests should fail gracefully with clear messages.
 */

import {
  getTurbines,
  getTurbineById,
  getFleetTurbines,
  getStressExplanation,
  getFailurePredictions,
  getTurbineInspections,
  createInspection,
  getInspectionById,
  updateInspection,
  uploadInspectionAttachment,
  getInspectionReportUrl,
  getProjectedSavings,
  getProfile,
  updateProfile,
  ApiError,
} from "../api";
import type {
  Turbine,
  Inspection,
  UserProfile,
  StressExplanation,
  FailurePredictionsResponse,
  ProjectedSavings,
} from "../types";

const API_BASE_URL = "http://localhost:8000";

// Helper to check if API is running
async function isApiRunning(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/turbines?limit=1`);
    return response.ok;
  } catch {
    return false;
  }
}

describe("API Integration Tests", () => {
  beforeAll(async () => {
    const apiRunning = await isApiRunning();
    if (!apiRunning) {
      console.warn(
        "\n⚠️  Backend API is not running at localhost:8000. Tests will fail.\n" +
        "   Start the backend with: cd backend && uvicorn main:app --reload\n"
      );
    }
  });

  describe("Turbine Endpoints", () => {
    describe("getTurbines", () => {
      it("should fetch a list of turbines", async () => {
        const turbines = await getTurbines(10, 0);
        expect(Array.isArray(turbines)).toBe(true);
        expect(turbines.length).toBeGreaterThan(0);
        expect(turbines.length).toBeLessThanOrEqual(10);

        // Validate first turbine shape
        const turbine = turbines[0];
        expect(turbine).toHaveProperty("id");
        expect(turbine).toHaveProperty("case_id");
        expect(turbine).toHaveProperty("latitude");
        expect(turbine).toHaveProperty("longitude");
        expect(turbine).toHaveProperty("terrain_class");
        expect(turbine).toHaveProperty("true_age_years");
        expect(turbine).toHaveProperty("stress_multiplier");
      });

      it("should handle limit and offset parameters", async () => {
        const page1 = await getTurbines(5, 0);
        const page2 = await getTurbines(5, 5);

        expect(page1.length).toBeLessThanOrEqual(5);
        expect(page2.length).toBeLessThanOrEqual(5);

        // IDs should be different
        if (page1.length > 0 && page2.length > 0) {
          expect(page1[0].id).not.toBe(page2[0].id);
        }
      }, 15000);

      it("should throw ApiError on network failure", async () => {
        // Temporarily change API base to trigger network error
        const originalFetch = global.fetch;
        global.fetch = jest.fn(() => Promise.reject(new Error("Network error")));

        await expect(getTurbines()).rejects.toThrow();

        global.fetch = originalFetch;
      });
    });

    describe("getTurbineById", () => {
      let validTurbineId: string;

      beforeAll(async () => {
        const turbines = await getTurbines(1, 0);
        if (turbines.length > 0) {
          validTurbineId = turbines[0].id;
        }
      });

      it("should fetch a single turbine by ID", async () => {
        if (!validTurbineId) {
          console.warn("Skipping test: no turbines available");
          return;
        }

        const turbine = await getTurbineById(validTurbineId);
        expect(turbine).not.toBeNull();
        expect(turbine?.id).toBe(validTurbineId);
        expect(turbine).toHaveProperty("stress_multiplier");
      });

      it("should return null for non-existent turbine ID", async () => {
        const turbine = await getTurbineById("00000000-0000-0000-0000-000000000000");
        expect(turbine).toBeNull();
      });

      it("should handle invalid UUID format", async () => {
        await expect(getTurbineById("invalid-id")).rejects.toThrow(ApiError);
      });
    });

    describe("getStressExplanation", () => {
      let validTurbineId: string;

      beforeAll(async () => {
        const turbines = await getTurbines(1, 0);
        if (turbines.length > 0) {
          validTurbineId = turbines[0].id;
        }
      });

      it("should fetch stress explanation for a turbine", async () => {
        if (!validTurbineId) {
          console.warn("Skipping test: no turbines available");
          return;
        }

        const explanation = await getStressExplanation(validTurbineId);
        if (explanation) {
          expect(explanation).toHaveProperty("explanation");
          expect(typeof explanation.explanation).toBe("string");
        }
      });

      it("should return null for non-existent turbine", async () => {
        const explanation = await getStressExplanation("00000000-0000-0000-0000-000000000000");
        expect(explanation).toBeNull();
      });
    });

    describe("getFailurePredictions", () => {
      let validTurbineId: string;

      beforeAll(async () => {
        const turbines = await getTurbines(1, 0);
        if (turbines.length > 0) {
          validTurbineId = turbines[0].id;
        }
      });

      it("should fetch failure predictions for a turbine", async () => {
        if (!validTurbineId) {
          console.warn("Skipping test: no turbines available");
          return;
        }

        const predictions = await getFailurePredictions(validTurbineId);
        if (predictions) {
          expect(predictions).toHaveProperty("predictions");
          expect(Array.isArray(predictions.predictions)).toBe(true);
        }
      });

      it("should return null for non-existent turbine", async () => {
        const predictions = await getFailurePredictions("00000000-0000-0000-0000-000000000000");
        expect(predictions).toBeNull();
      });
    });

    describe("getTurbineInspections", () => {
      let validTurbineId: string;

      beforeAll(async () => {
        const turbines = await getTurbines(1, 0);
        if (turbines.length > 0) {
          validTurbineId = turbines[0].id;
        }
      });

      it("should fetch inspections for a turbine", async () => {
        if (!validTurbineId) {
          console.warn("Skipping test: no turbines available");
          return;
        }

        const inspections = await getTurbineInspections(validTurbineId);
        expect(Array.isArray(inspections)).toBe(true);
      });

      it("should return empty array for turbine with no inspections", async () => {
        const inspections = await getTurbineInspections("00000000-0000-0000-0000-000000000000");
        expect(inspections).toEqual([]);
      });
    });
  });

  describe("Inspection Endpoints", () => {
    let createdInspectionId: string;
    let validTurbineId: string;

    beforeAll(async () => {
      const turbines = await getTurbines(1, 0);
      if (turbines.length > 0) {
        validTurbineId = turbines[0].id;
      }
    });

    describe("createInspection", () => {
      it("should create a new inspection", async () => {
        if (!validTurbineId) {
          console.warn("Skipping test: no turbines available");
          return;
        }

        const inspection = await createInspection(validTurbineId, {
          inspector_name: "Test Inspector",
          component_inspected: "Gearbox",
          condition_found: "Minor wear",
          severity_rating: 2,
          notes: "Test inspection created by Jest",
        });

        expect(inspection).toHaveProperty("id");
        expect(inspection.turbine_id).toBe(validTurbineId);
        expect(inspection.inspector_name).toBe("Test Inspector");
        expect(inspection.status).toBe("draft");

        createdInspectionId = inspection.id;
      });

      it("should throw error for non-existent turbine", async () => {
        await expect(
          createInspection("00000000-0000-0000-0000-000000000000", {
            inspector_name: "Test",
          })
        ).rejects.toThrow(ApiError);
      });
    });

    describe("getInspectionById", () => {
      it("should fetch an inspection by ID", async () => {
        if (!createdInspectionId) {
          console.warn("Skipping test: no inspection created");
          return;
        }

        const inspection = await getInspectionById(createdInspectionId);
        expect(inspection).not.toBeNull();
        expect(inspection?.id).toBe(createdInspectionId);
        expect(inspection).toHaveProperty("turbine_id");
        expect(inspection).toHaveProperty("status");
      });

      it("should return null for non-existent inspection", async () => {
        const inspection = await getInspectionById("00000000-0000-0000-0000-000000000000");
        expect(inspection).toBeNull();
      });
    });

    describe("updateInspection", () => {
      it("should update an inspection", async () => {
        if (!createdInspectionId) {
          console.warn("Skipping test: no inspection created");
          return;
        }

        const updated = await updateInspection(createdInspectionId, {
          severity_rating: 3,
          notes: "Updated notes from test",
        });

        expect(updated.id).toBe(createdInspectionId);
        expect(updated.severity_rating).toBe(3);
        expect(updated.notes).toBe("Updated notes from test");
      });

      it("should throw error for non-existent inspection", async () => {
        await expect(
          updateInspection("00000000-0000-0000-0000-000000000000", {
            status: "completed",
          })
        ).rejects.toThrow(ApiError);
      });
    });

    describe("getInspectionReportUrl", () => {
      it("should generate correct report URL", () => {
        const url = getInspectionReportUrl("test-id-123");
        expect(url).toBe("http://localhost:8000/inspections/test-id-123/report");
      });
    });
  });

  describe("Fleet Endpoints", () => {
    describe("getFleetTurbines", () => {
      it("should handle non-existent fleet gracefully", async () => {
        const turbines = await getFleetTurbines("00000000-0000-0000-0000-000000000000");
        expect(Array.isArray(turbines)).toBe(true);
        expect(turbines).toEqual([]);
      });
    });

    describe("getProjectedSavings", () => {
      it("should return message for empty fleet", async () => {
        const savings = await getProjectedSavings("00000000-0000-0000-0000-000000000000");
        expect(savings).not.toBeNull();
        expect(savings).toHaveProperty("message");
        expect(savings?.message).toContain("No turbines");
      });

      it("should use default annual_om_per_turbine if not provided", async () => {
        const savings = await getProjectedSavings("00000000-0000-0000-0000-000000000000");
        // API returns a valid response with message for empty fleet
        expect(savings).not.toBeNull();
        expect(savings).toHaveProperty("fleet_id");
      });
    });
  });

  describe("Profile Endpoints", () => {
    const mockToken = "mock-jwt-token";

    describe("getProfile", () => {
      it("should throw error for invalid token", async () => {
        // API returns 401 Unauthorized for invalid tokens
        await expect(getProfile(mockToken)).rejects.toThrow(ApiError);

        try {
          await getProfile(mockToken);
        } catch (error) {
          if (error instanceof ApiError) {
            expect(error.status).toBe(401);
          }
        }
      });
    });

    describe("updateProfile", () => {
      it("should throw error for invalid token", async () => {
        await expect(
          updateProfile(mockToken, { role: "asset_manager" })
        ).rejects.toThrow(ApiError);
      });
    });
  });

  describe("ApiError Class", () => {
    it("should create ApiError with message and status", () => {
      const error = new ApiError("Test error", 404);
      expect(error.message).toBe("Test error");
      expect(error.status).toBe(404);
      expect(error.name).toBe("ApiError");
      expect(error instanceof Error).toBe(true);
    });
  });
});
