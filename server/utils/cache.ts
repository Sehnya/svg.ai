import { createHash } from "crypto";
import { db } from "../db/config";
import {
  groundingCache,
  type NewGroundingCache,
  type GroundingCache,
} from "../db/schema";
import { eq, and, sql, lt } from "drizzle-orm";

export interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  totalEntries: number;
  totalSize: number;
  avgTTL: number;
}

export interface CacheConfig {
  enabled: boolean;
  ttlMinutes: number;
  maxEntries: number;
  cleanupIntervalMinutes: number;
}

export class CacheManager {
  private static instance: CacheManager;
  private config: CacheConfig;
  private metrics: CacheMetrics;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      enabled: true,
      ttlMinutes: 10, // 10 minutes default TTL
      maxEntries: 10000,
      cleanupIntervalMinutes: 30,
      ...config,
    };

    this.metrics = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalEntries: 0,
      totalSize: 0,
      avgTTL: 0,
    };

    // Start cleanup timer
    this.startCleanupTimer();

    if (CacheManager.instance) {
      return CacheManager.instance;
    }
    CacheManager.instance = this;
  }

  static getInstance(config?: Partial<CacheConfig>): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager(config);
    }
    return CacheManager.instance;
  }

  /**
   * Generate cache key from prompt and user context
   */
  generateCacheKey(
    prompt: string,
    userId?: string,
    additionalContext?: Record<string, any>
  ): string {
    const context = {
      prompt: prompt.trim().toLowerCase(),
      userId: userId || "anonymous",
      ...additionalContext,
    };

    const content = JSON.stringify(context, Object.keys(context).sort());
    return createHash("sha256").update(content).digest("hex");
  }

  /**
   * Get cached grounding data
   */
  async get<T = any>(key: string): Promise<T | null> {
    if (!this.config.enabled) {
      return null;
    }

    try {
      const [cached] = await db
        .select()
        .from(groundingCache)
        .where(
          and(
            eq(groundingCache.id, key),
            sql`${groundingCache.expiresAt} > NOW()`
          )
        );

      if (cached) {
        this.metrics.hits++;
        this.updateHitRate();
        return cached.groundingData as T;
      } else {
        this.metrics.misses++;
        this.updateHitRate();
        return null;
      }
    } catch (error) {
      console.error("Cache get error:", error);
      this.metrics.misses++;
      this.updateHitRate();
      return null;
    }
  }

  /**
   * Set cached grounding data with TTL
   */
  async set<T = any>(key: string, data: T, ttlMinutes?: number): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    const ttl = ttlMinutes || this.config.ttlMinutes;
    const expiresAt = new Date(Date.now() + ttl * 60 * 1000);

    try {
      const cacheEntry: NewGroundingCache = {
        id: key,
        promptHash: key,
        groundingData: data as any,
        expiresAt,
      };

      await db
        .insert(groundingCache)
        .values(cacheEntry)
        .onConflictDoUpdate({
          target: groundingCache.id,
          set: {
            groundingData: cacheEntry.groundingData,
            expiresAt: cacheEntry.expiresAt,
            createdAt: new Date(),
          },
        });

      await this.updateMetrics();
    } catch (error) {
      console.error("Cache set error:", error);
    }
  }

  /**
   * Delete specific cache entry
   */
  async delete(key: string): Promise<void> {
    try {
      await db.delete(groundingCache).where(eq(groundingCache.id, key));
      await this.updateMetrics();
    } catch (error) {
      console.error("Cache delete error:", error);
    }
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    try {
      await db.delete(groundingCache);
      this.metrics = {
        hits: 0,
        misses: 0,
        hitRate: 0,
        totalEntries: 0,
        totalSize: 0,
        avgTTL: 0,
      };
    } catch (error) {
      console.error("Cache clear error:", error);
    }
  }

  /**
   * Remove expired cache entries
   */
  async cleanup(): Promise<{ deletedCount: number }> {
    try {
      const deleted = await db
        .delete(groundingCache)
        .where(sql`${groundingCache.expiresAt} <= NOW()`)
        .returning({ id: groundingCache.id });

      await this.updateMetrics();

      return { deletedCount: deleted.length };
    } catch (error) {
      console.error("Cache cleanup error:", error);
      return { deletedCount: 0 };
    }
  }

  /**
   * Invalidate cache entries based on pattern or condition
   */
  async invalidate(pattern?: string): Promise<{ deletedCount: number }> {
    try {
      let query = db.delete(groundingCache);

      if (pattern) {
        query = query.where(
          sql`${groundingCache.promptHash} LIKE ${`%${pattern}%`}`
        );
      }

      const deleted = await query.returning({ id: groundingCache.id });
      await this.updateMetrics();

      return { deletedCount: deleted.length };
    } catch (error) {
      console.error("Cache invalidate error:", error);
      return { deletedCount: 0 };
    }
  }

  /**
   * Get cache metrics and statistics
   */
  async getMetrics(): Promise<CacheMetrics> {
    await this.updateMetrics();
    return { ...this.metrics };
  }

  /**
   * Get cache entries for monitoring
   */
  async getEntries(limit: number = 100): Promise<GroundingCache[]> {
    try {
      return await db
        .select()
        .from(groundingCache)
        .orderBy(sql`${groundingCache.createdAt} DESC`)
        .limit(limit);
    } catch (error) {
      console.error("Cache getEntries error:", error);
      return [];
    }
  }

  /**
   * Check if cache is healthy
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    metrics: CacheMetrics;
    issues: string[];
  }> {
    const issues: string[] = [];

    try {
      await this.updateMetrics();

      // Check hit rate
      if (
        this.metrics.hitRate < 0.3 &&
        this.metrics.hits + this.metrics.misses > 100
      ) {
        issues.push("Low cache hit rate (< 30%)");
      }

      // Check cache size
      if (this.metrics.totalEntries > this.config.maxEntries * 0.9) {
        issues.push("Cache approaching maximum capacity");
      }

      // Check for expired entries
      const expiredCount = await this.getExpiredCount();
      if (expiredCount > this.metrics.totalEntries * 0.2) {
        issues.push("High number of expired entries (> 20%)");
      }

      return {
        healthy: issues.length === 0,
        metrics: this.metrics,
        issues,
      };
    } catch (error) {
      issues.push(`Cache health check failed: ${error}`);
      return {
        healthy: false,
        metrics: this.metrics,
        issues,
      };
    }
  }

  /**
   * Update cache configuration
   */
  updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Restart cleanup timer if interval changed
    if (newConfig.cleanupIntervalMinutes) {
      this.stopCleanupTimer();
      this.startCleanupTimer();
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): CacheConfig {
    return { ...this.config };
  }

  // Private methods

  private async updateMetrics(): Promise<void> {
    try {
      const [stats] = await db
        .select({
          count: sql<number>`COUNT(*)`,
          avgSize: sql<number>`AVG(LENGTH(${groundingCache.groundingData}::text))`,
          avgTTL: sql<number>`AVG(EXTRACT(EPOCH FROM (${groundingCache.expiresAt} - ${groundingCache.createdAt})) / 60)`,
        })
        .from(groundingCache);

      this.metrics.totalEntries = stats?.count || 0;
      this.metrics.totalSize = Math.round(stats?.avgSize || 0);
      this.metrics.avgTTL = Math.round(stats?.avgTTL || 0);
    } catch (error) {
      console.error("Error updating cache metrics:", error);
    }
  }

  private updateHitRate(): void {
    const total = this.metrics.hits + this.metrics.misses;
    this.metrics.hitRate = total > 0 ? this.metrics.hits / total : 0;
  }

  private async getExpiredCount(): Promise<number> {
    try {
      const [result] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(groundingCache)
        .where(sql`${groundingCache.expiresAt} <= NOW()`);

      return result?.count || 0;
    } catch (error) {
      console.error("Error getting expired count:", error);
      return 0;
    }
  }

  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(
      () => {
        this.cleanup().catch(console.error);
      },
      this.config.cleanupIntervalMinutes * 60 * 1000
    );
  }

  private stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }

  /**
   * Cleanup on shutdown
   */
  destroy(): void {
    this.stopCleanupTimer();
  }
}

// Export singleton instance
export const cacheManager = CacheManager.getInstance();
