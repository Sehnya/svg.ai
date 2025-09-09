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
 * Unit tests for CompositionPlanner
 */
var vitest_1 = require("vitest");
var CompositionPlanner_js_1 = require("../../server/services/CompositionPlanner.js");
(0, vitest_1.describe)("CompositionPlanner", function () {
    var createTestIntent = function (overrides) {
        if (overrides === void 0) { overrides = {}; }
        return (__assign({ style: {
                palette: ["#2563eb", "#16a34a", "#eab308"],
                strokeRules: {
                    strokeOnly: false,
                    minStrokeWidth: 1,
                    maxStrokeWidth: 3,
                    allowFill: true,
                },
                density: "medium",
                symmetry: "none",
            }, motifs: ["circle", "square"], layout: {
                sizes: [{ type: "default", minSize: 50, maxSize: 150 }],
                counts: [{ type: "element", min: 3, max: 7, preferred: 5 }],
                arrangement: "centered",
            }, constraints: {
                strokeOnly: false,
                maxElements: 25,
                requiredMotifs: ["circle"],
            } }, overrides));
    };
    var createTestGrounding = function () { return ({
        stylePack: { name: "modern", colors: ["#2563eb"] },
        motifs: [
            { name: "circle", type: "geometric" },
            { name: "square", type: "geometric" },
        ],
        glossary: [],
        fewshot: [],
        components: [{ type: "circle", template: "basic-circle" }],
    }); };
    (0, vitest_1.describe)("plan", function () {
        (0, vitest_1.it)("should create a valid composition plan", function () { return __awaiter(void 0, void 0, void 0, function () {
            var planner, intent, grounding, plan;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        planner = new CompositionPlanner_js_1.CompositionPlanner();
                        intent = createTestIntent();
                        grounding = createTestGrounding();
                        return [4 /*yield*/, planner.plan(intent, grounding)];
                    case 1:
                        plan = _a.sent();
                        (0, vitest_1.expect)(plan.layout).toBeDefined();
                        (0, vitest_1.expect)(plan.components).toBeDefined();
                        (0, vitest_1.expect)(plan.zIndex).toBeDefined();
                        (0, vitest_1.expect)(plan.components.length).toBeGreaterThan(0);
                        (0, vitest_1.expect)(plan.zIndex.length).toBe(plan.components.length);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should respect component count preferences", function () { return __awaiter(void 0, void 0, void 0, function () {
            var planner, intent, grounding, plan;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        planner = new CompositionPlanner_js_1.CompositionPlanner();
                        intent = createTestIntent({
                            layout: {
                                sizes: [{ type: "default", minSize: 50, maxSize: 150 }],
                                counts: [{ type: "element", min: 2, max: 4, preferred: 3 }],
                                arrangement: "grid",
                            },
                        });
                        grounding = createTestGrounding();
                        return [4 /*yield*/, planner.plan(intent, grounding)];
                    case 1:
                        plan = _a.sent();
                        (0, vitest_1.expect)(plan.components.length).toBe(3);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should respect max elements constraint", function () { return __awaiter(void 0, void 0, void 0, function () {
            var planner, intent, grounding, plan;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        planner = new CompositionPlanner_js_1.CompositionPlanner();
                        intent = createTestIntent({
                            constraints: {
                                strokeOnly: false,
                                maxElements: 2,
                                requiredMotifs: [],
                            },
                        });
                        grounding = createTestGrounding();
                        return [4 /*yield*/, planner.plan(intent, grounding)];
                    case 1:
                        plan = _a.sent();
                        (0, vitest_1.expect)(plan.components.length).toBeLessThanOrEqual(2);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should create different arrangements", function () { return __awaiter(void 0, void 0, void 0, function () {
            var arrangements, _i, arrangements_1, arrangement, planner, intent, grounding, plan;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        arrangements = [
                            "grid",
                            "centered",
                            "scattered",
                            "organic",
                        ];
                        _i = 0, arrangements_1 = arrangements;
                        _a.label = 1;
                    case 1:
                        if (!(_i < arrangements_1.length)) return [3 /*break*/, 4];
                        arrangement = arrangements_1[_i];
                        planner = new CompositionPlanner_js_1.CompositionPlanner();
                        intent = createTestIntent({
                            layout: {
                                sizes: [{ type: "default", minSize: 50, maxSize: 150 }],
                                counts: [{ type: "element", min: 4, max: 6, preferred: 4 }],
                                arrangement: arrangement,
                            },
                        });
                        grounding = createTestGrounding();
                        return [4 /*yield*/, planner.plan(intent, grounding)];
                    case 2:
                        plan = _a.sent();
                        (0, vitest_1.expect)(plan.layout.arrangement).toBe(arrangement);
                        (0, vitest_1.expect)(plan.components.length).toBe(4);
                        _a.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should use deterministic positioning with seed", function () { return __awaiter(void 0, void 0, void 0, function () {
            var seed, planner1, planner2, intent, grounding, plan1, plan2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        seed = 12345;
                        planner1 = new CompositionPlanner_js_1.CompositionPlanner(seed);
                        planner2 = new CompositionPlanner_js_1.CompositionPlanner(seed);
                        intent = createTestIntent();
                        grounding = createTestGrounding();
                        return [4 /*yield*/, planner1.plan(intent, grounding)];
                    case 1:
                        plan1 = _a.sent();
                        return [4 /*yield*/, planner2.plan(intent, grounding)];
                    case 2:
                        plan2 = _a.sent();
                        (0, vitest_1.expect)(plan1.components[0].position).toEqual(plan2.components[0].position);
                        (0, vitest_1.expect)(plan1.components[0].size).toEqual(plan2.components[0].size);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should assign motifs to components", function () { return __awaiter(void 0, void 0, void 0, function () {
            var planner, intent, grounding, plan, motifs;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        planner = new CompositionPlanner_js_1.CompositionPlanner();
                        intent = createTestIntent({
                            motifs: ["circle", "square", "triangle"],
                        });
                        grounding = createTestGrounding();
                        return [4 /*yield*/, planner.plan(intent, grounding)];
                    case 1:
                        plan = _a.sent();
                        motifs = plan.components.map(function (c) { return c.motif; }).filter(Boolean);
                        (0, vitest_1.expect)(motifs.length).toBeGreaterThan(0);
                        (0, vitest_1.expect)(motifs.every(function (m) { return intent.motifs.includes(m); })).toBe(true);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should apply stroke-only styling", function () { return __awaiter(void 0, void 0, void 0, function () {
            var planner, intent, grounding, plan, _i, _a, component;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        planner = new CompositionPlanner_js_1.CompositionPlanner();
                        intent = createTestIntent({
                            style: {
                                palette: ["#000000"],
                                strokeRules: {
                                    strokeOnly: true,
                                    minStrokeWidth: 2,
                                    maxStrokeWidth: 4,
                                    allowFill: false,
                                },
                                density: "sparse",
                                symmetry: "none",
                            },
                            constraints: {
                                strokeOnly: true,
                                maxElements: 25,
                                requiredMotifs: [],
                            },
                        });
                        grounding = createTestGrounding();
                        return [4 /*yield*/, planner.plan(intent, grounding)];
                    case 1:
                        plan = _b.sent();
                        for (_i = 0, _a = plan.components; _i < _a.length; _i++) {
                            component = _a[_i];
                            (0, vitest_1.expect)(component.style.fill).toBe("none");
                            (0, vitest_1.expect)(component.style.stroke).toBeDefined();
                            (0, vitest_1.expect)(component.style.strokeWidth).toBeGreaterThanOrEqual(2);
                        }
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should handle context parameters", function () { return __awaiter(void 0, void 0, void 0, function () {
            var planner, intent, grounding, context, plan;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        planner = new CompositionPlanner_js_1.CompositionPlanner();
                        intent = createTestIntent();
                        grounding = createTestGrounding();
                        context = {
                            targetSize: { width: 800, height: 600 },
                            seed: 54321,
                        };
                        return [4 /*yield*/, planner.plan(intent, grounding, context)];
                    case 1:
                        plan = _a.sent();
                        (0, vitest_1.expect)(plan.layout.bounds).toEqual(context.targetSize);
                        (0, vitest_1.expect)(plan.layout.viewBox).toBe("0 0 800 600");
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)("layout generation", function () {
        (0, vitest_1.it)("should generate grid positions correctly", function () { return __awaiter(void 0, void 0, void 0, function () {
            var planner, intent, grounding, plan, positions, _i, positions_1, pos;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        planner = new CompositionPlanner_js_1.CompositionPlanner();
                        intent = createTestIntent({
                            layout: {
                                sizes: [{ type: "default", minSize: 50, maxSize: 150 }],
                                counts: [{ type: "element", min: 4, max: 4, preferred: 4 }],
                                arrangement: "grid",
                            },
                        });
                        grounding = createTestGrounding();
                        return [4 /*yield*/, planner.plan(intent, grounding)];
                    case 1:
                        plan = _a.sent();
                        positions = plan.components.map(function (c) { return c.position; });
                        (0, vitest_1.expect)(positions.length).toBe(4);
                        // Check that positions are within bounds
                        for (_i = 0, positions_1 = positions; _i < positions_1.length; _i++) {
                            pos = positions_1[_i];
                            (0, vitest_1.expect)(pos.x).toBeGreaterThanOrEqual(0);
                            (0, vitest_1.expect)(pos.y).toBeGreaterThanOrEqual(0);
                            (0, vitest_1.expect)(pos.x).toBeLessThanOrEqual(plan.layout.bounds.width);
                            (0, vitest_1.expect)(pos.y).toBeLessThanOrEqual(plan.layout.bounds.height);
                        }
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should generate centered positions", function () { return __awaiter(void 0, void 0, void 0, function () {
            var planner, intent, grounding, plan, centerX, centerY;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        planner = new CompositionPlanner_js_1.CompositionPlanner();
                        intent = createTestIntent({
                            layout: {
                                sizes: [{ type: "default", minSize: 50, maxSize: 150 }],
                                counts: [{ type: "element", min: 1, max: 1, preferred: 1 }],
                                arrangement: "centered",
                            },
                        });
                        grounding = createTestGrounding();
                        return [4 /*yield*/, planner.plan(intent, grounding)];
                    case 1:
                        plan = _a.sent();
                        centerX = plan.layout.bounds.width / 2;
                        centerY = plan.layout.bounds.height / 2;
                        (0, vitest_1.expect)(plan.components[0].position.x).toBe(centerX);
                        (0, vitest_1.expect)(plan.components[0].position.y).toBe(centerY);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should apply spacing based on density", function () { return __awaiter(void 0, void 0, void 0, function () {
            var densities, expectedSpacing, i, planner, intent, grounding, plan;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        densities = ["sparse", "medium", "dense"];
                        expectedSpacing = [40, 20, 10];
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < densities.length)) return [3 /*break*/, 4];
                        planner = new CompositionPlanner_js_1.CompositionPlanner();
                        intent = createTestIntent({
                            style: {
                                palette: ["#2563eb"],
                                strokeRules: {
                                    strokeOnly: false,
                                    minStrokeWidth: 1,
                                    maxStrokeWidth: 3,
                                    allowFill: true,
                                },
                                density: densities[i],
                                symmetry: "none",
                            },
                        });
                        grounding = createTestGrounding();
                        return [4 /*yield*/, planner.plan(intent, grounding)];
                    case 2:
                        plan = _a.sent();
                        (0, vitest_1.expect)(plan.layout.spacing).toBe(expectedSpacing[i]);
                        _a.label = 3;
                    case 3:
                        i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)("z-index calculation", function () {
        (0, vitest_1.it)("should assign z-index values", function () { return __awaiter(void 0, void 0, void 0, function () {
            var planner, intent, grounding, plan;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        planner = new CompositionPlanner_js_1.CompositionPlanner();
                        intent = createTestIntent();
                        grounding = createTestGrounding();
                        return [4 /*yield*/, planner.plan(intent, grounding)];
                    case 1:
                        plan = _a.sent();
                        (0, vitest_1.expect)(plan.zIndex.length).toBe(plan.components.length);
                        (0, vitest_1.expect)(plan.zIndex.every(function (z) { return typeof z === "number"; })).toBe(true);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should prioritize center components for centered arrangement", function () { return __awaiter(void 0, void 0, void 0, function () {
            var planner, intent, grounding, plan, maxZIndex, centerIndex;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        planner = new CompositionPlanner_js_1.CompositionPlanner();
                        intent = createTestIntent({
                            layout: {
                                sizes: [{ type: "default", minSize: 50, maxSize: 150 }],
                                counts: [{ type: "element", min: 5, max: 5, preferred: 5 }],
                                arrangement: "centered",
                            },
                        });
                        grounding = createTestGrounding();
                        return [4 /*yield*/, planner.plan(intent, grounding)];
                    case 1:
                        plan = _a.sent();
                        maxZIndex = Math.max.apply(Math, plan.zIndex);
                        centerIndex = Math.floor(plan.components.length / 2);
                        (0, vitest_1.expect)(plan.zIndex[centerIndex]).toBeGreaterThanOrEqual(maxZIndex - 10);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)("error handling", function () {
        (0, vitest_1.it)("should handle empty grounding data", function () { return __awaiter(void 0, void 0, void 0, function () {
            var planner, intent, emptyGrounding, plan;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        planner = new CompositionPlanner_js_1.CompositionPlanner();
                        intent = createTestIntent();
                        emptyGrounding = {};
                        return [4 /*yield*/, planner.plan(intent, emptyGrounding)];
                    case 1:
                        plan = _a.sent();
                        (0, vitest_1.expect)(plan.components.length).toBeGreaterThan(0);
                        (0, vitest_1.expect)(plan.layout).toBeDefined();
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should validate generated plan", function () { return __awaiter(void 0, void 0, void 0, function () {
            var planner, intent, grounding;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        planner = new CompositionPlanner_js_1.CompositionPlanner();
                        intent = createTestIntent();
                        grounding = createTestGrounding();
                        // This should not throw
                        return [4 /*yield*/, (0, vitest_1.expect)(planner.plan(intent, grounding)).resolves.toBeDefined()];
                    case 1:
                        // This should not throw
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
