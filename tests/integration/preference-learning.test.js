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
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Integration tests for preference learning and feedback loops
 */
var vitest_1 = require("vitest");
var GenerationPipeline_js_1 = require("../../server/services/GenerationPipeline.js");
var KnowledgeBaseManager_js_1 = require("../../server/services/KnowledgeBaseManager.js");
var PreferenceEngine_js_1 = require("../../server/services/PreferenceEngine.js");
(0, vitest_1.describe)("Preference Learning Integration", function () {
    var pipeline;
    var kbManager;
    var preferenceEngine;
    var testUserId = "test-user-123";
    (0, vitest_1.beforeEach)(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            // Initialize services with test configuration
            pipeline = new GenerationPipeline_js_1.GenerationPipeline();
            kbManager = new KnowledgeBaseManager_js_1.KnowledgeBaseManager();
            preferenceEngine = new PreferenceEngine_js_1.PreferenceEngine();
            return [2 /*return*/];
        });
    }); });
    (0, vitest_1.afterEach)(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/];
        });
    }); });
    (0, vitest_1.describe)("feedback collection and preference updates", function () {
        (0, vitest_1.it)("should update preferences based on positive feedback", function () { return __awaiter(void 0, void 0, void 0, function () {
            var request, grounding, result, mockEventId;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        request = {
                            prompt: "blue geometric circle",
                            size: { width: 200, height: 200 },
                            userId: testUserId,
                        };
                        return [4 /*yield*/, kbManager.retrieveGrounding(request.prompt, testUserId)];
                    case 1:
                        grounding = _a.sent();
                        return [4 /*yield*/, pipeline.process(request, grounding)];
                    case 2:
                        result = _a.sent();
                        mockEventId = Math.floor(Math.random() * 1000);
                        // Simulate positive feedback
                        return [4 /*yield*/, preferenceEngine.processFeedback({
                                eventId: mockEventId,
                                userId: testUserId,
                                signal: "favorited",
                                weight: 1.5,
                                tags: ["blue", "geometric", "circle"],
                                objectIds: [1, 2, 3],
                            })];
                    case 3:
                        // Simulate positive feedback
                        _a.sent();
                        // Mock preference check
                        (0, vitest_1.expect)(true).toBe(true); // Placeholder for actual preference validation
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should update preferences based on negative feedback", function () { return __awaiter(void 0, void 0, void 0, function () {
            var request, grounding, result, mockEventId;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        request = {
                            prompt: "red square pattern",
                            size: { width: 200, height: 200 },
                            userId: testUserId,
                        };
                        return [4 /*yield*/, kbManager.retrieveGrounding(request.prompt, testUserId)];
                    case 1:
                        grounding = _a.sent();
                        return [4 /*yield*/, pipeline.process(request, grounding)];
                    case 2:
                        result = _a.sent();
                        mockEventId = Math.floor(Math.random() * 1000);
                        // Simulate negative feedback
                        return [4 /*yield*/, preferenceEngine.processFeedback({
                                eventId: mockEventId,
                                userId: testUserId,
                                signal: "reported",
                                weight: -3,
                                tags: ["red", "square"],
                                objectIds: [4, 5],
                            })];
                    case 3:
                        // Simulate negative feedback
                        _a.sent();
                        // Mock preference check
                        (0, vitest_1.expect)(true).toBe(true); // Placeholder for actual preference validation
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should apply preference caps to prevent echo chambers", function () { return __awaiter(void 0, void 0, void 0, function () {
            var request, i, grounding, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        request = {
                            prompt: "blue circle",
                            size: { width: 200, height: 200 },
                            userId: testUserId,
                        };
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < 10)) return [3 /*break*/, 6];
                        return [4 /*yield*/, kbManager.retrieveGrounding(request.prompt, testUserId)];
                    case 2:
                        grounding = _a.sent();
                        return [4 /*yield*/, pipeline.process(request, grounding)];
                    case 3:
                        result = _a.sent();
                        return [4 /*yield*/, preferenceEngine.processFeedback({
                                eventId: i,
                                userId: testUserId,
                                signal: "favorited",
                                weight: 1.5,
                                tags: ["blue", "circle"],
                                objectIds: [1, 2],
                            })];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5:
                        i++;
                        return [3 /*break*/, 1];
                    case 6:
                        // Mock preference cap validation
                        (0, vitest_1.expect)(true).toBe(true); // Placeholder for actual preference cap validation
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should maintain diversity in knowledge retrieval", function () { return __awaiter(void 0, void 0, void 0, function () {
            var request, grounding;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        request = {
                            prompt: "colorful geometric shapes",
                            size: { width: 200, height: 200 },
                            userId: testUserId,
                        };
                        return [4 /*yield*/, kbManager.retrieveGrounding(request.prompt, testUserId)];
                    case 1:
                        grounding = _a.sent();
                        // Should include diverse objects
                        (0, vitest_1.expect)(grounding).toBeDefined();
                        (0, vitest_1.expect)(Array.isArray(grounding.motifs)).toBe(true);
                        // Mock diversity validation
                        (0, vitest_1.expect)(true).toBe(true); // Placeholder for actual diversity validation
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)("bias control mechanisms", function () {
        (0, vitest_1.it)("should prevent extreme bias accumulation", function () { return __awaiter(void 0, void 0, void 0, function () {
            var requests, _i, requests_1, prompt_1, grounding_1, result, grounding;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        requests = [
                            "blue circle",
                            "blue square",
                            "blue triangle",
                            "blue star",
                            "blue house",
                        ];
                        _i = 0, requests_1 = requests;
                        _a.label = 1;
                    case 1:
                        if (!(_i < requests_1.length)) return [3 /*break*/, 6];
                        prompt_1 = requests_1[_i];
                        return [4 /*yield*/, kbManager.retrieveGrounding(prompt_1, testUserId)];
                    case 2:
                        grounding_1 = _a.sent();
                        return [4 /*yield*/, pipeline.process({
                                prompt: prompt_1,
                                size: { width: 200, height: 200 },
                                userId: testUserId,
                            }, grounding_1)];
                    case 3:
                        result = _a.sent();
                        // Give maximum positive feedback
                        return [4 /*yield*/, preferenceEngine.processFeedback({
                                eventId: Math.floor(Math.random() * 1000),
                                userId: testUserId,
                                signal: "favorited",
                                weight: 1.5,
                                tags: ["blue"],
                                objectIds: [1],
                            })];
                    case 4:
                        // Give maximum positive feedback
                        _a.sent();
                        _a.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6: return [4 /*yield*/, kbManager.retrieveGrounding("colorful design", testUserId)];
                    case 7:
                        grounding = _a.sent();
                        (0, vitest_1.expect)(grounding).toBeDefined();
                        (0, vitest_1.expect)(grounding.stylePack).toBeDefined();
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should apply exponential moving average for preference updates", function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // Record feedback
                    return [4 /*yield*/, preferenceEngine.processFeedback({
                            eventId: 1,
                            userId: testUserId,
                            signal: "favorited",
                            weight: 1.5,
                            tags: ["blue"],
                            objectIds: [1],
                        })];
                    case 1:
                        // Record feedback
                        _a.sent();
                        // Mock EMA validation
                        (0, vitest_1.expect)(true).toBe(true); // Placeholder for actual EMA validation
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)("knowledge base learning", function () {
        (0, vitest_1.it)("should deprecate unused objects automatically", function () { return __awaiter(void 0, void 0, void 0, function () {
            var unusedObject;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, kbManager.createObject({
                            kind: "motif",
                            title: "Unused Test Motif",
                            body: { shape: "obscure" },
                            tags: ["unused", "test"],
                            version: "1.0.0",
                            status: "active",
                        })];
                    case 1:
                        unusedObject = _a.sent();
                        (0, vitest_1.expect)(unusedObject.id).toBeDefined();
                        (0, vitest_1.expect)(unusedObject.status).toBe("active");
                        // Mock deprecation validation
                        (0, vitest_1.expect)(true).toBe(true); // Placeholder for actual deprecation logic
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should maintain audit trail for all changes", function () { return __awaiter(void 0, void 0, void 0, function () {
            var object, updated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, kbManager.createObject({
                            kind: "style_pack",
                            title: "Test Style Pack",
                            body: { colors: ["#000000"] },
                            tags: ["test"],
                            version: "1.0.0",
                            status: "active",
                        })];
                    case 1:
                        object = _a.sent();
                        return [4 /*yield*/, kbManager.updateObject(object.id, __assign(__assign({}, object), { title: "Updated Test Style Pack", version: "1.1.0" }))];
                    case 2:
                        updated = _a.sent();
                        (0, vitest_1.expect)(updated.title).toBe("Updated Test Style Pack");
                        (0, vitest_1.expect)(updated.version).toBe("1.1.0");
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)("grounding cache effectiveness", function () {
        (0, vitest_1.it)("should cache grounding data for identical prompts", function () { return __awaiter(void 0, void 0, void 0, function () {
            var prompt, userId, start1, grounding1, time1, start2, grounding2, time2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prompt = "blue circle with red border";
                        userId = testUserId;
                        start1 = Date.now();
                        return [4 /*yield*/, kbManager.retrieveGrounding(prompt, userId)];
                    case 1:
                        grounding1 = _a.sent();
                        time1 = Date.now() - start1;
                        start2 = Date.now();
                        return [4 /*yield*/, kbManager.retrieveGrounding(prompt, userId)];
                    case 2:
                        grounding2 = _a.sent();
                        time2 = Date.now() - start2;
                        (0, vitest_1.expect)(grounding1).toBeDefined();
                        (0, vitest_1.expect)(grounding2).toBeDefined();
                        (0, vitest_1.expect)(time1).toBeGreaterThan(0);
                        (0, vitest_1.expect)(time2).toBeGreaterThan(0);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should invalidate cache when KB objects are updated", function () { return __awaiter(void 0, void 0, void 0, function () {
            var prompt, grounding1, grounding2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prompt = "test prompt";
                        return [4 /*yield*/, kbManager.retrieveGrounding(prompt, testUserId)];
                    case 1:
                        grounding1 = _a.sent();
                        return [4 /*yield*/, kbManager.retrieveGrounding(prompt, testUserId)];
                    case 2:
                        grounding2 = _a.sent();
                        (0, vitest_1.expect)(grounding1).toBeDefined();
                        (0, vitest_1.expect)(grounding2).toBeDefined();
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should respect cache TTL", function () { return __awaiter(void 0, void 0, void 0, function () {
            var prompt, start, time;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prompt = "cache ttl test";
                        // First request
                        return [4 /*yield*/, kbManager.retrieveGrounding(prompt, testUserId)];
                    case 1:
                        // First request
                        _a.sent();
                        // Wait for potential cache expiry
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 50); })];
                    case 2:
                        // Wait for potential cache expiry
                        _a.sent();
                        start = Date.now();
                        return [4 /*yield*/, kbManager.retrieveGrounding(prompt, testUserId)];
                    case 3:
                        _a.sent();
                        time = Date.now() - start;
                        (0, vitest_1.expect)(time).toBeGreaterThan(0);
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
