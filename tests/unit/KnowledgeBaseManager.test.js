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
 * Unit tests for KnowledgeBaseManager
 */
var vitest_1 = require("vitest");
var KnowledgeBaseManager_js_1 = require("../../server/services/KnowledgeBaseManager.js");
(0, vitest_1.describe)("KnowledgeBaseManager", function () {
    var kbManager;
    var testUserId = "test-user-123";
    (0, vitest_1.beforeEach)(function () {
        kbManager = new KnowledgeBaseManager_js_1.KnowledgeBaseManager();
    });
    (0, vitest_1.afterEach)(function () {
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)("CRUD operations", function () {
        (0, vitest_1.it)("should create knowledge base objects with proper validation", function () { return __awaiter(void 0, void 0, void 0, function () {
            var objectData, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        objectData = {
                            kind: "style_pack",
                            title: "Test Style Pack",
                            body: { colors: ["#ff0000", "#00ff00"] },
                            tags: ["test", "colors"],
                            version: "1.0.0",
                            status: "active",
                        };
                        return [4 /*yield*/, kbManager.createObject(objectData)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.id).toBeDefined();
                        (0, vitest_1.expect)(result.title).toBe("Test Style Pack");
                        (0, vitest_1.expect)(result.kind).toBe("style_pack");
                        (0, vitest_1.expect)(result.status).toBe("active");
                        (0, vitest_1.expect)(result.createdAt).toBeInstanceOf(Date);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should validate object schema before creation", function () { return __awaiter(void 0, void 0, void 0, function () {
            var invalidObject;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        invalidObject = {
                            kind: "invalid_kind",
                            title: "",
                            body: null,
                            tags: [],
                            version: "invalid",
                            status: "unknown",
                        };
                        return [4 /*yield*/, (0, vitest_1.expect)(kbManager.createObject(invalidObject)).rejects.toThrow()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should enforce token budget limits", function () { return __awaiter(void 0, void 0, void 0, function () {
            var largeObject;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        largeObject = {
                            kind: "motif",
                            title: "Large Motif",
                            body: { description: "A".repeat(1000) }, // Exceeds 500 token limit
                            tags: ["large"],
                            version: "1.0.0",
                            status: "active",
                        };
                        return [4 /*yield*/, (0, vitest_1.expect)(kbManager.createObject(largeObject)).rejects.toThrow(/token.*limit/i)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should update objects with version increment", function () { return __awaiter(void 0, void 0, void 0, function () {
            var original, updated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, kbManager.createObject({
                            kind: "glossary",
                            title: "Test Glossary",
                            body: { terms: { circle: "round shape" } },
                            tags: ["test"],
                            version: "1.0.0",
                            status: "active",
                        })];
                    case 1:
                        original = _a.sent();
                        return [4 /*yield*/, kbManager.updateObject(original.id, __assign(__assign({}, original), { title: "Updated Glossary", version: "1.1.0" }))];
                    case 2:
                        updated = _a.sent();
                        (0, vitest_1.expect)(updated.title).toBe("Updated Glossary");
                        (0, vitest_1.expect)(updated.version).toBe("1.1.0");
                        (0, vitest_1.expect)(updated.parentId).toBe(original.id);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should retrieve objects by various filters", function () { return __awaiter(void 0, void 0, void 0, function () {
            var results;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, kbManager.createObject({
                            kind: "motif",
                            title: "Circle Motif",
                            body: { shape: "circle" },
                            tags: ["geometric", "basic"],
                            version: "1.0.0",
                            status: "active",
                        })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, kbManager.getObject({
                                kind: "motif",
                                tags: ["geometric"],
                            })];
                    case 2:
                        results = _a.sent();
                        (0, vitest_1.expect)(results).toBeDefined();
                        (0, vitest_1.expect)(results.kind).toBe("motif");
                        (0, vitest_1.expect)(results.tags).toContain("geometric");
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should delete objects and maintain audit trail", function () { return __awaiter(void 0, void 0, void 0, function () {
            var object;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, kbManager.createObject({
                            kind: "rule",
                            title: "Test Rule",
                            body: { condition: "test", action: "test" },
                            tags: ["test"],
                            version: "1.0.0",
                            status: "active",
                        })];
                    case 1:
                        object = _a.sent();
                        return [4 /*yield*/, kbManager.deleteObject(object.id)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, (0, vitest_1.expect)(kbManager.getObject(object.id)).rejects.toThrow()];
                    case 3:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)("preference scoring algorithm", function () {
        (0, vitest_1.it)("should calculate preference scores correctly", function () {
            var similarity = 0.8;
            var preference = 0.6;
            var quality = 0.9;
            var freshness = 0.7;
            var score = kbManager.calculatePreferenceScore({
                similarity: similarity,
                preference: preference,
                quality: quality,
                freshness: freshness,
            });
            // α=0.6 similarity + β=0.2 preference + γ=0.2 quality - δ=0.1 freshness
            var expected = 0.6 * 0.8 + 0.2 * 0.6 + 0.2 * 0.9 - 0.1 * 0.7;
            (0, vitest_1.expect)(score).toBeCloseTo(expected, 3);
        });
        (0, vitest_1.it)("should apply preference caps", function () {
            var highPreference = 2.0; // Above cap
            var cappedScore = kbManager.applyPreferenceCap(highPreference);
            (0, vitest_1.expect)(cappedScore).toBeLessThanOrEqual(1.5); // Max cap
        });
        (0, vitest_1.it)("should handle negative preferences", function () {
            var negativePreference = -0.5;
            var score = kbManager.calculatePreferenceScore({
                similarity: 0.8,
                preference: negativePreference,
                quality: 0.9,
                freshness: 0.7,
            });
            (0, vitest_1.expect)(score).toBeLessThan(0.8); // Should be reduced by negative preference
        });
    });
    (0, vitest_1.describe)("MMR diversity selection", function () {
        (0, vitest_1.it)("should select diverse objects using MMR", function () { return __awaiter(void 0, void 0, void 0, function () {
            var objects, selected, titles;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.all([
                            kbManager.createObject({
                                kind: "motif",
                                title: "Blue Circle",
                                body: { shape: "circle", color: "blue" },
                                tags: ["blue", "circle"],
                                version: "1.0.0",
                                status: "active",
                            }),
                            kbManager.createObject({
                                kind: "motif",
                                title: "Blue Square",
                                body: { shape: "square", color: "blue" },
                                tags: ["blue", "square"],
                                version: "1.0.0",
                                status: "active",
                            }),
                            kbManager.createObject({
                                kind: "motif",
                                title: "Red Circle",
                                body: { shape: "circle", color: "red" },
                                tags: ["red", "circle"],
                                version: "1.0.0",
                                status: "active",
                            }),
                        ])];
                    case 1:
                        objects = _a.sent();
                        selected = kbManager.selectWithMMR(objects, "blue circle", {
                            relevanceWeight: 0.7,
                            diversityWeight: 0.3,
                            maxResults: 2,
                        });
                        (0, vitest_1.expect)(selected).toHaveLength(2);
                        titles = selected.map(function (obj) { return obj.title; });
                        (0, vitest_1.expect)(titles).toContain("Blue Circle");
                        (0, vitest_1.expect)(titles).not.toEqual(["Blue Circle", "Blue Square"]); // Should avoid too similar
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should balance relevance and diversity", function () {
            var objects = [
                {
                    id: 1,
                    title: "Blue Circle",
                    similarity: 0.9,
                    tags: ["blue", "circle"],
                },
                {
                    id: 2,
                    title: "Blue Square",
                    similarity: 0.8,
                    tags: ["blue", "square"],
                },
                {
                    id: 3,
                    title: "Red Triangle",
                    similarity: 0.3,
                    tags: ["red", "triangle"],
                },
            ];
            var selected = kbManager.selectWithMMR(objects, "blue shapes", {
                relevanceWeight: 0.7,
                diversityWeight: 0.3,
                maxResults: 2,
            });
            (0, vitest_1.expect)(selected).toHaveLength(2);
            // Should include high relevance item and diverse item
            var ids = selected.map(function (obj) { return obj.id; });
            (0, vitest_1.expect)(ids).toContain(1); // Most relevant
            (0, vitest_1.expect)(ids).toContain(3); // Most diverse
        });
    });
    (0, vitest_1.describe)("governance filtering", function () {
        (0, vitest_1.it)("should filter out inappropriate content", function () { return __awaiter(void 0, void 0, void 0, function () {
            var inappropriateObject;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        inappropriateObject = {
                            kind: "motif",
                            title: "Inappropriate Content",
                            body: { description: "sensitive content" },
                            tags: ["inappropriate"],
                            version: "1.0.0",
                            status: "active",
                        };
                        // Should be rejected by governance filter
                        return [4 /*yield*/, (0, vitest_1.expect)(kbManager.createObject(inappropriateObject)).rejects.toThrow(/content.*policy/i)];
                    case 1:
                        // Should be rejected by governance filter
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should enforce neutrality controls", function () { return __awaiter(void 0, void 0, void 0, function () {
            var biasedObject;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        biasedObject = {
                            kind: "glossary",
                            title: "Biased Glossary",
                            body: { terms: { good: "only blue things", bad: "everything else" } },
                            tags: ["biased"],
                            version: "1.0.0",
                            status: "active",
                        };
                        return [4 /*yield*/, (0, vitest_1.expect)(kbManager.createObject(biasedObject)).rejects.toThrow(/bias.*detected/i)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should validate content policy compliance", function () {
            var content = "This is appropriate content about geometric shapes";
            var isCompliant = kbManager.validateContentPolicy(content);
            (0, vitest_1.expect)(isCompliant).toBe(true);
            var inappropriateContent = "This contains sensitive information";
            var isNotCompliant = kbManager.validateContentPolicy(inappropriateContent);
            (0, vitest_1.expect)(isNotCompliant).toBe(false);
        });
    });
    (0, vitest_1.describe)("compatibility testing", function () {
        (0, vitest_1.it)("should test object compatibility with canonical prompts", function () { return __awaiter(void 0, void 0, void 0, function () {
            var object, canonicalPrompts, compatibilityResults;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        object = {
                            kind: "style_pack",
                            title: "Modern Style",
                            body: { colors: ["#000000", "#ffffff"] },
                            tags: ["modern", "minimal"],
                            version: "1.0.0",
                            status: "experimental",
                        };
                        canonicalPrompts = [
                            "modern design",
                            "minimal layout",
                            "black and white theme",
                        ];
                        return [4 /*yield*/, kbManager.testCompatibility(object, canonicalPrompts)];
                    case 1:
                        compatibilityResults = _a.sent();
                        (0, vitest_1.expect)(compatibilityResults.passed).toBeGreaterThan(0);
                        (0, vitest_1.expect)(compatibilityResults.total).toBe(canonicalPrompts.length);
                        (0, vitest_1.expect)(compatibilityResults.score).toBeGreaterThan(0.5); // Should pass most tests
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should prevent activation of incompatible objects", function () { return __awaiter(void 0, void 0, void 0, function () {
            var incompatibleObject, created;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        incompatibleObject = {
                            kind: "motif",
                            title: "Broken Motif",
                            body: { invalid: "structure" },
                            tags: ["broken"],
                            version: "1.0.0",
                            status: "experimental",
                        };
                        return [4 /*yield*/, kbManager.createObject(incompatibleObject)];
                    case 1:
                        created = _a.sent();
                        // Should fail compatibility test and remain experimental
                        return [4 /*yield*/, (0, vitest_1.expect)(kbManager.activateObject(created.id)).rejects.toThrow(/compatibility.*failed/i)];
                    case 2:
                        // Should fail compatibility test and remain experimental
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)("versioning and lineage", function () {
        (0, vitest_1.it)("should maintain parent lineage", function () { return __awaiter(void 0, void 0, void 0, function () {
            var v1, v2, lineage;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, kbManager.createObject({
                            kind: "rule",
                            title: "Original Rule",
                            body: { condition: "test", action: "original" },
                            tags: ["test"],
                            version: "1.0.0",
                            status: "active",
                        })];
                    case 1:
                        v1 = _a.sent();
                        return [4 /*yield*/, kbManager.updateObject(v1.id, __assign(__assign({}, v1), { body: { condition: "test", action: "updated" }, version: "2.0.0" }))];
                    case 2:
                        v2 = _a.sent();
                        (0, vitest_1.expect)(v2.parentId).toBe(v1.id);
                        (0, vitest_1.expect)(v2.version).toBe("2.0.0");
                        return [4 /*yield*/, kbManager.getObjectLineage(v2.id)];
                    case 3:
                        lineage = _a.sent();
                        (0, vitest_1.expect)(lineage).toHaveLength(2);
                        (0, vitest_1.expect)(lineage[0].version).toBe("1.0.0");
                        (0, vitest_1.expect)(lineage[1].version).toBe("2.0.0");
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should follow semantic versioning", function () {
            (0, vitest_1.expect)(kbManager.isValidVersion("1.0.0")).toBe(true);
            (0, vitest_1.expect)(kbManager.isValidVersion("2.1.3")).toBe(true);
            (0, vitest_1.expect)(kbManager.isValidVersion("invalid")).toBe(false);
            (0, vitest_1.expect)(kbManager.isValidVersion("1.0")).toBe(false);
        });
        (0, vitest_1.it)("should increment versions correctly", function () {
            (0, vitest_1.expect)(kbManager.incrementVersion("1.0.0", "patch")).toBe("1.0.1");
            (0, vitest_1.expect)(kbManager.incrementVersion("1.0.0", "minor")).toBe("1.1.0");
            (0, vitest_1.expect)(kbManager.incrementVersion("1.0.0", "major")).toBe("2.0.0");
        });
    });
    (0, vitest_1.describe)("automatic deprecation", function () {
        (0, vitest_1.it)("should identify stale objects", function () { return __awaiter(void 0, void 0, void 0, function () {
            var oldDate, staleObject, staleObjects;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        oldDate = new Date();
                        oldDate.setMonth(oldDate.getMonth() - 5); // 5 months ago
                        return [4 /*yield*/, kbManager.createObject({
                                kind: "motif",
                                title: "Stale Motif",
                                body: { shape: "old" },
                                tags: ["stale"],
                                version: "1.0.0",
                                status: "active",
                            })];
                    case 1:
                        staleObject = _a.sent();
                        // Mock old creation date
                        vitest_1.vi.spyOn(kbManager, "getObjectAge").mockReturnValue(150); // 150 days
                        return [4 /*yield*/, kbManager.identifyStaleObjects()];
                    case 2:
                        staleObjects = _a.sent();
                        (0, vitest_1.expect)(staleObjects.some(function (obj) { return obj.id === staleObject.id; })).toBe(true);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should deprecate unused objects", function () { return __awaiter(void 0, void 0, void 0, function () {
            var unusedObject, updated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, kbManager.createObject({
                            kind: "fewshot",
                            title: "Unused Example",
                            body: { prompt: "test", response: "test" },
                            tags: ["unused"],
                            version: "1.0.0",
                            status: "active",
                        })];
                    case 1:
                        unusedObject = _a.sent();
                        // Mock low usage stats
                        vitest_1.vi.spyOn(kbManager, "getObjectUsageStats").mockReturnValue({
                            usageCount: 0,
                            lastUsed: null,
                            winRate: 0,
                        });
                        return [4 /*yield*/, kbManager.deprecateUnusedObjects()];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, kbManager.getObject(unusedObject.id)];
                    case 3:
                        updated = _a.sent();
                        (0, vitest_1.expect)(updated.status).toBe("deprecated");
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
