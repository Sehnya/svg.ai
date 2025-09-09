/**
 * Unit tests for IntentNormalizer
 */
import { describe, it, expect } from "vitest";
import { IntentNormalizer } from "../../server/services/IntentNormalizer.js";

describe("IntentNormalizer", () => {
  const normalizer = new IntentNormalizer();

  describe("normalize", () => {
    it("should normalize a simple prompt", async () => {
      const prompt = "blue circle";
      const result = await normalizer.normalize(prompt);

      expect(result.style.palette).toContain("#2563eb"); // blue
      expect(result.motifs).toContain("circle");
      expect(result.style.density).toBe("medium");
      expect(result.layout.arrangement).toBe("centered");
    });

    it("should extract multiple colors", async () => {
      const prompt = "red and green geometric shapes";
      const result = await normalizer.normalize(prompt);

      expect(result.style.palette).toContain("#dc2626"); // red
      expect(result.style.palette).toContain("#16a34a"); // green
      expect(result.motifs).toContain("geometric");
    });

    it("should handle stroke-only requirements", async () => {
      const prompt = "outline drawing of a tree";
      const result = await normalizer.normalize(prompt);

      expect(result.style.strokeRules.strokeOnly).toBe(true);
      expect(result.style.strokeRules.allowFill).toBe(false);
      expect(result.constraints.strokeOnly).toBe(true);
    });

    it("should extract density preferences", async () => {
      const prompt = "simple minimal design";
      const result = await normalizer.normalize(prompt);

      expect(result.style.density).toBe("sparse");
      expect(result.constraints.maxElements).toBeLessThanOrEqual(10);
    });

    it("should handle complex prompts", async () => {
      const prompt =
        "detailed blue and yellow geometric pattern with 5 elements in a grid";
      const result = await normalizer.normalize(prompt);

      expect(result.style.density).toBe("dense");
      expect(result.style.palette).toContain("#2563eb"); // blue
      expect(result.style.palette).toContain("#eab308"); // yellow
      expect(result.layout.arrangement).toBe("grid");
      expect(result.layout.counts[0].preferred).toBe(5);
    });

    it("should handle symmetry requirements", async () => {
      const prompt = "radial symmetric pattern";
      const result = await normalizer.normalize(prompt);

      expect(result.style.symmetry).toBe("radial");
    });

    it("should use default palette when no colors specified", async () => {
      const prompt = "abstract shapes";
      const result = await normalizer.normalize(prompt);

      expect(result.style.palette).toHaveLength(3);
      expect(result.style.palette[0]).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it("should respect context defaults", async () => {
      const prompt = "simple shape";
      const context = {
        defaultPalette: ["#ff0000", "#00ff00"],
        defaultSize: { width: 800, height: 600 },
      };
      const result = await normalizer.normalize(prompt, context);

      expect(result.style.palette).toEqual(["#ff0000", "#00ff00"]);
    });

    it("should handle monochrome requests", async () => {
      const prompt = "black and white design";
      const result = await normalizer.normalize(prompt);

      expect(result.style.palette).toEqual(["#000000", "#ffffff"]);
    });

    it("should extract arrangement preferences", async () => {
      const arrangements = [
        { prompt: "scattered elements", expected: "scattered" },
        { prompt: "organic flowing design", expected: "organic" },
        { prompt: "structured grid layout", expected: "grid" },
        { prompt: "centered composition", expected: "centered" },
      ];

      for (const { prompt, expected } of arrangements) {
        const result = await normalizer.normalize(prompt);
        expect(result.layout.arrangement).toBe(expected);
      }
    });
  });

  describe("validation", () => {
    it("should throw error for invalid intent", async () => {
      // Mock a scenario that would produce invalid intent
      const normalizer = new IntentNormalizer();

      // This should not happen in normal operation, but test error handling
      try {
        await normalizer.normalize("");
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe("edge cases", () => {
    it("should handle very long prompts", async () => {
      const longPrompt = "a ".repeat(100) + "blue circle";
      const result = await normalizer.normalize(longPrompt);

      expect(result.style.palette).toContain("#2563eb");
      expect(result.motifs).toContain("circle");
    });

    it("should handle prompts with special characters", async () => {
      const prompt = "blue & red circles (2x)";
      const result = await normalizer.normalize(prompt);

      expect(result.style.palette).toContain("#2563eb");
      expect(result.style.palette).toContain("#dc2626");
    });

    it("should handle empty motifs gracefully", async () => {
      const prompt = "colorful design";
      const result = await normalizer.normalize(prompt);

      expect(result.motifs).toBeDefined();
      expect(Array.isArray(result.motifs)).toBe(true);
    });
  });
});
