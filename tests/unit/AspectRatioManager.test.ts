/**
 * Unit tests for AspectRatioManager
 */
import { describe, it, expect } from "vitest";
import {
  AspectRatioManager,
  type AspectRatio,
} from "../../server/services/AspectRatioManager";

describe("AspectRatioManager", () => {
  describe("getConfig", () => {
    it("should return correct config for 1:1 aspect ratio", () => {
      const config = AspectRatioManager.getConfig("1:1");

      expect(config.ratio).toBe(1.0);
      expect(config.name).toBe("Square");
      expect(config.width).toBe(512);
      expect(config.height).toBe(512);
      expect(config.viewBox).toBe("0 0 512 512");
    });

    it("should return correct config for 16:9 aspect ratio", () => {
      const config = AspectRatioManager.getConfig("16:9");

      expect(config.ratio).toBeCloseTo(16 / 9);
      expect(config.name).toBe("Widescreen");
      expect(config.width).toBe(512);
      expect(config.height).toBe(288);
      expect(config.viewBox).toBe("0 0 512 288");
    });

    it("should throw error for invalid aspect ratio", () => {
      expect(() => {
        AspectRatioManager.getConfig("invalid" as AspectRatio);
      }).toThrow("Unsupported aspect ratio: invalid");
    });

    it("should return immutable config (copy)", () => {
      const config1 = AspectRatioManager.getConfig("1:1");
      const config2 = AspectRatioManager.getConfig("1:1");

      config1.width = 999;
      expect(config2.width).toBe(512);
    });
  });

  describe("calculateDimensions", () => {
    it("should calculate correct dimensions for 1:1 ratio", () => {
      const dimensions = AspectRatioManager.calculateDimensions("1:1", 400);

      expect(dimensions.width).toBe(400);
      expect(dimensions.height).toBe(400);
      expect(dimensions.aspectRatio).toBe("1:1");
      expect(dimensions.viewBox).toBe("0 0 512 512");
    });

    it("should calculate correct dimensions for 16:9 ratio", () => {
      const dimensions = AspectRatioManager.calculateDimensions("16:9", 640);

      expect(dimensions.width).toBe(640);
      expect(dimensions.height).toBe(360);
      expect(dimensions.aspectRatio).toBe("16:9");
      expect(dimensions.viewBox).toBe("0 0 512 288");
    });

    it("should round height to nearest integer", () => {
      const dimensions = AspectRatioManager.calculateDimensions("4:3", 333);

      expect(dimensions.width).toBe(333);
      expect(dimensions.height).toBe(250); // 333 / (4/3) = 249.75 -> 250
    });
  });

  describe("calculateDimensionsByHeight", () => {
    it("should calculate correct dimensions by height for 1:1 ratio", () => {
      const dimensions = AspectRatioManager.calculateDimensionsByHeight(
        "1:1",
        300
      );

      expect(dimensions.width).toBe(300);
      expect(dimensions.height).toBe(300);
      expect(dimensions.aspectRatio).toBe("1:1");
    });

    it("should calculate correct dimensions by height for 16:9 ratio", () => {
      const dimensions = AspectRatioManager.calculateDimensionsByHeight(
        "16:9",
        360
      );

      expect(dimensions.width).toBe(640);
      expect(dimensions.height).toBe(360);
      expect(dimensions.aspectRatio).toBe("16:9");
    });
  });

  describe("getCanvasDimensions", () => {
    it("should return fixed canvas dimensions for layout calculations", () => {
      const dimensions = AspectRatioManager.getCanvasDimensions("1:1");

      expect(dimensions.width).toBe(512);
      expect(dimensions.height).toBe(512);
      expect(dimensions.viewBox).toBe("0 0 512 512");
      expect(dimensions.aspectRatio).toBe("1:1");
    });

    it("should return different fixed dimensions for different ratios", () => {
      const square = AspectRatioManager.getCanvasDimensions("1:1");
      const widescreen = AspectRatioManager.getCanvasDimensions("16:9");

      expect(square.width).toBe(512);
      expect(square.height).toBe(512);
      expect(widescreen.width).toBe(512);
      expect(widescreen.height).toBe(288);
    });
  });

  describe("isValidRatio", () => {
    it("should return true for valid aspect ratios", () => {
      expect(AspectRatioManager.isValidRatio("1:1")).toBe(true);
      expect(AspectRatioManager.isValidRatio("16:9")).toBe(true);
      expect(AspectRatioManager.isValidRatio("4:3")).toBe(true);
    });

    it("should return false for invalid aspect ratios", () => {
      expect(AspectRatioManager.isValidRatio("invalid")).toBe(false);
      expect(AspectRatioManager.isValidRatio("1:2")).toBe(false);
      expect(AspectRatioManager.isValidRatio("")).toBe(false);
    });
  });

  describe("getSupportedRatios", () => {
    it("should return all supported aspect ratios", () => {
      const ratios = AspectRatioManager.getSupportedRatios();

      expect(ratios).toContain("1:1");
      expect(ratios).toContain("4:3");
      expect(ratios).toContain("16:9");
      expect(ratios).toContain("3:2");
      expect(ratios).toContain("2:3");
      expect(ratios).toContain("9:16");
      expect(ratios.length).toBe(6);
    });
  });

  describe("getClosestRatio", () => {
    it("should return exact match for standard ratios", () => {
      expect(AspectRatioManager.getClosestRatio(512, 512)).toBe("1:1");
      expect(AspectRatioManager.getClosestRatio(640, 480)).toBe("4:3");
      expect(AspectRatioManager.getClosestRatio(1920, 1080)).toBe("16:9");
    });

    it("should return closest match for non-standard ratios", () => {
      expect(AspectRatioManager.getClosestRatio(500, 500)).toBe("1:1");
      expect(AspectRatioManager.getClosestRatio(800, 600)).toBe("4:3");
      expect(AspectRatioManager.getClosestRatio(1600, 900)).toBe("16:9");
    });

    it("should handle edge cases", () => {
      expect(AspectRatioManager.getClosestRatio(1, 1)).toBe("1:1");
      expect(AspectRatioManager.getClosestRatio(1000, 1)).toBe("16:9"); // Very wide
      expect(AspectRatioManager.getClosestRatio(1, 1000)).toBe("9:16"); // Very tall
    });
  });

  describe("normalizeCoordinates", () => {
    it("should normalize coordinates from different canvas sizes", () => {
      const normalized = AspectRatioManager.normalizeCoordinates(
        100,
        100,
        200,
        200,
        "1:1"
      );

      expect(normalized.x).toBe(256); // (100/200) * 512
      expect(normalized.y).toBe(256);
    });

    it("should handle different aspect ratios", () => {
      const normalized = AspectRatioManager.normalizeCoordinates(
        320,
        180,
        640,
        360,
        "16:9"
      );

      expect(normalized.x).toBe(256); // (320/640) * 512
      expect(normalized.y).toBe(144); // (180/360) * 288
    });
  });

  describe("scaleCoordinates", () => {
    it("should scale coordinates to target dimensions", () => {
      const scaled = AspectRatioManager.scaleCoordinates(
        256,
        256,
        "1:1",
        400,
        400
      );

      expect(scaled.x).toBe(200); // (256/512) * 400
      expect(scaled.y).toBe(200);
    });

    it("should handle different aspect ratios", () => {
      const scaled = AspectRatioManager.scaleCoordinates(
        256,
        144,
        "16:9",
        640,
        360
      );

      expect(scaled.x).toBe(320); // (256/512) * 640
      expect(scaled.y).toBe(180); // (144/288) * 360
    });
  });

  describe("clampCoordinates", () => {
    it("should clamp coordinates within canvas bounds", () => {
      const clamped = AspectRatioManager.clampCoordinates(600, 600, "1:1");

      expect(clamped.x).toBe(512);
      expect(clamped.y).toBe(512);
    });

    it("should not modify coordinates already within bounds", () => {
      const clamped = AspectRatioManager.clampCoordinates(256, 256, "1:1");

      expect(clamped.x).toBe(256);
      expect(clamped.y).toBe(256);
    });

    it("should clamp negative coordinates to zero", () => {
      const clamped = AspectRatioManager.clampCoordinates(-10, -20, "1:1");

      expect(clamped.x).toBe(0);
      expect(clamped.y).toBe(0);
    });
  });

  describe("validateCoordinates", () => {
    it("should return true for valid coordinates", () => {
      expect(AspectRatioManager.validateCoordinates(256, 256, "1:1")).toBe(
        true
      );
      expect(AspectRatioManager.validateCoordinates(0, 0, "1:1")).toBe(true);
      expect(AspectRatioManager.validateCoordinates(512, 512, "1:1")).toBe(
        true
      );
    });

    it("should return false for invalid coordinates", () => {
      expect(AspectRatioManager.validateCoordinates(-1, 256, "1:1")).toBe(
        false
      );
      expect(AspectRatioManager.validateCoordinates(256, -1, "1:1")).toBe(
        false
      );
      expect(AspectRatioManager.validateCoordinates(513, 256, "1:1")).toBe(
        false
      );
      expect(AspectRatioManager.validateCoordinates(256, 513, "1:1")).toBe(
        false
      );
    });

    it("should handle different aspect ratios", () => {
      expect(AspectRatioManager.validateCoordinates(512, 288, "16:9")).toBe(
        true
      );
      expect(AspectRatioManager.validateCoordinates(512, 289, "16:9")).toBe(
        false
      );
    });
  });

  describe("createCanvasConfig", () => {
    it("should create correct canvas config with default background", () => {
      const config = AspectRatioManager.createCanvasConfig("1:1");

      expect(config.version).toBe("path-1.0");
      expect(config.canvas.width).toBe(512);
      expect(config.canvas.height).toBe(512);
      expect(config.canvas.viewBox).toBe("0 0 512 512");
      expect(config.canvas.background).toBe("#ffffff");
      expect(config.canvas.aspectRatio).toBe("1:1");
    });

    it("should create correct canvas config with custom background", () => {
      const config = AspectRatioManager.createCanvasConfig("16:9", "#000000");

      expect(config.canvas.width).toBe(512);
      expect(config.canvas.height).toBe(288);
      expect(config.canvas.background).toBe("#000000");
      expect(config.canvas.aspectRatio).toBe("16:9");
    });
  });

  describe("getDefaultRatio", () => {
    it("should return 1:1 as default ratio", () => {
      expect(AspectRatioManager.getDefaultRatio()).toBe("1:1");
    });
  });
});
