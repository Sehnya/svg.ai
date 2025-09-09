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
/**
 * Unit tests for IntentNormalizer
 */
var vitest_1 = require("vitest");
var IntentNormalizer_js_1 = require("../../server/services/IntentNormalizer.js");
(0, vitest_1.describe)("IntentNormalizer", function () {
    var normalizer = new IntentNormalizer_js_1.IntentNormalizer();
    (0, vitest_1.describe)("normalize", function () {
        (0, vitest_1.it)("should normalize a simple prompt", function () { return __awaiter(void 0, void 0, void 0, function () {
            var prompt, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prompt = "blue circle";
                        return [4 /*yield*/, normalizer.normalize(prompt)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.style.palette).toContain("#2563eb"); // blue
                        (0, vitest_1.expect)(result.motifs).toContain("circle");
                        (0, vitest_1.expect)(result.style.density).toBe("medium");
                        (0, vitest_1.expect)(result.layout.arrangement).toBe("centered");
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should extract multiple colors", function () { return __awaiter(void 0, void 0, void 0, function () {
            var prompt, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prompt = "red and green geometric shapes";
                        return [4 /*yield*/, normalizer.normalize(prompt)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.style.palette).toContain("#dc2626"); // red
                        (0, vitest_1.expect)(result.style.palette).toContain("#16a34a"); // green
                        (0, vitest_1.expect)(result.motifs).toContain("geometric");
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should handle stroke-only requirements", function () { return __awaiter(void 0, void 0, void 0, function () {
            var prompt, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prompt = "outline drawing of a tree";
                        return [4 /*yield*/, normalizer.normalize(prompt)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.style.strokeRules.strokeOnly).toBe(true);
                        (0, vitest_1.expect)(result.style.strokeRules.allowFill).toBe(false);
                        (0, vitest_1.expect)(result.constraints.strokeOnly).toBe(true);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should extract density preferences", function () { return __awaiter(void 0, void 0, void 0, function () {
            var prompt, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prompt = "simple minimal design";
                        return [4 /*yield*/, normalizer.normalize(prompt)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.style.density).toBe("sparse");
                        (0, vitest_1.expect)(result.constraints.maxElements).toBeLessThanOrEqual(10);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should handle complex prompts", function () { return __awaiter(void 0, void 0, void 0, function () {
            var prompt, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prompt = "detailed blue and yellow geometric pattern with 5 elements in a grid";
                        return [4 /*yield*/, normalizer.normalize(prompt)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.style.density).toBe("dense");
                        (0, vitest_1.expect)(result.style.palette).toContain("#2563eb"); // blue
                        (0, vitest_1.expect)(result.style.palette).toContain("#eab308"); // yellow
                        (0, vitest_1.expect)(result.layout.arrangement).toBe("grid");
                        (0, vitest_1.expect)(result.layout.counts[0].preferred).toBe(5);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should handle symmetry requirements", function () { return __awaiter(void 0, void 0, void 0, function () {
            var prompt, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prompt = "radial symmetric pattern";
                        return [4 /*yield*/, normalizer.normalize(prompt)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.style.symmetry).toBe("radial");
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should use default palette when no colors specified", function () { return __awaiter(void 0, void 0, void 0, function () {
            var prompt, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prompt = "abstract shapes";
                        return [4 /*yield*/, normalizer.normalize(prompt)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.style.palette).toHaveLength(3);
                        (0, vitest_1.expect)(result.style.palette[0]).toMatch(/^#[0-9A-Fa-f]{6}$/);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should respect context defaults", function () { return __awaiter(void 0, void 0, void 0, function () {
            var prompt, context, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prompt = "simple shape";
                        context = {
                            defaultPalette: ["#ff0000", "#00ff00"],
                            defaultSize: { width: 800, height: 600 },
                        };
                        return [4 /*yield*/, normalizer.normalize(prompt, context)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.style.palette).toEqual(["#ff0000", "#00ff00"]);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should handle monochrome requests", function () { return __awaiter(void 0, void 0, void 0, function () {
            var prompt, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prompt = "black and white design";
                        return [4 /*yield*/, normalizer.normalize(prompt)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.style.palette).toEqual(["#000000", "#ffffff"]);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should extract arrangement preferences", function () { return __awaiter(void 0, void 0, void 0, function () {
            var arrangements, _i, arrangements_1, _a, prompt_1, expected, result;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        arrangements = [
                            { prompt: "scattered elements", expected: "scattered" },
                            { prompt: "organic flowing design", expected: "organic" },
                            { prompt: "structured grid layout", expected: "grid" },
                            { prompt: "centered composition", expected: "centered" },
                        ];
                        _i = 0, arrangements_1 = arrangements;
                        _b.label = 1;
                    case 1:
                        if (!(_i < arrangements_1.length)) return [3 /*break*/, 4];
                        _a = arrangements_1[_i], prompt_1 = _a.prompt, expected = _a.expected;
                        return [4 /*yield*/, normalizer.normalize(prompt_1)];
                    case 2:
                        result = _b.sent();
                        (0, vitest_1.expect)(result.layout.arrangement).toBe(expected);
                        _b.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)("validation", function () {
        (0, vitest_1.it)("should throw error for invalid intent", function () { return __awaiter(void 0, void 0, void 0, function () {
            var normalizer, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        normalizer = new IntentNormalizer_js_1.IntentNormalizer();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, normalizer.normalize("")];
                    case 2:
                        _a.sent();
                        vitest_1.expect.fail("Should have thrown an error");
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        (0, vitest_1.expect)(error_1).toBeInstanceOf(Error);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)("edge cases", function () {
        (0, vitest_1.it)("should handle very long prompts", function () { return __awaiter(void 0, void 0, void 0, function () {
            var longPrompt, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        longPrompt = "a ".repeat(100) + "blue circle";
                        return [4 /*yield*/, normalizer.normalize(longPrompt)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.style.palette).toContain("#2563eb");
                        (0, vitest_1.expect)(result.motifs).toContain("circle");
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should handle prompts with special characters", function () { return __awaiter(void 0, void 0, void 0, function () {
            var prompt, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prompt = "blue & red circles (2x)";
                        return [4 /*yield*/, normalizer.normalize(prompt)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.style.palette).toContain("#2563eb");
                        (0, vitest_1.expect)(result.style.palette).toContain("#dc2626");
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should handle empty motifs gracefully", function () { return __awaiter(void 0, void 0, void 0, function () {
            var prompt, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prompt = "colorful design";
                        return [4 /*yield*/, normalizer.normalize(prompt)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.motifs).toBeDefined();
                        (0, vitest_1.expect)(Array.isArray(result.motifs)).toBe(true);
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
