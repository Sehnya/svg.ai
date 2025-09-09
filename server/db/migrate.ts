import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db, initializeDatabase, closeDatabaseConnection } from "./config";

async function runMigrations() {
  try {
    console.log("Starting database migrations...");

    // Initialize database (create extensions, etc.)
    await initializeDatabase();

    // Run migrations
    await migrate(db, { migrationsFolder: "./server/db/migrations" });

    console.log("Database migrations completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await closeDatabaseConnection();
  }
}

runMigrations();
