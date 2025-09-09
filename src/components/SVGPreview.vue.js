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
    title: "SVG Preview",
    loadingText: "Generating SVG...",
    emptyStateText: "No SVG to preview",
    showZoomControls: true,
    showFullscreenButton: true,
    showOverlayInfo: false,
    showFooter: true,
    showRetryButton: true,
    showBorder: true,
    enablePanning: true,
    enableWheelZoom: true,
    backgroundColor: "white",
    minZoom: 0.1,
    maxZoom: 5,
    zoomStep: 0.1,
});
var emit = defineEmits();
// Refs
var previewContainer = (0, vue_1.ref)();
var svgContainer = (0, vue_1.ref)();
var svgWrapper = (0, vue_1.ref)();
// State
var zoomLevel = (0, vue_1.ref)(1);
var panX = (0, vue_1.ref)(0);
var panY = (0, vue_1.ref)(0);
var isPanning = (0, vue_1.ref)(false);
var panStartX = (0, vue_1.ref)(0);
var panStartY = (0, vue_1.ref)(0);
var isFullscreen = (0, vue_1.ref)(false);
// Computed properties
var sanitizedSvgContent = (0, vue_1.computed)(function () {
    if (!props.svgContent)
        return "";
    // Basic SVG sanitization - in production, use a proper sanitization library
    var cleanSvg = props.svgContent
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/on\w+="[^"]*"/gi, "")
        .replace(/javascript:/gi, "");
    return cleanSvg;
});
var svgDimensions = (0, vue_1.computed)(function () {
    if (!props.metadata)
        return "";
    return "".concat(props.metadata.width, "\u00D7").concat(props.metadata.height);
});
var containerStyle = (0, vue_1.computed)(function () { return ({
    transform: "scale(".concat(zoomLevel.value, ") translate(").concat(panX.value, "px, ").concat(panY.value, "px)"),
}); });
var svgWrapperStyle = (0, vue_1.computed)(function () { return ({
    maxWidth: "100%",
    maxHeight: "100%",
}); });
// Methods
var zoomIn = function () {
    if (zoomLevel.value < props.maxZoom) {
        zoomLevel.value = Math.min(props.maxZoom, zoomLevel.value + props.zoomStep);
        emit("zoomChange", zoomLevel.value);
    }
};
var zoomOut = function () {
    if (zoomLevel.value > props.minZoom) {
        zoomLevel.value = Math.max(props.minZoom, zoomLevel.value - props.zoomStep);
        emit("zoomChange", zoomLevel.value);
    }
};
var resetZoom = function () {
    zoomLevel.value = 1;
    panX.value = 0;
    panY.value = 0;
    emit("zoomChange", zoomLevel.value);
};
var toggleFullscreen = function () {
    isFullscreen.value = !isFullscreen.value;
    emit("fullscreenChange", isFullscreen.value);
    if (isFullscreen.value) {
        document.body.style.overflow = "hidden";
    }
    else {
        document.body.style.overflow = "";
    }
};
var startPanning = function (event) {
    if (!props.enablePanning)
        return;
    isPanning.value = true;
    panStartX.value = event.clientX - panX.value;
    panStartY.value = event.clientY - panY.value;
    event.preventDefault();
};
var handlePanning = function (event) {
    if (!isPanning.value || !props.enablePanning)
        return;
    panX.value = event.clientX - panStartX.value;
    panY.value = event.clientY - panStartY.value;
    event.preventDefault();
};
var stopPanning = function () {
    isPanning.value = false;
};
var handleWheel = function (event) {
    if (!props.enableWheelZoom)
        return;
    event.preventDefault();
    var delta = event.deltaY > 0 ? -props.zoomStep : props.zoomStep;
    var newZoom = Math.max(props.minZoom, Math.min(props.maxZoom, zoomLevel.value + delta));
    if (newZoom !== zoomLevel.value) {
        zoomLevel.value = newZoom;
        emit("zoomChange", zoomLevel.value);
    }
};
var handleKeydown = function (event) {
    if (isFullscreen.value && event.key === "Escape") {
        toggleFullscreen();
    }
};
// Lifecycle
(0, vue_1.onMounted)(function () {
    document.addEventListener("keydown", handleKeydown);
});
(0, vue_1.onUnmounted)(function () {
    document.removeEventListener("keydown", handleKeydown);
    if (isFullscreen.value) {
        document.body.style.overflow = "";
    }
});
// Watch for content changes to reset zoom/pan
(0, vue_1.watch)(function () { return props.svgContent; }, function () {
    resetZoom();
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
var __VLS_withDefaultsArg = (function (t) { return t; })({
    title: "SVG Preview",
    loadingText: "Generating SVG...",
    emptyStateText: "No SVG to preview",
    showZoomControls: true,
    showFullscreenButton: true,
    showOverlayInfo: false,
    showFooter: true,
    showRetryButton: true,
    showBorder: true,
    enablePanning: true,
    enableWheelZoom: true,
    backgroundColor: "white",
    minZoom: 0.1,
    maxZoom: 5,
    zoomStep: 0.1,
});
var __VLS_ctx = {};
var __VLS_components;
var __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "bg-white rounded-lg shadow-sm border border-gray-200" }));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "flex items-center justify-between p-4 border-b border-gray-200" }));
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)(__assign({ class: "text-lg font-medium text-gray-900" }));
(__VLS_ctx.title);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "flex items-center space-x-2" }));
if (__VLS_ctx.svgContent && __VLS_ctx.showZoomControls) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "flex items-center space-x-1 bg-gray-100 rounded-md p-1" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)(__assign(__assign(__assign({ onClick: (__VLS_ctx.zoomOut) }, { disabled: (__VLS_ctx.zoomLevel <= __VLS_ctx.minZoom) }), { class: "p-1 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed" }), { title: "Zoom out" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)(__assign({ class: "w-4 h-4" }, { fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
        'stroke-linecap': "round",
        'stroke-linejoin': "round",
        'stroke-width': "2",
        d: "M20 12H4",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)(__assign({ class: "text-xs text-gray-600 min-w-[3rem] text-center" }));
    (Math.round(__VLS_ctx.zoomLevel * 100));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)(__assign(__assign(__assign({ onClick: (__VLS_ctx.zoomIn) }, { disabled: (__VLS_ctx.zoomLevel >= __VLS_ctx.maxZoom) }), { class: "p-1 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed" }), { title: "Zoom in" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)(__assign({ class: "w-4 h-4" }, { fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
        'stroke-linecap': "round",
        'stroke-linejoin': "round",
        'stroke-width': "2",
        d: "M12 4v16m8-8H4",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)(__assign(__assign({ onClick: (__VLS_ctx.resetZoom) }, { class: "p-1 text-gray-600 hover:text-gray-900" }), { title: "Reset zoom" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)(__assign({ class: "w-4 h-4" }, { fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
        'stroke-linecap': "round",
        'stroke-linejoin': "round",
        'stroke-width': "2",
        d: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
    });
}
if (__VLS_ctx.svgContent && __VLS_ctx.showFullscreenButton) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)(__assign(__assign({ onClick: (__VLS_ctx.toggleFullscreen) }, { class: "p-2 text-gray-600 hover:text-gray-900 transition-colors" }), { title: "Toggle fullscreen" }));
    if (!__VLS_ctx.isFullscreen) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)(__assign({ class: "w-4 h-4" }, { fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" }));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
            'stroke-linecap': "round",
            'stroke-linejoin': "round",
            'stroke-width': "2",
            d: "M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4",
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)(__assign({ class: "w-4 h-4" }, { fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" }));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
            'stroke-linecap': "round",
            'stroke-linejoin': "round",
            'stroke-width': "2",
            d: "M9 9V4.5M9 9H4.5M9 9L3.5 3.5M15 9v-4.5M15 9h4.5M15 9l5.5-5.5M9 15v4.5M9 15H4.5M9 15l-5.5 5.5M15 15v4.5M15 15h4.5m0 0l5.5 5.5",
        });
    }
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ ref: "previewContainer" }, { class: ([
        'relative overflow-hidden',
        __VLS_ctx.isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'min-h-[300px]',
    ]) }));
/** @type {typeof __VLS_ctx.previewContainer} */ ;
if (__VLS_ctx.isLoading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "flex items-center justify-center h-64" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "text-center" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)(__assign({ class: "animate-spin mx-auto h-8 w-8 text-blue-600 mb-4" }, { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.circle, __VLS_intrinsicElements.circle)(__assign({ class: "opacity-25" }, { cx: "12", cy: "12", r: "10", stroke: "currentColor", 'stroke-width': "4" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.path, __VLS_intrinsicElements.path)(__assign({ class: "opacity-75" }, { fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)(__assign({ class: "text-sm text-gray-600" }));
    (__VLS_ctx.loadingText);
}
else if (__VLS_ctx.error) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "flex items-center justify-center h-64" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "text-center max-w-md mx-auto p-6" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)(__assign({ class: "mx-auto h-12 w-12 text-red-400 mb-4" }, { fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
        'stroke-linecap': "round",
        'stroke-linejoin': "round",
        'stroke-width': "2",
        d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)(__assign({ class: "text-lg font-medium text-gray-900 mb-2" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)(__assign({ class: "text-sm text-gray-600 mb-4" }));
    (__VLS_ctx.error);
    if (__VLS_ctx.showRetryButton) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)(__assign({ onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                if (!!(__VLS_ctx.isLoading))
                    return;
                if (!(__VLS_ctx.error))
                    return;
                if (!(__VLS_ctx.showRetryButton))
                    return;
                __VLS_ctx.$emit('retry');
            } }, { class: "inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" }));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)(__assign({ class: "w-4 h-4 mr-2" }, { fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" }));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
            'stroke-linecap': "round",
            'stroke-linejoin': "round",
            'stroke-width': "2",
            d: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
        });
    }
}
else if (!__VLS_ctx.svgContent) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "flex items-center justify-center h-64" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "text-center" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)(__assign({ class: "mx-auto h-12 w-12 text-gray-400 mb-4" }, { stroke: "currentColor", fill: "none", viewBox: "0 0 48 48" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
        d: "M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02",
        'stroke-width': "2",
        'stroke-linecap': "round",
        'stroke-linejoin': "round",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)(__assign({ class: "text-sm text-gray-500" }));
    (__VLS_ctx.emptyStateText);
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign(__assign(__assign(__assign(__assign(__assign(__assign({ onMousedown: (__VLS_ctx.startPanning) }, { onMousemove: (__VLS_ctx.handlePanning) }), { onMouseup: (__VLS_ctx.stopPanning) }), { onMouseleave: (__VLS_ctx.stopPanning) }), { onWheel: (__VLS_ctx.handleWheel) }), { ref: "svgContainer" }), { class: ([
            'flex items-center justify-center p-4 transition-transform duration-200',
            __VLS_ctx.isFullscreen ? 'h-full' : 'min-h-[300px]',
            __VLS_ctx.enablePanning ? 'cursor-grab active:cursor-grabbing' : '',
        ]) }), { style: (__VLS_ctx.containerStyle) }));
    /** @type {typeof __VLS_ctx.svgContainer} */ ;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div)(__assign(__assign({ ref: "svgWrapper" }, { class: ([
            'relative transition-transform duration-200',
            __VLS_ctx.showBorder ? 'border border-gray-200 rounded' : '',
            __VLS_ctx.backgroundColor === 'transparent' ? 'bg-transparent' : '',
            __VLS_ctx.backgroundColor === 'white' ? 'bg-white' : '',
            __VLS_ctx.backgroundColor === 'gray' ? 'bg-gray-100' : '',
            __VLS_ctx.backgroundColor === 'dark' ? 'bg-gray-900' : '',
        ]) }), { style: (__VLS_ctx.svgWrapperStyle) }));
    __VLS_asFunctionalDirective(__VLS_directives.vHtml)(null, __assign(__assign({}, __VLS_directiveBindingRestFields), { value: (__VLS_ctx.sanitizedSvgContent) }), null, null);
    /** @type {typeof __VLS_ctx.svgWrapper} */ ;
}
if (__VLS_ctx.svgContent && __VLS_ctx.showOverlayInfo) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "absolute top-2 left-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded" }));
    (__VLS_ctx.svgDimensions);
}
if (__VLS_ctx.svgContent && __VLS_ctx.showFooter) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50" }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "text-sm text-gray-600" }));
    if (__VLS_ctx.metadata) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (__VLS_ctx.metadata.width);
        (__VLS_ctx.metadata.height);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ class: "flex items-center space-x-2" }));
    var __VLS_0 = {};
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
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['space-x-1']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gray-100']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
/** @type {__VLS_StyleScopedClasses['p-1']} */ ;
/** @type {__VLS_StyleScopedClasses['p-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
/** @type {__VLS_StyleScopedClasses['disabled:cursor-not-allowed']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['min-w-[3rem]']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['p-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
/** @type {__VLS_StyleScopedClasses['disabled:cursor-not-allowed']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['p-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['p-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['h-64']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['animate-spin']} */ ;
/** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['h-8']} */ ;
/** @type {__VLS_StyleScopedClasses['w-8']} */ ;
/** @type {__VLS_StyleScopedClasses['text-blue-600']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-25']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-75']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['h-64']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-md']} */ ;
/** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['p-6']} */ ;
/** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['h-12']} */ ;
/** @type {__VLS_StyleScopedClasses['w-12']} */ ;
/** @type {__VLS_StyleScopedClasses['text-red-400']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-transparent']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['leading-4']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-blue-600']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-blue-700']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-offset-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-blue-500']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['mr-2']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['h-64']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['h-12']} */ ;
/** @type {__VLS_StyleScopedClasses['w-12']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['top-2']} */ ;
/** @type {__VLS_StyleScopedClasses['left-2']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-black']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-opacity-75']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['px-2']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
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
/** @type {__VLS_StyleScopedClasses['space-x-2']} */ ;
// @ts-ignore
var __VLS_1 = __VLS_0;
var __VLS_dollars;
var __VLS_self = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    setup: function () {
        return {
            previewContainer: previewContainer,
            svgContainer: svgContainer,
            svgWrapper: svgWrapper,
            zoomLevel: zoomLevel,
            isFullscreen: isFullscreen,
            sanitizedSvgContent: sanitizedSvgContent,
            svgDimensions: svgDimensions,
            containerStyle: containerStyle,
            svgWrapperStyle: svgWrapperStyle,
            zoomIn: zoomIn,
            zoomOut: zoomOut,
            resetZoom: resetZoom,
            toggleFullscreen: toggleFullscreen,
            startPanning: startPanning,
            handlePanning: handlePanning,
            stopPanning: stopPanning,
            handleWheel: handleWheel,
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
