/**
 * Database connection pooling configuration for optimal performance
 */
import { Pool, PoolConfig } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema.js";

interface DatabasePoolConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
  maxConnections?: number;
  idleTimeoutMs?: number;
  connectionTimeoutMs?: number;
}

class DatabasePool {
  private pool: Pool;
  private db: ReturnType<typeof drizzle>;
  private metrics = {
    totalConnections: 0,
    activeConnections: 0,
    idleConnections: 0,
    waitingClients: 0,
    totalQueries: 0,
    slowQueries: 0,
    errors: 0,
  };

  constructor(config: DatabasePoolConfig) {
    const poolConfig: PoolConfig = {
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      ssl: config.ssl ? { rejectUnauthorized: false } : false,

      // Connection pool settings
      max: config.maxConnections || 20, // Maximum pool size
      min: 2, // Minimum pool size
      idleTimeoutMillis: config.idleTimeoutMs || 30000, // 30 seconds
      connectionTimeoutMillis: config.connectionTimeoutMs || 5000, // 5 seconds

      // Performance optimizations
      allowExitOnIdle: true,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    };

    this.pool = new Pool(poolConfig);
    this.db = drizzle(this.pool, { schema });

    // Set up event listeners for monitoring
    this.setupMonitoring();
  }

  private setupMonitoring() {
    this.pool.on("connect", (client) => {
      this.metrics.totalConnections++;
      this.metrics.activeConnections++;
      console.log(
        `Database connection established. Active: ${this.metrics.activeConnections}`
      );
    });

    this.pool.on("remove", (client) => {
      this.metrics.activeConnections--;
      console.log(
        `Database connection removed. Active: ${this.metrics.activeConnections}`
      );
    });

    this.pool.on("error", (err, client) => {
      this.metrics.errors++;
      console.error("Database pool error:", err);
    });

    // Monitor pool status periodically
    setInterval(() => {
      this.updateMetrics();
    }, 30000); // Every 30 seconds
  }

  private updateMetrics() {
    this.metrics.totalConnections = this.pool.totalCount;
    this.metrics.activeConnections = this.pool.totalCount - this.pool.idleCount;
    this.metrics.idleConnections = this.pool.idleCount;
    this.metrics.waitingClients = this.pool.waitingCount;
  }

  getDatabase() {
    return this.db;
  }

  getPool() {
    return this.pool;
  }

  getMetrics() {
    this.updateMetrics();
    return { ...this.metrics };
  }

  async executeQuery<T>(
    queryFn: (db: typeof this.db) => Promise<T>,
    options: { timeout?: number; logSlow?: boolean } = {}
  ): Promise<T> {
    const startTime = Date.now();
    const timeout = options.timeout || 30000; // 30 second default timeout

    try {
      this.metrics.totalQueries++;

      // Execute query with timeout
      const result = await Promise.race([
        queryFn(this.db),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Query timeout")), timeout)
        ),
      ]);

      const duration = Date.now() - startTime;

      // Log slow queries
      if (options.logSlow !== false && duration > 1000) {
        this.metrics.slowQueries++;
        console.warn(`Slow query detected: ${duration}ms`);
      }

      return result;
    } catch (error) {
      this.metrics.errors++;
      console.error("Query execution error:", error);
      throw error;
    }
  }

  async healthCheck(): Promise<{
    healthy: boolean;
    metrics: typeof this.metrics;
    poolStatus: {
      total: number;
      idle: number;
      waiting: number;
    };
  }> {
    try {
      // Test connection with simple query
      await this.executeQuery(async (db) => db.execute(sql`SELECT 1`), {
        timeout: 5000,
      });

      return {
        healthy: true,
        metrics: this.getMetrics(),
        poolStatus: {
          total: this.pool.totalCount,
          idle: this.pool.idleCount,
          waiting: this.pool.waitingCount,
        },
      };
    } catch (error) {
      return {
        healthy: false,
        metrics: this.getMetrics(),
        poolStatus: {
          total: this.pool.totalCount,
          idle: this.pool.idleCount,
          waiting: this.pool.waitingCount,
        },
      };
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
    console.log("Database pool closed");
  }
}

// Singleton instance
let dbPool: DatabasePool | null = null;

export function createDatabasePool(config: DatabasePoolConfig): DatabasePool {
  if (dbPool) {
    throw new Error("Database pool already initialized");
  }

  dbPool = new DatabasePool(config);
  return dbPool;
}

export function getDatabasePool(): DatabasePool {
  if (!dbPool) {
    throw new Error(
      "Database pool not initialized. Call createDatabasePool first."
    );
  }

  return dbPool;
}

export { DatabasePool };
export type { DatabasePoolConfig };

// SQL import for health check
import { sql } from "drizzle-orm";
