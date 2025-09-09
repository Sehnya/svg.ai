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
exports.initializeGenerationAPI = initializeGenerationAPI;
/**
 * Enhanced SVG generation API with structured pipeline integration
 */
var zod_openapi_1 = require("@hono/zod-openapi");
var zod_1 = require("zod");
var GenerationPipeline_js_1 = require("../services/GenerationPipeline.js");
var KnowledgeBaseManager_js_1 = require("../services/KnowledgeBaseManager.js");
var RuleBasedGenerator_js_1 = require("../services/RuleBasedGenerator.js");
var OpenAIGenerator_js_1 = require("../services/OpenAIGenerator.js");
var cache_js_1 = require("../utils/cache.js");
var PreferenceEngine_js_1 = require("../services/PreferenceEngine.js");
var app = new zod_openapi_1.OpenAPIHono();
// Enhanced request schema for pipeline integration
var GenerationRequestSchema = zod_1.z.object({
    prompt: zod_1.z.string().min(1).max(500),
    size: zod_1.z
        .object({
        width: zod_1.z.number().min(16).max(2048).default(400),
        height: zod_1.z.number().min(16).max(2048).default(400),
    })
        .optional(),
    palette: zod_1.z
        .array(zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/))
        .max(10)
        .optional(),
    seed: zod_1.z.number().optional(),
    userId: zod_1.z.string().optional(),
    model: zod_1.z.enum(["pipeline", "llm", "rule-based"]).default("pipeline"),
    temperature: zod_1.z.number().min(0).max(2).default(0.2).optional(),
    maxRetries: zod_1.z.number().min(0).max(5).default(2).optional(),
    fallbackEnabled: zod_1.z.boolean().default(true).optional(),
});
var GenerationResponseSchema = zod_1.z.object({
    svg: zod_1.z.string(),
    metadata: zod_1.z.object({
        prompt: zod_1.z.string(),
        seed: zod_1.z.number().optional(),
        palette: zod_1.z.array(zod_1.z.string()),
        description: zod_1.z.string(),
        generatedAt: zod_1.z.string(),
        model: zod_1.z.string().optional(),
        usedObjects: zod_1.z.array(zod_1.z.string()).optional(),
    }),
    layers: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string(),
        type: zod_1.z.string(),
        element: zod_1.z.string(),
        attributes: zod_1.z.record(zod_1.z.union([zod_1.z.string(), zod_1.z.number()])),
        metadata: zod_1.z
            .object({
            motif: zod_1.z.string().optional(),
            generated: zod_1.z.boolean().optional(),
            reused: zod_1.z.boolean().optional(),
        })
            .optional(),
    })),
    warnings: zod_1.z.array(zod_1.z.string()).optional(),
    errors: zod_1.z.array(zod_1.z.string()).optional(),
    eventId: zod_1.z.number().optional(),
});
// Initialize services
var pipeline = null;
var knowledgeBase = null;
var preferenceEngine = null;
var responseCache = null;
// Legacy generators for fallback
var ruleBasedGenerator = null;
var openaiGenerator = null;
// Initialize services
function initializeGenerationAPI() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            try {
                // Initialize pipeline
                pipeline = new GenerationPipeline_js_1.GenerationPipeline();
                console.log("✅ Generation pipeline initialized");
                // Initialize knowledge base if database is available
                try {
                    knowledgeBase = new KnowledgeBaseManager_js_1.KnowledgeBaseManager();
                    console.log("✅ Knowledge base manager initialized");
                }
                catch (error) {
                    console.warn("⚠️  Knowledge base initialization failed:", error);
                }
                // Initialize preference engine
                try {
                    preferenceEngine = PreferenceEngine_js_1.PreferenceEngine.getInstance();
                    console.log("✅ Preference engine initialized");
                }
                catch (error) {
                    console.warn("⚠️  Preference engine initialization failed:", error);
                }
                // Initialize cache
                responseCache = new cache_js_1.ResponseCache(parseInt(process.env.CACHE_MAX_SIZE || "1000"), parseInt(process.env.CACHE_TTL_MINUTES || "60"));
                // Initialize fallback generators
                ruleBasedGenerator = new RuleBasedGenerator_js_1.RuleBasedGenerator();
                if (process.env.OPENAI_API_KEY) {
                    openaiGenerator = new OpenAIGenerator_js_1.OpenAIGenerator();
                    console.log("✅ OpenAI generator available for fallback");
                }
            }
            catch (error) {
                console.error("❌ Failed to initialize generation API:", error);
                throw error;
            }
            return [2 /*return*/];
        });
    });
}
// Enhanced generation route
var generateRoute = {
    method: "post",
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
                    schema: zod_1.z.object({
                        error: zod_1.z.string(),
                        details: zod_1.z.array(zod_1.z.string()),
                    }),
                },
            },
            description: "Invalid request",
        },
        500: {
            content: {
                "application/json": {
                    schema: zod_1.z.object({
                        error: zod_1.z.string(),
                        details: zod_1.z.array(zod_1.z.string()),
                    }),
                },
            },
            description: "Internal server error",
        },
    },
    tags: ["SVG Generation"],
    summary: "Generate SVG from prompt",
    description: "Generate an SVG image from a natural language prompt using the structured pipeline or fallback methods",
};
app.openapi(generateRoute, function (c) { return __awaiter(void 0, void 0, void 0, function () {
    var request, cachedResult, result_1, result, _a, eventId, error_1, response, error_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 14, , 15]);
                request = c.req.valid("json");
                // Check cache first
                if (responseCache) {
                    cachedResult = responseCache.get(request);
                    if (cachedResult) {
                        result_1 = __assign({}, cachedResult);
                        result_1.warnings = __spreadArray(__spreadArray([], (result_1.warnings || []), true), [
                            "Response served from cache",
                        ], false);
                        return [2 /*return*/, c.json(result_1, 200)];
                    }
                }
                result = void 0;
                _a = request.model;
                switch (_a) {
                    case "pipeline": return [3 /*break*/, 1];
                    case "llm": return [3 /*break*/, 3];
                    case "rule-based": return [3 /*break*/, 5];
                }
                return [3 /*break*/, 7];
            case 1: return [4 /*yield*/, generateWithPipeline(request)];
            case 2:
                result = _b.sent();
                return [3 /*break*/, 9];
            case 3: return [4 /*yield*/, generateWithLLM(request)];
            case 4:
                result = _b.sent();
                return [3 /*break*/, 9];
            case 5: return [4 /*yield*/, generateWithRuleBased(request)];
            case 6:
                result = _b.sent();
                return [3 /*break*/, 9];
            case 7: return [4 /*yield*/, generateWithPipeline(request)];
            case 8:
                result = _b.sent();
                _b.label = 9;
            case 9:
                eventId = void 0;
                if (!(preferenceEngine && result.svg)) return [3 /*break*/, 13];
                _b.label = 10;
            case 10:
                _b.trys.push([10, 12, , 13]);
                return [4 /*yield*/, preferenceEngine.logGenerationEvent({
                        userId: request.userId,
                        prompt: request.prompt,
                        intent: result.intent, // Will be available from pipeline
                        plan: result.plan, // Will be available from pipeline
                        doc: result.document, // Will be available from pipeline
                        usedObjectIds: result.metadata.usedObjects || [],
                        modelInfo: {
                            model: request.model,
                            temperature: request.temperature,
                            timestamp: new Date().toISOString(),
                        },
                    })];
            case 11:
                eventId = _b.sent();
                return [3 /*break*/, 13];
            case 12:
                error_1 = _b.sent();
                console.warn("Failed to log generation event:", error_1);
                return [3 /*break*/, 13];
            case 13:
                // Check if generation had critical errors
                if (result.errors && result.errors.length > 0 && !result.svg) {
                    return [2 /*return*/, c.json({
                            error: "Generation failed",
                            details: result.errors,
                        }, 400)];
                }
                // Cache successful results
                if (responseCache && (!result.errors || result.errors.length === 0)) {
                    responseCache.set(request, result);
                }
                response = eventId ? __assign(__assign({}, result), { eventId: eventId }) : result;
                return [2 /*return*/, c.json(response, 200)];
            case 14:
                error_2 = _b.sent();
                console.error("Generation error:", error_2);
                return [2 /*return*/, c.json({
                        error: "Internal server error",
                        details: [error_2 instanceof Error ? error_2.message : "Unknown error"],
                    }, 500)];
            case 15: return [2 /*return*/];
        }
    });
}); });
function generateWithPipeline(request) {
    return __awaiter(this, void 0, void 0, function () {
        var grounding, error_3, context, result, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!pipeline) {
                        throw new Error("Pipeline not initialized");
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 7, , 8]);
                    grounding = {};
                    if (!knowledgeBase) return [3 /*break*/, 5];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, knowledgeBase.retrieveGrounding(request.prompt, request.userId)];
                case 3:
                    grounding = _a.sent();
                    return [3 /*break*/, 5];
                case 4:
                    error_3 = _a.sent();
                    console.warn("Failed to retrieve grounding data:", error_3);
                    return [3 /*break*/, 5];
                case 5:
                    context = {
                        temperature: request.temperature || 0.2,
                        maxRetries: request.maxRetries || 2,
                        fallbackToRuleBased: request.fallbackEnabled !== false,
                    };
                    return [4 /*yield*/, pipeline.process(request, grounding, context)];
                case 6:
                    result = _a.sent();
                    return [2 /*return*/, result];
                case 7:
                    error_4 = _a.sent();
                    console.error("Pipeline generation failed:", error_4);
                    // Fallback to rule-based if enabled
                    if (request.fallbackEnabled !== false) {
                        console.log("Falling back to rule-based generation");
                        return [2 /*return*/, generateWithRuleBased(request)];
                    }
                    throw error_4;
                case 8: return [2 /*return*/];
            }
        });
    });
}
function generateWithLLM(request) {
    return __awaiter(this, void 0, void 0, function () {
        var result, result, error_5, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!!openaiGenerator) return [3 /*break*/, 3];
                    if (!pipeline) return [3 /*break*/, 2];
                    return [4 /*yield*/, generateWithPipeline(request)];
                case 1:
                    result = _a.sent();
                    result.warnings = __spreadArray(__spreadArray([], (result.warnings || []), true), [
                        "LLM not available - used pipeline",
                    ], false);
                    return [2 /*return*/, result];
                case 2: return [2 /*return*/, generateWithRuleBased(request)];
                case 3:
                    _a.trys.push([3, 5, , 9]);
                    return [4 /*yield*/, openaiGenerator.generate(request)];
                case 4:
                    result = _a.sent();
                    return [2 /*return*/, result];
                case 5:
                    error_5 = _a.sent();
                    console.error("LLM generation failed:", error_5);
                    if (!(request.fallbackEnabled !== false)) return [3 /*break*/, 8];
                    if (!pipeline) return [3 /*break*/, 7];
                    return [4 /*yield*/, generateWithPipeline(request)];
                case 6:
                    result = _a.sent();
                    result.warnings = __spreadArray(__spreadArray([], (result.warnings || []), true), [
                        "LLM failed - used pipeline",
                    ], false);
                    return [2 /*return*/, result];
                case 7: return [2 /*return*/, generateWithRuleBased(request)];
                case 8: throw error_5;
                case 9: return [2 /*return*/];
            }
        });
    });
}
function generateWithRuleBased(request) {
    return __awaiter(this, void 0, void 0, function () {
        var result, error_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!ruleBasedGenerator) {
                        throw new Error("Rule-based generator not initialized");
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, ruleBasedGenerator.generate(request)];
                case 2:
                    result = _a.sent();
                    result.warnings = __spreadArray(__spreadArray([], (result.warnings || []), true), [
                        "Used rule-based generation",
                    ], false);
                    return [2 /*return*/, result];
                case 3:
                    error_6 = _a.sent();
                    console.error("Rule-based generation failed:", error_6);
                    throw error_6;
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Export the app
exports.default = app;
