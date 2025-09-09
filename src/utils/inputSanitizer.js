"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InputSanitizer = void 0;
var InputSanitizer = /** @class */ (function () {
    function InputSanitizer() {
    }
    // Sanitize general input
    InputSanitizer.sanitizeInput = function (input) {
        if (input === null || input === undefined) {
            return {
                sanitized: "",
                wasModified: false,
                warnings: [],
            };
        }
        var original = String(input);
        var sanitized = original;
        var warnings = [];
        // Remove potentially dangerous patterns
        var dangerousPatterns = [
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
        for (var _i = 0, dangerousPatterns_1 = dangerousPatterns; _i < dangerousPatterns_1.length; _i++) {
            var _a = dangerousPatterns_1[_i], pattern = _a.pattern, replacement = _a.replacement, warning = _a.warning;
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
        var trimmed = sanitized.replace(/\s+/g, " ").trim();
        if (trimmed !== sanitized) {
            sanitized = trimmed;
        }
        return {
            sanitized: sanitized,
            wasModified: sanitized !== original,
            warnings: warnings,
        };
    };
    // Sanitize text prompts
    InputSanitizer.sanitizePrompt = function (input) {
        var original = input;
        var sanitized = input;
        var warnings = [];
        // Remove potentially dangerous patterns
        var dangerousPatterns = [
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
        for (var _i = 0, dangerousPatterns_2 = dangerousPatterns; _i < dangerousPatterns_2.length; _i++) {
            var _a = dangerousPatterns_2[_i], pattern = _a.pattern, replacement = _a.replacement, warning = _a.warning;
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
        var specialCharCount = (sanitized.match(/[!@#$%^&*()_+{}|:"<>?[\]\\;',.\/]/g) || []).length;
        var totalLength = sanitized.length;
        if (totalLength > 0 && specialCharCount / totalLength > 0.3) {
            warnings.push("Your prompt contains many special characters which may affect generation quality");
        }
        return {
            sanitized: sanitized,
            wasModified: sanitized !== original,
            warnings: warnings,
        };
    };
    // Sanitize numeric inputs
    InputSanitizer.sanitizeNumber = function (input, min, max, defaultValue) {
        var original = input;
        var value = typeof input === "string" ? parseFloat(input) : Number(input);
        var warnings = [];
        var wasModified = false;
        // Handle NaN or invalid numbers
        if (isNaN(value) || !isFinite(value)) {
            value = defaultValue;
            warnings.push("Invalid number, using default value");
            wasModified = true;
        }
        else {
            // Clamp to range
            if (value < min) {
                value = min;
                warnings.push("Value was below minimum (".concat(min, "), adjusted to minimum"));
                wasModified = true;
            }
            else if (value > max) {
                value = max;
                warnings.push("Value was above maximum (".concat(max, "), adjusted to maximum"));
                wasModified = true;
            }
            // Round to reasonable precision (2 decimal places)
            var rounded = Math.round(value * 100) / 100;
            if (rounded !== value) {
                value = rounded;
                wasModified = true;
            }
        }
        // Only consider it modified if the final numeric value differs from the original numeric value
        // For strings, compare the parsed value to the original parsed value
        var originalNumeric = typeof original === "string" ? parseFloat(original) : Number(original);
        if (!isNaN(originalNumeric) && !wasModified) {
            wasModified = value !== originalNumeric;
        }
        return {
            value: value,
            wasModified: wasModified,
            warnings: warnings,
        };
    };
    // Sanitize color inputs
    InputSanitizer.sanitizeColor = function (input) {
        if (input === null || input === undefined || typeof input !== "string") {
            return {
                sanitized: "#000000",
                wasModified: true,
                warnings: ["Invalid color format, using black"],
            };
        }
        var original = input.trim();
        // Check for dangerous content first
        if (this.isSuspiciousInput(original)) {
            return {
                sanitized: "#000000",
                wasModified: true,
                warnings: ["Potentially unsafe content was removed from your input"],
            };
        }
        // Valid hex color patterns
        var hexPattern = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
        // Valid named colors (basic set)
        var validNamedColors = [
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
    };
    // Check if string contains only safe characters
    InputSanitizer.containsOnlySafeCharacters = function (input) {
        if (!input)
            return true;
        // Allow alphanumeric, spaces, and common punctuation
        var safePattern = /^[a-zA-Z0-9\s\-_.,!?@#$%&*()+=:;"'\/\\[\]{}|`~]*$/;
        // Check for null bytes and other control characters
        var hasControlChars = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(input);
        return safePattern.test(input) && !hasControlChars;
    };
    // Check for suspicious input patterns
    InputSanitizer.isSuspiciousInput = function (input) {
        if (input === null || input === undefined) {
            return false;
        }
        var inputStr = String(input);
        var suspiciousPatterns = [
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
        return suspiciousPatterns.some(function (pattern) { return pattern.test(inputStr); });
    };
    // Sanitize file names
    InputSanitizer.sanitizeFilename = function (input) {
        return input
            .replace(/[^a-zA-Z0-9._-]/g, "_") // Replace invalid characters
            .replace(/_{2,}/g, "_") // Replace multiple underscores with single
            .replace(/^_+|_+$/g, "") // Remove leading/trailing underscores
            .substring(0, 255); // Limit length
    };
    // Sanitize URLs
    InputSanitizer.sanitizeUrl = function (input) {
        try {
            var url = new URL(input);
            // Only allow http and https protocols
            if (!["http:", "https:"].includes(url.protocol)) {
                return null;
            }
            return url.toString();
        }
        catch (_a) {
            return null;
        }
    };
    return InputSanitizer;
}());
exports.InputSanitizer = InputSanitizer;
