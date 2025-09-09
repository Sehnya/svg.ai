import { eq, and, desc, sql, gte } from "drizzle-orm";
import { db } from "../db/config";
import {
  genEvents,
  genFeedback,
  userPreferences,
  globalPreferences,
  kbObjects,
  type GenEvent,
  type NewGenEvent,
  type GenFeedback,
  type NewGenFeedback,
  type UserPreferences,
  type NewUserPreferences,
  type GlobalPreferences,
  type NewGlobalPreferences,
} from "../db/schema";
import {
  KnowledgeBaseManager,
  type Preferences,
  type KBObjectKind,
} from "./KnowledgeBaseManager";

export type FeedbackSignal =
  | "kept"
  | "edited"
  | "regenerated"
  | "exported"
  | "favorited"
  | "reported";

export interface FeedbackWeights {
  kept: number;
  edited: number;
  regenerated: number;
  exported: number;
  favorited: number;
  reported: number;
}

export interface GenerationEventData {
  userId?: string;
  prompt: string;
  intent?: any;
  plan?: any;
  doc?: any;
  usedObjectIds: string[];
  modelInfo?: any;
}

export interface PreferenceUpdate {
  tagWeights: Record<string, number>;
  kindWeights: Record<KBObjectKind, number>;
  qualityThreshold: number;
  diversityWeight: number;
}

export interface BiasControls {
  maxPreferenceBoost: number;
  diversityMinimum: number;
  qualityFloor: number;
  freshnessWeight: number;
}

export interface LearningMetrics {
  totalEvents: number;
  feedbackRate: number;
  averageQuality: number;
  diversityScore: number;
  biasScore: number;
  preferenceStability: number;
}

export class PreferenceEngine {
  private static instance: PreferenceEngine;
  private kbManager: KnowledgeBaseManager;

  // Feedback signal weights (exported +2, favorited +1.5, kept +1, edited +0.5, regenerated -0.5, reported -3)
  private readonly FEEDBACK_WEIGHTS: FeedbackWeights = {
    exported: 2.0,
    favorited: 1.5,
    kept: 1.0,
    edited: 0.5,
    regenerated: -0.5,
    reported: -3.0,
  };

  // Bias controls
  private readonly BIAS_CONTROLS: BiasControls = {
    maxPreferenceBoost: 1.5,
    diversityMinimum: 0.3,
    qualityFloor: 0.3,
    freshnessWeight: 0.1,
  };

  // Exponential moving average decay factor
  private readonly EMA_DECAY = 0.1;

  // Minimum feedback count for stable preferences
  private readonly MIN_FEEDBACK_COUNT = 10;

  // Preference update frequency (hours)
  private readonly UPDATE_FREQUENCY = 24;

  constructor() {
    if (PreferenceEngine.instance) {
      return PreferenceEngine.instance;
    }
    this.kbManager = KnowledgeBaseManager.getInstance();
    PreferenceEngine.instance = this;
  }

  static getInstance(): PreferenceEngine {
    if (!PreferenceEngine.instance) {
      PreferenceEngine.instance = new PreferenceEngine();
    }
    return PreferenceEngine.instance;
  }

  // Generation Event Logging
  async logGenerationEvent(eventData: GenerationEventData): Promise<number> {
    const newEvent: NewGenEvent = {
      userId: eventData.userId,
      prompt: eventData.prompt,
      intent: eventData.intent,
      plan: eventData.plan,
      doc: eventData.doc,
      usedObjectIds: eventData.usedObjectIds,
      modelInfo: eventData.modelInfo,
    };

    const [created] = await db.insert(genEvents).values(newEvent).returning();
    return created.id;
  }

  async getGenerationEvent(eventId: number): Promise<GenEvent | null> {
    const [event] = await db
      .select()
      .from(genEvents)
      .where(eq(genEvents.id, eventId));

    return event || null;
  }

