import { createHash } from "crypto";
import { db } from "../db/config";
import {
  groundingCache,
  type NewGroundingCache,
  type GroundingCache,
} from "../db/schema";
import { eq, and, sql, lt } from "drizzle-orm";
import {
  UnifiedLayeredSVGDocument,
  UnifiedGenerationRequest,
  LayoutSpecification,
  RegionName,
  AspectRatio,
} from "../types/unified-layered";
import { cacheManager } from "./cache";

// ============================================================================
// Cache Entry Types
// ============================================================================

export interface RegionCoordinateCache {
  aspectRatio: AspectRatio;
  region: RegionName | string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  pixelBounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  calculatedAt: Date;
}

export interface LayoutSpecificationCache {
  specHash: string;
  specification: LayoutSpecification;
  parsedAt: Date;
  validationResult: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };
}

export interface LayeredJSONCache {
  requestHash: string;
  prompt: string;
  model: string;
  layeredDocument: UnifiedLayeredSVGDocument;
  generatedAt: Date;
  metadata: {
    layerCount: number;
    pathCount: number;
    regionsUsed: string[];
    generationTime: number;
  };
}

export interface UnifiedCacheMetrics {
  regionCache: {
    hits: number;
    misses: number;
    hitRate: number;
    totalEntries: number;
    avgCalculationTime: number;
  };
  layoutCache: {
    hits: number;
    misses: number;
    hitRate: number;
    totalEntries: number;
    avgParseTime: number;
  };
  layeredCache: {
    hits: number;
    misses: number;
    hitRate: number;
    totalEntries: number;
    avgGenerationTime: number;
  };
  overall: {
    totalHits: number;
    totalMisses: number;
    overallHitRate: number;
    cacheSize: number;
    memoryUsage: number;
  };
}

// ============================================================================
// Unified Cache Manager
// ============================================================================

export class UnifiedCacheManager {
  private static instance: UnifiedCacheManager;
  private regionCache = new Map<string, RegionCoordinateCache>();
  private layoutCache = new Map<string, LayoutSpecificationCache>();
  private layeredCache = new Map<string, LayeredJSONCache>();

  private metrics: UnifiedCacheMetrics = {
    regionCache: {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalEntries: 0,
      avgCalculationTime: 0,
    },
    layoutCache: {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalEntries: 0,
      avgParseTime: 0,
    },
    layeredCache: {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalEntries: 0,
      avgGenerationTime: 0,
    },
    overall: {
      totalHits: 0,
      totalMisses: 0,
      overallHitRate: 0,
      cacheSize: 0,
      memoryUsage: 0,
    },
  };

  private maxRegionEntries = 1000;
  private maxLayoutEntries = 5000;
  private maxLayeredEntries = 2000;
  private readonly ttlMinutes = 60; // 1 hour default TTL

  constructor() {
    if (UnifiedCacheManager.instance) {
      return UnifiedCacheManager.instance;
    }
    UnifiedCacheManager.instance = this;

    // Start periodic cleanup
    this.startCleanupTimer();
  }

  static getInstance(): UnifiedCacheManager {
    if (!UnifiedCacheManager.instance) {
      UnifiedCacheManager.instance = new UnifiedCacheManager();
    }
    return UnifiedCacheManager.instance;
  }

  // ============================================================================
  // Region Coordinate Caching
  // ============================================================================

  generateRegionCacheKey(
    aspectRatio: AspectRatio,
    region: RegionName | string
  ): string {
    return `region:${aspectRatio}:${region}`;
  }

  async getRegionCoordinates(
    aspectRatio: AspectRatio,
    region: RegionName | string
  ): Promise<RegionCoordinateCache | null> {
    const key = this.generateRegionCacheKey(aspectRatio, region);
    const cached = this.regionCache.get(key);

    if (cached && this.isEntryValid(cached.calculatedAt)) {
      this.metrics.regionCache.hits++;
      this.updateOverallMetrics();
      return cached;
    }

    this.metrics.regionCache.misses++;
    this.updateOverallMetrics();
    return null;
  }

  async setRegionCoordinates(
    aspectRatio: AspectRatio,
    region: RegionName | string,
    bounds: RegionCoordinateCache["bounds"],
    pixelBounds: RegionCoordinateCache["pixelBounds"],
    calculationTime: number = 0
  ): Promise<void> {
    const key = this.generateRegionCacheKey(aspectRatio, region);

    // Implement LRU eviction if at capacity
    if (this.regionCache.size >= this.maxRegionEntries) {
      const firstKey = this.regionCache.keys().next().value;
      this.regionCache.delete(firstKey);
    }

    const entry: RegionCoordinateCache = {
      aspectRatio,
      region,
      bounds,
      pixelBounds,
      calculatedAt: new Date(Date.now()),
    };

    this.regionCache.set(key, entry);
    this.metrics.regionCache.totalEntries = this.regionCache.size;

    // Update average calculation time
    if (calculationTime > 0) {
      this.metrics.regionCache.avgCalculationTime =
        (this.metrics.regionCache.avgCalculationTime + calculationTime) / 2;
    }
  }

