import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { timeout } from "hono/timeout";
import { swaggerUI } from "@hono/swagger-ui";
import { healthCheckRoute, generateSVGRoute } from "./schemas/openapi";
import { SVGGenerator } from "./services/SVGGenerator";
import { RuleBasedGenerator } from "./services/RuleBasedGenerator";
import { OpenAIGenerator } from "./services/OpenAIGenerator";
import { SecurityTester } from "./utils/securityTester";
import { ResponseCache } from "./utils/cache";

const app = new OpenAPIHono();

// Security headers middleware
app.use(
  "*",
  secureHeaders({
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // For Swagger UI
      styleSrc: ["'self'", "'unsafe-inline'"], // For Swagger UI
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
    crossOriginEmbedderPolicy: false, // Disable for development
  })
);

// Request timeout middleware
app.use("/api/*", timeout(30000)); // 30 second timeout

// Request logging middleware
app.use("*", logger());

// CORS middleware with enhanced security
app.use(
  "*",
  cors({
    origin: (origin) => {
      // Allow requests from development servers and production domains
      const allowedOrigins = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
      ];

      // Add production origins from environment
      if (process.env.ALLOWED_ORIGINS) {
        allowedOrigins.push(...process.env.ALLOWED_ORIGINS.split(","));
      }

      return allowedOrigins.includes(origin || "");
    },
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: false, // Disable credentials for security
    maxAge: 86400, // Cache preflight for 24 hours
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

// Input sanitization middleware
app.use("/api/*", async (c, next) => {
  // Check for suspicious patterns in request body
  if (c.req.method === "POST") {
    try {
      const body = await c.req.text();

      // Reset the request body for further processing
      c.req = new Request(c.req.url, {
        method: c.req.method,
        headers: c.req.headers,
        body: body,
      });

      // Check for potentially malicious patterns
      const suspiciousPatterns = [
        /<script[^>]*>/i,
        /javascript:/i,
        /vbscript:/i,
        /onload\s*=/i,
        /onerror\s*=/i,
        /onclick\s*=/i,
        /eval\s*\(/i,
        /document\.cookie/i,
        /window\.location/i,
      ];

      const hasSuspiciousContent = suspiciousPatterns.some((pattern) =>
        pattern.test(body)
      );

      if (hasSuspiciousContent) {
        console.warn("Suspicious input detected:", body.substring(0, 100));
        return c.json(
          {
            error: "Invalid input",
            details: ["Request contains potentially unsafe content"],
          },
          400
        );
      }
    } catch (error) {
      // If we can't parse the body, let the next middleware handle it
      console.warn("Could not parse request body for sanitization:", error);
    }
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

// Initialize cache
const responseCache = new ResponseCache(
  parseInt(process.env.CACHE_MAX_SIZE || "1000"),
  parseInt(process.env.CACHE_TTL_MINUTES || "60")
);

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

// Security test endpoint (only in development)
if (process.env.NODE_ENV !== "production") {
  app.get("/security/test", async (c) => {
    try {
      const tester = new SecurityTester();
      const results = await tester.runAllTests();

      return c.json({
        summary: {
          total: results.length,
          passed: results.filter((r) => r.passed).length,
          failed: results.filter((r) => !r.passed).length,
        },
        results,
      });
    } catch (error) {
      return c.json(
        {
          error: "Security test failed",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        500
      );
    }
  });

  app.get("/security/report", async (c) => {
    try {
      const tester = new SecurityTester();
      const report = await tester.generateSecurityReport();

      c.header("Content-Type", "text/markdown");
      return c.text(report);
    } catch (error) {
      return c.json(
        {
          error: "Security report generation failed",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        500
      );
    }
  });
}

// SVG generation endpoint
app.openapi(generateSVGRoute, async (c) => {
  try {
    const request = c.req.valid("json");

    // Check cache first
    const cachedResult = responseCache.get(request);
    if (cachedResult) {
      // Add cache hit indicator
      const result = { ...cachedResult };
      result.warnings = [...result.warnings, "Response served from cache"];
      return c.json(result, 200);
    }

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

        // Cache the result
        responseCache.set(request, result);

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

    // Cache successful results
    if (result.errors.length === 0) {
      responseCache.set(request, result);
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

// Cache management endpoints (development only)
if (process.env.NODE_ENV !== "production") {
  app.get("/cache/stats", (c) => {
    const stats = responseCache.getStats();
    return c.json(stats);
  });

  app.post("/cache/clear", (c) => {
    responseCache.clear();
    return c.json({ message: "Cache cleared successfully" });
  });

  app.get("/cache/entries", (c) => {
    const entries = responseCache.getEntries();
    return c.json({
      count: entries.length,
      entries: entries.slice(0, 10), // Limit to first 10 for performance
    });
  });
}

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
