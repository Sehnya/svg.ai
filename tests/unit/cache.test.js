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
var cache_1 = require("../../server/utils/cache");
var tokenOptimizer_1 = require("../../server/utils/tokenOptimizer");
(0, vitest_1.describe)("CacheManager", function () {
    var cacheManager;
    (0, vitest_1.beforeEach)(function () {
        cacheManager = new cache_1.CacheManager({
            enabled: true,
            ttlMinutes: 1, // Short TTL for testing
            maxEntries: 100,
            cleanupIntervalMinutes: 1,
        });
    });
    (0, vitest_1.afterEach)(function () {
        cacheManager.destroy();
    });
    (0, vitest_1.describe)("generateCacheKey", function () {
        (0, vitest_1.it)("should generate consistent keys for same input", function () {
            var key1 = cacheManager.generateCacheKey("test prompt", "user123");
            var key2 = cacheManager.generateCacheKey("test prompt", "user123");
            (0, vitest_1.expect)(key1).toBe(key2);
        });
        (0, vitest_1.it)("should generate different keys for different inputs", function () {
            var key1 = cacheManager.generateCacheKey("test prompt", "user123");
            var key2 = cacheManager.generateCacheKey("different prompt", "user123");
            var key3 = cacheManager.generateCacheKey("test prompt", "user456");
            (0, vitest_1.expect)(key1).not.toBe(key2);
            (0, vitest_1.expect)(key1).not.toBe(key3);
            (0, vitest_1.expect)(key2).not.toBe(key3);
        });
        (0, vitest_1.it)("should handle undefined userId", function () {
            var key1 = cacheManager.generateCacheKey("test prompt");
            var key2 = cacheManager.generateCacheKey("test prompt", undefined);
            (0, vitest_1.expect)(key1).toBe(key2);
        });
        (0, vitest_1.it)("should include additional context in key generation", function () {
            var key1 = cacheManager.generateCacheKey("test", "user", {
                model: "gpt4",
            });
            var key2 = cacheManager.generateCacheKey("test", "user", {
                model: "claude",
            });
            (0, vitest_1.expect)(key1).not.toBe(key2);
        });
    });
    (0, vitest_1.describe)("cache operations", function () {
        (0, vitest_1.it)("should store and retrieve data", function () { return __awaiter(void 0, void 0, void 0, function () {
            var key, data, retrieved;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        key = "test-key";
                        data = { test: "data", array: [1, 2, 3] };
                        return [4 /*yield*/, cacheManager.set(key, data)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, cacheManager.get(key)];
                    case 2:
                        retrieved = _a.sent();
                        (0, vitest_1.expect)(retrieved).toEqual(data);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should return null for non-existent keys", function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, cacheManager.get("non-existent-key")];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result).toBeNull();
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should respect TTL", function () { return __awaiter(void 0, void 0, void 0, function () {
            var key, data, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        key = "ttl-test";
                        data = { test: "ttl" };
                        // Set with very short TTL
                        return [4 /*yield*/, cacheManager.set(key, data, 0.01)];
                    case 1:
                        // Set with very short TTL
                        _a.sent(); // 0.6 seconds
                        return [4 /*yield*/, cacheManager.get(key)];
                    case 2:
                        result = _a.sent();
                        (0, vitest_1.expect)(result).toEqual(data);
                        // Wait for expiration
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                    case 3:
                        // Wait for expiration
                        _a.sent();
                        return [4 /*yield*/, cacheManager.get(key)];
                    case 4:
                        // Should be expired
                        result = _a.sent();
                        (0, vitest_1.expect)(result).toBeNull();
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should update existing entries", function () { return __awaiter(void 0, void 0, void 0, function () {
            var key, data1, data2, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        key = "update-test";
                        data1 = { version: 1 };
                        data2 = { version: 2 };
                        return [4 /*yield*/, cacheManager.set(key, data1)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, cacheManager.set(key, data2)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, cacheManager.get(key)];
                    case 3:
                        result = _a.sent();
                        (0, vitest_1.expect)(result).toEqual(data2);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)("cache management", function () {
        (0, vitest_1.it)("should clear all entries", function () { return __awaiter(void 0, void 0, void 0, function () {
            var result1, result2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, cacheManager.set("key1", { data: 1 })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, cacheManager.set("key2", { data: 2 })];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, cacheManager.clear()];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, cacheManager.get("key1")];
                    case 4:
                        result1 = _a.sent();
                        return [4 /*yield*/, cacheManager.get("key2")];
                    case 5:
                        result2 = _a.sent();
                        (0, vitest_1.expect)(result1).toBeNull();
                        (0, vitest_1.expect)(result2).toBeNull();
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should delete specific entries", function () { return __awaiter(void 0, void 0, void 0, function () {
            var result1, result2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, cacheManager.set("key1", { data: 1 })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, cacheManager.set("key2", { data: 2 })];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, cacheManager.delete("key1")];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, cacheManager.get("key1")];
                    case 4:
                        result1 = _a.sent();
                        return [4 /*yield*/, cacheManager.get("key2")];
                    case 5:
                        result2 = _a.sent();
                        (0, vitest_1.expect)(result1).toBeNull();
                        (0, vitest_1.expect)(result2).toEqual({ data: 2 });
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should cleanup expired entries", function () { return __awaiter(void 0, void 0, void 0, function () {
            var result, result1, result2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // Set entries with very short TTL
                    return [4 /*yield*/, cacheManager.set("key1", { data: 1 }, 0.01)];
                    case 1:
                        // Set entries with very short TTL
                        _a.sent();
                        return [4 /*yield*/, cacheManager.set("key2", { data: 2 }, 60)];
                    case 2:
                        _a.sent(); // Long TTL
                        // Wait for first entry to expire
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                    case 3:
                        // Wait for first entry to expire
                        _a.sent();
                        return [4 /*yield*/, cacheManager.cleanup()];
                    case 4:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.deletedCount).toBeGreaterThan(0);
                        return [4 /*yield*/, cacheManager.get("key1")];
                    case 5:
                        result1 = _a.sent();
                        return [4 /*yield*/, cacheManager.get("key2")];
                    case 6:
                        result2 = _a.sent();
                        (0, vitest_1.expect)(result1).toBeNull();
                        (0, vitest_1.expect)(result2).toEqual({ data: 2 });
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)("metrics and health", function () {
        (0, vitest_1.it)("should track cache metrics", function () { return __awaiter(void 0, void 0, void 0, function () {
            var metrics;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, cacheManager.set("key1", { data: 1 })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, cacheManager.get("key1")];
                    case 2:
                        _a.sent(); // Hit
                        return [4 /*yield*/, cacheManager.get("nonexistent")];
                    case 3:
                        _a.sent(); // Miss
                        return [4 /*yield*/, cacheManager.getMetrics()];
                    case 4:
                        metrics = _a.sent();
                        (0, vitest_1.expect)(metrics.hits).toBe(1);
                        (0, vitest_1.expect)(metrics.misses).toBe(1);
                        (0, vitest_1.expect)(metrics.hitRate).toBe(0.5);
                        (0, vitest_1.expect)(metrics.totalEntries).toBeGreaterThan(0);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should perform health checks", function () { return __awaiter(void 0, void 0, void 0, function () {
            var health;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, cacheManager.healthCheck()];
                    case 1:
                        health = _a.sent();
                        (0, vitest_1.expect)(health).toHaveProperty("healthy");
                        (0, vitest_1.expect)(health).toHaveProperty("metrics");
                        (0, vitest_1.expect)(health).toHaveProperty("issues");
                        (0, vitest_1.expect)(Array.isArray(health.issues)).toBe(true);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)("configuration", function () {
        (0, vitest_1.it)("should update configuration", function () {
            var newConfig = {
                ttlMinutes: 30,
                maxEntries: 500,
            };
            cacheManager.updateConfig(newConfig);
            var config = cacheManager.getConfig();
            (0, vitest_1.expect)(config.ttlMinutes).toBe(30);
            (0, vitest_1.expect)(config.maxEntries).toBe(500);
        });
        (0, vitest_1.it)("should respect enabled/disabled state", function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        cacheManager.updateConfig({ enabled: false });
                        return [4 /*yield*/, cacheManager.set("key", { data: "test" })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, cacheManager.get("key")];
                    case 2:
                        result = _a.sent();
                        (0, vitest_1.expect)(result).toBeNull();
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
(0, vitest_1.describe)("TokenOptimizer", function () {
    var tokenOptimizer;
    (0, vitest_1.beforeEach)(function () {
        tokenOptimizer = new tokenOptimizer_1.TokenOptimizer();
        tokenOptimizer.resetMetrics();
    });
    (0, vitest_1.describe)("token estimation", function () {
        (0, vitest_1.it)("should estimate tokens for strings", function () {
            var text = "This is a test string with some words";
            var tokens = tokenOptimizer.estimateTokens(text);
            (0, vitest_1.expect)(tokens).toBeGreaterThan(0);
            (0, vitest_1.expect)(tokens).toBeLessThan(text.length); // Should be less than character count
        });
        (0, vitest_1.it)("should estimate tokens for objects", function () {
            var obj = {
                title: "Test Object",
                description: "This is a test object with some properties",
                tags: ["test", "object", "example"],
                nested: {
                    property: "value",
                    number: 42,
                },
            };
            var tokens = tokenOptimizer.estimateTokens(obj);
            (0, vitest_1.expect)(tokens).toBeGreaterThan(0);
        });
        (0, vitest_1.it)("should handle empty inputs", function () {
            (0, vitest_1.expect)(tokenOptimizer.estimateTokens("")).toBe(0);
            (0, vitest_1.expect)(tokenOptimizer.estimateTokens({})).toBeGreaterThan(0); // JSON overhead
        });
    });
    (0, vitest_1.describe)("KB object optimization", function () {
        (0, vitest_1.it)("should optimize oversized objects", function () {
            var largeObject = {
                body: {
                    title: "Very Long Title That Could Be Shortened",
                    description: "This is a very verbose description that contains a lot of unnecessary words and could be compressed significantly to save tokens",
                    properties: {
                        redundantProperty: null,
                        emptyArray: [],
                        emptyString: "",
                        validProperty: "value",
                    },
                    veryLongPropertyName: "value",
                },
            };
            var result = tokenOptimizer.optimizeKBObject(largeObject);
            (0, vitest_1.expect)(result.originalTokens).toBeGreaterThan(0);
            (0, vitest_1.expect)(result.optimizedTokens).toBeLessThanOrEqual(result.originalTokens);
            (0, vitest_1.expect)(result.modifications.length).toBeGreaterThan(0);
        });
        (0, vitest_1.it)("should not modify objects within token limit", function () {
            var smallObject = {
                body: {
                    title: "Short",
                    desc: "Brief",
                },
            };
            var result = tokenOptimizer.optimizeKBObject(smallObject);
            (0, vitest_1.expect)(result.savings).toBe(0);
            (0, vitest_1.expect)(result.modifications.length).toBe(0);
        });
    });
    (0, vitest_1.describe)("grounding data optimization", function () {
        (0, vitest_1.it)("should limit array sizes", function () {
            var groundingData = {
                motifs: Array(10).fill({ name: "motif", description: "test" }),
                glossary: Array(5).fill({ term: "term", definition: "definition" }),
                fewshot: Array(3).fill({ prompt: "prompt", response: "response" }),
            };
            var result = tokenOptimizer.optimizeGroundingData(groundingData);
            (0, vitest_1.expect)(result.optimizedTokens).toBeLessThan(result.originalTokens);
            (0, vitest_1.expect)(result.modifications).toContain("Limited motifs to 6 items");
            (0, vitest_1.expect)(result.modifications).toContain("Limited glossary to 3 items");
            (0, vitest_1.expect)(result.modifications).toContain("Limited fewshot to 1 item");
        });
    });
    (0, vitest_1.describe)("cost calculation", function () {
        (0, vitest_1.it)("should calculate GPT-4 costs correctly", function () {
            var usage = {
                promptTokens: 1000,
                completionTokens: 500,
                totalTokens: 1500,
            };
            var cost = tokenOptimizer.calculateCost(usage, "gpt4");
            (0, vitest_1.expect)(cost).toBeGreaterThan(0);
            (0, vitest_1.expect)(cost).toBe((1000 * 0.03) / 1000 + (500 * 0.06) / 1000); // Expected calculation
        });
        (0, vitest_1.it)("should calculate embedding costs correctly", function () {
            var usage = {
                promptTokens: 1000,
                completionTokens: 0,
                totalTokens: 1000,
            };
            var cost = tokenOptimizer.calculateCost(usage, "embedding");
            (0, vitest_1.expect)(cost).toBe((1000 * 0.00002) / 1000); // Expected calculation
        });
    });
    (0, vitest_1.describe)("metrics tracking", function () {
        (0, vitest_1.it)("should record usage metrics", function () {
            var usage = {
                promptTokens: 100,
                completionTokens: 50,
                totalTokens: 150,
                cost: 0.01,
            };
            tokenOptimizer.recordUsage(usage);
            var metrics = tokenOptimizer.getMetrics();
            (0, vitest_1.expect)(metrics.totalUsage.promptTokens).toBe(100);
            (0, vitest_1.expect)(metrics.totalUsage.completionTokens).toBe(50);
            (0, vitest_1.expect)(metrics.totalUsage.totalTokens).toBe(150);
            (0, vitest_1.expect)(metrics.totalUsage.cost).toBe(0.01);
            (0, vitest_1.expect)(metrics.requestCount).toBe(1);
        });
        (0, vitest_1.it)("should track cache hits separately", function () {
            var usage = {
                promptTokens: 100,
                completionTokens: 50,
                totalTokens: 150,
                cost: 0.01,
            };
            tokenOptimizer.recordUsage(usage, true); // fromCache = true
            var metrics = tokenOptimizer.getMetrics();
            (0, vitest_1.expect)(metrics.costSavings.cacheHits).toBe(1);
            (0, vitest_1.expect)(metrics.costSavings.tokensSaved).toBe(150);
            (0, vitest_1.expect)(metrics.costSavings.costSaved).toBe(0.01);
            (0, vitest_1.expect)(metrics.totalUsage.totalTokens).toBe(0); // Should not count towards total usage
        });
        (0, vitest_1.it)("should calculate averages correctly", function () {
            var usage1 = {
                promptTokens: 100,
                completionTokens: 50,
                totalTokens: 150,
                cost: 0.01,
            };
            var usage2 = {
                promptTokens: 200,
                completionTokens: 100,
                totalTokens: 300,
                cost: 0.02,
            };
            tokenOptimizer.recordUsage(usage1);
            tokenOptimizer.recordUsage(usage2);
            var metrics = tokenOptimizer.getMetrics();
            (0, vitest_1.expect)(metrics.averagePerRequest.promptTokens).toBe(150);
            (0, vitest_1.expect)(metrics.averagePerRequest.completionTokens).toBe(75);
            (0, vitest_1.expect)(metrics.averagePerRequest.totalTokens).toBe(225);
            (0, vitest_1.expect)(metrics.averagePerRequest.cost).toBe(0.015);
        });
    });
    (0, vitest_1.describe)("token budget validation", function () {
        (0, vitest_1.it)("should validate objects within budget", function () {
            var smallObject = {
                body: { title: "Small", description: "Brief description" },
            };
            var validation = tokenOptimizer.validateTokenBudget(smallObject);
            (0, vitest_1.expect)(validation.valid).toBe(true);
            (0, vitest_1.expect)(validation.tokenCount).toBeLessThan(validation.limit);
        });
        (0, vitest_1.it)("should reject objects exceeding budget", function () {
            var largeObject = {
                body: {
                    title: "Large Object",
                    description: "A".repeat(2000), // Very long description
                    data: Array(100).fill("lots of data"),
                },
            };
            var validation = tokenOptimizer.validateTokenBudget(largeObject);
            (0, vitest_1.expect)(validation.valid).toBe(false);
            (0, vitest_1.expect)(validation.tokenCount).toBeGreaterThan(validation.limit);
        });
    });
    (0, vitest_1.describe)("optimization recommendations", function () {
        (0, vitest_1.it)("should provide recommendations based on metrics", function () {
            // Simulate high token usage
            for (var i = 0; i < 10; i++) {
                tokenOptimizer.recordUsage({
                    promptTokens: 3000,
                    completionTokens: 1000,
                    totalTokens: 4000,
                    cost: 0.2,
                });
            }
            var recommendations = tokenOptimizer.getOptimizationRecommendations();
            (0, vitest_1.expect)(Array.isArray(recommendations)).toBe(true);
            (0, vitest_1.expect)(recommendations.length).toBeGreaterThan(0);
        });
        (0, vitest_1.it)("should recommend cache improvements for low hit rates", function () {
            // Simulate low cache hit rate
            for (var i = 0; i < 10; i++) {
                tokenOptimizer.recordUsage({
                    promptTokens: 100,
                    completionTokens: 50,
                    totalTokens: 150,
                    cost: 0.01,
                });
            }
            var recommendations = tokenOptimizer.getOptimizationRecommendations();
            var cacheRecommendation = recommendations.find(function (r) { return r.includes("cache") || r.includes("TTL"); });
            (0, vitest_1.expect)(cacheRecommendation).toBeDefined();
        });
    });
});