  // Feedback Collection
  async recordFeedback(
    eventId: number,
    signal: FeedbackSignal,
    userId?: string,
    notes?: string
  ): Promise<void> {
    // Validate event exists
    const event = await this.getGenerationEvent(eventId);
    if (!event) {
      throw new Error(`Generation event not found: ${eventId}`);
    }

    // Check for existing feedback from this user
    const existingFeedback = await db
      .select()
      .from(genFeedback)
      .where(
        and(
          eq(genFeedback.eventId, eventId),
          userId
            ? eq(genFeedback.userId, userId)
            : sql`${genFeedback.userId} IS NULL`
        )
      );

    if (existingFeedback.length > 0) {
      // Update existing feedback
      await db
        .update(genFeedback)
        .set({
          signal,
          weight: this.FEEDBACK_WEIGHTS[signal].toString(),
          notes,
          createdAt: new Date(),
        })
        .where(
          and(
            eq(genFeedback.eventId, eventId),
            userId
              ? eq(genFeedback.userId, userId)
              : sql`${genFeedback.userId} IS NULL`
          )
        );
    } else {
      // Create new feedback
      const newFeedback: NewGenFeedback = {
        eventId,
        userId,
        signal,
        weight: this.FEEDBACK_WEIGHTS[signal].toString(),
        notes,
      };

      await db.insert(genFeedback).values(newFeedback);
    }

    // Trigger preference update for the user
    if (userId) {
      await this.updateUserPreferences(userId);
    }

    // Update global preferences periodically
    await this.updateGlobalPreferencesIfNeeded();
  }

  // Implicit feedback recording (for automatic signals like export, regenerate)
  async recordImplicitFeedback(
    eventId: number,
    signal: "exported" | "regenerated",
    userId?: string
  ): Promise<void> {
    await this.recordFeedback(
      eventId,
      signal,
      userId,
      `Implicit ${signal} signal`
    );
  }

  // Preference Learning and Updates
  async updateUserPreferences(userId: string): Promise<void> {
    // Get recent feedback for this user
    const recentFeedback = await this.getRecentUserFeedback(userId);

    if (recentFeedback.length < this.MIN_FEEDBACK_COUNT) {
      // Not enough feedback for stable preferences
      return;
    }

    // Calculate new preference weights
    const newWeights = await this.calculatePreferenceWeights(recentFeedback);

    // Apply bias controls
    const controlledWeights = this.applyBiasControls(newWeights);

    // Get current preferences for EMA
    const currentPrefs = await this.getUserPreferences(userId);

    // Apply exponential moving average
    const updatedWeights = this.applyExponentialMovingAverage(
      currentPrefs,
      controlledWeights
    );

    // Save updated preferences
    await this.saveUserPreferences(userId, updatedWeights);

    // Log preference update
    console.log(`Updated preferences for user ${userId}:`, {
      tagWeightCount: Object.keys(updatedWeights.tagWeights).length,
      averageTagWeight: this.calculateAverageWeight(updatedWeights.tagWeights),
      qualityThreshold: updatedWeights.qualityThreshold,
    });
  }

  async updateGlobalPreferencesIfNeeded(): Promise<void> {
    // Check if global preferences need updating (every 24 hours)
    const [current] = await db.select().from(globalPreferences);

    if (current) {
      const hoursSinceUpdate =
        (Date.now() - current.updatedAt.getTime()) / (1000 * 60 * 60);
      if (hoursSinceUpdate < this.UPDATE_FREQUENCY) {
        return;
      }
    }

    await this.updateGlobalPreferences();
  }

  async updateGlobalPreferences(): Promise<void> {
    // Aggregate feedback from all users
    const allFeedback = await this.getRecentGlobalFeedback();

    if (allFeedback.length === 0) {
      return;
    }

    // Calculate global preference weights
    const globalWeights =
      await this.calculateGlobalPreferenceWeights(allFeedback);

    // Apply bias controls
    const controlledWeights = this.applyBiasControls(globalWeights);

    // Save global preferences
    await this.saveGlobalPreferences(controlledWeights);

    console.log("Updated global preferences:", {
      tagWeightCount: Object.keys(controlledWeights.tagWeights).length,
      averageTagWeight: this.calculateAverageWeight(
        controlledWeights.tagWeights
      ),
      qualityThreshold: controlledWeights.qualityThreshold,
    });
  }

