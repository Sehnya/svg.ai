/**
 * Unit tests for SVGSynthesizer
 */
import { describe, it, expect } from "vitest";
import { SVGSynthesizer } from "../../server/services/SVGSynthesizer.js";
import type {
  CompositionPlan,
  DesignIntent,
} from "../../server/types/pipeline.js";

describe("SVGSynthesizer", () => {
  const synthesizer = new SVGSynthesizer();

  const createTestPlan = (): CompositionPlan => ({
    components: [
      {
        id: "comp-1",
        type: "circle",
        position: { x: 100, y: 100 },
        size: { width: 50, height: 50 },
        rotation: 0,
        style: {
          fill: "#2563eb",
          stroke: "none",
          strokeWidth: 1,
        },
        motif: "circle",
      },
      {
        id: "comp-2",
        type: "rect",
        position: { x: 200, y: 150 },
        size: { width: 60, height: 40 },
        rotation: 0,
        style: {
          fill: "none",
          stroke: "#16a34a",
          strokeWidth: 2,
        },
        motif: "square",
      },
    ],
    layout: {
      bounds: { width: 400, height: 300 },
      viewBox: "0 0 400 300",
      arrangement: "scattered",
      spacing: 20,
    },
    zIndex: [1, 2],
  });

  const createTestGrounding = () => ({
    stylePack: { id: "modern-1", colors: ["#2563eb", "#16a34a"] },
    motifs: [
      { id: "circle-1", name: "circle", type: "geometric" },
      { id: "square-1", name: "square", type: "geometric" },
    ],
    glossary: [],
    fewshot: [],
    components: [],
  });

  describe("synthesize", () => {
    it("should create a valid SVG document", async () => {
      const plan = createTestPlan();
      const grounding = createTestGrounding();
      const context = {
        prompt: "blue circle and green square",
        seed: 12345,
        model: "test-synthesizer",
        userId: "test-user",
      };

      const document = await synthesizer.synthesize(plan, grounding, context);

      expect(document.components).toHaveLength(2);
      expect(document.bounds).toEqual({ width: 400, height: 300 });
      expect(document.palette).toContain("#2563eb");
      expect(document.palette).toContain("#16a34a");
      expect(document.metadata.prompt).toBe("blue circle and green square");
      expect(document.metadata.model).toBe("test-synthesizer");
    });

    it("should generate components with correct attributes", async () => {
      const plan = createTestPlan();
      const grounding = createTestGrounding();
      const context = {
        prompt: "test shapes",
        model: "test",
      };

      const document = await synthesizer.synthesize(plan, grounding, context);

      const circleComponent = document.components.find(
        (c) => c.element === "circle"
      );
      const rectComponent = document.components.find(
        (c) => c.element === "rect"
      );

      expect(circleComponent).toBeDefined();
      expect(circleComponent!.element).toBe("circle");
      expect(circleComponent!.attributes.cx).toBe(100);
      expect(circleComponent!.attributes.cy).toBe(100);
      expect(circleComponent!.attributes.r).toBe(25); // radius = min(width, height) / 2

      expect(rectComponent).toBeDefined();
      expect(rectComponent!.element).toBe("rect");
      expect(rectComponent!.attributes.x).toBe(170); // x - width/2
      expect(rectComponent!.attributes.y).toBe(130); // y - height/2
      expect(rectComponent!.attributes.width).toBe(60);
      expect(rectComponent!.attributes.height).toBe(40);
    });

    it("should apply styling correctly", async () => {
      const plan = createTestPlan();
      const grounding = createTestGrounding();
      const context = { prompt: "styled shapes" };

      const document = await synthesizer.synthesize(plan, grounding, context);

      const circleComponent = document.components.find(
        (c) => c.element === "circle"
      );
      const rectComponent = document.components.find(
        (c) => c.element === "rect"
      );

      expect(circleComponent!.attributes.fill).toBe("#2563eb");
      expect(rectComponent!.attributes.fill).toBe("none");
      expect(rectComponent!.attributes.stroke).toBe("#16a34a");
      expect(rectComponent!.attributes["stroke-width"]).toBe(2);
    });

    it("should handle different component types", async () => {
      const plan: CompositionPlan = {
        components: [
          {
            id: "triangle",
            type: "polygon",
            position: { x: 100, y: 100 },
            size: { width: 50, height: 50 },
            rotation: 0,
            style: { fill: "#eab308" },
            motif: "triangle",
          },
          {
            id: "line",
            type: "line",
            position: { x: 200, y: 100 },
            size: { width: 100, height: 0 },
            rotation: 0,
            style: { stroke: "#dc2626", strokeWidth: 3 },
          },
        ],
        layout: {
          bounds: { width: 400, height: 200 },
          viewBox: "0 0 400 200",
          arrangement: "grid",
          spacing: 10,
        },
        zIndex: [1, 2],
      };

      const document = await synthesizer.synthesize(
        plan,
        createTestGrounding(),
        { prompt: "shapes" }
      );

      const triangleComponent = document.components.find(
        (c) => c.id === "triangle"
      );
      const lineComponent = document.components.find((c) => c.id === "line");

      expect(triangleComponent!.element).toBe("polygon");
      expect(triangleComponent!.attributes.points).toBeDefined();
      expect(typeof triangleComponent!.attributes.points).toBe("string");

      expect(lineComponent!.element).toBe("line");
      expect(lineComponent!.attributes.x1).toBe(150); // x - width/2
      expect(lineComponent!.attributes.x2).toBe(250); // x + width/2
      expect(lineComponent!.attributes.y1).toBe(100);
      expect(lineComponent!.attributes.y2).toBe(100);
    });

    it("should create proper metadata", async () => {
      const plan = createTestPlan();
      const grounding = createTestGrounding();
      const context = {
        prompt: "test prompt",
        seed: 54321,
        model: "test-model-v2",
        userId: "user-123",
      };

      const document = await synthesizer.synthesize(plan, grounding, context);

      expect(document.metadata.prompt).toBe("test prompt");
      expect(document.metadata.seed).toBe(54321);
      expect(document.metadata.model).toBe("test-model-v2");
      expect(document.metadata.generatedAt).toBeInstanceOf(Date);
      expect(document.metadata.usedObjects).toContain("modern-1");
      expect(document.metadata.usedObjects).toContain("circle-1");
      expect(document.metadata.usedObjects).toContain("square-1");
    });

    it("should extract palette from components and grounding", async () => {
      const plan = createTestPlan();
      const grounding = {
        ...createTestGrounding(),
        stylePack: {
          id: "colorful",
          colors: ["#ff0000", "#00ff00", "#0000ff"],
        },
      };
      const context = { prompt: "colorful shapes" };

      const document = await synthesizer.synthesize(plan, grounding, context);

      // Should include colors from components
      expect(document.palette).toContain("#2563eb");
      expect(document.palette).toContain("#16a34a");

      // Should include colors from style pack
      expect(document.palette).toContain("#ff0000");
      expect(document.palette).toContain("#00ff00");
      expect(document.palette).toContain("#0000ff");
    });

    it("should handle empty grounding data", async () => {
      const plan = createTestPlan();
      const emptyGrounding = {};
      const context = { prompt: "minimal test" };

      const document = await synthesizer.synthesize(
        plan,
        emptyGrounding,
        context
      );

      expect(document.components).toHaveLength(2);
      expect(document.metadata.usedObjects).toEqual([]);
    });

    it("should validate generated document", async () => {
      const plan = createTestPlan();
      const grounding = createTestGrounding();
      const context = { prompt: "validation test" };

      // Should not throw validation errors
      await expect(
        synthesizer.synthesize(plan, grounding, context)
      ).resolves.toBeDefined();
    });
  });

  describe("component generation", () => {
    it("should handle path components with motifs", async () => {
      const plan: CompositionPlan = {
        components: [
          {
            id: "wave",
            type: "path",
            position: { x: 100, y: 100 },
            size: { width: 80, height: 40 },
            rotation: 0,
            style: { stroke: "#2563eb", strokeWidth: 2, fill: "none" },
            motif: "wave",
          },
          {
            id: "leaf",
            type: "path",
            position: { x: 200, y: 150 },
            size: { width: 60, height: 80 },
            rotation: 0,
            style: { fill: "#16a34a" },
            motif: "leaf",
          },
        ],
        layout: {
          bounds: { width: 300, height: 250 },
          viewBox: "0 0 300 250",
          arrangement: "organic",
          spacing: 15,
        },
        zIndex: [1, 2],
      };

      const document = await synthesizer.synthesize(
        plan,
        createTestGrounding(),
        { prompt: "organic shapes" }
      );

      const waveComponent = document.components.find((c) => c.id === "wave");
      const leafComponent = document.components.find((c) => c.id === "leaf");

      expect(waveComponent!.element).toBe("path");
      expect(waveComponent!.attributes.d).toBeDefined();
      expect(typeof waveComponent!.attributes.d).toBe("string");
      expect(waveComponent!.attributes.d).toContain("Q"); // Should contain quadratic curves for wave

      expect(leafComponent!.element).toBe("path");
      expect(leafComponent!.attributes.d).toBeDefined();
      expect(leafComponent!.attributes.d).toContain("Z"); // Should be closed path for leaf
    });

    it("should handle ellipse components", async () => {
      const plan: CompositionPlan = {
        components: [
          {
            id: "oval",
            type: "ellipse",
            position: { x: 150, y: 100 },
            size: { width: 120, height: 60 },
            rotation: 0,
            style: { fill: "#9333ea", opacity: 0.8 },
          },
        ],
        layout: {
          bounds: { width: 300, height: 200 },
          viewBox: "0 0 300 200",
          arrangement: "centered",
          spacing: 0,
        },
        zIndex: [1],
      };

      const document = await synthesizer.synthesize(
        plan,
        createTestGrounding(),
        { prompt: "oval shape" }
      );

      const ellipseComponent = document.components[0];
      expect(ellipseComponent.element).toBe("ellipse");
      expect(ellipseComponent.attributes.cx).toBe(150);
      expect(ellipseComponent.attributes.cy).toBe(100);
      expect(ellipseComponent.attributes.rx).toBe(60); // width / 2
      expect(ellipseComponent.attributes.ry).toBe(30); // height / 2
      expect(ellipseComponent.attributes.opacity).toBe(0.8);
    });
  });

  describe("error handling", () => {
    it("should throw error for invalid document structure", async () => {
      const invalidPlan: any = {
        components: [
          {
            id: "invalid",
            type: "circle",
            position: { x: "invalid", y: 100 }, // Invalid position
            size: { width: 50, height: 50 },
            rotation: 0,
            style: {},
          },
        ],
        layout: {
          bounds: { width: 400, height: 300 },
          viewBox: "0 0 400 300",
          arrangement: "centered",
          spacing: 10,
        },
        zIndex: [1],
      };

      await expect(
        synthesizer.synthesize(invalidPlan, createTestGrounding(), {
          prompt: "invalid",
        })
      ).rejects.toThrow("Invalid SVG document");
    });
  });
});
