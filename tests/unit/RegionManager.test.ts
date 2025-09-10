/**
 * Unit tests for RegionManager
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  RegionManager,
  RegionBounds,
  PixelBounds,
} from "../../server/services/RegionManager";
import { AspectRatio } from "../../server/services/AspectRatioManager";
import { RegionName, REGION_BOUNDS } from "../../server/types/unified-layered";

describe("RegionManager", () => {
  let regionManager: RegionManager;

  beforeEach(() => {
    regionManager = new RegionManager("1:1");
  });

  describe("Initialization", () => {
    it("should initialize with default 1:1 aspect ratio", () => {
      const dimensions = regionManager.getCanvasDimensions();
      expect(dimensions.width).toBe(512);
      expect(dimensions.height).toBe(512);
      expect(dimensions.aspectRatio).toBe("1:1");
    });

    it("should initialize with custom aspect ratio", () => {
      const manager = new RegionManager("16:9");
      const dimensions = manager.getCanvasDimensions();
      expect(dimensions.width).toBe(512);
      expect(dimensions.height).toBe(288);
      expect(dimensions.aspectRatio).toBe("16:9");
    });
  });

  describe("Standard Region Management", () => {
    it("should return correct bounds for standard regions", () => {
      const centerBounds = regionManager.getRegionBounds("center");
      expect(centerBounds).toEqual(REGION_BOUNDS.center);

      const topLeftBounds = regionManager.getRegionBounds("top_left");
      expect(topLeftBounds).toEqual(REGION_BOUNDS.top_left);
    });

    it("should return pixel bounds for standard regions", () => {
      const centerPixelBounds = regionManager.getPixelBounds("center");

      // For 1:1 aspect ratio (512x512), center region should be approximately:
      // x: 0.33 * 512 = 168.96, y: 0.33 * 512 = 168.96
      // width: 0.34 * 512 = 174.08, height: 0.34 * 512 = 174.08
      expect(centerPixelBounds.x).toBeCloseTo(168.96, 1);
      expect(centerPixelBounds.y).toBeCloseTo(168.96, 1);
      expect(centerPixelBounds.width).toBeCloseTo(174.08, 1);
      expect(centerPixelBounds.height).toBeCloseTo(174.08, 1);
    });

    it("should get all standard regions", () => {
      const standardRegions = regionManager.getStandardRegions();
      expect(standardRegions).toHaveLength(10);
      expect(standardRegions).toContain("center");
      expect(standardRegions).toContain("top_left");
      expect(standardRegions).toContain("bottom_right");
    });

    it("should check if standard regions exist", () => {
      expect(regionManager.hasRegion("center")).toBe(true);
      expect(regionManager.hasRegion("top_left")).toBe(true);
      expect(regionManager.hasRegion("nonexistent")).toBe(false);
    });
  });

  describe("Custom Region Management", () => {
    it("should add custom regions", () => {
      const customBounds: RegionBounds = {
        x: 0.1,
        y: 0.1,
        width: 0.2,
        height: 0.2,
      };

      regionManager.addCustomRegion("custom_header", customBounds);

      expect(regionManager.hasRegion("custom_header")).toBe(true);
      expect(regionManager.getRegionBounds("custom_header")).toEqual(
        customBounds
      );
    });

    it("should prevent overriding standard regions", () => {
      const customBounds: RegionBounds = {
        x: 0.1,
        y: 0.1,
        width: 0.2,
        height: 0.2,
      };

      expect(() => {
        regionManager.addCustomRegion("center", customBounds);
      }).toThrow("Cannot override standard region 'center'");
    });

    it("should validate custom region bounds", () => {
      // Invalid bounds - outside [0,1] range
      expect(() => {
        regionManager.addCustomRegion("invalid1", {
          x: -0.1,
          y: 0,
          width: 0.2,
          height: 0.2,
        });
      }).toThrow("Invalid region bounds");

      // Invalid bounds - exceeds canvas
      expect(() => {
        regionManager.addCustomRegion("invalid2", {
          x: 0.9,
          y: 0.9,
          width: 0.2,
          height: 0.2,
        });
      }).toThrow("Invalid region bounds");

      // Invalid bounds - zero or negative dimensions
      expect(() => {
        regionManager.addCustomRegion("invalid3", {
          x: 0.1,
          y: 0.1,
          width: 0,
          height: 0.2,
        });
      }).toThrow("Invalid region bounds");
    });

    it("should remove custom regions", () => {
      const customBounds: RegionBounds = {
        x: 0.1,
        y: 0.1,
        width: 0.2,
        height: 0.2,
      };

      regionManager.addCustomRegion("temp_region", customBounds);
      expect(regionManager.hasRegion("temp_region")).toBe(true);

      const removed = regionManager.removeCustomRegion("temp_region");
      expect(removed).toBe(true);
      expect(regionManager.hasRegion("temp_region")).toBe(false);
    });

    it("should prevent removing standard regions", () => {
      expect(() => {
        regionManager.removeCustomRegion("center");
      }).toThrow("Cannot remove standard region 'center'");
    });

    it("should get custom region names", () => {
      regionManager.addCustomRegion("header", {
        x: 0,
        y: 0,
        width: 1,
        height: 0.2,
      });
      regionManager.addCustomRegion("footer", {
        x: 0,
        y: 0.8,
        width: 1,
        height: 0.2,
      });

      const customRegions = regionManager.getCustomRegions();
      expect(customRegions).toHaveLength(2);
      expect(customRegions).toContain("header");
      expect(customRegions).toContain("footer");
    });
  });

  describe("Region Information", () => {
    it("should get complete region information", () => {
      const centerInfo = regionManager.getRegionInfo("center");

      expect(centerInfo.name).toBe("center");
      expect(centerInfo.bounds).toEqual(REGION_BOUNDS.center);
      expect(centerInfo.isCustom).toBe(false);
      expect(centerInfo.pixelBounds.x).toBeCloseTo(168.96, 1);
    });

    it("should get all regions (standard + custom)", () => {
      regionManager.addCustomRegion("custom1", {
        x: 0.1,
        y: 0.1,
        width: 0.2,
        height: 0.2,
      });
      regionManager.addCustomRegion("custom2", {
        x: 0.7,
        y: 0.7,
        width: 0.2,
        height: 0.2,
      });

      const allRegions = regionManager.getAllRegions();
      expect(allRegions.length).toBe(12); // 10 standard + 2 custom

      const customRegions = allRegions.filter((r) => r.isCustom);
      expect(customRegions).toHaveLength(2);
    });

    it("should default to center for unknown regions", () => {
      const unknownBounds = regionManager.getRegionBounds("unknown_region");
      expect(unknownBounds).toEqual(REGION_BOUNDS.center);
    });
  });

  describe("Region Center Calculations", () => {
    it("should calculate region center in normalized coordinates", () => {
      const centerRegionCenter = regionManager.getRegionCenter("center");

      // Center region: x: 0.33, y: 0.33, width: 0.34, height: 0.34
      // Center point: x: 0.33 + 0.34/2 = 0.5, y: 0.33 + 0.34/2 = 0.5
      expect(centerRegionCenter.x).toBeCloseTo(0.5, 2);
      expect(centerRegionCenter.y).toBeCloseTo(0.5, 2);
    });

    it("should calculate region center in pixel coordinates", () => {
      const centerPixels = regionManager.getRegionCenterPixels("center");

      // For 512x512 canvas, center should be at (256, 256)
      expect(centerPixels.x).toBeCloseTo(256, 1);
      expect(centerPixels.y).toBeCloseTo(256, 1);
    });

    it("should calculate corner region centers correctly", () => {
      const topLeftCenter = regionManager.getRegionCenter("top_left");
      const bottomRightCenter = regionManager.getRegionCenter("bottom_right");

      // Top-left region center should be around (0.165, 0.165)
      expect(topLeftCenter.x).toBeCloseTo(0.165, 2);
      expect(topLeftCenter.y).toBeCloseTo(0.165, 2);

      // Bottom-right region center should be around (0.835, 0.835)
      expect(bottomRightCenter.x).toBeCloseTo(0.835, 2);
      expect(bottomRightCenter.y).toBeCloseTo(0.835, 2);
    });
  });

  describe("Point-in-Region Detection", () => {
    it("should find region at normalized point", () => {
      // Point in center region
      const centerRegion = regionManager.findRegionAtPoint(0.5, 0.5);
      expect(centerRegion?.name).toBe("center");

      // Point in top-left region
      const topLeftRegion = regionManager.findRegionAtPoint(0.1, 0.1);
      expect(topLeftRegion?.name).toBe("top_left");

      // Point outside all regions
      const outsideRegion = regionManager.findRegionAtPoint(1.5, 1.5);
      expect(outsideRegion).toBeNull();
    });

    it("should find region at pixel point", () => {
      // Point in center region (256, 256 for 512x512 canvas)
      const centerRegion = regionManager.findRegionAtPixelPoint(256, 256);
      expect(centerRegion?.name).toBe("center");

      // Point in top-left region
      const topLeftRegion = regionManager.findRegionAtPixelPoint(50, 50);
      expect(topLeftRegion?.name).toBe("top_left");
    });

    it("should prioritize custom regions over standard regions", () => {
      // Add custom region that overlaps with center
      regionManager.addCustomRegion("overlay", {
        x: 0.4,
        y: 0.4,
        width: 0.2,
        height: 0.2,
      });

      // Point that would be in both center and overlay
      const region = regionManager.findRegionAtPoint(0.5, 0.5);
      expect(region?.name).toBe("overlay");
      expect(region?.isCustom).toBe(true);
    });
  });

  describe("Region Distance and Sorting", () => {
    it("should sort regions by distance from point", () => {
      const regions = regionManager.getRegionsByDistance(0.5, 0.5);

      // Center should be closest to (0.5, 0.5)
      expect(regions[0].name).toBe("center");

      // Corner regions should be furthest
      const lastRegion = regions[regions.length - 1];
      expect([
        "top_left",
        "top_right",
        "bottom_left",
        "bottom_right",
      ]).toContain(lastRegion.name);
    });

    it("should calculate region overlap correctly", () => {
      // Center (x: 0.33, width: 0.34) and middle_right (x: 0.67, width: 0.33) should have no overlap
      // since 0.33 + 0.34 = 0.67, they just touch but don't overlap
      const overlap = regionManager.calculateRegionOverlap(
        "center",
        "middle_right"
      );
      expect(overlap).toBe(0);

      // top_left and bottom_right should have no overlap
      const noOverlap = regionManager.calculateRegionOverlap(
        "top_left",
        "bottom_right"
      );
      expect(noOverlap).toBe(0);

      // Test with custom overlapping regions
      regionManager.addCustomRegion("overlap1", {
        x: 0.2,
        y: 0.2,
        width: 0.4,
        height: 0.4,
      });
      regionManager.addCustomRegion("overlap2", {
        x: 0.4,
        y: 0.4,
        width: 0.4,
        height: 0.4,
      });
      const actualOverlap = regionManager.calculateRegionOverlap(
        "overlap1",
        "overlap2"
      );
      expect(actualOverlap).toBeGreaterThan(0);
    });
  });

  describe("Coordinate Conversion and Validation", () => {
    it("should convert normalized to pixel coordinates", () => {
      const pixel = regionManager.normalizedToPixel(0.5, 0.5);
      expect(pixel.x).toBe(256);
      expect(pixel.y).toBe(256);

      const corner = regionManager.normalizedToPixel(1, 1);
      expect(corner.x).toBe(512);
      expect(corner.y).toBe(512);
    });

    it("should convert pixel to normalized coordinates", () => {
      const normalized = regionManager.pixelToNormalized(256, 256);
      expect(normalized.x).toBe(0.5);
      expect(normalized.y).toBe(0.5);

      const corner = regionManager.pixelToNormalized(512, 512);
      expect(corner.x).toBe(1);
      expect(corner.y).toBe(1);
    });

    it("should clamp normalized coordinates", () => {
      const clamped = regionManager.clampNormalized(-0.5, 1.5);
      expect(clamped.x).toBe(0);
      expect(clamped.y).toBe(1);

      const valid = regionManager.clampNormalized(0.3, 0.7);
      expect(valid.x).toBe(0.3);
      expect(valid.y).toBe(0.7);
    });

    it("should clamp pixel coordinates", () => {
      const clamped = regionManager.clampPixel(-100, 600);
      expect(clamped.x).toBe(0);
      expect(clamped.y).toBe(512);

      const valid = regionManager.clampPixel(200, 300);
      expect(valid.x).toBe(200);
      expect(valid.y).toBe(300);
    });

    it("should validate normalized coordinates", () => {
      expect(regionManager.validateNormalizedCoordinates(0.5, 0.5)).toBe(true);
      expect(regionManager.validateNormalizedCoordinates(0, 1)).toBe(true);
      expect(regionManager.validateNormalizedCoordinates(-0.1, 0.5)).toBe(
        false
      );
      expect(regionManager.validateNormalizedCoordinates(0.5, 1.1)).toBe(false);
    });

    it("should validate pixel coordinates", () => {
      expect(regionManager.validatePixelCoordinates(256, 256)).toBe(true);
      expect(regionManager.validatePixelCoordinates(0, 512)).toBe(true);
      expect(regionManager.validatePixelCoordinates(-1, 256)).toBe(false);
      expect(regionManager.validatePixelCoordinates(256, 600)).toBe(false);
    });
  });

  describe("Aspect Ratio Updates", () => {
    it("should update aspect ratio and recalculate dimensions", () => {
      regionManager.updateAspectRatio("16:9");

      const dimensions = regionManager.getCanvasDimensions();
      expect(dimensions.width).toBe(512);
      expect(dimensions.height).toBe(288);
      expect(dimensions.aspectRatio).toBe("16:9");
    });

    it("should maintain region proportions after aspect ratio change", () => {
      const centerBoundsSquare = regionManager.getRegionBounds("center");

      regionManager.updateAspectRatio("16:9");
      const centerBoundsWide = regionManager.getRegionBounds("center");

      // Normalized bounds should remain the same
      expect(centerBoundsWide).toEqual(centerBoundsSquare);

      // But pixel bounds should change
      const pixelBoundsWide = regionManager.getPixelBounds("center");
      expect(pixelBoundsWide.height).toBeLessThan(pixelBoundsWide.width);
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle boundary coordinates correctly", () => {
      // Test exact boundary points
      expect(regionManager.validateNormalizedCoordinates(0, 0)).toBe(true);
      expect(regionManager.validateNormalizedCoordinates(1, 1)).toBe(true);
      expect(regionManager.validatePixelCoordinates(0, 0)).toBe(true);
      expect(regionManager.validatePixelCoordinates(512, 512)).toBe(true);
    });

    it("should handle floating point precision", () => {
      const precisePoint = regionManager.normalizedToPixel(
        0.123456789,
        0.987654321
      );
      const backConverted = regionManager.pixelToNormalized(
        precisePoint.x,
        precisePoint.y
      );

      expect(backConverted.x).toBeCloseTo(0.123456789, 5);
      expect(backConverted.y).toBeCloseTo(0.987654321, 5);
    });

    it("should handle empty custom regions list", () => {
      const customRegions = regionManager.getCustomRegions();
      expect(customRegions).toHaveLength(0);

      const allRegions = regionManager.getAllRegions();
      expect(allRegions).toHaveLength(10); // Only standard regions
    });

    it("should handle region removal of non-existent custom region", () => {
      const removed = regionManager.removeCustomRegion("nonexistent");
      expect(removed).toBe(false);
    });
  });
});
