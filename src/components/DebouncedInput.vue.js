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
var vue_1 = require("vue");
var debounce_1 = require("../utils/debounce");
var props = withDefaults(defineProps(), {
    debounceMs: 300,
    minLength: 0,
    type: "input",
    rows: 3,
    showLoadingIndicator: true,
    showCharacterCount: false,
    showSuggestions: false,
    suggestions: function () { return []; },
    validateOnInput: true,
    validationRules: function () { return []; },
});
var emit = defineEmits();
// Refs
var inputRef = (0, vue_1.ref)();
var internalValue = (0, vue_1.ref)(props.modelValue);
var isDebouncing = (0, vue_1.ref)(false);
var isFocused = (0, vue_1.ref)(false);
var selectedSuggestionIndex = (0, vue_1.ref)(-1);
var validationState = (0, vue_1.ref)("valid");
var validationMessage = (0, vue_1.ref)("");
// Computed properties
var inputComponent = (0, vue_1.computed)(function () {
    return props.type === "textarea" ? "textarea" : "input";
});
var inputProps = (0, vue_1.computed)(function () {
    var baseProps = {
        placeholder: props.placeholder,
        maxlength: props.maxLength,
    };
    if (props.type === "textarea") {
        baseProps.rows = props.rows;
    }
    return baseProps;
});
var inputClasses = (0, vue_1.computed)(function () {
    var baseClasses = [
        "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors",
        props.class || "",
    ];
    // Validation state classes
    if (validationState.value === "error") {
        baseClasses.push("border-red-300 focus:border-red-500 focus:ring-red-500");
    }
    else if (validationState.value === "warning") {
        baseClasses.push("border-yellow-300 focus:border-yellow-500 focus:ring-yellow-500");
    }
    else {
        baseClasses.push("border-gray-300 focus:border-blue-500");
    }
    // Processing state
    if (props.isProcessing || isDebouncing.value) {
        baseClasses.push("pr-8");
    }
    // Character count spacing
    if (props.showCharacterCount && props.maxLength) {
        baseClasses.push("pb-6");
    }
    return baseClasses.join(" ");
});
// Debounced function
var debouncedEmit = (0, debounce_1.advancedDebounce)(function (value) {
    isDebouncing.value = false;
    emit("debouncedInput", value);
}, props.debounceMs);
// Methods
var handleInput = function (event) {
    var target = event.target;
    internalValue.value = target.value;
    // Immediate validation if enabled
    if (props.validateOnInput) {
        validateInput(internalValue.value);
    }
    // Reset suggestion selection
    selectedSuggestionIndex.value = -1;
    // Debounced emit
    if (internalValue.value.length >= props.minLength) {
        isDebouncing.value = true;
        debouncedEmit(internalValue.value);
    }
};
var handleFocus = function (event) {
    isFocused.value = true;
    emit("focus", event);
};
var handleBlur = function (event) {
    // Delay blur to allow suggestion clicks
    setTimeout(function () {
        isFocused.value = false;
        emit("blur", event);
    }, 150);
};
var handleKeydown = function (event) {
    var _a;
    if (props.showSuggestions && suggestions.value.length > 0) {
        switch (event.key) {
            case "ArrowDown":
                event.preventDefault();
                selectedSuggestionIndex.value = Math.min(selectedSuggestionIndex.value + 1, suggestions.value.length - 1);
                break;
            case "ArrowUp":
                event.preventDefault();
                selectedSuggestionIndex.value = Math.max(selectedSuggestionIndex.value - 1, -1);
                break;
            case "Enter":
                event.preventDefault();
                if (selectedSuggestionIndex.value >= 0) {
                    selectSuggestion(suggestions.value[selectedSuggestionIndex.value]);
                }
                else {
                    emit("enter", internalValue.value);
                }
                break;
            case "Escape":
                selectedSuggestionIndex.value = -1;
                (_a = inputRef.value) === null || _a === void 0 ? void 0 : _a.blur();
                break;
        }
    }
    else if (event.key === "Enter" && props.type === "input") {
        emit("enter", internalValue.value);
    }
};
var validateInput = function (value) {
    if (props.validationRules.length === 0) {
        validationState.value = "valid";
        validationMessage.value = "";
        return;
    }
    for (var _i = 0, _a = props.validationRules; _i < _a.length; _i++) {
        var rule = _a[_i];
        var result = rule(value);
        if (result) {
            validationState.value = "error";
            validationMessage.value = result;
            emit("validationChange", "error", result);
            return;
        }
    }
    validationState.value = "valid";
    validationMessage.value = "";
    emit("validationChange", "valid", "");
};
var selectSuggestion = function (suggestion) {
    var _a;
    var text = typeof suggestion === "string" ? suggestion : suggestion.text;
    internalValue.value = text;
    selectedSuggestionIndex.value = -1;
    emit("suggestionSelect", suggestion);
    (_a = inputRef.value) === null || _a === void 0 ? void 0 : _a.focus();
};
var getSuggestionKey = function (suggestion, index) {
    if (typeof suggestion === "string")
        return suggestion;
    return suggestion.value || suggestion.text || index.toString();
};
var getSuggestionText = function (suggestion) {
    return typeof suggestion === "string" ? suggestion : suggestion.text;
};
var getSuggestionMeta = function (suggestion) {
    return typeof suggestion === "string" ? undefined : suggestion.meta;
};
// Computed for filtered suggestions
var suggestions = (0, vue_1.computed)(function () {
    if (!props.showSuggestions || !isFocused.value || !internalValue.value) {
        return [];
    }
    var query = internalValue.value.toLowerCase();
    return props.suggestions.filter(function (suggestion) {
        var text = getSuggestionText(suggestion).toLowerCase();
        return text.includes(query);
    });
});
var showSuggestions = (0, vue_1.computed)(function () {
    return (props.showSuggestions && isFocused.value && suggestions.value.length > 0);
});
// Watch for external value changes
(0, vue_1.watch)(function () { return props.modelValue; }, function (newValue) {
    if (newValue !== internalValue.value) {
        internalValue.value = newValue;
        if (props.validateOnInput) {
            validateInput(newValue);
        }
    }
});
// Watch for internal value changes
(0, vue_1.watch)(internalValue, function (newValue) {
    emit("update:modelValue", newValue);
});
// Focus method for parent components
var focus = function () {
    var _a;
    (_a = inputRef.value) === null || _a === void 0 ? void 0 : _a.focus();
};
var blur = function () {
    var _a;
    (_a = inputRef.value) === null || _a === void 0 ? void 0 : _a.blur();
};
var select = function () {
    var _a;
    (_a = inputRef.value) === null || _a === void 0 ? void 0 : _a.select();
};
// Expose methods
var __VLS_exposed = {
    focus: focus,
    blur: blur,
    select: select,
    validate: function () { return validateInput(internalValue.value); },
};
defineExpose(__VLS_exposed);
// Lifecycle
(0, vue_1.onMounted)(function () {
    if (props.validateOnInput && internalValue.value) {
        validateInput(internalValue.value);
    }
});
(0, vue_1.onUnmounted)(function () {
    // Cancel any pending debounced calls
    debouncedEmit.cancel();
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
var __VLS_withDefaultsArg = (function (t) { return t; })({
    debounceMs: 300,
    minLength: 0,
    type: "input",
    rows: 3,
    showLoadingIndicator: true,
    showCharacterCount: false,
    showSuggestions: false,
    suggestions: function () { return []; },
    validateOnInput: true,
    validationRules: function () { return []; },
});
var __VLS_ctx = {};
var __VLS_components;
var __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "relative" }));
var __VLS_0 = ((__VLS_ctx.inputComponent));
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0(__assign(__assign(__assign(__assign(__assign(__assign(__assign({ 'onInput': {} }, { 'onFocus': {} }), { 'onBlur': {} }), { 'onKeydown': {} }), { ref: "inputRef", modelValue: (__VLS_ctx.internalValue) }), (__VLS_ctx.inputProps)), { class: (__VLS_ctx.inputClasses) }), { disabled: (__VLS_ctx.disabled || __VLS_ctx.isProcessing) })));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign(__assign(__assign(__assign(__assign(__assign(__assign({ 'onInput': {} }, { 'onFocus': {} }), { 'onBlur': {} }), { 'onKeydown': {} }), { ref: "inputRef", modelValue: (__VLS_ctx.internalValue) }), (__VLS_ctx.inputProps)), { class: (__VLS_ctx.inputClasses) }), { disabled: (__VLS_ctx.disabled || __VLS_ctx.isProcessing) })], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_4;
var __VLS_5;
var __VLS_6;
var __VLS_7 = {
    onInput: (__VLS_ctx.handleInput)
};
var __VLS_8 = {
    onFocus: (__VLS_ctx.handleFocus)
};
var __VLS_9 = {
    onBlur: (__VLS_ctx.handleBlur)
};
var __VLS_10 = {
    onKeydown: (__VLS_ctx.handleKeydown)
};
/** @type {typeof __VLS_ctx.inputRef} */ ;
var __VLS_11 = {};
var __VLS_3;
if (__VLS_ctx.showLoadingIndicator && (__VLS_ctx.isProcessing || __VLS_ctx.isDebouncing)) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "absolute right-2 top-1/2 transform -translate-y-1/2" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)(__assign({ class: "animate-spin h-4 w-4 text-gray-400" }, { fill: "none", viewBox: "0 0 24 24" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.circle, __VLS_intrinsicElements.circle)(__assign({ class: "opacity-25" }, { cx: "12", cy: "12", r: "10", stroke: "currentColor", 'stroke-width': "4" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.path, __VLS_intrinsicElements.path)(__assign({ class: "opacity-75" }, { fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" }));
}
if (__VLS_ctx.showCharacterCount && __VLS_ctx.maxLength) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "absolute right-2 bottom-1 text-xs text-gray-400" }));
    (__VLS_ctx.internalValue.length);
    (__VLS_ctx.maxLength);
}
if (__VLS_ctx.validationMessage) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: ([
            'mt-1 text-xs',
            __VLS_ctx.validationState === 'error'
                ? 'text-red-600'
                : __VLS_ctx.validationState === 'warning'
                    ? 'text-yellow-600'
                    : 'text-green-600',
        ]) }));
    (__VLS_ctx.validationMessage);
}
if (__VLS_ctx.showSuggestions && __VLS_ctx.suggestions.length > 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto" }));
    var _loop_1 = function (suggestion, index) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign(__assign(__assign({ onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                if (!(__VLS_ctx.showSuggestions && __VLS_ctx.suggestions.length > 0))
                    return;
                __VLS_ctx.selectSuggestion(suggestion);
            } }, { onMouseenter: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                if (!(__VLS_ctx.showSuggestions && __VLS_ctx.suggestions.length > 0))
                    return;
                __VLS_ctx.selectedSuggestionIndex = index;
            } }), { key: (__VLS_ctx.getSuggestionKey(suggestion, index)) }), { class: ([
                'px-3 py-2 cursor-pointer transition-colors',
                index === __VLS_ctx.selectedSuggestionIndex
                    ? 'bg-blue-50 text-blue-900'
                    : 'hover:bg-gray-50',
            ]) }));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "flex items-center justify-between" }));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)(__assign({ class: "truncate" }));
        (__VLS_ctx.getSuggestionText(suggestion));
        if (__VLS_ctx.getSuggestionMeta(suggestion)) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)(__assign({ class: "text-xs text-gray-500 ml-2" }));
            (__VLS_ctx.getSuggestionMeta(suggestion));
        }
    };
    for (var _i = 0, _a = __VLS_getVForSourceType((__VLS_ctx.suggestions)); _i < _a.length; _i++) {
        var _b = _a[_i], suggestion = _b[0], index = _b[1];
        _loop_1(suggestion, index);
    }
}
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['right-2']} */ ;
/** @type {__VLS_StyleScopedClasses['top-1/2']} */ ;
/** @type {__VLS_StyleScopedClasses['transform']} */ ;
/** @type {__VLS_StyleScopedClasses['-translate-y-1/2']} */ ;
/** @type {__VLS_StyleScopedClasses['animate-spin']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-25']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-75']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['right-2']} */ ;
/** @type {__VLS_StyleScopedClasses['bottom-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['z-10']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['max-h-60']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['truncate']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['ml-2']} */ ;
// @ts-ignore
var __VLS_12 = __VLS_11;
var __VLS_dollars;
var __VLS_self = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    setup: function () {
        return {
            inputRef: inputRef,
            internalValue: internalValue,
            isDebouncing: isDebouncing,
            selectedSuggestionIndex: selectedSuggestionIndex,
            validationState: validationState,
            validationMessage: validationMessage,
            inputComponent: inputComponent,
            inputProps: inputProps,
            inputClasses: inputClasses,
            handleInput: handleInput,
            handleFocus: handleFocus,
            handleBlur: handleBlur,
            handleKeydown: handleKeydown,
            selectSuggestion: selectSuggestion,
            getSuggestionKey: getSuggestionKey,
            getSuggestionText: getSuggestionText,
            getSuggestionMeta: getSuggestionMeta,
            suggestions: suggestions,
            showSuggestions: showSuggestions,
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
