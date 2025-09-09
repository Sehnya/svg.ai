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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
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
exports.KnowledgeBaseManager = void 0;
var drizzle_orm_1 = require("drizzle-orm");
var config_1 = require("../db/config");
var schema_1 = require("../db/schema");
var crypto_1 = require("crypto");
var cache_1 = require("../utils/cache");
var tokenOptimizer_1 = require("../utils/tokenOptimizer");
var EmbeddingService_js_1 = require("./EmbeddingService.js");
// Canonical prompts for testing KB objects
var CANONICAL_PROMPTS = [
    "Create a simple geometric icon",
    "Design a Mediterranean-style architectural element",
    "Generate an abstract pattern with flowing lines",
    "Make a minimalist logo with clean shapes",
    "Create a decorative border with organic motifs",
];
var KnowledgeBaseManager = /** @class */ (function () {
    function KnowledgeBaseManager() {
        this.cacheManager = cache_1.cacheManager;
        this.tokenOptimizer = tokenOptimizer_1.tokenOptimizer;
        // Scoring algorithm weights (α=0.6 similarity + β=0.2 preference + γ=0.2 quality - δ=0.1 freshness)
        this.SCORING_WEIGHTS = {
            similarity: 0.6,
            preference: 0.2,
            quality: 0.2,
            freshness: 0.1,
        };
        // MMR algorithm weights (0.7 relevance, 0.3 diversity)
        this.MMR_WEIGHTS = {
            relevance: 0.7,
            diversity: 0.3,
        };
        // Preference caps to prevent echo chambers
        this.MAX_PREFERENCE_BOOST = 1.5;
        // Token budget limit
        this.MAX_TOKEN_LIMIT = 500;
        // Quality threshold for active objects
        this.MIN_QUALITY_SCORE = 0.3;
        // Freshness penalty threshold (4 months)
        this.FRESHNESS_THRESHOLD = 4 * 30 * 24 * 60 * 60 * 1000; // 4 months in ms
        if (KnowledgeBaseManager.instance) {
            return KnowledgeBaseManager.instance;
        }
        // Initialize embedding service if API key is available
        if (process.env.OPENAI_API_KEY) {
            this.embeddingService = new EmbeddingService_js_1.EmbeddingService({
                model: "text-embedding-3-small",
                apiKey: process.env.OPENAI_API_KEY,
                batchSize: 100,
                cacheEnabled: true,
            });
        }
        KnowledgeBaseManager.instance = this;
    }
    KnowledgeBaseManager.getInstance = function () {
        if (!KnowledgeBaseManager.instance) {
            KnowledgeBaseManager.instance = new KnowledgeBaseManager();
        }
        return KnowledgeBaseManager.instance;
    };
    // CRUD Operations for KB Objects
    KnowledgeBaseManager.prototype.createObject = function (object, userId, reason) {
        return __awaiter(this, void 0, void 0, function () {
            var tokenValidation, optimization, validation, id, version, embedding, error_1, newObject, created;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tokenValidation = this.tokenOptimizer.validateTokenBudget(object);
                        if (!tokenValidation.valid) {
                            throw new Error("Object exceeds token limit: ".concat(tokenValidation.tokenCount, " > ").concat(tokenValidation.limit, " tokens"));
                        }
                        optimization = this.tokenOptimizer.optimizeKBObject(object);
                        if (optimization.savings > 0) {
                            console.log("Optimized KB object: saved ".concat(optimization.savings, " tokens (").concat(optimization.savingsPercent.toFixed(1), "%)"));
                            console.log("Modifications: ".concat(optimization.modifications.join(", ")));
                        }
                        return [4 /*yield*/, this.validateObject(object)];
                    case 1:
                        validation = _a.sent();
                        if (!validation.isValid) {
                            throw new Error("Validation failed: ".concat(validation.issues.join(", ")));
                        }
                        id = this.generateObjectId(object.kind, object.title);
                        version = object.version || "1.0.0";
                        embedding = null;
                        if (!this.embeddingService) return [3 /*break*/, 5];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.embeddingService.generateEmbeddingForKBObject(object)];
                    case 3:
                        embedding =
                            _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        error_1 = _a.sent();
                        console.warn("Failed to generate embedding for KB object:", error_1);
                        return [3 /*break*/, 5];
                    case 5:
                        newObject = __assign(__assign({}, object), { id: id, version: version, status: object.status || "experimental", qualityScore: "0", embedding: embedding });
                        return [4 /*yield*/, config_1.db.insert(schema_1.kbObjects).values(newObject).returning()];
                    case 6:
                        created = (_a.sent())[0];
                        // Log audit trail
                        return [4 /*yield*/, this.logAudit(id, "create", null, created, userId, reason)];
                    case 7:
                        // Log audit trail
                        _a.sent();
                        if (!(created.status === "active")) return [3 /*break*/, 9];
                        return [4 /*yield*/, this.runCompatibilityTests(created)];
                    case 8:
                        _a.sent();
                        _a.label = 9;
                    case 9: 
                    // Invalidate cache since KB changed
                    return [4 /*yield*/, this.cacheManager.invalidate()];
                    case 10:
                        // Invalidate cache since KB changed
                        _a.sent();
                        return [2 /*return*/, created];
                }
            });
        });
    };
    KnowledgeBaseManager.prototype.updateObject = function (id, updates, userId, reason) {
        return __awaiter(this, void 0, void 0, function () {
            var current, updatedObject, tokenValidation, optimization, validation, updated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, config_1.db
                            .select()
                            .from(schema_1.kbObjects)
                            .where((0, drizzle_orm_1.eq)(schema_1.kbObjects.id, id))];
                    case 1:
                        current = (_a.sent())[0];
                        if (!current) {
                            throw new Error("Object not found: ".concat(id));
                        }
                        updatedObject = __assign(__assign({}, current), updates);
                        tokenValidation = this.tokenOptimizer.validateTokenBudget(updatedObject);
                        if (!tokenValidation.valid) {
                            throw new Error("Updated object exceeds token limit: ".concat(tokenValidation.tokenCount, " > ").concat(tokenValidation.limit, " tokens"));
                        }
                        // Optimize updated content
                        if (updates.body) {
                            optimization = this.tokenOptimizer.optimizeKBObject(updatedObject);
                            if (optimization.savings > 0) {
                                console.log("Optimized updated KB object: saved ".concat(optimization.savings, " tokens"));
                            }
                        }
                        return [4 /*yield*/, this.validateObject(updatedObject)];
                    case 2:
                        validation = _a.sent();
                        if (!validation.isValid) {
                            throw new Error("Validation failed: ".concat(validation.issues.join(", ")));
                        }
                        // Update version if content changed
                        if (updates.body || updates.title || updates.tags) {
                            updates.version = this.incrementVersion(current.version);
                            updates.parentId = current.id;
                        }
                        return [4 /*yield*/, config_1.db
                                .update(schema_1.kbObjects)
                                .set(__assign(__assign({}, updates), { updatedAt: new Date() }))
                                .where((0, drizzle_orm_1.eq)(schema_1.kbObjects.id, id))
                                .returning()];
                    case 3:
                        updated = (_a.sent())[0];
                        // Log audit trail
                        return [4 /*yield*/, this.logAudit(id, "update", current, updated, userId, reason)];
                    case 4:
                        // Log audit trail
                        _a.sent();
                        // Invalidate cache since KB changed
                        return [4 /*yield*/, this.cacheManager.invalidate()];
                    case 5:
                        // Invalidate cache since KB changed
                        _a.sent();
                        return [2 /*return*/, updated];
                }
            });
        });
    };
    KnowledgeBaseManager.prototype.deleteObject = function (id, userId, reason) {
        return __awaiter(this, void 0, void 0, function () {
            var current;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, config_1.db
                            .select()
                            .from(schema_1.kbObjects)
                            .where((0, drizzle_orm_1.eq)(schema_1.kbObjects.id, id))];
                    case 1:
                        current = (_a.sent())[0];
                        if (!current) {
                            throw new Error("Object not found: ".concat(id));
                        }
                        // Delete object (cascades to links)
                        return [4 /*yield*/, config_1.db.delete(schema_1.kbObjects).where((0, drizzle_orm_1.eq)(schema_1.kbObjects.id, id))];
                    case 2:
                        // Delete object (cascades to links)
                        _a.sent();
                        // Log audit trail
                        return [4 /*yield*/, this.logAudit(id, "delete", current, null, userId, reason)];
                    case 3:
                        // Log audit trail
                        _a.sent();
                        // Invalidate cache
                        return [4 /*yield*/, this.cacheManager.invalidate()];
                    case 4:
                        // Invalidate cache
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    KnowledgeBaseManager.prototype.getObject = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var object;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, config_1.db
                            .select()
                            .from(schema_1.kbObjects)
                            .where((0, drizzle_orm_1.eq)(schema_1.kbObjects.id, id))];
                    case 1:
                        object = (_a.sent())[0];
                        return [2 /*return*/, object || null];
                }
            });
        });
    };
    KnowledgeBaseManager.prototype.listObjects = function () {
        return __awaiter(this, arguments, void 0, function (filters, pagination) {
            var query, countQuery, conditions, whereClause, _a, objects, count;
            if (filters === void 0) { filters = {}; }
            if (pagination === void 0) { pagination = {}; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        query = config_1.db.select().from(schema_1.kbObjects);
                        countQuery = config_1.db
                            .select({ count: (0, drizzle_orm_1.sql)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["count(*)"], ["count(*)"]))) })
                            .from(schema_1.kbObjects);
                        conditions = [];
                        if (filters.kind) {
                            conditions.push((0, drizzle_orm_1.eq)(schema_1.kbObjects.kind, filters.kind));
                        }
                        if (filters.status) {
                            conditions.push((0, drizzle_orm_1.eq)(schema_1.kbObjects.status, filters.status));
                        }
                        if (filters.tags && filters.tags.length > 0) {
                            conditions.push((0, drizzle_orm_1.sql)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["", " && ", ""], ["", " && ", ""])), schema_1.kbObjects.tags, filters.tags));
                        }
                        if (filters.search) {
                            conditions.push((0, drizzle_orm_1.or)((0, drizzle_orm_1.like)(schema_1.kbObjects.title, "%".concat(filters.search, "%")), (0, drizzle_orm_1.like)((0, drizzle_orm_1.sql)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["", "::text"], ["", "::text"])), schema_1.kbObjects.body), "%".concat(filters.search, "%"))));
                        }
                        if (conditions.length > 0) {
                            whereClause = conditions.length === 1 ? conditions[0] : drizzle_orm_1.and.apply(void 0, conditions);
                            query = query.where(whereClause);
                            countQuery = countQuery.where(whereClause);
                        }
                        // Apply pagination
                        if (pagination.limit) {
                            query = query.limit(pagination.limit);
                        }
                        if (pagination.offset) {
                            query = query.offset(pagination.offset);
                        }
                        // Order by quality and updated date
                        query = query.orderBy((0, drizzle_orm_1.desc)(schema_1.kbObjects.qualityScore), (0, drizzle_orm_1.desc)(schema_1.kbObjects.updatedAt));
                        return [4 /*yield*/, Promise.all([query, countQuery])];
                    case 1:
                        _a = _b.sent(), objects = _a[0], count = _a[1][0].count;
                        return [2 /*return*/, { objects: objects, total: count }];
                }
            });
        });
    };
    // Knowledge Retrieval with Preferences
    KnowledgeBaseManager.prototype.retrieveGrounding = function (prompt, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var cacheKey, cached, _a, userPrefs, globalPrefs, candidates, scored, grounding, optimization, complexity, ttlMinutes;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        cacheKey = this.cacheManager.generateCacheKey(prompt, userId);
                        return [4 /*yield*/, this.cacheManager.get(cacheKey)];
                    case 1:
                        cached = _b.sent();
                        if (cached) {
                            // Record cache hit for metrics
                            this.tokenOptimizer.recordUsage({
                                promptTokens: this.tokenOptimizer.estimateTokens(prompt),
                                completionTokens: 0,
                                totalTokens: this.tokenOptimizer.estimateTokens(cached),
                                cost: this.tokenOptimizer.calculateCost({
                                    promptTokens: this.tokenOptimizer.estimateTokens(prompt),
                                    totalTokens: this.tokenOptimizer.estimateTokens(cached),
                                }),
                            }, true // fromCache = true
                            );
                            return [2 /*return*/, cached];
                        }
                        return [4 /*yield*/, Promise.all([
                                this.getUserPreferences(userId),
                                this.getGlobalPreferences(),
                            ])];
                    case 2:
                        _a = _b.sent(), userPrefs = _a[0], globalPrefs = _a[1];
                        return [4 /*yield*/, this.getCandidates(prompt)];
                    case 3:
                        candidates = _b.sent();
                        return [4 /*yield*/, this.scoreObjects(candidates, prompt, userPrefs, globalPrefs)];
                    case 4:
                        scored = _b.sent();
                        grounding = this.selectGroundingSet(scored);
                        optimization = this.tokenOptimizer.optimizeGroundingData(grounding);
                        if (optimization.savings > 0) {
                            grounding = JSON.parse(JSON.stringify(grounding)); // Apply optimizations
                            console.log("Token optimization saved ".concat(optimization.savings, " tokens (").concat(optimization.savingsPercent.toFixed(1), "%)"));
                        }
                        complexity = this.tokenOptimizer.estimateTokens(grounding);
                        ttlMinutes = complexity > 2000 ? 15 : complexity > 1000 ? 10 : 5;
                        return [4 /*yield*/, this.cacheManager.set(cacheKey, grounding, ttlMinutes)];
                    case 5:
                        _b.sent();
                        // Record token usage for metrics
                        this.tokenOptimizer.recordUsage({
                            promptTokens: this.tokenOptimizer.estimateTokens(prompt),
                            completionTokens: 0,
                            totalTokens: this.tokenOptimizer.estimateTokens(grounding),
                            cost: this.tokenOptimizer.calculateCost({
                                promptTokens: this.tokenOptimizer.estimateTokens(prompt),
                                totalTokens: this.tokenOptimizer.estimateTokens(grounding),
                            }),
                        });
                        return [2 /*return*/, grounding];
                }
            });
        });
    };
    KnowledgeBaseManager.prototype.getCandidates = function (prompt) {
        return __awaiter(this, void 0, void 0, function () {
            var error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.embeddingService) return [3 /*break*/, 4];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.getCandidatesWithSemanticSearch(prompt)];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        error_2 = _a.sent();
                        console.warn("Semantic search failed, falling back to tag-based search:", error_2);
                        return [3 /*break*/, 4];
                    case 4: 
                    // Fallback to tag-based filtering
                    return [2 /*return*/, this.getCandidatesWithTagSearch(prompt)];
                }
            });
        });
    };
    KnowledgeBaseManager.prototype.getCandidatesWithSemanticSearch = function (prompt) {
        return __awaiter(this, void 0, void 0, function () {
            var promptEmbedding, candidates, candidatesWithSimilarity;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.embeddingService) {
                            throw new Error("Embedding service not available");
                        }
                        return [4 /*yield*/, this.embeddingService.generateEmbedding(prompt)];
                    case 1:
                        promptEmbedding = _a.sent();
                        return [4 /*yield*/, config_1.db
                                .select()
                                .from(schema_1.kbObjects)
                                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.kbObjects.status, "active"), (0, drizzle_orm_1.sql)(templateObject_4 || (templateObject_4 = __makeTemplateObject(["", " >= ", ""], ["", " >= ", ""])), schema_1.kbObjects.qualityScore, this.MIN_QUALITY_SCORE), (0, drizzle_orm_1.sql)(templateObject_5 || (templateObject_5 = __makeTemplateObject(["", " IS NOT NULL"], ["", " IS NOT NULL"])), schema_1.kbObjects.embedding)))];
                    case 2:
                        candidates = _a.sent();
                        candidatesWithSimilarity = candidates
                            .map(function (obj) {
                            if (!obj.embedding)
                                return null;
                            var similarity = _this.embeddingService.calculateCosineSimilarity(promptEmbedding.embedding, obj.embedding);
                            return __assign(__assign({}, obj), { semanticSimilarity: similarity });
                        })
                            .filter(function (obj) { return obj !== null && obj.semanticSimilarity > 0.3; }) // Similarity threshold
                            .sort(function (a, b) { return b.semanticSimilarity - a.semanticSimilarity; })
                            .slice(0, 50);
                        // Apply governance filters
                        return [2 /*return*/, candidatesWithSimilarity
                                .filter(function (obj) { return _this.passesGovernanceFilter(obj); })
                                .map(function (obj) {
                                var _a = obj, semanticSimilarity = _a.semanticSimilarity, kbObj = __rest(_a, ["semanticSimilarity"]);
                                return kbObj;
                            })];
                }
            });
        });
    };
    KnowledgeBaseManager.prototype.getCandidatesWithTagSearch = function (prompt) {
        return __awaiter(this, void 0, void 0, function () {
            var candidates;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, config_1.db
                            .select()
                            .from(schema_1.kbObjects)
                            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.kbObjects.status, "active"), (0, drizzle_orm_1.sql)(templateObject_6 || (templateObject_6 = __makeTemplateObject(["", " >= ", ""], ["", " >= ", ""])), schema_1.kbObjects.qualityScore, this.MIN_QUALITY_SCORE)))
                            .orderBy((0, drizzle_orm_1.desc)(schema_1.kbObjects.qualityScore))];
                    case 1:
                        candidates = _a.sent();
                        // Apply content policy and governance filters
                        return [2 /*return*/, candidates.filter(function (obj) { return _this.passesGovernanceFilter(obj); })];
                }
            });
        });
    };
    KnowledgeBaseManager.prototype.scoreObjects = function (objects, prompt, userPrefs, globalPrefs) {
        return __awaiter(this, void 0, void 0, function () {
            var scoredObjects;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.all(objects.map(function (obj) { return __awaiter(_this, void 0, void 0, function () {
                            var similarity, preferenceBoost, quality, freshness, score;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, this.calculateSimilarity(obj, prompt)];
                                    case 1:
                                        similarity = _a.sent();
                                        preferenceBoost = Math.min(this.MAX_PREFERENCE_BOOST, this.getPreferenceBoost(obj, userPrefs) +
                                            0.5 * this.getPreferenceBoost(obj, globalPrefs));
                                        quality = parseFloat(obj.qualityScore || "0");
                                        freshness = this.getFreshnessPenalty(obj.updatedAt);
                                        score = this.SCORING_WEIGHTS.similarity * similarity +
                                            this.SCORING_WEIGHTS.preference * preferenceBoost +
                                            this.SCORING_WEIGHTS.quality * quality -
                                            this.SCORING_WEIGHTS.freshness * freshness;
                                        return [2 /*return*/, __assign(__assign({}, obj), { score: score, similarity: similarity, preferenceBoost: preferenceBoost, quality: quality, freshness: freshness })];
                                }
                            });
                        }); }))];
                    case 1:
                        scoredObjects = _a.sent();
                        return [2 /*return*/, scoredObjects.sort(function (a, b) { return b.score - a.score; })];
                }
            });
        });
    };
    KnowledgeBaseManager.prototype.selectGroundingSet = function (scored) {
        // Apply Maximal Marginal Relevance for diversity
        var stylePack = scored.find(function (obj) { return obj.kind === "style_pack"; });
        var motifs = this.selectDiverseObjects(scored.filter(function (obj) { return obj.kind === "motif"; }), 6);
        var glossary = this.selectDiverseObjects(scored.filter(function (obj) { return obj.kind === "glossary"; }), 3);
        var fewshot = scored.filter(function (obj) { return obj.kind === "fewshot"; }).slice(0, 1);
        return {
            stylePack: stylePack === null || stylePack === void 0 ? void 0 : stylePack.body,
            motifs: motifs.map(function (m) { return m.body; }),
            glossary: glossary.map(function (g) { return g.body; }),
            fewshot: fewshot.map(function (f) { return f.body; }),
            components: this.getReusableComponents(motifs),
        };
    };
    KnowledgeBaseManager.prototype.selectDiverseObjects = function (objects, maxCount) {
        var _this = this;
        if (objects.length <= maxCount)
            return objects;
        var selected = [];
        var remaining = __spreadArray([], objects, true);
        // Select first object (highest score)
        if (remaining.length > 0) {
            selected.push(remaining.shift());
        }
        // Apply MMR for remaining selections
        while (selected.length < maxCount && remaining.length > 0) {
            var bestIndex = 0;
            var bestScore = -Infinity;
            var _loop_1 = function (i) {
                var candidate = remaining[i];
                var relevance = candidate.score;
                // Calculate diversity (minimum similarity to selected objects)
                var diversity = Math.min.apply(Math, selected.map(function (sel) { return 1 - _this.calculateObjectSimilarity(candidate, sel); }));
                var mmrScore = this_1.MMR_WEIGHTS.relevance * relevance +
                    this_1.MMR_WEIGHTS.diversity * diversity;
                if (mmrScore > bestScore) {
                    bestScore = mmrScore;
                    bestIndex = i;
                }
            };
            var this_1 = this;
            for (var i = 0; i < remaining.length; i++) {
                _loop_1(i);
            }
            selected.push(remaining.splice(bestIndex, 1)[0]);
        }
        return selected;
    };
    // Cache and Token Management
    KnowledgeBaseManager.prototype.getCacheMetrics = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.cacheManager.getMetrics()];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    KnowledgeBaseManager.prototype.getTokenMetrics = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.tokenOptimizer.getMetrics()];
            });
        });
    };
    KnowledgeBaseManager.prototype.clearCache = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.cacheManager.clear()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    KnowledgeBaseManager.prototype.cleanupCache = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.cacheManager.cleanup()];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    KnowledgeBaseManager.prototype.invalidateCache = function (pattern) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.cacheManager.invalidate(pattern)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    KnowledgeBaseManager.prototype.optimizeObject = function (objectId) {
        return __awaiter(this, void 0, void 0, function () {
            var object;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getObject(objectId)];
                    case 1:
                        object = _a.sent();
                        if (!object) {
                            throw new Error("Object not found: ".concat(objectId));
                        }
                        return [2 /*return*/, this.tokenOptimizer.optimizeKBObject(object)];
                }
            });
        });
    };
    KnowledgeBaseManager.prototype.getOptimizationRecommendations = function () {
        return this.tokenOptimizer.getOptimizationRecommendations();
    };
    KnowledgeBaseManager.prototype.performCacheHealthCheck = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.cacheManager.healthCheck()];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    // Batch operations for token efficiency
    KnowledgeBaseManager.prototype.batchOptimizeObjects = function (objectIds) {
        return __awaiter(this, void 0, void 0, function () {
            var results, totalSavings, optimized, _i, objectIds_1, id, result, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        results = [];
                        totalSavings = 0;
                        optimized = 0;
                        _i = 0, objectIds_1 = objectIds;
                        _a.label = 1;
                    case 1:
                        if (!(_i < objectIds_1.length)) return [3 /*break*/, 6];
                        id = objectIds_1[_i];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.optimizeObject(id)];
                    case 3:
                        result = _a.sent();
                        results.push({ id: id, result: result });
                        if (result.savings > 0) {
                            optimized++;
                            totalSavings += result.savings;
                        }
                        return [3 /*break*/, 5];
                    case 4:
                        error_3 = _a.sent();
                        console.error("Failed to optimize object ".concat(id, ":"), error_3);
                        return [3 /*break*/, 5];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6: return [2 /*return*/, { optimized: optimized, totalSavings: totalSavings, results: results }];
                }
            });
        });
    };
    // Validation and Governance
    KnowledgeBaseManager.prototype.validateObject = function (object) {
        return __awaiter(this, void 0, void 0, function () {
            var issues, tokenValidation;
            return __generator(this, function (_a) {
                issues = [];
                // Token budget check using tokenOptimizer
                if (object.body) {
                    tokenValidation = this.tokenOptimizer.validateTokenBudget(object);
                    if (!tokenValidation.valid) {
                        issues.push("Object exceeds ".concat(tokenValidation.limit, " token limit (").concat(tokenValidation.tokenCount, " tokens)"));
                    }
                }
                // Content policy checks
                if (this.containsSensitiveContent(object)) {
                    issues.push("Contains sensitive or inappropriate content");
                }
                // Bias detection
                if (this.detectBias(object)) {
                    issues.push("Potential bias detected in content");
                }
                // Neutrality validation
                if (!this.isDesignNeutral(object)) {
                    issues.push("Content not design-neutral");
                }
                // Kind-specific validation
                if (object.kind && !this.validateKindSpecificContent(object)) {
                    issues.push("Invalid content for kind: ".concat(object.kind));
                }
                return [2 /*return*/, {
                        isValid: issues.length === 0,
                        issues: issues,
                        tokenCount: object.body ? this.estimateTokens(object.body) : undefined,
                    }];
            });
        });
    };
    KnowledgeBaseManager.prototype.passesGovernanceFilter = function (object) {
        return (object.status === "active" &&
            this.passesContentPolicy(object) &&
            this.meetsQualityThreshold(object) &&
            !this.containsSensitiveContent(object) &&
            this.isDesignNeutral(object));
    };
    // Compatibility Testing
    KnowledgeBaseManager.prototype.runCompatibilityTests = function (object) {
        return __awaiter(this, void 0, void 0, function () {
            var results, issues, _i, CANONICAL_PROMPTS_1, prompt_1, testGrounding, error_4, averageScore, passed;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        results = [];
                        issues = [];
                        _i = 0, CANONICAL_PROMPTS_1 = CANONICAL_PROMPTS;
                        _a.label = 1;
                    case 1:
                        if (!(_i < CANONICAL_PROMPTS_1.length)) return [3 /*break*/, 6];
                        prompt_1 = CANONICAL_PROMPTS_1[_i];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.testObjectInGrounding(object, prompt_1)];
                    case 3:
                        testGrounding = _a.sent();
                        results.push(testGrounding.score);
                        if (!testGrounding.passed) {
                            issues.push("Failed with prompt: \"".concat(prompt_1, "\""));
                        }
                        return [3 /*break*/, 5];
                    case 4:
                        error_4 = _a.sent();
                        results.push(0);
                        issues.push("Error with prompt \"".concat(prompt_1, "\": ").concat(error_4));
                        return [3 /*break*/, 5];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6:
                        averageScore = results.reduce(function (a, b) { return a + b; }, 0) / results.length;
                        passed = averageScore >= 0.7 && issues.length === 0;
                        if (!passed) return [3 /*break*/, 8];
                        return [4 /*yield*/, config_1.db
                                .update(schema_1.kbObjects)
                                .set({ qualityScore: averageScore.toString() })
                                .where((0, drizzle_orm_1.eq)(schema_1.kbObjects.id, object.id))];
                    case 7:
                        _a.sent();
                        _a.label = 8;
                    case 8: return [2 /*return*/, {
                            passed: passed,
                            score: averageScore,
                            issues: issues,
                        }];
                }
            });
        });
    };
    KnowledgeBaseManager.prototype.testObjectInGrounding = function (object, prompt) {
        return __awaiter(this, void 0, void 0, function () {
            var similarity, hasValidStructure, score, passed;
            return __generator(this, function (_a) {
                similarity = this.calculateSimilarity(object, prompt);
                hasValidStructure = this.validateObjectStructure(object);
                score = similarity * (hasValidStructure ? 1 : 0.5);
                passed = score >= 0.5 && hasValidStructure;
                return [2 /*return*/, { passed: passed, score: score }];
            });
        });
    };
    // Helper Methods
    KnowledgeBaseManager.prototype.calculateSimilarity = function (object, prompt) {
        return __awaiter(this, void 0, void 0, function () {
            var promptEmbedding, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(this.embeddingService &&
                            object.embedding &&
                            object.embedding.length > 0)) return [3 /*break*/, 4];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.embeddingService.generateEmbedding(prompt)];
                    case 2:
                        promptEmbedding = _a.sent();
                        return [2 /*return*/, this.embeddingService.calculateCosineSimilarity(promptEmbedding.embedding, object.embedding)];
                    case 3:
                        error_5 = _a.sent();
                        console.warn("Failed to calculate semantic similarity, using tag-based fallback:", error_5);
                        return [3 /*break*/, 4];
                    case 4: 
                    // Tag-based similarity as fallback
                    return [2 /*return*/, this.calculateTagSimilarity(object, prompt)];
                }
            });
        });
    };
    // Token estimation using tokenOptimizer
    KnowledgeBaseManager.prototype.estimateTokens = function (content) {
        return this.tokenOptimizer.estimateTokens(content);
    };
    KnowledgeBaseManager.prototype.calculateTagSimilarity = function (object, prompt) {
        if (!object.tags || object.tags.length === 0)
            return 0;
        var promptLower = prompt.toLowerCase();
        var matchingTags = object.tags.filter(function (tag) {
            return promptLower.includes(tag.toLowerCase());
        });
        return matchingTags.length / object.tags.length;
    };
    KnowledgeBaseManager.prototype.calculateObjectSimilarity = function (obj1, obj2) {
        // Calculate similarity between two objects based on tags
        if (!obj1.tags || !obj2.tags)
            return 0;
        var tags1 = new Set(obj1.tags.map(function (t) { return t.toLowerCase(); }));
        var tags2 = new Set(obj2.tags.map(function (t) { return t.toLowerCase(); }));
        var intersection = new Set(Array.from(tags1).filter(function (x) { return tags2.has(x); }));
        var union = new Set(__spreadArray(__spreadArray([], Array.from(tags1), true), Array.from(tags2), true));
        return intersection.size / union.size; // Jaccard similarity
    };
    KnowledgeBaseManager.prototype.getPreferenceBoost = function (object, preferences) {
        var boost = 0;
        // Tag-based preferences
        if (object.tags) {
            for (var _i = 0, _a = object.tags; _i < _a.length; _i++) {
                var tag = _a[_i];
                boost += preferences.tagWeights[tag] || 0;
            }
        }
        // Kind-based preferences
        boost += preferences.kindWeights[object.kind] || 0;
        return Math.min(boost, this.MAX_PREFERENCE_BOOST);
    };
    KnowledgeBaseManager.prototype.getFreshnessPenalty = function (updatedAt) {
        if (!updatedAt)
            return 1; // Maximum penalty for objects without update date
        var age = Date.now() - updatedAt.getTime();
        if (age > this.FRESHNESS_THRESHOLD) {
            return Math.min(1, age / this.FRESHNESS_THRESHOLD - 1);
        }
        return 0; // No penalty for fresh content
    };
    KnowledgeBaseManager.prototype.getReusableComponents = function (motifs) {
        // Extract reusable components from motifs
        return motifs
            .filter(function (motif) { var _a; return ((_a = motif.body) === null || _a === void 0 ? void 0 : _a.reusable) === true; })
            .map(function (motif) { var _a; return (_a = motif.body) === null || _a === void 0 ? void 0 : _a.component; })
            .filter(Boolean);
    };
    // Content validation helpers (removed old estimateTokens - now using tokenOptimizer)
    KnowledgeBaseManager.prototype.containsSensitiveContent = function (object) {
        var sensitiveKeywords = [
            "violence",
            "hate",
            "discrimination",
            "explicit",
            "inappropriate",
            "offensive",
            "harmful",
            "dangerous",
            "illegal",
        ];
        var content = JSON.stringify(object).toLowerCase();
        return sensitiveKeywords.some(function (keyword) { return content.includes(keyword); });
    };
    KnowledgeBaseManager.prototype.detectBias = function (object) {
        // Simple bias detection - could be enhanced with ML models
        var biasIndicators = [
            "always",
            "never",
            "all",
            "none",
            "only",
            "must",
            "should not",
            "better than",
            "worse than",
            "superior",
            "inferior",
        ];
        var content = JSON.stringify(object).toLowerCase();
        var biasCount = biasIndicators.filter(function (indicator) {
            return content.includes(indicator);
        }).length;
        return biasCount > 2; // Threshold for bias detection
    };
    KnowledgeBaseManager.prototype.isDesignNeutral = function (object) {
        // Check if content is design-focused and neutral
        var nonNeutralKeywords = [
            "political",
            "religious",
            "controversial",
            "personal",
            "private",
            "company",
            "brand",
            "commercial",
            "advertisement",
        ];
        var content = JSON.stringify(object).toLowerCase();
        return !nonNeutralKeywords.some(function (keyword) { return content.includes(keyword); });
    };
    KnowledgeBaseManager.prototype.passesContentPolicy = function (object) {
        return (!this.containsSensitiveContent(object) &&
            this.isDesignNeutral(object) &&
            !this.detectBias(object));
    };
    KnowledgeBaseManager.prototype.meetsQualityThreshold = function (object) {
        var quality = parseFloat(object.qualityScore || "0");
        return quality >= this.MIN_QUALITY_SCORE;
    };
    KnowledgeBaseManager.prototype.validateKindSpecificContent = function (object) {
        if (!object.kind || !object.body)
            return false;
        switch (object.kind) {
            case "style_pack":
                return this.validateStylePack(object.body);
            case "motif":
                return this.validateMotif(object.body);
            case "glossary":
                return this.validateGlossary(object.body);
            case "rule":
                return this.validateRule(object.body);
            case "fewshot":
                return this.validateFewshot(object.body);
            default:
                return false;
        }
    };
    KnowledgeBaseManager.prototype.validateStylePack = function (body) {
        return (body &&
            typeof body === "object" &&
            body.palette &&
            body.constraints &&
            Array.isArray(body.palette.primary));
    };
    KnowledgeBaseManager.prototype.validateMotif = function (body) {
        return (body &&
            typeof body === "object" &&
            body.description &&
            (body.elements || body.component));
    };
    KnowledgeBaseManager.prototype.validateGlossary = function (body) {
        return body && typeof body === "object" && body.term && body.definition;
    };
    KnowledgeBaseManager.prototype.validateRule = function (body) {
        return body && typeof body === "object" && body.condition && body.action;
    };
    KnowledgeBaseManager.prototype.validateFewshot = function (body) {
        return body && typeof body === "object" && body.prompt && body.response;
    };
    KnowledgeBaseManager.prototype.validateObjectStructure = function (object) {
        return (object.id &&
            object.kind &&
            object.title &&
            object.body &&
            object.version &&
            object.status &&
            ["style_pack", "motif", "glossary", "rule", "fewshot"].includes(object.kind) &&
            ["active", "deprecated", "experimental"].includes(object.status));
    };
    // Utility methods
    KnowledgeBaseManager.prototype.generateObjectId = function (kind, title) {
        var timestamp = Date.now();
        var hash = (0, crypto_1.createHash)("md5")
            .update("".concat(kind, "-").concat(title, "-").concat(timestamp))
            .digest("hex");
        return "".concat(kind, "-").concat(hash.substring(0, 8));
    };
    KnowledgeBaseManager.prototype.incrementVersion = function (currentVersion) {
        var parts = currentVersion.split(".").map(Number);
        parts[2] = (parts[2] || 0) + 1; // Increment patch version
        return parts.join(".");
    };
    // Preferences management
    KnowledgeBaseManager.prototype.getUserPreferences = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var userPref, weights;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!userId) {
                            return [2 /*return*/, this.getDefaultPreferences()];
                        }
                        return [4 /*yield*/, config_1.db
                                .select()
                                .from(schema_1.userPreferences)
                                .where((0, drizzle_orm_1.eq)(schema_1.userPreferences.userId, userId))];
                    case 1:
                        userPref = (_a.sent())[0];
                        if (!userPref) {
                            return [2 /*return*/, this.getDefaultPreferences()];
                        }
                        weights = userPref.weights;
                        return [2 /*return*/, {
                                tagWeights: (weights === null || weights === void 0 ? void 0 : weights.tagWeights) || {},
                                kindWeights: (weights === null || weights === void 0 ? void 0 : weights.kindWeights) || {},
                                qualityThreshold: (weights === null || weights === void 0 ? void 0 : weights.qualityThreshold) || this.MIN_QUALITY_SCORE,
                                diversityWeight: (weights === null || weights === void 0 ? void 0 : weights.diversityWeight) || this.MMR_WEIGHTS.diversity,
                                updatedAt: userPref.updatedAt || new Date(),
                            }];
                }
            });
        });
    };
    KnowledgeBaseManager.prototype.getGlobalPreferences = function () {
        return __awaiter(this, void 0, void 0, function () {
            var globalPref, weights;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, config_1.db.select().from(schema_1.globalPreferences)];
                    case 1:
                        globalPref = (_a.sent())[0];
                        if (!globalPref) {
                            return [2 /*return*/, this.getDefaultPreferences()];
                        }
                        weights = globalPref.weights;
                        return [2 /*return*/, {
                                tagWeights: (weights === null || weights === void 0 ? void 0 : weights.tagWeights) || {},
                                kindWeights: (weights === null || weights === void 0 ? void 0 : weights.kindWeights) || {},
                                qualityThreshold: (weights === null || weights === void 0 ? void 0 : weights.qualityThreshold) || this.MIN_QUALITY_SCORE,
                                diversityWeight: (weights === null || weights === void 0 ? void 0 : weights.diversityWeight) || this.MMR_WEIGHTS.diversity,
                                updatedAt: globalPref.updatedAt || new Date(),
                            }];
                }
            });
        });
    };
    KnowledgeBaseManager.prototype.getDefaultPreferences = function () {
        return {
            tagWeights: {},
            kindWeights: {
                style_pack: 1.0,
                motif: 1.0,
                glossary: 0.8,
                rule: 0.6,
                fewshot: 0.9,
            },
            qualityThreshold: this.MIN_QUALITY_SCORE,
            diversityWeight: this.MMR_WEIGHTS.diversity,
            updatedAt: new Date(),
        };
    };
    // Audit logging
    KnowledgeBaseManager.prototype.logAudit = function (objectId, action, beforeState, afterState, userId, reason) {
        return __awaiter(this, void 0, void 0, function () {
            var auditEntry;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        auditEntry = {
                            objectId: objectId,
                            action: action,
                            beforeState: beforeState,
                            afterState: afterState,
                            userId: userId,
                            reason: reason,
                        };
                        return [4 /*yield*/, config_1.db.insert(schema_1.kbAudit).values(auditEntry)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // Link Management
    KnowledgeBaseManager.prototype.createLink = function (srcId, dstId, relation, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, src, dst, existing, newLink, created;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, Promise.all([
                            this.getObject(srcId),
                            this.getObject(dstId),
                        ])];
                    case 1:
                        _a = _b.sent(), src = _a[0], dst = _a[1];
                        if (!src)
                            throw new Error("Source object not found: ".concat(srcId));
                        if (!dst)
                            throw new Error("Destination object not found: ".concat(dstId));
                        // Prevent self-links
                        if (srcId === dstId) {
                            throw new Error("Cannot create link to self");
                        }
                        return [4 /*yield*/, config_1.db
                                .select()
                                .from(schema_1.kbLinks)
                                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.kbLinks.srcId, srcId), (0, drizzle_orm_1.eq)(schema_1.kbLinks.dstId, dstId), (0, drizzle_orm_1.eq)(schema_1.kbLinks.rel, relation)))];
                    case 2:
                        existing = (_b.sent())[0];
                        if (existing) {
                            throw new Error("Link already exists: ".concat(srcId, " -> ").concat(dstId, " (").concat(relation, ")"));
                        }
                        newLink = { srcId: srcId, dstId: dstId, rel: relation };
                        return [4 /*yield*/, config_1.db.insert(schema_1.kbLinks).values(newLink).returning()];
                    case 3:
                        created = (_b.sent())[0];
                        // Log audit trail
                        return [4 /*yield*/, this.logAudit(srcId, "link_create", null, { linkTo: dstId, relation: relation }, userId, "Created ".concat(relation, " link to ").concat(dstId))];
                    case 4:
                        // Log audit trail
                        _b.sent();
                        return [2 /*return*/, created];
                }
            });
        });
    };
    KnowledgeBaseManager.prototype.deleteLink = function (srcId, dstId, relation, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var deleted;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, config_1.db
                            .delete(schema_1.kbLinks)
                            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.kbLinks.srcId, srcId), (0, drizzle_orm_1.eq)(schema_1.kbLinks.dstId, dstId), (0, drizzle_orm_1.eq)(schema_1.kbLinks.rel, relation)))
                            .returning()];
                    case 1:
                        deleted = _a.sent();
                        if (deleted.length === 0) {
                            throw new Error("Link not found: ".concat(srcId, " -> ").concat(dstId, " (").concat(relation, ")"));
                        }
                        // Log audit trail
                        return [4 /*yield*/, this.logAudit(srcId, "link_delete", { linkTo: dstId, relation: relation }, null, userId, "Deleted ".concat(relation, " link to ").concat(dstId))];
                    case 2:
                        // Log audit trail
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    KnowledgeBaseManager.prototype.getObjectLinks = function (objectId) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, outgoing, incoming;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, Promise.all([
                            // Outgoing links (this object as source)
                            config_1.db
                                .select({
                                srcId: schema_1.kbLinks.srcId,
                                dstId: schema_1.kbLinks.dstId,
                                rel: schema_1.kbLinks.rel,
                                target: schema_1.kbObjects,
                            })
                                .from(schema_1.kbLinks)
                                .innerJoin(schema_1.kbObjects, (0, drizzle_orm_1.eq)(schema_1.kbLinks.dstId, schema_1.kbObjects.id))
                                .where((0, drizzle_orm_1.eq)(schema_1.kbLinks.srcId, objectId)),
                            // Incoming links (this object as destination)
                            config_1.db
                                .select({
                                srcId: schema_1.kbLinks.srcId,
                                dstId: schema_1.kbLinks.dstId,
                                rel: schema_1.kbLinks.rel,
                                source: schema_1.kbObjects,
                            })
                                .from(schema_1.kbLinks)
                                .innerJoin(schema_1.kbObjects, (0, drizzle_orm_1.eq)(schema_1.kbLinks.srcId, schema_1.kbObjects.id))
                                .where((0, drizzle_orm_1.eq)(schema_1.kbLinks.dstId, objectId)),
                        ])];
                    case 1:
                        _a = _b.sent(), outgoing = _a[0], incoming = _a[1];
                        return [2 /*return*/, { outgoing: outgoing, incoming: incoming }];
                }
            });
        });
    };
    // Object Lifecycle Management
    KnowledgeBaseManager.prototype.activateObject = function (id, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var object, compatibilityResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getObject(id)];
                    case 1:
                        object = _a.sent();
                        if (!object) {
                            throw new Error("Object not found: ".concat(id));
                        }
                        return [4 /*yield*/, this.runCompatibilityTests(object)];
                    case 2:
                        compatibilityResult = _a.sent();
                        if (!compatibilityResult.passed) {
                            throw new Error("Object failed compatibility tests: ".concat(compatibilityResult.issues.join(", ")));
                        }
                        return [2 /*return*/, this.updateObject(id, { status: "active" }, userId, "Activated after passing compatibility tests")];
                }
            });
        });
    };
    KnowledgeBaseManager.prototype.deprecateObject = function (id, userId, reason) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.updateObject(id, { status: "deprecated" }, userId, reason || "Object deprecated")];
            });
        });
    };
    KnowledgeBaseManager.prototype.promoteToExperimental = function (id, userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.updateObject(id, { status: "experimental" }, userId, "Promoted to experimental status")];
            });
        });
    };
    // Automatic deprecation for stale objects
    KnowledgeBaseManager.prototype.deprecateStaleObjects = function () {
        return __awaiter(this, void 0, void 0, function () {
            var staleThreshold, staleObjects, deprecatedCount, _i, staleObjects_1, obj, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        staleThreshold = new Date(Date.now() - this.FRESHNESS_THRESHOLD);
                        return [4 /*yield*/, config_1.db
                                .select()
                                .from(schema_1.kbObjects)
                                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.kbObjects.status, "active"), (0, drizzle_orm_1.sql)(templateObject_7 || (templateObject_7 = __makeTemplateObject(["", " < ", ""], ["", " < ", ""])), schema_1.kbObjects.updatedAt, staleThreshold), (0, drizzle_orm_1.sql)(templateObject_8 || (templateObject_8 = __makeTemplateObject(["", " < ", ""], ["", " < ", ""])), schema_1.kbObjects.qualityScore, this.MIN_QUALITY_SCORE)))];
                    case 1:
                        staleObjects = _a.sent();
                        deprecatedCount = 0;
                        _i = 0, staleObjects_1 = staleObjects;
                        _a.label = 2;
                    case 2:
                        if (!(_i < staleObjects_1.length)) return [3 /*break*/, 7];
                        obj = staleObjects_1[_i];
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, this.deprecateObject(obj.id, "system", "Automatically deprecated due to staleness and low quality")];
                    case 4:
                        _a.sent();
                        deprecatedCount++;
                        return [3 /*break*/, 6];
                    case 5:
                        error_6 = _a.sent();
                        console.warn("Failed to deprecate stale object ".concat(obj.id, ":"), error_6);
                        return [3 /*break*/, 6];
                    case 6:
                        _i++;
                        return [3 /*break*/, 2];
                    case 7: return [2 /*return*/, deprecatedCount];
                }
            });
        });
    };
    // Analytics and Monitoring
    KnowledgeBaseManager.prototype.getAnalytics = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, objectCounts, statusCounts, qualityStats, recentActivity, cacheStats, objectCountsMap, statusCountsMap, activityMap;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, Promise.all([
                            // Object counts by kind
                            config_1.db
                                .select({
                                kind: schema_1.kbObjects.kind,
                                count: (0, drizzle_orm_1.sql)(templateObject_9 || (templateObject_9 = __makeTemplateObject(["count(*)"], ["count(*)"]))),
                            })
                                .from(schema_1.kbObjects)
                                .groupBy(schema_1.kbObjects.kind),
                            // Status counts
                            config_1.db
                                .select({
                                status: schema_1.kbObjects.status,
                                count: (0, drizzle_orm_1.sql)(templateObject_10 || (templateObject_10 = __makeTemplateObject(["count(*)"], ["count(*)"]))),
                            })
                                .from(schema_1.kbObjects)
                                .groupBy(schema_1.kbObjects.status),
                            // Quality statistics
                            config_1.db
                                .select({
                                min: (0, drizzle_orm_1.sql)(templateObject_11 || (templateObject_11 = __makeTemplateObject(["min(", "::numeric)"], ["min(", "::numeric)"])), schema_1.kbObjects.qualityScore),
                                max: (0, drizzle_orm_1.sql)(templateObject_12 || (templateObject_12 = __makeTemplateObject(["max(", "::numeric)"], ["max(", "::numeric)"])), schema_1.kbObjects.qualityScore),
                                avg: (0, drizzle_orm_1.sql)(templateObject_13 || (templateObject_13 = __makeTemplateObject(["avg(", "::numeric)"], ["avg(", "::numeric)"])), schema_1.kbObjects.qualityScore),
                            })
                                .from(schema_1.kbObjects),
                            // Recent activity (last 24 hours)
                            config_1.db
                                .select({
                                action: schema_1.kbAudit.action,
                                count: (0, drizzle_orm_1.sql)(templateObject_14 || (templateObject_14 = __makeTemplateObject(["count(*)"], ["count(*)"]))),
                            })
                                .from(schema_1.kbAudit)
                                .where((0, drizzle_orm_1.sql)(templateObject_15 || (templateObject_15 = __makeTemplateObject(["", " > NOW() - INTERVAL '24 hours'"], ["", " > NOW() - INTERVAL '24 hours'"])), schema_1.kbAudit.createdAt))
                                .groupBy(schema_1.kbAudit.action),
                            // Cache statistics
                            this.getCacheStatistics(),
                        ])];
                    case 1:
                        _a = _b.sent(), objectCounts = _a[0], statusCounts = _a[1], qualityStats = _a[2], recentActivity = _a[3], cacheStats = _a[4];
                        objectCountsMap = {
                            style_pack: 0,
                            motif: 0,
                            glossary: 0,
                            rule: 0,
                            fewshot: 0,
                        };
                        objectCounts.forEach(function (row) {
                            objectCountsMap[row.kind] = row.count;
                        });
                        statusCountsMap = {
                            active: 0,
                            deprecated: 0,
                            experimental: 0,
                        };
                        statusCounts.forEach(function (row) {
                            statusCountsMap[row.status] = row.count;
                        });
                        activityMap = { creates: 0, updates: 0, deletes: 0 };
                        recentActivity.forEach(function (row) {
                            if (row.action === "create")
                                activityMap.creates = row.count;
                            if (row.action === "update")
                                activityMap.updates = row.count;
                            if (row.action === "delete")
                                activityMap.deletes = row.count;
                        });
                        return [2 /*return*/, {
                                objectCounts: objectCountsMap,
                                statusCounts: statusCountsMap,
                                qualityDistribution: qualityStats[0] || { min: 0, max: 0, avg: 0 },
                                recentActivity: activityMap,
                                cacheStats: cacheStats,
                            }];
                }
            });
        });
    };
    KnowledgeBaseManager.prototype.getCacheStatistics = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _cacheCount;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, config_1.db
                            .select({ count: (0, drizzle_orm_1.sql)(templateObject_16 || (templateObject_16 = __makeTemplateObject(["count(*)"], ["count(*)"]))) })
                            .from(schema_1.groundingCache)
                            .where((0, drizzle_orm_1.sql)(templateObject_17 || (templateObject_17 = __makeTemplateObject(["", " > NOW()"], ["", " > NOW()"])), schema_1.groundingCache.expiresAt))];
                    case 1:
                        _cacheCount = (_a.sent())[0];
                        // Placeholder statistics - would need proper tracking
                        return [2 /*return*/, {
                                hits: 0,
                                misses: 0,
                                hitRate: 0,
                            }];
                }
            });
        });
    };
    // Batch operations
    KnowledgeBaseManager.prototype.batchUpdateQualityScores = function () {
        return __awaiter(this, void 0, void 0, function () {
            var objects, updatedCount, _i, objects_1, obj, compatibilityResult, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, config_1.db
                            .select()
                            .from(schema_1.kbObjects)
                            .where((0, drizzle_orm_1.eq)(schema_1.kbObjects.status, "active"))];
                    case 1:
                        objects = _a.sent();
                        updatedCount = 0;
                        _i = 0, objects_1 = objects;
                        _a.label = 2;
                    case 2:
                        if (!(_i < objects_1.length)) return [3 /*break*/, 9];
                        obj = objects_1[_i];
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 7, , 8]);
                        return [4 /*yield*/, this.runCompatibilityTests(obj)];
                    case 4:
                        compatibilityResult = _a.sent();
                        if (!(compatibilityResult.score !== parseFloat(obj.qualityScore || "0"))) return [3 /*break*/, 6];
                        return [4 /*yield*/, config_1.db
                                .update(schema_1.kbObjects)
                                .set({ qualityScore: compatibilityResult.score.toString() })
                                .where((0, drizzle_orm_1.eq)(schema_1.kbObjects.id, obj.id))];
                    case 5:
                        _a.sent();
                        updatedCount++;
                        _a.label = 6;
                    case 6: return [3 /*break*/, 8];
                    case 7:
                        error_7 = _a.sent();
                        console.warn("Failed to update quality score for ".concat(obj.id, ":"), error_7);
                        return [3 /*break*/, 8];
                    case 8:
                        _i++;
                        return [3 /*break*/, 2];
                    case 9: return [2 /*return*/, updatedCount];
                }
            });
        });
    };
    KnowledgeBaseManager.prototype.cleanupExpiredCache = function () {
        return __awaiter(this, void 0, void 0, function () {
            var deleted;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, config_1.db
                            .delete(schema_1.groundingCache)
                            .where((0, drizzle_orm_1.sql)(templateObject_18 || (templateObject_18 = __makeTemplateObject(["", " <= NOW()"], ["", " <= NOW()"])), schema_1.groundingCache.expiresAt))
                            .returning()];
                    case 1:
                        deleted = _a.sent();
                        return [2 /*return*/, deleted.length];
                }
            });
        });
    };
    // Import/Export functionality
    KnowledgeBaseManager.prototype.exportObjects = function () {
        return __awaiter(this, arguments, void 0, function (filters) {
            var query, conditions, objects, links, objectIds;
            if (filters === void 0) { filters = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = config_1.db.select().from(schema_1.kbObjects);
                        conditions = [];
                        if (filters.kinds && filters.kinds.length > 0) {
                            conditions.push((0, drizzle_orm_1.inArray)(schema_1.kbObjects.kind, filters.kinds));
                        }
                        if (filters.status) {
                            conditions.push((0, drizzle_orm_1.eq)(schema_1.kbObjects.status, filters.status));
                        }
                        if (conditions.length > 0) {
                            query = query.where(drizzle_orm_1.and.apply(void 0, conditions));
                        }
                        return [4 /*yield*/, query];
                    case 1:
                        objects = _a.sent();
                        links = [];
                        if (!filters.includeLinks) return [3 /*break*/, 3];
                        objectIds = objects.map(function (obj) { return obj.id; });
                        return [4 /*yield*/, config_1.db
                                .select()
                                .from(schema_1.kbLinks)
                                .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.inArray)(schema_1.kbLinks.srcId, objectIds), (0, drizzle_orm_1.inArray)(schema_1.kbLinks.dstId, objectIds)))];
                    case 2:
                        links = _a.sent();
                        _a.label = 3;
                    case 3: return [2 /*return*/, {
                            objects: objects,
                            links: filters.includeLinks ? links : undefined,
                            metadata: {
                                exportedAt: new Date(),
                                totalCount: objects.length,
                            },
                        }];
                }
            });
        });
    };
    KnowledgeBaseManager.prototype.importObjects = function (data_1, userId_1) {
        return __awaiter(this, arguments, void 0, function (data, userId, options) {
            var imported, skipped, errors, _i, _a, objData, existing, validation, obj, compatibilityResult, error_8, _b, _c, linkData, error_9;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        imported = 0;
                        skipped = 0;
                        errors = [];
                        _i = 0, _a = data.objects;
                        _d.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 13];
                        objData = _a[_i];
                        _d.label = 2;
                    case 2:
                        _d.trys.push([2, 11, , 12]);
                        if (!options.skipExisting) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.getObject(objData.id)];
                    case 3:
                        existing = _d.sent();
                        if (existing) {
                            skipped++;
                            return [3 /*break*/, 12];
                        }
                        _d.label = 4;
                    case 4: return [4 /*yield*/, this.validateObject(objData)];
                    case 5:
                        validation = _d.sent();
                        if (!validation.isValid) {
                            errors.push("Object ".concat(objData.id, ": ").concat(validation.issues.join(", ")));
                            return [3 /*break*/, 12];
                        }
                        // Create object
                        return [4 /*yield*/, this.createObject(objData, userId, "Imported from external source")];
                    case 6:
                        // Create object
                        _d.sent();
                        if (!options.validateCompatibility) return [3 /*break*/, 10];
                        return [4 /*yield*/, this.getObject(objData.id)];
                    case 7:
                        obj = _d.sent();
                        if (!obj) return [3 /*break*/, 10];
                        return [4 /*yield*/, this.runCompatibilityTests(obj)];
                    case 8:
                        compatibilityResult = _d.sent();
                        if (!!compatibilityResult.passed) return [3 /*break*/, 10];
                        return [4 /*yield*/, this.updateObject(obj.id, { status: "experimental" }, userId, "Failed compatibility tests during import")];
                    case 9:
                        _d.sent();
                        _d.label = 10;
                    case 10:
                        imported++;
                        return [3 /*break*/, 12];
                    case 11:
                        error_8 = _d.sent();
                        errors.push("Object ".concat(objData.id, ": ").concat(error_8));
                        return [3 /*break*/, 12];
                    case 12:
                        _i++;
                        return [3 /*break*/, 1];
                    case 13:
                        if (!data.links) return [3 /*break*/, 19];
                        _b = 0, _c = data.links;
                        _d.label = 14;
                    case 14:
                        if (!(_b < _c.length)) return [3 /*break*/, 19];
                        linkData = _c[_b];
                        _d.label = 15;
                    case 15:
                        _d.trys.push([15, 17, , 18]);
                        return [4 /*yield*/, this.createLink(linkData.srcId, linkData.dstId, linkData.rel, userId)];
                    case 16:
                        _d.sent();
                        return [3 /*break*/, 18];
                    case 17:
                        error_9 = _d.sent();
                        errors.push("Link ".concat(linkData.srcId, "->").concat(linkData.dstId, ": ").concat(error_9));
                        return [3 /*break*/, 18];
                    case 18:
                        _b++;
                        return [3 /*break*/, 14];
                    case 19: return [2 /*return*/, { imported: imported, skipped: skipped, errors: errors }];
                }
            });
        });
    };
    // Health check and maintenance
    KnowledgeBaseManager.prototype.performHealthCheck = function () {
        return __awaiter(this, void 0, void 0, function () {
            var issues, totalCount, activeCount, orphanedCount, brokenLinks, lowQualityObjects, orphanedCountValue, totalCountValue;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        issues = [];
                        return [4 /*yield*/, config_1.db
                                .select({ count: (0, drizzle_orm_1.sql)(templateObject_19 || (templateObject_19 = __makeTemplateObject(["count(*)"], ["count(*)"]))) })
                                .from(schema_1.kbObjects)];
                    case 1:
                        totalCount = (_a.sent())[0];
                        return [4 /*yield*/, config_1.db
                                .select({ count: (0, drizzle_orm_1.sql)(templateObject_20 || (templateObject_20 = __makeTemplateObject(["count(*)"], ["count(*)"]))) })
                                .from(schema_1.kbObjects)
                                .where((0, drizzle_orm_1.eq)(schema_1.kbObjects.status, "active"))];
                    case 2:
                        activeCount = (_a.sent())[0];
                        return [4 /*yield*/, config_1.db
                                .select({ count: (0, drizzle_orm_1.sql)(templateObject_21 || (templateObject_21 = __makeTemplateObject(["count(*)"], ["count(*)"]))) })
                                .from(schema_1.kbObjects)
                                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.sql)(templateObject_22 || (templateObject_22 = __makeTemplateObject(["NOT EXISTS (SELECT 1 FROM ", " WHERE ", " = ", ")"], ["NOT EXISTS (SELECT 1 FROM ", " WHERE ", " = ", ")"])), schema_1.kbLinks, schema_1.kbLinks.srcId, schema_1.kbObjects.id), (0, drizzle_orm_1.sql)(templateObject_23 || (templateObject_23 = __makeTemplateObject(["NOT EXISTS (SELECT 1 FROM ", " WHERE ", " = ", ")"], ["NOT EXISTS (SELECT 1 FROM ", " WHERE ", " = ", ")"])), schema_1.kbLinks, schema_1.kbLinks.dstId, schema_1.kbObjects.id)))];
                    case 3:
                        orphanedCount = (_a.sent())[0];
                        return [4 /*yield*/, config_1.db
                                .select()
                                .from(schema_1.kbLinks)
                                .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.sql)(templateObject_24 || (templateObject_24 = __makeTemplateObject(["NOT EXISTS (SELECT 1 FROM ", " WHERE ", " = ", ")"], ["NOT EXISTS (SELECT 1 FROM ", " WHERE ", " = ", ")"])), schema_1.kbObjects, schema_1.kbObjects.id, schema_1.kbLinks.srcId), (0, drizzle_orm_1.sql)(templateObject_25 || (templateObject_25 = __makeTemplateObject(["NOT EXISTS (SELECT 1 FROM ", " WHERE ", " = ", ")"], ["NOT EXISTS (SELECT 1 FROM ", " WHERE ", " = ", ")"])), schema_1.kbObjects, schema_1.kbObjects.id, schema_1.kbLinks.dstId)))];
                    case 4:
                        brokenLinks = _a.sent();
                        return [4 /*yield*/, config_1.db
                                .select({ count: (0, drizzle_orm_1.sql)(templateObject_26 || (templateObject_26 = __makeTemplateObject(["count(*)"], ["count(*)"]))) })
                                .from(schema_1.kbObjects)
                                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.kbObjects.status, "active"), (0, drizzle_orm_1.sql)(templateObject_27 || (templateObject_27 = __makeTemplateObject(["", "::numeric < ", ""], ["", "::numeric < ", ""])), schema_1.kbObjects.qualityScore, this.MIN_QUALITY_SCORE)))];
                    case 5:
                        lowQualityObjects = _a.sent();
                        if (lowQualityObjects[0].count > 0) {
                            issues.push("".concat(lowQualityObjects[0].count, " active objects below quality threshold"));
                        }
                        if (brokenLinks.length > 0) {
                            issues.push("".concat(brokenLinks.length, " broken links found"));
                        }
                        orphanedCountValue = orphanedCount[0].count;
                        totalCountValue = totalCount[0].count;
                        if (orphanedCountValue > totalCountValue * 0.1) {
                            issues.push("High number of orphaned objects: ".concat(orphanedCountValue));
                        }
                        return [2 /*return*/, {
                                healthy: issues.length === 0,
                                issues: issues,
                                stats: {
                                    totalObjects: totalCount[0].count,
                                    activeObjects: activeCount[0].count,
                                    orphanedObjects: orphanedCountValue,
                                    brokenLinks: brokenLinks.length,
                                },
                            }];
                }
            });
        });
    };
    // Cleanup broken links
    KnowledgeBaseManager.prototype.cleanupBrokenLinks = function () {
        return __awaiter(this, void 0, void 0, function () {
            var brokenLinks;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, config_1.db
                            .delete(schema_1.kbLinks)
                            .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.sql)(templateObject_28 || (templateObject_28 = __makeTemplateObject(["NOT EXISTS (SELECT 1 FROM ", " WHERE ", " = ", ")"], ["NOT EXISTS (SELECT 1 FROM ", " WHERE ", " = ", ")"])), schema_1.kbObjects, schema_1.kbObjects.id, schema_1.kbLinks.srcId), (0, drizzle_orm_1.sql)(templateObject_29 || (templateObject_29 = __makeTemplateObject(["NOT EXISTS (SELECT 1 FROM ", " WHERE ", " = ", ")"], ["NOT EXISTS (SELECT 1 FROM ", " WHERE ", " = ", ")"])), schema_1.kbObjects, schema_1.kbObjects.id, schema_1.kbLinks.dstId)))
                            .returning()];
                    case 1:
                        brokenLinks = _a.sent();
                        return [2 /*return*/, brokenLinks.length];
                }
            });
        });
    };
    return KnowledgeBaseManager;
}());
exports.KnowledgeBaseManager = KnowledgeBaseManager;
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13, templateObject_14, templateObject_15, templateObject_16, templateObject_17, templateObject_18, templateObject_19, templateObject_20, templateObject_21, templateObject_22, templateObject_23, templateObject_24, templateObject_25, templateObject_26, templateObject_27, templateObject_28, templateObject_29;
