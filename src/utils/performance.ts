/**
 * Performance monitoring utilities
 */

export interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface PerformanceReport {
  metrics: PerformanceMetric[];
  summary: {
    totalOperations: number;
    averageDuration: number;
    slowestOperation: PerformanceMetric | null;
    fastestOperation: PerformanceMetric | null;
  };
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private activeTimers = new Map<string, number>();

  /**
   * Start timing an operation
   */
  start(name: string, metadata?: Record<string, any>): void {
    const startTime = performance.now();
    this.activeTimers.set(name, startTime);

    this.metrics.push({
      name,
      startTime,
      metadata,
    });
  }

  /**
   * End timing an operation
   */
  end(name: string): number | null {
    const endTime = performance.now();
    const startTime = this.activeTimers.get(name);

    if (!startTime) {
      console.warn(`Performance timer '${name}' was not started`);
      return null;
    }

    const duration = endTime - startTime;
    this.activeTimers.delete(name);

    // Update the metric
    const metric = this.metrics.find((m) => m.name === name && !m.endTime);
    if (metric) {
      metric.endTime = endTime;
      metric.duration = duration;
    }

    return duration;
  }

  /**
   * Time a function execution
   */
  async time<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    this.start(name, metadata);
    try {
      const result = await fn();
      this.end(name);
      return result;
    } catch (error) {
      this.end(name);
      throw error;
    }
  }

  /**
   * Time a synchronous function execution
   */
  timeSync<T>(name: string, fn: () => T, metadata?: Record<string, any>): T {
    this.start(name, metadata);
    try {
      const result = fn();
      this.end(name);
      return result;
    } catch (error) {
      this.end(name);
      throw error;
    }
  }

  /**
   * Get performance report
   */
  getReport(): PerformanceReport {
    const completedMetrics = this.metrics.filter(
      (m) => m.duration !== undefined
    );

    if (completedMetrics.length === 0) {
      return {
        metrics: [],
        summary: {
          totalOperations: 0,
          averageDuration: 0,
          slowestOperation: null,
          fastestOperation: null,
        },
      };
    }

    const durations = completedMetrics.map((m) => m.duration!);
    const averageDuration =
      durations.reduce((sum, d) => sum + d, 0) / durations.length;

    const slowestOperation = completedMetrics.reduce((slowest, current) =>
      current.duration! > slowest.duration! ? current : slowest
    );

    const fastestOperation = completedMetrics.reduce((fastest, current) =>
      current.duration! < fastest.duration! ? current : fastest
    );

    return {
      metrics: [...completedMetrics],
      summary: {
        totalOperations: completedMetrics.length,
        averageDuration: Math.round(averageDuration * 100) / 100,
        slowestOperation,
        fastestOperation,
      },
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.activeTimers.clear();
  }

  /**
   * Get metrics for a specific operation
   */
  getMetricsFor(name: string): PerformanceMetric[] {
    return this.metrics.filter((m) => m.name === name);
  }

  /**
   * Log performance report to console
   */
  logReport(): void {
    const report = this.getReport();

    console.group("🚀 Performance Report");
    console.log(`Total Operations: ${report.summary.totalOperations}`);
    console.log(`Average Duration: ${report.summary.averageDuration}ms`);

    if (report.summary.slowestOperation) {
      console.log(
        `Slowest: ${report.summary.slowestOperation.name} (${report.summary.slowestOperation.duration}ms)`
      );
    }

    if (report.summary.fastestOperation) {
      console.log(
        `Fastest: ${report.summary.fastestOperation.name} (${report.summary.fastestOperation.duration}ms)`
      );
    }

    console.table(
      report.metrics.map((m) => ({
        Operation: m.name,
        Duration: `${m.duration}ms`,
        Metadata: JSON.stringify(m.metadata || {}),
      }))
    );

    console.groupEnd();
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Decorator for timing method execution
 */
export function timed(name?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const timerName = name || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      return performanceMonitor.time(timerName, () =>
        originalMethod.apply(this, args)
      );
    };

    return descriptor;
  };
}

/**
 * Memory usage monitoring
 */

interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

