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
Object.defineProperty(exports, "__esModule", { value: true });
var vue_1 = require("vue");
var clipboard_1 = require("../utils/clipboard");
var LayerTreeNode_vue_1 = require("./LayerTreeNode.vue");
var VirtualScrollList_vue_1 = require("./VirtualScrollList.vue");
var LayerListItem_vue_1 = require("./LayerListItem.vue");
var props = withDefaults(defineProps(), {
    title: "Layer Inspector",
    emptyStateText: "No layers to inspect",
    showDetails: true,
    defaultExpanded: false,
});
var emit = defineEmits();
// State
var viewMode = (0, vue_1.ref)("tree");
var expandedLayers = (0, vue_1.ref)(new Set());
var selectedLayer = (0, vue_1.ref)(null);
var allExpanded = (0, vue_1.ref)(props.defaultExpanded);
var showCopyNotification = (0, vue_1.ref)(false);
// Virtual scrolling configuration
var virtualScrollThreshold = 50; // Use virtual scrolling for lists with more than 50 items
var layerItemHeight = 64; // Height of each layer item in pixels
var virtualScrollHeight = 400; // Height of virtual scroll container
// Computed properties
var rootLayers = (0, vue_1.computed)(function () {
    if (!props.layers)
        return [];
    // For now, treat all layers as root layers
    // In a more complex implementation, you might parse parent-child relationships
    return props.layers;
});
var hasNestedLayers = (0, vue_1.computed)(function () {
    var _a;
    // Check if any layers have children (for tree view)
    return ((_a = props.layers) === null || _a === void 0 ? void 0 : _a.some(function (layer) { return layer.type === "group"; })) || false;
});
var layerStats = (0, vue_1.computed)(function () {
    if (!props.layers)
        return { shapes: 0, groups: 0, text: 0, paths: 0 };
    return props.layers.reduce(function (stats, layer) {
        switch (layer.type) {
            case "shape":
                stats.shapes++;
                break;
            case "group":
                stats.groups++;
                break;
            case "text":
                stats.text++;
                break;
            case "path":
                stats.paths++;
                break;
        }
        return stats;
    }, { shapes: 0, groups: 0, text: 0, paths: 0 });
});
// Methods
var toggleExpand = function (layerId) {
    if (expandedLayers.value.has(layerId)) {
        expandedLayers.value.delete(layerId);
    }
    else {
        expandedLayers.value.add(layerId);
    }
};
var toggleAllExpanded = function () {
    var _a;
    if (allExpanded.value) {
        expandedLayers.value.clear();
    }
    else {
        (_a = props.layers) === null || _a === void 0 ? void 0 : _a.forEach(function (layer) {
            if (layer.type === "group") {
                expandedLayers.value.add(layer.id);
            }
        });
    }
    allExpanded.value = !allExpanded.value;
};
var selectLayer = function (layerId) {
    selectedLayer.value = layerId;
    emit("selectLayer", layerId);
};
var copyLayerId = function (layerId) { return __awaiter(void 0, void 0, void 0, function () {
    var error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, (0, clipboard_1.copyToClipboard)(layerId)];
            case 1:
                _a.sent();
                showCopyNotification.value = true;
                emit("copyId", layerId);
                setTimeout(function () {
                    showCopyNotification.value = false;
                }, 2000);
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                console.error("Failed to copy layer ID:", error_1);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
var toggleLayerVisibility = function (layerId) {
    emit("toggleVisibility", layerId);
};
var highlightLayer = function (layerId) {
    emit("highlightLayer", layerId);
};
var handleVisibleRangeChange = function (startIndex, endIndex) {
    emit("visibleRangeChange", startIndex, endIndex);
};
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
var __VLS_withDefaultsArg = (function (t) { return t; })({
    title: "Layer Inspector",
    emptyStateText: "No layers to inspect",
    showDetails: true,
    defaultExpanded: false,
});
var __VLS_ctx = {};
var __VLS_components;
var __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "bg-white rounded-lg shadow-sm border border-gray-200" }));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "flex items-center justify-between p-4 border-b border-gray-200" }));
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)(__assign({ class: "text-lg font-medium text-gray-900" }));
(__VLS_ctx.title);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "flex items-center space-x-2" }));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "flex bg-gray-100 rounded-md p-1" }));
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)(__assign({ onClick: function () {
        var _a = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            _a[_i] = arguments[_i];
        }
        var $event = _a[0];
        __VLS_ctx.viewMode = 'tree';
    } }, { class: ([
        'px-3 py-1 text-sm font-medium rounded transition-colors',
        __VLS_ctx.viewMode === 'tree'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900',
    ]) }));
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)(__assign({ onClick: function () {
        var _a = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            _a[_i] = arguments[_i];
        }
        var $event = _a[0];
        __VLS_ctx.viewMode = 'list';
    } }, { class: ([
        'px-3 py-1 text-sm font-medium rounded transition-colors',
        __VLS_ctx.viewMode === 'list'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900',
    ]) }));
