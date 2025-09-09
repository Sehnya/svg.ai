"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var SVGValidator_1 = require("../../server/services/SVGValidator");
(0, vitest_1.describe)("SVGValidator", function () {
    var validator;
    (0, vitest_1.beforeEach)(function () {
        validator = new SVGValidator_1.SVGValidator();
    });
    (0, vitest_1.describe)("validateSVGStructure", function () {
        (0, vitest_1.it)("should validate a correct SVG structure", function () {
            var validSVG = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\">\n        <circle cx=\"50\" cy=\"50\" r=\"40\" fill=\"blue\" />\n      </svg>";
            var result = validator.validateSVGStructure(validSVG);
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.errors).toHaveLength(0);
        });
        (0, vitest_1.it)("should fail for empty content", function () {
            var result = validator.validateSVGStructure("");
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.errors).toContain("SVG content is empty");
        });
        (0, vitest_1.it)("should fail for missing xmlns", function () {
            var invalidSVG = "<svg viewBox=\"0 0 100 100\">\n        <circle cx=\"50\" cy=\"50\" r=\"40\" fill=\"blue\" />\n      </svg>";
            var result = validator.validateSVGStructure(invalidSVG);
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.errors).toContain("SVG missing xmlns attribute");
        });
        (0, vitest_1.it)("should fail for incorrect xmlns", function () {
            var invalidSVG = "<svg xmlns=\"http://www.w3.org/1999/xhtml\" viewBox=\"0 0 100 100\">\n        <circle cx=\"50\" cy=\"50\" r=\"40\" fill=\"blue\" />\n      </svg>";
            var result = validator.validateSVGStructure(invalidSVG);
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.errors).toContain("SVG has incorrect xmlns attribute");
        });
        (0, vitest_1.it)("should fail for missing viewBox", function () {
            var invalidSVG = "<svg xmlns=\"http://www.w3.org/2000/svg\">\n        <circle cx=\"50\" cy=\"50\" r=\"40\" fill=\"blue\" />\n      </svg>";
            var result = validator.validateSVGStructure(invalidSVG);
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.errors).toContain("SVG missing viewBox attribute");
        });
        (0, vitest_1.it)("should fail for invalid viewBox format", function () {
            var invalidSVG = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"invalid\">\n        <circle cx=\"50\" cy=\"50\" r=\"40\" fill=\"blue\" />\n      </svg>";
            var result = validator.validateSVGStructure(invalidSVG);
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.errors).toContain("SVG viewBox has invalid format");
        });
        (0, vitest_1.it)("should fail for forbidden elements", function () {
            var invalidSVG = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\">\n        <script>alert('xss')</script>\n        <circle cx=\"50\" cy=\"50\" r=\"40\" fill=\"blue\" />\n      </svg>";
            var result = validator.validateSVGStructure(invalidSVG);
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.errors).toContain("SVG contains forbidden elements: script");
        });
        (0, vitest_1.it)("should fail for forbidden attributes", function () {
            var invalidSVG = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\">\n        <circle cx=\"50\" cy=\"50\" r=\"40\" fill=\"blue\" onclick=\"alert('xss')\" />\n      </svg>";
            var result = validator.validateSVGStructure(invalidSVG);
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.errors).toContain("Element contains forbidden attribute: onclick");
        });
    });
    (0, vitest_1.describe)("validateSVGContract", function () {
        (0, vitest_1.it)("should validate allowed elements", function () {
            var validSVG = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 200 200\">\n        <g>\n          <rect x=\"10\" y=\"10\" width=\"50\" height=\"50\" fill=\"red\" />\n          <circle cx=\"100\" cy=\"100\" r=\"30\" fill=\"blue\" />\n          <path d=\"M150,50 L180,80 L150,110 Z\" fill=\"green\" />\n          <line x1=\"0\" y1=\"0\" x2=\"200\" y2=\"200\" stroke=\"black\" stroke-width=\"2\" />\n          <polyline points=\"20,20 40,25 60,40 80,120\" stroke=\"purple\" stroke-width=\"2\" fill=\"none\" />\n          <polygon points=\"120,20 140,25 160,40 180,120\" fill=\"orange\" />\n          <ellipse cx=\"100\" cy=\"150\" rx=\"30\" ry=\"20\" fill=\"pink\" />\n        </g>\n      </svg>";
            var result = validator.validateSVGContract(validSVG);
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.errors).toHaveLength(0);
        });
        (0, vitest_1.it)("should fail for disallowed elements", function () {
            var invalidSVG = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\">\n        <div>Invalid HTML element</div>\n        <circle cx=\"50\" cy=\"50\" r=\"40\" fill=\"blue\" />\n      </svg>";
            var result = validator.validateSVGContract(invalidSVG);
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.errors).toContain("Disallowed element found: div");
        });
        (0, vitest_1.it)("should fail for excessive decimal precision", function () {
            var invalidSVG = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\">\n        <circle cx=\"50.123456\" cy=\"50\" r=\"40\" fill=\"blue\" />\n      </svg>";
            var result = validator.validateSVGContract(invalidSVG);
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.errors).toContain("SVG contains numbers with excessive decimal precision");
        });
        (0, vitest_1.it)("should fail for invalid stroke-width", function () {
            var invalidSVG = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\">\n        <circle cx=\"50\" cy=\"50\" r=\"40\" stroke=\"red\" stroke-width=\"0.5\" fill=\"none\" />\n      </svg>";
            var result = validator.validateSVGContract(invalidSVG);
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.errors).toContain("Elements with stroke must have stroke-width >= 1");
        });
    });
    (0, vitest_1.describe)("validateDimensions", function () {
        (0, vitest_1.it)("should validate correct dimensions", function () {
            var result = validator.validateDimensions(100, 200);
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.errors).toHaveLength(0);
        });
        (0, vitest_1.it)("should fail for dimensions too small", function () {
            var result = validator.validateDimensions(10, 200);
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.errors).toContain("Width must be an integer between 16 and 2048");
        });
        (0, vitest_1.it)("should fail for dimensions too large", function () {
            var result = validator.validateDimensions(100, 3000);
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.errors).toContain("Height must be an integer between 16 and 2048");
        });
        (0, vitest_1.it)("should fail for non-integer dimensions", function () {
            var result = validator.validateDimensions(100.5, 200.7);
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.errors).toContain("Width must be an integer between 16 and 2048");
            (0, vitest_1.expect)(result.errors).toContain("Height must be an integer between 16 and 2048");
        });
    });
    (0, vitest_1.describe)("validateColors", function () {
        (0, vitest_1.it)("should validate correct hex colors", function () {
            var colors = ["#FF0000", "#00FF00", "#0000FF", "#123ABC"];
            var result = validator.validateColors(colors);
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.errors).toHaveLength(0);
        });
        (0, vitest_1.it)("should fail for invalid hex colors", function () {
            var colors = ["#FF0000", "red", "#GG0000", "#12345"];
            var result = validator.validateColors(colors);
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.errors).toContain("Invalid color format at index 1: red");
            (0, vitest_1.expect)(result.errors).toContain("Invalid color format at index 2: #GG0000");
            (0, vitest_1.expect)(result.errors).toContain("Invalid color format at index 3: #12345");
        });
    });
});
