"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceMonitor = void 0;
exports.getPerformanceMonitor = getPerformanceMonitor;
/**
 * Performance monitoring service for generation success rates and system metrics
 */
var events_1 = require("events");
var PerformanceMonitor = /** @class */ (function (_super) {
    __extends(PerformanceMonitor, _super);
    function PerformanceMonitor() {
        var _this = _super.call(this) || this;
        _this.generationEvents = new Map();
        _this.userSessions = new Map();
        _this.alertThresholds = [];
        _this.metricsHistory = [];
        _this.startTime = Date.now();
        _this.metrics = _this.initializeMetrics();
        _this.setupDefaultAlerts();
        _this.startPeriodicCollection();
        return _this;
    }
    PerformanceMonitor.prototype.initializeMetrics = function () {
        return {
            totalGenerations: 0,
            successfulGenerations: 0,
            failedGenerations: 0,
            averageGenerationTime: 0,
            totalTokensUsed: 0,
            totalTokenCost: 0,
            averageTokensPerGeneration: 0,
            cacheHits: 0,
            cacheMisses: 0,
            cacheHitRate: 0,
            qualityGateFailures: 0,
            repairAttempts: 0,
            repairSuccessRate: 0,
            memoryUsage: process.memoryUsage(),
            cpuUsage: process.cpuUsage(),
            uptime: 0,
            activeUsers: 0,
            totalUsers: 0,
            averageSessionDuration: 0,
        };
    };
    PerformanceMonitor.prototype.setupDefaultAlerts = function () {
        this.alertThresholds = [
            {
                metric: "failedGenerations",
                threshold: 10,
                comparison: "gt",
                enabled: true,
            },
            {
                metric: "averageGenerationTime",
                threshold: 5000,
                comparison: "gt",
                enabled: true,
            },
            {
                metric: "cacheHitRate",
                threshold: 0.5,
                comparison: "lt",
                enabled: true,
            },
            {
                metric: "qualityGateFailures",
                threshold: 5,
                comparison: "gt",
                enabled: true,
            },
            {
                metric: "repairSuccessRate",
                threshold: 0.8,
                comparison: "lt",
                enabled: true,
            },
        ];
    };
    PerformanceMonitor.prototype.startPeriodicCollection = function () {
        var _this = this;
        // Collect system metrics every 30 seconds
        setInterval(function () {
            _this.collectSystemMetrics();
            _this.checkAlerts();
            _this.saveMetricsSnapshot();
        }, 30000);
        // Clean up old events every 5 minutes
        setInterval(function () {
            _this.cleanupOldEvents();
        }, 300000);
    };
    PerformanceMonitor.prototype.collectSystemMetrics = function () {
        this.metrics.memoryUsage = process.memoryUsage();
        this.metrics.cpuUsage = process.cpuUsage();
        this.metrics.uptime = Date.now() - this.startTime;
        // Update user metrics
        this.updateUserMetrics();
        // Calculate derived metrics
        this.calculateDerivedMetrics();
    };
    PerformanceMonitor.prototype.updateUserMetrics = function () {
        var now = Date.now();
        var activeThreshold = 5 * 60 * 1000; // 5 minutes
        var activeCount = 0;
        var totalSessionDuration = 0;
        var sessionCount = 0;
        for (var _i = 0, _a = this.userSessions.entries(); _i < _a.length; _i++) {
            var _b = _a[_i], userId = _b[0], session = _b[1];
            if (now - session.lastActivity < activeThreshold) {
                activeCount++;
            }
            totalSessionDuration += session.lastActivity - session.startTime;
            sessionCount++;
        }
        this.metrics.activeUsers = activeCount;
        this.metrics.totalUsers = this.userSessions.size;
        this.metrics.averageSessionDuration =
            sessionCount > 0 ? totalSessionDuration / sessionCount : 0;
    };
    PerformanceMonitor.prototype.calculateDerivedMetrics = function () {
        // Cache hit rate
        var totalCacheRequests = this.metrics.cacheHits + this.metrics.cacheMisses;
        this.metrics.cacheHitRate =
            totalCacheRequests > 0 ? this.metrics.cacheHits / totalCacheRequests : 0;
        // Average tokens per generation
        this.metrics.averageTokensPerGeneration =
            this.metrics.totalGenerations > 0
                ? this.metrics.totalTokensUsed / this.metrics.totalGenerations
                : 0;
        // Repair success rate
        var totalRepairs = this.metrics.repairAttempts;
        var successfulRepairs = totalRepairs - this.metrics.qualityGateFailures;
        this.metrics.repairSuccessRate =
            totalRepairs > 0 ? successfulRepairs / totalRepairs : 1;
    };
    PerformanceMonitor.prototype.checkAlerts = function () {
        for (var _i = 0, _a = this.alertThresholds; _i < _a.length; _i++) {
            var threshold = _a[_i];
            if (!threshold.enabled)
                continue;
            var currentValue = this.metrics[threshold.metric];
            var shouldAlert = false;
            switch (threshold.comparison) {
                case "gt":
                    shouldAlert = currentValue > threshold.threshold;
                    break;
                case "lt":
                    shouldAlert = currentValue < threshold.threshold;
                    break;
                case "eq":
                    shouldAlert = currentValue === threshold.threshold;
                    break;
            }
            if (shouldAlert) {
                this.emit("alert", {
                    metric: threshold.metric,
                    currentValue: currentValue,
                    threshold: threshold.threshold,
                    comparison: threshold.comparison,
                    timestamp: Date.now(),
                });
            }
        }
    };
    PerformanceMonitor.prototype.saveMetricsSnapshot = function () {
        this.metricsHistory.push({
            timestamp: Date.now(),
            metrics: __assign({}, this.metrics),
        });
        // Keep only last 24 hours of data (assuming 30-second intervals)
        var maxEntries = 24 * 60 * 2; // 2880 entries
        if (this.metricsHistory.length > maxEntries) {
            this.metricsHistory = this.metricsHistory.slice(-maxEntries);
        }
    };
    PerformanceMonitor.prototype.cleanupOldEvents = function () {
        var cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago
        for (var _i = 0, _a = this.generationEvents.entries(); _i < _a.length; _i++) {
            var _b = _a[_i], id = _b[0], event_1 = _b[1];
            if (event_1.startTime < cutoff) {
                this.generationEvents.delete(id);
            }
        }
    };
    // Public API methods
    PerformanceMonitor.prototype.startGeneration = function (id, userId, prompt) {
        var event = {
            id: id,
            userId: userId,
            prompt: prompt,
            startTime: Date.now(),
            success: false,
        };
        this.generationEvents.set(id, event);
        this.metrics.totalGenerations++;
        // Track user session
        if (userId) {
            if (!this.userSessions.has(userId)) {
                this.userSessions.set(userId, {
                    startTime: Date.now(),
                    lastActivity: Date.now(),
                });
            }
            else {
                var session = this.userSessions.get(userId);
                session.lastActivity = Date.now();
            }
        }
    };
    PerformanceMonitor.prototype.completeGeneration = function (id, success, options) {
        if (options === void 0) { options = {}; }
        var event = this.generationEvents.get(id);
        if (!event)
            return;
        event.endTime = Date.now();
        event.success = success;
        event.tokensUsed = options.tokensUsed;
        event.tokenCost = options.tokenCost;
        event.cacheHit = options.cacheHit;
        event.qualityGatePassed = options.qualityGatePassed;
        event.repairAttempts = options.repairAttempts;
        event.error = options.error;
        // Update metrics
        if (success) {
            this.metrics.successfulGenerations++;
        }
        else {
            this.metrics.failedGenerations++;
        }
        if (options.tokensUsed) {
            this.metrics.totalTokensUsed += options.tokensUsed;
        }
        if (options.tokenCost) {
            this.metrics.totalTokenCost += options.tokenCost;
        }
        if (options.cacheHit !== undefined) {
            if (options.cacheHit) {
                this.metrics.cacheHits++;
            }
            else {
                this.metrics.cacheMisses++;
            }
        }
        if (options.qualityGatePassed === false) {
            this.metrics.qualityGateFailures++;
        }
        if (options.repairAttempts) {
            this.metrics.repairAttempts += options.repairAttempts;
        }
        // Update average generation time
        var duration = event.endTime - event.startTime;
        var totalTime = this.metrics.averageGenerationTime * (this.metrics.totalGenerations - 1) +
            duration;
        this.metrics.averageGenerationTime =
            totalTime / this.metrics.totalGenerations;
    };
    PerformanceMonitor.prototype.getMetrics = function () {
        this.collectSystemMetrics();
        return __assign({}, this.metrics);
    };
    PerformanceMonitor.prototype.getMetricsHistory = function (hours) {
        if (hours === void 0) { hours = 1; }
        var cutoff = Date.now() - hours * 60 * 60 * 1000;
        return this.metricsHistory.filter(function (entry) { return entry.timestamp >= cutoff; });
    };
    PerformanceMonitor.prototype.getGenerationEvents = function (hours) {
        if (hours === void 0) { hours = 1; }
        var cutoff = Date.now() - hours * 60 * 60 * 1000;
        return Array.from(this.generationEvents.values()).filter(function (event) { return event.startTime >= cutoff; });
    };
    PerformanceMonitor.prototype.addAlertThreshold = function (threshold) {
        this.alertThresholds.push(threshold);
    };
    PerformanceMonitor.prototype.removeAlertThreshold = function (metric) {
        this.alertThresholds = this.alertThresholds.filter(function (t) { return t.metric !== metric; });
    };
    PerformanceMonitor.prototype.getAlertThresholds = function () {
        return __spreadArray([], this.alertThresholds, true);
    };
    PerformanceMonitor.prototype.generateReport = function () {
        var successRate = this.metrics.totalGenerations > 0
            ? this.metrics.successfulGenerations / this.metrics.totalGenerations
            : 1;
        var tokenEfficiency = this.metrics.totalTokenCost > 0
            ? this.metrics.successfulGenerations / this.metrics.totalTokenCost
            : 0;
        var systemHealth = "good";
        var recommendations = [];
        // Determine system health
        if (successRate < 0.8) {
            systemHealth = "critical";
            recommendations.push("Success rate is below 80%. Investigate generation failures.");
        }
        else if (successRate < 0.9) {
            systemHealth = "warning";
            recommendations.push("Success rate could be improved. Review error patterns.");
        }
        if (this.metrics.averageGenerationTime > 5000) {
            systemHealth = systemHealth === "good" ? "warning" : "critical";
            recommendations.push("Average generation time is high. Consider optimization.");
        }
        if (this.metrics.cacheHitRate < 0.5) {
            recommendations.push("Cache hit rate is low. Review caching strategy.");
        }
        if (this.metrics.memoryUsage.heapUsed > 500 * 1024 * 1024) {
            recommendations.push("High memory usage detected. Monitor for memory leaks.");
        }
        return {
            summary: {
                successRate: successRate,
                averageResponseTime: this.metrics.averageGenerationTime,
                tokenEfficiency: tokenEfficiency,
                systemHealth: systemHealth,
            },
            recommendations: recommendations,
        };
    };
    PerformanceMonitor.prototype.reset = function () {
        this.metrics = this.initializeMetrics();
        this.generationEvents.clear();
        this.metricsHistory = [];
        this.startTime = Date.now();
    };
    return PerformanceMonitor;
}(events_1.EventEmitter));
exports.PerformanceMonitor = PerformanceMonitor;
// Singleton instance
var performanceMonitor = null;
function getPerformanceMonitor() {
    if (!performanceMonitor) {
        performanceMonitor = new PerformanceMonitor();
    }
    return performanceMonitor;
}
