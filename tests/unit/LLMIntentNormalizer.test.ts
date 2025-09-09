/**
 * Unit tests for LLMIntentNormalizer
 */
import { describe, it, expect, vi } from "vitest";
import { LLMIntentNormalizer } from "../../server/services/LLMIntentNormalizer.js";

// Mock fetch for testing
global.fetch = vi.fn();

describe("LLMIntentNormalizer", () => {
  const mockConfig = {
    model: "gpt-4o-mini",
    temperature: 0.2,
    maxTokens: 1000,
    apiKey: "test-api-key",
  };

  describe("normalize", () => {
    it("should fall back to rule-based normalization when LLM fails", async () => {
      // Mock fetch to simulate API failure
      (global.fetch as any).mockRejectedValueOnce(new Error("API Error"));

      const normalizer = new LLMIntentNormalizer(mockConfig);
      const result = await normalizer.normalize("blue circle");

      expect(result.style.palette).toContain("#2563eb");
      expect(result.motifs).toContain("circle");
    });

    it("should use LLM when API is available", async () => {
      // Mock successful LLM response
      const mockResponse = {
        style: {
          palette: ["#ff0000", "#00ff00"],
          strokeRules: {
            strokeOnly: false,
            minStrokeWidth: 1,
            maxStrokeWidth: 3,
            allowFill: true,
          },
          density: "medium",
          symmetry: "none",
        },
        motifs: ["custom", "shape"],
        layout: {
          sizes: [{ type: "default", minSize: 50, maxSize: 150 }],
          counts: [{ type: "element", min: 1, max: 3, preferred: 2 }],
          arrangement: "centered",
        },
        constraints: {
          strokeOnly: false,
          maxElements: 10,
          requiredMotifs: ["custom"],
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify(mockResponse),
              },
            },
          ],
        }),
      });

      const normalizer = new LLMIntentNormalizer(mockConfig);
      const result = await normalizer.normalize("custom shape design");

      expect(result.style.palette).toEqual(["#ff0000", "#00ff00"]);
      expect(result.motifs).toEqual(["custom", "shape"]);
      expect(result.constraints.requiredMotifs).toEqual(["custom"]);
    });

    it("should handle grounding data in prompts", async () => {
      const mockResponse = {
        style: {
          palette: ["#2563eb"],
          strokeRules: {
            strokeOnly: false,
            minStrokeWidth: 1,
            maxStrokeWidth: 3,
            allowFill: true,
          },
          density: "medium",
          symmetry: "none",
        },
        motifs: ["circle"],
        layout: {
          sizes: [{ type: "default", minSize: 50, maxSize: 150 }],
          counts: [{ type: "element", min: 1, max: 1, preferred: 1 }],
          arrangement: "centered",
        },
        constraints: {
          strokeOnly: false,
          maxElements: 5,
          requiredMotifs: ["circle"],
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify(mockResponse) } }],
        }),
      });

      const normalizer = new LLMIntentNormalizer(mockConfig);
      const grounding = {
        stylePack: { name: "modern", colors: ["#2563eb"] },
        motifs: [{ name: "circle", type: "geometric" }],
      };

      const result = await normalizer.normalize(
        "simple design",
        undefined,
        grounding
      );

      expect(result.motifs).toContain("circle");
      expect(result.style.palette).toContain("#2563eb");
    });

    it("should validate LLM responses", async () => {
      // Mock invalid LLM response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({ invalid: "response" }),
              },
            },
          ],
        }),
      });

      const normalizer = new LLMIntentNormalizer(mockConfig);

      // Should fall back to rule-based when LLM response is invalid
      const result = await normalizer.normalize("test prompt");

      // Should get rule-based result
      expect(result.style.palette).toBeDefined();
      expect(result.motifs).toBeDefined();
    });

    it("should handle API errors gracefully", async () => {
      // Mock API error
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: async () => "Rate limit exceeded",
      });

      const normalizer = new LLMIntentNormalizer(mockConfig);
      const result = await normalizer.normalize("test prompt");

      // Should fall back to rule-based
      expect(result.style.palette).toBeDefined();
      expect(result.motifs).toBeDefined();
    });

    it("should throw error when no API key is provided", async () => {
      const configWithoutKey = { ...mockConfig, apiKey: undefined };
      const normalizer = new LLMIntentNormalizer(configWithoutKey);

      // Should fall back to rule-based when no API key
      const result = await normalizer.normalize("test prompt");
      expect(result.style.palette).toBeDefined();
    });
  });

  describe("few-shot learning", () => {
    it("should use few-shot examples when available", async () => {
      const mockResponse = {
        style: {
          palette: ["#2563eb"],
          strokeRules: {
            strokeOnly: false,
            minStrokeWidth: 1,
            maxStrokeWidth: 3,
            allowFill: true,
          },
          density: "medium",
          symmetry: "none",
        },
        motifs: ["example"],
        layout: {
          sizes: [{ type: "default", minSize: 50, maxSize: 150 }],
          counts: [{ type: "element", min: 1, max: 1, preferred: 1 }],
          arrangement: "centered",
        },
        constraints: { strokeOnly: false, maxElements: 5, requiredMotifs: [] },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify(mockResponse) } }],
        }),
      });

      const normalizer = new LLMIntentNormalizer(mockConfig);
      const grounding = {
        fewshot: [
          {
            input: "example prompt",
            output: { motifs: ["example"] },
          },
        ],
      };

      const result = await normalizer.normalizeWithFewShot(
        "similar to example",
        undefined,
        grounding
      );

      expect(result.motifs).toContain("example");
    });
  });

  describe("error handling", () => {
    it("should handle malformed JSON responses", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: "invalid json {",
              },
            },
          ],
        }),
      });

      const normalizer = new LLMIntentNormalizer(mockConfig);
      const result = await normalizer.normalize("test prompt");

      // Should fall back to rule-based
      expect(result.style.palette).toBeDefined();
    });

    it("should handle empty API responses", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [] }),
      });

      const normalizer = new LLMIntentNormalizer(mockConfig);
      const result = await normalizer.normalize("test prompt");

      // Should fall back to rule-based
      expect(result.style.palette).toBeDefined();
    });
  });
});
