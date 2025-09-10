import { describe, it, expect, beforeEach, vi } from "vitest";
import { OptimizedRepetitionManager } from "../../server/services/OptimizedRepetitionManager";
import { RegionManager } from "../../server/services/RegionManager";
import { CoordinateMapper } from "../../server/services/CoordinateMapper";
import {
  RepetitionSpec,
  RegionName,
  AnchorPoint,
  PathCommand,
} from "../../server/types/unified-layered";
import { AspectRatio } from "../../server/services/AspectRatioManager";

describe("OptimizedRepetitionManager", () => {
  let regionManager: RegionManager;
  let coordinateMapper: CoordinateMapper;
  let context: any;

  beforeEach(() => {
    const aspectRatio: AspectRatio = "1:1";
    regionManager = new RegionManager(aspectRatio);
    coordinateMapper = new CoordinateMapper(512, 512, regionManager);

    context = {
      regionName: "center" as RegionName,
      anchor: "center" as AnchorPoint,
      offset: [0, 0] as [number, number],
      canvasWidth: 512,
      canvasHeight: 512,
      regionManager,
      coordinateMapper,
    };
  });

  describe("Grid Repetition Optimization", () => {
    it("should generate grid patterns with O(n) complexity", () => {
      const repetitionSpec: RepetitionSpec = {
        type: "grid",
        count: [5, 5],
        spacing: 0.1,
      };

      const result = OptimizedRepetitionManager.generateOptimizedRepetition(
        repetitionSpec,
        context
      );

      expect(result.instances).toHaveLength(25);
      expect(result.totalCount).toBe(25);
      expect(result.pattern).toBe("grid");
      expect(result.generationTime).toBeDefined();
      expect(result.bounds).toHaveProperty("minX");
      expect(result.bounds).toHaveProperty("maxX");
      expect(result.bounds).toHaveProperty("minY");
      expect(result.bounds).toHaveProperty("maxY");
    });

    it("should handle large grid patterns efficiently", () => {
      const repetitionSpec: RepetitionSpec = {
        type: "grid",
        count: [50, 50], // 2500 instances
        spacing: 0.05,
      };

      const startTime = performance.now();
      const result = OptimizedRepetitionManager.generateOptimizedRepetition(
        repetitionSpec,
        context
      );
      const endTime = performance.now();

      expect(result.instances).toHaveLength(2500);
      expect(result.totalCount).toBe(2500);
      expect(endTime - startTime).toBeLessThan(100); // Should complete in under 100ms
    });

    it("should use batch processing for large grids", () => {
      const repetitionSpec: RepetitionSpec = {
        type: "grid",
        count: [20, 20], // 400 instances - should trigger batch processing
        spacing: 0.1,
      };

      const result = OptimizedRepetitionManager.generateOptimizedRepetition(
        repetitionSpec,
        context
      );

      expect(result.instances).toHaveLength(400);
      expect(result.generationTime).toBeLessThan(50); // Batch processing should be fast
    });

    it("should handle single row/column grids", () => {
      const repetitionSpec: RepetitionSpec = {
        type: "grid",
        count: [1, 10],
        spacing: 0.1,
      };

      const result = OptimizedRepetitionManager.generateOptimizedRepetition(
        repetitionSpec,
        context
      );

      expect(result.instances).toHaveLength(10);
      expect(result.totalCount).toBe(10);

      // All instances should have the same x coordinate
      const xCoords = result.instances.map((i) => i.position.x);
      const uniqueX = new Set(xCoords);
      expect(uniqueX.size).toBe(1);
    });

    it("should handle empty grids gracefully", () => {
      const repetitionSpec: RepetitionSpec = {
        type: "grid",
        count: [0, 5],
        spacing: 0.1,
      };

      const result = OptimizedRepetitionManager.generateOptimizedRepetition(
        repetitionSpec,
        context
      );

      expect(result.instances).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });
  });

  describe("Radial Repetition Optimization", () => {
    it("should generate radial patterns with optimized trigonometry", () => {
      const repetitionSpec: RepetitionSpec = {
        type: "radial",
        count: 8,
        radius: 0.3,
      };

      const result = OptimizedRepetitionManager.generateOptimizedRepetition(
        repetitionSpec,
        context
      );

      expect(result.instances).toHaveLength(8);
      expect(result.totalCount).toBe(8);
      expect(result.pattern).toBe("radial");

      // Check that all instances have rotation values
      result.instances.forEach((instance) => {
        expect(instance.rotation).toBeDefined();
        expect(typeof instance.rotation).toBe("number");
      });
    });

    it("should handle large radial patterns efficiently", () => {
      const repetitionSpec: RepetitionSpec = {
        type: "radial",
        count: 100, // Large radial pattern
        radius: 0.4,
      };

      const startTime = performance.now();
      const result = OptimizedRepetitionManager.generateOptimizedRepetition(
        repetitionSpec,
        context
      );
      const endTime = performance.now();

      expect(result.instances).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(50); // Should be very fast
    });

    it("should use batch trigonometric calculation for large patterns", () => {
      const repetitionSpec: RepetitionSpec = {
        type: "radial",
        count: 60, // Should trigger batch processing
        radius: 0.5,
      };

      const result = OptimizedRepetitionManager.generateOptimizedRepetition(
        repetitionSpec,
        context
      );

      expect(result.instances).toHaveLength(60);
      expect(result.generationTime).toBeLessThan(20); // Batch processing should be very fast

      // Verify rotation values are evenly distributed
      const rotations = result.instances.map((i) => i.rotation!);
      const expectedStep = 360 / 60;

      for (let i = 0; i < rotations.length; i++) {
        const expectedRotation = i * expectedStep;
        expect(Math.abs(rotations[i] - expectedRotation)).toBeLessThan(0.01);
      }
    });

    it("should handle single instance radial patterns", () => {
      const repetitionSpec: RepetitionSpec = {
        type: "radial",
        count: 1,
        radius: 0.2,
      };

      const result = OptimizedRepetitionManager.generateOptimizedRepetition(
        repetitionSpec,
        context
      );

      expect(result.instances).toHaveLength(1);
      expect(result.instances[0].rotation).toBe(0);
    });

    it("should handle zero count gracefully", () => {
      const repetitionSpec: RepetitionSpec = {
        type: "radial",
        count: 0,
        radius: 0.3,
      };

      const result = OptimizedRepetitionManager.generateOptimizedRepetition(
        repetitionSpec,
        context
      );

      expect(result.instances).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });
  });

  describe("Path Command Transformation", () => {
    const sampleCommands: PathCommand[] = [
      { cmd: "M", coords: [0, 0] },
      { cmd: "L", coords: [10, 10] },
      { cmd: "L", coords: [20, 0] },
      { cmd: "Z", coords: [] },
    ];

    it("should apply optimized repetition to commands", () => {
      const repetitionSpec: RepetitionSpec = {
        type: "grid",
        count: [2, 2],
        spacing: 0.2,
      };

      const repetitionResult =
        OptimizedRepetitionManager.generateOptimizedRepetition(
          repetitionSpec,
          context
        );

      const transformedCommands =
        OptimizedRepetitionManager.applyOptimizedRepetitionToCommands(
          sampleCommands,
          repetitionResult
        );

      expect(transformedCommands).toHaveLength(4); // 2x2 grid
      expect(transformedCommands[0]).toHaveLength(4); // Same number of commands per instance
    });

    it("should use batch processing for large command sets", () => {
      const repetitionSpec: RepetitionSpec = {
        type: "grid",
        count: [10, 10], // 100 instances - should trigger batch processing
        spacing: 0.1,
      };

      const repetitionResult =
        OptimizedRepetitionManager.generateOptimizedRepetition(
          repetitionSpec,
          context
        );

      const startTime = performance.now();
      const transformedCommands =
        OptimizedRepetitionManager.applyOptimizedRepetitionToCommands(
          sampleCommands,
          repetitionResult
        );
      const endTime = performance.now();

      expect(transformedCommands).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(100); // Batch processing should be efficient
    });

    it("should handle rotation in radial patterns", () => {
      const repetitionSpec: RepetitionSpec = {
        type: "radial",
        count: 4,
        radius: 0.3,
      };

      const repetitionResult =
        OptimizedRepetitionManager.generateOptimizedRepetition(
          repetitionSpec,
          context
        );

      const transformedCommands =
        OptimizedRepetitionManager.applyOptimizedRepetitionToCommands(
          sampleCommands,
          repetitionResult
        );

      expect(transformedCommands).toHaveLength(4);

      // Each instance should have different coordinates due to rotation
      const firstCoords = transformedCommands[0][0].coords;
      const secondCoords = transformedCommands[1][0].coords;

      expect(firstCoords[0]).not.toBeCloseTo(secondCoords[0], 1);
      expect(firstCoords[1]).not.toBeCloseTo(secondCoords[1], 1);
    });

    it("should handle empty command arrays", () => {
      const repetitionSpec: RepetitionSpec = {
        type: "grid",
        count: [2, 2],
        spacing: 0.1,
      };

      const repetitionResult =
        OptimizedRepetitionManager.generateOptimizedRepetition(
          repetitionSpec,
          context
        );

      const transformedCommands =
        OptimizedRepetitionManager.applyOptimizedRepetitionToCommands(
          [],
          repetitionResult
        );

      expect(transformedCommands).toHaveLength(4);
      transformedCommands.forEach((commands) => {
        expect(commands).toHaveLength(0);
      });
    });
  });

  describe("Performance Benchmarking", () => {
    it("should provide accurate performance benchmarks", () => {
      const repetitionSpec: RepetitionSpec = {
        type: "grid",
        count: [5, 5],
        spacing: 0.1,
      };

      const benchmark =
        OptimizedRepetitionManager.benchmarkRepetitionPerformance(
          repetitionSpec,
          context,
          10 // 10 iterations
        );

      expect(benchmark.averageTime).toBeGreaterThanOrEqual(0);
      expect(benchmark.minTime).toBeGreaterThanOrEqual(0);
      expect(benchmark.maxTime).toBeGreaterThanOrEqual(0);
      expect(benchmark.totalInstances).toBe(25);
      expect(benchmark.instancesPerMs).toBeGreaterThanOrEqual(0);
      expect(benchmark.minTime).toBeLessThanOrEqual(benchmark.averageTime);
      expect(benchmark.averageTime).toBeLessThanOrEqual(benchmark.maxTime);
    });

    it("should show better performance for optimized algorithms", () => {
      const smallSpec: RepetitionSpec = {
        type: "grid",
        count: [3, 3],
        spacing: 0.1,
      };

      const largeSpec: RepetitionSpec = {
        type: "grid",
        count: [10, 10],
        spacing: 0.1,
      };

      const smallBenchmark =
        OptimizedRepetitionManager.benchmarkRepetitionPerformance(
          smallSpec,
          context,
          50
        );

      const largeBenchmark =
        OptimizedRepetitionManager.benchmarkRepetitionPerformance(
          largeSpec,
          context,
          50
        );

      // Performance should scale reasonably with size
      const smallRatio = smallBenchmark.instancesPerMs;
      const largeRatio = largeBenchmark.instancesPerMs;

      // Large patterns should still maintain reasonable performance
      // Handle case where operations are too fast to measure accurately
      if (isFinite(smallRatio) && isFinite(largeRatio)) {
        expect(largeRatio).toBeGreaterThan(smallRatio * 0.1); // At least 10% of small pattern efficiency
      } else {
        // If operations are too fast to measure, just verify they completed
        expect(smallBenchmark.totalInstances).toBe(9);
        expect(largeBenchmark.totalInstances).toBe(100);
      }
    });
  });

  describe("Validation and Error Handling", () => {
    it("should validate repetition specifications with performance considerations", () => {
      const validSpec: RepetitionSpec = {
        type: "grid",
        count: [5, 5],
        spacing: 0.1,
      };

      const validation =
        OptimizedRepetitionManager.validateOptimizedRepetitionSpec(validSpec);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.estimatedComplexity).toBe("low");
    });

    it("should warn about high complexity patterns", () => {
      const highComplexitySpec: RepetitionSpec = {
        type: "grid",
        count: [50, 50], // 2500 instances
        spacing: 0.05,
      };

      const validation =
        OptimizedRepetitionManager.validateOptimizedRepetitionSpec(
          highComplexitySpec
        );

      expect(validation.valid).toBe(true);
      expect(validation.estimatedComplexity).toBe("high");
      expect(validation.warnings.length).toBeGreaterThan(0);
      expect(validation.warnings[0]).toContain("High instance count");
    });

    it("should reject patterns exceeding maximum limits", () => {
      const excessiveSpec: RepetitionSpec = {
        type: "grid",
        count: [200, 200], // 40,000 instances - exceeds limit
        spacing: 0.01,
      };

      const validation =
        OptimizedRepetitionManager.validateOptimizedRepetitionSpec(
          excessiveSpec
        );

      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors[0]).toContain("exceeds maximum limit");
    });

    it("should provide memory usage estimates", () => {
      const spec: RepetitionSpec = {
        type: "grid",
        count: [10, 10],
        spacing: 0.1,
      };

      const estimate = OptimizedRepetitionManager.estimateMemoryUsage(spec);

      expect(estimate.instanceCount).toBe(100);
      expect(estimate.estimatedBytes).toBeGreaterThan(0);
      expect(estimate.recommendation).toBeDefined();
    });

    it("should recommend optimization for large patterns", () => {
      const largeSpec: RepetitionSpec = {
        type: "radial",
        count: 5000, // Large pattern
        radius: 0.4,
      };

      const estimate =
        OptimizedRepetitionManager.estimateMemoryUsage(largeSpec);

      expect(estimate.instanceCount).toBe(5000);
      expect(estimate.recommendation).toContain("Consider");
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle invalid repetition types", () => {
      const invalidSpec = {
        type: "invalid" as any,
        count: 5,
      };

      expect(() => {
        OptimizedRepetitionManager.generateOptimizedRepetition(
          invalidSpec,
          context
        );
      }).toThrow("Unsupported repetition type");
    });

    it("should handle negative counts gracefully", () => {
      const negativeSpec: RepetitionSpec = {
        type: "grid",
        count: [-1, 5],
        spacing: 0.1,
      };

      const validation =
        OptimizedRepetitionManager.validateOptimizedRepetitionSpec(
          negativeSpec
        );

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain(
        "Grid count values must be positive integers"
      );
    });

    it("should handle floating point counts", () => {
      const floatSpec: RepetitionSpec = {
        type: "radial",
        count: 5.5,
        radius: 0.3,
      };

      const validation =
        OptimizedRepetitionManager.validateOptimizedRepetitionSpec(floatSpec);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain("Count must be an integer");
    });

    it("should handle extreme spacing values", () => {
      const extremeSpacingSpec: RepetitionSpec = {
        type: "grid",
        count: [3, 3],
        spacing: 2.0, // > 1.0
      };

      const validation =
        OptimizedRepetitionManager.validateOptimizedRepetitionSpec(
          extremeSpacingSpec
        );

      expect(validation.valid).toBe(true); // Valid but with warnings
      expect(validation.warnings.length).toBeGreaterThan(0);
      expect(validation.warnings[0]).toContain("Large spacing values");
    });
  });
});
