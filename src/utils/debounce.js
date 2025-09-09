"use strict";
/**
 * Debounce utility for performance optimization
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.debounce = debounce;
exports.throttle = throttle;
exports.advancedDebounce = advancedDebounce;
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
        if (timeout !== null) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(later, wait);
        if (callNow)
            func.apply(void 0, args);
    };
}
function throttle(func, limit) {
    var inThrottle;
    return function executedFunction() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(function () { return (inThrottle = false); }, limit);
        }
    };
}
/**
 * Advanced debounce with leading and trailing edge options
 */
function advancedDebounce(func, wait, options) {
    if (options === void 0) { options = {}; }
    var lastCallTime;
    var lastInvokeTime = 0;
    var timerId;
    var lastArgs;
    var _a = options.leading, leading = _a === void 0 ? false : _a, _b = options.trailing, trailing = _b === void 0 ? true : _b, maxWait = options.maxWait;
    function invokeFunc(time) {
        var args = lastArgs;
        lastArgs = undefined;
        lastInvokeTime = time;
        return func.apply(void 0, args);
    }
    function leadingEdge(time) {
        lastInvokeTime = time;
        timerId = setTimeout(timerExpired, wait);
        return leading ? invokeFunc(time) : undefined;
    }
    function remainingWait(time) {
        var timeSinceLastCall = time - lastCallTime;
        var timeSinceLastInvoke = time - lastInvokeTime;
        var timeWaiting = wait - timeSinceLastCall;
        return maxWait !== undefined
            ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
            : timeWaiting;
    }
    function shouldInvoke(time) {
        var timeSinceLastCall = time - lastCallTime;
        var timeSinceLastInvoke = time - lastInvokeTime;
        return (lastCallTime === undefined ||
            timeSinceLastCall >= wait ||
            timeSinceLastCall < 0 ||
            (maxWait !== undefined && timeSinceLastInvoke >= maxWait));
    }
    function timerExpired() {
        var time = Date.now();
        if (shouldInvoke(time)) {
            return trailingEdge(time);
        }
        timerId = setTimeout(timerExpired, remainingWait(time));
    }
    function trailingEdge(time) {
        timerId = undefined;
        if (trailing && lastArgs) {
            return invokeFunc(time);
        }
        lastArgs = undefined;
        return undefined;
    }
    function cancel() {
        if (timerId !== undefined) {
            clearTimeout(timerId);
        }
        lastInvokeTime = 0;
        lastArgs = undefined;
        lastCallTime = undefined;
        timerId = undefined;
    }
    function flush() {
        return timerId === undefined ? undefined : trailingEdge(Date.now());
    }
    function pending() {
        return timerId !== undefined;
    }
    function debounced() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var time = Date.now();
        var isInvoking = shouldInvoke(time);
        lastArgs = args;
        lastCallTime = time;
        if (isInvoking) {
            if (timerId === undefined) {
                return leadingEdge(lastCallTime);
            }
            if (maxWait) {
                timerId = setTimeout(timerExpired, wait);
                return invokeFunc(lastCallTime);
            }
        }
        if (timerId === undefined) {
            timerId = setTimeout(timerExpired, wait);
        }
    }
    debounced.cancel = cancel;
    debounced.flush = flush;
    debounced.pending = pending;
    return debounced;
}
