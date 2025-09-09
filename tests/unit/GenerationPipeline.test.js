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
 * Unit tests for GenerationPipeline
 */
var vitest_1 = require("vitest");
var GenerationPipeline_js_1 = require("../../server/services/GenerationPipeline.js");
(0, vitest_1.describe)("GenerationPipeline", function () {
    var createTestRequest = function () { return ({
        prompt: "blue circle",
        size: { width: 400, height: 400 },
        palette: ["#2563eb", "#16a34a"],
        seed: 12345,
        userId: "test-user",
    }); };
    var createTestGrounding = function () { return ({
        stylePack: { name: "modern", colors: ["#2563eb"] },
        motifs: [{ id: "circle-1", name: "circle", type: "geometric" }],
        glossary: [],
        fewshot: [],
        components: [],
    }); };
    (0, vitest_1.describe)("process", function () {
        (0, vitest_1.it)("should complete full pipeline successfully", function () { return __awaiter(void 0, void 0, void 0, function () {
            var pipeline, request, grounding, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        pipeline = new GenerationPipeline_js_1.GenerationPipeline();
                        request = createTestRequest();
                        grounding = createTestGrounding();
                        return [4 /*yield*/, pipeline.process(request, grounding)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.svg).toBeDefined();
                        (0, vitest_1.expect)(result.svg).toContain("<svg");
                        (0, vitest_1.expect)(result.svg).toContain('xmlns="http://www.w3.org/2000/svg"');
                        (0, vitest_1.expect)(result.metadata).toBeDefined();
                        (0, vitest_1.expect)(result.layers).toBeDefined();
                        (0, vitest_1.expect)(Array.isArray(result.layers)).toBe(true);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should handle stroke-only requirements", function () { return __awaiter(void 0, void 0, void 0, function () {
            var pipeline, request, grounding, result, fillMatches;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        pipeline = new GenerationPipeline_js_1.GenerationPipeline();
                        request = __assign(__assign({}, createTestRequest()), { prompt: "outline drawing of circles" });
                        grounding = createTestGrounding();
                        return [4 /*yield*/, pipeline.process(request, grounding)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.svg).toBeDefined();
                        fillMatches = result.svg.match(/fill="(?!none)[^"]+"/g);
                        (0, vitest_1.expect)(fillMatches).toBeNull();
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should respect seed for deterministic generation", function () { return __awaiter(void 0, void 0, void 0, function () {
            var pipeline1, pipeline2, request, grounding, result1, result2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        pipeline1 = new GenerationPipeline_js_1.GenerationPipeline();
                        pipeline2 = new GenerationPipeline_js_1.GenerationPipeline();
                        request = createTestRequest();
                        grounding = createTestGrounding();
                        return [4 /*yield*/, pipeline1.process(request, grounding)];
                    case 1:
                        result1 = _a.sent();
                        return [4 /*yield*/, pipeline2.process(request, grounding)];
                    case 2:
                        result2 = _a.sent();
                        // Results should be identical with same seed
                        (0, vitest_1.expect)(result1.svg).toBe(result2.svg);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should include metadata in response", function () { return __awaiter(void 0, void 0, void 0, function () {
            var pipeline, request, grounding, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        pipeline = new GenerationPipeline_js_1.GenerationPipeline();
                        request = createTestRequest();
                        grounding = createTestGrounding();
                        return [4 /*yield*/, pipeline.process(request, grounding)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.metadata.prompt).toBeDefined();
                        (0, vitest_1.expect)(result.metadata.palette).toEqual(vitest_1.expect.arrayContaining(["#2563eb"]));
                        (0, vitest_1.expect)(result.metadata.description).toBeDefined();
                        (0, vitest_1.expect)(result.metadata.generatedAt).toBeInstanceOf(Date);
                        (0, vitest_1.expect)(result.metadata.model).toBe("pipeline-v1");
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should handle complex prompts", function () { return __awaiter(void 0, void 0, void 0, function () {
            var pipeline, request, grounding, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        pipeline = new GenerationPipeline_js_1.GenerationPipeline();
                        request = __assign(__assign({}, createTestRequest()), { prompt: "detailed geometric pattern with blue and red circles in a grid arrangement" });
                        grounding = createTestGrounding();
                        return [4 /*yield*/, pipeline.process(request, grounding)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.svg).toBeDefined();
                        (0, vitest_1.expect)(result.layers.length).toBeGreaterThan(1);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should validate SVG structure", function () { return __awaiter(void 0, void 0, void 0, function () {
            var pipeline, request, grounding, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        pipeline = new GenerationPipeline_js_1.GenerationPipeline();
                        request = createTestRequest();
                        grounding = createTestGrounding();
                        return [4 /*yield*/, pipeline.process(request, grounding)];
                    case 1:
                        result = _a.sent();
                        // Check basic SVG structure
                        (0, vitest_1.expect)(result.svg).toMatch(/^<svg[^>]*>/);
                        (0, vitest_1.expect)(result.svg).toMatch(/<\/svg>$/);
                        (0, vitest_1.expect)(result.svg).toContain("viewBox=");
                        (0, vitest_1.expect)(result.svg).toContain("xmlns=");
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should handle quality gate failures gracefully", function () { return __awaiter(void 0, void 0, void 0, function () {
            var pipeline, request, grounding, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        pipeline = new GenerationPipeline_js_1.GenerationPipeline();
                        request = __assign(__assign({}, createTestRequest()), { prompt: "extremely complex design with hundreds of elements" });
                        grounding = createTestGrounding();
                        return [4 /*yield*/, pipeline.process(request, grounding)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.svg).toBeDefined();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)("fallback behavior", function () {
        (0, vitest_1.it)("should fall back to rule-based generation on pipeline failure", function () { return __awaiter(void 0, void 0, void 0, function () {
            var pipeline, request, grounding, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        pipeline = new GenerationPipeline_js_1.GenerationPipeline();
                        request = {
                            prompt: "", // Empty prompt
                            size: { width: 0, height: 0 }, // Invalid size
                        };
                        grounding = {};
                        return [4 /*yield*/, pipeline.process(request, grounding)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.svg).toBeDefined();
                        (0, vitest_1.expect)(result.warnings).toContain("Used fallback generation due to pipeline failure");
                        (0, vitest_1.expect)(result.metadata.model).toBe("fallback");
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should throw error when fallback is disabled", function () { return __awaiter(void 0, void 0, void 0, function () {
            var pipeline, request, grounding, context;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        pipeline = new GenerationPipeline_js_1.GenerationPipeline();
                        request = {
                            prompt: "",
                            size: { width: 0, height: 0 },
                        };
                        grounding = {};
                        context = {
                            temperature: 0.2,
                            maxRetries: 2,
                            fallbackToRuleBased: false,
                        };
                        return [4 /*yield*/, (0, vitest_1.expect)(pipeline.process(request, grounding, context)).rejects.toThrow()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)("validation and repair", function () {
        (0, vitest_1.it)("should repair documents with too many components", function () { return __awaiter(void 0, void 0, void 0, function () {
            var pipeline, request, grounding, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        pipeline = new GenerationPipeline_js_1.GenerationPipeline();
                        request = __assign(__assign({}, createTestRequest()), { prompt: "simple design" });
                        grounding = createTestGrounding();
                        return [4 /*yield*/, pipeline.process(request, grounding)];
                    case 1:
                        result = _a.sent();
                        // Should respect max elements constraint
                        (0, vitest_1.expect)(result.layers.length).toBeLessThanOrEqual(10);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should handle stroke width validation", function () { return __awaiter(void 0, void 0, void 0, function () {
            var pipeline, request, grounding, result, _i, _a, layer, strokeWidth;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        pipeline = new GenerationPipeline_js_1.GenerationPipeline();
                        request = createTestRequest();
                        grounding = createTestGrounding();
                        return [4 /*yield*/, pipeline.process(request, grounding)];
                    case 1:
                        result = _b.sent();
                        // Check that stroke widths are valid
                        for (_i = 0, _a = result.layers; _i < _a.length; _i++) {
                            layer = _a[_i];
                            strokeWidth = layer.attributes["stroke-width"];
                            if (strokeWidth && typeof strokeWidth === "number") {
                                (0, vitest_1.expect)(strokeWidth).toBeGreaterThanOrEqual(1);
                            }
                        }
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should limit decimal precision", function () { return __awaiter(void 0, void 0, void 0, function () {
            var pipeline, request, grounding, result, decimalMatches;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        pipeline = new GenerationPipeline_js_1.GenerationPipeline();
                        request = createTestRequest();
                        grounding = createTestGrounding();
                        return [4 /*yield*/, pipeline.process(request, grounding)];
                    case 1:
                        result = _a.sent();
                        decimalMatches = result.svg.match(/\d+\.\d{3,}/g);
                        (0, vitest_1.expect)(decimalMatches).toBeNull(); // Should not have > 2 decimal places
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)("component generation", function () {
        (0, vitest_1.it)("should generate basic components when templates not available", function () { return __awaiter(void 0, void 0, void 0, function () {
            var pipeline, request, grounding, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        pipeline = new GenerationPipeline_js_1.GenerationPipeline();
                        request = __assign(__assign({}, createTestRequest()), { prompt: "unknown shape type" });
                        grounding = { components: [] };
                        return [4 /*yield*/, pipeline.process(request, grounding)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.layers.length).toBeGreaterThan(0);
                        (0, vitest_1.expect)(result.layers[0].element).toMatch(/^(circle|rect|polygon|path)$/);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should apply styling correctly", function () { return __awaiter(void 0, void 0, void 0, function () {
            var pipeline, request, grounding, result, hasRedOrGreen;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        pipeline = new GenerationPipeline_js_1.GenerationPipeline();
                        request = __assign(__assign({}, createTestRequest()), { palette: ["#ff0000", "#00ff00"] });
                        grounding = createTestGrounding();
                        return [4 /*yield*/, pipeline.process(request, grounding)];
                    case 1:
                        result = _a.sent();
                        hasRedOrGreen = result.svg.includes("#ff0000") || result.svg.includes("#00ff00");
                        (0, vitest_1.expect)(hasRedOrGreen).toBe(true);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should handle different component types", function () { return __awaiter(void 0, void 0, void 0, function () {
            var componentTypes, _i, componentTypes_1, type, pipeline, request, grounding, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        componentTypes = ["circle", "square", "triangle"];
                        _i = 0, componentTypes_1 = componentTypes;
                        _a.label = 1;
                    case 1:
                        if (!(_i < componentTypes_1.length)) return [3 /*break*/, 4];
                        type = componentTypes_1[_i];
                        pipeline = new GenerationPipeline_js_1.GenerationPipeline();
                        request = __assign(__assign({}, createTestRequest()), { prompt: "".concat(type, " shape") });
                        grounding = createTestGrounding();
                        return [4 /*yield*/, pipeline.process(request, grounding)];
                    case 2:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.svg).toBeDefined();
                        (0, vitest_1.expect)(result.layers.length).toBeGreaterThan(0);
                        _a.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)("error handling", function () {
        (0, vitest_1.it)("should handle invalid grounding data", function () { return __awaiter(void 0, void 0, void 0, function () {
            var pipeline, request, invalidGrounding, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        pipeline = new GenerationPipeline_js_1.GenerationPipeline();
                        request = createTestRequest();
                        invalidGrounding = null;
                        return [4 /*yield*/, pipeline.process(request, invalidGrounding)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.svg).toBeDefined();
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should handle missing required parameters", function () { return __awaiter(void 0, void 0, void 0, function () {
            var pipeline, request, grounding, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        pipeline = new GenerationPipeline_js_1.GenerationPipeline();
                        request = {
                            prompt: "test",
                            // Missing other parameters
                        };
                        grounding = createTestGrounding();
                        return [4 /*yield*/, pipeline.process(request, grounding)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.svg).toBeDefined();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)("performance", function () {
        (0, vitest_1.it)("should complete generation within reasonable time", function () { return __awaiter(void 0, void 0, void 0, function () {
            var pipeline, request, grounding, startTime, endTime;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        pipeline = new GenerationPipeline_js_1.GenerationPipeline();
                        request = createTestRequest();
                        grounding = createTestGrounding();
                        startTime = Date.now();
                        return [4 /*yield*/, pipeline.process(request, grounding)];
                    case 1:
                        _a.sent();
                        endTime = Date.now();
                        // Should complete within 5 seconds
                        (0, vitest_1.expect)(endTime - startTime).toBeLessThan(5000);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should handle multiple concurrent requests", function () { return __awaiter(void 0, void 0, void 0, function () {
            var pipeline, request, grounding, promises, results;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        pipeline = new GenerationPipeline_js_1.GenerationPipeline();
                        request = createTestRequest();
                        grounding = createTestGrounding();
                        promises = Array(5)
                            .fill(null)
                            .map(function () { return pipeline.process(request, grounding); });
                        return [4 /*yield*/, Promise.all(promises)];
                    case 1:
                        results = _a.sent();
                        (0, vitest_1.expect)(results).toHaveLength(5);
                        results.forEach(function (result) {
                            (0, vitest_1.expect)(result.svg).toBeDefined();
                        });
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
