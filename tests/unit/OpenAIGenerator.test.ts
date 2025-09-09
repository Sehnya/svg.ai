import { describe, it, expect, beforeEach, vi } from "vitest";
import { OpenAIGenerator } from "../../server/services/OpenAIGenerator";
import type { GenerationRequest } from "../../server/types";

// Mock OpenAI
const mockOpenAI = {
  chat: {
    completions: {
      create: vi.fn(() =>
        Promise.resolve({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="40" fill="#0000FF" id="main-circle"/></svg>',
                  warnings: [],
                }),
              },
            },
          ],
        })
      ),
    },
  },
};

// Mock the OpenAI module
vi.mock("openai", () => {
  return {
    default: function () {
      return mockOpenAI;
    },
  };
});

describe("OpenAIGenerator", () => {
  let generator: OpenAIGenerator;

  beforeEach(() => {
    // Reset mock
    mockOpenAI.chat.completions.create.mockClear();

    // Create generator with mock API key
    generator = new OpenAIGenerator("test-api-key");
  });

  describe("constructor", () => {
    it("should throw error if no API key provided", () => {
      // Clear environment variable
      const originalKey = process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY;

      expect(() => new OpenAIGenerator()).toThrow("OpenAI API key is required");

      // Restore environment variable
      if (originalKey) {
        process.env.OPENAI_API_KEY = originalKey;
      }
    });

    it("should use environment variable if no key provided to constructor", () => {
      process.env.OPENAI_API_KEY = "env-test-key";

      expect(() => new OpenAIGenerator()).not.toThrow();

      delete process.env.OPENAI_API_KEY;
    });
  });

  describe("generate", () => {
    it("should generate SVG using OpenAI", async () => {
      const request: GenerationRequest = {
        prompt: "A blue circle",
        size: { width: 100, height: 100 },
        palette: ["#0000FF"],
        seed: 12345,
      };

      const result = await generator.generate(request);

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(1);
      expect(result.errors).toHaveLength(0);
      expect(result.svg).toContain("<svg");
      expect(result.svg).toContain('xmlns="http://www.w3.org/2000/svg"');
      expect(result.svg).toContain("<circle");
      expect(result.meta.width).toBe(100);
      expect(result.meta.height).toBe(100);
      expect(result.meta.seed).toBe(12345);
    });

    it("should fall back to rule-based generation on OpenAI failure", async () => {
      // Mock OpenAI to fail
      mockOpenAI.chat.completions.create.mockRejectedValueOnce(
        new Error("API Error")
      );

      const request: GenerationRequest = {
        prompt: "A red rectangle",
        size: { width: 200, height: 150 },
        palette: ["#FF0000"],
      };

      const result = await generator.generate(request);

      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toContain("Fell back to rule-based generation");
      expect(result.svg).toContain("<svg");
    });

    it("should fall back if OpenAI returns invalid JSON", async () => {
      // Mock OpenAI to return invalid JSON
      mockOpenAI.chat.completions.create.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: "invalid json",
            },
          },
        ],
      });

      const request: GenerationRequest = {
        prompt: "A green triangle",
        size: { width: 150, height: 150 },
        palette: ["#00FF00"],
      };

      const result = await generator.generate(request);

      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toContain("Fell back to rule-based generation");
      expect(result.svg).toContain("<svg");
    });

    it("should fall back if OpenAI returns no SVG content", async () => {
      // Mock OpenAI to return response without SVG
      mockOpenAI.chat.completions.create.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify({
                warnings: ["No SVG generated"],
              }),
            },
          },
        ],
      });

      const request: GenerationRequest = {
        prompt: "A yellow star",
        size: { width: 120, height: 120 },
        palette: ["#FFFF00"],
      };

      const result = await generator.generate(request);

      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toContain("Fell back to rule-based generation");
      expect(result.svg).toContain("<svg");
    });

    it("should handle invalid request parameters", async () => {
      const request: GenerationRequest = {
        prompt: "", // Invalid: empty prompt
        size: { width: 100, height: 100 },
      };

      const result = await generator.generate(request);

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.svg).toBe("");
      expect(mockOpenAI.chat.completions.create).not.toHaveBeenCalled();
    });

    it("should include OpenAI warnings in response", async () => {
      // Mock OpenAI to return warnings
      mockOpenAI.chat.completions.create.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify({
                svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="40" fill="#0000FF" id="main-circle"/></svg>',
                warnings: ["Complex prompt simplified"],
              }),
            },
          },
        ],
      });

      const request: GenerationRequest = {
        prompt: "A very complex design with multiple elements",
        size: { width: 100, height: 100 },
      };

      const result = await generator.generate(request);

      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toContain("Complex prompt simplified");
    });

    it("should use provided palette in system prompt", async () => {
      const request: GenerationRequest = {
        prompt: "A colorful design",
        size: { width: 100, height: 100 },
        palette: ["#FF0000", "#00FF00", "#0000FF"],
      };

      await generator.generate(request);

      const call = mockOpenAI.chat.completions.create.mock.calls[0][0];
      const systemMessage = call.messages.find((m: any) => m.role === "system");

      expect(systemMessage.content).toContain("#FF0000, #00FF00, #0000FF");
    });

    it("should include seed in user prompt", async () => {
      const request: GenerationRequest = {
        prompt: "A design",
        size: { width: 100, height: 100 },
        seed: 54321,
      };

      await generator.generate(request);

      const call = mockOpenAI.chat.completions.create.mock.calls[0][0];
      const userMessage = call.messages.find((m: any) => m.role === "user");

      expect(userMessage.content).toContain("seed 54321");
    });
  });
});
