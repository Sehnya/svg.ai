import { Hono } from "hono";
import { z } from "zod";
import {
  PreferenceEngine,
  type FeedbackSignal,
} from "../services/PreferenceEngine";
import { KnowledgeBaseManager } from "../services/KnowledgeBaseManager";

const app = new Hono();

// Validation schemas
const FeedbackRequestSchema = z.object({
  eventId: z.number().int().positive(),
  signal: z.enum([
    "kept",
    "edited",
    "regenerated",
    "exported",
    "favorited",
    "reported",
  ]),
  userId: z.string().optional(),
  notes: z.string().max(500).optional(),
});

const ImplicitFeedbackSchema = z.object({
  eventId: z.number().int().positive(),
  signal: z.enum(["exported", "regenerated"]),
  userId: z.string().optional(),
});

const PreferencesQuerySchema = z.object({
  userId: z.string().optional(),
});

const LearningMetricsQuerySchema = z.object({
  userId: z.string().optional(),
});

// Initialize services
const preferenceEngine = PreferenceEngine.getInstance();
const kbManager = KnowledgeBaseManager.getInstance();

// Record explicit feedback
app.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const validated = FeedbackRequestSchema.parse(body);

    await preferenceEngine.recordFeedback(
      validated.eventId,
      validated.signal,
      validated.userId,
      validated.notes
    );

    return c.json({
      success: true,
      message: "Feedback recorded successfully",
    });
  } catch (error) {
    console.error("Error recording feedback:", error);

    if (error instanceof z.ZodError) {
      return c.json(
        {
          success: false,
          error: "Invalid request data",
          details: error.errors,
        },
        400
      );
    }

    return c.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to record feedback",
      },
      500
    );
  }
});

// Record implicit feedback (for automatic signals)
app.post("/implicit", async (c) => {
  try {
    const body = await c.req.json();
    const validated = ImplicitFeedbackSchema.parse(body);

    await preferenceEngine.recordImplicitFeedback(
      validated.eventId,
      validated.signal,
      validated.userId
    );

    return c.json({
      success: true,
      message: "Implicit feedback recorded successfully",
    });
  } catch (error) {
    console.error("Error recording implicit feedback:", error);

    if (error instanceof z.ZodError) {
      return c.json(
        {
          success: false,
          error: "Invalid request data",
          details: error.errors,
        },
        400
      );
    }

    return c.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to record implicit feedback",
      },
      500
    );
  }
});

// Get user preferences
app.get("/preferences", async (c) => {
  try {
    const query = c.req.query();
    const validated = PreferencesQuerySchema.parse(query);

    // This would require exposing preferences from KnowledgeBaseManager
    // For now, return a placeholder response
    return c.json({
      success: true,
      preferences: {
        tagWeights: {},
        kindWeights: {
          style_pack: 1.0,
          motif: 1.0,
          glossary: 0.8,
          rule: 0.6,
          fewshot: 0.9,
        },
        qualityThreshold: 0.3,
        diversityWeight: 0.3,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error getting preferences:", error);

    if (error instanceof z.ZodError) {
      return c.json(
        {
          success: false,
          error: "Invalid query parameters",
          details: error.errors,
        },
        400
      );
    }

    return c.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to get preferences",
      },
      500
    );
  }
});

// Update user preferences manually
app.put("/preferences", async (c) => {
  try {
    const body = await c.req.json();
    const userId = body.userId;

    if (!userId) {
      return c.json(
        {
          success: false,
          error: "User ID is required",
        },
        400
      );
    }

    // Trigger preference update
    await preferenceEngine.updateUserPreferences(userId);

    return c.json({
      success: true,
      message: "Preferences updated successfully",
    });
  } catch (error) {
    console.error("Error updating preferences:", error);

    return c.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update preferences",
      },
      500
    );
  }
});

// Get learning metrics
app.get("/metrics", async (c) => {
  try {
    const query = c.req.query();
    const validated = LearningMetricsQuerySchema.parse(query);

    const metrics = await preferenceEngine.getLearningMetrics(validated.userId);

    return c.json({
      success: true,
      metrics,
    });
  } catch (error) {
    console.error("Error getting learning metrics:", error);

    if (error instanceof z.ZodError) {
      return c.json(
        {
          success: false,
          error: "Invalid query parameters",
          details: error.errors,
        },
        400
      );
    }

    return c.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get learning metrics",
      },
      500
    );
  }
});

// Get generation event details
app.get("/events/:eventId", async (c) => {
  try {
    const eventId = parseInt(c.req.param("eventId"));

    if (isNaN(eventId)) {
      return c.json(
        {
          success: false,
          error: "Invalid event ID",
        },
        400
      );
    }

    const event = await preferenceEngine.getGenerationEvent(eventId);

    if (!event) {
      return c.json(
        {
          success: false,
          error: "Event not found",
        },
        404
      );
    }

    return c.json({
      success: true,
      event: {
        id: event.id,
        userId: event.userId,
        prompt: event.prompt,
        usedObjectIds: event.usedObjectIds,
        createdAt: event.createdAt,
        // Don't expose internal data like intent, plan, doc
      },
    });
  } catch (error) {
    console.error("Error getting generation event:", error);

    return c.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get generation event",
      },
      500
    );
  }
});

// Admin endpoints for system maintenance
app.post("/admin/deprecate-stale", async (c) => {
  try {
    // This should be protected with admin authentication in production
    const deprecatedCount = await preferenceEngine.deprecateStaleObjects();

    return c.json({
      success: true,
      message: `Deprecated ${deprecatedCount} stale objects`,
      deprecatedCount,
    });
  } catch (error) {
    console.error("Error deprecating stale objects:", error);

    return c.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to deprecate stale objects",
      },
      500
    );
  }
});

app.post("/admin/update-global-preferences", async (c) => {
  try {
    // This should be protected with admin authentication in production
    await preferenceEngine.updateGlobalPreferences();

    return c.json({
      success: true,
      message: "Global preferences updated successfully",
    });
  } catch (error) {
    console.error("Error updating global preferences:", error);

    return c.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update global preferences",
      },
      500
    );
  }
});

app.post("/admin/cleanup", async (c) => {
  try {
    const body = await c.req.json();
    const retentionDays = body.retentionDays || 90;

    const cleaned = await preferenceEngine.cleanupOldData(retentionDays);

    return c.json({
      success: true,
      message: `Cleaned up old data: ${cleaned.events} events, ${cleaned.feedback} feedback entries`,
      cleaned,
    });
  } catch (error) {
    console.error("Error cleaning up old data:", error);

    return c.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to cleanup old data",
      },
      500
    );
  }
});

export default app;
