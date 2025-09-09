import { KBObject } from "../db/schema";

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
}

export interface TokenMetrics {
  totalUsage: TokenUsage;
  averagePerRequest: TokenUsage;
  requestCount: number;
  costSavings: {
    cacheHits: number;
    tokensSaved: number;
    costSaved: number;
  };
  optimization: {
    compactObjects: number;
    batchedEmbeddings: number;
    preferenceReductions: number;
  };
}

export interface OptimizationResult {
  originalTokens: number;
  optimizedTokens: number;
  savings: number;
  savingsPercent: number;
  modifications: string[];
}

export class TokenOptimizer {
  private static instance: TokenOptimizer;
  private metrics: TokenMetrics;

  // Token pricing (OpenAI GPT-4 and text-embedding-3-small rates)
  private readonly PRICING = {
    gpt4: {
      input: 0.03 / 1000, // $0.03 per 1K input tokens
      output: 0.06 / 1000, // $0.06 per 1K output tokens
    },
    embedding: {
      input: 0.00002 / 1000, // $0.00002 per 1K tokens
    },
  };

  // Token limits and thresholds
  private readonly LIMITS = {
    maxObjectTokens: 500,
    maxGroundingTokens: 3000,
    batchSize: 100,
    compressionThreshold: 0.8,
  };

