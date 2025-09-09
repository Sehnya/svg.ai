/**
 * Monitoring API endpoints for performance metrics and system health
 */
import { Hono } from "hono";
import { getPerformanceMonitor } from "../services/PerformanceMonitor.js";
import { getDatabasePool } from "../db/pool.js";
import { z } from "zod";

const app = new Hono();

// Validation schemas
const MetricsQuerySchema = z.object({
  hours: z.coerce.number().min(1).max(168).optional().default(1), // Max 1 week
  format: z.enum(["json", "prometheus"]).optional().default("json"),
});

const AlertThresholdSchema = z.object({
  metric: z.string(),
  threshold: z.number(),
  comparison: z.enum(["gt", "lt", "eq"]),
  enabled: z.boolean().optional().default(true),
});

// Get current performance metrics
app.get("/metrics", async (c) => {
  try {
    const query = MetricsQuerySchema.parse(c.req.query());
    const monitor = getPerformanceMonitor();

    if (query.format === "prometheus") {
      // Return Prometheus format
      const metrics = monitor.getMetrics();
      const prometheusMetrics = formatPrometheusMetrics(metrics);

      c.header("Content-Type", "text/plain");
      return c.text(prometheusMetrics);
    }

    // Return JSON format
    const metrics = monitor.getMetrics();
    const history = monitor.getMetricsHistory(query.hours);

    return c.json({
      current: metrics,
      history,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Error fetching metrics:", error);
    return c.json({ error: "Failed to fetch metrics" }, 500);
  }
});

// Get system health status
app.get("/health", async (c) => {
  try {
    const monitor = getPerformanceMonitor();
    const dbPool = getDatabasePool();

    // Check database health
    const dbHealth = await dbPool.healthCheck();

    // Get performance report
    const report = monitor.generateReport();

    // Check system resources
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    const health = {
      status:
        dbHealth.healthy && report.summary.systemHealth !== "critical"
          ? "healthy"
          : "unhealthy",
      timestamp: Date.now(),
      uptime: process.uptime(),
      database: {
        healthy: dbHealth.healthy,
        poolStatus: dbHealth.poolStatus,
      },
      performance: report.summary,
      system: {
        memory: {
          used: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
          total: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
          external: Math.round(memoryUsage.external / 1024 / 1024), // MB
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system,
        },
      },
      recommendations: report.recommendations,
    };

    const statusCode = health.status === "healthy" ? 200 : 503;
    return c.json(health, statusCode);
  } catch (error) {
    console.error("Error checking health:", error);
    return c.json(
      {
        status: "unhealthy",
        error: "Health check failed",
        timestamp: Date.now(),
      },
      503
    );
  }
});

// Get generation events and statistics
app.get("/generations", async (c) => {
  try {
    const query = MetricsQuerySchema.parse(c.req.query());
    const monitor = getPerformanceMonitor();

    const events = monitor.getGenerationEvents(query.hours);

    // Calculate statistics
    const stats = {
      total: events.length,
      successful: events.filter((e) => e.success).length,
      failed: events.filter((e) => !e.success).length,
      averageTime:
        events.length > 0
          ? events
              .filter((e) => e.endTime)
              .reduce((sum, e) => sum + (e.endTime! - e.startTime), 0) /
            events.length
          : 0,
      totalTokens: events.reduce((sum, e) => sum + (e.tokensUsed || 0), 0),
      totalCost: events.reduce((sum, e) => sum + (e.tokenCost || 0), 0),
      cacheHits: events.filter((e) => e.cacheHit).length,
      qualityFailures: events.filter((e) => e.qualityGatePassed === false)
        .length,
    };

    return c.json({
      statistics: stats,
      events: events.slice(0, 100), // Limit to last 100 events
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Error fetching generation data:", error);
    return c.json({ error: "Failed to fetch generation data" }, 500);
  }
});

// Get database performance metrics
app.get("/database", async (c) => {
  try {
    const dbPool = getDatabasePool();
    const metrics = dbPool.getMetrics();
    const health = await dbPool.healthCheck();

    return c.json({
      metrics,
      health: health.healthy,
      poolStatus: health.poolStatus,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Error fetching database metrics:", error);
    return c.json({ error: "Failed to fetch database metrics" }, 500);
  }
});

// Configure alert thresholds
app.post("/alerts/thresholds", async (c) => {
  try {
    const body = await c.req.json();
    const threshold = AlertThresholdSchema.parse(body);

    const monitor = getPerformanceMonitor();
    monitor.addAlertThreshold(threshold);

    return c.json({ success: true, threshold });
  } catch (error) {
    console.error("Error adding alert threshold:", error);
    return c.json({ error: "Failed to add alert threshold" }, 400);
  }
});

// Get alert thresholds
app.get("/alerts/thresholds", async (c) => {
  try {
    const monitor = getPerformanceMonitor();
    const thresholds = monitor.getAlertThresholds();

    return c.json({ thresholds });
  } catch (error) {
    console.error("Error fetching alert thresholds:", error);
    return c.json({ error: "Failed to fetch alert thresholds" }, 500);
  }
});

// Delete alert threshold
app.delete("/alerts/thresholds/:metric", async (c) => {
  try {
    const metric = c.req.param("metric");

    const monitor = getPerformanceMonitor();
    monitor.removeAlertThreshold(metric as any);

    return c.json({ success: true });
  } catch (error) {
    console.error("Error removing alert threshold:", error);
    return c.json({ error: "Failed to remove alert threshold" }, 500);
  }
});

// Get performance report
app.get("/report", async (c) => {
  try {
    const monitor = getPerformanceMonitor();
    const report = monitor.generateReport();

    return c.json({
      ...report,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Error generating report:", error);
    return c.json({ error: "Failed to generate report" }, 500);
  }
});

// Reset metrics (for testing/development)
app.post("/reset", async (c) => {
  try {
    const monitor = getPerformanceMonitor();
    monitor.reset();

    return c.json({ success: true, message: "Metrics reset" });
  } catch (error) {
    console.error("Error resetting metrics:", error);
    return c.json({ error: "Failed to reset metrics" }, 500);
  }
});

// Helper function to format metrics for Prometheus
function formatPrometheusMetrics(metrics: any): string {
  const lines: string[] = [];

  // Add help and type information
  lines.push("# HELP svg_generations_total Total number of SVG generations");
  lines.push("# TYPE svg_generations_total counter");
  lines.push(`svg_generations_total ${metrics.totalGenerations}`);

  lines.push(
    "# HELP svg_generations_successful_total Successful SVG generations"
  );
  lines.push("# TYPE svg_generations_successful_total counter");
  lines.push(
    `svg_generations_successful_total ${metrics.successfulGenerations}`
  );

  lines.push("# HELP svg_generations_failed_total Failed SVG generations");
  lines.push("# TYPE svg_generations_failed_total counter");
  lines.push(`svg_generations_failed_total ${metrics.failedGenerations}`);

  lines.push(
    "# HELP svg_generation_time_avg Average generation time in milliseconds"
  );
  lines.push("# TYPE svg_generation_time_avg gauge");
  lines.push(`svg_generation_time_avg ${metrics.averageGenerationTime}`);

  lines.push("# HELP svg_tokens_used_total Total tokens used");
  lines.push("# TYPE svg_tokens_used_total counter");
  lines.push(`svg_tokens_used_total ${metrics.totalTokensUsed}`);

  lines.push("# HELP svg_token_cost_total Total token cost");
  lines.push("# TYPE svg_token_cost_total counter");
  lines.push(`svg_token_cost_total ${metrics.totalTokenCost}`);

  lines.push("# HELP svg_cache_hit_rate Cache hit rate");
  lines.push("# TYPE svg_cache_hit_rate gauge");
  lines.push(`svg_cache_hit_rate ${metrics.cacheHitRate}`);

  lines.push("# HELP svg_quality_gate_failures_total Quality gate failures");
  lines.push("# TYPE svg_quality_gate_failures_total counter");
  lines.push(`svg_quality_gate_failures_total ${metrics.qualityGateFailures}`);

  lines.push("# HELP svg_repair_attempts_total Repair attempts");
  lines.push("# TYPE svg_repair_attempts_total counter");
  lines.push(`svg_repair_attempts_total ${metrics.repairAttempts}`);

  lines.push("# HELP svg_repair_success_rate Repair success rate");
  lines.push("# TYPE svg_repair_success_rate gauge");
  lines.push(`svg_repair_success_rate ${metrics.repairSuccessRate}`);

  lines.push("# HELP svg_active_users Active users");
  lines.push("# TYPE svg_active_users gauge");
  lines.push(`svg_active_users ${metrics.activeUsers}`);

  lines.push("# HELP svg_memory_heap_used Memory heap used in bytes");
  lines.push("# TYPE svg_memory_heap_used gauge");
  lines.push(`svg_memory_heap_used ${metrics.memoryUsage.heapUsed}`);

  lines.push("# HELP svg_uptime_seconds Uptime in seconds");
  lines.push("# TYPE svg_uptime_seconds counter");
  lines.push(`svg_uptime_seconds ${metrics.uptime / 1000}`);

  return lines.join("\n") + "\n";
}

export default app;
