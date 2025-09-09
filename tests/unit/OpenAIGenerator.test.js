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
var OpenAIGenerator_1 = require("../../server/services/OpenAIGenerator");
// Mock OpenAI
var mockOpenAI = {
    chat: {
        completions: {
            create: vitest_1.vi.fn(function () {
                return Promise.resolve({
                    choices: [
                        {
                            message: {
                                content: JSON.stringify({
                                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="40" fill="#0000FF" id="main-circle"/></svg>',
                                    warnings: [],
                                }),
                            },
                        },
                    ],
                });
            }),
        },
    },
};
// Mock the OpenAI module
vitest_1.vi.mock("openai", function () {
    return {
        default: function () {
            return mockOpenAI;
        },
    };
});
(0, vitest_1.describe)("OpenAIGenerator", function () {
    var generator;
    (0, vitest_1.beforeEach)(function () {
        // Reset mock
        mockOpenAI.chat.completions.create.mockClear();
        // Create generator with mock API key
        generator = new OpenAIGenerator_1.OpenAIGenerator("test-api-key");
    });
    (0, vitest_1.describe)("constructor", function () {
        (0, vitest_1.it)("should throw error if no API key provided", function () {
            // Clear environment variable
            var originalKey = process.env.OPENAI_API_KEY;
            delete process.env.OPENAI_API_KEY;
            (0, vitest_1.expect)(function () { return new OpenAIGenerator_1.OpenAIGenerator(); }).toThrow("OpenAI API key is required");
            // Restore environment variable
            if (originalKey) {
                process.env.OPENAI_API_KEY = originalKey;
            }
        });
        (0, vitest_1.it)("should use environment variable if no key provided to constructor", function () {
            process.env.OPENAI_API_KEY = "env-test-key";
            (0, vitest_1.expect)(function () { return new OpenAIGenerator_1.OpenAIGenerator(); }).not.toThrow();
            delete process.env.OPENAI_API_KEY;
        });
    });
    (0, vitest_1.describe)("generate", function () {
        (0, vitest_1.it)("should generate SVG using OpenAI", function () { return __awaiter(void 0, void 0, void 0, function () {
            var request, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        request = {
                            prompt: "A blue circle",
                            size: { width: 100, height: 100 },
                            palette: ["#0000FF"],
                            seed: 12345,
                        };
                        return [4 /*yield*/, generator.generate(request)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(1);
                        (0, vitest_1.expect)(result.errors).toHaveLength(0);
                        (0, vitest_1.expect)(result.svg).toContain("<svg");
                        (0, vitest_1.expect)(result.svg).toContain('xmlns="http://www.w3.org/2000/svg"');
                        (0, vitest_1.expect)(result.svg).toContain("<circle");
                        (0, vitest_1.expect)(result.meta.width).toBe(100);
                        (0, vitest_1.expect)(result.meta.height).toBe(100);
                        (0, vitest_1.expect)(result.meta.seed).toBe(12345);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should fall back to rule-based generation on OpenAI failure", function () { return __awaiter(void 0, void 0, void 0, function () {
            var request, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Mock OpenAI to fail
                        mockOpenAI.chat.completions.create.mockRejectedValueOnce(new Error("API Error"));
                        request = {
                            prompt: "A red rectangle",
                            size: { width: 200, height: 150 },
                            palette: ["#FF0000"],
                        };
                        return [4 /*yield*/, generator.generate(request)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.errors).toHaveLength(0);
                        (0, vitest_1.expect)(result.warnings).toContain("Fell back to rule-based generation");
                        (0, vitest_1.expect)(result.svg).toContain("<svg");
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should fall back if OpenAI returns invalid JSON", function () { return __awaiter(void 0, void 0, void 0, function () {
            var request, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Mock OpenAI to return invalid JSON
                        mockOpenAI.chat.completions.create.mockResolvedValueOnce({
                            choices: [
                                {
                                    message: {
                                        content: "invalid json",
                                    },
                                },
                            ],
                        });
                        request = {
                            prompt: "A green triangle",
                            size: { width: 150, height: 150 },
                            palette: ["#00FF00"],
                        };
                        return [4 /*yield*/, generator.generate(request)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.errors).toHaveLength(0);
                        (0, vitest_1.expect)(result.warnings).toContain("Fell back to rule-based generation");
                        (0, vitest_1.expect)(result.svg).toContain("<svg");
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should fall back if OpenAI returns no SVG content", function () { return __awaiter(void 0, void 0, void 0, function () {
            var request, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Mock OpenAI to return response without SVG
                        mockOpenAI.chat.completions.create.mockResolvedValueOnce({
                            choices: [
                                {
                                    message: {
                                        content: JSON.stringify({
                                            warnings: ["No SVG generated"],
                                        }),
                                    },
                                },
                            ],
                        });
                        request = {
                            prompt: "A yellow star",
                            size: { width: 120, height: 120 },
                            palette: ["#FFFF00"],
                        };
                        return [4 /*yield*/, generator.generate(request)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.errors).toHaveLength(0);
                        (0, vitest_1.expect)(result.warnings).toContain("Fell back to rule-based generation");
                        (0, vitest_1.expect)(result.svg).toContain("<svg");
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should handle invalid request parameters", function () { return __awaiter(void 0, void 0, void 0, function () {
            var request, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        request = {
                            prompt: "", // Invalid: empty prompt
                            size: { width: 100, height: 100 },
                        };
                        return [4 /*yield*/, generator.generate(request)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.errors.length).toBeGreaterThan(0);
                        (0, vitest_1.expect)(result.svg).toBe("");
                        (0, vitest_1.expect)(mockOpenAI.chat.completions.create).not.toHaveBeenCalled();
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should include OpenAI warnings in response", function () { return __awaiter(void 0, void 0, void 0, function () {
            var request, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Mock OpenAI to return warnings
                        mockOpenAI.chat.completions.create.mockResolvedValueOnce({
                            choices: [
                                {
                                    message: {
                                        content: JSON.stringify({
                                            svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="40" fill="#0000FF" id="main-circle"/></svg>',
                                            warnings: ["Complex prompt simplified"],
                                        }),
                                    },
                                },
                            ],
                        });
                        request = {
                            prompt: "A very complex design with multiple elements",
                            size: { width: 100, height: 100 },
                        };
                        return [4 /*yield*/, generator.generate(request)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.errors).toHaveLength(0);
                        (0, vitest_1.expect)(result.warnings).toContain("Complex prompt simplified");
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should use provided palette in system prompt", function () { return __awaiter(void 0, void 0, void 0, function () {
            var request, call, systemMessage;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        request = {
                            prompt: "A colorful design",
                            size: { width: 100, height: 100 },
                            palette: ["#FF0000", "#00FF00", "#0000FF"],
                        };
                        return [4 /*yield*/, generator.generate(request)];
                    case 1:
                        _a.sent();
                        call = mockOpenAI.chat.completions.create.mock.calls[0][0];
                        systemMessage = call.messages.find(function (m) { return m.role === "system"; });
                        (0, vitest_1.expect)(systemMessage.content).toContain("#FF0000, #00FF00, #0000FF");
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should include seed in user prompt", function () { return __awaiter(void 0, void 0, void 0, function () {
            var request, call, userMessage;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        request = {
                            prompt: "A design",
                            size: { width: 100, height: 100 },
                            seed: 54321,
                        };
                        return [4 /*yield*/, generator.generate(request)];
                    case 1:
                        _a.sent();
                        call = mockOpenAI.chat.completions.create.mock.calls[0][0];
                        userMessage = call.messages.find(function (m) { return m.role === "user"; });
                        (0, vitest_1.expect)(userMessage.content).toContain("seed 54321");
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