  constructor() {
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

  static getInstance(): TokenOptimizer {
    if (!TokenOptimizer.instance) {
      TokenOptimizer.instance = new TokenOptimizer();
    }
    return TokenOptimizer.instance;
  }

  /**
   * Estimate token count for text content
   */
  estimateTokens(content: string | object): number {
    const text =
      typeof content === "string" ? content : JSON.stringify(content);

    // More accurate estimation based on OpenAI's tokenizer patterns
    // Average ~4 characters per token, but adjust for JSON structure
    const baseEstimate = Math.ceil(text.length / 4);

    // JSON overhead adjustment
    if (typeof content === "object") {
      const jsonOverhead = (text.match(/[{}[\]":,]/g) || []).length * 0.1;
      return Math.ceil(baseEstimate + jsonOverhead);
    }

    return baseEstimate;
  }

  /**
   * Optimize KB object content to reduce token usage
   */
  optimizeKBObject(object: Partial<KBObject>): OptimizationResult {
    const originalContent = JSON.stringify(object.body);
    const originalTokens = this.estimateTokens(originalContent);
    const modifications: string[] = [];

    if (originalTokens <= this.LIMITS.maxObjectTokens) {
      return {
        originalTokens,
        optimizedTokens: originalTokens,
        savings: 0,
        savingsPercent: 0,
        modifications: [],
      };
    }

    let optimizedBody = { ...object.body };

    // Remove unnecessary whitespace and formatting
    if (typeof optimizedBody === "object") {
      optimizedBody = this.compactObject(optimizedBody);
      modifications.push("Removed unnecessary whitespace");
    }

    // Compress verbose descriptions
    if (
      optimizedBody.description &&
      typeof optimizedBody.description === "string"
    ) {
      const compressed = this.compressDescription(optimizedBody.description);
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

    const optimizedContent = JSON.stringify(optimizedBody);
    const optimizedTokens = this.estimateTokens(optimizedContent);
    const savings = originalTokens - optimizedTokens;
    const savingsPercent = (savings / originalTokens) * 100;

    // Update metrics
    if (savings > 0) {
      this.metrics.optimization.compactObjects++;
    }

    return {
      originalTokens,
      optimizedTokens,
      savings,
      savingsPercent,
      modifications,
    };
  }

  /**
   * Optimize grounding data for minimal token usage
   */
  optimizeGroundingData(grounding: any): OptimizationResult {
    const originalTokens = this.estimateTokens(grounding);
    const modifications: string[] = [];

    let optimized = { ...grounding };

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
    Object.keys(optimized).forEach((key) => {
      if (Array.isArray(optimized[key])) {
        optimized[key] = optimized[key].map((item: any) =>
          this.compactObject(item)
        );
      } else if (
        typeof optimized[key] === "object" &&
        optimized[key] !== null
      ) {
        optimized[key] = this.compactObject(optimized[key]);
      }
    });

    modifications.push("Compacted all objects");

    const optimizedTokens = this.estimateTokens(optimized);
    const savings = originalTokens - optimizedTokens;
    const savingsPercent = (savings / originalTokens) * 100;

    return {
      originalTokens,
      optimizedTokens,
      savings,
      savingsPercent,
      modifications,
    };
  }

  /**
   * Calculate cost for token usage
   */
  calculateCost(
    usage: Partial<TokenUsage>,
    model: "gpt4" | "embedding" = "gpt4"
  ): number {
    if (model === "embedding") {
      return (
        (usage.totalTokens || usage.promptTokens || 0) *
        this.PRICING.embedding.input
      );
    }

    const inputCost = (usage.promptTokens || 0) * this.PRICING.gpt4.input;
    const outputCost = (usage.completionTokens || 0) * this.PRICING.gpt4.output;
    return inputCost + outputCost;
  }

  /**
   * Record token usage for metrics
   */
  recordUsage(usage: TokenUsage, fromCache: boolean = false): void {
    this.metrics.requestCount++;

    if (fromCache) {
      this.metrics.costSavings.cacheHits++;
      this.metrics.costSavings.tokensSaved += usage.totalTokens;
      this.metrics.costSavings.costSaved += usage.cost;
    } else {
      this.metrics.totalUsage.promptTokens += usage.promptTokens;
      this.metrics.totalUsage.completionTokens += usage.completionTokens;
      this.metrics.totalUsage.totalTokens += usage.totalTokens;
      this.metrics.totalUsage.cost += usage.cost;
    }

    // Update averages
    if (this.metrics.requestCount > 0) {
      this.metrics.averagePerRequest = {
        promptTokens: Math.round(
          this.metrics.totalUsage.promptTokens / this.metrics.requestCount
        ),
        completionTokens: Math.round(
          this.metrics.totalUsage.completionTokens / this.metrics.requestCount
        ),
        totalTokens: Math.round(
          this.metrics.totalUsage.totalTokens / this.metrics.requestCount
        ),
        cost: this.metrics.totalUsage.cost / this.metrics.requestCount,
      };
    }
  }

  /**
   * Get optimization metrics
   */
  getMetrics(): TokenMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
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
  }

  /**
   * Validate object token budget
   */
  validateTokenBudget(object: Partial<KBObject>): {
    valid: boolean;
    tokenCount: number;
    limit: number;
  } {
    const tokenCount = this.estimateTokens(object.body || {});
    return {
      valid: tokenCount <= this.LIMITS.maxObjectTokens,
      tokenCount,
      limit: this.LIMITS.maxObjectTokens,
    };
  }

  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];
    const metrics = this.getMetrics();

    // Cache hit rate recommendations
    if (metrics.costSavings.cacheHits / metrics.requestCount < 0.3) {
      recommendations.push("Consider increasing cache TTL to improve hit rate");
    }

    // Token usage recommendations
    if (metrics.averagePerRequest.totalTokens > 2000) {
      recommendations.push(
        "Average token usage is high - consider optimizing grounding data"
      );
    }

    // Cost optimization recommendations
    if (metrics.totalUsage.cost > 10) {
      recommendations.push(
        "High API costs detected - review token optimization strategies"
      );
    }

    // Object optimization recommendations
    if (metrics.optimization.compactObjects < metrics.requestCount * 0.1) {
      recommendations.push(
        "Few objects are being optimized - review KB object sizes"
      );
    }

    return recommendations;
  }

  // Private helper methods

  private compactObject(obj: any): any {
    if (typeof obj !== "object" || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.compactObject(item));
    }

    const compacted: any = {};

    Object.keys(obj).forEach((key) => {
      const value = obj[key];

      // Skip null, undefined, empty strings, and empty arrays
      if (
        value === null ||
        value === undefined ||
        value === "" ||
        (Array.isArray(value) && value.length === 0)
      ) {
        return;
      }

      // Recursively compact nested objects
      if (typeof value === "object") {
        const compactedValue = this.compactObject(value);
        if (
          Object.keys(compactedValue).length > 0 ||
          Array.isArray(compactedValue)
        ) {
          compacted[key] = compactedValue;
        }
      } else {
        compacted[key] = value;
      }
    });

    return compacted;
  }

  private compressDescription(description: string): string {
    if (description.length <= 100) {
      return description;
    }

    // Remove redundant words and phrases
    let compressed = description
      .replace(/\b(very|really|quite|rather|extremely|incredibly)\s+/gi, "")
      .replace(/\b(that is|which is|that are|which are)\s+/gi, "")
      .replace(/\b(in order to|so as to)\b/gi, "to")
      .replace(/\b(due to the fact that|owing to the fact that)\b/gi, "because")
      .replace(/\s+/g, " ")
      .trim();

    // If still too long, truncate intelligently
    if (compressed.length > 150) {
      const sentences = compressed.split(/[.!?]+/);
      compressed = sentences[0];
      if (compressed.length > 150) {
        compressed = compressed.substring(0, 147) + "...";
      }
    }

    return compressed;
  }

  private removeRedundantProperties(obj: any): any {
    if (typeof obj !== "object" || obj === null) {
      return obj;
    }

    const cleaned = { ...obj };

    // Remove properties that duplicate information
    if (cleaned.id && cleaned.identifier && cleaned.id === cleaned.identifier) {
      delete cleaned.identifier;
    }

    if (cleaned.name && cleaned.title && cleaned.name === cleaned.title) {
      delete cleaned.name;
    }

    // Remove default values
    if (cleaned.enabled === true) delete cleaned.enabled;
    if (cleaned.visible === true) delete cleaned.visible;
    if (cleaned.active === true) delete cleaned.active;

    return cleaned;
  }

  private abbreviateCommonTerms(obj: any): any {
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
        return obj.map((item) => this.abbreviateCommonTerms(item));
      }

      const abbreviated: any = {};
      Object.keys(obj).forEach((key) => {
        abbreviated[key] = this.abbreviateCommonTerms(obj[key]);
      });
      return abbreviated;
    }

    return obj;
  }
}

// Export singleton instance
export const tokenOptimizer = TokenOptimizer.getInstance();
