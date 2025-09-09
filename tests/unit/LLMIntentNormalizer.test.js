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
 * Unit tests for LLMIntentNormalizer
 */
var vitest_1 = require("vitest");
var LLMIntentNormalizer_js_1 = require("../../server/services/LLMIntentNormalizer.js");
// Mock fetch for testing
global.fetch = vitest_1.vi.fn();
(0, vitest_1.describe)("LLMIntentNormalizer", function () {
    var mockConfig = {
        model: "gpt-4o-mini",
        temperature: 0.2,
        maxTokens: 1000,
        apiKey: "test-api-key",
    };
    (0, vitest_1.describe)("normalize", function () {
        (0, vitest_1.it)("should fall back to rule-based normalization when LLM fails", function () { return __awaiter(void 0, void 0, void 0, function () {
            var normalizer, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Mock fetch to simulate API failure
                        global.fetch.mockRejectedValueOnce(new Error("API Error"));
                        normalizer = new LLMIntentNormalizer_js_1.LLMIntentNormalizer(mockConfig);
                        return [4 /*yield*/, normalizer.normalize("blue circle")];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.style.palette).toContain("#2563eb");
                        (0, vitest_1.expect)(result.motifs).toContain("circle");
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should use LLM when API is available", function () { return __awaiter(void 0, void 0, void 0, function () {
            var mockResponse, normalizer, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        mockResponse = {
                            style: {
                                palette: ["#ff0000", "#00ff00"],
                                strokeRules: {
                                    strokeOnly: false,
                                    minStrokeWidth: 1,
                                    maxStrokeWidth: 3,
                                    allowFill: true,
                                },
                                density: "medium",
                                symmetry: "none",
                            },
                            motifs: ["custom", "shape"],
                            layout: {
                                sizes: [{ type: "default", minSize: 50, maxSize: 150 }],
                                counts: [{ type: "element", min: 1, max: 3, preferred: 2 }],
                                arrangement: "centered",
                            },
                            constraints: {
                                strokeOnly: false,
                                maxElements: 10,
                                requiredMotifs: ["custom"],
                            },
                        };
                        global.fetch.mockResolvedValueOnce({
                            ok: true,
                            json: function () { return __awaiter(void 0, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    return [2 /*return*/, ({
                                            choices: [
                                                {
                                                    message: {
                                                        content: JSON.stringify(mockResponse),
                                                    },
                                                },
                                            ],
                                        })];
                                });
                            }); },
                        });
                        normalizer = new LLMIntentNormalizer_js_1.LLMIntentNormalizer(mockConfig);
                        return [4 /*yield*/, normalizer.normalize("custom shape design")];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.style.palette).toEqual(["#ff0000", "#00ff00"]);
                        (0, vitest_1.expect)(result.motifs).toEqual(["custom", "shape"]);
                        (0, vitest_1.expect)(result.constraints.requiredMotifs).toEqual(["custom"]);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should handle grounding data in prompts", function () { return __awaiter(void 0, void 0, void 0, function () {
            var mockResponse, normalizer, grounding, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        mockResponse = {
                            style: {
                                palette: ["#2563eb"],
                                strokeRules: {
                                    strokeOnly: false,
                                    minStrokeWidth: 1,
                                    maxStrokeWidth: 3,
                                    allowFill: true,
                                },
                                density: "medium",
                                symmetry: "none",
                            },
                            motifs: ["circle"],
                            layout: {
                                sizes: [{ type: "default", minSize: 50, maxSize: 150 }],
                                counts: [{ type: "element", min: 1, max: 1, preferred: 1 }],
                                arrangement: "centered",
                            },
                            constraints: {
                                strokeOnly: false,
                                maxElements: 5,
                                requiredMotifs: ["circle"],
                            },
                        };
                        global.fetch.mockResolvedValueOnce({
                            ok: true,
                            json: function () { return __awaiter(void 0, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    return [2 /*return*/, ({
                                            choices: [{ message: { content: JSON.stringify(mockResponse) } }],
                                        })];
                                });
                            }); },
                        });
                        normalizer = new LLMIntentNormalizer_js_1.LLMIntentNormalizer(mockConfig);
                        grounding = {
                            stylePack: { name: "modern", colors: ["#2563eb"] },
                            motifs: [{ name: "circle", type: "geometric" }],
                        };
                        return [4 /*yield*/, normalizer.normalize("simple design", undefined, grounding)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.motifs).toContain("circle");
                        (0, vitest_1.expect)(result.style.palette).toContain("#2563eb");
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should validate LLM responses", function () { return __awaiter(void 0, void 0, void 0, function () {
            var normalizer, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Mock invalid LLM response
                        global.fetch.mockResolvedValueOnce({
                            ok: true,
                            json: function () { return __awaiter(void 0, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    return [2 /*return*/, ({
                                            choices: [
                                                {
                                                    message: {
                                                        content: JSON.stringify({ invalid: "response" }),
                                                    },
                                                },
                                            ],
                                        })];
                                });
                            }); },
                        });
                        normalizer = new LLMIntentNormalizer_js_1.LLMIntentNormalizer(mockConfig);
                        return [4 /*yield*/, normalizer.normalize("test prompt")];
                    case 1:
                        result = _a.sent();
                        // Should get rule-based result
                        (0, vitest_1.expect)(result.style.palette).toBeDefined();
                        (0, vitest_1.expect)(result.motifs).toBeDefined();
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should handle API errors gracefully", function () { return __awaiter(void 0, void 0, void 0, function () {
            var normalizer, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Mock API error
                        global.fetch.mockResolvedValueOnce({
                            ok: false,
                            status: 429,
                            text: function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                                return [2 /*return*/, "Rate limit exceeded"];
                            }); }); },
                        });
                        normalizer = new LLMIntentNormalizer_js_1.LLMIntentNormalizer(mockConfig);
                        return [4 /*yield*/, normalizer.normalize("test prompt")];
                    case 1:
                        result = _a.sent();
                        // Should fall back to rule-based
                        (0, vitest_1.expect)(result.style.palette).toBeDefined();
                        (0, vitest_1.expect)(result.motifs).toBeDefined();
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should throw error when no API key is provided", function () { return __awaiter(void 0, void 0, void 0, function () {
            var configWithoutKey, normalizer, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        configWithoutKey = __assign(__assign({}, mockConfig), { apiKey: undefined });
                        normalizer = new LLMIntentNormalizer_js_1.LLMIntentNormalizer(configWithoutKey);
                        return [4 /*yield*/, normalizer.normalize("test prompt")];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.style.palette).toBeDefined();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)("few-shot learning", function () {
        (0, vitest_1.it)("should use few-shot examples when available", function () { return __awaiter(void 0, void 0, void 0, function () {
            var mockResponse, normalizer, grounding, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        mockResponse = {
                            style: {
                                palette: ["#2563eb"],
                                strokeRules: {
                                    strokeOnly: false,
                                    minStrokeWidth: 1,
                                    maxStrokeWidth: 3,
                                    allowFill: true,
                                },
                                density: "medium",
                                symmetry: "none",
                            },
                            motifs: ["example"],
                            layout: {
                                sizes: [{ type: "default", minSize: 50, maxSize: 150 }],
                                counts: [{ type: "element", min: 1, max: 1, preferred: 1 }],
                                arrangement: "centered",
                            },
                            constraints: { strokeOnly: false, maxElements: 5, requiredMotifs: [] },
                        };
                        global.fetch.mockResolvedValueOnce({
                            ok: true,
                            json: function () { return __awaiter(void 0, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    return [2 /*return*/, ({
                                            choices: [{ message: { content: JSON.stringify(mockResponse) } }],
                                        })];
                                });
                            }); },
                        });
                        normalizer = new LLMIntentNormalizer_js_1.LLMIntentNormalizer(mockConfig);
                        grounding = {
                            fewshot: [
                                {
                                    input: "example prompt",
                                    output: { motifs: ["example"] },
                                },
                            ],
                        };
                        return [4 /*yield*/, normalizer.normalizeWithFewShot("similar to example", undefined, grounding)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.motifs).toContain("example");
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)("error handling", function () {
        (0, vitest_1.it)("should handle malformed JSON responses", function () { return __awaiter(void 0, void 0, void 0, function () {
            var normalizer, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        global.fetch.mockResolvedValueOnce({
                            ok: true,
                            json: function () { return __awaiter(void 0, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    return [2 /*return*/, ({
                                            choices: [
                                                {
                                                    message: {
                                                        content: "invalid json {",
                                                    },
                                                },
                                            ],
                                        })];
                                });
                            }); },
                        });
                        normalizer = new LLMIntentNormalizer_js_1.LLMIntentNormalizer(mockConfig);
                        return [4 /*yield*/, normalizer.normalize("test prompt")];
                    case 1:
                        result = _a.sent();
                        // Should fall back to rule-based
                        (0, vitest_1.expect)(result.style.palette).toBeDefined();
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should handle empty API responses", function () { return __awaiter(void 0, void 0, void 0, function () {
            var normalizer, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        global.fetch.mockResolvedValueOnce({
                            ok: true,
                            json: function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                                return [2 /*return*/, ({ choices: [] })];
                            }); }); },
                        });
                        normalizer = new LLMIntentNormalizer_js_1.LLMIntentNormalizer(mockConfig);
                        return [4 /*yield*/, normalizer.normalize("test prompt")];
                    case 1:
                        result = _a.sent();
                        // Should fall back to rule-based
                        (0, vitest_1.expect)(result.style.palette).toBeDefined();
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
