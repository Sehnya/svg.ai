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
    rootMargin: "50px",
    threshold: 0.1,
    once: true,
});
var containerRef = (0, vue_1.ref)();
var isVisible = (0, vue_1.ref)(false);
var isLoaded = (0, vue_1.ref)(false);
var observer = null;
var handleIntersection = function (entries) {
    var entry = entries[0];
    if (entry.isIntersecting) {
        isVisible.value = true;
        // Add a small delay to ensure smooth loading
        setTimeout(function () {
            isLoaded.value = true;
        }, 100);
        if (props.once && observer) {
            observer.disconnect();
        }
    }
    else if (!props.once) {
        isVisible.value = false;
        isLoaded.value = false;
    }
};
(0, vue_1.onMounted)(function () {
    if (!containerRef.value)
        return;
    observer = new IntersectionObserver(handleIntersection, {
        rootMargin: props.rootMargin,
        threshold: props.threshold,
    });
    observer.observe(containerRef.value);
});
(0, vue_1.onUnmounted)(function () {
    if (observer) {
        observer.disconnect();
    }
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
var __VLS_withDefaultsArg = (function (t) { return t; })({
    rootMargin: "50px",
    threshold: 0.1,
    once: true,
});
var __VLS_ctx = {};
var __VLS_components;
var __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ ref: "containerRef" }, { class: "lazy-component" }));
/** @type {typeof __VLS_ctx.containerRef} */ ;
if (!__VLS_ctx.isVisible && !__VLS_ctx.isLoaded) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "lazy-placeholder" }));
    var __VLS_0 = {};
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "animate-pulse bg-gray-200 rounded h-32 flex items-center justify-center" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)(__assign({ class: "text-gray-500 text-sm" }));
}
else if (__VLS_ctx.isLoaded) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "lazy-content" }));
    var __VLS_2 = {};
}
/** @type {__VLS_StyleScopedClasses['lazy-component']} */ ;
/** @type {__VLS_StyleScopedClasses['lazy-placeholder']} */ ;
/** @type {__VLS_StyleScopedClasses['animate-pulse']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['h-32']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['lazy-content']} */ ;
// @ts-ignore
var __VLS_1 = __VLS_0, __VLS_3 = __VLS_2;
var __VLS_dollars;
var __VLS_self = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    setup: function () {
        return {
            containerRef: containerRef,
            isVisible: isVisible,
            isLoaded: isLoaded,
        };
    },
    __typeProps: {},
    props: {},
});
var __VLS_component = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    setup: function () {
        return {};
    },
    __typeProps: {},
    props: {},
});
exports.default = {};
; /* PartiallyEnd: #4569/main.vue */
