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
// import { UnifiedSVGGenerator } from "../services/UnifiedSVGGenerator.js";
import { ResponseCache } from "../utils/cache.js";
import { PreferenceEngine } from "../services/PreferenceEngine.js";
import {
  featureFlagManager,
  getABTestGroup,
  isUnifiedGenerationEnabled,
  isLayeredGenerationEnabled,
  getFallbackChain,
  isQualityControlEnabled,
  getMinimumQualityThreshold,
  logABTestAssignment,
  logPerformanceMetrics,
  logFeatureUsage,
} from "../config/featureFlags.js";

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

// Generators for different methods
let ruleBasedGenerator: RuleBasedGenerator | null = null;
let openaiGenerator: OpenAIGenerator | null = null;
// let unifiedGenerator: UnifiedSVGGenerator | null = null;

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

    // Initialize generators
    ruleBasedGenerator = new RuleBasedGenerator();

    if (process.env.OPENAI_API_KEY) {
      openaiGenerator = new OpenAIGenerator();
      console.log("✅ OpenAI generator available");

      // Initialize unified generator if enabled (temporarily disabled)
      // if (isUnifiedGenerationEnabled()) {
      //   const OpenAI = (await import("openai")).default;
      //   const openaiClient = new OpenAI({
      //     apiKey: process.env.OPENAI_API_KEY,
      //   });

      //   unifiedGenerator = new UnifiedSVGGenerator(
      //     openaiClient,
      //     undefined,
      //     undefined,
      //     undefined,
      //     undefined,
      //     undefined,
      //     undefined,
      //     undefined,
      //     {
      //       enableDebug: featureFlagManager.isDebugVisualizationEnabled(),
      //       enableFallback: true,
      //       maxRetries:
      //         featureFlagManager.getFeatureConfig("unifiedGeneration")
      //           .maxRetries,
      //       timeout:
      //         featureFlagManager.getFeatureConfig("unifiedGeneration").timeout,
      //       cacheResults:
      //         featureFlagManager.isPerformanceOptimizationEnabled("caching"),
      //     }
      //   );
      //   console.log("✅ Unified SVG generator initialized");
      // }
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
  const startTime = performance.now();

  try {
    const request = c.req.valid("json");

    // Determine A/B test group and generation method
    const abTestGroup = getABTestGroup(request.userId);
    logABTestAssignment(request.userId, abTestGroup, {
      requestedModel: request.model,
      prompt: request.prompt.substring(0, 50) + "...", // Truncated for privacy
    });

    // Check cache first (if caching is enabled)
    if (
      responseCache &&
      featureFlagManager.isPerformanceOptimizationEnabled("caching")
    ) {
      const cachedResult = responseCache.get(request);
      if (cachedResult) {
        const result = { ...cachedResult };
        result.warnings = [
          ...(result.warnings || []),
          "Response served from cache",
        ];

        // Log cache hit
        logFeatureUsage("cache_hit", true, request.userId, {
          generationMethod: result.metadata?.generationMethod || "unknown",
        });

        return c.json(result, 200);
      }
    }

    let result;
    let generationMethod = request.model;

    // Override generation method based on A/B test group
    if (request.model === "pipeline" || request.model === "llm") {
      switch (abTestGroup) {
        case "unified":
          if (isUnifiedGenerationEnabled(request.userId)) {
            generationMethod = "unified";
          } else {
            generationMethod = "pipeline";
          }
          break;
        case "traditional":
          generationMethod = "pipeline";
          break;
        case "control":
          generationMethod = "rule-based";
          break;
      }
    }

    // Choose generation method
    switch (generationMethod) {
      case "unified":
        result = await generateWithUnified(request);
        break;

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

    // Check quality threshold if quality control is enabled
    if (isQualityControlEnabled() && result.metadata?.layoutQuality) {
      const minThreshold = getMinimumQualityThreshold();
      if (result.metadata.layoutQuality < minThreshold) {
        result.warnings = [
          ...(result.warnings || []),
          `Quality score ${result.metadata.layoutQuality} below threshold ${minThreshold}`,
        ];
      }
    }

    // Cache successful results (if caching is enabled)
    if (
      responseCache &&
      featureFlagManager.isPerformanceOptimizationEnabled("caching") &&
      (!result.errors || result.errors.length === 0)
    ) {
      responseCache.set(request, result);
    }

    // Log performance metrics
    const endTime = performance.now();
    logPerformanceMetrics({
      generationMethod: result.metadata?.generationMethod || generationMethod,
      generationTime: endTime - startTime,
      apiTime: result.metadata?.performance?.apiTime,
      processingTime: result.metadata?.performance?.processingTime,
      qualityScore: result.metadata?.layoutQuality,
      fallbackUsed: result.metadata?.fallbackUsed || false,
      userId: request.userId,
    });

    // Add event ID and A/B test info to response
    const response = {
      ...(eventId ? { ...result, eventId } : result),
      abTestGroup,
      generationMethod,
    };

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

async function generateWithUnified(request: any) {
  // Unified generator is temporarily disabled
  console.warn("Unified generator not available, falling back to pipeline");
  return generateWithPipeline(request);

  // Unified generator functionality is temporarily disabled
  // Falling back to pipeline generation
  return generateWithPipeline(request);

  /*
  try {
    // Convert request format for unified generator
    const unifiedRequest = {
      ...request,
      features: {
        unifiedGeneration: true,
        layoutLanguage:
          featureFlagManager.getFeatureConfig("layeredGeneration")
            .enableLayoutLanguage,
        semanticRegions:
          featureFlagManager.getFeatureConfig("layeredGeneration")
            .enableSemanticRegions,
      },
      debug: featureFlagManager.isDebugVisualizationEnabled(),
      environment: featureFlagManager.getEnvironment(),
    };

    const result = await unifiedGenerator.generate(unifiedRequest);

    // Log feature usage
    logFeatureUsage("unified_generation", true, request.userId, {
      success: result.success,
      fallbackUsed: result.metadata?.fallbackUsed,
      layoutQuality: result.metadata?.layoutQuality,
    });

    return result;
  } catch (error) {
    console.error("Unified generation failed:", error);

    // Log failure
    logFeatureUsage("unified_generation", false, request.userId, {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    // Fallback based on configured fallback chain
    const fallbackChain = getFallbackChain();

    for (const fallbackMethod of fallbackChain) {
      try {
        switch (fallbackMethod) {
          case "layered":
            if (isLayeredGenerationEnabled()) {
              return await generateWithPipeline(request);
            }
            break;
          case "rule-based":
            return await generateWithRuleBased(request);
          case "basic":
            // Return basic geometric shape
            return {
              success: true,
              svg: generateBasicFallbackSVG(request),
              metadata: {
                generationMethod: "basic-fallback",
                fallbackUsed: true,
                fallbackReason: `Unified generation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
              },
            };
        }
      } catch (fallbackError) {
        console.warn(
          `Fallback method ${fallbackMethod} also failed:`,
          fallbackError
        );
        continue;
      }
    }

    throw error;
  }
  */
}

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

function generateBasicFallbackSVG(request: any): string {
  const width = request.size?.width || 400;
  const height = request.size?.height || 400;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 4;

  // Use first color from palette or default blue
  const color = request.palette?.[0] || "#3B82F6";
  const strokeColor = request.palette?.[1] || "#1E40AF";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="${color}" stroke="${strokeColor}" stroke-width="2"/>
  <text x="${centerX}" y="${centerY + 5}" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="white">
    Generated
  </text>
</svg>`;
}

// Export the app
export default app;
