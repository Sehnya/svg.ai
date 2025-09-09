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
    label: "Seed",
    placeholder: "Enter seed for deterministic generation",
    required: false,
    disabled: false,
    minValue: 0,
    maxValue: 999999999,
    step: 1,
    helpText: "Use the same seed to reproduce identical results. Leave empty for random generation.",
    showRandomButton: true,
    showSeedInfo: true,
    showPresets: false,
    seedPresets: function () { return [
        { label: "42", value: 42 },
        { label: "123", value: 123 },
        { label: "2024", value: 2024 },
        { label: "12345", value: 12345 },
    ]; },
    validateOnBlur: true,
});
var emit = defineEmits();
// Generate unique ID for accessibility
var inputId = "seed-input-".concat(Math.random().toString(36).substr(2, 9));
// Internal state
var internalValue = (0, vue_1.ref)(props.modelValue);
var isFocused = (0, vue_1.ref)(false);
var hasBeenBlurred = (0, vue_1.ref)(false);
// Computed properties
var validationMessage = (0, vue_1.computed)(function () {
    if (props.customValidation) {
        return props.customValidation(internalValue.value);
    }
    if (props.required &&
        (internalValue.value === null || internalValue.value === undefined)) {
        return "Seed is required";
    }
    if (internalValue.value !== null) {
        if (internalValue.value < props.minValue) {
            return "Seed must be at least ".concat(props.minValue);
        }
        if (internalValue.value > props.maxValue) {
            return "Seed must be no more than ".concat(props.maxValue);
        }
        if (!Number.isInteger(internalValue.value)) {
            return "Seed must be a whole number";
        }
    }
    return null;
});
var warningMessage = (0, vue_1.computed)(function () {
    if (internalValue.value === null) {
        return "Random generation - results will vary each time";
    }
    return null;
});
var hasError = (0, vue_1.computed)(function () {
    return (validationMessage.value !== null &&
        (hasBeenBlurred.value || !props.validateOnBlur));
});
var hasWarning = (0, vue_1.computed)(function () {
    return warningMessage.value !== null && !hasError.value && !isFocused.value;
});
var errorMessage = (0, vue_1.computed)(function () { return validationMessage.value || ""; });
// Watch for external changes
(0, vue_1.watch)(function () { return props.modelValue; }, function (newValue) {
    internalValue.value = newValue;
});
// Watch internal value and emit changes
(0, vue_1.watch)(internalValue, function (newValue) {
    emit("update:modelValue", newValue);
    emit("input", newValue);
    // Emit validation status
    var isValid = validationMessage.value === null;
    emit("validation", isValid, validationMessage.value || undefined);
});
// Event handlers
var handleInput = function (event) {
    var target = event.target;
    var value = target.value;
    if (value === "" || value === null) {
        internalValue.value = null;
    }
    else {
        var numValue = parseInt(value, 10);
        internalValue.value = isNaN(numValue) ? null : numValue;
    }
};
var handleBlur = function (event) {
    isFocused.value = false;
    hasBeenBlurred.value = true;
    emit("blur", event);
};
var handleFocus = function (event) {
    isFocused.value = true;
    emit("focus", event);
};
var generateRandomSeed = function () {
    var randomSeed = Math.floor(Math.random() * (props.maxValue - props.minValue + 1)) +
        props.minValue;
    internalValue.value = randomSeed;
    emit("seedGenerated", randomSeed);
};
var clearValue = function () {
    internalValue.value = null;
};
var selectPreset = function (value) {
    internalValue.value = value;
};
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
var __VLS_withDefaultsArg = (function (t) { return t; })({
    label: "Seed",
    placeholder: "Enter seed for deterministic generation",
    required: false,
    disabled: false,
    minValue: 0,
    maxValue: 999999999,
    step: 1,
    helpText: "Use the same seed to reproduce identical results. Leave empty for random generation.",
    showRandomButton: true,
    showSeedInfo: true,
    showPresets: false,
    seedPresets: function () { return [
        { label: "42", value: 42 },
        { label: "123", value: 123 },
        { label: "2024", value: 2024 },
        { label: "12345", value: 12345 },
    ]; },
    validateOnBlur: true,
});
var __VLS_ctx = {};
var __VLS_components;
var __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "space-y-2" }));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "flex items-center justify-between" }));
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)(__assign({ for: (__VLS_ctx.inputId) }, { class: "block text-sm font-medium text-gray-700" }));
(__VLS_ctx.label);
if (__VLS_ctx.required) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)(__assign({ class: "text-red-500" }));
}
if (__VLS_ctx.showRandomButton) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)(__assign(__assign({ onClick: (__VLS_ctx.generateRandomSeed) }, { type: "button", disabled: (__VLS_ctx.disabled) }), { class: "text-xs text-blue-600 hover:text-blue-800 transition-colors disabled:text-gray-400 disabled:cursor-not-allowed" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)(__assign({ class: "w-3 h-3 inline mr-1" }, { fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
        'stroke-linecap': "round",
        'stroke-linejoin': "round",
        'stroke-width': "2",
        d: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "relative" }));
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)(__assign(__assign(__assign(__assign({ onInput: (__VLS_ctx.handleInput) }, { onBlur: (__VLS_ctx.handleBlur) }), { onFocus: (__VLS_ctx.handleFocus) }), { id: (__VLS_ctx.inputId), type: "number", min: (__VLS_ctx.minValue), max: (__VLS_ctx.maxValue), step: (__VLS_ctx.step), placeholder: (__VLS_ctx.placeholder), disabled: (__VLS_ctx.disabled) }), { class: ([
        'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors',
        __VLS_ctx.hasError
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
        __VLS_ctx.disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white',
    ]) }));
(__VLS_ctx.internalValue);
if (__VLS_ctx.internalValue !== null && __VLS_ctx.internalValue !== undefined && !__VLS_ctx.disabled) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)(__assign(__assign({ onClick: (__VLS_ctx.clearValue) }, { type: "button" }), { class: "absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)(__assign({ class: "w-4 h-4" }, { fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
        'stroke-linecap': "round",
        'stroke-linejoin': "round",
        'stroke-width': "2",
        d: "M6 18L18 6M6 6l12 12",
    });
}
if (__VLS_ctx.hasError || __VLS_ctx.hasWarning) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "space-y-1" }));
    if (__VLS_ctx.hasError) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)(__assign({ class: "text-sm text-red-600 flex items-center" }));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)(__assign({ class: "w-4 h-4 mr-1 flex-shrink-0" }, { fill: "currentColor", viewBox: "0 0 20 20" }));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
            'fill-rule': "evenodd",
            d: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z",
            'clip-rule': "evenodd",
        });
        (__VLS_ctx.errorMessage);
    }
    if (__VLS_ctx.hasWarning) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)(__assign({ class: "text-sm text-yellow-600 flex items-center" }));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)(__assign({ class: "w-4 h-4 mr-1 flex-shrink-0" }, { fill: "currentColor", viewBox: "0 0 20 20" }));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
            'fill-rule': "evenodd",
            d: "M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z",
            'clip-rule': "evenodd",
        });
        (__VLS_ctx.warningMessage);
    }
}
if (!__VLS_ctx.hasError && !__VLS_ctx.hasWarning) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "space-y-1" }));
    if (__VLS_ctx.helpText) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)(__assign({ class: "text-sm text-gray-500" }));
        (__VLS_ctx.helpText);
    }
    if (__VLS_ctx.showSeedInfo && __VLS_ctx.internalValue) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "text-xs text-gray-400 bg-gray-50 rounded px-2 py-1" }));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "flex items-center justify-between" }));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (__VLS_ctx.internalValue);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)(__assign({ class: "text-green-600" }));
    }
}
if (__VLS_ctx.showPresets && __VLS_ctx.seedPresets.length > 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "space-y-2" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)(__assign({ class: "text-xs font-medium text-gray-700" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "flex flex-wrap gap-1" }));
    var _loop_1 = function (preset) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)(__assign(__assign({ onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                if (!(__VLS_ctx.showPresets && __VLS_ctx.seedPresets.length > 0))
                    return;
                __VLS_ctx.selectPreset(preset.value);
            } }, { key: (preset.value), type: "button", disabled: (__VLS_ctx.disabled) }), { class: "px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" }));
        (preset.label);
    };
    for (var _i = 0, _a = __VLS_getVForSourceType((__VLS_ctx.seedPresets)); _i < _a.length; _i++) {
        var preset = _a[_i][0];
        _loop_1(preset);
    }
}
/** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['text-red-500']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-blue-600']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-blue-800']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['disabled:text-gray-400']} */ ;
/** @type {__VLS_StyleScopedClasses['disabled:cursor-not-allowed']} */ ;
/** @type {__VLS_StyleScopedClasses['w-3']} */ ;
/** @type {__VLS_StyleScopedClasses['h-3']} */ ;
/** @type {__VLS_StyleScopedClasses['inline']} */ ;
/** @type {__VLS_StyleScopedClasses['mr-1']} */ ;
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['right-2']} */ ;
/** @type {__VLS_StyleScopedClasses['top-1/2']} */ ;
/** @type {__VLS_StyleScopedClasses['transform']} */ ;
/** @type {__VLS_StyleScopedClasses['-translate-y-1/2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-red-600']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['mr-1']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-shrink-0']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-yellow-600']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['mr-1']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-shrink-0']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gray-50']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['px-2']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['text-green-600']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
/** @type {__VLS_StyleScopedClasses['px-2']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gray-100']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
/** @type {__VLS_StyleScopedClasses['disabled:cursor-not-allowed']} */ ;
var __VLS_dollars;
var __VLS_self = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    setup: function () {
        return {
            inputId: inputId,
            internalValue: internalValue,
            warningMessage: warningMessage,
            hasError: hasError,
            hasWarning: hasWarning,
            errorMessage: errorMessage,
            handleInput: handleInput,
            handleBlur: handleBlur,
            handleFocus: handleFocus,
            generateRandomSeed: generateRandomSeed,
            clearValue: clearValue,
            selectPreset: selectPreset,
        };
    },
    __typeEmits: {},
    __typeProps: {},
    props: {},
});
exports.default = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    setup: function () {
        return {};
    },
    __typeEmits: {},
    __typeProps: {},
    props: {},
});
; /* PartiallyEnd: #4569/main.vue */
