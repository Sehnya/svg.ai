export interface SanitizationResult {
  sanitized: string;
  wasModified: boolean;
  warnings: string[];
}

export interface NumberSanitizationResult {
  value: number;
  wasModified: boolean;
  warnings: string[];
}

export class InputSanitizer {
  // Sanitize general input
  static sanitizeInput(input: any): SanitizationResult {
    if (input === null || input === undefined) {
      return {
        sanitized: "",
        wasModified: false,
        warnings: [],
      };
    }

    const original = String(input);
    let sanitized = original;
    const warnings: string[] = [];

    // Remove potentially dangerous patterns
    const dangerousPatterns = [
      {
        pattern: /<script[^>]*>.*?<\/script>/gi,
        replacement: "",
        warning: "Potentially unsafe content was removed from your input",
      },
      {
        pattern: /javascript:/gi,
        replacement: "",
        warning: "Potentially unsafe content was removed from your input",
      },
      {
        pattern: /vbscript:/gi,
        replacement: "",
        warning: "Potentially unsafe content was removed from your input",
      },
      {
        pattern: /on\w+\s*=/gi,
        replacement: "",
        warning: "Potentially unsafe content was removed from your input",
      },
      {
        pattern: /<iframe[^>]*>.*?<\/iframe>/gi,
        replacement: "",
        warning: "Potentially unsafe content was removed from your input",
      },
      {
        pattern: /<object[^>]*>.*?<\/object>/gi,
        replacement: "",
        warning: "Potentially unsafe content was removed from your input",
      },
      {
        pattern: /<embed[^>]*>/gi,
        replacement: "",
        warning: "Potentially unsafe content was removed from your input",
      },
    ];

    for (const { pattern, replacement, warning } of dangerousPatterns) {
      if (pattern.test(sanitized)) {
        sanitized = sanitized.replace(pattern, replacement);
        if (!warnings.includes(warning)) {
          warnings.push(warning);
        }
      }
    }

    // Encode HTML entities
    sanitized = sanitized
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;");

    // Trim excessive whitespace
    const trimmed = sanitized.replace(/\s+/g, " ").trim();
    if (trimmed !== sanitized) {
      sanitized = trimmed;
    }

    return {
      sanitized,
      wasModified: sanitized !== original,
      warnings,
    };
  }

