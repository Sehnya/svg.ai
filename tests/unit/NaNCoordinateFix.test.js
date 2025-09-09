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
var vitest_1 = require("vitest");
var SVGSynthesizer_js_1 = require("../../server/services/SVGSynthesizer.js");
var QualityGate_js_1 = require("../../server/services/QualityGate.js");
(0, vitest_1.describe)("NaN Coordinate Fix", function () {
    var synthesizer = new SVGSynthesizer_js_1.SVGSynthesizer();
    var qualityGate = new QualityGate_js_1.QualityGate();
    (0, vitest_1.describe)("SVGSynthesizer coordinate validation", function () {
        (0, vitest_1.it)("should reject invalid position coordinates", function () { return __awaiter(void 0, void 0, void 0, function () {
            var invalidPlan, grounding, context;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        invalidPlan = {
                            components: [
                                {
                                    id: "test-1",
                                    type: "circle",
                                    position: { x: NaN, y: 100 },
                                    size: { width: 50, height: 50 },
                                    rotation: 0,
                                    style: { fill: "#ff0000" },
                                    motif: "test",
                                },
                            ],
                            layout: {
                                bounds: { width: 200, height: 200 },
                                arrangement: "centered",
                                background: "#ffffff",
                            },
                            zIndex: [1],
                        };
                        grounding = {
                            stylePack: null,
                            motifs: [],
                            glossary: [],
                            fewshot: [],
                            components: [],
                        };
                        context = {
                            prompt: "test prompt",
                            seed: 123,
                        };
                        return [4 /*yield*/, (0, vitest_1.expect)(synthesizer.synthesize(invalidPlan, grounding, context)).rejects.toThrow("Invalid position coordinates")];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should reject invalid size dimensions", function () { return __awaiter(void 0, void 0, void 0, function () {
            var invalidPlan, grounding, context;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        invalidPlan = {
                            components: [
                                {
                                    id: "test-1",
                                    type: "circle",
                                    position: { x: 100, y: 100 },
                                    size: { width: NaN, height: 50 },
                                    rotation: 0,
                                    style: { fill: "#ff0000" },
                                    motif: "test",
                                },
                            ],
                            layout: {
                                bounds: { width: 200, height: 200 },
                                arrangement: "centered",
                                background: "#ffffff",
                            },
                            zIndex: [1],
                        };
                        grounding = {
                            stylePack: null,
                            motifs: [],
                            glossary: [],
                            fewshot: [],
                            components: [],
                        };
                        context = {
                            prompt: "test prompt",
                            seed: 123,
                        };
                        return [4 /*yield*/, (0, vitest_1.expect)(synthesizer.synthesize(invalidPlan, grounding, context)).rejects.toThrow("Invalid size dimensions")];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should reject zero or negative dimensions", function () { return __awaiter(void 0, void 0, void 0, function () {
            var invalidPlan, grounding, context;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        invalidPlan = {
                            components: [
                                {
                                    id: "test-1",
                                    type: "circle",
                                    position: { x: 100, y: 100 },
                                    size: { width: 0, height: 50 },
                                    rotation: 0,
                                    style: { fill: "#ff0000" },
                                    motif: "test",
                                },
                            ],
                            layout: {
                                bounds: { width: 200, height: 200 },
                                arrangement: "centered",
                                background: "#ffffff",
                            },
                            zIndex: [1],
                        };
                        grounding = {
                            stylePack: null,
                            motifs: [],
                            glossary: [],
                            fewshot: [],
                            components: [],
                        };
                        context = {
                            prompt: "test prompt",
                            seed: 123,
                        };
                        return [4 /*yield*/, (0, vitest_1.expect)(synthesizer.synthesize(invalidPlan, grounding, context)).rejects.toThrow("Size dimensions must be positive")];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should generate valid coordinates for valid input", function () { return __awaiter(void 0, void 0, void 0, function () {
            var validPlan, grounding, context, result, component;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        validPlan = {
                            components: [
                                {
                                    id: "test-1",
                                    type: "circle",
                                    position: { x: 100, y: 100 },
                                    size: { width: 50, height: 50 },
                                    rotation: 0,
                                    style: { fill: "#ff0000" },
                                    motif: "test",
                                },
                            ],
                            layout: {
                                bounds: { width: 200, height: 200 },
                                arrangement: "centered",
                                background: "#ffffff",
                            },
                            zIndex: [1],
                        };
                        grounding = {
                            stylePack: null,
                            motifs: [],
                            glossary: [],
                            fewshot: [],
                            components: [],
                        };
                        context = {
                            prompt: "test prompt",
                            seed: 123,
                        };
                        return [4 /*yield*/, synthesizer.synthesize(validPlan, grounding, context)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.components).toHaveLength(1);
                        component = result.components[0];
                        (0, vitest_1.expect)(typeof component.attributes.cx).toBe("number");
                        (0, vitest_1.expect)(typeof component.attributes.cy).toBe("number");
                        (0, vitest_1.expect)(typeof component.attributes.r).toBe("number");
                        (0, vitest_1.expect)(isFinite(component.attributes.cx)).toBe(true);
                        (0, vitest_1.expect)(isFinite(component.attributes.cy)).toBe(true);
                        (0, vitest_1.expect)(isFinite(component.attributes.r)).toBe(true);
                        (0, vitest_1.expect)(isNaN(component.attributes.cx)).toBe(false);
                        (0, vitest_1.expect)(isNaN(component.attributes.cy)).toBe(false);
                        (0, vitest_1.expect)(isNaN(component.attributes.r)).toBe(false);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)("QualityGate NaN detection", function () {
        (0, vitest_1.it)("should detect and reject components with NaN coordinates", function () { return __awaiter(void 0, void 0, void 0, function () {
            var documentWithNaN, intent, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        documentWithNaN = {
                            components: [
                                {
                                    id: "invalid-circle",
                                    type: "circle",
                                    element: "circle",
                                    attributes: {
                                        cx: NaN,
                                        cy: 100,
                                        r: 25,
                                        fill: "#ff0000",
                                    },
                                    metadata: {
                                        motif: "test",
                                        generated: true,
                                        reused: false,
                                    },
                                },
                            ],
                            metadata: {
                                prompt: "test",
                                palette: ["#ff0000"],
                                description: "test document",
                                generatedAt: new Date(),
                                model: "test",
                                usedObjects: [],
                            },
                            bounds: { width: 200, height: 200 },
                            palette: ["#ff0000"],
                        };
                        intent = {
                            style: {
                                palette: ["#ff0000"],
                                strokeRules: { minWidth: 1, maxWidth: 5 },
                                density: "medium",
                                symmetry: "none",
                            },
                            motifs: ["test"],
                            layout: {
                                sizes: [],
                                counts: [],
                                arrangement: "centered",
                            },
                            constraints: {
                                strokeOnly: false,
                                maxElements: 10,
                                requiredMotifs: [],
                            },
                        };
                        return [4 /*yield*/, qualityGate.validate(documentWithNaN, intent)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.passed).toBe(false);
                        (0, vitest_1.expect)(result.issues.some(function (issue) { return issue.includes("invalid cx: NaN"); })).toBe(true);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should pass validation for components with valid coordinates", function () { return __awaiter(void 0, void 0, void 0, function () {
            var validDocument, intent, result, nanIssues;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        validDocument = {
                            components: [
                                {
                                    id: "valid-circle",
                                    type: "circle",
                                    element: "circle",
                                    attributes: {
                                        cx: 100,
                                        cy: 100,
                                        r: 25,
                                        fill: "#ff0000",
                                    },
                                    metadata: {
                                        motif: "test",
                                        generated: true,
                                        reused: false,
                                    },
                                },
                            ],
                            metadata: {
                                prompt: "test",
                                palette: ["#ff0000"],
                                description: "test document",
                                generatedAt: new Date(),
                                model: "test",
                                usedObjects: [],
                            },
                            bounds: { width: 200, height: 200 },
                            palette: ["#ff0000"],
                        };
                        intent = {
                            style: {
                                palette: ["#ff0000"],
                                strokeRules: { minWidth: 1, maxWidth: 5 },
                                density: "medium",
                                symmetry: "none",
                            },
                            motifs: ["test"],
                            layout: {
                                sizes: [],
                                counts: [],
                                arrangement: "centered",
                            },
                            constraints: {
                                strokeOnly: false,
                                maxElements: 10,
                                requiredMotifs: [],
                            },
                        };
                        return [4 /*yield*/, qualityGate.validate(validDocument, intent)];
                    case 1:
                        result = _a.sent();
                        nanIssues = result.issues.filter(function (issue) { return issue.includes("invalid") || issue.includes("NaN"); });
                        (0, vitest_1.expect)(nanIssues).toHaveLength(0);
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
