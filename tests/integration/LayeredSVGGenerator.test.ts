/**
 * Integration tests for LayeredSVGGenerator
 * Tests complete generation flow including API mocking
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { LayeredSVGGenerator } from "../../server/services/LayeredSVGGenerator";
import type { GenerationRequest } from "../../server/types/api";

// Mock fetch for OpenAI API calls
global.fetch = vi.fn();

describe("LayeredSVGGenerator Integration", () => {
  let generator: LayeredSVGGenerator;

  beforeEach(() => {
    generator = new LayeredSVGGenerator("test-api-key", {
      timeout: 5000,
      maxRetries: 2,
      fallbackToRuleBased: true,
      enforceCanvasConstraints: true,
    });

    // Reset fetch mock
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("successful generation", () => {
    it("should generate SVG from unified layered document", async () => {
      const mockUnifiedDoc = {
        version: "unified-layered-1.0",
        canvas: {
          width: 512,
          height: 512,
          aspectRatio: "1:1",
        },
        layers: [
          {
            id: "main_layer",
            label: "Main Shape",
            layout: {
              region: "center",
              anchor: "center",
              zIndex: 1,
            },
            paths: [
              {
                id: "blue_square",
                style: {
                  fill: "#3B82F6",
                  stroke: "#1E40AF",
                  strokeWidth: 2,
                },
                commands: [
                  { cmd: "M", coords: [206, 206] },
                  { cmd: "L", coords: [306, 206] },
                  { cmd: "L", coords: [306, 306] },
                  { cmd: "L", coords: [206, 306] },
                  { cmd: "Z", coords: [] },
                ],
                layout: {
                  region: "center",
                  anchor: "center",
                },
              },
            ],
          },
        ],
      };

      // Mock successful API response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify(mockUnifiedDoc),
              },
            },
          ],
        }),
      });

      const request: GenerationRequest = {
        prompt: "blue square in the center",
        size: { width: 512, height: 512 },
        palette: ["#3B82F6", "#1E40AF"],
        seed: 12345,
        model: "llm",
      };

      const result = await generator.generate(request);

      expect(result.svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
      expect(result.svg).toContain('viewBox="0 0 512 512"');
      expect(result.svg).toContain('width="512"');
      expect(result.svg).toContain('height="512"');
      expect(result.svg).toContain('fill="#3B82F6"');
      expect(result.svg).toContain('stroke="#1E40AF"');

      expect(result.meta.width).toBe(512);
      expect(result.meta.height).toBe(512);
      expect(result.meta.palette).toContain("#3B82F6");
      expect(result.meta.palette).toContain("#1E40AF");
      expect(result.meta.seed).toBe(12345);

      expect(result.layers).toHaveLength(1);
      expect(result.layers[0].id).toBe("main_layer");
      expect(result.layers[0].label).toBe("Main Shape");
      expect(result.layers[0].type).toBe("group");

      expect(result.errors).toHaveLength(0);
    });

    it("should handle multi-layer designs with layout language", async () => {
      const mockMultiLayerDoc = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers: [
          {
            id: "background",
            label: "Background Layer",
            layout: { region: "full_canvas", zIndex: 1 },
            paths: [
              {
                id: "bg_rect",
                style: { fill: "#F3F4F6", stroke: "none" },
                commands: [
                  { cmd: "M", coords: [0, 0] },
                  { cmd: "L", coords: [512, 0] },
                  { cmd: "L", coords: [512, 512] },
                  { cmd: "L", coords: [0, 512] },
                  { cmd: "Z", coords: [] },
                ],
                layout: { region: "full_canvas", anchor: "top_left" },
              },
            ],
          },
          {
            id: "main_content",
            label: "Main Content",
            layout: { region: "center", anchor: "center", zIndex: 2 },
            paths: [
              {
                id: "main_circle",
                style: { fill: "#10B981", stroke: "#047857", strokeWidth: 3 },
                commands: [
                  { cmd: "M", coords: [256, 156] },
                  { cmd: "C", coords: [311.23, 156, 356, 200.77, 356, 256] },
                  { cmd: "C", coords: [356, 311.23, 311.23, 356, 256, 356] },
                  { cmd: "C", coords: [200.77, 356, 156, 311.23, 156, 256] },
                  { cmd: "C", coords: [156, 200.77, 200.77, 156, 256, 156] },
                  { cmd: "Z", coords: [] },
                ],
                layout: { region: "center", anchor: "center" },
              },
            ],
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            { message: { content: JSON.stringify(mockMultiLayerDoc) } },
          ],
        }),
      });

      const request: GenerationRequest = {
        prompt: "green circle on gray background",
        size: { width: 512, height: 512 },
      };

      const result = await generator.generate(request);

      expect(result.svg).toContain("<!-- Layer: Background Layer -->");
      expect(result.svg).toContain("<!-- Layer: Main Content -->");
      expect(result.svg).toContain('id="background"');
      expect(result.svg).toContain('id="main_content"');
      expect(result.svg).toContain('fill="#F3F4F6"');
      expect(result.svg).toContain('fill="#10B981"');

      expect(result.layers).toHaveLength(2);
      expect(result.layers[0].id).toBe("background");
      expect(result.layers[1].id).toBe("main_content");

      expect(result.meta.palette).toContain("#F3F4F6");
      expect(result.meta.palette).toContain("#10B981");
      expect(result.meta.palette).toContain("#047857");
    });

    it("should handle different aspect ratios", async () => {
      const mockWideDoc = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "16:9" },
        layers: [
          {
            id: "wide_layer",
            label: "Wide Content",
            paths: [
              {
                id: "wide_rect",
                style: { fill: "#8B5CF6", stroke: "#7C3AED", strokeWidth: 2 },
                commands: [
                  { cmd: "M", coords: [100, 200] },
                  { cmd: "L", coords: [412, 200] },
                  { cmd: "L", coords: [412, 312] },
                  { cmd: "L", coords: [100, 312] },
                  { cmd: "Z", coords: [] },
                ],
                layout: { region: "center", anchor: "center" },
              },
            ],
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify(mockWideDoc) } }],
        }),
      });

      const request: GenerationRequest = {
        prompt: "wide purple rectangle",
        size: { width: 800, height: 450 }, // 16:9 aspect ratio
      };

      const result = await generator.generate(request);

      expect(result.svg).toContain('viewBox="0 0 512 512"');
      expect(result.meta.width).toBe(512);
      expect(result.meta.height).toBe(512);
      expect(result.meta.palette).toContain("#8B5CF6");
    });
  });

  describe("error handling and fallback", () => {
    it("should fallback to rule-based generator on API failure", async () => {
      // Mock API failure
      (global.fetch as any).mockRejectedValueOnce(new Error("API Error"));

      const request: GenerationRequest = {
        prompt: "simple shape",
        size: { width: 512, height: 512 },
      };

      const result = await generator.generate(request);

      // Should still return a valid SVG (from rule-based fallback)
      expect(result.svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
      expect(result.svg).toContain('viewBox="0 0 512 512"');
      expect(result.meta.width).toBe(512);
      expect(result.meta.height).toBe(512);

      // Should have some warnings or errors indicating fallback was used
      expect(result.warnings.length + result.errors.length).toBeGreaterThan(0);
    });

    it("should retry on timeout and eventually succeed", async () => {
      const mockDoc = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers: [
          {
            id: "retry_layer",
            label: "Retry Test",
            paths: [
              {
                id: "retry_path",
                style: { fill: "#EF4444" },
                commands: [
                  { cmd: "M", coords: [200, 200] },
                  { cmd: "L", coords: [312, 312] },
                  { cmd: "Z", coords: [] },
                ],
              },
            ],
          },
        ],
      };

      // First call times out, second succeeds
      (global.fetch as any)
        .mockRejectedValueOnce(new Error("Timeout"))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: JSON.stringify(mockDoc) } }],
          }),
        });

      const request: GenerationRequest = {
        prompt: "red triangle",
        size: { width: 512, height: 512 },
      };

      const result = await generator.generate(request);

      expect(result.svg).toContain('fill="#EF4444"');
      expect(result.layers[0].id).toBe("retry_layer");
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it("should handle invalid JSON responses", async () => {
      // Mock invalid JSON response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: "invalid json {" } }],
        }),
      });

      const request: GenerationRequest = {
        prompt: "test shape",
        size: { width: 512, height: 512 },
      };

      const result = await generator.generate(request);

      // Should fallback to rule-based generator
      expect(result.svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
      expect(result.errors.length + result.warnings.length).toBeGreaterThan(0);
    });

    it("should handle validation failures", async () => {
      const invalidDoc = {
        version: "wrong-version",
        canvas: { width: 256, height: 256, aspectRatio: "1:1" },
        layers: [
          {
            id: "invalid_layer",
            label: "Invalid",
            paths: [
              {
                id: "invalid_path",
                style: { fill: "invalid_color" },
                commands: [
                  { cmd: "M", coords: [600, 100] }, // Out of bounds
                  { cmd: "Z", coords: [] },
                ],
              },
            ],
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify(invalidDoc) } }],
        }),
      });

      const request: GenerationRequest = {
        prompt: "invalid design",
        size: { width: 512, height: 512 },
      };

      const result = await generator.generate(request);

      // Should fallback due to validation failure
      expect(result.svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
      expect(result.errors.length + result.warnings.length).toBeGreaterThan(0);
    });

    it("should create error SVG when all methods fail", async () => {
      const generator = new LayeredSVGGenerator("test-api-key", {
        fallbackToRuleBased: false, // Disable fallback
        maxRetries: 1,
      });

      // Mock API failure
      (global.fetch as any).mockRejectedValueOnce(
        new Error("Complete failure")
      );

      const request: GenerationRequest = {
        prompt: "failing design",
        size: { width: 512, height: 512 },
      };

      const result = await generator.generate(request);

      expect(result.svg).toContain("Generation Failed");
      expect(result.svg).toContain('fill="#FEF2F2"');
      expect(result.svg).toContain('stroke="#DC2626"');
      expect(result.errors).toContain(
        "Layered generation failed: Complete failure"
      );
      expect(result.layers).toHaveLength(0);
    });
  });

  describe("request validation", () => {
    it("should reject invalid requests", async () => {
      const invalidRequest = {
        prompt: "", // Empty prompt
        size: { width: 0, height: 0 }, // Invalid size
      } as GenerationRequest;

      const result = await generator.generate(invalidRequest);

      expect(result.svg).toContain("Generation Failed");
      expect(result.errors[0]).toContain("Invalid request");
    });

    it("should handle missing optional fields", async () => {
      const mockDoc = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers: [
          {
            id: "minimal_layer",
            label: "Minimal",
            paths: [
              {
                id: "minimal_path",
                style: { fill: "#000000" },
                commands: [
                  { cmd: "M", coords: [100, 100] },
                  { cmd: "L", coords: [200, 200] },
                  { cmd: "Z", coords: [] },
                ],
              },
            ],
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify(mockDoc) } }],
        }),
      });

      const minimalRequest: GenerationRequest = {
        prompt: "minimal design",
        size: { width: 512, height: 512 },
        // No palette, seed, model, or userId
      };

      const result = await generator.generate(minimalRequest);

      expect(result.svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
      expect(result.meta.seed).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("configuration and monitoring", () => {
    it("should return generation statistics", () => {
      const stats = generator.getGenerationStats();

      expect(stats.timeout).toBe(5000);
      expect(stats.maxRetries).toBe(2);
      expect(stats.fallbackEnabled).toBe(true);
      expect(stats.constraintsEnabled).toBe(true);
    });

    it("should allow updating options", () => {
      generator.updateOptions({
        timeout: 10000,
        maxRetries: 5,
        fallbackToRuleBased: false,
      });

      const stats = generator.getGenerationStats();

      expect(stats.timeout).toBe(10000);
      expect(stats.maxRetries).toBe(5);
      expect(stats.fallbackEnabled).toBe(false);
      expect(stats.constraintsEnabled).toBe(true); // Unchanged
    });

    it("should handle custom generation options", async () => {
      const customGenerator = new LayeredSVGGenerator("test-api-key", {
        timeout: 1000,
        maxRetries: 1,
        enforceCanvasConstraints: false,
        includeLayoutLanguage: false,
        includeGeometryExamples: false,
        maxLayers: 5,
        maxPathsPerLayer: 10,
      });

      const mockDoc = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers: [
          {
            id: "custom_layer",
            label: "Custom",
            paths: [
              {
                id: "custom_path",
                style: { fill: "#FF0000" },
                commands: [
                  { cmd: "M", coords: [100, 100] },
                  { cmd: "Z", coords: [] },
                ],
              },
            ],
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify(mockDoc) } }],
        }),
      });

      const request: GenerationRequest = {
        prompt: "custom design",
        size: { width: 512, height: 512 },
      };

      const result = await customGenerator.generate(request);

      expect(result.svg).toContain('fill="#FF0000"');

      const stats = customGenerator.getGenerationStats();
      expect(stats.timeout).toBe(1000);
      expect(stats.maxRetries).toBe(1);
      expect(stats.constraintsEnabled).toBe(false);
    });
  });

  describe("layout language processing", () => {
    it("should process semantic regions correctly", async () => {
      const mockDocWithRegions = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers: [
          {
            id: "positioned_layer",
            label: "Positioned Content",
            layout: { region: "top_left", anchor: "center" },
            paths: [
              {
                id: "positioned_path",
                style: { fill: "#22C55E" },
                commands: [
                  { cmd: "M", coords: [85, 85] },
                  { cmd: "L", coords: [170, 85] },
                  { cmd: "L", coords: [170, 170] },
                  { cmd: "L", coords: [85, 170] },
                  { cmd: "Z", coords: [] },
                ],
                layout: { region: "top_left", anchor: "center" },
              },
            ],
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            { message: { content: JSON.stringify(mockDocWithRegions) } },
          ],
        }),
      });

      const request: GenerationRequest = {
        prompt: "green square in top left",
        size: { width: 512, height: 512 },
      };

      const result = await generator.generate(request);

      expect(result.svg).toContain('data-region="top_left"');
      expect(result.svg).toContain('data-anchor="center"');
      expect(result.svg).toContain('fill="#22C55E"');
      expect(result.layers[0].id).toBe("positioned_layer");
    });

    it("should handle repetition patterns", async () => {
      const mockDocWithPattern = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers: [
          {
            id: "pattern_layer",
            label: "Pattern",
            paths: [
              {
                id: "pattern_unit",
                style: { fill: "#8B5CF6", stroke: "#7C3AED", strokeWidth: 1 },
                commands: [
                  { cmd: "M", coords: [240, 240] },
                  { cmd: "L", coords: [272, 240] },
                  { cmd: "L", coords: [272, 272] },
                  { cmd: "L", coords: [240, 272] },
                  { cmd: "Z", coords: [] },
                ],
                layout: {
                  region: "center",
                  anchor: "center",
                  repeat: { type: "grid", count: [3, 3], spacing: 0.15 },
                },
              },
            ],
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            { message: { content: JSON.stringify(mockDocWithPattern) } },
          ],
        }),
      });

      const request: GenerationRequest = {
        prompt: "grid of purple squares",
        size: { width: 512, height: 512 },
      };

      const result = await generator.generate(request);

      expect(result.svg).toContain('fill="#8B5CF6"');
      expect(result.svg).toContain('stroke="#7C3AED"');
      expect(result.layers[0].id).toBe("pattern_layer");
    });
  });
});
