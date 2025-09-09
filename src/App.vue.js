"use strict";
/// <reference types="../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
Object.defineProperty(exports, "__esModule", { value: true });
var vue_1 = require("vue");
var useGeneration_1 = require("./composables/useGeneration");
var useErrorHandler_1 = require("./composables/useErrorHandler");
var useFeedback_1 = require("./composables/useFeedback");
var ToastContainer_vue_1 = require("./components/ToastContainer.vue");
var SVGPreview_vue_1 = require("./components/SVGPreview.vue");
var CodeOutput_vue_1 = require("./components/CodeOutput.vue");
var MetadataDisplay_vue_1 = require("./components/MetadataDisplay.vue");
var LayerInspector_vue_1 = require("./components/LayerInspector.vue");
var FeedbackControls_vue_1 = require("./components/FeedbackControls.vue");
var AnalyticsDashboard_vue_1 = require("./components/AnalyticsDashboard.vue");
var ExportOptions_vue_1 = require("./components/ExportOptions.vue");
var DebouncedInput_vue_1 = require("./components/DebouncedInput.vue");
var ErrorDisplay_vue_1 = require("./components/ErrorDisplay.vue");
// Use generation composable
var _l = (0, useGeneration_1.useGeneration)(), generationParams = _l.generationParams, generationResult = _l.generationResult, sizePresets = _l.sizePresets, isGenerating = _l.isGenerating, error = _l.error, isOnline = _l.isOnline, canRetry = _l.canRetry, canGenerate = _l.canGenerate, setSizePreset = _l.setSizePreset, generateSVG = _l.generateSVG, retryGeneration = _l.retryGeneration, clearError = _l.clearError;
var errorHandler = (0, useErrorHandler_1.useErrorHandler)();
var submitImplicitFeedback = (0, useFeedback_1.useFeedback)().submitImplicitFeedback;
var globalError = (0, vue_1.ref)(null);
var selectedLayer = (0, vue_1.ref)(null);
var currentFormat = (0, vue_1.ref)("svg");
var showAnalytics = (0, vue_1.ref)(false);
// Enhanced UI state
var promptSuggestions = (0, vue_1.ref)([
    "blue circle with red border",
    "simple house icon",
    "geometric pattern",
    "minimalist logo",
    "abstract shapes",
    "nature illustration",
    "tech icon design",
    "decorative border",
]);
var errorItems = (0, vue_1.ref)([]);
// Computed properties
var svgStatistics = (0, vue_1.computed)(function () {
    var _a, _b, _c;
    if (!((_a = generationResult.value) === null || _a === void 0 ? void 0 : _a.layers))
        return null;
    var layers = generationResult.value.layers;
    var elementCount = layers.length;
    var hasGroups = layers.some(function (layer) { return layer.type === "group"; });
    var hasText = layers.some(function (layer) { return layer.type === "text"; });
    var colorCount = ((_c = (_b = generationResult.value.meta) === null || _b === void 0 ? void 0 : _b.palette) === null || _c === void 0 ? void 0 : _c.length) || 0;
    var complexity = "simple";
    if (elementCount > 10 || hasGroups)
        complexity = "moderate";
    if (elementCount > 20 || (hasGroups && hasText))
        complexity = "complex";
    return {
        elementCount: elementCount,
        hasGroups: hasGroups,
        hasText: hasText,
        colorCount: colorCount,
        complexity: complexity,
    };
});
// Methods
var getFilename = function () {
    var timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, "");
    return "svg-ai-".concat(timestamp);
};
var handleCopy = function () {
    errorHandler.showSuccess("Copied!", "SVG copied to clipboard");
};
var handleDownload = function () { return __awaiter(void 0, void 0, void 0, function () {
    var error_1;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                if (!((_a = generationResult.value) === null || _a === void 0 ? void 0 : _a.eventId)) return [3 /*break*/, 4];
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, , 4]);
                return [4 /*yield*/, submitImplicitFeedback({
                        eventId: generationResult.value.eventId,
                        signal: "exported",
                    })];
            case 2:
                _b.sent();
                return [3 /*break*/, 4];
            case 3:
                error_1 = _b.sent();
                console.warn("Failed to record export feedback:", error_1);
                return [3 /*break*/, 4];
            case 4:
                errorHandler.showSuccess("Downloaded!", "SVG file downloaded successfully");
                return [2 /*return*/];
        }
    });
}); };
var handleCodeCopy = function (_code, format) {
    errorHandler.showSuccess("Copied!", "".concat(format.toUpperCase(), " code copied to clipboard"));
};
var handleCodeDownload = function (_code, _format, filename) { return __awaiter(void 0, void 0, void 0, function () {
    var error_2;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                if (!((_a = generationResult.value) === null || _a === void 0 ? void 0 : _a.eventId)) return [3 /*break*/, 4];
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, , 4]);
                return [4 /*yield*/, submitImplicitFeedback({
                        eventId: generationResult.value.eventId,
                        signal: "exported",
                    })];
            case 2:
                _b.sent();
                return [3 /*break*/, 4];
            case 3:
                error_2 = _b.sent();
                console.warn("Failed to record export feedback:", error_2);
                return [3 /*break*/, 4];
            case 4:
                errorHandler.showSuccess("Downloaded!", "".concat(filename, " downloaded successfully"));
                return [2 /*return*/];
        }
    });
}); };
var handleFormatChange = function (format) {
    currentFormat.value = format;
};
var handleCodeError = function (error) {
    errorHandler.showError("Error", error);
};
var handleLayerSelect = function (layerId) {
    selectedLayer.value = layerId;
    // Could highlight the layer in the preview here
};
var handleLayerIdCopy = function (layerId) {
    errorHandler.showSuccess("Copied!", "Layer ID \"".concat(layerId, "\" copied to clipboard"));
};
var clearGlobalError = function () {
    globalError.value = null;
};
// Enhanced UI methods
var handlePromptChange = function (value) {
    // Handle debounced prompt changes
    console.log("Prompt changed:", value);
};
var handleSuggestionSelect = function (suggestion) {
    var text = typeof suggestion === "string" ? suggestion : suggestion.text;
    generationParams.prompt = text;
};
var handleExport = function (options) {
    console.log("Export options:", options);
    // Handle export with specific options
};
var handleExportCopy = function (_content) {
    errorHandler.showSuccess("Copied!", "Export content copied to clipboard");
};
var handleExportError = function (error) {
    errorHandler.showError("Export Error", error);
};
var handleReusePrompt = function (prompt) {
    generationParams.prompt = prompt;
};
var handleAnalyticsError = function (error) {
    errorHandler.showError("Analytics Error", error);
};
var clearAllErrors = function () {
    errorItems.value = [];
    clearError();
    clearGlobalError();
};
var handleErrorAction = function (error) {
    console.log("Error action:", error);
};
// Global error handler
window.addEventListener("error", function (event) {
    var error = event.error || new Error("Unknown error");
    errorHandler.handleUnexpectedError(error, {
        component: "App",
        action: "global_error_handler",
    });
});
window.addEventListener("unhandledrejection", function (event) {
    var _a;
    var error = event.reason instanceof Error
        ? event.reason
        : new Error(((_a = event.reason) === null || _a === void 0 ? void 0 : _a.message) || "Unknown error");
    errorHandler.handleUnexpectedError(error, {
        component: "App",
        action: "unhandled_rejection",
    });
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
var __VLS_ctx = {};
var __VLS_components;
var __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "min-h-screen bg-gray-50" }));
__VLS_asFunctionalElement(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)(__assign({ class: "bg-white shadow-sm border-b border-gray-200" }));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" }));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "flex justify-between items-center h-16" }));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "flex items-center" }));
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)(__assign({ class: "text-xl font-semibold text-gray-900" }));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "flex items-center space-x-4" }));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "text-sm text-gray-500" }));
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)(__assign({ onClick: function () {
        var _a = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            _a[_i] = arguments[_i];
        }
        var $event = _a[0];
        __VLS_ctx.showAnalytics = !__VLS_ctx.showAnalytics;
    } }, { class: ([
        'px-3 py-1 text-xs font-medium rounded-md transition-colors',
        __VLS_ctx.showAnalytics
            ? 'bg-blue-100 text-blue-800'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    ]) }));
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)(__assign({ class: "w-4 h-4 inline mr-1" }, { fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" }));
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    'stroke-linecap': "round",
    'stroke-linejoin': "round",
    'stroke-width': "2",
    d: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "flex items-center space-x-2" }));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: ([
        'w-2 h-2 rounded-full',
        __VLS_ctx.isOnline ? 'bg-green-400' : 'bg-red-400',
    ]) }));
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)(__assign({ class: "text-xs text-gray-500" }));
(__VLS_ctx.isOnline ? "Online" : "Offline");
__VLS_asFunctionalElement(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)(__assign({ class: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" }));
if (!__VLS_ctx.isOnline) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "mb-6" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "bg-yellow-50 border border-yellow-200 rounded-md p-4" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "flex" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "flex-shrink-0" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)(__assign({ class: "h-5 w-5 text-yellow-400" }, { viewBox: "0 0 20 20", fill: "currentColor" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
        'fill-rule': "evenodd",
        d: "M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z",
        'clip-rule': "evenodd",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "ml-3" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)(__assign({ class: "text-sm font-medium text-yellow-800" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "mt-2 text-sm text-yellow-700" }));
}
if (__VLS_ctx.errorItems.length > 0) {
    /** @type {[typeof ErrorDisplay, ]} */ ;
    // @ts-ignore
    var __VLS_0 = __VLS_asFunctionalComponent(ErrorDisplay_vue_1.default, new ErrorDisplay_vue_1.default(__assign(__assign(__assign(__assign({ 'onRetry': {} }, { 'onDismissAll': {} }), { 'onAction': {} }), { errors: (__VLS_ctx.errorItems), allowRetry: (__VLS_ctx.canRetry) }), { class: "mb-6" })));
    var __VLS_1 = __VLS_0.apply(void 0, __spreadArray([__assign(__assign(__assign(__assign({ 'onRetry': {} }, { 'onDismissAll': {} }), { 'onAction': {} }), { errors: (__VLS_ctx.errorItems), allowRetry: (__VLS_ctx.canRetry) }), { class: "mb-6" })], __VLS_functionalComponentArgsRest(__VLS_0), false));
    var __VLS_3 = void 0;
    var __VLS_4 = void 0;
    var __VLS_5 = void 0;
    var __VLS_6 = {
        onRetry: (__VLS_ctx.retryGeneration)
    };
    var __VLS_7 = {
        onDismissAll: (__VLS_ctx.clearAllErrors)
    };
    var __VLS_8 = {
        onAction: (__VLS_ctx.handleErrorAction)
    };
    var __VLS_2;
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "grid grid-cols-1 lg:grid-cols-2 gap-8" }));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "space-y-6" }));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "bg-white rounded-lg shadow p-6" }));
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)(__assign({ class: "text-lg font-medium text-gray-900 mb-4" }));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "space-y-4" }));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)(__assign({ for: "prompt" }, { class: "block text-sm font-medium text-gray-700 mb-2" }));
/** @type {[typeof DebouncedInput, ]} */ ;
// @ts-ignore
var __VLS_9 = __VLS_asFunctionalComponent(DebouncedInput_vue_1.default, new DebouncedInput_vue_1.default(__assign(__assign({ 'onDebouncedInput': {} }, { 'onSuggestionSelect': {} }), { modelValue: (__VLS_ctx.generationParams.prompt), type: "textarea", rows: (3), placeholder: "e.g., A blue circle with a red border, or a simple house icon", maxLength: (500), debounceMs: (300), showCharacterCount: (true), showSuggestions: (true), suggestions: (__VLS_ctx.promptSuggestions) })));
var __VLS_10 = __VLS_9.apply(void 0, __spreadArray([__assign(__assign({ 'onDebouncedInput': {} }, { 'onSuggestionSelect': {} }), { modelValue: (__VLS_ctx.generationParams.prompt), type: "textarea", rows: (3), placeholder: "e.g., A blue circle with a red border, or a simple house icon", maxLength: (500), debounceMs: (300), showCharacterCount: (true), showSuggestions: (true), suggestions: (__VLS_ctx.promptSuggestions) })], __VLS_functionalComponentArgsRest(__VLS_9), false));
var __VLS_12;
var __VLS_13;
var __VLS_14;
var __VLS_15 = {
    onDebouncedInput: (__VLS_ctx.handlePromptChange)
};
var __VLS_16 = {
    onSuggestionSelect: (__VLS_ctx.handleSuggestionSelect)
};
var __VLS_11;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)(__assign({ class: "block text-sm font-medium text-gray-700 mb-2" }));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3" }));
var _loop_1 = function (preset) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)(__assign(__assign({ onClick: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.setSizePreset(preset);
        } }, { key: (preset.name) }), { class: ([
            'px-3 py-2 text-xs font-medium rounded border',
            __VLS_ctx.generationParams.size.preset === preset.name
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50',
        ]) }));
    (preset.label);
};
for (var _i = 0, _m = __VLS_getVForSourceType((__VLS_ctx.sizePresets)); _i < _m.length; _i++) {
    var preset = _m[_i][0];
    _loop_1(preset);
}
if (__VLS_ctx.generationParams.size.preset === 'custom') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "grid grid-cols-2 gap-3" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)(__assign({ class: "block text-xs font-medium text-gray-700 mb-1" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)(__assign({ type: "number", min: "16", max: "2048" }, { class: "w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500" }));
    (__VLS_ctx.generationParams.size.width);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)(__assign({ class: "block text-xs font-medium text-gray-700 mb-1" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)(__assign({ type: "number", min: "16", max: "2048" }, { class: "w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500" }));
    (__VLS_ctx.generationParams.size.height);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)(__assign(__assign({ onClick: (__VLS_ctx.generateSVG) }, { disabled: (!__VLS_ctx.canGenerate || __VLS_ctx.isGenerating) }), { class: "w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed" }));
if (__VLS_ctx.isGenerating) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)(__assign({ class: "flex items-center justify-center" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)(__assign({ class: "animate-spin -ml-1 mr-3 h-5 w-5 text-white" }, { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.circle, __VLS_intrinsicElements.circle)(__assign({ class: "opacity-25" }, { cx: "12", cy: "12", r: "10", stroke: "currentColor", 'stroke-width': "4" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.path, __VLS_intrinsicElements.path)(__assign({ class: "opacity-75" }, { fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" }));
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "space-y-6" }));
/** @type {[typeof SVGPreview, ]} */ ;
// @ts-ignore
var __VLS_17 = __VLS_asFunctionalComponent(SVGPreview_vue_1.default, new SVGPreview_vue_1.default(__assign(__assign({ 'onCopy': {} }, { 'onDownload': {} }), { svgContent: (((_a = __VLS_ctx.generationResult) === null || _a === void 0 ? void 0 : _a.svg) || ''), metadata: ((_b = __VLS_ctx.generationResult) === null || _b === void 0 ? void 0 : _b.meta), loading: (__VLS_ctx.isGenerating), error: (__VLS_ctx.error || undefined) })));
var __VLS_18 = __VLS_17.apply(void 0, __spreadArray([__assign(__assign({ 'onCopy': {} }, { 'onDownload': {} }), { svgContent: (((_c = __VLS_ctx.generationResult) === null || _c === void 0 ? void 0 : _c.svg) || ''), metadata: ((_d = __VLS_ctx.generationResult) === null || _d === void 0 ? void 0 : _d.meta), loading: (__VLS_ctx.isGenerating), error: (__VLS_ctx.error || undefined) })], __VLS_functionalComponentArgsRest(__VLS_17), false));
var __VLS_20;
var __VLS_21;
var __VLS_22;
var __VLS_23 = {
    onCopy: (__VLS_ctx.handleCopy)
};
var __VLS_24 = {
    onDownload: (__VLS_ctx.handleDownload)
};
var __VLS_19;
if ((_e = __VLS_ctx.generationResult) === null || _e === void 0 ? void 0 : _e.svg) {
    /** @type {[typeof ExportOptions, ]} */ ;
    // @ts-ignore
    var __VLS_25 = __VLS_asFunctionalComponent(ExportOptions_vue_1.default, new ExportOptions_vue_1.default(__assign(__assign(__assign({ 'onExport': {} }, { 'onCopy': {} }), { 'onError': {} }), { svgContent: (__VLS_ctx.generationResult.svg), originalSize: (__VLS_ctx.generationResult.meta
            ? {
                width: __VLS_ctx.generationResult.meta.width,
                height: __VLS_ctx.generationResult.meta.height,
            }
            : undefined), title: "Export Options", showAdvancedOptions: (true) })));
    var __VLS_26 = __VLS_25.apply(void 0, __spreadArray([__assign(__assign(__assign({ 'onExport': {} }, { 'onCopy': {} }), { 'onError': {} }), { svgContent: (__VLS_ctx.generationResult.svg), originalSize: (__VLS_ctx.generationResult.meta
                ? {
                    width: __VLS_ctx.generationResult.meta.width,
                    height: __VLS_ctx.generationResult.meta.height,
                }
                : undefined), title: "Export Options", showAdvancedOptions: (true) })], __VLS_functionalComponentArgsRest(__VLS_25), false));
    var __VLS_28 = void 0;
    var __VLS_29 = void 0;
    var __VLS_30 = void 0;
    var __VLS_31 = {
        onExport: (__VLS_ctx.handleExport)
    };
    var __VLS_32 = {
        onCopy: (__VLS_ctx.handleExportCopy)
    };
    var __VLS_33 = {
        onError: (__VLS_ctx.handleExportError)
    };
    var __VLS_27;
}
if ((_f = __VLS_ctx.generationResult) === null || _f === void 0 ? void 0 : _f.svg) {
    /** @type {[typeof CodeOutput, ]} */ ;
    // @ts-ignore
    var __VLS_34 = __VLS_asFunctionalComponent(CodeOutput_vue_1.default, new CodeOutput_vue_1.default(__assign(__assign(__assign(__assign({ 'onCopy': {} }, { 'onDownload': {} }), { 'onFormatChange': {} }), { 'onError': {} }), { svgCode: (__VLS_ctx.generationResult.svg), title: "SVG Code", showFormatSelector: (true), showDownloadButton: (true), showFooter: (true), filename: (__VLS_ctx.getFilename()) })));
    var __VLS_35 = __VLS_34.apply(void 0, __spreadArray([__assign(__assign(__assign(__assign({ 'onCopy': {} }, { 'onDownload': {} }), { 'onFormatChange': {} }), { 'onError': {} }), { svgCode: (__VLS_ctx.generationResult.svg), title: "SVG Code", showFormatSelector: (true), showDownloadButton: (true), showFooter: (true), filename: (__VLS_ctx.getFilename()) })], __VLS_functionalComponentArgsRest(__VLS_34), false));
    var __VLS_37 = void 0;
    var __VLS_38 = void 0;
    var __VLS_39 = void 0;
    var __VLS_40 = {
        onCopy: (__VLS_ctx.handleCodeCopy)
    };
    var __VLS_41 = {
        onDownload: (__VLS_ctx.handleCodeDownload)
    };
    var __VLS_42 = {
        onFormatChange: (__VLS_ctx.handleFormatChange)
    };
    var __VLS_43 = {
        onError: (__VLS_ctx.handleCodeError)
    };
    var __VLS_36;
}
if ((_g = __VLS_ctx.generationResult) === null || _g === void 0 ? void 0 : _g.meta) {
    /** @type {[typeof MetadataDisplay, ]} */ ;
    // @ts-ignore
    var __VLS_44 = __VLS_asFunctionalComponent(MetadataDisplay_vue_1.default, new MetadataDisplay_vue_1.default({
        metadata: (__VLS_ctx.generationResult.meta),
        layers: (__VLS_ctx.generationResult.layers),
        statistics: (__VLS_ctx.svgStatistics || undefined),
        title: "SVG Information",
        collapsible: (true),
        showStatistics: (true),
    }));
    var __VLS_45 = __VLS_44.apply(void 0, __spreadArray([{
            metadata: (__VLS_ctx.generationResult.meta),
            layers: (__VLS_ctx.generationResult.layers),
            statistics: (__VLS_ctx.svgStatistics || undefined),
            title: "SVG Information",
            collapsible: (true),
            showStatistics: (true),
        }], __VLS_functionalComponentArgsRest(__VLS_44), false));
}
if (((_h = __VLS_ctx.generationResult) === null || _h === void 0 ? void 0 : _h.layers) && __VLS_ctx.generationResult.layers.length > 0) {
    /** @type {[typeof LayerInspector, ]} */ ;
    // @ts-ignore
    var __VLS_47 = __VLS_asFunctionalComponent(LayerInspector_vue_1.default, new LayerInspector_vue_1.default(__assign(__assign({ 'onSelectLayer': {} }, { 'onCopyId': {} }), { layers: (__VLS_ctx.generationResult.layers), title: "Layer Inspector", showDetails: (true), defaultExpanded: (false) })));
    var __VLS_48 = __VLS_47.apply(void 0, __spreadArray([__assign(__assign({ 'onSelectLayer': {} }, { 'onCopyId': {} }), { layers: (__VLS_ctx.generationResult.layers), title: "Layer Inspector", showDetails: (true), defaultExpanded: (false) })], __VLS_functionalComponentArgsRest(__VLS_47), false));
    var __VLS_50 = void 0;
    var __VLS_51 = void 0;
    var __VLS_52 = void 0;
    var __VLS_53 = {
        onSelectLayer: (__VLS_ctx.handleLayerSelect)
    };
    var __VLS_54 = {
        onCopyId: (__VLS_ctx.handleLayerIdCopy)
    };
    var __VLS_49;
}
if ((_j = __VLS_ctx.generationResult) === null || _j === void 0 ? void 0 : _j.eventId) {
    /** @type {[typeof FeedbackControls, ]} */ ;
    // @ts-ignore
    var __VLS_55 = __VLS_asFunctionalComponent(FeedbackControls_vue_1.default, new FeedbackControls_vue_1.default({
        eventId: (__VLS_ctx.generationResult.eventId),
        userId: (undefined),
    }));
    var __VLS_56 = __VLS_55.apply(void 0, __spreadArray([{
            eventId: (__VLS_ctx.generationResult.eventId),
            userId: (undefined),
        }], __VLS_functionalComponentArgsRest(__VLS_55), false));
}
if (__VLS_ctx.showAnalytics) {
    /** @type {[typeof AnalyticsDashboard, ]} */ ;
    // @ts-ignore
    var __VLS_58 = __VLS_asFunctionalComponent(AnalyticsDashboard_vue_1.default, new AnalyticsDashboard_vue_1.default(__assign(__assign({ 'onReusePrompt': {} }, { 'onError': {} }), { showLearningInsights: (true) })));
    var __VLS_59 = __VLS_58.apply(void 0, __spreadArray([__assign(__assign({ 'onReusePrompt': {} }, { 'onError': {} }), { showLearningInsights: (true) })], __VLS_functionalComponentArgsRest(__VLS_58), false));
    var __VLS_61 = void 0;
    var __VLS_62 = void 0;
    var __VLS_63 = void 0;
    var __VLS_64 = {
        onReusePrompt: (__VLS_ctx.handleReusePrompt)
    };
    var __VLS_65 = {
        onError: (__VLS_ctx.handleAnalyticsError)
    };
    var __VLS_60;
}
if (((_k = __VLS_ctx.generationResult) === null || _k === void 0 ? void 0 : _k.warnings) && __VLS_ctx.generationResult.warnings.length > 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "bg-yellow-50 border border-yellow-200 rounded-lg p-4" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "flex" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "flex-shrink-0" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)(__assign({ class: "h-5 w-5 text-yellow-400" }, { viewBox: "0 0 20 20", fill: "currentColor" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
        'fill-rule': "evenodd",
        d: "M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z",
        'clip-rule': "evenodd",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "ml-3" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)(__assign({ class: "text-sm font-medium text-yellow-800" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "mt-2 text-sm text-yellow-700" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)(__assign({ class: "list-disc list-inside space-y-1" }));
    for (var _o = 0, _p = __VLS_getVForSourceType((__VLS_ctx.generationResult.warnings)); _o < _p.length; _o++) {
        var warning = _p[_o][0];
        __VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
            key: (warning),
        });
        (warning);
    }
}
if (!__VLS_ctx.generationResult && !__VLS_ctx.isGenerating) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "bg-white rounded-lg shadow p-6" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "text-center text-gray-500 py-12" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)(__assign({ class: "mx-auto h-12 w-12 text-gray-400" }, { stroke: "currentColor", fill: "none", viewBox: "0 0 48 48" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
        d: "M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02",
        'stroke-width': "2",
        'stroke-linecap': "round",
        'stroke-linejoin': "round",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)(__assign({ class: "mt-2" }));
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.footer, __VLS_intrinsicElements.footer)(__assign({ class: "bg-white border-t border-gray-200 mt-12" }));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4" }));
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)(__assign({ class: "text-center text-sm text-gray-500" }));
/** @type {[typeof ToastContainer, ]} */ ;
// @ts-ignore
var __VLS_66 = __VLS_asFunctionalComponent(ToastContainer_vue_1.default, new ToastContainer_vue_1.default({}));
var __VLS_67 = __VLS_66.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_66), false));
/** @type {__VLS_StyleScopedClasses['min-h-screen']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gray-50']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['border-b']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-7xl']} */ ;
/** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:px-6']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:px-8']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['h-16']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['space-x-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['inline']} */ ;
/** @type {__VLS_StyleScopedClasses['mr-1']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['space-x-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-7xl']} */ ;
/** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:px-6']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:px-8']} */ ;
/** @type {__VLS_StyleScopedClasses['py-8']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
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
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-yellow-800']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-yellow-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-8']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-6']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow']} */ ;
/** @type {__VLS_StyleScopedClasses['p-6']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:grid-cols-4']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['px-2']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-blue-500']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:border-blue-500']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['px-2']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-blue-500']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:border-blue-500']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-blue-600']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-blue-700']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-blue-500']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-offset-2']} */ ;
/** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
/** @type {__VLS_StyleScopedClasses['disabled:cursor-not-allowed']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['animate-spin']} */ ;
/** @type {__VLS_StyleScopedClasses['-ml-1']} */ ;
/** @type {__VLS_StyleScopedClasses['mr-3']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-25']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-75']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-6']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-yellow-50']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-yellow-200']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-shrink-0']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-yellow-400']} */ ;
/** @type {__VLS_StyleScopedClasses['ml-3']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-yellow-800']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-yellow-700']} */ ;
/** @type {__VLS_StyleScopedClasses['list-disc']} */ ;
/** @type {__VLS_StyleScopedClasses['list-inside']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-1']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow']} */ ;
/** @type {__VLS_StyleScopedClasses['p-6']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['py-12']} */ ;
/** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['h-12']} */ ;
/** @type {__VLS_StyleScopedClasses['w-12']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['border-t']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-12']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-7xl']} */ ;
/** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:px-6']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:px-8']} */ ;
/** @type {__VLS_StyleScopedClasses['py-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
var __VLS_dollars;
var __VLS_self = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    setup: function () {
        return {
            ToastContainer: ToastContainer_vue_1.default,
            SVGPreview: SVGPreview_vue_1.default,
            CodeOutput: CodeOutput_vue_1.default,
            MetadataDisplay: MetadataDisplay_vue_1.default,
            LayerInspector: LayerInspector_vue_1.default,
            FeedbackControls: FeedbackControls_vue_1.default,
            AnalyticsDashboard: AnalyticsDashboard_vue_1.default,
            ExportOptions: ExportOptions_vue_1.default,
            DebouncedInput: DebouncedInput_vue_1.default,
            ErrorDisplay: ErrorDisplay_vue_1.default,
            generationParams: generationParams,
            generationResult: generationResult,
            sizePresets: sizePresets,
            isGenerating: isGenerating,
            error: error,
            isOnline: isOnline,
            canRetry: canRetry,
            canGenerate: canGenerate,
            setSizePreset: setSizePreset,
            generateSVG: generateSVG,
            retryGeneration: retryGeneration,
            showAnalytics: showAnalytics,
            promptSuggestions: promptSuggestions,
            errorItems: errorItems,
            svgStatistics: svgStatistics,
            getFilename: getFilename,
            handleCopy: handleCopy,
            handleDownload: handleDownload,
            handleCodeCopy: handleCodeCopy,
            handleCodeDownload: handleCodeDownload,
            handleFormatChange: handleFormatChange,
            handleCodeError: handleCodeError,
            handleLayerSelect: handleLayerSelect,
            handleLayerIdCopy: handleLayerIdCopy,
            handlePromptChange: handlePromptChange,
            handleSuggestionSelect: handleSuggestionSelect,
            handleExport: handleExport,
            handleExportCopy: handleExportCopy,
            handleExportError: handleExportError,
            handleReusePrompt: handleReusePrompt,
            handleAnalyticsError: handleAnalyticsError,
            clearAllErrors: clearAllErrors,
            handleErrorAction: handleErrorAction,
        };
    },
});
exports.default = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    setup: function () {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
