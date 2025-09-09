import { createHash } from "crypto";
import type { GenerationRequest, GenerationResponse } from "../types";

export interface CacheEntry {
  data: GenerationResponse;
  timestamp: number;
  hits: number;
}

export interface CacheStats {
  totalEntries: number;
  totalHits: number;
  totalMisses: number;
  hitRate: number;
  memoryUsage: number;
}

export class ResponseCache {
  private cache = new Map<string, CacheEntry>();
  private maxSize: number;
  private ttl: number; // Time to live in milliseconds
  private hits = 0;
  private misses = 0;

  constructor(maxSize = 1000, ttlMinutes = 60) {
    this.maxSize = maxSize;
    this.ttl = ttlMinutes * 60 * 1000;

    // Clean up expired entries every 10 minutes
    setInterval(() => this.cleanup(), 10 * 60 * 1000);
  }

  /**
   * Generate a cache key from the request
   */
  private generateKey(request: GenerationRequest): string {
    // Create a deterministic hash from the request
    const normalizedRequest = {
      prompt: request.prompt.trim().toLowerCase(),
      size: request.size,
      palette: request.palette?.sort(), // Sort palette for consistency
      seed: request.seed,
      model: request.model,
    };

    const requestString = JSON.stringify(normalizedRequest);
    return createHash("sha256").update(requestString).digest("hex");
  }

  /**
   * Get cached response if available and not expired
   */
  get(request: GenerationRequest): GenerationResponse | null {
    const key = this.generateKey(request);
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    // Check if entry is expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    // Update hit count and return cached data
    entry.hits++;
    this.hits++;
    return entry.data;
  }

  /**
   * Store response in cache
   */
  set(request: GenerationRequest, response: GenerationResponse): void {
    const key = this.generateKey(request);

    // Don't cache responses with errors
    if (response.errors.length > 0) {
      return;
    }

    // If cache is full, remove least recently used entry
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    const entry: CacheEntry = {
      data: response,
      timestamp: Date.now(),
      hits: 0,
    };

    this.cache.set(key, entry);
  }

  /**
   * Remove expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach((key) => this.cache.delete(key));

    if (expiredKeys.length > 0) {
      console.log(
        `Cache cleanup: removed ${expiredKeys.length} expired entries`
      );
    }
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalRequests = this.hits + this.misses;
    const hitRate = totalRequests > 0 ? (this.hits / totalRequests) * 100 : 0;

    // Estimate memory usage (rough calculation)
    let memoryUsage = 0;
    for (const entry of this.cache.values()) {
      memoryUsage += JSON.stringify(entry).length * 2; // Rough estimate in bytes
    }

    return {
      totalEntries: this.cache.size,
      totalHits: this.hits,
      totalMisses: this.misses,
      hitRate: Math.round(hitRate * 100) / 100,
      memoryUsage,
    };
  }

  /**
   * Get cache entries for debugging
   */
  getEntries(): Array<{ key: string; entry: CacheEntry }> {
    return Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      entry,
    }));
  }

  /**
   * Warm up cache with common requests
   */
  async warmUp(
    commonRequests: GenerationRequest[],
    generator: (req: GenerationRequest) => Promise<GenerationResponse>
  ): Promise<void> {
    console.log(
      `Warming up cache with ${commonRequests.length} common requests...`
    );

    for (const request of commonRequests) {
      try {
        const response = await generator(request);
        this.set(request, response);
      } catch (error) {
        console.warn(`Failed to warm up cache for request:`, request, error);
      }
    }

    console.log(`Cache warm-up complete. ${this.cache.size} entries cached.`);
  }
}
