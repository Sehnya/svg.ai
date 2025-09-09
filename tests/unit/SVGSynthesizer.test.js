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
/**
 * Unit tests for SVGSynthesizer
 */
var vitest_1 = require("vitest");
var SVGSynthesizer_js_1 = require("../../server/services/SVGSynthesizer.js");
(0, vitest_1.describe)("SVGSynthesizer", function () {
    var synthesizer = new SVGSynthesizer_js_1.SVGSynthesizer();
    var createTestPlan = function () { return ({
        components: [
            {
                id: "comp-1",
                type: "circle",
                position: { x: 100, y: 100 },
                size: { width: 50, height: 50 },
                rotation: 0,
                style: {
                    fill: "#2563eb",
                    stroke: "none",
                    strokeWidth: 1,
                },
                motif: "circle",
            },
            {
                id: "comp-2",
                type: "rect",
                position: { x: 200, y: 150 },
                size: { width: 60, height: 40 },
                rotation: 0,
                style: {
                    fill: "none",
                    stroke: "#16a34a",
                    strokeWidth: 2,
                },
                motif: "square",
            },
        ],
        layout: {
            bounds: { width: 400, height: 300 },
            viewBox: "0 0 400 300",
            arrangement: "scattered",
            spacing: 20,
        },
        zIndex: [1, 2],
    }); };
    var createTestGrounding = function () { return ({
        stylePack: { id: "modern-1", colors: ["#2563eb", "#16a34a"] },
        motifs: [
            { id: "circle-1", name: "circle", type: "geometric" },
            { id: "square-1", name: "square", type: "geometric" },
        ],
        glossary: [],
        fewshot: [],
        components: [],
    }); };
    (0, vitest_1.describe)("synthesize", function () {
        (0, vitest_1.it)("should create a valid SVG document", function () { return __awaiter(void 0, void 0, void 0, function () {
            var plan, grounding, context, document;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        plan = createTestPlan();
                        grounding = createTestGrounding();
                        context = {
                            prompt: "blue circle and green square",
                            seed: 12345,
                            model: "test-synthesizer",
                            userId: "test-user",
                        };
                        return [4 /*yield*/, synthesizer.synthesize(plan, grounding, context)];
                    case 1:
                        document = _a.sent();
                        (0, vitest_1.expect)(document.components).toHaveLength(2);
                        (0, vitest_1.expect)(document.bounds).toEqual({ width: 400, height: 300 });
                        (0, vitest_1.expect)(document.palette).toContain("#2563eb");
                        (0, vitest_1.expect)(document.palette).toContain("#16a34a");
                        (0, vitest_1.expect)(document.metadata.prompt).toBe("blue circle and green square");
                        (0, vitest_1.expect)(document.metadata.model).toBe("test-synthesizer");
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should generate components with correct attributes", function () { return __awaiter(void 0, void 0, void 0, function () {
            var plan, grounding, context, document, circleComponent, rectComponent;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        plan = createTestPlan();
                        grounding = createTestGrounding();
                        context = {
                            prompt: "test shapes",
                            model: "test",
                        };
                        return [4 /*yield*/, synthesizer.synthesize(plan, grounding, context)];
                    case 1:
                        document = _a.sent();
                        circleComponent = document.components.find(function (c) { return c.element === "circle"; });
                        rectComponent = document.components.find(function (c) { return c.element === "rect"; });
                        (0, vitest_1.expect)(circleComponent).toBeDefined();
                        (0, vitest_1.expect)(circleComponent.element).toBe("circle");
                        (0, vitest_1.expect)(circleComponent.attributes.cx).toBe(100);
                        (0, vitest_1.expect)(circleComponent.attributes.cy).toBe(100);
                        (0, vitest_1.expect)(circleComponent.attributes.r).toBe(25); // radius = min(width, height) / 2
                        (0, vitest_1.expect)(rectComponent).toBeDefined();
                        (0, vitest_1.expect)(rectComponent.element).toBe("rect");
                        (0, vitest_1.expect)(rectComponent.attributes.x).toBe(170); // x - width/2
                        (0, vitest_1.expect)(rectComponent.attributes.y).toBe(130); // y - height/2
                        (0, vitest_1.expect)(rectComponent.attributes.width).toBe(60);
                        (0, vitest_1.expect)(rectComponent.attributes.height).toBe(40);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should apply styling correctly", function () { return __awaiter(void 0, void 0, void 0, function () {
            var plan, grounding, context, document, circleComponent, rectComponent;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        plan = createTestPlan();
                        grounding = createTestGrounding();
                        context = { prompt: "styled shapes" };
                        return [4 /*yield*/, synthesizer.synthesize(plan, grounding, context)];
                    case 1:
                        document = _a.sent();
                        circleComponent = document.components.find(function (c) { return c.element === "circle"; });
                        rectComponent = document.components.find(function (c) { return c.element === "rect"; });
                        (0, vitest_1.expect)(circleComponent.attributes.fill).toBe("#2563eb");
                        (0, vitest_1.expect)(rectComponent.attributes.fill).toBe("none");
                        (0, vitest_1.expect)(rectComponent.attributes.stroke).toBe("#16a34a");
                        (0, vitest_1.expect)(rectComponent.attributes["stroke-width"]).toBe(2);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should handle different component types", function () { return __awaiter(void 0, void 0, void 0, function () {
            var plan, document, triangleComponent, lineComponent;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        plan = {
                            components: [
                                {
                                    id: "triangle",
                                    type: "polygon",
                                    position: { x: 100, y: 100 },
                                    size: { width: 50, height: 50 },
                                    rotation: 0,
                                    style: { fill: "#eab308" },
                                    motif: "triangle",
                                },
                                {
                                    id: "line",
                                    type: "line",
                                    position: { x: 200, y: 100 },
                                    size: { width: 100, height: 0 },
                                    rotation: 0,
                                    style: { stroke: "#dc2626", strokeWidth: 3 },
                                },
                            ],
                            layout: {
                                bounds: { width: 400, height: 200 },
                                viewBox: "0 0 400 200",
                                arrangement: "grid",
                                spacing: 10,
                            },
                            zIndex: [1, 2],
                        };
                        return [4 /*yield*/, synthesizer.synthesize(plan, createTestGrounding(), { prompt: "shapes" })];
                    case 1:
                        document = _a.sent();
                        triangleComponent = document.components.find(function (c) { return c.id === "triangle"; });
                        lineComponent = document.components.find(function (c) { return c.id === "line"; });
                        (0, vitest_1.expect)(triangleComponent.element).toBe("polygon");
                        (0, vitest_1.expect)(triangleComponent.attributes.points).toBeDefined();
                        (0, vitest_1.expect)(typeof triangleComponent.attributes.points).toBe("string");
                        (0, vitest_1.expect)(lineComponent.element).toBe("line");
                        (0, vitest_1.expect)(lineComponent.attributes.x1).toBe(150); // x - width/2
                        (0, vitest_1.expect)(lineComponent.attributes.x2).toBe(250); // x + width/2
                        (0, vitest_1.expect)(lineComponent.attributes.y1).toBe(100);
                        (0, vitest_1.expect)(lineComponent.attributes.y2).toBe(100);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should create proper metadata", function () { return __awaiter(void 0, void 0, void 0, function () {
            var plan, grounding, context, document;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        plan = createTestPlan();
                        grounding = createTestGrounding();
                        context = {
                            prompt: "test prompt",
                            seed: 54321,
                            model: "test-model-v2",
                            userId: "user-123",
                        };
                        return [4 /*yield*/, synthesizer.synthesize(plan, grounding, context)];
                    case 1:
                        document = _a.sent();
                        (0, vitest_1.expect)(document.metadata.prompt).toBe("test prompt");
                        (0, vitest_1.expect)(document.metadata.seed).toBe(54321);
                        (0, vitest_1.expect)(document.metadata.model).toBe("test-model-v2");
                        (0, vitest_1.expect)(document.metadata.generatedAt).toBeInstanceOf(Date);
                        (0, vitest_1.expect)(document.metadata.usedObjects).toContain("modern-1");
                        (0, vitest_1.expect)(document.metadata.usedObjects).toContain("circle-1");
                        (0, vitest_1.expect)(document.metadata.usedObjects).toContain("square-1");
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should extract palette from components and grounding", function () { return __awaiter(void 0, void 0, void 0, function () {
            var plan, grounding, context, document;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        plan = createTestPlan();
                        grounding = __assign(__assign({}, createTestGrounding()), { stylePack: {
                                id: "colorful",
                                colors: ["#ff0000", "#00ff00", "#0000ff"],
                            } });
                        context = { prompt: "colorful shapes" };
                        return [4 /*yield*/, synthesizer.synthesize(plan, grounding, context)];
                    case 1:
                        document = _a.sent();
                        // Should include colors from components
                        (0, vitest_1.expect)(document.palette).toContain("#2563eb");
                        (0, vitest_1.expect)(document.palette).toContain("#16a34a");
                        // Should include colors from style pack
                        (0, vitest_1.expect)(document.palette).toContain("#ff0000");
                        (0, vitest_1.expect)(document.palette).toContain("#00ff00");
                        (0, vitest_1.expect)(document.palette).toContain("#0000ff");
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should handle empty grounding data", function () { return __awaiter(void 0, void 0, void 0, function () {
            var plan, emptyGrounding, context, document;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        plan = createTestPlan();
                        emptyGrounding = {};
                        context = { prompt: "minimal test" };
                        return [4 /*yield*/, synthesizer.synthesize(plan, emptyGrounding, context)];
                    case 1:
                        document = _a.sent();
                        (0, vitest_1.expect)(document.components).toHaveLength(2);
                        (0, vitest_1.expect)(document.metadata.usedObjects).toEqual([]);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should validate generated document", function () { return __awaiter(void 0, void 0, void 0, function () {
            var plan, grounding, context;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        plan = createTestPlan();
                        grounding = createTestGrounding();
                        context = { prompt: "validation test" };
                        // Should not throw validation errors
                        return [4 /*yield*/, (0, vitest_1.expect)(synthesizer.synthesize(plan, grounding, context)).resolves.toBeDefined()];
                    case 1:
                        // Should not throw validation errors
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)("component generation", function () {
        (0, vitest_1.it)("should handle path components with motifs", function () { return __awaiter(void 0, void 0, void 0, function () {
            var plan, document, waveComponent, leafComponent;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        plan = {
                            components: [
                                {
                                    id: "wave",
                                    type: "path",
                                    position: { x: 100, y: 100 },
                                    size: { width: 80, height: 40 },
                                    rotation: 0,
                                    style: { stroke: "#2563eb", strokeWidth: 2, fill: "none" },
                                    motif: "wave",
                                },
                                {
                                    id: "leaf",
                                    type: "path",
                                    position: { x: 200, y: 150 },
                                    size: { width: 60, height: 80 },
                                    rotation: 0,
                                    style: { fill: "#16a34a" },
                                    motif: "leaf",
                                },
                            ],
                            layout: {
                                bounds: { width: 300, height: 250 },
                                viewBox: "0 0 300 250",
                                arrangement: "organic",
                                spacing: 15,
                            },
                            zIndex: [1, 2],
                        };
                        return [4 /*yield*/, synthesizer.synthesize(plan, createTestGrounding(), { prompt: "organic shapes" })];
                    case 1:
                        document = _a.sent();
                        waveComponent = document.components.find(function (c) { return c.id === "wave"; });
                        leafComponent = document.components.find(function (c) { return c.id === "leaf"; });
                        (0, vitest_1.expect)(waveComponent.element).toBe("path");
                        (0, vitest_1.expect)(waveComponent.attributes.d).toBeDefined();
                        (0, vitest_1.expect)(typeof waveComponent.attributes.d).toBe("string");
                        (0, vitest_1.expect)(waveComponent.attributes.d).toContain("Q"); // Should contain quadratic curves for wave
                        (0, vitest_1.expect)(leafComponent.element).toBe("path");
                        (0, vitest_1.expect)(leafComponent.attributes.d).toBeDefined();
                        (0, vitest_1.expect)(leafComponent.attributes.d).toContain("Z"); // Should be closed path for leaf
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should handle ellipse components", function () { return __awaiter(void 0, void 0, void 0, function () {
            var plan, document, ellipseComponent;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        plan = {
                            components: [
                                {
                                    id: "oval",
                                    type: "ellipse",
                                    position: { x: 150, y: 100 },
                                    size: { width: 120, height: 60 },
                                    rotation: 0,
                                    style: { fill: "#9333ea", opacity: 0.8 },
                                },
                            ],
                            layout: {
                                bounds: { width: 300, height: 200 },
                                viewBox: "0 0 300 200",
                                arrangement: "centered",
                                spacing: 0,
                            },
                            zIndex: [1],
                        };
                        return [4 /*yield*/, synthesizer.synthesize(plan, createTestGrounding(), { prompt: "oval shape" })];
                    case 1:
                        document = _a.sent();
                        ellipseComponent = document.components[0];
                        (0, vitest_1.expect)(ellipseComponent.element).toBe("ellipse");
                        (0, vitest_1.expect)(ellipseComponent.attributes.cx).toBe(150);
                        (0, vitest_1.expect)(ellipseComponent.attributes.cy).toBe(100);
                        (0, vitest_1.expect)(ellipseComponent.attributes.rx).toBe(60); // width / 2
                        (0, vitest_1.expect)(ellipseComponent.attributes.ry).toBe(30); // height / 2
                        (0, vitest_1.expect)(ellipseComponent.attributes.opacity).toBe(0.8);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)("error handling", function () {
        (0, vitest_1.it)("should throw error for invalid document structure", function () { return __awaiter(void 0, void 0, void 0, function () {
            var invalidPlan;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        invalidPlan = {
                            components: [
                                {
                                    id: "invalid",
                                    type: "circle",
                                    position: { x: "invalid", y: 100 }, // Invalid position
                                    size: { width: 50, height: 50 },
                                    rotation: 0,
                                    style: {},
                                },
                            ],
                            layout: {
                                bounds: { width: 400, height: 300 },
                                viewBox: "0 0 400 300",
                                arrangement: "centered",
                                spacing: 10,
                            },
                            zIndex: [1],
                        };
                        return [4 /*yield*/, (0, vitest_1.expect)(synthesizer.synthesize(invalidPlan, createTestGrounding(), {
                                prompt: "invalid",
                            })).rejects.toThrow("Invalid SVG document")];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
