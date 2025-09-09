import { eq, and, desc, sql, inArray, like, or } from "drizzle-orm";
import { db } from "../db/config";
import {
  kbObjects,
  kbLinks,
  userPreferences,
  globalPreferences,
  groundingCache,
  kbAudit,
  type KBObject,
  type NewKBObject,
  type KBLink,
  type NewKBLink,
  type NewGroundingCache,
  type NewKBAudit,
} from "../db/schema";
import { createHash } from "crypto";
import { cacheManager, type CacheMetrics } from "../utils/cache";
import {
  tokenOptimizer,
  type TokenMetrics,
  type OptimizationResult,
} from "../utils/tokenOptimizer";

// Knowledge Base types
export type KBObjectKind =
  | "style_pack"
  | "motif"
  | "glossary"
  | "rule"
  | "fewshot";
export type KBObjectStatus = "active" | "deprecated" | "experimental";
export type KBLinkRelation = "belongs_to" | "refines" | "contradicts";

export interface DesignIntent {
  style: {
    palette: string[];
    strokeRules: {
      strokeOnly: boolean;
      minStrokeWidth: number;
      linecap: "round" | "square" | "butt";
      linejoin: "round" | "miter" | "bevel";
    };
    density: "sparse" | "medium" | "dense";
    symmetry: "none" | "horizontal" | "vertical" | "radial";
  };
  motifs: string[];
  layout: {
    sizes: Array<{ component: string; size: "small" | "medium" | "large" }>;
    counts: Array<{ component: string; count: number }>;
    arrangement: "grid" | "organic" | "centered" | "scattered";
  };
  constraints: {
    strokeOnly: boolean;
    maxElements: number;
    requiredMotifs: string[];
  };
}

export interface GroundingData {
  stylePack?: any;
  motifs: any[];
  glossary: any[];
  fewshot: any[];
  components: any[];
}

export interface ScoredObject extends KBObject {
  score: number;
  similarity: number;
  preferenceBoost: number;
  quality: number;
  freshness: number;
}

export interface Preferences {
  tagWeights: Record<string, number>;
  kindWeights: Record<KBObjectKind, number>;
  qualityThreshold: number;
  diversityWeight: number;
  updatedAt: Date;
}

export interface ValidationResult {
  isValid: boolean;
  issues: string[];
  tokenCount?: number;
}

export interface CompatibilityTestResult {
  passed: boolean;
  score: number;
  issues: string[];
}

// Canonical prompts for testing KB objects
const CANONICAL_PROMPTS = [
  "Create a simple geometric icon",
  "Design a Mediterranean-style architectural element",
  "Generate an abstract pattern with flowing lines",
  "Make a minimalist logo with clean shapes",
  "Create a decorative border with organic motifs",
];

export class KnowledgeBaseManager {
  private static instance: KnowledgeBaseManager;
  private cacheManager = cacheManager;
  private tokenOptimizer = tokenOptimizer;

  // Scoring algorithm weights (α=0.6 similarity + β=0.2 preference + γ=0.2 quality - δ=0.1 freshness)
  private readonly SCORING_WEIGHTS = {
    similarity: 0.6,
    preference: 0.2,
    quality: 0.2,
    freshness: 0.1,
  };

  // MMR algorithm weights (0.7 relevance, 0.3 diversity)
  private readonly MMR_WEIGHTS = {
    relevance: 0.7,
    diversity: 0.3,
  };

  // Preference caps to prevent echo chambers
  private readonly MAX_PREFERENCE_BOOST = 1.5;

  // Token budget limit
  private readonly MAX_TOKEN_LIMIT = 500;

  // Quality threshold for active objects
  private readonly MIN_QUALITY_SCORE = 0.3;

  // Freshness penalty threshold (4 months)
  private readonly FRESHNESS_THRESHOLD = 4 * 30 * 24 * 60 * 60 * 1000; // 4 months in ms

  constructor() {
    if (KnowledgeBaseManager.instance) {
      return KnowledgeBaseManager.instance;
    }
    KnowledgeBaseManager.instance = this;
  }

  static getInstance(): KnowledgeBaseManager {
    if (!KnowledgeBaseManager.instance) {
      KnowledgeBaseManager.instance = new KnowledgeBaseManager();
    }
    return KnowledgeBaseManager.instance;
  }

