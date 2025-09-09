/**
 * Enhanced SVG generation API with structured pipeline integration
 */
import { OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";
import { GenerationPipeline } from "../services/GenerationPipeline.js";
import { KnowledgeBaseManager } from "../services/KnowledgeBaseManager.js";
import { SVGGenerator } from "../services/SVGGenerator.js";
import { RuleBasedGenerator } from "../services/RuleBasedGenerator.js";
import { OpenAIGenerator } from "../services/OpenAIGenerator.js";
import { ResponseCache } from "../utils/cache.js";
import { PreferenceEngine } from "../services/PreferenceEngine.js";

const app = new OpenAPIHono();

// Enhanced request schema for pipeline integration
const GenerationRequestSchema = z.object({
  prompt: z.string().min(1).max(500),
  size: z
    .object({
      width: z.number().min(16).max(2048).default(400),
      height: z.number().min(16).max(2048).default(400),
    })
    .optional(),
  palette: z
    .array(z.string().regex(/^#[0-9A-Fa-f]{6}$/))
    .max(10)
    .optional(),
  seed: z.number().optional(),
  userId: z.string().optional(),
  model: z.enum(["pipeline", "llm", "rule-based"]).default("pipeline"),
  temperature: z.number().min(0).max(2).default(0.2).optional(),
  maxRetries: z.number().min(0).max(5).default(2).optional(),
  fallbackEnabled: z.boolean().default(true).optional(),
});

const GenerationResponseSchema = z.object({
  svg: z.string(),
  metadata: z.object({
    prompt: z.string(),
    seed: z.number().optional(),
    palette: z.array(z.string()),
    description: z.string(),
    generatedAt: z.string(),
    model: z.string().optional(),
    usedObjects: z.array(z.string()).optional(),
  }),
  layers: z.array(
    z.object({
      id: z.string(),
      type: z.string(),
      element: z.string(),
      attributes: z.record(z.union([z.string(), z.number()])),
      metadata: z
        .object({
          motif: z.string().optional(),
          generated: z.boolean().optional(),
          reused: z.boolean().optional(),
        })
        .optional(),
    })
  ),
  warnings: z.array(z.string()).optional(),
  errors: z.array(z.string()).optional(),
  eventId: z.number().optional(),
});

// Initialize services
let pipeline: GenerationPipeline | null = null;
let knowledgeBase: KnowledgeBaseManager | null = null;
let preferenceEngine: PreferenceEngine | null = null;
let responseCache: ResponseCache | null = null;

// Legacy generators for fallback
let ruleBasedGenerator: RuleBasedGenerator | null = null;
let openaiGenerator: OpenAIGenerator | null = null;

// Initialize services
export async function initializeGenerationAPI() {
  try {
    // Initialize pipeline
    pipeline = new GenerationPipeline();
    console.log("✅ Generation pipeline initialized");

    // Initialize knowledge base if database is available
    try {
      knowledgeBase = new KnowledgeBaseManager();
      console.log("✅ Knowledge base manager initialized");
    } catch (error) {
      console.warn("⚠️  Knowledge base initialization failed:", error);
    }

    // Initialize preference engine
    try {
      preferenceEngine = PreferenceEngine.getInstance();
      console.log("✅ Preference engine initialized");
    } catch (error) {
      console.warn("⚠️  Preference engine initialization failed:", error);
    }

    // Initialize cache
    responseCache = new ResponseCache(
      parseInt(process.env.CACHE_MAX_SIZE || "1000"),
      parseInt(process.env.CACHE_TTL_MINUTES || "60")
    );

    // Initialize fallback generators
    ruleBasedGenerator = new RuleBasedGenerator();

    if (process.env.OPENAI_API_KEY) {
      openaiGenerator = new OpenAIGenerator();
      console.log("✅ OpenAI generator available for fallback");
    }
  } catch (error) {
    console.error("❌ Failed to initialize generation API:", error);
    throw error;
  }
}

// Enhanced generation route
const generateRoute = {
  method: "post" as const,
  path: "/generate",
  request: {
    body: {
      content: {
        "application/json": {
          schema: GenerationRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: GenerationResponseSchema,
        },
      },
      description: "SVG generated successfully",
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
    500: {
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
            details: z.array(z.string()),
          }),
        },
      },
      description: "Internal server error",
    },
  },
  tags: ["SVG Generation"],
  summary: "Generate SVG from prompt",
  description:
    "Generate an SVG image from a natural language prompt using the structured pipeline or fallback methods",
};