  // Preference Calculation
  private async calculatePreferenceWeights(
    feedback: Array<GenFeedback & { event: GenEvent; objects: any[] }>
  ): Promise<PreferenceUpdate> {
    const tagWeights: Record<string, number> = {};
    const kindWeights: Record<KBObjectKind, number> = {
      style_pack: 0,
      motif: 0,
      glossary: 0,
      rule: 0,
      fewshot: 0,
    };

    let totalWeight = 0;
    let qualitySum = 0;
    let qualityCount = 0;

    for (const fb of feedback) {
      const weight = parseFloat(fb.weight);
      totalWeight += Math.abs(weight);

      // Process each object used in the generation
      for (const obj of fb.objects) {
        // Update tag weights
        if (obj.tags) {
          for (const tag of obj.tags) {
            tagWeights[tag] = (tagWeights[tag] || 0) + weight;
          }
        }

        // Update kind weights
        kindWeights[obj.kind as KBObjectKind] += weight;

        // Track quality for threshold calculation
        const quality = parseFloat(obj.qualityScore || "0");
        if (quality > 0) {
          qualitySum += quality * Math.abs(weight);
          qualityCount += Math.abs(weight);
        }
      }
    }

    // Normalize weights
    if (totalWeight > 0) {
      Object.keys(tagWeights).forEach((tag) => {
        tagWeights[tag] /= totalWeight;
      });

      Object.keys(kindWeights).forEach((kind) => {
        kindWeights[kind as KBObjectKind] /= totalWeight;
      });
    }

    // Calculate quality threshold (weighted average of used object qualities)
    const qualityThreshold =
      qualityCount > 0
        ? qualitySum / qualityCount
        : this.BIAS_CONTROLS.qualityFloor;

    return {
      tagWeights,
      kindWeights,
      qualityThreshold: Math.max(
        qualityThreshold,
        this.BIAS_CONTROLS.qualityFloor
      ),
      diversityWeight: this.BIAS_CONTROLS.diversityMinimum,
    };
  }

  private async calculateGlobalPreferenceWeights(
    feedback: Array<GenFeedback & { event: GenEvent; objects: any[] }>
  ): Promise<PreferenceUpdate> {
    // Similar to user preferences but aggregated across all users
    return this.calculatePreferenceWeights(feedback);
  }

  // Bias Controls
  private applyBiasControls(weights: PreferenceUpdate): PreferenceUpdate {
    const controlled = { ...weights };

    // Cap tag weights to prevent echo chambers
    Object.keys(controlled.tagWeights).forEach((tag) => {
      controlled.tagWeights[tag] = Math.min(
        controlled.tagWeights[tag],
        this.BIAS_CONTROLS.maxPreferenceBoost
      );
    });

    // Cap kind weights
    Object.keys(controlled.kindWeights).forEach((kind) => {
      controlled.kindWeights[kind as KBObjectKind] = Math.min(
        controlled.kindWeights[kind as KBObjectKind],
        this.BIAS_CONTROLS.maxPreferenceBoost
      );
    });

    // Ensure minimum diversity
    controlled.diversityWeight = Math.max(
      controlled.diversityWeight,
      this.BIAS_CONTROLS.diversityMinimum
    );

    // Ensure quality floor
    controlled.qualityThreshold = Math.max(
      controlled.qualityThreshold,
      this.BIAS_CONTROLS.qualityFloor
    );

    return controlled;
  }

