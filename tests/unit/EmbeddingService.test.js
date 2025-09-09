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
 * Unit tests for EmbeddingService
 */
var vitest_1 = require("vitest");
var EmbeddingService_js_1 = require("../../server/services/EmbeddingService.js");
// Mock fetch for testing
global.fetch = vitest_1.vi.fn();
(0, vitest_1.describe)("EmbeddingService", function () {
    var mockConfig = {
        model: "text-embedding-3-small",
        apiKey: "test-api-key",
        batchSize: 2,
        cacheEnabled: true,
    };
    (0, vitest_1.describe)("generateEmbedding", function () {
        (0, vitest_1.it)("should generate embedding for text", function () { return __awaiter(void 0, void 0, void 0, function () {
            var mockEmbedding, service, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        mockEmbedding = [0.1, 0.2, 0.3, 0.4, 0.5];
                        global.fetch.mockResolvedValueOnce({
                            ok: true,
                            json: function () { return __awaiter(void 0, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    return [2 /*return*/, ({
                                            data: [{ embedding: mockEmbedding }],
                                            usage: { total_tokens: 10 },
                                        })];
                                });
                            }); },
                        });
                        service = new EmbeddingService_js_1.EmbeddingService(mockConfig);
                        return [4 /*yield*/, service.generateEmbedding("test text")];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.embedding).toEqual(mockEmbedding);
                        (0, vitest_1.expect)(result.tokens).toBe(10);
                        (0, vitest_1.expect)(result.model).toBe("text-embedding-3-small");
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should use cache when enabled", function () { return __awaiter(void 0, void 0, void 0, function () {
            var mockEmbedding, service, result1, result2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        mockEmbedding = [0.1, 0.2, 0.3];
                        global.fetch.mockResolvedValueOnce({
                            ok: true,
                            json: function () { return __awaiter(void 0, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    return [2 /*return*/, ({
                                            data: [{ embedding: mockEmbedding }],
                                            usage: { total_tokens: 5 },
                                        })];
                                });
                            }); },
                        });
                        service = new EmbeddingService_js_1.EmbeddingService(mockConfig);
                        return [4 /*yield*/, service.generateEmbedding("cached text")];
                    case 1:
                        result1 = _a.sent();
                        (0, vitest_1.expect)(result1.embedding).toEqual(mockEmbedding);
                        return [4 /*yield*/, service.generateEmbedding("cached text")];
                    case 2:
                        result2 = _a.sent();
                        (0, vitest_1.expect)(result2.embedding).toEqual(mockEmbedding);
                        // Verify only one API call was made
                        (0, vitest_1.expect)(global.fetch).toHaveBeenCalledTimes(1);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should throw error when API key is missing", function () { return __awaiter(void 0, void 0, void 0, function () {
            var configWithoutKey, service;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        configWithoutKey = __assign(__assign({}, mockConfig), { apiKey: undefined });
                        service = new EmbeddingService_js_1.EmbeddingService(configWithoutKey);
                        return [4 /*yield*/, (0, vitest_1.expect)(service.generateEmbedding("test")).rejects.toThrow("OpenAI API key not configured for embeddings")];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should handle API errors", function () { return __awaiter(void 0, void 0, void 0, function () {
            var service;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        global.fetch.mockResolvedValueOnce({
                            ok: false,
                            status: 429,
                            text: function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                                return [2 /*return*/, "Rate limit exceeded"];
                            }); }); },
                        });
                        service = new EmbeddingService_js_1.EmbeddingService(mockConfig);
                        return [4 /*yield*/, (0, vitest_1.expect)(service.generateEmbedding("test")).rejects.toThrow("OpenAI Embeddings API error: 429 Rate limit exceeded")];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)("generateBatchEmbeddings", function () {
        (0, vitest_1.it)("should generate embeddings for multiple texts", function () { return __awaiter(void 0, void 0, void 0, function () {
            var mockEmbeddings, service, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        mockEmbeddings = [
                            [0.1, 0.2, 0.3],
                            [0.4, 0.5, 0.6],
                        ];
                        global.fetch.mockResolvedValueOnce({
                            ok: true,
                            json: function () { return __awaiter(void 0, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    return [2 /*return*/, ({
                                            data: [
                                                { embedding: mockEmbeddings[0] },
                                                { embedding: mockEmbeddings[1] },
                                            ],
                                            usage: { total_tokens: 20 },
                                        })];
                                });
                            }); },
                        });
                        service = new EmbeddingService_js_1.EmbeddingService(mockConfig);
                        return [4 /*yield*/, service.generateBatchEmbeddings(["text1", "text2"])];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.embeddings).toEqual(mockEmbeddings);
                        (0, vitest_1.expect)(result.totalTokens).toBe(20);
                        (0, vitest_1.expect)(result.model).toBe("text-embedding-3-small");
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should process in batches when input exceeds batch size", function () { return __awaiter(void 0, void 0, void 0, function () {
            var texts, mockEmbeddings, service, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        texts = ["text1", "text2", "text3", "text4"];
                        mockEmbeddings = [
                            [0.1, 0.2],
                            [0.3, 0.4],
                            [0.5, 0.6],
                            [0.7, 0.8],
                        ];
                        // Mock two API calls for batch size of 2
                        global.fetch
                            .mockResolvedValueOnce({
                            ok: true,
                            json: function () { return __awaiter(void 0, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    return [2 /*return*/, ({
                                            data: [
                                                { embedding: mockEmbeddings[0] },
                                                { embedding: mockEmbeddings[1] },
                                            ],
                                            usage: { total_tokens: 10 },
                                        })];
                                });
                            }); },
                        })
                            .mockResolvedValueOnce({
                            ok: true,
                            json: function () { return __awaiter(void 0, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    return [2 /*return*/, ({
                                            data: [
                                                { embedding: mockEmbeddings[2] },
                                                { embedding: mockEmbeddings[3] },
                                            ],
                                            usage: { total_tokens: 10 },
                                        })];
                                });
                            }); },
                        });
                        service = new EmbeddingService_js_1.EmbeddingService(mockConfig);
                        return [4 /*yield*/, service.generateBatchEmbeddings(texts)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.embeddings).toEqual(mockEmbeddings);
                        (0, vitest_1.expect)(result.totalTokens).toBe(20);
                        (0, vitest_1.expect)(global.fetch).toHaveBeenCalledTimes(2);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should use cached embeddings in batch processing", function () { return __awaiter(void 0, void 0, void 0, function () {
            var service, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        service = new EmbeddingService_js_1.EmbeddingService(mockConfig);
                        // Pre-populate cache
                        global.fetch.mockResolvedValueOnce({
                            ok: true,
                            json: function () { return __awaiter(void 0, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    return [2 /*return*/, ({
                                            data: [{ embedding: [0.1, 0.2] }],
                                            usage: { total_tokens: 5 },
                                        })];
                                });
                            }); },
                        });
                        return [4 /*yield*/, service.generateEmbedding("cached text")];
                    case 1:
                        _a.sent();
                        // Now batch process with one cached and one new
                        global.fetch.mockResolvedValueOnce({
                            ok: true,
                            json: function () { return __awaiter(void 0, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    return [2 /*return*/, ({
                                            data: [{ embedding: [0.3, 0.4] }],
                                            usage: { total_tokens: 5 },
                                        })];
                                });
                            }); },
                        });
                        return [4 /*yield*/, service.generateBatchEmbeddings([
                                "cached text",
                                "new text",
                            ])];
                    case 2:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.embeddings).toEqual([
                            [0.1, 0.2],
                            [0.3, 0.4],
                        ]);
                        (0, vitest_1.expect)(global.fetch).toHaveBeenCalledTimes(2); // One for cache, one for new
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)("calculateCosineSimilarity", function () {
        (0, vitest_1.it)("should calculate cosine similarity correctly", function () {
            var service = new EmbeddingService_js_1.EmbeddingService(mockConfig);
            var embedding1 = [1, 0, 0];
            var embedding2 = [0, 1, 0];
            var embedding3 = [1, 0, 0];
            // Orthogonal vectors should have similarity 0
            (0, vitest_1.expect)(service.calculateCosineSimilarity(embedding1, embedding2)).toBeCloseTo(0);
            // Identical vectors should have similarity 1
            (0, vitest_1.expect)(service.calculateCosineSimilarity(embedding1, embedding3)).toBeCloseTo(1);
        });
        (0, vitest_1.it)("should handle zero vectors", function () {
            var service = new EmbeddingService_js_1.EmbeddingService(mockConfig);
            var zeroVector = [0, 0, 0];
            var normalVector = [1, 2, 3];
            (0, vitest_1.expect)(service.calculateCosineSimilarity(zeroVector, normalVector)).toBe(0);
        });
        (0, vitest_1.it)("should throw error for mismatched dimensions", function () {
            var service = new EmbeddingService_js_1.EmbeddingService(mockConfig);
            var embedding1 = [1, 2, 3];
            var embedding2 = [1, 2];
            (0, vitest_1.expect)(function () {
                service.calculateCosineSimilarity(embedding1, embedding2);
            }).toThrow("Embeddings must have the same dimension");
        });
    });
    (0, vitest_1.describe)("findMostSimilar", function () {
        (0, vitest_1.it)("should find most similar embeddings", function () {
            var service = new EmbeddingService_js_1.EmbeddingService(mockConfig);
            var queryEmbedding = [1, 0, 0];
            var candidates = [
                { id: "a", embedding: [1, 0, 0], metadata: { type: "exact" } },
                { id: "b", embedding: [0, 1, 0], metadata: { type: "orthogonal" } },
                { id: "c", embedding: [0.8, 0.6, 0], metadata: { type: "similar" } },
            ];
            var results = service.findMostSimilar(queryEmbedding, candidates, 2);
            (0, vitest_1.expect)(results).toHaveLength(2);
            (0, vitest_1.expect)(results[0].id).toBe("a"); // Most similar (identical)
            (0, vitest_1.expect)(results[0].similarity).toBeCloseTo(1);
            (0, vitest_1.expect)(results[1].id).toBe("c"); // Second most similar
            (0, vitest_1.expect)(results[1].similarity).toBeGreaterThan(0);
        });
    });
    (0, vitest_1.describe)("generateEmbeddingForKBObject", function () {
        (0, vitest_1.it)("should extract text from KB object and generate embedding", function () { return __awaiter(void 0, void 0, void 0, function () {
            var mockEmbedding, service, kbObject, embedding, apiCall, requestBody;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        mockEmbedding = [0.1, 0.2, 0.3];
                        global.fetch.mockResolvedValueOnce({
                            ok: true,
                            json: function () { return __awaiter(void 0, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    return [2 /*return*/, ({
                                            data: [{ embedding: mockEmbedding }],
                                            usage: { total_tokens: 10 },
                                        })];
                                });
                            }); },
                        });
                        service = new EmbeddingService_js_1.EmbeddingService(mockConfig);
                        kbObject = {
                            title: "Test Object",
                            tags: ["test", "example"],
                            body: {
                                description: "This is a test object",
                                properties: ["prop1", "prop2"],
                            },
                        };
                        return [4 /*yield*/, service.generateEmbeddingForKBObject(kbObject)];
                    case 1:
                        embedding = _a.sent();
                        (0, vitest_1.expect)(embedding).toEqual(mockEmbedding);
                        apiCall = global.fetch.mock.calls[0];
                        requestBody = JSON.parse(apiCall[1].body);
                        (0, vitest_1.expect)(requestBody.input).toContain("Test Object");
                        (0, vitest_1.expect)(requestBody.input).toContain("test example");
                        (0, vitest_1.expect)(requestBody.input).toContain("This is a test object");
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should handle objects with string body", function () { return __awaiter(void 0, void 0, void 0, function () {
            var mockEmbedding, service, kbObject, embedding;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        mockEmbedding = [0.1, 0.2];
                        global.fetch.mockResolvedValueOnce({
                            ok: true,
                            json: function () { return __awaiter(void 0, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    return [2 /*return*/, ({
                                            data: [{ embedding: mockEmbedding }],
                                            usage: { total_tokens: 5 },
                                        })];
                                });
                            }); },
                        });
                        service = new EmbeddingService_js_1.EmbeddingService(mockConfig);
                        kbObject = {
                            title: "Simple Object",
                            body: "Simple string content",
                        };
                        return [4 /*yield*/, service.generateEmbeddingForKBObject(kbObject)];
                    case 1:
                        embedding = _a.sent();
                        (0, vitest_1.expect)(embedding).toEqual(mockEmbedding);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)("tagBasedSimilarity", function () {
        (0, vitest_1.it)("should calculate tag-based similarity", function () {
            var query = "blue geometric circle";
            var tags = ["blue", "shape", "geometric"];
            var similarity = EmbeddingService_js_1.EmbeddingService.tagBasedSimilarity(query, tags);
            // Should match 'blue' and 'geometric' out of 3 query words
            (0, vitest_1.expect)(similarity).toBeCloseTo(2 / 3);
        });
        (0, vitest_1.it)("should handle partial matches", function () {
            var query = "circular shape";
            var tags = ["circle", "geometric"];
            var similarity = EmbeddingService_js_1.EmbeddingService.tagBasedSimilarity(query, tags);
            // 'circular' should partially match 'circle'
            (0, vitest_1.expect)(similarity).toBeGreaterThan(0);
        });
        (0, vitest_1.it)("should return 0 for no matches", function () {
            var query = "red square";
            var tags = ["blue", "circle"];
            var similarity = EmbeddingService_js_1.EmbeddingService.tagBasedSimilarity(query, tags);
            (0, vitest_1.expect)(similarity).toBe(0);
        });
    });
    (0, vitest_1.describe)("cache management", function () {
        (0, vitest_1.it)("should provide cache stats", function () {
            var service = new EmbeddingService_js_1.EmbeddingService(mockConfig);
            var stats = service.getCacheStats();
            (0, vitest_1.expect)(stats).toHaveProperty("size");
            (0, vitest_1.expect)(typeof stats.size).toBe("number");
        });
        (0, vitest_1.it)("should clear cache", function () { return __awaiter(void 0, void 0, void 0, function () {
            var service;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        service = new EmbeddingService_js_1.EmbeddingService(mockConfig);
                        // Add something to cache
                        global.fetch.mockResolvedValueOnce({
                            ok: true,
                            json: function () { return __awaiter(void 0, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    return [2 /*return*/, ({
                                            data: [{ embedding: [0.1, 0.2] }],
                                            usage: { total_tokens: 5 },
                                        })];
                                });
                            }); },
                        });
                        return [4 /*yield*/, service.generateEmbedding("test")];
                    case 1:
                        _a.sent();
                        (0, vitest_1.expect)(service.getCacheStats().size).toBeGreaterThan(0);
                        service.clearCache();
                        (0, vitest_1.expect)(service.getCacheStats().size).toBe(0);
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
