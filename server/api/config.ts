/**
 * Configuration Management API
 * Provides endpoints for managing feature flags and system configuration
 */
import { OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";
import {
  featureFlagManager,
  FeatureFlagConfig,
  updateFeatureFlags,
  getFeatureFlagMetrics,
  logFeatureUsage,
} from "../config/featureFlags.js";

const app = new OpenAPIHono();

// Schema for feature flag updates
const FeatureFlagUpdateSchema = z.object({
  unifiedGeneration: z
    .object({
      enabled: z.boolean().optional(),
      rolloutPercentage: z.number().min(0).max(100).optional(),
      enabledForUsers: z.array(z.string()).optional(),
      disabledForUsers: z.array(z.string()).optional(),
      environments: z.array(z.string()).optional(),
      abTestGroups: z
        .object({
          unified: z.number().min(0).max(100).optional(),
          traditional: z.number().min(0).max(100).optional(),
          control: z.number().min(0).max(100).optional(),
        })
        .optional(),
      maxRetries: z.number().min(1).max(10).optional(),
      timeout: z.number().min(5000).max(60000).optional(),
      fallbackChain: z
        .array(z.enum(["layered", "rule-based", "basic"]))
        .optional(),
    })
    .optional(),
  layeredGeneration: z
    .object({
      enabled: z.boolean().optional(),
      fallbackEnabled: z.boolean().optional(),
      maxRetries: z.number().min(1).max(10).optional(),
      enableLayoutLanguage: z.boolean().optional(),
      enableSemanticRegions: z.boolean().optional(),
    })
    .optional(),
  debugVisualization: z
    .object({
      enabled: z.boolean().optional(),
      enabledInProduction: z.boolean().optional(),
      maxOverlayElements: z.number().min(10).max(1000).optional(),
      enableRegionBoundaries: z.boolean().optional(),
      enableAnchorPoints: z.boolean().optional(),
      enableLayerInspection: z.boolean().optional(),
    })
    .optional(),
  performanceOptimizations: z
    .object({
      caching: z.boolean().optional(),
      coordinateOptimization: z.boolean().optional(),
      repetitionOptimization: z.boolean().optional(),
      layoutCaching: z.boolean().optional(),
      layerCaching: z.boolean().optional(),
      batchProcessing: z.boolean().optional(),
    })
    .optional(),
  monitoring: z
    .object({
      enabled: z.boolean().optional(),
      logLevel: z.enum(["error", "warn", "info", "debug"]).optional(),
      metricsCollection: z.boolean().optional(),
      performanceTracking: z.boolean().optional(),
      abTestTracking: z.boolean().optional(),
      errorReporting: z.boolean().optional(),
      usageAnalytics: z.boolean().optional(),
    })
    .optional(),
  qualityControl: z
    .object({
      enableValidation: z.boolean().optional(),
      enableRepair: z.boolean().optional(),
      coordinateBoundsCheck: z.boolean().optional(),
      pathCommandValidation: z.boolean().optional(),
      layoutQualityScoring: z.boolean().optional(),
      minimumQualityThreshold: z.number().min(0).max(100).optional(),
    })
    .optional(),
  apiConfiguration: z
    .object({
      enableRateLimiting: z.boolean().optional(),
      maxRequestsPerMinute: z.number().min(1).max(1000).optional(),
      enableCaching: z.boolean().optional(),
      cacheMaxSize: z.number().min(100).max(10000).optional(),
      cacheTTLMinutes: z.number().min(1).max(1440).optional(),
      enableCompression: z.boolean().optional(),
    })
    .optional(),
});

const FeatureFlagResponseSchema = z.object({
  environment: z.string(),
  config: z.any(), // Full config object
  usage: z.object({
    unifiedGenerationEnabled: z.boolean(),
    layeredGenerationEnabled: z.boolean(),
    debugVisualizationEnabled: z.boolean(),
  }),
  metrics: z
    .object({
      totalRequests: z.number().optional(),
      abTestDistribution: z
        .object({
          unified: z.number(),
          traditional: z.number(),
          control: z.number(),
        })
        .optional(),
      averageGenerationTime: z.number().optional(),
      fallbackUsageRate: z.number().optional(),
    })
    .optional(),
});

const ABTestAssignmentSchema = z.object({
  userId: z.string().optional(),
  group: z.enum(["unified", "traditional", "control"]),
  metadata: z.any().optional(),
});

// Get current feature flag configuration
const getConfigRoute = {
  method: "get" as const,
  path: "/config/feature-flags",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: FeatureFlagResponseSchema,
        },
      },
      description: "Current feature flag configuration",
    },
    403: {
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
      description: "Access denied",
    },
  },
  tags: ["Configuration"],
  summary: "Get feature flag configuration",
  description: "Retrieve current feature flag configuration and usage metrics",
};

