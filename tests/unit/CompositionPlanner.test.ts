/**
 * Unit tests for CompositionPlanner
 */
import { describe, it, expect } from "vitest";
import { CompositionPlanner } from "../../server/services/CompositionPlanner.js";
import type { DesignIntent } from "../../server/types/pipeline.js";

describe("CompositionPlanner", () => {
  const createTestIntent = (
    overrides: Partial<DesignIntent> = {}
  ): DesignIntent => ({
    style: {
      palette: ["#2563eb", "#16a34a", "#eab308"],
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
      sizes: [{ type: "default", minSize: 50, maxSize: 150 }],
      counts: [{ type: "element", min: 3, max: 7, preferred: 5 }],
      arrangement: "centered",
    },
    constraints: {
      strokeOnly: false,
      maxElements: 25,
      requiredMotifs: ["circle"],
    },
    ...overrides,
  });

  const createTestGrounding = () => ({
    stylePack: { name: "modern", colors: ["#2563eb"] },
    motifs: [
      { name: "circle", type: "geometric" },
      { name: "square", type: "geometric" },
    ],
    glossary: [],
    fewshot: [],
    components: [{ type: "circle", template: "basic-circle" }],
  });

  describe("plan", () => {
    it("should create a valid composition plan", async () => {
      const planner = new CompositionPlanner();
      const intent = createTestIntent();
      const grounding = createTestGrounding();

      const plan = await planner.plan(intent, grounding);

      expect(plan.layout).toBeDefined();
      expect(plan.components).toBeDefined();
      expect(plan.zIndex).toBeDefined();
      expect(plan.components.length).toBeGreaterThan(0);
      expect(plan.zIndex.length).toBe(plan.components.length);
    });

    it("should respect component count preferences", async () => {
      const planner = new CompositionPlanner();
      const intent = createTestIntent({
        layout: {
          sizes: [{ type: "default", minSize: 50, maxSize: 150 }],
          counts: [{ type: "element", min: 2, max: 4, preferred: 3 }],
          arrangement: "grid",
        },
      });
      const grounding = createTestGrounding();

      const plan = await planner.plan(intent, grounding);

      expect(plan.components.length).toBe(3);
    });

    it("should respect max elements constraint", async () => {
      const planner = new CompositionPlanner();
      const intent = createTestIntent({
        constraints: {
          strokeOnly: false,
          maxElements: 2,
          requiredMotifs: [],
        },
      });
      const grounding = createTestGrounding();

      const plan = await planner.plan(intent, grounding);

      expect(plan.components.length).toBeLessThanOrEqual(2);
    });

    it("should create different arrangements", async () => {
      const arrangements = [
        "grid",
        "centered",
        "scattered",
        "organic",
      ] as const;

      for (const arrangement of arrangements) {
        const planner = new CompositionPlanner();
        const intent = createTestIntent({
          layout: {
            sizes: [{ type: "default", minSize: 50, maxSize: 150 }],
            counts: [{ type: "element", min: 4, max: 6, preferred: 4 }],
            arrangement,
          },
        });
        const grounding = createTestGrounding();

        const plan = await planner.plan(intent, grounding);

        expect(plan.layout.arrangement).toBe(arrangement);
        expect(plan.components.length).toBe(4);
      }
    });

    it("should use deterministic positioning with seed", async () => {
      const seed = 12345;
      const planner1 = new CompositionPlanner(seed);
      const planner2 = new CompositionPlanner(seed);

      const intent = createTestIntent();
      const grounding = createTestGrounding();

      const plan1 = await planner1.plan(intent, grounding);
      const plan2 = await planner2.plan(intent, grounding);

      expect(plan1.components[0].position).toEqual(
        plan2.components[0].position
      );
      expect(plan1.components[0].size).toEqual(plan2.components[0].size);
    });

    it("should assign motifs to components", async () => {
      const planner = new CompositionPlanner();
      const intent = createTestIntent({
        motifs: ["circle", "square", "triangle"],
      });
      const grounding = createTestGrounding();

      const plan = await planner.plan(intent, grounding);

      const motifs = plan.components.map((c) => c.motif).filter(Boolean);
      expect(motifs.length).toBeGreaterThan(0);
      expect(motifs.every((m) => intent.motifs.includes(m!))).toBe(true);
    });

    it("should apply stroke-only styling", async () => {
      const planner = new CompositionPlanner();
      const intent = createTestIntent({
        style: {
          palette: ["#000000"],
          strokeRules: {
            strokeOnly: true,
            minStrokeWidth: 2,
            maxStrokeWidth: 4,
            allowFill: false,
          },
          density: "sparse",
          symmetry: "none",
        },
        constraints: {
          strokeOnly: true,
          maxElements: 25,
          requiredMotifs: [],
        },
      });
      const grounding = createTestGrounding();

      const plan = await planner.plan(intent, grounding);

      for (const component of plan.components) {
        expect(component.style.fill).toBe("none");
        expect(component.style.stroke).toBeDefined();
        expect(component.style.strokeWidth).toBeGreaterThanOrEqual(2);
      }
    });

    it("should handle context parameters", async () => {
      const planner = new CompositionPlanner();
      const intent = createTestIntent();
      const grounding = createTestGrounding();
      const context = {
        targetSize: { width: 800, height: 600 },
        seed: 54321,
      };

      const plan = await planner.plan(intent, grounding, context);

      expect(plan.layout.bounds).toEqual(context.targetSize);
      expect(plan.layout.viewBox).toBe("0 0 800 600");
    });
  });

  describe("layout generation", () => {
    it("should generate grid positions correctly", async () => {
      const planner = new CompositionPlanner();
      const intent = createTestIntent({
        layout: {
          sizes: [{ type: "default", minSize: 50, maxSize: 150 }],
          counts: [{ type: "element", min: 4, max: 4, preferred: 4 }],
          arrangement: "grid",
        },
      });
      const grounding = createTestGrounding();

      const plan = await planner.plan(intent, grounding);

      // Grid should have evenly spaced positions
      const positions = plan.components.map((c) => c.position);
      expect(positions.length).toBe(4);

      // Check that positions are within bounds
      for (const pos of positions) {
        expect(pos.x).toBeGreaterThanOrEqual(0);
        expect(pos.y).toBeGreaterThanOrEqual(0);
        expect(pos.x).toBeLessThanOrEqual(plan.layout.bounds.width);
        expect(pos.y).toBeLessThanOrEqual(plan.layout.bounds.height);
      }
    });

    it("should generate centered positions", async () => {
      const planner = new CompositionPlanner();
      const intent = createTestIntent({
        layout: {
          sizes: [{ type: "default", minSize: 50, maxSize: 150 }],
          counts: [{ type: "element", min: 1, max: 1, preferred: 1 }],
          arrangement: "centered",
        },
      });
      const grounding = createTestGrounding();

      const plan = await planner.plan(intent, grounding);

      const centerX = plan.layout.bounds.width / 2;
      const centerY = plan.layout.bounds.height / 2;

      expect(plan.components[0].position.x).toBe(centerX);
      expect(plan.components[0].position.y).toBe(centerY);
    });

    it("should apply spacing based on density", async () => {
      const densities = ["sparse", "medium", "dense"] as const;
      const expectedSpacing = [40, 20, 10];

      for (let i = 0; i < densities.length; i++) {
        const planner = new CompositionPlanner();
        const intent = createTestIntent({
          style: {
            palette: ["#2563eb"],
            strokeRules: {
              strokeOnly: false,
              minStrokeWidth: 1,
              maxStrokeWidth: 3,
              allowFill: true,
            },
            density: densities[i],
            symmetry: "none",
          },
        });
        const grounding = createTestGrounding();

        const plan = await planner.plan(intent, grounding);

        expect(plan.layout.spacing).toBe(expectedSpacing[i]);
      }
    });
  });

  describe("z-index calculation", () => {
    it("should assign z-index values", async () => {
      const planner = new CompositionPlanner();
      const intent = createTestIntent();
      const grounding = createTestGrounding();

      const plan = await planner.plan(intent, grounding);

      expect(plan.zIndex.length).toBe(plan.components.length);
      expect(plan.zIndex.every((z) => typeof z === "number")).toBe(true);
    });

    it("should prioritize center components for centered arrangement", async () => {
      const planner = new CompositionPlanner();
      const intent = createTestIntent({
        layout: {
          sizes: [{ type: "default", minSize: 50, maxSize: 150 }],
          counts: [{ type: "element", min: 5, max: 5, preferred: 5 }],
          arrangement: "centered",
        },
      });
      const grounding = createTestGrounding();

      const plan = await planner.plan(intent, grounding);

      // Center component should have higher z-index
      const maxZIndex = Math.max(...plan.zIndex);
      const centerIndex = Math.floor(plan.components.length / 2);
      expect(plan.zIndex[centerIndex]).toBeGreaterThanOrEqual(maxZIndex - 10);
    });
  });

  describe("error handling", () => {
    it("should handle empty grounding data", async () => {
      const planner = new CompositionPlanner();
      const intent = createTestIntent();
      const emptyGrounding = {};

      const plan = await planner.plan(intent, emptyGrounding);

      expect(plan.components.length).toBeGreaterThan(0);
      expect(plan.layout).toBeDefined();
    });

    it("should validate generated plan", async () => {
      const planner = new CompositionPlanner();
      const intent = createTestIntent();
      const grounding = createTestGrounding();

      // This should not throw
      await expect(planner.plan(intent, grounding)).resolves.toBeDefined();
    });
  });
});
