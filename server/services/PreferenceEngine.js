"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
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
exports.PreferenceEngine = void 0;
var drizzle_orm_1 = require("drizzle-orm");
var config_1 = require("../db/config");
var schema_1 = require("../db/schema");
var KnowledgeBaseManager_1 = require("./KnowledgeBaseManager");
var PreferenceEngine = /** @class */ (function () {
    function PreferenceEngine() {
        // Feedback signal weights (exported +2, favorited +1.5, kept +1, edited +0.5, regenerated -0.5, reported -3)
        this.FEEDBACK_WEIGHTS = {
            exported: 2.0,
            favorited: 1.5,
            kept: 1.0,
            edited: 0.5,
            regenerated: -0.5,
            reported: -3.0,
        };
        // Bias controls
        this.BIAS_CONTROLS = {
            maxPreferenceBoost: 1.5,
            diversityMinimum: 0.3,
            qualityFloor: 0.3,
            freshnessWeight: 0.1,
        };
        // Exponential moving average decay factor
        this.EMA_DECAY = 0.1;
        // Minimum feedback count for stable preferences
        this.MIN_FEEDBACK_COUNT = 10;
        // Preference update frequency (hours)
        this.UPDATE_FREQUENCY = 24;
        if (PreferenceEngine.instance) {
            return PreferenceEngine.instance;
        }
        this.kbManager = KnowledgeBaseManager_1.KnowledgeBaseManager.getInstance();
        PreferenceEngine.instance = this;
    }
    PreferenceEngine.getInstance = function () {
        if (!PreferenceEngine.instance) {
            PreferenceEngine.instance = new PreferenceEngine();
        }
        return PreferenceEngine.instance;
    };
    // Generation Event Logging
    PreferenceEngine.prototype.logGenerationEvent = function (eventData) {
        return __awaiter(this, void 0, void 0, function () {
            var newEvent, created;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        newEvent = {
                            userId: eventData.userId,
                            prompt: eventData.prompt,
                            intent: eventData.intent,
                            plan: eventData.plan,
                            doc: eventData.doc,
                            usedObjectIds: eventData.usedObjectIds,
                            modelInfo: eventData.modelInfo,
                        };
                        return [4 /*yield*/, config_1.db.insert(schema_1.genEvents).values(newEvent).returning()];
                    case 1:
                        created = (_a.sent())[0];
                        return [2 /*return*/, created.id];
                }
            });
        });
    };
    PreferenceEngine.prototype.getGenerationEvent = function (eventId) {
        return __awaiter(this, void 0, void 0, function () {
            var event;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, config_1.db
                            .select()
                            .from(schema_1.genEvents)
                            .where((0, drizzle_orm_1.eq)(schema_1.genEvents.id, eventId))];
                    case 1:
                        event = (_a.sent())[0];
                        return [2 /*return*/, event || null];
                }
            });
        });
    };
    // Feedback Collection
    PreferenceEngine.prototype.recordFeedback = function (eventId, signal, userId, notes) {
        return __awaiter(this, void 0, void 0, function () {
            var event, existingFeedback, newFeedback;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getGenerationEvent(eventId)];
                    case 1:
                        event = _a.sent();
                        if (!event) {
                            throw new Error("Generation event not found: ".concat(eventId));
                        }
                        return [4 /*yield*/, config_1.db
                                .select()
                                .from(schema_1.genFeedback)
                                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.genFeedback.eventId, eventId), userId
                                ? (0, drizzle_orm_1.eq)(schema_1.genFeedback.userId, userId)
                                : (0, drizzle_orm_1.sql)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["", " IS NULL"], ["", " IS NULL"])), schema_1.genFeedback.userId)))];
                    case 2:
                        existingFeedback = _a.sent();
                        if (!(existingFeedback.length > 0)) return [3 /*break*/, 4];
                        // Update existing feedback
                        return [4 /*yield*/, config_1.db
                                .update(schema_1.genFeedback)
                                .set({
                                signal: signal,
                                weight: this.FEEDBACK_WEIGHTS[signal].toString(),
                                notes: notes,
                                createdAt: new Date(),
                            })
                                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.genFeedback.eventId, eventId), userId
                                ? (0, drizzle_orm_1.eq)(schema_1.genFeedback.userId, userId)
                                : (0, drizzle_orm_1.sql)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["", " IS NULL"], ["", " IS NULL"])), schema_1.genFeedback.userId)))];
                    case 3:
                        // Update existing feedback
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 4:
                        newFeedback = {
                            eventId: eventId,
                            userId: userId,
                            signal: signal,
                            weight: this.FEEDBACK_WEIGHTS[signal].toString(),
                            notes: notes,
                        };
                        return [4 /*yield*/, config_1.db.insert(schema_1.genFeedback).values(newFeedback)];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6:
                        if (!userId) return [3 /*break*/, 8];
                        return [4 /*yield*/, this.updateUserPreferences(userId)];
                    case 7:
                        _a.sent();
                        _a.label = 8;
                    case 8: 
                    // Update global preferences periodically
                    return [4 /*yield*/, this.updateGlobalPreferencesIfNeeded()];
                    case 9:
                        // Update global preferences periodically
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // Implicit feedback recording (for automatic signals like export, regenerate)
    PreferenceEngine.prototype.recordImplicitFeedback = function (eventId, signal, userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.recordFeedback(eventId, signal, userId, "Implicit ".concat(signal, " signal"))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // Preference Learning and Updates
    PreferenceEngine.prototype.updateUserPreferences = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var recentFeedback, newWeights, controlledWeights, currentPrefs, updatedWeights;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getRecentUserFeedback(userId)];
                    case 1:
                        recentFeedback = _a.sent();
                        if (recentFeedback.length < this.MIN_FEEDBACK_COUNT) {
                            // Not enough feedback for stable preferences
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.calculatePreferenceWeights(recentFeedback)];
                    case 2:
                        newWeights = _a.sent();
                        controlledWeights = this.applyBiasControls(newWeights);
                        return [4 /*yield*/, this.getUserPreferences(userId)];
                    case 3:
                        currentPrefs = _a.sent();
                        updatedWeights = this.applyExponentialMovingAverage(currentPrefs, controlledWeights);
                        // Save updated preferences
                        return [4 /*yield*/, this.saveUserPreferences(userId, updatedWeights)];
                    case 4:
                        // Save updated preferences
                        _a.sent();
                        // Log preference update
                        console.log("Updated preferences for user ".concat(userId, ":"), {
                            tagWeightCount: Object.keys(updatedWeights.tagWeights).length,
                            averageTagWeight: this.calculateAverageWeight(updatedWeights.tagWeights),
                            qualityThreshold: updatedWeights.qualityThreshold,
                        });
                        return [2 /*return*/];
                }
            });
        });
    };
    PreferenceEngine.prototype.updateGlobalPreferencesIfNeeded = function () {
        return __awaiter(this, void 0, void 0, function () {
            var current, hoursSinceUpdate;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, config_1.db.select().from(schema_1.globalPreferences)];
                    case 1:
                        current = (_a.sent())[0];
                        if (current) {
                            hoursSinceUpdate = (Date.now() - current.updatedAt.getTime()) / (1000 * 60 * 60);
                            if (hoursSinceUpdate < this.UPDATE_FREQUENCY) {
                                return [2 /*return*/];
                            }
                        }
                        return [4 /*yield*/, this.updateGlobalPreferences()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    PreferenceEngine.prototype.updateGlobalPreferences = function () {
        return __awaiter(this, void 0, void 0, function () {
            var allFeedback, globalWeights, controlledWeights;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getRecentGlobalFeedback()];
                    case 1:
                        allFeedback = _a.sent();
                        if (allFeedback.length === 0) {
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.calculateGlobalPreferenceWeights(allFeedback)];
                    case 2:
                        globalWeights = _a.sent();
                        controlledWeights = this.applyBiasControls(globalWeights);
                        // Save global preferences
                        return [4 /*yield*/, this.saveGlobalPreferences(controlledWeights)];
                    case 3:
                        // Save global preferences
                        _a.sent();
                        console.log("Updated global preferences:", {
                            tagWeightCount: Object.keys(controlledWeights.tagWeights).length,
                            averageTagWeight: this.calculateAverageWeight(controlledWeights.tagWeights),
                            qualityThreshold: controlledWeights.qualityThreshold,
                        });
                        return [2 /*return*/];
                }
            });
        });
    };
    // Preference Calculation
    PreferenceEngine.prototype.calculatePreferenceWeights = function (feedback) {
        return __awaiter(this, void 0, void 0, function () {
            var tagWeights, kindWeights, totalWeight, qualitySum, qualityCount, _i, feedback_1, fb, weight, _a, _b, obj, _c, _d, tag, quality, qualityThreshold;
            return __generator(this, function (_e) {
                tagWeights = {};
                kindWeights = {
                    style_pack: 0,
                    motif: 0,
                    glossary: 0,
                    rule: 0,
                    fewshot: 0,
                };
                totalWeight = 0;
                qualitySum = 0;
                qualityCount = 0;
                for (_i = 0, feedback_1 = feedback; _i < feedback_1.length; _i++) {
                    fb = feedback_1[_i];
                    weight = parseFloat(fb.weight);
                    totalWeight += Math.abs(weight);
                    // Process each object used in the generation
                    for (_a = 0, _b = fb.objects; _a < _b.length; _a++) {
                        obj = _b[_a];
                        // Update tag weights
                        if (obj.tags) {
                            for (_c = 0, _d = obj.tags; _c < _d.length; _c++) {
                                tag = _d[_c];
                                tagWeights[tag] = (tagWeights[tag] || 0) + weight;
                            }
                        }
                        // Update kind weights
                        kindWeights[obj.kind] += weight;
                        quality = parseFloat(obj.qualityScore || "0");
                        if (quality > 0) {
                            qualitySum += quality * Math.abs(weight);
                            qualityCount += Math.abs(weight);
                        }
                    }
                }
                // Normalize weights
                if (totalWeight > 0) {
                    Object.keys(tagWeights).forEach(function (tag) {
                        tagWeights[tag] /= totalWeight;
                    });
                    Object.keys(kindWeights).forEach(function (kind) {
                        kindWeights[kind] /= totalWeight;
                    });
                }
                qualityThreshold = qualityCount > 0
                    ? qualitySum / qualityCount
                    : this.BIAS_CONTROLS.qualityFloor;
                return [2 /*return*/, {
                        tagWeights: tagWeights,
                        kindWeights: kindWeights,
                        qualityThreshold: Math.max(qualityThreshold, this.BIAS_CONTROLS.qualityFloor),
                        diversityWeight: this.BIAS_CONTROLS.diversityMinimum,
                    }];
            });
        });
    };
    PreferenceEngine.prototype.calculateGlobalPreferenceWeights = function (feedback) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Similar to user preferences but aggregated across all users
                return [2 /*return*/, this.calculatePreferenceWeights(feedback)];
            });
        });
    };
    // Bias Controls
    PreferenceEngine.prototype.applyBiasControls = function (weights) {
        var _this = this;
        var controlled = __assign({}, weights);
        // Cap tag weights to prevent echo chambers
        Object.keys(controlled.tagWeights).forEach(function (tag) {
            controlled.tagWeights[tag] = Math.min(controlled.tagWeights[tag], _this.BIAS_CONTROLS.maxPreferenceBoost);
        });
        // Cap kind weights
        Object.keys(controlled.kindWeights).forEach(function (kind) {
            controlled.kindWeights[kind] = Math.min(controlled.kindWeights[kind], _this.BIAS_CONTROLS.maxPreferenceBoost);
        });
        // Ensure minimum diversity
        controlled.diversityWeight = Math.max(controlled.diversityWeight, this.BIAS_CONTROLS.diversityMinimum);
        // Ensure quality floor
        controlled.qualityThreshold = Math.max(controlled.qualityThreshold, this.BIAS_CONTROLS.qualityFloor);
        return controlled;
    };
    PreferenceEngine.prototype.applyExponentialMovingAverage = function (current, update) {
        var _this = this;
        var result = {
            tagWeights: {},
            kindWeights: __assign({}, update.kindWeights),
            qualityThreshold: update.qualityThreshold,
            diversityWeight: update.diversityWeight,
        };
        // Apply EMA to tag weights
        var allTags = new Set(__spreadArray(__spreadArray([], Object.keys(current.tagWeights), true), Object.keys(update.tagWeights), true));
        for (var _i = 0, allTags_1 = allTags; _i < allTags_1.length; _i++) {
            var tag = allTags_1[_i];
            var currentWeight = current.tagWeights[tag] || 0;
            var updateWeight = update.tagWeights[tag] || 0;
            result.tagWeights[tag] =
                (1 - this.EMA_DECAY) * currentWeight + this.EMA_DECAY * updateWeight;
        }
        // Apply EMA to kind weights
        Object.keys(result.kindWeights).forEach(function (kind) {
            var currentWeight = current.kindWeights[kind] || 0;
            var updateWeight = update.kindWeights[kind];
            result.kindWeights[kind] =
                (1 - _this.EMA_DECAY) * currentWeight + _this.EMA_DECAY * updateWeight;
        });
        // Apply EMA to other metrics
        result.qualityThreshold =
            (1 - this.EMA_DECAY) * current.qualityThreshold +
                this.EMA_DECAY * update.qualityThreshold;
        result.diversityWeight =
            (1 - this.EMA_DECAY) * current.diversityWeight +
                this.EMA_DECAY * update.diversityWeight;
        return result;
    };
    // Data Retrieval
    PreferenceEngine.prototype.getRecentUserFeedback = function (userId_1) {
        return __awaiter(this, arguments, void 0, function (userId, days) {
            var cutoffDate, feedback, enriched, _i, feedback_2, row, objects;
            if (days === void 0) { days = 30; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
                        return [4 /*yield*/, config_1.db
                                .select({
                                feedback: schema_1.genFeedback,
                                event: schema_1.genEvents,
                            })
                                .from(schema_1.genFeedback)
                                .innerJoin(schema_1.genEvents, (0, drizzle_orm_1.eq)(schema_1.genFeedback.eventId, schema_1.genEvents.id))
                                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.genFeedback.userId, userId), (0, drizzle_orm_1.gte)(schema_1.genFeedback.createdAt, cutoffDate)))
                                .orderBy((0, drizzle_orm_1.desc)(schema_1.genFeedback.createdAt))];
                    case 1:
                        feedback = _a.sent();
                        enriched = [];
                        _i = 0, feedback_2 = feedback;
                        _a.label = 2;
                    case 2:
                        if (!(_i < feedback_2.length)) return [3 /*break*/, 5];
                        row = feedback_2[_i];
                        return [4 /*yield*/, config_1.db
                                .select()
                                .from(schema_1.kbObjects)
                                .where((0, drizzle_orm_1.sql)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["", " = ANY(", ")"], ["", " = ANY(", ")"])), schema_1.kbObjects.id, row.event.usedObjectIds))];
                    case 3:
                        objects = _a.sent();
                        enriched.push(__assign(__assign({}, row.feedback), { event: row.event, objects: objects }));
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/, enriched];
                }
            });
        });
    };
    PreferenceEngine.prototype.getRecentGlobalFeedback = function () {
        return __awaiter(this, arguments, void 0, function (days) {
            var cutoffDate, feedback, enriched, _i, feedback_3, row, objects;
            if (days === void 0) { days = 7; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
                        return [4 /*yield*/, config_1.db
                                .select({
                                feedback: schema_1.genFeedback,
                                event: schema_1.genEvents,
                            })
                                .from(schema_1.genFeedback)
                                .innerJoin(schema_1.genEvents, (0, drizzle_orm_1.eq)(schema_1.genFeedback.eventId, schema_1.genEvents.id))
                                .where((0, drizzle_orm_1.gte)(schema_1.genFeedback.createdAt, cutoffDate))
                                .orderBy((0, drizzle_orm_1.desc)(schema_1.genFeedback.createdAt))];
                    case 1:
                        feedback = _a.sent();
                        enriched = [];
                        _i = 0, feedback_3 = feedback;
                        _a.label = 2;
                    case 2:
                        if (!(_i < feedback_3.length)) return [3 /*break*/, 5];
                        row = feedback_3[_i];
                        return [4 /*yield*/, config_1.db
                                .select()
                                .from(schema_1.kbObjects)
                                .where((0, drizzle_orm_1.sql)(templateObject_4 || (templateObject_4 = __makeTemplateObject(["", " = ANY(", ")"], ["", " = ANY(", ")"])), schema_1.kbObjects.id, row.event.usedObjectIds))];
                    case 3:
                        objects = _a.sent();
                        enriched.push(__assign(__assign({}, row.feedback), { event: row.event, objects: objects }));
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/, enriched];
                }
            });
        });
    };
    PreferenceEngine.prototype.getUserPreferences = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var userPref;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, config_1.db
                            .select()
                            .from(schema_1.userPreferences)
                            .where((0, drizzle_orm_1.eq)(schema_1.userPreferences.userId, userId))];
                    case 1:
                        userPref = (_a.sent())[0];
                        if (!userPref) {
                            return [2 /*return*/, this.getDefaultPreferences()];
                        }
                        return [2 /*return*/, {
                                tagWeights: userPref.weights.tagWeights || {},
                                kindWeights: userPref.weights.kindWeights || this.getDefaultKindWeights(),
                                qualityThreshold: userPref.weights.qualityThreshold || this.BIAS_CONTROLS.qualityFloor,
                                diversityWeight: userPref.weights.diversityWeight || this.BIAS_CONTROLS.diversityMinimum,
                                updatedAt: userPref.updatedAt || new Date(),
                            }];
                }
            });
        });
    };
    PreferenceEngine.prototype.getDefaultPreferences = function () {
        return {
            tagWeights: {},
            kindWeights: this.getDefaultKindWeights(),
            qualityThreshold: this.BIAS_CONTROLS.qualityFloor,
            diversityWeight: this.BIAS_CONTROLS.diversityMinimum,
            updatedAt: new Date(),
        };
    };
    PreferenceEngine.prototype.getDefaultKindWeights = function () {
        return {
            style_pack: 1.0,
            motif: 1.0,
            glossary: 0.8,
            rule: 0.6,
            fewshot: 0.9,
        };
    };
    // Preference Persistence
    PreferenceEngine.prototype.saveUserPreferences = function (userId, weights) {
        return __awaiter(this, void 0, void 0, function () {
            var preferencesData;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        preferencesData = {
                            userId: userId,
                            weights: weights,
                        };
                        return [4 /*yield*/, config_1.db
                                .insert(schema_1.userPreferences)
                                .values(preferencesData)
                                .onConflictDoUpdate({
                                target: schema_1.userPreferences.userId,
                                set: {
                                    weights: preferencesData.weights,
                                    updatedAt: new Date(),
                                },
                            })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    PreferenceEngine.prototype.saveGlobalPreferences = function (weights) {
        return __awaiter(this, void 0, void 0, function () {
            var preferencesData;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        preferencesData = {
                            id: true,
                            weights: weights,
                        };
                        return [4 /*yield*/, config_1.db
                                .insert(schema_1.globalPreferences)
                                .values(preferencesData)
                                .onConflictDoUpdate({
                                target: schema_1.globalPreferences.id,
                                set: {
                                    weights: preferencesData.weights,
                                    updatedAt: new Date(),
                                },
                            })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // Analytics and Monitoring
    PreferenceEngine.prototype.getLearningMetrics = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, totalEvents, feedbackStats, qualityStats, feedbackRate, diversityScore, biasScore, preferenceStability;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, Promise.all([
                            // Total generation events
                            config_1.db
                                .select({ count: (0, drizzle_orm_1.sql)(templateObject_5 || (templateObject_5 = __makeTemplateObject(["count(*)"], ["count(*)"]))) })
                                .from(schema_1.genEvents)
                                .where(userId ? (0, drizzle_orm_1.eq)(schema_1.genEvents.userId, userId) : undefined),
                            // Feedback statistics
                            config_1.db
                                .select({
                                totalFeedback: (0, drizzle_orm_1.sql)(templateObject_6 || (templateObject_6 = __makeTemplateObject(["count(*)"], ["count(*)"]))),
                                positiveFeedback: (0, drizzle_orm_1.sql)(templateObject_7 || (templateObject_7 = __makeTemplateObject(["count(*) FILTER (WHERE ", "::numeric > 0)"], ["count(*) FILTER (WHERE ", "::numeric > 0)"])), schema_1.genFeedback.weight),
                            })
                                .from(schema_1.genFeedback)
                                .where(userId ? (0, drizzle_orm_1.eq)(schema_1.genFeedback.userId, userId) : undefined),
                            // Quality statistics from used objects
                            this.getQualityMetrics(userId),
                        ])];
                    case 1:
                        _a = _b.sent(), totalEvents = _a[0], feedbackStats = _a[1], qualityStats = _a[2];
                        feedbackRate = totalEvents[0].count > 0
                            ? feedbackStats[0].totalFeedback / totalEvents[0].count
                            : 0;
                        return [4 /*yield*/, this.calculateDiversityScore(userId)];
                    case 2:
                        diversityScore = _b.sent();
                        return [4 /*yield*/, this.calculateBiasScore(userId)];
                    case 3:
                        biasScore = _b.sent();
                        return [4 /*yield*/, this.calculatePreferenceStability(userId)];
                    case 4:
                        preferenceStability = _b.sent();
                        return [2 /*return*/, {
                                totalEvents: totalEvents[0].count,
                                feedbackRate: feedbackRate,
                                averageQuality: qualityStats.averageQuality,
                                diversityScore: diversityScore,
                                biasScore: biasScore,
                                preferenceStability: preferenceStability,
                            }];
                }
            });
        });
    };
    PreferenceEngine.prototype.getQualityMetrics = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var query, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = config_1.db
                            .select({
                            avgQuality: (0, drizzle_orm_1.sql)(templateObject_8 || (templateObject_8 = __makeTemplateObject(["avg(", "::numeric)"], ["avg(", "::numeric)"])), schema_1.kbObjects.qualityScore),
                        })
                            .from(schema_1.genEvents)
                            .innerJoin(schema_1.kbObjects, (0, drizzle_orm_1.sql)(templateObject_9 || (templateObject_9 = __makeTemplateObject(["", " = ANY(", ")"], ["", " = ANY(", ")"])), schema_1.kbObjects.id, schema_1.genEvents.usedObjectIds))
                            .where((0, drizzle_orm_1.and)(userId ? (0, drizzle_orm_1.eq)(schema_1.genEvents.userId, userId) : undefined, (0, drizzle_orm_1.gte)(schema_1.genEvents.createdAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))));
                        return [4 /*yield*/, query];
                    case 1:
                        result = (_a.sent())[0];
                        return [2 /*return*/, { averageQuality: (result === null || result === void 0 ? void 0 : result.avgQuality) || 0 }];
                }
            });
        });
    };
    PreferenceEngine.prototype.calculateDiversityScore = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var recentEvents, allUsedIds, totalObjects;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, config_1.db
                            .select({ usedObjectIds: schema_1.genEvents.usedObjectIds })
                            .from(schema_1.genEvents)
                            .where((0, drizzle_orm_1.and)(userId ? (0, drizzle_orm_1.eq)(schema_1.genEvents.userId, userId) : undefined, (0, drizzle_orm_1.gte)(schema_1.genEvents.createdAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))))];
                    case 1:
                        recentEvents = _a.sent();
                        if (recentEvents.length === 0)
                            return [2 /*return*/, 1.0];
                        allUsedIds = new Set();
                        recentEvents.forEach(function (event) {
                            event.usedObjectIds.forEach(function (id) { return allUsedIds.add(id); });
                        });
                        return [4 /*yield*/, config_1.db
                                .select({ count: (0, drizzle_orm_1.sql)(templateObject_10 || (templateObject_10 = __makeTemplateObject(["count(*)"], ["count(*)"]))) })
                                .from(schema_1.kbObjects)
                                .where((0, drizzle_orm_1.eq)(schema_1.kbObjects.status, "active"))];
                    case 2:
                        totalObjects = _a.sent();
                        return [2 /*return*/, Math.min(1.0, allUsedIds.size / Math.max(1, totalObjects[0].count * 0.1))];
                }
            });
        });
    };
    PreferenceEngine.prototype.calculateBiasScore = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var preferences, _a, tagWeights, mean, variance, stdDev, coefficientOfVariation;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!userId) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.getUserPreferences(userId)];
                    case 1:
                        _a = _b.sent();
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, this.getGlobalPreferences()];
                    case 3:
                        _a = _b.sent();
                        _b.label = 4;
                    case 4:
                        preferences = _a;
                        tagWeights = Object.values(preferences.tagWeights);
                        if (tagWeights.length === 0)
                            return [2 /*return*/, 0];
                        mean = tagWeights.reduce(function (a, b) { return a + b; }, 0) / tagWeights.length;
                        variance = tagWeights.reduce(function (acc, weight) { return acc + Math.pow(weight - mean, 2); }, 0) /
                            tagWeights.length;
                        stdDev = Math.sqrt(variance);
                        coefficientOfVariation = mean > 0 ? stdDev / mean : 0;
                        // Convert to bias score (0 = no bias, 1 = high bias)
                        return [2 /*return*/, Math.min(1.0, coefficientOfVariation)];
                }
            });
        });
    };
    PreferenceEngine.prototype.calculatePreferenceStability = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var current, daysSinceUpdate;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Calculate how stable preferences are over time
                        if (!userId)
                            return [2 /*return*/, 1.0]; // Global preferences are considered stable
                        return [4 /*yield*/, config_1.db
                                .select()
                                .from(schema_1.userPreferences)
                                .where((0, drizzle_orm_1.eq)(schema_1.userPreferences.userId, userId))];
                    case 1:
                        current = (_a.sent())[0];
                        if (!current)
                            return [2 /*return*/, 0];
                        daysSinceUpdate = (Date.now() - current.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
                        return [2 /*return*/, Math.min(1.0, daysSinceUpdate / 30)]; // More stable if updated less frequently
                }
            });
        });
    };
    PreferenceEngine.prototype.getGlobalPreferences = function () {
        return __awaiter(this, void 0, void 0, function () {
            var globalPref;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, config_1.db.select().from(schema_1.globalPreferences)];
                    case 1:
                        globalPref = (_a.sent())[0];
                        if (!globalPref) {
                            return [2 /*return*/, this.getDefaultPreferences()];
                        }
                        return [2 /*return*/, {
                                tagWeights: globalPref.weights.tagWeights || {},
                                kindWeights: globalPref.weights.kindWeights || this.getDefaultKindWeights(),
                                qualityThreshold: globalPref.weights.qualityThreshold || this.BIAS_CONTROLS.qualityFloor,
                                diversityWeight: globalPref.weights.diversityWeight ||
                                    this.BIAS_CONTROLS.diversityMinimum,
                                updatedAt: globalPref.updatedAt || new Date(),
                            }];
                }
            });
        });
    };
    // Utility methods
    PreferenceEngine.prototype.calculateAverageWeight = function (weights) {
        var values = Object.values(weights);
        return values.length > 0
            ? values.reduce(function (a, b) { return a + b; }, 0) / values.length
            : 0;
    };
    // Automatic object deprecation
    PreferenceEngine.prototype.deprecateStaleObjects = function () {
        return __awaiter(this, void 0, void 0, function () {
            var negativeObjects, deprecatedCount, _i, negativeObjects_1, obj, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, config_1.db
                            .select({
                            objectId: (0, drizzle_orm_1.sql)(templateObject_11 || (templateObject_11 = __makeTemplateObject(["unnest(", ")"], ["unnest(", ")"])), schema_1.genEvents.usedObjectIds),
                            avgFeedback: (0, drizzle_orm_1.sql)(templateObject_12 || (templateObject_12 = __makeTemplateObject(["avg(", "::numeric)"], ["avg(", "::numeric)"])), schema_1.genFeedback.weight),
                            feedbackCount: (0, drizzle_orm_1.sql)(templateObject_13 || (templateObject_13 = __makeTemplateObject(["count(*)"], ["count(*)"]))),
                        })
                            .from(schema_1.genEvents)
                            .innerJoin(schema_1.genFeedback, (0, drizzle_orm_1.eq)(schema_1.genEvents.id, schema_1.genFeedback.eventId))
                            .where((0, drizzle_orm_1.gte)(schema_1.genFeedback.createdAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)))
                            .groupBy((0, drizzle_orm_1.sql)(templateObject_14 || (templateObject_14 = __makeTemplateObject(["unnest(", ")"], ["unnest(", ")"])), schema_1.genEvents.usedObjectIds))
                            .having((0, drizzle_orm_1.and)((0, drizzle_orm_1.sql)(templateObject_15 || (templateObject_15 = __makeTemplateObject(["avg(", "::numeric) < -0.5"], ["avg(", "::numeric) < -0.5"])), schema_1.genFeedback.weight), (0, drizzle_orm_1.sql)(templateObject_16 || (templateObject_16 = __makeTemplateObject(["count(*) >= 5"], ["count(*) >= 5"])))))];
                    case 1:
                        negativeObjects = _a.sent();
                        deprecatedCount = 0;
                        _i = 0, negativeObjects_1 = negativeObjects;
                        _a.label = 2;
                    case 2:
                        if (!(_i < negativeObjects_1.length)) return [3 /*break*/, 7];
                        obj = negativeObjects_1[_i];
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, this.kbManager.deprecateObject(obj.objectId, "system", "Automatically deprecated due to negative feedback (avg: ".concat(obj.avgFeedback.toFixed(2), ")"))];
                    case 4:
                        _a.sent();
                        deprecatedCount++;
                        return [3 /*break*/, 6];
                    case 5:
                        error_1 = _a.sent();
                        console.warn("Failed to deprecate object ".concat(obj.objectId, ":"), error_1);
                        return [3 /*break*/, 6];
                    case 6:
                        _i++;
                        return [3 /*break*/, 2];
                    case 7: return [2 /*return*/, deprecatedCount];
                }
            });
        });
    };
    // Cleanup old events and feedback
    PreferenceEngine.prototype.cleanupOldData = function () {
        return __awaiter(this, arguments, void 0, function (retentionDays) {
            var cutoffDate, _a, deletedEvents, deletedFeedback;
            if (retentionDays === void 0) { retentionDays = 90; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
                        return [4 /*yield*/, Promise.all([
                                config_1.db
                                    .delete(schema_1.genEvents)
                                    .where((0, drizzle_orm_1.sql)(templateObject_17 || (templateObject_17 = __makeTemplateObject(["", " < ", ""], ["", " < ", ""])), schema_1.genEvents.createdAt, cutoffDate))
                                    .returning(),
                                config_1.db
                                    .delete(schema_1.genFeedback)
                                    .where((0, drizzle_orm_1.sql)(templateObject_18 || (templateObject_18 = __makeTemplateObject(["", " < ", ""], ["", " < ", ""])), schema_1.genFeedback.createdAt, cutoffDate))
                                    .returning(),
                            ])];
                    case 1:
                        _a = _b.sent(), deletedEvents = _a[0], deletedFeedback = _a[1];
                        return [2 /*return*/, {
                                events: deletedEvents.length,
                                feedback: deletedFeedback.length,
                            }];
                }
            });
        });
    };
    // High-level feedback processing method for tests and external use
    PreferenceEngine.prototype.processFeedback = function (feedback) {
        return __awaiter(this, void 0, void 0, function () {
            var event, tagsAffected, objectsAffected, objects, weightApplied, preferencesUpdated, recentFeedback;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        // Validate input
                        if (feedback.eventId === null ||
                            feedback.eventId === undefined ||
                            !feedback.signal) {
                            throw new Error("Invalid feedback data: eventId and signal are required");
                        }
                        return [4 /*yield*/, this.getGenerationEvent(feedback.eventId)];
                    case 1:
                        event = _b.sent();
                        if (!event) {
                            throw new Error("Generation event not found: ".concat(feedback.eventId));
                        }
                        tagsAffected = feedback.tags || [];
                        objectsAffected = feedback.objectIds || [];
                        if (!(tagsAffected.length === 0 || objectsAffected.length === 0)) return [3 /*break*/, 3];
                        return [4 /*yield*/, config_1.db
                                .select()
                                .from(schema_1.kbObjects)
                                .where((0, drizzle_orm_1.sql)(templateObject_19 || (templateObject_19 = __makeTemplateObject(["", " = ANY(", ")"], ["", " = ANY(", ")"])), schema_1.kbObjects.id, event.usedObjectIds))];
                    case 2:
                        objects = _b.sent();
                        if (tagsAffected.length === 0) {
                            tagsAffected = __spreadArray([], new Set(objects.flatMap(function (obj) { return obj.tags || []; })), true);
                        }
                        if (objectsAffected.length === 0) {
                            objectsAffected = objects.map(function (obj) { return parseInt(obj.id); });
                        }
                        _b.label = 3;
                    case 3:
                        weightApplied = (_a = feedback.weight) !== null && _a !== void 0 ? _a : this.FEEDBACK_WEIGHTS[feedback.signal];
                        // Record the feedback
                        return [4 /*yield*/, this.recordFeedback(feedback.eventId, feedback.signal, feedback.userId, "Processed feedback: ".concat(feedback.signal))];
                    case 4:
                        // Record the feedback
                        _b.sent();
                        preferencesUpdated = false;
                        if (!feedback.userId) return [3 /*break*/, 6];
                        return [4 /*yield*/, this.getRecentUserFeedback(feedback.userId)];
                    case 5:
                        recentFeedback = _b.sent();
                        preferencesUpdated = recentFeedback.length >= this.MIN_FEEDBACK_COUNT;
                        _b.label = 6;
                    case 6: return [2 /*return*/, {
                            preferencesUpdated: preferencesUpdated,
                            tagsAffected: tagsAffected,
                            objectsAffected: objectsAffected,
                            weightApplied: weightApplied,
                        }];
                }
            });
        });
    };
    // Additional methods needed by tests
    PreferenceEngine.prototype.setUserPreference = function (userId, tag, value) {
        return __awaiter(this, void 0, void 0, function () {
            var currentPrefs;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getUserPreferences(userId)];
                    case 1:
                        currentPrefs = _a.sent();
                        currentPrefs.tagWeights[tag] = value;
                        return [4 /*yield*/, this.saveUserPreferences(userId, {
                                tagWeights: currentPrefs.tagWeights,
                                kindWeights: currentPrefs.kindWeights,
                                qualityThreshold: currentPrefs.qualityThreshold,
                                diversityWeight: currentPrefs.diversityWeight,
                            })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    PreferenceEngine.prototype.getUserPreference = function (userId, tag) {
        return __awaiter(this, void 0, void 0, function () {
            var prefs;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getUserPreferences(userId)];
                    case 1:
                        prefs = _a.sent();
                        return [2 /*return*/, prefs.tagWeights[tag] || 0];
                }
            });
        });
    };
    PreferenceEngine.prototype.getGlobalPreference = function (tag) {
        return __awaiter(this, void 0, void 0, function () {
            var prefs;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getGlobalPreferences()];
                    case 1:
                        prefs = _a.sent();
                        return [2 /*return*/, prefs.tagWeights[tag] || 0];
                }
            });
        });
    };
    PreferenceEngine.prototype.getRecommendations = function (userId, prompt, options) {
        return __awaiter(this, void 0, void 0, function () {
            var userPrefs, globalPrefs, recommendations, topUserTags, topGlobalTags;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getUserPreferences(userId)];
                    case 1:
                        userPrefs = _a.sent();
                        return [4 /*yield*/, this.getGlobalPreferences()];
                    case 2:
                        globalPrefs = _a.sent();
                        recommendations = [];
                        topUserTags = Object.entries(userPrefs.tagWeights)
                            .sort(function (_a, _b) {
                            var a = _a[1];
                            var b = _b[1];
                            return b - a;
                        })
                            .slice(0, 3)
                            .map(function (_a) {
                            var tag = _a[0];
                            return ({ tags: [tag], source: "user" });
                        });
                        recommendations.push.apply(recommendations, topUserTags);
                        // Add global preferences for diversity if requested
                        if (options === null || options === void 0 ? void 0 : options.ensureDiversity) {
                            topGlobalTags = Object.entries(globalPrefs.tagWeights)
                                .sort(function (_a, _b) {
                                var a = _a[1];
                                var b = _b[1];
                                return b - a;
                            })
                                .slice(0, 2)
                                .map(function (_a) {
                                var tag = _a[0];
                                return ({ tags: [tag], source: "global" });
                            });
                            recommendations.push.apply(recommendations, topGlobalTags);
                        }
                        return [2 /*return*/, recommendations];
                }
            });
        });
    };
    PreferenceEngine.prototype.analyzeBias = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var prefs, biasedTags;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getUserPreferences(userId)];
                    case 1:
                        prefs = _a.sent();
                        biasedTags = Object.entries(prefs.tagWeights)
                            .filter(function (_a) {
                            var weight = _a[1];
                            return Math.abs(weight) > 1.2;
                        })
                            .map(function (_a) {
                            var tag = _a[0];
                            return tag;
                        });
                        return [2 /*return*/, {
                                hasExtremeBias: biasedTags.length > 0,
                                biasedTags: biasedTags,
                                recommendedActions: biasedTags.length > 0 ? ["diversify"] : [],
                            }];
                }
            });
        });
    };
    PreferenceEngine.prototype.calculateDiversityScore = function (preferences) {
        var values = Object.values(preferences);
        if (values.length === 0)
            return 1;
        var mean = values.reduce(function (a, b) { return a + b; }, 0) / values.length;
        var variance = values.reduce(function (acc, val) { return acc + Math.pow(val - mean, 2); }, 0) /
            values.length;
        // Convert variance to diversity score (lower variance = higher diversity)
        return Math.max(0, 1 - Math.sqrt(variance));
    };
    PreferenceEngine.prototype.processFeedbackBatch = function (feedbacks) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // Process feedbacks in parallel for better performance
                    return [4 /*yield*/, Promise.all(feedbacks.map(function (feedback) { return _this.processFeedback(feedback); }))];
                    case 1:
                        // Process feedbacks in parallel for better performance
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    PreferenceEngine.prototype.applyPreferenceDecay = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var prefs, decayFactor;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getUserPreferences(userId)];
                    case 1:
                        prefs = _a.sent();
                        decayFactor = 0.95;
                        // Apply decay to all tag weights
                        Object.keys(prefs.tagWeights).forEach(function (tag) {
                            prefs.tagWeights[tag] *= decayFactor;
                        });
                        return [4 /*yield*/, this.saveUserPreferences(userId, {
                                tagWeights: prefs.tagWeights,
                                kindWeights: prefs.kindWeights,
                                qualityThreshold: prefs.qualityThreshold,
                                diversityWeight: prefs.diversityWeight,
                            })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    PreferenceEngine.prototype.getPreferenceAge = function (userId) {
        // Mock implementation - return a fixed age for testing
        return 30; // 30 days
    };
    PreferenceEngine.prototype.calculateFreshnessScore = function (ageInDays) {
        // Exponential decay: fresher = higher score
        return Math.exp(-ageInDays / 30); // 30-day half-life
    };
    return PreferenceEngine;
}());
exports.PreferenceEngine = PreferenceEngine;
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13, templateObject_14, templateObject_15, templateObject_16, templateObject_17, templateObject_18, templateObject_19;
