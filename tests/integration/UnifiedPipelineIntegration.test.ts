/**
 * Comprehensive integration tests for the complete unified SVG generation pipeline
 * Tests the entire flow from prompt to SVG with unified language support
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { UnifiedSVGGenerator } from "../../server/services/UnifiedSVGGenerator";
import { UnifiedPromptBuilder } from "../../server/services/UnifiedPromptBuilder";
import { UnifiedInterpreter } from "../../server/services/UnifiedInterpreter";
import { RegionManager } from "../../server/services/RegionManager";
import { CoordinateMapper } from "../../server/services/CoordinateMapper";
import { LayerManager } from "../../server/services/LayerManager";
import { JSONSchemaValidator } from "../../server/services/JSONSchemaValidator";
import { UnifiedErrorHandler } from "../../server/services/UnifiedErrorHandler";
import { DebugVisualizationSystem } from "../../server/services/DebugVisualizationSystem";
import {
  AspectRatioManager,
  AspectRatio,
} from "../../server/services/AspectRatioManager";
import {
  UnifiedLayeredSVGDocument,
  GenerationRequest,
  GenerationResponse,
} from "../../server/types/unified-layered";

// Mock OpenAI responses
const mockOpenAIResponse = {
  version: "unified-layered-1.0" as const,
  canvas: { width: 512, height: 512, aspectRatio: "1:1" as AspectRatio },
  layers: [
    {
      id: "structure",
      label: "House Structure",
      layout: { region: "center", anchor: "bottom_center" },
      paths: [
        {
          id: "walls",
          style: { fill: "#E5E7EB", stroke: "#111827", strokeWidth: 4 },
          commands: [
            { cmd: "M" as const, coords: [200, 300] },
            { cmd: "L" as const, coords: [400, 300] },
            { cmd: "L" as const, coords: [400, 450] },
            { cmd: "L" as const, coords: [200, 450] },
            { cmd: "Z" as const, coords: [] },
          ],
          layout: { region: "center", anchor: "center" },
        },
      ],
    },
    {
      id: "roof",
      label: "Roof",
      layout: { region: "top_center", anchor: "bottom_center" },
      paths: [
        {
          id: "roof_triangle",
          style: { fill: "#F87171", stroke: "#111827", strokeWidth: 4 },
          commands: [
            { cmd: "M" as const, coords: [200, 300] },
            { cmd: "L" as const, coords: [300, 200] },
            { cmd: "L" as const, coords: [400, 300] },
            { cmd: "Z" as const, coords: [] },
          ],
        },
      ],
    },
  ],
};

describe("Unified Pipeline Integration Tests", () => {
  let generator: UnifiedSVGGenerator;
  let promptBuilder: UnifiedPromptBuilder;
  let interpreter: UnifiedInterpreter;
  let regionManager: RegionManager;
  let coordinateMapper: CoordinateMapper;
  let layerManager: LayerManager;
  let validator: JSONSchemaValidator;
  let errorHandler: UnifiedErrorHandler;
  let debugSystem: DebugVisualizationSystem;

  beforeEach(() => {
    const aspectRatio: AspectRatio = "1:1";
    regionManager = new RegionManager(aspectRatio);
    coordinateMapper = new CoordinateMapper(512, 512, regionManager);
    layerManager = new LayerManager(regionManager, coordinateMapper);
    validator = new JSONSchemaValidator();
    errorHandler = new UnifiedErrorHandler();
    debugSystem = new DebugVisualizationSystem(
      regionManager,
      coordinateMapper,
      layerManager
    );
    promptBuilder = new UnifiedPromptBuilder();
    interpreter = new UnifiedInterpreter(aspectRatio);

    // Mock OpenAI client
    const mockOpenAI = {
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content: JSON.stringify(mockOpenAIResponse),
                },
              },
            ],
          }),
        },
      },
    };

    generator = new UnifiedSVGGenerator(
      mockOpenAI as any,
      promptBuilder,
      interpreter,
      validator,
      errorHandler,
      regionManager,
      coordinateMapper,
      layerManager
    );
  });

  describe("Complete Pipeline Flow", () => {
    it("should generate SVG from prompt through complete unified pipeline", async () => {
      const request: GenerationRequest = {
        prompt: "Create a simple house with a red roof",
        aspectRatio: "1:1",
        model: "llm",
        context: {
          style: "geometric",
          complexity: "simple",
        },
      };

      const response = await generator.generate(request);

      expect(response.success).toBe(true);
      expect(response.svg).toBeDefined();
      expect(response.svg).toContain("<svg");
      expect(response.svg).toContain("</svg>");
      expect(response.metadata?.generationMethod).toBe("unified-layered");
      expect(response.metadata?.layers).toBeDefined();
      expect(response.metadata?.layout).toBeDefined();
    });

    it("should handle different aspect ratios consistently", async () => {
      const aspectRatios: AspectRatio[] = ["1:1", "4:3", "16:9", "3:2"];

      for (const aspectRatio of aspectRatios) {
        const request: GenerationRequest = {
          prompt: "Create a circle in the center",
          aspectRatio,
          model: "llm",
        };

        const response = await generator.generate(request);

        expect(response.success).toBe(true);
        expect(response.svg).toContain(`viewBox="`);

        // Verify aspect ratio is maintained in canvas dimensions
        const canvasDimensions =
          AspectRatioManager.getCanvasDimensions(aspectRatio);
        expect(response.svg).toContain(`width="${canvasDimensions.width}"`);
        expect(response.svg).toContain(`height="${canvasDimensions.height}"`);
      }
    });

    it("should maintain backward compatibility with existing generators", async () => {
      const request: GenerationRequest = {
        prompt: "Create a star shape",
        aspectRatio: "1:1",
        model: "rule-based", // Should use rule-based generator
      };

      const response = await generator.generate(request);

      expect(response.success).toBe(true);
      expect(response.svg).toBeDefined();
      expect(response.metadata?.generationMethod).not.toBe("unified-layered");
    });
  });

  describe("Cross-Aspect-Ratio Consistency", () => {
    it("should position elements consistently across different aspect ratios", async () => {
      const prompt = "Create a circle in the top_left region";
      const aspectRatios: AspectRatio[] = ["1:1", "4:3", "16:9"];
      const responses: GenerationResponse[] = [];

      for (const aspectRatio of aspectRatios) {
        const request: GenerationRequest = {
          prompt,
          aspectRatio,
          model: "llm",
        };

        const response = await generator.generate(request);
        responses.push(response);
      }

      // All should succeed
      responses.forEach((response) => {
        expect(response.success).toBe(true);
      });

      // Elements should be positioned in the same relative location (top_left)
      // This is verified by checking that the semantic positioning is maintained
      responses.forEach((response) => {
        expect(response.metadata?.layout?.regionsUsed).toContain("top_left");
      });
    });

    it("should handle region boundaries correctly for different aspect ratios", async () => {
      const aspectRatios: AspectRatio[] = ["1:1", "4:3", "16:9"];

      for (const aspectRatio of aspectRatios) {
        const regionManager = new RegionManager(aspectRatio);

        // Test that all regions are within bounds for each aspect ratio
        const regionNames = [
          "top_left",
          "center",
          "bottom_right",
          "full_canvas",
        ];

        regionNames.forEach((regionName) => {
          const bounds = regionManager.getPixelBounds(regionName as any);
          const canvasDimensions =
            AspectRatioManager.getCanvasDimensions(aspectRatio);

          expect(bounds.x).toBeGreaterThanOrEqual(0);
          expect(bounds.y).toBeGreaterThanOrEqual(0);
          expect(bounds.x + bounds.width).toBeLessThanOrEqual(
            canvasDimensions.width + 1
          ); // Allow small floating point errors
          expect(bounds.y + bounds.height).toBeLessThanOrEqual(
            canvasDimensions.height + 1
          );
        });
      }
    });
  });

  describe("Performance Regression Tests", () => {
    it("should complete generation within performance thresholds", async () => {
      const request: GenerationRequest = {
        prompt: "Create a complex geometric pattern with multiple layers",
        aspectRatio: "1:1",
        model: "llm",
      };

      const startTime = performance.now();
      const response = await generator.generate(request);
      const endTime = performance.now();

      const generationTime = endTime - startTime;

      expect(response.success).toBe(true);
      expect(generationTime).toBeLessThan(10000); // Should complete within 10 seconds
      expect(response.metadata?.performance?.generationTime).toBeDefined();
    });

    it("should handle large documents efficiently", async () => {
      // Create a mock response with many layers and paths
      const largeMockResponse = {
        ...mockOpenAIResponse,
        layers: Array.from({ length: 15 }, (_, i) => ({
          id: `layer_${i}`,
          label: `Layer ${i}`,
          paths: Array.from({ length: 5 }, (_, j) => ({
            id: `path_${i}_${j}`,
            style: {
              fill: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
            },
            commands: [
              { cmd: "M" as const, coords: [i * 20, j * 20] },
              { cmd: "L" as const, coords: [i * 20 + 10, j * 20] },
              { cmd: "L" as const, coords: [i * 20 + 10, j * 20 + 10] },
              { cmd: "L" as const, coords: [i * 20, j * 20 + 10] },
              { cmd: "Z" as const, coords: [] },
            ],
          })),
        })),
      };

      const mockOpenAI = {
        chat: {
          completions: {
            create: vi.fn().mockResolvedValue({
              choices: [
                {
                  message: {
                    content: JSON.stringify(largeMockResponse),
                  },
                },
              ],
            }),
          },
        },
      };

      const largeGenerator = new UnifiedSVGGenerator(
        mockOpenAI as any,
        promptBuilder,
        interpreter,
        validator,
        errorHandler,
        regionManager,
        coordinateMapper,
        layerManager
      );

      const request: GenerationRequest = {
        prompt: "Create a complex pattern",
        aspectRatio: "1:1",
        model: "llm",
      };

      const startTime = performance.now();
      const response = await largeGenerator.generate(request);
      const endTime = performance.now();

      expect(response.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(5000); // Should handle large documents efficiently
      expect(response.metadata?.layers?.length).toBe(15);
    });

    it("should cache layout calculations for repeated patterns", async () => {
      const request: GenerationRequest = {
        prompt: "Create a grid pattern with repetition",
        aspectRatio: "1:1",
        model: "llm",
      };

      // First generation
      const startTime1 = performance.now();
      const response1 = await generator.generate(request);
      const endTime1 = performance.now();

      // Second generation (should benefit from caching)
      const startTime2 = performance.now();
      const response2 = await generator.generate(request);
      const endTime2 = performance.now();

      expect(response1.success).toBe(true);
      expect(response2.success).toBe(true);

      // Second generation should be faster due to caching
      const time1 = endTime1 - startTime1;
      const time2 = endTime2 - startTime2;

      // Allow for some variance, but second should generally be faster
      expect(time2).toBeLessThanOrEqual(time1 * 1.5);
    });
  });

  describe("Fallback Chain Testing", () => {
    it("should fallback through generation chain on failures", async () => {
      // Mock OpenAI to fail
      const failingOpenAI = {
        chat: {
          completions: {
            create: vi.fn().mockRejectedValue(new Error("API Error")),
          },
        },
      };

      const failingGenerator = new UnifiedSVGGenerator(
        failingOpenAI as any,
        promptBuilder,
        interpreter,
        validator,
        errorHandler,
        regionManager,
        coordinateMapper,
        layerManager
      );

      const request: GenerationRequest = {
        prompt: "Create a shape",
        aspectRatio: "1:1",
        model: "llm",
      };

      const response = await failingGenerator.generate(request);

      // Should still succeed via fallback
      expect(response.success).toBe(true);
      expect(response.svg).toBeDefined();
      expect(response.metadata?.generationMethod).not.toBe("unified-layered");
      expect(response.metadata?.fallbackUsed).toBe(true);
    });

    it("should handle invalid JSON responses gracefully", async () => {
      const invalidJsonOpenAI = {
        chat: {
          completions: {
            create: vi.fn().mockResolvedValue({
              choices: [
                {
                  message: {
                    content: "Invalid JSON response",
                  },
                },
              ],
            }),
          },
        },
      };

      const invalidGenerator = new UnifiedSVGGenerator(
        invalidJsonOpenAI as any,
        promptBuilder,
        interpreter,
        validator,
        errorHandler,
        regionManager,
        coordinateMapper,
        layerManager
      );

      const request: GenerationRequest = {
        prompt: "Create a shape",
        aspectRatio: "1:1",
        model: "llm",
      };

      const response = await invalidGenerator.generate(request);

      expect(response.success).toBe(true);
      expect(response.svg).toBeDefined();
      expect(response.metadata?.fallbackUsed).toBe(true);
      expect(response.metadata?.errors).toContain("JSON parsing failed");
    });

    it("should validate and repair malformed coordinates", async () => {
      const malformedResponse = {
        ...mockOpenAIResponse,
        layers: [
          {
            id: "malformed",
            label: "Malformed Layer",
            paths: [
              {
                id: "out_of_bounds",
                style: { fill: "#FF0000" },
                commands: [
                  { cmd: "M" as const, coords: [-100, -100] }, // Out of bounds
                  { cmd: "L" as const, coords: [600, 600] }, // Out of bounds
                  { cmd: "Z" as const, coords: [] },
                ],
              },
            ],
          },
        ],
      };

      const malformedOpenAI = {
        chat: {
          completions: {
            create: vi.fn().mockResolvedValue({
              choices: [
                {
                  message: {
                    content: JSON.stringify(malformedResponse),
                  },
                },
              ],
            }),
          },
        },
      };

      const malformedGenerator = new UnifiedSVGGenerator(
        malformedOpenAI as any,
        promptBuilder,
        interpreter,
        validator,
        errorHandler,
        regionManager,
        coordinateMapper,
        layerManager
      );

      const request: GenerationRequest = {
        prompt: "Create a shape",
        aspectRatio: "1:1",
        model: "llm",
      };

      const response = await malformedGenerator.generate(request);

      expect(response.success).toBe(true);
      expect(response.svg).toBeDefined();
      expect(response.metadata?.coordinatesRepaired).toBe(true);
    });
  });

  describe("End-to-End Shape Type Testing", () => {
    const shapeTypes = [
      { prompt: "Create a circle", expectedElements: ["circle", "round"] },
      { prompt: "Create a square", expectedElements: ["rect", "square"] },
      { prompt: "Create a triangle", expectedElements: ["triangle", "path"] },
      { prompt: "Create a star", expectedElements: ["star", "path"] },
      {
        prompt: "Create a house",
        expectedElements: ["house", "roof", "walls"],
      },
      {
        prompt: "Create a tree",
        expectedElements: ["tree", "trunk", "leaves"],
      },
    ];

    shapeTypes.forEach(({ prompt, expectedElements }) => {
      it(`should generate valid SVG for ${prompt.toLowerCase()}`, async () => {
        const request: GenerationRequest = {
          prompt,
          aspectRatio: "1:1",
          model: "llm",
        };

        const response = await generator.generate(request);

        expect(response.success).toBe(true);
        expect(response.svg).toBeDefined();
        expect(response.svg).toContain("<svg");
        expect(response.svg).toContain("</svg>");

        // Verify SVG is well-formed
        expect(() => {
          // Basic XML structure validation
          const parser = new DOMParser();
          const doc = parser.parseFromString(response.svg, "image/svg+xml");
          expect(doc.documentElement.tagName).toBe("svg");
        }).not.toThrow();

        // Verify metadata contains expected information
        expect(response.metadata?.layers).toBeDefined();
        expect(response.metadata?.layers?.length).toBeGreaterThan(0);
      });
    });

    it("should handle complex multi-element scenes", async () => {
      const request: GenerationRequest = {
        prompt: "Create a landscape with mountains, trees, and a house",
        aspectRatio: "16:9",
        model: "llm",
      };

      const response = await generator.generate(request);

      expect(response.success).toBe(true);
      expect(response.svg).toBeDefined();
      expect(response.metadata?.layers?.length).toBeGreaterThan(2); // Should have multiple layers for complex scene
    });
  });

  describe("Debug and Visualization Integration", () => {
    it("should generate debug visualization for generated documents", async () => {
      const request: GenerationRequest = {
        prompt: "Create a simple house",
        aspectRatio: "1:1",
        model: "llm",
        debug: true,
      };

      const response = await generator.generate(request);

      expect(response.success).toBe(true);
      expect(response.debug).toBeDefined();
      expect(response.debug?.overlayElements).toBeDefined();
      expect(response.debug?.statistics).toBeDefined();
      expect(response.debug?.renderTime).toBeGreaterThanOrEqual(0);
    });

    it("should provide layout quality scoring", async () => {
      const request: GenerationRequest = {
        prompt: "Create a well-positioned design",
        aspectRatio: "1:1",
        model: "llm",
        debug: true,
      };

      const response = await generator.generate(request);

      expect(response.success).toBe(true);
      expect(response.debug?.statistics?.regionsShown).toBeGreaterThan(0);
      expect(response.debug?.statistics?.layersAnalyzed).toBeGreaterThan(0);
      expect(response.metadata?.layoutQuality).toBeDefined();
    });

    it("should detect and report layout errors", async () => {
      // Force an error by mocking a response with invalid coordinates
      const errorResponse = {
        ...mockOpenAIResponse,
        layers: [
          {
            id: "error_layer",
            label: "Error Layer",
            paths: [
              {
                id: "error_path",
                style: { fill: "#FF0000" },
                commands: [
                  { cmd: "M" as const, coords: [1000, 1000] }, // Out of bounds
                ],
              },
            ],
          },
        ],
      };

      const errorOpenAI = {
        chat: {
          completions: {
            create: vi.fn().mockResolvedValue({
              choices: [
                {
                  message: {
                    content: JSON.stringify(errorResponse),
                  },
                },
              ],
            }),
          },
        },
      };

      const errorGenerator = new UnifiedSVGGenerator(
        errorOpenAI as any,
        promptBuilder,
        interpreter,
        validator,
        errorHandler,
        regionManager,
        coordinateMapper,
        layerManager
      );

      const request: GenerationRequest = {
        prompt: "Create a shape",
        aspectRatio: "1:1",
        model: "llm",
        debug: true,
      };

      const response = await errorGenerator.generate(request);

      expect(response.success).toBe(true); // Should still succeed via error handling
      expect(response.debug?.statistics?.errorsFound).toBeGreaterThan(0);
      expect(response.metadata?.coordinatesRepaired).toBe(true);
    });
  });

  describe("Memory and Resource Management", () => {
    it("should not leak memory during repeated generations", async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Generate multiple SVGs
      for (let i = 0; i < 10; i++) {
        const request: GenerationRequest = {
          prompt: `Create shape ${i}`,
          aspectRatio: "1:1",
          model: "llm",
        };

        const response = await generator.generate(request);
        expect(response.success).toBe(true);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 50MB for 10 generations)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    it("should handle concurrent generation requests", async () => {
      const requests = Array.from({ length: 5 }, (_, i) => ({
        prompt: `Create concurrent shape ${i}`,
        aspectRatio: "1:1" as AspectRatio,
        model: "llm" as const,
      }));

      const startTime = performance.now();
      const responses = await Promise.all(
        requests.map((request) => generator.generate(request))
      );
      const endTime = performance.now();

      // All should succeed
      responses.forEach((response, i) => {
        expect(response.success).toBe(true);
        expect(response.svg).toBeDefined();
      });

      // Concurrent execution should be reasonably fast
      expect(endTime - startTime).toBeLessThan(15000); // 15 seconds for 5 concurrent requests
    });
  });

  describe("Configuration and Feature Flags", () => {
    it("should respect unified generation feature flag", async () => {
      // Test with unified generation enabled
      const request: GenerationRequest = {
        prompt: "Create a shape",
        aspectRatio: "1:1",
        model: "llm",
        features: {
          unifiedGeneration: true,
        },
      };

      const response = await generator.generate(request);

      expect(response.success).toBe(true);
      expect(response.metadata?.generationMethod).toBe("unified-layered");
    });

    it("should handle environment-specific settings", async () => {
      const request: GenerationRequest = {
        prompt: "Create a shape",
        aspectRatio: "1:1",
        model: "llm",
        environment: "development",
      };

      const response = await generator.generate(request);

      expect(response.success).toBe(true);
      // In development, should include additional debug information
      expect(response.metadata?.environment).toBe("development");
    });

    it("should support A/B testing between generation methods", async () => {
      const requests = Array.from({ length: 10 }, (_, i) => ({
        prompt: "Create a test shape",
        aspectRatio: "1:1" as AspectRatio,
        model: "llm" as const,
        abTestGroup: i % 2 === 0 ? "unified" : "traditional",
      }));

      const responses = await Promise.all(
        requests.map((request) => generator.generate(request))
      );

      // All should succeed
      responses.forEach((response) => {
        expect(response.success).toBe(true);
      });

      // Should have used different generation methods based on A/B test group
      const unifiedResponses = responses.filter(
        (r) => r.metadata?.generationMethod === "unified-layered"
      );
      const traditionalResponses = responses.filter(
        (r) => r.metadata?.generationMethod !== "unified-layered"
      );

      expect(unifiedResponses.length).toBeGreaterThan(0);
      expect(traditionalResponses.length).toBeGreaterThan(0);
    });
  });
});
