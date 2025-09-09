import { z } from "zod";
import { createRoute } from "@hono/zod-openapi";

// Request schemas
export const GenerationRequestSchema = z
  .object({
    prompt: z.string().min(1).max(500).openapi({
      description: "Natural language prompt describing the desired SVG",
      example: "A blue circle with a red border",
    }),
    size: z
      .object({
        width: z.number().int().min(16).max(2048).openapi({
          description: "Width of the SVG in pixels",
          example: 400,
        }),
        height: z.number().int().min(16).max(2048).openapi({
          description: "Height of the SVG in pixels",
          example: 400,
        }),
      })
      .openapi({
        description: "Dimensions of the generated SVG",
      }),
    palette: z
      .array(z.string().regex(/^#[0-9A-Fa-f]{6}$/))
      .optional()
      .openapi({
        description: "Array of hex color codes to use in the generation",
        example: ["#3B82F6", "#1E40AF", "#1D4ED8"],
      }),
    seed: z.number().int().optional().openapi({
      description: "Seed for deterministic generation",
      example: 12345,
    }),
    model: z
      .enum(["rule-based", "llm"])
      .optional()
      .default("rule-based")
      .openapi({
        description: "Generation method to use",
        example: "rule-based",
      }),
    userId: z.string().optional().openapi({
      description: "User ID for feedback tracking",
      example: "user-123",
    }),
  })
  .openapi({
    description: "Request payload for SVG generation",
  });

// Response schemas
export const LayerInfoSchema = z
  .object({
    id: z.string().openapi({
      description: "Unique identifier for the layer",
      example: "main-circle",
    }),
    label: z.string().openapi({
      description: "Human-readable label for the layer",
      example: "Main Circle",
    }),
    type: z.enum(["shape", "group", "text", "path"]).openapi({
      description: "Type of the SVG element",
      example: "shape",
    }),
  })
  .openapi({
    description: "Information about an SVG layer/element",
  });

export const SVGMetadataSchema = z
  .object({
    width: z.number().positive().openapi({
      description: "Width of the SVG",
      example: 400,
    }),
    height: z.number().positive().openapi({
      description: "Height of the SVG",
      example: 400,
    }),
    viewBox: z.string().openapi({
      description: "SVG viewBox attribute",
      example: "0 0 400 400",
    }),
    backgroundColor: z.string().openapi({
      description: "Background color of the SVG",
      example: "transparent",
    }),
    palette: z.array(z.string()).openapi({
      description: "Colors used in the SVG",
      example: ["#3B82F6", "#1E40AF"],
    }),
    description: z.string().openapi({
      description: "Description of the generated SVG",
      example: 'Generated SVG based on prompt: "A blue circle"',
    }),
    seed: z.number().openapi({
      description: "Seed used for generation",
      example: 12345,
    }),
  })
  .openapi({
    description: "Metadata about the generated SVG",
  });

export const GenerationResponseSchema = z
  .object({
    svg: z.string().openapi({
      description: "The generated SVG markup",
      example:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">...</svg>',
    }),
    meta: SVGMetadataSchema,
    layers: z.array(LayerInfoSchema).openapi({
      description: "Information about SVG layers/elements",
    }),
    warnings: z.array(z.string()).openapi({
      description: "Non-critical warnings from the generation process",
      example: ["SVG missing viewBox attribute - may cause scaling issues"],
    }),
    errors: z.array(z.string()).openapi({
      description: "Errors that occurred during generation",
      example: [],
    }),
    eventId: z.number().optional().openapi({
      description: "Event ID for feedback tracking",
      example: 12345,
    }),
  })
  .openapi({
    description: "Response from SVG generation",
  });

export const ErrorResponseSchema = z
  .object({
    error: z.string().openapi({
      description: "Error message",
      example: "Invalid request parameters",
    }),
    details: z
      .array(z.string())
      .optional()
      .openapi({
        description: "Detailed error information",
        example: ["prompt: String must contain at least 1 character(s)"],
      }),
  })
  .openapi({
    description: "Error response",
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
            status: z.string().openapi({
              description: "Server status",
              example: "ok",
            }),
            timestamp: z.string().openapi({
              description: "Current timestamp",
              example: "2024-01-01T00:00:00.000Z",
            }),
          }),
        },
      },
      description: "Server is healthy",
    },
  },
});
