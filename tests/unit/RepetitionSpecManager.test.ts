/**
 * Unit tests for RepetitionSpecManager
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  RepetitionSpecManager,
  RepetitionContext,
} from "../../server/services/RepetitionSpecManager";
import { RegionManager } from "../../server/services/RegionManager";
import { CoordinateMapper } from "../../server/services/CoordinateMapper";
import {
  RepetitionSpec,
  PathCommand,
} from "../../server/types/unified-layered";

describe("RepetitionSpecManager", () => {
  let context: RepetitionContext;
  let regionManager: RegionManager;
  let coordinateMapper: CoordinateMapper;

  beforeEach(() => {
    regionManager = new RegionManager("1:1");
    coordinateMapper = new CoordinateMapper(512, 512, regionManager);
    context = {
      regionName: "center",
      anchor: "center",
      offset: [0, 0],
      canvasWidth: 512,
      canvasHeight: 512,
      regionManager,
      coordinateMapper,
    };
  });

  describe("generateRepetition", () => {
    describe("grid patterns", () => {
      it("should generate 2x2 grid pattern", () => {
        const repetitionSpec: RepetitionSpec = {
          type: "grid",
          count: [2, 2],
          spacing: 0.1,
        };

        const result = RepetitionSpecManager.generateRepetition(
          repetitionSpec,
          context
        );

        expect(result.pattern).toBe("grid");
        expect(result.totalCount).toBe(4);
        expect(result.instances).toHaveLength(4);

        // Check that instances are positioned correctly
        const positions = result.instances.map((i) => i.position);
        expect(positions).toHaveLength(4);

        // All positions should be different
        const uniquePositions = new Set(positions.map((p) => `${p.x},${p.y}`));
        expect(uniquePositions.size).toBe(4);
      });

      it("should generate single row grid", () => {
        const repetitionSpec: RepetitionSpec = {
          type: "grid",
          count: [3, 1],
          spacing: 0.2,
        };

        const result = RepetitionSpecManager.generateRepetition(
          repetitionSpec,
          context
        );

        expect(result.totalCount).toBe(3);
        expect(result.instances).toHaveLength(3);

        // All instances should have the same Y coordinate
        const yCoords = result.instances.map((i) => i.position.y);
        expect(new Set(yCoords).size).toBe(1);
      });

      it("should generate single column grid", () => {
        const repetitionSpec: RepetitionSpec = {
          type: "grid",
          count: [1, 3],
          spacing: 0.2,
        };

        const result = RepetitionSpecManager.generateRepetition(
          repetitionSpec,
          context
        );

        expect(result.totalCount).toBe(3);
        expect(result.instances).toHaveLength(3);

        // All instances should have the same X coordinate
        const xCoords = result.instances.map((i) => i.position.x);
        expect(new Set(xCoords).size).toBe(1);
      });

      it("should handle single number count as square grid", () => {
        const repetitionSpec: RepetitionSpec = {
          type: "grid",
          count: 3,
          spacing: 0.1,
        };

        const result = RepetitionSpecManager.generateRepetition(
          repetitionSpec,
          context
        );

        expect(result.totalCount).toBe(9); // 3x3 grid
        expect(result.instances).toHaveLength(9);
      });
    });

    describe("radial patterns", () => {
      it("should generate radial pattern with 6 instances", () => {
        const repetitionSpec: RepetitionSpec = {
          type: "radial",
          count: 6,
          radius: 0.3,
        };

        const result = RepetitionSpecManager.generateRepetition(
          repetitionSpec,
          context
        );

        expect(result.pattern).toBe("radial");
        expect(result.totalCount).toBe(6);
        expect(result.instances).toHaveLength(6);

        // Check that all instances have rotation values
        result.instances.forEach((instance) => {
          expect(instance.rotation).toBeDefined();
          expect(typeof instance.rotation).toBe("number");
        });

        // Check that rotations are evenly distributed
        const rotations = result.instances.map((i) => i.rotation!);
        expect(rotations[0]).toBe(0);
        expect(rotations[1]).toBeCloseTo(60, 1);
        expect(rotations[2]).toBeCloseTo(120, 1);
      });

      it("should generate radial pattern with default radius", () => {
        const repetitionSpec: RepetitionSpec = {
          type: "radial",
          count: 4,
        };

        const result = RepetitionSpecManager.generateRepetition(
          repetitionSpec,
          context
        );

        expect(result.totalCount).toBe(4);
        expect(result.instances).toHaveLength(4);

        // Should use default radius of 0.3
        const centerX = 256; // Center of 512x512 canvas
        const centerY = 256;

        result.instances.forEach((instance) => {
          const distance = Math.sqrt(
            Math.pow(instance.position.x - centerX, 2) +
              Math.pow(instance.position.y - centerY, 2)
          );
          // Default radius 0.3 of center region (174.08 * 0.3 ≈ 52.2)
          expect(distance).toBeCloseTo(52.2, 1);
        });
      });

      it("should handle array count for radial (use first element)", () => {
        const repetitionSpec: RepetitionSpec = {
          type: "radial",
          count: [8, 2], // Should use 8
          radius: 0.2,
        };

        const result = RepetitionSpecManager.generateRepetition(
          repetitionSpec,
          context
        );

        expect(result.totalCount).toBe(8);
        expect(result.instances).toHaveLength(8);
      });
    });

    it("should throw error for unsupported repetition type", () => {
      const repetitionSpec = {
        type: "invalid" as any,
        count: 3,
      };

      expect(() => {
        RepetitionSpecManager.generateRepetition(repetitionSpec, context);
      }).toThrow("Unsupported repetition type: invalid");
    });
  });

  describe("applyRepetitionToCommands", () => {
    it("should apply repetition to path commands", () => {
      const originalCommands: PathCommand[] = [
        { cmd: "M", coords: [0, 0] },
        { cmd: "L", coords: [10, 10] },
        { cmd: "Z", coords: [] },
      ];

      const repetitionResult = {
        instances: [
          { index: 0, position: { x: 100, y: 100 } },
          { index: 1, position: { x: 200, y: 200 } },
        ],
        totalCount: 2,
        pattern: "grid" as const,
        bounds: { minX: 100, maxX: 200, minY: 100, maxY: 200 },
      };

      const result = RepetitionSpecManager.applyRepetitionToCommands(
        originalCommands,
        repetitionResult
      );

      expect(result).toHaveLength(2);

      // First instance
      expect(result[0]).toEqual([
        { cmd: "M", coords: [100, 100] },
        { cmd: "L", coords: [110, 110] },
        { cmd: "Z", coords: [] },
      ]);

      // Second instance
      expect(result[1]).toEqual([
        { cmd: "M", coords: [200, 200] },
        { cmd: "L", coords: [210, 210] },
        { cmd: "Z", coords: [] },
      ]);
    });

    it("should apply rotation to radial repetition", () => {
      const originalCommands: PathCommand[] = [
        { cmd: "M", coords: [0, 0] },
        { cmd: "L", coords: [10, 0] },
      ];

      const repetitionResult = {
        instances: [{ index: 0, position: { x: 100, y: 100 }, rotation: 90 }],
        totalCount: 1,
        pattern: "radial" as const,
        bounds: { minX: 100, maxX: 100, minY: 100, maxY: 100 },
      };

      const result = RepetitionSpecManager.applyRepetitionToCommands(
        originalCommands,
        repetitionResult
      );

      expect(result).toHaveLength(1);

      // Check that rotation was applied (90 degrees should rotate (10,0) to (0,10))
      const transformedCommands = result[0];
      expect(transformedCommands[0].coords).toEqual([100, 100]); // M command
      expect(transformedCommands[1].coords[0]).toBeCloseTo(100, 1); // L command X
      expect(transformedCommands[1].coords[1]).toBeCloseTo(110, 1); // L command Y
    });
  });

  describe("validateRepetitionSpec", () => {
    it("should validate grid repetition spec", () => {
      const validSpec: RepetitionSpec = {
        type: "grid",
        count: [3, 2],
        spacing: 0.1,
      };

      const result = RepetitionSpecManager.validateRepetitionSpec(validSpec);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate radial repetition spec", () => {
      const validSpec: RepetitionSpec = {
        type: "radial",
        count: 8,
        radius: 0.3,
      };

      const result = RepetitionSpecManager.validateRepetitionSpec(validSpec);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject invalid repetition type", () => {
      const invalidSpec = {
        type: "invalid" as any,
        count: 3,
      };

      const result = RepetitionSpecManager.validateRepetitionSpec(invalidSpec);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Repetition type must be 'grid' or 'radial'"
      );
    });

    it("should reject negative count values", () => {
      const invalidSpec: RepetitionSpec = {
        type: "grid",
        count: [-1, 2],
      };

      const result = RepetitionSpecManager.validateRepetitionSpec(invalidSpec);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Grid count values must be positive integers"
      );
    });

    it("should reject non-integer count values", () => {
      const invalidSpec: RepetitionSpec = {
        type: "grid",
        count: [3.5, 2],
      };

      const result = RepetitionSpecManager.validateRepetitionSpec(invalidSpec);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Grid count values must be integers");
    });

    it("should reject excessive count values", () => {
      const invalidSpec: RepetitionSpec = {
        type: "grid",
        count: [25, 25],
      };

      const result = RepetitionSpecManager.validateRepetitionSpec(invalidSpec);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Grid count values should not exceed 20 for performance"
      );
    });

    it("should reject negative spacing", () => {
      const invalidSpec: RepetitionSpec = {
        type: "grid",
        count: 3,
        spacing: -0.1,
      };

      const result = RepetitionSpecManager.validateRepetitionSpec(invalidSpec);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Spacing must be non-negative");
    });

    it("should reject excessive spacing", () => {
      const invalidSpec: RepetitionSpec = {
        type: "grid",
        count: 3,
        spacing: 1.5,
      };

      const result = RepetitionSpecManager.validateRepetitionSpec(invalidSpec);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Spacing should not exceed 1 (100% of region)"
      );
    });

    it("should reject negative radius for radial patterns", () => {
      const invalidSpec: RepetitionSpec = {
        type: "radial",
        count: 6,
        radius: -0.2,
      };

      const result = RepetitionSpecManager.validateRepetitionSpec(invalidSpec);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Radius must be positive");
    });

    it("should reject excessive radius for radial patterns", () => {
      const invalidSpec: RepetitionSpec = {
        type: "radial",
        count: 6,
        radius: 1.5,
      };

      const result = RepetitionSpecManager.validateRepetitionSpec(invalidSpec);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Radius should not exceed 1 (100% of region)"
      );
    });
  });

  describe("calculateOptimalSpacing", () => {
    it("should calculate optimal spacing for grid", () => {
      const result = RepetitionSpecManager.calculateOptimalSpacing(
        3,
        2, // 3 cols, 2 rows
        300,
        200, // region size
        50,
        40 // item size
      );

      // Available space: 300 - (3 * 50) = 150, distributed over 2 gaps = 75
      expect(result.spacingX).toBe(75);
      // Available space: 200 - (2 * 40) = 120, distributed over 1 gap = 120
      expect(result.spacingY).toBe(120);
    });

    it("should handle single item (no spacing needed)", () => {
      const result = RepetitionSpecManager.calculateOptimalSpacing(
        1,
        1, // single item
        100,
        100, // region size
        50,
        50 // item size
      );

      expect(result.spacingX).toBe(0);
      expect(result.spacingY).toBe(0);
    });

    it("should return zero spacing when items don't fit", () => {
      const result = RepetitionSpecManager.calculateOptimalSpacing(
        3,
        2, // 3 cols, 2 rows
        100,
        100, // small region
        50,
        50 // large items
      );

      // Items are too large, so spacing should be 0
      expect(result.spacingX).toBe(0);
      expect(result.spacingY).toBe(0);
    });
  });

  describe("getPatternBounds", () => {
    it("should calculate pattern bounds including item size", () => {
      const repetitionResult = {
        instances: [],
        totalCount: 4,
        pattern: "grid" as const,
        bounds: { minX: 100, maxX: 200, minY: 150, maxY: 250 },
      };

      const result = RepetitionSpecManager.getPatternBounds(
        repetitionResult,
        20, // item width
        30 // item height
      );

      expect(result).toEqual({
        x: 90, // 100 - 20/2
        y: 135, // 150 - 30/2
        width: 120, // (200 - 100) + 20
        height: 130, // (250 - 150) + 30
      });
    });
  });
});
