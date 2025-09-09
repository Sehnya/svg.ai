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
      warnings.push("Input truncated to 500 characters");
    }

    return {
      sanitized,
      wasModified: sanitized !== original,
      warnings,
    };
  }

  // Sanitize numeric inputs
  static sanitizeNumber(
    input: number,
    min: number,
    max: number,
    defaultValue: number
  ): NumberSanitizationResult {
    const original = input;
    let value = input;
    const warnings: string[] = [];

    // Handle NaN or invalid numbers
    if (isNaN(value) || !isFinite(value)) {
      value = defaultValue;
      warnings.push(
        `Invalid number replaced with default value ${defaultValue}`
      );
    }

    // Clamp to range
    if (value < min) {
      value = min;
      warnings.push(`Value increased to minimum ${min}`);
    } else if (value > max) {
      value = max;
      warnings.push(`Value decreased to maximum ${max}`);
    }

    // Round to integer for pixel values
    const rounded = Math.round(value);
    if (rounded !== value) {
      value = rounded;
      warnings.push("Value rounded to nearest integer");
    }

    return {
      value,
      wasModified: value !== original,
      warnings,
    };
  }

  // Check for suspicious input patterns
  static isSuspiciousInput(input: string): boolean {
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

    return suspiciousPatterns.some((pattern) => pattern.test(input));
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
