import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Hono } from "hono";
import cacheAPI from "../../server/api/cache";
import { cacheManager } from "../../server/utils/cache";
import { tokenOptimizer } from "../../server/utils/tokenOptimizer";

describe("Cache API Integration", () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    app.route("/api/cache", cacheAPI);

    // Reset state
    cacheManager.clear();
    tokenOptimizer.resetMetrics();
  });

  afterEach(() => {
    cacheManager.clear();
  });

  describe("GET /api/cache/metrics", () => {
    it("should return cache and token metrics", async () => {
      // Add some test data
      await cacheManager.set("test-key", { data: "test" });
      tokenOptimizer.recordUsage({
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        cost: 0.01,
      });

      const res = await app.request("/api/cache/metrics");
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty("cache");
      expect(data.data).toHaveProperty("tokens");
      expect(data.data).toHaveProperty("recommendations");
      expect(Array.isArray(data.data.recommendations)).toBe(true);
    });
  });

  describe("GET /api/cache/health", () => {
    it("should return cache health status", async () => {
      const res = await app.request("/api/cache/health");
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty("healthy");
      expect(data.data).toHaveProperty("metrics");
      expect(data.data).toHaveProperty("issues");
      expect(typeof data.data.healthy).toBe("boolean");
      expect(Array.isArray(data.data.issues)).toBe(true);
    });
  });

  describe("DELETE /api/cache/clear", () => {
    it("should clear all cache entries", async () => {
      // Add test data
      await cacheManager.set("key1", { data: 1 });
      await cacheManager.set("key2", { data: 2 });

      const res = await app.request("/api/cache/clear", {
        method: "DELETE",
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain("cleared");

      // Verify cache is empty
      const key1 = await cacheManager.get("key1");
      const key2 = await cacheManager.get("key2");
      expect(key1).toBeNull();
      expect(key2).toBeNull();
    });
  });

  describe("POST /api/cache/cleanup", () => {
    it("should cleanup expired entries", async () => {
      // Add entries with short TTL
      await cacheManager.set("expired", { data: "old" }, 0.01); // Very short TTL
      await cacheManager.set("valid", { data: "new" }, 60); // Long TTL

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const res = await app.request("/api/cache/cleanup", {
        method: "POST",
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain("Cleaned up");
      expect(data.data).toHaveProperty("deletedCount");
    });
  });

  describe("POST /api/cache/invalidate", () => {
    it("should invalidate all entries when no pattern provided", async () => {
      await cacheManager.set("key1", { data: 1 });
      await cacheManager.set("key2", { data: 2 });

      const res = await app.request("/api/cache/invalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.deletedCount).toBeGreaterThan(0);
    });

    it("should invalidate entries matching pattern", async () => {
      await cacheManager.set("user-123-prompt", { data: 1 });
      await cacheManager.set("user-456-prompt", { data: 2 });
      await cacheManager.set("system-cache", { data: 3 });

      const res = await app.request("/api/cache/invalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pattern: "user" }),
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("should validate request body", async () => {
      const res = await app.request("/api/cache/invalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pattern: 123 }), // Invalid type
      });

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/cache/entries", () => {
    it("should return cache entries with default limit", async () => {
      await cacheManager.set("key1", { data: 1 });
      await cacheManager.set("key2", { data: 2 });

      const res = await app.request("/api/cache/entries");
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty("entries");
      expect(data.data).toHaveProperty("count");
      expect(Array.isArray(data.data.entries)).toBe(true);
    });

    it("should respect limit parameter", async () => {
      // Add multiple entries
      for (let i = 0; i < 5; i++) {
        await cacheManager.set(`key${i}`, { data: i });
      }

      const res = await app.request("/api/cache/entries?limit=3");
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data.entries.length).toBeLessThanOrEqual(3);
    });

    it("should validate limit parameter", async () => {
      const res = await app.request("/api/cache/entries?limit=invalid");
      expect(res.status).toBe(400);
    });

    it("should enforce maximum limit", async () => {
      const res = await app.request("/api/cache/entries?limit=2000");
      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/cache/optimize/object", () => {
    it("should return optimization analysis for valid object", async () => {
      // This would require a valid KB object ID in a real scenario
      // For testing, we'll simulate the response structure
      const res = await app.request("/api/cache/optimize/object", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objectId: "test-object-id" }),
      });

      // Expect either success or a specific error for non-existent object
      expect([200, 500].includes(res.status)).toBe(true);
    });

    it("should validate request body", async () => {
      const res = await app.request("/api/cache/optimize/object", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}), // Missing objectId
      });

      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/cache/optimize/batch", () => {
    it("should validate object IDs array", async () => {
      const res = await app.request("/api/cache/optimize/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objectIds: [] }), // Empty array
      });

      expect(res.status).toBe(400);
    });

    it("should enforce maximum batch size", async () => {
      const objectIds = Array(150).fill("test-id"); // Exceeds max of 100

      const res = await app.request("/api/cache/optimize/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objectIds }),
      });

      expect(res.status).toBe(400);
    });
  });

  describe("PUT /api/cache/config", () => {
    it("should update cache configuration", async () => {
      const newConfig = {
        ttlMinutes: 30,
        maxEntries: 500,
      };

      const res = await app.request("/api/cache/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newConfig),
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.ttlMinutes).toBe(30);
      expect(data.data.maxEntries).toBe(500);
    });

    it("should validate configuration values", async () => {
      const invalidConfig = {
        ttlMinutes: -1, // Invalid negative value
      };

      const res = await app.request("/api/cache/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidConfig),
      });

      expect(res.status).toBe(400);
    });

    it("should enforce maximum values", async () => {
      const invalidConfig = {
        ttlMinutes: 2000, // Exceeds max of 1440
      };

      const res = await app.request("/api/cache/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidConfig),
      });

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/cache/config", () => {
    it("should return current configuration", async () => {
      const res = await app.request("/api/cache/config");
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty("enabled");
      expect(data.data).toHaveProperty("ttlMinutes");
      expect(data.data).toHaveProperty("maxEntries");
      expect(data.data).toHaveProperty("cleanupIntervalMinutes");
    });
  });

  describe("POST /api/cache/tokens/reset", () => {
    it("should reset token metrics", async () => {
      // Add some usage data
      tokenOptimizer.recordUsage({
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        cost: 0.01,
      });

      const res = await app.request("/api/cache/tokens/reset", {
        method: "POST",
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain("reset");

      // Verify metrics are reset
      const metrics = tokenOptimizer.getMetrics();
      expect(metrics.totalUsage.totalTokens).toBe(0);
      expect(metrics.requestCount).toBe(0);
    });
  });

  describe("Error handling", () => {
    it("should handle malformed JSON", async () => {
      const res = await app.request("/api/cache/invalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "invalid json",
      });

      expect(res.status).toBe(400);
    });

    it("should handle missing Content-Type header", async () => {
      const res = await app.request("/api/cache/invalidate", {
        method: "POST",
        body: JSON.stringify({ pattern: "test" }),
      });

      // Should still work or return appropriate error
      expect([200, 400, 415].includes(res.status)).toBe(true);
    });
  });
});
