"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var zod_openapi_1 = require("@hono/zod-openapi");
var cors_1 = require("hono/cors");
var logger_1 = require("hono/logger");
var secure_headers_1 = require("hono/secure-headers");
var timeout_1 = require("hono/timeout");
var swagger_ui_1 = require("@hono/swagger-ui");
var openapi_1 = require("./schemas/openapi");
var RuleBasedGenerator_1 = require("./services/RuleBasedGenerator");
var OpenAIGenerator_1 = require("./services/OpenAIGenerator");
var securityTester_1 = require("./utils/securityTester");
var cache_1 = require("./utils/cache");
var config_1 = require("./db/config");
var feedback_1 = require("./api/feedback");
var cache_2 = require("./api/cache");
var generate_1 = require("./api/generate");
var kb_1 = require("./api/kb");
var PreferenceEngine_1 = require("./services/PreferenceEngine");
var CacheCleanupJob_1 = require("./services/CacheCleanupJob");
var app = new zod_openapi_1.OpenAPIHono();
// Security headers middleware
app.use("*", (0, secure_headers_1.secureHeaders)({
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
}));
// Request timeout middleware
app.use("/api/*", (0, timeout_1.timeout)(30000)); // 30 second timeout
// Request logging middleware
app.use("*", (0, logger_1.logger)());
// CORS middleware with enhanced security
app.use("*", (0, cors_1.cors)({
    origin: function (origin) {
        // Allow requests from development servers and production domains
        var allowedOrigins = [
            "http://localhost:5173",
            "http://localhost:3000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:3000",
        ];
        // Add production origins from environment
        if (process.env.ALLOWED_ORIGINS) {
            allowedOrigins.push.apply(allowedOrigins, process.env.ALLOWED_ORIGINS.split(","));
        }
        return allowedOrigins.includes(origin || "") ? origin : null;
    },
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: false, // Disable credentials for security
    maxAge: 86400, // Cache preflight for 24 hours
}));
// Rate limiting middleware (simple in-memory implementation)
var rateLimitMap = new Map();
var RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
var RATE_LIMIT_MAX_REQUESTS = 30; // 30 requests per minute
app.use("/api/*", function (c, next) { return __awaiter(void 0, void 0, void 0, function () {
    var clientIP, now, clientData;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                clientIP = c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown";
                now = Date.now();
                clientData = rateLimitMap.get(clientIP);
                if (!clientData || now > clientData.resetTime) {
                    // Reset or initialize rate limit for this client
                    rateLimitMap.set(clientIP, {
                        count: 1,
                        resetTime: now + RATE_LIMIT_WINDOW,
                    });
                }
                else {
                    clientData.count++;
                    if (clientData.count > RATE_LIMIT_MAX_REQUESTS) {
                        return [2 /*return*/, c.json({
                                error: "Rate limit exceeded",
                                details: [
                                    "Too many requests. Limit: ".concat(RATE_LIMIT_MAX_REQUESTS, " requests per minute"),
                                ],
                            }, 429)];
                    }
                }
                return [4 /*yield*/, next()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
// Request size limit middleware
var MAX_REQUEST_SIZE = 1024 * 1024; // 1MB
app.use("/api/*", function (c, next) { return __awaiter(void 0, void 0, void 0, function () {
    var contentLength;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                contentLength = c.req.header("content-length");
                if (contentLength && parseInt(contentLength) > MAX_REQUEST_SIZE) {
                    return [2 /*return*/, c.json({
                            error: "Request too large",
                            details: [
                                "Request size exceeds limit of ".concat(MAX_REQUEST_SIZE / 1024 / 1024, "MB"),
                            ],
                        }, 413)];
                }
                return [4 /*yield*/, next()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
// Input sanitization middleware
app.use("/api/*", function (c, next) { return __awaiter(void 0, void 0, void 0, function () {
    var clonedRequest, body_1, suspiciousPatterns, hasSuspiciousContent, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!(c.req.method === "POST" || c.req.method === "PUT")) return [3 /*break*/, 4];
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                clonedRequest = c.req.raw.clone();
                return [4 /*yield*/, clonedRequest.text()];
            case 2:
                body_1 = _a.sent();
                suspiciousPatterns = [
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
                hasSuspiciousContent = suspiciousPatterns.some(function (pattern) {
                    return pattern.test(body_1);
                });
                if (hasSuspiciousContent) {
                    console.warn("Suspicious input detected:", body_1.substring(0, 100));
                    return [2 /*return*/, c.json({
                            error: "Invalid input",
                            details: ["Request contains potentially unsafe content"],
                        }, 400)];
                }
                return [3 /*break*/, 4];
            case 3:
                error_1 = _a.sent();
                // If we can't parse the body, let the next middleware handle it
                console.warn("Could not parse request body for sanitization:", error_1);
                return [3 /*break*/, 4];
            case 4: return [4 /*yield*/, next()];
            case 5:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
// Error handling middleware
app.onError(function (err, c) {
    console.error("Server error:", err);
    return c.json({
        error: "Internal server error",
        details: [err.message || "An unexpected error occurred"],
    }, 500);
});
// Initialize services
var ruleBasedGenerator = new RuleBasedGenerator_1.RuleBasedGenerator();
var openaiGenerator = null;
var preferenceEngine = null;
// Initialize cache
var responseCache = new cache_1.ResponseCache(parseInt(process.env.CACHE_MAX_SIZE || "1000"), parseInt(process.env.CACHE_TTL_MINUTES || "60"));
// Initialize database
var databaseHealthy = false;
try {
    await (0, config_1.initializeDatabase)();
    databaseHealthy = await (0, config_1.checkDatabaseHealth)();
    if (databaseHealthy) {
        console.log("✅ Database connected and healthy");
        // Initialize preference engine if database is healthy
        preferenceEngine = PreferenceEngine_1.PreferenceEngine.getInstance();
        console.log("✅ Preference engine initialized");
        // Start cache cleanup job
        CacheCleanupJob_1.cacheCleanupJob.start();
        console.log("✅ Cache cleanup job started");
    }
    else {
        console.log("⚠️  Database connection issues detected");
    }
}
catch (error) {
    console.error("❌ Database initialization failed:", error);
    console.log("⚠️  Knowledge base features will be disabled");
}
// Initialize OpenAI generator if API key is available
try {
    if (process.env.OPENAI_API_KEY) {
        openaiGenerator = new OpenAIGenerator_1.OpenAIGenerator();
        console.log("✅ OpenAI generator initialized");
    }
    else {
        console.log("⚠️  OpenAI API key not found - LLM generation disabled");
    }
}
catch (error) {
    console.error("❌ Failed to initialize OpenAI generator:", error);
}
// Health check endpoint
app.openapi(openapi_1.healthCheckRoute, function (c) { return __awaiter(void 0, void 0, void 0, function () {
    var dbHealth;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, config_1.checkDatabaseHealth)()];
            case 1:
                dbHealth = _a.sent();
                return [2 /*return*/, c.json({
                        status: "ok",
                        timestamp: new Date().toISOString(),
                        services: {
                            database: dbHealth ? "healthy" : "unhealthy",
                            openai: openaiGenerator ? "available" : "unavailable",
                            cache: "healthy",
                            preferences: preferenceEngine ? "available" : "unavailable",
                        },
                    })];
        }
    });
}); });
// Security test endpoint (only in development)
if (process.env.NODE_ENV !== "production") {
    app.get("/security/test", function (c) { return __awaiter(void 0, void 0, void 0, function () {
        var tester, results, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    tester = new securityTester_1.SecurityTester();
                    return [4 /*yield*/, tester.runAllTests()];
                case 1:
                    results = _a.sent();
                    return [2 /*return*/, c.json({
                            summary: {
                                total: results.length,
                                passed: results.filter(function (r) { return r.passed; }).length,
                                failed: results.filter(function (r) { return !r.passed; }).length,
                            },
                            results: results,
                        })];
                case 2:
                    error_2 = _a.sent();
                    return [2 /*return*/, c.json({
                            error: "Security test failed",
                            details: error_2 instanceof Error ? error_2.message : "Unknown error",
                        }, 500)];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    app.get("/security/report", function (c) { return __awaiter(void 0, void 0, void 0, function () {
        var tester, report, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    tester = new securityTester_1.SecurityTester();
                    return [4 /*yield*/, tester.generateSecurityReport()];
                case 1:
                    report = _a.sent();
                    c.header("Content-Type", "text/markdown");
                    return [2 /*return*/, c.text(report)];
                case 2:
                    error_3 = _a.sent();
                    return [2 /*return*/, c.json({
                            error: "Security report generation failed",
                            details: error_3 instanceof Error ? error_3.message : "Unknown error",
                        }, 500)];
                case 3: return [2 /*return*/];
            }
        });
    }); });
}
// Initialize enhanced generation API
try {
    await (0, generate_1.initializeGenerationAPI)();
    console.log("✅ Enhanced generation API initialized");
}
catch (error) {
    console.error("❌ Failed to initialize enhanced generation API:", error);
}
// Initialize knowledge base API
if (databaseHealthy) {
    try {
        await (0, kb_1.initializeKBAPI)();
        console.log("✅ Knowledge base API initialized");
    }
    catch (error) {
        console.error("❌ Failed to initialize knowledge base API:", error);
    }
}
// Mount API routes
app.route("/api/feedback", feedback_1.default);
app.route("/api/cache", cache_2.default);
app.route("/api/kb", kb_1.default);
app.route("/api", generate_1.default);
// SVG generation endpoint
app.openapi(openapi_1.generateSVGRoute, function (c) { return __awaiter(void 0, void 0, void 0, function () {
    var request, cachedResult, result_1, generator, result_2, result, eventId, error_4, response, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 9, , 10]);
                request = c.req.valid("json");
                cachedResult = responseCache.get(request);
                if (cachedResult) {
                    result_1 = __assign({}, cachedResult);
                    result_1.warnings = __spreadArray(__spreadArray([], result_1.warnings, true), ["Response served from cache"], false);
                    return [2 /*return*/, c.json(result_1, 200)];
                }
                generator = ruleBasedGenerator;
                if (!(request.model === "llm")) return [3 /*break*/, 3];
                if (!openaiGenerator) return [3 /*break*/, 1];
                generator = openaiGenerator;
                return [3 /*break*/, 3];
            case 1: return [4 /*yield*/, ruleBasedGenerator.generate(request)];
            case 2:
                result_2 = _a.sent();
                result_2.warnings.push("LLM generation not available - using rule-based fallback");
                // Cache the result
                responseCache.set(request, result_2);
                return [2 /*return*/, c.json(result_2, 200)];
            case 3: return [4 /*yield*/, generator.generate(request)];
            case 4:
                result = _a.sent();
                eventId = void 0;
                if (!(preferenceEngine && result.svg)) return [3 /*break*/, 8];
                _a.label = 5;
            case 5:
                _a.trys.push([5, 7, , 8]);
                return [4 /*yield*/, preferenceEngine.logGenerationEvent({
                        userId: request.userId, // Add userId to request schema if needed
                        prompt: request.prompt,
                        intent: undefined, // Will be populated when structured pipeline is implemented
                        plan: undefined, // Will be populated when structured pipeline is implemented
                        doc: undefined, // Will be populated when structured pipeline is implemented
                        usedObjectIds: [], // Will be populated when KB integration is complete
                        modelInfo: {
                            model: request.model || "rule-based",
                            timestamp: new Date().toISOString(),
                        },
                    })];
            case 6:
                eventId = _a.sent();
                return [3 /*break*/, 8];
            case 7:
                error_4 = _a.sent();
                console.warn("Failed to log generation event:", error_4);
                return [3 /*break*/, 8];
            case 8:
                // Check if generation had critical errors
                if (result.errors.length > 0 && !result.svg) {
                    return [2 /*return*/, c.json({
                            error: "Generation failed",
                            details: result.errors,
                        }, 400)];
                }
                // Cache successful results
                if (result.errors.length === 0) {
                    responseCache.set(request, result);
                }
                response = eventId ? __assign(__assign({}, result), { eventId: eventId }) : result;
                return [2 /*return*/, c.json(response, 200)];
            case 9:
                error_5 = _a.sent();
                console.error("Generation error:", error_5);
                return [2 /*return*/, c.json({
                        error: "Internal server error",
                        details: [error_5 instanceof Error ? error_5.message : "Unknown error"],
                    }, 500)];
            case 10: return [2 /*return*/];
        }
    });
}); });
// Cache management endpoints (development only)
if (process.env.NODE_ENV !== "production") {
    app.get("/cache/stats", function (c) {
        var stats = responseCache.getStats();
        return c.json(stats);
    });
    app.post("/cache/clear", function (c) {
        responseCache.clear();
        return c.json({ message: "Cache cleared successfully" });
    });
    app.get("/cache/entries", function (c) {
        var entries = responseCache.getEntries();
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
        description: "API for generating SVG images from natural language prompts using AI and rule-based methods.",
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
app.get("/docs", (0, swagger_ui_1.swaggerUI)({ url: "/openapi.json" }));
var port = process.env.PORT || 3001;
console.log("\uD83D\uDE80 Server running on port ".concat(port));
console.log("\uD83D\uDCDA API Documentation: http://localhost:".concat(port, "/docs"));
console.log("\uD83D\uDCCB OpenAPI Spec: http://localhost:".concat(port, "/openapi.json"));
exports.default = {
    port: port,
    fetch: app.fetch,
};
