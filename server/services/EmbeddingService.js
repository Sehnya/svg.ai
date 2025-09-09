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
exports.EmbeddingService = void 0;
var EmbeddingService = /** @class */ (function () {
    function EmbeddingService(config) {
        this.cache = new Map();
        this.config = config;
    }
    EmbeddingService.prototype.generateEmbedding = function (text) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error, data, result, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Check cache first
                        if (this.config.cacheEnabled && this.cache.has(text)) {
                            return [2 /*return*/, this.cache.get(text)];
                        }
                        if (!this.config.apiKey) {
                            throw new Error("OpenAI API key not configured for embeddings");
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        return [4 /*yield*/, fetch("https://api.openai.com/v1/embeddings", {
                                method: "POST",
                                headers: {
                                    Authorization: "Bearer ".concat(this.config.apiKey),
                                    "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                    model: this.config.model,
                                    input: text,
                                    encoding_format: "float",
                                }),
                            })];
                    case 2:
                        response = _a.sent();
                        if (!!response.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, response.text()];
                    case 3:
                        error = _a.sent();
                        throw new Error("OpenAI Embeddings API error: ".concat(response.status, " ").concat(error));
                    case 4: return [4 /*yield*/, response.json()];
                    case 5:
                        data = _a.sent();
                        if (!data.data || data.data.length === 0) {
                            throw new Error("No embedding data returned from API");
                        }
                        result = {
                            embedding: data.data[0].embedding,
                            tokens: data.usage.total_tokens,
                            model: this.config.model,
                        };
                        // Cache the result
                        if (this.config.cacheEnabled) {
                            this.cache.set(text, result);
                        }
                        return [2 /*return*/, result];
                    case 6:
                        error_1 = _a.sent();
                        console.error("Failed to generate embedding:", error_1);
                        throw error_1;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    EmbeddingService.prototype.generateBatchEmbeddings = function (texts) {
        return __awaiter(this, void 0, void 0, function () {
            var batches, allEmbeddings, totalTokens, _loop_1, this_1, _i, batches_1, batch;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.config.apiKey) {
                            throw new Error("OpenAI API key not configured for embeddings");
                        }
                        batches = this.chunkArray(texts, this.config.batchSize);
                        allEmbeddings = [];
                        totalTokens = 0;
                        _loop_1 = function (batch) {
                            var cachedResults, uncachedTexts, uncachedIndices, i, text, batchResults, response, error, data_1, error_2, batchEmbeddings, uncachedIndex, i;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        cachedResults = [];
                                        uncachedTexts = [];
                                        uncachedIndices = [];
                                        for (i = 0; i < batch.length; i++) {
                                            text = batch[i];
                                            if (this_1.config.cacheEnabled && this_1.cache.has(text)) {
                                                cachedResults[i] = this_1.cache.get(text);
                                            }
                                            else {
                                                cachedResults[i] = null;
                                                uncachedTexts.push(text);
                                                uncachedIndices.push(i);
                                            }
                                        }
                                        batchResults = [];
                                        if (!(uncachedTexts.length > 0)) return [3 /*break*/, 7];
                                        _b.label = 1;
                                    case 1:
                                        _b.trys.push([1, 6, , 7]);
                                        return [4 /*yield*/, fetch("https://api.openai.com/v1/embeddings", {
                                                method: "POST",
                                                headers: {
                                                    Authorization: "Bearer ".concat(this_1.config.apiKey),
                                                    "Content-Type": "application/json",
                                                },
                                                body: JSON.stringify({
                                                    model: this_1.config.model,
                                                    input: uncachedTexts,
                                                    encoding_format: "float",
                                                }),
                                            })];
                                    case 2:
                                        response = _b.sent();
                                        if (!!response.ok) return [3 /*break*/, 4];
                                        return [4 /*yield*/, response.text()];
                                    case 3:
                                        error = _b.sent();
                                        throw new Error("OpenAI Embeddings API error: ".concat(response.status, " ").concat(error));
                                    case 4: return [4 /*yield*/, response.json()];
                                    case 5:
                                        data_1 = _b.sent();
                                        if (!data_1.data || data_1.data.length !== uncachedTexts.length) {
                                            throw new Error("Unexpected embedding data from API");
                                        }
                                        batchResults = data_1.data.map(function (item, index) { return ({
                                            embedding: item.embedding,
                                            tokens: data_1.usage.total_tokens / uncachedTexts.length, // Approximate per-text tokens
                                            model: _this.config.model,
                                        }); });
                                        totalTokens += data_1.usage.total_tokens;
                                        // Cache the results
                                        if (this_1.config.cacheEnabled) {
                                            uncachedTexts.forEach(function (text, index) {
                                                _this.cache.set(text, batchResults[index]);
                                            });
                                        }
                                        return [3 /*break*/, 7];
                                    case 6:
                                        error_2 = _b.sent();
                                        console.error("Failed to generate batch embeddings:", error_2);
                                        throw error_2;
                                    case 7:
                                        batchEmbeddings = [];
                                        uncachedIndex = 0;
                                        for (i = 0; i < batch.length; i++) {
                                            if (cachedResults[i]) {
                                                batchEmbeddings.push(cachedResults[i].embedding);
                                                totalTokens += cachedResults[i].tokens;
                                            }
                                            else {
                                                batchEmbeddings.push(batchResults[uncachedIndex].embedding);
                                                uncachedIndex++;
                                            }
                                        }
                                        allEmbeddings.push.apply(allEmbeddings, batchEmbeddings);
                                        return [2 /*return*/];
                                }
                            });
                        };
                        this_1 = this;
                        _i = 0, batches_1 = batches;
                        _a.label = 1;
                    case 1:
                        if (!(_i < batches_1.length)) return [3 /*break*/, 4];
                        batch = batches_1[_i];
                        return [5 /*yield**/, _loop_1(batch)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, {
                            embeddings: allEmbeddings,
                            totalTokens: totalTokens,
                            model: this.config.model,
                        }];
                }
            });
        });
    };
    EmbeddingService.prototype.calculateCosineSimilarity = function (embedding1, embedding2) {
        if (embedding1.length !== embedding2.length) {
            throw new Error("Embeddings must have the same dimension");
        }
        var dotProduct = 0;
        var norm1 = 0;
        var norm2 = 0;
        for (var i = 0; i < embedding1.length; i++) {
            dotProduct += embedding1[i] * embedding2[i];
            norm1 += embedding1[i] * embedding1[i];
            norm2 += embedding2[i] * embedding2[i];
        }
        var magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
        if (magnitude === 0) {
            return 0;
        }
        return dotProduct / magnitude;
    };
    EmbeddingService.prototype.findMostSimilar = function (queryEmbedding, candidateEmbeddings, topK) {
        var _this = this;
        if (topK === void 0) { topK = 10; }
        var similarities = candidateEmbeddings.map(function (candidate) { return ({
            id: candidate.id,
            similarity: _this.calculateCosineSimilarity(queryEmbedding, candidate.embedding),
            metadata: candidate.metadata,
        }); });
        // Sort by similarity (descending) and return top K
        return similarities
            .sort(function (a, b) { return b.similarity - a.similarity; })
            .slice(0, topK);
    };
    EmbeddingService.prototype.generateEmbeddingForKBObject = function (object) {
        return __awaiter(this, void 0, void 0, function () {
            var textContent, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        textContent = this.extractTextFromKBObject(object);
                        return [4 /*yield*/, this.generateEmbedding(textContent)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.embedding];
                }
            });
        });
    };
    EmbeddingService.prototype.extractTextFromKBObject = function (object) {
        var parts = [];
        // Add title
        if (object.title) {
            parts.push(object.title);
        }
        // Add tags
        if (object.tags && object.tags.length > 0) {
            parts.push(object.tags.join(" "));
        }
        // Add body content (simplified extraction)
        if (object.body) {
            if (typeof object.body === "string") {
                parts.push(object.body);
            }
            else if (typeof object.body === "object") {
                // Extract text from object properties
                var bodyText = this.extractTextFromObject(object.body);
                if (bodyText) {
                    parts.push(bodyText);
                }
            }
        }
        return parts.join(" ").trim();
    };
    EmbeddingService.prototype.extractTextFromObject = function (obj) {
        var texts = [];
        for (var _i = 0, _a = Object.entries(obj); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], value = _b[1];
            if (typeof value === "string") {
                texts.push(value);
            }
            else if (typeof value === "object" && value !== null) {
                if (Array.isArray(value)) {
                    value.forEach(function (item) {
                        if (typeof item === "string") {
                            texts.push(item);
                        }
                    });
                }
                else {
                    var nestedText = this.extractTextFromObject(value);
                    if (nestedText) {
                        texts.push(nestedText);
                    }
                }
            }
        }
        return texts.join(" ");
    };
    EmbeddingService.prototype.chunkArray = function (array, chunkSize) {
        var chunks = [];
        for (var i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    };
    EmbeddingService.prototype.getCacheStats = function () {
        return {
            size: this.cache.size,
            // Hit rate would need to be tracked separately
        };
    };
    EmbeddingService.prototype.clearCache = function () {
        this.cache.clear();
    };
    // Utility method for tag-based fallback search
    EmbeddingService.tagBasedSimilarity = function (query, tags) {
        var queryWords = query.toLowerCase().split(/\s+/);
        var tagWords = tags.map(function (tag) { return tag.toLowerCase(); });
        var matches = 0;
        var _loop_2 = function (word) {
            if (tagWords.some(function (tag) { return tag.includes(word) || word.includes(tag); })) {
                matches++;
            }
        };
        for (var _i = 0, queryWords_1 = queryWords; _i < queryWords_1.length; _i++) {
            var word = queryWords_1[_i];
            _loop_2(word);
        }
        return queryWords.length > 0 ? matches / queryWords.length : 0;
    };
    return EmbeddingService;
}());
exports.EmbeddingService = EmbeddingService;
