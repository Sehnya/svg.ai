import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { swaggerUI } from "@hono/swagger-ui";
import { healthCheckRoute, generateSVGRoute } from "./schemas/openapi";
import { SVGGenerator } from "./services/SVGGenerator";
import { RuleBasedGenerator } from "./services/RuleBasedGenerator";
import { OpenAIGenerator } from "./services/OpenAIGenerator";

const app = new OpenAPIHono();

// Request logging middleware
app.use("*", logger());

// CORS middleware
app.use(
  "*",
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

// Rate limiting middleware (simple in-memory implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30; // 30 requests per minute

app.use("/api/*", async (c, next) => {
  const clientIP =
    c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown";
  const now = Date.now();

  const clientData = rateLimitMap.get(clientIP);

  if (!clientData || now > clientData.resetTime) {
    // Reset or initialize rate limit for this client
    rateLimitMap.set(clientIP, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
  } else {
    clientData.count++;

    if (clientData.count > RATE_LIMIT_MAX_REQUESTS) {
      return c.json(
        {
          error: "Rate limit exceeded",
          details: [
            `Too many requests. Limit: ${RATE_LIMIT_MAX_REQUESTS} requests per minute`,
          ],
        },
        429
      );
    }
  }

  await next();
});

// Request size limit middleware
const MAX_REQUEST_SIZE = 1024 * 1024; // 1MB

app.use("/api/*", async (c, next) => {
  const contentLength = c.req.header("content-length");
  if (contentLength && parseInt(contentLength) > MAX_REQUEST_SIZE) {
    return c.json(
      {
        error: "Request too large",
        details: [
          `Request size exceeds limit of ${MAX_REQUEST_SIZE / 1024 / 1024}MB`,
        ],
      },
      413
    );
  }
  await next();
});

// Error handling middleware
app.onError((err, c) => {
  console.error("Server error:", err);
  return c.json(
    {
      error: "Internal server error",
      details: [err.message || "An unexpected error occurred"],
    },
    500
  );
});

// Initialize services
const ruleBasedGenerator = new RuleBasedGenerator();
let openaiGenerator: OpenAIGenerator | null = null;

// Initialize OpenAI generator if API key is available
try {
  if (process.env.OPENAI_API_KEY) {
    openaiGenerator = new OpenAIGenerator();
    console.log("✅ OpenAI generator initialized");
  } else {
    console.log("⚠️  OpenAI API key not found - LLM generation disabled");
  }
} catch (error) {
  console.error("❌ Failed to initialize OpenAI generator:", error);
}

// Health check endpoint
app.openapi(healthCheckRoute, (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// SVG generation endpoint
app.openapi(generateSVGRoute, async (c) => {
  try {
    const request = c.req.valid("json");

    // Choose generator based on model parameter
    let generator: SVGGenerator = ruleBasedGenerator;
    if (request.model === "llm") {
      if (openaiGenerator) {
        generator = openaiGenerator;
      } else {
        // Fall back to rule-based generation with warning
        const result = await ruleBasedGenerator.generate(request);
        result.warnings.push(
          "LLM generation not available - using rule-based fallback"
        );
        return c.json(result, 200);
      }
    }

    const result = await generator.generate(request);

    // Check if generation had critical errors
    if (result.errors.length > 0 && !result.svg) {
      return c.json(
        {
          error: "Generation failed",
          details: result.errors,
        },
        400
      );
    }

    return c.json(result, 200);
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

// OpenAPI documentation
app.doc("/openapi.json", {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "SVG AI Code Generator API",
    description:
      "API for generating SVG images from natural language prompts using AI and rule-based methods.",
    contact: {
      name: "API Support",
      email: "support@example.com",
    },
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT",
    },
  },
  servers: [
    {
      url: "http://localhost:3001",
      description: "Development server",
    },
  ],
  tags: [
    {
      name: "SVG Generation",
      description: "Endpoints for generating SVG images",
    },
    {
      name: "Health",
      description: "Health check endpoints",
    },
  ],
});

// Swagger UI
app.get("/docs", swaggerUI({ url: "/openapi.json" }));

const port = process.env.PORT || 3001;

console.log(`🚀 Server running on port ${port}`);
console.log(`📚 API Documentation: http://localhost:${port}/docs`);
console.log(`📋 OpenAPI Spec: http://localhost:${port}/openapi.json`);

export default {
  port,
  fetch: app.fetch,
};
