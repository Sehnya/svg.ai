import { describe, it, expect, beforeEach, vi } from "vitest";
import { OptimizedCoordinateMapper } from "../../server/services/OptimizedCoordinateMapper";
import { RegionManager } from "../../server/services/RegionManager";
import {
  LayoutSpecification,
  PathCommand,
  RegionName,
  AnchorPoint,
} from "../../server/types/unified-layered";
import { AspectRatio } from "../../server/services/AspectRatioManager";

describe("OptimizedCoordinateMapper", () => {
  let coordinateMapper: OptimizedCoordinateMapper;
  let regionManager: RegionManager;

  beforeEach(() => {
    const aspectRatio: AspectRatio = "1:1";
    regionManager = new RegionManager(aspectRatio);
    coordinateMapper = new OptimizedCoordinateMapper(512, 512, regionManager);
  });

  describe("Position Calculation with Caching", () => {
    it("should calculate positions accurately", () => {
      const layout: LayoutSpecification = {
        region: "center",
        anchor: "center",
        offset: [0, 0],
      };

      const position = coordinateMapper.calculateOptimizedPosition(layout);

      expect(position.x).toBeCloseTo(256, 1); // Center of 512x512 canvas
      expect(position.y).toBeCloseTo(256, 1);
    });

    it("should cache position calculations for repeated requests", () => {
      const layout: LayoutSpecification = {
        region: "top_left",
        anchor: "center",
        offset: [0.1, -0.1],
      };

      // First calculation
      const startTime1 = performance.now();
      const position1 = coordinateMapper.calculateOptimizedPosition(layout);
      const endTime1 = performance.now();

      // Second calculation (should be cached)
      const startTime2 = performance.now();
      const position2 = coordinateMapper.calculateOptimizedPosition(layout);
      const endTime2 = performance.now();

      expect(position1).toEqual(position2);
      // Note: Operations may be too fast to measure timing differences accurately
      expect(endTime2 - startTime2).toBeLessThanOrEqual(endTime1 - startTime1); // Cached should be faster or equal
    });

    it("should handle different anchor points correctly", () => {
      const anchors: AnchorPoint[] = ["top_left", "center", "bottom_right"];
      const positions = anchors.map((anchor) => {
        const layout: LayoutSpecification = {
          region: "center",
          anchor,
          offset: [0, 0],
        };
        return coordinateMapper.calculateOptimizedPosition(layout);
      });

      // Top-left should have smaller coordinates than center
      expect(positions[0].x).toBeLessThan(positions[1].x);
      expect(positions[0].y).toBeLessThan(positions[1].y);

      // Bottom-right should have larger coordinates than center
      expect(positions[2].x).toBeGreaterThan(positions[1].x);
      expect(positions[2].y).toBeGreaterThan(positions[1].y);
    });

    it("should apply offsets correctly", () => {
      const baseLayout: LayoutSpecification = {
        region: "center",
        anchor: "center",
        offset: [0, 0],
      };

      const offsetLayout: LayoutSpecification = {
        region: "center",
        anchor: "center",
        offset: [0.2, -0.3],
      };

      const basePosition =
        coordinateMapper.calculateOptimizedPosition(baseLayout);
      const offsetPosition =
        coordinateMapper.calculateOptimizedPosition(offsetLayout);

      expect(offsetPosition.x).toBeGreaterThan(basePosition.x);
      expect(offsetPosition.y).toBeLessThan(basePosition.y);
    });

    it("should calculate sizes when specified", () => {
      const layout: LayoutSpecification = {
        region: "center",
        anchor: "center",
        offset: [0, 0],
        size: { relative: 0.5 },
      };

      const position = coordinateMapper.calculateOptimizedPosition(layout);

      expect(position.width).toBeDefined();
      expect(position.height).toBeDefined();
      expect(position.width).toBeGreaterThan(0);
      expect(position.height).toBeGreaterThan(0);
    });
  });

  describe("Batch Processing", () => {
    const sampleCommands: PathCommand[] = [
      { cmd: "M", coords: [0, 0] },
      { cmd: "L", coords: [10, 10] },
      { cmd: "L", coords: [20, 0] },
      { cmd: "Z", coords: [] },
    ];

    it("should process small batches using standard method", () => {
      const layouts: LayoutSpecification[] = Array.from(
        { length: 10 },
        (_, i) => ({
          region: "center",
          anchor: "center",
          offset: [i * 0.1, 0],
        })
      );

      const result = coordinateMapper.batchTransformPathCommands(
        sampleCommands,
        layouts
      );

      expect(result.transformedCommands).toHaveLength(10);
      expect(result.totalCommands).toBe(40); // 4 commands * 10 layouts
      expect(result.processingTime).toBeGreaterThanOrEqual(0);
    });

    it("should use optimized batch processing for large batches", () => {
      const layouts: LayoutSpecification[] = Array.from(
        { length: 100 },
        (_, i) => ({
          region: "center",
          anchor: "center",
          offset: [i * 0.01, 0],
        })
      );

      const startTime = performance.now();
      const result = coordinateMapper.batchTransformPathCommands(
        sampleCommands,
        layouts
      );
      const endTime = performance.now();

      expect(result.transformedCommands).toHaveLength(100);
      expect(result.totalCommands).toBe(400); // 4 commands * 100 layouts
      expect(endTime - startTime).toBeLessThan(100); // Should be fast with batch processing
    });

    it("should handle empty command arrays in batch processing", () => {
      const layouts: LayoutSpecification[] = Array.from(
        { length: 5 },
        (_, i) => ({
          region: "center",
          anchor: "center",
          offset: [i * 0.1, 0],
        })
      );

      const result = coordinateMapper.batchTransformPathCommands([], layouts);

      expect(result.transformedCommands).toHaveLength(5);
      expect(result.totalCommands).toBe(0);
      result.transformedCommands.forEach((commands) => {
        expect(commands).toHaveLength(0);
      });
    });
  });

  describe("Path Command Transformation", () => {
    const sampleCommands: PathCommand[] = [
      { cmd: "M", coords: [0, 0] },
      { cmd: "L", coords: [10, 10] },
      { cmd: "C", coords: [5, 15, 15, 15, 20, 10] },
      { cmd: "Z", coords: [] },
    ];

    it("should transform path commands correctly", () => {
      const layout: LayoutSpecification = {
        region: "center",
        anchor: "center",
        offset: [0, 0],
      };

      const transformed = coordinateMapper.transformPathCommands(
        sampleCommands,
        layout
      );

      expect(transformed).toHaveLength(4);
      expect(transformed[0].cmd).toBe("M");
      expect(transformed[3].cmd).toBe("Z");
      expect(transformed[3].coords).toHaveLength(0);
    });

    it("should handle grid repetition in transformations", () => {
      const layout: LayoutSpecification = {
        region: "center",
        anchor: "center",
        offset: [0, 0],
        repeat: {
          type: "grid",
          count: [2, 2],
          spacing: 0.2,
        },
      };

      const transformed = coordinateMapper.transformPathCommands(
        sampleCommands,
        layout
      );

      // Should have more commands due to repetition
      expect(transformed.length).toBeGreaterThan(sampleCommands.length);

      // Should contain move commands for subsequent instances
      const moveCommands = transformed.filter((cmd) => cmd.cmd === "M");
      expect(moveCommands.length).toBeGreaterThan(1);
    });

    it("should handle radial repetition in transformations", () => {
      const layout: LayoutSpecification = {
        region: "center",
        anchor: "center",
        offset: [0, 0],
        repeat: {
          type: "radial",
          count: 6,
          radius: 50,
        },
      };

      const transformed = coordinateMapper.transformPathCommands(
        sampleCommands,
        layout
      );

      // Should have more commands due to repetition
      expect(transformed.length).toBeGreaterThan(sampleCommands.length);

      // Should contain move commands for subsequent instances
      const moveCommands = transformed.filter((cmd) => cmd.cmd === "M");
      expect(moveCommands.length).toBeGreaterThan(1);
    });

    it("should clamp coordinates to canvas bounds", () => {
      const layout: LayoutSpecification = {
        region: "center",
        anchor: "center",
        offset: [2, 2], // Large offset that would exceed bounds
      };

      const extremeCommands: PathCommand[] = [
        { cmd: "M", coords: [1000, 1000] }, // Coordinates that exceed canvas
        { cmd: "L", coords: [-100, -100] },
      ];

      const transformed = coordinateMapper.transformPathCommands(
        extremeCommands,
        layout
      );

      transformed.forEach((command) => {
        if (command.cmd !== "Z") {
          command.coords.forEach((coord) => {
            expect(coord).toBeGreaterThanOrEqual(0);
            expect(coord).toBeLessThanOrEqual(512);
          });
        }
      });
    });
  });

  describe("Bounding Box Calculations", () => {
    it("should calculate bounding boxes efficiently", () => {
      const commands: PathCommand[] = [
        { cmd: "M", coords: [10, 20] },
        { cmd: "L", coords: [30, 40] },
        { cmd: "L", coords: [50, 10] },
        { cmd: "Z", coords: [] },
      ];

      const bounds = coordinateMapper.calculateOptimizedBoundingBox(commands);

      expect(bounds.x).toBe(10);
      expect(bounds.y).toBe(10);
      expect(bounds.width).toBe(40); // 50 - 10
      expect(bounds.height).toBe(30); // 40 - 10
    });

    it("should handle empty command arrays", () => {
      const bounds = coordinateMapper.calculateOptimizedBoundingBox([]);

      expect(bounds.x).toBe(0);
      expect(bounds.y).toBe(0);
      expect(bounds.width).toBe(0);
      expect(bounds.height).toBe(0);
    });

    it("should handle commands with only Z commands", () => {
      const commands: PathCommand[] = [
        { cmd: "Z", coords: [] },
        { cmd: "Z", coords: [] },
      ];

      const bounds = coordinateMapper.calculateOptimizedBoundingBox(commands);

      expect(bounds.x).toBe(0);
      expect(bounds.y).toBe(0);
      expect(bounds.width).toBe(0);
      expect(bounds.height).toBe(0);
    });
  });

  describe("Scaling Operations", () => {
    const sampleCommands: PathCommand[] = [
      { cmd: "M", coords: [0, 0] },
      { cmd: "L", coords: [10, 10] },
      { cmd: "L", coords: [20, 0] },
      { cmd: "Z", coords: [] },
    ];

    it("should scale paths to fit target dimensions", () => {
      const scaled = coordinateMapper.scalePathToFitOptimized(
        sampleCommands,
        100,
        100,
        true
      );

      const bounds = coordinateMapper.calculateOptimizedBoundingBox(scaled);

      // Should fit within target dimensions
      expect(bounds.width).toBeLessThanOrEqual(100);
      expect(bounds.height).toBeLessThanOrEqual(100);
    });

    it("should maintain aspect ratio when requested", () => {
      const scaled = coordinateMapper.scalePathToFitOptimized(
        sampleCommands,
        200,
        100,
        true // maintain aspect ratio
      );

      const bounds = coordinateMapper.calculateOptimizedBoundingBox(scaled);

      // Should use the smaller scale factor for both dimensions
      // The original bounds are 20x10, target is 200x100, so scale should be min(200/20, 100/10) = min(10, 10) = 10
      // But we're maintaining aspect ratio, so both should scale by the smaller factor
      expect(bounds.width).toBeLessThanOrEqual(200);
      expect(bounds.height).toBeLessThanOrEqual(100);
    });

    it("should allow non-uniform scaling when aspect ratio is not maintained", () => {
      const scaled = coordinateMapper.scalePathToFitOptimized(
        sampleCommands,
        200,
        100,
        false // don't maintain aspect ratio
      );

      const bounds = coordinateMapper.calculateOptimizedBoundingBox(scaled);

      // Should use different scale factors
      expect(bounds.width).toBeCloseTo(200, 1);
      expect(bounds.height).toBeCloseTo(100, 1);
    });

    it("should handle zero-dimension paths gracefully", () => {
      const zeroCommands: PathCommand[] = [
        { cmd: "M", coords: [10, 10] },
        { cmd: "Z", coords: [] },
      ];

      const scaled = coordinateMapper.scalePathToFitOptimized(
        zeroCommands,
        100,
        100,
        true
      );

      expect(scaled).toEqual(zeroCommands); // Should return unchanged
    });
  });

  describe("Performance Benchmarking", () => {
    const sampleCommands: PathCommand[] = [
      { cmd: "M", coords: [0, 0] },
      { cmd: "L", coords: [10, 10] },
      { cmd: "L", coords: [20, 0] },
      { cmd: "Z", coords: [] },
    ];

    it("should provide performance benchmarks", () => {
      const layouts: LayoutSpecification[] = Array.from(
        { length: 20 },
        (_, i) => ({
          region: "center",
          anchor: "center",
          offset: [i * 0.05, 0],
        })
      );

      const benchmark = coordinateMapper.benchmarkCoordinatePerformance(
        sampleCommands,
        layouts,
        10 // 10 iterations
      );

      expect(benchmark.averageTime).toBeGreaterThanOrEqual(0);
      expect(benchmark.commandsPerMs).toBeGreaterThanOrEqual(0);
      expect(benchmark.cacheHitRate).toBeGreaterThanOrEqual(0);
      expect(benchmark.cacheHitRate).toBeLessThanOrEqual(1);
    });

    it("should show improved performance with caching", () => {
      const layout: LayoutSpecification = {
        region: "center",
        anchor: "center",
        offset: [0, 0],
      };

      const layouts = Array.from({ length: 50 }, () => layout); // Same layout repeated

      const benchmark = coordinateMapper.benchmarkCoordinatePerformance(
        sampleCommands,
        layouts,
        5
      );

      // With repeated layouts, cache hit rate should be high
      expect(benchmark.cacheHitRate).toBeGreaterThan(0.5);
    });
  });

  describe("Cache Management", () => {
    it("should provide cache statistics", () => {
      const layout: LayoutSpecification = {
        region: "center",
        anchor: "center",
        offset: [0, 0],
      };

      // Trigger some cache entries
      coordinateMapper.calculateOptimizedPosition(layout);
      coordinateMapper.calculateOptimizedPosition({
        ...layout,
        region: "top_left",
      });

      const stats = coordinateMapper.getCacheStats();

      expect(stats.size).toBeGreaterThan(0);
      expect(stats.maxSize).toBeGreaterThan(0);
      expect(stats.hitRate).toBeGreaterThanOrEqual(0);
    });

    it("should clear cache when requested", () => {
      const layout: LayoutSpecification = {
        region: "center",
        anchor: "center",
        offset: [0, 0],
      };

      // Add some cache entries
      coordinateMapper.calculateOptimizedPosition(layout);

      let stats = coordinateMapper.getCacheStats();
      expect(stats.size).toBeGreaterThan(0);

      // Clear cache
      coordinateMapper.clearCache();

      stats = coordinateMapper.getCacheStats();
      expect(stats.size).toBe(0);
    });

    it("should update canvas dimensions and clear cache", () => {
      const layout: LayoutSpecification = {
        region: "center",
        anchor: "center",
        offset: [0, 0],
      };

      // Add cache entry with original dimensions
      const position1 = coordinateMapper.calculateOptimizedPosition(layout);

      // Update canvas dimensions
      coordinateMapper.updateCanvasDimensions(1024, 1024);

      // Position should be different due to new canvas size
      const position2 = coordinateMapper.calculateOptimizedPosition(layout);

      // Center of 1024x1024 should be 512,512 vs 256,256 for 512x512
      expect(position2.x).toBeCloseTo(512, 1);
      expect(position2.y).toBeCloseTo(512, 1);
    });
  });

  describe("Performance Metrics", () => {
    it("should provide performance metrics", () => {
      const metrics = coordinateMapper.getPerformanceMetrics();

      expect(metrics.cacheSize).toBeGreaterThanOrEqual(0);
      expect(metrics.canvasDimensions.width).toBe(512);
      expect(metrics.canvasDimensions.height).toBe(512);
      expect(metrics.precisionFactor).toBeGreaterThan(0);
    });

    it("should update metrics after operations", () => {
      const initialMetrics = coordinateMapper.getPerformanceMetrics();

      // Perform some operations
      const layout: LayoutSpecification = {
        region: "center",
        anchor: "center",
        offset: [0, 0],
      };

      coordinateMapper.calculateOptimizedPosition(layout);

      const updatedMetrics = coordinateMapper.getPerformanceMetrics();

      expect(updatedMetrics.cacheSize).toBeGreaterThanOrEqual(
        initialMetrics.cacheSize
      );
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle invalid regions gracefully", () => {
      const layout: LayoutSpecification = {
        region: "invalid_region" as RegionName,
        anchor: "center",
        offset: [0, 0],
      };

      // Should not throw, but may return default position
      expect(() => {
        coordinateMapper.calculateOptimizedPosition(layout);
      }).not.toThrow();
    });

    it("should handle extreme offset values", () => {
      const layout: LayoutSpecification = {
        region: "center",
        anchor: "center",
        offset: [10, -10], // Extreme offsets
      };

      const position = coordinateMapper.calculateOptimizedPosition(layout);

      // Coordinates should be clamped to canvas bounds
      expect(position.x).toBeGreaterThanOrEqual(0);
      expect(position.x).toBeLessThanOrEqual(512);
      expect(position.y).toBeGreaterThanOrEqual(0);
      expect(position.y).toBeLessThanOrEqual(512);
    });

    it("should handle very large command arrays", () => {
      const largeCommands: PathCommand[] = Array.from(
        { length: 1000 },
        (_, i) => ({
          cmd: "L" as const,
          coords: [i, i],
        })
      );

      const layout: LayoutSpecification = {
        region: "center",
        anchor: "center",
        offset: [0, 0],
      };

      const startTime = performance.now();
      const transformed = coordinateMapper.transformPathCommands(
        largeCommands,
        layout
      );
      const endTime = performance.now();

      expect(transformed).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in reasonable time
    });

    it("should handle coordinate precision correctly", () => {
      const layout: LayoutSpecification = {
        region: "center",
        anchor: "center",
        offset: [0.123456789, 0.987654321], // High precision offsets
      };

      const position = coordinateMapper.calculateOptimizedPosition(layout);

      // Coordinates should be rounded to specified precision
      const precision = 2;
      const factor = Math.pow(10, precision);

      expect(position.x).toBe(Math.round(position.x * factor) / factor);
      expect(position.y).toBe(Math.round(position.y * factor) / factor);
    });
  });
});
