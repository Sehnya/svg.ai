/**
 * Unit tests for GenerationPipeline
 */
import { describe, it, expect, vi } from "vitest";
import { GenerationPipeline } from "../../server/services/GenerationPipeline.js";

describe("GenerationPipeline", () => {
  const createTestRequest = () => ({
    prompt: "blue circle",
    size: { width: 400, height: 400 },
    palette: ["#2563eb", "#16a34a"],
    seed: 12345,
    userId: "test-user",
  });

  const createTestGrounding = () => ({
    stylePack: { name: "modern", colors: ["#2563eb"] },
    motifs: [{ id: "circle-1", name: "circle", type: "geometric" }],
    glossary: [],
    fewshot: [],
    components: [],
  });

  describe("process", () => {
    it("should complete full pipeline successfully", async () => {
      const pipeline = new GenerationPipeline();
      const request = createTestRequest();
      const grounding = createTestGrounding();

      const result = await pipeline.process(request, grounding);

      expect(result.svg).toBeDefined();
      expect(result.svg).toContain("<svg");
      expect(result.svg).toContain('xmlns="http://www.w3.org/2000/svg"');
      expect(result.metadata).toBeDefined();
      expect(result.layers).toBeDefined();
      expect(Array.isArray(result.layers)).toBe(true);
    });

    it("should handle stroke-only requirements", async () => {
      const pipeline = new GenerationPipeline();
      const request = {
        ...createTestRequest(),
        prompt: "outline drawing of circles",
      };
      const grounding = createTestGrounding();

      const result = await pipeline.process(request, grounding);

      expect(result.svg).toBeDefined();
      // Should not contain fill attributes (except 'none')
      const fillMatches = result.svg.match(/fill="(?!none)[^"]+"/g);
      expect(fillMatches).toBeNull();
    });

    it("should respect seed for deterministic generation", async () => {
      const pipeline1 = new GenerationPipeline();
      const pipeline2 = new GenerationPipeline();
      const request = createTestRequest();
      const grounding = createTestGrounding();

      const result1 = await pipeline1.process(request, grounding);
      const result2 = await pipeline2.process(request, grounding);

      // Results should be identical with same seed
      expect(result1.svg).toBe(result2.svg);
    });

    it("should include metadata in response", async () => {
      const pipeline = new GenerationPipeline();
      const request = createTestRequest();
      const grounding = createTestGrounding();

      const result = await pipeline.process(request, grounding);

      expect(result.metadata.prompt).toBeDefined();
      expect(result.metadata.palette).toEqual(
        expect.arrayContaining(["#2563eb"])
      );
      expect(result.metadata.description).toBeDefined();
      expect(result.metadata.generatedAt).toBeInstanceOf(Date);
      expect(result.metadata.model).toBe("pipeline-v1");
    });

    it("should handle complex prompts", async () => {
      const pipeline = new GenerationPipeline();
      const request = {
        ...createTestRequest(),
        prompt:
          "detailed geometric pattern with blue and red circles in a grid arrangement",
      };
      const grounding = createTestGrounding();

      const result = await pipeline.process(request, grounding);

      expect(result.svg).toBeDefined();
      expect(result.layers.length).toBeGreaterThan(1);
    });

    it("should validate SVG structure", async () => {
      const pipeline = new GenerationPipeline();
      const request = createTestRequest();
      const grounding = createTestGrounding();

      const result = await pipeline.process(request, grounding);

      // Check basic SVG structure
      expect(result.svg).toMatch(/^<svg[^>]*>/);
      expect(result.svg).toMatch(/<\/svg>$/);
      expect(result.svg).toContain("viewBox=");
      expect(result.svg).toContain("xmlns=");
    });

    it("should handle quality gate failures gracefully", async () => {
      const pipeline = new GenerationPipeline();
      const request = {
        ...createTestRequest(),
        prompt: "extremely complex design with hundreds of elements",
      };
      const grounding = createTestGrounding();

      // Should either succeed or fall back gracefully
      const result = await pipeline.process(request, grounding);
      expect(result.svg).toBeDefined();
    });
  });

  describe("fallback behavior", () => {
    it("should fall back to rule-based generation on pipeline failure", async () => {
      const pipeline = new GenerationPipeline();

      // Create a request that might cause pipeline failure
      const request = {
        prompt: "", // Empty prompt
        size: { width: 0, height: 0 }, // Invalid size
      };
      const grounding = {};

      const result = await pipeline.process(request, grounding);

      expect(result.svg).toBeDefined();
      expect(result.warnings).toContain(
        "Used fallback generation due to pipeline failure"
      );
      expect(result.metadata.model).toBe("fallback");
    });

    it("should throw error when fallback is disabled", async () => {
      const pipeline = new GenerationPipeline();
      const request = {
        prompt: "",
        size: { width: 0, height: 0 },
      };
      const grounding = {};
      const context = {
        temperature: 0.2,
        maxRetries: 2,
        fallbackToRuleBased: false,
      };

      await expect(
        pipeline.process(request, grounding, context)
      ).rejects.toThrow();
    });
  });

  describe("validation and repair", () => {
    it("should repair documents with too many components", async () => {
      const pipeline = new GenerationPipeline();
      const request = {
        ...createTestRequest(),
        prompt: "simple design", // This should limit components
      };
      const grounding = createTestGrounding();

      const result = await pipeline.process(request, grounding);

      // Should respect max elements constraint
      expect(result.layers.length).toBeLessThanOrEqual(10);
    });

    it("should handle stroke width validation", async () => {
      const pipeline = new GenerationPipeline();
      const request = createTestRequest();
      const grounding = createTestGrounding();

      const result = await pipeline.process(request, grounding);

      // Check that stroke widths are valid
      for (const layer of result.layers) {
        const strokeWidth = layer.attributes["stroke-width"];
        if (strokeWidth && typeof strokeWidth === "number") {
          expect(strokeWidth).toBeGreaterThanOrEqual(1);
        }
      }
    });

    it("should limit decimal precision", async () => {
      const pipeline = new GenerationPipeline();
      const request = createTestRequest();
      const grounding = createTestGrounding();

      const result = await pipeline.process(request, grounding);

      // Check decimal precision in SVG
      const decimalMatches = result.svg.match(/\d+\.\d{3,}/g);
      expect(decimalMatches).toBeNull(); // Should not have > 2 decimal places
    });
  });

  describe("component generation", () => {
    it("should generate basic components when templates not available", async () => {
      const pipeline = new GenerationPipeline();
      const request = {
        ...createTestRequest(),
        prompt: "unknown shape type",
      };
      const grounding = { components: [] }; // No templates

      const result = await pipeline.process(request, grounding);

      expect(result.layers.length).toBeGreaterThan(0);
      expect(result.layers[0].element).toMatch(/^(circle|rect|polygon|path)$/);
    });

    it("should apply styling correctly", async () => {
      const pipeline = new GenerationPipeline();
      const request = {
        ...createTestRequest(),
        palette: ["#ff0000", "#00ff00"],
      };
      const grounding = createTestGrounding();

      const result = await pipeline.process(request, grounding);

      // Should use colors from palette
      const hasRedOrGreen =
        result.svg.includes("#ff0000") || result.svg.includes("#00ff00");
      expect(hasRedOrGreen).toBe(true);
    });

    it("should handle different component types", async () => {
      const componentTypes = ["circle", "square", "triangle"];

      for (const type of componentTypes) {
        const pipeline = new GenerationPipeline();
        const request = {
          ...createTestRequest(),
          prompt: `${type} shape`,
        };
        const grounding = createTestGrounding();

        const result = await pipeline.process(request, grounding);
        expect(result.svg).toBeDefined();
        expect(result.layers.length).toBeGreaterThan(0);
      }
    });
  });

  describe("error handling", () => {
    it("should handle invalid grounding data", async () => {
      const pipeline = new GenerationPipeline();
      const request = createTestRequest();
      const invalidGrounding = null as any;

      // Should either succeed with fallback or handle gracefully
      const result = await pipeline.process(request, invalidGrounding);
      expect(result.svg).toBeDefined();
    });

    it("should handle missing required parameters", async () => {
      const pipeline = new GenerationPipeline();
      const request = {
        prompt: "test",
        // Missing other parameters
      };
      const grounding = createTestGrounding();

      const result = await pipeline.process(request, grounding);
      expect(result.svg).toBeDefined();
    });
  });

  describe("performance", () => {
    it("should complete generation within reasonable time", async () => {
      const pipeline = new GenerationPipeline();
      const request = createTestRequest();
      const grounding = createTestGrounding();

      const startTime = Date.now();
      await pipeline.process(request, grounding);
      const endTime = Date.now();

      // Should complete within 5 seconds
      expect(endTime - startTime).toBeLessThan(5000);
    });

    it("should handle multiple concurrent requests", async () => {
      const pipeline = new GenerationPipeline();
      const request = createTestRequest();
      const grounding = createTestGrounding();

      const promises = Array(5)
        .fill(null)
        .map(() => pipeline.process(request, grounding));

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      results.forEach((result) => {
        expect(result.svg).toBeDefined();
      });
    });
  });
});
