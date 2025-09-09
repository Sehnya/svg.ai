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
    selectedModel: "rule-based",
    required: false,
    disabled: false,
    minSize: 16,
    maxSize: 2048,
    showModelSelection: false,
    showAdvancedOptions: false,
    availableModels: function () { return [
        {
            value: "rule-based",
            label: "Rule-based Generator",
            description: "Fast, deterministic generation using predefined patterns",
            badge: "Offline",
        },
        {
            value: "llm",
            label: "AI Generator",
            description: "Advanced AI-powered generation with natural language understanding",
            disabled: false,
        },
    ]; },
});
var emit = defineEmits();
// Internal state
var selectedPreset = (0, vue_1.ref)(props.modelValue.preset);
var customSize = (0, vue_1.ref)({
    width: props.modelValue.width,
    height: props.modelValue.height,
});
var selectedModel = (0, vue_1.ref)(props.selectedModel);
var showAdvanced = (0, vue_1.ref)(false);
// Size presets
var sizePresets = [
    { name: "icon", label: "Icon", width: 64, height: 64 },
    { name: "banner", label: "Banner", width: 400, height: 100 },
    { name: "square", label: "Square", width: 200, height: 200 },
    { name: "custom", label: "Custom", width: 100, height: 100 },
];
// Computed properties
var currentSize = (0, vue_1.computed)(function () {
    if (selectedPreset.value === "custom") {
        return customSize.value;
    }
    var preset = sizePresets.find(function (p) { return p.name === selectedPreset.value; });
    return preset
        ? { width: preset.width, height: preset.height }
        : customSize.value;
});
var aspectRatio = (0, vue_1.computed)(function () {
    var _a = currentSize.value, width = _a.width, height = _a.height;
    if (width === height)
        return "1:1";
    var gcd = function (a, b) { return (b === 0 ? a : gcd(b, a % b)); };
    var divisor = gcd(width, height);
    var ratioW = width / divisor;
    var ratioH = height / divisor;
    // Simplify common ratios
    if (ratioW === 16 && ratioH === 9)
        return "16:9";
    if (ratioW === 4 && ratioH === 3)
        return "4:3";
    if (ratioW === 3 && ratioH === 2)
        return "3:2";
    return "".concat(ratioW, ":").concat(ratioH);
});
var hasWidthError = (0, vue_1.computed)(function () {
    return (customSize.value.width < props.minSize ||
        customSize.value.width > props.maxSize);
});
var hasHeightError = (0, vue_1.computed)(function () {
    return (customSize.value.height < props.minSize ||
        customSize.value.height > props.maxSize);
});
var isValid = (0, vue_1.computed)(function () {
    return !hasWidthError.value && !hasHeightError.value;
});
var validationErrors = (0, vue_1.computed)(function () {
    var errors = [];
    if (hasWidthError.value) {
        errors.push("Width must be between ".concat(props.minSize, " and ").concat(props.maxSize));
    }
    if (hasHeightError.value) {
        errors.push("Height must be between ".concat(props.minSize, " and ").concat(props.maxSize));
    }
    return errors;
});
// Watch for external changes
(0, vue_1.watch)(function () { return props.modelValue; }, function (newValue) {
    selectedPreset.value = newValue.preset;
    customSize.value = {
        width: newValue.width,
        height: newValue.height,
    };
}, { deep: true });
(0, vue_1.watch)(function () { return props.selectedModel; }, function (newValue) {
    selectedModel.value = newValue;
});
// Emit changes
(0, vue_1.watch)([selectedPreset, customSize], function () {
    var sizeConfig = {
        preset: selectedPreset.value,
        width: currentSize.value.width,
        height: currentSize.value.height,
    };
    emit("update:modelValue", sizeConfig);
}, { deep: true });
(0, vue_1.watch)(selectedModel, function (newValue) {
    emit("update:selectedModel", newValue);
});
(0, vue_1.watch)([isValid, validationErrors], function () {
    emit("validation", isValid.value, validationErrors.value);
}, { immediate: true });
// Methods
var selectPreset = function (preset) {
    selectedPreset.value = preset.name;
    if (preset.name !== "custom") {
        customSize.value = {
            width: preset.width,
            height: preset.height,
        };
    }
};
var handleCustomSizeChange = function () {
    // Ensure values are within bounds
    customSize.value.width = Math.max(props.minSize, Math.min(props.maxSize, customSize.value.width || props.minSize));
    customSize.value.height = Math.max(props.minSize, Math.min(props.maxSize, customSize.value.height || props.minSize));
};
var handleModelChange = function () {
    // Model change is handled by the watch
};
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
var __VLS_withDefaultsArg = (function (t) { return t; })({
    selectedModel: "rule-based",
    required: false,
    disabled: false,
    minSize: 16,
    maxSize: 2048,
    showModelSelection: false,
    showAdvancedOptions: false,
    availableModels: function () { return [
        {
            value: "rule-based",
            label: "Rule-based Generator",
            description: "Fast, deterministic generation using predefined patterns",
            badge: "Offline",
        },
        {
            value: "llm",
            label: "AI Generator",
            description: "Advanced AI-powered generation with natural language understanding",
            disabled: false,
        },
    ]; },
});
var __VLS_ctx = {};
var __VLS_components;
var __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "space-y-4" }));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)(__assign({ class: "block text-sm font-medium text-gray-700 mb-2" }));
if (__VLS_ctx.required) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)(__assign({ class: "text-red-500" }));
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3" }));
var _loop_1 = function (preset) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)(__assign(__assign(__assign({ onClick: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.selectPreset(preset);
        } }, { key: (preset.name), type: "button" }), { class: ([
            'px-3 py-2 text-xs font-medium rounded border transition-colors',
            __VLS_ctx.selectedPreset === preset.name
                ? 'bg-blue-50 border-blue-200 text-blue-700 ring-2 ring-blue-500 ring-opacity-20'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400',
        ]) }), { disabled: (__VLS_ctx.disabled) }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "text-center" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "font-medium" }));
    (preset.label);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "text-xs opacity-75" }));
    (preset.width);
    (preset.height);
};
for (var _i = 0, _a = __VLS_getVForSourceType((__VLS_ctx.sizePresets)); _i < _a.length; _i++) {
    var preset = _a[_i][0];
    _loop_1(preset);
}
if (__VLS_ctx.selectedPreset === 'custom') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "grid grid-cols-2 gap-3" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)(__assign({ class: "block text-xs font-medium text-gray-700 mb-1" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)(__assign(__assign({ onInput: (__VLS_ctx.handleCustomSizeChange) }, { type: "number", min: (__VLS_ctx.minSize), max: (__VLS_ctx.maxSize), disabled: (__VLS_ctx.disabled) }), { class: ([
            'w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            __VLS_ctx.hasWidthError ? 'border-red-300' : 'border-gray-300',
        ]) }));
    (__VLS_ctx.customSize.width);
    if (__VLS_ctx.hasWidthError) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)(__assign({ class: "mt-1 text-xs text-red-600" }));
        (__VLS_ctx.minSize);
        (__VLS_ctx.maxSize);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)(__assign({ class: "block text-xs font-medium text-gray-700 mb-1" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)(__assign(__assign({ onInput: (__VLS_ctx.handleCustomSizeChange) }, { type: "number", min: (__VLS_ctx.minSize), max: (__VLS_ctx.maxSize), disabled: (__VLS_ctx.disabled) }), { class: ([
            'w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            __VLS_ctx.hasHeightError ? 'border-red-300' : 'border-gray-300',
        ]) }));
    (__VLS_ctx.customSize.height);
    if (__VLS_ctx.hasHeightError) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)(__assign({ class: "mt-1 text-xs text-red-600" }));
        (__VLS_ctx.minSize);
        (__VLS_ctx.maxSize);
    }
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "mt-2 text-xs text-gray-500" }));
(__VLS_ctx.currentSize.width);
(__VLS_ctx.currentSize.height);
if (__VLS_ctx.aspectRatio) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)(__assign({ class: "ml-2" }));
    (__VLS_ctx.aspectRatio);
}
if (__VLS_ctx.showModelSelection) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)(__assign({ class: "block text-sm font-medium text-gray-700 mb-2" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "space-y-2" }));
    for (var _b = 0, _c = __VLS_getVForSourceType((__VLS_ctx.availableModels)); _b < _c.length; _b++) {
        var model = _c[_b][0];
        __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)(__assign(__assign({ key: (model.value) }, { class: "flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors" }), { class: (__VLS_ctx.selectedModel === model.value
                ? 'border-blue-200 bg-blue-50'
                : 'border-gray-200') }));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)(__assign(__assign({ onChange: (__VLS_ctx.handleModelChange) }, { type: "radio", value: (model.value), disabled: (__VLS_ctx.disabled || model.disabled) }), { class: "h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300" }));
        (__VLS_ctx.selectedModel);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "ml-3 flex-1" }));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "flex items-center justify-between" }));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)(__assign({ class: "text-sm font-medium text-gray-900" }));
        (model.label);
        if (model.badge) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)(__assign({ class: "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800" }));
            (model.badge);
        }
        if (model.description) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)(__assign({ class: "text-xs text-gray-500 mt-1" }));
            (model.description);
        }
    }
}
if (__VLS_ctx.showAdvancedOptions) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)(__assign(__assign({ onClick: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            if (!(__VLS_ctx.showAdvancedOptions))
                return;
            __VLS_ctx.showAdvanced = !__VLS_ctx.showAdvanced;
        } }, { type: "button" }), { class: "flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)(__assign({ class: ([
            'w-4 h-4 mr-1 transition-transform',
            __VLS_ctx.showAdvanced ? 'rotate-90' : '',
        ]) }, { fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
        'stroke-linecap': "round",
        'stroke-linejoin': "round",
        'stroke-width': "2",
        d: "M9 5l7 7-7 7",
    });
    if (__VLS_ctx.showAdvanced) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "mt-3 pl-5 space-y-3 border-l-2 border-gray-200" }));
        var __VLS_0 = {};
    }
}
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-red-500']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:grid-cols-4']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-75']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-red-600']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-red-600']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['ml-2']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['p-3']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-gray-50']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-blue-600']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-blue-500']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['ml-3']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['px-2']} */ ;
/** @type {__VLS_StyleScopedClasses['py-0.5']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-green-100']} */ ;
/** @type {__VLS_StyleScopedClasses['text-green-800']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
/** @type {__VLS_StyleScopedClasses['pl-5']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-3']} */ ;
/** @type {__VLS_StyleScopedClasses['border-l-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
// @ts-ignore
var __VLS_1 = __VLS_0;
var __VLS_dollars;
var __VLS_self = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    setup: function () {
        return {
            selectedPreset: selectedPreset,
            customSize: customSize,
            selectedModel: selectedModel,
            showAdvanced: showAdvanced,
            sizePresets: sizePresets,
            currentSize: currentSize,
            aspectRatio: aspectRatio,
            hasWidthError: hasWidthError,
            hasHeightError: hasHeightError,
            selectPreset: selectPreset,
            handleCustomSizeChange: handleCustomSizeChange,
            handleModelChange: handleModelChange,
        };
    },
    __typeEmits: {},
    __typeProps: {},
    props: {},
});
var __VLS_component = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    setup: function () {
        return {};
    },
    __typeEmits: {},
    __typeProps: {},
    props: {},
});
exports.default = {};
; /* PartiallyEnd: #4569/main.vue */