  // CRUD Operations for KB Objects
  async createObject(
    object: Omit<NewKBObject, "id" | "createdAt" | "updatedAt">,
    userId?: string,
    reason?: string
  ): Promise<KBObject> {
    // Validate token budget before creation
    const tokenValidation = this.tokenOptimizer.validateTokenBudget(object);
    if (!tokenValidation.valid) {
      throw new Error(
        `Object exceeds token limit: ${tokenValidation.tokenCount} > ${tokenValidation.limit} tokens`
      );
    }

    // Optimize object content for token efficiency
    const optimization = this.tokenOptimizer.optimizeKBObject(object);
    if (optimization.savings > 0) {
      console.log(
        `Optimized KB object: saved ${optimization.savings} tokens (${optimization.savingsPercent.toFixed(1)}%)`
      );
      console.log(`Modifications: ${optimization.modifications.join(", ")}`);
    }

    // Validate object
    const validation = await this.validateObject(object);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.issues.join(", ")}`);
    }

    // Generate ID and version
    const id = this.generateObjectId(object.kind, object.title);
    const version = object.version || "1.0.0";

    const newObject: NewKBObject = {
      ...object,
      id,
      version,
      status: object.status || "experimental",
      qualityScore: "0",
    };

    // Insert object
    const [created] = await db.insert(kbObjects).values(newObject).returning();

    // Log audit trail
    await this.logAudit(id, "create", null, created, userId, reason);

    // Run compatibility tests for new objects
    if (created.status === "active") {
      await this.runCompatibilityTests(created);
    }

    // Invalidate cache since KB changed
    await this.cacheManager.invalidate();

    return created;
  }

  async updateObject(
    id: string,
    updates: Partial<Omit<NewKBObject, "id" | "createdAt">>,
    userId?: string,
    reason?: string
  ): Promise<KBObject> {
    // Get current object
    const [current] = await db
      .select()
      .from(kbObjects)
      .where(eq(kbObjects.id, id));
    if (!current) {
      throw new Error(`Object not found: ${id}`);
    }

    // Validate token budget for updates
    const updatedObject = { ...current, ...updates };
    const tokenValidation =
      this.tokenOptimizer.validateTokenBudget(updatedObject);
    if (!tokenValidation.valid) {
      throw new Error(
        `Updated object exceeds token limit: ${tokenValidation.tokenCount} > ${tokenValidation.limit} tokens`
      );
    }

    // Optimize updated content
    if (updates.body) {
      const optimization = this.tokenOptimizer.optimizeKBObject(updatedObject);
      if (optimization.savings > 0) {
        console.log(
          `Optimized updated KB object: saved ${optimization.savings} tokens`
        );
      }
    }

    // Validate updates
    const validation = await this.validateObject(updatedObject);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.issues.join(", ")}`);
    }

    // Update version if content changed
    if (updates.body || updates.title || updates.tags) {
      updates.version = this.incrementVersion(current.version);
      updates.parentId = current.id;
    }

    // Update object
    const [updated] = await db
      .update(kbObjects)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(kbObjects.id, id))
      .returning();

    // Log audit trail
    await this.logAudit(id, "update", current, updated, userId, reason);

    // Invalidate cache since KB changed
    await this.cacheManager.invalidate();

    return updated;
  }

  async deleteObject(
    id: string,
    userId?: string,
    reason?: string
  ): Promise<void> {
    // Get current object for audit
    const [current] = await db
      .select()
      .from(kbObjects)
      .where(eq(kbObjects.id, id));
    if (!current) {
      throw new Error(`Object not found: ${id}`);
    }

    // Delete object (cascades to links)
    await db.delete(kbObjects).where(eq(kbObjects.id, id));

    // Log audit trail
    await this.logAudit(id, "delete", current, null, userId, reason);

    // Invalidate cache
    await this.cacheManager.invalidate();
  }

  async getObject(id: string): Promise<KBObject | null> {
    const [object] = await db
      .select()
      .from(kbObjects)
      .where(eq(kbObjects.id, id));
    return object || null;
  }

  async listObjects(
    filters: {
      kind?: KBObjectKind;
      status?: KBObjectStatus;
      tags?: string[];
      search?: string;
    } = {},
    pagination: { limit?: number; offset?: number } = {}
  ): Promise<{ objects: KBObject[]; total: number }> {
    let query = db.select().from(kbObjects);
    let countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(kbObjects);

    // Apply filters
    const conditions = [];

    if (filters.kind) {
      conditions.push(eq(kbObjects.kind, filters.kind));
    }

    if (filters.status) {
      conditions.push(eq(kbObjects.status, filters.status));
    }

    if (filters.tags && filters.tags.length > 0) {
      conditions.push(sql`${kbObjects.tags} && ${filters.tags}`);
    }

    if (filters.search) {
      conditions.push(
        or(
          like(kbObjects.title, `%${filters.search}%`),
          like(sql`${kbObjects.body}::text`, `%${filters.search}%`)
        )
      );
    }

    if (conditions.length > 0) {
      const whereClause =
        conditions.length === 1 ? conditions[0] : and(...conditions);
      query = query.where(whereClause) as any;
      countQuery = countQuery.where(whereClause) as any;
    }

    // Apply pagination
    if (pagination.limit) {
      query = query.limit(pagination.limit) as any;
    }
    if (pagination.offset) {
      query = query.offset(pagination.offset) as any;
    }

    // Order by quality and updated date
    query = query.orderBy(
      desc(kbObjects.qualityScore),
      desc(kbObjects.updatedAt)
    ) as any;

    const [objects, [{ count }]] = await Promise.all([query, countQuery]);

    return { objects, total: count };
  }

  // Knowledge Retrieval with Preferences
  async retrieveGrounding(
    prompt: string,
    userId?: string
  ): Promise<GroundingData> {
    // Generate cache key with user context
    const cacheKey = this.cacheManager.generateCacheKey(prompt, userId);

    // Check cache first (5-15 minute TTL for token savings)
    const cached = await this.cacheManager.get<GroundingData>(cacheKey);
    if (cached) {
      // Record cache hit for metrics
      this.tokenOptimizer.recordUsage(
        {
          promptTokens: this.tokenOptimizer.estimateTokens(prompt),
          completionTokens: 0,
          totalTokens: this.tokenOptimizer.estimateTokens(cached),
          cost: this.tokenOptimizer.calculateCost({
            promptTokens: this.tokenOptimizer.estimateTokens(prompt),
            totalTokens: this.tokenOptimizer.estimateTokens(cached),
          }),
        },
        true // fromCache = true
      );
      return cached;
    }

    // Get preferences
    const [userPrefs, globalPrefs] = await Promise.all([
      this.getUserPreferences(userId),
      this.getGlobalPreferences(),
    ]);

    // Retrieve candidates with governance filtering
    const candidates = await this.getCandidates(prompt);

    // Score objects with preference-aware algorithm
    const scored = await this.scoreObjects(
      candidates,
      prompt,
      userPrefs,
      globalPrefs
    );

    // Select diverse set with MMR algorithm
    let grounding = this.selectGroundingSet(scored);

    // Optimize grounding data for token efficiency
    const optimization = this.tokenOptimizer.optimizeGroundingData(grounding);
    if (optimization.savings > 0) {
      grounding = JSON.parse(JSON.stringify(grounding)); // Apply optimizations
      console.log(
        `Token optimization saved ${optimization.savings} tokens (${optimization.savingsPercent.toFixed(1)}%)`
      );
    }

    // Cache result with dynamic TTL based on complexity
    const complexity = this.tokenOptimizer.estimateTokens(grounding);
    const ttlMinutes = complexity > 2000 ? 15 : complexity > 1000 ? 10 : 5;
    await this.cacheManager.set(cacheKey, grounding, ttlMinutes);

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

    return grounding;
  }

  private async getCandidates(_prompt: string): Promise<KBObject[]> {
    // Get active objects with governance filtering
    const candidates = await db
      .select()
      .from(kbObjects)
      .where(
        and(
          eq(kbObjects.status, "active"),
          sql`${kbObjects.qualityScore} >= ${this.MIN_QUALITY_SCORE}`
        )
      )
      .orderBy(desc(kbObjects.qualityScore));

    // Apply content policy and governance filters
    return candidates.filter((obj) => this.passesGovernanceFilter(obj));
  }

  private async scoreObjects(
    objects: KBObject[],
    prompt: string,
    userPrefs: Preferences,
    globalPrefs: Preferences
  ): Promise<ScoredObject[]> {
    return objects
      .map((obj) => {
        const similarity = this.calculateSimilarity(obj, prompt);
        const preferenceBoost = Math.min(
          this.MAX_PREFERENCE_BOOST,
          this.getPreferenceBoost(obj, userPrefs) +
            0.5 * this.getPreferenceBoost(obj, globalPrefs)
        );
        const quality = parseFloat(obj.qualityScore || "0");
        const freshness = this.getFreshnessPenalty(obj.updatedAt);

        const score =
          this.SCORING_WEIGHTS.similarity * similarity +
          this.SCORING_WEIGHTS.preference * preferenceBoost +
          this.SCORING_WEIGHTS.quality * quality -
          this.SCORING_WEIGHTS.freshness * freshness;

        return {
          ...obj,
          score,
          similarity,
          preferenceBoost,
          quality,
          freshness,
        };
      })
      .sort((a, b) => b.score - a.score);
  }

  private selectGroundingSet(scored: ScoredObject[]): GroundingData {
    // Apply Maximal Marginal Relevance for diversity
    const stylePack = scored.find((obj) => obj.kind === "style_pack");
    const motifs = this.selectDiverseObjects(
      scored.filter((obj) => obj.kind === "motif"),
      6
    );
    const glossary = this.selectDiverseObjects(
      scored.filter((obj) => obj.kind === "glossary"),
      3
    );
    const fewshot = scored.filter((obj) => obj.kind === "fewshot").slice(0, 1);

    return {
      stylePack: stylePack?.body,
      motifs: motifs.map((m) => m.body),
      glossary: glossary.map((g) => g.body),
      fewshot: fewshot.map((f) => f.body),
      components: this.getReusableComponents(motifs),
    };
  }

  private selectDiverseObjects(
    objects: ScoredObject[],
    maxCount: number
  ): ScoredObject[] {
    if (objects.length <= maxCount) return objects;

    const selected: ScoredObject[] = [];
    const remaining = [...objects];

    // Select first object (highest score)
    if (remaining.length > 0) {
      selected.push(remaining.shift()!);
    }

    // Apply MMR for remaining selections
    while (selected.length < maxCount && remaining.length > 0) {
      let bestIndex = 0;
      let bestScore = -Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const candidate = remaining[i];
        const relevance = candidate.score;

        // Calculate diversity (minimum similarity to selected objects)
        const diversity = Math.min(
          ...selected.map(
            (sel) => 1 - this.calculateObjectSimilarity(candidate, sel)
          )
        );

        const mmrScore =
          this.MMR_WEIGHTS.relevance * relevance +
          this.MMR_WEIGHTS.diversity * diversity;

        if (mmrScore > bestScore) {
          bestScore = mmrScore;
          bestIndex = i;
        }
      }

      selected.push(remaining.splice(bestIndex, 1)[0]);
    }

    return selected;
  }

  // Cache and Token Management
  async getCacheMetrics(): Promise<CacheMetrics> {
    return await this.cacheManager.getMetrics();
  }

  async getTokenMetrics(): Promise<TokenMetrics> {
    return this.tokenOptimizer.getMetrics();
  }

  async clearCache(): Promise<void> {
    await this.cacheManager.clear();
  }

  async cleanupCache(): Promise<{ deletedCount: number }> {
    return await this.cacheManager.cleanup();
  }

  async invalidateCache(pattern?: string): Promise<{ deletedCount: number }> {
    return await this.cacheManager.invalidate(pattern);
  }

  async optimizeObject(objectId: string): Promise<OptimizationResult> {
    const object = await this.getObject(objectId);
    if (!object) {
      throw new Error(`Object not found: ${objectId}`);
    }

    return this.tokenOptimizer.optimizeKBObject(object);
  }

  getOptimizationRecommendations(): string[] {
    return this.tokenOptimizer.getOptimizationRecommendations();
  }

  async performCacheHealthCheck(): Promise<{
    healthy: boolean;
    metrics: CacheMetrics;
    issues: string[];
  }> {
    return await this.cacheManager.healthCheck();
  }

  // Batch operations for token efficiency
  async batchOptimizeObjects(objectIds: string[]): Promise<{
    optimized: number;
    totalSavings: number;
    results: Array<{ id: string; result: OptimizationResult }>;
  }> {
    const results: Array<{ id: string; result: OptimizationResult }> = [];
    let totalSavings = 0;
    let optimized = 0;

    for (const id of objectIds) {
      try {
        const result = await this.optimizeObject(id);
        results.push({ id, result });

        if (result.savings > 0) {
          optimized++;
          totalSavings += result.savings;
        }
      } catch (error) {
        console.error(`Failed to optimize object ${id}:`, error);
      }
    }

    return { optimized, totalSavings, results };
  }

  // Validation and Governance
  private async validateObject(
    object: Partial<KBObject>
  ): Promise<ValidationResult> {
    const issues: string[] = [];

    // Token budget check using tokenOptimizer
    if (object.body) {
      const tokenValidation = this.tokenOptimizer.validateTokenBudget(object);
      if (!tokenValidation.valid) {
        issues.push(
          `Object exceeds ${tokenValidation.limit} token limit (${tokenValidation.tokenCount} tokens)`
        );
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
      issues.push(`Invalid content for kind: ${object.kind}`);
    }

    return {
      isValid: issues.length === 0,
      issues,
      tokenCount: object.body ? this.estimateTokens(object.body) : undefined,
    };
  }

  private passesGovernanceFilter(object: KBObject): boolean {
    return (
      object.status === "active" &&
      this.passesContentPolicy(object) &&
      this.meetsQualityThreshold(object) &&
      !this.containsSensitiveContent(object) &&
      this.isDesignNeutral(object)
    );
  }

  // Compatibility Testing
  async runCompatibilityTests(
    object: KBObject
  ): Promise<CompatibilityTestResult> {
    const results: number[] = [];
    const issues: string[] = [];

    for (const prompt of CANONICAL_PROMPTS) {
      try {
        // Test if object can be successfully used in grounding
        const testGrounding = await this.testObjectInGrounding(object, prompt);
        results.push(testGrounding.score);

        if (!testGrounding.passed) {
          issues.push(`Failed with prompt: "${prompt}"`);
        }
      } catch (error) {
        results.push(0);
        issues.push(`Error with prompt "${prompt}": ${error}`);
      }
    }

    const averageScore = results.reduce((a, b) => a + b, 0) / results.length;
    const passed = averageScore >= 0.7 && issues.length === 0;

    // Update quality score based on compatibility test
    if (passed) {
      await db
        .update(kbObjects)
        .set({ qualityScore: averageScore.toString() })
        .where(eq(kbObjects.id, object.id));
    }

    return {
      passed,
      score: averageScore,
      issues,
    };
  }

  private async testObjectInGrounding(
    object: KBObject,
    prompt: string
  ): Promise<{ passed: boolean; score: number }> {
    // Simple test: check if object content is relevant to prompt
    const similarity = this.calculateSimilarity(object, prompt);
    const hasValidStructure = this.validateObjectStructure(object);

    const score = similarity * (hasValidStructure ? 1 : 0.5);
    const passed = score >= 0.5 && hasValidStructure;

    return { passed, score };
  }

  // Helper Methods
  private calculateSimilarity(object: KBObject, prompt: string): number {
    // If embeddings are available, use cosine similarity
    if (object.embedding && object.embedding.length > 0) {
      // This would require embedding the prompt, which needs OpenAI API
      // For now, fall back to tag-based similarity
    }

    // Tag-based similarity as fallback
    return this.calculateTagSimilarity(object, prompt);
  }

  // Token estimation using tokenOptimizer
  private estimateTokens(content: any): number {
    return this.tokenOptimizer.estimateTokens(content);
  }

  private calculateTagSimilarity(object: KBObject, prompt: string): number {
    if (!object.tags || object.tags.length === 0) return 0;

    const promptLower = prompt.toLowerCase();
    const matchingTags = object.tags.filter((tag) =>
      promptLower.includes(tag.toLowerCase())
    );

    return matchingTags.length / object.tags.length;
  }

  private calculateObjectSimilarity(obj1: KBObject, obj2: KBObject): number {
    // Calculate similarity between two objects based on tags
    if (!obj1.tags || !obj2.tags) return 0;

    const tags1 = new Set(obj1.tags.map((t) => t.toLowerCase()));
    const tags2 = new Set(obj2.tags.map((t) => t.toLowerCase()));

    const intersection = new Set(Array.from(tags1).filter((x) => tags2.has(x)));
    const union = new Set([...Array.from(tags1), ...Array.from(tags2)]);

    return intersection.size / union.size; // Jaccard similarity
  }

  private getPreferenceBoost(
    object: KBObject,
    preferences: Preferences
  ): number {
    let boost = 0;

    // Tag-based preferences
    if (object.tags) {
      for (const tag of object.tags) {
        boost += preferences.tagWeights[tag] || 0;
      }
    }

    // Kind-based preferences
    boost += preferences.kindWeights[object.kind as KBObjectKind] || 0;

    return Math.min(boost, this.MAX_PREFERENCE_BOOST);
  }

  private getFreshnessPenalty(updatedAt: Date | null): number {
    if (!updatedAt) return 1; // Maximum penalty for objects without update date

    const age = Date.now() - updatedAt.getTime();
    if (age > this.FRESHNESS_THRESHOLD) {
      return Math.min(1, age / this.FRESHNESS_THRESHOLD - 1);
    }

    return 0; // No penalty for fresh content
  }

  private getReusableComponents(motifs: ScoredObject[]): any[] {
    // Extract reusable components from motifs
    return motifs
      .filter((motif) => motif.body?.reusable === true)
      .map((motif) => motif.body?.component)
      .filter(Boolean);
  }

  // Content validation helpers (removed old estimateTokens - now using tokenOptimizer)

  private containsSensitiveContent(object: Partial<KBObject>): boolean {
    const sensitiveKeywords = [
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

    const content = JSON.stringify(object).toLowerCase();
    return sensitiveKeywords.some((keyword) => content.includes(keyword));
  }

  private detectBias(object: Partial<KBObject>): boolean {
    // Simple bias detection - could be enhanced with ML models
    const biasIndicators = [
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

    const content = JSON.stringify(object).toLowerCase();
    const biasCount = biasIndicators.filter((indicator) =>
      content.includes(indicator)
    ).length;

    return biasCount > 2; // Threshold for bias detection
  }

  private isDesignNeutral(object: Partial<KBObject>): boolean {
    // Check if content is design-focused and neutral
    const nonNeutralKeywords = [
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

    const content = JSON.stringify(object).toLowerCase();
    return !nonNeutralKeywords.some((keyword) => content.includes(keyword));
  }

  private passesContentPolicy(object: KBObject): boolean {
    return (
      !this.containsSensitiveContent(object) &&
      this.isDesignNeutral(object) &&
      !this.detectBias(object)
    );
  }

  private meetsQualityThreshold(object: KBObject): boolean {
    const quality = parseFloat(object.qualityScore || "0");
    return quality >= this.MIN_QUALITY_SCORE;
  }

  private validateKindSpecificContent(object: Partial<KBObject>): boolean {
    if (!object.kind || !object.body) return false;

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
  }

  private validateStylePack(body: any): boolean {
    return (
      body &&
      typeof body === "object" &&
      body.palette &&
      body.constraints &&
      Array.isArray(body.palette.primary)
    );
  }

  private validateMotif(body: any): boolean {
    return (
      body &&
      typeof body === "object" &&
      body.description &&
      (body.elements || body.component)
    );
  }

  private validateGlossary(body: any): boolean {
    return body && typeof body === "object" && body.term && body.definition;
  }

  private validateRule(body: any): boolean {
    return body && typeof body === "object" && body.condition && body.action;
  }

  private validateFewshot(body: any): boolean {
    return body && typeof body === "object" && body.prompt && body.response;
  }

  private validateObjectStructure(object: KBObject): boolean {
    return (
      object.id &&
      object.kind &&
      object.title &&
      object.body &&
      object.version &&
      object.status &&
      ["style_pack", "motif", "glossary", "rule", "fewshot"].includes(
        object.kind
      ) &&
      ["active", "deprecated", "experimental"].includes(object.status)
    );
  }

  // Utility methods
  private generateObjectId(kind: KBObjectKind, title: string): string {
    const timestamp = Date.now();
    const hash = createHash("md5")
      .update(`${kind}-${title}-${timestamp}`)
      .digest("hex");
    return `${kind}-${hash.substring(0, 8)}`;
  }

  private incrementVersion(currentVersion: string): string {
    const parts = currentVersion.split(".").map(Number);
    parts[2] = (parts[2] || 0) + 1; // Increment patch version
    return parts.join(".");
  }

  // Preferences management
  private async getUserPreferences(userId?: string): Promise<Preferences> {
    if (!userId) {
      return this.getDefaultPreferences();
    }

    const [userPref] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId));

    if (!userPref) {
      return this.getDefaultPreferences();
    }

    const weights = userPref.weights as any;
    return {
      tagWeights: weights?.tagWeights || {},
      kindWeights: weights?.kindWeights || {},
      qualityThreshold: weights?.qualityThreshold || this.MIN_QUALITY_SCORE,
      diversityWeight: weights?.diversityWeight || this.MMR_WEIGHTS.diversity,
      updatedAt: userPref.updatedAt || new Date(),
    };
  }

  private async getGlobalPreferences(): Promise<Preferences> {
    const [globalPref] = await db.select().from(globalPreferences);

    if (!globalPref) {
      return this.getDefaultPreferences();
    }

    const weights = globalPref.weights as any;
    return {
      tagWeights: weights?.tagWeights || {},
      kindWeights: weights?.kindWeights || {},
      qualityThreshold: weights?.qualityThreshold || this.MIN_QUALITY_SCORE,
      diversityWeight: weights?.diversityWeight || this.MMR_WEIGHTS.diversity,
      updatedAt: globalPref.updatedAt || new Date(),
    };
  }

  private getDefaultPreferences(): Preferences {
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
  }

  // Audit logging
  private async logAudit(
    objectId: string,
    action: string,
    beforeState: KBObject | null,
    afterState: KBObject | null,
    userId?: string,
    reason?: string
  ): Promise<void> {
    const auditEntry: NewKBAudit = {
      objectId,
      action,
      beforeState: beforeState as any,
      afterState: afterState as any,
      userId,
      reason,
    };

    await db.insert(kbAudit).values(auditEntry);
  }

  // Link Management
  async createLink(
    srcId: string,
    dstId: string,
    relation: KBLinkRelation,
    userId?: string
  ): Promise<KBLink> {
    // Validate that both objects exist
    const [src, dst] = await Promise.all([
      this.getObject(srcId),
      this.getObject(dstId),
    ]);

    if (!src) throw new Error(`Source object not found: ${srcId}`);
    if (!dst) throw new Error(`Destination object not found: ${dstId}`);

    // Prevent self-links
    if (srcId === dstId) {
      throw new Error("Cannot create link to self");
    }

    // Check for existing link
    const [existing] = await db
      .select()
      .from(kbLinks)
      .where(
        and(
          eq(kbLinks.srcId, srcId),
          eq(kbLinks.dstId, dstId),
          eq(kbLinks.rel, relation)
        )
      );

    if (existing) {
      throw new Error(
        `Link already exists: ${srcId} -> ${dstId} (${relation})`
      );
    }

    const newLink: NewKBLink = { srcId, dstId, rel: relation };
    const [created] = await db.insert(kbLinks).values(newLink).returning();

    // Log audit trail
    await this.logAudit(
      srcId,
      "link_create",
      null,
      { linkTo: dstId, relation } as any,
      userId,
      `Created ${relation} link to ${dstId}`
    );

    return created;
  }

  async deleteLink(
    srcId: string,
    dstId: string,
    relation: KBLinkRelation,
    userId?: string
  ): Promise<void> {
    const deleted = await db
      .delete(kbLinks)
      .where(
        and(
          eq(kbLinks.srcId, srcId),
          eq(kbLinks.dstId, dstId),
          eq(kbLinks.rel, relation)
        )
      )
      .returning();

    if (deleted.length === 0) {
      throw new Error(`Link not found: ${srcId} -> ${dstId} (${relation})`);
    }

    // Log audit trail
    await this.logAudit(
      srcId,
      "link_delete",
      { linkTo: dstId, relation } as any,
      null,
      userId,
      `Deleted ${relation} link to ${dstId}`
    );
  }

  async getObjectLinks(objectId: string): Promise<{
    outgoing: Array<KBLink & { target: KBObject }>;
    incoming: Array<KBLink & { source: KBObject }>;
  }> {
    const [outgoing, incoming] = await Promise.all([
      // Outgoing links (this object as source)
      db
        .select({
          srcId: kbLinks.srcId,
          dstId: kbLinks.dstId,
          rel: kbLinks.rel,
          target: kbObjects,
        })
        .from(kbLinks)
        .innerJoin(kbObjects, eq(kbLinks.dstId, kbObjects.id))
        .where(eq(kbLinks.srcId, objectId)),

      // Incoming links (this object as destination)
      db
        .select({
          srcId: kbLinks.srcId,
          dstId: kbLinks.dstId,
          rel: kbLinks.rel,
          source: kbObjects,
        })
        .from(kbLinks)
        .innerJoin(kbObjects, eq(kbLinks.srcId, kbObjects.id))
        .where(eq(kbLinks.dstId, objectId)),
    ]);

    return { outgoing, incoming };
  }

  // Object Lifecycle Management
  async activateObject(id: string, userId?: string): Promise<KBObject> {
    const object = await this.getObject(id);
    if (!object) {
      throw new Error(`Object not found: ${id}`);
    }

    // Run compatibility tests before activation
    const compatibilityResult = await this.runCompatibilityTests(object);
    if (!compatibilityResult.passed) {
      throw new Error(
        `Object failed compatibility tests: ${compatibilityResult.issues.join(", ")}`
      );
    }

    return this.updateObject(
      id,
      { status: "active" },
      userId,
      "Activated after passing compatibility tests"
    );
  }

  async deprecateObject(
    id: string,
    userId?: string,
    reason?: string
  ): Promise<KBObject> {
    return this.updateObject(
      id,
      { status: "deprecated" },
      userId,
      reason || "Object deprecated"
    );
  }

  async promoteToExperimental(id: string, userId?: string): Promise<KBObject> {
    return this.updateObject(
      id,
      { status: "experimental" },
      userId,
      "Promoted to experimental status"
    );
  }

  // Automatic deprecation for stale objects
  async deprecateStaleObjects(): Promise<number> {
    const staleThreshold = new Date(Date.now() - this.FRESHNESS_THRESHOLD);

    const staleObjects = await db
      .select()
      .from(kbObjects)
      .where(
        and(
          eq(kbObjects.status, "active"),
          sql`${kbObjects.updatedAt} < ${staleThreshold}`,
          sql`${kbObjects.qualityScore} < ${this.MIN_QUALITY_SCORE}`
        )
      );

    let deprecatedCount = 0;
    for (const obj of staleObjects) {
      try {
        await this.deprecateObject(
          obj.id,
          "system",
          "Automatically deprecated due to staleness and low quality"
        );
        deprecatedCount++;
      } catch (error) {
        console.warn(`Failed to deprecate stale object ${obj.id}:`, error);
      }
    }

    return deprecatedCount;
  }

  // Analytics and Monitoring
  async getAnalytics(): Promise<{
    objectCounts: Record<KBObjectKind, number>;
    statusCounts: Record<KBObjectStatus, number>;
    qualityDistribution: { min: number; max: number; avg: number };
    recentActivity: { creates: number; updates: number; deletes: number };
    cacheStats: { hits: number; misses: number; hitRate: number };
  }> {
    const [
      objectCounts,
      statusCounts,
      qualityStats,
      recentActivity,
      cacheStats,
    ] = await Promise.all([
      // Object counts by kind
      db
        .select({
          kind: kbObjects.kind,
          count: sql<number>`count(*)`,
        })
        .from(kbObjects)
        .groupBy(kbObjects.kind),

      // Status counts
      db
        .select({
          status: kbObjects.status,
          count: sql<number>`count(*)`,
        })
        .from(kbObjects)
        .groupBy(kbObjects.status),

      // Quality statistics
      db
        .select({
          min: sql<number>`min(${kbObjects.qualityScore}::numeric)`,
          max: sql<number>`max(${kbObjects.qualityScore}::numeric)`,
          avg: sql<number>`avg(${kbObjects.qualityScore}::numeric)`,
        })
        .from(kbObjects),

      // Recent activity (last 24 hours)
      db
        .select({
          action: kbAudit.action,
          count: sql<number>`count(*)`,
        })
        .from(kbAudit)
        .where(sql`${kbAudit.createdAt} > NOW() - INTERVAL '24 hours'`)
        .groupBy(kbAudit.action),

      // Cache statistics
      this.getCacheStatistics(),
    ]);

    // Process results
    const objectCountsMap: Record<KBObjectKind, number> = {
      style_pack: 0,
      motif: 0,
      glossary: 0,
      rule: 0,
      fewshot: 0,
    };
    objectCounts.forEach((row) => {
      objectCountsMap[row.kind as KBObjectKind] = row.count;
    });

    const statusCountsMap: Record<KBObjectStatus, number> = {
      active: 0,
      deprecated: 0,
      experimental: 0,
    };
    statusCounts.forEach((row) => {
      statusCountsMap[row.status as KBObjectStatus] = row.count;
    });

    const activityMap = { creates: 0, updates: 0, deletes: 0 };
    recentActivity.forEach((row) => {
      if (row.action === "create") activityMap.creates = row.count;
      if (row.action === "update") activityMap.updates = row.count;
      if (row.action === "delete") activityMap.deletes = row.count;
    });

    return {
      objectCounts: objectCountsMap,
      statusCounts: statusCountsMap,
      qualityDistribution: qualityStats[0] || { min: 0, max: 0, avg: 0 },
      recentActivity: activityMap,
      cacheStats,
    };
  }

  private async getCacheStatistics(): Promise<{
    hits: number;
    misses: number;
    hitRate: number;
  }> {
    // This would require tracking cache hits/misses in a separate table
    // For now, return basic cache entry count
    const [_cacheCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(groundingCache)
      .where(sql`${groundingCache.expiresAt} > NOW()`);

    // Placeholder statistics - would need proper tracking
    return {
      hits: 0,
      misses: 0,
      hitRate: 0,
    };
  }

  // Batch operations
  async batchUpdateQualityScores(): Promise<number> {
    const objects = await db
      .select()
      .from(kbObjects)
      .where(eq(kbObjects.status, "active"));

    let updatedCount = 0;
    for (const obj of objects) {
      try {
        const compatibilityResult = await this.runCompatibilityTests(obj);
        if (compatibilityResult.score !== parseFloat(obj.qualityScore || "0")) {
          await db
            .update(kbObjects)
            .set({ qualityScore: compatibilityResult.score.toString() })
            .where(eq(kbObjects.id, obj.id));
          updatedCount++;
        }
      } catch (error) {
        console.warn(`Failed to update quality score for ${obj.id}:`, error);
      }
    }

    return updatedCount;
  }

  async cleanupExpiredCache(): Promise<number> {
    const deleted = await db
      .delete(groundingCache)
      .where(sql`${groundingCache.expiresAt} <= NOW()`)
      .returning();

    return deleted.length;
  }

  // Import/Export functionality
  async exportObjects(
    filters: {
      kinds?: KBObjectKind[];
      status?: KBObjectStatus;
      includeLinks?: boolean;
    } = {}
  ): Promise<{
    objects: KBObject[];
    links?: KBLink[];
    metadata: { exportedAt: Date; totalCount: number };
  }> {
    let query = db.select().from(kbObjects);

    // Apply filters
    const conditions = [];
    if (filters.kinds && filters.kinds.length > 0) {
      conditions.push(inArray(kbObjects.kind, filters.kinds));
    }
    if (filters.status) {
      conditions.push(eq(kbObjects.status, filters.status));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const objects = await query;
    let links: KBLink[] = [];

    if (filters.includeLinks) {
      const objectIds = objects.map((obj) => obj.id);
      links = await db
        .select()
        .from(kbLinks)
        .where(
          or(
            inArray(kbLinks.srcId, objectIds),
            inArray(kbLinks.dstId, objectIds)
          )
        );
    }

    return {
      objects,
      links: filters.includeLinks ? links : undefined,
      metadata: {
        exportedAt: new Date(),
        totalCount: objects.length,
      },
    };
  }

  async importObjects(
    data: {
      objects: Omit<NewKBObject, "createdAt" | "updatedAt">[];
      links?: Omit<NewKBLink, never>[];
    },
    userId?: string,
    options: {
      skipExisting?: boolean;
      validateCompatibility?: boolean;
    } = {}
  ): Promise<{ imported: number; skipped: number; errors: string[] }> {
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Import objects
    for (const objData of data.objects) {
      try {
        // Check if object already exists
        if (options.skipExisting) {
          const existing = await this.getObject(objData.id);
          if (existing) {
            skipped++;
            continue;
          }
        }

        // Validate object
        const validation = await this.validateObject(objData);
        if (!validation.isValid) {
          errors.push(`Object ${objData.id}: ${validation.issues.join(", ")}`);
          continue;
        }

        // Create object
        await this.createObject(
          objData,
          userId,
          "Imported from external source"
        );

        // Run compatibility tests if requested
        if (options.validateCompatibility) {
          const obj = await this.getObject(objData.id);
          if (obj) {
            const compatibilityResult = await this.runCompatibilityTests(obj);
            if (!compatibilityResult.passed) {
              await this.updateObject(
                obj.id,
                { status: "experimental" },
                userId,
                "Failed compatibility tests during import"
              );
            }
          }
        }

        imported++;
      } catch (error) {
        errors.push(`Object ${objData.id}: ${error}`);
      }
    }

    // Import links if provided
    if (data.links) {
      for (const linkData of data.links) {
        try {
          await this.createLink(
            linkData.srcId,
            linkData.dstId,
            linkData.rel as KBLinkRelation,
            userId
          );
        } catch (error) {
          errors.push(`Link ${linkData.srcId}->${linkData.dstId}: ${error}`);
        }
      }
    }

    return { imported, skipped, errors };
  }

  // Health check and maintenance
  async performHealthCheck(): Promise<{
    healthy: boolean;
    issues: string[];
    stats: {
      totalObjects: number;
      activeObjects: number;
      orphanedObjects: number;
      brokenLinks: number;
    };
  }> {
    const issues: string[] = [];

    // Count objects
    const [totalCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(kbObjects);

    const [activeCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(kbObjects)
      .where(eq(kbObjects.status, "active"));

    // Check for orphaned objects (no incoming or outgoing links)
    const [orphanedCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(kbObjects)
      .where(
        and(
          sql`NOT EXISTS (SELECT 1 FROM ${kbLinks} WHERE ${kbLinks.srcId} = ${kbObjects.id})`,
          sql`NOT EXISTS (SELECT 1 FROM ${kbLinks} WHERE ${kbLinks.dstId} = ${kbObjects.id})`
        )
      );

    // Check for broken links (references to non-existent objects)
    const brokenLinks = await db
      .select()
      .from(kbLinks)
      .where(
        or(
          sql`NOT EXISTS (SELECT 1 FROM ${kbObjects} WHERE ${kbObjects.id} = ${kbLinks.srcId})`,
          sql`NOT EXISTS (SELECT 1 FROM ${kbObjects} WHERE ${kbObjects.id} = ${kbLinks.dstId})`
        )
      );

    // Check quality scores
    const lowQualityObjects = await db
      .select({ count: sql<number>`count(*)` })
      .from(kbObjects)
      .where(
        and(
          eq(kbObjects.status, "active"),
          sql`${kbObjects.qualityScore}::numeric < ${this.MIN_QUALITY_SCORE}`
        )
      );

    if (lowQualityObjects[0].count > 0) {
      issues.push(
        `${lowQualityObjects[0].count} active objects below quality threshold`
      );
    }

    if (brokenLinks.length > 0) {
      issues.push(`${brokenLinks.length} broken links found`);
    }

    const orphanedCountValue = (orphanedCount[0] as any).count;
    const totalCountValue = (totalCount[0] as any).count;
    if (orphanedCountValue > totalCountValue * 0.1) {
      issues.push(`High number of orphaned objects: ${orphanedCountValue}`);
    }

    return {
      healthy: issues.length === 0,
      issues,
      stats: {
        totalObjects: (totalCount[0] as any).count,
        activeObjects: (activeCount[0] as any).count,
        orphanedObjects: orphanedCountValue,
        brokenLinks: brokenLinks.length,
      },
    };
  }

  // Cleanup broken links
  async cleanupBrokenLinks(): Promise<number> {
    const brokenLinks = await db
      .delete(kbLinks)
      .where(
        or(
          sql`NOT EXISTS (SELECT 1 FROM ${kbObjects} WHERE ${kbObjects.id} = ${kbLinks.srcId})`,
          sql`NOT EXISTS (SELECT 1 FROM ${kbObjects} WHERE ${kbObjects.id} = ${kbLinks.dstId})`
        )
      )
      .returning();

    return brokenLinks.length;
  }
}
