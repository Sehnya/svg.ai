/**
 * Unit tests for SizeSpecManager
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  SizeSpecManager,
  SizeCalculationContext,
} from "../../server/services/SizeSpecManager";
import { RegionManager } from "../../server/services/RegionManager";
import { SizeSpec } from "../../server/types/unified-layered";

describe("SizeSpecManager", () => {
  let context: SizeCalculationContext;
  let regionManager: RegionManager;

  beforeEach(() => {
    regionManager = new RegionManager("1:1");
    context = {
      regionName: "center",
      canvasWidth: 512,
      canvasHeight: 512,
      regionManager,
    };
  });

  describe("calculateSize", () => {
    it("should calculate absolute size correctly", () => {
      const sizeSpec: SizeSpec = {
        absolute: { width: 100, height: 80 },
      };

      const result = SizeSpecManager.calculateSize(sizeSpec, context);

      expect(result).toEqual({
        width: 100,
        height: 80,
        method: "absolute",
      });
    });

    it("should calculate relative size correctly", () => {
      const sizeSpec: SizeSpec = {
        relative: 0.5,
      };

      const result = SizeSpecManager.calculateSize(sizeSpec, context);

      // Center region is 0.34 * 0.34 of canvas (174.08 x 174.08 pixels)
      // 50% of that is 87.04 x 87.04
      expect(result.width).toBeCloseTo(87.04, 1);
      expect(result.height).toBeCloseTo(87.04, 1);
      expect(result.method).toBe("relative");
    });

    it("should calculate aspect-constrained size correctly", () => {
      const sizeSpec: SizeSpec = {
        aspect_constrained: { width: 120, aspect: 1.5 },
      };

      const result = SizeSpecManager.calculateSize(sizeSpec, context);

      expect(result).toEqual({
        width: 120,
        height: 80, // 120 / 1.5
        method: "aspect_constrained",
      });
    });

    it("should use default fallback when no size specified", () => {
      const sizeSpec: SizeSpec = {};

      const result = SizeSpecManager.calculateSize(sizeSpec, context);

      // Should use 50% of region as fallback
      expect(result.width).toBeCloseTo(87.04, 1);
      expect(result.height).toBeCloseTo(87.04, 1);
      expect(result.method).toBe("relative");
    });

    it("should work with different regions", () => {
      const topLeftContext = { ...context, regionName: "top_left" };
      const sizeSpec: SizeSpec = { relative: 1.0 };

      const result = SizeSpecManager.calculateSize(sizeSpec, topLeftContext);

      // Top-left region is 0.33 * 0.33 of canvas
      expect(result.width).toBeCloseTo(169.0, 1);
      expect(result.height).toBeCloseTo(169.0, 1);
    });
  });

  describe("validateSizeSpec", () => {
    it("should validate absolute size spec", () => {
      const validSpec: SizeSpec = {
        absolute: { width: 100, height: 80 },
      };

      const result = SizeSpecManager.validateSizeSpec(validSpec);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject negative absolute dimensions", () => {
      const invalidSpec: SizeSpec = {
        absolute: { width: -10, height: 80 },
      };

      const result = SizeSpecManager.validateSizeSpec(invalidSpec);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Absolute width must be positive");
    });

    it("should reject oversized absolute dimensions", () => {
      const invalidSpec: SizeSpec = {
        absolute: { width: 600, height: 80 },
      };

      const result = SizeSpecManager.validateSizeSpec(invalidSpec);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Absolute width cannot exceed canvas size (512px)"
      );
    });

    it("should validate relative size spec", () => {
      const validSpec: SizeSpec = {
        relative: 0.75,
      };

      const result = SizeSpecManager.validateSizeSpec(validSpec);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject out-of-range relative values", () => {
      const invalidSpec: SizeSpec = {
        relative: 1.5,
      };

      const result = SizeSpecManager.validateSizeSpec(invalidSpec);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Relative size must be between 0 and 1");
    });

    it("should validate aspect-constrained size spec", () => {
      const validSpec: SizeSpec = {
        aspect_constrained: { width: 120, aspect: 1.5 },
      };

      const result = SizeSpecManager.validateSizeSpec(validSpec);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject multiple sizing methods", () => {
      const invalidSpec: SizeSpec = {
        absolute: { width: 100, height: 80 },
        relative: 0.5,
      };

      const result = SizeSpecManager.validateSizeSpec(invalidSpec);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Only one sizing method can be specified"
      );
    });

    it("should reject empty size spec", () => {
      const invalidSpec: SizeSpec = {};

      const result = SizeSpecManager.validateSizeSpec(invalidSpec);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "At least one sizing method must be specified"
      );
    });
  });

  describe("createFittingSizeSpec", () => {
    it("should create absolute spec when size fits in region", () => {
      const result = SizeSpecManager.createFittingSizeSpec(100, 80, context);

      expect(result).toEqual({
        absolute: { width: 100, height: 80 },
      });
    });

    it("should create relative spec when size doesn't fit", () => {
      const result = SizeSpecManager.createFittingSizeSpec(300, 300, context);

      expect(result).toHaveProperty("relative");
      expect(result.relative).toBeLessThan(1);
    });
  });

  describe("getMaxSizeForRegion", () => {
    it("should return maximum size for center region", () => {
      const result = SizeSpecManager.getMaxSizeForRegion(context);

      expect(result.width).toBeCloseTo(174.08, 1);
      expect(result.height).toBeCloseTo(174.08, 1);
      expect(result.method).toBe("relative");
    });

    it("should return maximum size for full canvas", () => {
      const fullCanvasContext = { ...context, regionName: "full_canvas" };
      const result = SizeSpecManager.getMaxSizeForRegion(fullCanvasContext);

      expect(result.width).toBe(512);
      expect(result.height).toBe(512);
    });
  });

  describe("scaleSizeSpec", () => {
    it("should scale absolute size spec", () => {
      const sizeSpec: SizeSpec = {
        absolute: { width: 100, height: 80 },
      };

      const result = SizeSpecManager.scaleSizeSpec(sizeSpec, 1.5);

      expect(result).toEqual({
        absolute: { width: 150, height: 120 },
      });
    });

    it("should scale relative size spec", () => {
      const sizeSpec: SizeSpec = {
        relative: 0.6,
      };

      const result = SizeSpecManager.scaleSizeSpec(sizeSpec, 1.5);

      expect(result.relative).toBeCloseTo(0.9, 10);
    });

    it("should clamp relative size spec to 1.0", () => {
      const sizeSpec: SizeSpec = {
        relative: 0.8,
      };

      const result = SizeSpecManager.scaleSizeSpec(sizeSpec, 1.5);

      expect(result).toEqual({
        relative: 1.0,
      });
    });

    it("should scale aspect-constrained size spec", () => {
      const sizeSpec: SizeSpec = {
        aspect_constrained: { width: 100, aspect: 1.5 },
      };

      const result = SizeSpecManager.scaleSizeSpec(sizeSpec, 2);

      expect(result).toEqual({
        aspect_constrained: { width: 200, aspect: 1.5 },
      });
    });
  });

  describe("toAbsolute", () => {
    it("should convert relative to absolute", () => {
      const sizeSpec: SizeSpec = {
        relative: 0.5,
      };

      const result = SizeSpecManager.toAbsolute(sizeSpec, context);

      expect(result.width).toBeCloseTo(87.04, 1);
      expect(result.height).toBeCloseTo(87.04, 1);
    });

    it("should return absolute values unchanged", () => {
      const sizeSpec: SizeSpec = {
        absolute: { width: 100, height: 80 },
      };

      const result = SizeSpecManager.toAbsolute(sizeSpec, context);

      expect(result).toEqual({ width: 100, height: 80 });
    });
  });

  describe("fitsWithinBounds", () => {
    it("should return true for size that fits", () => {
      const sizeSpec: SizeSpec = {
        absolute: { width: 100, height: 80 },
      };

      const result = SizeSpecManager.fitsWithinBounds(sizeSpec, context);

      expect(result).toBe(true);
    });

    it("should return false for size that doesn't fit", () => {
      const sizeSpec: SizeSpec = {
        absolute: { width: 600, height: 80 },
      };

      const result = SizeSpecManager.fitsWithinBounds(sizeSpec, context);

      expect(result).toBe(false);
    });

    it("should use custom bounds", () => {
      const sizeSpec: SizeSpec = {
        absolute: { width: 150, height: 80 },
      };

      const result = SizeSpecManager.fitsWithinBounds(
        sizeSpec,
        context,
        100,
        100
      );

      expect(result).toBe(false);
    });
  });
});
