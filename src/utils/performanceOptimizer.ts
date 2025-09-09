/**
 * Frontend performance optimization utilities
 */

// Debounce function with immediate option
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };

    const callNow = immediate && !timeout;

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) func(...args);
  };
}

// Throttle function for high-frequency events
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Intersection Observer for lazy loading
export class LazyLoader {
  private observer: IntersectionObserver;
  private callbacks = new Map<Element, () => void>();

  constructor(options: IntersectionObserverInit = {}) {
    const defaultOptions: IntersectionObserverInit = {
      root: null,
      rootMargin: "50px",
      threshold: 0.1,
      ...options,
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const callback = this.callbacks.get(entry.target);
          if (callback) {
            callback();
            this.unobserve(entry.target);
          }
        }
      });
    }, defaultOptions);
  }

  observe(element: Element, callback: () => void): void {
    this.callbacks.set(element, callback);
    this.observer.observe(element);
  }

  unobserve(element: Element): void {
    this.callbacks.delete(element);
    this.observer.unobserve(element);
  }

  disconnect(): void {
    this.observer.disconnect();
    this.callbacks.clear();
  }
}

// Memory-efficient object pool for reusing DOM elements
export class ObjectPool<T> {
  private pool: T[] = [];
  private createFn: () => T;
  private resetFn?: (item: T) => void;
  private maxSize: number;

  constructor(createFn: () => T, resetFn?: (item: T) => void, maxSize = 100) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.maxSize = maxSize;
  }

  acquire(): T {
    if (this.pool.length > 0) {
      const item = this.pool.pop()!;
      if (this.resetFn) {
        this.resetFn(item);
      }
      return item;
    }
    return this.createFn();
  }

  release(item: T): void {
    if (this.pool.length < this.maxSize) {
      this.pool.push(item);
    }
  }

  clear(): void {
    this.pool = [];
  }

  get size(): number {
    return this.pool.length;
  }
}

// Performance monitoring for frontend
export class FrontendPerformanceMonitor {
  private metrics = {
    renderTimes: [] as number[],
    memoryUsage: [] as number[],
    componentMounts: 0,
    componentUnmounts: 0,
    apiCalls: 0,
    cacheHits: 0,
    cacheMisses: 0,
  };

  private observer?: PerformanceObserver;

  constructor() {
    this.setupPerformanceObserver();
    this.startMemoryMonitoring();
  }

  private setupPerformanceObserver(): void {
    if ("PerformanceObserver" in window) {
      this.observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === "measure") {
            this.metrics.renderTimes.push(entry.duration);

            // Keep only last 100 measurements
            if (this.metrics.renderTimes.length > 100) {
              this.metrics.renderTimes = this.metrics.renderTimes.slice(-100);
            }
          }
        });
      });

      this.observer.observe({ entryTypes: ["measure", "navigation"] });
    }
  }

  private startMemoryMonitoring(): void {
    if ("memory" in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.metrics.memoryUsage.push(memory.usedJSHeapSize);

        // Keep only last 100 measurements
        if (this.metrics.memoryUsage.length > 100) {
          this.metrics.memoryUsage = this.metrics.memoryUsage.slice(-100);
        }
      }, 30000); // Every 30 seconds
    }
  }

  measureRender<T>(name: string, fn: () => T): T {
    performance.mark(`${name}-start`);
    const result = fn();
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    return result;
  }

  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    performance.mark(`${name}-start`);
    const result = await fn();
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    return result;
  }

  recordComponentMount(): void {
    this.metrics.componentMounts++;
  }

  recordComponentUnmount(): void {
    this.metrics.componentUnmounts++;
  }

  recordApiCall(): void {
    this.metrics.apiCalls++;
  }

  recordCacheHit(): void {
    this.metrics.cacheHits++;
  }

  recordCacheMiss(): void {
    this.metrics.cacheMisses++;
  }

  getMetrics() {
    const avgRenderTime =
      this.metrics.renderTimes.length > 0
        ? this.metrics.renderTimes.reduce((a, b) => a + b, 0) /
          this.metrics.renderTimes.length
        : 0;

    const currentMemory =
      this.metrics.memoryUsage.length > 0
        ? this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1]
        : 0;

    const cacheHitRate =
      this.metrics.cacheHits + this.metrics.cacheMisses > 0
        ? this.metrics.cacheHits /
          (this.metrics.cacheHits + this.metrics.cacheMisses)
        : 0;

    return {
      averageRenderTime: avgRenderTime,
      currentMemoryUsage: currentMemory,
      componentMounts: this.metrics.componentMounts,
      componentUnmounts: this.metrics.componentUnmounts,
      apiCalls: this.metrics.apiCalls,
      cacheHitRate,
      renderTimes: [...this.metrics.renderTimes],
      memoryUsage: [...this.metrics.memoryUsage],
    };
  }

  reset(): void {
    this.metrics = {
      renderTimes: [],
      memoryUsage: [],
      componentMounts: 0,
      componentUnmounts: 0,
      apiCalls: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };
  }

  disconnect(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

// Image lazy loading utility
export function createImageLazyLoader(): LazyLoader {
  return new LazyLoader({
    rootMargin: "100px",
    threshold: 0.01,
  });
}

// Component lazy loading utility
export function createComponentLazyLoader(): LazyLoader {
  return new LazyLoader({
    rootMargin: "200px",
    threshold: 0.1,
  });
}

// Batch DOM updates for better performance
export class DOMBatcher {
  private updates: (() => void)[] = [];
  private scheduled = false;

  add(update: () => void): void {
    this.updates.push(update);
    this.schedule();
  }

  private schedule(): void {
    if (!this.scheduled) {
      this.scheduled = true;
      requestAnimationFrame(() => {
        this.flush();
      });
    }
  }

  private flush(): void {
    const updates = this.updates.splice(0);
    updates.forEach((update) => update());
    this.scheduled = false;
  }

  clear(): void {
    this.updates = [];
    this.scheduled = false;
  }
}

// Singleton instances
export const performanceMonitor = new FrontendPerformanceMonitor();
export const domBatcher = new DOMBatcher();

// Resource preloader
export class ResourcePreloader {
  private cache = new Map<string, Promise<any>>();

  async preloadImage(src: string): Promise<HTMLImageElement> {
    if (this.cache.has(src)) {
      return this.cache.get(src)!;
    }

    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

    this.cache.set(src, promise);
    return promise;
  }

  async preloadScript(src: string): Promise<void> {
    if (this.cache.has(src)) {
      return this.cache.get(src)!;
    }

    const promise = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.onload = () => resolve();
      script.onerror = reject;
      script.src = src;
      document.head.appendChild(script);
    });

    this.cache.set(src, promise);
    return promise;
  }

  async preloadCSS(href: string): Promise<void> {
    if (this.cache.has(href)) {
      return this.cache.get(href)!;
    }

    const promise = new Promise<void>((resolve, reject) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.onload = () => resolve();
      link.onerror = reject;
      link.href = href;
      document.head.appendChild(link);
    });

    this.cache.set(href, promise);
    return promise;
  }

  clear(): void {
    this.cache.clear();
  }
}

export const resourcePreloader = new ResourcePreloader();
