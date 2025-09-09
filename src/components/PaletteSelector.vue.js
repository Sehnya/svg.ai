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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
var vue_1 = require("vue");
var props = withDefaults(defineProps(), {
    required: false,
    disabled: false,
    maxColors: 8,
    helpText: "Colors will influence the generated SVG. Leave empty for automatic color selection.",
});
var emit = defineEmits();
// Internal state
var paletteType = (0, vue_1.ref)(((_a = props.paletteConfig) === null || _a === void 0 ? void 0 : _a.type) || "preset");
var selectedColors = (0, vue_1.ref)(__spreadArray([], props.modelValue, true));
var selectedPreset = (0, vue_1.ref)(((_b = props.paletteConfig) === null || _b === void 0 ? void 0 : _b.name) || null);
var newColor = (0, vue_1.ref)("#FF0000");
var colorInputError = (0, vue_1.ref)(null);
// Palette types
var paletteTypes = [
    { value: "preset", label: "Presets" },
    { value: "custom", label: "Custom" },
];
// Preset palettes
var presetPalettes = [
    {
        name: "Modern Blues",
        description: "Cool, professional blue tones",
        colors: ["#1E40AF", "#3B82F6", "#60A5FA", "#93C5FD"],
    },
    {
        name: "Warm Sunset",
        description: "Warm oranges and reds",
        colors: ["#DC2626", "#EA580C", "#F59E0B", "#FCD34D"],
    },
    {
        name: "Nature Green",
        description: "Fresh, natural greens",
        colors: ["#065F46", "#059669", "#10B981", "#6EE7B7"],
    },
    {
        name: "Purple Gradient",
        description: "Rich purple and violet shades",
        colors: ["#581C87", "#7C3AED", "#A855F7", "#C084FC"],
    },
    {
        name: "Monochrome",
        description: "Classic black, white, and grays",
        colors: ["#000000", "#374151", "#9CA3AF", "#FFFFFF"],
    },
    {
        name: "Pastel Dreams",
        description: "Soft, dreamy pastel colors",
        colors: ["#FEE2E2", "#DBEAFE", "#D1FAE5", "#FEF3C7"],
    },
    {
        name: "Ocean Depths",
        description: "Deep blues and teals",
        colors: ["#0F172A", "#1E293B", "#0891B2", "#06B6D4"],
    },
    {
        name: "Autumn Leaves",
        description: "Warm autumn colors",
        colors: ["#92400E", "#D97706", "#F59E0B", "#FCD34D"],
    },
];
// Computed properties
var isValidColor = (0, vue_1.computed)(function () {
    return /^#[0-9A-Fa-f]{6}$/.test(newColor.value);
});
var canAddMoreColors = (0, vue_1.computed)(function () {
    return !props.maxColors || selectedColors.value.length < props.maxColors;
});
var isValid = (0, vue_1.computed)(function () {
    if (props.required && selectedColors.value.length === 0) {
        return false;
    }
    return true;
});
var validationMessage = (0, vue_1.computed)(function () {
    if (props.required && selectedColors.value.length === 0) {
        return "At least one color is required";
    }
    return undefined;
});
// Watch for external changes
(0, vue_1.watch)(function () { return props.modelValue; }, function (newValue) {
    selectedColors.value = __spreadArray([], newValue, true);
}, { deep: true });
(0, vue_1.watch)(function () { return props.paletteConfig; }, function (newValue) {
    if (newValue) {
        paletteType.value = newValue.type;
        selectedPreset.value = newValue.name || null;
    }
});
// Emit changes
(0, vue_1.watch)(selectedColors, function (newValue) {
    emit("update:modelValue", __spreadArray([], newValue, true));
}, { deep: true });
(0, vue_1.watch)([paletteType, selectedPreset], function () {
    var config = {
        type: paletteType.value,
        colors: __spreadArray([], selectedColors.value, true),
        name: selectedPreset.value || undefined,
    };
    emit("update:paletteConfig", config);
});
(0, vue_1.watch)([isValid, validationMessage], function () {
    emit("validation", isValid.value, validationMessage.value);
}, { immediate: true });
// Methods
var selectPresetPalette = function (preset) {
    selectedPreset.value = preset.name;
    selectedColors.value = __spreadArray([], preset.colors, true);
};
var addColor = function () {
    if (!isValidColor.value || !canAddMoreColors.value)
        return;
    var color = newColor.value.toUpperCase();
    if (!selectedColors.value.includes(color)) {
        selectedColors.value.push(color);
        newColor.value = "#FF0000";
        colorInputError.value = null;
    }
};
var removeColor = function (index) {
    selectedColors.value.splice(index, 1);
    // Clear preset selection if colors were modified
    if (paletteType.value === "preset") {
        selectedPreset.value = null;
    }
};
var clearSelection = function () {
    selectedColors.value = [];
    selectedPreset.value = null;
};
var handleColorInput = function (event) {
    var target = event.target;
    newColor.value = target.value;
    validateColorInput();
};
var validateColorInput = function () {
    if (!newColor.value) {
        colorInputError.value = null;
        return;
    }
    if (!isValidColor.value) {
        colorInputError.value = "Please enter a valid hex color (e.g., #FF0000)";
        return;
    }
    if (selectedColors.value.includes(newColor.value.toUpperCase())) {
        colorInputError.value = "This color is already selected";
        return;
    }
    if (!canAddMoreColors.value) {
        colorInputError.value = "Maximum of ".concat(props.maxColors, " colors allowed");
        return;
    }
    colorInputError.value = null;
};
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
var __VLS_withDefaultsArg = (function (t) { return t; })({
    required: false,
    disabled: false,
    maxColors: 8,
    helpText: "Colors will influence the generated SVG. Leave empty for automatic color selection.",
});
var __VLS_ctx = {};
var __VLS_components;
var __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "space-y-4" }));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "flex items-center justify-between" }));
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)(__assign({ class: "block text-sm font-medium text-gray-700" }));
if (__VLS_ctx.required) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)(__assign({ class: "text-red-500" }));
}
if (__VLS_ctx.selectedColors.length > 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)(__assign(__assign({ onClick: (__VLS_ctx.clearSelection) }, { type: "button" }), { class: "text-xs text-gray-500 hover:text-gray-700 transition-colors" }));
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "flex space-x-1 bg-gray-100 p-1 rounded-lg" }));
var _loop_1 = function (type) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)(__assign(__assign(__assign({ onClick: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.paletteType = type.value;
        } }, { key: (type.value), type: "button" }), { class: ([
            'flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors',
            __VLS_ctx.paletteType === type.value
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900',
        ]) }), { disabled: (__VLS_ctx.disabled) }));
    (type.label);
};
for (var _i = 0, _c = __VLS_getVForSourceType((__VLS_ctx.paletteTypes)); _i < _c.length; _i++) {
    var type = _c[_i][0];
    _loop_1(type);
}
if (__VLS_ctx.paletteType === 'preset') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "space-y-3" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "grid grid-cols-1 sm:grid-cols-2 gap-3" }));
    var _loop_2 = function (preset) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)(__assign(__assign(__assign({ onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                if (!(__VLS_ctx.paletteType === 'preset'))
                    return;
                __VLS_ctx.selectPresetPalette(preset);
            } }, { key: (preset.name), type: "button" }), { class: ([
                'p-3 border rounded-lg text-left transition-colors',
                __VLS_ctx.selectedPreset === preset.name
                    ? 'border-blue-200 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
            ]) }), { disabled: (__VLS_ctx.disabled) }));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "flex items-center justify-between mb-2" }));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)(__assign({ class: "text-sm font-medium text-gray-900" }));
        (preset.name);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "flex space-x-1" }));
        for (var _j = 0, _k = __VLS_getVForSourceType((preset.colors.slice(0, 4))); _j < _k.length; _j++) {
            var color = _k[_j][0];
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div)(__assign(__assign({ key: (color) }, { class: "w-4 h-4 rounded-full border border-gray-200" }), { style: ({ backgroundColor: color }) }));
        }
        if (preset.colors.length > 4) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)(__assign({ class: "text-xs text-gray-500" }));
            (preset.colors.length - 4);
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)(__assign({ class: "text-xs text-gray-500" }));
        (preset.description);
    };
    for (var _d = 0, _e = __VLS_getVForSourceType((__VLS_ctx.presetPalettes)); _d < _e.length; _d++) {
        var preset = _e[_d][0];
        _loop_2(preset);
    }
}
if (__VLS_ctx.paletteType === 'custom') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "space-y-3" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "flex space-x-2" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "flex-1" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)(__assign(__assign(__assign({ onChange: (__VLS_ctx.handleColorInput) }, { type: "color" }), { class: "w-full h-10 border border-gray-300 rounded-md cursor-pointer disabled:cursor-not-allowed" }), { disabled: (__VLS_ctx.disabled) }));
    (__VLS_ctx.newColor);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "flex-1" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)(__assign(__assign(__assign(__assign({ onKeyup: (__VLS_ctx.addColor) }, { onInput: (__VLS_ctx.validateColorInput) }), { value: (__VLS_ctx.newColor), type: "text", placeholder: "#FF0000", pattern: "^#[0-9A-Fa-f]{6}$" }), { class: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" }), { disabled: (__VLS_ctx.disabled) }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)(__assign(__assign({ onClick: (__VLS_ctx.addColor) }, { type: "button", disabled: (__VLS_ctx.disabled ||
            !__VLS_ctx.isValidColor ||
            __VLS_ctx.selectedColors.includes(__VLS_ctx.newColor.toUpperCase())) }), { class: "px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed" }));
    if (__VLS_ctx.colorInputError) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)(__assign({ class: "text-sm text-red-600" }));
        (__VLS_ctx.colorInputError);
    }
}
if (__VLS_ctx.selectedColors.length > 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "space-y-2" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "flex items-center justify-between" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)(__assign({ class: "text-sm font-medium text-gray-700" }));
    (__VLS_ctx.selectedColors.length);
    if (__VLS_ctx.maxColors) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)(__assign({ class: "text-xs text-gray-500" }));
        (__VLS_ctx.maxColors);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "flex flex-wrap gap-2" }));
    var _loop_3 = function (color, index) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ key: (color) }, { class: "flex items-center space-x-2 bg-white border border-gray-200 rounded-lg px-3 py-2" }));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div)(__assign({ class: "w-5 h-5 rounded-full border border-gray-300" }, { style: ({ backgroundColor: color }) }));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)(__assign({ class: "text-sm font-mono text-gray-700" }));
        (color);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)(__assign(__assign({ onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                if (!(__VLS_ctx.selectedColors.length > 0))
                    return;
                __VLS_ctx.removeColor(index);
            } }, { type: "button", disabled: (__VLS_ctx.disabled) }), { class: "text-gray-400 hover:text-red-500 transition-colors disabled:cursor-not-allowed" }));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)(__assign({ class: "w-4 h-4" }, { fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" }));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
            'stroke-linecap': "round",
            'stroke-linejoin': "round",
            'stroke-width': "2",
            d: "M6 18L18 6M6 6l12 12",
        });
    };
    for (var _f = 0, _g = __VLS_getVForSourceType((__VLS_ctx.selectedColors)); _f < _g.length; _f++) {
        var _h = _g[_f], color = _h[0], index = _h[1];
        _loop_3(color, index);
    }
}
if (__VLS_ctx.selectedColors.length === 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "text-center py-6 border-2 border-dashed border-gray-300 rounded-lg" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)(__assign({ class: "mx-auto h-8 w-8 text-gray-400" }, { fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
        'stroke-linecap': "round",
        'stroke-linejoin': "round",
        'stroke-width': "2",
        d: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a4 4 0 004-4V5z",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)(__assign({ class: "mt-2 text-sm text-gray-500" }));
    (__VLS_ctx.paletteType === "preset"
        ? "Select a preset palette"
        : "Add colors to create your palette");
}
if (__VLS_ctx.helpText) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)(__assign({ class: "text-xs text-gray-500" }));
    (__VLS_ctx.helpText);
}
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['text-red-500']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['space-x-1']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gray-100']} */ ;
/** @type {__VLS_StyleScopedClasses['p-1']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-3']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['space-x-1']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-3']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['space-x-2']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['h-10']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
/** @type {__VLS_StyleScopedClasses['disabled:cursor-not-allowed']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-blue-500']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:border-blue-500']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-blue-600']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-blue-700']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-blue-500']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-offset-2']} */ ;
/** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
/** @type {__VLS_StyleScopedClasses['disabled:cursor-not-allowed']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-red-600']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['space-x-2']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-mono']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-red-500']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['disabled:cursor-not-allowed']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['py-6']} */ ;
/** @type {__VLS_StyleScopedClasses['border-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border-dashed']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['h-8']} */ ;
/** @type {__VLS_StyleScopedClasses['w-8']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
var __VLS_dollars;
var __VLS_self = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    setup: function () {
        return {
            paletteType: paletteType,
            selectedColors: selectedColors,
            selectedPreset: selectedPreset,
            newColor: newColor,
            colorInputError: colorInputError,
            paletteTypes: paletteTypes,
            presetPalettes: presetPalettes,
            isValidColor: isValidColor,
            selectPresetPalette: selectPresetPalette,
            addColor: addColor,
            removeColor: removeColor,
            clearSelection: clearSelection,
            handleColorInput: handleColorInput,
            validateColorInput: validateColorInput,
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
