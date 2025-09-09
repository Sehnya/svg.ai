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
var RuleBasedGenerator_1 = require("../../server/services/RuleBasedGenerator");
(0, vitest_1.describe)("RuleBasedGenerator", function () {
    var generator;
    (0, vitest_1.beforeEach)(function () {
        generator = new RuleBasedGenerator_1.RuleBasedGenerator();
    });
    (0, vitest_1.describe)("generate", function () {
        (0, vitest_1.it)("should generate a valid SVG for a circle prompt", function () { return __awaiter(void 0, void 0, void 0, function () {
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
                        (0, vitest_1.expect)(result.errors).toHaveLength(0);
                        (0, vitest_1.expect)(result.svg).toContain("<svg");
                        (0, vitest_1.expect)(result.svg).toContain('xmlns="http://www.w3.org/2000/svg"');
                        (0, vitest_1.expect)(result.svg).toContain('viewBox="0 0 100 100"');
                        (0, vitest_1.expect)(result.svg).toContain("<circle");
                        (0, vitest_1.expect)(result.meta.width).toBe(100);
                        (0, vitest_1.expect)(result.meta.height).toBe(100);
                        (0, vitest_1.expect)(result.meta.seed).toBe(12345);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should generate a valid SVG for a rectangle prompt", function () { return __awaiter(void 0, void 0, void 0, function () {
            var request, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        request = {
                            prompt: "A red rectangle",
                            size: { width: 200, height: 150 },
                            palette: ["#FF0000"],
                            seed: 54321,
                        };
                        return [4 /*yield*/, generator.generate(request)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.errors).toHaveLength(0);
                        (0, vitest_1.expect)(result.svg).toContain("<svg");
                        (0, vitest_1.expect)(result.svg).toContain('viewBox="0 0 200 150"');
                        (0, vitest_1.expect)(result.svg).toContain("<rect");
                        (0, vitest_1.expect)(result.meta.width).toBe(200);
                        (0, vitest_1.expect)(result.meta.height).toBe(150);
                        (0, vitest_1.expect)(result.meta.seed).toBe(54321);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should generate a valid SVG for a triangle prompt", function () { return __awaiter(void 0, void 0, void 0, function () {
            var request, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        request = {
                            prompt: "A green triangle",
                            size: { width: 150, height: 150 },
                            palette: ["#00FF00"],
                        };
                        return [4 /*yield*/, generator.generate(request)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.errors).toHaveLength(0);
                        (0, vitest_1.expect)(result.svg).toContain("<polygon");
                        (0, vitest_1.expect)(result.svg).toContain("points=");
                        (0, vitest_1.expect)(result.meta.width).toBe(150);
                        (0, vitest_1.expect)(result.meta.height).toBe(150);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should generate a valid SVG for a star prompt", function () { return __awaiter(void 0, void 0, void 0, function () {
            var request, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        request = {
                            prompt: "A yellow star",
                            size: { width: 120, height: 120 },
                            palette: ["#FFFF00"],
                        };
                        return [4 /*yield*/, generator.generate(request)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.errors).toHaveLength(0);
                        (0, vitest_1.expect)(result.svg).toContain("<polygon");
                        (0, vitest_1.expect)(result.svg).toContain('id="main-star"');
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should generate an icon for icon-related prompts", function () { return __awaiter(void 0, void 0, void 0, function () {
            var request, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        request = {
                            prompt: "A house icon",
                            size: { width: 100, height: 100 },
                            palette: ["#8B4513", "#FF0000"],
                        };
                        return [4 /*yield*/, generator.generate(request)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.errors).toHaveLength(0);
                        (0, vitest_1.expect)(result.svg).toContain("<g");
                        (0, vitest_1.expect)(result.svg).toContain('id="house-icon"');
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should generate a pattern for pattern-related prompts", function () { return __awaiter(void 0, void 0, void 0, function () {
            var request, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        request = {
                            prompt: "A dot pattern",
                            size: { width: 200, height: 200 },
                            palette: ["#000000"],
                        };
                        return [4 /*yield*/, generator.generate(request)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.errors).toHaveLength(0);
                        (0, vitest_1.expect)(result.svg).toContain('id="dot-pattern"');
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should handle invalid requests", function () { return __awaiter(void 0, void 0, void 0, function () {
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
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should use default palette when none provided", function () { return __awaiter(void 0, void 0, void 0, function () {
            var request, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        request = {
                            prompt: "A circle",
                            size: { width: 100, height: 100 },
                        };
                        return [4 /*yield*/, generator.generate(request)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.errors).toHaveLength(0);
                        (0, vitest_1.expect)(result.meta.palette).toEqual(["#3B82F6", "#1E40AF", "#1D4ED8"]);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should generate deterministic results with same seed", function () { return __awaiter(void 0, void 0, void 0, function () {
            var request, result1, result2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        request = {
                            prompt: "A circle",
                            size: { width: 100, height: 100 },
                            seed: 12345,
                        };
                        return [4 /*yield*/, generator.generate(request)];
                    case 1:
                        result1 = _a.sent();
                        return [4 /*yield*/, generator.generate(request)];
                    case 2:
                        result2 = _a.sent();
                        (0, vitest_1.expect)(result1.svg).toBe(result2.svg);
                        (0, vitest_1.expect)(result1.meta.seed).toBe(result2.meta.seed);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should include layer information", function () { return __awaiter(void 0, void 0, void 0, function () {
            var request, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        request = {
                            prompt: "A blue circle",
                            size: { width: 100, height: 100 },
                        };
                        return [4 /*yield*/, generator.generate(request)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.errors).toHaveLength(0);
                        (0, vitest_1.expect)(result.layers.length).toBeGreaterThan(0);
                        (0, vitest_1.expect)(result.layers[0]).toHaveProperty("id");
                        (0, vitest_1.expect)(result.layers[0]).toHaveProperty("label");
                        (0, vitest_1.expect)(result.layers[0]).toHaveProperty("type");
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should handle background color requests", function () { return __awaiter(void 0, void 0, void 0, function () {
            var request, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        request = {
                            prompt: "A circle with blue background",
                            size: { width: 100, height: 100 },
                            palette: ["#FF0000", "#0000FF"],
                        };
                        return [4 /*yield*/, generator.generate(request)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.errors).toHaveLength(0);
                        (0, vitest_1.expect)(result.svg).toContain('<rect width="100%" height="100%"');
                        (0, vitest_1.expect)(result.meta.backgroundColor).toBe("#0000FF");
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
