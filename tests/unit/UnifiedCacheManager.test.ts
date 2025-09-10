import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { UnifiedCacheManager } from "../../server/utils/unifiedCache";
import {
  UnifiedGenerationRequest,
  UnifiedLayeredSVGDocument,
  LayoutSpecification,
  RegionName,
} from "../../server/types/unified-layered";
import { AspectRatio } from "../../server/services/AspectRatioManager";

// Mock the database cache manager
vi.mock("../../server/utils/cache", () => ({
  cacheManager: {
    get: vi.fn(),
    set: vi.fn(),
    cleanup: vi.fn().mockResolvedValue({ deletedCount: 0 }),
    clear: vi.fn(),
    invalidate: vi.fn().mockResolvedValue({ deletedCount: 0 }),
    healthCheck: vi.fn().mockResolvedValue({ healthy: true, issues: [] }),
  },
}));

describe("UnifiedCacheManager", () => {
  let cacheManager: UnifiedCacheManager;

  beforeEach(() => {
    // Create a fresh instance for each test
    cacheManager = new UnifiedCacheManager();
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clear cache after each test
    cacheManager.clear();
  });

  describe("Region Coordinate Caching", () => {
    it("should cache and retrieve region coordinates", async () => {
      const aspectRatio: AspectRatio = "1:1";
      const region: RegionName = "center";
      const bounds = { x: 0.33, y: 0.33, width: 0.34, height: 0.34 };
      const pixelBounds = { x: 169, y: 169, width: 174, height: 174 };

      // Initially should return null (cache miss)
      const initialResult = await cacheManager.getRegionCoordinates(
        aspectRatio,
        region
      );
      expect(initialResult).toBeNull();

      // Set cache entry
      await cacheManager.setRegionCoordinates(
        aspectRatio,
        region,
        bounds,
        pixelBounds,
        0.5
      );

      // Should now return cached result (cache hit)
      const cachedResult = await cacheManager.getRegionCoordinates(
        aspectRatio,
        region
      );
      expect(cachedResult).not.toBeNull();
      expect(cachedResult?.aspectRatio).toBe(aspectRatio);
      expect(cachedResult?.region).toBe(region);
      expect(cachedResult?.bounds).toEqual(bounds);
      expect(cachedResult?.pixelBounds).toEqual(pixelBounds);
    });

    it("should generate consistent cache keys for region coordinates", () => {
      const aspectRatio: AspectRatio = "4:3";
      const region: RegionName = "top_left";

      const key1 = cacheManager.generateRegionCacheKey(aspectRatio, region);
      const key2 = cacheManager.generateRegionCacheKey(aspectRatio, region);

      expect(key1).toBe(key2);
      expect(key1).toBe("region:4:3:top_left");
    });

    it("should handle custom region names", async () => {
      const aspectRatio: AspectRatio = "16:9";
      const customRegion = "custom_header";
      const bounds = { x: 0, y: 0, width: 1, height: 0.2 };
      const pixelBounds = { x: 0, y: 0, width: 512, height: 102 };

      await cacheManager.setRegionCoordinates(
        aspectRatio,
        customRegion,
        bounds,
        pixelBounds
      );
      const result = await cacheManager.getRegionCoordinates(
        aspectRatio,
        customRegion
      );

      expect(result?.region).toBe(customRegion);
      expect(result?.bounds).toEqual(bounds);
    });

    it("should implement LRU eviction for region cache", async () => {
      // Set max entries to a small number for testing
      const maxEntries = 3;
      cacheManager.setMaxEntries(maxEntries, 1000, 1000);

      // Fill cache to capacity
      for (let i = 0; i < maxEntries; i++) {
        await cacheManager.setRegionCoordinates(
          "1:1",
          `region_${i}`,
          { x: 0, y: 0, width: 1, height: 1 },
          { x: 0, y: 0, width: 512, height: 512 }
        );
      }

      // Add one more entry (should evict the first one)
      await cacheManager.setRegionCoordinates(
        "1:1",
        "region_new",
        { x: 0, y: 0, width: 1, height: 1 },
        { x: 0, y: 0, width: 512, height: 512 }
      );

      // First entry should be evicted
      const evictedResult = await cacheManager.getRegionCoordinates(
        "1:1",
        "region_0"
      );
      expect(evictedResult).toBeNull();

      // New entry should be present
      const newResult = await cacheManager.getRegionCoordinates(
        "1:1",
        "region_new"
      );
      expect(newResult).not.toBeNull();
    });
  });

  describe("Layout Specification Caching", () => {
    it("should cache and retrieve layout specifications", async () => {
      const specification: LayoutSpecification = {
        region: "center",
        anchor: "top_left",
        offset: [0.1, -0.2],
        size: { relative: 0.8 },
      };

      const validationResult = {
        valid: true,
        errors: [],
        warnings: [],
      };

      // Initially should return null (cache miss)
      const initialResult =
        await cacheManager.getLayoutSpecification(specification);
      expect(initialResult).toBeNull();

      // Set cache entry
      await cacheManager.setLayoutSpecification(
        specification,
        validationResult,
        1.2
      );

      // Should now return cached result (cache hit)
      const cachedResult =
        await cacheManager.getLayoutSpecification(specification);
      expect(cachedResult).not.toBeNull();
      expect(cachedResult?.specification).toEqual(specification);
      expect(cachedResult?.validationResult).toEqual(validationResult);
    });

    it("should generate consistent cache keys for layout specifications", () => {
      const spec1: LayoutSpecification = {
        region: "center",
        anchor: "center",
        offset: [0, 0],
      };

      const spec2: LayoutSpecification = {
        offset: [0, 0],
        region: "center",
        anchor: "center",
      };

      const key1 = cacheManager.generateLayoutCacheKey(spec1);
      const key2 = cacheManager.generateLayoutCacheKey(spec2);

      expect(key1).toBe(key2); // Should be same despite different property order
    });

    it("should handle validation errors in cached layout specifications", async () => {
      const specification: LayoutSpecification = {
        region: "invalid_region",
        anchor: "center",
      };

      const validationResult = {
        valid: false,
        errors: ["Invalid region name: invalid_region"],
        warnings: ["Consider using a standard region name"],
      };

      await cacheManager.setLayoutSpecification(
        specification,
        validationResult
      );
      const result = await cacheManager.getLayoutSpecification(specification);

      expect(result?.validationResult.valid).toBe(false);
      expect(result?.validationResult.errors).toContain(
        "Invalid region name: invalid_region"
      );
    });
  });

  describe("Layered JSON Caching", () => {
    it("should cache and retrieve layered JSON documents", async () => {
      const request: UnifiedGenerationRequest = {
        prompt: "A simple house",
        aspectRatio: "1:1",
        model: "unified",
        seed: 12345,
      };

      const layeredDocument: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers: [
          {
            id: "base",
            label: "Base Layer",
            paths: [
              {
                id: "rect",
                style: { fill: "#000000" },
                commands: [
                  { cmd: "M", coords: [100, 100] },
                  { cmd: "L", coords: [200, 100] },
                  { cmd: "L", coords: [200, 200] },
                  { cmd: "L", coords: [100, 200] },
                  { cmd: "Z", coords: [] },
                ],
              },
            ],
          },
        ],
      };

      // Initially should return null (cache miss)
      const initialResult = await cacheManager.getLayeredJSON(request);
      expect(initialResult).toBeNull();

      // Set cache entry
      await cacheManager.setLayeredJSON(request, layeredDocument, 2500);

      // Should now return cached result (cache hit)
      const cachedResult = await cacheManager.getLayeredJSON(request);
      expect(cachedResult).not.toBeNull();
      expect(cachedResult?.layeredDocument).toEqual(layeredDocument);
      expect(cachedResult?.prompt).toBe(request.prompt);
      expect(cachedResult?.metadata.layerCount).toBe(1);
      expect(cachedResult?.metadata.pathCount).toBe(1);
      expect(cachedResult?.metadata.generationTime).toBe(2500);
    });

    it("should generate consistent cache keys for generation requests", () => {
      const request1: UnifiedGenerationRequest = {
        prompt: "A house",
        aspectRatio: "1:1",
        model: "unified",
      };

      const request2: UnifiedGenerationRequest = {
        model: "unified",
        prompt: "A house",
        aspectRatio: "1:1",
      };

      const key1 = cacheManager.generateLayeredCacheKey(request1);
      const key2 = cacheManager.generateLayeredCacheKey(request2);

      expect(key1).toBe(key2); // Should be same despite different property order
    });

    it("should normalize prompts for consistent caching", () => {
      const request1: UnifiedGenerationRequest = {
        prompt: "  A HOUSE  ",
        aspectRatio: "1:1",
      };

      const request2: UnifiedGenerationRequest = {
        prompt: "a house",
        aspectRatio: "1:1",
      };

      const key1 = cacheManager.generateLayeredCacheKey(request1);
      const key2 = cacheManager.generateLayeredCacheKey(request2);

      expect(key1).toBe(key2); // Should be same after normalization
    });

    it("should calculate metadata correctly for complex documents", async () => {
      const request: UnifiedGenerationRequest = {
        prompt: "Complex design",
        aspectRatio: "4:3",
      };

      const layeredDocument: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 384, aspectRatio: "4:3" },
        layers: [
          {
            id: "layer1",
            label: "Layer 1",
            layout: { region: "top_left" },
            paths: [
              {
                id: "path1",
                style: { fill: "#ff0000" },
                commands: [{ cmd: "M", coords: [0, 0] }],
                layout: { region: "center" },
              },
              {
                id: "path2",
                style: { fill: "#00ff00" },
                commands: [{ cmd: "M", coords: [10, 10] }],
              },
            ],
          },
          {
            id: "layer2",
            label: "Layer 2",
            layout: { region: "bottom_right" },
            paths: [
              {
                id: "path3",
                style: { fill: "#0000ff" },
                commands: [{ cmd: "M", coords: [20, 20] }],
                layout: { region: "middle_left" },
              },
            ],
          },
        ],
      };

      await cacheManager.setLayeredJSON(request, layeredDocument);
      const result = await cacheManager.getLayeredJSON(request);

      expect(result?.metadata.layerCount).toBe(2);
      expect(result?.metadata.pathCount).toBe(3);
      expect(result?.metadata.regionsUsed).toEqual(
        expect.arrayContaining([
          "top_left",
          "center",
          "bottom_right",
          "middle_left",
        ])
      );
    });
  });

  describe("Cache Management", () => {
    it("should provide accurate metrics", async () => {
      // Add some cache entries
      await cacheManager.setRegionCoordinates(
        "1:1",
        "center",
        { x: 0, y: 0, width: 1, height: 1 },
        { x: 0, y: 0, width: 512, height: 512 }
      );

      await cacheManager.setLayoutSpecification(
        { region: "center" },
        { valid: true, errors: [], warnings: [] }
      );

      // Trigger some hits and misses
      await cacheManager.getRegionCoordinates("1:1", "center"); // hit
      await cacheManager.getRegionCoordinates("1:1", "top_left"); // miss
      await cacheManager.getLayoutSpecification({ region: "center" }); // hit
      await cacheManager.getLayoutSpecification({ region: "top_left" }); // miss

      const metrics = cacheManager.getMetrics();

      expect(metrics.regionCache.hits).toBe(1);
      expect(metrics.regionCache.misses).toBe(1);
      expect(metrics.regionCache.hitRate).toBe(0.5);
      expect(metrics.regionCache.totalEntries).toBe(1);

      expect(metrics.layoutCache.hits).toBe(1);
      expect(metrics.layoutCache.misses).toBe(1);
      expect(metrics.layoutCache.hitRate).toBe(0.5);
      expect(metrics.layoutCache.totalEntries).toBe(1);

      expect(metrics.overall.totalHits).toBe(2);
      expect(metrics.overall.totalMisses).toBe(2);
      expect(metrics.overall.overallHitRate).toBe(0.5);
      expect(metrics.overall.cacheSize).toBe(2);
    });

    it("should clear all caches", async () => {
      // Add entries to all caches
      await cacheManager.setRegionCoordinates(
        "1:1",
        "center",
        { x: 0, y: 0, width: 1, height: 1 },
        { x: 0, y: 0, width: 512, height: 512 }
      );

      await cacheManager.setLayoutSpecification(
        { region: "center" },
        { valid: true, errors: [], warnings: [] }
      );

      const request: UnifiedGenerationRequest = { prompt: "test" };
      const document: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers: [
          {
            id: "test",
            label: "Test",
            paths: [
              {
                id: "test_path",
                style: { fill: "#000000" },
                commands: [{ cmd: "M", coords: [0, 0] }],
              },
            ],
          },
        ],
      };

      await cacheManager.setLayeredJSON(request, document);

      // Verify entries exist
      let metrics = cacheManager.getMetrics();
      expect(metrics.overall.cacheSize).toBe(3);

      // Clear all caches
      await cacheManager.clear();

      // Verify all caches are empty
      metrics = cacheManager.getMetrics();
      expect(metrics.overall.cacheSize).toBe(0);
      expect(metrics.overall.totalHits).toBe(0);
      expect(metrics.overall.totalMisses).toBe(0);
    });

    it("should invalidate cache entries by pattern", async () => {
      // Add entries with different patterns
      await cacheManager.setRegionCoordinates(
        "1:1",
        "center",
        { x: 0, y: 0, width: 1, height: 1 },
        { x: 0, y: 0, width: 512, height: 512 }
      );

      await cacheManager.setRegionCoordinates(
        "4:3",
        "center",
        { x: 0, y: 0, width: 1, height: 1 },
        { x: 0, y: 0, width: 512, height: 384 }
      );

      await cacheManager.setRegionCoordinates(
        "1:1",
        "top_left",
        { x: 0, y: 0, width: 0.33, height: 0.33 },
        { x: 0, y: 0, width: 169, height: 169 }
      );

      // Verify all entries exist
      let metrics = cacheManager.getMetrics();
      expect(metrics.regionCache.totalEntries).toBe(3);

      // Invalidate entries containing "4:3"
      const result = await cacheManager.invalidateByPattern("4:3");
      expect(result.deletedCount).toBeGreaterThan(0);

      // Verify only 4:3 entries were removed
      const centerResult = await cacheManager.getRegionCoordinates(
        "1:1",
        "center"
      );
      const topLeftResult = await cacheManager.getRegionCoordinates(
        "1:1",
        "top_left"
      );
      const aspectResult = await cacheManager.getRegionCoordinates(
        "4:3",
        "center"
      );

      expect(centerResult).not.toBeNull();
      expect(topLeftResult).not.toBeNull();
      expect(aspectResult).toBeNull();
    });

    it("should perform health checks", async () => {
      const healthCheck = await cacheManager.healthCheck();

      expect(healthCheck).toHaveProperty("healthy");
      expect(healthCheck).toHaveProperty("metrics");
      expect(healthCheck).toHaveProperty("issues");
      expect(Array.isArray(healthCheck.issues)).toBe(true);
    });

    it("should detect low hit rate in health check", async () => {
      // Generate many cache misses to lower hit rate
      for (let i = 0; i < 150; i++) {
        await cacheManager.getRegionCoordinates("1:1", `region_${i}`);
      }

      const healthCheck = await cacheManager.healthCheck();
      expect(healthCheck.healthy).toBe(false);
      expect(
        healthCheck.issues.some((issue) =>
          issue.includes("Low overall cache hit rate")
        )
      ).toBe(true);
    });
  });

  describe("TTL and Expiration", () => {
    it("should respect TTL for cache entries", async () => {
      // Mock Date.now to control time
      const originalNow = Date.now;
      let mockTime = 1000000;
      Date.now = vi.fn(() => mockTime);

      try {
        // Set cache entry
        await cacheManager.setRegionCoordinates(
          "1:1",
          "center",
          { x: 0, y: 0, width: 1, height: 1 },
          { x: 0, y: 0, width: 512, height: 512 }
        );

        // Should be available immediately
        let result = await cacheManager.getRegionCoordinates("1:1", "center");
        expect(result).not.toBeNull();

        // Advance time beyond TTL (60 minutes = 3600000ms)
        mockTime += 3700000;

        // Should now be expired
        result = await cacheManager.getRegionCoordinates("1:1", "center");
        expect(result).toBeNull();
      } finally {
        Date.now = originalNow;
      }
    });

    it("should cleanup expired entries", async () => {
      const originalNow = Date.now;
      let mockTime = 1000000;
      Date.now = vi.fn(() => mockTime);

      try {
        // Add some entries
        await cacheManager.setRegionCoordinates(
          "1:1",
          "center",
          { x: 0, y: 0, width: 1, height: 1 },
          { x: 0, y: 0, width: 512, height: 512 }
        );

        await cacheManager.setLayoutSpecification(
          { region: "center" },
          { valid: true, errors: [], warnings: [] }
        );

        // Verify entries exist
        let metrics = cacheManager.getMetrics();
        expect(metrics.overall.cacheSize).toBe(2);

        // Advance time beyond TTL
        mockTime += 3700000;

        // Run cleanup
        const cleanupResult = await cacheManager.cleanup();
        expect(cleanupResult.deletedCount).toBeGreaterThan(0);

        // Verify entries were removed
        metrics = cacheManager.getMetrics();
        expect(metrics.overall.cacheSize).toBe(0);
      } finally {
        Date.now = originalNow;
      }
    });
  });
});
