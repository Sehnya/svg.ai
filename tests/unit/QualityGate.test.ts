/**
 * Unit tests for QualityGate
 */
import { describe, it, expect } from "vitest";
import { QualityGate } from "../../server/services/QualityGate.js";
import type {
  AISVGDocument,
  DesignIntent,
} from "../../server/types/pipeline.js";

describe("QualityGate", () => {
  const qualityGate = new QualityGate();

  const createTestDocument = (
    overrides: Partial<AISVGDocument> = {}
  ): AISVGDocument => ({
    components: [
      {
        id: "comp-1",
        type: "circle",
        element: "circle",
        attributes: {
          cx: 100,
          cy: 100,
          r: 25,
          fill: "#2563eb",
          "stroke-width": 1,
        },
        metadata: { motif: "circle", generated: true },
      },
      {
        id: "comp-2",
        type: "square",
        element: "rect",
        attributes: {
          x: 150,
          y: 150,
          width: 50,
          height: 50,
          fill: "none",
          stroke: "#16a34a",
          "stroke-width": 2,
        },
        metadata: { motif: "square", generated: true },
      },
    ],
    metadata: {
      prompt: "test shapes",
      palette: ["#2563eb", "#16a34a"],
      description: "Test document",
      generatedAt: new Date(),
      model: "test",
    },
    bounds: { width: 400, height: 300 },
    palette: ["#2563eb", "#16a34a"],
    ...overrides,
  });

  const createTestIntent = (
    overrides: Partial<DesignIntent> = {}
  ): DesignIntent => ({
    style: {
      palette: ["#2563eb", "#16a34a"],
      strokeRules: {
        strokeOnly: false,
        minStrokeWidth: 1,
        maxStrokeWidth: 4,
        allowFill: true,
      },
      density: "medium",
      symmetry: "none",
    },
    motifs: ["circle", "square"],
    layout: {
      sizes: [{ type: "default", minSize: 20, maxSize: 100 }],
      counts: [{ type: "element", min: 1, max: 5, preferred: 2 }],
      arrangement: "centered",
    },
    constraints: {
      strokeOnly: false,
      maxElements: 10,
      requiredMotifs: ["circle"],
    },
    ...overrides,
  });

  describe("validate", () => {
    it("should pass validation for a good document", async () => {
      const document = createTestDocument();
      const intent = createTestIntent();

      const result = await qualityGate.validate(document, intent);

      expect(result.passed).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.score).toBeGreaterThan(70);
    });

    it("should fail validation for too many components", async () => {
      const document = createTestDocument({
        components: Array(15)
          .fill(null)
          .map((_, i) => ({
            id: `comp-${i}`,
            type: "circle",
            element: "circle",
            attributes: { cx: 50, cy: 50, r: 10 },
            metadata: { generated: true },
          })),
      });
      const intent = createTestIntent({
        constraints: { strokeOnly: false, maxElements: 5, requiredMotifs: [] },
      });

      const result = await qualityGate.validate(document, intent);

      expect(result.passed).toBe(false);
      expect(result.issues).toContain("Too many components: 15 > 5");
    });

    it("should fail validation for missing required motifs", async () => {
      const document = createTestDocument({
        components: [
          {
            id: "comp-1",
            type: "square",
            element: "rect",
            attributes: { x: 0, y: 0, width: 50, height: 50 },
            metadata: { motif: "square", generated: true },
          },
        ],
      });
      const intent = createTestIntent({
        constraints: {
          strokeOnly: false,
          maxElements: 10,
          requiredMotifs: ["circle", "triangle"],
        },
      });

      const result = await qualityGate.validate(document, intent);

      expect(result.passed).toBe(false);
      expect(result.issues).toContain(
        "Missing required motifs: circle, triangle"
      );
    });

    it("should fail validation for stroke-only violations", async () => {
      const document = createTestDocument({
        components: [
          {
            id: "comp-1",
            type: "circle",
            element: "circle",
            attributes: { cx: 100, cy: 100, r: 25, fill: "#2563eb" }, // Has fill
            metadata: { generated: true },
          },
        ],
      });
      const intent = createTestIntent({
        constraints: { strokeOnly: true, maxElements: 10, requiredMotifs: [] },
      });

      const result = await qualityGate.validate(document, intent);

      expect(result.passed).toBe(false);
      expect(result.issues).toContain(
        "1 components have fill but stroke-only is required"
      );
    });

    it("should fail validation for invalid stroke widths", async () => {
      const document = createTestDocument({
        components: [
          {
            id: "comp-1",
            type: "circle",
            element: "circle",
            attributes: {
              cx: 100,
              cy: 100,
              r: 25,
              stroke: "#000",
              "stroke-width": 0.5,
            },
            metadata: { generated: true },
          },
        ],
      });
      const intent = createTestIntent();

      const result = await qualityGate.validate(document, intent);

      expect(result.passed).toBe(false);
      expect(result.issues).toContain("Stroke width 0.5 is below minimum of 1");
    });

    it("should warn about high decimal precision", async () => {
      const document = createTestDocument({
        components: [
          {
            id: "comp-1",
            type: "circle",
            element: "circle",
            attributes: { cx: 100.12345, cy: 100.6789, r: 25.111 }, // High precision
            metadata: { generated: true },
          },
        ],
      });
      const intent = createTestIntent();

      const result = await qualityGate.validate(document, intent);

      expect(result.warnings).toContain("3 attributes have >2 decimal places");
    });

    it("should fail validation for invalid bounds", async () => {
      const document = createTestDocument({
        bounds: { width: 0, height: 300 }, // Invalid width
      });
      const intent = createTestIntent();

      const result = await qualityGate.validate(document, intent);

      expect(result.passed).toBe(false);
      expect(result.issues).toContain("Invalid or missing viewBox");
    });

    it("should warn about components out of bounds", async () => {
      const document = createTestDocument({
        components: [
          {
            id: "comp-1",
            type: "circle",
            element: "circle",
            attributes: { cx: 450, cy: 100, r: 25 }, // x + r > bounds.width (400)
            metadata: { generated: true },
          },
        ],
        bounds: { width: 400, height: 300 },
      });
      const intent = createTestIntent();

      const result = await qualityGate.validate(document, intent);

      expect(result.warnings).toContain(
        "1 components are partially out of bounds"
      );
    });

    it("should handle empty document", async () => {
      const document = createTestDocument({
        components: [],
      });
      const intent = createTestIntent();

      const result = await qualityGate.validate(document, intent);

      expect(result.passed).toBe(false);
      expect(result.issues).toContain("Document has no components");
      expect(result.score).toBe(0);
    });
  });

  describe("structural integrity checks", () => {
    it("should detect components out of bounds", async () => {
      const document = createTestDocument({
        components: [
          {
            id: "out-of-bounds",
            type: "rect",
            element: "rect",
            attributes: { x: 350, y: 250, width: 100, height: 100 }, // Extends beyond 400x300
            metadata: { generated: true },
          },
        ],
      });
      const intent = createTestIntent();

      const result = await qualityGate.validate(document, intent);

      expect(result.warnings.some((w) => w.includes("out of bounds"))).toBe(
        true
      );
    });

    it("should warn about very small bounds", async () => {
      const document = createTestDocument({
        bounds: { width: 10, height: 10 },
      });
      const intent = createTestIntent();

      const result = await qualityGate.validate(document, intent);

      expect(result.warnings).toContain("Document bounds are very small");
    });

    it("should warn about very large bounds", async () => {
      const document = createTestDocument({
        bounds: { width: 3000, height: 2500 },
      });
      const intent = createTestIntent();

      const result = await qualityGate.validate(document, intent);

      expect(result.warnings).toContain("Document bounds are very large");
    });
  });

  describe("motif compliance checks", () => {
    it("should warn about motif imbalance", async () => {
      const document = createTestDocument({
        components: [
          ...Array(6)
            .fill(null)
            .map((_, i) => ({
              id: `circle-${i}`,
              type: "circle",
              element: "circle",
              attributes: { cx: 50 + i * 20, cy: 50, r: 10 },
              metadata: { motif: "circle", generated: true },
            })),
          {
            id: "square-1",
            type: "square",
            element: "rect",
            attributes: { x: 200, y: 50, width: 20, height: 20 },
            metadata: { motif: "square", generated: true },
          },
        ],
      });
      const intent = createTestIntent();

      const result = await qualityGate.validate(document, intent);

      expect(result.warnings).toContain("Motif distribution is imbalanced");
    });

    it("should warn about unexpected motifs", async () => {
      const document = createTestDocument({
        components: [
          {
            id: "triangle",
            type: "triangle",
            element: "polygon",
            attributes: { points: "50,10 90,90 10,90" },
            metadata: { motif: "triangle", generated: true },
          },
        ],
      });
      const intent = createTestIntent({
        motifs: ["circle", "square"], // triangle not in allowed motifs
      });

      const result = await qualityGate.validate(document, intent);

      expect(result.warnings).toContain("Unexpected motifs present: triangle");
    });
  });

  describe("style consistency checks", () => {
    it("should warn about unauthorized colors", async () => {
      const document = createTestDocument({
        components: [
          {
            id: "comp-1",
            type: "circle",
            element: "circle",
            attributes: { cx: 100, cy: 100, r: 25, fill: "#ff0000" }, // Red not in palette
            metadata: { generated: true },
          },
        ],
        palette: ["#2563eb", "#16a34a"], // Blue and green only
      });
      const intent = createTestIntent();

      const result = await qualityGate.validate(document, intent);

      expect(result.warnings).toContain("Colors used outside palette: #ff0000");
    });

    it("should warn about inconsistent stroke widths", async () => {
      const document = createTestDocument({
        components: [
          {
            id: "thin",
            type: "circle",
            element: "circle",
            attributes: {
              cx: 50,
              cy: 50,
              r: 20,
              stroke: "#000",
              "stroke-width": 1,
            },
            metadata: { generated: true },
          },
          {
            id: "thick",
            type: "circle",
            element: "circle",
            attributes: {
              cx: 150,
              cy: 50,
              r: 20,
              stroke: "#000",
              "stroke-width": 8,
            },
            metadata: { generated: true },
          },
        ],
      });
      const intent = createTestIntent();

      const result = await qualityGate.validate(document, intent);

      expect(result.warnings).toContain("Stroke widths vary significantly");
    });
  });

  describe("technical quality checks", () => {
    it("should detect invalid components", async () => {
      const document = createTestDocument({
        components: [
          {
            id: "invalid-circle",
            type: "circle",
            element: "circle",
            attributes: { cx: 100, cy: 100, r: -5 }, // Negative radius
            metadata: { generated: true },
          },
        ],
      });
      const intent = createTestIntent();

      const result = await qualityGate.validate(document, intent);

      expect(result.issues).toContain("1 components have invalid attributes");
    });

    it("should detect degenerate shapes", async () => {
      const document = createTestDocument({
        components: [
          {
            id: "zero-rect",
            type: "rect",
            element: "rect",
            attributes: { x: 100, y: 100, width: 0, height: 50 }, // Zero width
            metadata: { generated: true },
          },
          {
            id: "point-line",
            type: "line",
            element: "line",
            attributes: { x1: 100, y1: 100, x2: 100, y2: 100 }, // Point line
            metadata: { generated: true },
          },
        ],
      });
      const intent = createTestIntent();

      const result = await qualityGate.validate(document, intent);

      expect(result.warnings).toContain(
        "2 components are degenerate (zero size)"
      );
    });

    it("should warn about complex documents", async () => {
      const document = createTestDocument({
        components: Array(25)
          .fill(null)
          .map((_, i) => ({
            id: `comp-${i}`,
            type: "circle",
            element: "circle",
            attributes: { cx: 50, cy: 50, r: 10 },
            metadata: { generated: true },
          })),
      });
      const intent = createTestIntent({
        constraints: { strokeOnly: false, maxElements: 50, requiredMotifs: [] },
      });

      const result = await qualityGate.validate(document, intent);

      expect(result.warnings).toContain("Document is quite complex");
    });
  });

  describe("quality scoring", () => {
    it("should give high scores to good documents", async () => {
      const document = createTestDocument();
      const intent = createTestIntent();

      const result = await qualityGate.validate(document, intent);

      expect(result.score).toBeGreaterThan(90);
    });

    it("should give low scores to problematic documents", async () => {
      const document = createTestDocument({
        components: [],
        bounds: { width: 0, height: 0 },
      });
      const intent = createTestIntent();

      const result = await qualityGate.validate(document, intent);

      expect(result.score).toBeLessThan(30);
    });

    it("should calculate intermediate scores for mixed quality", async () => {
      const document = createTestDocument({
        components: [
          {
            id: "good",
            type: "circle",
            element: "circle",
            attributes: { cx: 100, cy: 100, r: 25, fill: "#2563eb" },
            metadata: { motif: "circle", generated: true },
          },
          {
            id: "problematic",
            type: "rect",
            element: "rect",
            attributes: {
              x: 150.12345,
              y: 150.6789,
              width: 50,
              height: 50,
              fill: "#ff0000",
            },
            metadata: { generated: true },
          },
        ],
      });
      const intent = createTestIntent();

      const result = await qualityGate.validate(document, intent);

      expect(result.score).toBeGreaterThan(50);
      expect(result.score).toBeLessThan(90);
    });
  });
});
