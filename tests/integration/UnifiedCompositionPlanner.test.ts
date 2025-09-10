/**
 * Integration tests for enhanced CompositionPlanner with unified layout specifications
 */

import { describe, it, expect, beforeEach } from "vitest";
import { CompositionPlanner } from "../../server/services/CompositionPlanner";
import type { DesignIntent } from "../../server/types/pipeline";
import type { AspectRatio } from "../../server/types/unified-layered";

describe("Unified CompositionPlanner Integration", () => {
  let planner: CompositionPlanner;

  beforeEach(() => {
    planner = new CompositionPlanner(12345, "1:1"); // Fixed seed for consistent tests
  });

  describe("planUnified", () => {
    it("should generate unified composition with layout specifications", async () => {
      const intent: DesignIntent = {
        style: {
          palette: ["#3B82F6", "#10B981", "#EF4444"],
          strokeRules: {
            strokeOnly: false,
            minStrokeWidth: 1,
            maxStrokeWidth: 3,
            allowFill: true,
          },
          density: "medium",
          symmetry: "none",
        },
        motifs: ["circle", "square"],
        layout: {
          sizes: [{ type: "default", minSize: 50, maxSize: 100 }],
          counts: [{ type: "element", min: 3, max: 6, preferred: 4 }],
          arrangement: "grid",
        },
        constraints: {
          strokeOnly: false,
          maxElements: 10,
          requiredMotifs: ["circle"],
        },
      };

      const grounding = {
        motifs: [
          { name: "circle", type: "shape" },
          { name: "square", type: "shape" },
        ],
      };

      const context = {
        targetSize: { width: 512, height: 512 },
        aspectRatio: "1:1" as AspectRatio,
        useUnifiedLayout: true,
      };

      const result = await planner.planUnified(intent, grounding, context);

      // Validate unified document structure
      expect(result.unifiedDocument.version).toBe("unified-layered-1.0");
      expect(result.unifiedDocument.canvas.width).toBe(512);
      expect(result.unifiedDocument.canvas.height).toBe(512);
      expect(result.unifiedDocument.canvas.aspectRatio).toBe("1:1");

      // Validate layers
      expect(result.unifiedDocument.layers).toBeDefined();
      expect(result.unifiedDocument.layers.length).toBeGreaterThan(0);

      // Validate layer structure
      for (const layer of result.unifiedDocument.layers) {
        expect(layer.id).toBeDefined();
        expect(layer.label).toBeDefined();
        expect(layer.paths).toBeDefined();
        expect(layer.paths.length).toBeGreaterThan(0);

        // Validate layer layout
        if (layer.layout) {
          expect(layer.layout.zIndex).toBeDefined();
        }

        // Validate paths
        for (const path of layer.paths) {
          expect(path.id).toBeDefined();
          expect(path.style).toBeDefined();
          expect(path.commands).toBeDefined();
          expect(path.commands.length).toBeGreaterThan(0);

          // Validate path layout
          if (path.layout) {
            expect(path.layout.region).toBeDefined();
            expect(path.layout.anchor).toBeDefined();
          }
        }
      }

      // Validate layout specifications
      expect(result.layoutSpecifications).toBeDefined();
      expect(result.layoutSpecifications.length).toBeGreaterThan(0);

      // Validate semantic regions
      expect(result.semanticRegions).toBeDefined();
      expect(result.semanticRegions.length).toBeGreaterThan(0);

      // Validate anchor points
      expect(result.anchorPoints).toBeDefined();
      expect(result.anchorPoints.length).toBeGreaterThan(0);

      // Validate metadata
      expect(result.metadata.totalLayers).toBe(
        result.unifiedDocument.layers.length
      );
      expect(result.metadata.totalPaths).toBeGreaterThan(0);
      expect(result.metadata.usedRegions).toEqual(result.semanticRegions);
      expect(["simple", "medium", "complex"]).toContain(
        result.metadata.designComplexity
      );
    });

    it("should handle different arrangement types", async () => {
      const arrangements = [
        "centered",
        "grid",
        "scattered",
        "organic",
      ] as const;

      for (const arrangement of arrangements) {
        const intent: DesignIntent = {
          style: {
            palette: ["#3B82F6"],
            strokeRules: {
              strokeOnly: false,
              minStrokeWidth: 1,
              maxStrokeWidth: 2,
              allowFill: true,
            },
            density: "medium",
            symmetry: "none",
          },
          motifs: ["circle"],
          layout: {
            sizes: [{ type: "default", minSize: 50, maxSize: 100 }],
            counts: [{ type: "element", min: 2, max: 4, preferred: 3 }],
            arrangement,
          },
          constraints: {
            strokeOnly: false,
            maxElements: 5,
            requiredMotifs: [],
          },
        };

        const result = await planner.planUnified(
          intent,
          {},
          {
            targetSize: { width: 512, height: 512 },
            aspectRatio: "1:1",
          }
        );

        expect(result.unifiedDocument.layers.length).toBeGreaterThan(0);
        expect(result.semanticRegions.length).toBeGreaterThan(0);

        // Validate arrangement-specific regions
        if (arrangement === "centered") {
          expect(result.semanticRegions).toContain("center");
        } else if (arrangement === "grid") {
          expect(result.semanticRegions.length).toBeGreaterThanOrEqual(3);
        }
      }
    });

    it("should handle different symmetry types", async () => {
      const symmetries = ["none", "horizontal", "vertical", "radial"] as const;

      for (const symmetry of symmetries) {
        const intent: DesignIntent = {
          style: {
            palette: ["#10B981", "#EF4444"],
            strokeRules: {
              strokeOnly: false,
              minStrokeWidth: 1,
              maxStrokeWidth: 2,
              allowFill: true,
            },
            density: "medium",
            symmetry,
          },
          motifs: ["square"],
          layout: {
            sizes: [{ type: "default", minSize: 50, maxSize: 100 }],
            counts: [{ type: "element", min: 2, max: 4, preferred: 3 }],
            arrangement: "centered",
          },
          constraints: {
            strokeOnly: false,
            maxElements: 6,
            requiredMotifs: [],
          },
        };

        const result = await planner.planUnified(
          intent,
          {},
          {
            targetSize: { width: 512, height: 512 },
            aspectRatio: "1:1",
          }
        );

        expect(result.anchorPoints.length).toBeGreaterThan(0);

        // Validate symmetry-specific anchors
        if (symmetry === "horizontal") {
          expect(result.anchorPoints).toContain("center");
        } else if (symmetry === "vertical") {
          expect(result.anchorPoints).toContain("center");
        } else if (symmetry === "radial") {
          expect(result.anchorPoints).toContain("center");
        }
      }
    });

    it("should handle different aspect ratios", async () => {
      const aspectRatios: AspectRatio[] = ["1:1", "4:3", "16:9", "3:2"];

      for (const aspectRatio of aspectRatios) {
        const planner = new CompositionPlanner(12345, aspectRatio);

        const intent: DesignIntent = {
          style: {
            palette: ["#8B5CF6"],
            strokeRules: {
              strokeOnly: false,
              minStrokeWidth: 1,
              maxStrokeWidth: 2,
              allowFill: true,
            },
            density: "medium",
            symmetry: "none",
          },
          motifs: ["triangle"],
          layout: {
            sizes: [{ type: "default", minSize: 50, maxSize: 100 }],
            counts: [{ type: "element", min: 1, max: 3, preferred: 2 }],
            arrangement: "centered",
          },
          constraints: {
            strokeOnly: false,
            maxElements: 5,
            requiredMotifs: [],
          },
        };

        const result = await planner.planUnified(
          intent,
          {},
          {
            targetSize: { width: 512, height: 512 },
            aspectRatio,
          }
        );

        expect(result.unifiedDocument.canvas.aspectRatio).toBe(aspectRatio);

        // Different aspect ratios have different dimensions
        const expectedDimensions: Record<
          AspectRatio,
          { width: number; height: number }
        > = {
          "1:1": { width: 512, height: 512 },
          "4:3": { width: 512, height: 384 },
          "16:9": { width: 512, height: 288 },
          "3:2": { width: 512, height: 341 },
          "2:3": { width: 341, height: 512 },
          "9:16": { width: 288, height: 512 },
        };

        expect(result.unifiedDocument.canvas.width).toBe(
          expectedDimensions[aspectRatio].width
        );
        expect(result.unifiedDocument.canvas.height).toBe(
          expectedDimensions[aspectRatio].height
        );
      }
    });

    it("should handle different design complexities", async () => {
      const complexityConfigs = [
        { elements: 2, motifs: ["circle"], expected: "simple" },
        {
          elements: 5,
          motifs: ["circle", "square", "triangle"],
          expected: "medium",
        },
        {
          elements: 10,
          motifs: ["circle", "square", "triangle", "line", "curve"],
          expected: "complex",
        },
      ];

      for (const config of complexityConfigs) {
        const intent: DesignIntent = {
          style: {
            palette: ["#F59E0B", "#DC2626"],
            strokeRules: {
              strokeOnly: false,
              minStrokeWidth: 1,
              maxStrokeWidth: 2,
              allowFill: true,
            },
            density: "medium",
            symmetry: "none",
          },
          motifs: config.motifs,
          layout: {
            sizes: [{ type: "default", minSize: 50, maxSize: 100 }],
            counts: [
              {
                type: "element",
                min: config.elements,
                max: config.elements,
                preferred: config.elements,
              },
            ],
            arrangement: "grid",
          },
          constraints: {
            strokeOnly: false,
            maxElements: config.elements,
            requiredMotifs: [],
          },
        };

        const result = await planner.planUnified(
          intent,
          {},
          {
            targetSize: { width: 512, height: 512 },
            aspectRatio: "1:1",
          }
        );

        expect(result.metadata.designComplexity).toBe(config.expected);
        expect(result.metadata.totalPaths).toBeGreaterThanOrEqual(
          config.elements
        );
      }
    });

    it("should generate appropriate layer organization", async () => {
      const intent: DesignIntent = {
        style: {
          palette: ["#6366F1", "#EC4899", "#F59E0B"],
          strokeRules: {
            strokeOnly: false,
            minStrokeWidth: 1,
            maxStrokeWidth: 3,
            allowFill: true,
          },
          density: "dense",
          symmetry: "none",
        },
        motifs: ["circle", "square", "triangle"],
        layout: {
          sizes: [{ type: "default", minSize: 30, maxSize: 80 }],
          counts: [{ type: "element", min: 8, max: 12, preferred: 10 }],
          arrangement: "scattered",
        },
        constraints: {
          strokeOnly: false,
          maxElements: 15,
          requiredMotifs: ["circle"],
        },
      };

      const result = await planner.planUnified(
        intent,
        {},
        {
          targetSize: { width: 512, height: 512 },
          aspectRatio: "1:1",
        }
      );

      // Complex design should have multiple layers
      expect(result.unifiedDocument.layers.length).toBeGreaterThan(1);

      // Should have background, main, and possibly details layers
      const layerTypes = result.unifiedDocument.layers.map((layer) => layer.id);
      expect(layerTypes.some((id) => id.includes("main"))).toBe(true);

      // Layers should have proper z-index ordering
      for (const layer of result.unifiedDocument.layers) {
        if (layer.layout?.zIndex) {
          expect(layer.layout.zIndex).toBeGreaterThan(0);
        }
      }
    });

    it("should handle motif-specific anchor selection", async () => {
      const motifTests = [
        { motif: "circle", expectedAnchor: "center" },
        { motif: "triangle", expectedAnchor: "bottom_center" },
        { motif: "line", expectedAnchor: "middle_left" },
      ];

      for (const test of motifTests) {
        const intent: DesignIntent = {
          style: {
            palette: ["#059669"],
            strokeRules: {
              strokeOnly: false,
              minStrokeWidth: 1,
              maxStrokeWidth: 2,
              allowFill: true,
            },
            density: "medium",
            symmetry: "none",
          },
          motifs: [test.motif],
          layout: {
            sizes: [{ type: "default", minSize: 50, maxSize: 100 }],
            counts: [{ type: "element", min: 1, max: 1, preferred: 1 }],
            arrangement: "centered",
          },
          constraints: {
            strokeOnly: false,
            maxElements: 3,
            requiredMotifs: [],
          },
        };

        const result = await planner.planUnified(
          intent,
          {},
          {
            targetSize: { width: 512, height: 512 },
            aspectRatio: "1:1",
          }
        );

        expect(result.anchorPoints).toContain(test.expectedAnchor);
      }
    });

    it("should generate valid layout specifications", async () => {
      const intent: DesignIntent = {
        style: {
          palette: ["#7C3AED", "#DB2777"],
          strokeRules: {
            strokeOnly: false,
            minStrokeWidth: 1,
            maxStrokeWidth: 2,
            allowFill: true,
          },
          density: "medium",
          symmetry: "none",
        },
        motifs: ["square", "circle"],
        layout: {
          sizes: [{ type: "default", minSize: 40, maxSize: 80 }],
          counts: [{ type: "element", min: 4, max: 6, preferred: 5 }],
          arrangement: "grid",
        },
        constraints: {
          strokeOnly: false,
          maxElements: 8,
          requiredMotifs: [],
        },
      };

      const result = await planner.planUnified(
        intent,
        {},
        {
          targetSize: { width: 512, height: 512 },
          aspectRatio: "1:1",
        }
      );

      // Validate all layout specifications
      for (const spec of result.layoutSpecifications) {
        if (spec.region) {
          expect([
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
          ]).toContain(spec.region);
        }

        if (spec.anchor) {
          expect([
            "center",
            "top_left",
            "top_right",
            "bottom_left",
            "bottom_right",
            "top_center",
            "bottom_center",
            "middle_left",
            "middle_right",
          ]).toContain(spec.anchor);
        }

        if (spec.size) {
          if (spec.size.relative) {
            expect(spec.size.relative).toBeGreaterThan(0);
            expect(spec.size.relative).toBeLessThanOrEqual(1);
          }
        }

        if (spec.repeat) {
          expect(["grid", "radial"]).toContain(spec.repeat.type);
          expect(spec.repeat.count).toBeDefined();
        }
      }
    });

    it("should maintain consistency with seeded random generation", async () => {
      const intent: DesignIntent = {
        style: {
          palette: ["#1F2937", "#F3F4F6"],
          strokeRules: {
            strokeOnly: true,
            minStrokeWidth: 1,
            maxStrokeWidth: 3,
            allowFill: false,
          },
          density: "medium",
          symmetry: "none",
        },
        motifs: ["line"],
        layout: {
          sizes: [{ type: "default", minSize: 50, maxSize: 100 }],
          counts: [{ type: "element", min: 3, max: 3, preferred: 3 }],
          arrangement: "scattered",
        },
        constraints: {
          strokeOnly: true,
          maxElements: 5,
          requiredMotifs: [],
        },
      };

      // Generate twice with same seed
      const planner1 = new CompositionPlanner(54321, "1:1");
      const planner2 = new CompositionPlanner(54321, "1:1");

      const result1 = await planner1.planUnified(
        intent,
        {},
        {
          targetSize: { width: 512, height: 512 },
          aspectRatio: "1:1",
        }
      );

      const result2 = await planner2.planUnified(
        intent,
        {},
        {
          targetSize: { width: 512, height: 512 },
          aspectRatio: "1:1",
        }
      );

      // Results should be identical
      expect(result1.metadata.totalLayers).toBe(result2.metadata.totalLayers);
      expect(result1.metadata.totalPaths).toBe(result2.metadata.totalPaths);
      expect(result1.semanticRegions).toEqual(result2.semanticRegions);
      expect(result1.anchorPoints).toEqual(result2.anchorPoints);
    });
  });

  describe("backward compatibility", () => {
    it("should still support original plan method", async () => {
      const intent: DesignIntent = {
        style: {
          palette: ["#2563EB"],
          strokeRules: {
            strokeOnly: false,
            minStrokeWidth: 1,
            maxStrokeWidth: 2,
            allowFill: true,
          },
          density: "medium",
          symmetry: "none",
        },
        motifs: ["circle"],
        layout: {
          sizes: [{ type: "default", minSize: 50, maxSize: 100 }],
          counts: [{ type: "element", min: 2, max: 2, preferred: 2 }],
          arrangement: "centered",
        },
        constraints: {
          strokeOnly: false,
          maxElements: 5,
          requiredMotifs: [],
        },
      };

      const result = await planner.plan(
        intent,
        {},
        {
          targetSize: { width: 400, height: 400 },
        }
      );

      expect(result.components).toBeDefined();
      expect(result.layout).toBeDefined();
      expect(result.zIndex).toBeDefined();
      expect(result.components.length).toBe(2);
    });
  });
});
