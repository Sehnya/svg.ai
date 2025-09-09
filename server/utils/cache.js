"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
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
exports.cacheManager = exports.CacheManager = void 0;
var crypto_1 = require("crypto");
var config_1 = require("../db/config");
var schema_1 = require("../db/schema");
var drizzle_orm_1 = require("drizzle-orm");
var CacheManager = /** @class */ (function () {
    function CacheManager(config) {
        if (config === void 0) { config = {}; }
        this.config = __assign({ enabled: true, ttlMinutes: 10, maxEntries: 10000, cleanupIntervalMinutes: 30 }, config);
        this.metrics = {
            hits: 0,
            misses: 0,
            hitRate: 0,
            totalEntries: 0,
            totalSize: 0,
            avgTTL: 0,
        };
        // Start cleanup timer
        this.startCleanupTimer();
        if (CacheManager.instance) {
            return CacheManager.instance;
        }
        CacheManager.instance = this;
    }
    CacheManager.getInstance = function (config) {
        if (!CacheManager.instance) {
            CacheManager.instance = new CacheManager(config);
        }
        return CacheManager.instance;
    };
    /**
     * Generate cache key from prompt and user context
     */
    CacheManager.prototype.generateCacheKey = function (prompt, userId, additionalContext) {
        var context = __assign({ prompt: prompt.trim().toLowerCase(), userId: userId || "anonymous" }, additionalContext);
        var content = JSON.stringify(context, Object.keys(context).sort());
        return (0, crypto_1.createHash)("sha256").update(content).digest("hex");
    };
    /**
     * Get cached grounding data
     */
    CacheManager.prototype.get = function (key) {
        return __awaiter(this, void 0, void 0, function () {
            var cached, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.config.enabled) {
                            return [2 /*return*/, null];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, config_1.db
                                .select()
                                .from(schema_1.groundingCache)
                                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.groundingCache.id, key), (0, drizzle_orm_1.sql)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["", " > NOW()"], ["", " > NOW()"])), schema_1.groundingCache.expiresAt)))];
                    case 2:
                        cached = (_a.sent())[0];
                        if (cached) {
                            this.metrics.hits++;
                            this.updateHitRate();
                            return [2 /*return*/, cached.groundingData];
                        }
                        else {
                            this.metrics.misses++;
                            this.updateHitRate();
                            return [2 /*return*/, null];
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        console.error("Cache get error:", error_1);
                        this.metrics.misses++;
                        this.updateHitRate();
                        return [2 /*return*/, null];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Set cached grounding data with TTL
     */
    CacheManager.prototype.set = function (key, data, ttlMinutes) {
        return __awaiter(this, void 0, void 0, function () {
            var ttl, expiresAt, cacheEntry, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.config.enabled) {
                            return [2 /*return*/];
                        }
                        ttl = ttlMinutes || this.config.ttlMinutes;
                        expiresAt = new Date(Date.now() + ttl * 60 * 1000);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        cacheEntry = {
                            id: key,
                            promptHash: key,
                            groundingData: data,
                            expiresAt: expiresAt,
                        };
                        return [4 /*yield*/, config_1.db
                                .insert(schema_1.groundingCache)
                                .values(cacheEntry)
                                .onConflictDoUpdate({
                                target: schema_1.groundingCache.id,
                                set: {
                                    groundingData: cacheEntry.groundingData,
                                    expiresAt: cacheEntry.expiresAt,
                                    createdAt: new Date(),
                                },
                            })];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.updateMetrics()];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        error_2 = _a.sent();
                        console.error("Cache set error:", error_2);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Delete specific cache entry
     */
    CacheManager.prototype.delete = function (key) {
        return __awaiter(this, void 0, void 0, function () {
            var error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, config_1.db.delete(schema_1.groundingCache).where((0, drizzle_orm_1.eq)(schema_1.groundingCache.id, key))];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.updateMetrics()];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_3 = _a.sent();
                        console.error("Cache delete error:", error_3);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Clear all cache entries
     */
    CacheManager.prototype.clear = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, config_1.db.delete(schema_1.groundingCache)];
                    case 1:
                        _a.sent();
                        this.metrics = {
                            hits: 0,
                            misses: 0,
                            hitRate: 0,
                            totalEntries: 0,
                            totalSize: 0,
                            avgTTL: 0,
                        };
                        return [3 /*break*/, 3];
                    case 2:
                        error_4 = _a.sent();
                        console.error("Cache clear error:", error_4);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Remove expired cache entries
     */
    CacheManager.prototype.cleanup = function () {
        return __awaiter(this, void 0, void 0, function () {
            var deleted, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, config_1.db
                                .delete(schema_1.groundingCache)
                                .where((0, drizzle_orm_1.sql)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["", " <= NOW()"], ["", " <= NOW()"])), schema_1.groundingCache.expiresAt))
                                .returning({ id: schema_1.groundingCache.id })];
                    case 1:
                        deleted = _a.sent();
                        return [4 /*yield*/, this.updateMetrics()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, { deletedCount: deleted.length }];
                    case 3:
                        error_5 = _a.sent();
                        console.error("Cache cleanup error:", error_5);
                        return [2 /*return*/, { deletedCount: 0 }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Invalidate cache entries based on pattern or condition
     */
    CacheManager.prototype.invalidate = function (pattern) {
        return __awaiter(this, void 0, void 0, function () {
            var query, deleted, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        query = config_1.db.delete(schema_1.groundingCache);
                        if (pattern) {
                            query = query.where((0, drizzle_orm_1.sql)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["", " LIKE ", ""], ["", " LIKE ", ""])), schema_1.groundingCache.promptHash, "%".concat(pattern, "%")));
                        }
                        return [4 /*yield*/, query.returning({ id: schema_1.groundingCache.id })];
                    case 1:
                        deleted = _a.sent();
                        return [4 /*yield*/, this.updateMetrics()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, { deletedCount: deleted.length }];
                    case 3:
                        error_6 = _a.sent();
                        console.error("Cache invalidate error:", error_6);
                        return [2 /*return*/, { deletedCount: 0 }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get cache metrics and statistics
     */
    CacheManager.prototype.getMetrics = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.updateMetrics()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, __assign({}, this.metrics)];
                }
            });
        });
    };
    /**
     * Get cache entries for monitoring
     */
    CacheManager.prototype.getEntries = function () {
        return __awaiter(this, arguments, void 0, function (limit) {
            var error_7;
            if (limit === void 0) { limit = 100; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, config_1.db
                                .select()
                                .from(schema_1.groundingCache)
                                .orderBy((0, drizzle_orm_1.sql)(templateObject_4 || (templateObject_4 = __makeTemplateObject(["", " DESC"], ["", " DESC"])), schema_1.groundingCache.createdAt))
                                .limit(limit)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_7 = _a.sent();
                        console.error("Cache getEntries error:", error_7);
                        return [2 /*return*/, []];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Check if cache is healthy
     */
    CacheManager.prototype.healthCheck = function () {
        return __awaiter(this, void 0, void 0, function () {
            var issues, expiredCount, error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        issues = [];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, this.updateMetrics()];
                    case 2:
                        _a.sent();
                        // Check hit rate
                        if (this.metrics.hitRate < 0.3 &&
                            this.metrics.hits + this.metrics.misses > 100) {
                            issues.push("Low cache hit rate (< 30%)");
                        }
                        // Check cache size
                        if (this.metrics.totalEntries > this.config.maxEntries * 0.9) {
                            issues.push("Cache approaching maximum capacity");
                        }
                        return [4 /*yield*/, this.getExpiredCount()];
                    case 3:
                        expiredCount = _a.sent();
                        if (expiredCount > this.metrics.totalEntries * 0.2) {
                            issues.push("High number of expired entries (> 20%)");
                        }
                        return [2 /*return*/, {
                                healthy: issues.length === 0,
                                metrics: this.metrics,
                                issues: issues,
                            }];
                    case 4:
                        error_8 = _a.sent();
                        issues.push("Cache health check failed: ".concat(error_8));
                        return [2 /*return*/, {
                                healthy: false,
                                metrics: this.metrics,
                                issues: issues,
                            }];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Update cache configuration
     */
    CacheManager.prototype.updateConfig = function (newConfig) {
        this.config = __assign(__assign({}, this.config), newConfig);
        // Restart cleanup timer if interval changed
        if (newConfig.cleanupIntervalMinutes) {
            this.stopCleanupTimer();
            this.startCleanupTimer();
        }
    };
    /**
     * Get current configuration
     */
    CacheManager.prototype.getConfig = function () {
        return __assign({}, this.config);
    };
    // Private methods
    CacheManager.prototype.updateMetrics = function () {
        return __awaiter(this, void 0, void 0, function () {
            var stats, error_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, config_1.db
                                .select({
                                count: (0, drizzle_orm_1.sql)(templateObject_5 || (templateObject_5 = __makeTemplateObject(["COUNT(*)"], ["COUNT(*)"]))),
                                avgSize: (0, drizzle_orm_1.sql)(templateObject_6 || (templateObject_6 = __makeTemplateObject(["AVG(LENGTH(", "::text))"], ["AVG(LENGTH(", "::text))"])), schema_1.groundingCache.groundingData),
                                avgTTL: (0, drizzle_orm_1.sql)(templateObject_7 || (templateObject_7 = __makeTemplateObject(["AVG(EXTRACT(EPOCH FROM (", " - ", ")) / 60)"], ["AVG(EXTRACT(EPOCH FROM (", " - ", ")) / 60)"])), schema_1.groundingCache.expiresAt, schema_1.groundingCache.createdAt),
                            })
                                .from(schema_1.groundingCache)];
                    case 1:
                        stats = (_a.sent())[0];
                        this.metrics.totalEntries = (stats === null || stats === void 0 ? void 0 : stats.count) || 0;
                        this.metrics.totalSize = Math.round((stats === null || stats === void 0 ? void 0 : stats.avgSize) || 0);
                        this.metrics.avgTTL = Math.round((stats === null || stats === void 0 ? void 0 : stats.avgTTL) || 0);
                        return [3 /*break*/, 3];
                    case 2:
                        error_9 = _a.sent();
                        console.error("Error updating cache metrics:", error_9);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    CacheManager.prototype.updateHitRate = function () {
        var total = this.metrics.hits + this.metrics.misses;
        this.metrics.hitRate = total > 0 ? this.metrics.hits / total : 0;
    };
    CacheManager.prototype.getExpiredCount = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result, error_10;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, config_1.db
                                .select({ count: (0, drizzle_orm_1.sql)(templateObject_8 || (templateObject_8 = __makeTemplateObject(["COUNT(*)"], ["COUNT(*)"]))) })
                                .from(schema_1.groundingCache)
                                .where((0, drizzle_orm_1.sql)(templateObject_9 || (templateObject_9 = __makeTemplateObject(["", " <= NOW()"], ["", " <= NOW()"])), schema_1.groundingCache.expiresAt))];
                    case 1:
                        result = (_a.sent())[0];
                        return [2 /*return*/, (result === null || result === void 0 ? void 0 : result.count) || 0];
                    case 2:
                        error_10 = _a.sent();
                        console.error("Error getting expired count:", error_10);
                        return [2 /*return*/, 0];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    CacheManager.prototype.startCleanupTimer = function () {
        var _this = this;
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
        }
        this.cleanupTimer = setInterval(function () {
            _this.cleanup().catch(console.error);
        }, this.config.cleanupIntervalMinutes * 60 * 1000);
    };
    CacheManager.prototype.stopCleanupTimer = function () {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = undefined;
        }
    };
    /**
     * Cleanup on shutdown
     */
    CacheManager.prototype.destroy = function () {
        this.stopCleanupTimer();
    };
    return CacheManager;
}());
exports.CacheManager = CacheManager;
// Export singleton instance
exports.cacheManager = CacheManager.getInstance();
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9;
