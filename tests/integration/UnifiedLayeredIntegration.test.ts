/**
 * Integration tests for Unified Layered SVG Types with existing systems
 */

import { describe, it, expect } from "vitest";
import {
  AspectRatioManager,
  AspectRatio,
} from "../../server/services/AspectRatioManager";
import {
  UnifiedLayeredSVGDocument,
  UnifiedLayeredSVGDocumentSchema,
  UnifiedCanvas,
  UnifiedLayer,
  UnifiedPath,
  REGION_BOUNDS,
  ANCHOR_OFFSETS,
  isUnifiedLayeredDocument,
} from "../../server/types/unified-layered";

describe("Unified Layered SVG Integration", () => {
  describe("AspectRatioManager Integration", () => {
    it("should create unified canvas from AspectRatioManager", () => {
      const aspectRatio: AspectRatio = "1:1";
      const config = AspectRatioManager.getConfig(aspectRatio);
      const dimensions = AspectRatioManager.getCanvasDimensions(aspectRatio);

      const unifiedCanvas: UnifiedCanvas = {
        width: dimensions.width,
        height: dimensions.height,
        aspectRatio: dimensions.aspectRatio,
      };

      expect(unifiedCanvas.width).toBe(512);
      expect(unifiedCanvas.height).toBe(512);
      expect(unifiedCanvas.aspectRatio).toBe("1:1");
    });

    it("should work with different aspect ratios", () => {
      const aspectRatios: AspectRatio[] = [
        "1:1",
        "4:3",
        "16:9",
        "3:2",
        "2:3",
        "9:16",
      ];

      aspectRatios.forEach((ratio) => {
        const dimensions = AspectRatioManager.getCanvasDimensions(ratio);
        const unifiedCanvas: UnifiedCanvas = {
          width: dimensions.width,
          height: dimensions.height,
          aspectRatio: dimensions.aspectRatio,
        };

        expect(AspectRatioManager.isValidRatio(unifiedCanvas.aspectRatio)).toBe(
          true
        );
        expect(unifiedCanvas.width).toBeGreaterThan(0);
        expect(unifiedCanvas.height).toBeGreaterThan(0);
      });
    });

    it("should validate coordinates within canvas bounds", () => {
      const aspectRatio: AspectRatio = "1:1";
      const dimensions = AspectRatioManager.getCanvasDimensions(aspectRatio);

      // Test coordinates within bounds
      expect(
        AspectRatioManager.validateCoordinates(256, 256, aspectRatio)
      ).toBe(true);
      expect(AspectRatioManager.validateCoordinates(0, 0, aspectRatio)).toBe(
        true
      );
      expect(
        AspectRatioManager.validateCoordinates(512, 512, aspectRatio)
      ).toBe(true);

      // Test coordinates outside bounds
      expect(AspectRatioManager.validateCoordinates(-1, 256, aspectRatio)).toBe(
        false
      );
      expect(
        AspectRatioManager.validateCoordinates(256, 600, aspectRatio)
      ).toBe(false);
    });
  });

  describe("Complete Document Creation", () => {
    it("should create a valid unified document with layout language", () => {
      const aspectRatio: AspectRatio = "1:1";
      const dimensions = AspectRatioManager.getCanvasDimensions(aspectRatio);

      // Create a simple house using unified layered format
      const document: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: {
          width: dimensions.width,
          height: dimensions.height,
          aspectRatio: dimensions.aspectRatio,
        },
        layout: {
          globalAnchor: "center",
        },
        layers: [
          {
            id: "structure",
            label: "House Structure",
            layout: {
              region: "center",
              anchor: "bottom_center",
            },
            paths: [
              {
                id: "walls",
                style: {
                  fill: "#E5E7EB",
                  stroke: "#111827",
                  strokeWidth: 4,
                },
                commands: [
                  { cmd: "M", coords: [200, 300] },
                  { cmd: "L", coords: [400, 300] },
                  { cmd: "L", coords: [400, 450] },
                  { cmd: "L", coords: [200, 450] },
                  { cmd: "Z", coords: [] },
                ],
                layout: {
                  region: "center",
                  anchor: "center",
                },
              },
            ],
          },
          {
            id: "roof",
            label: "Roof",
            layout: {
              region: "top_center",
              anchor: "bottom_center",
            },
            paths: [
              {
                id: "roof_triangle",
                style: {
                  fill: "#F87171",
                  stroke: "#111827",
                  strokeWidth: 4,
                },
                commands: [
                  { cmd: "M", coords: [200, 300] },
                  { cmd: "L", coords: [300, 200] },
                  { cmd: "L", coords: [400, 300] },
                  { cmd: "Z", coords: [] },
                ],
              },
            ],
          },
        ],
      };

      // Validate the document
      const validation = UnifiedLayeredSVGDocumentSchema.safeParse(document);
      expect(validation.success).toBe(true);
      expect(isUnifiedLayeredDocument(document)).toBe(true);

      // Verify structure
      expect(document.layers).toHaveLength(2);
      expect(document.layers[0].paths).toHaveLength(1);
      expect(document.layers[1].paths).toHaveLength(1);

      // Verify coordinates are within bounds
      document.layers.forEach((layer) => {
        layer.paths.forEach((path) => {
          path.commands.forEach((command) => {
            if (command.cmd !== "Z") {
              for (let i = 0; i < command.coords.length; i += 2) {
                const x = command.coords[i];
                const y = command.coords[i + 1];
                expect(
                  AspectRatioManager.validateCoordinates(x, y, aspectRatio)
                ).toBe(true);
              }
            }
          });
        });
      });
    });

    it("should handle complex layouts with repetition", () => {
      const document: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: {
          width: 512,
          height: 512,
          aspectRatio: "1:1",
        },
        layers: [
          {
            id: "pattern",
            label: "Repeated Pattern",
            paths: [
              {
                id: "dots",
                style: {
                  fill: "#3B82F6",
                  stroke: "none",
                },
                commands: [
                  { cmd: "M", coords: [50, 50] },
                  { cmd: "L", coords: [60, 50] },
                  { cmd: "L", coords: [60, 60] },
                  { cmd: "L", coords: [50, 60] },
                  { cmd: "Z", coords: [] },
                ],
                layout: {
                  region: "center",
                  anchor: "center",
                  repeat: {
                    type: "grid",
                    count: [3, 3],
                    spacing: 0.2,
                  },
                },
              },
            ],
          },
        ],
      };

      const validation = UnifiedLayeredSVGDocumentSchema.safeParse(document);
      expect(validation.success).toBe(true);
      expect(document.layers[0].paths[0].layout?.repeat?.type).toBe("grid");
      expect(document.layers[0].paths[0].layout?.repeat?.count).toEqual([3, 3]);
    });
  });

  describe("Region and Anchor Calculations", () => {
    it("should provide correct region bounds for layout calculations", () => {
      // Test that region bounds are normalized (0-1)
      Object.entries(REGION_BOUNDS).forEach(([regionName, bounds]) => {
        expect(bounds.x).toBeGreaterThanOrEqual(0);
        expect(bounds.x).toBeLessThanOrEqual(1);
        expect(bounds.y).toBeGreaterThanOrEqual(0);
        expect(bounds.y).toBeLessThanOrEqual(1);
        expect(bounds.width).toBeGreaterThan(0);
        expect(bounds.width).toBeLessThanOrEqual(1);
        expect(bounds.height).toBeGreaterThan(0);
        expect(bounds.height).toBeLessThanOrEqual(1);

        // Ensure bounds don't exceed canvas
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(1.01); // Allow small floating point errors
        expect(bounds.y + bounds.height).toBeLessThanOrEqual(1.01);
      });
    });

    it("should provide correct anchor offsets", () => {
      // Test that anchor offsets are normalized (0-1)
      Object.entries(ANCHOR_OFFSETS).forEach(([anchorName, offset]) => {
        expect(offset.x).toBeGreaterThanOrEqual(0);
        expect(offset.x).toBeLessThanOrEqual(1);
        expect(offset.y).toBeGreaterThanOrEqual(0);
        expect(offset.y).toBeLessThanOrEqual(1);
      });

      // Test specific anchor positions
      expect(ANCHOR_OFFSETS.center).toEqual({ x: 0.5, y: 0.5 });
      expect(ANCHOR_OFFSETS.top_left).toEqual({ x: 0, y: 0 });
      expect(ANCHOR_OFFSETS.bottom_right).toEqual({ x: 1, y: 1 });
    });

    it("should calculate pixel coordinates from region and anchor", () => {
      const aspectRatio: AspectRatio = "1:1";
      const dimensions = AspectRatioManager.getCanvasDimensions(aspectRatio);

      // Test center region with center anchor
      const centerRegion = REGION_BOUNDS.center;
      const centerAnchor = ANCHOR_OFFSETS.center;

      const pixelX =
        (centerRegion.x + centerRegion.width * centerAnchor.x) *
        dimensions.width;
      const pixelY =
        (centerRegion.y + centerRegion.height * centerAnchor.y) *
        dimensions.height;

      // Should be approximately in the center of the canvas
      expect(pixelX).toBeCloseTo(256, 1);
      expect(pixelY).toBeCloseTo(256, 1);

      // Verify coordinates are within bounds
      expect(
        AspectRatioManager.validateCoordinates(pixelX, pixelY, aspectRatio)
      ).toBe(true);
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle empty coordinate arrays for Z commands", () => {
      const path: UnifiedPath = {
        id: "test_path",
        style: { fill: "#FF0000" },
        commands: [
          { cmd: "M", coords: [100, 100] },
          { cmd: "L", coords: [200, 200] },
          { cmd: "Z", coords: [] },
        ],
      };

      expect(() => {
        const validation = UnifiedLayeredSVGDocumentSchema.safeParse({
          version: "unified-layered-1.0",
          canvas: { width: 512, height: 512, aspectRatio: "1:1" },
          layers: [
            {
              id: "test_layer",
              label: "Test Layer",
              paths: [path],
            },
          ],
        });
        expect(validation.success).toBe(true);
      }).not.toThrow();
    });

    it("should handle boundary coordinate values", () => {
      const aspectRatio: AspectRatio = "1:1";
      const dimensions = AspectRatioManager.getCanvasDimensions(aspectRatio);

      const boundaryPath: UnifiedPath = {
        id: "boundary_path",
        style: { fill: "none", stroke: "#000000" },
        commands: [
          { cmd: "M", coords: [0, 0] },
          { cmd: "L", coords: [dimensions.width, 0] },
          { cmd: "L", coords: [dimensions.width, dimensions.height] },
          { cmd: "L", coords: [0, dimensions.height] },
          { cmd: "Z", coords: [] },
        ],
      };

      // All coordinates should be valid
      boundaryPath.commands.forEach((command) => {
        if (command.cmd !== "Z") {
          for (let i = 0; i < command.coords.length; i += 2) {
            const x = command.coords[i];
            const y = command.coords[i + 1];
            expect(
              AspectRatioManager.validateCoordinates(x, y, aspectRatio)
            ).toBe(true);
          }
        }
      });
    });

    it("should handle custom regions in layout", () => {
      const document: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: {
          width: 512,
          height: 512,
          aspectRatio: "1:1",
        },
        layout: {
          regions: [
            {
              name: "custom_header",
              bounds: { x: 0, y: 0, width: 1, height: 0.2 },
            },
            {
              name: "custom_footer",
              bounds: { x: 0, y: 0.8, width: 1, height: 0.2 },
            },
          ],
        },
        layers: [
          {
            id: "header",
            label: "Header Content",
            paths: [
              {
                id: "header_bg",
                style: { fill: "#F3F4F6" },
                commands: [
                  { cmd: "M", coords: [0, 0] },
                  { cmd: "L", coords: [512, 0] },
                  { cmd: "L", coords: [512, 100] },
                  { cmd: "L", coords: [0, 100] },
                  { cmd: "Z", coords: [] },
                ],
                layout: {
                  region: "custom_header",
                  anchor: "center",
                },
              },
            ],
          },
        ],
      };

      const validation = UnifiedLayeredSVGDocumentSchema.safeParse(document);
      expect(validation.success).toBe(true);
      expect(document.layout?.regions).toHaveLength(2);
      expect(document.layout?.regions?.[0].name).toBe("custom_header");
    });
  });
});
