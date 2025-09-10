/**
 * Unit tests for UnifiedErrorHandler
 */

import { describe, it, expect, beforeEach, vi, Mock } from "vitest";
import {
  UnifiedErrorHandler,
  ErrorType,
} from "../../server/services/UnifiedErrorHandler";
import { LayeredSVGGenerator } from "../../server/services/LayeredSVGGenerator";
import { RuleBasedGenerator } from "../../server/services/RuleBasedGenerator";
import type {
  GenerationRequest,
  GenerationResponse,
} from "../../server/types/api";

// Mock the dependencies
vi.mock("../../server/services/LayeredSVGGenerator");
vi.mock("../../server/services/RuleBasedGenerator");
vi.mock("../../server/services/SVGSanitizer");

describe("UnifiedErrorHandler", () => {
  let errorHandler: UnifiedErrorHandler;
  let mockLayeredGenerator: LayeredSVGGenerator;
  let mockRequest: GenerationRequest;

  beforeEach(() => {
    errorHandler = new UnifiedErrorHandler({
      maxRetries: 2,
      baseDelay: 100,
      maxDelay: 1000,
      timeoutMs: 5000,
      enableFallbacks: true,
      logErrors: true,
      includeErrorDetails: true,
    });

    mockLayeredGenerator = new LayeredSVGGenerator("test-api-key");
    errorHandler.setLayeredGenerator(mockLayeredGenerator);

    mockRequest = {
      prompt: "a blue circle",
      size: { width: 512, height: 512 },
      palette: ["#3B82F6"],
      seed: 12345,
      model: "unified",
    };

    // Clear any previous error logs
    errorHandler.clearErrorLog();
  });

  describe("Error Classification", () => {
    it("should classify OpenAI timeout errors correctly", async () => {
      const timeoutError = new Error("Timeout after 30000ms");
      (mockLayeredGenerator.generate as Mock).mockRejectedValue(timeoutError);

      const result =
        await errorHandler.handleGenerationWithFallbacks(mockRequest);

      expect(result.warnings).toContain(
        expect.stringContaining("Timeout after 30000ms")
      );
      expect(result.svg).toContain("Generation Failed");
    });

    it("should classify rate limit errors correctly", async () => {
      const rateLimitError = new Error("Rate limit exceeded (429)");
      (mockLayeredGenerator.generate as Mock).mockRejectedValue(rateLimitError);

      const result =
        await errorHandler.handleGenerationWithFallbacks(mockRequest);

      expect(result.warnings).toContain(
        expect.stringContaining("Rate limit exceeded")
      );
    });

    it("should classify JSON parse errors correctly", async () => {
      const jsonError = new Error("Invalid JSON response from API");
      (mockLayeredGenerator.generate as Mock).mockRejectedValue(jsonError);

      const result =
        await errorHandler.handleGenerationWithFallbacks(mockRequest);

      expect(result.warnings).toContain(
        expect.stringContaining("Invalid JSON response")
      );
    });

    it("should classify validation errors correctly", async () => {
      const validationError = new Error("Schema validation failed");
      (mockLayeredGenerator.generate as Mock).mockRejectedValue(
        validationError
      );

      const result =
        await errorHandler.handleGenerationWithFallbacks(mockRequest);

      expect(result.warnings).toContain(
        expect.stringContaining("Schema validation failed")
      );
    });
  });

  describe("Fallback Chain", () => {
    it("should attempt unified layered generation first", async () => {
      const successResponse: GenerationResponse = {
        svg: '<svg xmlns="http://www.w3.org/2000/svg"><circle/></svg>',
        meta: {
          width: 512,
          height: 512,
          viewBox: "0 0 512 512",
          backgroundColor: "transparent",
          palette: ["#3B82F6"],
          description: "Test SVG",
          seed: 12345,
        },
        layers: [],
        warnings: [],
        errors: [],
      };

      (mockLayeredGenerator.generate as Mock).mockResolvedValue(
        successResponse
      );

      const result =
        await errorHandler.handleGenerationWithFallbacks(mockRequest);

      expect(mockLayeredGenerator.generate).toHaveBeenCalledWith({
        ...mockRequest,
        model: "unified",
      });
      expect(result.svg).toContain("circle");
      expect(result.errors).toHaveLength(0);
    });

    it("should fallback to layered-only generation when unified fails", async () => {
      const unifiedError = new Error("Unified generation failed");
      const layeredResponse: GenerationResponse = {
        svg: '<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>',
        meta: {
          width: 512,
          height: 512,
          viewBox: "0 0 512 512",
          backgroundColor: "transparent",
          palette: ["#3B82F6"],
          description: "Layered SVG",
          seed: 12345,
        },
        layers: [],
        warnings: [],
        errors: [],
      };

      (mockLayeredGenerator.generate as Mock)
        .mockRejectedValueOnce(unifiedError)
        .mockResolvedValueOnce(layeredResponse);

      const result =
        await errorHandler.handleGenerationWithFallbacks(mockRequest);

      expect(mockLayeredGenerator.generate).toHaveBeenCalledTimes(2);
      expect(mockLayeredGenerator.generate).toHaveBeenNthCalledWith(1, {
        ...mockRequest,
        model: "unified",
      });
      expect(mockLayeredGenerator.generate).toHaveBeenNthCalledWith(2, {
        ...mockRequest,
        model: "llm",
      });
      expect(result.svg).toContain("rect");
      expect(result.warnings).toContain(
        expect.stringContaining("Unified layered generation failed")
      );
    });

    it("should fallback to rule-based generation when layered fails", async () => {
      const layeredError = new Error("Layered generation failed");
      const ruleBasedResponse: GenerationResponse = {
        svg: '<svg xmlns="http://www.w3.org/2000/svg"><polygon/></svg>',
        meta: {
          width: 512,
          height: 512,
          viewBox: "0 0 512 512",
          backgroundColor: "transparent",
          palette: ["#3B82F6"],
          description: "Rule-based SVG",
          seed: 12345,
        },
        layers: [],
        warnings: [],
        errors: [],
      };

      (mockLayeredGenerator.generate as Mock).mockRejectedValue(layeredError);

      // Mock the rule-based generator through the error handler's internal instance
      const mockRuleBasedGenerate = vi
        .fn()
        .mockResolvedValue(ruleBasedResponse);
      (errorHandler as any).ruleBasedGenerator.generate = mockRuleBasedGenerate;

      const result =
        await errorHandler.handleGenerationWithFallbacks(mockRequest);

      expect(mockRuleBasedGenerate).toHaveBeenCalledWith({
        ...mockRequest,
        model: "rule-based-unified",
      });
      expect(result.svg).toContain("polygon");
      expect(result.warnings).toContain(
        expect.stringContaining("Unified layered generation failed")
      );
      expect(result.warnings).toContain(
        expect.stringContaining("Layered-only generation failed")
      );
    });

    it("should fallback to basic shapes when all advanced methods fail", async () => {
      const error = new Error("All methods failed");
      (mockLayeredGenerator.generate as Mock).mockRejectedValue(error);

      const mockRuleBasedGenerate = vi.fn().mockRejectedValue(error);
      (errorHandler as any).ruleBasedGenerator.generate = mockRuleBasedGenerate;

      const result =
        await errorHandler.handleGenerationWithFallbacks(mockRequest);

      expect(result.svg).toContain("circle"); // Basic circle fallback
      expect(result.warnings).toContain(
        expect.stringContaining("Used basic shapes fallback")
      );
      expect(result.errors).toContain(
        expect.stringContaining("All advanced generation methods failed")
      );
    });
  });

  describe("Retry Logic", () => {
    it("should retry recoverable errors with exponential backoff", async () => {
      const timeoutError = new Error("Timeout after 30000ms");
      const successResponse: GenerationResponse = {
        svg: '<svg xmlns="http://www.w3.org/2000/svg"><circle/></svg>',
        meta: {
          width: 512,
          height: 512,
          viewBox: "0 0 512 512",
          backgroundColor: "transparent",
          palette: ["#3B82F6"],
          description: "Test SVG",
          seed: 12345,
        },
        layers: [],
        warnings: [],
        errors: [],
      };

      (mockLayeredGenerator.generate as Mock)
        .mockRejectedValueOnce(timeoutError)
        .mockResolvedValueOnce(successResponse);

      const startTime = Date.now();
      const result =
        await errorHandler.handleGenerationWithFallbacks(mockRequest);
      const endTime = Date.now();

      expect(mockLayeredGenerator.generate).toHaveBeenCalledTimes(2);
      expect(result.svg).toContain("circle");
      expect(endTime - startTime).toBeGreaterThan(100); // Should have waited for retry
    });

    it("should not retry non-recoverable errors", async () => {
      const validationError = new Error("Schema validation failed");
      (mockLayeredGenerator.generate as Mock).mockRejectedValue(
        validationError
      );

      const mockRuleBasedGenerate = vi.fn().mockRejectedValue(validationError);
      (errorHandler as any).ruleBasedGenerator.generate = mockRuleBasedGenerate;

      const result =
        await errorHandler.handleGenerationWithFallbacks(mockRequest);

      // Should not retry validation errors, should go straight to fallback
      expect(mockLayeredGenerator.generate).toHaveBeenCalledTimes(2); // unified + layered-only
      expect(result.svg).toContain("circle"); // Basic shapes fallback
    });

    it("should respect maximum retry limit", async () => {
      const timeoutError = new Error("Timeout after 30000ms");
      (mockLayeredGenerator.generate as Mock).mockRejectedValue(timeoutError);

      const mockRuleBasedGenerate = vi.fn().mockRejectedValue(timeoutError);
      (errorHandler as any).ruleBasedGenerator.generate = mockRuleBasedGenerate;

      await errorHandler.handleGenerationWithFallbacks(mockRequest);

      // Should retry up to maxRetries (2) for each method
      expect(mockLayeredGenerator.generate).toHaveBeenCalledTimes(4); // 2 retries × 2 methods
      expect(mockRuleBasedGenerate).toHaveBeenCalledTimes(2); // 2 retries × 1 method
    });
  });

  describe("Basic Shapes Generation", () => {
    it("should generate basic circle for circle prompts", async () => {
      const circleRequest = { ...mockRequest, prompt: "a red circle" };
      const error = new Error("All methods failed");

      (mockLayeredGenerator.generate as Mock).mockRejectedValue(error);
      const mockRuleBasedGenerate = vi.fn().mockRejectedValue(error);
      (errorHandler as any).ruleBasedGenerator.generate = mockRuleBasedGenerate;

      const result =
        await errorHandler.handleGenerationWithFallbacks(circleRequest);

      expect(result.svg).toContain("<circle");
      expect(result.layers[0].label).toBe("Basic Shape");
    });

    it("should generate basic rectangle for rectangle prompts", async () => {
      const rectRequest = { ...mockRequest, prompt: "a blue rectangle" };
      const error = new Error("All methods failed");

      (mockLayeredGenerator.generate as Mock).mockRejectedValue(error);
      const mockRuleBasedGenerate = vi.fn().mockRejectedValue(error);
      (errorHandler as any).ruleBasedGenerator.generate = mockRuleBasedGenerate;

      const result =
        await errorHandler.handleGenerationWithFallbacks(rectRequest);

      expect(result.svg).toContain("<rect");
    });

    it("should generate basic triangle for triangle prompts", async () => {
      const triangleRequest = { ...mockRequest, prompt: "a green triangle" };
      const error = new Error("All methods failed");

      (mockLayeredGenerator.generate as Mock).mockRejectedValue(error);
      const mockRuleBasedGenerate = vi.fn().mockRejectedValue(error);
      (errorHandler as any).ruleBasedGenerator.generate = mockRuleBasedGenerate;

      const result =
        await errorHandler.handleGenerationWithFallbacks(triangleRequest);

      expect(result.svg).toContain("<polygon");
    });

    it("should default to circle for unknown prompts", async () => {
      const unknownRequest = { ...mockRequest, prompt: "something complex" };
      const error = new Error("All methods failed");

      (mockLayeredGenerator.generate as Mock).mockRejectedValue(error);
      const mockRuleBasedGenerate = vi.fn().mockRejectedValue(error);
      (errorHandler as any).ruleBasedGenerator.generate = mockRuleBasedGenerate;

      const result =
        await errorHandler.handleGenerationWithFallbacks(unknownRequest);

      expect(result.svg).toContain("<circle");
    });
  });

  describe("Error Logging and Statistics", () => {
    it("should log errors when logging is enabled", async () => {
      const error = new Error("Test error");
      (mockLayeredGenerator.generate as Mock).mockRejectedValue(error);

      const mockRuleBasedGenerate = vi.fn().mockRejectedValue(error);
      (errorHandler as any).ruleBasedGenerator.generate = mockRuleBasedGenerate;

      await errorHandler.handleGenerationWithFallbacks(mockRequest);

      const stats = errorHandler.getErrorStats();
      expect(stats.totalErrors).toBeGreaterThan(0);
      expect(stats.recentErrors.length).toBeGreaterThan(0);
    });

    it("should provide error statistics", async () => {
      const timeoutError = new Error("Timeout after 30000ms");
      const validationError = new Error("Schema validation failed");

      (mockLayeredGenerator.generate as Mock)
        .mockRejectedValueOnce(timeoutError)
        .mockRejectedValueOnce(validationError);

      const mockRuleBasedGenerate = vi.fn().mockRejectedValue(timeoutError);
      (errorHandler as any).ruleBasedGenerator.generate = mockRuleBasedGenerate;

      await errorHandler.handleGenerationWithFallbacks(mockRequest);

      const stats = errorHandler.getErrorStats();
      expect(stats.errorsByType[ErrorType.OPENAI_TIMEOUT]).toBeGreaterThan(0);
      expect(stats.averageRetries).toBeGreaterThan(0);
    });

    it("should clear error log when requested", async () => {
      const error = new Error("Test error");
      (mockLayeredGenerator.generate as Mock).mockRejectedValue(error);

      const mockRuleBasedGenerate = vi.fn().mockRejectedValue(error);
      (errorHandler as any).ruleBasedGenerator.generate = mockRuleBasedGenerate;

      await errorHandler.handleGenerationWithFallbacks(mockRequest);

      let stats = errorHandler.getErrorStats();
      expect(stats.totalErrors).toBeGreaterThan(0);

      errorHandler.clearErrorLog();

      stats = errorHandler.getErrorStats();
      expect(stats.totalErrors).toBe(0);
    });
  });

  describe("Configuration", () => {
    it("should respect disabled fallbacks", async () => {
      const noFallbackHandler = new UnifiedErrorHandler({
        enableFallbacks: false,
        logErrors: false,
      });

      const error = new Error("Generation failed");
      const mockLayeredGen = new LayeredSVGGenerator("test-key");
      (mockLayeredGen.generate as Mock).mockRejectedValue(error);
      noFallbackHandler.setLayeredGenerator(mockLayeredGen);

      const result =
        await noFallbackHandler.handleGenerationWithFallbacks(mockRequest);

      expect(result.svg).toContain("Generation Failed");
      expect(result.errors).toContain("All generation methods failed");
    });

    it("should update options dynamically", () => {
      errorHandler.updateOptions({
        maxRetries: 5,
        timeoutMs: 60000,
      });

      const stats = (errorHandler as any).options;
      expect(stats.maxRetries).toBe(5);
      expect(stats.timeoutMs).toBe(60000);
    });

    it("should handle timeout correctly", async () => {
      const slowHandler = new UnifiedErrorHandler({
        timeoutMs: 100, // Very short timeout
        maxRetries: 1,
      });

      const mockSlowGenerator = new LayeredSVGGenerator("test-key");
      (mockSlowGenerator.generate as Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 200)) // Slower than timeout
      );
      slowHandler.setLayeredGenerator(mockSlowGenerator);

      const result =
        await slowHandler.handleGenerationWithFallbacks(mockRequest);

      expect(result.warnings).toContain(
        expect.stringContaining("Timeout after 100ms")
      );
    });
  });

  describe("Edge Cases", () => {
    it("should handle missing layered generator gracefully", async () => {
      const handlerWithoutLayered = new UnifiedErrorHandler();
      // Don't set layered generator

      const result =
        await handlerWithoutLayered.handleGenerationWithFallbacks(mockRequest);

      expect(result.svg).toContain("circle"); // Should fallback to basic shapes
      expect(result.warnings).toContain(
        expect.stringContaining("Layered generator not available")
      );
    });

    it("should handle empty palette gracefully", async () => {
      const requestWithoutPalette = { ...mockRequest, palette: [] };
      const error = new Error("All methods failed");

      (mockLayeredGenerator.generate as Mock).mockRejectedValue(error);
      const mockRuleBasedGenerate = vi.fn().mockRejectedValue(error);
      (errorHandler as any).ruleBasedGenerator.generate = mockRuleBasedGenerate;

      const result = await errorHandler.handleGenerationWithFallbacks(
        requestWithoutPalette
      );

      expect(result.svg).toContain("fill="); // Should have some color
      expect(result.meta.palette).toContain("#3B82F6"); // Default color
    });

    it("should handle very large canvas sizes", async () => {
      const largeRequest = {
        ...mockRequest,
        size: { width: 2048, height: 2048 },
      };
      const error = new Error("All methods failed");

      (mockLayeredGenerator.generate as Mock).mockRejectedValue(error);
      const mockRuleBasedGenerate = vi.fn().mockRejectedValue(error);
      (errorHandler as any).ruleBasedGenerator.generate = mockRuleBasedGenerate;

      const result =
        await errorHandler.handleGenerationWithFallbacks(largeRequest);

      expect(result.svg).toContain('viewBox="0 0 2048 2048"');
      expect(result.meta.width).toBe(2048);
      expect(result.meta.height).toBe(2048);
    });
  });
});