  private applyExponentialMovingAverage(
    current: Preferences,
    update: PreferenceUpdate
  ): PreferenceUpdate {
    const result: PreferenceUpdate = {
      tagWeights: {},
      kindWeights: { ...update.kindWeights },
      qualityThreshold: update.qualityThreshold,
      diversityWeight: update.diversityWeight,
    };

    // Apply EMA to tag weights
    const allTags = new Set([
      ...Object.keys(current.tagWeights),
      ...Object.keys(update.tagWeights),
    ]);

    for (const tag of allTags) {
      const currentWeight = current.tagWeights[tag] || 0;
      const updateWeight = update.tagWeights[tag] || 0;
      result.tagWeights[tag] =
        (1 - this.EMA_DECAY) * currentWeight + this.EMA_DECAY * updateWeight;
    }

    // Apply EMA to kind weights
    Object.keys(result.kindWeights).forEach((kind) => {
      const currentWeight = current.kindWeights[kind as KBObjectKind] || 0;
      const updateWeight = update.kindWeights[kind as KBObjectKind];
      result.kindWeights[kind as KBObjectKind] =
        (1 - this.EMA_DECAY) * currentWeight + this.EMA_DECAY * updateWeight;
    });

    // Apply EMA to other metrics
    result.qualityThreshold =
      (1 - this.EMA_DECAY) * current.qualityThreshold +
      this.EMA_DECAY * update.qualityThreshold;

    result.diversityWeight =
      (1 - this.EMA_DECAY) * current.diversityWeight +
      this.EMA_DECAY * update.diversityWeight;

    return result;
  }

  // Data Retrieval
  private async getRecentUserFeedback(
    userId: string,
    days: number = 30
  ): Promise<Array<GenFeedback & { event: GenEvent; objects: any[] }>> {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const feedback = await db
      .select({
        feedback: genFeedback,
        event: genEvents,
      })
      .from(genFeedback)
      .innerJoin(genEvents, eq(genFeedback.eventId, genEvents.id))
      .where(
        and(
          eq(genFeedback.userId, userId),
          gte(genFeedback.createdAt, cutoffDate)
        )
      )
      .orderBy(desc(genFeedback.createdAt));

    // Enrich with object data
    const enriched = [];
    for (const row of feedback) {
      const objects = await db
        .select()
        .from(kbObjects)
        .where(sql`${kbObjects.id} = ANY(${row.event.usedObjectIds})`);

      enriched.push({
        ...row.feedback,
        event: row.event,
        objects,
      });
    }

    return enriched;
  }

  private async getRecentGlobalFeedback(
    days: number = 7
  ): Promise<Array<GenFeedback & { event: GenEvent; objects: any[] }>> {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const feedback = await db
      .select({
        feedback: genFeedback,
        event: genEvents,
      })
      .from(genFeedback)
      .innerJoin(genEvents, eq(genFeedback.eventId, genEvents.id))
      .where(gte(genFeedback.createdAt, cutoffDate))
      .orderBy(desc(genFeedback.createdAt));

    // Enrich with object data
    const enriched = [];
    for (const row of feedback) {
      const objects = await db
        .select()
        .from(kbObjects)
        .where(sql`${kbObjects.id} = ANY(${row.event.usedObjectIds})`);

      enriched.push({
        ...row.feedback,
        event: row.event,
        objects,
      });
    }

    return enriched;
  }

