import { describe, it, expect } from "vitest";
import { InputSanitizer } from "../../src/utils/inputSanitizer";

describe("InputSanitizer", () => {
  describe("sanitizeInput", () => {
    it("should return empty string for null/undefined input", () => {
      expect(InputSanitizer.sanitizeInput(null as any)).toEqual({
        sanitized: "",
        wasModified: false,
        warnings: [],
      });

      expect(InputSanitizer.sanitizeInput(undefined as any)).toEqual({
        sanitized: "",
        wasModified: false,
        warnings: [],
      });
    });

    it("should remove script tags", () => {
      const input = 'Hello <script>alert("xss")</script> world';
      const result = InputSanitizer.sanitizeInput(input);

      expect(result.sanitized).not.toContain("<script>");
      expect(result.sanitized).not.toContain("alert");
      expect(result.wasModified).toBe(true);
      expect(result.warnings).toContain(
        "Potentially unsafe content was removed from your input"
      );
    });

    it("should remove javascript: URLs", () => {
      const input = 'Click here: javascript:alert("xss")';
      const result = InputSanitizer.sanitizeInput(input);

      expect(result.sanitized).not.toContain("javascript:");
      expect(result.wasModified).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it("should remove event handlers", () => {
      const input = 'Text with onclick="malicious()" handler';
      const result = InputSanitizer.sanitizeInput(input);

      expect(result.sanitized).not.toContain("onclick=");
      expect(result.wasModified).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it("should encode HTML entities", () => {
      const input = "Text with <>&\"' characters";
      const result = InputSanitizer.sanitizeInput(input);

      expect(result.sanitized).toContain("&lt;");
      expect(result.sanitized).toContain("&gt;");
      expect(result.sanitized).toContain("&amp;");
      expect(result.sanitized).toContain("&quot;");
      expect(result.sanitized).toContain("&#x27;");
    });

    it("should trim excessive whitespace", () => {
      const input = "  Text   with    lots   of   spaces  ";
      const result = InputSanitizer.sanitizeInput(input);

      expect(result.sanitized).toBe("Text with lots of spaces");
      expect(result.wasModified).toBe(true);
    });

    it("should handle safe input without modification", () => {
      const input = "This is a safe input string";
      const result = InputSanitizer.sanitizeInput(input);

      expect(result.sanitized).toBe(input);
      expect(result.wasModified).toBe(false);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe("sanitizePrompt", () => {
    it("should truncate prompts longer than 500 characters", () => {
      const input = "A".repeat(600);
      const result = InputSanitizer.sanitizePrompt(input);

      expect(result.sanitized).toHaveLength(500);
      expect(result.wasModified).toBe(true);
      expect(result.warnings).toContain(
        "Prompt was truncated to 500 characters"
      );
    });

    it("should warn about excessive special characters", () => {
      const input = "!@#$%^&*()_+{}|:\"<>?[]\\;',./" + "abc";
      const result = InputSanitizer.sanitizePrompt(input);

      expect(result.warnings).toContain(
        "Your prompt contains many special characters which may affect generation quality"
      );
    });

    it("should handle normal prompts correctly", () => {
      const input = "A simple blue circle with red border";
      const result = InputSanitizer.sanitizePrompt(input);

      expect(result.sanitized).toBe(input);
      expect(result.wasModified).toBe(false);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe("sanitizeNumber", () => {
    it("should handle valid numbers", () => {
      const result = InputSanitizer.sanitizeNumber(50, 10, 100, 25);

      expect(result.value).toBe(50);
      expect(result.wasModified).toBe(false);
      expect(result.warnings).toHaveLength(0);
    });

    it("should clamp numbers to minimum", () => {
      const result = InputSanitizer.sanitizeNumber(5, 10, 100, 25);

      expect(result.value).toBe(10);
      expect(result.wasModified).toBe(true);
      expect(result.warnings).toContain(
        "Value was below minimum (10), adjusted to minimum"
      );
    });

    it("should clamp numbers to maximum", () => {
      const result = InputSanitizer.sanitizeNumber(150, 10, 100, 25);

      expect(result.value).toBe(100);
      expect(result.wasModified).toBe(true);
      expect(result.warnings).toContain(
        "Value was above maximum (100), adjusted to maximum"
      );
    });

    it("should handle invalid numbers", () => {
      const result = InputSanitizer.sanitizeNumber("invalid", 10, 100, 25);

      expect(result.value).toBe(25);
      expect(result.wasModified).toBe(true);
      expect(result.warnings).toContain("Invalid number, using default value");
    });

    it("should handle string numbers", () => {
      const result = InputSanitizer.sanitizeNumber("75", 10, 100, 25);

      expect(result.value).toBe(75);
      expect(result.wasModified).toBe(false);
      expect(result.warnings).toHaveLength(0);
    });

    it("should round to reasonable precision", () => {
      const result = InputSanitizer.sanitizeNumber(50.123456, 10, 100, 25);

      expect(result.value).toBe(50.12);
      expect(result.wasModified).toBe(true);
    });

    it("should handle NaN and Infinity", () => {
      let result = InputSanitizer.sanitizeNumber(NaN, 10, 100, 25);
      expect(result.value).toBe(25);
      expect(result.wasModified).toBe(true);

      result = InputSanitizer.sanitizeNumber(Infinity, 10, 100, 25);
      expect(result.value).toBe(25);
      expect(result.wasModified).toBe(true);
    });
  });

  describe("sanitizeColor", () => {
    it("should handle valid hex colors", () => {
      const result = InputSanitizer.sanitizeColor("#ff0000");

      expect(result.sanitized).toBe("#ff0000");
      expect(result.wasModified).toBe(false);
      expect(result.warnings).toHaveLength(0);
    });

    it("should handle short hex colors", () => {
      const result = InputSanitizer.sanitizeColor("#f00");

      expect(result.sanitized).toBe("#f00");
      expect(result.wasModified).toBe(false);
      expect(result.warnings).toHaveLength(0);
    });

    it("should handle valid named colors", () => {
      const result = InputSanitizer.sanitizeColor("red");

      expect(result.sanitized).toBe("red");
      expect(result.wasModified).toBe(false);
      expect(result.warnings).toHaveLength(0);
    });

    it("should reject invalid hex colors", () => {
      const result = InputSanitizer.sanitizeColor("#gggggg");

      expect(result.sanitized).toBe("#000000");
      expect(result.wasModified).toBe(true);
      expect(result.warnings).toContain(
        "Invalid hex color format, using black"
      );
    });

    it("should reject unsupported named colors", () => {
      const result = InputSanitizer.sanitizeColor("chartreuse");

      expect(result.sanitized).toBe("#000000");
      expect(result.wasModified).toBe(true);
      expect(result.warnings).toContain("Unsupported color name, using black");
    });

    it("should handle invalid input types", () => {
      const result = InputSanitizer.sanitizeColor(null as any);

      expect(result.sanitized).toBe("#000000");
      expect(result.wasModified).toBe(true);
      expect(result.warnings).toContain("Invalid color format, using black");
    });

    it("should sanitize dangerous content in colors", () => {
      const result = InputSanitizer.sanitizeColor(
        '<script>alert("xss")</script>'
      );

      expect(result.sanitized).toBe("#000000");
      expect(result.wasModified).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe("containsOnlySafeCharacters", () => {
    it("should return true for safe characters", () => {
      expect(
        InputSanitizer.containsOnlySafeCharacters("Hello World 123!")
      ).toBe(true);
      expect(
        InputSanitizer.containsOnlySafeCharacters("Test@example.com")
      ).toBe(true);
      expect(InputSanitizer.containsOnlySafeCharacters("Price: $19.99")).toBe(
        true
      );
    });

    it("should return false for unsafe characters", () => {
      expect(InputSanitizer.containsOnlySafeCharacters("Hello<script>")).toBe(
        false
      );
      expect(InputSanitizer.containsOnlySafeCharacters("Test\x00null")).toBe(
        false
      );
    });
  });

  describe("isSuspiciousInput", () => {
    it("should detect suspicious patterns", () => {
      expect(
        InputSanitizer.isSuspiciousInput('<script>alert("xss")</script>')
      ).toBe(true);
      expect(InputSanitizer.isSuspiciousInput('javascript:alert("xss")')).toBe(
        true
      );
      expect(InputSanitizer.isSuspiciousInput('onclick="malicious()"')).toBe(
        true
      );
      expect(InputSanitizer.isSuspiciousInput("eval(maliciousCode)")).toBe(
        true
      );
    });

    it("should not flag safe input", () => {
      expect(InputSanitizer.isSuspiciousInput("A simple blue circle")).toBe(
        false
      );
      expect(InputSanitizer.isSuspiciousInput("Create a red square icon")).toBe(
        false
      );
      expect(InputSanitizer.isSuspiciousInput("")).toBe(false);
    });

    it("should handle null/undefined input", () => {
      expect(InputSanitizer.isSuspiciousInput(null as any)).toBe(false);
      expect(InputSanitizer.isSuspiciousInput(undefined as any)).toBe(false);
    });
  });
});
