import { z } from "zod";
import { createRoute } from "@hono/zod-openapi";

// Enhanced request schemas for unified generation
export const GenerationRequestSchema = z.object({
  prompt: z
    .string()
    .min(1)
    .max(500)
    .describe("Natural language description of the desired SVG image")
    .openapi({
      example: "A simple house with a red roof and blue windows",
    }),
  size: z
    .object({
      width: z
        .number()
        .int()
        .min(16)
        .max(2048)
        .describe("Canvas width in pixels"),
      height: z
        .number()
        .int()
        .min(16)
        .max(2048)
        .describe("Canvas height in pixels"),
    })
    .optional()
    .describe("Canvas dimensions (defaults to 400x400)")
    .openapi({
      example: { width: 512, height: 512 },
    }),
  palette: z
    .array(z.string().regex(/^#[0-9A-Fa-f]{6}$/))
    .max(10)
    .optional()
    .describe("Color palette as hex codes (optional)")
    .openapi({
      example: ["#3B82F6", "#EF4444", "#10B981", "#F59E0B"],
    }),
  seed: z
    .number()
    .int()
    .optional()
    .describe("Random seed for reproducible generation")
    .openapi({
      example: 12345,
    }),
  model: z
    .enum(["pipeline", "unified", "llm", "rule-based"])
    .optional()
    .default("pipeline")
    .describe(
      "Generation method: pipeline (recommended), unified (experimental), llm (OpenAI), or rule-based (fallback)"
    )
    .openapi({
      example: "pipeline",
    }),
  userId: z
    .string()
    .optional()
    .describe("User identifier for personalization and A/B testing")
    .openapi({
      example: "user_123",
    }),
  temperature: z
    .number()
    .min(0)
    .max(2)
    .optional()
    .default(0.2)
    .describe("AI creativity level (0=deterministic, 2=very creative)")
    .openapi({
      example: 0.7,
    }),
  maxRetries: z
    .number()
    .int()
    .min(0)
    .max(5)
    .optional()
    .default(2)
    .describe("Maximum retry attempts for failed generation")
    .openapi({
      example: 3,
    }),
  fallbackEnabled: z
    .boolean()
    .optional()
    .default(true)
    .describe("Enable fallback to simpler generation methods on failure")
    .openapi({
      example: true,
    }),
  debug: z
    .boolean()
    .optional()
    .default(false)
    .describe("Include debug information in response")
    .openapi({
      example: false,
    }),
  aspectRatio: z
    .enum(["1:1", "4:3", "16:9", "3:2", "2:3", "9:16"])
    .optional()
    .default("1:1")
    .describe("Canvas aspect ratio")
    .openapi({
      example: "1:1",
    }),
});

// Enhanced response schemas for unified generation
export const LayerInfoSchema = z.object({
  id: z.string().describe("Unique layer identifier"),
  label: z.string().describe("Human-readable layer name"),
  type: z
    .enum(["shape", "group", "text", "path", "layer"])
    .describe("Layer content type"),
  element: z.string().describe("SVG element type (g, path, circle, etc.)"),
  attributes: z
    .record(z.union([z.string(), z.number()]))
    .describe("SVG element attributes"),
  metadata: z
    .object({
      motif: z.string().optional().describe("Semantic motif or concept"),
      generated: z
        .boolean()
        .optional()
        .describe("Whether content was AI-generated"),
      reused: z
        .boolean()
        .optional()
        .describe("Whether content was reused from knowledge base"),
      region: z
        .string()
        .optional()
        .describe("Layout region used (unified generation)"),
      anchor: z
        .string()
        .optional()
        .describe("Anchor point used (unified generation)"),
    })
    .optional()
    .describe("Additional layer metadata"),
});

export const SVGMetadataSchema = z.object({
  width: z.number().positive().describe("Canvas width in pixels"),
  height: z.number().positive().describe("Canvas height in pixels"),
  viewBox: z.string().describe("SVG viewBox attribute"),
  backgroundColor: z.string().describe("Background color"),
  palette: z.array(z.string()).describe("Colors used in the SVG"),
  description: z.string().describe("Generated description of the SVG content"),
  seed: z.number().optional().describe("Random seed used for generation"),
  generationMethod: z
    .string()
    .optional()
    .describe("Method used for generation (unified, pipeline, llm, rule-based)")
    .openapi({
      example: "unified-layered",
    }),
  layoutQuality: z
    .number()
    .min(0)
    .max(100)
    .optional()
    .describe("Layout quality score (0-100, unified generation only)")
    .openapi({
      example: 85,
    }),
  coordinatesRepaired: z
    .boolean()
    .optional()
    .describe("Whether coordinates were automatically repaired")
    .openapi({
      example: false,
    }),
  fallbackUsed: z
    .boolean()
    .optional()
    .describe("Whether fallback generation was used")
    .openapi({
      example: false,
    }),
  fallbackReason: z
    .string()
    .optional()
    .describe("Reason for using fallback generation")
    .openapi({
      example: "OpenAI API timeout",
    }),
  usedObjects: z
    .array(z.string())
    .optional()
    .describe("Knowledge base objects used in generation")
    .openapi({
      example: ["style_pack_modern", "motif_house"],
    }),
  performance: z
    .object({
      generationTime: z
        .number()
        .describe("Total generation time in milliseconds"),
      apiTime: z
        .number()
        .optional()
        .describe("AI API call time in milliseconds"),
      processingTime: z
        .number()
        .optional()
        .describe("Post-processing time in milliseconds"),
    })
    .optional()
    .describe("Performance metrics"),
});

export const LayoutMetadataSchema = z.object({
  regionsUsed: z.array(z.string()).describe("Semantic regions used in layout"),
  anchorsUsed: z
    .array(z.string())
    .describe("Anchor points used in positioning"),
  aspectRatio: z.string().describe("Canvas aspect ratio"),
  canvasDimensions: z
    .object({
      width: z.number(),
      height: z.number(),
    })
    .describe("Canvas dimensions"),
});

export const DebugInfoSchema = z.object({
  regionBoundaries: z
    .any()
    .optional()
    .describe("Region boundary visualization data"),
  anchorPoints: z.any().optional().describe("Anchor point visualization data"),
  layoutErrors: z
    .array(z.string())
    .optional()
    .describe("Layout-related errors or warnings"),
  layerStructure: z.any().optional().describe("Layer organization analysis"),
});

export const GenerationResponseSchema = z.object({
  svg: z.string().describe("Generated SVG markup").openapi({
    example:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">...</svg>',
  }),
  metadata: SVGMetadataSchema.describe("Generation metadata and metrics"),
  layers: z
    .array(LayerInfoSchema)
    .describe("Layer information for inspection and editing"),
  layout: LayoutMetadataSchema.optional().describe(
    "Layout information (unified generation only)"
  ),
  warnings: z.array(z.string()).optional().describe("Non-critical warnings"),
  errors: z.array(z.string()).optional().describe("Error messages (if any)"),
  eventId: z.number().optional().describe("Event ID for feedback tracking"),
  abTestGroup: z
    .enum(["unified", "traditional", "control"])
    .optional()
    .describe("A/B test group assignment"),
  generationMethod: z
    .string()
    .optional()
    .describe("Actual generation method used"),
  debug: DebugInfoSchema.optional().describe(
    "Debug information (when debug=true)"
  ),
});

export const ErrorResponseSchema = z.object({
  error: z.string().describe("Error message"),
  details: z.array(z.string()).optional().describe("Additional error details"),
  code: z.string().optional().describe("Error code for programmatic handling"),
  retryable: z
    .boolean()
    .optional()
    .describe("Whether the request can be retried"),
});

// Configuration API schemas
export const FeatureFlagConfigSchema = z.object({
  unifiedGeneration: z.object({
    enabled: z.boolean(),
    rolloutPercentage: z.number().min(0).max(100),
    abTestGroups: z
      .object({
        unified: z.number(),
        traditional: z.number(),
        control: z.number(),
      })
      .optional(),
  }),
  layeredGeneration: z.object({
    enabled: z.boolean(),
    enableLayoutLanguage: z.boolean(),
    enableSemanticRegions: z.boolean(),
  }),
  debugVisualization: z.object({
    enabled: z.boolean(),
    enabledInProduction: z.boolean(),
  }),
});

export const ABTestAssignmentSchema = z.object({
  userId: z.string().optional(),
  group: z.enum(["unified", "traditional", "control"]),
  metadata: z.object({
    environment: z.string(),
    assignedAt: z.string(),
  }),
});

// Route definitions with comprehensive examples
export const generateSVGRoute = createRoute({
  method: "post",
  path: "/api/generate",
  tags: ["SVG Generation"],
  summary: "Generate SVG from natural language prompt",
  description: `
Creates an SVG image based on a natural language description using advanced generation methods.

## Generation Methods

- **pipeline** (recommended): Uses the full structured generation pipeline with knowledge base integration
- **unified** (experimental): Uses the unified layered generation system with semantic layout language
- **llm**: Direct OpenAI integration with structured prompting
- **rule-based**: Template-based generation for reliable fallback

## A/B Testing

The system automatically assigns users to A/B test groups:
- **unified**: Uses the new unified layered generation system
- **traditional**: Uses the established pipeline approach
- **control**: Uses rule-based generation for baseline comparison

## Layout Language (Unified Generation)

When using unified generation, the system uses semantic layout language:
- **Regions**: top_left, center, bottom_right, etc.
- **Anchors**: center, top_left, bottom_center, etc.
- **Layers**: Logical separation of design elements

## Quality Control

The system includes automatic quality control:
- Coordinate bounds checking (0-512 range)
- Path command validation
- Layout quality scoring (0-100)
- Automatic repair of common issues

## Fallback Chain

If the primary generation method fails, the system automatically falls back through:
1. Layered generation
2. Rule-based generation
3. Basic geometric shapes

## Examples

### Simple Request
\`\`\`json
{
  "prompt": "A red circle",
  "model": "pipeline"
}
\`\`\`

### Advanced Request
\`\`\`json
{
  "prompt": "A modern house with solar panels and a garden",
  "size": { "width": 512, "height": 512 },
  "palette": ["#2563EB", "#DC2626", "#059669", "#D97706"],
  "seed": 12345,
  "model": "unified",
  "userId": "user_123",
  "temperature": 0.7,
  "debug": true
}
\`\`\`
  `,
  request: {
    body: {
      content: {
        "application/json": {
          schema: GenerationRequestSchema,
          examples: {
            simple: {
              summary: "Simple generation",
              description: "Basic SVG generation with minimal parameters",
              value: {
                prompt: "A blue house with a red roof",
                model: "pipeline",
              },
            },
            advanced: {
              summary: "Advanced generation",
              description: "Full-featured generation with all options",
              value: {
                prompt: "A modern cityscape with skyscrapers and a sunset",
                size: { width: 512, height: 512 },
                palette: ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4"],
                seed: 42,
                model: "unified",
                userId: "user_123",
                temperature: 0.8,
                maxRetries: 3,
                fallbackEnabled: true,
                debug: false,
                aspectRatio: "16:9",
              },
            },
            ruleBased: {
              summary: "Rule-based generation",
              description: "Reliable template-based generation",
              value: {
                prompt: "A simple geometric pattern",
                model: "rule-based",
                size: { width: 400, height: 400 },
                palette: ["#3B82F6", "#EF4444"],
              },
            },
          },
        },
      },
      description: "SVG generation parameters with comprehensive options",
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: GenerationResponseSchema,
          examples: {
            unified: {
              summary: "Unified generation response",
              description: "Response from unified layered generation system",
              value: {
                svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">...</svg>',
                metadata: {
                  width: 512,
                  height: 512,
                  viewBox: "0 0 512 512",
                  backgroundColor: "#FFFFFF",
                  palette: ["#3B82F6", "#EF4444", "#10B981"],
                  description: "A modern house with blue walls and red roof",
                  seed: 12345,
                  generationMethod: "unified-layered",
                  layoutQuality: 87,
                  coordinatesRepaired: false,
                  fallbackUsed: false,
                  performance: {
                    generationTime: 1250,
                    apiTime: 800,
                    processingTime: 450,
                  },
                },
                layers: [
                  {
                    id: "structure",
                    label: "House Structure",
                    type: "layer",
                    element: "g",
                    attributes: {
                      id: "structure",
                      "data-label": "House Structure",
                    },
                    metadata: {
                      motif: "building",
                      generated: true,
                      region: "center",
                      anchor: "bottom_center",
                    },
                  },
                ],
                layout: {
                  regionsUsed: ["center", "top_center"],
                  anchorsUsed: ["center", "bottom_center"],
                  aspectRatio: "1:1",
                  canvasDimensions: { width: 512, height: 512 },
                },
                abTestGroup: "unified",
                generationMethod: "unified",
                eventId: 12345,
              },
            },
            traditional: {
              summary: "Traditional pipeline response",
              description: "Response from traditional generation pipeline",
              value: {
                svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">...</svg>',
                metadata: {
                  width: 400,
                  height: 400,
                  viewBox: "0 0 400 400",
                  backgroundColor: "#F8F9FA",
                  palette: ["#6366F1", "#EF4444"],
                  description: "A simple house illustration",
                  generationMethod: "pipeline",
                  fallbackUsed: false,
                  performance: {
                    generationTime: 950,
                  },
                },
                layers: [
                  {
                    id: "house_body",
                    label: "House Body",
                    type: "shape",
                    element: "rect",
                    attributes: { width: 200, height: 150, fill: "#6366F1" },
                  },
                ],
                abTestGroup: "traditional",
                generationMethod: "pipeline",
              },
            },
            fallback: {
              summary: "Fallback generation response",
              description: "Response when primary generation fails",
              value: {
                svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">...</svg>',
                metadata: {
                  width: 400,
                  height: 400,
                  viewBox: "0 0 400 400",
                  backgroundColor: "#FFFFFF",
                  palette: ["#3B82F6"],
                  description: "Basic geometric shape",
                  generationMethod: "basic-fallback",
                  fallbackUsed: true,
                  fallbackReason: "OpenAI API timeout",
                  performance: {
                    generationTime: 50,
                  },
                },
                layers: [
                  {
                    id: "fallback_shape",
                    label: "Basic Shape",
                    type: "shape",
                    element: "circle",
                    attributes: { cx: 200, cy: 200, r: 100, fill: "#3B82F6" },
                  },
                ],
                warnings: ["Primary generation failed, used fallback"],
                abTestGroup: "control",
                generationMethod: "basic-fallback",
              },
            },
          },
        },
      },
      description: "Successfully generated SVG with comprehensive metadata",
    },
    400: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
          examples: {
            invalidPrompt: {
              summary: "Invalid prompt",
              value: {
                error: "Invalid request parameters",
                details: ["Prompt must be between 1 and 500 characters"],
                code: "INVALID_PROMPT",
                retryable: true,
              },
            },
            invalidSize: {
              summary: "Invalid size",
              value: {
                error: "Invalid request parameters",
                details: ["Width must be between 16 and 2048 pixels"],
                code: "INVALID_SIZE",
                retryable: true,
              },
            },
          },
        },
      },
      description: "Invalid request parameters",
    },
    429: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
          examples: {
            rateLimited: {
              summary: "Rate limited",
              value: {
                error: "Rate limit exceeded",
                details: ["Maximum 60 requests per minute exceeded"],
                code: "RATE_LIMITED",
                retryable: true,
              },
            },
          },
        },
      },
      description: "Rate limit exceeded",
    },
    500: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
          examples: {
            serverError: {
              summary: "Server error",
              value: {
                error: "Internal server error",
                details: ["Generation pipeline temporarily unavailable"],
                code: "INTERNAL_ERROR",
                retryable: true,
              },
            },
          },
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
  description:
    "Returns the current status of the API server and its components.",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            status: z.string().describe("Overall system status"),
            timestamp: z.string().describe("Current timestamp"),
            version: z.string().optional().describe("API version"),
            components: z
              .object({
                database: z
                  .string()
                  .optional()
                  .describe("Database connection status"),
                openai: z.string().optional().describe("OpenAI API status"),
                cache: z.string().optional().describe("Cache system status"),
              })
              .optional()
              .describe("Component health status"),
            features: z
              .object({
                unifiedGeneration: z.boolean(),
                layeredGeneration: z.boolean(),
                debugVisualization: z.boolean(),
              })
              .optional()
              .describe("Feature availability"),
          }),
          examples: {
            healthy: {
              summary: "Healthy system",
              value: {
                status: "healthy",
                timestamp: "2024-01-15T10:30:00Z",
                version: "2.0.0",
                components: {
                  database: "healthy",
                  openai: "healthy",
                  cache: "healthy",
                },
                features: {
                  unifiedGeneration: true,
                  layeredGeneration: true,
                  debugVisualization: true,
                },
              },
            },
          },
        },
      },
      description: "Server is healthy",
    },
    503: {
      content: {
        "application/json": {
          schema: z.object({
            status: z.string(),
            timestamp: z.string(),
            issues: z.array(z.string()),
          }),
        },
      },
      description: "Server is unhealthy",
    },
  },
});

