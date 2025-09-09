import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { CacheManager } from "../../server/utils/cache";
import { TokenOptimizer } from "../../server/utils/tokenOptimizer";

describe("CacheManager", () => {
  let cacheManager: CacheManager;

  beforeEach(() => {
    cacheManager = new CacheManager({
      enabled: true,
      ttlMinutes: 1, // Short TTL for testing
      maxEntries: 100,
      cleanupIntervalMinutes: 1,
    });
  });

  afterEach(() => {
    cacheManager.destroy();
  });

  describe("generateCacheKey", () => {
    it("should generate consistent keys for same input", () => {
      const key1 = cacheManager.generateCacheKey("test prompt", "user123");
      const key2 = cacheManager.generateCacheKey("test prompt", "user123");
      expect(key1).toBe(key2);
    });

    it("should generate different keys for different inputs", () => {
      const key1 = cacheManager.generateCacheKey("test prompt", "user123");
      const key2 = cacheManager.generateCacheKey("different prompt", "user123");
      const key3 = cacheManager.generateCacheKey("test prompt", "user456");

      expect(key1).not.toBe(key2);
      expect(key1).not.toBe(key3);
      expect(key2).not.toBe(key3);
    });

    it("should handle undefined userId", () => {
      const key1 = cacheManager.generateCacheKey("test prompt");
      const key2 = cacheManager.generateCacheKey("test prompt", undefined);
      expect(key1).toBe(key2);
    });

    it("should include additional context in key generation", () => {
      const key1 = cacheManager.generateCacheKey("test", "user", {
        model: "gpt4",
      });
      const key2 = cacheManager.generateCacheKey("test", "user", {
        model: "claude",
      });
      expect(key1).not.toBe(key2);
    });
  });

  describe("cache operations", () => {
    it("should store and retrieve data", async () => {
      const key = "test-key";
      const data = { test: "data", array: [1, 2, 3] };

      await cacheManager.set(key, data);
      const retrieved = await cacheManager.get(key);

      expect(retrieved).toEqual(data);
    });

    it("should return null for non-existent keys", async () => {
      const result = await cacheManager.get("non-existent-key");
      expect(result).toBeNull();
    });

    it("should respect TTL", async () => {
      const key = "ttl-test";
      const data = { test: "ttl" };

      // Set with very short TTL
      await cacheManager.set(key, data, 0.01); // 0.6 seconds

      // Should be available immediately
      let result = await cacheManager.get(key);
      expect(result).toEqual(data);

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Should be expired
      result = await cacheManager.get(key);
      expect(result).toBeNull();
    });

    it("should update existing entries", async () => {
      const key = "update-test";
      const data1 = { version: 1 };
      const data2 = { version: 2 };

      await cacheManager.set(key, data1);
      await cacheManager.set(key, data2);

      const result = await cacheManager.get(key);
      expect(result).toEqual(data2);
    });
  });

  describe("cache management", () => {
    it("should clear all entries", async () => {
      await cacheManager.set("key1", { data: 1 });
      await cacheManager.set("key2", { data: 2 });

      await cacheManager.clear();

      const result1 = await cacheManager.get("key1");
      const result2 = await cacheManager.get("key2");

      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });

    it("should delete specific entries", async () => {
      await cacheManager.set("key1", { data: 1 });
      await cacheManager.set("key2", { data: 2 });

      await cacheManager.delete("key1");

      const result1 = await cacheManager.get("key1");
      const result2 = await cacheManager.get("key2");

      expect(result1).toBeNull();
      expect(result2).toEqual({ data: 2 });
    });

    it("should cleanup expired entries", async () => {
      // Set entries with very short TTL
      await cacheManager.set("key1", { data: 1 }, 0.01);
      await cacheManager.set("key2", { data: 2 }, 60); // Long TTL

      // Wait for first entry to expire
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const result = await cacheManager.cleanup();
      expect(result.deletedCount).toBeGreaterThan(0);

      // Check that expired entry is gone but valid entry remains
      const result1 = await cacheManager.get("key1");
      const result2 = await cacheManager.get("key2");

      expect(result1).toBeNull();
      expect(result2).toEqual({ data: 2 });
    });
  });

  describe("metrics and health", () => {
    it("should track cache metrics", async () => {
      await cacheManager.set("key1", { data: 1 });
      await cacheManager.get("key1"); // Hit
      await cacheManager.get("nonexistent"); // Miss

      const metrics = await cacheManager.getMetrics();

      expect(metrics.hits).toBe(1);
      expect(metrics.misses).toBe(1);
      expect(metrics.hitRate).toBe(0.5);
      expect(metrics.totalEntries).toBeGreaterThan(0);
    });

    it("should perform health checks", async () => {
      const health = await cacheManager.healthCheck();

      expect(health).toHaveProperty("healthy");
      expect(health).toHaveProperty("metrics");
      expect(health).toHaveProperty("issues");
      expect(Array.isArray(health.issues)).toBe(true);
    });
  });

  describe("configuration", () => {
    it("should update configuration", () => {
      const newConfig = {
        ttlMinutes: 30,
        maxEntries: 500,
      };

      cacheManager.updateConfig(newConfig);
      const config = cacheManager.getConfig();

      expect(config.ttlMinutes).toBe(30);
      expect(config.maxEntries).toBe(500);
    });

    it("should respect enabled/disabled state", async () => {
      cacheManager.updateConfig({ enabled: false });

      await cacheManager.set("key", { data: "test" });
      const result = await cacheManager.get("key");

      expect(result).toBeNull();
    });
  });
});