  private async getUserPreferences(userId: string): Promise<Preferences> {
    const [userPref] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId));

    if (!userPref) {
      return this.getDefaultPreferences();
    }

    return {
      tagWeights: userPref.weights.tagWeights || {},
      kindWeights: userPref.weights.kindWeights || this.getDefaultKindWeights(),
      qualityThreshold:
        userPref.weights.qualityThreshold || this.BIAS_CONTROLS.qualityFloor,
      diversityWeight:
        userPref.weights.diversityWeight || this.BIAS_CONTROLS.diversityMinimum,
      updatedAt: userPref.updatedAt || new Date(),
    };
  }

  private getDefaultPreferences(): Preferences {
    return {
      tagWeights: {},
      kindWeights: this.getDefaultKindWeights(),
      qualityThreshold: this.BIAS_CONTROLS.qualityFloor,
      diversityWeight: this.BIAS_CONTROLS.diversityMinimum,
      updatedAt: new Date(),
    };
  }

  private getDefaultKindWeights(): Record<KBObjectKind, number> {
    return {
      style_pack: 1.0,
      motif: 1.0,
      glossary: 0.8,
      rule: 0.6,
      fewshot: 0.9,
    };
  }

  // Preference Persistence
  private async saveUserPreferences(
    userId: string,
    weights: PreferenceUpdate
  ): Promise<void> {
    const preferencesData: NewUserPreferences = {
      userId,
      weights: weights as any,
    };

    await db
      .insert(userPreferences)
      .values(preferencesData)
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: {
          weights: preferencesData.weights,
          updatedAt: new Date(),
        },
      });
  }

  private async saveGlobalPreferences(
    weights: PreferenceUpdate
  ): Promise<void> {
    const preferencesData: NewGlobalPreferences = {
      id: true,
      weights: weights as any,
    };

    await db
      .insert(globalPreferences)
      .values(preferencesData)
      .onConflictDoUpdate({
        target: globalPreferences.id,
        set: {
          weights: preferencesData.weights,
          updatedAt: new Date(),
        },
      });
  }

  // Analytics and Monitoring
  async getLearningMetrics(userId?: string): Promise<LearningMetrics> {
    const [totalEvents, feedbackStats, qualityStats] = await Promise.all([
      // Total generation events
      db
        .select({ count: sql<number>`count(*)` })
        .from(genEvents)
        .where(userId ? eq(genEvents.userId, userId) : undefined),

      // Feedback statistics
      db
        .select({
          totalFeedback: sql<number>`count(*)`,
          positiveFeedback: sql<number>`count(*) FILTER (WHERE ${genFeedback.weight}::numeric > 0)`,
        })
        .from(genFeedback)
        .where(userId ? eq(genFeedback.userId, userId) : undefined),

      // Quality statistics from used objects
      this.getQualityMetrics(userId),
    ]);

    const feedbackRate =
      totalEvents[0].count > 0
        ? feedbackStats[0].totalFeedback / totalEvents[0].count
        : 0;

    const diversityScore = await this.calculateDiversityScore(userId);
    const biasScore = await this.calculateBiasScore(userId);
    const preferenceStability = await this.calculatePreferenceStability(userId);

    return {
      totalEvents: totalEvents[0].count,
      feedbackRate,
      averageQuality: qualityStats.averageQuality,
      diversityScore,
      biasScore,
      preferenceStability,
    };
  }

  private async getQualityMetrics(
    userId?: string
  ): Promise<{ averageQuality: number }> {
    // Get average quality of objects used in recent generations
    const query = db
      .select({
        avgQuality: sql<number>`avg(${kbObjects.qualityScore}::numeric)`,
      })
      .from(genEvents)
      .innerJoin(
        kbObjects,
        sql`${kbObjects.id} = ANY(${genEvents.usedObjectIds})`
      )
      .where(
        and(
          userId ? eq(genEvents.userId, userId) : undefined,
          gte(
            genEvents.createdAt,
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          )
        )
      );

    const [result] = await query;
    return { averageQuality: result?.avgQuality || 0 };
  }

  private async calculateDiversityScore(userId?: string): Promise<number> {
    // Calculate diversity based on variety of objects used
    const recentEvents = await db
      .select({ usedObjectIds: genEvents.usedObjectIds })
      .from(genEvents)
      .where(
        and(
          userId ? eq(genEvents.userId, userId) : undefined,
          gte(
            genEvents.createdAt,
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          )
        )
      );

    if (recentEvents.length === 0) return 1.0;

    const allUsedIds = new Set<string>();
    recentEvents.forEach((event) => {
      event.usedObjectIds.forEach((id) => allUsedIds.add(id));
    });

    const totalObjects = await db
      .select({ count: sql<number>`count(*)` })
      .from(kbObjects)
      .where(eq(kbObjects.status, "active"));

    return Math.min(
      1.0,
      allUsedIds.size / Math.max(1, totalObjects[0].count * 0.1)
    );
  }

  private async calculateBiasScore(userId?: string): Promise<number> {
    // Calculate bias score based on preference concentration
    const preferences = userId
      ? await this.getUserPreferences(userId)
      : await this.getGlobalPreferences();

    const tagWeights = Object.values(preferences.tagWeights);
    if (tagWeights.length === 0) return 0;

    // Calculate coefficient of variation (higher = more biased)
    const mean = tagWeights.reduce((a, b) => a + b, 0) / tagWeights.length;
    const variance =
      tagWeights.reduce((acc, weight) => acc + Math.pow(weight - mean, 2), 0) /
      tagWeights.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = mean > 0 ? stdDev / mean : 0;

    // Convert to bias score (0 = no bias, 1 = high bias)
    return Math.min(1.0, coefficientOfVariation);
  }

  private async calculatePreferenceStability(userId?: string): Promise<number> {
    // Calculate how stable preferences are over time
    if (!userId) return 1.0; // Global preferences are considered stable

    const [current] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId));

    if (!current) return 0;

    // Simple stability measure based on update frequency
    const daysSinceUpdate =
      (Date.now() - current.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
    return Math.min(1.0, daysSinceUpdate / 30); // More stable if updated less frequently
  }

  private async getGlobalPreferences(): Promise<Preferences> {
    const [globalPref] = await db.select().from(globalPreferences);

    if (!globalPref) {
      return this.getDefaultPreferences();
    }

    return {
      tagWeights: globalPref.weights.tagWeights || {},
      kindWeights:
        globalPref.weights.kindWeights || this.getDefaultKindWeights(),
      qualityThreshold:
        globalPref.weights.qualityThreshold || this.BIAS_CONTROLS.qualityFloor,
      diversityWeight:
        globalPref.weights.diversityWeight ||
        this.BIAS_CONTROLS.diversityMinimum,
      updatedAt: globalPref.updatedAt || new Date(),
    };
  }

  // Utility methods
  private calculateAverageWeight(weights: Record<string, number>): number {
    const values = Object.values(weights);
    return values.length > 0
      ? values.reduce((a, b) => a + b, 0) / values.length
      : 0;
  }

  // Automatic object deprecation
  async deprecateStaleObjects(): Promise<number> {
    // Find objects with consistently negative feedback
    const negativeObjects = await db
      .select({
        objectId: sql<string>`unnest(${genEvents.usedObjectIds})`,
        avgFeedback: sql<number>`avg(${genFeedback.weight}::numeric)`,
        feedbackCount: sql<number>`count(*)`,
      })
      .from(genEvents)
      .innerJoin(genFeedback, eq(genEvents.id, genFeedback.eventId))
      .where(
        gte(
          genFeedback.createdAt,
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        )
      )
      .groupBy(sql`unnest(${genEvents.usedObjectIds})`)
      .having(
        and(sql`avg(${genFeedback.weight}::numeric) < -0.5`, sql`count(*) >= 5`)
      );

    let deprecatedCount = 0;
    for (const obj of negativeObjects) {
      try {
        await this.kbManager.deprecateObject(
          obj.objectId,
          "system",
          `Automatically deprecated due to negative feedback (avg: ${obj.avgFeedback.toFixed(2)})`
        );
        deprecatedCount++;
      } catch (error) {
        console.warn(`Failed to deprecate object ${obj.objectId}:`, error);
      }
    }

    return deprecatedCount;
  }

  // Cleanup old events and feedback
  async cleanupOldData(
    retentionDays: number = 90
  ): Promise<{ events: number; feedback: number }> {
    const cutoffDate = new Date(
      Date.now() - retentionDays * 24 * 60 * 60 * 1000
    );

    const [deletedEvents, deletedFeedback] = await Promise.all([
      db
        .delete(genEvents)
        .where(sql`${genEvents.createdAt} < ${cutoffDate}`)
        .returning(),

      db
        .delete(genFeedback)
        .where(sql`${genFeedback.createdAt} < ${cutoffDate}`)
        .returning(),
    ]);

    return {
      events: deletedEvents.length,
      feedback: deletedFeedback.length,
    };
  }
}