// Configuration API routes
export const getFeatureFlagsRoute = createRoute({
  method: "get",
  path: "/api/config/feature-flags",
  tags: ["Configuration"],
  summary: "Get feature flag configuration",
  description: `
Retrieve current feature flag configuration and usage metrics.

**Authentication Required**: Admin API key

## Feature Flags

- **unifiedGeneration**: Controls the new unified layered generation system
- **layeredGeneration**: Controls layered SVG generation capabilities
- **debugVisualization**: Controls debug visualization features
- **performanceOptimizations**: Controls various performance optimizations
- **qualityControl**: Controls quality validation and repair systems

## A/B Testing

The system supports A/B testing with configurable group percentages:
- Groups must sum to 100%
- Users are consistently assigned to the same group
- Anonymous users get random assignment

## Usage Metrics

The response includes runtime metrics when available:
- Request counts by generation method
- A/B test group distribution
- Average generation times
- Fallback usage rates
  `,
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            environment: z.string(),
            config: FeatureFlagConfigSchema,
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
          }),
          examples: {
            production: {
              summary: "Production configuration",
              value: {
                environment: "production",
                config: {
                  unifiedGeneration: {
                    enabled: true,
                    rolloutPercentage: 25,
                    abTestGroups: {
                      unified: 50,
                      traditional: 30,
                      control: 20,
                    },
                  },
                  layeredGeneration: {
                    enabled: true,
                    enableLayoutLanguage: true,
                    enableSemanticRegions: true,
                  },
                  debugVisualization: {
                    enabled: false,
                    enabledInProduction: false,
                  },
                },
                usage: {
                  unifiedGenerationEnabled: true,
                  layeredGenerationEnabled: true,
                  debugVisualizationEnabled: false,
                },
                metrics: {
                  totalRequests: 15420,
                  abTestDistribution: {
                    unified: 7710,
                    traditional: 4626,
                    control: 3084,
                  },
                  averageGenerationTime: 1250,
                  fallbackUsageRate: 0.05,
                },
              },
            },
          },
        },
      },
      description: "Current feature flag configuration",
    },
    403: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Access denied - admin authentication required",
    },
  },
});