  // Sanitize text prompts
  static sanitizePrompt(input: string): SanitizationResult {
    const original = input;
    let sanitized = input;
    const warnings: string[] = [];

    // Remove potentially dangerous patterns
    const dangerousPatterns = [
      {
        pattern: /<script[^>]*>.*?<\/script>/gi,
        replacement: "",
        warning: "Script tags removed",
      },
      {
        pattern: /javascript:/gi,
        replacement: "",
        warning: "JavaScript URLs removed",
      },
      {
        pattern: /vbscript:/gi,
        replacement: "",
        warning: "VBScript URLs removed",
      },
      {
        pattern: /on\w+\s*=/gi,
        replacement: "",
        warning: "Event handlers removed",
      },
      {
        pattern: /<iframe[^>]*>.*?<\/iframe>/gi,
        replacement: "",
        warning: "Iframe tags removed",
      },
      {
        pattern: /<object[^>]*>.*?<\/object>/gi,
        replacement: "",
        warning: "Object tags removed",
      },
      {
        pattern: /<embed[^>]*>/gi,
        replacement: "",
        warning: "Embed tags removed",
      },
    ];

    for (const { pattern, replacement, warning } of dangerousPatterns) {
      if (pattern.test(sanitized)) {
        sanitized = sanitized.replace(pattern, replacement);
        warnings.push(warning);
      }
    }

    // Trim whitespace
    sanitized = sanitized.trim();

    // Limit length
    if (sanitized.length > 500) {
      sanitized = sanitized.substring(0, 500);
      warnings.push("Prompt was truncated to 500 characters");
    }

    // Check for excessive special characters
    const specialCharCount = (
      sanitized.match(/[!@#$%^&*()_+{}|:"<>?[\]\\;',.\/]/g) || []
    ).length;
    const totalLength = sanitized.length;
    if (totalLength > 0 && specialCharCount / totalLength > 0.3) {
      warnings.push(
        "Your prompt contains many special characters which may affect generation quality"
      );
    }

    return {
      sanitized,
      wasModified: sanitized !== original,
      warnings,
    };
  }

  // Sanitize numeric inputs
  static sanitizeNumber(
    input: any,
    min: number,
    max: number,
    defaultValue: number
  ): NumberSanitizationResult {
    const original = input;
    let value = typeof input === "string" ? parseFloat(input) : Number(input);
    const warnings: string[] = [];
    let wasModified = false;

    // Handle NaN or invalid numbers
    if (isNaN(value) || !isFinite(value)) {
      value = defaultValue;
      warnings.push("Invalid number, using default value");
      wasModified = true;
    } else {
      // Clamp to range
      if (value < min) {
        value = min;
        warnings.push(`Value was below minimum (${min}), adjusted to minimum`);
        wasModified = true;
      } else if (value > max) {
        value = max;
        warnings.push(`Value was above maximum (${max}), adjusted to maximum`);
        wasModified = true;
      }

      // Round to reasonable precision (2 decimal places)
      const rounded = Math.round(value * 100) / 100;
      if (rounded !== value) {
        value = rounded;
        wasModified = true;
      }
    }

    // Only consider it modified if the final numeric value differs from the original numeric value
    // For strings, compare the parsed value to the original parsed value
    const originalNumeric =
      typeof original === "string" ? parseFloat(original) : Number(original);
    if (!isNaN(originalNumeric) && !wasModified) {
      wasModified = value !== originalNumeric;
    }

    return {
      value,
      wasModified,
      warnings,
    };
  }

  // Sanitize color inputs
  static sanitizeColor(input: any): SanitizationResult {
    if (input === null || input === undefined || typeof input !== "string") {
      return {
        sanitized: "#000000",
        wasModified: true,
        warnings: ["Invalid color format, using black"],
      };
    }

    const original = input.trim();

    // Check for dangerous content first
    if (this.isSuspiciousInput(original)) {
      return {
        sanitized: "#000000",
        wasModified: true,
        warnings: ["Potentially unsafe content was removed from your input"],
      };
    }

    // Valid hex color patterns
    const hexPattern = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

    // Valid named colors (basic set)
    const validNamedColors = [
      "red",
      "green",
      "blue",
      "yellow",
      "orange",
      "purple",
      "pink",
      "brown",
      "black",
      "white",
      "gray",
      "grey",
      "cyan",
      "magenta",
      "lime",
      "navy",
      "maroon",
      "olive",
      "teal",
      "silver",
      "aqua",
      "fuchsia",
    ];

    if (hexPattern.test(original)) {
      return {
        sanitized: original,
        wasModified: false,
        warnings: [],
      };
    }

    if (validNamedColors.includes(original.toLowerCase())) {
      return {
        sanitized: original,
        wasModified: false,
        warnings: [],
      };
    }

    // Invalid hex color
    if (original.startsWith("#")) {
      return {
        sanitized: "#000000",
        wasModified: true,
        warnings: ["Invalid hex color format, using black"],
      };
    }

    // Invalid named color
    return {
      sanitized: "#000000",
      wasModified: true,
      warnings: ["Unsupported color name, using black"],
    };
  }

  // Check if string contains only safe characters
  static containsOnlySafeCharacters(input: string): boolean {
    if (!input) return true;

    // Allow alphanumeric, spaces, and common punctuation
    const safePattern = /^[a-zA-Z0-9\s\-_.,!?@#$%&*()+=:;"'\/\\[\]{}|`~]*$/;

    // Check for null bytes and other control characters
    const hasControlChars = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(input);

    return safePattern.test(input) && !hasControlChars;
  }

  // Check for suspicious input patterns
  static isSuspiciousInput(input: any): boolean {
    if (input === null || input === undefined) {
      return false;
    }

    const inputStr = String(input);
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /vbscript:/i,
      /on\w+\s*=/i,
      /eval\s*\(/i,
      /document\./i,
      /window\./i,
      /alert\s*\(/i,
      /confirm\s*\(/i,
      /prompt\s*\(/i,
    ];

    return suspiciousPatterns.some((pattern) => pattern.test(inputStr));
  }

  // Sanitize file names
  static sanitizeFilename(input: string): string {
    return input
      .replace(/[^a-zA-Z0-9._-]/g, "_") // Replace invalid characters
      .replace(/_{2,}/g, "_") // Replace multiple underscores with single
      .replace(/^_+|_+$/g, "") // Remove leading/trailing underscores
      .substring(0, 255); // Limit length
  }

  // Sanitize URLs
  static sanitizeUrl(input: string): string | null {
    try {
      const url = new URL(input);

      // Only allow http and https protocols
      if (!["http:", "https:"].includes(url.protocol)) {
        return null;
      }

      return url.toString();
    } catch {
      return null;
    }
  }
}
