/**
 * Unit tests for Unified Layered SVG Types and Schemas
 */

import { describe, it, expect } from "vitest";
import {
  // Types
  UnifiedLayeredSVGDocument,
  UnifiedPath,
  UnifiedLayer,
  PathCommand,
  PathStyle,
  LayoutSpecification,
  RegionName,
  AnchorPoint,
  // Schemas
  UnifiedLayeredSVGDocumentSchema,
  UnifiedPathSchema,
  UnifiedLayerSchema,
  PathCommandSchema,
  PathStyleSchema,
  LayoutSpecificationSchema,
  RegionNameSchema,
  AnchorPointSchema,
  AspectRatioSchema,
  SizeSpecSchema,
  RepetitionSpecSchema,
  // Utilities
  isRegionName,
  isAnchorPoint,
  isUnifiedLayeredDocument,
  isValidPathCommand,
  REGION_BOUNDS,
  ANCHOR_OFFSETS,
  COORDINATE_BOUNDS,
  DEFAULT_LAYOUT_SPECIFICATION,
} from "../../server/types/unified-layered";

describe("Unified Layered SVG Types", () => {
  describe("Basic Type Validation", () => {
    it("should validate RegionName enum", () => {
      const validRegions: RegionName[] = [
        "top_left",
        "top_center",
        "top_right",
        "middle_left",
        "center",
        "middle_right",
        "bottom_left",
        "bottom_center",
        "bottom_right",
        "full_canvas",
      ];

      validRegions.forEach((region) => {
        expect(RegionNameSchema.safeParse(region).success).toBe(true);
        expect(isRegionName(region)).toBe(true);
      });

      expect(RegionNameSchema.safeParse("invalid_region").success).toBe(false);
      expect(isRegionName("invalid_region")).toBe(false);
    });

    it("should validate AnchorPoint enum", () => {
      const validAnchors: AnchorPoint[] = [
        "center",
        "top_left",
        "top_right",
        "bottom_left",
        "bottom_right",
        "top_center",
        "bottom_center",
        "middle_left",
        "middle_right",
      ];

      validAnchors.forEach((anchor) => {
        expect(AnchorPointSchema.safeParse(anchor).success).toBe(true);
        expect(isAnchorPoint(anchor)).toBe(true);
      });

      expect(AnchorPointSchema.safeParse("invalid_anchor").success).toBe(false);
      expect(isAnchorPoint("invalid_anchor")).toBe(false);
    });

    it("should validate AspectRatio enum", () => {
      const validRatios = ["1:1", "4:3", "16:9", "3:2", "2:3", "9:16"];

      validRatios.forEach((ratio) => {
        expect(AspectRatioSchema.safeParse(ratio).success).toBe(true);
      });

      expect(AspectRatioSchema.safeParse("5:4").success).toBe(false);
    });
  });

  describe("PathCommand Validation", () => {
    it("should validate Move (M) commands", () => {
      const validMove: PathCommand = { cmd: "M", coords: [100, 200] };
      expect(PathCommandSchema.safeParse(validMove).success).toBe(true);
      expect(isValidPathCommand("M", [100, 200])).toBe(true);

      // Invalid coordinate count
      expect(
        PathCommandSchema.safeParse({ cmd: "M", coords: [100] }).success
      ).toBe(false);
      expect(isValidPathCommand("M", [100])).toBe(false);
    });

    it("should validate Line (L) commands", () => {
      const validLine: PathCommand = { cmd: "L", coords: [150, 250] };
      expect(PathCommandSchema.safeParse(validLine).success).toBe(true);
      expect(isValidPathCommand("L", [150, 250])).toBe(true);
    });

    it("should validate Curve (C) commands", () => {
      const validCurve: PathCommand = {
        cmd: "C",
        coords: [100, 100, 200, 200, 300, 300],
      };
      expect(PathCommandSchema.safeParse(validCurve).success).toBe(true);
      expect(isValidPathCommand("C", [100, 100, 200, 200, 300, 300])).toBe(
        true
      );

      // Invalid coordinate count
      expect(
        PathCommandSchema.safeParse({ cmd: "C", coords: [100, 100, 200, 200] })
          .success
      ).toBe(false);
    });

    it("should validate Quadratic (Q) commands", () => {
      const validQuad: PathCommand = { cmd: "Q", coords: [100, 100, 200, 200] };
      expect(PathCommandSchema.safeParse(validQuad).success).toBe(true);
      expect(isValidPathCommand("Q", [100, 100, 200, 200])).toBe(true);
    });

    it("should validate Close (Z) commands", () => {
      const validClose: PathCommand = { cmd: "Z", coords: [] };
      expect(PathCommandSchema.safeParse(validClose).success).toBe(true);
      expect(isValidPathCommand("Z", [])).toBe(true);

      // Z command should have no coordinates
      expect(
        PathCommandSchema.safeParse({ cmd: "Z", coords: [100, 200] }).success
      ).toBe(false);
    });
  });

  describe("PathStyle Validation", () => {
    it("should validate complete path style", () => {
      const validStyle: PathStyle = {
        fill: "#FF0000",
        stroke: "#000000",
        strokeWidth: 2,
        strokeLinecap: "round",
        strokeLinejoin: "miter",
        opacity: 0.8,
      };

      expect(PathStyleSchema.safeParse(validStyle).success).toBe(true);
    });

    it("should validate minimal path style", () => {
      const minimalStyle: PathStyle = {};
      expect(PathStyleSchema.safeParse(minimalStyle).success).toBe(true);
    });

    it("should reject invalid stroke properties", () => {
      expect(PathStyleSchema.safeParse({ strokeWidth: -1 }).success).toBe(
        false
      );
      expect(PathStyleSchema.safeParse({ opacity: 1.5 }).success).toBe(false);
      expect(
        PathStyleSchema.safeParse({ strokeLinecap: "invalid" }).success
      ).toBe(false);
    });
  });

  describe("LayoutSpecification Validation", () => {
    it("should validate complete layout specification", () => {
      const validLayout: LayoutSpecification = {
        region: "center",
        anchor: "top_left",
        offset: [0.5, -0.3],
        zIndex: 10,
      };

      expect(LayoutSpecificationSchema.safeParse(validLayout).success).toBe(
        true
      );
    });

    it("should validate custom region names", () => {
      const customRegionLayout: LayoutSpecification = {
        region: "custom_header_area",
        anchor: "center",
      };

      expect(
        LayoutSpecificationSchema.safeParse(customRegionLayout).success
      ).toBe(true);
    });

    it("should reject invalid offset values", () => {
      expect(
        LayoutSpecificationSchema.safeParse({ offset: [2, 0] }).success
      ).toBe(false);
      expect(
        LayoutSpecificationSchema.safeParse({ offset: [0, -2] }).success
      ).toBe(false);
    });
  });

  describe("SizeSpec Validation", () => {
    it("should validate absolute size", () => {
      const absoluteSize = { absolute: { width: 100, height: 200 } };
      expect(SizeSpecSchema.safeParse(absoluteSize).success).toBe(true);
    });

    it("should validate relative size", () => {
      const relativeSize = { relative: 0.5 };
      expect(SizeSpecSchema.safeParse(relativeSize).success).toBe(true);
    });

    it("should validate aspect constrained size", () => {
      const aspectSize = { aspect_constrained: { width: 100, aspect: 1.5 } };
      expect(SizeSpecSchema.safeParse(aspectSize).success).toBe(true);
    });

    it("should reject multiple size specifications", () => {
      const multipleSpecs = {
        absolute: { width: 100, height: 200 },
        relative: 0.5,
      };
      expect(SizeSpecSchema.safeParse(multipleSpecs).success).toBe(false);
    });

    it("should reject empty size specification", () => {
      expect(SizeSpecSchema.safeParse({}).success).toBe(false);
    });
  });

  describe("RepetitionSpec Validation", () => {
    it("should validate grid repetition with single count", () => {
      const gridRepeat = { type: "grid" as const, count: 5 };
      expect(RepetitionSpecSchema.safeParse(gridRepeat).success).toBe(true);
    });

    it("should validate grid repetition with array count", () => {
      const gridRepeat = {
        type: "grid" as const,
        count: [3, 4] as [number, number],
      };
      expect(RepetitionSpecSchema.safeParse(gridRepeat).success).toBe(true);
    });

    it("should validate radial repetition", () => {
      const radialRepeat = { type: "radial" as const, count: 8, radius: 100 };
      expect(RepetitionSpecSchema.safeParse(radialRepeat).success).toBe(true);
    });

    it("should reject invalid repetition types", () => {
      expect(
        RepetitionSpecSchema.safeParse({ type: "invalid", count: 5 }).success
      ).toBe(false);
    });
  });

  describe("UnifiedPath Validation", () => {
    it("should validate complete unified path", () => {
      const validPath: UnifiedPath = {
        id: "test_path",
        style: { fill: "#FF0000", stroke: "#000000" },
        commands: [
          { cmd: "M", coords: [100, 100] },
          { cmd: "L", coords: [200, 200] },
          { cmd: "Z", coords: [] },
        ],
        layout: {
          region: "center",
          anchor: "top_left",
        },
      };

      expect(UnifiedPathSchema.safeParse(validPath).success).toBe(true);
    });

    it("should require at least one path command", () => {
      const invalidPath = {
        id: "test_path",
        style: {},
        commands: [],
      };

      expect(UnifiedPathSchema.safeParse(invalidPath).success).toBe(false);
    });

    it("should require non-empty id", () => {
      const invalidPath = {
        id: "",
        style: {},
        commands: [{ cmd: "M", coords: [0, 0] }],
      };

      expect(UnifiedPathSchema.safeParse(invalidPath).success).toBe(false);
    });
  });

  describe("UnifiedLayer Validation", () => {
    it("should validate complete unified layer", () => {
      const validLayer: UnifiedLayer = {
        id: "test_layer",
        label: "Test Layer",
        layout: { region: "center" },
        paths: [
          {
            id: "path1",
            style: { fill: "#FF0000" },
            commands: [{ cmd: "M", coords: [0, 0] }],
          },
        ],
      };

      expect(UnifiedLayerSchema.safeParse(validLayer).success).toBe(true);
    });

    it("should require at least one path", () => {
      const invalidLayer = {
        id: "test_layer",
        label: "Test Layer",
        paths: [],
      };

      expect(UnifiedLayerSchema.safeParse(invalidLayer).success).toBe(false);
    });
  });

  describe("UnifiedLayeredSVGDocument Validation", () => {
    it("should validate complete document", () => {
      const validDocument: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: {
          width: 512,
          height: 512,
          aspectRatio: "1:1",
        },
        layout: {
          globalAnchor: "center",
        },
        layers: [
          {
            id: "layer1",
            label: "Layer 1",
            paths: [
              {
                id: "path1",
                style: { fill: "#FF0000" },
                commands: [{ cmd: "M", coords: [0, 0] }],
              },
            ],
          },
        ],
      };

      expect(
        UnifiedLayeredSVGDocumentSchema.safeParse(validDocument).success
      ).toBe(true);
      expect(isUnifiedLayeredDocument(validDocument)).toBe(true);
    });

    it("should require correct version", () => {
      const invalidDocument = {
        version: "wrong-version",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers: [
          {
            id: "layer1",
            label: "Layer 1",
            paths: [
              {
                id: "path1",
                style: {},
                commands: [{ cmd: "M", coords: [0, 0] }],
              },
            ],
          },
        ],
      };

      expect(
        UnifiedLayeredSVGDocumentSchema.safeParse(invalidDocument).success
      ).toBe(false);
    });

    it("should require at least one layer", () => {
      const invalidDocument = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers: [],
      };

      expect(
        UnifiedLayeredSVGDocumentSchema.safeParse(invalidDocument).success
      ).toBe(false);
    });
  });

  describe("Constants and Utilities", () => {
    it("should have correct region bounds", () => {
      expect(REGION_BOUNDS.center).toEqual({
        x: 0.33,
        y: 0.33,
        width: 0.34,
        height: 0.34,
      });
      expect(REGION_BOUNDS.top_left).toEqual({
        x: 0,
        y: 0,
        width: 0.33,
        height: 0.33,
      });
      expect(REGION_BOUNDS.full_canvas).toEqual({
        x: 0,
        y: 0,
        width: 1,
        height: 1,
      });
    });

    it("should have correct anchor offsets", () => {
      expect(ANCHOR_OFFSETS.center).toEqual({ x: 0.5, y: 0.5 });
      expect(ANCHOR_OFFSETS.top_left).toEqual({ x: 0, y: 0 });
      expect(ANCHOR_OFFSETS.bottom_right).toEqual({ x: 1, y: 1 });
    });

    it("should have correct coordinate bounds", () => {
      expect(COORDINATE_BOUNDS.MIN).toBe(0);
      expect(COORDINATE_BOUNDS.MAX).toBe(512);
      expect(COORDINATE_BOUNDS.PRECISION).toBe(2);
    });

    it("should have correct default layout specification", () => {
      expect(DEFAULT_LAYOUT_SPECIFICATION).toEqual({
        region: "center",
        anchor: "center",
        offset: [0, 0],
      });
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle coordinate precision", () => {
      const preciseCoords: PathCommand = {
        cmd: "M",
        coords: [100.123456, 200.987654],
      };
      expect(PathCommandSchema.safeParse(preciseCoords).success).toBe(true);
    });

    it("should handle boundary coordinate values", () => {
      const boundaryCoords: PathCommand = { cmd: "M", coords: [0, 512] };
      expect(PathCommandSchema.safeParse(boundaryCoords).success).toBe(true);
    });

    it("should handle complex path sequences", () => {
      const complexPath: UnifiedPath = {
        id: "complex_path",
        style: { fill: "none", stroke: "#000000", strokeWidth: 2 },
        commands: [
          { cmd: "M", coords: [100, 100] },
          { cmd: "C", coords: [100, 50, 200, 50, 200, 100] },
          { cmd: "Q", coords: [250, 100, 250, 150] },
          { cmd: "L", coords: [100, 150] },
          { cmd: "Z", coords: [] },
        ],
      };

      expect(UnifiedPathSchema.safeParse(complexPath).success).toBe(true);
    });

    it("should handle nested layout specifications", () => {
      const nestedLayout: UnifiedLayer = {
        id: "nested_layer",
        label: "Nested Layout Layer",
        layout: { region: "center", anchor: "center" },
        paths: [
          {
            id: "nested_path",
            style: { fill: "#FF0000" },
            commands: [{ cmd: "M", coords: [0, 0] }],
            layout: {
              region: "top_left",
              anchor: "bottom_right",
              offset: [0.1, -0.1],
            },
          },
        ],
      };

      expect(UnifiedLayerSchema.safeParse(nestedLayout).success).toBe(true);
    });
  });
});