app.openapi(generateRoute, async (c) => {
  try {
    const request = c.req.valid("json");

    // Check cache first
    if (responseCache) {
      const cachedResult = responseCache.get(request);
      if (cachedResult) {
        const result = { ...cachedResult };
        result.warnings = [
          ...(result.warnings || []),
          "Response served from cache",
        ];
        return c.json(result, 200);
      }
    }

    let result;

    // Choose generation method based on model parameter
    switch (request.model) {
      case "pipeline":
        result = await generateWithPipeline(request);
        break;

      case "llm":
        result = await generateWithLLM(request);
        break;

      case "rule-based":
        result = await generateWithRuleBased(request);
        break;

      default:
        result = await generateWithPipeline(request);
    }

    // Log generation event if preference engine is available
    let eventId: number | undefined;
    if (preferenceEngine && result.svg) {
      try {
        eventId = await preferenceEngine.logGenerationEvent({
          userId: request.userId,
          prompt: request.prompt,
          intent: (result as any).intent, // Will be available from pipeline
          plan: (result as any).plan, // Will be available from pipeline
          doc: (result as any).document, // Will be available from pipeline
          usedObjectIds: result.metadata.usedObjects || [],
          modelInfo: {
            model: request.model,
            temperature: request.temperature,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (error) {
        console.warn("Failed to log generation event:", error);
      }
    }

    // Check if generation had critical errors
    if (result.errors && result.errors.length > 0 && !result.svg) {
      return c.json(
        {
          error: "Generation failed",
          details: result.errors,
        },
        400
      );
    }

    // Cache successful results
    if (responseCache && (!result.errors || result.errors.length === 0)) {
      responseCache.set(request, result);
    }

    // Add event ID to response for feedback tracking
    const response = eventId ? { ...result, eventId } : result;

    return c.json(response, 200);
  } catch (error) {
    console.error("Generation error:", error);
    return c.json(
      {
        error: "Internal server error",
        details: [error instanceof Error ? error.message : "Unknown error"],
      },
      500
    );
  }
});

async function generateWithPipeline(request: any) {
  if (!pipeline) {
    throw new Error("Pipeline not initialized");
  }

  try {
    // Get grounding data from knowledge base
    let grounding = {};
    if (knowledgeBase) {
      try {
        grounding = await knowledgeBase.retrieveGrounding(
          request.prompt,
          request.userId
        );
      } catch (error) {
        console.warn("Failed to retrieve grounding data:", error);
      }
    }

    // Configure pipeline context
    const context = {
      temperature: request.temperature || 0.2,
      maxRetries: request.maxRetries || 2,
      fallbackToRuleBased: request.fallbackEnabled !== false,
    };

    // Process with pipeline
    const result = await pipeline.process(request, grounding, context);

    return result;
  } catch (error) {
    console.error("Pipeline generation failed:", error);

    // Fallback to rule-based if enabled
    if (request.fallbackEnabled !== false) {
      console.log("Falling back to rule-based generation");
      return generateWithRuleBased(request);
    }

    throw error;
  }
}

async function generateWithLLM(request: any) {
  if (!openaiGenerator) {
    // Fallback to pipeline or rule-based
    if (pipeline) {
      const result = await generateWithPipeline(request);
      result.warnings = [
        ...(result.warnings || []),
        "LLM not available - used pipeline",
      ];
      return result;
    } else {
      return generateWithRuleBased(request);
    }
  }

  try {
    const result = await openaiGenerator.generate(request);
    return result;
  } catch (error) {
    console.error("LLM generation failed:", error);

    // Fallback to pipeline or rule-based
    if (request.fallbackEnabled !== false) {
      if (pipeline) {
        const result = await generateWithPipeline(request);
        result.warnings = [
          ...(result.warnings || []),
          "LLM failed - used pipeline",
        ];
        return result;
      } else {
        return generateWithRuleBased(request);
      }
    }

    throw error;
  }
}

async function generateWithRuleBased(request: any) {
  if (!ruleBasedGenerator) {
    throw new Error("Rule-based generator not initialized");
  }

  try {
    const result = await ruleBasedGenerator.generate(request);
    result.warnings = [
      ...(result.warnings || []),
      "Used rule-based generation",
    ];
    return result;
  } catch (error) {
    console.error("Rule-based generation failed:", error);
    throw error;
  }
}

// Export the app
export default app;
