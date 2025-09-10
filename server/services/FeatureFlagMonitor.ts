/**
 * Feature Flag Monitoring System
 * Tracks usage, performance, and rollout metrics for feature flags
 */

import { FeatureFlagManager } from "../config/featureFlags";

export interface FeatureFlagMetrics {
  feature: string;
  enabled: boolean;
  userId?: string;
  environment: string;
  timestamp: Date;
  generationMethod?: string;
  performanceMs?: number;
  success?: boolean;
  error?: string;
}

export interface RolloutMetrics {
  feature: string;
  environment: string;
  totalRequests: number;
  enabledRequests: number;
  rolloutPercentage: number;
  successRate: number;
  averagePerformance: number;
  errorRate: number;
  timeWindow: {
    start: Date;
    end: Date;
  };
}

export interface ABTestMetrics {
  testName: string;
  environment: string;
  groups: {
    unified: {
      requests: number;
      successRate: number;
      averagePerformance: number;
      errorRate: number;
    };
    traditional: {
      requests: number;
      successRate: number;
      averagePerformance: number;
      errorRate: number;
    };
  };
  timeWindow: {
    start: Date;
    end: Date;
  };
}

export class FeatureFlagMonitor {
  private metrics: FeatureFlagMetrics[] = [];
  private featureFlagManager: FeatureFlagManager;
  private maxMetricsHistory: number = 10000;

  constructor(featureFlagManager: FeatureFlagManager) {
    this.featureFlagManager = featureFlagManager;
  }

  /**
   * Record feature flag usage
   */
  recordUsage(
    feature: string,
    enabled: boolean,
    userId?: string,
    additionalData?: {
      generationMethod?: string;
      performanceMs?: number;
      success?: boolean;
      error?: string;
    }
  ): void {
    const metric: FeatureFlagMetrics = {
      feature,
      enabled,
      userId,
      environment: this.featureFlagManager.getEnvironment(),
      timestamp: new Date(),
      ...additionalData,
    };

    this.metrics.push(metric);

    // Maintain metrics history limit
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }

