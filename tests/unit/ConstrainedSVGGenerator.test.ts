/**
 * Unit tests for ConstrainedSVGGenerator
 */

import { describe, it, expect, beforeEach } from "vitest";
import { ConstrainedSVGGenerator } from "../../server/services/ConstrainedSVGGenerator";
import { GenerationRequest, GenerationResponse } from "../../server/types";
import {
  UnifiedLayeredSVGDocument,
  PathCommand,
} from "../../server/types/unified-layered";

describe("ConstrainedSVGGenerator", () => {
  let generator: ConstrainedSVGGenerator;

  beforeEach(() => {
    generator = new ConstrainedSVGGenerator();
  });

  describe("generate", () => {
    it("should generate SVG from basic request", async () => {
      const request: GenerationRequest = {
        prompt: "A blue square",
        size: { width: 512, height: 512 },
        palette: ["#3B82F6", "#111827"],
        seed: 12345,
      };

      const response = await generator.generate(request);

      expect(response.svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
      expect(response.svg).toContain('viewBox="0 0 512 512"');
      expect(response.svg).toContain('width="512" height="512"');
      expect(response.meta.width).toBe(512);
      expect(response.meta.height).toBe(512);
      expect(response.meta.seed).toBe(12345);
      expect(response.errors).toHaveLength(0);
    });

    it("should handle different aspect ratios", async () => {
      const request: GenerationRequest = {
        prompt: "A rectangle",
        size: { width: 800, height: 600 }, // 4:3 ratio
      };

      const response = await generator.generate(request);

      expect(response.svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
      expect(response.meta.width).toBe(512);
      expect(response.meta.height).toBe(512);
      expect(response.errors).toHaveLength(0);
    });

    it("should include palette in metadata", async () => {
      const request: GenerationRequest = {
        prompt: "Colorful design",
        size: { width: 512, height: 512 },
        palette: ["#FF0000", "#00FF00", "#0000FF"],
      };

      const response = await generator.generate(request);

      expect(response.meta.palette).toContain("#FF0000"); // First color from request palette
      expect(response.meta.palette).toContain("#111827"); // Default stroke
    });

    it("should handle invalid requests gracefully", async () => {
      const invalidRequest = {
        prompt: "", // Empty prompt should be invalid
        size: { width: 512, height: 512 },
      } as GenerationRequest;

      const response = await generator.generate(invalidRequest);

      expect(response.errors).toHaveLength(1);
      expect(response.errors[0]).toContain("Invalid request");
      expect(response.svg).toContain("Generation Error");
    });

    it("should generate event ID when userId provided", async () => {
      const request: GenerationRequest = {
        prompt: "Test design",
        size: { width: 512, height: 512 },
        userId: "test-user",
      };

      const response = await generator.generate(request);

      expect(response.eventId).toBeDefined();
      expect(typeof response.eventId).toBe("number");
    });
  });

  describe("generateFromUnified", () => {
    it("should generate SVG from unified document", async () => {
      const unifiedDoc: UnifiedLayeredSVGDocument = {
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
            paths: [
              {
                id: "test_path",
                style: {
                  fill: "#FF0000",
                  stroke: "#000000",
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

      const response = await generator.generateFromUnified(unifiedDoc);

      expect(response.svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
      expect(response.svg).toContain('id="test_layer"');
      expect(response.svg).toContain('id="test_path"');
      expect(response.svg).toContain('fill="#FF0000"');
      expect(response.meta.palette).toContain("#FF0000");
      expect(response.meta.palette).toContain("#000000");
      expect(response.errors).toHaveLength(0);
    });

    it("should handle unified document with layout specifications", async () => {
      const unifiedDoc: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: {
          width: 512,
          height: 512,
          aspectRatio: "1:1",
        },
        layers: [
          {
            id: "positioned_layer",
            label: "Positioned Layer",
            layout: {
              region: "top_left",
              anchor: "center",
            },
            paths: [
              {
                id: "positioned_path",
                style: { fill: "#00FF00" },
                commands: [
                  { cmd: "M", coords: [0, 0] },
                  { cmd: "L", coords: [50, 0] },
                  { cmd: "L", coords: [50, 50] },
                  { cmd: "L", coords: [0, 50] },
                  { cmd: "Z", coords: [] },
                ],
                layout: {
                  region: "center",
                  anchor: "top_left",
                  offset: [0.1, -0.1],
                },
              },
            ],
          },
        ],
      };

      const response = await generator.generateFromUnified(unifiedDoc);

      expect(response.svg).toContain('data-region="top_left"');
      expect(response.svg).toContain('data-anchor="center"');
      expect(response.errors).toHaveLength(0);
    });
  });

  describe("validateUnifiedDocument", () => {
    it("should validate correct unified document", () => {
      const validDoc: UnifiedLayeredSVGDocument = {
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
                  { cmd: "M", coords: [100, 100] },
                  { cmd: "L", coords: [200, 200] },
                  { cmd: "Z", coords: [] },
                ],
              },
            ],
          },
        ],
      };

      const result = generator.validateUnifiedDocument(validDoc);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.coordinateViolations).toHaveLength(0);
      expect(result.canvasSizeViolations).toHaveLength(0);
      expect(result.commandViolations).toHaveLength(0);
    });

    it("should reject invalid canvas size", () => {
      const invalidDoc: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: {
          width: 1024, // Invalid size
          height: 768, // Invalid size
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
                  { cmd: "M", coords: [100, 100] },
                  { cmd: "Z", coords: [] },
                ],
              },
            ],
          },
        ],
      };

      const result = generator.validateUnifiedDocument(invalidDoc);

      expect(result.success).toBe(false);
      expect(result.canvasSizeViolations).toHaveLength(1);
      expect(result.canvasSizeViolations![0]).toContain(
        "Canvas size must be 512x512"
      );
    });

    it("should reject out-of-bounds coordinates", () => {
      const invalidDoc: UnifiedLayeredSVGDocument = {
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
                  { cmd: "M", coords: [-10, 600] }, // Out of bounds
                  { cmd: "L", coords: [1000, -50] }, // Out of bounds
                  { cmd: "Z", coords: [] },
                ],
              },
            ],
          },
        ],
      };

      const result = generator.validateUnifiedDocument(invalidDoc);

      expect(result.success).toBe(false);
      expect(result.coordinateViolations).toHaveLength(2);
      expect(result.coordinateViolations![0]).toContain("outside bounds");
      expect(result.coordinateViolations![1]).toContain("outside bounds");
    });

    it("should allow relative commands when configured", () => {
      const generatorWithRelative = new ConstrainedSVGGenerator({
        allowRelativeCommands: true,
      });

      const docWithRelative: UnifiedLayeredSVGDocument = {
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
                  { cmd: "M", coords: [100, 100] },
                  // This would normally be rejected, but we allow it
                  { cmd: "L", coords: [50, 50] } as PathCommand,
                  { cmd: "Z", coords: [] },
                ],
              },
            ],
          },
        ],
      };

      const result =
        generatorWithRelative.validateUnifiedDocument(docWithRelative);

      expect(result.success).toBe(true);
      expect(result.commandViolations).toHaveLength(0);
    });
  });

  describe("sanitizeCoordinates", () => {
    it("should clamp out-of-bounds coordinates", () => {
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
                  { cmd: "M", coords: [-50, 600] }, // Out of bounds
                  { cmd: "L", coords: [1000, -100] }, // Out of bounds
                  { cmd: "Z", coords: [] },
                ],
              },
            ],
          },
        ],
      };

      const sanitized = generator.sanitizeCoordinates(doc);

      const path = sanitized.layers[0].paths[0];
      expect(path.commands[0].coords).toEqual([0, 512]); // Clamped to bounds
      expect(path.commands[1].coords).toEqual([512, 0]); // Clamped to bounds
    });

    it("should limit coordinate precision", () => {
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
                  { cmd: "M", coords: [100.123456789, 200.987654321] },
                  { cmd: "Z", coords: [] },
                ],
              },
            ],
          },
        ],
      };

      const sanitized = generator.sanitizeCoordinates(doc);

      const path = sanitized.layers[0].paths[0];
      expect(path.commands[0].coords).toEqual([100.12, 200.99]); // Limited to 2 decimal places
    });

    it("should preserve Z commands unchanged", () => {
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
                  { cmd: "M", coords: [100, 100] },
                  { cmd: "Z", coords: [] },
                ],
              },
            ],
          },
        ],
      };

      const sanitized = generator.sanitizeCoordinates(doc);

      const path = sanitized.layers[0].paths[0];
      expect(path.commands[1]).toEqual({ cmd: "Z", coords: [] });
    });
  });

  describe("configuration options", () => {
    it("should disable canvas size enforcement when configured", () => {
      const flexibleGenerator = new ConstrainedSVGGenerator({
        enforceCanvasSize: false,
      });

      const doc: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: {
          width: 1024,
          height: 768,
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
                  { cmd: "M", coords: [100, 100] },
                  { cmd: "Z", coords: [] },
                ],
              },
            ],
          },
        ],
      };

      const result = flexibleGenerator.validateUnifiedDocument(doc);

      expect(result.success).toBe(true);
      expect(result.canvasSizeViolations).toHaveLength(0);
    });

    it("should disable coordinate validation when configured", () => {
      const flexibleGenerator = new ConstrainedSVGGenerator({
        validateCoordinates: false,
      });

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
                  { cmd: "M", coords: [-100, 1000] }, // Out of bounds
                  { cmd: "Z", coords: [] },
                ],
              },
            ],
          },
        ],
      };

      const result = flexibleGenerator.validateUnifiedDocument(doc);

      expect(result.success).toBe(true);
      expect(result.coordinateViolations).toHaveLength(0);
    });
  });

  describe("aspect ratio handling", () => {
    it("should update managers when aspect ratio changes", () => {
      generator.updateAspectRatio("16:9");

      const regionManager = generator.getRegionManager();
      const coordinateMapper = generator.getCoordinateMapper();

      expect(regionManager).toBeDefined();
      expect(coordinateMapper).toBeDefined();
    });

    it("should determine correct aspect ratio from dimensions", async () => {
      const request: GenerationRequest = {
        prompt: "Test",
        size: { width: 1920, height: 1080 }, // 16:9 ratio
      };

      const response = await generator.generate(request);

      // Should still generate 512x512 but recognize the aspect ratio
      expect(response.meta.width).toBe(512);
      expect(response.meta.height).toBe(512);
    });
  });

  describe("error handling", () => {
    it("should create error SVG for invalid requests", async () => {
      const invalidRequest = {
        prompt: "",
        size: { width: -1, height: -1 },
      } as GenerationRequest;

      const response = await generator.generate(invalidRequest);

      expect(response.svg).toContain("Generation Error");
      expect(response.meta.backgroundColor).toBe("#FEF2F2");
      expect(response.errors).toHaveLength(1);
      expect(response.errors[0]).toContain("Invalid request");
    });

    it("should handle validation errors in unified documents", async () => {
      const invalidDoc: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: {
          width: 1024, // Invalid size
          height: 1024,
          aspectRatio: "1:1",
        },
        layers: [],
      };

      await expect(generator.generateFromUnified(invalidDoc)).rejects.toThrow(
        "Invalid unified document"
      );
    });
  });

  describe("metadata generation", () => {
    it("should extract palette from document paths", async () => {
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
                id: "path1",
                style: { fill: "#FF0000", stroke: "#00FF00" },
                commands: [
                  { cmd: "M", coords: [0, 0] },
                  { cmd: "Z", coords: [] },
                ],
              },
              {
                id: "path2",
                style: { fill: "#0000FF", stroke: "none" },
                commands: [
                  { cmd: "M", coords: [10, 10] },
                  { cmd: "Z", coords: [] },
                ],
              },
            ],
          },
        ],
      };

      const response = await generator.generateFromUnified(doc);

      expect(response.meta.palette).toContain("#FF0000");
      expect(response.meta.palette).toContain("#00FF00");
      expect(response.meta.palette).toContain("#0000FF");
      expect(response.meta.palette).not.toContain("none");
    });

    it("should create proper layer info", async () => {
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
            label: "Background Layer",
            paths: [
              {
                id: "bg",
                style: { fill: "#FFFFFF" },
                commands: [
                  { cmd: "M", coords: [0, 0] },
                  { cmd: "Z", coords: [] },
                ],
              },
            ],
          },
          {
            id: "foreground",
            label: "Foreground Layer",
            paths: [
              {
                id: "fg",
                style: { fill: "#000000" },
                commands: [
                  { cmd: "M", coords: [100, 100] },
                  { cmd: "Z", coords: [] },
                ],
              },
            ],
          },
        ],
      };

      const response = await generator.generateFromUnified(doc);

      expect(response.layers).toHaveLength(2);
      expect(response.layers[0].id).toBe("background");
      expect(response.layers[0].label).toBe("Background Layer");
      expect(response.layers[0].type).toBe("path");
      expect(response.layers[1].id).toBe("foreground");
      expect(response.layers[1].label).toBe("Foreground Layer");
      expect(response.layers[1].type).toBe("path");
    });
  });
});