describe("TokenOptimizer", () => {
  let tokenOptimizer: TokenOptimizer;

  beforeEach(() => {
    tokenOptimizer = new TokenOptimizer();
    tokenOptimizer.resetMetrics();
  });

  describe("token estimation", () => {
    it("should estimate tokens for strings", () => {
      const text = "This is a test string with some words";
      const tokens = tokenOptimizer.estimateTokens(text);

      expect(tokens).toBeGreaterThan(0);
      expect(tokens).toBeLessThan(text.length); // Should be less than character count
    });

    it("should estimate tokens for objects", () => {
      const obj = {
        title: "Test Object",
        description: "This is a test object with some properties",
        tags: ["test", "object", "example"],
        nested: {
          property: "value",
          number: 42,
        },
      };

      const tokens = tokenOptimizer.estimateTokens(obj);
      expect(tokens).toBeGreaterThan(0);
    });

    it("should handle empty inputs", () => {
      expect(tokenOptimizer.estimateTokens("")).toBe(0);
      expect(tokenOptimizer.estimateTokens({})).toBeGreaterThan(0); // JSON overhead
    });
  });

  describe("KB object optimization", () => {
    it("should optimize oversized objects", () => {
      const largeObject = {
        body: {
          title: "Very Long Title That Could Be Shortened",
          description:
            "This is a very verbose description that contains a lot of unnecessary words and could be compressed significantly to save tokens",
          properties: {
            redundantProperty: null,
            emptyArray: [],
            emptyString: "",
            validProperty: "value",
          },
          veryLongPropertyName: "value",
        },
      };

      const result = tokenOptimizer.optimizeKBObject(largeObject);

      expect(result.originalTokens).toBeGreaterThan(0);
      expect(result.optimizedTokens).toBeLessThanOrEqual(result.originalTokens);
      expect(result.modifications.length).toBeGreaterThan(0);
    });

    it("should not modify objects within token limit", () => {
      const smallObject = {
        body: {
          title: "Short",
          desc: "Brief",
        },
      };

      const result = tokenOptimizer.optimizeKBObject(smallObject);

      expect(result.savings).toBe(0);
      expect(result.modifications.length).toBe(0);
    });
  });

  describe("grounding data optimization", () => {
    it("should limit array sizes", () => {
      const groundingData = {
        motifs: Array(10).fill({ name: "motif", description: "test" }),
        glossary: Array(5).fill({ term: "term", definition: "definition" }),
        fewshot: Array(3).fill({ prompt: "prompt", response: "response" }),
      };

      const result = tokenOptimizer.optimizeGroundingData(groundingData);

      expect(result.optimizedTokens).toBeLessThan(result.originalTokens);
      expect(result.modifications).toContain("Limited motifs to 6 items");
      expect(result.modifications).toContain("Limited glossary to 3 items");
      expect(result.modifications).toContain("Limited fewshot to 1 item");
    });
  });

  describe("cost calculation", () => {
    it("should calculate GPT-4 costs correctly", () => {
      const usage = {
        promptTokens: 1000,
        completionTokens: 500,
        totalTokens: 1500,
      };

      const cost = tokenOptimizer.calculateCost(usage, "gpt4");

      expect(cost).toBeGreaterThan(0);
      expect(cost).toBe((1000 * 0.03) / 1000 + (500 * 0.06) / 1000); // Expected calculation
    });

    it("should calculate embedding costs correctly", () => {
      const usage = {
        promptTokens: 1000,
        completionTokens: 0,
        totalTokens: 1000,
      };

      const cost = tokenOptimizer.calculateCost(usage, "embedding");

      expect(cost).toBe((1000 * 0.00002) / 1000); // Expected calculation
    });
  });

  describe("metrics tracking", () => {
    it("should record usage metrics", () => {
      const usage = {
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        cost: 0.01,
      };

      tokenOptimizer.recordUsage(usage);

      const metrics = tokenOptimizer.getMetrics();

      expect(metrics.totalUsage.promptTokens).toBe(100);
      expect(metrics.totalUsage.completionTokens).toBe(50);
      expect(metrics.totalUsage.totalTokens).toBe(150);
      expect(metrics.totalUsage.cost).toBe(0.01);
      expect(metrics.requestCount).toBe(1);
    });

    it("should track cache hits separately", () => {
      const usage = {
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        cost: 0.01,
      };

      tokenOptimizer.recordUsage(usage, true); // fromCache = true

      const metrics = tokenOptimizer.getMetrics();

      expect(metrics.costSavings.cacheHits).toBe(1);
      expect(metrics.costSavings.tokensSaved).toBe(150);
      expect(metrics.costSavings.costSaved).toBe(0.01);
      expect(metrics.totalUsage.totalTokens).toBe(0); // Should not count towards total usage
    });

    it("should calculate averages correctly", () => {
      const usage1 = {
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        cost: 0.01,
      };
      const usage2 = {
        promptTokens: 200,
        completionTokens: 100,
        totalTokens: 300,
        cost: 0.02,
      };

      tokenOptimizer.recordUsage(usage1);
      tokenOptimizer.recordUsage(usage2);

      const metrics = tokenOptimizer.getMetrics();

      expect(metrics.averagePerRequest.promptTokens).toBe(150);
      expect(metrics.averagePerRequest.completionTokens).toBe(75);
      expect(metrics.averagePerRequest.totalTokens).toBe(225);
      expect(metrics.averagePerRequest.cost).toBe(0.015);
    });
  });

  describe("token budget validation", () => {
    it("should validate objects within budget", () => {
      const smallObject = {
        body: { title: "Small", description: "Brief description" },
      };

      const validation = tokenOptimizer.validateTokenBudget(smallObject);

      expect(validation.valid).toBe(true);
      expect(validation.tokenCount).toBeLessThan(validation.limit);
    });

    it("should reject objects exceeding budget", () => {
      const largeObject = {
        body: {
          title: "Large Object",
          description: "A".repeat(2000), // Very long description
          data: Array(100).fill("lots of data"),
        },
      };

      const validation = tokenOptimizer.validateTokenBudget(largeObject);

      expect(validation.valid).toBe(false);
      expect(validation.tokenCount).toBeGreaterThan(validation.limit);
    });
  });

  describe("optimization recommendations", () => {
    it("should provide recommendations based on metrics", () => {
      // Simulate high token usage
      for (let i = 0; i < 10; i++) {
        tokenOptimizer.recordUsage({
          promptTokens: 3000,
          completionTokens: 1000,
          totalTokens: 4000,
          cost: 0.2,
        });
      }

      const recommendations = tokenOptimizer.getOptimizationRecommendations();

      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
    });

    it("should recommend cache improvements for low hit rates", () => {
      // Simulate low cache hit rate
      for (let i = 0; i < 10; i++) {
        tokenOptimizer.recordUsage({
          promptTokens: 100,
          completionTokens: 50,
          totalTokens: 150,
          cost: 0.01,
        });
      }

      const recommendations = tokenOptimizer.getOptimizationRecommendations();
      const cacheRecommendation = recommendations.find(
        (r) => r.includes("cache") || r.includes("TTL")
      );

      expect(cacheRecommendation).toBeDefined();
    });
  });
});
