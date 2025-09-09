"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SVGValidator = void 0;
var jsdom_1 = require("jsdom");
var types_1 = require("../types");
var SVGValidator = /** @class */ (function () {
    function SVGValidator() {
    }
    SVGValidator.prototype.validateSVGStructure = function (svgString) {
        var errors = [];
        try {
            if (!svgString.trim()) {
                errors.push("SVG content is empty");
                return { success: false, errors: errors };
            }
            var dom = new jsdom_1.JSDOM(svgString);
            var svgElement = dom.window.document.querySelector("svg");
            if (!svgElement) {
                errors.push("No SVG element found");
                return { success: false, errors: errors };
            }
            // Validate xmlns
            var xmlns = svgElement.getAttribute("xmlns");
            if (!xmlns) {
                errors.push("SVG missing xmlns attribute");
            }
            else if (xmlns !== "http://www.w3.org/2000/svg") {
                errors.push("SVG has incorrect xmlns attribute");
            }
            // Validate viewBox
            var viewBox = svgElement.getAttribute("viewBox");
            if (!viewBox) {
                errors.push("SVG missing viewBox attribute");
            }
            else {
                var viewBoxValues = viewBox.split(/\s+/).map(Number);
                if (viewBoxValues.length !== 4 || viewBoxValues.some(isNaN)) {
                    errors.push("SVG viewBox has invalid format");
                }
            }
            // Check for forbidden elements
            var forbiddenElements = dom.window.document.querySelectorAll(types_1.SVG_CONSTANTS.FORBIDDEN_TAGS.join(", "));
            if (forbiddenElements.length > 0) {
                errors.push("SVG contains forbidden elements: ".concat(Array.from(forbiddenElements)
                    .map(function (el) { return el.tagName; })
                    .join(", ")));
            }
            // Check for forbidden attributes (event handlers)
            var allElements = dom.window.document.querySelectorAll("*");
            allElements.forEach(function (element) {
                Array.from(element.attributes).forEach(function (attr) {
                    if (types_1.SVG_CONSTANTS.FORBIDDEN_ATTRIBUTES.test(attr.name)) {
                        errors.push("Element contains forbidden attribute: ".concat(attr.name));
                    }
                });
            });
            return {
                success: errors.length === 0,
                errors: errors,
            };
        }
        catch (error) {
            errors.push("SVG parsing error: ".concat(error instanceof Error ? error.message : "Unknown error"));
            return { success: false, errors: errors };
        }
    };
    SVGValidator.prototype.validateSVGContract = function (svgString) {
        var errors = [];
        try {
            // First check for disallowed elements in the raw string
            types_1.SVG_CONSTANTS.FORBIDDEN_TAGS.forEach(function (tag) {
                var regex = new RegExp("<".concat(tag, "[^>]*>"), "gi");
                if (regex.test(svgString)) {
                    errors.push("Disallowed element found: ".concat(tag));
                }
            });
            // Check for other disallowed HTML elements (use word boundaries to avoid false matches)
            var htmlTags = ["div", "span", "a", "img", "iframe", "object", "embed"];
            htmlTags.forEach(function (tag) {
                var regex = new RegExp("<".concat(tag, "\\b[^>]*>"), "gi");
                if (regex.test(svgString)) {
                    errors.push("Disallowed element found: ".concat(tag));
                }
            });
            // Special check for 'p' tag to avoid matching 'polygon' or 'polyline'
            var pTagRegex = /<p\b[^>]*>/gi;
            if (pTagRegex.test(svgString)) {
                errors.push("Disallowed element found: p");
            }
            var dom = new jsdom_1.JSDOM(svgString);
            var svgElement = dom.window.document.querySelector("svg");
            if (!svgElement) {
                errors.push("No SVG element found");
                return { success: false, errors: errors };
            }
            // Validate all elements are allowed (excluding JSDOM-added elements)
            var svgElements = svgElement.querySelectorAll("*");
            svgElements.forEach(function (element) {
                var tagName = element.tagName.toLowerCase();
                if (!types_1.SVG_CONSTANTS.ALLOWED_TAGS.includes(tagName)) {
                    errors.push("Disallowed element found: ".concat(tagName));
                }
            });
            // Validate numeric precision
            var numericPattern = /(\d+\.\d{3,})/g;
            if (numericPattern.test(svgString)) {
                errors.push("SVG contains numbers with excessive decimal precision");
            }
            // Validate stroke-width requirements
            var elementsWithStroke = dom.window.document.querySelectorAll("[stroke]");
            elementsWithStroke.forEach(function (element) {
                var stroke = element.getAttribute("stroke");
                var strokeWidth = element.getAttribute("stroke-width");
                if (stroke &&
                    stroke !== "none" &&
                    (!strokeWidth || parseFloat(strokeWidth) < 1)) {
                    errors.push("Elements with stroke must have stroke-width >= 1");
                }
            });
            return {
                success: errors.length === 0,
                errors: errors,
            };
        }
        catch (error) {
            errors.push("Validation error: ".concat(error instanceof Error ? error.message : "Unknown error"));
            return { success: false, errors: errors };
        }
    };
    SVGValidator.prototype.validateDimensions = function (width, height) {
        var errors = [];
        if (!Number.isInteger(width) || width < 16 || width > 2048) {
            errors.push("Width must be an integer between 16 and 2048");
        }
        if (!Number.isInteger(height) || height < 16 || height > 2048) {
            errors.push("Height must be an integer between 16 and 2048");
        }
        return {
            success: errors.length === 0,
            errors: errors,
        };
    };
    SVGValidator.prototype.validateColors = function (colors) {
        var errors = [];
        var hexColorPattern = /^#[0-9A-Fa-f]{6}$/;
        colors.forEach(function (color, index) {
            if (!hexColorPattern.test(color)) {
                errors.push("Invalid color format at index ".concat(index, ": ").concat(color));
            }
        });
        return {
            success: errors.length === 0,
            errors: errors,
        };
    };
    return SVGValidator;
}());
exports.SVGValidator = SVGValidator;
