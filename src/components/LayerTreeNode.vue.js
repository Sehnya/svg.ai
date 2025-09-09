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
Object.defineProperty(exports, "__esModule", { value: true });
var vue_1 = require("vue");
var LayerIcon_vue_1 = require("./LayerIcon.vue");
var props = withDefaults(defineProps(), {
    showDetails: true,
    depth: 0,
});
var emit = defineEmits();
// Computed properties
var children = (0, vue_1.computed)(function () {
    // In a real implementation, you would parse the SVG structure to determine parent-child relationships
    // For now, we'll assume groups might have children based on naming conventions or other heuristics
    if (props.layer.type !== "group")
        return [];
    // This is a simplified example - in practice you'd need to parse the actual SVG structure
    return props.allLayers.filter(function (l) {
        return l.id !== props.layer.id &&
            l.id.startsWith(props.layer.id.replace("-group", "")) &&
            l.id !== props.layer.id;
    });
});
var hasChildren = (0, vue_1.computed)(function () { return children.value.length > 0; });
var isExpanded = (0, vue_1.computed)(function () { return props.expandedLayers.has(props.layer.id); });
// Methods
var toggleExpand = function (layerId) {
    emit("toggleExpand", layerId);
};
var selectLayer = function (layerId) {
    emit("selectLayer", layerId);
};
var copyId = function (layerId) {
    emit("copyId", layerId);
};
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
var __VLS_withDefaultsArg = (function (t) { return t; })({
    showDetails: true,
    depth: 0,
});
var __VLS_ctx = {};
var __VLS_components;
var __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "layer-tree-node" }));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign(__assign({ onClick: function () {
        var _a = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            _a[_i] = arguments[_i];
        }
        var $event = _a[0];
        __VLS_ctx.selectLayer(__VLS_ctx.layer.id);
    } }, { class: ([
        'flex items-center space-x-2 p-2 rounded-lg transition-colors cursor-pointer',
        __VLS_ctx.selectedLayer === __VLS_ctx.layer.id
            ? 'bg-blue-50 border border-blue-200'
            : 'hover:bg-gray-50',
    ]) }), { style: ({ paddingLeft: "".concat(__VLS_ctx.depth * 20 + 8, "px") }) }));