    // Log for monitoring systems
    this.logMetric(metric);
  }

  /**
   * Get rollout metrics for a feature
   */
  getRolloutMetrics(
    feature: string,
    timeWindowHours: number = 24
  ): RolloutMetrics {
    const now = new Date();
    const startTime = new Date(
      now.getTime() - timeWindowHours * 60 * 60 * 1000
    );

    const relevantMetrics = this.metrics.filter(
      (m) =>
        m.feature === feature && m.timestamp >= startTime && m.timestamp <= now
    );

    const totalRequests = relevantMetrics.length;
    const enabledRequests = relevantMetrics.filter((m) => m.enabled).length;
    const successfulRequests = relevantMetrics.filter(
      (m) => m.success !== false
    ).length;
    const errorRequests = relevantMetrics.filter((m) => m.error).length;

    const performanceTimes = relevantMetrics
      .filter((m) => m.performanceMs !== undefined)
      .map((m) => m.performanceMs!);

    return {
      feature,
      environment: this.featureFlagManager.getEnvironment(),
      totalRequests,
      enabledRequests,
      rolloutPercentage:
        totalRequests > 0 ? (enabledRequests / totalRequests) * 100 : 0,
      successRate:
        totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0,
      averagePerformance:
        performanceTimes.length > 0
          ? performanceTimes.reduce((a, b) => a + b, 0) /
            performanceTimes.length
          : 0,
      errorRate: totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0,
      timeWindow: {
        start: startTime,
        end: now,
      },
    };
  }

  /**
   * Get A/B test metrics
   */
  getABTestMetrics(
    testName: string = "unified_generation",
    timeWindowHours: number = 24
  ): ABTestMetrics {
    const now = new Date();
    const startTime = new Date(
      now.getTime() - timeWindowHours * 60 * 60 * 1000
    );

    const relevantMetrics = this.metrics.filter(
      (m) =>
        m.timestamp >= startTime && m.timestamp <= now && m.generationMethod
    );

    const unifiedMetrics = relevantMetrics.filter((m) =>
      m.generationMethod?.includes("unified")
    );
    const traditionalMetrics = relevantMetrics.filter(
      (m) => !m.generationMethod?.includes("unified")
    );

    const calculateGroupMetrics = (metrics: FeatureFlagMetrics[]) => {
      const requests = metrics.length;
      const successful = metrics.filter((m) => m.success !== false).length;
      const errors = metrics.filter((m) => m.error).length;
      const performanceTimes = metrics
        .filter((m) => m.performanceMs !== undefined)
        .map((m) => m.performanceMs!);

      return {
        requests,
        successRate: requests > 0 ? (successful / requests) * 100 : 0,
        averagePerformance:
          performanceTimes.length > 0
            ? performanceTimes.reduce((a, b) => a + b, 0) /
              performanceTimes.length
            : 0,
        errorRate: requests > 0 ? (errors / requests) * 100 : 0,
      };
    };

    return {
      testName,
      environment: this.featureFlagManager.getEnvironment(),
      groups: {
        unified: calculateGroupMetrics(unifiedMetrics),
        traditional: calculateGroupMetrics(traditionalMetrics),
      },
      timeWindow: {
        start: startTime,
        end: now,
      },
    };
  }

  /**
   * Get feature flag health status
   */
  getHealthStatus(): {
    status: "healthy" | "warning" | "critical";
    issues: string[];
    metrics: {
      totalRequests: number;
      errorRate: number;
      averagePerformance: number;
    };
  } {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const recentMetrics = this.metrics.filter((m) => m.timestamp >= oneHourAgo);

    const totalRequests = recentMetrics.length;
    const errors = recentMetrics.filter((m) => m.error).length;
    const errorRate = totalRequests > 0 ? (errors / totalRequests) * 100 : 0;

    const performanceTimes = recentMetrics
      .filter((m) => m.performanceMs !== undefined)
      .map((m) => m.performanceMs!);
    const averagePerformance =
      performanceTimes.length > 0
        ? performanceTimes.reduce((a, b) => a + b, 0) / performanceTimes.length
        : 0;

    const issues: string[] = [];
    let status: "healthy" | "warning" | "critical" = "healthy";

    // Check error rate
    if (errorRate > 10) {
      issues.push(`High error rate: ${errorRate.toFixed(1)}%`);
      status = "critical";
    } else if (errorRate > 5) {
      issues.push(`Elevated error rate: ${errorRate.toFixed(1)}%`);
      status = status === "healthy" ? "warning" : status;
    }

    // Check performance
    if (averagePerformance > 10000) {
      issues.push(
        `Slow performance: ${averagePerformance.toFixed(0)}ms average`
      );
      status = "critical";
    } else if (averagePerformance > 5000) {
      issues.push(
        `Degraded performance: ${averagePerformance.toFixed(0)}ms average`
      );
      status = status === "healthy" ? "warning" : status;
    }

    // Check request volume
    if (totalRequests === 0) {
      issues.push("No requests in the last hour");
      status = status === "healthy" ? "warning" : status;
    }

    return {
      status,
      issues,
      metrics: {
        totalRequests,
        errorRate,
        averagePerformance,
      },
    };
  }

  /**
   * Export metrics for external monitoring systems
   */
  exportMetrics(format: "json" | "prometheus" = "json"): string {
    if (format === "prometheus") {
      return this.exportPrometheusMetrics();
    }

    const rolloutMetrics = this.getRolloutMetrics("unifiedGeneration");
    const abTestMetrics = this.getABTestMetrics();
    const healthStatus = this.getHealthStatus();

    return JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        environment: this.featureFlagManager.getEnvironment(),
        rollout: rolloutMetrics,
        abTest: abTestMetrics,
        health: healthStatus,
        featureFlags: this.featureFlagManager.getMetrics(),
      },
      null,
      2
    );
  }

  /**
   * Export metrics in Prometheus format
   */
  private exportPrometheusMetrics(): string {
    const rolloutMetrics = this.getRolloutMetrics("unifiedGeneration");
    const abTestMetrics = this.getABTestMetrics();
    const healthStatus = this.getHealthStatus();

    const lines: string[] = [];

    // Rollout metrics
    lines.push(
      `# HELP feature_flag_rollout_percentage Percentage of requests with feature enabled`
    );
    lines.push(`# TYPE feature_flag_rollout_percentage gauge`);
    lines.push(
      `feature_flag_rollout_percentage{feature="${rolloutMetrics.feature}",environment="${rolloutMetrics.environment}"} ${rolloutMetrics.rolloutPercentage}`
    );

    lines.push(
      `# HELP feature_flag_success_rate Success rate for feature flag usage`
    );
    lines.push(`# TYPE feature_flag_success_rate gauge`);
    lines.push(
      `feature_flag_success_rate{feature="${rolloutMetrics.feature}",environment="${rolloutMetrics.environment}"} ${rolloutMetrics.successRate}`
    );

    lines.push(
      `# HELP feature_flag_error_rate Error rate for feature flag usage`
    );
    lines.push(`# TYPE feature_flag_error_rate gauge`);
    lines.push(
      `feature_flag_error_rate{feature="${rolloutMetrics.feature}",environment="${rolloutMetrics.environment}"} ${rolloutMetrics.errorRate}`
    );

    // A/B test metrics
    lines.push(
      `# HELP ab_test_requests_total Total requests per A/B test group`
    );
    lines.push(`# TYPE ab_test_requests_total counter`);
    lines.push(
      `ab_test_requests_total{test="${abTestMetrics.testName}",group="unified",environment="${abTestMetrics.environment}"} ${abTestMetrics.groups.unified.requests}`
    );
    lines.push(
      `ab_test_requests_total{test="${abTestMetrics.testName}",group="traditional",environment="${abTestMetrics.environment}"} ${abTestMetrics.groups.traditional.requests}`
    );

    // Health metrics
    lines.push(
      `# HELP feature_flag_health_status Health status of feature flag system (0=healthy, 1=warning, 2=critical)`
    );
    lines.push(`# TYPE feature_flag_health_status gauge`);
    const statusValue =
      healthStatus.status === "healthy"
        ? 0
        : healthStatus.status === "warning"
          ? 1
          : 2;
    lines.push(
      `feature_flag_health_status{environment="${this.featureFlagManager.getEnvironment()}"} ${statusValue}`
    );

    return lines.join("\n");
  }

  /**
   * Clear metrics history (for testing or memory management)
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Get raw metrics for analysis
   */
  getRawMetrics(): FeatureFlagMetrics[] {
    return [...this.metrics];
  }

  /**
   * Log metric to console or external system
   */
  private logMetric(metric: FeatureFlagMetrics): void {
    const config = this.featureFlagManager.getFeatureConfig("monitoring");

    if (!config.enabled) {
      return;
    }

    if (config.logLevel === "debug" || config.logLevel === "info") {
      console.log("[FeatureFlagMonitor]", {
        feature: metric.feature,
        enabled: metric.enabled,
        environment: metric.environment,
        performance: metric.performanceMs,
        success: metric.success,
        timestamp: metric.timestamp.toISOString(),
      });
    }

    // In a real system, you might send this to external monitoring
    // like DataDog, New Relic, or CloudWatch
  }
}

// Global monitor instance
export const featureFlagMonitor = new FeatureFlagMonitor(
  require("../config/featureFlags").featureFlagManager
);
