/**
 * Integration tests for unified error handling and fallback mechanisms
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { UnifiedErrorHandler } from "../../server/services/UnifiedErrorHandler";
import { LayeredSVGGenerator } from "../../server/services/LayeredSVGGenerator";
import { RuleBasedGenerator } from "../../server/services/RuleBasedGenerator";
import type { GenerationRequest } from "../../server/types/api";

describe("Unified Error Handling Integration", () => {
  let errorHandler: UnifiedErrorHandler;
  let mockRequest: GenerationRequest;

  beforeEach(() => {
    errorHandler = new UnifiedErrorHandler({
      maxRetries: 2,
      baseDelay: 50, // Faster for testing
      maxDelay: 200,
      timeoutMs: 1000,
      enableFallbacks: true,
      logErrors: true,
      includeErrorDetails: true,
    });

    mockRequest = {
      prompt: "a blue circle with red border",
      size: { width: 512, height: 512 },
      palette: ["#3B82F6", "#DC2626"],
      seed: 12345,
      model: "unified",
    };

    errorHandler.clearErrorLog();
  });

  describe("Complete Fallback Chain", () => {
    it("should demonstrate complete fallback chain when all methods fail", async () => {
      // Mock all generators to fail
      const mockLayeredGenerator = {
        generate: vi.fn().mockRejectedValue(new Error("OpenAI API error")),
      } as any;

      errorHandler.setLayeredGenerator(mockLayeredGenerator);

      const result =
        await errorHandler.handleGenerationWithFallbacks(mockRequest);

      // Should have attempted all fallback methods
      expect(mockLayeredGenerator.generate).toHaveBeenCalledTimes(4); // 2 methods × 2 retries each

      // Should fallback to basic shapes
      expect(result.svg).toContain("<circle");
      expect(result.svg).toContain('fill="#3B82F6"');
      expect(result.layers[0].label).toBe("Basic Shape");

      // Should have comprehensive warnings
      expect(result.warnings).toContain(
        expect.stringContaining("Unified layered generation failed")
      );
      expect(result.warnings).toContain(
        expect.stringContaining("Layered-only generation failed")
      );
      expect(result.warnings).toContain(
        expect.stringContaining("Rule-based generation failed")
      );
      expect(result.warnings).toContain(
        expect.stringContaining("Used basic shapes fallback")
      );

      // Should have error details
      expect(result.errors).toContain(
        expect.stringContaining("All advanced generation methods failed")
      );
    });

    it("should succeed at first fallback level when unified fails", async () => {
      const mockLayeredGenerator = {
        generate: vi
          .fn()
          .mockRejectedValueOnce(new Error("Unified generation failed"))
          .mockResolvedValueOnce({
            svg: '<svg xmlns="http://www.w3.org/2000/svg"><rect fill="#3B82F6"/></svg>',
            meta: {
              width: 512,
              height: 512,
              viewBox: "0 0 512 512",
              backgroundColor: "transparent",
              palette: ["#3B82F6"],
              description: "Layered fallback SVG",
              seed: 12345,
            },
            layers: [{ id: "layer1", label: "Main Layer", type: "shape" }],
            warnings: [],
            errors: [],
          }),
      } as any;

      errorHandler.setLayeredGenerator(mockLayeredGenerator);

      const result =
        await errorHandler.handleGenerationWithFallbacks(mockRequest);

      expect(result.svg).toContain("<rect");
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toContain(
        expect.stringContaining("Unified layered generation failed")
      );
      expect(result.warnings).not.toContain(
        expect.stringContaining("Layered-only generation failed")
      );
    });
  });

  describe("Error Recovery Scenarios", () => {
    it("should recover from transient timeout errors", async () => {
      const mockLayeredGenerator = {
        generate: vi
          .fn()
          .mockRejectedValueOnce(new Error("Timeout after 30000ms"))
          .mockResolvedValueOnce({
            svg: '<svg xmlns="http://www.w3.org/2000/svg"><circle fill="#3B82F6"/></svg>',
            meta: {
              width: 512,
              height: 512,
              viewBox: "0 0 512 512",
              backgroundColor: "transparent",
              palette: ["#3B82F6"],
              description: "Recovered SVG",
              seed: 12345,
            },
            layers: [],
            warnings: [],
            errors: [],
          }),
      } as any;

      errorHandler.setLayeredGenerator(mockLayeredGenerator);

      const startTime = Date.now();
      const result =
        await errorHandler.handleGenerationWithFallbacks(mockRequest);
      const endTime = Date.now();

      expect(result.svg).toContain("<circle");
      expect(result.errors).toHaveLength(0);
      expect(endTime - startTime).toBeGreaterThan(50); // Should have waited for retry
      expect(mockLayeredGenerator.generate).toHaveBeenCalledTimes(2);
    });

    it("should handle rate limit errors with appropriate backoff", async () => {
      const mockLayeredGenerator = {
        generate: vi
          .fn()
          .mockRejectedValueOnce(new Error("Rate limit exceeded (429)"))
          .mockRejectedValueOnce(new Error("Rate limit exceeded (429)"))
          .mockResolvedValueOnce({
            svg: '<svg xmlns="http://www.w3.org/2000/svg"><polygon fill="#3B82F6"/></svg>',
            meta: {
              width: 512,
              height: 512,
              viewBox: "0 0 512 512",
              backgroundColor: "transparent",
              palette: ["#3B82F6"],
              description: "Rate limit recovered SVG",
              seed: 12345,
            },
            layers: [],
            warnings: [],
            errors: [],
          }),
      } as any;

      errorHandler.setLayeredGenerator(mockLayeredGenerator);

      const result =
        await errorHandler.handleGenerationWithFallbacks(mockRequest);

      expect(result.svg).toContain("<polygon");
      expect(result.errors).toHaveLength(0);
      expect(mockLayeredGenerator.generate).toHaveBeenCalledTimes(3);
    });

    it("should not retry non-recoverable validation errors", async () => {
      const mockLayeredGenerator = {
        generate: vi
          .fn()
          .mockRejectedValue(new Error("Schema validation failed")),
      } as any;

      errorHandler.setLayeredGenerator(mockLayeredGenerator);

      const result =
        await errorHandler.handleGenerationWithFallbacks(mockRequest);

      // Should not retry validation errors, should move to next fallback quickly
      expect(mockLayeredGenerator.generate).toHaveBeenCalledTimes(2); // unified + layered-only, no retries
      expect(result.svg).toContain("<circle"); // Basic shapes fallback
    });
  });

  describe("Shape-Specific Fallbacks", () => {
    it("should generate appropriate basic shapes based on prompt", async () => {
      const testCases = [
        { prompt: "a red circle", expectedShape: "<circle" },
        { prompt: "a blue rectangle", expectedShape: "<rect" },
        { prompt: "a green triangle", expectedShape: "<polygon" },
        { prompt: "a yellow square", expectedShape: "<rect" },
        { prompt: "something complex", expectedShape: "<circle" }, // default
      ];

      for (const testCase of testCases) {
        const mockLayeredGenerator = {
          generate: vi.fn().mockRejectedValue(new Error("All methods failed")),
        } as any;

        errorHandler.setLayeredGenerator(mockLayeredGenerator);

        const request = { ...mockRequest, prompt: testCase.prompt };
        const result =
          await errorHandler.handleGenerationWithFallbacks(request);

        expect(result.svg).toContain(testCase.expectedShape);
        expect(result.layers[0].label).toBe("Basic Shape");
      }
    });

    it("should preserve color palette in basic shapes", async () => {
      const colorRequest = {
        ...mockRequest,
        prompt: "a colorful circle",
        palette: ["#FF6B6B", "#4ECDC4", "#45B7D1"],
      };

      const mockLayeredGenerator = {
        generate: vi.fn().mockRejectedValue(new Error("All methods failed")),
      } as any;

      errorHandler.setLayeredGenerator(mockLayeredGenerator);

      const result =
        await errorHandler.handleGenerationWithFallbacks(colorRequest);

      expect(result.svg).toContain('fill="#FF6B6B"');
      expect(result.meta.palette).toEqual(["#FF6B6B", "#4ECDC4", "#45B7D1"]);
    });
  });

  describe("Error Statistics and Monitoring", () => {
    it("should track error statistics across multiple requests", async () => {
      const mockLayeredGenerator = {
        generate: vi
          .fn()
          .mockRejectedValueOnce(new Error("Timeout after 30000ms"))
          .mockRejectedValueOnce(new Error("Rate limit exceeded"))
          .mockRejectedValueOnce(new Error("JSON parse error")),
      } as any;

      errorHandler.setLayeredGenerator(mockLayeredGenerator);

      // Make multiple requests
      await errorHandler.handleGenerationWithFallbacks(mockRequest);
      await errorHandler.handleGenerationWithFallbacks(mockRequest);
      await errorHandler.handleGenerationWithFallbacks(mockRequest);

      const stats = errorHandler.getErrorStats();

      expect(stats.totalErrors).toBeGreaterThan(0);
      expect(stats.errorsByType).toBeDefined();
      expect(stats.recentErrors.length).toBeGreaterThan(0);
      expect(stats.averageRetries).toBeGreaterThan(0);

      // Check that different error types are tracked
      expect(Object.keys(stats.errorsByType).length).toBeGreaterThan(1);
    });

    it("should provide recent error details for debugging", async () => {
      const mockLayeredGenerator = {
        generate: vi
          .fn()
          .mockRejectedValue(new Error("Detailed error for debugging")),
      } as any;

      errorHandler.setLayeredGenerator(mockLayeredGenerator);

      const result =
        await errorHandler.handleGenerationWithFallbacks(mockRequest);

      const stats = errorHandler.getErrorStats();
      const recentError = stats.recentErrors[stats.recentErrors.length - 1];

      expect(recentError.message).toContain("Detailed error for debugging");
      expect(recentError.request.prompt).toBe(mockRequest.prompt);
      expect(recentError.timestamp).toBeInstanceOf(Date);
      expect(recentError.type).toBeDefined();
    });
  });

  describe("Performance and Reliability", () => {
    it("should complete generation within reasonable time even with failures", async () => {
      const mockLayeredGenerator = {
        generate: vi.fn().mockRejectedValue(new Error("Simulated failure")),
      } as any;

      errorHandler.setLayeredGenerator(mockLayeredGenerator);

      const startTime = Date.now();
      const result =
        await errorHandler.handleGenerationWithFallbacks(mockRequest);
      const endTime = Date.now();

      expect(result.svg).toContain("xmlns="); // Valid SVG
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it("should handle concurrent requests without interference", async () => {
      const mockLayeredGenerator = {
        generate: vi
          .fn()
          .mockRejectedValueOnce(new Error("Error 1"))
          .mockRejectedValueOnce(new Error("Error 2"))
          .mockRejectedValueOnce(new Error("Error 3")),
      } as any;

      errorHandler.setLayeredGenerator(mockLayeredGenerator);

      const requests = [
        { ...mockRequest, prompt: "request 1" },
        { ...mockRequest, prompt: "request 2" },
        { ...mockRequest, prompt: "request 3" },
      ];

      const results = await Promise.all(
        requests.map((req) => errorHandler.handleGenerationWithFallbacks(req))
      );

      // All requests should complete successfully with fallbacks
      results.forEach((result, index) => {
        expect(result.svg).toContain("xmlns=");
        expect(result.meta.description).toContain(`request ${index + 1}`);
      });
    });

    it("should maintain consistent response format across all fallback levels", async () => {
      const mockLayeredGenerator = {
        generate: vi.fn().mockRejectedValue(new Error("All methods failed")),
      } as any;

      errorHandler.setLayeredGenerator(mockLayeredGenerator);

      const result =
        await errorHandler.handleGenerationWithFallbacks(mockRequest);

      // Check response structure
      expect(result).toHaveProperty("svg");
      expect(result).toHaveProperty("meta");
      expect(result).toHaveProperty("layers");
      expect(result).toHaveProperty("warnings");
      expect(result).toHaveProperty("errors");

      // Check metadata structure
      expect(result.meta).toHaveProperty("width");
      expect(result.meta).toHaveProperty("height");
      expect(result.meta).toHaveProperty("viewBox");
      expect(result.meta).toHaveProperty("palette");
      expect(result.meta).toHaveProperty("description");
      expect(result.meta).toHaveProperty("seed");

      // Check layer structure
      expect(Array.isArray(result.layers)).toBe(true);
      if (result.layers.length > 0) {
        expect(result.layers[0]).toHaveProperty("id");
        expect(result.layers[0]).toHaveProperty("label");
        expect(result.layers[0]).toHaveProperty("type");
      }
    });
  });

  describe("Configuration and Customization", () => {
    it("should respect custom timeout settings", async () => {
      const shortTimeoutHandler = new UnifiedErrorHandler({
        timeoutMs: 100, // Very short timeout
        maxRetries: 1,
      });

      const mockLayeredGenerator = {
        generate: vi.fn().mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 200)) // Longer than timeout
        ),
      } as any;

      shortTimeoutHandler.setLayeredGenerator(mockLayeredGenerator);

      const startTime = Date.now();
      const result =
        await shortTimeoutHandler.handleGenerationWithFallbacks(mockRequest);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should timeout quickly
      expect(result.warnings).toContain(expect.stringContaining("Timeout"));
    });

    it("should allow disabling specific fallback levels", async () => {
      const noFallbackHandler = new UnifiedErrorHandler({
        enableFallbacks: false,
        maxRetries: 1,
      });

      const mockLayeredGenerator = {
        generate: vi.fn().mockRejectedValue(new Error("Generation failed")),
      } as any;

      noFallbackHandler.setLayeredGenerator(mockLayeredGenerator);

      const result =
        await noFallbackHandler.handleGenerationWithFallbacks(mockRequest);

      expect(result.svg).toContain("Generation Failed");
      expect(result.errors).toContain("All generation methods failed");
    });

    it("should update configuration dynamically", () => {
      const initialOptions = (errorHandler as any).options;
      expect(initialOptions.maxRetries).toBe(2);

      errorHandler.updateOptions({
        maxRetries: 5,
        timeoutMs: 60000,
        enableFallbacks: false,
      });

      const updatedOptions = (errorHandler as any).options;
      expect(updatedOptions.maxRetries).toBe(5);
      expect(updatedOptions.timeoutMs).toBe(60000);
      expect(updatedOptions.enableFallbacks).toBe(false);
    });
  });
});
