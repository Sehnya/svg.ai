/**
 * Integration tests for enhanced SVGSynthesizer with unified layout processing
 */

import { describe, it, expect, beforeEach } from "vitest";
import { SVGSynthesizer } from "../../server/services/SVGSynthesizer";
import { CompositionPlanner } from "../../server/services/CompositionPlanner";
import type { DesignIntent } from "../../server/types/pipeline";
import type { AspectRatio } from "../../server/types/unified-layered";

describe("Unified SVGSynthesizer Integration", () => {
  let synthesizer: SVGSynthesizer;
  let planner: CompositionPlanner;

  beforeEach(() => {
    synthesizer = new SVGSynthesizer("1:1");
    planner = new CompositionPlanner(12345, "1:1");
  });

  describe("synthesizeUnified", () => {
    it("should synthesize with unified layout processing", async () => {
      const intent: DesignIntent = {
        style: {
          palette: ["#3B82F6", "#10B981"],
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
          counts: [{ type: "element", min: 3, max: 5, preferred: 4 }],
          arrangement: "grid",
        },
        constraints: {
          strokeOnly: false,
          maxElements: 8,
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
        prompt: "blue circles and green squares in a grid",
        seed: 12345,
        aspectRatio: "1:1" as AspectRatio,
        useUnifiedLayout: true,
      };

      // Generate unified plan
      const unifiedPlan = await planner.planUnified(intent, grounding, context);

      // Synthesize with unified layout
      const result = await synthesizer.synthesizeUnified(
        unifiedPlan,
        grounding,
        context,
        {
          enableLayoutLanguage: true,
          enforceCanvasConstraints: true,
          fallbackToTraditional: true,
        }
      );

      // Validate result structure
      expect(result.document).toBeDefined();
      expect(result.document.components).toBeDefined();
      expect(result.document.components.length).toBeGreaterThan(0);
      expect(result.document.bounds).toBeDefined();
      expect(result.document.palette).toBeDefined();
      expect(result.document.metadata).toBeDefined();

      // Validate unified-specific data
      expect(result.unifiedDocument).toBeDefined();
      expect(result.layoutSpecifications).toBeDefined();
      expect(result.coordinateMapping).toBeDefined();

      // Validate metadata
      expect(result.metadata.synthesisMethod).toBe("unified");
      expect(result.metadata.layoutProcessed).toBe(true);
      expect(result.metadata.coordinatesConverted).toBe(true);

      // Validate coordinate mapping
      if (result.coordinateMapping) {
        expect(
          result.coordinateMapping.originalPositions.length
        ).toBeGreaterThan(0);
        expect(result.coordinateMapping.mappedPositions.length).toBeGreaterThan(
          0
        );
        expect(result.coordinateMapping.originalPositions.length).toBe(
          result.coordinateMapping.mappedPositions.length
        );
      }
    });

    it("should handle different aspect ratios", async () => {
      const aspectRatios: AspectRatio[] = ["1:1", "4:3", "16:9"];

      for (const aspectRatio of aspectRatios) {
        const synthesizer = new SVGSynthesizer(aspectRatio);
        const planner = new CompositionPlanner(12345, aspectRatio);

        const intent: DesignIntent = {
          style: {
            palette: ["#EF4444"],
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
            counts: [{ type: "element", min: 2, max: 3, preferred: 2 }],
            arrangement: "centered",
          },
          constraints: {
            strokeOnly: false,
            maxElements: 5,
            requiredMotifs: [],
          },
        };

        const context = {
          prompt: "red triangles",
          aspectRatio,
          useUnifiedLayout: true,
        };

        const unifiedPlan = await planner.planUnified(intent, {}, context);
        const result = await synthesizer.synthesizeUnified(
          unifiedPlan,
          {},
          context
        );

        expect(result.unifiedDocument?.canvas.aspectRatio).toBe(aspectRatio);
        expect(result.document.bounds.width).toBeGreaterThan(0);
        expect(result.document.bounds.height).toBeGreaterThan(0);
      }
    });

    it("should process layout specifications correctly", async () => {
      const intent: DesignIntent = {
        style: {
          palette: ["#8B5CF6", "#EC4899"],
          strokeRules: {
            strokeOnly: false,
            minStrokeWidth: 1,
            maxStrokeWidth: 2,
            allowFill: true,
          },
          density: "medium",
          symmetry: "horizontal",
        },
        motifs: ["circle"],
        layout: {
          sizes: [{ type: "default", minSize: 60, maxSize: 120 }],
          counts: [{ type: "element", min: 4, max: 6, preferred: 5 }],
          arrangement: "grid",
        },
        constraints: {
          strokeOnly: false,
          maxElements: 8,
          requiredMotifs: [],
        },
      };

      const context = {
        prompt: "purple circles with horizontal symmetry",
        seed: 54321,
        useUnifiedLayout: true,
      };

      const unifiedPlan = await planner.planUnified(intent, {}, context);
      const result = await synthesizer.synthesizeUnified(
        unifiedPlan,
        {},
        context
      );

      // Validate layout processing
      expect(result.layoutSpecifications).toBeDefined();
      expect(result.layoutSpecifications!.length).toBeGreaterThan(0);

      // Validate coordinate mapping
      expect(result.coordinateMapping).toBeDefined();
      expect(
        result.coordinateMapping!.originalPositions.length
      ).toBeGreaterThan(0);
      expect(result.coordinateMapping!.mappedPositions.length).toBeGreaterThan(
        0
      );

      // Validate that coordinates are within canvas bounds
      for (const pos of result.coordinateMapping!.mappedPositions) {
        expect(pos.x).toBeGreaterThanOrEqual(0);
        expect(pos.x).toBeLessThanOrEqual(512);
        expect(pos.y).toBeGreaterThanOrEqual(0);
        expect(pos.y).toBeLessThanOrEqual(512);
      }
    });

    it("should fallback to traditional synthesis when unified fails", async () => {
      const intent: DesignIntent = {
        style: {
          palette: ["#F59E0B"],
          strokeRules: {
            strokeOnly: true,
            minStrokeWidth: 2,
            maxStrokeWidth: 4,
            allowFill: false,
          },
          density: "sparse",
          symmetry: "none",
        },
        motifs: ["line"],
        layout: {
          sizes: [{ type: "default", minSize: 40, maxSize: 80 }],
          counts: [{ type: "element", min: 2, max: 2, preferred: 2 }],
          arrangement: "scattered",
        },
        constraints: {
          strokeOnly: true,
          maxElements: 3,
          requiredMotifs: [],
        },
      };

      const context = {
        prompt: "yellow lines scattered",
        useUnifiedLayout: true,
      };

      const unifiedPlan = await planner.planUnified(intent, {}, context);

      // Force an error in unified processing by disabling layout language
      const result = await synthesizer.synthesizeUnified(
        unifiedPlan,
        {},
        context,
        {
          enableLayoutLanguage: false,
          useConstrainedGenerator: false,
          useLayeredGenerator: false,
          fallbackToTraditional: true,
        }
      );

      // Should fallback to traditional synthesis
      expect(result.document).toBeDefined();
      expect(result.metadata.synthesisMethod).toBe("traditional");
      expect(result.metadata.layoutProcessed).toBe(false);
      expect(result.metadata.coordinatesConverted).toBe(false);
    });

    it("should handle complex multi-layer designs", async () => {
      const intent: DesignIntent = {
        style: {
          palette: ["#DC2626", "#16A34A", "#2563EB", "#CA8A04"],
          strokeRules: {
            strokeOnly: false,
            minStrokeWidth: 1,
            maxStrokeWidth: 3,
            allowFill: true,
          },
          density: "dense",
          symmetry: "radial",
        },
        motifs: ["circle", "square", "triangle", "star"],
        layout: {
          sizes: [{ type: "default", minSize: 30, maxSize: 90 }],
          counts: [{ type: "element", min: 8, max: 12, preferred: 10 }],
          arrangement: "organic",
        },
        constraints: {
          strokeOnly: false,
          maxElements: 15,
          requiredMotifs: ["circle", "square"],
        },
      };

      const context = {
        prompt: "complex multi-colored geometric pattern with radial symmetry",
        seed: 98765,
        useUnifiedLayout: true,
      };

      const unifiedPlan = await planner.planUnified(intent, {}, context);
      const result = await synthesizer.synthesizeUnified(
        unifiedPlan,
        {},
        context
      );

      // Validate complex design handling
      expect(result.unifiedDocument?.layers.length).toBeGreaterThan(1);
      expect(result.document.components.length).toBeGreaterThan(5);
      expect(result.document.palette.length).toBeGreaterThanOrEqual(3);

      // Validate metadata for complex design
      expect(result.unifiedDocument?.layers.length).toBe(
        unifiedPlan.metadata.totalLayers
      );
      expect(unifiedPlan.metadata.designComplexity).toBe("complex");
    });

    it("should maintain backward compatibility with traditional synthesis", async () => {
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
        motifs: ["circle"],
        layout: {
          sizes: [{ type: "default", minSize: 50, maxSize: 100 }],
          counts: [{ type: "element", min: 3, max: 3, preferred: 3 }],
          arrangement: "centered",
        },
        constraints: {
          strokeOnly: false,
          maxElements: 5,
          requiredMotifs: [],
        },
      };

      const context = {
        prompt: "green circles",
        seed: 11111,
      };

      // Test traditional synthesis
      const traditionalPlan = await planner.plan(
        intent,
        {},
        {
          targetSize: { width: 400, height: 400 },
          seed: context.seed,
        }
      );

      const traditionalResult = await synthesizer.synthesize(
        traditionalPlan,
        {},
        context
      );

      // Validate traditional synthesis still works
      expect(traditionalResult.components).toBeDefined();
      expect(traditionalResult.components.length).toBe(3);
      expect(traditionalResult.bounds).toBeDefined();
      expect(traditionalResult.palette).toBeDefined();
      expect(traditionalResult.metadata).toBeDefined();
    });

    it("should handle semantic region mapping", async () => {
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
        motifs: ["square"],
        layout: {
          sizes: [{ type: "default", minSize: 50, maxSize: 100 }],
          counts: [{ type: "element", min: 4, max: 6, preferred: 5 }],
          arrangement: "grid",
        },
        constraints: {
          strokeOnly: false,
          maxElements: 8,
          requiredMotifs: [],
        },
      };

      const context = {
        prompt: "purple squares in grid layout",
        useUnifiedLayout: true,
      };

      const unifiedPlan = await planner.planUnified(intent, {}, context);
      const result = await synthesizer.synthesizeUnified(
        unifiedPlan,
        {},
        context
      );

      // Validate semantic regions are used
      expect(result.layoutSpecifications).toBeDefined();

      for (const spec of result.layoutSpecifications!) {
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
      }
    });

    it("should convert path commands to SVG path data correctly", async () => {
      const intent: DesignIntent = {
        style: {
          palette: ["#1F2937"],
          strokeRules: {
            strokeOnly: true,
            minStrokeWidth: 2,
            maxStrokeWidth: 3,
            allowFill: false,
          },
          density: "sparse",
          symmetry: "none",
        },
        motifs: ["curve"],
        layout: {
          sizes: [{ type: "default", minSize: 80, maxSize: 120 }],
          counts: [{ type: "element", min: 2, max: 2, preferred: 2 }],
          arrangement: "centered",
        },
        constraints: {
          strokeOnly: true,
          maxElements: 3,
          requiredMotifs: [],
        },
      };

      const context = {
        prompt: "curved lines",
        useUnifiedLayout: true,
      };

      const unifiedPlan = await planner.planUnified(intent, {}, context);
      const result = await synthesizer.synthesizeUnified(
        unifiedPlan,
        {},
        context
      );

      // Validate path data conversion
      const pathComponents = result.document.components.filter(
        (c) => c.element === "path"
      );
      expect(pathComponents.length).toBeGreaterThan(0);

      for (const component of pathComponents) {
        expect(component.attributes.d).toBeDefined();
        expect(typeof component.attributes.d).toBe("string");
        expect(component.attributes.d).toMatch(/^[MLCQZmlcqz0-9\s\.,\-]+$/); // Valid SVG path data
      }
    });

    it("should preserve style attributes correctly", async () => {
      const intent: DesignIntent = {
        style: {
          palette: ["#EF4444", "#3B82F6"],
          strokeRules: {
            strokeOnly: false,
            minStrokeWidth: 2,
            maxStrokeWidth: 4,
            allowFill: true,
          },
          density: "medium",
          symmetry: "none",
        },
        motifs: ["circle"],
        layout: {
          sizes: [{ type: "default", minSize: 60, maxSize: 100 }],
          counts: [{ type: "element", min: 3, max: 4, preferred: 3 }],
          arrangement: "scattered",
        },
        constraints: {
          strokeOnly: false,
          maxElements: 6,
          requiredMotifs: [],
        },
      };

      const context = {
        prompt: "red and blue circles with strokes",
        useUnifiedLayout: true,
      };

      const unifiedPlan = await planner.planUnified(intent, {}, context);
      const result = await synthesizer.synthesizeUnified(
        unifiedPlan,
        {},
        context
      );

      // Validate style preservation
      for (const component of result.document.components) {
        expect(component.attributes.fill).toBeDefined();
        expect(component.attributes.stroke).toBeDefined();

        if (component.attributes["stroke-width"]) {
          expect(typeof component.attributes["stroke-width"]).toBe("number");
          expect(component.attributes["stroke-width"]).toBeGreaterThanOrEqual(
            2
          );
          expect(component.attributes["stroke-width"]).toBeLessThanOrEqual(4);
        }
      }
    });
  });

  describe("coordinate conversion", () => {
    it("should convert semantic positions to pixel coordinates", async () => {
      const synthesizer = new SVGSynthesizer("1:1");

      // Test semantic position conversion
      const semanticPos = (synthesizer as any).getSemanticPosition({
        region: "center",
        anchor: "center",
      });

      expect(semanticPos.x).toBeCloseTo(0.5, 1); // Center of canvas (normalized)
      expect(semanticPos.y).toBeCloseTo(0.5, 1);

      const topLeftPos = (synthesizer as any).getSemanticPosition({
        region: "top_left",
        anchor: "top_left",
      });

      expect(topLeftPos.x).toBeCloseTo(0, 1); // Top-left corner
      expect(topLeftPos.y).toBeCloseTo(0, 1);
    });

    it("should handle anchor offsets correctly", async () => {
      const synthesizer = new SVGSynthesizer("1:1");

      const anchorTests = [
        { anchor: "center", expected: { x: 0.5, y: 0.5 } },
        { anchor: "top_left", expected: { x: 0, y: 0 } },
        { anchor: "bottom_right", expected: { x: 1, y: 1 } },
        { anchor: "top_center", expected: { x: 0.5, y: 0 } },
        { anchor: "middle_left", expected: { x: 0, y: 0.5 } },
      ];

      for (const test of anchorTests) {
        const offset = (synthesizer as any).getAnchorOffset(test.anchor);
        expect(offset.x).toBeCloseTo(test.expected.x, 1);
        expect(offset.y).toBeCloseTo(test.expected.y, 1);
      }
    });
  });
});
