"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SVGRenderer = void 0;
var SVGRenderer = /** @class */ (function () {
    function SVGRenderer() {
        this.DEFAULT_OPTIONS = {
            includeMetadata: false,
            optimizeOutput: true,
            indentSize: 2,
            precision: 2,
        };
    }
    SVGRenderer.prototype.render = function (document, options) {
        return __awaiter(this, void 0, void 0, function () {
            var opts, svg, sortedComponents, _i, sortedComponents_1, component;
            return __generator(this, function (_a) {
                opts = __assign(__assign({}, this.DEFAULT_OPTIONS), options);
                svg = this.createSVGElement(document, opts);
                // Add metadata if requested
                if (opts.includeMetadata) {
                    svg += this.renderMetadata(document, opts);
                }
                // Add background if specified
                if (document.metadata.palette.length > 3) {
                    svg += this.renderBackground(document, opts);
                }
                sortedComponents = this.sortComponentsByZIndex(document.components);
                for (_i = 0, sortedComponents_1 = sortedComponents; _i < sortedComponents_1.length; _i++) {
                    component = sortedComponents_1[_i];
                    svg += this.renderComponent(component, opts, 1);
                }
                // Close SVG element
                svg += "</svg>";
                // Optimize output if requested
                if (opts.optimizeOutput) {
                    svg = this.optimizeSVG(svg, opts);
                }
                return [2 /*return*/, svg];
            });
        });
    };
    SVGRenderer.prototype.createSVGElement = function (document, options) {
        var _a = document.bounds, width = _a.width, height = _a.height;
        var viewBox = "0 0 ".concat(width, " ").concat(height);
        var attributes = [
            'xmlns="http://www.w3.org/2000/svg"',
            "viewBox=\"".concat(viewBox, "\""),
            "width=\"".concat(width, "\""),
            "height=\"".concat(height, "\""),
        ];
        // Add version info as comment if metadata is included
        var svg = "<svg " + attributes.join(" ") + ">";
        if (options.includeMetadata) {
            svg += "\n  <!-- Generated by SVG AI Code Generator -->";
            svg += "\n  <!-- Model: ".concat(document.metadata.model, " -->");
            svg += "\n  <!-- Generated: ".concat(document.metadata.generatedAt.toISOString(), " -->");
        }
        return svg;
    };
    SVGRenderer.prototype.renderMetadata = function (document, options) {
        var indent = " ".repeat(options.indentSize || 2);
        var metadata = "\n" + indent + "<metadata>";
        metadata +=
            "\n" +
                indent +
                '  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">';
        metadata += "\n" + indent + "    <rdf:Description>";
        metadata += "\n".concat(indent, "      <dc:title xmlns:dc=\"http://purl.org/dc/elements/1.1/\">").concat(this.escapeXML(document.metadata.prompt), "</dc:title>");
        metadata += "\n".concat(indent, "      <dc:description xmlns:dc=\"http://purl.org/dc/elements/1.1/\">").concat(this.escapeXML(document.metadata.description), "</dc:description>");
        metadata += "\n".concat(indent, "      <dc:creator xmlns:dc=\"http://purl.org/dc/elements/1.1/\">").concat(document.metadata.model, "</dc:creator>");
        metadata += "\n".concat(indent, "      <dc:date xmlns:dc=\"http://purl.org/dc/elements/1.1/\">").concat(document.metadata.generatedAt.toISOString(), "</dc:date>");
        metadata += "\n" + indent + "    </rdf:Description>";
        metadata += "\n" + indent + "  </rdf:RDF>";
        metadata += "\n" + indent + "</metadata>";
        return metadata;
    };
    SVGRenderer.prototype.renderBackground = function (document, options) {
        var bgColor = document.metadata.palette[3]; // Fourth color as background
        var indent = " ".repeat(options.indentSize || 2);
        return "\n".concat(indent, "<rect width=\"100%\" height=\"100%\" fill=\"").concat(bgColor, "\"/>");
    };
    SVGRenderer.prototype.sortComponentsByZIndex = function (components) {
        // For now, render in order. In a full implementation, we'd use actual z-index values
        return __spreadArray([], components, true);
    };
    SVGRenderer.prototype.renderComponent = function (component, options, depth) {
        var indent = " ".repeat((options.indentSize || 2) * depth);
        var precision = options.precision || 2;
        // Start element
        var element = "\n".concat(indent, "<").concat(component.element);
        // Add attributes
        for (var _i = 0, _a = Object.entries(component.attributes); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], value = _b[1];
            var formattedValue = this.formatAttributeValue(value, precision);
            element += " ".concat(key, "=\"").concat(formattedValue, "\"");
        }
        // Handle self-closing vs container elements
        if (this.isSelfClosingElement(component.element)) {
            element += "/>";
        }
        else {
            element += ">";
            // Render children if present
            if (component.children && component.children.length > 0) {
                for (var _c = 0, _d = component.children; _c < _d.length; _c++) {
                    var child = _d[_c];
                    element += this.renderComponent(child, options, depth + 1);
                }
                element += "\n".concat(indent);
            }
            element += "</".concat(component.element, ">");
        }
        return element;
    };
    SVGRenderer.prototype.formatAttributeValue = function (value, precision) {
        if (typeof value === "number") {
            // Round to specified precision
            if (Number.isInteger(value)) {
                return value.toString();
            }
            else {
                return value.toFixed(precision).replace(/\.?0+$/, "");
            }
        }
        return this.escapeXML(value.toString());
    };
    SVGRenderer.prototype.isSelfClosingElement = function (elementType) {
        var selfClosingElements = [
            "circle",
            "ellipse",
            "line",
            "rect",
            "polygon",
            "polyline",
            "path",
        ];
        return selfClosingElements.includes(elementType);
    };
    SVGRenderer.prototype.escapeXML = function (text) {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    };
    SVGRenderer.prototype.optimizeSVG = function (svg, options) {
        var optimized = svg;
        // Remove unnecessary whitespace between elements
        optimized = optimized.replace(/>\s+</g, "><");
        // Remove trailing zeros from decimal numbers
        optimized = optimized.replace(/(\d+)\.0+(?=["'\s>])/g, "$1");
        // Simplify consecutive identical attributes (basic optimization)
        // This is a simplified version - a full optimizer would be more sophisticated
        // Remove empty groups
        optimized = optimized.replace(/<g[^>]*>\s*<\/g>/g, "");
        // Combine consecutive transforms (basic case)
        optimized = optimized.replace(/transform="([^"]*)" transform="([^"]*)"/g, 'transform="$1 $2"');
        return optimized;
    };
    // Utility method for rendering individual components (useful for testing)
    SVGRenderer.prototype.renderComponentOnly = function (component, options) {
        var opts = __assign(__assign({}, this.DEFAULT_OPTIONS), options);
        return this.renderComponent(component, opts, 0).trim();
    };
    // Method to render just the SVG content without wrapper
    SVGRenderer.prototype.renderContent = function (document, options) {
        var opts = __assign(__assign({}, this.DEFAULT_OPTIONS), options);
        var content = "";
        // Add background if specified
        if (document.metadata.palette.length > 3) {
            content += this.renderBackground(document, opts);
        }
        // Render components
        var sortedComponents = this.sortComponentsByZIndex(document.components);
        for (var _i = 0, sortedComponents_2 = sortedComponents; _i < sortedComponents_2.length; _i++) {
            var component = sortedComponents_2[_i];
            content += this.renderComponent(component, opts, 1);
        }
        return content;
    };
    // Method to validate rendered SVG
    SVGRenderer.prototype.validateRenderedSVG = function (svg) {
        var errors = [];
        // Basic structural validation
        if (!svg.startsWith("<svg")) {
            errors.push("SVG does not start with <svg element");
        }
        if (!svg.endsWith("</svg>")) {
            errors.push("SVG does not end with </svg>");
        }
        if (!svg.includes('xmlns="http://www.w3.org/2000/svg"')) {
            errors.push("SVG missing required xmlns attribute");
        }
        if (!svg.includes("viewBox=")) {
            errors.push("SVG missing viewBox attribute");
        }
        // Check for unclosed tags (basic check)
        var openTags = (svg.match(/<[^/][^>]*[^/]>/g) || []).length;
        var closeTags = (svg.match(/<\/[^>]+>/g) || []).length;
        var selfClosingTags = (svg.match(/<[^>]*\/>/g) || []).length;
        if (openTags !== closeTags + selfClosingTags) {
            errors.push("Mismatched opening and closing tags");
        }
        return {
            isValid: errors.length === 0,
            errors: errors,
        };
    };
    return SVGRenderer;
}());
exports.SVGRenderer = SVGRenderer;
