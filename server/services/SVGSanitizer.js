"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SVGSanitizer = void 0;
var jsdom_1 = require("jsdom");
var isomorphic_dompurify_1 = require("isomorphic-dompurify");
var types_1 = require("../types");
var SVGSanitizer = /** @class */ (function () {
    function SVGSanitizer() {
        this.window = new jsdom_1.JSDOM("").window;
        this.purify = (0, isomorphic_dompurify_1.default)(this.window);
        this.configurePurify();
    }
    SVGSanitizer.prototype.configurePurify = function () {
        // Configure allowed tags and attributes for SVG
        this.purify.addHook("beforeSanitizeElements", function (node) {
            var _a;
            // Remove forbidden tags
            if (types_1.SVG_CONSTANTS.FORBIDDEN_TAGS.includes((_a = node.tagName) === null || _a === void 0 ? void 0 : _a.toLowerCase())) {
                node.remove();
                return node;
            }
            // Only allow specific SVG tags
            if (node.tagName &&
                !types_1.SVG_CONSTANTS.ALLOWED_TAGS.includes(node.tagName.toLowerCase())) {
                if (node.tagName.toLowerCase() !== "svg") {
                    node.remove();
                    return node;
                }
            }
            return node;
        });
        this.purify.addHook("beforeSanitizeAttributes", function (node) {
            // Remove event handlers and other forbidden attributes
            if (node.attributes) {
                var attributesToRemove = [];
                for (var i = 0; i < node.attributes.length; i++) {
                    var attr = node.attributes[i];
                    if (types_1.SVG_CONSTANTS.FORBIDDEN_ATTRIBUTES.test(attr.name)) {
                        attributesToRemove.push(attr.name);
                    }
                    // Remove href attributes that reference external resources
                    if (attr.name === "href" && attr.value.startsWith("http")) {
                        attributesToRemove.push(attr.name);
                    }
                }
                attributesToRemove.forEach(function (attrName) {
                    node.removeAttribute(attrName);
                });
            }
            return node;
        });
    };
    SVGSanitizer.prototype.sanitize = function (svgString) {
        var warnings = [];
        var errors = [];
        try {
            // Basic validation
            if (!svgString.trim()) {
                errors.push("SVG content is empty");
                return {
                    sanitizedSVG: "",
                    warnings: warnings,
                    errors: errors,
                    isValid: false,
                };
            }
            // Sanitize with DOMPurify
            var sanitized = this.purify.sanitize(svgString, {
                USE_PROFILES: { svg: true, svgFilters: true },
                ALLOWED_TAGS: types_1.SVG_CONSTANTS.ALLOWED_TAGS,
                FORBID_TAGS: types_1.SVG_CONSTANTS.FORBIDDEN_TAGS,
                FORBID_ATTR: ["onload", "onerror", "onclick"],
                RETURN_DOM: false,
            });
            if (!sanitized) {
                errors.push("SVG sanitization failed");
                return {
                    sanitizedSVG: "",
                    warnings: warnings,
                    errors: errors,
                    isValid: false,
                };
            }
            // Parse the sanitized SVG for additional validation
            var dom = new jsdom_1.JSDOM(sanitized);
            var svgElement = dom.window.document.querySelector("svg");
            if (!svgElement) {
                errors.push("No valid SVG element found");
                return {
                    sanitizedSVG: sanitized,
                    warnings: warnings,
                    errors: errors,
                    isValid: false,
                };
            }
            // Validate required attributes
            this.validateRequiredAttributes(svgElement, warnings, errors);
            // Validate and fix numeric precision
            var processedSVG = this.processNumericPrecision(sanitized, warnings);
            // Validate stroke-width requirements
            this.validateStrokeWidth(dom.window.document, warnings, errors);
            return {
                sanitizedSVG: processedSVG,
                warnings: warnings,
                errors: errors,
                isValid: errors.length === 0,
            };
        }
        catch (error) {
            errors.push("Sanitization error: ".concat(error instanceof Error ? error.message : "Unknown error"));
            return {
                sanitizedSVG: "",
                warnings: warnings,
                errors: errors,
                isValid: false,
            };
        }
    };
    SVGSanitizer.prototype.validateRequiredAttributes = function (svgElement, warnings, errors) {
        // Check for xmlns
        if (!svgElement.getAttribute("xmlns")) {
            errors.push("SVG missing required xmlns attribute");
        }
        else if (svgElement.getAttribute("xmlns") !== "http://www.w3.org/2000/svg") {
            errors.push("SVG has incorrect xmlns attribute");
        }
        // Check for viewBox
        if (!svgElement.getAttribute("viewBox")) {
            warnings.push("SVG missing viewBox attribute - may cause scaling issues");
        }
        // Validate viewBox format if present
        var viewBox = svgElement.getAttribute("viewBox");
        if (viewBox) {
            var viewBoxValues = viewBox.split(/\s+/).map(Number);
            if (viewBoxValues.length !== 4 || viewBoxValues.some(isNaN)) {
                errors.push("SVG viewBox attribute has invalid format");
            }
        }
    };
    SVGSanitizer.prototype.processNumericPrecision = function (svgString, warnings) {
        // Limit decimal precision to 2 places maximum
        var processed = svgString.replace(/(\d+\.\d{3,})/g, function (match) {
            var num = parseFloat(match);
            var rounded = Math.round(num * 100) / 100;
            if (Math.abs(num - rounded) > 0.001) {
                warnings.push("Rounded numeric value ".concat(match, " to ").concat(rounded, " for precision"));
            }
            return rounded.toString();
        });
        return processed;
    };
    SVGSanitizer.prototype.validateStrokeWidth = function (document, warnings, errors) {
        var elementsWithStroke = document.querySelectorAll("[stroke]");
        elementsWithStroke.forEach(function (element) {
            var stroke = element.getAttribute("stroke");
            var strokeWidth = element.getAttribute("stroke-width");
            if (stroke &&
                stroke !== "none" &&
                (!strokeWidth || parseFloat(strokeWidth) < 1)) {
                warnings.push("Element with stroke should have stroke-width >= 1");
            }
        });
    };
    // Utility method to validate numeric attributes
    SVGSanitizer.prototype.validateNumericAttributes = function (document, warnings, errors) {
        var numericAttributes = [
            "x",
            "y",
            "width",
            "height",
            "cx",
            "cy",
            "r",
            "rx",
            "ry",
            "stroke-width",
        ];
        document.querySelectorAll("*").forEach(function (element) {
            numericAttributes.forEach(function (attr) {
                var value = element.getAttribute(attr);
                if (value && isNaN(parseFloat(value))) {
                    errors.push("Invalid numeric value \"".concat(value, "\" for attribute \"").concat(attr, "\""));
                }
            });
        });
    };
    return SVGSanitizer;
}());
exports.SVGSanitizer = SVGSanitizer;
