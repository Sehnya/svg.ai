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
exports.SVGSynthesizer = void 0;
var pipeline_js_1 = require("../schemas/pipeline.js");
var ComponentLibrary_js_1 = require("./ComponentLibrary.js");
var SVGSynthesizer = /** @class */ (function () {
    function SVGSynthesizer() {
        this.componentLibrary = new ComponentLibrary_js_1.ComponentLibrary();
    }
    SVGSynthesizer.prototype.synthesize = function (plan, grounding, context) {
        return __awaiter(this, void 0, void 0, function () {
            var components, metadata, document, validationResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.generateComponents(plan, grounding)];
                    case 1:
                        components = _a.sent();
                        metadata = this.createMetadata(plan, context, grounding);
                        document = {
                            components: components,
                            metadata: metadata,
                            bounds: plan.layout.bounds,
                            palette: this.extractPalette(plan, grounding),
                        };
                        validationResult = pipeline_js_1.AISVGDocumentSchema.safeParse(document);
                        if (!validationResult.success) {
                            console.warn("SVG document validation warning: ".concat(validationResult.error.message));
                            // Continue with generation but log the validation issue
                        }
                        return [2 /*return*/, document];
                }
            });
        });
    };
    SVGSynthesizer.prototype.generateComponents = function (plan, grounding) {
        return __awaiter(this, void 0, void 0, function () {
            var components, i, componentPlan, zIndex, component;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        components = [];
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < plan.components.length)) return [3 /*break*/, 4];
                        componentPlan = plan.components[i];
                        zIndex = plan.zIndex[i];
                        return [4 /*yield*/, this.createComponent(componentPlan, grounding, zIndex)];
                    case 2:
                        component = _a.sent();
                        if (component) {
                            components.push(component);
                        }
                        _a.label = 3;
                    case 3:
                        i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, components];
                }
            });
        });
    };
    SVGSynthesizer.prototype.createComponent = function (componentPlan, grounding, zIndex) {
        return __awaiter(this, void 0, void 0, function () {
            var id, type, position, size, rotation, style, motif, reusedComponent, libraryComponent;
            return __generator(this, function (_a) {
                id = componentPlan.id, type = componentPlan.type, position = componentPlan.position, size = componentPlan.size, rotation = componentPlan.rotation, style = componentPlan.style, motif = componentPlan.motif;
                reusedComponent = this.tryReuseComponent(componentPlan, grounding);
                if (reusedComponent) {
                    return [2 /*return*/, this.adaptComponent(reusedComponent, componentPlan, zIndex)];
                }
                libraryComponent = this.tryLibraryComponent(componentPlan);
                if (libraryComponent) {
                    return [2 /*return*/, this.enhanceComponent(libraryComponent, zIndex)];
                }
                // Generate basic component
                return [2 /*return*/, this.generateBasicComponent(componentPlan, zIndex)];
            });
        });
    };
    SVGSynthesizer.prototype.tryReuseComponent = function (componentPlan, grounding) {
        if (!grounding.components || grounding.components.length === 0) {
            return null;
        }
        // Find matching component by motif or type
        var matchingComponent = grounding.components.find(function (comp) {
            return comp.motif === componentPlan.motif || comp.type === componentPlan.type;
        });
        return matchingComponent || null;
    };
    SVGSynthesizer.prototype.adaptComponent = function (baseComponent, componentPlan, zIndex) {
        var position = componentPlan.position, size = componentPlan.size, style = componentPlan.style, rotation = componentPlan.rotation;
        // Validate input coordinates and dimensions
        this.validateCoordinates(position, size);
        // Clone and adapt the component
        var adapted = __assign(__assign({}, baseComponent), { id: componentPlan.id, attributes: __assign({}, baseComponent.attributes), metadata: __assign(__assign({}, baseComponent.metadata), { reused: true }) });
        // Apply transformations based on element type
        switch (adapted.element) {
            case "circle":
                adapted.attributes.cx = this.sanitizeNumber(position.x);
                adapted.attributes.cy = this.sanitizeNumber(position.y);
                adapted.attributes.r = this.sanitizeNumber(Math.min(size.width, size.height) / 2);
                break;
            case "rect":
                adapted.attributes.x = this.sanitizeNumber(position.x - size.width / 2);
                adapted.attributes.y = this.sanitizeNumber(position.y - size.height / 2);
                adapted.attributes.width = this.sanitizeNumber(size.width);
                adapted.attributes.height = this.sanitizeNumber(size.height);
                break;
            case "polygon":
                // Scale and position polygon points
                if (typeof adapted.attributes.points === "string") {
                    adapted.attributes.points = this.transformPolygonPoints(adapted.attributes.points, position, size);
                }
                break;
            case "path":
                // Transform path data (simplified)
                if (typeof adapted.attributes.d === "string") {
                    adapted.attributes.d = this.transformPathData(adapted.attributes.d, position, size);
                }
                break;
        }
        // Apply styling
        this.applyStyle(adapted, style);
        // Apply rotation if needed
        if (rotation !== 0) {
            adapted.attributes.transform = "rotate(".concat(rotation, " ").concat(position.x, " ").concat(position.y, ")");
        }
        return adapted;
    };
    SVGSynthesizer.prototype.tryLibraryComponent = function (componentPlan) {
        var motif = componentPlan.motif, type = componentPlan.type, position = componentPlan.position, size = componentPlan.size, style = componentPlan.style;
        // Find suitable template
        var templates = this.componentLibrary.findTemplates({
            tags: motif ? [motif] : undefined,
            type: type,
        });
        if (templates.length === 0) {
            return null;
        }
        // Use the first matching template
        var template = templates[0];
        return this.componentLibrary.instantiateComponent(template.id, style, position, size);
    };
    SVGSynthesizer.prototype.enhanceComponent = function (component, zIndex) {
        return __assign(__assign({}, component), { metadata: __assign(__assign({}, component.metadata), { generated: true }) });
    };
    SVGSynthesizer.prototype.generateBasicComponent = function (componentPlan, zIndex) {
        var id = componentPlan.id, type = componentPlan.type, position = componentPlan.position, size = componentPlan.size, style = componentPlan.style, motif = componentPlan.motif;
        // Validate input coordinates and dimensions
        this.validateCoordinates(position, size);
        var attributes = {};
        // Generate attributes based on element type
        switch (type) {
            case "circle":
                attributes.cx = this.sanitizeNumber(position.x);
                attributes.cy = this.sanitizeNumber(position.y);
                attributes.r = this.sanitizeNumber(Math.min(size.width, size.height) / 2);
                break;
            case "rect":
                attributes.x = this.sanitizeNumber(position.x - size.width / 2);
                attributes.y = this.sanitizeNumber(position.y - size.height / 2);
                attributes.width = this.sanitizeNumber(size.width);
                attributes.height = this.sanitizeNumber(size.height);
                break;
            case "polygon":
                // Generate triangle by default
                var points = [
                    "".concat(position.x, ",").concat(position.y - size.height / 2),
                    "".concat(position.x - size.width / 2, ",").concat(position.y + size.height / 2),
                    "".concat(position.x + size.width / 2, ",").concat(position.y + size.height / 2),
                ].join(" ");
                attributes.points = points;
                break;
            case "path":
                // Generate simple path
                attributes.d = this.generateSimplePath(position, size, motif);
                break;
            case "line":
                attributes.x1 = this.sanitizeNumber(position.x - size.width / 2);
                attributes.y1 = this.sanitizeNumber(position.y);
                attributes.x2 = this.sanitizeNumber(position.x + size.width / 2);
                attributes.y2 = this.sanitizeNumber(position.y);
                break;
            case "ellipse":
                attributes.cx = this.sanitizeNumber(position.x);
                attributes.cy = this.sanitizeNumber(position.y);
                attributes.rx = this.sanitizeNumber(size.width / 2);
                attributes.ry = this.sanitizeNumber(size.height / 2);
                break;
            default:
                // Default to circle
                attributes.cx = this.sanitizeNumber(position.x);
                attributes.cy = this.sanitizeNumber(position.y);
                attributes.r = this.sanitizeNumber(Math.min(size.width, size.height) / 2);
        }
        var component = {
            id: id,
            type: motif || type,
            element: type,
            attributes: attributes,
            metadata: {
                motif: motif,
                generated: true,
                reused: false,
            },
        };
        // Apply styling
        this.applyStyle(component, style);
        return component;
    };
    SVGSynthesizer.prototype.applyStyle = function (component, style) {
        if (style.fill) {
            component.attributes.fill = style.fill;
        }
        if (style.stroke) {
            component.attributes.stroke = style.stroke;
        }
        if (style.strokeWidth) {
            component.attributes["stroke-width"] = style.strokeWidth;
        }
        if (style.opacity) {
            component.attributes.opacity = style.opacity;
        }
    };
    SVGSynthesizer.prototype.transformPolygonPoints = function (points, position, size) {
        // Parse points and transform them
        var pointPairs = points.split(" ").map(function (pair) {
            var _a = pair.split(",").map(Number), x = _a[0], y = _a[1];
            return {
                x: position.x + (x - 50) * (size.width / 100), // Assuming original is 100x100
                y: position.y + (y - 50) * (size.height / 100),
            };
        });
        return pointPairs
            .map(function (p) { return "".concat(p.x.toFixed(2), ",").concat(p.y.toFixed(2)); })
            .join(" ");
    };
    SVGSynthesizer.prototype.transformPathData = function (pathData, position, size) {
        // Simplified path transformation - in practice this would be more sophisticated
        // For now, just translate the path
        return "M".concat(position.x - size.width / 2, ",").concat(position.y, " ").concat(pathData.substring(1));
    };
    SVGSynthesizer.prototype.generateSimplePath = function (position, size, motif) {
        var x = position.x, y = position.y;
        var width = size.width, height = size.height;
        // Generate different paths based on motif
        switch (motif) {
            case "wave":
                return "M".concat(x - width / 2, ",").concat(y, " Q").concat(x - width / 4, ",").concat(y - height / 2, " ").concat(x, ",").concat(y, " Q").concat(x + width / 4, ",").concat(y + height / 2, " ").concat(x + width / 2, ",").concat(y);
            case "leaf":
                return "M".concat(x, ",").concat(y - height / 2, " Q").concat(x + width / 4, ",").concat(y - height / 4, " ").concat(x + width / 8, ",").concat(y, " Q").concat(x + width / 4, ",").concat(y + height / 4, " ").concat(x, ",").concat(y + height / 2, " Q").concat(x - width / 4, ",").concat(y + height / 4, " ").concat(x - width / 8, ",").concat(y, " Q").concat(x - width / 4, ",").concat(y - height / 4, " ").concat(x, ",").concat(y - height / 2, " Z");
            case "star":
                // Simple 5-pointed star
                var points = [];
                for (var i = 0; i < 10; i++) {
                    var angle = (i * Math.PI) / 5;
                    var radius = i % 2 === 0 ? width / 2 : width / 4;
                    var px = x + Math.cos(angle - Math.PI / 2) * radius;
                    var py = y + Math.sin(angle - Math.PI / 2) * radius;
                    points.push(i === 0 ? "M".concat(px, ",").concat(py) : "L".concat(px, ",").concat(py));
                }
                return points.join(" ") + " Z";
            default:
                // Simple curved path
                return "M".concat(x - width / 2, ",").concat(y, " Q").concat(x, ",").concat(y - height / 2, " ").concat(x + width / 2, ",").concat(y);
        }
    };
    SVGSynthesizer.prototype.createMetadata = function (plan, context, grounding) {
        return {
            prompt: context.prompt,
            seed: context.seed,
            palette: this.extractPalette(plan, grounding),
            description: this.generateDescription(plan, context),
            generatedAt: new Date(),
            model: context.model || "synthesizer-v1",
            usedObjects: this.extractUsedObjects(grounding),
        };
    };
    SVGSynthesizer.prototype.extractPalette = function (plan, grounding) {
        var _a;
        var colors = new Set();
        // Extract colors from components
        for (var _i = 0, _b = plan.components; _i < _b.length; _i++) {
            var component = _b[_i];
            if (component.style.fill && component.style.fill !== "none") {
                colors.add(component.style.fill);
            }
            if (component.style.stroke) {
                colors.add(component.style.stroke);
            }
        }
        // Add background color if present
        if (plan.layout.background) {
            colors.add(plan.layout.background);
        }
        // Add colors from grounding style pack
        if ((_a = grounding.stylePack) === null || _a === void 0 ? void 0 : _a.colors) {
            grounding.stylePack.colors.forEach(function (color) { return colors.add(color); });
        }
        return Array.from(colors);
    };
    SVGSynthesizer.prototype.generateDescription = function (plan, context) {
        var componentCount = plan.components.length;
        var arrangement = plan.layout.arrangement;
        var motifs = __spreadArray([], new Set(plan.components.map(function (c) { return c.motif; }).filter(Boolean)), true);
        var description = "Generated SVG with ".concat(componentCount, " components");
        if (arrangement !== "centered") {
            description += " in ".concat(arrangement, " arrangement");
        }
        if (motifs.length > 0) {
            description += " featuring ".concat(motifs.join(", "));
        }
        return description;
    };
    SVGSynthesizer.prototype.extractUsedObjects = function (grounding) {
        var _a;
        var usedObjects = [];
        if ((_a = grounding.stylePack) === null || _a === void 0 ? void 0 : _a.id) {
            usedObjects.push(grounding.stylePack.id);
        }
        if (grounding.motifs) {
            grounding.motifs.forEach(function (motif) {
                if (motif.id)
                    usedObjects.push(motif.id);
            });
        }
        if (grounding.components) {
            grounding.components.forEach(function (comp) {
                if (comp.id)
                    usedObjects.push(comp.id);
            });
        }
        return usedObjects;
    };
    /**
     * Validates that coordinates and dimensions are valid numbers
     */
    SVGSynthesizer.prototype.validateCoordinates = function (position, size) {
        if (!this.isValidNumber(position.x) || !this.isValidNumber(position.y)) {
            throw new Error("Invalid position coordinates: x=".concat(position.x, ", y=").concat(position.y));
        }
        if (!this.isValidNumber(size.width) || !this.isValidNumber(size.height)) {
            throw new Error("Invalid size dimensions: width=".concat(size.width, ", height=").concat(size.height));
        }
        if (size.width <= 0 || size.height <= 0) {
            throw new Error("Size dimensions must be positive: width=".concat(size.width, ", height=").concat(size.height));
        }
    };
    /**
     * Checks if a number is valid (not NaN, not Infinity)
     */
    SVGSynthesizer.prototype.isValidNumber = function (value) {
        return typeof value === "number" && isFinite(value) && !isNaN(value);
    };
    /**
     * Sanitizes a number by ensuring it's valid and rounding to 2 decimal places
     */
    SVGSynthesizer.prototype.sanitizeNumber = function (value) {
        if (!this.isValidNumber(value)) {
            throw new Error("Invalid number value: ".concat(value));
        }
        // Round to 2 decimal places to prevent excessive precision
        return Math.round(value * 100) / 100;
    };
    return SVGSynthesizer;
}());
exports.SVGSynthesizer = SVGSynthesizer;
