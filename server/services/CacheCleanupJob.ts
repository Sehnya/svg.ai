import { cacheManager } from "../utils/cache";
import { KnowledgeBaseManager } from "./KnowledgeBaseManager";

export interface CleanupJobConfig {
  enabled: boolean;
  intervalMinutes: number;
  maxCacheAge: number; // in minutes
  maxCacheEntries: number;
  logResults: boolean;
}

export interface CleanupResult {
  timestamp: Date;
  expiredEntriesRemoved: number;
  totalEntriesBefore: number;
  totalEntriesAfter: number;
  cacheHealthy: boolean;
  issues: string[];
}

export class CacheCleanupJob {
  private static instance: CacheCleanupJob;
  private config: CleanupJobConfig;
  private intervalId?: NodeJS.Timeout;
  private kbManager: KnowledgeBaseManager;
  private lastCleanup?: Date;
  private cleanupHistory: CleanupResult[] = [];

  constructor(config: Partial<CleanupJobConfig> = {}) {
    this.config = {
      enabled: true,
      intervalMinutes: 30, // Run every 30 minutes
      maxCacheAge: 60, // Remove entries older than 1 hour
      maxCacheEntries: 10000,
      logResults: true,
      ...config,
    };

    this.kbManager = KnowledgeBaseManager.getInstance();

    if (CacheCleanupJob.instance) {
      return CacheCleanupJob.instance;
    }
    CacheCleanupJob.instance = this;
  }

  static getInstance(config?: Partial<CleanupJobConfig>): CacheCleanupJob {
    if (!CacheCleanupJob.instance) {
      CacheCleanupJob.instance = new CacheCleanupJob(config);
    }
    return CacheCleanupJob.instance;
  }

  /**
   * Start the cleanup job
   */
  start(): void {
    if (!this.config.enabled) {
      console.log("Cache cleanup job is disabled");
      return;
    }

    if (this.intervalId) {
      console.log("Cache cleanup job is already running");
      return;
    }

    console.log(
      `Starting cache cleanup job (interval: ${this.config.intervalMinutes} minutes)`
    );

    // Run initial cleanup
    this.runCleanup().catch(console.error);

    // Schedule recurring cleanup
    this.intervalId = setInterval(
      () => {
        this.runCleanup().catch(console.error);
      },
      this.config.intervalMinutes * 60 * 1000
    );
  }

  /**
   * Stop the cleanup job
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
      console.log("Cache cleanup job stopped");
    }
  }

  /**
   * Run cleanup manually
   */
  async runCleanup(): Promise<CleanupResult> {
    const timestamp = new Date();

    try {
      // Get metrics before cleanup
      const metricsBefore = await cacheManager.getMetrics();
      const totalEntriesBefore = metricsBefore.totalEntries;

      // Perform cache cleanup
      const cleanupResult = await cacheManager.cleanup();
      const expiredEntriesRemoved = cleanupResult.deletedCount;

      // Get metrics after cleanup
      const metricsAfter = await cacheManager.getMetrics();
      const totalEntriesAfter = metricsAfter.totalEntries;

      // Perform health check
      const healthCheck = await cacheManager.healthCheck();

      const result: CleanupResult = {
        timestamp,
        expiredEntriesRemoved,
        totalEntriesBefore,
        totalEntriesAfter,
        cacheHealthy: healthCheck.healthy,
        issues: healthCheck.issues,
      };

      // Store in history (keep last 100 results)
      this.cleanupHistory.push(result);
      if (this.cleanupHistory.length > 100) {
        this.cleanupHistory = this.cleanupHistory.slice(-100);
      }

      this.lastCleanup = timestamp;

      // Log results if enabled
      if (this.config.logResults) {
        console.log(`Cache cleanup completed:`, {
          expiredRemoved: expiredEntriesRemoved,
          totalBefore: totalEntriesBefore,
          totalAfter: totalEntriesAfter,
          healthy: healthCheck.healthy,
          issues: healthCheck.issues.length,
        });

        if (!healthCheck.healthy) {
          console.warn("Cache health issues detected:", healthCheck.issues);
        }
      }

      // Perform additional cleanup if cache is still too large
      if (totalEntriesAfter > this.config.maxCacheEntries) {
        await this.performAggressiveCleanup();
      }

      return result;
    } catch (error) {
      console.error("Cache cleanup failed:", error);

      const result: CleanupResult = {
        timestamp,
        expiredEntriesRemoved: 0,
        totalEntriesBefore: 0,
        totalEntriesAfter: 0,
        cacheHealthy: false,
        issues: [
          `Cleanup failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        ],
      };

      this.cleanupHistory.push(result);
      return result;
    }
  }

  /**
   * Perform aggressive cleanup when cache is too large
   */
  private async performAggressiveCleanup(): Promise<void> {
    console.log("Performing aggressive cache cleanup due to size limits");

    try {
      // Get current entries
      const entries = await cacheManager.getEntries(
        this.config.maxCacheEntries
      );

      if (entries.length > this.config.maxCacheEntries) {
        // Sort by creation date (oldest first) and remove excess
        const sortedEntries = entries.sort(
          (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
        );

        const entriesToRemove = sortedEntries.slice(
          0,
          entries.length - this.config.maxCacheEntries
        );

        for (const entry of entriesToRemove) {
          await cacheManager.delete(entry.id);
        }

        console.log(
          `Aggressively removed ${entriesToRemove.length} old cache entries`
        );
      }
    } catch (error) {
      console.error("Aggressive cleanup failed:", error);
    }
  }

  /**
   * Get cleanup statistics
   */
  getStats(): {
    config: CleanupJobConfig;
    isRunning: boolean;
    lastCleanup?: Date;
    totalCleanups: number;
    averageEntriesRemoved: number;
    recentIssues: string[];
  } {
    const recentResults = this.cleanupHistory.slice(-10);
    const averageEntriesRemoved =
      recentResults.length > 0
        ? recentResults.reduce((sum, r) => sum + r.expiredEntriesRemoved, 0) /
          recentResults.length
        : 0;

    const recentIssues = recentResults
      .flatMap((r) => r.issues)
      .filter((issue, index, arr) => arr.indexOf(issue) === index) // unique issues
      .slice(-5); // last 5 unique issues

    return {
      config: this.config,
      isRunning: !!this.intervalId,
      lastCleanup: this.lastCleanup,
      totalCleanups: this.cleanupHistory.length,
      averageEntriesRemoved: Math.round(averageEntriesRemoved),
      recentIssues,
    };
  }

  /**
   * Get cleanup history
   */
  getHistory(limit: number = 20): CleanupResult[] {
    return this.cleanupHistory.slice(-limit);
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<CleanupJobConfig>): void {
    const wasRunning = !!this.intervalId;

    // Stop if running
    if (wasRunning) {
      this.stop();
    }

    // Update config
    this.config = { ...this.config, ...newConfig };

    // Restart if it was running and still enabled
    if (wasRunning && this.config.enabled) {
      this.start();
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): CleanupJobConfig {
    return { ...this.config };
  }

  /**
   * Force cleanup now
   */
  async forceCleanup(): Promise<CleanupResult> {
    return await this.runCleanup();
  }

  /**
   * Cleanup on shutdown
   */
  destroy(): void {
    this.stop();
  }
}

// Export singleton instance
export const cacheCleanupJob = CacheCleanupJob.getInstance();
