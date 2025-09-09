import { describe, it, expect, beforeEach } from "bun:test";
import { RuleBasedGenerator } from "../../server/services/RuleBasedGenerator";
import type { GenerationRequest } from "../../server/types";

describe("RuleBasedGenerator", () => {
  let generator: RuleBasedGenerator;

  beforeEach(() => {
    generator = new RuleBasedGenerator();
  });

  describe("generate", () => {
    it("should generate a valid SVG for a circle prompt", async () => {
      const request: GenerationRequest = {
        prompt: "A blue circle",
        size: { width: 100, height: 100 },
        palette: ["#0000FF"],
        seed: 12345,
      };

      const result = await generator.generate(request);

      expect(result.errors).toHaveLength(0);
      expect(result.svg).toContain("<svg");
      expect(result.svg).toContain('xmlns="http://www.w3.org/2000/svg"');
      expect(result.svg).toContain('viewBox="0 0 100 100"');
      expect(result.svg).toContain("<circle");
      expect(result.meta.width).toBe(100);
      expect(result.meta.height).toBe(100);
      expect(result.meta.seed).toBe(12345);
    });

    it("should generate a valid SVG for a rectangle prompt", async () => {
      const request: GenerationRequest = {
        prompt: "A red rectangle",
        size: { width: 200, height: 150 },
        palette: ["#FF0000"],
        seed: 54321,
      };

      const result = await generator.generate(request);

      expect(result.errors).toHaveLength(0);
      expect(result.svg).toContain("<svg");
      expect(result.svg).toContain('viewBox="0 0 200 150"');
      expect(result.svg).toContain("<rect");
      expect(result.meta.width).toBe(200);
      expect(result.meta.height).toBe(150);
      expect(result.meta.seed).toBe(54321);
    });

    it("should generate a valid SVG for a triangle prompt", async () => {
      const request: GenerationRequest = {
        prompt: "A green triangle",
        size: { width: 150, height: 150 },
        palette: ["#00FF00"],
      };

      const result = await generator.generate(request);

      expect(result.errors).toHaveLength(0);
      expect(result.svg).toContain("<polygon");
      expect(result.svg).toContain("points=");
      expect(result.meta.width).toBe(150);
      expect(result.meta.height).toBe(150);
    });

    it("should generate a valid SVG for a star prompt", async () => {
      const request: GenerationRequest = {
        prompt: "A yellow star",
        size: { width: 120, height: 120 },
        palette: ["#FFFF00"],
      };

      const result = await generator.generate(request);

      expect(result.errors).toHaveLength(0);
      expect(result.svg).toContain("<polygon");
      expect(result.svg).toContain('id="main-star"');
    });

    it("should generate an icon for icon-related prompts", async () => {
      const request: GenerationRequest = {
        prompt: "A house icon",
        size: { width: 100, height: 100 },
        palette: ["#8B4513", "#FF0000"],
      };

      const result = await generator.generate(request);

      expect(result.errors).toHaveLength(0);
      expect(result.svg).toContain("<g");
      expect(result.svg).toContain('id="house-icon"');
    });

    it("should generate a pattern for pattern-related prompts", async () => {
      const request: GenerationRequest = {
        prompt: "A dot pattern",
        size: { width: 200, height: 200 },
        palette: ["#000000"],
      };

      const result = await generator.generate(request);

      expect(result.errors).toHaveLength(0);
      expect(result.svg).toContain('id="dot-pattern"');
    });

    it("should handle invalid requests", async () => {
      const request: GenerationRequest = {
        prompt: "", // Invalid: empty prompt
        size: { width: 100, height: 100 },
      };

      const result = await generator.generate(request);

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.svg).toBe("");
    });

    it("should use default palette when none provided", async () => {
      const request: GenerationRequest = {
        prompt: "A circle",
        size: { width: 100, height: 100 },
      };

      const result = await generator.generate(request);

      expect(result.errors).toHaveLength(0);
      expect(result.meta.palette).toEqual(["#3B82F6", "#1E40AF", "#1D4ED8"]);
    });

    it("should generate deterministic results with same seed", async () => {
      const request: GenerationRequest = {
        prompt: "A circle",
        size: { width: 100, height: 100 },
        seed: 12345,
      };

      const result1 = await generator.generate(request);
      const result2 = await generator.generate(request);

      expect(result1.svg).toBe(result2.svg);
      expect(result1.meta.seed).toBe(result2.meta.seed);
    });

    it("should include layer information", async () => {
      const request: GenerationRequest = {
        prompt: "A blue circle",
        size: { width: 100, height: 100 },
      };

      const result = await generator.generate(request);

      expect(result.errors).toHaveLength(0);
      expect(result.layers.length).toBeGreaterThan(0);
      expect(result.layers[0]).toHaveProperty("id");
      expect(result.layers[0]).toHaveProperty("label");
      expect(result.layers[0]).toHaveProperty("type");
    });

    it("should handle background color requests", async () => {
      const request: GenerationRequest = {
        prompt: "A circle with blue background",
        size: { width: 100, height: 100 },
        palette: ["#FF0000", "#0000FF"],
      };

      const result = await generator.generate(request);

      expect(result.errors).toHaveLength(0);
      expect(result.svg).toContain('<rect width="100%" height="100%"');
      expect(result.meta.backgroundColor).toBe("#0000FF");
    });
  });
});
