import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Database configuration
const connectionString =
  process.env.DATABASE_URL || "postgresql://localhost:5432/svg_ai_dev";

// Create the connection
const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

// Create the database instance
export const db = drizzle(client, { schema });

// Health check function
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await client`SELECT 1`;
    return true;
  } catch (error) {
    console.error("Database health check failed:", error);
    return false;
  }
}

// Close database connection
export async function closeDatabaseConnection(): Promise<void> {
  await client.end();
}

// Database initialization
export async function initializeDatabase(): Promise<void> {
  try {
    // Check if pgvector extension is available
    const extensionCheck = await client`
      SELECT EXISTS(
        SELECT 1 FROM pg_available_extensions 
        WHERE name = 'vector'
      ) as has_vector_extension
    `;

    if (!extensionCheck[0]?.has_vector_extension) {
      console.warn(
        "pgvector extension not available. Vector similarity search will be disabled."
      );
    } else {
      // Enable pgvector extension if available
      await client`CREATE EXTENSION IF NOT EXISTS vector`;
      console.log("pgvector extension enabled");
    }

    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Database initialization failed:", error);
    throw error;
  }
}
