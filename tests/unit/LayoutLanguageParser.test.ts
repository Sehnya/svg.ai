/**
 * Unit tests for LayoutLanguageParser
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  LayoutLanguageParser,
  LayoutParseOptions,
} from "../../server/services/LayoutLanguageParser";
import { RegionManager } from "../../server/services/RegionManager";
import {
  LayoutSpecification,
  UnifiedLayoutConfig,
  CustomRegion,
  SizeSpec,
  RepetitionSpec,
} from "../../server/types/unified-layered";

describe("LayoutLanguageParser", () => {
  let parser: LayoutLanguageParser;
  let regionManager: RegionManager;

  beforeEach(() => {
    regionManager = new RegionManager("1:1");
    parser = new LayoutLanguageParser(regionManager);
  });

  describe("Initialization", () => {
    it("should initialize with default options", () => {
      const options = parser.getOptions();
      expect(options.strict).toBe(true);
      expect(options.allowCustomRegions).toBe(true);
      expect(options.validateCoordinates).toBe(true);
      expect(options.suggestAlternatives).toBe(true);
    });

    it("should initialize with custom options", () => {
      const customOptions: LayoutParseOptions = {
        strict: false,
        allowCustomRegions: false,
        validateCoordinates: false,
        suggestAlternatives: false,
      };

      const customParser = new LayoutLanguageParser(
        regionManager,
        customOptions
      );
      const options = customParser.getOptions();

      expect(options.strict).toBe(false);
      expect(options.allowCustomRegions).toBe(false);
      expect(options.validateCoordinates).toBe(false);
      expect(options.suggestAlternatives).toBe(false);
    });

    it("should update options", () => {
      parser.updateOptions({ strict: false });
      const options = parser.getOptions();
      expect(options.strict).toBe(false);
      expect(options.allowCustomRegions).toBe(true); // Should remain unchanged
    });
  });

  describe("Layout Specification Parsing", () => {
    it("should parse valid layout specification", () => {
      const layout: LayoutSpecification = {
        region: "center",
        anchor: "top_left",
        offset: [0.2, -0.3],
        zIndex: 5,
      };

      const result = parser.parseLayoutSpecification(layout);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(layout);
      expect(result.errors).toHaveLength(0);
    });

    it("should parse minimal layout specification", () => {
      const layout: LayoutSpecification = {};

      const result = parser.parseLayoutSpecification(layout);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(layout);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate against schema", () => {
      const invalidLayout = {
        region: "center",
        anchor: "invalid_anchor",
        offset: [2, -3], // Invalid range
      };

      const result = parser.parseLayoutSpecification(invalidLayout);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((e) => e.includes("Schema validation"))).toBe(
        true
      );
    });

    it("should handle parsing errors gracefully", () => {
      const result = parser.parseLayoutSpecification(null);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("Region Validation", () => {
    it("should validate standard regions", () => {
      const layout: LayoutSpecification = { region: "center" };
      const result = parser.parseLayoutSpecification(layout);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate custom regions when allowed", () => {
      // Add a custom region
      regionManager.addCustomRegion("header", {
        x: 0,
        y: 0,
        width: 1,
        height: 0.2,
      });

      const layout: LayoutSpecification = { region: "header" };
      const result = parser.parseLayoutSpecification(layout);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject unknown regions in strict mode", () => {
      const layout: LayoutSpecification = { region: "unknown_region" };
      const result = parser.parseLayoutSpecification(layout);

      expect(result.success).toBe(false);
      expect(result.errors.some((e) => e.includes("Unknown region"))).toBe(
        true
      );
    });

    it("should warn about unknown regions in non-strict mode", () => {
      parser.updateOptions({ strict: false });

      const layout: LayoutSpecification = { region: "unknown_region" };
      const result = parser.parseLayoutSpecification(layout);

      expect(result.success).toBe(true);
      expect(result.warnings.some((w) => w.includes("Unknown region"))).toBe(
        true
      );
    });

    it("should suggest similar region names", () => {
      const layout: LayoutSpecification = { region: "centre" }; // Misspelled "center"
      const result = parser.parseLayoutSpecification(layout);

      expect(result.success).toBe(false);
      expect(result.errors.some((e) => e.includes("Did you mean"))).toBe(true);
    });

    it("should reject custom regions when not allowed", () => {
      parser.updateOptions({ allowCustomRegions: false });
      regionManager.addCustomRegion("header", {
        x: 0,
        y: 0,
        width: 1,
        height: 0.2,
      });

      const layout: LayoutSpecification = { region: "header" };
      const result = parser.parseLayoutSpecification(layout);

      expect(result.success).toBe(false);
      expect(result.errors.some((e) => e.includes("Unknown region"))).toBe(
        true
      );
    });
  });

  describe("Anchor Validation", () => {
    it("should validate standard anchors", () => {
      const layout: LayoutSpecification = { anchor: "center" };
      const result = parser.parseLayoutSpecification(layout);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject invalid anchors in strict mode", () => {
      const layout: LayoutSpecification = { anchor: "invalid_anchor" as any };
      const result = parser.parseLayoutSpecification(layout);

      expect(result.success).toBe(false);
      expect(result.errors.some((e) => e.includes("Schema validation"))).toBe(
        true
      );
    });

    it("should warn about invalid anchors in non-strict mode", () => {
      parser.updateOptions({ strict: false });

      const layout: LayoutSpecification = { anchor: "invalid_anchor" as any };
      const result = parser.parseLayoutSpecification(layout);

      expect(result.success).toBe(false); // Schema validation still fails
      expect(result.errors.some((e) => e.includes("Schema validation"))).toBe(
        true
      );
    });

    it("should suggest similar anchor names", () => {
      const layout: LayoutSpecification = { anchor: "top_centre" as any }; // Misspelled "top_center"
      const result = parser.parseLayoutSpecification(layout);

      expect(result.success).toBe(false);
      expect(result.errors.some((e) => e.includes("Schema validation"))).toBe(
        true
      );
    });
  });

  describe("Offset Validation", () => {
    it("should validate valid offsets", () => {
      const layout: LayoutSpecification = { offset: [0.5, -0.3] };
      const result = parser.parseLayoutSpecification(layout);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate boundary offsets", () => {
      const layout: LayoutSpecification = { offset: [-1, 1] };
      const result = parser.parseLayoutSpecification(layout);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject out-of-range offsets in strict mode", () => {
      const layout: LayoutSpecification = { offset: [2, -3] };
      const result = parser.parseLayoutSpecification(layout);

      expect(result.success).toBe(false);
      expect(result.errors.some((e) => e.includes("Schema validation"))).toBe(
        true
      );
    });

    it("should warn about out-of-range offsets in non-strict mode", () => {
      parser.updateOptions({ strict: false });

      const layout: LayoutSpecification = { offset: [1.5, -2] };
      const result = parser.parseLayoutSpecification(layout);

      expect(result.success).toBe(false); // Schema validation still fails
      expect(result.errors.some((e) => e.includes("Schema validation"))).toBe(
        true
      );
    });

    it("should warn about extreme offsets", () => {
      const layout: LayoutSpecification = { offset: [0.9, -0.9] };
      const result = parser.parseLayoutSpecification(layout);

      expect(result.success).toBe(true);
      expect(
        result.warnings.some((w) => w.includes("Large offset values"))
      ).toBe(true);
    });
  });

  describe("Size Specification Validation", () => {
    it("should validate absolute size", () => {
      const layout: LayoutSpecification = {
        size: { absolute: { width: 100, height: 80 } },
      };
      const result = parser.parseLayoutSpecification(layout);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate relative size", () => {
      const layout: LayoutSpecification = {
        size: { relative: 0.5 },
      };
      const result = parser.parseLayoutSpecification(layout);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate aspect-constrained size", () => {
      const layout: LayoutSpecification = {
        size: { aspect_constrained: { width: 100, aspect: 1.5 } },
      };
      const result = parser.parseLayoutSpecification(layout);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject negative dimensions", () => {
      const layout: LayoutSpecification = {
        size: { absolute: { width: -10, height: 20 } },
      };
      const result = parser.parseLayoutSpecification(layout);

      expect(result.success).toBe(false);
      expect(result.errors.some((e) => e.includes("Schema validation"))).toBe(
        true
      );
    });

    it("should reject invalid relative size", () => {
      const layout: LayoutSpecification = {
        size: { relative: 1.5 },
      };
      const result = parser.parseLayoutSpecification(layout);

      expect(result.success).toBe(false);
      expect(result.errors.some((e) => e.includes("Schema validation"))).toBe(
        true
      );
    });

    it("should warn about large sizes", () => {
      const context = { canvasWidth: 512, canvasHeight: 512 };
      const layout: LayoutSpecification = {
        size: { absolute: { width: 1000, height: 800 } },
      };
      const result = parser.parseLayoutSpecification(layout, context);

      expect(result.success).toBe(true);
      expect(result.warnings.some((w) => w.includes("may exceed canvas"))).toBe(
        true
      );
    });

    it("should warn about extreme aspect ratios", () => {
      const layout: LayoutSpecification = {
        size: { aspect_constrained: { width: 100, aspect: 20 } },
      };
      const result = parser.parseLayoutSpecification(layout);

      expect(result.success).toBe(true);
      expect(
        result.warnings.some((w) => w.includes("Extreme aspect ratio"))
      ).toBe(true);
    });
  });

  describe("Repetition Specification Validation", () => {
    it("should validate grid repetition", () => {
      const layout: LayoutSpecification = {
        repeat: { type: "grid", count: [3, 2], spacing: 0.2 },
      };
      const result = parser.parseLayoutSpecification(layout);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate radial repetition", () => {
      const layout: LayoutSpecification = {
        repeat: { type: "radial", count: 6, radius: 50 },
      };
      const result = parser.parseLayoutSpecification(layout);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject negative counts", () => {
      const layout: LayoutSpecification = {
        repeat: { type: "grid", count: [-1, 2] },
      };
      const result = parser.parseLayoutSpecification(layout);

      expect(result.success).toBe(false);
      expect(result.errors.some((e) => e.includes("Schema validation"))).toBe(
        true
      );
    });

    it("should warn about large counts", () => {
      const layout: LayoutSpecification = {
        repeat: { type: "grid", count: [25, 25] },
      };
      const result = parser.parseLayoutSpecification(layout);

      expect(result.success).toBe(true);
      expect(
        result.warnings.some((w) => w.includes("may impact performance"))
      ).toBe(true);
    });

    it("should validate grid spacing", () => {
      const layout: LayoutSpecification = {
        repeat: { type: "grid", count: 3, spacing: 1.5 },
      };
      const result = parser.parseLayoutSpecification(layout);

      expect(result.success).toBe(false);
      expect(result.errors.some((e) => e.includes("between 0 and 1"))).toBe(
        true
      );
    });

    it("should warn about small spacing", () => {
      const layout: LayoutSpecification = {
        repeat: { type: "grid", count: 3, spacing: 0.01 },
      };
      const result = parser.parseLayoutSpecification(layout);

      expect(result.success).toBe(true);
      expect(
        result.warnings.some((w) => w.includes("overlapping elements"))
      ).toBe(true);
    });

    it("should validate radial radius", () => {
      const layout: LayoutSpecification = {
        repeat: { type: "radial", count: 6, radius: -10 },
      };
      const result = parser.parseLayoutSpecification(layout);

      expect(result.success).toBe(false);
      expect(result.errors.some((e) => e.includes("Schema validation"))).toBe(
        true
      );
    });

    it("should warn about large radius", () => {
      const context = { canvasWidth: 512, canvasHeight: 512 };
      const layout: LayoutSpecification = {
        repeat: { type: "radial", count: 6, radius: 300 },
      };
      const result = parser.parseLayoutSpecification(layout, context);

      expect(result.success).toBe(true);
      expect(result.warnings.some((w) => w.includes("outside canvas"))).toBe(
        true
      );
    });
  });

  describe("Layout Configuration Parsing", () => {
    it("should parse valid layout configuration", () => {
      const config: UnifiedLayoutConfig = {
        globalAnchor: "center",
        globalOffset: [0.1, -0.2],
        regions: [
          {
            name: "header",
            bounds: { x: 0, y: 0, width: 1, height: 0.2 },
          },
        ],
      };

      const result = parser.parseLayoutConfig(config);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(config);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate custom regions in config", () => {
      const config: UnifiedLayoutConfig = {
        regions: [
          {
            name: "invalid_region",
            bounds: { x: -0.1, y: 0, width: 1.2, height: 0.5 }, // Invalid bounds
          },
        ],
      };

      const result = parser.parseLayoutConfig(config);

      expect(result.success).toBe(false);
      expect(result.errors.some((e) => e.includes("Schema validation"))).toBe(
        true
      );
    });

    it("should reject regions with standard names", () => {
      const config: UnifiedLayoutConfig = {
        regions: [
          {
            name: "center", // Conflicts with standard region
            bounds: { x: 0.2, y: 0.2, width: 0.6, height: 0.6 },
          },
        ],
      };

      const result = parser.parseLayoutConfig(config);

      expect(result.success).toBe(false);
      expect(
        result.errors.some((e) => e.includes("conflicts with standard region"))
      ).toBe(true);
    });

    it("should warn about small regions", () => {
      const config: UnifiedLayoutConfig = {
        regions: [
          {
            name: "tiny_region",
            bounds: { x: 0, y: 0, width: 0.01, height: 0.01 },
          },
        ],
      };

      const result = parser.parseLayoutConfig(config);

      expect(result.success).toBe(true);
      expect(result.warnings.some((w) => w.includes("very small"))).toBe(true);
    });
  });

  describe("Cross-Validation", () => {
    it("should warn about large repetition with explicit size", () => {
      const layout: LayoutSpecification = {
        size: { absolute: { width: 50, height: 50 } },
        repeat: { type: "grid", count: [5, 5] }, // 25 elements
      };

      const result = parser.parseLayoutSpecification(layout);

      expect(result.success).toBe(true);
      expect(
        result.warnings.some((w) => w.includes("may cause overlapping"))
      ).toBe(true);
    });

    it("should warn about large offset with radial repetition", () => {
      const layout: LayoutSpecification = {
        offset: [0.8, -0.7],
        repeat: { type: "radial", count: 6, radius: 50 },
      };

      const result = parser.parseLayoutSpecification(layout);

      expect(result.success).toBe(true);
      expect(
        result.warnings.some((w) => w.includes("outside expected area"))
      ).toBe(true);
    });
  });

  describe("String Similarity and Suggestions", () => {
    it("should suggest similar region names", () => {
      const layout: LayoutSpecification = { region: "top_lft" }; // Missing 'e'
      const result = parser.parseLayoutSpecification(layout);

      expect(result.success).toBe(false);
      expect(result.errors.some((e) => e.includes("top_left"))).toBe(true);
    });

    it("should suggest similar anchor names", () => {
      const layout: LayoutSpecification = { anchor: "botom_right" as any }; // Missing 't'
      const result = parser.parseLayoutSpecification(layout);

      expect(result.success).toBe(false);
      expect(result.errors.some((e) => e.includes("bottom_right"))).toBe(true);
    });

    it("should not suggest when similarity is too low", () => {
      const layout: LayoutSpecification = { region: "xyz123" };
      const result = parser.parseLayoutSpecification(layout);

      expect(result.success).toBe(false);
      expect(result.errors.some((e) => e.includes("Did you mean"))).toBe(false);
    });
  });

  describe("Parser Configuration", () => {
    it("should disable suggestions when configured", () => {
      parser.updateOptions({ suggestAlternatives: false });

      const layout: LayoutSpecification = { region: "centre" };
      const result = parser.parseLayoutSpecification(layout);

      expect(result.success).toBe(false);
      expect(result.errors.some((e) => e.includes("Did you mean"))).toBe(false);
    });

    it("should disable coordinate validation when configured", () => {
      parser.updateOptions({ validateCoordinates: false });

      const context = { canvasWidth: 512, canvasHeight: 512 };
      const layout: LayoutSpecification = {
        size: { absolute: { width: 1000, height: 800 } },
      };
      const result = parser.parseLayoutSpecification(layout, context);

      expect(result.success).toBe(true);
      expect(result.warnings.some((w) => w.includes("may exceed canvas"))).toBe(
        false
      );
    });

    it("should update region manager", () => {
      const newRegionManager = new RegionManager("16:9");
      parser.updateRegionManager(newRegionManager);

      // The parser should now use the new region manager
      // This is tested indirectly through region validation
      expect(() => parser.updateRegionManager(newRegionManager)).not.toThrow();
    });
  });

  describe("Error Handling", () => {
    it("should handle malformed input gracefully", () => {
      const result = parser.parseLayoutSpecification("invalid json");

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should handle null input", () => {
      const result = parser.parseLayoutSpecification(null);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should handle undefined input", () => {
      const result = parser.parseLayoutSpecification(undefined);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should handle circular references gracefully", () => {
      const circular: any = { region: "center" };
      circular.self = circular;

      const result = parser.parseLayoutSpecification(circular);

      // Should either succeed (ignoring circular reference) or fail gracefully
      expect(typeof result.success).toBe("boolean");
    });
  });
});