if (__VLS_ctx.viewMode === 'tree' && __VLS_ctx.hasNestedLayers) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)(__assign({ onClick: (__VLS_ctx.toggleAllExpanded) }, { class: "text-sm text-gray-600 hover:text-gray-900 transition-colors" }));
    (__VLS_ctx.allExpanded ? "Collapse All" : "Expand All");
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "p-4" }));
if (!__VLS_ctx.layers || __VLS_ctx.layers.length === 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "text-center py-8" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)(__assign({ class: "mx-auto h-12 w-12 text-gray-400 mb-4" }, { fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
        'stroke-linecap': "round",
        'stroke-linejoin': "round",
        'stroke-width': "2",
        d: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)(__assign({ class: "text-sm text-gray-500" }));
    (__VLS_ctx.emptyStateText);
}
else if (__VLS_ctx.viewMode === 'tree') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "space-y-1" }));
    for (var _i = 0, _a = __VLS_getVForSourceType((__VLS_ctx.rootLayers)); _i < _a.length; _i++) {
        var layer = _a[_i][0];
        /** @type {[typeof LayerTreeNode, ]} */ ;
        // @ts-ignore
        var __VLS_0 = __VLS_asFunctionalComponent(LayerTreeNode_vue_1.default, new LayerTreeNode_vue_1.default(__assign(__assign(__assign({ 'onToggleExpand': {} }, { 'onSelectLayer': {} }), { 'onCopyId': {} }), { key: (layer.id), layer: (layer), allLayers: (__VLS_ctx.layers), expandedLayers: (__VLS_ctx.expandedLayers), selectedLayer: (__VLS_ctx.selectedLayer), showDetails: (__VLS_ctx.showDetails) })));
        var __VLS_1 = __VLS_0.apply(void 0, __spreadArray([__assign(__assign(__assign({ 'onToggleExpand': {} }, { 'onSelectLayer': {} }), { 'onCopyId': {} }), { key: (layer.id), layer: (layer), allLayers: (__VLS_ctx.layers), expandedLayers: (__VLS_ctx.expandedLayers), selectedLayer: (__VLS_ctx.selectedLayer), showDetails: (__VLS_ctx.showDetails) })], __VLS_functionalComponentArgsRest(__VLS_0), false));
        var __VLS_3 = void 0;
        var __VLS_4 = void 0;
        var __VLS_5 = void 0;
        var __VLS_6 = {
            onToggleExpand: (__VLS_ctx.toggleExpand)
        };
        var __VLS_7 = {
            onSelectLayer: (__VLS_ctx.selectLayer)
        };
        var __VLS_8 = {
            onCopyId: (__VLS_ctx.copyLayerId)
        };
        var __VLS_2;
    }
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    if (__VLS_ctx.layers.length > __VLS_ctx.virtualScrollThreshold) {
        /** @type {[typeof VirtualScrollList, typeof VirtualScrollList, ]} */ ;
        // @ts-ignore
        var __VLS_9 = __VLS_asFunctionalComponent(VirtualScrollList_vue_1.default, new VirtualScrollList_vue_1.default(__assign({ 'onVisibleRangeChange': {} }, { items: (__VLS_ctx.layers), itemHeight: (__VLS_ctx.layerItemHeight), containerHeight: (__VLS_ctx.virtualScrollHeight), keyField: "id" })));
        var __VLS_10 = __VLS_9.apply(void 0, __spreadArray([__assign({ 'onVisibleRangeChange': {} }, { items: (__VLS_ctx.layers), itemHeight: (__VLS_ctx.layerItemHeight), containerHeight: (__VLS_ctx.virtualScrollHeight), keyField: "id" })], __VLS_functionalComponentArgsRest(__VLS_9), false));
        var __VLS_12 = void 0;
        var __VLS_13 = void 0;
        var __VLS_14 = void 0;
        var __VLS_15 = {
            onVisibleRangeChange: (__VLS_ctx.handleVisibleRangeChange)
        };
        __VLS_11.slots.default;
        {
            var __VLS_thisSlot = __VLS_11.slots.default;
            var _b = __VLS_getSlotParam(__VLS_thisSlot), layer = _b.item, index = _b.index;
            /** @type {[typeof LayerListItem, ]} */ ;
            // @ts-ignore
            var __VLS_16 = __VLS_asFunctionalComponent(LayerListItem_vue_1.default, new LayerListItem_vue_1.default(__assign(__assign(__assign(__assign({ 'onSelect': {} }, { 'onCopyId': {} }), { 'onToggleVisibility': {} }), { 'onHighlight': {} }), { layer: (layer), index: (index), selected: (__VLS_ctx.selectedLayer === layer.id), showDetails: (__VLS_ctx.showDetails) })));
            var __VLS_17 = __VLS_16.apply(void 0, __spreadArray([__assign(__assign(__assign(__assign({ 'onSelect': {} }, { 'onCopyId': {} }), { 'onToggleVisibility': {} }), { 'onHighlight': {} }), { layer: (layer), index: (index), selected: (__VLS_ctx.selectedLayer === layer.id), showDetails: (__VLS_ctx.showDetails) })], __VLS_functionalComponentArgsRest(__VLS_16), false));
            var __VLS_19 = void 0;
            var __VLS_20 = void 0;
            var __VLS_21 = void 0;
            var __VLS_22 = {
                onSelect: (__VLS_ctx.selectLayer)
            };
            var __VLS_23 = {
                onCopyId: (__VLS_ctx.copyLayerId)
            };
            var __VLS_24 = {
                onToggleVisibility: (__VLS_ctx.toggleLayerVisibility)
            };
            var __VLS_25 = {
                onHighlight: (__VLS_ctx.highlightLayer)
            };
            var __VLS_18;
        }
        var __VLS_11;
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "space-y-2 max-h-96 overflow-y-auto" }));
        for (var _c = 0, _d = __VLS_getVForSourceType((__VLS_ctx.layers)); _c < _d.length; _c++) {
            var _e = _d[_c], layer = _e[0], index = _e[1];
            /** @type {[typeof LayerListItem, ]} */ ;
            // @ts-ignore
            var __VLS_26 = __VLS_asFunctionalComponent(LayerListItem_vue_1.default, new LayerListItem_vue_1.default(__assign(__assign(__assign(__assign({ 'onSelect': {} }, { 'onCopyId': {} }), { 'onToggleVisibility': {} }), { 'onHighlight': {} }), { key: (layer.id), layer: (layer), index: (index), selected: (__VLS_ctx.selectedLayer === layer.id), showDetails: (__VLS_ctx.showDetails) })));
            var __VLS_27 = __VLS_26.apply(void 0, __spreadArray([__assign(__assign(__assign(__assign({ 'onSelect': {} }, { 'onCopyId': {} }), { 'onToggleVisibility': {} }), { 'onHighlight': {} }), { key: (layer.id), layer: (layer), index: (index), selected: (__VLS_ctx.selectedLayer === layer.id), showDetails: (__VLS_ctx.showDetails) })], __VLS_functionalComponentArgsRest(__VLS_26), false));
            var __VLS_29 = void 0;
            var __VLS_30 = void 0;
            var __VLS_31 = void 0;
            var __VLS_32 = {
                onSelect: (__VLS_ctx.selectLayer)
            };
            var __VLS_33 = {
                onCopyId: (__VLS_ctx.copyLayerId)
            };
            var __VLS_34 = {
                onToggleVisibility: (__VLS_ctx.toggleLayerVisibility)
            };
            var __VLS_35 = {
                onHighlight: (__VLS_ctx.highlightLayer)
            };
            var __VLS_28;
        }
    }
}
if (__VLS_ctx.layers && __VLS_ctx.layers.length > 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50 text-sm text-gray-600" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    (__VLS_ctx.layers.length);
    (__VLS_ctx.layers.length !== 1 ? "s" : "");
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "flex items-center space-x-4" }));
    if (__VLS_ctx.layerStats.shapes > 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (__VLS_ctx.layerStats.shapes);
    }
    if (__VLS_ctx.layerStats.groups > 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (__VLS_ctx.layerStats.groups);
    }
    if (__VLS_ctx.layerStats.text > 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (__VLS_ctx.layerStats.text);
    }
    if (__VLS_ctx.layerStats.paths > 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (__VLS_ctx.layerStats.paths);
    }
}
if (__VLS_ctx.showCopyNotification) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-opacity duration-300" }));
}
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['border-b']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['space-x-2']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gray-100']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
/** @type {__VLS_StyleScopedClasses['p-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['py-8']} */ ;
/** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['h-12']} */ ;
/** @type {__VLS_StyleScopedClasses['w-12']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-1']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
/** @type {__VLS_StyleScopedClasses['max-h-96']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-y-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['border-t']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gray-50']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['space-x-4']} */ ;
/** @type {__VLS_StyleScopedClasses['fixed']} */ ;
/** @type {__VLS_StyleScopedClasses['bottom-4']} */ ;
/** @type {__VLS_StyleScopedClasses['right-4']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-green-600']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['z-50']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-opacity']} */ ;
/** @type {__VLS_StyleScopedClasses['duration-300']} */ ;
var __VLS_dollars;
var __VLS_self = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    setup: function () {
        return {
            LayerTreeNode: LayerTreeNode_vue_1.default,
            VirtualScrollList: VirtualScrollList_vue_1.default,
            LayerListItem: LayerListItem_vue_1.default,
            viewMode: viewMode,
            expandedLayers: expandedLayers,
            selectedLayer: selectedLayer,
            allExpanded: allExpanded,
            showCopyNotification: showCopyNotification,
            virtualScrollThreshold: virtualScrollThreshold,
            layerItemHeight: layerItemHeight,
            virtualScrollHeight: virtualScrollHeight,
            rootLayers: rootLayers,
            hasNestedLayers: hasNestedLayers,
            layerStats: layerStats,
            toggleExpand: toggleExpand,
            toggleAllExpanded: toggleAllExpanded,
            selectLayer: selectLayer,
            copyLayerId: copyLayerId,
            toggleLayerVisibility: toggleLayerVisibility,
            highlightLayer: highlightLayer,
            handleVisibleRangeChange: handleVisibleRangeChange,
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
