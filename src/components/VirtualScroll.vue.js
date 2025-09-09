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
var debounce_1 = require("../utils/debounce");
var props = withDefaults(defineProps(), {
    overscan: 5,
    getItemKey: function (_item) { return Math.random(); },
});
var containerRef = (0, vue_1.ref)();
var scrollTop = (0, vue_1.ref)(0);
// Calculate visible range
var startIndex = (0, vue_1.computed)(function () {
    var index = Math.floor(scrollTop.value / props.itemHeight);
    return Math.max(0, index - props.overscan);
});
var endIndex = (0, vue_1.computed)(function () {
    var visibleCount = Math.ceil(props.containerHeight / props.itemHeight);
    var index = startIndex.value + visibleCount + props.overscan * 2;
    return Math.min(props.items.length - 1, index);
});
// Calculate total height
var totalHeight = (0, vue_1.computed)(function () {
    return props.items.length * props.itemHeight;
});
// Calculate offset for visible items
var offsetY = (0, vue_1.computed)(function () {
    return startIndex.value * props.itemHeight;
});
// Get visible items with their original indices
var visibleItems = (0, vue_1.computed)(function () {
    var items = [];
    for (var i = startIndex.value; i <= endIndex.value; i++) {
        if (props.items[i] !== undefined) {
            items.push({
                data: props.items[i],
                index: i,
            });
        }
    }
    return items;
});
// Throttled scroll handler for better performance
var handleScroll = (0, debounce_1.throttle)(function (event) {
    var target = event.target;
    scrollTop.value = target.scrollTop;
}, 16); // ~60fps
// Scroll to specific item
var scrollToItem = function (index, behavior) {
    if (behavior === void 0) { behavior = "smooth"; }
    if (!containerRef.value)
        return;
    var targetScrollTop = index * props.itemHeight;
    containerRef.value.scrollTo({
        top: targetScrollTop,
        behavior: behavior,
    });
};
// Scroll to top
var scrollToTop = function (behavior) {
    if (behavior === void 0) { behavior = "smooth"; }
    scrollToItem(0, behavior);
};
// Scroll to bottom
var scrollToBottom = function (behavior) {
    if (behavior === void 0) { behavior = "smooth"; }
    scrollToItem(props.items.length - 1, behavior);
};
// Watch for items changes and reset scroll if needed
(0, vue_1.watch)(function () { return props.items.length; }, function (newLength, oldLength) {
    if (newLength < oldLength && scrollTop.value > 0) {
        // If items were removed and we're scrolled down, adjust scroll position
        var maxScrollTop = Math.max(0, newLength * props.itemHeight - props.containerHeight);
        if (scrollTop.value > maxScrollTop) {
            scrollTop.value = maxScrollTop;
            if (containerRef.value) {
                containerRef.value.scrollTop = maxScrollTop;
            }
        }
    }
});
// Expose methods for parent components
var __VLS_exposed = {
    scrollToItem: scrollToItem,
    scrollToTop: scrollToTop,
    scrollToBottom: scrollToBottom,
    getScrollTop: function () { return scrollTop.value; },
    getVisibleRange: function () { return ({ start: startIndex.value, end: endIndex.value }); },
};
defineExpose(__VLS_exposed);
(0, vue_1.onMounted)(function () {
    // Initialize scroll position
    if (containerRef.value) {
        scrollTop.value = containerRef.value.scrollTop;
    }
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
var __VLS_withDefaultsArg = (function (t) { return t; })({
    overscan: 5,
    getItemKey: function (_item) { return Math.random(); },
});
var __VLS_ctx = {};
var __VLS_components;
var __VLS_directives;
/** @type {__VLS_StyleScopedClasses['virtual-scroll-container']} */ ;
/** @type {__VLS_StyleScopedClasses['virtual-scroll-container']} */ ;
/** @type {__VLS_StyleScopedClasses['virtual-scroll-container']} */ ;
/** @type {__VLS_StyleScopedClasses['virtual-scroll-container']} */ ;
/** @type {__VLS_StyleScopedClasses['virtual-scroll-container']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign(__assign(__assign({ onScroll: (__VLS_ctx.handleScroll) }, { ref: "containerRef" }), { class: "virtual-scroll-container" }), { style: ({ height: __VLS_ctx.containerHeight + 'px' }) }));
/** @type {typeof __VLS_ctx.containerRef} */ ;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "virtual-scroll-spacer" }, { style: ({ height: __VLS_ctx.totalHeight + 'px' }) }));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "virtual-scroll-content" }, { style: ({ transform: "translateY(".concat(__VLS_ctx.offsetY, "px)") }) }));
for (var _i = 0, _a = __VLS_getVForSourceType((__VLS_ctx.visibleItems)); _i < _a.length; _i++) {
    var item = _a[_i][0];
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign(__assign({ key: (__VLS_ctx.getItemKey(item.data)) }, { class: "virtual-scroll-item" }), { style: ({ height: __VLS_ctx.itemHeight + 'px' }) }));
    var __VLS_0 = {
        item: (item.data),
        index: (item.index),
    };
}
/** @type {__VLS_StyleScopedClasses['virtual-scroll-container']} */ ;
/** @type {__VLS_StyleScopedClasses['virtual-scroll-spacer']} */ ;
/** @type {__VLS_StyleScopedClasses['virtual-scroll-content']} */ ;
/** @type {__VLS_StyleScopedClasses['virtual-scroll-item']} */ ;
// @ts-ignore
var __VLS_1 = __VLS_0;
var __VLS_dollars;
var __VLS_self = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    setup: function () {
        return {
            containerRef: containerRef,
            totalHeight: totalHeight,
            offsetY: offsetY,
            visibleItems: visibleItems,
            handleScroll: handleScroll,
        };
    },
    __typeProps: {},
    props: {},
});
var __VLS_component = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    setup: function () {
        return __assign({}, __VLS_exposed);
    },
    __typeProps: {},
    props: {},
});
exports.default = {};
; /* PartiallyEnd: #4569/main.vue */
