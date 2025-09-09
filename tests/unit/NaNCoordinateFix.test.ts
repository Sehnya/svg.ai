import { describe, it, expect } from "vitest";
import { SVGSynthesizer } from "../../server/services/SVGSynthesizer.js";
import { QualityGate } from "../../server/services/QualityGate.js";
import type {
  CompositionPlan,
  AISVGDocument,
  DesignIntent,
} from "../../server/types/pipeline.js";

describe("NaN Coordinate Fix", () => {
  const synthesizer = new SVGSynthesizer();
  const qualityGate = new QualityGate();

  describe("SVGSynthesizer coordinate validation", () => {
    it("should reject invalid position coordinates", async () => {
      const invalidPlan: CompositionPlan = {
        components: [
          {
            id: "test-1",
            type: "circle",
            position: { x: NaN, y: 100 },
            size: { width: 50, height: 50 },
            rotation: 0,
            style: { fill: "#ff0000" },
            motif: "test",
          },
        ],
        layout: {
          bounds: { width: 200, height: 200 },
          arrangement: "centered",
          background: "#ffffff",
        },
        zIndex: [1],
      };

      const grounding = {
        stylePack: null,
        motifs: [],
        glossary: [],
        fewshot: [],
        components: [],
      };

      const context = {
        prompt: "test prompt",
        seed: 123,
      };

      await expect(
        synthesizer.synthesize(invalidPlan, grounding, context)
      ).rejects.toThrow("Invalid position coordinates");
    });

    it("should reject invalid size dimensions", async () => {
      const invalidPlan: CompositionPlan = {
        components: [
          {
            id: "test-1",
            type: "circle",
            position: { x: 100, y: 100 },
            size: { width: NaN, height: 50 },
            rotation: 0,
            style: { fill: "#ff0000" },
            motif: "test",
          },
        ],
        layout: {
          bounds: { width: 200, height: 200 },
          arrangement: "centered",
          background: "#ffffff",
        },
        zIndex: [1],
      };

      const grounding = {
        stylePack: null,
        motifs: [],
        glossary: [],
        fewshot: [],
        components: [],
      };

      const context = {
        prompt: "test prompt",
        seed: 123,
      };

      await expect(
        synthesizer.synthesize(invalidPlan, grounding, context)
      ).rejects.toThrow("Invalid size dimensions");
    });

    it("should reject zero or negative dimensions", async () => {
      const invalidPlan: CompositionPlan = {
        components: [
          {
            id: "test-1",
            type: "circle",
            position: { x: 100, y: 100 },
            size: { width: 0, height: 50 },
            rotation: 0,
            style: { fill: "#ff0000" },
            motif: "test",
          },
        ],
        layout: {
          bounds: { width: 200, height: 200 },
          arrangement: "centered",
          background: "#ffffff",
        },
        zIndex: [1],
      };

      const grounding = {
        stylePack: null,
        motifs: [],
        glossary: [],
        fewshot: [],
        components: [],
      };

      const context = {
        prompt: "test prompt",
        seed: 123,
      };

      await expect(
        synthesizer.synthesize(invalidPlan, grounding, context)
      ).rejects.toThrow("Size dimensions must be positive");
    });

    it("should generate valid coordinates for valid input", async () => {
      const validPlan: CompositionPlan = {
        components: [
          {
            id: "test-1",
            type: "circle",
            position: { x: 100, y: 100 },
            size: { width: 50, height: 50 },
            rotation: 0,
            style: { fill: "#ff0000" },
            motif: "test",
          },
        ],
        layout: {
          bounds: { width: 200, height: 200 },
          arrangement: "centered",
          background: "#ffffff",
        },
        zIndex: [1],
      };

      const grounding = {
        stylePack: null,
        motifs: [],
        glossary: [],
        fewshot: [],
        components: [],
      };

      const context = {
        prompt: "test prompt",
        seed: 123,
      };

      const result = await synthesizer.synthesize(
        validPlan,
        grounding,
        context
      );

      expect(result.components).toHaveLength(1);
      const component = result.components[0];

      expect(typeof component.attributes.cx).toBe("number");
      expect(typeof component.attributes.cy).toBe("number");
      expect(typeof component.attributes.r).toBe("number");

      expect(isFinite(component.attributes.cx as number)).toBe(true);
      expect(isFinite(component.attributes.cy as number)).toBe(true);
      expect(isFinite(component.attributes.r as number)).toBe(true);

      expect(isNaN(component.attributes.cx as number)).toBe(false);
      expect(isNaN(component.attributes.cy as number)).toBe(false);
      expect(isNaN(component.attributes.r as number)).toBe(false);
    });
  });

  describe("QualityGate NaN detection", () => {
    it("should detect and reject components with NaN coordinates", async () => {
      const documentWithNaN: AISVGDocument = {
        components: [
          {
            id: "invalid-circle",
            type: "circle",
            element: "circle",
            attributes: {
              cx: NaN,
              cy: 100,
              r: 25,
              fill: "#ff0000",
            },
            metadata: {
              motif: "test",
              generated: true,
              reused: false,
            },
          },
        ],
        metadata: {
          prompt: "test",
          palette: ["#ff0000"],
          description: "test document",
          generatedAt: new Date(),
          model: "test",
          usedObjects: [],
        },
        bounds: { width: 200, height: 200 },
        palette: ["#ff0000"],
      };

      const intent: DesignIntent = {
        style: {
          palette: ["#ff0000"],
          strokeRules: { minWidth: 1, maxWidth: 5 },
          density: "medium",
          symmetry: "none",
        },
        motifs: ["test"],
        layout: {
          sizes: [],
          counts: [],
          arrangement: "centered",
        },
        constraints: {
          strokeOnly: false,
          maxElements: 10,
          requiredMotifs: [],
        },
      };

      const result = await qualityGate.validate(documentWithNaN, intent);

      expect(result.passed).toBe(false);
      expect(
        result.issues.some((issue) => issue.includes("invalid cx: NaN"))
      ).toBe(true);
    });

    it("should pass validation for components with valid coordinates", async () => {
      const validDocument: AISVGDocument = {
        components: [
          {
            id: "valid-circle",
            type: "circle",
            element: "circle",
            attributes: {
              cx: 100,
              cy: 100,
              r: 25,
              fill: "#ff0000",
            },
            metadata: {
              motif: "test",
              generated: true,
              reused: false,
            },
          },
        ],
        metadata: {
          prompt: "test",
          palette: ["#ff0000"],
          description: "test document",
          generatedAt: new Date(),
          model: "test",
          usedObjects: [],
        },
        bounds: { width: 200, height: 200 },
        palette: ["#ff0000"],
      };

      const intent: DesignIntent = {
        style: {
          palette: ["#ff0000"],
          strokeRules: { minWidth: 1, maxWidth: 5 },
          density: "medium",
          symmetry: "none",
        },
        motifs: ["test"],
        layout: {
          sizes: [],
          counts: [],
          arrangement: "centered",
        },
        constraints: {
          strokeOnly: false,
          maxElements: 10,
          requiredMotifs: [],
        },
      };

      const result = await qualityGate.validate(validDocument, intent);

      // Should not have NaN-related issues
      const nanIssues = result.issues.filter(
        (issue) => issue.includes("invalid") || issue.includes("NaN")
      );
      expect(nanIssues).toHaveLength(0);
    });
  });
});