if (__VLS_ctx.hasChildren) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)(__assign({ onClick: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            if (!(__VLS_ctx.hasChildren))
                return;
            __VLS_ctx.toggleExpand(__VLS_ctx.layer.id);
        } }, { class: "flex-shrink-0 p-0.5 text-gray-400 hover:text-gray-600 transition-colors" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)(__assign({ class: ([
            'w-4 h-4 transition-transform',
            __VLS_ctx.isExpanded ? 'rotate-90' : '',
        ]) }, { fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
        'stroke-linecap': "round",
        'stroke-linejoin': "round",
        'stroke-width': "2",
        d: "M9 5l7 7-7 7",
    });
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "w-5 flex-shrink-0" }));
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "flex-shrink-0" }));
/** @type {[typeof LayerIcon, ]} */ ;
// @ts-ignore
var __VLS_0 = __VLS_asFunctionalComponent(LayerIcon_vue_1.default, new LayerIcon_vue_1.default({
    type: (__VLS_ctx.layer.type),
}));
var __VLS_1 = __VLS_0.apply(void 0, __spreadArray([{
        type: (__VLS_ctx.layer.type),
    }], __VLS_functionalComponentArgsRest(__VLS_0), false));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "flex-1 min-w-0" }));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "flex items-center justify-between" }));
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)(__assign({ class: "text-sm font-medium text-gray-900 truncate" }));
(__VLS_ctx.layer.label);
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)(__assign({ class: "text-xs text-gray-500 capitalize ml-2" }));
(__VLS_ctx.layer.type);
if (__VLS_ctx.showDetails) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)(__assign({ class: "text-xs text-gray-500 font-mono truncate" }));
    (__VLS_ctx.layer.id);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "flex-shrink-0 flex items-center space-x-1" }));
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)(__assign(__assign({ onClick: function () {
        var _a = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            _a[_i] = arguments[_i];
        }
        var $event = _a[0];
        __VLS_ctx.copyId(__VLS_ctx.layer.id);
    } }, { class: "p-1 text-gray-400 hover:text-gray-600 transition-colors" }), { title: "Copy ID" }));
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)(__assign({ class: "w-3 h-3" }, { fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" }));
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    'stroke-linecap': "round",
    'stroke-linejoin': "round",
    'stroke-width': "2",
    d: "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z",
});
if (__VLS_ctx.hasChildren && __VLS_ctx.isExpanded) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "mt-1" }));
    for (var _i = 0, _a = __VLS_getVForSourceType((__VLS_ctx.children)); _i < _a.length; _i++) {
        var child = _a[_i][0];
        var __VLS_3 = {}.LayerTreeNode;
        /** @type {[typeof __VLS_components.LayerTreeNode, ]} */ ;
        // @ts-ignore
        var __VLS_4 = __VLS_asFunctionalComponent(__VLS_3, new __VLS_3(__assign(__assign(__assign({ 'onToggleExpand': {} }, { 'onSelectLayer': {} }), { 'onCopyId': {} }), { key: (child.id), layer: (child), allLayers: (__VLS_ctx.allLayers), expandedLayers: (__VLS_ctx.expandedLayers), selectedLayer: (__VLS_ctx.selectedLayer), showDetails: (__VLS_ctx.showDetails), depth: (__VLS_ctx.depth + 1) })));
        var __VLS_5 = __VLS_4.apply(void 0, __spreadArray([__assign(__assign(__assign({ 'onToggleExpand': {} }, { 'onSelectLayer': {} }), { 'onCopyId': {} }), { key: (child.id), layer: (child), allLayers: (__VLS_ctx.allLayers), expandedLayers: (__VLS_ctx.expandedLayers), selectedLayer: (__VLS_ctx.selectedLayer), showDetails: (__VLS_ctx.showDetails), depth: (__VLS_ctx.depth + 1) })], __VLS_functionalComponentArgsRest(__VLS_4), false));
        var __VLS_7 = void 0;
        var __VLS_8 = void 0;
        var __VLS_9 = void 0;
        var __VLS_10 = {
            onToggleExpand: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                if (!(__VLS_ctx.hasChildren && __VLS_ctx.isExpanded))
                    return;
                __VLS_ctx.$emit('toggleExpand', $event);
            }
        };
        var __VLS_11 = {
            onSelectLayer: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                if (!(__VLS_ctx.hasChildren && __VLS_ctx.isExpanded))
                    return;
                __VLS_ctx.$emit('selectLayer', $event);
            }
        };
        var __VLS_12 = {
            onCopyId: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                if (!(__VLS_ctx.hasChildren && __VLS_ctx.isExpanded))
                    return;
                __VLS_ctx.$emit('copyId', $event);
            }
        };
        var __VLS_6;
    }
}
/** @type {__VLS_StyleScopedClasses['layer-tree-node']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-shrink-0']} */ ;
/** @type {__VLS_StyleScopedClasses['p-0.5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-shrink-0']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-shrink-0']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['truncate']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['capitalize']} */ ;
/** @type {__VLS_StyleScopedClasses['ml-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['font-mono']} */ ;
/** @type {__VLS_StyleScopedClasses['truncate']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-shrink-0']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['space-x-1']} */ ;
/** @type {__VLS_StyleScopedClasses['p-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['w-3']} */ ;
/** @type {__VLS_StyleScopedClasses['h-3']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
var __VLS_dollars;
var __VLS_self = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    setup: function () {
        return {
            LayerIcon: LayerIcon_vue_1.default,
            children: children,
            hasChildren: hasChildren,
            isExpanded: isExpanded,
            toggleExpand: toggleExpand,
            selectLayer: selectLayer,
            copyId: copyId,
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
