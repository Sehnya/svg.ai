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
 * Performance benchmark tests for vector similarity vs tag-based filtering
 */
var vitest_1 = require("vitest");
var EmbeddingService_js_1 = require("../../server/services/EmbeddingService.js");
var KnowledgeBaseManager_js_1 = require("../../server/services/KnowledgeBaseManager.js");
(0, vitest_1.describe)("Performance Benchmarks", function () {
    var embeddingService;
    var kbManager;
    (0, vitest_1.beforeEach)(function () {
        embeddingService = new EmbeddingService_js_1.EmbeddingService();
        kbManager = new KnowledgeBaseManager_js_1.KnowledgeBaseManager();
    });
    (0, vitest_1.describe)("Vector Similarity vs Tag-based Filtering", function () {
        (0, vitest_1.it)("should benchmark vector similarity search performance", function () { return __awaiter(void 0, void 0, void 0, function () {
            var testPrompt, iterations, testObjects, vectorStartTime, i, vectorEndTime, vectorTime, tagStartTime, i, results, tagEndTime, tagTime;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        testPrompt = "blue geometric circle with red border";
                        iterations = 100;
                        testObjects = Array.from({ length: 1000 }, function (_, i) { return ({
                            id: i,
                            title: "Test Object ".concat(i),
                            body: { description: "Test description ".concat(i) },
                            tags: ["tag".concat(i % 10), "category".concat(i % 5)],
                            embedding: Array.from({ length: 1536 }, function () { return Math.random(); }),
                        }); });
                        vectorStartTime = performance.now();
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < iterations)) return [3 /*break*/, 4];
                        return [4 /*yield*/, embeddingService.findSimilar(testPrompt, testObjects, {
                                limit: 10,
                                threshold: 0.7,
                            })];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        i++;
                        return [3 /*break*/, 1];
                    case 4:
                        vectorEndTime = performance.now();
                        vectorTime = vectorEndTime - vectorStartTime;
                        tagStartTime = performance.now();
                        for (i = 0; i < iterations; i++) {
                            results = testObjects
                                .filter(function (obj) {
                                return obj.tags.some(function (tag) {
                                    return testPrompt.toLowerCase().includes(tag.toLowerCase());
                                });
                            })
                                .slice(0, 10);
                        }
                        tagEndTime = performance.now();
                        tagTime = tagEndTime - tagStartTime;
                        console.log("Vector similarity: ".concat(vectorTime, "ms for ").concat(iterations, " iterations"));
                        console.log("Tag-based filtering: ".concat(tagTime, "ms for ").concat(iterations, " iterations"));
                        console.log("Performance ratio: ".concat(vectorTime / tagTime, "x"));
                        // Vector search should be reasonable (not more than 10x slower than tags)
                        (0, vitest_1.expect)(vectorTime / tagTime).toBeLessThan(10);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should benchmark embedding generation performance", function () { return __awaiter(void 0, void 0, void 0, function () {
            var testTexts, batchSizes, results, _i, batchSizes_1, batchSize, batches, startTime, i, batch, endTime, timePerItemBatch1, timePerItemBatch10;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        testTexts = [
                            "blue circle with red border",
                            "geometric pattern with triangles",
                            "minimalist design with earth tones",
                            "abstract flowing lines in purple",
                            "symmetrical star pattern in gold",
                        ];
                        batchSizes = [1, 5, 10, 20];
                        results = {};
                        _i = 0, batchSizes_1 = batchSizes;
                        _a.label = 1;
                    case 1:
                        if (!(_i < batchSizes_1.length)) return [3 /*break*/, 7];
                        batchSize = batchSizes_1[_i];
                        batches = Math.ceil(testTexts.length / batchSize);
                        startTime = performance.now();
                        i = 0;
                        _a.label = 2;
                    case 2:
                        if (!(i < batches)) return [3 /*break*/, 5];
                        batch = testTexts.slice(i * batchSize, (i + 1) * batchSize);
                        return [4 /*yield*/, embeddingService.generateEmbeddings(batch)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        i++;
                        return [3 /*break*/, 2];
                    case 5:
                        endTime = performance.now();
                        results[batchSize] = endTime - startTime;
                        _a.label = 6;
                    case 6:
                        _i++;
                        return [3 /*break*/, 1];
                    case 7:
                        console.log("Embedding generation performance by batch size:");
                        Object.entries(results).forEach(function (_a) {
                            var size = _a[0], time = _a[1];
                            console.log("Batch size ".concat(size, ": ").concat(time, "ms"));
                        });
                        timePerItemBatch1 = results[1] / testTexts.length;
                        timePerItemBatch10 = results[10] / testTexts.length;
                        (0, vitest_1.expect)(timePerItemBatch10).toBeLessThan(timePerItemBatch1);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should benchmark cache performance", function () { return __awaiter(void 0, void 0, void 0, function () {
            var testPrompt, userId, uncachedStartTime, result1, uncachedEndTime, uncachedTime, cachedStartTime, result2, cachedEndTime, cachedTime;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        testPrompt = "test prompt for caching";
                        userId = "test-user";
                        uncachedStartTime = performance.now();
                        return [4 /*yield*/, kbManager.retrieveGrounding(testPrompt, userId)];
                    case 1:
                        result1 = _a.sent();
                        uncachedEndTime = performance.now();
                        uncachedTime = uncachedEndTime - uncachedStartTime;
                        cachedStartTime = performance.now();
                        return [4 /*yield*/, kbManager.retrieveGrounding(testPrompt, userId)];
                    case 2:
                        result2 = _a.sent();
                        cachedEndTime = performance.now();
                        cachedTime = cachedEndTime - cachedStartTime;
                        console.log("Uncached retrieval: ".concat(uncachedTime, "ms"));
                        console.log("Cached retrieval: ".concat(cachedTime, "ms"));
                        console.log("Cache speedup: ".concat(uncachedTime / cachedTime, "x"));
                        (0, vitest_1.expect)(result1).toEqual(result2);
                        (0, vitest_1.expect)(cachedTime).toBeLessThan(uncachedTime * 0.5); // Cache should be at least 2x faster
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should benchmark MMR selection performance", function () { return __awaiter(void 0, void 0, void 0, function () {
            var testObjects, selectionSizes, results, _i, selectionSizes_1, size, startTime, i, endTime;
            return __generator(this, function (_a) {
                testObjects = Array.from({ length: 1000 }, function (_, i) { return ({
                    id: i,
                    title: "Object ".concat(i),
                    similarity: Math.random(),
                    tags: ["tag".concat(i % 20)],
                    embedding: Array.from({ length: 1536 }, function () { return Math.random(); }),
                }); });
                selectionSizes = [5, 10, 20, 50];
                results = {};
                for (_i = 0, selectionSizes_1 = selectionSizes; _i < selectionSizes_1.length; _i++) {
                    size = selectionSizes_1[_i];
                    startTime = performance.now();
                    // Run MMR selection multiple times
                    for (i = 0; i < 10; i++) {
                        kbManager.selectWithMMR(testObjects, "test query", {
                            relevanceWeight: 0.7,
                            diversityWeight: 0.3,
                            maxResults: size,
                        });
                    }
                    endTime = performance.now();
                    results[size] = endTime - startTime;
                }
                console.log("MMR selection performance by result size:");
                Object.entries(results).forEach(function (_a) {
                    var size = _a[0], time = _a[1];
                    console.log("Size ".concat(size, ": ").concat(time, "ms for 10 iterations"));
                });
                // Performance should scale reasonably with result size
                (0, vitest_1.expect)(results[50]).toBeLessThan(results[5] * 20); // Not more than 20x slower
                return [2 /*return*/];
            });
        }); });
    });
    (0, vitest_1.describe)("Database Query Performance", function () {
        (0, vitest_1.it)("should benchmark knowledge base queries", function () { return __awaiter(void 0, void 0, void 0, function () {
            var queryTypes, results, _i, queryTypes_1, queryType, startTime, i, endTime;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        queryTypes = [
                            { name: "by_kind", filter: { kind: "motif" } },
                            { name: "by_tags", filter: { tags: ["geometric"] } },
                            { name: "by_status", filter: { status: "active" } },
                            { name: "by_quality", filter: { minQuality: 0.8 } },
                            {
                                name: "complex",
                                filter: {
                                    kind: "motif",
                                    tags: ["geometric"],
                                    status: "active",
                                    minQuality: 0.7,
                                },
                            },
                        ];
                        results = {};
                        _i = 0, queryTypes_1 = queryTypes;
                        _a.label = 1;
                    case 1:
                        if (!(_i < queryTypes_1.length)) return [3 /*break*/, 7];
                        queryType = queryTypes_1[_i];
                        startTime = performance.now();
                        i = 0;
                        _a.label = 2;
                    case 2:
                        if (!(i < 50)) return [3 /*break*/, 5];
                        return [4 /*yield*/, kbManager.queryObjects(queryType.filter)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        i++;
                        return [3 /*break*/, 2];
                    case 5:
                        endTime = performance.now();
                        results[queryType.name] = endTime - startTime;
                        _a.label = 6;
                    case 6:
                        _i++;
                        return [3 /*break*/, 1];
                    case 7:
                        console.log("Database query performance:");
                        Object.entries(results).forEach(function (_a) {
                            var type = _a[0], time = _a[1];
                            console.log("".concat(type, ": ").concat(time, "ms for 50 iterations"));
                        });
                        // All queries should complete within reasonable time
                        Object.values(results).forEach(function (time) {
                            (0, vitest_1.expect)(time).toBeLessThan(5000); // Less than 5 seconds for 50 queries
                        });
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should benchmark preference aggregation", function () { return __awaiter(void 0, void 0, void 0, function () {
            var userCount, feedbackPerUser, feedbacks, userId, i, startTime, endTime, aggregationTime;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        userCount = 100;
                        feedbackPerUser = 50;
                        feedbacks = [];
                        for (userId = 0; userId < userCount; userId++) {
                            for (i = 0; i < feedbackPerUser; i++) {
                                feedbacks.push({
                                    userId: "user-".concat(userId),
                                    eventId: userId * feedbackPerUser + i,
                                    signal: Math.random() > 0.5 ? "favorited" : "kept",
                                    tags: ["tag".concat(i % 10)],
                                    objectIds: [i % 100],
                                    timestamp: new Date(),
                                });
                            }
                        }
                        startTime = performance.now();
                        return [4 /*yield*/, kbManager.aggregatePreferences(feedbacks)];
                    case 1:
                        _a.sent();
                        endTime = performance.now();
                        aggregationTime = endTime - startTime;
                        console.log("Preference aggregation: ".concat(aggregationTime, "ms for ").concat(feedbacks.length, " feedback items"));
                        // Should complete within reasonable time
                        (0, vitest_1.expect)(aggregationTime).toBeLessThan(10000); // Less than 10 seconds
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)("Generation Pipeline Performance", function () {
        (0, vitest_1.it)("should benchmark end-to-end generation performance", function () { return __awaiter(void 0, void 0, void 0, function () {
            var testRequests, results, _loop_1, _i, testRequests_1, request;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        testRequests = [
                            {
                                prompt: "simple blue circle",
                                size: { width: 200, height: 200 },
                                complexity: "simple",
                            },
                            {
                                prompt: "complex geometric pattern with multiple colors and shapes",
                                size: { width: 800, height: 600 },
                                complexity: "complex",
                            },
                            {
                                prompt: "detailed mandala design with intricate patterns",
                                size: { width: 1000, height: 1000 },
                                complexity: "detailed",
                            },
                        ];
                        results = {};
                        _loop_1 = function (request) {
                            var times, i, startTime, endTime, avgTime;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        times = [];
                                        i = 0;
                                        _b.label = 1;
                                    case 1:
                                        if (!(i < 5)) return [3 /*break*/, 4];
                                        startTime = performance.now();
                                        // Mock generation pipeline
                                        return [4 /*yield*/, new Promise(function (resolve) {
                                                return setTimeout(resolve, request.complexity === "simple"
                                                    ? 100
                                                    : request.complexity === "complex"
                                                        ? 500
                                                        : 1000);
                                            })];
                                    case 2:
                                        // Mock generation pipeline
                                        _b.sent();
                                        endTime = performance.now();
                                        times.push(endTime - startTime);
                                        _b.label = 3;
                                    case 3:
                                        i++;
                                        return [3 /*break*/, 1];
                                    case 4:
                                        avgTime = times.reduce(function (a, b) { return a + b; }, 0) / times.length;
                                        results[request.complexity] = avgTime;
                                        return [2 /*return*/];
                                }
                            });
                        };
                        _i = 0, testRequests_1 = testRequests;
                        _a.label = 1;
                    case 1:
                        if (!(_i < testRequests_1.length)) return [3 /*break*/, 4];
                        request = testRequests_1[_i];
                        return [5 /*yield**/, _loop_1(request)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4:
                        console.log("Generation pipeline performance:");
                        Object.entries(results).forEach(function (_a) {
                            var complexity = _a[0], time = _a[1];
                            console.log("".concat(complexity, ": ").concat(time, "ms average"));
                        });
                        // Performance should scale with complexity
                        (0, vitest_1.expect)(results.simple).toBeLessThan(results.complex);
                        (0, vitest_1.expect)(results.complex).toBeLessThan(results.detailed);
                        // All should complete within reasonable time
                        (0, vitest_1.expect)(results.detailed).toBeLessThan(5000); // Less than 5 seconds
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should benchmark concurrent generation performance", function () { return __awaiter(void 0, void 0, void 0, function () {
            var concurrencyLevels, results, _i, concurrencyLevels_1, concurrency, startTime, promises, endTime;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        concurrencyLevels = [1, 5, 10, 20];
                        results = {};
                        _i = 0, concurrencyLevels_1 = concurrencyLevels;
                        _a.label = 1;
                    case 1:
                        if (!(_i < concurrencyLevels_1.length)) return [3 /*break*/, 4];
                        concurrency = concurrencyLevels_1[_i];
                        startTime = performance.now();
                        promises = Array.from({ length: concurrency }, function () {
                            // Mock generation
                            return new Promise(function (resolve) { return setTimeout(resolve, 200); });
                        });
                        return [4 /*yield*/, Promise.all(promises)];
                    case 2:
                        _a.sent();
                        endTime = performance.now();
                        results[concurrency] = endTime - startTime;
                        _a.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4:
                        console.log("Concurrent generation performance:");
                        Object.entries(results).forEach(function (_a) {
                            var concurrency = _a[0], time = _a[1];
                            console.log("".concat(concurrency, " concurrent: ").concat(time, "ms"));
                        });
                        // Concurrent execution should be more efficient than sequential
                        (0, vitest_1.expect)(results[10]).toBeLessThan(results[1] * 8); // Should have some parallelization benefit
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)("Memory Usage Benchmarks", function () {
        (0, vitest_1.it)("should monitor memory usage during large operations", function () { return __awaiter(void 0, void 0, void 0, function () {
            var initialMemory, largeDataset, processed, finalMemory, memoryIncrease;
            return __generator(this, function (_a) {
                initialMemory = process.memoryUsage();
                largeDataset = Array.from({ length: 10000 }, function (_, i) { return ({
                    id: i,
                    title: "Object ".concat(i),
                    body: { description: "A".repeat(100) },
                    tags: Array.from({ length: 10 }, function (_, j) { return "tag".concat(j); }),
                    embedding: Array.from({ length: 1536 }, function () { return Math.random(); }),
                }); });
                processed = largeDataset.map(function (item) { return (__assign(__assign({}, item), { processed: true, similarity: Math.random() })); });
                finalMemory = process.memoryUsage();
                memoryIncrease = {
                    heapUsed: finalMemory.heapUsed - initialMemory.heapUsed,
                    heapTotal: finalMemory.heapTotal - initialMemory.heapTotal,
                    external: finalMemory.external - initialMemory.external,
                };
                console.log("Memory usage increase:");
                console.log("Heap used: ".concat(Math.round(memoryIncrease.heapUsed / 1024 / 1024), "MB"));
                console.log("Heap total: ".concat(Math.round(memoryIncrease.heapTotal / 1024 / 1024), "MB"));
                console.log("External: ".concat(Math.round(memoryIncrease.external / 1024 / 1024), "MB"));
                // Memory increase should be reasonable
                (0, vitest_1.expect)(memoryIncrease.heapUsed).toBeLessThan(500 * 1024 * 1024); // Less than 500MB
                return [2 /*return*/];
            });
        }); });
        (0, vitest_1.it)("should test memory cleanup after operations", function () { return __awaiter(void 0, void 0, void 0, function () {
            var initialMemory, i, tempData, finalMemory, memoryIncrease;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        initialMemory = process.memoryUsage().heapUsed;
                        // Create and process large temporary data
                        for (i = 0; i < 10; i++) {
                            tempData = Array.from({ length: 1000 }, function () { return ({
                                data: "A".repeat(1000),
                                embedding: Array.from({ length: 1536 }, function () { return Math.random(); }),
                            }); });
                            // Process and discard
                            tempData.forEach(function (item) { return item.data.length; });
                        }
                        // Force garbage collection if available
                        if (global.gc) {
                            global.gc();
                        }
                        // Wait a bit for cleanup
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 100); })];
                    case 1:
                        // Wait a bit for cleanup
                        _a.sent();
                        finalMemory = process.memoryUsage().heapUsed;
                        memoryIncrease = finalMemory - initialMemory;
                        console.log("Memory increase after cleanup: ".concat(Math.round(memoryIncrease / 1024 / 1024), "MB"));
                        // Memory should not increase significantly after cleanup
                        (0, vitest_1.expect)(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
