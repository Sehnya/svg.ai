/**
 * Knowledge Base API endpoints
 */
import { OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";
import { KnowledgeBaseManager } from "../services/KnowledgeBaseManager.js";
import { PreferenceEngine } from "../services/PreferenceEngine.js";

const app = new OpenAPIHono();

// KB Object schemas
const KBObjectSchema = z.object({
  id: z.string().optional(),
  kind: z.enum(["style_pack", "motif", "glossary", "rule", "fewshot"]),
  title: z.string().min(1).max(200),
  body: z.any(),
  tags: z.array(z.string()).max(20).default([]),
  version: z
    .string()
    .regex(/^\d+\.\d+\.\d+$/)
    .optional(),
  status: z.enum(["active", "deprecated", "experimental"]).default("active"),
  parent_id: z.string().optional(),
});

const FeedbackSchema = z.object({
  event_id: z.number().int().positive(),
  user_id: z.string().optional(),
  signal: z.enum([
    "kept",
    "edited",
    "regenerated",
    "exported",
    "favorited",
    "reported",
  ]),
  notes: z.string().max(500).optional(),
});

// Initialize services
let knowledgeBase: KnowledgeBaseManager | null = null;
let preferenceEngine: PreferenceEngine | null = null;

export async function initializeKBAPI() {
  try {
    knowledgeBase = new KnowledgeBaseManager();
    preferenceEngine = PreferenceEngine.getInstance();
    console.log("✅ Knowledge Base API initialized");
  } catch (error) {
    console.warn("⚠️  Knowledge Base API initialization failed:", error);
  }
}

// CRUD operations for KB objects
const createObjectRoute = {
  method: "post" as const,
  path: "/objects",
  request: {
    body: {
      content: {
        "application/json": {
          schema: KBObjectSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: z.object({
            id: z.string(),
            message: z.string(),
          }),
        },
      },
      description: "Object created successfully",
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
      description: "Invalid request",
    },
  },
  tags: ["Knowledge Base"],
  summary: "Create KB object",
  description:
    "Create a new knowledge base object with validation and compatibility testing",
};

app.openapi(createObjectRoute, async (c) => {
  if (!knowledgeBase) {
    return c.json({ error: "Knowledge base not available", details: [] }, 503);
  }

  try {
    const objectData = c.req.valid("json");

    // Validate token budget (500 token limit)
    const tokenCount = estimateTokens(JSON.stringify(objectData.body));
    if (tokenCount > 500) {
      return c.json(
        {
          error: "Token budget exceeded",
          details: [`Object body contains ~${tokenCount} tokens, limit is 500`],
        },
        400
      );
    }

    // Create the object
    const id = await knowledgeBase.createObject(objectData);

    return c.json({ id, message: "Object created successfully" }, 201);
  } catch (error) {
    console.error("Failed to create KB object:", error);
    return c.json(
      {
        error: "Failed to create object",
        details: [error instanceof Error ? error.message : "Unknown error"],
      },
      400
    );
  }
});

// Get KB objects with filtering
const getObjectsRoute = {
  method: "get" as const,
  path: "/objects",
  request: {
    query: z.object({
      kind: z
        .enum(["style_pack", "motif", "glossary", "rule", "fewshot"])
        .optional(),
      status: z.enum(["active", "deprecated", "experimental"]).optional(),
      tags: z.string().optional(), // Comma-separated tags
      limit: z.string().regex(/^\d+$/).transform(Number).default("50"),
      offset: z.string().regex(/^\d+$/).transform(Number).default("0"),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            objects: z.array(z.any()),
            total: z.number(),
            limit: z.number(),
            offset: z.number(),
          }),
        },
      },
      description: "Objects retrieved successfully",
    },
  },
  tags: ["Knowledge Base"],
  summary: "Get KB objects",
  description: "Retrieve knowledge base objects with optional filtering",
};

app.openapi(getObjectsRoute, async (c) => {
  if (!knowledgeBase) {
    return c.json({ error: "Knowledge base not available" }, 503);
  }

  try {
    const query = c.req.valid("query");
    const filters: any = {};

    if (query.kind) filters.kind = query.kind;
    if (query.status) filters.status = query.status;
    if (query.tags) filters.tags = query.tags.split(",");

    const result = await knowledgeBase.getObjects(
      filters,
      query.limit,
      query.offset
    );

    return c.json(result, 200);
  } catch (error) {
    console.error("Failed to get KB objects:", error);
    return c.json(
      {
        error: "Failed to retrieve objects",
        details: [error instanceof Error ? error.message : "Unknown error"],
      },
      500
    );
  }
});

// Update KB object
const updateObjectRoute = {
  method: "put" as const,
  path: "/objects/{id}",
  request: {
    param: z.object({
      id: z.string(),
    }),
    body: {
      content: {
        "application/json": {
          schema: KBObjectSchema.partial(),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            message: z.string(),
          }),
        },
      },
      description: "Object updated successfully",
    },
  },
  tags: ["Knowledge Base"],
  summary: "Update KB object",
  description: "Update an existing knowledge base object",
};

app.openapi(updateObjectRoute, async (c) => {
  if (!knowledgeBase) {
    return c.json({ error: "Knowledge base not available" }, 503);
  }

  try {
    const { id } = c.req.valid("param");
    const updates = c.req.valid("json");

    // Validate token budget if body is being updated
    if (updates.body) {
      const tokenCount = estimateTokens(JSON.stringify(updates.body));
      if (tokenCount > 500) {
        return c.json(
          {
            error: "Token budget exceeded",
            details: [
              `Object body contains ~${tokenCount} tokens, limit is 500`,
            ],
          },
          400
        );
      }
    }

    await knowledgeBase.updateObject(id, updates);

    return c.json({ message: "Object updated successfully" }, 200);
  } catch (error) {
    console.error("Failed to update KB object:", error);
    return c.json(
      {
        error: "Failed to update object",
        details: [error instanceof Error ? error.message : "Unknown error"],
      },
      400
    );
  }
});

