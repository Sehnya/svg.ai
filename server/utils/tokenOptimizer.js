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
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenOptimizer = exports.TokenOptimizer = void 0;
var TokenOptimizer = /** @class */ (function () {
    function TokenOptimizer() {
        // Token pricing (OpenAI GPT-4 and text-embedding-3-small rates)
        this.PRICING = {
            gpt4: {
                input: 0.03 / 1000, // $0.03 per 1K input tokens
                output: 0.06 / 1000, // $0.06 per 1K output tokens
            },
            embedding: {
                input: 0.00002 / 1000, // $0.00002 per 1K tokens
            },
        };
        // Token limits and thresholds
        this.LIMITS = {
            maxObjectTokens: 500,
            maxGroundingTokens: 3000,
            batchSize: 100,
            compressionThreshold: 0.8,
        };
        this.metrics = {
            totalUsage: {
                promptTokens: 0,
                completionTokens: 0,
                totalTokens: 0,
                cost: 0,
            },
            averagePerRequest: {
                promptTokens: 0,
                completionTokens: 0,
                totalTokens: 0,
                cost: 0,
            },
            requestCount: 0,
            costSavings: { cacheHits: 0, tokensSaved: 0, costSaved: 0 },
            optimization: {
                compactObjects: 0,
                batchedEmbeddings: 0,
                preferenceReductions: 0,
            },
        };
        if (TokenOptimizer.instance) {
            return TokenOptimizer.instance;
        }
        TokenOptimizer.instance = this;
    }
    TokenOptimizer.getInstance = function () {
        if (!TokenOptimizer.instance) {
            TokenOptimizer.instance = new TokenOptimizer();
        }
        return TokenOptimizer.instance;
    };
    /**
     * Estimate token count for text content
     */
    TokenOptimizer.prototype.estimateTokens = function (content) {
        var text = typeof content === "string" ? content : JSON.stringify(content);
        // More accurate estimation based on OpenAI's tokenizer patterns
        // Average ~4 characters per token, but adjust for JSON structure
        var baseEstimate = Math.ceil(text.length / 4);
        // JSON overhead adjustment
        if (typeof content === "object") {
            var jsonOverhead = (text.match(/[{}[\]":,]/g) || []).length * 0.1;
            return Math.ceil(baseEstimate + jsonOverhead);
        }
        return baseEstimate;
    };
    /**
     * Optimize KB object content to reduce token usage
     */
    TokenOptimizer.prototype.optimizeKBObject = function (object) {
        var originalContent = JSON.stringify(object.body);
        var originalTokens = this.estimateTokens(originalContent);
        var modifications = [];
        if (originalTokens <= this.LIMITS.maxObjectTokens) {
            return {
                originalTokens: originalTokens,
                optimizedTokens: originalTokens,
                savings: 0,
                savingsPercent: 0,
                modifications: [],
            };
        }
        var optimizedBody = __assign({}, object.body);
        // Remove unnecessary whitespace and formatting
        if (typeof optimizedBody === "object") {
            optimizedBody = this.compactObject(optimizedBody);
            modifications.push("Removed unnecessary whitespace");
        }
        // Compress verbose descriptions
        if (optimizedBody.description &&
            typeof optimizedBody.description === "string") {
            var compressed = this.compressDescription(optimizedBody.description);
            if (compressed !== optimizedBody.description) {
                optimizedBody.description = compressed;
                modifications.push("Compressed description");
            }
        }
        // Remove redundant properties
        optimizedBody = this.removeRedundantProperties(optimizedBody);
        if (modifications.length > 0) {
            modifications.push("Removed redundant properties");
        }
        // Abbreviate common terms
        optimizedBody = this.abbreviateCommonTerms(optimizedBody);
        modifications.push("Abbreviated common terms");
        var optimizedContent = JSON.stringify(optimizedBody);
        var optimizedTokens = this.estimateTokens(optimizedContent);
        var savings = originalTokens - optimizedTokens;
        var savingsPercent = (savings / originalTokens) * 100;
        // Update metrics
        if (savings > 0) {
            this.metrics.optimization.compactObjects++;
        }
        return {
            originalTokens: originalTokens,
            optimizedTokens: optimizedTokens,
            savings: savings,
            savingsPercent: savingsPercent,
            modifications: modifications,
        };
    };
    /**
     * Optimize grounding data for minimal token usage
     */
    TokenOptimizer.prototype.optimizeGroundingData = function (grounding) {
        var _this = this;
        var originalTokens = this.estimateTokens(grounding);
        var modifications = [];
        var optimized = __assign({}, grounding);
        // Limit number of objects per category
        if (optimized.motifs && optimized.motifs.length > 6) {
            optimized.motifs = optimized.motifs.slice(0, 6);
            modifications.push("Limited motifs to 6 items");
        }
        if (optimized.glossary && optimized.glossary.length > 3) {
            optimized.glossary = optimized.glossary.slice(0, 3);
            modifications.push("Limited glossary to 3 items");
        }
        if (optimized.fewshot && optimized.fewshot.length > 1) {
            optimized.fewshot = optimized.fewshot.slice(0, 1);
            modifications.push("Limited fewshot to 1 item");
        }
        // Compress each object
        Object.keys(optimized).forEach(function (key) {
            if (Array.isArray(optimized[key])) {
                optimized[key] = optimized[key].map(function (item) {
                    return _this.compactObject(item);
                });
            }
            else if (typeof optimized[key] === "object" &&
                optimized[key] !== null) {
                optimized[key] = _this.compactObject(optimized[key]);
            }
        });
        modifications.push("Compacted all objects");
        var optimizedTokens = this.estimateTokens(optimized);
        var savings = originalTokens - optimizedTokens;
        var savingsPercent = (savings / originalTokens) * 100;
        return {
            originalTokens: originalTokens,
            optimizedTokens: optimizedTokens,
            savings: savings,
            savingsPercent: savingsPercent,
            modifications: modifications,
        };
    };
    /**
     * Calculate cost for token usage
     */
    TokenOptimizer.prototype.calculateCost = function (usage, model) {
        if (model === void 0) { model = "gpt4"; }
        if (model === "embedding") {
            return ((usage.totalTokens || usage.promptTokens || 0) *
                this.PRICING.embedding.input);
        }
        var inputCost = (usage.promptTokens || 0) * this.PRICING.gpt4.input;
        var outputCost = (usage.completionTokens || 0) * this.PRICING.gpt4.output;
        return inputCost + outputCost;
    };
    /**
     * Record token usage for metrics
     */
    TokenOptimizer.prototype.recordUsage = function (usage, fromCache) {
        if (fromCache === void 0) { fromCache = false; }
        this.metrics.requestCount++;
        if (fromCache) {
            this.metrics.costSavings.cacheHits++;
            this.metrics.costSavings.tokensSaved += usage.totalTokens;
            this.metrics.costSavings.costSaved += usage.cost;
        }
        else {
            this.metrics.totalUsage.promptTokens += usage.promptTokens;
            this.metrics.totalUsage.completionTokens += usage.completionTokens;
            this.metrics.totalUsage.totalTokens += usage.totalTokens;
            this.metrics.totalUsage.cost += usage.cost;
        }
        // Update averages
        if (this.metrics.requestCount > 0) {
            this.metrics.averagePerRequest = {
                promptTokens: Math.round(this.metrics.totalUsage.promptTokens / this.metrics.requestCount),
                completionTokens: Math.round(this.metrics.totalUsage.completionTokens / this.metrics.requestCount),
                totalTokens: Math.round(this.metrics.totalUsage.totalTokens / this.metrics.requestCount),
                cost: this.metrics.totalUsage.cost / this.metrics.requestCount,
            };
        }
    };
    /**
     * Get optimization metrics
     */
    TokenOptimizer.prototype.getMetrics = function () {
        return __assign({}, this.metrics);
    };
    /**
     * Reset metrics
     */
    TokenOptimizer.prototype.resetMetrics = function () {
        this.metrics = {
            totalUsage: {
                promptTokens: 0,
                completionTokens: 0,
                totalTokens: 0,
                cost: 0,
            },
            averagePerRequest: {
                promptTokens: 0,
                completionTokens: 0,
                totalTokens: 0,
                cost: 0,
            },
            requestCount: 0,
            costSavings: { cacheHits: 0, tokensSaved: 0, costSaved: 0 },
            optimization: {
                compactObjects: 0,
                batchedEmbeddings: 0,
                preferenceReductions: 0,
            },
        };
    };
    /**
     * Validate object token budget
     */
    TokenOptimizer.prototype.validateTokenBudget = function (object) {
        var tokenCount = this.estimateTokens(object.body || {});
        return {
            valid: tokenCount <= this.LIMITS.maxObjectTokens,
            tokenCount: tokenCount,
            limit: this.LIMITS.maxObjectTokens,
        };
    };
    /**
     * Get optimization recommendations
     */
    TokenOptimizer.prototype.getOptimizationRecommendations = function () {
        var recommendations = [];
        var metrics = this.getMetrics();
        // Cache hit rate recommendations
        if (metrics.costSavings.cacheHits / metrics.requestCount < 0.3) {
            recommendations.push("Consider increasing cache TTL to improve hit rate");
        }
        // Token usage recommendations
        if (metrics.averagePerRequest.totalTokens > 2000) {
            recommendations.push("Average token usage is high - consider optimizing grounding data");
        }
        // Cost optimization recommendations
        if (metrics.totalUsage.cost > 10) {
            recommendations.push("High API costs detected - review token optimization strategies");
        }
        // Object optimization recommendations
        if (metrics.optimization.compactObjects < metrics.requestCount * 0.1) {
            recommendations.push("Few objects are being optimized - review KB object sizes");
        }
        return recommendations;
    };
    // Private helper methods
    TokenOptimizer.prototype.compactObject = function (obj) {
        var _this = this;
        if (typeof obj !== "object" || obj === null) {
            return obj;
        }
        if (Array.isArray(obj)) {
            return obj.map(function (item) { return _this.compactObject(item); });
        }
        var compacted = {};
        Object.keys(obj).forEach(function (key) {
            var value = obj[key];
            // Skip null, undefined, empty strings, and empty arrays
            if (value === null ||
                value === undefined ||
                value === "" ||
                (Array.isArray(value) && value.length === 0)) {
                return;
            }
            // Recursively compact nested objects
            if (typeof value === "object") {
                var compactedValue = _this.compactObject(value);
                if (Object.keys(compactedValue).length > 0 ||
                    Array.isArray(compactedValue)) {
                    compacted[key] = compactedValue;
                }
            }
            else {
                compacted[key] = value;
            }
        });
        return compacted;
    };
    TokenOptimizer.prototype.compressDescription = function (description) {
        if (description.length <= 100) {
            return description;
        }
        // Remove redundant words and phrases
        var compressed = description
            .replace(/\b(very|really|quite|rather|extremely|incredibly)\s+/gi, "")
            .replace(/\b(that is|which is|that are|which are)\s+/gi, "")
            .replace(/\b(in order to|so as to)\b/gi, "to")
            .replace(/\b(due to the fact that|owing to the fact that)\b/gi, "because")
            .replace(/\s+/g, " ")
            .trim();
        // If still too long, truncate intelligently
        if (compressed.length > 150) {
            var sentences = compressed.split(/[.!?]+/);
            compressed = sentences[0];
            if (compressed.length > 150) {
                compressed = compressed.substring(0, 147) + "...";
            }
        }
        return compressed;
    };
    TokenOptimizer.prototype.removeRedundantProperties = function (obj) {
        if (typeof obj !== "object" || obj === null) {
            return obj;
        }
        var cleaned = __assign({}, obj);
        // Remove properties that duplicate information
        if (cleaned.id && cleaned.identifier && cleaned.id === cleaned.identifier) {
            delete cleaned.identifier;
        }
        if (cleaned.name && cleaned.title && cleaned.name === cleaned.title) {
            delete cleaned.name;
        }
        // Remove default values
        if (cleaned.enabled === true)
            delete cleaned.enabled;
        if (cleaned.visible === true)
            delete cleaned.visible;
        if (cleaned.active === true)
            delete cleaned.active;
        return cleaned;
    };
    TokenOptimizer.prototype.abbreviateCommonTerms = function (obj) {
        var _this = this;
        if (typeof obj === "string") {
            return obj
                .replace(/\bbackground\b/gi, "bg")
                .replace(/\bposition\b/gi, "pos")
                .replace(/\bdimension\b/gi, "dim")
                .replace(/\bcoordinate\b/gi, "coord")
                .replace(/\battribute\b/gi, "attr")
                .replace(/\bparameter\b/gi, "param")
                .replace(/\bconfiguration\b/gi, "config")
                .replace(/\binformation\b/gi, "info")
                .replace(/\bdescription\b/gi, "desc");
        }
        if (typeof obj === "object" && obj !== null) {
            if (Array.isArray(obj)) {
                return obj.map(function (item) { return _this.abbreviateCommonTerms(item); });
            }
            var abbreviated_1 = {};
            Object.keys(obj).forEach(function (key) {
                abbreviated_1[key] = _this.abbreviateCommonTerms(obj[key]);
            });
            return abbreviated_1;
        }
        return obj;
    };
    return TokenOptimizer;
}());
exports.TokenOptimizer = TokenOptimizer;
// Export singleton instance
exports.tokenOptimizer = TokenOptimizer.getInstance();