  // ============================================================================
  // Layout Specification Caching
  // ============================================================================

  generateLayoutCacheKey(specification: LayoutSpecification): string {
    const normalized = JSON.stringify(
      specification,
      Object.keys(specification).sort()
    );
    return `layout:${createHash("md5").update(normalized).digest("hex")}`;
  }

  async getLayoutSpecification(
    specification: LayoutSpecification
  ): Promise<LayoutSpecificationCache | null> {
    const key = this.generateLayoutCacheKey(specification);
    const cached = this.layoutCache.get(key);

    if (cached && this.isEntryValid(cached.parsedAt)) {
      this.metrics.layoutCache.hits++;
      this.updateOverallMetrics();
      return cached;
    }

    this.metrics.layoutCache.misses++;
    this.updateOverallMetrics();
    return null;
  }

  async setLayoutSpecification(
    specification: LayoutSpecification,
    validationResult: LayoutSpecificationCache["validationResult"],
    parseTime: number = 0
  ): Promise<void> {
    const key = this.generateLayoutCacheKey(specification);

    // Implement LRU eviction if at capacity
    if (this.layoutCache.size >= this.maxLayoutEntries) {
      const firstKey = this.layoutCache.keys().next().value;
      this.layoutCache.delete(firstKey);
    }

    const entry: LayoutSpecificationCache = {
      specHash: key,
      specification,
      parsedAt: new Date(Date.now()),
      validationResult,
    };

    this.layoutCache.set(key, entry);
    this.metrics.layoutCache.totalEntries = this.layoutCache.size;

    // Update average parse time
    if (parseTime > 0) {
      this.metrics.layoutCache.avgParseTime =
        (this.metrics.layoutCache.avgParseTime + parseTime) / 2;
    }
  }

  // ============================================================================
  // Layered JSON Caching
  // ============================================================================

  generateLayeredCacheKey(request: UnifiedGenerationRequest): string {
    const cacheableRequest = {
      prompt: request.prompt.trim().toLowerCase(),
      aspectRatio: request.aspectRatio || "1:1",
      palette: request.palette || [],
      seed: request.seed,
      model: request.model || "unified",
      layoutHints: request.layoutHints,
    };

    const content = JSON.stringify(
      cacheableRequest,
      Object.keys(cacheableRequest).sort()
    );
    return `layered:${createHash("sha256").update(content).digest("hex")}`;
  }

  async getLayeredJSON(
    request: UnifiedGenerationRequest
  ): Promise<LayeredJSONCache | null> {
    const key = this.generateLayeredCacheKey(request);
    const cached = this.layeredCache.get(key);

    if (cached && this.isEntryValid(cached.generatedAt)) {
      this.metrics.layeredCache.hits++;
      this.updateOverallMetrics();
      return cached;
    }

    // Also try database cache for layered JSON
    try {
      const dbCached = await cacheManager.get<LayeredJSONCache>(key);
      if (dbCached && this.isEntryValid(dbCached.generatedAt)) {
        // Restore to memory cache
        this.layeredCache.set(key, dbCached);
        this.metrics.layeredCache.hits++;
        this.updateOverallMetrics();
        return dbCached;
      }
    } catch (error) {
      console.error(
        "Error retrieving layered JSON from database cache:",
        error
      );
    }

    this.metrics.layeredCache.misses++;
    this.updateOverallMetrics();
    return null;
  }

