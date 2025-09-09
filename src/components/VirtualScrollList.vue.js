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
    overscan: 5,
    keyField: "id",
});
var emit = defineEmits();
// Refs
var containerRef = (0, vue_1.ref)();
var scrollTop = (0, vue_1.ref)(0);
// Computed properties
var totalHeight = (0, vue_1.computed)(function () { return props.items.length * props.itemHeight; });
var startIndex = (0, vue_1.computed)(function () {
    var index = Math.floor(scrollTop.value / props.itemHeight);
    return Math.max(0, index - props.overscan);
});
var endIndex = (0, vue_1.computed)(function () {
    var visibleCount = Math.ceil(props.containerHeight / props.itemHeight);
    var index = startIndex.value + visibleCount + props.overscan * 2;
    return Math.min(props.items.length - 1, index);
});
var visibleItems = (0, vue_1.computed)(function () {
    var items = [];
    for (var i = startIndex.value; i <= endIndex.value; i++) {
        if (props.items[i]) {
            items.push({
                index: i,
                data: props.items[i],
            });
        }
    }
    return items;
});
var offsetY = (0, vue_1.computed)(function () { return startIndex.value * props.itemHeight; });
var visibleHeight = (0, vue_1.computed)(function () {
    return (endIndex.value - startIndex.value + 1) * props.itemHeight;
});
// Methods
var handleScroll = function (event) {
    var target = event.target;
    scrollTop.value = target.scrollTop;
    emit("scroll", scrollTop.value);
};
var getItemKey = function (item) {
    if (typeof item === "object" && item !== null) {
        return item[props.keyField] || item.id || JSON.stringify(item);
    }
    return item;
};
var scrollToIndex = function (index, behavior) {
    if (behavior === void 0) { behavior = "smooth"; }
    if (!containerRef.value)
        return;
    var targetScrollTop = index * props.itemHeight;
    containerRef.value.scrollTo({
        top: targetScrollTop,
        behavior: behavior,
    });
};
var scrollToTop = function (behavior) {
    if (behavior === void 0) { behavior = "smooth"; }
    scrollToIndex(0, behavior);
};
var scrollToBottom = function (behavior) {
    if (behavior === void 0) { behavior = "smooth"; }
    scrollToIndex(props.items.length - 1, behavior);
};
// Watch for visible range changes
(0, vue_1.watch)([startIndex, endIndex], function (_a) {
    var newStart = _a[0], newEnd = _a[1];
    emit("visibleRangeChange", newStart, newEnd);
}, { immediate: true });
// Expose methods for parent component
var __VLS_exposed = {
    scrollToIndex: scrollToIndex,
    scrollToTop: scrollToTop,
    scrollToBottom: scrollToBottom,
};
defineExpose(__VLS_exposed);
// Lifecycle
(0, vue_1.onMounted)(function () {
    // Initial scroll position handling
    if (containerRef.value) {
        scrollTop.value = containerRef.value.scrollTop;
    }
});
(0, vue_1.onUnmounted)(function () {
    // Cleanup if needed
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
var __VLS_withDefaultsArg = (function (t) { return t; })({
    overscan: 5,
    keyField: "id",
});
var __VLS_ctx = {};
var __VLS_components;
var __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign(__assign(__assign({ onScroll: (__VLS_ctx.handleScroll) }, { ref: "containerRef" }), { style: ({ height: "".concat(__VLS_ctx.containerHeight, "px") }) }), { class: "overflow-auto" }));
/** @type {typeof __VLS_ctx.containerRef} */ ;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div)(__assign({ style: ({ height: "".concat(__VLS_ctx.offsetY, "px") }) }));
for (var _i = 0, _a = __VLS_getVForSourceType((__VLS_ctx.visibleItems)); _i < _a.length; _i++) {
    var item = _a[_i][0];
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign(__assign({ key: (__VLS_ctx.getItemKey(item.data)) }, { style: ({ height: "".concat(__VLS_ctx.itemHeight, "px") }) }), { class: "flex-shrink-0" }));
    var __VLS_0 = {
        item: (item.data),
        index: (item.index),
    };
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div)(__assign({ style: ({ height: "".concat(__VLS_ctx.totalHeight - __VLS_ctx.offsetY - __VLS_ctx.visibleHeight, "px") }) }));
/** @type {__VLS_StyleScopedClasses['overflow-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-shrink-0']} */ ;
// @ts-ignore
var __VLS_1 = __VLS_0;
var __VLS_dollars;
var __VLS_self = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    setup: function () {
        return {
            containerRef: containerRef,
            totalHeight: totalHeight,
            visibleItems: visibleItems,
            offsetY: offsetY,
            visibleHeight: visibleHeight,
            handleScroll: handleScroll,
            getItemKey: getItemKey,
        };
    },
    __typeEmits: {},
    __typeProps: {},
    props: {},
});
var __VLS_component = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    setup: function () {
        return __assign({}, __VLS_exposed);
    },
    __typeEmits: {},
    __typeProps: {},
    props: {},
});
exports.default = {};
; /* PartiallyEnd: #4569/main.vue */