// Delete KB object
const deleteObjectRoute = {
  method: "delete" as const,
  path: "/objects/{id}",
  request: {
    param: z.object({
      id: z.string(),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            message: z.string(),
          }),
        },
      },
      description: "Object deleted successfully",
    },
  },
  tags: ["Knowledge Base"],
  summary: "Delete KB object",
  description: "Delete a knowledge base object",
};

app.openapi(deleteObjectRoute, async (c) => {
  if (!knowledgeBase) {
    return c.json({ error: "Knowledge base not available" }, 503);
  }

  try {
    const { id } = c.req.valid("param");
    await knowledgeBase.deleteObject(id);
    return c.json({ message: "Object deleted successfully" }, 200);
  } catch (error) {
    console.error("Failed to delete KB object:", error);
    return c.json(
      {
        error: "Failed to delete object",
        details: [error instanceof Error ? error.message : "Unknown error"],
      },
      400
    );
  }
});

// Record feedback
const recordFeedbackRoute = {
  method: "post" as const,
  path: "/feedback",
  request: {
    body: {
      content: {
        "application/json": {
          schema: FeedbackSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            message: z.string(),
          }),
        },
      },
      description: "Feedback recorded successfully",
    },
  },
  tags: ["Knowledge Base"],
  summary: "Record feedback",
  description: "Record user feedback for preference learning",
};

app.openapi(recordFeedbackRoute, async (c) => {
  if (!preferenceEngine) {
    return c.json({ error: "Preference engine not available" }, 503);
  }

  try {
    const feedback = c.req.valid("json");
    await preferenceEngine.recordFeedback(feedback);
    return c.json({ message: "Feedback recorded successfully" }, 200);
  } catch (error) {
    console.error("Failed to record feedback:", error);
    return c.json(
      {
        error: "Failed to record feedback",
        details: [error instanceof Error ? error.message : "Unknown error"],
      },
      400
    );
  }
});

// Get analytics
const getAnalyticsRoute = {
  method: "get" as const,
  path: "/analytics",
  request: {
    query: z.object({
      period: z.enum(["day", "week", "month"]).default("week"),
      user_id: z.string().optional(),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            usage: z.any(),
            quality: z.any(),
            preferences: z.any(),
          }),
        },
      },
      description: "Analytics retrieved successfully",
    },
  },
  tags: ["Knowledge Base"],
  summary: "Get analytics",
  description: "Get usage patterns and quality metrics",
};

app.openapi(getAnalyticsRoute, async (c) => {
  if (!knowledgeBase) {
    return c.json({ error: "Knowledge base not available" }, 503);
  }

  try {
    const query = c.req.valid("query");
    const analytics = await knowledgeBase.getAnalytics(
      query.period,
      query.user_id
    );
    return c.json(analytics, 200);
  } catch (error) {
    console.error("Failed to get analytics:", error);
    return c.json(
      {
        error: "Failed to retrieve analytics",
        details: [error instanceof Error ? error.message : "Unknown error"],
      },
      500
    );
  }
});

// Get user preferences
const getPreferencesRoute = {
  method: "get" as const,
  path: "/preferences/{userId}",
  request: {
    param: z.object({
      userId: z.string(),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            preferences: z.any(),
            updated_at: z.string(),
          }),
        },
      },
      description: "Preferences retrieved successfully",
    },
  },
  tags: ["Knowledge Base"],
  summary: "Get user preferences",
  description: "Get learned user preferences",
};

app.openapi(getPreferencesRoute, async (c) => {
  if (!preferenceEngine) {
    return c.json({ error: "Preference engine not available" }, 503);
  }

  try {
    const { userId } = c.req.valid("param");
    const preferences = await preferenceEngine.getUserPreferences(userId);
    return c.json(preferences, 200);
  } catch (error) {
    console.error("Failed to get preferences:", error);
    return c.json(
      {
        error: "Failed to retrieve preferences",
        details: [error instanceof Error ? error.message : "Unknown error"],
      },
      500
    );
  }
});

// Audit trail
const getAuditRoute = {
  method: "get" as const,
  path: "/audit",
  request: {
    query: z.object({
      object_id: z.string().optional(),
      action: z.string().optional(),
      limit: z.string().regex(/^\d+$/).transform(Number).default("50"),
      offset: z.string().regex(/^\d+$/).transform(Number).default("0"),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            entries: z.array(z.any()),
            total: z.number(),
          }),
        },
      },
      description: "Audit trail retrieved successfully",
    },
  },
  tags: ["Knowledge Base"],
  summary: "Get audit trail",
  description: "Get audit trail for KB changes",
};

app.openapi(getAuditRoute, async (c) => {
  if (!knowledgeBase) {
    return c.json({ error: "Knowledge base not available" }, 503);
  }

  try {
    const query = c.req.valid("query");
    const audit = await knowledgeBase.getAuditTrail(query);
    return c.json(audit, 200);
  } catch (error) {
    console.error("Failed to get audit trail:", error);
    return c.json(
      {
        error: "Failed to retrieve audit trail",
        details: [error instanceof Error ? error.message : "Unknown error"],
      },
      500
    );
  }
});

// Utility function to estimate token count
function estimateTokens(text: string): number {
  // Rough estimation: ~4 characters per token
  return Math.ceil(text.length / 4);
}

export default app;
