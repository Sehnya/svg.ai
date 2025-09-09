"use strict";
/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
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
var vue_1 = require("vue");
var props = withDefaults(defineProps(), {
    errors: function () { return []; },
    maxWarningsShown: 3,
    showGlobalActions: true,
    allowDismiss: true,
    allowRetry: true,
    autoCollapse: true,
});
var emit = defineEmits();
// State
var showAllWarnings = (0, vue_1.ref)(false);
var showLowPriorityErrors = (0, vue_1.ref)(!props.autoCollapse);
// Computed properties
var criticalErrors = (0, vue_1.computed)(function () {
    return props.errors.filter(function (error) { return error.type === "error" && error.priority === "critical"; });
});
var highPriorityErrors = (0, vue_1.computed)(function () {
    return props.errors.filter(function (error) { return error.type === "error" && error.priority === "high"; });
});
var lowPriorityErrors = (0, vue_1.computed)(function () {
    return props.errors.filter(function (error) {
        return error.type === "error" &&
            (error.priority === "medium" || error.priority === "low");
    });
});
var warnings = (0, vue_1.computed)(function () {
    return props.errors.filter(function (error) { return error.type === "warning"; });
});
var validationErrors = (0, vue_1.computed)(function () {
    return props.errors.filter(function (error) { return error.type === "validation"; });
});
var displayedWarnings = (0, vue_1.computed)(function () {
    if (showAllWarnings.value ||
        warnings.value.length <= props.maxWarningsShown) {
        return warnings.value;
    }
    return warnings.value.slice(0, props.maxWarningsShown);
});
var hasErrors = (0, vue_1.computed)(function () {
    return props.errors.some(function (error) { return error.type === "error" || error.type === "validation"; });
});
var hasWarnings = (0, vue_1.computed)(function () {
    return props.errors.some(function (error) { return error.type === "warning"; });
});
var totalErrorCount = (0, vue_1.computed)(function () { return props.errors.length; });
// Methods
var handleErrorAction = function (error) {
    if (error.action) {
        error.action.handler();
    }
    emit("action", error);
};
var dismissAll = function () {
    emit("dismissAll");
};
// Helper function to create error items
var createError = function (message, options) {
    if (options === void 0) { options = {}; }
    return (__assign({ id: Math.random().toString(36).substr(2, 9), message: message, priority: "medium", type: "error", dismissible: true }, options));
};
var createWarning = function (message, options) {
    if (options === void 0) { options = {}; }
    return (__assign({ id: Math.random().toString(36).substr(2, 9), message: message, priority: "medium", type: "warning", dismissible: true }, options));
};
var createValidationError = function (field, message, options) {
    if (options === void 0) { options = {}; }
    return (__assign({ id: Math.random().toString(36).substr(2, 9), message: message, field: field, priority: "high", type: "validation", dismissible: false }, options));
};
// Expose helper functions for parent components
var __VLS_exposed = {
    createError: createError,
    createWarning: createWarning,
    createValidationError: createValidationError,
};
defineExpose(__VLS_exposed);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
var __VLS_withDefaultsArg = (function (t) { return t; })({
    errors: function () { return []; },
    maxWarningsShown: 3,
    showGlobalActions: true,
    allowDismiss: true,
    allowRetry: true,
    autoCollapse: true,
});
var __VLS_ctx = {};
var __VLS_components;
var __VLS_directives;
if (__VLS_ctx.hasErrors || __VLS_ctx.hasWarnings) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "space-y-3" }));
    if (__VLS_ctx.criticalErrors.length > 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "bg-red-50 border border-red-200 rounded-md p-4" }));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "flex" }));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "flex-shrink-0" }));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)(__assign({ class: "h-5 w-5 text-red-400" }, { viewBox: "0 0 20 20", fill: "currentColor" }));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
            'fill-rule': "evenodd",
            d: "M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z",
            'clip-rule': "evenodd",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "ml-3 flex-1" }));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)(__assign({ class: "text-sm font-medium text-red-800" }));
        (__VLS_ctx.criticalErrors.length === 1 ? "Critical Error" : "Critical Errors");
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "mt-2 text-sm text-red-700" }));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)(__assign({ class: "list-disc list-inside space-y-1" }));
        var _loop_1 = function (error) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
                key: (error.id),
            });
            (error.message);
            if (error.action) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)(__assign({ onClick: function () {
                        var _a = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            _a[_i] = arguments[_i];
                        }
                        var $event = _a[0];
                        if (!(__VLS_ctx.hasErrors || __VLS_ctx.hasWarnings))
                            return;
                        if (!(__VLS_ctx.criticalErrors.length > 0))
                            return;
                        if (!(error.action))
                            return;
                        __VLS_ctx.handleErrorAction(error);
                    } }, { class: "ml-2 text-red-800 underline hover:text-red-900" }));
                (error.action.label);
            }
        };
        for (var _i = 0, _a = __VLS_getVForSourceType((__VLS_ctx.criticalErrors)); _i < _a.length; _i++) {
            var error = _a[_i][0];
            _loop_1(error);
        }
    }
    if (__VLS_ctx.highPriorityErrors.length > 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "bg-orange-50 border border-orange-200 rounded-md p-4" }));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "flex" }));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "flex-shrink-0" }));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)(__assign({ class: "h-5 w-5 text-orange-400" }, { viewBox: "0 0 20 20", fill: "currentColor" }));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
            'fill-rule': "evenodd",
            d: "M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z",
            'clip-rule': "evenodd",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "ml-3 flex-1" }));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)(__assign({ class: "text-sm font-medium text-orange-800" }));
        (__VLS_ctx.highPriorityErrors.length === 1 ? "Error" : "Errors");
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "mt-2 text-sm text-orange-700" }));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)(__assign({ class: "list-disc list-inside space-y-1" }));
        var _loop_2 = function (error) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
                key: (error.id),
            });
            (error.message);
            if (error.action) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)(__assign({ onClick: function () {
                        var _a = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            _a[_i] = arguments[_i];
                        }
                        var $event = _a[0];
                        if (!(__VLS_ctx.hasErrors || __VLS_ctx.hasWarnings))
                            return;
                        if (!(__VLS_ctx.highPriorityErrors.length > 0))
                            return;
                        if (!(error.action))
                            return;
                        __VLS_ctx.handleErrorAction(error);
                    } }, { class: "ml-2 text-orange-800 underline hover:text-orange-900" }));
                (error.action.label);
            }
        };
        for (var _b = 0, _c = __VLS_getVForSourceType((__VLS_ctx.highPriorityErrors)); _b < _c.length; _b++) {
            var error = _c[_b][0];
            _loop_2(error);
        }
    }
    if (__VLS_ctx.warnings.length > 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "bg-yellow-50 border border-yellow-200 rounded-md p-4" }));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "flex" }));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "flex-shrink-0" }));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)(__assign({ class: "h-5 w-5 text-yellow-400" }, { viewBox: "0 0 20 20", fill: "currentColor" }));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
            'fill-rule': "evenodd",
            d: "M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z",
            'clip-rule': "evenodd",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "ml-3 flex-1" }));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "flex items-center justify-between" }));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)(__assign({ class: "text-sm font-medium text-yellow-800" }));
        (__VLS_ctx.warnings.length === 1 ? "Warning" : "Warnings");
        if (__VLS_ctx.warnings.length > __VLS_ctx.maxWarningsShown && !__VLS_ctx.showAllWarnings) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)(__assign({ onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!(__VLS_ctx.hasErrors || __VLS_ctx.hasWarnings))
                        return;
                    if (!(__VLS_ctx.warnings.length > 0))
                        return;
                    if (!(__VLS_ctx.warnings.length > __VLS_ctx.maxWarningsShown && !__VLS_ctx.showAllWarnings))
                        return;
                    __VLS_ctx.showAllWarnings = true;
                } }, { class: "text-xs text-yellow-700 hover:text-yellow-800 underline" }));
            (__VLS_ctx.warnings.length);
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "mt-2 text-sm text-yellow-700" }));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)(__assign({ class: "list-disc list-inside space-y-1" }));
        var _loop_3 = function (warning) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
                key: (warning.id),
            });
            (warning.message);
            if (warning.action) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)(__assign({ onClick: function () {
                        var _a = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            _a[_i] = arguments[_i];
                        }
                        var $event = _a[0];
                        if (!(__VLS_ctx.hasErrors || __VLS_ctx.hasWarnings))
                            return;
                        if (!(__VLS_ctx.warnings.length > 0))
                            return;
                        if (!(warning.action))
                            return;
                        __VLS_ctx.handleErrorAction(warning);
                    } }, { class: "ml-2 text-yellow-800 underline hover:text-yellow-900" }));
                (warning.action.label);
            }
        };
        for (var _d = 0, _e = __VLS_getVForSourceType((__VLS_ctx.displayedWarnings)); _d < _e.length; _d++) {
            var warning = _e[_d][0];
            _loop_3(warning);
        }
        if (__VLS_ctx.showAllWarnings && __VLS_ctx.warnings.length > __VLS_ctx.maxWarningsShown) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)(__assign({ onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!(__VLS_ctx.hasErrors || __VLS_ctx.hasWarnings))
                        return;
                    if (!(__VLS_ctx.warnings.length > 0))
                        return;
                    if (!(__VLS_ctx.showAllWarnings && __VLS_ctx.warnings.length > __VLS_ctx.maxWarningsShown))
                        return;
                    __VLS_ctx.showAllWarnings = false;
                } }, { class: "mt-2 text-xs text-yellow-700 hover:text-yellow-800 underline" }));
        }
    }
    if (__VLS_ctx.lowPriorityErrors.length > 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)(__assign({ onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                if (!(__VLS_ctx.hasErrors || __VLS_ctx.hasWarnings))
                    return;
                if (!(__VLS_ctx.lowPriorityErrors.length > 0))
                    return;
                __VLS_ctx.showLowPriorityErrors = !__VLS_ctx.showLowPriorityErrors;
            } }, { class: "flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors" }));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)(__assign({ class: ([
                'w-4 h-4 mr-1 transition-transform',
                __VLS_ctx.showLowPriorityErrors ? 'rotate-90' : '',
            ]) }, { fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" }));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
            'stroke-linecap': "round",
            'stroke-linejoin': "round",
            'stroke-width': "2",
            d: "M9 5l7 7-7 7",
        });
        (__VLS_ctx.lowPriorityErrors.length);
        (__VLS_ctx.lowPriorityErrors.length !== 1 ? "s" : "");
        if (__VLS_ctx.showLowPriorityErrors) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "mt-2 bg-gray-50 border border-gray-200 rounded-md p-4" }));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "text-sm text-gray-700" }));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)(__assign({ class: "list-disc list-inside space-y-1" }));
            var _loop_4 = function (error) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
                    key: (error.id),
                });
                (error.message);
                if (error.action) {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)(__assign({ onClick: function () {
                            var _a = [];
                            for (var _i = 0; _i < arguments.length; _i++) {
                                _a[_i] = arguments[_i];
                            }
                            var $event = _a[0];
                            if (!(__VLS_ctx.hasErrors || __VLS_ctx.hasWarnings))
                                return;
                            if (!(__VLS_ctx.lowPriorityErrors.length > 0))
                                return;
                            if (!(__VLS_ctx.showLowPriorityErrors))
                                return;
                            if (!(error.action))
                                return;
                            __VLS_ctx.handleErrorAction(error);
                        } }, { class: "ml-2 text-gray-800 underline hover:text-gray-900" }));
                    (error.action.label);
                }
            };
            for (var _f = 0, _g = __VLS_getVForSourceType((__VLS_ctx.lowPriorityErrors)); _f < _g.length; _f++) {
                var error = _g[_f][0];
                _loop_4(error);
            }
        }
    }
    if (__VLS_ctx.validationErrors.length > 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "space-y-2" }));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)(__assign({ class: "text-sm font-medium text-gray-900" }));
        var _loop_5 = function (error) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ key: (error.id) }, { class: "flex items-start space-x-2 p-2 bg-red-50 border border-red-200 rounded" }));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)(__assign({ class: "w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" }, { fill: "currentColor", viewBox: "0 0 20 20" }));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
                'fill-rule': "evenodd",
                d: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z",
                'clip-rule': "evenodd",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "flex-1" }));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)(__assign({ class: "text-sm text-red-800" }));
            if (error.field) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)(__assign({ class: "font-medium" }));
                (error.field);
            }
            (error.message);
            if (error.action) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)(__assign({ onClick: function () {
                        var _a = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            _a[_i] = arguments[_i];
                        }
                        var $event = _a[0];
                        if (!(__VLS_ctx.hasErrors || __VLS_ctx.hasWarnings))
                            return;
                        if (!(__VLS_ctx.validationErrors.length > 0))
                            return;
                        if (!(error.action))
                            return;
                        __VLS_ctx.handleErrorAction(error);
                    } }, { class: "mt-1 text-xs text-red-700 underline hover:text-red-800" }));
                (error.action.label);
            }
        };
        for (var _h = 0, _j = __VLS_getVForSourceType((__VLS_ctx.validationErrors)); _h < _j.length; _h++) {
            var error = _j[_h][0];
            _loop_5(error);
        }
    }
    if (__VLS_ctx.showGlobalActions && (__VLS_ctx.hasErrors || __VLS_ctx.hasWarnings)) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "flex items-center justify-between pt-3 border-t border-gray-200" }));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "text-sm text-gray-500" }));
        (__VLS_ctx.totalErrorCount);
        (__VLS_ctx.totalErrorCount !== 1 ? "s" : "");
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "flex items-center space-x-2" }));
        if (__VLS_ctx.allowDismiss) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)(__assign({ onClick: (__VLS_ctx.dismissAll) }, { class: "text-sm text-gray-600 hover:text-gray-800 transition-colors" }));
        }
        if (__VLS_ctx.allowRetry) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)(__assign({ onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!(__VLS_ctx.hasErrors || __VLS_ctx.hasWarnings))
                        return;
                    if (!(__VLS_ctx.showGlobalActions && (__VLS_ctx.hasErrors || __VLS_ctx.hasWarnings)))
                        return;
                    if (!(__VLS_ctx.allowRetry))
                        return;
                    __VLS_ctx.$emit('retry');
                } }, { class: "inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" }));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)(__assign({ class: "w-4 h-4 mr-1" }, { fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" }));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
                'stroke-linecap': "round",
                'stroke-linejoin': "round",
                'stroke-width': "2",
                d: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
            });
        }
    }
}
/** @type {__VLS_StyleScopedClasses['space-y-3']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-red-50']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-red-200']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-shrink-0']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-red-400']} */ ;
/** @type {__VLS_StyleScopedClasses['ml-3']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-red-800']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-red-700']} */ ;
/** @type {__VLS_StyleScopedClasses['list-disc']} */ ;
/** @type {__VLS_StyleScopedClasses['list-inside']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-1']} */ ;
/** @type {__VLS_StyleScopedClasses['ml-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-red-800']} */ ;
/** @type {__VLS_StyleScopedClasses['underline']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-red-900']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-orange-50']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-orange-200']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-shrink-0']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-orange-400']} */ ;
/** @type {__VLS_StyleScopedClasses['ml-3']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-orange-800']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-orange-700']} */ ;
/** @type {__VLS_StyleScopedClasses['list-disc']} */ ;
/** @type {__VLS_StyleScopedClasses['list-inside']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-1']} */ ;
/** @type {__VLS_StyleScopedClasses['ml-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-orange-800']} */ ;
/** @type {__VLS_StyleScopedClasses['underline']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-orange-900']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-yellow-50']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-yellow-200']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-shrink-0']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-yellow-400']} */ ;
/** @type {__VLS_StyleScopedClasses['ml-3']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-yellow-800']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-yellow-700']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-yellow-800']} */ ;
/** @type {__VLS_StyleScopedClasses['underline']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-yellow-700']} */ ;
/** @type {__VLS_StyleScopedClasses['list-disc']} */ ;
/** @type {__VLS_StyleScopedClasses['list-inside']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-1']} */ ;
/** @type {__VLS_StyleScopedClasses['ml-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-yellow-800']} */ ;
/** @type {__VLS_StyleScopedClasses['underline']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-yellow-900']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-yellow-700']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-yellow-800']} */ ;
/** @type {__VLS_StyleScopedClasses['underline']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-gray-800']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gray-50']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['list-disc']} */ ;
/** @type {__VLS_StyleScopedClasses['list-inside']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-1']} */ ;
/** @type {__VLS_StyleScopedClasses['ml-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
/** @type {__VLS_StyleScopedClasses['underline']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-start']} */ ;
/** @type {__VLS_StyleScopedClasses['space-x-2']} */ ;
/** @type {__VLS_StyleScopedClasses['p-2']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-red-50']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-red-200']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-red-400']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-0.5']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-shrink-0']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-red-800']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-red-700']} */ ;
/** @type {__VLS_StyleScopedClasses['underline']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-red-800']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['pt-3']} */ ;
/** @type {__VLS_StyleScopedClasses['border-t']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['space-x-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-gray-800']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-gray-50']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-offset-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-blue-500']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['mr-1']} */ ;
var __VLS_dollars;
var __VLS_self = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    setup: function () {
        return {
            showAllWarnings: showAllWarnings,
            showLowPriorityErrors: showLowPriorityErrors,
            criticalErrors: criticalErrors,
            highPriorityErrors: highPriorityErrors,
            lowPriorityErrors: lowPriorityErrors,
            warnings: warnings,
            validationErrors: validationErrors,
            displayedWarnings: displayedWarnings,
            hasErrors: hasErrors,
            hasWarnings: hasWarnings,
            totalErrorCount: totalErrorCount,
            handleErrorAction: handleErrorAction,
            dismissAll: dismissAll,
        };
    },
    __typeEmits: {},
    __typeProps: {},
    props: {},
});
exports.default = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    setup: function () {
        return __assign({}, __VLS_exposed);
    },
    __typeEmits: {},
    __typeProps: {},
    props: {},
});
; /* PartiallyEnd: #4569/main.vue */
