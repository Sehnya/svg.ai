"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var useErrorHandler_1 = require("../../src/composables/useErrorHandler");
var api_1 = require("../../src/services/api");
// Mock the toast composable
vitest_1.vi.mock("../../src/composables/useToast", function () { return ({
    useToast: function () { return ({
        error: vitest_1.vi.fn(),
        warning: vitest_1.vi.fn(),
        success: vitest_1.vi.fn(),
        info: vitest_1.vi.fn(),
    }); },
}); });
(0, vitest_1.describe)("useErrorHandler", function () {
    var errorHandler;
    (0, vitest_1.beforeEach)(function () {
        errorHandler = (0, useErrorHandler_1.useErrorHandler)();
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)("handleAPIError", function () {
        (0, vitest_1.it)("should handle NetworkError correctly", function () {
            var error = new api_1.NetworkError("Connection failed");
            var consoleSpy = vitest_1.vi
                .spyOn(console, "error")
                .mockImplementation(function () { });
            errorHandler.handleAPIError(error, { component: "test" });
            (0, vitest_1.expect)(consoleSpy).toHaveBeenCalledWith("Error logged:", vitest_1.expect.objectContaining({
                message: "Connection failed",
                name: "NetworkError",
            }));
            consoleSpy.mockRestore();
        });
        (0, vitest_1.it)("should handle TimeoutError correctly", function () {
            var error = new api_1.TimeoutError("Request timeout");
            var consoleSpy = vitest_1.vi
                .spyOn(console, "error")
                .mockImplementation(function () { });
            errorHandler.handleAPIError(error, { component: "test" });
            (0, vitest_1.expect)(consoleSpy).toHaveBeenCalledWith("Error logged:", vitest_1.expect.objectContaining({
                message: "Request timeout",
                name: "TimeoutError",
            }));
            consoleSpy.mockRestore();
        });
        (0, vitest_1.it)("should handle APIError with different status codes", function () {
            var consoleSpy = vitest_1.vi
                .spyOn(console, "error")
                .mockImplementation(function () { });
            // Test 400 error
            var badRequestError = new api_1.APIError("Bad request", 400);
            errorHandler.handleAPIError(badRequestError);
            // Test 429 error
            var rateLimitError = new api_1.APIError("Rate limited", 429);
            errorHandler.handleAPIError(rateLimitError);
            // Test 500 error
            var serverError = new api_1.APIError("Server error", 500);
            errorHandler.handleAPIError(serverError);
            (0, vitest_1.expect)(consoleSpy).toHaveBeenCalledTimes(3);
            consoleSpy.mockRestore();
        });
        (0, vitest_1.it)("should handle generic errors", function () {
            var error = new Error("Generic error");
            var consoleSpy = vitest_1.vi
                .spyOn(console, "error")
                .mockImplementation(function () { });
            errorHandler.handleAPIError(error);
            (0, vitest_1.expect)(consoleSpy).toHaveBeenCalledWith("Error logged:", vitest_1.expect.objectContaining({
                message: "Generic error",
                name: "Error",
            }));
            consoleSpy.mockRestore();
        });
    });
    (0, vitest_1.describe)("handleValidationErrors", function () {
        (0, vitest_1.it)("should handle single validation error", function () {
            var errors = [{ field: "prompt", message: "Prompt is required" }];
            var consoleSpy = vitest_1.vi
                .spyOn(console, "error")
                .mockImplementation(function () { });
            errorHandler.handleValidationErrors(errors);
            (0, vitest_1.expect)(consoleSpy).toHaveBeenCalledWith("Error logged:", vitest_1.expect.objectContaining({
                message: "Validation failed: Prompt is required",
            }));
            consoleSpy.mockRestore();
        });
        (0, vitest_1.it)("should handle multiple validation errors", function () {
            var errors = [
                { field: "prompt", message: "Prompt is required" },
                { field: "width", message: "Width must be positive" },
            ];
            var consoleSpy = vitest_1.vi
                .spyOn(console, "error")
                .mockImplementation(function () { });
            errorHandler.handleValidationErrors(errors);
            (0, vitest_1.expect)(consoleSpy).toHaveBeenCalledWith("Error logged:", vitest_1.expect.objectContaining({
                message: "Validation failed: Prompt is required, Width must be positive",
            }));
            consoleSpy.mockRestore();
        });
    });
    (0, vitest_1.describe)("handleGenerationError", function () {
        (0, vitest_1.it)("should handle generation error with structured response", function () {
            var error = new api_1.APIError("Generation failed", 400, {
                errors: ["Invalid prompt", "Size too large"],
            });
            var consoleSpy = vitest_1.vi
                .spyOn(console, "error")
                .mockImplementation(function () { });
            errorHandler.handleGenerationError(error);
            (0, vitest_1.expect)(consoleSpy).toHaveBeenCalledWith("Error logged:", vitest_1.expect.objectContaining({
                context: vitest_1.expect.objectContaining({
                    action: "svg_generation",
                }),
            }));
            consoleSpy.mockRestore();
        });
        (0, vitest_1.it)("should fallback to handleAPIError for other errors", function () {
            var error = new api_1.NetworkError("Connection failed");
            var consoleSpy = vitest_1.vi
                .spyOn(console, "error")
                .mockImplementation(function () { });
            errorHandler.handleGenerationError(error);
            (0, vitest_1.expect)(consoleSpy).toHaveBeenCalledWith("Error logged:", vitest_1.expect.objectContaining({
                message: "Connection failed",
                context: vitest_1.expect.objectContaining({
                    action: "svg_generation",
                }),
            }));
            consoleSpy.mockRestore();
        });
    });
    (0, vitest_1.describe)("handleCopyError", function () {
        (0, vitest_1.it)("should handle copy errors correctly", function () {
            var error = new Error("Clipboard not available");
            var consoleSpy = vitest_1.vi
                .spyOn(console, "error")
                .mockImplementation(function () { });
            errorHandler.handleCopyError(error);
            (0, vitest_1.expect)(consoleSpy).toHaveBeenCalledWith("Error logged:", vitest_1.expect.objectContaining({
                message: "Clipboard not available",
                context: vitest_1.expect.objectContaining({
                    action: "copy_to_clipboard",
                }),
            }));
            consoleSpy.mockRestore();
        });
    });
    (0, vitest_1.describe)("handleUnexpectedError", function () {
        (0, vitest_1.it)("should handle unexpected errors correctly", function () {
            var error = new Error("Unexpected error");
            var consoleSpy = vitest_1.vi
                .spyOn(console, "error")
                .mockImplementation(function () { });
            errorHandler.handleUnexpectedError(error);
            (0, vitest_1.expect)(consoleSpy).toHaveBeenCalledWith("Error logged:", vitest_1.expect.objectContaining({
                message: "Unexpected error",
                context: vitest_1.expect.objectContaining({
                    action: "unexpected_error",
                }),
            }));
            consoleSpy.mockRestore();
        });
    });
    (0, vitest_1.describe)("success methods", function () {
        (0, vitest_1.it)("should show success messages", function () {
            errorHandler.showSuccess("Success", "Operation completed");
            errorHandler.showWarning("Warning", "Be careful");
            errorHandler.showInfo("Info", "For your information");
            // These methods should not throw errors
            (0, vitest_1.expect)(true).toBe(true);
        });
    });
});
