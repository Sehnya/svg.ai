"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompositionPlanner = void 0;
var pipeline_js_1 = require("../schemas/pipeline.js");
var CompositionPlanner = /** @class */ (function () {
    function CompositionPlanner(seed) {
        this.rng = this.createSeededRandom(seed);
    }
    CompositionPlanner.prototype.plan = function (intent, grounding, context) {
        return __awaiter(this, void 0, void 0, function () {
            var layout, components, zIndex, plan, validationResult;
            return __generator(this, function (_a) {
                layout = this.createLayoutPlan(intent, context);
                components = this.generateComponents(intent, grounding, layout);
                zIndex = this.calculateZIndex(components, intent);
                plan = {
                    components: components,
                    layout: layout,
                    zIndex: zIndex,
                };
                validationResult = pipeline_js_1.CompositionPlanSchema.safeParse(plan);
                if (!validationResult.success) {
                    throw new Error("Invalid composition plan: ".concat(validationResult.error.message));
                }
                return [2 /*return*/, plan];
            });
        });
    };
    CompositionPlanner.prototype.createLayoutPlan = function (intent, context) {
        var bounds = (context === null || context === void 0 ? void 0 : context.targetSize) || { width: 400, height: 400 };
        var viewBox = "0 0 ".concat(bounds.width, " ").concat(bounds.height);
        // Determine spacing based on density
        var spacing = intent.style.density === "sparse"
            ? 40
            : intent.style.density === "dense"
                ? 10
                : 20;
        // Background color from palette (optional)
        var background = intent.style.palette.length > 3 ? intent.style.palette[3] : undefined;
        return {
            bounds: bounds,
            viewBox: viewBox,
            background: background,
            arrangement: intent.layout.arrangement,
            spacing: spacing,
        };
    };
    CompositionPlanner.prototype.generateComponents = function (intent, grounding, layout) {
        var components = [];
        // Determine number of components
        var componentCount = this.determineComponentCount(intent);
        // Generate positions based on arrangement
        var positions = this.generatePositions(layout, componentCount);
        // Create components
        for (var i = 0; i < componentCount; i++) {
            var component = this.createComponent(i, intent, grounding, layout, positions[i]);
            components.push(component);
        }
        return components;
    };
    CompositionPlanner.prototype.determineComponentCount = function (intent) {
        // Use preferred count from layout, fallback to density-based count
        var layoutCount = intent.layout.counts.find(function (c) { return c.type === "element"; });
        if (layoutCount) {
            return Math.min(layoutCount.preferred, intent.constraints.maxElements);
        }
        // Fallback based on density
        var baseCount = intent.style.density === "sparse"
            ? 3
            : intent.style.density === "dense"
                ? 8
                : 5;
        return Math.min(baseCount, intent.constraints.maxElements);
    };
    CompositionPlanner.prototype.generatePositions = function (layout, count) {
        var bounds = layout.bounds, spacing = layout.spacing, arrangement = layout.arrangement;
        var positions = [];
        switch (arrangement) {
            case "grid":
                return this.generateGridPositions(bounds, count, spacing);
            case "centered":
                return this.generateCenteredPositions(bounds, count, spacing);
            case "scattered":
                return this.generateScatteredPositions(bounds, count, spacing);
            case "organic":
                return this.generateOrganicPositions(bounds, count, spacing);
            default:
                return this.generateCenteredPositions(bounds, count, spacing);
        }
    };
    CompositionPlanner.prototype.generateGridPositions = function (bounds, count, spacing) {
        var positions = [];
        var cols = Math.ceil(Math.sqrt(count));
        var rows = Math.ceil(count / cols);
        var cellWidth = (bounds.width - spacing * (cols + 1)) / cols;
        var cellHeight = (bounds.height - spacing * (rows + 1)) / rows;
        for (var i = 0; i < count; i++) {
            var col = i % cols;
            var row = Math.floor(i / cols);
            var x = spacing + col * (cellWidth + spacing) + cellWidth / 2;
            var y = spacing + row * (cellHeight + spacing) + cellHeight / 2;
            positions.push({ x: x, y: y });
        }
        return positions;
    };
    CompositionPlanner.prototype.generateCenteredPositions = function (bounds, count, spacing) {
        var positions = [];
        var centerX = bounds.width / 2;
        var centerY = bounds.height / 2;
        if (count === 1) {
            positions.push({ x: centerX, y: centerY });
        }
        else {
            // Arrange in a circle around center
            var radius = Math.min(bounds.width, bounds.height) / 4;
            for (var i = 0; i < count; i++) {
                var angle = (i / count) * 2 * Math.PI;
                var x = centerX + Math.cos(angle) * radius;
                var y = centerY + Math.sin(angle) * radius;
                positions.push({ x: x, y: y });
            }
        }
        return positions;
    };
    CompositionPlanner.prototype.generateScatteredPositions = function (bounds, count, spacing) {
        var positions = [];
        var margin = spacing * 2;
        for (var i = 0; i < count; i++) {
            var x = margin + this.rng() * (bounds.width - 2 * margin);
            var y = margin + this.rng() * (bounds.height - 2 * margin);
            positions.push({ x: x, y: y });
        }
        return positions;
    };
    CompositionPlanner.prototype.generateOrganicPositions = function (bounds, count, spacing) {
        var positions = [];
        // Use a flowing, natural arrangement
        var centerX = bounds.width / 2;
        var centerY = bounds.height / 2;
        for (var i = 0; i < count; i++) {
            // Create flowing curves
            var t = i / (count - 1);
            var wave = Math.sin(t * Math.PI * 2) * 0.3;
            var spiral = t * 0.5;
            var x = centerX + (t - 0.5) * bounds.width * 0.6 + wave * bounds.width * 0.2;
            var y = centerY + spiral * bounds.height * 0.4 + wave * bounds.height * 0.1;
            positions.push({
                x: Math.max(spacing, Math.min(bounds.width - spacing, x)),
                y: Math.max(spacing, Math.min(bounds.height - spacing, y)),
            });
        }
        return positions;
    };
    CompositionPlanner.prototype.createComponent = function (index, intent, grounding, layout, position) {
        // Determine component type and motif
        var motif = this.selectMotif(intent, grounding, index);
        var type = this.determineComponentType(motif, grounding);
        // Determine size
        var size = this.determineComponentSize(intent, layout, index);
        // Determine rotation
        var rotation = this.determineRotation(intent, index);
        // Determine style
        var style = this.determineComponentStyle(intent, index);
        return {
            id: "component-".concat(index),
            type: type,
            position: position,
            size: size,
            rotation: rotation,
            style: style,
            motif: motif,
        };
    };
    CompositionPlanner.prototype.selectMotif = function (intent, grounding, index) {
        var _a, _b;
        // Prioritize required motifs
        if (intent.constraints.requiredMotifs.length > 0) {
            var motifIndex = index % intent.constraints.requiredMotifs.length;
            return intent.constraints.requiredMotifs[motifIndex];
        }
        // Use available motifs
        if (intent.motifs.length > 0) {
            var motifIndex = index % intent.motifs.length;
            return intent.motifs[motifIndex];
        }
        // Use grounding motifs if available
        if (grounding.motifs && grounding.motifs.length > 0) {
            var motifIndex = index % grounding.motifs.length;
            return (((_a = grounding.motifs[motifIndex]) === null || _a === void 0 ? void 0 : _a.name) || ((_b = grounding.motifs[motifIndex]) === null || _b === void 0 ? void 0 : _b.type));
        }
        return undefined;
    };
    CompositionPlanner.prototype.determineComponentType = function (motif, grounding) {
        // Map motifs to component types
        var motifTypeMap = new Map([
            ["circle", "circle"],
            ["square", "rect"],
            ["triangle", "polygon"],
            ["line", "line"],
            ["curve", "path"],
            ["organic", "path"],
            ["geometric", "polygon"],
        ]);
        if (motif && motifTypeMap.has(motif)) {
            return motifTypeMap.get(motif);
        }
        // Use grounding components if available
        if (grounding.components && grounding.components.length > 0) {
            var component = grounding.components[0];
            return component.type || "path";
        }
        // Default to path for flexibility
        return "path";
    };
    CompositionPlanner.prototype.determineComponentSize = function (intent, layout, index) {
        // Use layout size constraints
        var sizeConfig = intent.layout.sizes.find(function (s) { return s.type === "default"; }) ||
            intent.layout.sizes[0] || { minSize: 50, maxSize: 150 };
        // Add some variation
        var variation = 0.2; // 20% variation
        var baseSize = sizeConfig.minSize +
            (sizeConfig.maxSize - sizeConfig.minSize) * this.rng();
        var sizeVariation = 1 + (this.rng() - 0.5) * variation;
        var size = baseSize * sizeVariation;
        // Handle aspect ratio
        if (sizeConfig.aspectRatio) {
            return {
                width: size,
                height: size / sizeConfig.aspectRatio,
            };
        }
        return {
            width: size,
            height: size,
        };
    };
    CompositionPlanner.prototype.determineRotation = function (intent, index) {
        // No rotation for grid arrangements
        if (intent.layout.arrangement === "grid") {
            return 0;
        }
        // Symmetrical rotations
        if (intent.style.symmetry === "radial") {
            return (index * 360) / 8; // 8-fold symmetry
        }
        // Random rotation for organic/scattered
        if (intent.layout.arrangement === "organic" ||
            intent.layout.arrangement === "scattered") {
            return this.rng() * 360;
        }
        return 0;
    };
    CompositionPlanner.prototype.determineComponentStyle = function (intent, index) {
        var palette = intent.style.palette;
        var strokeRules = intent.style.strokeRules;
        // Cycle through palette colors
        var colorIndex = index % palette.length;
        var color = palette[colorIndex];
        var style = {};
        if (strokeRules.strokeOnly) {
            style.stroke = color;
            style.strokeWidth =
                strokeRules.minStrokeWidth +
                    (strokeRules.maxStrokeWidth - strokeRules.minStrokeWidth) * this.rng();
            style.fill = "none";
        }
        else {
            if (strokeRules.allowFill) {
                style.fill = color;
                style.opacity = 0.7 + this.rng() * 0.3; // 70-100% opacity
            }
            if (this.rng() > 0.5) {
                // 50% chance of stroke
                var strokeColorIndex = (colorIndex + 1) % palette.length;
                style.stroke = palette[strokeColorIndex];
                style.strokeWidth = strokeRules.minStrokeWidth;
            }
        }
        return style;
    };
    CompositionPlanner.prototype.calculateZIndex = function (components, intent) {
        var zIndex = [];
        // Simple z-index based on component order and arrangement
        for (var i = 0; i < components.length; i++) {
            if (intent.layout.arrangement === "centered") {
                // Center components on top
                var distanceFromCenter = Math.abs(i - components.length / 2);
                zIndex.push(Math.round(100 - distanceFromCenter * 10));
            }
            else {
                // Sequential ordering
                zIndex.push(i + 1);
            }
        }
        return zIndex;
    };
    CompositionPlanner.prototype.createSeededRandom = function (seed) {
        if (!seed) {
            return Math.random;
        }
        var state = seed;
        return function () {
            state = (state * 1664525 + 1013904223) % 4294967296;
            return state / 4294967296;
        };
    };
    return CompositionPlanner;
}());
exports.CompositionPlanner = CompositionPlanner;
