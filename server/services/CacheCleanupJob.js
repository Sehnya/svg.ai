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
exports.cacheCleanupJob = exports.CacheCleanupJob = void 0;
var cache_1 = require("../utils/cache");
var KnowledgeBaseManager_1 = require("./KnowledgeBaseManager");
var CacheCleanupJob = /** @class */ (function () {
    function CacheCleanupJob(config) {
        if (config === void 0) { config = {}; }
        this.cleanupHistory = [];
        this.config = __assign({ enabled: true, intervalMinutes: 30, maxCacheAge: 60, maxCacheEntries: 10000, logResults: true }, config);
        this.kbManager = KnowledgeBaseManager_1.KnowledgeBaseManager.getInstance();
        if (CacheCleanupJob.instance) {
            return CacheCleanupJob.instance;
        }
        CacheCleanupJob.instance = this;
    }
    CacheCleanupJob.getInstance = function (config) {
        if (!CacheCleanupJob.instance) {
            CacheCleanupJob.instance = new CacheCleanupJob(config);
        }
        return CacheCleanupJob.instance;
    };
    /**
     * Start the cleanup job
     */
    CacheCleanupJob.prototype.start = function () {
        var _this = this;
        if (!this.config.enabled) {
            console.log("Cache cleanup job is disabled");
            return;
        }
        if (this.intervalId) {
            console.log("Cache cleanup job is already running");
            return;
        }
        console.log("Starting cache cleanup job (interval: ".concat(this.config.intervalMinutes, " minutes)"));
        // Run initial cleanup
        this.runCleanup().catch(console.error);
        // Schedule recurring cleanup
        this.intervalId = setInterval(function () {
            _this.runCleanup().catch(console.error);
        }, this.config.intervalMinutes * 60 * 1000);
    };
    /**
     * Stop the cleanup job
     */
    CacheCleanupJob.prototype.stop = function () {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = undefined;
            console.log("Cache cleanup job stopped");
        }
    };
    /**
     * Run cleanup manually
     */
    CacheCleanupJob.prototype.runCleanup = function () {
        return __awaiter(this, void 0, void 0, function () {
            var timestamp, metricsBefore, totalEntriesBefore, cleanupResult, expiredEntriesRemoved, metricsAfter, totalEntriesAfter, healthCheck, result, error_1, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        timestamp = new Date();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 8, , 9]);
                        return [4 /*yield*/, cache_1.cacheManager.getMetrics()];
                    case 2:
                        metricsBefore = _a.sent();
                        totalEntriesBefore = metricsBefore.totalEntries;
                        return [4 /*yield*/, cache_1.cacheManager.cleanup()];
                    case 3:
                        cleanupResult = _a.sent();
                        expiredEntriesRemoved = cleanupResult.deletedCount;
                        return [4 /*yield*/, cache_1.cacheManager.getMetrics()];
                    case 4:
                        metricsAfter = _a.sent();
                        totalEntriesAfter = metricsAfter.totalEntries;
                        return [4 /*yield*/, cache_1.cacheManager.healthCheck()];
                    case 5:
                        healthCheck = _a.sent();
                        result = {
                            timestamp: timestamp,
                            expiredEntriesRemoved: expiredEntriesRemoved,
                            totalEntriesBefore: totalEntriesBefore,
                            totalEntriesAfter: totalEntriesAfter,
                            cacheHealthy: healthCheck.healthy,
                            issues: healthCheck.issues,
                        };
                        // Store in history (keep last 100 results)
                        this.cleanupHistory.push(result);
                        if (this.cleanupHistory.length > 100) {
                            this.cleanupHistory = this.cleanupHistory.slice(-100);
                        }
                        this.lastCleanup = timestamp;
                        // Log results if enabled
                        if (this.config.logResults) {
                            console.log("Cache cleanup completed:", {
                                expiredRemoved: expiredEntriesRemoved,
                                totalBefore: totalEntriesBefore,
                                totalAfter: totalEntriesAfter,
                                healthy: healthCheck.healthy,
                                issues: healthCheck.issues.length,
                            });
                            if (!healthCheck.healthy) {
                                console.warn("Cache health issues detected:", healthCheck.issues);
                            }
                        }
                        if (!(totalEntriesAfter > this.config.maxCacheEntries)) return [3 /*break*/, 7];
                        return [4 /*yield*/, this.performAggressiveCleanup()];
                    case 6:
                        _a.sent();
                        _a.label = 7;
                    case 7: return [2 /*return*/, result];
                    case 8:
                        error_1 = _a.sent();
                        console.error("Cache cleanup failed:", error_1);
                        result = {
                            timestamp: timestamp,
                            expiredEntriesRemoved: 0,
                            totalEntriesBefore: 0,
                            totalEntriesAfter: 0,
                            cacheHealthy: false,
                            issues: [
                                "Cleanup failed: ".concat(error_1 instanceof Error ? error_1.message : "Unknown error"),
                            ],
                        };
                        this.cleanupHistory.push(result);
                        return [2 /*return*/, result];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Perform aggressive cleanup when cache is too large
     */
    CacheCleanupJob.prototype.performAggressiveCleanup = function () {
        return __awaiter(this, void 0, void 0, function () {
            var entries, sortedEntries, entriesToRemove, _i, entriesToRemove_1, entry, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("Performing aggressive cache cleanup due to size limits");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 8, , 9]);
                        return [4 /*yield*/, cache_1.cacheManager.getEntries(this.config.maxCacheEntries)];
                    case 2:
                        entries = _a.sent();
                        if (!(entries.length > this.config.maxCacheEntries)) return [3 /*break*/, 7];
                        sortedEntries = entries.sort(function (a, b) { return a.createdAt.getTime() - b.createdAt.getTime(); });
                        entriesToRemove = sortedEntries.slice(0, entries.length - this.config.maxCacheEntries);
                        _i = 0, entriesToRemove_1 = entriesToRemove;
                        _a.label = 3;
                    case 3:
                        if (!(_i < entriesToRemove_1.length)) return [3 /*break*/, 6];
                        entry = entriesToRemove_1[_i];
                        return [4 /*yield*/, cache_1.cacheManager.delete(entry.id)];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 3];
                    case 6:
                        console.log("Aggressively removed ".concat(entriesToRemove.length, " old cache entries"));
                        _a.label = 7;
                    case 7: return [3 /*break*/, 9];
                    case 8:
                        error_2 = _a.sent();
                        console.error("Aggressive cleanup failed:", error_2);
                        return [3 /*break*/, 9];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get cleanup statistics
     */
    CacheCleanupJob.prototype.getStats = function () {
        var recentResults = this.cleanupHistory.slice(-10);
        var averageEntriesRemoved = recentResults.length > 0
            ? recentResults.reduce(function (sum, r) { return sum + r.expiredEntriesRemoved; }, 0) /
                recentResults.length
            : 0;
        var recentIssues = recentResults
            .flatMap(function (r) { return r.issues; })
            .filter(function (issue, index, arr) { return arr.indexOf(issue) === index; }) // unique issues
            .slice(-5); // last 5 unique issues
        return {
            config: this.config,
            isRunning: !!this.intervalId,
            lastCleanup: this.lastCleanup,
            totalCleanups: this.cleanupHistory.length,
            averageEntriesRemoved: Math.round(averageEntriesRemoved),
            recentIssues: recentIssues,
        };
    };
    /**
     * Get cleanup history
     */
    CacheCleanupJob.prototype.getHistory = function (limit) {
        if (limit === void 0) { limit = 20; }
        return this.cleanupHistory.slice(-limit);
    };
    /**
     * Update configuration
     */
    CacheCleanupJob.prototype.updateConfig = function (newConfig) {
        var wasRunning = !!this.intervalId;
        // Stop if running
        if (wasRunning) {
            this.stop();
        }
        // Update config
        this.config = __assign(__assign({}, this.config), newConfig);
        // Restart if it was running and still enabled
        if (wasRunning && this.config.enabled) {
            this.start();
        }
    };
    /**
     * Get current configuration
     */
    CacheCleanupJob.prototype.getConfig = function () {
        return __assign({}, this.config);
    };
    /**
     * Force cleanup now
     */
    CacheCleanupJob.prototype.forceCleanup = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.runCleanup()];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Cleanup on shutdown
     */
    CacheCleanupJob.prototype.destroy = function () {
        this.stop();
    };
    return CacheCleanupJob;
}());
exports.CacheCleanupJob = CacheCleanupJob;
// Export singleton instance
exports.cacheCleanupJob = CacheCleanupJob.getInstance();
