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
var hono_1 = require("hono");
var cache_1 = require("../../server/api/cache");
var cache_2 = require("../../server/utils/cache");
var tokenOptimizer_1 = require("../../server/utils/tokenOptimizer");
(0, vitest_1.describe)("Cache API Integration", function () {
    var app;
    (0, vitest_1.beforeEach)(function () {
        app = new hono_1.Hono();
        app.route("/api/cache", cache_1.default);
        // Reset state
        cache_2.cacheManager.clear();
        tokenOptimizer_1.tokenOptimizer.resetMetrics();
    });
    (0, vitest_1.afterEach)(function () {
        cache_2.cacheManager.clear();
    });
    (0, vitest_1.describe)("GET /api/cache/metrics", function () {
        (0, vitest_1.it)("should return cache and token metrics", function () { return __awaiter(void 0, void 0, void 0, function () {
            var res, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // Add some test data
                    return [4 /*yield*/, cache_2.cacheManager.set("test-key", { data: "test" })];
                    case 1:
                        // Add some test data
                        _a.sent();
                        tokenOptimizer_1.tokenOptimizer.recordUsage({
                            promptTokens: 100,
                            completionTokens: 50,
                            totalTokens: 150,
                            cost: 0.01,
                        });
                        return [4 /*yield*/, app.request("/api/cache/metrics")];
                    case 2:
                        res = _a.sent();
                        return [4 /*yield*/, res.json()];
                    case 3:
                        data = _a.sent();
                        (0, vitest_1.expect)(res.status).toBe(200);
                        (0, vitest_1.expect)(data.success).toBe(true);
                        (0, vitest_1.expect)(data.data).toHaveProperty("cache");
                        (0, vitest_1.expect)(data.data).toHaveProperty("tokens");
                        (0, vitest_1.expect)(data.data).toHaveProperty("recommendations");
                        (0, vitest_1.expect)(Array.isArray(data.data.recommendations)).toBe(true);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)("GET /api/cache/health", function () {
        (0, vitest_1.it)("should return cache health status", function () { return __awaiter(void 0, void 0, void 0, function () {
            var res, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, app.request("/api/cache/health")];
                    case 1:
                        res = _a.sent();
                        return [4 /*yield*/, res.json()];
                    case 2:
                        data = _a.sent();
                        (0, vitest_1.expect)(res.status).toBe(200);
                        (0, vitest_1.expect)(data.success).toBe(true);
                        (0, vitest_1.expect)(data.data).toHaveProperty("healthy");
                        (0, vitest_1.expect)(data.data).toHaveProperty("metrics");
                        (0, vitest_1.expect)(data.data).toHaveProperty("issues");
                        (0, vitest_1.expect)(typeof data.data.healthy).toBe("boolean");
                        (0, vitest_1.expect)(Array.isArray(data.data.issues)).toBe(true);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)("DELETE /api/cache/clear", function () {
        (0, vitest_1.it)("should clear all cache entries", function () { return __awaiter(void 0, void 0, void 0, function () {
            var res, data, key1, key2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // Add test data
                    return [4 /*yield*/, cache_2.cacheManager.set("key1", { data: 1 })];
                    case 1:
                        // Add test data
                        _a.sent();
                        return [4 /*yield*/, cache_2.cacheManager.set("key2", { data: 2 })];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, app.request("/api/cache/clear", {
                                method: "DELETE",
                            })];
                    case 3:
                        res = _a.sent();
                        return [4 /*yield*/, res.json()];
                    case 4:
                        data = _a.sent();
                        (0, vitest_1.expect)(res.status).toBe(200);
                        (0, vitest_1.expect)(data.success).toBe(true);
                        (0, vitest_1.expect)(data.message).toContain("cleared");
                        return [4 /*yield*/, cache_2.cacheManager.get("key1")];
                    case 5:
                        key1 = _a.sent();
                        return [4 /*yield*/, cache_2.cacheManager.get("key2")];
                    case 6:
                        key2 = _a.sent();
                        (0, vitest_1.expect)(key1).toBeNull();
                        (0, vitest_1.expect)(key2).toBeNull();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)("POST /api/cache/cleanup", function () {
        (0, vitest_1.it)("should cleanup expired entries", function () { return __awaiter(void 0, void 0, void 0, function () {
            var res, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // Add entries with short TTL
                    return [4 /*yield*/, cache_2.cacheManager.set("expired", { data: "old" }, 0.01)];
                    case 1:
                        // Add entries with short TTL
                        _a.sent(); // Very short TTL
                        return [4 /*yield*/, cache_2.cacheManager.set("valid", { data: "new" }, 60)];
                    case 2:
                        _a.sent(); // Long TTL
                        // Wait for expiration
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                    case 3:
                        // Wait for expiration
                        _a.sent();
                        return [4 /*yield*/, app.request("/api/cache/cleanup", {
                                method: "POST",
                            })];
                    case 4:
                        res = _a.sent();
                        return [4 /*yield*/, res.json()];
                    case 5:
                        data = _a.sent();
                        (0, vitest_1.expect)(res.status).toBe(200);
                        (0, vitest_1.expect)(data.success).toBe(true);
                        (0, vitest_1.expect)(data.message).toContain("Cleaned up");
                        (0, vitest_1.expect)(data.data).toHaveProperty("deletedCount");
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)("POST /api/cache/invalidate", function () {
        (0, vitest_1.it)("should invalidate all entries when no pattern provided", function () { return __awaiter(void 0, void 0, void 0, function () {
            var res, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, cache_2.cacheManager.set("key1", { data: 1 })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, cache_2.cacheManager.set("key2", { data: 2 })];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, app.request("/api/cache/invalidate", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({}),
                            })];
                    case 3:
                        res = _a.sent();
                        return [4 /*yield*/, res.json()];
                    case 4:
                        data = _a.sent();
                        (0, vitest_1.expect)(res.status).toBe(200);
                        (0, vitest_1.expect)(data.success).toBe(true);
                        (0, vitest_1.expect)(data.data.deletedCount).toBeGreaterThan(0);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should invalidate entries matching pattern", function () { return __awaiter(void 0, void 0, void 0, function () {
            var res, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, cache_2.cacheManager.set("user-123-prompt", { data: 1 })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, cache_2.cacheManager.set("user-456-prompt", { data: 2 })];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, cache_2.cacheManager.set("system-cache", { data: 3 })];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, app.request("/api/cache/invalidate", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ pattern: "user" }),
                            })];
                    case 4:
                        res = _a.sent();
                        return [4 /*yield*/, res.json()];
                    case 5:
                        data = _a.sent();
                        (0, vitest_1.expect)(res.status).toBe(200);
                        (0, vitest_1.expect)(data.success).toBe(true);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should validate request body", function () { return __awaiter(void 0, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, app.request("/api/cache/invalidate", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ pattern: 123 }), // Invalid type
                        })];
                    case 1:
                        res = _a.sent();
                        (0, vitest_1.expect)(res.status).toBe(400);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)("GET /api/cache/entries", function () {
        (0, vitest_1.it)("should return cache entries with default limit", function () { return __awaiter(void 0, void 0, void 0, function () {
            var res, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, cache_2.cacheManager.set("key1", { data: 1 })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, cache_2.cacheManager.set("key2", { data: 2 })];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, app.request("/api/cache/entries")];
                    case 3:
                        res = _a.sent();
                        return [4 /*yield*/, res.json()];
                    case 4:
                        data = _a.sent();
                        (0, vitest_1.expect)(res.status).toBe(200);
                        (0, vitest_1.expect)(data.success).toBe(true);
                        (0, vitest_1.expect)(data.data).toHaveProperty("entries");
                        (0, vitest_1.expect)(data.data).toHaveProperty("count");
                        (0, vitest_1.expect)(Array.isArray(data.data.entries)).toBe(true);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should respect limit parameter", function () { return __awaiter(void 0, void 0, void 0, function () {
            var i, res, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < 5)) return [3 /*break*/, 4];
                        return [4 /*yield*/, cache_2.cacheManager.set("key".concat(i), { data: i })];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        i++;
                        return [3 /*break*/, 1];
                    case 4: return [4 /*yield*/, app.request("/api/cache/entries?limit=3")];
                    case 5:
                        res = _a.sent();
                        return [4 /*yield*/, res.json()];
                    case 6:
                        data = _a.sent();
                        (0, vitest_1.expect)(res.status).toBe(200);
                        (0, vitest_1.expect)(data.data.entries.length).toBeLessThanOrEqual(3);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should validate limit parameter", function () { return __awaiter(void 0, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, app.request("/api/cache/entries?limit=invalid")];
                    case 1:
                        res = _a.sent();
                        (0, vitest_1.expect)(res.status).toBe(400);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should enforce maximum limit", function () { return __awaiter(void 0, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, app.request("/api/cache/entries?limit=2000")];
                    case 1:
                        res = _a.sent();
                        (0, vitest_1.expect)(res.status).toBe(400);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)("POST /api/cache/optimize/object", function () {
        (0, vitest_1.it)("should return optimization analysis for valid object", function () { return __awaiter(void 0, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, app.request("/api/cache/optimize/object", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ objectId: "test-object-id" }),
                        })];
                    case 1:
                        res = _a.sent();
                        // Expect either success or a specific error for non-existent object
                        (0, vitest_1.expect)([200, 500].includes(res.status)).toBe(true);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should validate request body", function () { return __awaiter(void 0, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, app.request("/api/cache/optimize/object", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({}), // Missing objectId
                        })];
                    case 1:
                        res = _a.sent();
                        (0, vitest_1.expect)(res.status).toBe(400);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)("POST /api/cache/optimize/batch", function () {
        (0, vitest_1.it)("should validate object IDs array", function () { return __awaiter(void 0, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, app.request("/api/cache/optimize/batch", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ objectIds: [] }), // Empty array
                        })];
                    case 1:
                        res = _a.sent();
                        (0, vitest_1.expect)(res.status).toBe(400);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should enforce maximum batch size", function () { return __awaiter(void 0, void 0, void 0, function () {
            var objectIds, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        objectIds = Array(150).fill("test-id");
                        return [4 /*yield*/, app.request("/api/cache/optimize/batch", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ objectIds: objectIds }),
                            })];
                    case 1:
                        res = _a.sent();
                        (0, vitest_1.expect)(res.status).toBe(400);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)("PUT /api/cache/config", function () {
        (0, vitest_1.it)("should update cache configuration", function () { return __awaiter(void 0, void 0, void 0, function () {
            var newConfig, res, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        newConfig = {
                            ttlMinutes: 30,
                            maxEntries: 500,
                        };
                        return [4 /*yield*/, app.request("/api/cache/config", {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(newConfig),
                            })];
                    case 1:
                        res = _a.sent();
                        return [4 /*yield*/, res.json()];
                    case 2:
                        data = _a.sent();
                        (0, vitest_1.expect)(res.status).toBe(200);
                        (0, vitest_1.expect)(data.success).toBe(true);
                        (0, vitest_1.expect)(data.data.ttlMinutes).toBe(30);
                        (0, vitest_1.expect)(data.data.maxEntries).toBe(500);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should validate configuration values", function () { return __awaiter(void 0, void 0, void 0, function () {
            var invalidConfig, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        invalidConfig = {
                            ttlMinutes: -1, // Invalid negative value
                        };
                        return [4 /*yield*/, app.request("/api/cache/config", {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(invalidConfig),
                            })];
                    case 1:
                        res = _a.sent();
                        (0, vitest_1.expect)(res.status).toBe(400);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should enforce maximum values", function () { return __awaiter(void 0, void 0, void 0, function () {
            var invalidConfig, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        invalidConfig = {
                            ttlMinutes: 2000, // Exceeds max of 1440
                        };
                        return [4 /*yield*/, app.request("/api/cache/config", {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(invalidConfig),
                            })];
                    case 1:
                        res = _a.sent();
                        (0, vitest_1.expect)(res.status).toBe(400);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)("GET /api/cache/config", function () {
        (0, vitest_1.it)("should return current configuration", function () { return __awaiter(void 0, void 0, void 0, function () {
            var res, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, app.request("/api/cache/config")];
                    case 1:
                        res = _a.sent();
                        return [4 /*yield*/, res.json()];
                    case 2:
                        data = _a.sent();
                        (0, vitest_1.expect)(res.status).toBe(200);
                        (0, vitest_1.expect)(data.success).toBe(true);
                        (0, vitest_1.expect)(data.data).toHaveProperty("enabled");
                        (0, vitest_1.expect)(data.data).toHaveProperty("ttlMinutes");
                        (0, vitest_1.expect)(data.data).toHaveProperty("maxEntries");
                        (0, vitest_1.expect)(data.data).toHaveProperty("cleanupIntervalMinutes");
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)("POST /api/cache/tokens/reset", function () {
        (0, vitest_1.it)("should reset token metrics", function () { return __awaiter(void 0, void 0, void 0, function () {
            var res, data, metrics;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Add some usage data
                        tokenOptimizer_1.tokenOptimizer.recordUsage({
                            promptTokens: 100,
                            completionTokens: 50,
                            totalTokens: 150,
                            cost: 0.01,
                        });
                        return [4 /*yield*/, app.request("/api/cache/tokens/reset", {
                                method: "POST",
                            })];
                    case 1:
                        res = _a.sent();
                        return [4 /*yield*/, res.json()];
                    case 2:
                        data = _a.sent();
                        (0, vitest_1.expect)(res.status).toBe(200);
                        (0, vitest_1.expect)(data.success).toBe(true);
                        (0, vitest_1.expect)(data.message).toContain("reset");
                        metrics = tokenOptimizer_1.tokenOptimizer.getMetrics();
                        (0, vitest_1.expect)(metrics.totalUsage.totalTokens).toBe(0);
                        (0, vitest_1.expect)(metrics.requestCount).toBe(0);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)("Error handling", function () {
        (0, vitest_1.it)("should handle malformed JSON", function () { return __awaiter(void 0, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, app.request("/api/cache/invalidate", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: "invalid json",
                        })];
                    case 1:
                        res = _a.sent();
                        (0, vitest_1.expect)(res.status).toBe(400);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should handle missing Content-Type header", function () { return __awaiter(void 0, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, app.request("/api/cache/invalidate", {
                            method: "POST",
                            body: JSON.stringify({ pattern: "test" }),
                        })];
                    case 1:
                        res = _a.sent();
                        // Should still work or return appropriate error
                        (0, vitest_1.expect)([200, 400, 415].includes(res.status)).toBe(true);
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
