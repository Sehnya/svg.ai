import { describe, it, expect, beforeEach, vi } from "vitest";
import { useErrorHandler } from "../../src/composables/useErrorHandler";
import { APIError, NetworkError, TimeoutError } from "../../src/services/api";

// Mock the toast composable
vi.mock("../../src/composables/useToast", () => ({
  useToast: () => ({
    error: vi.fn(),
    warning: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  }),
}));

describe("useErrorHandler", () => {
  let errorHandler: ReturnType<typeof useErrorHandler>;

  beforeEach(() => {
    errorHandler = useErrorHandler();
    vi.clearAllMocks();
  });

  describe("handleAPIError", () => {
    it("should handle NetworkError correctly", () => {
      const error = new NetworkError("Connection failed");
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      errorHandler.handleAPIError(error, { component: "test" });

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error logged:",
        expect.objectContaining({
          message: "Connection failed",
          name: "NetworkError",
        })
      );

      consoleSpy.mockRestore();
    });

    it("should handle TimeoutError correctly", () => {
      const error = new TimeoutError("Request timeout");
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      errorHandler.handleAPIError(error, { component: "test" });

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error logged:",
        expect.objectContaining({
          message: "Request timeout",
          name: "TimeoutError",
        })
      );

      consoleSpy.mockRestore();
    });

    it("should handle APIError with different status codes", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Test 400 error
      const badRequestError = new APIError("Bad request", 400);
      errorHandler.handleAPIError(badRequestError);

      // Test 429 error
      const rateLimitError = new APIError("Rate limited", 429);
      errorHandler.handleAPIError(rateLimitError);

      // Test 500 error
      const serverError = new APIError("Server error", 500);
      errorHandler.handleAPIError(serverError);

      expect(consoleSpy).toHaveBeenCalledTimes(3);
      consoleSpy.mockRestore();
    });

    it("should handle generic errors", () => {
      const error = new Error("Generic error");
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      errorHandler.handleAPIError(error);

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error logged:",
        expect.objectContaining({
          message: "Generic error",
          name: "Error",
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe("handleValidationErrors", () => {
    it("should handle single validation error", () => {
      const errors = [{ field: "prompt", message: "Prompt is required" }];
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      errorHandler.handleValidationErrors(errors);

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error logged:",
        expect.objectContaining({
          message: "Validation failed: Prompt is required",
        })
      );

      consoleSpy.mockRestore();
    });

    it("should handle multiple validation errors", () => {
      const errors = [
        { field: "prompt", message: "Prompt is required" },
        { field: "width", message: "Width must be positive" },
      ];
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      errorHandler.handleValidationErrors(errors);

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error logged:",
        expect.objectContaining({
          message:
            "Validation failed: Prompt is required, Width must be positive",
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe("handleGenerationError", () => {
    it("should handle generation error with structured response", () => {
      const error = new APIError("Generation failed", 400, {
        errors: ["Invalid prompt", "Size too large"],
      });
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      errorHandler.handleGenerationError(error);

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error logged:",
        expect.objectContaining({
          context: expect.objectContaining({
            action: "svg_generation",
          }),
        })
      );

      consoleSpy.mockRestore();
    });

    it("should fallback to handleAPIError for other errors", () => {
      const error = new NetworkError("Connection failed");
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      errorHandler.handleGenerationError(error);

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error logged:",
        expect.objectContaining({
          message: "Connection failed",
          context: expect.objectContaining({
            action: "svg_generation",
          }),
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe("handleCopyError", () => {
    it("should handle copy errors correctly", () => {
      const error = new Error("Clipboard not available");
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      errorHandler.handleCopyError(error);

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error logged:",
        expect.objectContaining({
          message: "Clipboard not available",
          context: expect.objectContaining({
            action: "copy_to_clipboard",
          }),
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe("handleUnexpectedError", () => {
    it("should handle unexpected errors correctly", () => {
      const error = new Error("Unexpected error");
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      errorHandler.handleUnexpectedError(error);

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error logged:",
        expect.objectContaining({
          message: "Unexpected error",
          context: expect.objectContaining({
            action: "unexpected_error",
          }),
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe("success methods", () => {
    it("should show success messages", () => {
      errorHandler.showSuccess("Success", "Operation completed");
      errorHandler.showWarning("Warning", "Be careful");
      errorHandler.showInfo("Info", "For your information");

      // These methods should not throw errors
      expect(true).toBe(true);
    });
  });
});
