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
var hono_1 = require("hono");
var zod_1 = require("zod");
var PreferenceEngine_1 = require("../services/PreferenceEngine");
var KnowledgeBaseManager_1 = require("../services/KnowledgeBaseManager");
var app = new hono_1.Hono();
// Validation schemas
var FeedbackRequestSchema = zod_1.z.object({
    eventId: zod_1.z.number().int().positive(),
    signal: zod_1.z.enum([
        "kept",
        "edited",
        "regenerated",
        "exported",
        "favorited",
        "reported",
    ]),
    userId: zod_1.z.string().optional(),
    notes: zod_1.z.string().max(500).optional(),
});
var ImplicitFeedbackSchema = zod_1.z.object({
    eventId: zod_1.z.number().int().positive(),
    signal: zod_1.z.enum(["exported", "regenerated"]),
    userId: zod_1.z.string().optional(),
});
var PreferencesQuerySchema = zod_1.z.object({
    userId: zod_1.z.string().optional(),
});
var LearningMetricsQuerySchema = zod_1.z.object({
    userId: zod_1.z.string().optional(),
});
// Initialize services
var preferenceEngine = PreferenceEngine_1.PreferenceEngine.getInstance();
var kbManager = KnowledgeBaseManager_1.KnowledgeBaseManager.getInstance();
// Record explicit feedback
app.post("/", function (c) { return __awaiter(void 0, void 0, void 0, function () {
    var body, validated, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, c.req.json()];
            case 1:
                body = _a.sent();
                validated = FeedbackRequestSchema.parse(body);
                return [4 /*yield*/, preferenceEngine.recordFeedback(validated.eventId, validated.signal, validated.userId, validated.notes)];
            case 2:
                _a.sent();
                return [2 /*return*/, c.json({
                        success: true,
                        message: "Feedback recorded successfully",
                    })];
            case 3:
                error_1 = _a.sent();
                console.error("Error recording feedback:", error_1);
                if (error_1 instanceof zod_1.z.ZodError) {
                    return [2 /*return*/, c.json({
                            success: false,
                            error: "Invalid request data",
                            details: error_1.errors,
                        }, 400)];
                }
                return [2 /*return*/, c.json({
                        success: false,
                        error: error_1 instanceof Error ? error_1.message : "Failed to record feedback",
                    }, 500)];
            case 4: return [2 /*return*/];
        }
    });
}); });
// Record implicit feedback (for automatic signals)
app.post("/implicit", function (c) { return __awaiter(void 0, void 0, void 0, function () {
    var body, validated, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, c.req.json()];
            case 1:
                body = _a.sent();
                validated = ImplicitFeedbackSchema.parse(body);
                return [4 /*yield*/, preferenceEngine.recordImplicitFeedback(validated.eventId, validated.signal, validated.userId)];
            case 2:
                _a.sent();
                return [2 /*return*/, c.json({
                        success: true,
                        message: "Implicit feedback recorded successfully",
                    })];
            case 3:
                error_2 = _a.sent();
                console.error("Error recording implicit feedback:", error_2);
                if (error_2 instanceof zod_1.z.ZodError) {
                    return [2 /*return*/, c.json({
                            success: false,
                            error: "Invalid request data",
                            details: error_2.errors,
                        }, 400)];
                }
                return [2 /*return*/, c.json({
                        success: false,
                        error: error_2 instanceof Error
                            ? error_2.message
                            : "Failed to record implicit feedback",
                    }, 500)];
            case 4: return [2 /*return*/];
        }
    });
}); });
// Get user preferences
app.get("/preferences", function (c) { return __awaiter(void 0, void 0, void 0, function () {
    var query, validated;
    return __generator(this, function (_a) {
        try {
            query = c.req.query();
            validated = PreferencesQuerySchema.parse(query);
            // This would require exposing preferences from KnowledgeBaseManager
            // For now, return a placeholder response
            return [2 /*return*/, c.json({
                    success: true,
                    preferences: {
                        tagWeights: {},
                        kindWeights: {
                            style_pack: 1.0,
                            motif: 1.0,
                            glossary: 0.8,
                            rule: 0.6,
                            fewshot: 0.9,
                        },
                        qualityThreshold: 0.3,
                        diversityWeight: 0.3,
                        updatedAt: new Date().toISOString(),
                    },
                })];
        }
        catch (error) {
            console.error("Error getting preferences:", error);
            if (error instanceof zod_1.z.ZodError) {
                return [2 /*return*/, c.json({
                        success: false,
                        error: "Invalid query parameters",
                        details: error.errors,
                    }, 400)];
            }
            return [2 /*return*/, c.json({
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to get preferences",
                }, 500)];
        }
        return [2 /*return*/];
    });
}); });
// Update user preferences manually
app.put("/preferences", function (c) { return __awaiter(void 0, void 0, void 0, function () {
    var body, userId, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, c.req.json()];
            case 1:
                body = _a.sent();
                userId = body.userId;
                if (!userId) {
                    return [2 /*return*/, c.json({
                            success: false,
                            error: "User ID is required",
                        }, 400)];
                }
                // Trigger preference update
                return [4 /*yield*/, preferenceEngine.updateUserPreferences(userId)];
            case 2:
                // Trigger preference update
                _a.sent();
                return [2 /*return*/, c.json({
                        success: true,
                        message: "Preferences updated successfully",
                    })];
            case 3:
                error_3 = _a.sent();
                console.error("Error updating preferences:", error_3);
                return [2 /*return*/, c.json({
                        success: false,
                        error: error_3 instanceof Error
                            ? error_3.message
                            : "Failed to update preferences",
                    }, 500)];
            case 4: return [2 /*return*/];
        }
    });
}); });
// Get learning metrics
app.get("/metrics", function (c) { return __awaiter(void 0, void 0, void 0, function () {
    var query, validated, metrics, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                query = c.req.query();
                validated = LearningMetricsQuerySchema.parse(query);
                return [4 /*yield*/, preferenceEngine.getLearningMetrics(validated.userId)];
            case 1:
                metrics = _a.sent();
                return [2 /*return*/, c.json({
                        success: true,
                        metrics: metrics,
                    })];
            case 2:
                error_4 = _a.sent();
                console.error("Error getting learning metrics:", error_4);
                if (error_4 instanceof zod_1.z.ZodError) {
                    return [2 /*return*/, c.json({
                            success: false,
                            error: "Invalid query parameters",
                            details: error_4.errors,
                        }, 400)];
                }
                return [2 /*return*/, c.json({
                        success: false,
                        error: error_4 instanceof Error
                            ? error_4.message
                            : "Failed to get learning metrics",
                    }, 500)];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Get generation event details
app.get("/events/:eventId", function (c) { return __awaiter(void 0, void 0, void 0, function () {
    var eventId, event_1, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                eventId = parseInt(c.req.param("eventId"));
                if (isNaN(eventId)) {
                    return [2 /*return*/, c.json({
                            success: false,
                            error: "Invalid event ID",
                        }, 400)];
                }
                return [4 /*yield*/, preferenceEngine.getGenerationEvent(eventId)];
            case 1:
                event_1 = _a.sent();
                if (!event_1) {
                    return [2 /*return*/, c.json({
                            success: false,
                            error: "Event not found",
                        }, 404)];
                }
                return [2 /*return*/, c.json({
                        success: true,
                        event: {
                            id: event_1.id,
                            userId: event_1.userId,
                            prompt: event_1.prompt,
                            usedObjectIds: event_1.usedObjectIds,
                            createdAt: event_1.createdAt,
                            // Don't expose internal data like intent, plan, doc
                        },
                    })];
            case 2:
                error_5 = _a.sent();
                console.error("Error getting generation event:", error_5);
                return [2 /*return*/, c.json({
                        success: false,
                        error: error_5 instanceof Error
                            ? error_5.message
                            : "Failed to get generation event",
                    }, 500)];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Admin endpoints for system maintenance
app.post("/admin/deprecate-stale", function (c) { return __awaiter(void 0, void 0, void 0, function () {
    var deprecatedCount, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, preferenceEngine.deprecateStaleObjects()];
            case 1:
                deprecatedCount = _a.sent();
                return [2 /*return*/, c.json({
                        success: true,
                        message: "Deprecated ".concat(deprecatedCount, " stale objects"),
                        deprecatedCount: deprecatedCount,
                    })];
            case 2:
                error_6 = _a.sent();
                console.error("Error deprecating stale objects:", error_6);
                return [2 /*return*/, c.json({
                        success: false,
                        error: error_6 instanceof Error
                            ? error_6.message
                            : "Failed to deprecate stale objects",
                    }, 500)];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.post("/admin/update-global-preferences", function (c) { return __awaiter(void 0, void 0, void 0, function () {
    var error_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                // This should be protected with admin authentication in production
                return [4 /*yield*/, preferenceEngine.updateGlobalPreferences()];
            case 1:
                // This should be protected with admin authentication in production
                _a.sent();
                return [2 /*return*/, c.json({
                        success: true,
                        message: "Global preferences updated successfully",
                    })];
            case 2:
                error_7 = _a.sent();
                console.error("Error updating global preferences:", error_7);
                return [2 /*return*/, c.json({
                        success: false,
                        error: error_7 instanceof Error
                            ? error_7.message
                            : "Failed to update global preferences",
                    }, 500)];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.post("/admin/cleanup", function (c) { return __awaiter(void 0, void 0, void 0, function () {
    var body, retentionDays, cleaned, error_8;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, c.req.json()];
            case 1:
                body = _a.sent();
                retentionDays = body.retentionDays || 90;
                return [4 /*yield*/, preferenceEngine.cleanupOldData(retentionDays)];
            case 2:
                cleaned = _a.sent();
                return [2 /*return*/, c.json({
                        success: true,
                        message: "Cleaned up old data: ".concat(cleaned.events, " events, ").concat(cleaned.feedback, " feedback entries"),
                        cleaned: cleaned,
                    })];
            case 3:
                error_8 = _a.sent();
                console.error("Error cleaning up old data:", error_8);
                return [2 /*return*/, c.json({
                        success: false,
                        error: error_8 instanceof Error ? error_8.message : "Failed to cleanup old data",
                    }, 500)];
            case 4: return [2 /*return*/];
        }
    });
}); });
exports.default = app;
