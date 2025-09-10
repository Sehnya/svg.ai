/**
 * Unit tests for SVGValidator with unified language support
 */

import { describe, it, expect, beforeEach } from "vitest";
import { SVGValidator } from "../../server/services/SVGValidator";
import type {
  UnifiedLayeredSVGDocument,
  UnifiedLayer,
  UnifiedPath,
  PathCommand,
} from "../../server/types/unified-layered";

describe("SVGValidator - Unified Language Support", () => {
  let validator: SVGValidator;
  let validDocument: UnifiedLayeredSVGDocument;

  beforeEach(() => {
    validator = new SVGValidator({
      enforceCoordinateBounds: true,
      validateLayoutLanguage: true,
      checkSemanticCorrectness: true,
      enableAutoFix: true,
      strictMode: false,
    });

    validDocument = {
      version: "unified-layered-1.0",
      canvas: {
        width: 512,
        height: 512,
        aspectRatio: "1:1",
      },
      layers: [
        {
          id: "main_layer",
          label: "Main Layer",
          layout: {
            region: "center",
            anchor: "center",
            offset: [0, 0],
          },
          paths: [
            {
              id: "main_path",
              style: {
                fill: "#3B82F6",
                stroke: "#1E40AF",
                strokeWidth: 2,
              },
              commands: [
                { cmd: "M", coords: [200, 200] },
                { cmd: "L", coords: [312, 200] },
                { cmd: "L", coords: [312, 312] },
                { cmd: "L", coords: [200, 312] },
                { cmd: "Z", coords: [] },
              ],
              layout: {
                region: "center",
                anchor: "center",
              },
            },
          ],
        },
      ],
    };
  });

  describe("Document Structure Validation", () => {
    it("should validate a correct unified document", () => {
      const report = validator.validateUnifiedDocument(validDocument);

      expect(report.success).toBe(true);
      expect(report.errors).toHaveLength(0);
      expect(report.statistics.totalLayers).toBe(1);
      expect(report.statistics.totalPaths).toBe(1);
      expect(report.statistics.totalCommands).toBe(5);
    });

    it("should detect invalid document version", () => {
      const invalidDoc = {
        ...validDocument,
        version: "invalid-version" as any,
      };

      const report = validator.validateUnifiedDocument(invalidDoc);

      expect(report.success).toBe(false);
      expect(report.errors).toContainEqual(
        expect.objectContaining({
          type: "error",
          category: "structure",
          message: "Invalid document version: invalid-version",
        })
      );
    });

    it("should detect missing canvas configuration", () => {
      const invalidDoc = {
        ...validDocument,
        canvas: undefined as any,
      };

      const report = validator.validateUnifiedDocument(invalidDoc);

      expect(report.success).toBe(false);
      expect(report.errors).toContainEqual(
        expect.objectContaining({
          type: "error",
          category: "structure",
          message: "Document missing canvas configuration",
        })
      );
    });

    it("should detect empty layers array", () => {
      const invalidDoc = {
        ...validDocument,
        layers: [],
      };

      const report = validator.validateUnifiedDocument(invalidDoc);

      expect(report.success).toBe(false);
      expect(report.errors).toContainEqual(
        expect.objectContaining({
          type: "error",
          category: "structure",
          message: "Document must contain at least one layer",
        })
      );
    });

    it("should warn about too many layers", () => {
      const manyLayers = Array.from({ length: 25 }, (_, i) => ({
        ...validDocument.layers[0],
        id: `layer_${i}`,
        label: `Layer ${i}`,
      }));

      const docWithManyLayers = {
        ...validDocument,
        layers: manyLayers,
      };

      const report = validator.validateUnifiedDocument(docWithManyLayers);

      expect(report.warnings).toContainEqual(
        expect.objectContaining({
          type: "warning",
          category: "performance",
          message: expect.stringContaining("exceeding recommended maximum"),
        })
      );
    });
  });

  describe("Canvas Validation", () => {
    it("should detect invalid canvas dimensions", () => {
      const invalidDoc = {
        ...validDocument,
        canvas: {
          ...validDocument.canvas,
          width: 0,
          height: -10,
        },
      };

      const report = validator.validateUnifiedDocument(invalidDoc);

      expect(report.success).toBe(false);
      expect(report.errors).toContainEqual(
        expect.objectContaining({
          type: "error",
          category: "structure",
          message: "Canvas dimensions must be positive",
        })
      );
    });

    it("should warn about large canvas sizes", () => {
      const largeDoc = {
        ...validDocument,
        canvas: {
          ...validDocument.canvas,
          width: 4096,
          height: 4096,
        },
      };

      const report = validator.validateUnifiedDocument(largeDoc);

      expect(report.warnings).toContainEqual(
        expect.objectContaining({
          type: "warning",
          category: "performance",
          message: expect.stringContaining("Large canvas size"),
        })
      );
    });

    it("should detect aspect ratio inconsistency", () => {
      const inconsistentDoc = {
        ...validDocument,
        canvas: {
          width: 512,
          height: 384, // 4:3 dimensions
          aspectRatio: "1:1" as any, // But claiming 1:1
        },
      };

      const report = validator.validateUnifiedDocument(inconsistentDoc);

      expect(report.warnings).toContainEqual(
        expect.objectContaining({
          type: "warning",
          category: "structure",
          message: expect.stringContaining("don't match aspect ratio"),
        })
      );
    });
  });

  describe("Layer Validation", () => {
    it("should detect missing layer id", () => {
      const invalidDoc = {
        ...validDocument,
        layers: [
          {
            ...validDocument.layers[0],
            id: "",
          },
        ],
      };

      const report = validator.validateUnifiedDocument(invalidDoc);

      expect(report.success).toBe(false);
      expect(report.errors).toContainEqual(
        expect.objectContaining({
          type: "error",
          category: "structure",
          message: expect.stringContaining("missing required id"),
        })
      );
    });

    it("should warn about missing layer label", () => {
      const invalidDoc = {
        ...validDocument,
        layers: [
          {
            ...validDocument.layers[0],
            label: "",
          },
        ],
      };

      const report = validator.validateUnifiedDocument(invalidDoc);

      expect(report.warnings).toContainEqual(
        expect.objectContaining({
          type: "warning",
          category: "structure",
          message: expect.stringContaining("missing descriptive label"),
        })
      );
    });

    it("should detect empty paths array", () => {
      const invalidDoc = {
        ...validDocument,
        layers: [
          {
            ...validDocument.layers[0],
            paths: [],
          },
        ],
      };

      const report = validator.validateUnifiedDocument(invalidDoc);

      expect(report.success).toBe(false);
      expect(report.errors).toContainEqual(
        expect.objectContaining({
          type: "error",
          category: "structure",
          message: expect.stringContaining("contains no paths"),
        })
      );
    });

    it("should warn about too many paths per layer", () => {
      const manyPaths = Array.from({ length: 60 }, (_, i) => ({
        ...validDocument.layers[0].paths[0],
        id: `path_${i}`,
      }));

      const invalidDoc = {
        ...validDocument,
        layers: [
          {
            ...validDocument.layers[0],
            paths: manyPaths,
          },
        ],
      };

      const report = validator.validateUnifiedDocument(invalidDoc);

      expect(report.warnings).toContainEqual(
        expect.objectContaining({
          type: "warning",
          category: "performance",
          message: expect.stringContaining("exceeding recommended maximum"),
        })
      );
    });
  });

  describe("Path Command Validation", () => {
    it("should detect invalid path commands", () => {
      const invalidDoc = {
        ...validDocument,
        layers: [
          {
            ...validDocument.layers[0],
            paths: [
              {
                ...validDocument.layers[0].paths[0],
                commands: [
                  { cmd: "X" as any, coords: [100, 100] }, // Invalid command
                ],
              },
            ],
          },
        ],
      };

      const report = validator.validateUnifiedDocument(invalidDoc);

      expect(report.success).toBe(false);
      expect(report.errors).toContainEqual(
        expect.objectContaining({
          type: "error",
          category: "structure",
          message: "Invalid path command 'X' at index 0",
        })
      );
    });

    it("should detect incorrect coordinate count", () => {
      const invalidDoc = {
        ...validDocument,
        layers: [
          {
            ...validDocument.layers[0],
            paths: [
              {
                ...validDocument.layers[0].paths[0],
                commands: [
                  { cmd: "M", coords: [100] }, // M command needs 2 coordinates
                ],
              },
            ],
          },
        ],
      };

      const report = validator.validateUnifiedDocument(invalidDoc);

      expect(report.success).toBe(false);
      expect(report.errors).toContainEqual(
        expect.objectContaining({
          type: "error",
          category: "structure",
          message: "Command 'M' expects 2 coordinates, got 1",
        })
      );
    });

    it("should detect coordinates out of bounds", () => {
      const invalidDoc = {
        ...validDocument,
        layers: [
          {
            ...validDocument.layers[0],
            paths: [
              {
                ...validDocument.layers[0].paths[0],
                commands: [
                  { cmd: "M", coords: [600, 700] }, // Out of 512x512 bounds
                  { cmd: "L", coords: [800, 900] },
                ],
              },
            ],
          },
        ],
      };

      const report = validator.validateUnifiedDocument(invalidDoc);

      expect(
        report.warnings.some((w) => w.message.includes("outside valid range"))
      ).toBe(true);
    });

    it("should auto-fix out of bounds coordinates", () => {
      const invalidDoc = {
        ...validDocument,
        layers: [
          {
            ...validDocument.layers[0],
            paths: [
              {
                ...validDocument.layers[0].paths[0],
                commands: [
                  { cmd: "M", coords: [600, 700] },
                  { cmd: "L", coords: [800, 900] },
                ],
              },
            ],
          },
        ],
      };

      const report = validator.validateUnifiedDocument(invalidDoc);

      expect(report.autoFixApplied).toBe(true);
      expect(report.fixedDocument).toBeDefined();

      if (report.fixedDocument) {
        const fixedCommands = report.fixedDocument.layers[0].paths[0].commands;
        expect(fixedCommands[0].coords[0]).toBeLessThanOrEqual(512);
        expect(fixedCommands[0].coords[1]).toBeLessThanOrEqual(512);
      }
    });

    it("should validate command sequence", () => {
      const invalidDoc = {
        ...validDocument,
        layers: [
          {
            ...validDocument.layers[0],
            paths: [
              {
                ...validDocument.layers[0].paths[0],
                commands: [
                  { cmd: "L", coords: [100, 100] }, // Should start with M
                  { cmd: "L", coords: [200, 200] },
                ],
              },
            ],
          },
        ],
      };

      const report = validator.validateUnifiedDocument(invalidDoc);

      expect(report.success).toBe(false);
      expect(report.errors).toContainEqual(
        expect.objectContaining({
          type: "error",
          category: "structure",
          message: "Path must start with a Move (M) command",
        })
      );
    });

    it("should detect orphaned Z commands", () => {
      const invalidDoc = {
        ...validDocument,
        layers: [
          {
            ...validDocument.layers[0],
            paths: [
              {
                ...validDocument.layers[0].paths[0],
                commands: [
                  { cmd: "Z", coords: [] }, // Z without M
                  { cmd: "M", coords: [100, 100] },
                ],
              },
            ],
          },
        ],
      };

      const report = validator.validateUnifiedDocument(invalidDoc);

      expect(report.warnings).toContainEqual(
        expect.objectContaining({
          type: "warning",
          category: "structure",
          message: expect.stringContaining("Close (Z) command"),
        })
      );
    });
  });

  describe("Style Validation", () => {
    it("should detect invalid colors", () => {
      const invalidDoc = {
        ...validDocument,
        layers: [
          {
            ...validDocument.layers[0],
            paths: [
              {
                ...validDocument.layers[0].paths[0],
                style: {
                  fill: "invalid-color",
                  stroke: "#GGGGGG", // Invalid hex
                },
              },
            ],
          },
        ],
      };

      const report = validator.validateUnifiedDocument(invalidDoc);

      expect(report.success).toBe(false);
      expect(report.errors).toContainEqual(
        expect.objectContaining({
          type: "error",
          category: "style",
          message: "Invalid fill color: invalid-color",
        })
      );
      expect(report.errors).toContainEqual(
        expect.objectContaining({
          type: "error",
          category: "style",
          message: "Invalid stroke color: #GGGGGG",
        })
      );
    });

    it("should detect invalid stroke width", () => {
      const invalidDoc = {
        ...validDocument,
        layers: [
          {
            ...validDocument.layers[0],
            paths: [
              {
                ...validDocument.layers[0].paths[0],
                style: {
                  fill: "#3B82F6",
                  strokeWidth: -5,
                },
              },
            ],
          },
        ],
      };

      const report = validator.validateUnifiedDocument(invalidDoc);

      expect(report.success).toBe(false);
      expect(report.errors).toContainEqual(
        expect.objectContaining({
          type: "error",
          category: "style",
          message: "Invalid stroke width: -5",
        })
      );
    });

    it("should detect invalid opacity", () => {
      const invalidDoc = {
        ...validDocument,
        layers: [
          {
            ...validDocument.layers[0],
            paths: [
              {
                ...validDocument.layers[0].paths[0],
                style: {
                  fill: "#3B82F6",
                  opacity: 1.5, // > 1
                },
              },
            ],
          },
        ],
      };

      const report = validator.validateUnifiedDocument(invalidDoc);

      expect(report.success).toBe(false);
      expect(report.errors).toContainEqual(
        expect.objectContaining({
          type: "error",
          category: "style",
          message: "Invalid opacity: 1.5",
        })
      );
    });

    it("should warn about invisible paths", () => {
      const invalidDoc = {
        ...validDocument,
        layers: [
          {
            ...validDocument.layers[0],
            paths: [
              {
                ...validDocument.layers[0].paths[0],
                style: {
                  fill: "none",
                  stroke: "none",
                },
              },
            ],
          },
        ],
      };

      const report = validator.validateUnifiedDocument(invalidDoc);

      expect(report.warnings).toContainEqual(
        expect.objectContaining({
          type: "warning",
          category: "style",
          message: "Path has no fill or stroke and will be invisible",
        })
      );
    });

    it("should warn about thin stroke widths", () => {
      const invalidDoc = {
        ...validDocument,
        layers: [
          {
            ...validDocument.layers[0],
            paths: [
              {
                ...validDocument.layers[0].paths[0],
                style: {
                  fill: "none",
                  stroke: "#000000",
                  strokeWidth: 0.5,
                },
              },
            ],
          },
        ],
      };

      const report = validator.validateUnifiedDocument(invalidDoc);

      expect(report.warnings).toContainEqual(
        expect.objectContaining({
          type: "warning",
          category: "style",
          message: "Stroke width less than 1 may not be visible",
        })
      );
    });
  });

  describe("Layout Language Validation", () => {
    it("should detect unknown regions", () => {
      const invalidDoc = {
        ...validDocument,
        layers: [
          {
            ...validDocument.layers[0],
            layout: {
              region: "unknown_region" as any,
              anchor: "center",
            },
          },
        ],
      };

      const report = validator.validateUnifiedDocument(invalidDoc);

      expect(report.success).toBe(false);
      expect(report.errors).toContainEqual(
        expect.objectContaining({
          type: "error",
          category: "layout",
          message: "Unknown region: unknown_region",
        })
      );
    });

    it("should detect invalid anchors", () => {
      const invalidDoc = {
        ...validDocument,
        layers: [
          {
            ...validDocument.layers[0],
            layout: {
              region: "center",
              anchor: "invalid_anchor" as any,
            },
          },
        ],
      };

      const report = validator.validateUnifiedDocument(invalidDoc);

      expect(report.success).toBe(false);
      expect(report.errors).toContainEqual(
        expect.objectContaining({
          type: "error",
          category: "layout",
          message: "Invalid anchor: invalid_anchor",
        })
      );
    });

    it("should detect invalid offset values", () => {
      const invalidDoc = {
        ...validDocument,
        layers: [
          {
            ...validDocument.layers[0],
            layout: {
              region: "center",
              anchor: "center",
              offset: [2, -2], // Out of [-1, 1] range
            },
          },
        ],
      };

      const report = validator.validateUnifiedDocument(invalidDoc);

      expect(report.success).toBe(false);
      expect(report.errors).toContainEqual(
        expect.objectContaining({
          type: "error",
          category: "layout",
          message: "Offset values must be between -1 and 1, got [2, -2]",
        })
      );
    });

    it("should validate size specifications", () => {
      const invalidDoc = {
        ...validDocument,
        layers: [
          {
            ...validDocument.layers[0],
            paths: [
              {
                ...validDocument.layers[0].paths[0],
                layout: {
                  region: "center",
                  size: {
                    relative: 1.5, // > 1
                  },
                },
              },
            ],
          },
        ],
      };

      const report = validator.validateUnifiedDocument(invalidDoc);

      expect(report.success).toBe(false);
      expect(report.errors).toContainEqual(
        expect.objectContaining({
          type: "error",
          category: "layout",
          message: "Relative size must be between 0 and 1, got 1.5",
        })
      );
    });

    it("should validate repetition specifications", () => {
      const invalidDoc = {
        ...validDocument,
        layers: [
          {
            ...validDocument.layers[0],
            paths: [
              {
                ...validDocument.layers[0].paths[0],
                layout: {
                  region: "center",
                  repeat: {
                    type: "invalid" as any,
                    count: 0,
                  },
                },
              },
            ],
          },
        ],
      };

      const report = validator.validateUnifiedDocument(invalidDoc);

      expect(report.success).toBe(false);
      expect(report.errors).toContainEqual(
        expect.objectContaining({
          type: "error",
          category: "layout",
          message: "Invalid repetition type: invalid",
        })
      );
      expect(report.errors).toContainEqual(
        expect.objectContaining({
          type: "error",
          category: "layout",
          message: "Repetition count must be a positive integer",
        })
      );
    });
  });

  describe("Statistics Generation", () => {
    it("should generate accurate statistics", () => {
      const report = validator.validateUnifiedDocument(validDocument);

      expect(report.statistics).toEqual({
        totalLayers: 1,
        totalPaths: 1,
        totalCommands: 5,
        coordinateRange: {
          minX: 200,
          maxX: 312,
          minY: 200,
          maxY: 312,
        },
        regionsUsed: ["center"],
        anchorsUsed: ["center"],
      });
    });

    it("should track multiple regions and anchors", () => {
      const multiRegionDoc = {
        ...validDocument,
        layers: [
          {
            ...validDocument.layers[0],
            layout: { region: "top_left", anchor: "top_left" },
            paths: [
              {
                ...validDocument.layers[0].paths[0],
                layout: { region: "bottom_right", anchor: "bottom_right" },
              },
            ],
          },
        ],
      };

      const report = validator.validateUnifiedDocument(multiRegionDoc);

      expect(report.statistics.regionsUsed).toContain("top_left");
      expect(report.statistics.regionsUsed).toContain("bottom_right");
      expect(report.statistics.anchorsUsed).toContain("top_left");
      expect(report.statistics.anchorsUsed).toContain("bottom_right");
    });
  });

  describe("Model Feedback Generation", () => {
    it("should generate helpful feedback for model correction", () => {
      const invalidDoc = {
        ...validDocument,
        layers: [
          {
            ...validDocument.layers[0],
            paths: [
              {
                ...validDocument.layers[0].paths[0],
                commands: [
                  { cmd: "M", coords: [600, 700] }, // Out of bounds
                ],
                style: {
                  fill: "invalid-color",
                },
                layout: {
                  region: "unknown_region" as any,
                },
              },
            ],
          },
        ],
      };

      const report = validator.validateUnifiedDocument(invalidDoc);
      const feedback = validator.generateModelFeedback(report);

      expect(feedback).toContain("Critical issues found:");
      expect(feedback).toContain("Layout language issues:");
      expect(feedback.some((f) => f.includes("Invalid fill color"))).toBe(true);
      expect(feedback.some((f) => f.includes("Unknown region"))).toBe(true);
    });

    it("should provide performance recommendations", () => {
      const performanceDoc = {
        ...validDocument,
        canvas: {
          ...validDocument.canvas,
          width: 4096,
          height: 4096,
        },
      };

      const report = validator.validateUnifiedDocument(performanceDoc);
      const feedback = validator.generateModelFeedback(report);

      expect(
        feedback.some((f) => f.includes("Performance recommendations"))
      ).toBe(true);
    });
  });

  describe("Configuration", () => {
    it("should respect strict mode", () => {
      const strictValidator = new SVGValidator({
        strictMode: true,
        enforceCoordinateBounds: true,
      });

      const invalidDoc = {
        ...validDocument,
        layers: [
          {
            ...validDocument.layers[0],
            paths: [
              {
                ...validDocument.layers[0].paths[0],
                commands: [
                  { cmd: "M", coords: [600, 700] }, // Out of bounds
                ],
              },
            ],
          },
        ],
      };

      const report = strictValidator.validateUnifiedDocument(invalidDoc);

      // In strict mode, coordinate bounds violations should be errors
      expect(
        report.errors.some((e) => e.message.includes("outside valid range"))
      ).toBe(true);
    });

    it("should allow disabling auto-fix", () => {
      const noAutoFixValidator = new SVGValidator({
        enableAutoFix: false,
      });

      const invalidDoc = {
        ...validDocument,
        layers: [
          {
            ...validDocument.layers[0],
            id: "", // Missing ID
          },
        ],
      };

      const report = noAutoFixValidator.validateUnifiedDocument(invalidDoc);

      expect(report.autoFixApplied).toBe(false);
      expect(report.fixedDocument).toBeUndefined();
    });

    it("should update options dynamically", () => {
      validator.updateOptions({
        strictMode: true,
        maxLayers: 5,
      });

      const options = validator.getOptions();
      expect(options.strictMode).toBe(true);
      expect(options.maxLayers).toBe(5);
    });
  });
});
