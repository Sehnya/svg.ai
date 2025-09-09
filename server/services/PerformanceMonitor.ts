/**
 * Performance monitoring service for generation success rates and system metrics
 */
import { EventEmitter } from "events";

interface PerformanceMetrics {
  // Generation metrics
  totalGenerations: number;
  successfulGenerations: number;
  failedGenerations: number;
  averageGenerationTime: number;

  // Token usage metrics
  totalTokensUsed: number;
  totalTokenCost: number;
  averageTokensPerGeneration: number;

  // Cache metrics
  cacheHits: number;
  cacheMisses: number;
  cacheHitRate: number;

  // Quality metrics
  qualityGateFailures: number;
  repairAttempts: number;
  repairSuccessRate: number;

  // System metrics
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
  uptime: number;

  // User metrics
  activeUsers: number;
  totalUsers: number;
  averageSessionDuration: number;
}

interface GenerationEvent {
  id: string;
  userId?: string;
  prompt: string;
  startTime: number;
  endTime?: number;
  success: boolean;
  tokensUsed?: number;
  tokenCost?: number;
  cacheHit?: boolean;
  qualityGatePassed?: boolean;
  repairAttempts?: number;
  error?: string;
}

interface AlertThreshold {
  metric: keyof PerformanceMetrics;
  threshold: number;
  comparison: "gt" | "lt" | "eq";
  enabled: boolean;
}

class PerformanceMonitor extends EventEmitter {
  private metrics: PerformanceMetrics;
  private generationEvents: Map<string, GenerationEvent> = new Map();
  private userSessions: Map<
    string,
    { startTime: number; lastActivity: number }
  > = new Map();
  private alertThresholds: AlertThreshold[] = [];
  private metricsHistory: Array<{
    timestamp: number;
    metrics: PerformanceMetrics;
  }> = [];
  private startTime: number;

  constructor() {
    super();
    this.startTime = Date.now();
    this.metrics = this.initializeMetrics();
    this.setupDefaultAlerts();
    this.startPeriodicCollection();
  }

  private initializeMetrics(): PerformanceMetrics {
    return {
      totalGenerations: 0,
      successfulGenerations: 0,
      failedGenerations: 0,
      averageGenerationTime: 0,
      totalTokensUsed: 0,
      totalTokenCost: 0,
      averageTokensPerGeneration: 0,
      cacheHits: 0,
      cacheMisses: 0,
      cacheHitRate: 0,
      qualityGateFailures: 0,
      repairAttempts: 0,
      repairSuccessRate: 0,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      uptime: 0,
      activeUsers: 0,
      totalUsers: 0,
      averageSessionDuration: 0,
    };
  }

  private setupDefaultAlerts() {
    this.alertThresholds = [
      {
        metric: "failedGenerations",
        threshold: 10,
        comparison: "gt",
        enabled: true,
      },
      {
        metric: "averageGenerationTime",
        threshold: 5000,
        comparison: "gt",
        enabled: true,
      },
      {
        metric: "cacheHitRate",
        threshold: 0.5,
        comparison: "lt",
        enabled: true,
      },
      {
        metric: "qualityGateFailures",
        threshold: 5,
        comparison: "gt",
        enabled: true,
      },
      {
        metric: "repairSuccessRate",
        threshold: 0.8,
        comparison: "lt",
        enabled: true,
      },
    ];
  }

  private startPeriodicCollection() {
    // Collect system metrics every 30 seconds
    setInterval(() => {
      this.collectSystemMetrics();
      this.checkAlerts();
      this.saveMetricsSnapshot();
    }, 30000);

    // Clean up old events every 5 minutes
    setInterval(() => {
      this.cleanupOldEvents();
    }, 300000);
  }

  private collectSystemMetrics() {
    this.metrics.memoryUsage = process.memoryUsage();
    this.metrics.cpuUsage = process.cpuUsage();
    this.metrics.uptime = Date.now() - this.startTime;

    // Update user metrics
    this.updateUserMetrics();

    // Calculate derived metrics
    this.calculateDerivedMetrics();
  }

