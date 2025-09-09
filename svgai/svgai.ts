import { api } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";

// Create the database
export const db = new SQLDatabase("svgai", {
  migrations: "./migrations",
});

// API to get knowledge base objects
export const getKBObjects = api(
  { expose: true, method: "GET", path: "/kb/objects" },
  async (): Promise<{ objects: any[] }> => {
    const objects = await db.queryAll`
      SELECT id, kind, title, tags, status, created_at, updated_at
      FROM kb_objects 
      WHERE status = 'active'
      ORDER BY updated_at DESC
      LIMIT 50
    `;

    return { objects };
  }
);

// API to get generation events
export const getGenEvents = api(
  { expose: true, method: "GET", path: "/gen/events" },
  async (): Promise<{ events: any[] }> => {
    const events = await db.queryAll`
      SELECT id, user_id, prompt, created_at
      FROM gen_events 
      ORDER BY created_at DESC
      LIMIT 20
    `;

    return { events };
  }
);

// API to get database stats
export const getStats = api(
  { expose: true, method: "GET", path: "/stats" },
  async (): Promise<{ stats: any }> => {
    const [kbCount, eventsCount, feedbackCount] = await Promise.all([
      db.queryRow`SELECT COUNT(*) as count FROM kb_objects WHERE status = 'active'`,
      db.queryRow`SELECT COUNT(*) as count FROM gen_events`,
      db.queryRow`SELECT COUNT(*) as count FROM gen_feedback`,
    ]);

    return {
      stats: {
        activeKBObjects: kbCount?.count || 0,
        totalEvents: eventsCount?.count || 0,
        totalFeedback: feedbackCount?.count || 0,
      },
    };
  }
);
