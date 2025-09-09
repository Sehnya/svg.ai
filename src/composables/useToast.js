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
Object.defineProperty(exports, "__esModule", { value: true });
exports.useToast = useToast;
var vue_1 = require("vue");
var toasts = (0, vue_1.ref)([]);
var toastIdCounter = 0;
function useToast() {
    var addToast = function (toast) {
        var id = "toast-".concat(++toastIdCounter);
        var newToast = __assign({ id: id, duration: 5000 }, toast);
        toasts.value.push(newToast);
        // Auto-remove toast after duration
        if (newToast.duration && newToast.duration > 0) {
            setTimeout(function () {
                removeToast(id);
            }, newToast.duration);
        }
        return id;
    };
    var removeToast = function (id) {
        var index = toasts.value.findIndex(function (toast) { return toast.id === id; });
        if (index > -1) {
            toasts.value.splice(index, 1);
        }
    };
    var clearAllToasts = function () {
        toasts.value = [];
    };
    // Convenience methods
    var success = function (title, message, options) {
        return addToast(__assign({ type: "success", title: title, message: message }, options));
    };
    var error = function (title, message, options) {
        return addToast(__assign({ type: "error", title: title, message: message, duration: 0 }, options));
    };
    var warning = function (title, message, options) {
        return addToast(__assign({ type: "warning", title: title, message: message }, options));
    };
    var info = function (title, message, options) {
        return addToast(__assign({ type: "info", title: title, message: message }, options));
    };
    return {
        toasts: toasts,
        addToast: addToast,
        removeToast: removeToast,
        clearAllToasts: clearAllToasts,
        success: success,
        error: error,
        warning: warning,
        info: info,
    };
}
