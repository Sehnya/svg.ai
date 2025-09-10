/**
 * Integration tests for unified SVG validation with feedback loop
 */

import { describe, it, expect, beforeEach } from "vitest";
import { SVGValidator } from "../../server/services/SVGValidator";
import { UnifiedErrorHandler } from "../../server/services/UnifiedErrorHandler";
import type {
  UnifiedLayeredSVGDocument,
  ValidationFeedback,
} from "../../server/types/unified-layered";

describe("Unified Validation and Feedback Integration", () => {
  let validator: SVGValidator;
  let errorHandler: UnifiedErrorHandler;

  beforeEach(() => {
    validator = new SVGValidator({
      enforceCoordinateBounds: true,
      validateLayoutLanguage: true,
      checkSemanticCorrectness: true,
      enableAutoFix: true,
      strictMode: false,
      maxLayers: 10,
      maxPathsPerLayer: 20,
      maxCommandsPerPath: 50,
    });

    errorHandler = new UnifiedErrorHandler({
      maxRetries: 2,
      enableFallbacks: true,
      logErrors: true,
      includeErrorDetails: true,
    });
  });

  describe("Complete Validation Workflow", () => {
    it("should validate and provide comprehensive feedback for a complex document", () => {
      const complexDocument: UnifiedLayeredSVGDocument = {
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
              bounds: { x: 0.1, y: 0.1, width: 0.3, height: 0.3 },
            },
          ],
          globalAnchor: "center",
        },
        layers: [
          {
            id: "background",
            label: "Background Layer",
            layout: {
              region: "full_canvas",
              anchor: "center",
            },
            paths: [
              {
                id: "bg_rect",
                style: {
                  fill: "#F3F4F6",
                  stroke: "none",
                },
                commands: [
                  { cmd: "M", coords: [0, 0] },
                  { cmd: "L", coords: [512, 0] },
                  { cmd: "L", coords: [512, 512] },
                  { cmd: "L", coords: [0, 512] },
                  { cmd: "Z", coords: [] },
                ],
                layout: {
                  region: "full_canvas",
                  anchor: "top_left",
                },
              },
            ],
          },
          {
            id: "main_content",
            label: "Main Content",
            layout: {
              region: "center",
              anchor: "center",
            },
            paths: [
              {
                id: "circle_1",
                style: {
                  fill: "#3B82F6",
                  stroke: "#1E40AF",
                  strokeWidth: 2,
                  opacity: 0.8,
                },
                commands: [
                  { cmd: "M", coords: [256, 206] },
                  { cmd: "C", coords: [283.61, 206, 306, 228.39, 306, 256] },
                  { cmd: "C", coords: [306, 283.61, 283.61, 306, 256, 306] },
                  { cmd: "C", coords: [228.39, 306, 206, 283.61, 206, 256] },
                  { cmd: "C", coords: [206, 228.39, 228.39, 206, 256, 206] },
                  { cmd: "Z", coords: [] },
                ],
                layout: {
                  region: "center",
                  anchor: "center",
                  size: {
                    relative: 0.4,
                  },
                },
              },
              {
                id: "decorative_elements",
                style: {
                  fill: "#10B981",
                  stroke: "#059669",
                  strokeWidth: 1,
                },
                commands: [
                  { cmd: "M", coords: [200, 200] },
                  { cmd: "L", coords: [220, 180] },
                  { cmd: "L", coords: [240, 200] },
                  { cmd: "L", coords: [220, 220] },
                  { cmd: "Z", coords: [] },
                ],
                layout: {
                  region: "center",
                  anchor: "center",
                  offset: [-0.3, -0.3],
                  repeat: {
                    type: "radial",
                    count: 6,
                    radius: 80,
                  },
                },
              },
            ],
          },
          {
            id: "custom_content",
            label: "Custom Region Content",
            layout: {
              region: "custom_region",
              anchor: "center",
            },
            paths: [
              {
                id: "custom_shape",
                style: {
                  fill: "#F59E0B",
                  stroke: "#D97706",
                  strokeWidth: 1.5,
                },
                commands: [
                  { cmd: "M", coords: [100, 100] },
                  { cmd: "Q", coords: [150, 80, 200, 100] },
                  { cmd: "L", coords: [180, 140] },
                  { cmd: "Q", coords: [150, 160, 120, 140] },
                  { cmd: "Z", coords: [] },
                ],
                layout: {
                  region: "custom_region",
                  anchor: "center",
                  size: {
                    aspect_constrained: {
                      width: 80,
                      aspect: 1.2,
                    },
                  },
                },
              },
            ],
          },
        ],
      };

      const report = validator.validateUnifiedDocument(complexDocument);

      // Should be valid
      expect(report.success).toBe(true);
      expect(report.errors).toHaveLength(0);

      // Should have comprehensive statistics
      expect(report.statistics.totalLayers).toBe(3);
      expect(report.statistics.totalPaths).toBe(3);
      expect(report.statistics.regionsUsed).toContain("full_canvas");
      expect(report.statistics.regionsUsed).toContain("center");
      expect(report.statistics.regionsUsed).toContain("custom_region");
      expect(report.statistics.anchorsUsed).toContain("center");
      expect(report.statistics.anchorsUsed).toContain("top_left");

      // Should have reasonable coordinate range
      expect(report.statistics.coordinateRange.minX).toBeGreaterThanOrEqual(0);
      expect(report.statistics.coordinateRange.maxX).toBeLessThanOrEqual(512);
      expect(report.statistics.coordinateRange.minY).toBeGreaterThanOrEqual(0);
      expect(report.statistics.coordinateRange.maxY).toBeLessThanOrEqual(512);
    });

    it("should detect and categorize multiple types of errors", () => {
      const problematicDocument: UnifiedLayeredSVGDocument = {
        version: "invalid-version" as any,
        canvas: {
          width: 0, // Invalid
          height: 4096, // Too large
          aspectRatio: "1:1",
        },
        layers: [
          {
            id: "", // Missing ID
            label: "", // Missing label
            layout: {
              region: "nonexistent_region" as any,
              anchor: "invalid_anchor" as any,
              offset: [2, -3], // Out of range
            },
            paths: [
              {
                id: "", // Missing ID
                style: {
                  fill: "invalid-color",
                  stroke: "#GGGGGG",
                  strokeWidth: -5,
                  opacity: 2,
                },
                commands: [
                  { cmd: "X" as any, coords: [100, 100] }, // Invalid command
                  { cmd: "M", coords: [600, 700, 800] }, // Wrong coord count
                  { cmd: "L", coords: [900, 1000] }, // Out of bounds
                ],
                layout: {
                  region: "another_invalid_region" as any,
                  size: {
                    relative: 1.5, // Out of range
                    absolute: { width: 100, height: 100 }, // Multiple size specs
                  },
                  repeat: {
                    type: "invalid_type" as any,
                    count: -1,
                  },
                },
              },
            ],
          },
        ],
      };

      const report = validator.validateUnifiedDocument(problematicDocument);

      expect(report.success).toBe(false);

      // Should have errors in all categories
      const errorCategories = new Set(report.errors.map((e) => e.category));
      expect(errorCategories).toContain("structure");
      expect(errorCategories).toContain("style");
      expect(errorCategories).toContain("layout");

      // Should have specific error types
      expect(report.errors).toContainEqual(
        expect.objectContaining({
          message: "Invalid document version: invalid-version",
        })
      );
      expect(report.errors).toContainEqual(
        expect.objectContaining({
          message: "Canvas dimensions must be positive",
        })
      );
      expect(report.errors).toContainEqual(
        expect.objectContaining({
          message: expect.stringContaining("missing required id"),
        })
      );
      expect(report.errors).toContainEqual(
        expect.objectContaining({
          message: "Unknown region: nonexistent_region",
        })
      );
      expect(report.errors).toContainEqual(
        expect.objectContaining({
          message: "Invalid anchor: invalid_anchor",
        })
      );
      expect(report.errors).toContainEqual(
        expect.objectContaining({
          message: "Invalid fill color: invalid-color",
        })
      );
      expect(report.errors).toContainEqual(
        expect.objectContaining({
          message: "Invalid path command 'X' at index 0",
        })
      );
    });

    it("should apply auto-fixes when enabled", () => {
      const fixableDocument: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: {
          width: 512,
          height: 512,
          aspectRatio: "1:1",
        },
        layers: [
          {
            id: "", // Will be auto-fixed
            label: "", // Will be auto-fixed
            paths: [
              {
                id: "", // Will be auto-fixed
                style: {
                  fill: "#3B82F6",
                },
                commands: [
                  { cmd: "M", coords: [600, 700] }, // Out of bounds, will be clamped
                  { cmd: "L", coords: [800, 900] }, // Out of bounds, will be clamped
                  { cmd: "Z", coords: [] },
                ],
              },
            ],
          },
        ],
      };

      const report = validator.validateUnifiedDocument(fixableDocument);

      expect(report.autoFixApplied).toBe(true);
      expect(report.fixedDocument).toBeDefined();

      if (report.fixedDocument) {
        const fixedLayer = report.fixedDocument.layers[0];
        const fixedPath = fixedLayer.paths[0];

        // Should have auto-generated IDs
        expect(fixedLayer.id).toBe("layer_0");
        expect(fixedLayer.label).toBe("Layer 1");
        expect(fixedPath.id).toBe("path_0");

        // Should have clamped coordinates
        expect(fixedPath.commands[0].coords[0]).toBeLessThanOrEqual(512);
        expect(fixedPath.commands[0].coords[1]).toBeLessThanOrEqual(512);
        expect(fixedPath.commands[1].coords[0]).toBeLessThanOrEqual(512);
        expect(fixedPath.commands[1].coords[1]).toBeLessThanOrEqual(512);
      }
    });
  });

  describe("Model Feedback Generation", () => {
    it("should generate actionable feedback for AI model correction", () => {
      const problematicDocument: UnifiedLayeredSVGDocument = {
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
                  fill: "invalid-color",
                  stroke: "#GGGGGG",
                },
                commands: [
                  { cmd: "L", coords: [100, 100] }, // Should start with M
                  { cmd: "M", coords: [600, 700] }, // Out of bounds
                ],
                layout: {
                  region: "nonexistent_region" as any,
                  anchor: "invalid_anchor" as any,
                },
              },
            ],
          },
        ],
      };

      const report = validator.validateUnifiedDocument(problematicDocument);
      const feedback = validator.generateModelFeedback(report);

      expect(feedback).toContain("Critical issues found:");
      expect(feedback).toContain("Layout language issues:");

      // Should provide specific suggestions
      expect(
        feedback.some((f) => f.includes("Use valid hex color format"))
      ).toBe(true);
      expect(
        feedback.some((f) => f.includes("Add a Move command at the beginning"))
      ).toBe(true);
      expect(feedback.some((f) => f.includes("Use one of:"))).toBe(true);
    });

    it("should prioritize critical errors over warnings", () => {
      const mixedIssuesDocument: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: {
          width: 4096, // Large but valid (warning)
          height: 4096,
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
                  fill: "invalid-color", // Critical error
                },
                commands: [
                  { cmd: "M", coords: [100, 100] },
                  { cmd: "L", coords: [200, 200] },
                ],
              },
            ],
          },
        ],
      };

      const report = validator.validateUnifiedDocument(mixedIssuesDocument);
      const feedback = validator.generateModelFeedback(report);

      // Critical errors should appear first
      const criticalIndex = feedback.findIndex((f) =>
        f.includes("Critical issues found")
      );
      const performanceIndex = feedback.findIndex((f) =>
        f.includes("Performance recommendations")
      );

      expect(criticalIndex).toBeLessThan(performanceIndex);
    });

    it("should provide context-aware suggestions", () => {
      const contextDocument: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: {
          width: 512,
          height: 512,
          aspectRatio: "1:1",
        },
        layers: [
          {
            id: "layer_with_many_paths",
            label: "Layer with Many Paths",
            paths: Array.from({ length: 25 }, (_, i) => ({
              id: `path_${i}`,
              style: { fill: "#3B82F6" },
              commands: [
                { cmd: "M", coords: [100 + i, 100 + i] },
                { cmd: "L", coords: [200 + i, 200 + i] },
              ],
            })),
          },
        ],
      };

      const report = validator.validateUnifiedDocument(contextDocument);
      const feedback = validator.generateModelFeedback(report);

      expect(
        feedback.some((f) =>
          f.includes("Consider splitting into multiple layers")
        )
      ).toBe(true);
    });
  });

  describe("Integration with Error Handler", () => {
    it("should work with error handler for comprehensive validation", async () => {
      // This would typically be used in a generation pipeline
      const invalidDocument: UnifiedLayeredSVGDocument = {
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
                  fill: "#3B82F6",
                },
                commands: [
                  { cmd: "M", coords: [1000, 1000] }, // Way out of bounds
                  { cmd: "L", coords: [2000, 2000] },
                ],
              },
            ],
          },
        ],
      };

      const report = validator.validateUnifiedDocument(invalidDocument);

      // Should detect coordinate issues
      expect(
        report.warnings.some((w) => w.message.includes("outside valid range"))
      ).toBe(true);

      // Should provide auto-fix
      expect(report.autoFixApplied).toBe(true);
      expect(report.fixedDocument).toBeDefined();

      // Error handler could use this feedback for model correction
      const feedback = validator.generateModelFeedback(report);
      expect(feedback.length).toBeGreaterThan(0);
    });

    it("should validate performance characteristics", () => {
      const performanceDocument: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: {
          width: 512,
          height: 512,
          aspectRatio: "1:1",
        },
        layers: Array.from({ length: 15 }, (_, i) => ({
          id: `layer_${i}`,
          label: `Layer ${i}`,
          paths: Array.from({ length: 30 }, (_, j) => ({
            id: `path_${i}_${j}`,
            style: { fill: "#3B82F6" },
            commands: Array.from({ length: 60 }, (_, k) => ({
              cmd: k === 0 ? ("M" as const) : ("L" as const),
              coords: [100 + k, 100 + k],
            })),
          })),
        })),
      };

      const report = validator.validateUnifiedDocument(performanceDocument);

      // Should warn about performance issues
      expect(report.warnings.some((w) => w.category === "performance")).toBe(
        true
      );

      // Should provide statistics for monitoring
      expect(report.statistics.totalLayers).toBe(15);
      expect(report.statistics.totalPaths).toBe(450); // 15 * 30
      expect(report.statistics.totalCommands).toBe(27000); // 15 * 30 * 60
    });
  });

  describe("Custom Region Validation", () => {
    it("should validate custom regions in layout configuration", () => {
      const customRegionDocument: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: {
          width: 512,
          height: 512,
          aspectRatio: "1:1",
        },
        layout: {
          regions: [
            {
              name: "", // Invalid: empty name
              bounds: { x: 0.1, y: 0.1, width: 0.3, height: 0.3 },
            },
            {
              name: "valid_region",
              bounds: { x: -0.1, y: 0.5, width: 1.2, height: 0.3 }, // Invalid bounds
            },
            {
              name: "overlapping_region",
              bounds: { x: 0.8, y: 0.8, width: 0.5, height: 0.5 }, // Extends beyond canvas
            },
          ],
        },
        layers: [
          {
            id: "test_layer",
            label: "Test Layer",
            paths: [
              {
                id: "test_path",
                style: { fill: "#3B82F6" },
                commands: [
                  { cmd: "M", coords: [100, 100] },
                  { cmd: "L", coords: [200, 200] },
                ],
              },
            ],
          },
        ],
      };

      const report = validator.validateUnifiedDocument(customRegionDocument);

      expect(report.success).toBe(false);
      expect(report.errors).toContainEqual(
        expect.objectContaining({
          message: "Custom region missing name",
        })
      );
      expect(report.errors).toContainEqual(
        expect.objectContaining({
          message: "Custom region 'valid_region' has invalid bounds",
        })
      );
      expect(report.errors).toContainEqual(
        expect.objectContaining({
          message:
            "Custom region 'overlapping_region' extends beyond canvas bounds",
        })
      );
    });

    it("should allow valid custom regions", () => {
      const validCustomRegionDocument: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: {
          width: 512,
          height: 512,
          aspectRatio: "1:1",
        },
        layout: {
          regions: [
            {
              name: "header_region",
              bounds: { x: 0, y: 0, width: 1, height: 0.2 },
            },
            {
              name: "sidebar_region",
              bounds: { x: 0, y: 0.2, width: 0.3, height: 0.8 },
            },
          ],
        },
        layers: [
          {
            id: "header",
            label: "Header",
            layout: {
              region: "header_region",
              anchor: "center",
            },
            paths: [
              {
                id: "header_content",
                style: { fill: "#3B82F6" },
                commands: [
                  { cmd: "M", coords: [100, 50] },
                  { cmd: "L", coords: [400, 50] },
                  { cmd: "L", coords: [400, 100] },
                  { cmd: "L", coords: [100, 100] },
                  { cmd: "Z", coords: [] },
                ],
                layout: {
                  region: "header_region",
                  anchor: "center",
                },
              },
            ],
          },
        ],
      };

      const report = validator.validateUnifiedDocument(
        validCustomRegionDocument
      );

      expect(report.success).toBe(true);
      expect(report.statistics.regionsUsed).toContain("header_region");
    });
  });
});
