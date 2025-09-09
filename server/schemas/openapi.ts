import { z } from "zod";
import { createRoute } from "@hono/zod-openapi";

// Request schemas
export const GenerationRequestSchema = z.object({
  prompt: z.string().min(1).max(500),
  size: z.object({
    width: z.number().int().min(16).max(2048),
    height: z.number().int().min(16).max(2048),
  }),
  palette: z.array(z.string().regex(/^#[0-9A-Fa-f]{6}$/)).optional(),
  seed: z.number().int().optional(),
  model: z.enum(["rule-based", "llm"]).optional().default("rule-based"),
  userId: z.string().optional(),
});

// Response schemas
export const LayerInfoSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(["shape", "group", "text", "path"]),
});

export const SVGMetadataSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
  viewBox: z.string(),
  backgroundColor: z.string(),
  palette: z.array(z.string()),
  description: z.string(),
  seed: z.number(),
});

export const GenerationResponseSchema = z.object({
  svg: z.string(),
  meta: SVGMetadataSchema,
  layers: z.array(LayerInfoSchema),
  warnings: z.array(z.string()),
  errors: z.array(z.string()),
  eventId: z.number().optional(),
});

export const ErrorResponseSchema = z.object({
  error: z.string(),
  details: z.array(z.string()).optional(),
});

// Route definitions
export const generateSVGRoute = createRoute({
  method: "post",
  path: "/api/generate",
  tags: ["SVG Generation"],
  summary: "Generate SVG from natural language prompt",
  description:
    "Creates an SVG image based on a natural language description using either rule-based or LLM generation methods.",
  request: {
    body: {
      content: {
        "application/json": {
          schema: GenerationRequestSchema,
        },
      },
      description: "SVG generation parameters",
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: GenerationResponseSchema,
        },
      },
      description: "Successfully generated SVG",
    },
    400: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Invalid request parameters",
    },
    500: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Internal server error",
    },
  },
});

export const healthCheckRoute = createRoute({
  method: "get",
  path: "/health",
  tags: ["Health"],
  summary: "Health check endpoint",
  description: "Returns the current status of the API server.",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            status: z.string(),
            timestamp: z.string(),
          }),
        },
      },
      description: "Server is healthy",
    },
  },
});