export class MemoryMonitor {
  private snapshots: Array<{
    timestamp: number;
    usage: MemoryInfo;
    label?: string;
  }> = [];

  /**
   * Take a memory snapshot
   */
  snapshot(label?: string): MemoryInfo | null {
    const performanceMemory = (performance as any).memory;
    if (!performanceMemory) {
      console.warn("Memory monitoring not available in this environment");
      return null;
    }

    const usage: MemoryInfo = {
      usedJSHeapSize: performanceMemory.usedJSHeapSize,
      totalJSHeapSize: performanceMemory.totalJSHeapSize,
      jsHeapSizeLimit: performanceMemory.jsHeapSizeLimit,
    };

    this.snapshots.push({
      timestamp: Date.now(),
      usage,
      label,
    });

    return usage;
  }

  /**
   * Get memory usage difference between two snapshots
   */
  getDifference(startLabel: string, endLabel: string): number | null {
    const start = this.snapshots.find((s) => s.label === startLabel);
    const end = this.snapshots.find((s) => s.label === endLabel);

    if (!start || !end) {
      return null;
    }

    return end.usage.usedJSHeapSize - start.usage.usedJSHeapSize;
  }

  /**
   * Get all snapshots
   */
  getSnapshots() {
    return [...this.snapshots];
  }

  /**
   * Clear all snapshots
   */
  clear(): void {
    this.snapshots = [];
  }

  /**
   * Format bytes to human readable format
   */
  formatBytes(bytes: number): string {
    const sizes = ["Bytes", "KB", "MB", "GB"];
    if (bytes === 0) return "0 Bytes";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  }

  /**
   * Log memory report
   */
  logReport(): void {
    if (this.snapshots.length === 0) {
      console.log("No memory snapshots available");
      return;
    }

    console.group("💾 Memory Report");

    this.snapshots.forEach((snapshot, index) => {
      console.log(
        `${index + 1}. ${snapshot.label || "Unnamed"}: ${this.formatBytes(snapshot.usage.usedJSHeapSize)}`
      );
    });

    if (this.snapshots.length >= 2) {
      const first = this.snapshots[0];
      const last = this.snapshots[this.snapshots.length - 1];
      const difference = last.usage.usedJSHeapSize - first.usage.usedJSHeapSize;

      console.log(
        `Total Change: ${this.formatBytes(Math.abs(difference))} ${difference >= 0 ? "increase" : "decrease"}`
      );
    }

    console.groupEnd();
  }
}

// Global memory monitor instance
export const memoryMonitor = new MemoryMonitor();

/**
 * FPS monitoring for smooth animations
 */
export class FPSMonitor {
  private frames: number[] = [];
  private lastTime = 0;
  private isRunning = false;

  /**
   * Start FPS monitoring
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.lastTime = performance.now();
    this.frames = [];
    this.tick();
  }

  /**
   * Stop FPS monitoring
   */
  stop(): void {
    this.isRunning = false;
  }

  private tick = (): void => {
    if (!this.isRunning) return;

    const now = performance.now();
    const delta = now - this.lastTime;
    this.lastTime = now;

    const fps = 1000 / delta;
    this.frames.push(fps);

    // Keep only last 60 frames (1 second at 60fps)
    if (this.frames.length > 60) {
      this.frames.shift();
    }

    requestAnimationFrame(this.tick);
  };

  /**
   * Get current FPS
   */
  getCurrentFPS(): number {
    if (this.frames.length === 0) return 0;
    return this.frames[this.frames.length - 1];
  }

  /**
   * Get average FPS
   */
  getAverageFPS(): number {
    if (this.frames.length === 0) return 0;
    const sum = this.frames.reduce((a, b) => a + b, 0);
    return sum / this.frames.length;
  }

  /**
   * Get FPS statistics
   */
  getStats() {
    if (this.frames.length === 0) {
      return { current: 0, average: 0, min: 0, max: 0 };
    }

    const current = this.getCurrentFPS();
    const average = this.getAverageFPS();
    const min = Math.min(...this.frames);
    const max = Math.max(...this.frames);

    return { current, average, min, max };
  }
}

// Global FPS monitor instance
export const fpsMonitor = new FPSMonitor();