export const updateFeatureFlagsRoute = createRoute({
  method: "patch",
  path: "/api/config/feature-flags",
  tags: ["Configuration"],
  summary: "Update feature flag configuration",
  description: `
Update feature flag configuration with new values.

**Authentication Required**: Admin API key

## Validation Rules

- A/B test group percentages must sum to 100
- Rollout percentages must be between 0-100
- Quality thresholds must be between 0-100
- Rate limits must be positive integers

## Examples

### Enable Unified Generation
\`\`\`json
{
  "unifiedGeneration": {
    "enabled": true,
    "rolloutPercentage": 50
  }
}
\`\`\`

### Update A/B Test Groups
\`\`\`json
{
  "unifiedGeneration": {
    "abTestGroups": {
      "unified": 60,
      "traditional": 25,
      "control": 15
    }
  }
}
\`\`\`

### Adjust Quality Control
\`\`\`json
{
  "qualityControl": {
    "enableValidation": true,
    "minimumQualityThreshold": 80
  }
}
\`\`\`
  `,
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            unifiedGeneration: z
              .object({
                enabled: z.boolean().optional(),
                rolloutPercentage: z.number().min(0).max(100).optional(),
                abTestGroups: z
                  .object({
                    unified: z.number().min(0).max(100).optional(),
                    traditional: z.number().min(0).max(100).optional(),
                    control: z.number().min(0).max(100).optional(),
                  })
                  .optional(),
              })
              .optional(),
            layeredGeneration: z
              .object({
                enabled: z.boolean().optional(),
                enableLayoutLanguage: z.boolean().optional(),
                enableSemanticRegions: z.boolean().optional(),
              })
              .optional(),
            debugVisualization: z
              .object({
                enabled: z.boolean().optional(),
                enabledInProduction: z.boolean().optional(),
              })
              .optional(),
          }),
          examples: {
            enableUnified: {
              summary: "Enable unified generation",
              value: {
                unifiedGeneration: {
                  enabled: true,
                  rolloutPercentage: 75,
                },
              },
            },
            updateABTest: {
              summary: "Update A/B test groups",
              value: {
                unifiedGeneration: {
                  abTestGroups: {
                    unified: 70,
                    traditional: 20,
                    control: 10,
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            environment: z.string(),
            config: FeatureFlagConfigSchema,
            usage: z.object({
              unifiedGenerationEnabled: z.boolean(),
              layeredGenerationEnabled: z.boolean(),
              debugVisualizationEnabled: z.boolean(),
            }),
          }),
        },
      },
      description: "Configuration updated successfully",
    },
    400: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
          examples: {
            invalidPercentages: {
              summary: "Invalid A/B test percentages",
              value: {
                error: "Invalid configuration",
                details: ["A/B test group percentages must sum to 100"],
                code: "INVALID_AB_TEST_CONFIG",
                retryable: true,
              },
            },
          },
        },
      },
      description: "Invalid configuration",
    },
    403: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Access denied - admin authentication required",
    },
  },
});

