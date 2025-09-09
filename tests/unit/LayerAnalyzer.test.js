"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var LayerAnalyzer_1 = require("../../server/services/LayerAnalyzer");
(0, vitest_1.describe)("LayerAnalyzer", function () {
    var analyzer = new LayerAnalyzer_1.LayerAnalyzer();
    (0, vitest_1.describe)("analyze", function () {
        (0, vitest_1.it)("should analyze simple circle SVG", function () {
            var svg = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\">\n        <circle cx=\"50\" cy=\"50\" r=\"25\" fill=\"#3B82F6\" id=\"main-circle\"/>\n      </svg>";
            var layers = analyzer.analyze(svg);
            (0, vitest_1.expect)(layers).toHaveLength(1);
            (0, vitest_1.expect)(layers[0]).toEqual({
                id: "main-circle",
                label: "Main Circle",
                type: "shape",
            });
        });
        (0, vitest_1.it)("should analyze rectangle with rounded corners", function () {
            var svg = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 200 100\">\n        <rect x=\"10\" y=\"10\" width=\"180\" height=\"80\" rx=\"10\" ry=\"10\" fill=\"#FF0000\" id=\"rounded-rect\"/>\n      </svg>";
            var layers = analyzer.analyze(svg);
            (0, vitest_1.expect)(layers).toHaveLength(1);
            (0, vitest_1.expect)(layers[0]).toEqual({
                id: "rounded-rect",
                label: "Rounded Rect",
                type: "shape",
            });
        });
        (0, vitest_1.it)("should analyze complex SVG with groups", function () {
            var svg = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 200 200\">\n        <g id=\"house-group\">\n          <rect x=\"50\" y=\"100\" width=\"100\" height=\"80\" fill=\"#8B4513\" id=\"house-base\"/>\n          <polygon points=\"100,50 50,100 150,100\" fill=\"#FF0000\" id=\"house-roof\"/>\n          <rect x=\"80\" y=\"130\" width=\"20\" height=\"30\" fill=\"#654321\" id=\"door\"/>\n        </g>\n      </svg>";
            var layers = analyzer.analyze(svg);
            (0, vitest_1.expect)(layers).toHaveLength(4);
            // Check group
            var group = layers.find(function (l) { return l.id === "house-group"; });
            (0, vitest_1.expect)(group).toEqual({
                id: "house-group",
                label: "Group (3 items)",
                type: "group",
            });
            // Check individual elements
            var base = layers.find(function (l) { return l.id === "house-base"; });
            (0, vitest_1.expect)(base === null || base === void 0 ? void 0 : base.type).toBe("shape");
            var roof = layers.find(function (l) { return l.id === "house-roof"; });
            (0, vitest_1.expect)(roof === null || roof === void 0 ? void 0 : roof.type).toBe("shape");
            var door = layers.find(function (l) { return l.id === "door"; });
            (0, vitest_1.expect)(door === null || door === void 0 ? void 0 : door.type).toBe("shape");
        });
        (0, vitest_1.it)("should generate IDs for elements without them", function () {
            var svg = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\">\n        <circle cx=\"50\" cy=\"50\" r=\"25\" fill=\"#3B82F6\"/>\n      </svg>";
            var layers = analyzer.analyze(svg);
            (0, vitest_1.expect)(layers).toHaveLength(1);
            (0, vitest_1.expect)(layers[0].id).toMatch(/^circle-/);
            (0, vitest_1.expect)(layers[0].type).toBe("shape");
        });
        (0, vitest_1.it)("should handle text elements", function () {
            var svg = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 200 100\">\n        <text x=\"100\" y=\"50\" text-anchor=\"middle\" fill=\"#000000\" id=\"title\">Hello World</text>\n      </svg>";
            var layers = analyzer.analyze(svg);
            (0, vitest_1.expect)(layers).toHaveLength(1);
            (0, vitest_1.expect)(layers[0]).toEqual({
                id: "title",
                label: "Title",
                type: "text",
            });
        });
        (0, vitest_1.it)("should handle path elements", function () {
            var svg = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\">\n        <path d=\"M10,10 L90,10 L90,90 L10,90 Z\" fill=\"#00FF00\" id=\"custom-path\"/>\n      </svg>";
            var layers = analyzer.analyze(svg);
            (0, vitest_1.expect)(layers).toHaveLength(1);
            (0, vitest_1.expect)(layers[0]).toEqual({
                id: "custom-path",
                label: "Custom Path",
                type: "path",
            });
        });
        (0, vitest_1.it)("should return empty array for invalid SVG", function () {
            var invalidSvg = "<div>Not an SVG</div>";
            var layers = analyzer.analyze(invalidSvg);
            (0, vitest_1.expect)(layers).toHaveLength(0);
        });
        (0, vitest_1.it)("should return empty array for empty input", function () {
            var layers = analyzer.analyze("");
            (0, vitest_1.expect)(layers).toHaveLength(0);
        });
    });
    (0, vitest_1.describe)("extractMetadata", function () {
        (0, vitest_1.it)("should extract basic metadata", function () {
            var svg = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\">\n        <circle cx=\"50\" cy=\"50\" r=\"25\" fill=\"#3B82F6\"/>\n        <rect x=\"10\" y=\"10\" width=\"30\" height=\"30\" fill=\"#FF0000\"/>\n      </svg>";
            var metadata = analyzer.extractMetadata(svg);
            (0, vitest_1.expect)(metadata.elementCount).toBe(2);
            (0, vitest_1.expect)(metadata.hasGroups).toBe(false);
            (0, vitest_1.expect)(metadata.hasText).toBe(false);
            (0, vitest_1.expect)(metadata.colorCount).toBe(2);
            (0, vitest_1.expect)(metadata.complexity).toBe("simple");
        });
        (0, vitest_1.it)("should detect groups and text", function () {
            var svg = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 200 200\">\n        <g id=\"content\">\n          <circle cx=\"50\" cy=\"50\" r=\"25\" fill=\"#3B82F6\"/>\n          <text x=\"100\" y=\"100\">Hello</text>\n        </g>\n      </svg>";
            var metadata = analyzer.extractMetadata(svg);
            (0, vitest_1.expect)(metadata.hasGroups).toBe(true);
            (0, vitest_1.expect)(metadata.hasText).toBe(true);
            (0, vitest_1.expect)(metadata.complexity).toBe("moderate");
        });
        (0, vitest_1.it)("should determine complexity correctly", function () {
            // Simple SVG
            var simpleSvg = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\">\n        <circle cx=\"50\" cy=\"50\" r=\"25\" fill=\"#3B82F6\"/>\n      </svg>";
            var metadata = analyzer.extractMetadata(simpleSvg);
            (0, vitest_1.expect)(metadata.complexity).toBe("simple");
            // Moderate SVG
            var moderateSvg = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\">\n        <circle cx=\"25\" cy=\"25\" r=\"20\" fill=\"#3B82F6\"/>\n        <circle cx=\"75\" cy=\"25\" r=\"20\" fill=\"#FF0000\"/>\n        <circle cx=\"25\" cy=\"75\" r=\"20\" fill=\"#00FF00\"/>\n        <circle cx=\"75\" cy=\"75\" r=\"20\" fill=\"#FFFF00\"/>\n        <rect x=\"40\" y=\"40\" width=\"20\" height=\"20\" fill=\"#FF00FF\"/>\n      </svg>";
            metadata = analyzer.extractMetadata(moderateSvg);
            (0, vitest_1.expect)(metadata.complexity).toBe("moderate");
            // Complex SVG (with groups)
            var complexSvg = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 200 200\">\n        <g id=\"group1\">\n          <circle cx=\"50\" cy=\"50\" r=\"25\" fill=\"#3B82F6\"/>\n        </g>\n      </svg>";
            metadata = analyzer.extractMetadata(complexSvg);
            (0, vitest_1.expect)(metadata.complexity).toBe("complex");
        });
    });
    (0, vitest_1.describe)("label generation", function () {
        (0, vitest_1.it)("should generate descriptive labels for circles", function () {
            var svg = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\">\n        <circle cx=\"50\" cy=\"50\" r=\"25\" fill=\"#FF0000\"/>\n      </svg>";
            var layers = analyzer.analyze(svg);
            (0, vitest_1.expect)(layers[0].label).toContain("Red Circle");
        });
        (0, vitest_1.it)("should generate descriptive labels for rectangles", function () {
            var svg = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\">\n        <rect x=\"10\" y=\"10\" width=\"80\" height=\"60\" fill=\"#00FF00\"/>\n      </svg>";
            var layers = analyzer.analyze(svg);
            (0, vitest_1.expect)(layers[0].label).toContain("Green Rectangle");
        });
        (0, vitest_1.it)("should handle stroke-only elements", function () {
            var svg = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\">\n        <circle cx=\"50\" cy=\"50\" r=\"25\" fill=\"none\" stroke=\"#0000FF\" stroke-width=\"2\"/>\n      </svg>";
            var layers = analyzer.analyze(svg);
            (0, vitest_1.expect)(layers[0].label).toContain("Blue Circle Outline");
        });
        (0, vitest_1.it)("should generate labels for text elements", function () {
            var svg = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 200 100\">\n        <text x=\"100\" y=\"50\">Test</text>\n      </svg>";
            var layers = analyzer.analyze(svg);
            (0, vitest_1.expect)(layers[0].label).toBe('Text: "Test"');
        });
        (0, vitest_1.it)("should handle long text content", function () {
            var svg = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 200 100\">\n        <text x=\"100\" y=\"50\">This is a very long text that should be truncated</text>\n      </svg>";
            var layers = analyzer.analyze(svg);
            (0, vitest_1.expect)(layers[0].label).toBe("Text");
        });
        (0, vitest_1.it)("should detect polygon types", function () {
            // Triangle
            var triangleSvg = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\">\n        <polygon points=\"50,10 10,90 90,90\" fill=\"#FF0000\"/>\n      </svg>";
            var layers = analyzer.analyze(triangleSvg);
            (0, vitest_1.expect)(layers[0].label).toContain("Triangle");
            // Pentagon
            var pentagonSvg = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\">\n        <polygon points=\"50,10 90,35 75,85 25,85 10,35\" fill=\"#FF0000\"/>\n      </svg>";
            layers = analyzer.analyze(pentagonSvg);
            (0, vitest_1.expect)(layers[0].label).toContain("Pentagon");
        });
    });
    (0, vitest_1.describe)("color recognition", function () {
        (0, vitest_1.it)("should recognize common colors", function () {
            var svg = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\">\n        <circle cx=\"50\" cy=\"50\" r=\"25\" fill=\"#FF0000\"/>\n      </svg>";
            var layers = analyzer.analyze(svg);
            (0, vitest_1.expect)(layers[0].label).toContain("Red");
        });
        (0, vitest_1.it)("should handle custom colors", function () {
            var svg = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\">\n        <circle cx=\"50\" cy=\"50\" r=\"25\" fill=\"#123456\"/>\n      </svg>";
            var layers = analyzer.analyze(svg);
            (0, vitest_1.expect)(layers[0].label).toContain("Colored");
        });
        (0, vitest_1.it)("should recognize theme colors", function () {
            var svg = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\">\n        <circle cx=\"50\" cy=\"50\" r=\"25\" fill=\"#3B82F6\"/>\n      </svg>";
            var layers = analyzer.analyze(svg);
            (0, vitest_1.expect)(layers[0].label).toContain("Blue");
        });
    });
});
