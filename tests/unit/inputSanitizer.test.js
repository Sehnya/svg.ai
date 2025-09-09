"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var inputSanitizer_1 = require("../../src/utils/inputSanitizer");
(0, vitest_1.describe)("InputSanitizer", function () {
    (0, vitest_1.describe)("sanitizeInput", function () {
        (0, vitest_1.it)("should return empty string for null/undefined input", function () {
            (0, vitest_1.expect)(inputSanitizer_1.InputSanitizer.sanitizeInput(null)).toEqual({
                sanitized: "",
                wasModified: false,
                warnings: [],
            });
            (0, vitest_1.expect)(inputSanitizer_1.InputSanitizer.sanitizeInput(undefined)).toEqual({
                sanitized: "",
                wasModified: false,
                warnings: [],
            });
        });
        (0, vitest_1.it)("should remove script tags", function () {
            var input = 'Hello <script>alert("xss")</script> world';
            var result = inputSanitizer_1.InputSanitizer.sanitizeInput(input);
            (0, vitest_1.expect)(result.sanitized).not.toContain("<script>");
            (0, vitest_1.expect)(result.sanitized).not.toContain("alert");
            (0, vitest_1.expect)(result.wasModified).toBe(true);
            (0, vitest_1.expect)(result.warnings).toContain("Potentially unsafe content was removed from your input");
        });
        (0, vitest_1.it)("should remove javascript: URLs", function () {
            var input = 'Click here: javascript:alert("xss")';
            var result = inputSanitizer_1.InputSanitizer.sanitizeInput(input);
            (0, vitest_1.expect)(result.sanitized).not.toContain("javascript:");
            (0, vitest_1.expect)(result.wasModified).toBe(true);
            (0, vitest_1.expect)(result.warnings.length).toBeGreaterThan(0);
        });
        (0, vitest_1.it)("should remove event handlers", function () {
            var input = 'Text with onclick="malicious()" handler';
            var result = inputSanitizer_1.InputSanitizer.sanitizeInput(input);
            (0, vitest_1.expect)(result.sanitized).not.toContain("onclick=");
            (0, vitest_1.expect)(result.wasModified).toBe(true);
            (0, vitest_1.expect)(result.warnings.length).toBeGreaterThan(0);
        });
        (0, vitest_1.it)("should encode HTML entities", function () {
            var input = "Text with <>&\"' characters";
            var result = inputSanitizer_1.InputSanitizer.sanitizeInput(input);
            (0, vitest_1.expect)(result.sanitized).toContain("&lt;");
            (0, vitest_1.expect)(result.sanitized).toContain("&gt;");
            (0, vitest_1.expect)(result.sanitized).toContain("&amp;");
            (0, vitest_1.expect)(result.sanitized).toContain("&quot;");
            (0, vitest_1.expect)(result.sanitized).toContain("&#x27;");
        });
        (0, vitest_1.it)("should trim excessive whitespace", function () {
            var input = "  Text   with    lots   of   spaces  ";
            var result = inputSanitizer_1.InputSanitizer.sanitizeInput(input);
            (0, vitest_1.expect)(result.sanitized).toBe("Text with lots of spaces");
            (0, vitest_1.expect)(result.wasModified).toBe(true);
        });
        (0, vitest_1.it)("should handle safe input without modification", function () {
            var input = "This is a safe input string";
            var result = inputSanitizer_1.InputSanitizer.sanitizeInput(input);
            (0, vitest_1.expect)(result.sanitized).toBe(input);
            (0, vitest_1.expect)(result.wasModified).toBe(false);
            (0, vitest_1.expect)(result.warnings).toHaveLength(0);
        });
    });
    (0, vitest_1.describe)("sanitizePrompt", function () {
        (0, vitest_1.it)("should truncate prompts longer than 500 characters", function () {
            var input = "A".repeat(600);
            var result = inputSanitizer_1.InputSanitizer.sanitizePrompt(input);
            (0, vitest_1.expect)(result.sanitized).toHaveLength(500);
            (0, vitest_1.expect)(result.wasModified).toBe(true);
            (0, vitest_1.expect)(result.warnings).toContain("Prompt was truncated to 500 characters");
        });
        (0, vitest_1.it)("should warn about excessive special characters", function () {
            var input = "!@#$%^&*()_+{}|:\"<>?[]\\;',./" + "abc";
            var result = inputSanitizer_1.InputSanitizer.sanitizePrompt(input);
            (0, vitest_1.expect)(result.warnings).toContain("Your prompt contains many special characters which may affect generation quality");
        });
        (0, vitest_1.it)("should handle normal prompts correctly", function () {
            var input = "A simple blue circle with red border";
            var result = inputSanitizer_1.InputSanitizer.sanitizePrompt(input);
            (0, vitest_1.expect)(result.sanitized).toBe(input);
            (0, vitest_1.expect)(result.wasModified).toBe(false);
            (0, vitest_1.expect)(result.warnings).toHaveLength(0);
        });
    });
    (0, vitest_1.describe)("sanitizeNumber", function () {
        (0, vitest_1.it)("should handle valid numbers", function () {
            var result = inputSanitizer_1.InputSanitizer.sanitizeNumber(50, 10, 100, 25);
            (0, vitest_1.expect)(result.value).toBe(50);
            (0, vitest_1.expect)(result.wasModified).toBe(false);
            (0, vitest_1.expect)(result.warnings).toHaveLength(0);
        });
        (0, vitest_1.it)("should clamp numbers to minimum", function () {
            var result = inputSanitizer_1.InputSanitizer.sanitizeNumber(5, 10, 100, 25);
            (0, vitest_1.expect)(result.value).toBe(10);
            (0, vitest_1.expect)(result.wasModified).toBe(true);
            (0, vitest_1.expect)(result.warnings).toContain("Value was below minimum (10), adjusted to minimum");
        });
        (0, vitest_1.it)("should clamp numbers to maximum", function () {
            var result = inputSanitizer_1.InputSanitizer.sanitizeNumber(150, 10, 100, 25);
            (0, vitest_1.expect)(result.value).toBe(100);
            (0, vitest_1.expect)(result.wasModified).toBe(true);
            (0, vitest_1.expect)(result.warnings).toContain("Value was above maximum (100), adjusted to maximum");
        });
        (0, vitest_1.it)("should handle invalid numbers", function () {
            var result = inputSanitizer_1.InputSanitizer.sanitizeNumber("invalid", 10, 100, 25);
            (0, vitest_1.expect)(result.value).toBe(25);
            (0, vitest_1.expect)(result.wasModified).toBe(true);
            (0, vitest_1.expect)(result.warnings).toContain("Invalid number, using default value");
        });
        (0, vitest_1.it)("should handle string numbers", function () {
            var result = inputSanitizer_1.InputSanitizer.sanitizeNumber("75", 10, 100, 25);
            (0, vitest_1.expect)(result.value).toBe(75);
            (0, vitest_1.expect)(result.wasModified).toBe(false);
            (0, vitest_1.expect)(result.warnings).toHaveLength(0);
        });
        (0, vitest_1.it)("should round to reasonable precision", function () {
            var result = inputSanitizer_1.InputSanitizer.sanitizeNumber(50.123456, 10, 100, 25);
            (0, vitest_1.expect)(result.value).toBe(50.12);
            (0, vitest_1.expect)(result.wasModified).toBe(true);
        });
        (0, vitest_1.it)("should handle NaN and Infinity", function () {
            var result = inputSanitizer_1.InputSanitizer.sanitizeNumber(NaN, 10, 100, 25);
            (0, vitest_1.expect)(result.value).toBe(25);
            (0, vitest_1.expect)(result.wasModified).toBe(true);
            result = inputSanitizer_1.InputSanitizer.sanitizeNumber(Infinity, 10, 100, 25);
            (0, vitest_1.expect)(result.value).toBe(25);
            (0, vitest_1.expect)(result.wasModified).toBe(true);
        });
    });
    (0, vitest_1.describe)("sanitizeColor", function () {
        (0, vitest_1.it)("should handle valid hex colors", function () {
            var result = inputSanitizer_1.InputSanitizer.sanitizeColor("#ff0000");
            (0, vitest_1.expect)(result.sanitized).toBe("#ff0000");
            (0, vitest_1.expect)(result.wasModified).toBe(false);
            (0, vitest_1.expect)(result.warnings).toHaveLength(0);
        });
        (0, vitest_1.it)("should handle short hex colors", function () {
            var result = inputSanitizer_1.InputSanitizer.sanitizeColor("#f00");
            (0, vitest_1.expect)(result.sanitized).toBe("#f00");
            (0, vitest_1.expect)(result.wasModified).toBe(false);
            (0, vitest_1.expect)(result.warnings).toHaveLength(0);
        });
        (0, vitest_1.it)("should handle valid named colors", function () {
            var result = inputSanitizer_1.InputSanitizer.sanitizeColor("red");
            (0, vitest_1.expect)(result.sanitized).toBe("red");
            (0, vitest_1.expect)(result.wasModified).toBe(false);
            (0, vitest_1.expect)(result.warnings).toHaveLength(0);
        });
        (0, vitest_1.it)("should reject invalid hex colors", function () {
            var result = inputSanitizer_1.InputSanitizer.sanitizeColor("#gggggg");
            (0, vitest_1.expect)(result.sanitized).toBe("#000000");
            (0, vitest_1.expect)(result.wasModified).toBe(true);
            (0, vitest_1.expect)(result.warnings).toContain("Invalid hex color format, using black");
        });
        (0, vitest_1.it)("should reject unsupported named colors", function () {
            var result = inputSanitizer_1.InputSanitizer.sanitizeColor("chartreuse");
            (0, vitest_1.expect)(result.sanitized).toBe("#000000");
            (0, vitest_1.expect)(result.wasModified).toBe(true);
            (0, vitest_1.expect)(result.warnings).toContain("Unsupported color name, using black");
        });
        (0, vitest_1.it)("should handle invalid input types", function () {
            var result = inputSanitizer_1.InputSanitizer.sanitizeColor(null);
            (0, vitest_1.expect)(result.sanitized).toBe("#000000");
            (0, vitest_1.expect)(result.wasModified).toBe(true);
            (0, vitest_1.expect)(result.warnings).toContain("Invalid color format, using black");
        });
        (0, vitest_1.it)("should sanitize dangerous content in colors", function () {
            var result = inputSanitizer_1.InputSanitizer.sanitizeColor('<script>alert("xss")</script>');
            (0, vitest_1.expect)(result.sanitized).toBe("#000000");
            (0, vitest_1.expect)(result.wasModified).toBe(true);
            (0, vitest_1.expect)(result.warnings.length).toBeGreaterThan(0);
        });
    });
    (0, vitest_1.describe)("containsOnlySafeCharacters", function () {
        (0, vitest_1.it)("should return true for safe characters", function () {
            (0, vitest_1.expect)(inputSanitizer_1.InputSanitizer.containsOnlySafeCharacters("Hello World 123!")).toBe(true);
            (0, vitest_1.expect)(inputSanitizer_1.InputSanitizer.containsOnlySafeCharacters("Test@example.com")).toBe(true);
            (0, vitest_1.expect)(inputSanitizer_1.InputSanitizer.containsOnlySafeCharacters("Price: $19.99")).toBe(true);
        });
        (0, vitest_1.it)("should return false for unsafe characters", function () {
            (0, vitest_1.expect)(inputSanitizer_1.InputSanitizer.containsOnlySafeCharacters("Hello<script>")).toBe(false);
            (0, vitest_1.expect)(inputSanitizer_1.InputSanitizer.containsOnlySafeCharacters("Test\x00null")).toBe(false);
        });
    });
    (0, vitest_1.describe)("isSuspiciousInput", function () {
        (0, vitest_1.it)("should detect suspicious patterns", function () {
            (0, vitest_1.expect)(inputSanitizer_1.InputSanitizer.isSuspiciousInput('<script>alert("xss")</script>')).toBe(true);
            (0, vitest_1.expect)(inputSanitizer_1.InputSanitizer.isSuspiciousInput('javascript:alert("xss")')).toBe(true);
            (0, vitest_1.expect)(inputSanitizer_1.InputSanitizer.isSuspiciousInput('onclick="malicious()"')).toBe(true);
            (0, vitest_1.expect)(inputSanitizer_1.InputSanitizer.isSuspiciousInput("eval(maliciousCode)")).toBe(true);
        });
        (0, vitest_1.it)("should not flag safe input", function () {
            (0, vitest_1.expect)(inputSanitizer_1.InputSanitizer.isSuspiciousInput("A simple blue circle")).toBe(false);
            (0, vitest_1.expect)(inputSanitizer_1.InputSanitizer.isSuspiciousInput("Create a red square icon")).toBe(false);
            (0, vitest_1.expect)(inputSanitizer_1.InputSanitizer.isSuspiciousInput("")).toBe(false);
        });
        (0, vitest_1.it)("should handle null/undefined input", function () {
            (0, vitest_1.expect)(inputSanitizer_1.InputSanitizer.isSuspiciousInput(null)).toBe(false);
            (0, vitest_1.expect)(inputSanitizer_1.InputSanitizer.isSuspiciousInput(undefined)).toBe(false);
        });
    });
});
