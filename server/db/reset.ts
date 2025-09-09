import { db, closeDatabaseConnection } from "./config";
import {
  kbObjects,
  kbLinks,
  genEvents,
  genFeedback,
  userPreferences,
  globalPreferences,
  groundingCache,
  kbAudit,
} from "./schema";

async function resetDatabase() {
  try {
    console.log("Starting database reset...");

    // Drop all tables in correct order (respecting foreign key constraints)
    console.log("Dropping tables...");

    await db.delete(kbAudit);
    await db.delete(groundingCache);
    await db.delete(globalPreferences);
    await db.delete(userPreferences);
    await db.delete(genFeedback);
    await db.delete(genEvents);
    await db.delete(kbLinks);
    await db.delete(kbObjects);

    console.log("Database reset completed successfully!");
    console.log(
      'Run "bun run db:migrate" and "bun run db:seed" to restore the database.'
    );
  } catch (error) {
    console.error("Database reset failed:", error);
    process.exit(1);
  } finally {
    await closeDatabaseConnection();
  }
}

resetDatabase();
