/**
 * Configuration API Integration Tests
 * Tests for the configuration management API endpoints
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Hono } from "hono";
import configApp from "../../server/api/config";
import { featureFlagManager } from "../../server/config/featureFlags";

describe("Configuration API Integration", () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    app.route("/api", configApp);

    // Mock admin access for tests
    process.env.NODE_ENV = "development";
    delete process.env.ADMIN_API_KEY;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/config/feature-flags", () => {
    it("should return current feature flag configuration", async () => {
      const res = await app.request("/api/config/feature-flags", {
        method: "GET",
      });

      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data).toHaveProperty("environment");
      expect(data).toHaveProperty("config");
      expect(data).toHaveProperty("usage");
      expect(data.usage).toHaveProperty("unifiedGenerationEnabled");
      expect(data.usage).toHaveProperty("layeredGenerationEnabled");
      expect(data.usage).toHaveProperty("debugVisualizationEnabled");
    });

    it("should deny access when admin key is required but not provided", async () => {
      process.env.ADMIN_API_KEY = "secret_admin_key";

      const res = await app.request("/api/config/feature-flags", {
        method: "GET",
      });

      expect(res.status).toBe(403);

      const data = await res.json();
      expect(data).toHaveProperty("error", "Access denied");
    });

    it("should allow access with correct admin key", async () => {
      process.env.ADMIN_API_KEY = "secret_admin_key";

      const res = await app.request("/api/config/feature-flags", {
        method: "GET",
        headers: {
          Authorization: "Bearer secret_admin_key",
        },
      });

      expect(res.status).toBe(200);
    });
  });

  describe("PATCH /api/config/feature-flags", () => {
    it("should update feature flag configuration", async () => {
      const updates = {
        unifiedGeneration: {
          rolloutPercentage: 75,
        },
        debugVisualization: {
          enabled: false,
        },
      };

      const res = await app.request("/api/config/feature-flags", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data).toHaveProperty("config");
    });

    it("should validate A/B test group percentages", async () => {
      const invalidUpdates = {
        unifiedGeneration: {
          abTestGroups: {
            unified: 60,
            traditional: 30,
            control: 20, // Total = 110, should fail
          },
        },
      };

      const res = await app.request("/api/config/feature-flags", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invalidUpdates),
      });

      expect(res.status).toBe(400);

      const data = await res.json();
      expect(data).toHaveProperty("error", "Invalid configuration");
      expect(data.details).toContain(
        "A/B test group percentages must sum to 100"
      );
    });

    it("should accept valid A/B test group percentages", async () => {
      const validUpdates = {
        unifiedGeneration: {
          abTestGroups: {
            unified: 50,
            traditional: 30,
            control: 20, // Total = 100, should pass
          },
        },
      };

      const res = await app.request("/api/config/feature-flags", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validUpdates),
      });

      expect(res.status).toBe(200);
    });

    it("should deny access without admin privileges", async () => {
      process.env.ADMIN_API_KEY = "secret_admin_key";

      const res = await app.request("/api/config/feature-flags", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ unifiedGeneration: { enabled: false } }),
      });

      expect(res.status).toBe(403);
    });
  });

  describe("POST /api/config/ab-test-assignment", () => {
    it("should return A/B test assignment for a user", async () => {
      const res = await app.request("/api/config/ab-test-assignment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: "test_user_123" }),
      });

      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data).toHaveProperty("userId", "test_user_123");
      expect(data).toHaveProperty("group");
      expect(["unified", "traditional", "control"]).toContain(data.group);
      expect(data).toHaveProperty("metadata");
      expect(data.metadata).toHaveProperty("environment");
      expect(data.metadata).toHaveProperty("assignedAt");
    });

    it("should return A/B test assignment for anonymous user", async () => {
      const res = await app.request("/api/config/ab-test-assignment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data).toHaveProperty("group");
      expect(["unified", "traditional", "control"]).toContain(data.group);
    });

    it("should provide consistent assignment for the same user", async () => {
      const userId = "consistent_test_user";

      const res1 = await app.request("/api/config/ab-test-assignment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      const res2 = await app.request("/api/config/ab-test-assignment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);

      const data1 = await res1.json();
      const data2 = await res2.json();

      expect(data1.group).toBe(data2.group);
    });
  });

  describe("GET /api/config/health", () => {
    it("should return health status", async () => {
      const res = await app.request("/api/config/health", {
        method: "GET",
      });

      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data).toHaveProperty("status", "healthy");
      expect(data).toHaveProperty("environment");
      expect(data).toHaveProperty("timestamp");
      expect(data).toHaveProperty("features");
      expect(data.features).toHaveProperty("unifiedGeneration");
      expect(data.features).toHaveProperty("layeredGeneration");
      expect(data.features).toHaveProperty("debugVisualization");
    });

    it("should not require authentication", async () => {
      process.env.ADMIN_API_KEY = "secret_admin_key";

      const res = await app.request("/api/config/health", {
        method: "GET",
      });

      expect(res.status).toBe(200);
    });
  });

  describe("Configuration Persistence", () => {
    it("should persist configuration changes across requests", async () => {
      // Update configuration
      const updates = {
        unifiedGeneration: {
          rolloutPercentage: 85,
        },
      };

      const updateRes = await app.request("/api/config/feature-flags", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      expect(updateRes.status).toBe(200);

      // Verify the change persisted
      const getRes = await app.request("/api/config/feature-flags", {
        method: "GET",
      });

      expect(getRes.status).toBe(200);

      const data = await getRes.json();
      expect(data.config.unifiedGeneration.rolloutPercentage).toBe(85);
    });
  });

  describe("Error Handling", () => {
    it("should handle malformed JSON in PATCH requests", async () => {
      const res = await app.request("/api/config/feature-flags", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: "invalid json",
      });

      expect(res.status).toBe(400);
    });

    it("should handle missing request body in POST requests", async () => {
      const res = await app.request("/api/config/ab-test-assignment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Should still work with empty body (anonymous user)
      expect(res.status).toBe(200);
    });

    it("should handle invalid configuration values", async () => {
      const invalidUpdates = {
        unifiedGeneration: {
          rolloutPercentage: 150, // Invalid: > 100
        },
      };

      const res = await app.request("/api/config/feature-flags", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invalidUpdates),
      });

      expect(res.status).toBe(400);
    });
  });

  describe("Logging and Monitoring", () => {
    it("should log configuration changes", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const updates = {
        debugVisualization: {
          enabled: false,
        },
      };

      await app.request("/api/config/feature-flags", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "[FeatureFlag]",
        expect.objectContaining({
          feature: "config_update",
          enabled: true,
        })
      );

      consoleSpy.mockRestore();
    });

    it("should log A/B test assignments", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      await app.request("/api/config/ab-test-assignment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: "test_user" }),
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "[ABTest]",
        expect.objectContaining({
          event: "ab_test_assignment",
        })
      );

      consoleSpy.mockRestore();
    });
  });
});
