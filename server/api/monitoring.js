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
 * Monitoring API endpoints for performance metrics and system health
 */
var hono_1 = require("hono");
var PerformanceMonitor_js_1 = require("../services/PerformanceMonitor.js");
var pool_js_1 = require("../db/pool.js");
var zod_1 = require("zod");
var app = new hono_1.Hono();
// Validation schemas
var MetricsQuerySchema = zod_1.z.object({
    hours: zod_1.z.coerce.number().min(1).max(168).optional().default(1), // Max 1 week
    format: zod_1.z.enum(["json", "prometheus"]).optional().default("json"),
});
var AlertThresholdSchema = zod_1.z.object({
    metric: zod_1.z.string(),
    threshold: zod_1.z.number(),
    comparison: zod_1.z.enum(["gt", "lt", "eq"]),
    enabled: zod_1.z.boolean().optional().default(true),
});
// Get current performance metrics
app.get("/metrics", function (c) { return __awaiter(void 0, void 0, void 0, function () {
    var query, monitor, metrics_1, prometheusMetrics, metrics, history_1;
    return __generator(this, function (_a) {
        try {
            query = MetricsQuerySchema.parse(c.req.query());
            monitor = (0, PerformanceMonitor_js_1.getPerformanceMonitor)();
            if (query.format === "prometheus") {
                metrics_1 = monitor.getMetrics();
                prometheusMetrics = formatPrometheusMetrics(metrics_1);
                c.header("Content-Type", "text/plain");
                return [2 /*return*/, c.text(prometheusMetrics)];
            }
            metrics = monitor.getMetrics();
            history_1 = monitor.getMetricsHistory(query.hours);
            return [2 /*return*/, c.json({
                    current: metrics,
                    history: history_1,
                    timestamp: Date.now(),
                })];
        }
        catch (error) {
            console.error("Error fetching metrics:", error);
            return [2 /*return*/, c.json({ error: "Failed to fetch metrics" }, 500)];
        }
        return [2 /*return*/];
    });
}); });
// Get system health status
app.get("/health", function (c) { return __awaiter(void 0, void 0, void 0, function () {
    var monitor, dbPool, dbHealth, report, memoryUsage, cpuUsage, health, statusCode, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                monitor = (0, PerformanceMonitor_js_1.getPerformanceMonitor)();
                dbPool = (0, pool_js_1.getDatabasePool)();
                return [4 /*yield*/, dbPool.healthCheck()];
            case 1:
                dbHealth = _a.sent();
                report = monitor.generateReport();
                memoryUsage = process.memoryUsage();
                cpuUsage = process.cpuUsage();
                health = {
                    status: dbHealth.healthy && report.summary.systemHealth !== "critical"
                        ? "healthy"
                        : "unhealthy",
                    timestamp: Date.now(),
                    uptime: process.uptime(),
                    database: {
                        healthy: dbHealth.healthy,
                        poolStatus: dbHealth.poolStatus,
                    },
                    performance: report.summary,
                    system: {
                        memory: {
                            used: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
                            total: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
                            external: Math.round(memoryUsage.external / 1024 / 1024), // MB
                        },
                        cpu: {
                            user: cpuUsage.user,
                            system: cpuUsage.system,
                        },
                    },
                    recommendations: report.recommendations,
                };
                statusCode = health.status === "healthy" ? 200 : 503;
                return [2 /*return*/, c.json(health, statusCode)];
            case 2:
                error_1 = _a.sent();
                console.error("Error checking health:", error_1);
                return [2 /*return*/, c.json({
                        status: "unhealthy",
                        error: "Health check failed",
                        timestamp: Date.now(),
                    }, 503)];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Get generation events and statistics
app.get("/generations", function (c) { return __awaiter(void 0, void 0, void 0, function () {
    var query, monitor, events, stats;
    return __generator(this, function (_a) {
        try {
            query = MetricsQuerySchema.parse(c.req.query());
            monitor = (0, PerformanceMonitor_js_1.getPerformanceMonitor)();
            events = monitor.getGenerationEvents(query.hours);
            stats = {
                total: events.length,
                successful: events.filter(function (e) { return e.success; }).length,
                failed: events.filter(function (e) { return !e.success; }).length,
                averageTime: events.length > 0
                    ? events
                        .filter(function (e) { return e.endTime; })
                        .reduce(function (sum, e) { return sum + (e.endTime - e.startTime); }, 0) /
                        events.length
                    : 0,
                totalTokens: events.reduce(function (sum, e) { return sum + (e.tokensUsed || 0); }, 0),
                totalCost: events.reduce(function (sum, e) { return sum + (e.tokenCost || 0); }, 0),
                cacheHits: events.filter(function (e) { return e.cacheHit; }).length,
                qualityFailures: events.filter(function (e) { return e.qualityGatePassed === false; })
                    .length,
            };
            return [2 /*return*/, c.json({
                    statistics: stats,
                    events: events.slice(0, 100), // Limit to last 100 events
                    timestamp: Date.now(),
                })];
        }
        catch (error) {
            console.error("Error fetching generation data:", error);
            return [2 /*return*/, c.json({ error: "Failed to fetch generation data" }, 500)];
        }
        return [2 /*return*/];
    });
}); });
// Get database performance metrics
app.get("/database", function (c) { return __awaiter(void 0, void 0, void 0, function () {
    var dbPool, metrics, health, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                dbPool = (0, pool_js_1.getDatabasePool)();
                metrics = dbPool.getMetrics();
                return [4 /*yield*/, dbPool.healthCheck()];
            case 1:
                health = _a.sent();
                return [2 /*return*/, c.json({
                        metrics: metrics,
                        health: health.healthy,
                        poolStatus: health.poolStatus,
                        timestamp: Date.now(),
                    })];
            case 2:
                error_2 = _a.sent();
                console.error("Error fetching database metrics:", error_2);
                return [2 /*return*/, c.json({ error: "Failed to fetch database metrics" }, 500)];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Configure alert thresholds
app.post("/alerts/thresholds", function (c) { return __awaiter(void 0, void 0, void 0, function () {
    var body, threshold, monitor, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, c.req.json()];
            case 1:
                body = _a.sent();
                threshold = AlertThresholdSchema.parse(body);
                monitor = (0, PerformanceMonitor_js_1.getPerformanceMonitor)();
                monitor.addAlertThreshold(threshold);
                return [2 /*return*/, c.json({ success: true, threshold: threshold })];
            case 2:
                error_3 = _a.sent();
                console.error("Error adding alert threshold:", error_3);
                return [2 /*return*/, c.json({ error: "Failed to add alert threshold" }, 400)];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Get alert thresholds
app.get("/alerts/thresholds", function (c) { return __awaiter(void 0, void 0, void 0, function () {
    var monitor, thresholds;
    return __generator(this, function (_a) {
        try {
            monitor = (0, PerformanceMonitor_js_1.getPerformanceMonitor)();
            thresholds = monitor.getAlertThresholds();
            return [2 /*return*/, c.json({ thresholds: thresholds })];
        }
        catch (error) {
            console.error("Error fetching alert thresholds:", error);
            return [2 /*return*/, c.json({ error: "Failed to fetch alert thresholds" }, 500)];
        }
        return [2 /*return*/];
    });
}); });
// Delete alert threshold
app.delete("/alerts/thresholds/:metric", function (c) { return __awaiter(void 0, void 0, void 0, function () {
    var metric, monitor;
    return __generator(this, function (_a) {
        try {
            metric = c.req.param("metric");
            monitor = (0, PerformanceMonitor_js_1.getPerformanceMonitor)();
            monitor.removeAlertThreshold(metric);
            return [2 /*return*/, c.json({ success: true })];
        }
        catch (error) {
            console.error("Error removing alert threshold:", error);
            return [2 /*return*/, c.json({ error: "Failed to remove alert threshold" }, 500)];
        }
        return [2 /*return*/];
    });
}); });
// Get performance report
app.get("/report", function (c) { return __awaiter(void 0, void 0, void 0, function () {
    var monitor, report;
    return __generator(this, function (_a) {
        try {
            monitor = (0, PerformanceMonitor_js_1.getPerformanceMonitor)();
            report = monitor.generateReport();
            return [2 /*return*/, c.json(__assign(__assign({}, report), { timestamp: Date.now() }))];
        }
        catch (error) {
            console.error("Error generating report:", error);
            return [2 /*return*/, c.json({ error: "Failed to generate report" }, 500)];
        }
        return [2 /*return*/];
    });
}); });
// Reset metrics (for testing/development)
app.post("/reset", function (c) { return __awaiter(void 0, void 0, void 0, function () {
    var monitor;
    return __generator(this, function (_a) {
        try {
            monitor = (0, PerformanceMonitor_js_1.getPerformanceMonitor)();
            monitor.reset();
            return [2 /*return*/, c.json({ success: true, message: "Metrics reset" })];
        }
        catch (error) {
            console.error("Error resetting metrics:", error);
            return [2 /*return*/, c.json({ error: "Failed to reset metrics" }, 500)];
        }
        return [2 /*return*/];
    });
}); });
// Helper function to format metrics for Prometheus
function formatPrometheusMetrics(metrics) {
    var lines = [];
    // Add help and type information
    lines.push("# HELP svg_generations_total Total number of SVG generations");
    lines.push("# TYPE svg_generations_total counter");
    lines.push("svg_generations_total ".concat(metrics.totalGenerations));
    lines.push("# HELP svg_generations_successful_total Successful SVG generations");
    lines.push("# TYPE svg_generations_successful_total counter");
    lines.push("svg_generations_successful_total ".concat(metrics.successfulGenerations));
    lines.push("# HELP svg_generations_failed_total Failed SVG generations");
    lines.push("# TYPE svg_generations_failed_total counter");
    lines.push("svg_generations_failed_total ".concat(metrics.failedGenerations));
    lines.push("# HELP svg_generation_time_avg Average generation time in milliseconds");
    lines.push("# TYPE svg_generation_time_avg gauge");
    lines.push("svg_generation_time_avg ".concat(metrics.averageGenerationTime));
    lines.push("# HELP svg_tokens_used_total Total tokens used");
    lines.push("# TYPE svg_tokens_used_total counter");
    lines.push("svg_tokens_used_total ".concat(metrics.totalTokensUsed));
    lines.push("# HELP svg_token_cost_total Total token cost");
    lines.push("# TYPE svg_token_cost_total counter");
    lines.push("svg_token_cost_total ".concat(metrics.totalTokenCost));
    lines.push("# HELP svg_cache_hit_rate Cache hit rate");
    lines.push("# TYPE svg_cache_hit_rate gauge");
    lines.push("svg_cache_hit_rate ".concat(metrics.cacheHitRate));
    lines.push("# HELP svg_quality_gate_failures_total Quality gate failures");
    lines.push("# TYPE svg_quality_gate_failures_total counter");
    lines.push("svg_quality_gate_failures_total ".concat(metrics.qualityGateFailures));
    lines.push("# HELP svg_repair_attempts_total Repair attempts");
    lines.push("# TYPE svg_repair_attempts_total counter");
    lines.push("svg_repair_attempts_total ".concat(metrics.repairAttempts));
    lines.push("# HELP svg_repair_success_rate Repair success rate");
    lines.push("# TYPE svg_repair_success_rate gauge");
    lines.push("svg_repair_success_rate ".concat(metrics.repairSuccessRate));
    lines.push("# HELP svg_active_users Active users");
    lines.push("# TYPE svg_active_users gauge");
    lines.push("svg_active_users ".concat(metrics.activeUsers));
    lines.push("# HELP svg_memory_heap_used Memory heap used in bytes");
    lines.push("# TYPE svg_memory_heap_used gauge");
    lines.push("svg_memory_heap_used ".concat(metrics.memoryUsage.heapUsed));
    lines.push("# HELP svg_uptime_seconds Uptime in seconds");
    lines.push("# TYPE svg_uptime_seconds counter");
    lines.push("svg_uptime_seconds ".concat(metrics.uptime / 1000));
    return lines.join("\n") + "\n";
}
exports.default = app;