export const getABTestAssignmentRoute = createRoute({
  method: "post",
  path: "/api/config/ab-test-assignment",
  tags: ["Configuration"],
  summary: "Get A/B test assignment",
  description: `
Get A/B test group assignment for a user.

## Assignment Logic

1. Check user-specific overrides (enabled/disabled lists)
2. Use consistent hashing for registered users
3. Use random assignment for anonymous users
4. Respect environment-specific rollout percentages

## Groups

- **unified**: Uses the new unified layered generation system
- **traditional**: Uses the established pipeline approach  
- **control**: Uses rule-based generation for baseline comparison

## Consistency

The same user ID will always receive the same group assignment,
ensuring consistent experience across sessions.
  `,
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            userId: z
              .string()
              .optional()
              .describe("User identifier for consistent assignment"),
          }),
          examples: {
            withUser: {
              summary: "With user ID",
              value: { userId: "user_123" },
            },
            anonymous: {
              summary: "Anonymous user",
              value: {},
            },
          },
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ABTestAssignmentSchema,
          examples: {
            unified: {
              summary: "Unified group assignment",
              value: {
                userId: "user_123",
                group: "unified",
                metadata: {
                  environment: "production",
                  assignedAt: "2024-01-15T10:30:00Z",
                },
              },
            },
            anonymous: {
              summary: "Anonymous user assignment",
              value: {
                group: "traditional",
                metadata: {
                  environment: "production",
                  assignedAt: "2024-01-15T10:30:00Z",
                },
              },
            },
          },
        },
      },
      description: "A/B test group assignment",
    },
  },
});

export const configHealthRoute = createRoute({
  method: "get",
  path: "/api/config/health",
  tags: ["Configuration"],
  summary: "Configuration service health check",
  description:
    "Check the health status of the configuration service and feature flags.",
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
          examples: {
            healthy: {
              summary: "Healthy configuration service",
              value: {
                status: "healthy",
                environment: "production",
                timestamp: "2024-01-15T10:30:00Z",
                features: {
                  unifiedGeneration: true,
                  layeredGeneration: true,
                  debugVisualization: false,
                },
              },
            },
          },
        },
      },
      description: "Configuration service is healthy",
    },
  },
});