  async setLayeredJSON(
    request: UnifiedGenerationRequest,
    layeredDocument: UnifiedLayeredSVGDocument,
    generationTime: number = 0
  ): Promise<void> {
    const key = this.generateLayeredCacheKey(request);

    // Calculate metadata
    const layerCount = layeredDocument.layers.length;
    const pathCount = layeredDocument.layers.reduce(
      (sum, layer) => sum + layer.paths.length,
      0
    );
    const regionsUsed = Array.from(
      new Set([
        ...layeredDocument.layers
          .map((layer) => layer.layout?.region)
          .filter(Boolean),
        ...layeredDocument.layers.flatMap((layer) =>
          layer.paths.map((path) => path.layout?.region).filter(Boolean)
        ),
      ])
    ) as string[];

    const entry: LayeredJSONCache = {
      requestHash: key,
      prompt: request.prompt,
      model: request.model || "unified",
      layeredDocument,
      generatedAt: new Date(Date.now()),
      metadata: {
        layerCount,
        pathCount,
        regionsUsed,
        generationTime,
      },
    };

    // Implement LRU eviction if at capacity
    if (this.layeredCache.size >= this.maxLayeredEntries) {
      const firstKey = this.layeredCache.keys().next().value;
      this.layeredCache.delete(firstKey);
    }

    // Store in memory cache
    this.layeredCache.set(key, entry);
    this.metrics.layeredCache.totalEntries = this.layeredCache.size;

    // Also store in database cache for persistence
    try {
      await cacheManager.set(key, entry, this.ttlMinutes);
    } catch (error) {
      console.error("Error storing layered JSON in database cache:", error);
    }

    // Update average generation time
    if (generationTime > 0) {
      this.metrics.layeredCache.avgGenerationTime =
        (this.metrics.layeredCache.avgGenerationTime + generationTime) / 2;
    }
  }

  // ============================================================================
  // Cache Management
  // ============================================================================

  async cleanup(): Promise<{ deletedCount: number }> {
    let deletedCount = 0;
    const now = Date.now();
    const ttlMs = this.ttlMinutes * 60 * 1000;

    // Clean region cache
    for (const [key, entry] of this.regionCache.entries()) {
      if (now - entry.calculatedAt.getTime() > ttlMs) {
        this.regionCache.delete(key);
        deletedCount++;
      }
    }

    // Clean layout cache
    for (const [key, entry] of this.layoutCache.entries()) {
      if (now - entry.parsedAt.getTime() > ttlMs) {
        this.layoutCache.delete(key);
        deletedCount++;
      }
    }

    // Clean layered cache
    for (const [key, entry] of this.layeredCache.entries()) {
      if (now - entry.generatedAt.getTime() > ttlMs) {
        this.layeredCache.delete(key);
        deletedCount++;
      }
    }

    // Update metrics
    this.metrics.regionCache.totalEntries = this.regionCache.size;
    this.metrics.layoutCache.totalEntries = this.layoutCache.size;
    this.metrics.layeredCache.totalEntries = this.layeredCache.size;
    this.updateOverallMetrics();

    // Also cleanup database cache
    try {
      const dbCleanup = await cacheManager.cleanup();
      deletedCount += dbCleanup.deletedCount;
    } catch (error) {
      console.error("Error cleaning up database cache:", error);
    }

    return { deletedCount };
  }

  async clear(): Promise<void> {
    this.regionCache.clear();
    this.layoutCache.clear();
    this.layeredCache.clear();

    // Reset metrics
    this.metrics = {
      regionCache: {
        hits: 0,
        misses: 0,
        hitRate: 0,
        totalEntries: 0,
        avgCalculationTime: 0,
      },
      layoutCache: {
        hits: 0,
        misses: 0,
        hitRate: 0,
        totalEntries: 0,
        avgParseTime: 0,
      },
      layeredCache: {
        hits: 0,
        misses: 0,
        hitRate: 0,
        totalEntries: 0,
        avgGenerationTime: 0,
      },
      overall: {
        totalHits: 0,
        totalMisses: 0,
        overallHitRate: 0,
        cacheSize: 0,
        memoryUsage: 0,
      },
    };

    // Also clear database cache
    try {
      await cacheManager.clear();
    } catch (error) {
      console.error("Error clearing database cache:", error);
    }
  }

  async invalidateByPattern(
    pattern: string
  ): Promise<{ deletedCount: number }> {
    let deletedCount = 0;

    // Invalidate region cache
    for (const [key] of this.regionCache.entries()) {
      if (key.includes(pattern)) {
        this.regionCache.delete(key);
        deletedCount++;
      }
    }

    // Invalidate layout cache
    for (const [key] of this.layoutCache.entries()) {
      if (key.includes(pattern)) {
        this.layoutCache.delete(key);
        deletedCount++;
      }
    }

    // Invalidate layered cache
    for (const [key] of this.layeredCache.entries()) {
      if (key.includes(pattern)) {
        this.layeredCache.delete(key);
        deletedCount++;
      }
    }

    // Update metrics
    this.updateOverallMetrics();

    // Also invalidate database cache
    try {
      const dbInvalidate = await cacheManager.invalidate(pattern);
      deletedCount += dbInvalidate.deletedCount;
    } catch (error) {
      console.error("Error invalidating database cache:", error);
    }

    return { deletedCount };
  }

