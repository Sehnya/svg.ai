import {
  pgTable,
  text,
  jsonb,
  timestamp,
  boolean,
  numeric,
  bigserial,
  primaryKey,
  index,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Custom vector type for pgvector (fallback to text if pgvector not available)
const vector = (name: string, dimensions: number) =>
  text(name).$type<number[]>();

// Unified knowledge objects table
export const kbObjects = pgTable(
  "kb_objects",
  {
    id: text("id").primaryKey(),
    kind: text("kind").notNull(),
    title: text("title").notNull(),
    body: jsonb("body").notNull(),
    tags: text("tags")
      .array()
      .default(sql`'{}'`),
    version: text("version").notNull(), // semver
    status: text("status").notNull().default("active"),
    embedding: vector("embedding", 1536), // pgvector for similarity search
    qualityScore: numeric("quality_score").default("0"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    parentId: text("parent_id").references(() => kbObjects.id),
    sourceProvenance: jsonb("source_provenance"),
  },
  (table) => ({
    kindStatusIdx: index("idx_kb_objects_kind_status").on(
      table.kind,
      table.status
    ),
    tagsIdx: index("idx_kb_objects_tags").using("gin", table.tags),
    updatedIdx: index("idx_kb_objects_updated").on(table.updatedAt),
    qualityIdx: index("idx_kb_objects_quality").on(table.qualityScore.desc()),
    embeddingIdx: index("idx_kb_objects_embedding").using(
      "ivfflat",
      table.embedding
    ),
    kindCheck: check(
      "kind_check",
      sql`${table.kind} IN ('style_pack', 'motif', 'glossary', 'rule', 'fewshot')`
    ),
    statusCheck: check(
      "status_check",
      sql`${table.status} IN ('active', 'deprecated', 'experimental')`
    ),
  })
);

// Object relationships table
export const kbLinks = pgTable(
  "kb_links",
  {
    srcId: text("src_id")
      .notNull()
      .references(() => kbObjects.id, { onDelete: "cascade" }),
    dstId: text("dst_id")
      .notNull()
      .references(() => kbObjects.id, { onDelete: "cascade" }),
    rel: text("rel").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.srcId, table.dstId, table.rel] }),
    relCheck: check(
      "rel_check",
      sql`${table.rel} IN ('belongs_to', 'refines', 'contradicts')`
    ),
  })
);

// Generation events for learning
export const genEvents = pgTable(
  "gen_events",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    userId: text("user_id"),
    prompt: text("prompt").notNull(),
    intent: jsonb("intent"),
    plan: jsonb("plan"),
    doc: jsonb("doc"),
    usedObjectIds: text("used_object_ids").array().notNull(),
    modelInfo: jsonb("model_info"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    userTimeIdx: index("idx_gen_events_user_time").on(
      table.userId,
      table.createdAt
    ),
  })
);

// User feedback for preference learning
export const genFeedback = pgTable(
  "gen_feedback",
  {
    eventId: bigserial("event_id", { mode: "number" }).references(
      () => genEvents.id,
      { onDelete: "cascade" }
    ),
    userId: text("user_id"),
    signal: text("signal").notNull(),
    weight: numeric("weight").notNull().default("1.0"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    signalIdx: index("idx_gen_feedback_signal").on(
      table.signal,
      table.createdAt
    ),
    signalCheck: check(
      "signal_check",
      sql`${table.signal} IN ('kept', 'edited', 'regenerated', 'exported', 'favorited', 'reported')`
    ),
  })
);

// Learned user preferences
export const userPreferences = pgTable("user_preferences", {
  userId: text("user_id").primaryKey(),
  weights: jsonb("weights").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Global preferences (aggregated from all users)
export const globalPreferences = pgTable("global_preferences", {
  id: boolean("id").primaryKey().default(true),
  weights: jsonb("weights").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Grounding cache for token optimization
export const groundingCache = pgTable(
  "grounding_cache",
  {
    id: text("id").primaryKey(),
    promptHash: text("prompt_hash").notNull(),
    groundingData: jsonb("grounding_data").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => ({
    hashIdx: index("idx_grounding_cache_hash").on(table.promptHash),
    expiresIdx: index("idx_grounding_cache_expires").on(table.expiresAt),
  })
);

// Audit trail for KB changes
export const kbAudit = pgTable("kb_audit", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  objectId: text("object_id").notNull(),
  action: text("action").notNull(),
  beforeState: jsonb("before_state"),
  afterState: jsonb("after_state"),
  userId: text("user_id"),
  reason: text("reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Type exports for use in application code
export type KBObject = typeof kbObjects.$inferSelect;
export type NewKBObject = typeof kbObjects.$inferInsert;
export type KBLink = typeof kbLinks.$inferSelect;
export type NewKBLink = typeof kbLinks.$inferInsert;
export type GenEvent = typeof genEvents.$inferSelect;
export type NewGenEvent = typeof genEvents.$inferInsert;
export type GenFeedback = typeof genFeedback.$inferSelect;
export type NewGenFeedback = typeof genFeedback.$inferInsert;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type NewUserPreferences = typeof userPreferences.$inferInsert;
export type GlobalPreferences = typeof globalPreferences.$inferSelect;
export type NewGlobalPreferences = typeof globalPreferences.$inferInsert;
export type GroundingCache = typeof groundingCache.$inferSelect;
export type NewGroundingCache = typeof groundingCache.$inferInsert;
export type KBAudit = typeof kbAudit.$inferSelect;
export type NewKBAudit = typeof kbAudit.$inferInsert;
