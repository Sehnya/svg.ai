"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var SVGSanitizer_1 = require("../../server/services/SVGSanitizer");
(0, vitest_1.describe)("SVGSanitizer", function () {
    var sanitizer;
    (0, vitest_1.beforeEach)(function () {
        sanitizer = new SVGSanitizer_1.SVGSanitizer();
    });
    (0, vitest_1.describe)("sanitize", function () {
        (0, vitest_1.it)("should sanitize a valid SVG", function () {
            var validSVG = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\">\n        <circle cx=\"50\" cy=\"50\" r=\"40\" fill=\"blue\" />\n      </svg>";
            var result = sanitizer.sanitize(validSVG);
            (0, vitest_1.expect)(result.isValid).toBe(true);
            (0, vitest_1.expect)(result.errors).toHaveLength(0);
            (0, vitest_1.expect)(result.sanitizedSVG).toContain('xmlns="http://www.w3.org/2000/svg"');
            (0, vitest_1.expect)(result.sanitizedSVG).toContain('viewBox="0 0 100 100"');
        });
        (0, vitest_1.it)("should remove script tags", function () {
            var maliciousSVG = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\">\n        <script>alert('xss')</script>\n        <circle cx=\"50\" cy=\"50\" r=\"40\" fill=\"blue\" />\n      </svg>";
            var result = sanitizer.sanitize(maliciousSVG);
            (0, vitest_1.expect)(result.sanitizedSVG).not.toContain("<script>");
            (0, vitest_1.expect)(result.sanitizedSVG).not.toContain("alert");
        });
        (0, vitest_1.it)("should remove event handlers", function () {
            var maliciousSVG = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\">\n        <circle cx=\"50\" cy=\"50\" r=\"40\" fill=\"blue\" onclick=\"alert('xss')\" onload=\"badFunction()\" />\n      </svg>";
            var result = sanitizer.sanitize(maliciousSVG);
            (0, vitest_1.expect)(result.sanitizedSVG).not.toContain("onclick");
            (0, vitest_1.expect)(result.sanitizedSVG).not.toContain("onload");
            (0, vitest_1.expect)(result.sanitizedSVG).toContain("<circle");
        });
        (0, vitest_1.it)("should remove foreignObject tags", function () {
            var maliciousSVG = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\">\n        <foreignObject>\n          <div>HTML content</div>\n        </foreignObject>\n        <circle cx=\"50\" cy=\"50\" r=\"40\" fill=\"blue\" />\n      </svg>";
            var result = sanitizer.sanitize(maliciousSVG);
            (0, vitest_1.expect)(result.sanitizedSVG).not.toContain("<foreignObject>");
            (0, vitest_1.expect)(result.sanitizedSVG).not.toContain("<div>");
            (0, vitest_1.expect)(result.sanitizedSVG).toContain("<circle");
        });
        (0, vitest_1.it)("should handle empty SVG content", function () {
            var result = sanitizer.sanitize("");
            (0, vitest_1.expect)(result.isValid).toBe(false);
            (0, vitest_1.expect)(result.errors).toContain("SVG content is empty");
        });
        (0, vitest_1.it)("should validate xmlns attribute", function () {
            var svgWithoutXmlns = "<svg viewBox=\"0 0 100 100\">\n        <circle cx=\"50\" cy=\"50\" r=\"40\" fill=\"blue\" />\n      </svg>";
            var result = sanitizer.sanitize(svgWithoutXmlns);
            (0, vitest_1.expect)(result.errors).toContain("SVG missing required xmlns attribute");
        });
        (0, vitest_1.it)("should warn about missing viewBox", function () {
            var svgWithoutViewBox = "<svg xmlns=\"http://www.w3.org/2000/svg\">\n        <circle cx=\"50\" cy=\"50\" r=\"40\" fill=\"blue\" />\n      </svg>";
            var result = sanitizer.sanitize(svgWithoutViewBox);
            (0, vitest_1.expect)(result.warnings).toContain("SVG missing viewBox attribute - may cause scaling issues");
        });
        (0, vitest_1.it)("should limit decimal precision", function () {
            var svgWithPrecision = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\">\n        <circle cx=\"50.123456\" cy=\"50.789012\" r=\"40.555555\" fill=\"blue\" />\n      </svg>";
            var result = sanitizer.sanitize(svgWithPrecision);
            (0, vitest_1.expect)(result.sanitizedSVG).toContain("50.12");
            (0, vitest_1.expect)(result.sanitizedSVG).toContain("50.79");
            (0, vitest_1.expect)(result.sanitizedSVG).toContain("40.56");
            (0, vitest_1.expect)(result.warnings.length).toBeGreaterThan(0);
        });
        (0, vitest_1.it)("should validate stroke-width requirements", function () {
            var svgWithInvalidStroke = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\">\n        <circle cx=\"50\" cy=\"50\" r=\"40\" stroke=\"red\" stroke-width=\"0.5\" fill=\"none\" />\n      </svg>";
            var result = sanitizer.sanitize(svgWithInvalidStroke);
            (0, vitest_1.expect)(result.warnings).toContain("Element with stroke should have stroke-width >= 1");
        });
        (0, vitest_1.it)("should preserve valid SVG elements", function () {
            var validSVG = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 200 200\">\n        <g id=\"group1\">\n          <rect x=\"10\" y=\"10\" width=\"50\" height=\"50\" fill=\"red\" />\n          <circle cx=\"100\" cy=\"100\" r=\"30\" fill=\"blue\" />\n          <path d=\"M150,50 L180,80 L150,110 Z\" fill=\"green\" />\n          <line x1=\"0\" y1=\"0\" x2=\"200\" y2=\"200\" stroke=\"black\" stroke-width=\"2\" />\n          <polyline points=\"20,20 40,25 60,40 80,120\" stroke=\"purple\" stroke-width=\"2\" fill=\"none\" />\n          <polygon points=\"120,20 140,25 160,40 180,120\" fill=\"orange\" />\n          <ellipse cx=\"100\" cy=\"150\" rx=\"30\" ry=\"20\" fill=\"pink\" />\n        </g>\n      </svg>";
            var result = sanitizer.sanitize(validSVG);
            (0, vitest_1.expect)(result.isValid).toBe(true);
            (0, vitest_1.expect)(result.sanitizedSVG).toContain("<g");
            (0, vitest_1.expect)(result.sanitizedSVG).toContain("<rect");
            (0, vitest_1.expect)(result.sanitizedSVG).toContain("<circle");
            (0, vitest_1.expect)(result.sanitizedSVG).toContain("<path");
            (0, vitest_1.expect)(result.sanitizedSVG).toContain("<line");
            (0, vitest_1.expect)(result.sanitizedSVG).toContain("<polyline");
            (0, vitest_1.expect)(result.sanitizedSVG).toContain("<polygon");
            (0, vitest_1.expect)(result.sanitizedSVG).toContain("<ellipse");
        });
    });
});
