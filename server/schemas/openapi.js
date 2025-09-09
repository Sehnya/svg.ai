"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthCheckRoute = exports.generateSVGRoute = exports.ErrorResponseSchema = exports.GenerationResponseSchema = exports.SVGMetadataSchema = exports.LayerInfoSchema = exports.GenerationRequestSchema = void 0;
var zod_1 = require("zod");
var zod_openapi_1 = require("@hono/zod-openapi");
// Request schemas
exports.GenerationRequestSchema = zod_1.z
    .object({
    prompt: zod_1.z.string().min(1).max(500).openapi({
        description: "Natural language prompt describing the desired SVG",
        example: "A blue circle with a red border",
    }),
    size: zod_1.z
        .object({
        width: zod_1.z.number().int().min(16).max(2048).openapi({
            description: "Width of the SVG in pixels",
            example: 400,
        }),
        height: zod_1.z.number().int().min(16).max(2048).openapi({
            description: "Height of the SVG in pixels",
            example: 400,
        }),
    })
        .openapi({
        description: "Dimensions of the generated SVG",
    }),
    palette: zod_1.z
        .array(zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/))
        .optional()
        .openapi({
        description: "Array of hex color codes to use in the generation",
        example: ["#3B82F6", "#1E40AF", "#1D4ED8"],
    }),
    seed: zod_1.z.number().int().optional().openapi({
        description: "Seed for deterministic generation",
        example: 12345,
    }),
    model: zod_1.z
        .enum(["rule-based", "llm"])
        .optional()
        .default("rule-based")
        .openapi({
        description: "Generation method to use",
        example: "rule-based",
    }),
    userId: zod_1.z.string().optional().openapi({
        description: "User ID for feedback tracking",
        example: "user-123",
    }),
})
    .openapi({
    description: "Request payload for SVG generation",
});
// Response schemas
exports.LayerInfoSchema = zod_1.z
    .object({
    id: zod_1.z.string().openapi({
        description: "Unique identifier for the layer",
        example: "main-circle",
    }),
    label: zod_1.z.string().openapi({
        description: "Human-readable label for the layer",
        example: "Main Circle",
    }),
    type: zod_1.z.enum(["shape", "group", "text", "path"]).openapi({
        description: "Type of the SVG element",
        example: "shape",
    }),
})
    .openapi({
    description: "Information about an SVG layer/element",
});
exports.SVGMetadataSchema = zod_1.z
    .object({
    width: zod_1.z.number().positive().openapi({
        description: "Width of the SVG",
        example: 400,
    }),
    height: zod_1.z.number().positive().openapi({
        description: "Height of the SVG",
        example: 400,
    }),
    viewBox: zod_1.z.string().openapi({
        description: "SVG viewBox attribute",
        example: "0 0 400 400",
    }),
    backgroundColor: zod_1.z.string().openapi({
        description: "Background color of the SVG",
        example: "transparent",
    }),
    palette: zod_1.z.array(zod_1.z.string()).openapi({
        description: "Colors used in the SVG",
        example: ["#3B82F6", "#1E40AF"],
    }),
    description: zod_1.z.string().openapi({
        description: "Description of the generated SVG",
        example: 'Generated SVG based on prompt: "A blue circle"',
    }),
    seed: zod_1.z.number().openapi({
        description: "Seed used for generation",
        example: 12345,
    }),
})
    .openapi({
    description: "Metadata about the generated SVG",
});
exports.GenerationResponseSchema = zod_1.z
    .object({
    svg: zod_1.z.string().openapi({
        description: "The generated SVG markup",
        example: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">...</svg>',
    }),
    meta: exports.SVGMetadataSchema,
    layers: zod_1.z.array(exports.LayerInfoSchema).openapi({
        description: "Information about SVG layers/elements",
    }),
    warnings: zod_1.z.array(zod_1.z.string()).openapi({
        description: "Non-critical warnings from the generation process",
        example: ["SVG missing viewBox attribute - may cause scaling issues"],
    }),
    errors: zod_1.z.array(zod_1.z.string()).openapi({
        description: "Errors that occurred during generation",
        example: [],
    }),
    eventId: zod_1.z.number().optional().openapi({
        description: "Event ID for feedback tracking",
        example: 12345,
    }),
})
    .openapi({
    description: "Response from SVG generation",
});
exports.ErrorResponseSchema = zod_1.z
    .object({
    error: zod_1.z.string().openapi({
        description: "Error message",
        example: "Invalid request parameters",
    }),
    details: zod_1.z
        .array(zod_1.z.string())
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
exports.generateSVGRoute = (0, zod_openapi_1.createRoute)({
    method: "post",
    path: "/api/generate",
    tags: ["SVG Generation"],
    summary: "Generate SVG from natural language prompt",
    description: "Creates an SVG image based on a natural language description using either rule-based or LLM generation methods.",
    request: {
        body: {
            content: {
                "application/json": {
                    schema: exports.GenerationRequestSchema,
                },
            },
            description: "SVG generation parameters",
        },
    },
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: exports.GenerationResponseSchema,
                },
            },
            description: "Successfully generated SVG",
        },
        400: {
            content: {
                "application/json": {
                    schema: exports.ErrorResponseSchema,
                },
            },
            description: "Invalid request parameters",
        },
        500: {
            content: {
                "application/json": {
                    schema: exports.ErrorResponseSchema,
                },
            },
            description: "Internal server error",
        },
    },
});
exports.healthCheckRoute = (0, zod_openapi_1.createRoute)({
    method: "get",
    path: "/health",
    tags: ["Health"],
    summary: "Health check endpoint",
    description: "Returns the current status of the API server.",
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: zod_1.z.object({
                        status: zod_1.z.string().openapi({
                            description: "Server status",
                            example: "ok",
                        }),
                        timestamp: zod_1.z.string().openapi({
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
