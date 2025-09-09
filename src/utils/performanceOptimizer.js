"use strict";
/**
 * Frontend performance optimization utilities
 */
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
exports.resourcePreloader = exports.ResourcePreloader = exports.domBatcher = exports.performanceMonitor = exports.DOMBatcher = exports.FrontendPerformanceMonitor = exports.ObjectPool = exports.LazyLoader = void 0;
exports.debounce = debounce;
exports.throttle = throttle;
exports.createImageLazyLoader = createImageLazyLoader;
exports.createComponentLazyLoader = createComponentLazyLoader;
// Debounce function with immediate option
function debounce(func, wait, immediate) {
    if (immediate === void 0) { immediate = false; }
    var timeout = null;
    return function executedFunction() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var later = function () {
            timeout = null;
            if (!immediate)
                func.apply(void 0, args);
        };
        var callNow = immediate && !timeout;
        if (timeout)
            clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow)
            func.apply(void 0, args);
    };
}
// Throttle function for high-frequency events
function throttle(func, limit) {
    var inThrottle;
    return function executedFunction() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (!inThrottle) {
            func.apply(void 0, args);
            inThrottle = true;
            setTimeout(function () { return (inThrottle = false); }, limit);
        }
    };
}
// Intersection Observer for lazy loading
var LazyLoader = /** @class */ (function () {
    function LazyLoader(options) {
        if (options === void 0) { options = {}; }
        var _this = this;
        this.callbacks = new Map();
        var defaultOptions = __assign({ root: null, rootMargin: "50px", threshold: 0.1 }, options);
        this.observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    var callback = _this.callbacks.get(entry.target);
                    if (callback) {
                        callback();
                        _this.unobserve(entry.target);
                    }
                }
            });
        }, defaultOptions);
    }
    LazyLoader.prototype.observe = function (element, callback) {
        this.callbacks.set(element, callback);
        this.observer.observe(element);
    };
    LazyLoader.prototype.unobserve = function (element) {
        this.callbacks.delete(element);
        this.observer.unobserve(element);
    };
    LazyLoader.prototype.disconnect = function () {
        this.observer.disconnect();
        this.callbacks.clear();
    };
    return LazyLoader;
}());
exports.LazyLoader = LazyLoader;
// Memory-efficient object pool for reusing DOM elements
var ObjectPool = /** @class */ (function () {
    function ObjectPool(createFn, resetFn, maxSize) {
        if (maxSize === void 0) { maxSize = 100; }
        this.pool = [];
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.maxSize = maxSize;
    }
    ObjectPool.prototype.acquire = function () {
        if (this.pool.length > 0) {
            var item = this.pool.pop();
            if (this.resetFn) {
                this.resetFn(item);
            }
            return item;
        }
        return this.createFn();
    };
    ObjectPool.prototype.release = function (item) {
        if (this.pool.length < this.maxSize) {
            this.pool.push(item);
        }
    };
    ObjectPool.prototype.clear = function () {
        this.pool = [];
    };
    Object.defineProperty(ObjectPool.prototype, "size", {
        get: function () {
            return this.pool.length;
        },
        enumerable: false,
        configurable: true
    });
    return ObjectPool;
}());
exports.ObjectPool = ObjectPool;
// Performance monitoring for frontend
var FrontendPerformanceMonitor = /** @class */ (function () {
    function FrontendPerformanceMonitor() {
        this.metrics = {
            renderTimes: [],
            memoryUsage: [],
            componentMounts: 0,
            componentUnmounts: 0,
            apiCalls: 0,
            cacheHits: 0,
            cacheMisses: 0,
        };
        this.setupPerformanceObserver();
        this.startMemoryMonitoring();
    }
    FrontendPerformanceMonitor.prototype.setupPerformanceObserver = function () {
        var _this = this;
        if ("PerformanceObserver" in window) {
            this.observer = new PerformanceObserver(function (list) {
                var entries = list.getEntries();
                entries.forEach(function (entry) {
                    if (entry.entryType === "measure") {
                        _this.metrics.renderTimes.push(entry.duration);
                        // Keep only last 100 measurements
                        if (_this.metrics.renderTimes.length > 100) {
                            _this.metrics.renderTimes = _this.metrics.renderTimes.slice(-100);
                        }
                    }
                });
            });
            this.observer.observe({ entryTypes: ["measure", "navigation"] });
        }
    };
    FrontendPerformanceMonitor.prototype.startMemoryMonitoring = function () {
        var _this = this;
        if ("memory" in performance) {
            setInterval(function () {
                var memory = performance.memory;
                _this.metrics.memoryUsage.push(memory.usedJSHeapSize);
                // Keep only last 100 measurements
                if (_this.metrics.memoryUsage.length > 100) {
                    _this.metrics.memoryUsage = _this.metrics.memoryUsage.slice(-100);
                }
            }, 30000); // Every 30 seconds
        }
    };
    FrontendPerformanceMonitor.prototype.measureRender = function (name, fn) {
        performance.mark("".concat(name, "-start"));
        var result = fn();
        performance.mark("".concat(name, "-end"));
        performance.measure(name, "".concat(name, "-start"), "".concat(name, "-end"));
        return result;
    };
    FrontendPerformanceMonitor.prototype.measureAsync = function (name, fn) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        performance.mark("".concat(name, "-start"));
                        return [4 /*yield*/, fn()];
                    case 1:
                        result = _a.sent();
                        performance.mark("".concat(name, "-end"));
                        performance.measure(name, "".concat(name, "-start"), "".concat(name, "-end"));
                        return [2 /*return*/, result];
                }
            });
        });
    };
    FrontendPerformanceMonitor.prototype.recordComponentMount = function () {
        this.metrics.componentMounts++;
    };
    FrontendPerformanceMonitor.prototype.recordComponentUnmount = function () {
        this.metrics.componentUnmounts++;
    };
    FrontendPerformanceMonitor.prototype.recordApiCall = function () {
        this.metrics.apiCalls++;
    };
    FrontendPerformanceMonitor.prototype.recordCacheHit = function () {
        this.metrics.cacheHits++;
    };
    FrontendPerformanceMonitor.prototype.recordCacheMiss = function () {
        this.metrics.cacheMisses++;
    };
    FrontendPerformanceMonitor.prototype.getMetrics = function () {
        var avgRenderTime = this.metrics.renderTimes.length > 0
            ? this.metrics.renderTimes.reduce(function (a, b) { return a + b; }, 0) /
                this.metrics.renderTimes.length
            : 0;
        var currentMemory = this.metrics.memoryUsage.length > 0
            ? this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1]
            : 0;
        var cacheHitRate = this.metrics.cacheHits + this.metrics.cacheMisses > 0
            ? this.metrics.cacheHits /
                (this.metrics.cacheHits + this.metrics.cacheMisses)
            : 0;
        return {
            averageRenderTime: avgRenderTime,
            currentMemoryUsage: currentMemory,
            componentMounts: this.metrics.componentMounts,
            componentUnmounts: this.metrics.componentUnmounts,
            apiCalls: this.metrics.apiCalls,
            cacheHitRate: cacheHitRate,
            renderTimes: __spreadArray([], this.metrics.renderTimes, true),
            memoryUsage: __spreadArray([], this.metrics.memoryUsage, true),
        };
    };
    FrontendPerformanceMonitor.prototype.reset = function () {
        this.metrics = {
            renderTimes: [],
            memoryUsage: [],
            componentMounts: 0,
            componentUnmounts: 0,
            apiCalls: 0,
            cacheHits: 0,
            cacheMisses: 0,
        };
    };
    FrontendPerformanceMonitor.prototype.disconnect = function () {
        if (this.observer) {
            this.observer.disconnect();
        }
    };
    return FrontendPerformanceMonitor;
}());
exports.FrontendPerformanceMonitor = FrontendPerformanceMonitor;
// Image lazy loading utility
function createImageLazyLoader() {
    return new LazyLoader({
        rootMargin: "100px",
        threshold: 0.01,
    });
}
// Component lazy loading utility
function createComponentLazyLoader() {
    return new LazyLoader({
        rootMargin: "200px",
        threshold: 0.1,
    });
}
// Batch DOM updates for better performance
var DOMBatcher = /** @class */ (function () {
    function DOMBatcher() {
        this.updates = [];
        this.scheduled = false;
    }
    DOMBatcher.prototype.add = function (update) {
        this.updates.push(update);
        this.schedule();
    };
    DOMBatcher.prototype.schedule = function () {
        var _this = this;
        if (!this.scheduled) {
            this.scheduled = true;
            requestAnimationFrame(function () {
                _this.flush();
            });
        }
    };
    DOMBatcher.prototype.flush = function () {
        var updates = this.updates.splice(0);
        updates.forEach(function (update) { return update(); });
        this.scheduled = false;
    };
    DOMBatcher.prototype.clear = function () {
        this.updates = [];
        this.scheduled = false;
    };
    return DOMBatcher;
}());
exports.DOMBatcher = DOMBatcher;
// Singleton instances
exports.performanceMonitor = new FrontendPerformanceMonitor();
exports.domBatcher = new DOMBatcher();
// Resource preloader
var ResourcePreloader = /** @class */ (function () {
    function ResourcePreloader() {
        this.cache = new Map();
    }
    ResourcePreloader.prototype.preloadImage = function (src) {
        return __awaiter(this, void 0, void 0, function () {
            var promise;
            return __generator(this, function (_a) {
                if (this.cache.has(src)) {
                    return [2 /*return*/, this.cache.get(src)];
                }
                promise = new Promise(function (resolve, reject) {
                    var img = new Image();
                    img.onload = function () { return resolve(img); };
                    img.onerror = reject;
                    img.src = src;
                });
                this.cache.set(src, promise);
                return [2 /*return*/, promise];
            });
        });
    };
    ResourcePreloader.prototype.preloadScript = function (src) {
        return __awaiter(this, void 0, void 0, function () {
            var promise;
            return __generator(this, function (_a) {
                if (this.cache.has(src)) {
                    return [2 /*return*/, this.cache.get(src)];
                }
                promise = new Promise(function (resolve, reject) {
                    var script = document.createElement("script");
                    script.onload = function () { return resolve(); };
                    script.onerror = reject;
                    script.src = src;
                    document.head.appendChild(script);
                });
                this.cache.set(src, promise);
                return [2 /*return*/, promise];
            });
        });
    };
    ResourcePreloader.prototype.preloadCSS = function (href) {
        return __awaiter(this, void 0, void 0, function () {
            var promise;
            return __generator(this, function (_a) {
                if (this.cache.has(href)) {
                    return [2 /*return*/, this.cache.get(href)];
                }
                promise = new Promise(function (resolve, reject) {
                    var link = document.createElement("link");
                    link.rel = "stylesheet";
                    link.onload = function () { return resolve(); };
                    link.onerror = reject;
                    link.href = href;
                    document.head.appendChild(link);
                });
                this.cache.set(href, promise);
                return [2 /*return*/, promise];
            });
        });
    };
    ResourcePreloader.prototype.clear = function () {
        this.cache.clear();
    };
    return ResourcePreloader;
}());
exports.ResourcePreloader = ResourcePreloader;
exports.resourcePreloader = new ResourcePreloader();
