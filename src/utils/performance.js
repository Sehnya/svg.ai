"use strict";
/**
 * Performance monitoring utilities
 */
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
exports.fpsMonitor = exports.FPSMonitor = exports.memoryMonitor = exports.MemoryMonitor = exports.performanceMonitor = void 0;
exports.timed = timed;
var PerformanceMonitor = /** @class */ (function () {
    function PerformanceMonitor() {
        this.metrics = [];
        this.activeTimers = new Map();
    }
    /**
     * Start timing an operation
     */
    PerformanceMonitor.prototype.start = function (name, metadata) {
        var startTime = performance.now();
        this.activeTimers.set(name, startTime);
        this.metrics.push({
            name: name,
            startTime: startTime,
            metadata: metadata,
        });
    };
    /**
     * End timing an operation
     */
    PerformanceMonitor.prototype.end = function (name) {
        var endTime = performance.now();
        var startTime = this.activeTimers.get(name);
        if (!startTime) {
            console.warn("Performance timer '".concat(name, "' was not started"));
            return null;
        }
        var duration = endTime - startTime;
        this.activeTimers.delete(name);
        // Update the metric
        var metric = this.metrics.find(function (m) { return m.name === name && !m.endTime; });
        if (metric) {
            metric.endTime = endTime;
            metric.duration = duration;
        }
        return duration;
    };
    /**
     * Time a function execution
     */
    PerformanceMonitor.prototype.time = function (name, fn, metadata) {
        return __awaiter(this, void 0, void 0, function () {
            var result, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.start(name, metadata);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, fn()];
                    case 2:
                        result = _a.sent();
                        this.end(name);
                        return [2 /*return*/, result];
                    case 3:
                        error_1 = _a.sent();
                        this.end(name);
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Time a synchronous function execution
     */
    PerformanceMonitor.prototype.timeSync = function (name, fn, metadata) {
        this.start(name, metadata);
        try {
            var result = fn();
            this.end(name);
            return result;
        }
        catch (error) {
            this.end(name);
            throw error;
        }
    };
    /**
     * Get performance report
     */
    PerformanceMonitor.prototype.getReport = function () {
        var completedMetrics = this.metrics.filter(function (m) { return m.duration !== undefined; });
        if (completedMetrics.length === 0) {
            return {
                metrics: [],
                summary: {
                    totalOperations: 0,
                    averageDuration: 0,
                    slowestOperation: null,
                    fastestOperation: null,
                },
            };
        }
        var durations = completedMetrics.map(function (m) { return m.duration; });
        var averageDuration = durations.reduce(function (sum, d) { return sum + d; }, 0) / durations.length;
        var slowestOperation = completedMetrics.reduce(function (slowest, current) {
            return current.duration > slowest.duration ? current : slowest;
        });
        var fastestOperation = completedMetrics.reduce(function (fastest, current) {
            return current.duration < fastest.duration ? current : fastest;
        });
        return {
            metrics: __spreadArray([], completedMetrics, true),
            summary: {
                totalOperations: completedMetrics.length,
                averageDuration: Math.round(averageDuration * 100) / 100,
                slowestOperation: slowestOperation,
                fastestOperation: fastestOperation,
            },
        };
    };
    /**
     * Clear all metrics
     */
    PerformanceMonitor.prototype.clear = function () {
        this.metrics = [];
        this.activeTimers.clear();
    };
    /**
     * Get metrics for a specific operation
     */
    PerformanceMonitor.prototype.getMetricsFor = function (name) {
        return this.metrics.filter(function (m) { return m.name === name; });
    };
    /**
     * Log performance report to console
     */
    PerformanceMonitor.prototype.logReport = function () {
        var report = this.getReport();
        console.group("🚀 Performance Report");
        console.log("Total Operations: ".concat(report.summary.totalOperations));
        console.log("Average Duration: ".concat(report.summary.averageDuration, "ms"));
        if (report.summary.slowestOperation) {
            console.log("Slowest: ".concat(report.summary.slowestOperation.name, " (").concat(report.summary.slowestOperation.duration, "ms)"));
        }
        if (report.summary.fastestOperation) {
            console.log("Fastest: ".concat(report.summary.fastestOperation.name, " (").concat(report.summary.fastestOperation.duration, "ms)"));
        }
        console.table(report.metrics.map(function (m) { return ({
            Operation: m.name,
            Duration: "".concat(m.duration, "ms"),
            Metadata: JSON.stringify(m.metadata || {}),
        }); }));
        console.groupEnd();
    };
    return PerformanceMonitor;
}());
// Global performance monitor instance
exports.performanceMonitor = new PerformanceMonitor();
/**
 * Decorator for timing method execution
 */
function timed(name) {
    return function (target, propertyKey, descriptor) {
        var originalMethod = descriptor.value;
        var timerName = name || "".concat(target.constructor.name, ".").concat(propertyKey);
        descriptor.value = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return __awaiter(this, void 0, void 0, function () {
                var _this = this;
                return __generator(this, function (_a) {
                    return [2 /*return*/, exports.performanceMonitor.time(timerName, function () {
                            return originalMethod.apply(_this, args);
                        })];
                });
            });
        };
        return descriptor;
    };
}
var MemoryMonitor = /** @class */ (function () {
    function MemoryMonitor() {
        this.snapshots = [];
    }
    /**
     * Take a memory snapshot
     */
    MemoryMonitor.prototype.snapshot = function (label) {
        var performanceMemory = performance.memory;
        if (!performanceMemory) {
            console.warn("Memory monitoring not available in this environment");
            return null;
        }
        var usage = {
            usedJSHeapSize: performanceMemory.usedJSHeapSize,
            totalJSHeapSize: performanceMemory.totalJSHeapSize,
            jsHeapSizeLimit: performanceMemory.jsHeapSizeLimit,
        };
        this.snapshots.push({
            timestamp: Date.now(),
            usage: usage,
            label: label,
        });
        return usage;
    };
    /**
     * Get memory usage difference between two snapshots
     */
    MemoryMonitor.prototype.getDifference = function (startLabel, endLabel) {
        var start = this.snapshots.find(function (s) { return s.label === startLabel; });
        var end = this.snapshots.find(function (s) { return s.label === endLabel; });
        if (!start || !end) {
            return null;
        }
        return end.usage.usedJSHeapSize - start.usage.usedJSHeapSize;
    };
    /**
     * Get all snapshots
     */
    MemoryMonitor.prototype.getSnapshots = function () {
        return __spreadArray([], this.snapshots, true);
    };
    /**
     * Clear all snapshots
     */
    MemoryMonitor.prototype.clear = function () {
        this.snapshots = [];
    };
    /**
     * Format bytes to human readable format
     */
    MemoryMonitor.prototype.formatBytes = function (bytes) {
        var sizes = ["Bytes", "KB", "MB", "GB"];
        if (bytes === 0)
            return "0 Bytes";
        var i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
    };
    /**
     * Log memory report
     */
    MemoryMonitor.prototype.logReport = function () {
        var _this = this;
        if (this.snapshots.length === 0) {
            console.log("No memory snapshots available");
            return;
        }
        console.group("💾 Memory Report");
        this.snapshots.forEach(function (snapshot, index) {
            console.log("".concat(index + 1, ". ").concat(snapshot.label || "Unnamed", ": ").concat(_this.formatBytes(snapshot.usage.usedJSHeapSize)));
        });
        if (this.snapshots.length >= 2) {
            var first = this.snapshots[0];
            var last = this.snapshots[this.snapshots.length - 1];
            var difference = last.usage.usedJSHeapSize - first.usage.usedJSHeapSize;
            console.log("Total Change: ".concat(this.formatBytes(Math.abs(difference)), " ").concat(difference >= 0 ? "increase" : "decrease"));
        }
        console.groupEnd();
    };
    return MemoryMonitor;
}());
exports.MemoryMonitor = MemoryMonitor;
// Global memory monitor instance
exports.memoryMonitor = new MemoryMonitor();
/**
 * FPS monitoring for smooth animations
 */
var FPSMonitor = /** @class */ (function () {
    function FPSMonitor() {
        var _this = this;
        this.frames = [];
        this.lastTime = 0;
        this.isRunning = false;
        this.tick = function () {
            if (!_this.isRunning)
                return;
            var now = performance.now();
            var delta = now - _this.lastTime;
            _this.lastTime = now;
            var fps = 1000 / delta;
            _this.frames.push(fps);
            // Keep only last 60 frames (1 second at 60fps)
            if (_this.frames.length > 60) {
                _this.frames.shift();
            }
            requestAnimationFrame(_this.tick);
        };
    }
    /**
     * Start FPS monitoring
     */
    FPSMonitor.prototype.start = function () {
        if (this.isRunning)
            return;
        this.isRunning = true;
        this.lastTime = performance.now();
        this.frames = [];
        this.tick();
    };
    /**
     * Stop FPS monitoring
     */
    FPSMonitor.prototype.stop = function () {
        this.isRunning = false;
    };
    /**
     * Get current FPS
     */
    FPSMonitor.prototype.getCurrentFPS = function () {
        if (this.frames.length === 0)
            return 0;
        return this.frames[this.frames.length - 1];
    };
    /**
     * Get average FPS
     */
    FPSMonitor.prototype.getAverageFPS = function () {
        if (this.frames.length === 0)
            return 0;
        var sum = this.frames.reduce(function (a, b) { return a + b; }, 0);
        return sum / this.frames.length;
    };
    /**
     * Get FPS statistics
     */
    FPSMonitor.prototype.getStats = function () {
        if (this.frames.length === 0) {
            return { current: 0, average: 0, min: 0, max: 0 };
        }
        var current = this.getCurrentFPS();
        var average = this.getAverageFPS();
        var min = Math.min.apply(Math, this.frames);
        var max = Math.max.apply(Math, this.frames);
        return { current: current, average: average, min: min, max: max };
    };
    return FPSMonitor;
}());
exports.FPSMonitor = FPSMonitor;
// Global FPS monitor instance
exports.fpsMonitor = new FPSMonitor();