app.openapi(getConfigRoute, async (c) => {
  try {
    // Check if user has admin access (implement your auth logic here)
    const isAdmin = await checkAdminAccess(c);
    if (!isAdmin) {
      return c.json({ error: "Access denied" }, 403);
    }

    const metrics = getFeatureFlagMetrics();

    // Add runtime metrics if available
    const runtimeMetrics = await getRuntimeMetrics();

    return c.json(
      {
        ...metrics,
        metrics: runtimeMetrics,
      },
      200
    );
  } catch (error) {
    console.error("Failed to get feature flag configuration:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Update feature flag configuration
const updateConfigRoute = {
  method: "patch" as const,
  path: "/config/feature-flags",
  request: {
    body: {
      content: {
        "application/json": {
          schema: FeatureFlagUpdateSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: FeatureFlagResponseSchema,
        },
      },
      description: "Configuration updated successfully",
    },
    400: {
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
            details: z.array(z.string()),
          }),
        },
      },
      description: "Invalid configuration",
    },
    403: {
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
      description: "Access denied",
    },
  },
  tags: ["Configuration"],
  summary: "Update feature flag configuration",
  description: "Update feature flag configuration with new values",
};

app.openapi(updateConfigRoute, async (c) => {
  try {
    // Check if user has admin access
    const isAdmin = await checkAdminAccess(c);
    if (!isAdmin) {
      return c.json({ error: "Access denied" }, 403);
    }

    const updates = c.req.valid("json");

    // Validate A/B test group percentages sum to 100
    if (updates.unifiedGeneration?.abTestGroups) {
      const {
        unified = 0,
        traditional = 0,
        control = 0,
      } = updates.unifiedGeneration.abTestGroups;
      if (unified + traditional + control !== 100) {
        return c.json(
          {
            error: "Invalid configuration",
            details: ["A/B test group percentages must sum to 100"],
          },
          400
        );
      }
    }

    // Apply updates
    updateFeatureFlags(updates as Partial<FeatureFlagConfig>);

    // Log the configuration change
    logFeatureUsage("config_update", true, undefined, {
      updates,
      updatedBy: "admin", // You can get this from auth context
    });

    // Return updated configuration
    const metrics = getFeatureFlagMetrics();
    const runtimeMetrics = await getRuntimeMetrics();

    return c.json(
      {
        ...metrics,
        metrics: runtimeMetrics,
      },
      200
    );
  } catch (error) {
    console.error("Failed to update feature flag configuration:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get A/B test assignment for a user
const getABTestRoute = {
  method: "post" as const,
  path: "/config/ab-test-assignment",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            userId: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ABTestAssignmentSchema,
        },
      },
      description: "A/B test group assignment",
    },
  },
  tags: ["Configuration"],
  summary: "Get A/B test assignment",
  description: "Get A/B test group assignment for a user",
};

app.openapi(getABTestRoute, async (c) => {
  try {
    const { userId } = c.req.valid("json");
    const group = featureFlagManager.getABTestGroup(userId);

    // Log the assignment
    featureFlagManager.logABTestAssignment(userId, group, {
      requestedAt: new Date().toISOString(),
    });

    return c.json(
      {
        userId,
        group,
        metadata: {
          environment: featureFlagManager.getEnvironment(),
          assignedAt: new Date().toISOString(),
        },
      },
      200
    );
  } catch (error) {
    console.error("Failed to get A/B test assignment:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Health check endpoint for configuration service
const healthCheckRoute = {
  method: "get" as const,
  path: "/config/health",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            status: z.string(),
            environment: z.string(),
            timestamp: z.string(),
            features: z.object({
              unifiedGeneration: z.boolean(),
              layeredGeneration: z.boolean(),
              debugVisualization: z.boolean(),
            }),
          }),
        },
      },
      description: "Configuration service health status",
    },
  },
  tags: ["Configuration"],
  summary: "Configuration service health check",
  description: "Check the health status of the configuration service",
};

app.openapi(healthCheckRoute, async (c) => {
  return c.json(
    {
      status: "healthy",
      environment: featureFlagManager.getEnvironment(),
      timestamp: new Date().toISOString(),
      features: {
        unifiedGeneration: featureFlagManager.isUnifiedGenerationEnabled(),
        layeredGeneration: featureFlagManager.isLayeredGenerationEnabled(),
        debugVisualization: featureFlagManager.isDebugVisualizationEnabled(),
      },
    },
    200
  );
});

// Helper functions
async function checkAdminAccess(c: any): Promise<boolean> {
  // Implement your authentication/authorization logic here
  // For now, check for admin API key or JWT token
  const authHeader = c.req.header("Authorization");
  const adminKey = process.env.ADMIN_API_KEY;

  if (!adminKey) {
    console.warn(
      "ADMIN_API_KEY not configured - allowing all access in development"
    );
    return process.env.NODE_ENV === "development";
  }

  return authHeader === `Bearer ${adminKey}`;
}

async function getRuntimeMetrics(): Promise<any> {
  // Implement runtime metrics collection
  // This could include database queries, cache hit rates, etc.
  return {
    totalRequests: 0, // Placeholder - implement actual metrics
    abTestDistribution: {
      unified: 0,
      traditional: 0,
      control: 0,
    },
    averageGenerationTime: 0,
    fallbackUsageRate: 0,
  };
}

export default app;
