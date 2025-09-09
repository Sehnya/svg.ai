"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
// Mock global objects that might not be available in test environment
Object.defineProperty(window, "navigator", {
    value: {
        onLine: true,
        clipboard: {
            writeText: vitest_1.vi.fn().mockResolvedValue(undefined),
        },
    },
    writable: true,
});
Object.defineProperty(window, "performance", {
    value: {
        now: vitest_1.vi.fn(function () { return Date.now(); }),
        memory: {
            usedJSHeapSize: 1000000,
            totalJSHeapSize: 2000000,
            jsHeapSizeLimit: 4000000,
        },
    },
    writable: true,
});
// Mock fetch for tests
global.fetch = vitest_1.vi.fn();
// Mock console methods to reduce noise in tests
console.warn = vitest_1.vi.fn();
console.error = vitest_1.vi.fn();
// Setup DOM environment
document.body.innerHTML = '<div id="app"></div>';
// Mock ResizeObserver
global.ResizeObserver = vitest_1.vi.fn().mockImplementation(function () { return ({
    observe: vitest_1.vi.fn(),
    unobserve: vitest_1.vi.fn(),
    disconnect: vitest_1.vi.fn(),
}); });
// Mock IntersectionObserver
global.IntersectionObserver = vitest_1.vi.fn().mockImplementation(function () { return ({
    observe: vitest_1.vi.fn(),
    unobserve: vitest_1.vi.fn(),
    disconnect: vitest_1.vi.fn(),
}); });
// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vitest_1.vi.fn().mockImplementation(function (query) { return ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vitest_1.vi.fn(), // deprecated
        removeListener: vitest_1.vi.fn(), // deprecated
        addEventListener: vitest_1.vi.fn(),
        removeEventListener: vitest_1.vi.fn(),
        dispatchEvent: vitest_1.vi.fn(),
    }); }),
});
// Mock window events
window.addEventListener = vitest_1.vi.fn();
window.removeEventListener = vitest_1.vi.fn();
