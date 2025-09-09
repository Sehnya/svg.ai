import { Hono } from "hono";
import { cors } from "hono/cors";

// Import your existing services
import { RuleBasedGenerator } from "./services/RuleBasedGenerator";
import type { GenerationRequest, GenerationResponse } from "./types";

const app = new Hono();

// CORS for Cloudflare
app.use(
  "*",
  cors({
    origin: (origin) => {
      // Allow Cloudflare Pages domains and custom domains
      const allowedOrigins = [
        "https://svg-ai.pages.dev",
        /^https:\/\/.*\.pages\.dev$/,
        /^https:\/\/.*\.workers\.dev$/,
      ];

      // Add custom domains from environment
      const customOrigins = globalThis.ALLOWED_ORIGINS?.split(",") || [];

      return (
        allowedOrigins.some((allowed) => {
          if (typeof allowed === "string") {
            return allowed === origin;
          }
          return allowed.test(origin || "");
        }) || customOrigins.includes(origin || "")
      );
    },
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: false,
  })
);

// Health check endpoint
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    worker: true,
    environment: "cloudflare-workers",
  });
});

// SVG generation endpoint
app.post("/api/generate", async (c) => {
  try {
    const request: GenerationRequest = await c.req.json();

    // Validate request
    if (!request.prompt || !request.size) {
      return c.json(
        {
          error: "Invalid request",
          details: ["Missing required fields: prompt, size"],
        },
        400
      );
    }

    // Generate SVG using rule-based generator
    const generator = new RuleBasedGenerator();
    const result: GenerationResponse = await generator.generate(request);

    return c.json(result);
  } catch (error) {
    console.error("Generation error:", error);

    return c.json(
      {
        error: "Generation failed",
        details: [error instanceof Error ? error.message : "Unknown error"],
      },
      500
    );
  }
});

// Catch-all for API routes
app.all("/api/*", (c) => {
  return c.json(
    {
      error: "Not found",
      details: [`API endpoint ${c.req.path} not found`],
    },
    404
  );
});

// Root endpoint
app.get("/", (c) => {
  return c.json({
    name: "SVG AI Code Generator API",
    version: "1.0.0",
    environment: "cloudflare-workers",
    endpoints: {
      health: "/health",
      generate: "/api/generate",
    },
  });
});

export default app;
