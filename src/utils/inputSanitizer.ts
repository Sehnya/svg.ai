/**
 * Input sanitization utilities for the frontend
 */

export interface SanitizationResult {
  sanitized: string;
  wasModified: boolean;
  warnings: string[];
}

export class InputSanitizer {
  private static readonly DANGEROUS_PATTERNS = [
    // Script injection patterns
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /vbscript:/gi,

    // Event handlers
    /on\w+\s*=/gi,

    // Data URLs with scripts
    /data:text\/html/gi,
    /data:application\/javascript/gi,

    // Common XSS patterns
    /eval\s*\(/gi,
    /document\.cookie/gi,
    /window\.location/gi,
    /alert\s*\(/gi,

    // SQL injection patterns (basic)
    /union\s+select/gi,
    /drop\s+table/gi,
    /delete\s+from/gi,
  ];

  private static readonly HTML_ENTITIES: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
  };

  /**
   * Sanitize user input by removing dangerous patterns and encoding HTML entities
   */
  static sanitizeInput(input: string): SanitizationResult {
    if (!input || typeof input !== "string") {
      return {
        sanitized: "",
        wasModified: false,
        warnings: [],
      };
    }

    let sanitized = input;
    const warnings: string[] = [];
    let wasModified = false;

    // Check for dangerous patterns
    for (const pattern of this.DANGEROUS_PATTERNS) {
      if (pattern.test(sanitized)) {
        sanitized = sanitized.replace(pattern, "");
        wasModified = true;
        warnings.push("Potentially unsafe content was removed from your input");
        break; // Only show one warning to avoid spam
      }
    }

    // Encode HTML entities in the remaining content
    const originalLength = sanitized.length;
    sanitized = this.encodeHTMLEntities(sanitized);

    if (sanitized.length !== originalLength) {
      wasModified = true;
    }

    // Trim excessive whitespace
    const trimmed = sanitized.trim().replace(/\s+/g, " ");
    if (trimmed !== sanitized) {
      sanitized = trimmed;
      wasModified = true;
    }

    return {
      sanitized,
      wasModified,
      warnings,
    };
  }

  /**
   * Sanitize prompt input specifically for SVG generation
   */
  static sanitizePrompt(prompt: string): SanitizationResult {
    const result = this.sanitizeInput(prompt);

    // Additional prompt-specific validation
    if (result.sanitized.length > 500) {
      result.sanitized = result.sanitized.substring(0, 500);
      result.wasModified = true;
      result.warnings.push("Prompt was truncated to 500 characters");
    }

    // Check for excessive special characters
    const specialCharCount = (
      result.sanitized.match(/[^a-zA-Z0-9\s.,!?-]/g) || []
    ).length;
    const totalLength = result.sanitized.length;

    if (totalLength > 0 && specialCharCount / totalLength > 0.3) {
      result.warnings.push(
        "Your prompt contains many special characters which may affect generation quality"
      );
    }

    return result;
  }

  /**
   * Validate and sanitize numeric input
   */
  static sanitizeNumber(
    value: any,
    min: number,
    max: number,
    defaultValue: number
  ): { value: number; wasModified: boolean; warnings: string[] } {
    const warnings: string[] = [];
    let wasModified = false;
    let numValue: number;

    // Convert to number
    if (typeof value === "string") {
      numValue = parseFloat(value);
    } else if (typeof value === "number") {
      numValue = value;
    } else {
      numValue = defaultValue;
      wasModified = true;
      warnings.push("Invalid number format, using default value");
    }

    // Check if it's a valid number
    if (isNaN(numValue) || !isFinite(numValue)) {
      numValue = defaultValue;
      wasModified = true;
      warnings.push("Invalid number, using default value");
    }

    // Clamp to range
    if (numValue < min) {
      numValue = min;
      wasModified = true;
      warnings.push(`Value was below minimum (${min}), adjusted to minimum`);
    } else if (numValue > max) {
      numValue = max;
      wasModified = true;
      warnings.push(`Value was above maximum (${max}), adjusted to maximum`);
    }

    // Round to reasonable precision
    const rounded = Math.round(numValue * 100) / 100;
    if (rounded !== numValue) {
      numValue = rounded;
      wasModified = true;
    }

    return {
      value: numValue,
      wasModified,
      warnings,
    };
  }

  /**
   * Sanitize color values
   */
  static sanitizeColor(color: string): SanitizationResult {
    if (!color || typeof color !== "string") {
      return {
        sanitized: "#000000",
        wasModified: true,
        warnings: ["Invalid color format, using black"],
      };
    }

    let sanitized = color.trim().toLowerCase();
    const warnings: string[] = [];
    let wasModified = false;

    // Remove any dangerous content
    const inputResult = this.sanitizeInput(sanitized);
    sanitized = inputResult.sanitized;
    wasModified = inputResult.wasModified;
    warnings.push(...inputResult.warnings);

    // Validate hex color format
    if (sanitized.startsWith("#")) {
      const hexPattern = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
      if (!hexPattern.test(sanitized)) {
        sanitized = "#000000";
        wasModified = true;
        warnings.push("Invalid hex color format, using black");
      }
    } else {
      // For named colors, we'll be restrictive and only allow basic ones
      const allowedColors = [
        "red",
        "green",
        "blue",
        "yellow",
        "orange",
        "purple",
        "pink",
        "black",
        "white",
        "gray",
        "grey",
        "brown",
        "cyan",
        "magenta",
        "lime",
        "navy",
        "maroon",
        "olive",
        "teal",
        "silver",
        "gold",
      ];

      if (!allowedColors.includes(sanitized)) {
        sanitized = "#000000";
        wasModified = true;
        warnings.push("Unsupported color name, using black");
      }
    }

    return {
      sanitized,
      wasModified,
      warnings,
    };
  }

  /**
   * Encode HTML entities to prevent XSS
   */
  private static encodeHTMLEntities(str: string): string {
    return str.replace(/[&<>"'\/]/g, (match) => {
      return this.HTML_ENTITIES[match] || match;
    });
  }

  /**
   * Validate that a string contains only safe characters
   */
  static containsOnlySafeCharacters(input: string): boolean {
    // Allow alphanumeric, spaces, and common punctuation
    const safePattern = /^[a-zA-Z0-9\s.,!?;:()\-_+=\[\]{}'"@#$%^&*\/\\|`~]*$/;
    return safePattern.test(input);
  }

  /**
   * Check if input appears to be malicious
   */
  static isSuspiciousInput(input: string): boolean {
    if (!input || typeof input !== "string") {
      return false;
    }

    // Check for dangerous patterns
    return this.DANGEROUS_PATTERNS.some((pattern) => pattern.test(input));
  }
}
