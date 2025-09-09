import { vi } from "vitest";

// Mock global objects that might not be available in test environment
Object.defineProperty(window, "navigator", {
  value: {
    onLine: true,
    clipboard: {
      writeText: vi.fn().mockResolvedValue(undefined),
    },
  },
  writable: true,
});

Object.defineProperty(window, "performance", {
  value: {
    now: vi.fn(() => Date.now()),
    memory: {
      usedJSHeapSize: 1000000,
      totalJSHeapSize: 2000000,
      jsHeapSizeLimit: 4000000,
    },
  },
  writable: true,
});

// Mock fetch for tests
global.fetch = vi.fn();

// Mock console methods to reduce noise in tests
console.warn = vi.fn();
console.error = vi.fn();

// Setup DOM environment
document.body.innerHTML = '<div id="app"></div>';

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock window events
window.addEventListener = vi.fn();
window.removeEventListener = vi.fn();
