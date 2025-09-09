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
var hono_1 = require("hono");
var zod_validator_1 = require("@hono/zod-validator");
var zod_1 = require("zod");
var KnowledgeBaseManager_1 = require("../services/KnowledgeBaseManager");
var cache_1 = require("../utils/cache");
var tokenOptimizer_1 = require("../utils/tokenOptimizer");
var app = new hono_1.Hono();
var kbManager = KnowledgeBaseManager_1.KnowledgeBaseManager.getInstance();
// Cache metrics endpoint
app.get("/metrics", function (c) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, cacheMetrics, tokenMetrics, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                return [4 /*yield*/, Promise.all([
                        kbManager.getCacheMetrics(),
                        kbManager.getTokenMetrics(),
                    ])];
            case 1:
                _a = _b.sent(), cacheMetrics = _a[0], tokenMetrics = _a[1];
                return [2 /*return*/, c.json({
                        success: true,
                        data: {
                            cache: cacheMetrics,
                            tokens: tokenMetrics,
                            recommendations: kbManager.getOptimizationRecommendations(),
                        },
                    })];
            case 2:
                error_1 = _b.sent();
                console.error("Error getting cache metrics:", error_1);
                return [2 /*return*/, c.json({
                        success: false,
                        error: "Failed to get cache metrics",
                        details: error_1 instanceof Error ? error_1.message : "Unknown error",
                    }, 500)];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Cache health check endpoint
app.get("/health", function (c) { return __awaiter(void 0, void 0, void 0, function () {
    var healthCheck, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, kbManager.performCacheHealthCheck()];
            case 1:
                healthCheck = _a.sent();
                return [2 /*return*/, c.json({
                        success: true,
                        data: healthCheck,
                    })];
            case 2:
                error_2 = _a.sent();
                console.error("Error performing cache health check:", error_2);
                return [2 /*return*/, c.json({
                        success: false,
                        error: "Failed to perform cache health check",
                        details: error_2 instanceof Error ? error_2.message : "Unknown error",
                    }, 500)];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Clear cache endpoint
app.delete("/clear", function (c) { return __awaiter(void 0, void 0, void 0, function () {
    var error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, kbManager.clearCache()];
            case 1:
                _a.sent();
                return [2 /*return*/, c.json({
                        success: true,
                        message: "Cache cleared successfully",
                    })];
            case 2:
                error_3 = _a.sent();
                console.error("Error clearing cache:", error_3);
                return [2 /*return*/, c.json({
                        success: false,
                        error: "Failed to clear cache",
                        details: error_3 instanceof Error ? error_3.message : "Unknown error",
                    }, 500)];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Cleanup expired cache entries
app.post("/cleanup", function (c) { return __awaiter(void 0, void 0, void 0, function () {
    var result, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, kbManager.cleanupCache()];
            case 1:
                result = _a.sent();
                return [2 /*return*/, c.json({
                        success: true,
                        message: "Cleaned up ".concat(result.deletedCount, " expired cache entries"),
                        data: result,
                    })];
            case 2:
                error_4 = _a.sent();
                console.error("Error cleaning up cache:", error_4);
                return [2 /*return*/, c.json({
                        success: false,
                        error: "Failed to cleanup cache",
                        details: error_4 instanceof Error ? error_4.message : "Unknown error",
                    }, 500)];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Invalidate cache with optional pattern
var invalidateSchema = zod_1.z.object({
    pattern: zod_1.z.string().optional(),
});
app.post("/invalidate", (0, zod_validator_1.zValidator)("json", invalidateSchema), function (c) { return __awaiter(void 0, void 0, void 0, function () {
    var pattern, result, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                pattern = c.req.valid("json").pattern;
                return [4 /*yield*/, kbManager.invalidateCache(pattern)];
            case 1:
                result = _a.sent();
                return [2 /*return*/, c.json({
                        success: true,
                        message: "Invalidated ".concat(result.deletedCount, " cache entries"),
                        data: result,
                    })];
            case 2:
                error_5 = _a.sent();
                console.error("Error invalidating cache:", error_5);
                return [2 /*return*/, c.json({
                        success: false,
                        error: "Failed to invalidate cache",
                        details: error_5 instanceof Error ? error_5.message : "Unknown error",
                    }, 500)];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Get cache entries for monitoring
var entriesSchema = zod_1.z.object({
    limit: zod_1.z.number().min(1).max(1000).default(100),
});
app.get("/entries", (0, zod_validator_1.zValidator)("query", entriesSchema), function (c) { return __awaiter(void 0, void 0, void 0, function () {
    var limit, entries, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                limit = c.req.valid("query").limit;
                return [4 /*yield*/, cache_1.cacheManager.getEntries(limit)];
            case 1:
                entries = _a.sent();
                return [2 /*return*/, c.json({
                        success: true,
                        data: {
                            entries: entries,
                            count: entries.length,
                        },
                    })];
            case 2:
                error_6 = _a.sent();
                console.error("Error getting cache entries:", error_6);
                return [2 /*return*/, c.json({
                        success: false,
                        error: "Failed to get cache entries",
                        details: error_6 instanceof Error ? error_6.message : "Unknown error",
                    }, 500)];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Optimize specific KB object
var optimizeObjectSchema = zod_1.z.object({
    objectId: zod_1.z.string(),
});
app.post("/optimize/object", (0, zod_validator_1.zValidator)("json", optimizeObjectSchema), function (c) { return __awaiter(void 0, void 0, void 0, function () {
    var objectId, result, error_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                objectId = c.req.valid("json").objectId;
                return [4 /*yield*/, kbManager.optimizeObject(objectId)];
            case 1:
                result = _a.sent();
                return [2 /*return*/, c.json({
                        success: true,
                        message: "Optimization analysis complete for object ".concat(objectId),
                        data: result,
                    })];
            case 2:
                error_7 = _a.sent();
                console.error("Error optimizing object:", error_7);
                return [2 /*return*/, c.json({
                        success: false,
                        error: "Failed to optimize object",
                        details: error_7 instanceof Error ? error_7.message : "Unknown error",
                    }, 500)];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Batch optimize multiple KB objects
var batchOptimizeSchema = zod_1.z.object({
    objectIds: zod_1.z.array(zod_1.z.string()).min(1).max(100),
});
app.post("/optimize/batch", (0, zod_validator_1.zValidator)("json", batchOptimizeSchema), function (c) { return __awaiter(void 0, void 0, void 0, function () {
    var objectIds, result, error_8;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                objectIds = c.req.valid("json").objectIds;
                return [4 /*yield*/, kbManager.batchOptimizeObjects(objectIds)];
            case 1:
                result = _a.sent();
                return [2 /*return*/, c.json({
                        success: true,
                        message: "Batch optimization complete: ".concat(result.optimized, " objects optimized, ").concat(result.totalSavings, " tokens saved"),
                        data: result,
                    })];
            case 2:
                error_8 = _a.sent();
                console.error("Error batch optimizing objects:", error_8);
                return [2 /*return*/, c.json({
                        success: false,
                        error: "Failed to batch optimize objects",
                        details: error_8 instanceof Error ? error_8.message : "Unknown error",
                    }, 500)];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Update cache configuration
var configSchema = zod_1.z.object({
    enabled: zod_1.z.boolean().optional(),
    ttlMinutes: zod_1.z.number().min(1).max(1440).optional(), // 1 minute to 24 hours
    maxEntries: zod_1.z.number().min(100).max(100000).optional(),
    cleanupIntervalMinutes: zod_1.z.number().min(5).max(1440).optional(),
});
app.put("/config", (0, zod_validator_1.zValidator)("json", configSchema), function (c) { return __awaiter(void 0, void 0, void 0, function () {
    var config;
    return __generator(this, function (_a) {
        try {
            config = c.req.valid("json");
            cache_1.cacheManager.updateConfig(config);
            return [2 /*return*/, c.json({
                    success: true,
                    message: "Cache configuration updated successfully",
                    data: cache_1.cacheManager.getConfig(),
                })];
        }
        catch (error) {
            console.error("Error updating cache config:", error);
            return [2 /*return*/, c.json({
                    success: false,
                    error: "Failed to update cache configuration",
                    details: error instanceof Error ? error.message : "Unknown error",
                }, 500)];
        }
        return [2 /*return*/];
    });
}); });
// Get current cache configuration
app.get("/config", function (c) { return __awaiter(void 0, void 0, void 0, function () {
    var config;
    return __generator(this, function (_a) {
        try {
            config = cache_1.cacheManager.getConfig();
            return [2 /*return*/, c.json({
                    success: true,
                    data: config,
                })];
        }
        catch (error) {
            console.error("Error getting cache config:", error);
            return [2 /*return*/, c.json({
                    success: false,
                    error: "Failed to get cache configuration",
                    details: error instanceof Error ? error.message : "Unknown error",
                }, 500)];
        }
        return [2 /*return*/];
    });
}); });
// Reset token metrics
app.post("/tokens/reset", function (c) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        try {
            tokenOptimizer_1.tokenOptimizer.resetMetrics();
            return [2 /*return*/, c.json({
                    success: true,
                    message: "Token metrics reset successfully",
                })];
        }
        catch (error) {
            console.error("Error resetting token metrics:", error);
            return [2 /*return*/, c.json({
                    success: false,
                    error: "Failed to reset token metrics",
                    details: error instanceof Error ? error.message : "Unknown error",
                }, 500)];
        }
        return [2 /*return*/];
    });
}); });
exports.default = app;