  private updateUserMetrics() {
    const now = Date.now();
    const activeThreshold = 5 * 60 * 1000; // 5 minutes

    let activeCount = 0;
    let totalSessionDuration = 0;
    let sessionCount = 0;

    for (const [userId, session] of this.userSessions.entries()) {
      if (now - session.lastActivity < activeThreshold) {
        activeCount++;
      }

      totalSessionDuration += session.lastActivity - session.startTime;
      sessionCount++;
    }

    this.metrics.activeUsers = activeCount;
    this.metrics.totalUsers = this.userSessions.size;
    this.metrics.averageSessionDuration =
      sessionCount > 0 ? totalSessionDuration / sessionCount : 0;
  }

  private calculateDerivedMetrics() {
    // Cache hit rate
    const totalCacheRequests =
      this.metrics.cacheHits + this.metrics.cacheMisses;
    this.metrics.cacheHitRate =
      totalCacheRequests > 0 ? this.metrics.cacheHits / totalCacheRequests : 0;

    // Average tokens per generation
    this.metrics.averageTokensPerGeneration =
      this.metrics.totalGenerations > 0
        ? this.metrics.totalTokensUsed / this.metrics.totalGenerations
        : 0;

    // Repair success rate
    const totalRepairs = this.metrics.repairAttempts;
    const successfulRepairs = totalRepairs - this.metrics.qualityGateFailures;
    this.metrics.repairSuccessRate =
      totalRepairs > 0 ? successfulRepairs / totalRepairs : 1;
  }

  private checkAlerts() {
    for (const threshold of this.alertThresholds) {
      if (!threshold.enabled) continue;

      const currentValue = this.metrics[threshold.metric] as number;
      let shouldAlert = false;

      switch (threshold.comparison) {
        case "gt":
          shouldAlert = currentValue > threshold.threshold;
          break;
        case "lt":
          shouldAlert = currentValue < threshold.threshold;
          break;
        case "eq":
          shouldAlert = currentValue === threshold.threshold;
          break;
      }

      if (shouldAlert) {
        this.emit("alert", {
          metric: threshold.metric,
          currentValue,
          threshold: threshold.threshold,
          comparison: threshold.comparison,
          timestamp: Date.now(),
        });
      }
    }
  }

  private saveMetricsSnapshot() {
    this.metricsHistory.push({
      timestamp: Date.now(),
      metrics: { ...this.metrics },
    });

    // Keep only last 24 hours of data (assuming 30-second intervals)
    const maxEntries = 24 * 60 * 2; // 2880 entries
    if (this.metricsHistory.length > maxEntries) {
      this.metricsHistory = this.metricsHistory.slice(-maxEntries);
    }
  }

  private cleanupOldEvents() {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago

    for (const [id, event] of this.generationEvents.entries()) {
      if (event.startTime < cutoff) {
        this.generationEvents.delete(id);
      }
    }
  }

  // Public API methods

  startGeneration(
    id: string,
    userId: string | undefined,
    prompt: string
  ): void {
    const event: GenerationEvent = {
      id,
      userId,
      prompt,
      startTime: Date.now(),
      success: false,
    };

    this.generationEvents.set(id, event);
    this.metrics.totalGenerations++;

    // Track user session
    if (userId) {
      if (!this.userSessions.has(userId)) {
        this.userSessions.set(userId, {
          startTime: Date.now(),
          lastActivity: Date.now(),
        });
      } else {
        const session = this.userSessions.get(userId)!;
        session.lastActivity = Date.now();
      }
    }
  }

