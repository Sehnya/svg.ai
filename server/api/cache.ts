import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { KnowledgeBaseManager } from "../services/KnowledgeBaseManager";
import { cacheManager } from "../utils/cache";
import { tokenOptimizer } from "../utils/tokenOptimizer";

const app = new Hono();
const kbManager = KnowledgeBaseManager.getInstance();

// Cache metrics endpoint
app.get("/metrics", async (c) => {
  try {
    const [cacheMetrics, tokenMetrics] = await Promise.all([
      kbManager.getCacheMetrics(),
      kbManager.getTokenMetrics(),
    ]);

    return c.json({
      success: true,
      data: {
        cache: cacheMetrics,
        tokens: tokenMetrics,
        recommendations: kbManager.getOptimizationRecommendations(),
      },
    });
  } catch (error) {
    console.error("Error getting cache metrics:", error);
    return c.json(
      {
        success: false,
        error: "Failed to get cache metrics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// Cache health check endpoint
app.get("/health", async (c) => {
  try {
    const healthCheck = await kbManager.performCacheHealthCheck();

    return c.json({
      success: true,
      data: healthCheck,
    });
  } catch (error) {
    console.error("Error performing cache health check:", error);
    return c.json(
      {
        success: false,
        error: "Failed to perform cache health check",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// Clear cache endpoint
app.delete("/clear", async (c) => {
  try {
    await kbManager.clearCache();

    return c.json({
      success: true,
      message: "Cache cleared successfully",
    });
  } catch (error) {
    console.error("Error clearing cache:", error);
    return c.json(
      {
        success: false,
        error: "Failed to clear cache",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// Cleanup expired cache entries
app.post("/cleanup", async (c) => {
  try {
    const result = await kbManager.cleanupCache();

    return c.json({
      success: true,
      message: `Cleaned up ${result.deletedCount} expired cache entries`,
      data: result,
    });
  } catch (error) {
    console.error("Error cleaning up cache:", error);
    return c.json(
      {
        success: false,
        error: "Failed to cleanup cache",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// Invalidate cache with optional pattern
const invalidateSchema = z.object({
  pattern: z.string().optional(),
});

app.post("/invalidate", zValidator("json", invalidateSchema), async (c) => {
  try {
    const { pattern } = c.req.valid("json");
    const result = await kbManager.invalidateCache(pattern);

    return c.json({
      success: true,
      message: `Invalidated ${result.deletedCount} cache entries`,
      data: result,
    });
  } catch (error) {
    console.error("Error invalidating cache:", error);
    return c.json(
      {
        success: false,
        error: "Failed to invalidate cache",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// Get cache entries for monitoring
const entriesSchema = z.object({
  limit: z.number().min(1).max(1000).default(100),
});

app.get("/entries", zValidator("query", entriesSchema), async (c) => {
  try {
    const { limit } = c.req.valid("query");
    const entries = await cacheManager.getEntries(limit);

    return c.json({
      success: true,
      data: {
        entries,
        count: entries.length,
      },
    });
  } catch (error) {
    console.error("Error getting cache entries:", error);
    return c.json(
      {
        success: false,
        error: "Failed to get cache entries",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// Optimize specific KB object
const optimizeObjectSchema = z.object({
  objectId: z.string(),
});

app.post(
  "/optimize/object",
  zValidator("json", optimizeObjectSchema),
  async (c) => {
    try {
      const { objectId } = c.req.valid("json");
      const result = await kbManager.optimizeObject(objectId);

      return c.json({
        success: true,
        message: `Optimization analysis complete for object ${objectId}`,
        data: result,
      });
    } catch (error) {
      console.error("Error optimizing object:", error);
      return c.json(
        {
          success: false,
          error: "Failed to optimize object",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        500
      );
    }
  }
);

// Batch optimize multiple KB objects
const batchOptimizeSchema = z.object({
  objectIds: z.array(z.string()).min(1).max(100),
});

app.post(
  "/optimize/batch",
  zValidator("json", batchOptimizeSchema),
  async (c) => {
    try {
      const { objectIds } = c.req.valid("json");
      const result = await kbManager.batchOptimizeObjects(objectIds);

      return c.json({
        success: true,
        message: `Batch optimization complete: ${result.optimized} objects optimized, ${result.totalSavings} tokens saved`,
        data: result,
      });
    } catch (error) {
      console.error("Error batch optimizing objects:", error);
      return c.json(
        {
          success: false,
          error: "Failed to batch optimize objects",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        500
      );
    }
  }
);

// Update cache configuration
const configSchema = z.object({
  enabled: z.boolean().optional(),
  ttlMinutes: z.number().min(1).max(1440).optional(), // 1 minute to 24 hours
  maxEntries: z.number().min(100).max(100000).optional(),
  cleanupIntervalMinutes: z.number().min(5).max(1440).optional(),
});

app.put("/config", zValidator("json", configSchema), async (c) => {
  try {
    const config = c.req.valid("json");
    cacheManager.updateConfig(config);

    return c.json({
      success: true,
      message: "Cache configuration updated successfully",
      data: cacheManager.getConfig(),
    });
  } catch (error) {
    console.error("Error updating cache config:", error);
    return c.json(
      {
        success: false,
        error: "Failed to update cache configuration",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// Get current cache configuration
app.get("/config", async (c) => {
  try {
    const config = cacheManager.getConfig();

    return c.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error("Error getting cache config:", error);
    return c.json(
      {
        success: false,
        error: "Failed to get cache configuration",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// Reset token metrics
app.post("/tokens/reset", async (c) => {
  try {
    tokenOptimizer.resetMetrics();

    return c.json({
      success: true,
      message: "Token metrics reset successfully",
    });
  } catch (error) {
    console.error("Error resetting token metrics:", error);
    return c.json(
      {
        success: false,
        error: "Failed to reset token metrics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

export default app;
