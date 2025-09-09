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
    label: "Prompt",
    placeholder: "Describe your SVG...",
    maxLength: 500,
    rows: 3,
    required: false,
    disabled: false,
    helpText: "",
    validateOnBlur: true,
});
var emit = defineEmits();
// Generate unique ID for accessibility
var inputId = "prompt-input-".concat(Math.random().toString(36).substr(2, 9));
// Internal state
var internalValue = (0, vue_1.ref)(props.modelValue);
var isFocused = (0, vue_1.ref)(false);
var hasBeenBlurred = (0, vue_1.ref)(false);
// Computed properties
var characterCount = (0, vue_1.computed)(function () { return internalValue.value.length; });
var isOverLimit = (0, vue_1.computed)(function () { return characterCount.value > props.maxLength; });
var isEmpty = (0, vue_1.computed)(function () { return internalValue.value.trim().length === 0; });
var validationMessage = (0, vue_1.computed)(function () {
    if (props.customValidation) {
        return props.customValidation(internalValue.value);
    }
    if (props.required && isEmpty.value) {
        return "This field is required";
    }
    if (isOverLimit.value) {
        return "Text exceeds maximum length of ".concat(props.maxLength, " characters");
    }
    return null;
});
var warningMessage = (0, vue_1.computed)(function () {
    var remaining = props.maxLength - characterCount.value;
    if (remaining <= 50 && remaining > 0) {
        return "".concat(remaining, " characters remaining");
    }
    return null;
});
var hasError = (0, vue_1.computed)(function () {
    return (validationMessage.value !== null &&
        (hasBeenBlurred.value || !props.validateOnBlur));
});
var hasWarning = (0, vue_1.computed)(function () {
    return warningMessage.value !== null && !hasError.value;
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
    internalValue.value = target.value;
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
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
var __VLS_withDefaultsArg = (function (t) { return t; })({
    label: "Prompt",
    placeholder: "Describe your SVG...",
    maxLength: 500,
    rows: 3,
    required: false,
    disabled: false,
    helpText: "",
    validateOnBlur: true,
});
var __VLS_ctx = {};
var __VLS_components;
var __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "space-y-2" }));
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)(__assign({ for: (__VLS_ctx.inputId) }, { class: "block text-sm font-medium text-gray-700" }));
(__VLS_ctx.label);
if (__VLS_ctx.required) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)(__assign({ class: "text-red-500" }));
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "relative" }));
__VLS_asFunctionalElement(__VLS_intrinsicElements.textarea)(__assign(__assign(__assign(__assign({ onInput: (__VLS_ctx.handleInput) }, { onBlur: (__VLS_ctx.handleBlur) }), { onFocus: (__VLS_ctx.handleFocus) }), { id: (__VLS_ctx.inputId), value: (__VLS_ctx.internalValue), rows: (__VLS_ctx.rows), maxlength: (__VLS_ctx.maxLength), placeholder: (__VLS_ctx.placeholder), disabled: (__VLS_ctx.disabled) }), { class: ([
        'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors',
        __VLS_ctx.hasError
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
        __VLS_ctx.disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white',
    ]) }));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "absolute bottom-2 right-2 text-xs text-gray-400 bg-white px-1 rounded" }));
(__VLS_ctx.characterCount);
(__VLS_ctx.maxLength);
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
if (__VLS_ctx.helpText && !__VLS_ctx.hasError && !__VLS_ctx.hasWarning) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)(__assign({ class: "text-sm text-gray-500" }));
    (__VLS_ctx.helpText);
}
/** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['text-red-500']} */ ;
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['bottom-2']} */ ;
/** @type {__VLS_StyleScopedClasses['right-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['px-1']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
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
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
var __VLS_dollars;
var __VLS_self = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    setup: function () {
        return {
            inputId: inputId,
            internalValue: internalValue,
            characterCount: characterCount,
            warningMessage: warningMessage,
            hasError: hasError,
            hasWarning: hasWarning,
            errorMessage: errorMessage,
            handleInput: handleInput,
            handleBlur: handleBlur,
            handleFocus: handleFocus,
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
