/**
 * Unit tests for SVGInterpreter
 */

import { describe, it, expect, beforeEach } from "vitest";
import { SVGInterpreter } from "../../server/services/SVGInterpreter";
import {
  UnifiedLayeredSVGDocument,
  UnifiedLayer,
  UnifiedPath,
  PathCommand,
  PathStyle,
} from "../../server/types/unified-layered";

describe("SVGInterpreter", () => {
  let interpreter: SVGInterpreter;

  beforeEach(() => {
    interpreter = new SVGInterpreter();
  });

  describe("convertToSVG", () => {
    it("should convert simple layered document to SVG", () => {
      const doc: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: {
          width: 512,
          height: 512,
          aspectRatio: "1:1",
        },
        layers: [
          {
            id: "base",
            label: "Base Layer",
            paths: [
              {
                id: "rect",
                style: {
                  fill: "#E5E7EB",
                  stroke: "#111827",
                  strokeWidth: 2,
                },
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

      const result = interpreter.convertToSVG(doc);

      expect(result.svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
      expect(result.svg).toContain('viewBox="0 0 512 512"');
      expect(result.svg).toContain('width="512" height="512"');
      expect(result.svg).toContain('<g id="base"');
      expect(result.svg).toContain('<path id="rect"');
      expect(result.svg).toContain('fill="#E5E7EB"');
      expect(result.svg).toContain('stroke="#111827"');
      expect(result.svg).toContain('stroke-width="2"');
      expect(result.svg).toContain(
        'd="M 100 100 L 200 100 L 200 200 L 100 200 Z"'
      );
    });

    it("should handle multiple layers", () => {
      const doc: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: {
          width: 512,
          height: 512,
          aspectRatio: "1:1",
        },
        layers: [
          {
            id: "background",
            label: "Background",
            paths: [
              {
                id: "bg_rect",
                style: { fill: "#F0F0F0" },
                commands: [
                  { cmd: "M", coords: [0, 0] },
                  { cmd: "L", coords: [512, 0] },
                  { cmd: "L", coords: [512, 512] },
                  { cmd: "L", coords: [0, 512] },
                  { cmd: "Z", coords: [] },
                ],
              },
            ],
          },
          {
            id: "foreground",
            label: "Foreground",
            paths: [
              {
                id: "fg_circle",
                style: { fill: "#FF0000" },
                commands: [
                  { cmd: "M", coords: [256, 156] },
                  { cmd: "C", coords: [311.23, 156, 356, 200.77, 356, 256] },
                  { cmd: "C", coords: [356, 311.23, 311.23, 356, 256, 356] },
                  { cmd: "C", coords: [200.77, 356, 156, 311.23, 156, 256] },
                  { cmd: "C", coords: [156, 200.77, 200.77, 156, 256, 156] },
                  { cmd: "Z", coords: [] },
                ],
              },
            ],
          },
        ],
      };

      const result = interpreter.convertToSVG(doc);

      expect(result.svg).toContain('<g id="background"');
      expect(result.svg).toContain('<g id="foreground"');
      expect(result.svg).toContain('id="bg_rect"');
      expect(result.svg).toContain('id="fg_circle"');
      expect(result.layerMetadata).toHaveLength(2);
      expect(result.layerMetadata[0].id).toBe("background");
      expect(result.layerMetadata[1].id).toBe("foreground");
    });

    it("should include layer metadata attributes", () => {
      const doc: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: {
          width: 512,
          height: 512,
          aspectRatio: "1:1",
        },
        layers: [
          {
            id: "test_layer",
            label: "Test Layer",
            layout: {
              region: "center",
              anchor: "top_left",
              zIndex: 5,
            },
            paths: [
              {
                id: "test_path",
                style: { fill: "#000000" },
                commands: [
                  { cmd: "M", coords: [0, 0] },
                  { cmd: "L", coords: [10, 10] },
                  { cmd: "Z", coords: [] },
                ],
              },
            ],
          },
        ],
      };

      const result = interpreter.convertToSVG(doc);

      expect(result.svg).toContain('data-label="Test Layer"');
      expect(result.svg).toContain('data-region="center"');
      expect(result.svg).toContain('data-anchor="top_left"');
      expect(result.svg).toContain('data-z-index="5"');
    });

    it("should handle path layout specifications", () => {
      const doc: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: {
          width: 512,
          height: 512,
          aspectRatio: "1:1",
        },
        layers: [
          {
            id: "layer",
            label: "Layer",
            paths: [
              {
                id: "path",
                style: { fill: "#000000" },
                commands: [
                  { cmd: "M", coords: [0, 0] },
                  { cmd: "L", coords: [10, 10] },
                  { cmd: "Z", coords: [] },
                ],
                layout: {
                  region: "top_right",
                  anchor: "center",
                  offset: [0.1, -0.2],
                },
              },
            ],
          },
        ],
      };

      const result = interpreter.convertToSVG(doc);

      expect(result.svg).toContain('data-region="top_right"');
      expect(result.svg).toContain('data-anchor="center"');
      expect(result.svg).toContain('data-offset="0.1,-0.2"');
    });

    it("should handle different aspect ratios", () => {
      const doc: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: {
          width: 512,
          height: 384,
          aspectRatio: "4:3",
        },
        layers: [
          {
            id: "layer",
            label: "Layer",
            paths: [
              {
                id: "path",
                style: { fill: "#000000" },
                commands: [
                  { cmd: "M", coords: [0, 0] },
                  { cmd: "L", coords: [10, 10] },
                  { cmd: "Z", coords: [] },
                ],
              },
            ],
          },
        ],
      };

      const result = interpreter.convertToSVG(doc);

      expect(result.svg).toContain('width="512" height="384"');
      expect(result.svg).toContain('viewBox="0 0 512 384"');
    });

    it("should handle custom regions", () => {
      const doc: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: {
          width: 512,
          height: 512,
          aspectRatio: "1:1",
        },
        layout: {
          regions: [
            {
              name: "custom_region",
              bounds: { x: 0.2, y: 0.3, width: 0.4, height: 0.5 },
            },
          ],
        },
        layers: [
          {
            id: "layer",
            label: "Layer",
            layout: {
              region: "custom_region",
            },
            paths: [
              {
                id: "path",
                style: { fill: "#000000" },
                commands: [
                  { cmd: "M", coords: [0, 0] },
                  { cmd: "L", coords: [10, 10] },
                  { cmd: "Z", coords: [] },
                ],
              },
            ],
          },
        ],
      };

      const result = interpreter.convertToSVG(doc);

      expect(result.svg).toContain('data-region="custom_region"');
      expect(
        result.layoutMetadata.regions.some((r) => r.name === "custom_region")
      ).toBe(true);
    });

    it("should generate layer metadata correctly", () => {
      const doc: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: {
          width: 512,
          height: 512,
          aspectRatio: "1:1",
        },
        layers: [
          {
            id: "test_layer",
            label: "Test Layer",
            layout: {
              region: "center",
              anchor: "top_left",
            },
            paths: [
              {
                id: "path1",
                style: { fill: "#000000" },
                commands: [
                  { cmd: "M", coords: [100, 100] },
                  { cmd: "L", coords: [200, 200] },
                  { cmd: "Z", coords: [] },
                ],
              },
              {
                id: "path2",
                style: { fill: "#FFFFFF" },
                commands: [
                  { cmd: "M", coords: [150, 150] },
                  { cmd: "L", coords: [250, 250] },
                  { cmd: "Z", coords: [] },
                ],
              },
            ],
          },
        ],
      };

      const result = interpreter.convertToSVG(doc);

      expect(result.layerMetadata).toHaveLength(1);

      const layerMeta = result.layerMetadata[0];
      expect(layerMeta.id).toBe("test_layer");
      expect(layerMeta.label).toBe("Test Layer");
      expect(layerMeta.pathCount).toBe(2);
      expect(layerMeta.region).toBe("center");
      expect(layerMeta.anchor).toBe("top_left");
      expect(layerMeta.bounds).toBeDefined();
      expect(layerMeta.bounds.width).toBeGreaterThan(0);
      expect(layerMeta.bounds.height).toBeGreaterThan(0);
    });

    it("should generate layout metadata correctly", () => {
      const doc: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: {
          width: 512,
          height: 512,
          aspectRatio: "1:1",
        },
        layers: [
          {
            id: "layer1",
            label: "Layer 1",
            layout: {
              region: "top_left",
              anchor: "center",
            },
            paths: [
              {
                id: "path1",
                style: { fill: "#000000" },
                commands: [
                  { cmd: "M", coords: [0, 0] },
                  { cmd: "L", coords: [10, 10] },
                  { cmd: "Z", coords: [] },
                ],
                layout: {
                  region: "bottom_right",
                  anchor: "top_center",
                },
              },
            ],
          },
        ],
      };

      const result = interpreter.convertToSVG(doc);

      expect(result.layoutMetadata).toBeDefined();
      expect(result.layoutMetadata.regions).toBeDefined();
      expect(result.layoutMetadata.anchorsUsed).toContain("center");
      expect(result.layoutMetadata.anchorsUsed).toContain("top_center");
      expect(result.layoutMetadata.coordinateRange).toBeDefined();

      // Check that used regions are marked correctly
      const topLeftRegion = result.layoutMetadata.regions.find(
        (r) => r.name === "top_left"
      );
      const bottomRightRegion = result.layoutMetadata.regions.find(
        (r) => r.name === "bottom_right"
      );
      const centerRegion = result.layoutMetadata.regions.find(
        (r) => r.name === "center"
      );

      expect(topLeftRegion?.used).toBe(true);
      expect(bottomRightRegion?.used).toBe(true);
      expect(centerRegion?.used).toBe(false);
    });

    it("should handle repetition specifications", () => {
      const doc: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: {
          width: 512,
          height: 512,
          aspectRatio: "1:1",
        },
        layers: [
          {
            id: "layer",
            label: "Layer",
            paths: [
              {
                id: "repeated_path",
                style: { fill: "#000000" },
                commands: [
                  { cmd: "M", coords: [0, 0] },
                  { cmd: "L", coords: [10, 0] },
                  { cmd: "L", coords: [10, 10] },
                  { cmd: "L", coords: [0, 10] },
                  { cmd: "Z", coords: [] },
                ],
                layout: {
                  region: "center",
                  repeat: {
                    type: "grid",
                    count: [2, 2],
                    spacing: 0.1,
                  },
                },
              },
            ],
          },
        ],
      };

      const result = interpreter.convertToSVG(doc);

      // Should create a group for the repeated path
      expect(result.svg).toContain('id="repeated_path_group"');

      // Should contain multiple path instances
      expect(result.svg).toContain('id="repeated_path_0"');
      expect(result.svg).toContain('id="repeated_path_1"');
      expect(result.svg).toContain('id="repeated_path_2"');
      expect(result.svg).toContain('id="repeated_path_3"');
    });

    it("should handle size specifications", () => {
      const doc: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: {
          width: 512,
          height: 512,
          aspectRatio: "1:1",
        },
        layers: [
          {
            id: "layer",
            label: "Layer",
            paths: [
              {
                id: "sized_path",
                style: { fill: "#000000" },
                commands: [
                  { cmd: "M", coords: [0, 0] },
                  { cmd: "L", coords: [100, 0] },
                  { cmd: "L", coords: [100, 100] },
                  { cmd: "L", coords: [0, 100] },
                  { cmd: "Z", coords: [] },
                ],
                layout: {
                  region: "center",
                  size: {
                    absolute: { width: 50, height: 50 },
                  },
                },
              },
            ],
          },
        ],
      };

      const result = interpreter.convertToSVG(doc);

      // The path should be scaled down from 100x100 to 50x50
      expect(result.svg).toContain('<path id="sized_path"');
      expect(result.warnings).toHaveLength(0);
    });

    it("should handle errors gracefully", () => {
      const doc: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: {
          width: 512,
          height: 512,
          aspectRatio: "1:1",
        },
        layers: [
          {
            id: "good_layer",
            label: "Good Layer",
            paths: [
              {
                id: "good_path",
                style: { fill: "#000000" },
                commands: [
                  { cmd: "M", coords: [0, 0] },
                  { cmd: "L", coords: [10, 10] },
                  { cmd: "Z", coords: [] },
                ],
              },
            ],
          },
          {
            id: "bad_layer",
            label: "Bad Layer",
            paths: [
              {
                id: "bad_path",
                style: { fill: "#000000" },
                commands: [
                  // Invalid command structure that might cause errors
                  { cmd: "M", coords: [] }, // Missing coordinates
                ],
              },
            ],
          },
        ],
      };

      const result = interpreter.convertToSVG(doc);

      // Should still generate SVG for good layer
      expect(result.svg).toContain('id="good_layer"');
      expect(result.svg).toContain('id="good_path"');

      // May have warnings about the bad layer
      expect(result.warnings).toBeDefined();
    });
  });

  describe("options", () => {
    it("should exclude metadata when option is false", () => {
      const interpreter = new SVGInterpreter({ includeMetadata: false });

      const doc: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: {
          width: 512,
          height: 512,
          aspectRatio: "1:1",
        },
        layers: [
          {
            id: "layer",
            label: "Layer",
            layout: {
              region: "center",
              anchor: "top_left",
            },
            paths: [
              {
                id: "path",
                style: { fill: "#000000" },
                commands: [
                  { cmd: "M", coords: [0, 0] },
                  { cmd: "L", coords: [10, 10] },
                  { cmd: "Z", coords: [] },
                ],
              },
            ],
          },
        ],
      };

      const result = interpreter.convertToSVG(doc);

      expect(result.svg).not.toContain("data-label");
      expect(result.svg).not.toContain("data-region");
      expect(result.svg).not.toContain("data-anchor");
    });

    it("should include debug overlay when option is true", () => {
      const interpreter = new SVGInterpreter({ includeDebugInfo: true });

      const doc: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: {
          width: 512,
          height: 512,
          aspectRatio: "1:1",
        },
        layers: [
          {
            id: "layer",
            label: "Layer",
            paths: [
              {
                id: "path",
                style: { fill: "#000000" },
                commands: [
                  { cmd: "M", coords: [0, 0] },
                  { cmd: "L", coords: [10, 10] },
                  { cmd: "Z", coords: [] },
                ],
              },
            ],
          },
        ],
      };

      const result = interpreter.convertToSVG(doc);

      expect(result.svg).toContain("<!-- Debug Overlay -->");
      expect(result.svg).toContain('data-debug="regions"');
      expect(result.svg).toContain("data-debug-region");
    });
  });

  describe("path data generation", () => {
    it("should round coordinates to reduce file size", () => {
      const doc: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: {
          width: 512,
          height: 512,
          aspectRatio: "1:1",
        },
        layers: [
          {
            id: "layer",
            label: "Layer",
            paths: [
              {
                id: "path",
                style: { fill: "#000000" },
                commands: [
                  { cmd: "M", coords: [100.123456, 200.987654] },
                  { cmd: "L", coords: [300.555555, 400.777777] },
                  { cmd: "Z", coords: [] },
                ],
              },
            ],
          },
        ],
      };

      const result = interpreter.convertToSVG(doc);

      // Coordinates should be rounded to 2 decimal places
      expect(result.svg).toContain("100.12 200.99");
      expect(result.svg).toContain("300.56 400.78");
    });

    it("should handle all path command types", () => {
      const doc: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: {
          width: 512,
          height: 512,
          aspectRatio: "1:1",
        },
        layers: [
          {
            id: "layer",
            label: "Layer",
            paths: [
              {
                id: "complex_path",
                style: { fill: "#000000" },
                commands: [
                  { cmd: "M", coords: [100, 100] },
                  { cmd: "L", coords: [200, 100] },
                  { cmd: "C", coords: [250, 100, 300, 150, 300, 200] },
                  { cmd: "Q", coords: [300, 250, 250, 300] },
                  { cmd: "Z", coords: [] },
                ],
              },
            ],
          },
        ],
      };

      const result = interpreter.convertToSVG(doc);

      expect(result.svg).toContain("M 100 100");
      expect(result.svg).toContain("L 200 100");
      expect(result.svg).toContain("C 250 100 300 150 300 200");
      expect(result.svg).toContain("Q 300 250 250 300");
      expect(result.svg).toContain("Z");
    });
  });
});
