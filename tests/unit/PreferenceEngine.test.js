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
/**
 * Unit tests for PreferenceEngine
 */
var vitest_1 = require("vitest");
var PreferenceEngine_js_1 = require("../../server/services/PreferenceEngine.js");
(0, vitest_1.describe)("PreferenceEngine", function () {
    var preferenceEngine;
    var testUserId = "test-user-123";
    (0, vitest_1.beforeEach)(function () {
        preferenceEngine = new PreferenceEngine_js_1.PreferenceEngine();
    });
    (0, vitest_1.describe)("feedback signal processing", function () {
        (0, vitest_1.it)("should process positive feedback signals correctly", function () { return __awaiter(void 0, void 0, void 0, function () {
            var feedback, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        feedback = {
                            eventId: 1,
                            userId: testUserId,
                            signal: "favorited",
                            weight: 1.5,
                            tags: ["blue", "circle"],
                            objectIds: [1, 2, 3],
                        };
                        return [4 /*yield*/, preferenceEngine.processFeedback(feedback)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.preferencesUpdated).toBe(true);
                        (0, vitest_1.expect)(result.tagsAffected).toEqual(["blue", "circle"]);
                        (0, vitest_1.expect)(result.objectsAffected).toEqual([1, 2, 3]);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should process negative feedback signals correctly", function () { return __awaiter(void 0, void 0, void 0, function () {
            var feedback, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        feedback = {
                            eventId: 2,
                            userId: testUserId,
                            signal: "reported",
                            weight: -3,
                            tags: ["inappropriate", "bad"],
                            objectIds: [4, 5],
                        };
                        return [4 /*yield*/, preferenceEngine.processFeedback(feedback)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.preferencesUpdated).toBe(true);
                        (0, vitest_1.expect)(result.tagsAffected).toEqual(["inappropriate", "bad"]);
                        (0, vitest_1.expect)(result.objectsAffected).toEqual([4, 5]);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should handle implicit feedback signals", function () { return __awaiter(void 0, void 0, void 0, function () {
            var implicitSignals, _i, implicitSignals_1, _a, signal, expectedWeight, feedback, result;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        implicitSignals = [
                            { signal: "exported", expectedWeight: 2 },
                            { signal: "kept", expectedWeight: 1 },
                            { signal: "edited", expectedWeight: 0.5 },
                            { signal: "regenerated", expectedWeight: -0.5 },
                        ];
                        _i = 0, implicitSignals_1 = implicitSignals;
                        _b.label = 1;
                    case 1:
                        if (!(_i < implicitSignals_1.length)) return [3 /*break*/, 4];
                        _a = implicitSignals_1[_i], signal = _a.signal, expectedWeight = _a.expectedWeight;
                        feedback = {
                            eventId: Math.random(),
                            userId: testUserId,
                            signal: signal,
                            tags: ["test"],
                            objectIds: [1],
                        };
                        return [4 /*yield*/, preferenceEngine.processFeedback(feedback)];
                    case 2:
                        result = _b.sent();
                        (0, vitest_1.expect)(result.weightApplied).toBe(expectedWeight);
                        _b.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should validate feedback data", function () { return __awaiter(void 0, void 0, void 0, function () {
            var invalidFeedback;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        invalidFeedback = {
                            eventId: null,
                            userId: "",
                            signal: "invalid",
                            tags: [],
                            objectIds: [],
                        };
                        return [4 /*yield*/, (0, vitest_1.expect)(preferenceEngine.processFeedback(invalidFeedback)).rejects.toThrow(/invalid.*feedback/i)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)("preference aggregation", function () {
        (0, vitest_1.it)("should use exponential moving average for preference updates", function () { return __awaiter(void 0, void 0, void 0, function () {
            var initialPreference, newSignal, alpha, updatedPreference;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        initialPreference = 0.5;
                        newSignal = 1.0;
                        alpha = 0.3;
                        // Set initial preference
                        return [4 /*yield*/, preferenceEngine.setUserPreference(testUserId, "blue", initialPreference)];
                    case 1:
                        // Set initial preference
                        _a.sent();
                        // Apply new feedback
                        return [4 /*yield*/, preferenceEngine.processFeedback({
                                eventId: 1,
                                userId: testUserId,
                                signal: "favorited",
                                weight: 1.5,
                                tags: ["blue"],
                                objectIds: [1],
                            })];
                    case 2:
                        // Apply new feedback
                        _a.sent();
                        return [4 /*yield*/, preferenceEngine.getUserPreference(testUserId, "blue")];
                    case 3:
                        updatedPreference = _a.sent();
                        // Should be between initial and new value
                        (0, vitest_1.expect)(updatedPreference).toBeGreaterThan(initialPreference);
                        (0, vitest_1.expect)(updatedPreference).toBeLessThan(newSignal);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should aggregate multiple feedback signals", function () { return __awaiter(void 0, void 0, void 0, function () {
            var feedbacks, _i, feedbacks_1, feedback, finalPreference;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        feedbacks = [
                            { signal: "favorited", weight: 1.5 },
                            { signal: "exported", weight: 2.0 },
                            { signal: "kept", weight: 1.0 },
                        ];
                        _i = 0, feedbacks_1 = feedbacks;
                        _a.label = 1;
                    case 1:
                        if (!(_i < feedbacks_1.length)) return [3 /*break*/, 4];
                        feedback = feedbacks_1[_i];
                        return [4 /*yield*/, preferenceEngine.processFeedback({
                                eventId: Math.random(),
                                userId: testUserId,
                                signal: feedback.signal,
                                weight: feedback.weight,
                                tags: ["aggregate"],
                                objectIds: [1],
                            })];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [4 /*yield*/, preferenceEngine.getUserPreference(testUserId, "aggregate")];
                    case 5:
                        finalPreference = _a.sent();
                        (0, vitest_1.expect)(finalPreference).toBeGreaterThan(0);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should handle conflicting feedback signals", function () { return __awaiter(void 0, void 0, void 0, function () {
            var finalPreference;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // Positive feedback
                    return [4 /*yield*/, preferenceEngine.processFeedback({
                            eventId: 1,
                            userId: testUserId,
                            signal: "favorited",
                            weight: 1.5,
                            tags: ["conflict"],
                            objectIds: [1],
                        })];
                    case 1:
                        // Positive feedback
                        _a.sent();
                        // Negative feedback
                        return [4 /*yield*/, preferenceEngine.processFeedback({
                                eventId: 2,
                                userId: testUserId,
                                signal: "reported",
                                weight: -3,
                                tags: ["conflict"],
                                objectIds: [1],
                            })];
                    case 2:
                        // Negative feedback
                        _a.sent();
                        return [4 /*yield*/, preferenceEngine.getUserPreference(testUserId, "conflict")];
                    case 3:
                        finalPreference = _a.sent();
                        // Should reflect the net effect of conflicting signals
                        (0, vitest_1.expect)(typeof finalPreference).toBe("number");
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)("bias control mechanisms", function () {
        (0, vitest_1.it)("should apply preference caps", function () { return __awaiter(void 0, void 0, void 0, function () {
            var i, preference;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < 10)) return [3 /*break*/, 4];
                        return [4 /*yield*/, preferenceEngine.processFeedback({
                                eventId: i,
                                userId: testUserId,
                                signal: "favorited",
                                weight: 1.5,
                                tags: ["capped"],
                                objectIds: [1],
                            })];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        i++;
                        return [3 /*break*/, 1];
                    case 4: return [4 /*yield*/, preferenceEngine.getUserPreference(testUserId, "capped")];
                    case 5:
                        preference = _a.sent();
                        (0, vitest_1.expect)(preference).toBeLessThanOrEqual(1.5); // Max preference cap
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should prevent echo chamber formation", function () { return __awaiter(void 0, void 0, void 0, function () {
            var diversePrompt, recommendations, hasNonBlue;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // Set strong preference for one tag
                    return [4 /*yield*/, preferenceEngine.setUserPreference(testUserId, "blue", 1.4)];
                    case 1:
                        // Set strong preference for one tag
                        _a.sent();
                        diversePrompt = "colorful geometric shapes";
                        return [4 /*yield*/, preferenceEngine.getRecommendations(testUserId, diversePrompt, { ensureDiversity: true })];
                    case 2:
                        recommendations = _a.sent();
                        hasNonBlue = recommendations.some(function (rec) { return !rec.tags.includes("blue"); });
                        (0, vitest_1.expect)(hasNonBlue).toBe(true);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should detect and flag extreme bias", function () { return __awaiter(void 0, void 0, void 0, function () {
            var biasReport;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // Create extreme bias scenario
                    return [4 /*yield*/, preferenceEngine.setUserPreference(testUserId, "extreme", 1.5)];
                    case 1:
                        // Create extreme bias scenario
                        _a.sent();
                        return [4 /*yield*/, preferenceEngine.setUserPreference(testUserId, "other", -1.0)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, preferenceEngine.analyzeBias(testUserId)];
                    case 3:
                        biasReport = _a.sent();
                        (0, vitest_1.expect)(biasReport.hasExtremeBias).toBe(true);
                        (0, vitest_1.expect)(biasReport.biasedTags).toContain("extreme");
                        (0, vitest_1.expect)(biasReport.recommendedActions).toContain("diversify");
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should maintain preference diversity", function () {
            var preferences = {
                blue: 1.2,
                red: 0.8,
                green: 0.3,
                yellow: -0.2,
            };
            var diversityScore = preferenceEngine.calculateDiversityScore(preferences);
            (0, vitest_1.expect)(diversityScore).toBeGreaterThan(0);
            (0, vitest_1.expect)(diversityScore).toBeLessThanOrEqual(1);
        });
    });
    (0, vitest_1.describe)("global preference learning", function () {
        (0, vitest_1.it)("should aggregate user preferences into global preferences", function () { return __awaiter(void 0, void 0, void 0, function () {
            var users, _i, users_1, userId, globalPrefs;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        users = ["user1", "user2", "user3"];
                        _i = 0, users_1 = users;
                        _a.label = 1;
                    case 1:
                        if (!(_i < users_1.length)) return [3 /*break*/, 5];
                        userId = users_1[_i];
                        return [4 /*yield*/, preferenceEngine.setUserPreference(userId, "popular", 1.0)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, preferenceEngine.setUserPreference(userId, "unpopular", -0.5)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 1];
                    case 5: return [4 /*yield*/, preferenceEngine.updateGlobalPreferences()];
                    case 6:
                        _a.sent();
                        return [4 /*yield*/, preferenceEngine.getGlobalPreferences()];
                    case 7:
                        globalPrefs = _a.sent();
                        (0, vitest_1.expect)(globalPrefs.popular).toBeGreaterThan(0);
                        (0, vitest_1.expect)(globalPrefs.unpopular).toBeLessThan(0);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should weight global preferences by user activity", function () { return __awaiter(void 0, void 0, void 0, function () {
            var activeUser, inactiveUser, i, globalPref;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        activeUser = "active-user";
                        inactiveUser = "inactive-user";
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < 10)) return [3 /*break*/, 4];
                        return [4 /*yield*/, preferenceEngine.processFeedback({
                                eventId: i,
                                userId: activeUser,
                                signal: "favorited",
                                weight: 1.5,
                                tags: ["weighted"],
                                objectIds: [1],
                            })];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        i++;
                        return [3 /*break*/, 1];
                    case 4: 
                    // Inactive user with few interactions
                    return [4 /*yield*/, preferenceEngine.processFeedback({
                            eventId: 100,
                            userId: inactiveUser,
                            signal: "reported",
                            weight: -3,
                            tags: ["weighted"],
                            objectIds: [1],
                        })];
                    case 5:
                        // Inactive user with few interactions
                        _a.sent();
                        return [4 /*yield*/, preferenceEngine.updateGlobalPreferences()];
                    case 6:
                        _a.sent();
                        return [4 /*yield*/, preferenceEngine.getGlobalPreference("weighted")];
                    case 7:
                        globalPref = _a.sent();
                        // Should be positive due to active user's weight
                        (0, vitest_1.expect)(globalPref).toBeGreaterThan(0);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should handle cold start scenarios", function () { return __awaiter(void 0, void 0, void 0, function () {
            var newUser, recommendations, usedGlobalPrefs;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        newUser = "new-user";
                        return [4 /*yield*/, preferenceEngine.getRecommendations(newUser, "geometric shapes")];
                    case 1:
                        recommendations = _a.sent();
                        (0, vitest_1.expect)(recommendations).toBeDefined();
                        (0, vitest_1.expect)(recommendations.length).toBeGreaterThan(0);
                        usedGlobalPrefs = recommendations.some(function (rec) { return rec.source === "global"; });
                        (0, vitest_1.expect)(usedGlobalPrefs).toBe(true);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)("preference decay and freshness", function () {
        (0, vitest_1.it)("should decay old preferences over time", function () { return __awaiter(void 0, void 0, void 0, function () {
            var oldPreference, oldDate, decayedPreference;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        oldPreference = 1.0;
                        return [4 /*yield*/, preferenceEngine.setUserPreference(testUserId, "decay", oldPreference)];
                    case 1:
                        _a.sent();
                        oldDate = new Date();
                        oldDate.setMonth(oldDate.getMonth() - 6);
                        vitest_1.vi.spyOn(preferenceEngine, "getPreferenceAge").mockReturnValue(180); // 180 days
                        return [4 /*yield*/, preferenceEngine.applyPreferenceDecay(testUserId)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, preferenceEngine.getUserPreference(testUserId, "decay")];
                    case 3:
                        decayedPreference = _a.sent();
                        (0, vitest_1.expect)(decayedPreference).toBeLessThan(oldPreference);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should maintain recent preferences", function () { return __awaiter(void 0, void 0, void 0, function () {
            var recentPreference, maintainedPreference;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        recentPreference = 1.0;
                        return [4 /*yield*/, preferenceEngine.setUserPreference(testUserId, "recent", recentPreference)];
                    case 1:
                        _a.sent();
                        // Mock recent activity
                        vitest_1.vi.spyOn(preferenceEngine, "getPreferenceAge").mockReturnValue(7); // 7 days
                        return [4 /*yield*/, preferenceEngine.applyPreferenceDecay(testUserId)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, preferenceEngine.getUserPreference(testUserId, "recent")];
                    case 3:
                        maintainedPreference = _a.sent();
                        (0, vitest_1.expect)(maintainedPreference).toBeCloseTo(recentPreference, 2);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should calculate freshness scores correctly", function () {
            var ages = [1, 7, 30, 90, 180]; // days
            var freshnessScores = ages.map(function (age) {
                return preferenceEngine.calculateFreshnessScore(age);
            });
            // Freshness should decrease with age
            for (var i = 1; i < freshnessScores.length; i++) {
                (0, vitest_1.expect)(freshnessScores[i]).toBeLessThan(freshnessScores[i - 1]);
            }
        });
    });
    (0, vitest_1.describe)("performance and optimization", function () {
        (0, vitest_1.it)("should batch preference updates efficiently", function () { return __awaiter(void 0, void 0, void 0, function () {
            var batchSize, feedbacks, startTime, endTime;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        batchSize = 100;
                        feedbacks = Array.from({ length: batchSize }, function (_, i) { return ({
                            eventId: i,
                            userId: testUserId,
                            signal: "kept",
                            weight: 1.0,
                            tags: ["tag".concat(i % 10)],
                            objectIds: [i],
                        }); });
                        startTime = Date.now();
                        return [4 /*yield*/, preferenceEngine.processFeedbackBatch(feedbacks)];
                    case 1:
                        _a.sent();
                        endTime = Date.now();
                        // Should complete batch processing quickly
                        (0, vitest_1.expect)(endTime - startTime).toBeLessThan(1000); // Less than 1 second
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should cache frequently accessed preferences", function () { return __awaiter(void 0, void 0, void 0, function () {
            var tag, start1, time1, start2, time2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tag = "cached";
                        start1 = Date.now();
                        return [4 /*yield*/, preferenceEngine.getUserPreference(testUserId, tag)];
                    case 1:
                        _a.sent();
                        time1 = Date.now() - start1;
                        start2 = Date.now();
                        return [4 /*yield*/, preferenceEngine.getUserPreference(testUserId, tag)];
                    case 2:
                        _a.sent();
                        time2 = Date.now() - start2;
                        (0, vitest_1.expect)(time2).toBeLessThan(time1 * 0.5); // Cache should be faster
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should handle concurrent preference updates", function () { return __awaiter(void 0, void 0, void 0, function () {
            var concurrentUpdates, finalPreference;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        concurrentUpdates = Array.from({ length: 10 }, function (_, i) {
                            return preferenceEngine.processFeedback({
                                eventId: i,
                                userId: testUserId,
                                signal: "favorited",
                                weight: 1.0,
                                tags: ["concurrent"],
                                objectIds: [i],
                            });
                        });
                        // Should handle all updates without errors
                        return [4 /*yield*/, (0, vitest_1.expect)(Promise.all(concurrentUpdates)).resolves.toBeDefined()];
                    case 1:
                        // Should handle all updates without errors
                        _a.sent();
                        return [4 /*yield*/, preferenceEngine.getUserPreference(testUserId, "concurrent")];
                    case 2:
                        finalPreference = _a.sent();
                        (0, vitest_1.expect)(finalPreference).toBeGreaterThan(0);
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
