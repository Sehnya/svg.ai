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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenerationPipeline = void 0;
var IntentNormalizer_js_1 = require("./IntentNormalizer.js");
var LLMIntentNormalizer_js_1 = require("./LLMIntentNormalizer.js");
var CompositionPlanner_js_1 = require("./CompositionPlanner.js");
var ComponentLibrary_js_1 = require("./ComponentLibrary.js");
var SVGSynthesizer_js_1 = require("./SVGSynthesizer.js");
var QualityGate_js_1 = require("./QualityGate.js");
var SVGRenderer_js_1 = require("./SVGRenderer.js");
var GenerationPipeline = /** @class */ (function () {
    function GenerationPipeline() {
        this.intentNormalizer = new IntentNormalizer_js_1.IntentNormalizer();
        // Initialize LLM normalizer if API key is available
        if (process.env.OPENAI_API_KEY) {
            this.llmNormalizer = new LLMIntentNormalizer_js_1.LLMIntentNormalizer({
                model: process.env.OPENAI_MODEL || "gpt-4o-mini",
                temperature: 0.2,
                maxTokens: 1000,
                apiKey: process.env.OPENAI_API_KEY,
            });
        }
        this.compositionPlanner = new CompositionPlanner_js_1.CompositionPlanner();
        this.componentLibrary = new ComponentLibrary_js_1.ComponentLibrary();
        this.svgSynthesizer = new SVGSynthesizer_js_1.SVGSynthesizer();
        this.qualityGate = new QualityGate_js_1.QualityGate();
        this.svgRenderer = new SVGRenderer_js_1.SVGRenderer();
    }
    GenerationPipeline.prototype.process = function (request_1, grounding_1) {
        return __awaiter(this, arguments, void 0, function (request, grounding, context) {
            var intent, plan, document_1, qaResult, svg, response, error_1;
            if (context === void 0) { context = {
                temperature: 0.2,
                maxRetries: 2,
                fallbackToRuleBased: true,
            }; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 7, , 8]);
                        return [4 /*yield*/, this.normalizeIntent(request, grounding)];
                    case 1:
                        intent = _a.sent();
                        return [4 /*yield*/, this.planComposition(intent, grounding, request)];
                    case 2:
                        plan = _a.sent();
                        return [4 /*yield*/, this.synthesizeDocument(plan, intent, grounding, request)];
                    case 3:
                        document_1 = _a.sent();
                        return [4 /*yield*/, this.validateAndRepair(document_1, intent, context.maxRetries)];
                    case 4:
                        // Stage 4: Validate and repair (max 2 attempts)
                        document_1 = _a.sent();
                        return [4 /*yield*/, this.qualityGate.validate(document_1, intent)];
                    case 5:
                        qaResult = _a.sent();
                        if (!qaResult.passed) {
                            throw new Error("QA failed: ".concat(qaResult.issues.join(", ")));
                        }
                        return [4 /*yield*/, this.svgRenderer.render(document_1)];
                    case 6:
                        svg = _a.sent();
                        response = {
                            svg: svg,
                            metadata: document_1.metadata,
                            layers: document_1.components,
                            warnings: qaResult.warnings,
                        };
                        return [2 /*return*/, response];
                    case 7:
                        error_1 = _a.sent();
                        if (context.fallbackToRuleBased) {
                            console.warn("Pipeline failed, falling back to rule-based generation:", error_1);
                            return [2 /*return*/, this.fallbackGeneration(request)];
                        }
                        throw error_1;
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    GenerationPipeline.prototype.normalizeIntent = function (request, grounding) {
        return __awaiter(this, void 0, void 0, function () {
            var normalizationContext, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        normalizationContext = {
                            defaultPalette: request.palette,
                            defaultSize: request.size,
                        };
                        if (!this.llmNormalizer) return [3 /*break*/, 4];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.llmNormalizer.normalize(request.prompt, normalizationContext, grounding)];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        error_2 = _a.sent();
                        console.warn("LLM normalization failed, using rule-based fallback:", error_2);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/, this.intentNormalizer.normalize(request.prompt, normalizationContext)];
                }
            });
        });
    };
    GenerationPipeline.prototype.planComposition = function (intent, grounding, request) {
        return __awaiter(this, void 0, void 0, function () {
            var planningContext;
            return __generator(this, function (_a) {
                // Update planner with seed for deterministic generation
                this.compositionPlanner = new CompositionPlanner_js_1.CompositionPlanner(request.seed);
                planningContext = {
                    targetSize: request.size || { width: 400, height: 400 },
                    seed: request.seed,
                };
                return [2 /*return*/, this.compositionPlanner.plan(intent, grounding, planningContext)];
            });
        });
    };
    GenerationPipeline.prototype.synthesizeDocument = function (plan, intent, grounding, request) {
        return __awaiter(this, void 0, void 0, function () {
            var context;
            return __generator(this, function (_a) {
                context = {
                    prompt: request.prompt,
                    seed: request.seed,
                    model: request.model || "pipeline-v1",
                    userId: request.userId,
                };
                return [2 /*return*/, this.svgSynthesizer.synthesize(plan, grounding, context)];
            });
        });
    };
    GenerationPipeline.prototype.createComponent = function (componentPlan, intent, grounding) {
        return __awaiter(this, void 0, void 0, function () {
            var templates, template;
            return __generator(this, function (_a) {
                // Try to use component library first
                if (componentPlan.motif) {
                    templates = this.componentLibrary.findTemplates({
                        tags: [componentPlan.motif],
                        type: componentPlan.type,
                    });
                    if (templates.length > 0) {
                        template = templates[0];
                        return [2 /*return*/, this.componentLibrary.instantiateComponent(template.id, componentPlan.style, componentPlan.position, componentPlan.size)];
                    }
                }
                // Fallback to basic component generation
                return [2 /*return*/, this.createBasicComponent(componentPlan)];
            });
        });
    };
    GenerationPipeline.prototype.createBasicComponent = function (componentPlan) {
        var id = componentPlan.id, type = componentPlan.type, position = componentPlan.position, size = componentPlan.size, style = componentPlan.style;
        var attributes = {};
        // Set common attributes based on type
        switch (type) {
            case "circle":
                attributes.cx = position.x;
                attributes.cy = position.y;
                attributes.r = Math.min(size.width, size.height) / 2;
                break;
            case "rect":
                attributes.x = position.x - size.width / 2;
                attributes.y = position.y - size.height / 2;
                attributes.width = size.width;
                attributes.height = size.height;
                break;
            case "polygon":
                // Create a simple triangle
                var points = [
                    "".concat(position.x, ",").concat(position.y - size.height / 2),
                    "".concat(position.x - size.width / 2, ",").concat(position.y + size.height / 2),
                    "".concat(position.x + size.width / 2, ",").concat(position.y + size.height / 2),
                ].join(" ");
                attributes.points = points;
                break;
            default:
                // Default to circle
                attributes.cx = position.x;
                attributes.cy = position.y;
                attributes.r = Math.min(size.width, size.height) / 2;
                type = "circle";
        }
        // Apply style
        if (style.fill && style.fill !== "none") {
            attributes.fill = style.fill;
        }
        if (style.stroke) {
            attributes.stroke = style.stroke;
        }
        if (style.strokeWidth) {
            attributes["stroke-width"] = style.strokeWidth;
        }
        if (style.opacity) {
            attributes.opacity = style.opacity;
        }
        return {
            id: id,
            type: componentPlan.motif || type,
            element: type,
            attributes: attributes,
            metadata: {
                motif: componentPlan.motif,
                generated: true,
                reused: false,
            },
        };
    };
    GenerationPipeline.prototype.validateAndRepair = function (document, intent, maxRetries) {
        return __awaiter(this, void 0, void 0, function () {
            var currentDocument, retries, validationResult;
            return __generator(this, function (_a) {
                currentDocument = document;
                retries = 0;
                while (retries < maxRetries) {
                    validationResult = this.validateDocument(currentDocument, intent);
                    if (validationResult.isValid) {
                        return [2 /*return*/, currentDocument];
                    }
                    // Attempt repair
                    currentDocument = this.repairDocument(currentDocument, validationResult.issues);
                    retries++;
                }
                // If we can't repair, return the best attempt
                return [2 /*return*/, currentDocument];
            });
        });
    };
    GenerationPipeline.prototype.validateDocument = function (document, intent) {
        var _a;
        var issues = [];
        // Check component count
        if (document.components.length > intent.constraints.maxElements) {
            issues.push("Too many components: ".concat(document.components.length, " > ").concat(intent.constraints.maxElements));
        }
        // Check required motifs
        var presentMotifs = new Set(document.components.map(function (c) { var _a; return (_a = c.metadata) === null || _a === void 0 ? void 0 : _a.motif; }).filter(Boolean));
        for (var _i = 0, _b = intent.constraints.requiredMotifs; _i < _b.length; _i++) {
            var requiredMotif = _b[_i];
            if (!presentMotifs.has(requiredMotif)) {
                issues.push("Missing required motif: ".concat(requiredMotif));
            }
        }
        // Check stroke rules
        if (intent.constraints.strokeOnly) {
            for (var _c = 0, _d = document.components; _c < _d.length; _c++) {
                var component = _d[_c];
                if (component.attributes.fill && component.attributes.fill !== "none") {
                    issues.push("Component ".concat(component.id, " has fill but stroke-only is required"));
                }
            }
        }
        // Check for invalid numeric values (NaN, Infinity)
        for (var _e = 0, _f = document.components; _e < _f.length; _e++) {
            var component = _f[_e];
            for (var _g = 0, _h = Object.entries(component.attributes); _g < _h.length; _g++) {
                var _j = _h[_g], key = _j[0], value = _j[1];
                if (typeof value === "number" && !this.isValidNumber(value)) {
                    issues.push("Component ".concat(component.id, " has invalid ").concat(key, ": ").concat(value));
                }
            }
        }
        // Check stroke width requirements
        for (var _k = 0, _l = document.components; _k < _l.length; _k++) {
            var component = _l[_k];
            var strokeWidth = component.attributes["stroke-width"];
            if (typeof strokeWidth === "number" &&
                component.attributes.stroke &&
                strokeWidth < 1) {
                issues.push("Component ".concat(component.id, " has stroke-width ").concat(strokeWidth, " below minimum of 1"));
            }
        }
        // Check decimal precision (max 2 decimal places)
        for (var _m = 0, _o = document.components; _m < _o.length; _m++) {
            var component = _o[_m];
            for (var _p = 0, _q = Object.entries(component.attributes); _p < _q.length; _p++) {
                var _r = _q[_p], key = _r[0], value = _r[1];
                if (typeof value === "number" &&
                    !Number.isInteger(value) &&
                    this.isValidNumber(value)) {
                    var decimals = ((_a = value.toString().split(".")[1]) === null || _a === void 0 ? void 0 : _a.length) || 0;
                    if (decimals > 2) {
                        issues.push("Component ".concat(component.id, " has ").concat(key, " with >2 decimal places: ").concat(value));
                    }
                }
            }
        }
        // Check bounds validity
        if (!document.bounds.width || !document.bounds.height) {
            issues.push("Document has invalid bounds");
        }
        return {
            isValid: issues.length === 0,
            issues: issues,
        };
    };
    GenerationPipeline.prototype.isValidNumber = function (value) {
        return typeof value === "number" && isFinite(value) && !isNaN(value);
    };
    GenerationPipeline.prototype.repairDocument = function (document, issues) {
        var _this = this;
        var repairedDocument = __assign({}, document);
        for (var _i = 0, issues_1 = issues; _i < issues_1.length; _i++) {
            var issue = issues_1[_i];
            if (issue.includes("Too many components")) {
                // Remove excess components (keep the first ones as they're likely most important)
                var maxMatch = issue.match(/> (\d+)/);
                var maxElements = maxMatch ? parseInt(maxMatch[1]) : 10;
                repairedDocument.components = repairedDocument.components.slice(0, maxElements);
            }
            if (issue.includes("stroke-only is required")) {
                // Remove fills from all components
                repairedDocument.components = repairedDocument.components.map(function (component) { return (__assign(__assign({}, component), { attributes: __assign(__assign({}, component.attributes), { fill: "none" }) })); });
            }
            if (issue.includes("invalid") && issue.includes("NaN")) {
                // Fix invalid numeric values
                repairedDocument.components = repairedDocument.components.map(function (component) {
                    var fixedAttributes = __assign({}, component.attributes);
                    for (var _i = 0, _a = Object.entries(fixedAttributes); _i < _a.length; _i++) {
                        var _b = _a[_i], key = _b[0], value = _b[1];
                        if (typeof value === "number" && !_this.isValidNumber(value)) {
                            // Replace with sensible defaults based on attribute type
                            if (key.includes("x") || key.includes("y")) {
                                fixedAttributes[key] = 0; // Position defaults to 0
                            }
                            else if (key.includes("width") || key.includes("height")) {
                                fixedAttributes[key] = 10; // Size defaults to 10
                            }
                            else if (key.includes("r")) {
                                fixedAttributes[key] = 5; // Radius defaults to 5
                            }
                            else {
                                fixedAttributes[key] = 1; // Other numeric values default to 1
                            }
                        }
                    }
                    return __assign(__assign({}, component), { attributes: fixedAttributes });
                });
            }
            if (issue.includes("stroke-width") && issue.includes("below minimum")) {
                // Fix stroke width below minimum
                repairedDocument.components = repairedDocument.components.map(function (component) {
                    if (typeof component.attributes["stroke-width"] === "number" &&
                        component.attributes["stroke-width"] < 1) {
                        return __assign(__assign({}, component), { attributes: __assign(__assign({}, component.attributes), { "stroke-width": 1 }) });
                    }
                    return component;
                });
            }
            if (issue.includes("decimal places")) {
                // Fix excessive decimal precision
                repairedDocument.components = repairedDocument.components.map(function (component) {
                    var fixedAttributes = __assign({}, component.attributes);
                    for (var _i = 0, _a = Object.entries(fixedAttributes); _i < _a.length; _i++) {
                        var _b = _a[_i], key = _b[0], value = _b[1];
                        if (typeof value === "number" &&
                            !Number.isInteger(value) &&
                            _this.isValidNumber(value)) {
                            fixedAttributes[key] = Math.round(value * 100) / 100; // Round to 2 decimal places
                        }
                    }
                    return __assign(__assign({}, component), { attributes: fixedAttributes });
                });
            }
            if (issue.includes("invalid bounds")) {
                // Fix invalid document bounds
                if (!repairedDocument.bounds.width ||
                    repairedDocument.bounds.width <= 0) {
                    repairedDocument.bounds.width = 400; // Default width
                }
                if (!repairedDocument.bounds.height ||
                    repairedDocument.bounds.height <= 0) {
                    repairedDocument.bounds.height = 400; // Default height
                }
            }
            if (issue.includes("Missing required motif")) {
                // Add missing motifs by creating simple components
                var motifMatch = issue.match(/Missing required motif: (.+)/);
                if (motifMatch) {
                    var missingMotif = motifMatch[1];
                    var newComponent = this.createSimpleMotifComponent(missingMotif, repairedDocument.bounds);
                    repairedDocument.components.push(newComponent);
                }
            }
        }
        return repairedDocument;
    };
    GenerationPipeline.prototype.createSimpleMotifComponent = function (motif, bounds) {
        var centerX = bounds.width / 2;
        var centerY = bounds.height / 2;
        var size = Math.min(bounds.width, bounds.height) / 8;
        // Create a simple component based on motif type
        switch (motif.toLowerCase()) {
            case "circle":
            case "sun":
            case "moon":
                return {
                    id: "repair-".concat(motif, "-").concat(Date.now()),
                    type: motif,
                    element: "circle",
                    attributes: {
                        cx: centerX,
                        cy: centerY,
                        r: size,
                        fill: "none",
                        stroke: "#333",
                        "stroke-width": 1,
                    },
                    metadata: {
                        motif: motif,
                        generated: true,
                        reused: false,
                        repaired: true,
                    },
                };
            case "star":
                return {
                    id: "repair-".concat(motif, "-").concat(Date.now()),
                    type: motif,
                    element: "polygon",
                    attributes: {
                        points: this.generateStarPoints(centerX, centerY, size),
                        fill: "none",
                        stroke: "#333",
                        "stroke-width": 1,
                    },
                    metadata: {
                        motif: motif,
                        generated: true,
                        reused: false,
                        repaired: true,
                    },
                };
            default:
                // Default to a simple rectangle
                return {
                    id: "repair-".concat(motif, "-").concat(Date.now()),
                    type: motif,
                    element: "rect",
                    attributes: {
                        x: centerX - size,
                        y: centerY - size,
                        width: size * 2,
                        height: size * 2,
                        fill: "none",
                        stroke: "#333",
                        "stroke-width": 1,
                    },
                    metadata: {
                        motif: motif,
                        generated: true,
                        reused: false,
                        repaired: true,
                    },
                };
        }
    };
    GenerationPipeline.prototype.generateStarPoints = function (centerX, centerY, size) {
        var points = [];
        for (var i = 0; i < 10; i++) {
            var angle = (i * Math.PI) / 5;
            var radius = i % 2 === 0 ? size : size / 2;
            var x = centerX + Math.cos(angle - Math.PI / 2) * radius;
            var y = centerY + Math.sin(angle - Math.PI / 2) * radius;
            points.push("".concat(x.toFixed(2), ",").concat(y.toFixed(2)));
        }
        return points.join(" ");
    };
    GenerationPipeline.prototype.fallbackGeneration = function (request) {
        return __awaiter(this, void 0, void 0, function () {
            var svg, metadata;
            return __generator(this, function (_a) {
                svg = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 400 400\" width=\"400\" height=\"400\">\n      <circle cx=\"200\" cy=\"200\" r=\"100\" fill=\"#2563eb\" stroke=\"none\"/>\n      <text x=\"200\" y=\"350\" text-anchor=\"middle\" fill=\"#666\" font-size=\"12\">Fallback: ".concat(request.prompt, "</text>\n    </svg>");
                metadata = {
                    prompt: request.prompt,
                    seed: request.seed,
                    palette: request.palette || ["#2563eb"],
                    description: "Fallback generation",
                    generatedAt: new Date(),
                    model: "fallback",
                };
                return [2 /*return*/, {
                        svg: svg,
                        metadata: metadata,
                        layers: [],
                        warnings: ["Used fallback generation due to pipeline failure"],
                    }];
            });
        });
    };
    return GenerationPipeline;
}());
exports.GenerationPipeline = GenerationPipeline;