  getMetrics(): UnifiedCacheMetrics {
    this.updateOverallMetrics();
    return { ...this.metrics };
  }

  // For testing purposes
  setMaxEntries(region: number, layout: number, layered: number): void {
    this.maxRegionEntries = region;
    this.maxLayoutEntries = layout;
    this.maxLayeredEntries = layered;
  }

  async healthCheck(): Promise<{
    healthy: boolean;
    metrics: UnifiedCacheMetrics;
    issues: string[];
  }> {
    const issues: string[] = [];

    try {
      // Check hit rates
      if (
        this.metrics.overall.overallHitRate < 0.3 &&
        this.metrics.overall.totalHits + this.metrics.overall.totalMisses > 100
      ) {
        issues.push("Low overall cache hit rate (< 30%)");
      }

      // Check memory usage
      const memoryUsage = this.calculateMemoryUsage();
      if (memoryUsage > 100 * 1024 * 1024) {
        // 100MB
        issues.push("High memory usage (> 100MB)");
      }

      // Check cache sizes
      if (this.regionCache.size > this.maxRegionEntries * 0.9) {
        issues.push("Region cache approaching capacity");
      }
      if (this.layoutCache.size > this.maxLayoutEntries * 0.9) {
        issues.push("Layout cache approaching capacity");
      }
      if (this.layeredCache.size > this.maxLayeredEntries * 0.9) {
        issues.push("Layered cache approaching capacity");
      }

      // Check database cache health
      const dbHealth = await cacheManager.healthCheck();
      if (!dbHealth.healthy) {
        issues.push(
          ...dbHealth.issues.map((issue) => `Database cache: ${issue}`)
        );
      }

      return {
        healthy: issues.length === 0,
        metrics: this.getMetrics(),
        issues,
      };
    } catch (error) {
      issues.push(`Health check failed: ${error}`);
      return {
        healthy: false,
        metrics: this.getMetrics(),
        issues,
      };
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private isEntryValid(timestamp: Date): boolean {
    const now = Date.now();
    const ttlMs = this.ttlMinutes * 60 * 1000;
    return now - timestamp.getTime() < ttlMs;
  }

  private updateOverallMetrics(): void {
    const totalHits =
      this.metrics.regionCache.hits +
      this.metrics.layoutCache.hits +
      this.metrics.layeredCache.hits;

    const totalMisses =
      this.metrics.regionCache.misses +
      this.metrics.layoutCache.misses +
      this.metrics.layeredCache.misses;

    this.metrics.overall.totalHits = totalHits;
    this.metrics.overall.totalMisses = totalMisses;
    this.metrics.overall.overallHitRate =
      totalHits + totalMisses > 0 ? totalHits / (totalHits + totalMisses) : 0;

    this.metrics.overall.cacheSize =
      this.regionCache.size + this.layoutCache.size + this.layeredCache.size;

    this.metrics.overall.memoryUsage = this.calculateMemoryUsage();

    // Update individual hit rates
    this.metrics.regionCache.hitRate =
      this.metrics.regionCache.hits + this.metrics.regionCache.misses > 0
        ? this.metrics.regionCache.hits /
          (this.metrics.regionCache.hits + this.metrics.regionCache.misses)
        : 0;

    this.metrics.layoutCache.hitRate =
      this.metrics.layoutCache.hits + this.metrics.layoutCache.misses > 0
        ? this.metrics.layoutCache.hits /
          (this.metrics.layoutCache.hits + this.metrics.layoutCache.misses)
        : 0;

    this.metrics.layeredCache.hitRate =
      this.metrics.layeredCache.hits + this.metrics.layeredCache.misses > 0
        ? this.metrics.layeredCache.hits /
          (this.metrics.layeredCache.hits + this.metrics.layeredCache.misses)
        : 0;
  }

  private calculateMemoryUsage(): number {
    let totalSize = 0;

    // Estimate region cache size
    for (const entry of this.regionCache.values()) {
      totalSize += JSON.stringify(entry).length * 2; // Rough estimate
    }

    // Estimate layout cache size
    for (const entry of this.layoutCache.values()) {
      totalSize += JSON.stringify(entry).length * 2;
    }

    // Estimate layered cache size
    for (const entry of this.layeredCache.values()) {
      totalSize += JSON.stringify(entry).length * 2;
    }

    return totalSize;
  }

  private startCleanupTimer(): void {
    // Run cleanup every 30 minutes
    setInterval(
      () => {
        this.cleanup().catch(console.error);
      },
      30 * 60 * 1000
    );
  }
}

// Export singleton instance
export const unifiedCacheManager = UnifiedCacheManager.getInstance();
