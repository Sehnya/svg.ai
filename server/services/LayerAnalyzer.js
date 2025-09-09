"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LayerAnalyzer = void 0;
var jsdom_1 = require("jsdom");
var LayerAnalyzer = /** @class */ (function () {
    function LayerAnalyzer() {
        this.dom = new jsdom_1.JSDOM();
    }
    LayerAnalyzer.prototype.analyze = function (svgContent) {
        try {
            var parser = this.dom.window.DOMParser;
            var doc = new parser().parseFromString(svgContent, "image/svg+xml");
            var svgElement = doc.documentElement;
            if (!svgElement || svgElement.tagName !== "svg") {
                return [];
            }
            var layers = [];
            this.extractLayers(svgElement, layers);
            return layers;
        }
        catch (error) {
            console.error("Error analyzing SVG layers:", error);
            return [];
        }
    };
    LayerAnalyzer.prototype.extractLayers = function (element, layers) {
        var _this = this;
        if (element.tagName === "svg") {
            Array.from(element.children).forEach(function (child) {
                _this.extractLayers(child, layers);
            });
            return;
        }
        if (this.isLayerElement(element)) {
            var layerInfo = this.createLayerInfo(element);
            if (layerInfo) {
                layers.push(layerInfo);
            }
        }
        if (element.tagName === "g") {
            Array.from(element.children).forEach(function (child) {
                _this.extractLayers(child, layers);
            });
        }
    };
    LayerAnalyzer.prototype.isLayerElement = function (element) {
        var layerTags = [
            "g",
            "circle",
            "rect",
            "path",
            "line",
            "polyline",
            "polygon",
            "ellipse",
            "text",
        ];
        return layerTags.includes(element.tagName.toLowerCase());
    };
    LayerAnalyzer.prototype.createLayerInfo = function (element) {
        var id = element.getAttribute("id") || this.generateId(element);
        var label = this.generateLabel(element);
        var type = this.classifyElement(element);
        return { id: id, label: label, type: type };
    };
    LayerAnalyzer.prototype.generateId = function (element) {
        var tagName = element.tagName.toLowerCase();
        var timestamp = Date.now().toString(36);
        var random = Math.random().toString(36).substring(2, 7);
        return "".concat(tagName, "-").concat(timestamp, "-").concat(random);
    };
    LayerAnalyzer.prototype.generateLabel = function (element) {
        var tagName = element.tagName.toLowerCase();
        var id = element.getAttribute("id");
        // For groups, always use group-specific logic unless ID suggests otherwise
        if (tagName === "g") {
            if (id) {
                // Check if ID suggests it should be treated as a group count
                var formattedId = this.formatIdAsLabel(id);
                if (formattedId.toLowerCase().includes("group")) {
                    return this.generateGroupLabel(element);
                }
                return formattedId;
            }
            return this.generateGroupLabel(element);
        }
        // If element has an ID, use formatted ID as label
        if (id) {
            return this.formatIdAsLabel(id);
        }
        // For elements without IDs, use descriptive labels based on attributes
        switch (tagName) {
            case "circle":
                return this.generateCircleLabel(element);
            case "rect":
                return this.generateRectLabel(element);
            case "polygon":
                return this.generatePolygonLabel(element);
            case "text":
                return this.generateTextLabel(element);
            default:
                return this.capitalizeFirst(tagName);
        }
    };
    LayerAnalyzer.prototype.formatIdAsLabel = function (id) {
        var _this = this;
        return id
            .replace(/[-_]/g, " ")
            .replace(/([a-z])([A-Z])/g, "$1 $2")
            .split(" ")
            .map(function (word) { return _this.capitalizeFirst(word); })
            .join(" ");
    };
    LayerAnalyzer.prototype.classifyElement = function (element) {
        var tagName = element.tagName.toLowerCase();
        switch (tagName) {
            case "g":
                return "group";
            case "text":
                return "text";
            case "path":
                return "path";
            default:
                return "shape";
        }
    };
    LayerAnalyzer.prototype.capitalizeFirst = function (str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    };
    LayerAnalyzer.prototype.generateCircleLabel = function (element) {
        var r = element.getAttribute("r");
        var fill = element.getAttribute("fill");
        var stroke = element.getAttribute("stroke");
        var label = "Circle";
        if (fill && fill !== "none") {
            var colorName = this.getColorName(fill);
            label = "".concat(colorName, " Circle");
        }
        else if (stroke && stroke !== "none") {
            var colorName = this.getColorName(stroke);
            label = "".concat(colorName, " Circle Outline");
        }
        if (r) {
            label += " (r=".concat(r, ")");
        }
        return label;
    };
    LayerAnalyzer.prototype.generateRectLabel = function (element) {
        var width = element.getAttribute("width");
        var height = element.getAttribute("height");
        var rx = element.getAttribute("rx");
        var fill = element.getAttribute("fill");
        var stroke = element.getAttribute("stroke");
        var label = rx ? "Rounded Rectangle" : "Rectangle";
        if (fill && fill !== "none") {
            var colorName = this.getColorName(fill);
            label = "".concat(colorName, " ").concat(label);
        }
        else if (stroke && stroke !== "none") {
            var colorName = this.getColorName(stroke);
            label = "".concat(colorName, " ").concat(label, " Outline");
        }
        if (width && height) {
            label += " (".concat(width, "\u00D7").concat(height, ")");
        }
        return label;
    };
    LayerAnalyzer.prototype.generateTextLabel = function (element) {
        var _a;
        var textContent = (_a = element.textContent) === null || _a === void 0 ? void 0 : _a.trim();
        if (textContent && textContent.length <= 20) {
            return "Text: \"".concat(textContent, "\"");
        }
        return "Text";
    };
    LayerAnalyzer.prototype.generateGroupLabel = function (element) {
        var childCount = element.children.length;
        if (childCount === 0) {
            return "Empty Group";
        }
        else if (childCount === 1) {
            return "Group (1 item)";
        }
        else {
            return "Group (".concat(childCount, " items)");
        }
    };
    LayerAnalyzer.prototype.generatePolygonLabel = function (element) {
        var points = element.getAttribute("points");
        var fill = element.getAttribute("fill");
        var stroke = element.getAttribute("stroke");
        var shapeType = "Polygon";
        // Count points to determine polygon type
        if (points) {
            var pointPairs = points
                .trim()
                .split(/\s+|,/)
                .filter(function (p) { return p.trim() !== ""; });
            var pointCount = Math.floor(pointPairs.length / 2);
            if (pointCount === 3) {
                shapeType = "Triangle";
            }
            else if (pointCount === 4) {
                shapeType = "Quadrilateral";
            }
            else if (pointCount === 5) {
                shapeType = "Pentagon";
            }
            else if (pointCount === 6) {
                shapeType = "Hexagon";
            }
        }
        var label = shapeType;
        if (fill && fill !== "none") {
            var colorName = this.getColorName(fill);
            label = "".concat(colorName, " ").concat(shapeType);
        }
        else if (stroke && stroke !== "none") {
            var colorName = this.getColorName(stroke);
            label = "".concat(colorName, " ").concat(shapeType, " Outline");
        }
        return label;
    };
    LayerAnalyzer.prototype.getColorName = function (color) {
        var colorMap = {
            "#FF0000": "Red",
            "#00FF00": "Green",
            "#0000FF": "Blue",
            "#FFFF00": "Yellow",
            "#FF00FF": "Magenta",
            "#00FFFF": "Cyan",
            "#000000": "Black",
            "#FFFFFF": "White",
            "#808080": "Gray",
            "#FFA500": "Orange",
            "#800080": "Purple",
            "#FFC0CB": "Pink",
            "#A52A2A": "Brown",
            "#3B82F6": "Blue",
            "#1E40AF": "Dark Blue",
            "#1D4ED8": "Royal Blue",
        };
        var normalizedColor = color.toUpperCase();
        if (colorMap[normalizedColor]) {
            return colorMap[normalizedColor];
        }
        // For hex colors, try to determine basic color
        if (color.startsWith("#") && (color.length === 7 || color.length === 4)) {
            var r = void 0, g = void 0, b = void 0;
            if (color.length === 4) {
                // Short hex format #RGB
                r = parseInt(color.substring(1, 2) + color.substring(1, 2), 16);
                g = parseInt(color.substring(2, 3) + color.substring(2, 3), 16);
                b = parseInt(color.substring(3, 4) + color.substring(3, 4), 16);
            }
            else {
                // Full hex format #RRGGBB
                r = parseInt(color.substring(1, 3), 16);
                g = parseInt(color.substring(3, 5), 16);
                b = parseInt(color.substring(5, 7), 16);
            }
            // Determine dominant color - require significant dominance
            var threshold = 50; // Minimum difference to be considered dominant
            if (r > g + threshold && r > b + threshold) {
                return "Red";
            }
            else if (g > r + threshold && g > b + threshold) {
                return "Green";
            }
            else if (b > r + threshold && b > g + threshold) {
                return "Blue";
            }
            else if (Math.abs(r - g) < threshold && r > b + threshold) {
                return "Yellow";
            }
            else if (Math.abs(r - b) < threshold && r > g + threshold) {
                return "Magenta";
            }
            else if (Math.abs(g - b) < threshold && g > r + threshold) {
                return "Cyan";
            }
        }
        return "Colored";
    };
    LayerAnalyzer.prototype.extractMetadata = function (svgContent) {
        try {
            var parser = this.dom.window.DOMParser;
            var doc = new parser().parseFromString(svgContent, "image/svg+xml");
            var svgElement = doc.documentElement;
            if (!svgElement || svgElement.tagName !== "svg") {
                return {
                    elementCount: 0,
                    hasGroups: false,
                    hasText: false,
                    colorCount: 0,
                    complexity: "simple",
                };
            }
            var elements = svgElement.querySelectorAll("*");
            var elementCount = elements.length;
            var hasGroups = svgElement.querySelector("g") !== null;
            var hasText = svgElement.querySelector("text") !== null;
            // Extract unique colors
            var colors_1 = new Set();
            elements.forEach(function (el) {
                var fill = el.getAttribute("fill");
                var stroke = el.getAttribute("stroke");
                if (fill && fill !== "none")
                    colors_1.add(fill);
                if (stroke && stroke !== "none")
                    colors_1.add(stroke);
            });
            var colorCount = colors_1.size;
            // Determine complexity
            var complexity = "simple";
            if (elementCount > 20 ||
                colorCount > 5 ||
                (hasGroups && elementCount <= 2)) {
                complexity = "complex";
            }
            else if (elementCount > 5 || colorCount > 2 || hasGroups || hasText) {
                complexity = "moderate";
            }
            return {
                elementCount: elementCount,
                hasGroups: hasGroups,
                hasText: hasText,
                colorCount: colorCount,
                complexity: complexity,
            };
        }
        catch (error) {
            console.error("Error extracting SVG metadata:", error);
            return {
                elementCount: 0,
                hasGroups: false,
                hasText: false,
                colorCount: 0,
                complexity: "simple",
            };
        }
    };
    return LayerAnalyzer;
}());
exports.LayerAnalyzer = LayerAnalyzer;