  completeGeneration(
    id: string,
    success: boolean,
    options: {
      tokensUsed?: number;
      tokenCost?: number;
      cacheHit?: boolean;
      qualityGatePassed?: boolean;
      repairAttempts?: number;
      error?: string;
    } = {}
  ): void {
    const event = this.generationEvents.get(id);
    if (!event) return;

    event.endTime = Date.now();
    event.success = success;
    event.tokensUsed = options.tokensUsed;
    event.tokenCost = options.tokenCost;
    event.cacheHit = options.cacheHit;
    event.qualityGatePassed = options.qualityGatePassed;
    event.repairAttempts = options.repairAttempts;
    event.error = options.error;

    // Update metrics
    if (success) {
      this.metrics.successfulGenerations++;
    } else {
      this.metrics.failedGenerations++;
    }

    if (options.tokensUsed) {
      this.metrics.totalTokensUsed += options.tokensUsed;
    }

    if (options.tokenCost) {
      this.metrics.totalTokenCost += options.tokenCost;
    }

    if (options.cacheHit !== undefined) {
      if (options.cacheHit) {
        this.metrics.cacheHits++;
      } else {
        this.metrics.cacheMisses++;
      }
    }

    if (options.qualityGatePassed === false) {
      this.metrics.qualityGateFailures++;
    }

    if (options.repairAttempts) {
      this.metrics.repairAttempts += options.repairAttempts;
    }

    // Update average generation time
    const duration = event.endTime - event.startTime;
    const totalTime =
      this.metrics.averageGenerationTime * (this.metrics.totalGenerations - 1) +
      duration;
    this.metrics.averageGenerationTime =
      totalTime / this.metrics.totalGenerations;
  }

  getMetrics(): PerformanceMetrics {
    this.collectSystemMetrics();
    return { ...this.metrics };
  }

  getMetricsHistory(
    hours: number = 1
  ): Array<{ timestamp: number; metrics: PerformanceMetrics }> {
    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    return this.metricsHistory.filter((entry) => entry.timestamp >= cutoff);
  }

  getGenerationEvents(hours: number = 1): GenerationEvent[] {
    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    return Array.from(this.generationEvents.values()).filter(
      (event) => event.startTime >= cutoff
    );
  }

  addAlertThreshold(threshold: AlertThreshold): void {
    this.alertThresholds.push(threshold);
  }

  removeAlertThreshold(metric: keyof PerformanceMetrics): void {
    this.alertThresholds = this.alertThresholds.filter(
      (t) => t.metric !== metric
    );
  }

  getAlertThresholds(): AlertThreshold[] {
    return [...this.alertThresholds];
  }

  generateReport(): {
    summary: {
      successRate: number;
      averageResponseTime: number;
      tokenEfficiency: number;
      systemHealth: "good" | "warning" | "critical";
    };
    recommendations: string[];
  } {
    const successRate =
      this.metrics.totalGenerations > 0
        ? this.metrics.successfulGenerations / this.metrics.totalGenerations
        : 1;

    const tokenEfficiency =
      this.metrics.totalTokenCost > 0
        ? this.metrics.successfulGenerations / this.metrics.totalTokenCost
        : 0;

    let systemHealth: "good" | "warning" | "critical" = "good";
    const recommendations: string[] = [];

    // Determine system health
    if (successRate < 0.8) {
      systemHealth = "critical";
      recommendations.push(
        "Success rate is below 80%. Investigate generation failures."
      );
    } else if (successRate < 0.9) {
      systemHealth = "warning";
      recommendations.push(
        "Success rate could be improved. Review error patterns."
      );
    }

    if (this.metrics.averageGenerationTime > 5000) {
      systemHealth = systemHealth === "good" ? "warning" : "critical";
      recommendations.push(
        "Average generation time is high. Consider optimization."
      );
    }

    if (this.metrics.cacheHitRate < 0.5) {
      recommendations.push("Cache hit rate is low. Review caching strategy.");
    }

    if (this.metrics.memoryUsage.heapUsed > 500 * 1024 * 1024) {
      recommendations.push(
        "High memory usage detected. Monitor for memory leaks."
      );
    }

    return {
      summary: {
        successRate,
        averageResponseTime: this.metrics.averageGenerationTime,
        tokenEfficiency,
        systemHealth,
      },
      recommendations,
    };
  }

  reset(): void {
    this.metrics = this.initializeMetrics();
    this.generationEvents.clear();
    this.metricsHistory = [];
    this.startTime = Date.now();
  }
}

// Singleton instance
let performanceMonitor: PerformanceMonitor | null = null;

export function getPerformanceMonitor(): PerformanceMonitor {
  if (!performanceMonitor) {
    performanceMonitor = new PerformanceMonitor();
  }
  return performanceMonitor;
}

export { PerformanceMonitor };
export type { PerformanceMetrics, GenerationEvent, AlertThreshold };
