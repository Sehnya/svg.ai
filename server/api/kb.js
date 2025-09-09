"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeKBAPI = initializeKBAPI;
/**
 * Knowledge Base API endpoints
 */
var zod_openapi_1 = require("@hono/zod-openapi");
var zod_1 = require("zod");
var KnowledgeBaseManager_js_1 = require("../services/KnowledgeBaseManager.js");
var PreferenceEngine_js_1 = require("../services/PreferenceEngine.js");
var app = new zod_openapi_1.OpenAPIHono();
// KB Object schemas
var KBObjectSchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    kind: zod_1.z.enum(["style_pack", "motif", "glossary", "rule", "fewshot"]),
    title: zod_1.z.string().min(1).max(200),
    body: zod_1.z.any(),
    tags: zod_1.z.array(zod_1.z.string()).max(20).default([]),
    version: zod_1.z
        .string()
        .regex(/^\d+\.\d+\.\d+$/)
        .optional(),
    status: zod_1.z.enum(["active", "deprecated", "experimental"]).default("active"),
    parent_id: zod_1.z.string().optional(),
});
var FeedbackSchema = zod_1.z.object({
    event_id: zod_1.z.number().int().positive(),
    user_id: zod_1.z.string().optional(),
    signal: zod_1.z.enum([
        "kept",
        "edited",
        "regenerated",
        "exported",
        "favorited",
        "reported",
    ]),
    notes: zod_1.z.string().max(500).optional(),
});
// Initialize services
var knowledgeBase = null;
var preferenceEngine = null;
function initializeKBAPI() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            try {
                knowledgeBase = new KnowledgeBaseManager_js_1.KnowledgeBaseManager();
                preferenceEngine = PreferenceEngine_js_1.PreferenceEngine.getInstance();
                console.log("✅ Knowledge Base API initialized");
            }
            catch (error) {
                console.warn("⚠️  Knowledge Base API initialization failed:", error);
            }
            return [2 /*return*/];
        });
    });
}
// CRUD operations for KB objects
var createObjectRoute = {
    method: "post",
    path: "/objects",
    request: {
        body: {
            content: {
                "application/json": {
                    schema: KBObjectSchema,
                },
            },
        },
    },
    responses: {
        201: {
            content: {
                "application/json": {
                    schema: zod_1.z.object({
                        id: zod_1.z.string(),
                        message: zod_1.z.string(),
                    }),
                },
            },
            description: "Object created successfully",
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
    },
    tags: ["Knowledge Base"],
    summary: "Create KB object",
    description: "Create a new knowledge base object with validation and compatibility testing",
};
app.openapi(createObjectRoute, function (c) { return __awaiter(void 0, void 0, void 0, function () {
    var objectData, tokenCount, id, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!knowledgeBase) {
                    return [2 /*return*/, c.json({ error: "Knowledge base not available", details: [] }, 503)];
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                objectData = c.req.valid("json");
                tokenCount = estimateTokens(JSON.stringify(objectData.body));
                if (tokenCount > 500) {
                    return [2 /*return*/, c.json({
                            error: "Token budget exceeded",
                            details: ["Object body contains ~".concat(tokenCount, " tokens, limit is 500")],
                        }, 400)];
                }
                return [4 /*yield*/, knowledgeBase.createObject(objectData)];
            case 2:
                id = _a.sent();
                return [2 /*return*/, c.json({ id: id, message: "Object created successfully" }, 201)];
            case 3:
                error_1 = _a.sent();
                console.error("Failed to create KB object:", error_1);
                return [2 /*return*/, c.json({
                        error: "Failed to create object",
                        details: [error_1 instanceof Error ? error_1.message : "Unknown error"],
                    }, 400)];
            case 4: return [2 /*return*/];
        }
    });
}); });
// Get KB objects with filtering
var getObjectsRoute = {
    method: "get",
    path: "/objects",
    request: {
        query: zod_1.z.object({
            kind: zod_1.z
                .enum(["style_pack", "motif", "glossary", "rule", "fewshot"])
                .optional(),
            status: zod_1.z.enum(["active", "deprecated", "experimental"]).optional(),
            tags: zod_1.z.string().optional(), // Comma-separated tags
            limit: zod_1.z.string().regex(/^\d+$/).transform(Number).default("50"),
            offset: zod_1.z.string().regex(/^\d+$/).transform(Number).default("0"),
        }),
    },
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: zod_1.z.object({
                        objects: zod_1.z.array(zod_1.z.any()),
                        total: zod_1.z.number(),
                        limit: zod_1.z.number(),
                        offset: zod_1.z.number(),
                    }),
                },
            },
            description: "Objects retrieved successfully",
        },
    },
    tags: ["Knowledge Base"],
    summary: "Get KB objects",
    description: "Retrieve knowledge base objects with optional filtering",
};
app.openapi(getObjectsRoute, function (c) { return __awaiter(void 0, void 0, void 0, function () {
    var query, filters, result, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!knowledgeBase) {
                    return [2 /*return*/, c.json({ error: "Knowledge base not available" }, 503)];
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                query = c.req.valid("query");
                filters = {};
                if (query.kind)
                    filters.kind = query.kind;
                if (query.status)
                    filters.status = query.status;
                if (query.tags)
                    filters.tags = query.tags.split(",");
                return [4 /*yield*/, knowledgeBase.getObjects(filters, query.limit, query.offset)];
            case 2:
                result = _a.sent();
                return [2 /*return*/, c.json(result, 200)];
            case 3:
                error_2 = _a.sent();
                console.error("Failed to get KB objects:", error_2);
                return [2 /*return*/, c.json({
                        error: "Failed to retrieve objects",
                        details: [error_2 instanceof Error ? error_2.message : "Unknown error"],
                    }, 500)];
            case 4: return [2 /*return*/];
        }
    });
}); });
// Update KB object
var updateObjectRoute = {
    method: "put",
    path: "/objects/{id}",
    request: {
        param: zod_1.z.object({
            id: zod_1.z.string(),
        }),
        body: {
            content: {
                "application/json": {
                    schema: KBObjectSchema.partial(),
                },
            },
        },
    },
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: zod_1.z.object({
                        message: zod_1.z.string(),
                    }),
                },
            },
            description: "Object updated successfully",
        },
    },
    tags: ["Knowledge Base"],
    summary: "Update KB object",
    description: "Update an existing knowledge base object",
};
app.openapi(updateObjectRoute, function (c) { return __awaiter(void 0, void 0, void 0, function () {
    var id, updates, tokenCount, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!knowledgeBase) {
                    return [2 /*return*/, c.json({ error: "Knowledge base not available" }, 503)];
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                id = c.req.valid("param").id;
                updates = c.req.valid("json");
                // Validate token budget if body is being updated
                if (updates.body) {
                    tokenCount = estimateTokens(JSON.stringify(updates.body));
                    if (tokenCount > 500) {
                        return [2 /*return*/, c.json({
                                error: "Token budget exceeded",
                                details: [
                                    "Object body contains ~".concat(tokenCount, " tokens, limit is 500"),
                                ],
                            }, 400)];
                    }
                }
                return [4 /*yield*/, knowledgeBase.updateObject(id, updates)];
            case 2:
                _a.sent();
                return [2 /*return*/, c.json({ message: "Object updated successfully" }, 200)];
            case 3:
                error_3 = _a.sent();
                console.error("Failed to update KB object:", error_3);
                return [2 /*return*/, c.json({
                        error: "Failed to update object",
                        details: [error_3 instanceof Error ? error_3.message : "Unknown error"],
                    }, 400)];
            case 4: return [2 /*return*/];
        }
    });
}); });
// Delete KB object
var deleteObjectRoute = {
    method: "delete",
    path: "/objects/{id}",
    request: {
        param: zod_1.z.object({
            id: zod_1.z.string(),
        }),
    },
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: zod_1.z.object({
                        message: zod_1.z.string(),
                    }),
                },
            },
            description: "Object deleted successfully",
        },
    },
    tags: ["Knowledge Base"],
    summary: "Delete KB object",
    description: "Delete a knowledge base object",
};
app.openapi(deleteObjectRoute, function (c) { return __awaiter(void 0, void 0, void 0, function () {
    var id, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!knowledgeBase) {
                    return [2 /*return*/, c.json({ error: "Knowledge base not available" }, 503)];
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                id = c.req.valid("param").id;
                return [4 /*yield*/, knowledgeBase.deleteObject(id)];
            case 2:
                _a.sent();
                return [2 /*return*/, c.json({ message: "Object deleted successfully" }, 200)];
            case 3:
                error_4 = _a.sent();
                console.error("Failed to delete KB object:", error_4);
                return [2 /*return*/, c.json({
                        error: "Failed to delete object",
                        details: [error_4 instanceof Error ? error_4.message : "Unknown error"],
                    }, 400)];
            case 4: return [2 /*return*/];
        }
    });
}); });
// Record feedback
var recordFeedbackRoute = {
    method: "post",
    path: "/feedback",
    request: {
        body: {
            content: {
                "application/json": {
                    schema: FeedbackSchema,
                },
            },
        },
    },
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: zod_1.z.object({
                        message: zod_1.z.string(),
                    }),
                },
            },
            description: "Feedback recorded successfully",
        },
    },
    tags: ["Knowledge Base"],
    summary: "Record feedback",
    description: "Record user feedback for preference learning",
};
app.openapi(recordFeedbackRoute, function (c) { return __awaiter(void 0, void 0, void 0, function () {
    var feedback, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!preferenceEngine) {
                    return [2 /*return*/, c.json({ error: "Preference engine not available" }, 503)];
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                feedback = c.req.valid("json");
                return [4 /*yield*/, preferenceEngine.recordFeedback(feedback)];
            case 2:
                _a.sent();
                return [2 /*return*/, c.json({ message: "Feedback recorded successfully" }, 200)];
            case 3:
                error_5 = _a.sent();
                console.error("Failed to record feedback:", error_5);
                return [2 /*return*/, c.json({
                        error: "Failed to record feedback",
                        details: [error_5 instanceof Error ? error_5.message : "Unknown error"],
                    }, 400)];
            case 4: return [2 /*return*/];
        }
    });
}); });
// Get analytics
var getAnalyticsRoute = {
    method: "get",
    path: "/analytics",
    request: {
        query: zod_1.z.object({
            period: zod_1.z.enum(["day", "week", "month"]).default("week"),
            user_id: zod_1.z.string().optional(),
        }),
    },
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: zod_1.z.object({
                        usage: zod_1.z.any(),
                        quality: zod_1.z.any(),
                        preferences: zod_1.z.any(),
                    }),
                },
            },
            description: "Analytics retrieved successfully",
        },
    },
    tags: ["Knowledge Base"],
    summary: "Get analytics",
    description: "Get usage patterns and quality metrics",
};
app.openapi(getAnalyticsRoute, function (c) { return __awaiter(void 0, void 0, void 0, function () {
    var query, analytics, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!knowledgeBase) {
                    return [2 /*return*/, c.json({ error: "Knowledge base not available" }, 503)];
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                query = c.req.valid("query");
                return [4 /*yield*/, knowledgeBase.getAnalytics(query.period, query.user_id)];
            case 2:
                analytics = _a.sent();
                return [2 /*return*/, c.json(analytics, 200)];
            case 3:
                error_6 = _a.sent();
                console.error("Failed to get analytics:", error_6);
                return [2 /*return*/, c.json({
                        error: "Failed to retrieve analytics",
                        details: [error_6 instanceof Error ? error_6.message : "Unknown error"],
                    }, 500)];
            case 4: return [2 /*return*/];
        }
    });
}); });
// Get user preferences
var getPreferencesRoute = {
    method: "get",
    path: "/preferences/{userId}",
    request: {
        param: zod_1.z.object({
            userId: zod_1.z.string(),
        }),
    },
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: zod_1.z.object({
                        preferences: zod_1.z.any(),
                        updated_at: zod_1.z.string(),
                    }),
                },
            },
            description: "Preferences retrieved successfully",
        },
    },
    tags: ["Knowledge Base"],
    summary: "Get user preferences",
    description: "Get learned user preferences",
};
app.openapi(getPreferencesRoute, function (c) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, preferences, error_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!preferenceEngine) {
                    return [2 /*return*/, c.json({ error: "Preference engine not available" }, 503)];
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                userId = c.req.valid("param").userId;
                return [4 /*yield*/, preferenceEngine.getUserPreferences(userId)];
            case 2:
                preferences = _a.sent();
                return [2 /*return*/, c.json(preferences, 200)];
            case 3:
                error_7 = _a.sent();
                console.error("Failed to get preferences:", error_7);
                return [2 /*return*/, c.json({
                        error: "Failed to retrieve preferences",
                        details: [error_7 instanceof Error ? error_7.message : "Unknown error"],
                    }, 500)];
            case 4: return [2 /*return*/];
        }
    });
}); });
// Audit trail
var getAuditRoute = {
    method: "get",
    path: "/audit",
    request: {
        query: zod_1.z.object({
            object_id: zod_1.z.string().optional(),
            action: zod_1.z.string().optional(),
            limit: zod_1.z.string().regex(/^\d+$/).transform(Number).default("50"),
            offset: zod_1.z.string().regex(/^\d+$/).transform(Number).default("0"),
        }),
    },
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: zod_1.z.object({
                        entries: zod_1.z.array(zod_1.z.any()),
                        total: zod_1.z.number(),
                    }),
                },
            },
            description: "Audit trail retrieved successfully",
        },
    },
    tags: ["Knowledge Base"],
    summary: "Get audit trail",
    description: "Get audit trail for KB changes",
};
app.openapi(getAuditRoute, function (c) { return __awaiter(void 0, void 0, void 0, function () {
    var query, audit, error_8;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!knowledgeBase) {
                    return [2 /*return*/, c.json({ error: "Knowledge base not available" }, 503)];
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                query = c.req.valid("query");
                return [4 /*yield*/, knowledgeBase.getAuditTrail(query)];
            case 2:
                audit = _a.sent();
                return [2 /*return*/, c.json(audit, 200)];
            case 3:
                error_8 = _a.sent();
                console.error("Failed to get audit trail:", error_8);
                return [2 /*return*/, c.json({
                        error: "Failed to retrieve audit trail",
                        details: [error_8 instanceof Error ? error_8.message : "Unknown error"],
                    }, 500)];
            case 4: return [2 /*return*/];
        }
    });
}); });
// Utility function to estimate token count
function estimateTokens(text) {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
}
exports.default = app;
