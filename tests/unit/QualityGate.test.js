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
/**
 * Unit tests for QualityGate
 */
var vitest_1 = require("vitest");
var QualityGate_js_1 = require("../../server/services/QualityGate.js");
(0, vitest_1.describe)("QualityGate", function () {
    var qualityGate = new QualityGate_js_1.QualityGate();
    var createTestDocument = function (overrides) {
        if (overrides === void 0) { overrides = {}; }
        return (__assign({ components: [
                {
                    id: "comp-1",
                    type: "circle",
                    element: "circle",
                    attributes: {
                        cx: 100,
                        cy: 100,
                        r: 25,
                        fill: "#2563eb",
                        "stroke-width": 1,
                    },
                    metadata: { motif: "circle", generated: true },
                },
                {
                    id: "comp-2",
                    type: "square",
                    element: "rect",
                    attributes: {
                        x: 150,
                        y: 150,
                        width: 50,
                        height: 50,
                        fill: "none",
                        stroke: "#16a34a",
                        "stroke-width": 2,
                    },
                    metadata: { motif: "square", generated: true },
                },
            ], metadata: {
                prompt: "test shapes",
                palette: ["#2563eb", "#16a34a"],
                description: "Test document",
                generatedAt: new Date(),
                model: "test",
            }, bounds: { width: 400, height: 300 }, palette: ["#2563eb", "#16a34a"] }, overrides));
    };
    var createTestIntent = function (overrides) {
        if (overrides === void 0) { overrides = {}; }
        return (__assign({ style: {
                palette: ["#2563eb", "#16a34a"],
                strokeRules: {
                    strokeOnly: false,
                    minStrokeWidth: 1,
                    maxStrokeWidth: 4,
                    allowFill: true,
                },
                density: "medium",
                symmetry: "none",
            }, motifs: ["circle", "square"], layout: {
                sizes: [{ type: "default", minSize: 20, maxSize: 100 }],
                counts: [{ type: "element", min: 1, max: 5, preferred: 2 }],
                arrangement: "centered",
            }, constraints: {
                strokeOnly: false,
                maxElements: 10,
                requiredMotifs: ["circle"],
            } }, overrides));
    };
    (0, vitest_1.describe)("validate", function () {
        (0, vitest_1.it)("should pass validation for a good document", function () { return __awaiter(void 0, void 0, void 0, function () {
            var document, intent, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        document = createTestDocument();
                        intent = createTestIntent();
                        return [4 /*yield*/, qualityGate.validate(document, intent)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.passed).toBe(true);
                        (0, vitest_1.expect)(result.issues).toHaveLength(0);
                        (0, vitest_1.expect)(result.score).toBeGreaterThan(70);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should fail validation for too many components", function () { return __awaiter(void 0, void 0, void 0, function () {
            var document, intent, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        document = createTestDocument({
                            components: Array(15)
                                .fill(null)
                                .map(function (_, i) { return ({
                                id: "comp-".concat(i),
                                type: "circle",
                                element: "circle",
                                attributes: { cx: 50, cy: 50, r: 10 },
                                metadata: { generated: true },
                            }); }),
                        });
                        intent = createTestIntent({
                            constraints: { strokeOnly: false, maxElements: 5, requiredMotifs: [] },
                        });
                        return [4 /*yield*/, qualityGate.validate(document, intent)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.passed).toBe(false);
                        (0, vitest_1.expect)(result.issues).toContain("Too many components: 15 > 5");
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should fail validation for missing required motifs", function () { return __awaiter(void 0, void 0, void 0, function () {
            var document, intent, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        document = createTestDocument({
                            components: [
                                {
                                    id: "comp-1",
                                    type: "square",
                                    element: "rect",
                                    attributes: { x: 0, y: 0, width: 50, height: 50 },
                                    metadata: { motif: "square", generated: true },
                                },
                            ],
                        });
                        intent = createTestIntent({
                            constraints: {
                                strokeOnly: false,
                                maxElements: 10,
                                requiredMotifs: ["circle", "triangle"],
                            },
                        });
                        return [4 /*yield*/, qualityGate.validate(document, intent)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.passed).toBe(false);
                        (0, vitest_1.expect)(result.issues).toContain("Missing required motifs: circle, triangle");
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should fail validation for stroke-only violations", function () { return __awaiter(void 0, void 0, void 0, function () {
            var document, intent, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        document = createTestDocument({
                            components: [
                                {
                                    id: "comp-1",
                                    type: "circle",
                                    element: "circle",
                                    attributes: { cx: 100, cy: 100, r: 25, fill: "#2563eb" }, // Has fill
                                    metadata: { generated: true },
                                },
                            ],
                        });
                        intent = createTestIntent({
                            constraints: { strokeOnly: true, maxElements: 10, requiredMotifs: [] },
                        });
                        return [4 /*yield*/, qualityGate.validate(document, intent)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.passed).toBe(false);
                        (0, vitest_1.expect)(result.issues).toContain("1 components have fill but stroke-only is required");
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should fail validation for invalid stroke widths", function () { return __awaiter(void 0, void 0, void 0, function () {
            var document, intent, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        document = createTestDocument({
                            components: [
                                {
                                    id: "comp-1",
                                    type: "circle",
                                    element: "circle",
                                    attributes: {
                                        cx: 100,
                                        cy: 100,
                                        r: 25,
                                        stroke: "#000",
                                        "stroke-width": 0.5,
                                    },
                                    metadata: { generated: true },
                                },
                            ],
                        });
                        intent = createTestIntent();
                        return [4 /*yield*/, qualityGate.validate(document, intent)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.passed).toBe(false);
                        (0, vitest_1.expect)(result.issues).toContain("Stroke width 0.5 is below minimum of 1");
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should warn about high decimal precision", function () { return __awaiter(void 0, void 0, void 0, function () {
            var document, intent, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        document = createTestDocument({
                            components: [
                                {
                                    id: "comp-1",
                                    type: "circle",
                                    element: "circle",
                                    attributes: { cx: 100.12345, cy: 100.6789, r: 25.111 }, // High precision
                                    metadata: { generated: true },
                                },
                            ],
                        });
                        intent = createTestIntent();
                        return [4 /*yield*/, qualityGate.validate(document, intent)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.warnings).toContain("3 attributes have >2 decimal places");
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should fail validation for invalid bounds", function () { return __awaiter(void 0, void 0, void 0, function () {
            var document, intent, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        document = createTestDocument({
                            bounds: { width: 0, height: 300 }, // Invalid width
                        });
                        intent = createTestIntent();
                        return [4 /*yield*/, qualityGate.validate(document, intent)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.passed).toBe(false);
                        (0, vitest_1.expect)(result.issues).toContain("Invalid or missing viewBox");
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should warn about components out of bounds", function () { return __awaiter(void 0, void 0, void 0, function () {
            var document, intent, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        document = createTestDocument({
                            components: [
                                {
                                    id: "comp-1",
                                    type: "circle",
                                    element: "circle",
                                    attributes: { cx: 450, cy: 100, r: 25 }, // x + r > bounds.width (400)
                                    metadata: { generated: true },
                                },
                            ],
                            bounds: { width: 400, height: 300 },
                        });
                        intent = createTestIntent();
                        return [4 /*yield*/, qualityGate.validate(document, intent)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.warnings).toContain("1 components are partially out of bounds");
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should handle empty document", function () { return __awaiter(void 0, void 0, void 0, function () {
            var document, intent, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        document = createTestDocument({
                            components: [],
                        });
                        intent = createTestIntent();
                        return [4 /*yield*/, qualityGate.validate(document, intent)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.passed).toBe(false);
                        (0, vitest_1.expect)(result.issues).toContain("Document has no components");
                        (0, vitest_1.expect)(result.score).toBe(0);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)("structural integrity checks", function () {
        (0, vitest_1.it)("should detect components out of bounds", function () { return __awaiter(void 0, void 0, void 0, function () {
            var document, intent, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        document = createTestDocument({
                            components: [
                                {
                                    id: "out-of-bounds",
                                    type: "rect",
                                    element: "rect",
                                    attributes: { x: 350, y: 250, width: 100, height: 100 }, // Extends beyond 400x300
                                    metadata: { generated: true },
                                },
                            ],
                        });
                        intent = createTestIntent();
                        return [4 /*yield*/, qualityGate.validate(document, intent)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.warnings.some(function (w) { return w.includes("out of bounds"); })).toBe(true);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should warn about very small bounds", function () { return __awaiter(void 0, void 0, void 0, function () {
            var document, intent, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        document = createTestDocument({
                            bounds: { width: 10, height: 10 },
                        });
                        intent = createTestIntent();
                        return [4 /*yield*/, qualityGate.validate(document, intent)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.warnings).toContain("Document bounds are very small");
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should warn about very large bounds", function () { return __awaiter(void 0, void 0, void 0, function () {
            var document, intent, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        document = createTestDocument({
                            bounds: { width: 3000, height: 2500 },
                        });
                        intent = createTestIntent();
                        return [4 /*yield*/, qualityGate.validate(document, intent)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.warnings).toContain("Document bounds are very large");
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)("motif compliance checks", function () {
        (0, vitest_1.it)("should warn about motif imbalance", function () { return __awaiter(void 0, void 0, void 0, function () {
            var document, intent, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        document = createTestDocument({
                            components: __spreadArray(__spreadArray([], Array(6)
                                .fill(null)
                                .map(function (_, i) { return ({
                                id: "circle-".concat(i),
                                type: "circle",
                                element: "circle",
                                attributes: { cx: 50 + i * 20, cy: 50, r: 10 },
                                metadata: { motif: "circle", generated: true },
                            }); }), true), [
                                {
                                    id: "square-1",
                                    type: "square",
                                    element: "rect",
                                    attributes: { x: 200, y: 50, width: 20, height: 20 },
                                    metadata: { motif: "square", generated: true },
                                },
                            ], false),
                        });
                        intent = createTestIntent();
                        return [4 /*yield*/, qualityGate.validate(document, intent)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.warnings).toContain("Motif distribution is imbalanced");
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should warn about unexpected motifs", function () { return __awaiter(void 0, void 0, void 0, function () {
            var document, intent, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        document = createTestDocument({
                            components: [
                                {
                                    id: "triangle",
                                    type: "triangle",
                                    element: "polygon",
                                    attributes: { points: "50,10 90,90 10,90" },
                                    metadata: { motif: "triangle", generated: true },
                                },
                            ],
                        });
                        intent = createTestIntent({
                            motifs: ["circle", "square"], // triangle not in allowed motifs
                        });
                        return [4 /*yield*/, qualityGate.validate(document, intent)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.warnings).toContain("Unexpected motifs present: triangle");
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)("style consistency checks", function () {
        (0, vitest_1.it)("should warn about unauthorized colors", function () { return __awaiter(void 0, void 0, void 0, function () {
            var document, intent, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        document = createTestDocument({
                            components: [
                                {
                                    id: "comp-1",
                                    type: "circle",
                                    element: "circle",
                                    attributes: { cx: 100, cy: 100, r: 25, fill: "#ff0000" }, // Red not in palette
                                    metadata: { generated: true },
                                },
                            ],
                            palette: ["#2563eb", "#16a34a"], // Blue and green only
                        });
                        intent = createTestIntent();
                        return [4 /*yield*/, qualityGate.validate(document, intent)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.warnings).toContain("Colors used outside palette: #ff0000");
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should warn about inconsistent stroke widths", function () { return __awaiter(void 0, void 0, void 0, function () {
            var document, intent, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        document = createTestDocument({
                            components: [
                                {
                                    id: "thin",
                                    type: "circle",
                                    element: "circle",
                                    attributes: {
                                        cx: 50,
                                        cy: 50,
                                        r: 20,
                                        stroke: "#000",
                                        "stroke-width": 1,
                                    },
                                    metadata: { generated: true },
                                },
                                {
                                    id: "thick",
                                    type: "circle",
                                    element: "circle",
                                    attributes: {
                                        cx: 150,
                                        cy: 50,
                                        r: 20,
                                        stroke: "#000",
                                        "stroke-width": 8,
                                    },
                                    metadata: { generated: true },
                                },
                            ],
                        });
                        intent = createTestIntent();
                        return [4 /*yield*/, qualityGate.validate(document, intent)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.warnings).toContain("Stroke widths vary significantly");
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)("technical quality checks", function () {
        (0, vitest_1.it)("should detect invalid components", function () { return __awaiter(void 0, void 0, void 0, function () {
            var document, intent, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        document = createTestDocument({
                            components: [
                                {
                                    id: "invalid-circle",
                                    type: "circle",
                                    element: "circle",
                                    attributes: { cx: 100, cy: 100, r: -5 }, // Negative radius
                                    metadata: { generated: true },
                                },
                            ],
                        });
                        intent = createTestIntent();
                        return [4 /*yield*/, qualityGate.validate(document, intent)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.issues).toContain("1 components have invalid attributes");
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should detect degenerate shapes", function () { return __awaiter(void 0, void 0, void 0, function () {
            var document, intent, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        document = createTestDocument({
                            components: [
                                {
                                    id: "zero-rect",
                                    type: "rect",
                                    element: "rect",
                                    attributes: { x: 100, y: 100, width: 0, height: 50 }, // Zero width
                                    metadata: { generated: true },
                                },
                                {
                                    id: "point-line",
                                    type: "line",
                                    element: "line",
                                    attributes: { x1: 100, y1: 100, x2: 100, y2: 100 }, // Point line
                                    metadata: { generated: true },
                                },
                            ],
                        });
                        intent = createTestIntent();
                        return [4 /*yield*/, qualityGate.validate(document, intent)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.warnings).toContain("2 components are degenerate (zero size)");
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should warn about complex documents", function () { return __awaiter(void 0, void 0, void 0, function () {
            var document, intent, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        document = createTestDocument({
                            components: Array(25)
                                .fill(null)
                                .map(function (_, i) { return ({
                                id: "comp-".concat(i),
                                type: "circle",
                                element: "circle",
                                attributes: { cx: 50, cy: 50, r: 10 },
                                metadata: { generated: true },
                            }); }),
                        });
                        intent = createTestIntent({
                            constraints: { strokeOnly: false, maxElements: 50, requiredMotifs: [] },
                        });
                        return [4 /*yield*/, qualityGate.validate(document, intent)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.warnings).toContain("Document is quite complex");
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)("quality scoring", function () {
        (0, vitest_1.it)("should give high scores to good documents", function () { return __awaiter(void 0, void 0, void 0, function () {
            var document, intent, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        document = createTestDocument();
                        intent = createTestIntent();
                        return [4 /*yield*/, qualityGate.validate(document, intent)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.score).toBeGreaterThan(90);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should give low scores to problematic documents", function () { return __awaiter(void 0, void 0, void 0, function () {
            var document, intent, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        document = createTestDocument({
                            components: [],
                            bounds: { width: 0, height: 0 },
                        });
                        intent = createTestIntent();
                        return [4 /*yield*/, qualityGate.validate(document, intent)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.score).toBeLessThan(30);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should calculate intermediate scores for mixed quality", function () { return __awaiter(void 0, void 0, void 0, function () {
            var document, intent, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        document = createTestDocument({
                            components: [
                                {
                                    id: "good",
                                    type: "circle",
                                    element: "circle",
                                    attributes: { cx: 100, cy: 100, r: 25, fill: "#2563eb" },
                                    metadata: { motif: "circle", generated: true },
                                },
                                {
                                    id: "problematic",
                                    type: "rect",
                                    element: "rect",
                                    attributes: {
                                        x: 150.12345,
                                        y: 150.6789,
                                        width: 50,
                                        height: 50,
                                        fill: "#ff0000",
                                    },
                                    metadata: { generated: true },
                                },
                            ],
                        });
                        intent = createTestIntent();
                        return [4 /*yield*/, qualityGate.validate(document, intent)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.score).toBeGreaterThan(50);
                        (0, vitest_1.expect)(result.score).toBeLessThan(90);
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
