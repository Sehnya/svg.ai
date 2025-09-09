"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.kbAudit = exports.groundingCache = exports.globalPreferences = exports.userPreferences = exports.genFeedback = exports.genEvents = exports.kbLinks = exports.kbObjects = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
var drizzle_orm_1 = require("drizzle-orm");
// Custom vector type for pgvector (fallback to text if pgvector not available)
var vector = function (name, dimensions) {
    return (0, pg_core_1.text)(name).$type();
};
// Unified knowledge objects table
exports.kbObjects = (0, pg_core_1.pgTable)("kb_objects", {
    id: (0, pg_core_1.text)("id").primaryKey(),
    kind: (0, pg_core_1.text)("kind").notNull(),
    title: (0, pg_core_1.text)("title").notNull(),
    body: (0, pg_core_1.jsonb)("body").notNull(),
    tags: (0, pg_core_1.text)("tags")
        .array()
        .default((0, drizzle_orm_1.sql)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["'{}'"], ["'{}'"])))),
    version: (0, pg_core_1.text)("version").notNull(), // semver
    status: (0, pg_core_1.text)("status").notNull().default("active"),
    embedding: vector("embedding", 1536), // pgvector for similarity search
    qualityScore: (0, pg_core_1.numeric)("quality_score").default("0"),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { withTimezone: true }).defaultNow(),
    parentId: (0, pg_core_1.text)("parent_id").references(function () { return exports.kbObjects.id; }),
    sourceProvenance: (0, pg_core_1.jsonb)("source_provenance"),
}, function (table) { return ({
    kindStatusIdx: (0, pg_core_1.index)("idx_kb_objects_kind_status").on(table.kind, table.status),
    tagsIdx: (0, pg_core_1.index)("idx_kb_objects_tags").using("gin", table.tags),
    updatedIdx: (0, pg_core_1.index)("idx_kb_objects_updated").on(table.updatedAt),
    qualityIdx: (0, pg_core_1.index)("idx_kb_objects_quality").on(table.qualityScore.desc()),
    embeddingIdx: (0, pg_core_1.index)("idx_kb_objects_embedding").using("ivfflat", table.embedding),
    kindCheck: (0, pg_core_1.check)("kind_check", (0, drizzle_orm_1.sql)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["", " IN ('style_pack', 'motif', 'glossary', 'rule', 'fewshot')"], ["", " IN ('style_pack', 'motif', 'glossary', 'rule', 'fewshot')"])), table.kind)),
    statusCheck: (0, pg_core_1.check)("status_check", (0, drizzle_orm_1.sql)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["", " IN ('active', 'deprecated', 'experimental')"], ["", " IN ('active', 'deprecated', 'experimental')"])), table.status)),
}); });
// Object relationships table
exports.kbLinks = (0, pg_core_1.pgTable)("kb_links", {
    srcId: (0, pg_core_1.text)("src_id")
        .notNull()
        .references(function () { return exports.kbObjects.id; }, { onDelete: "cascade" }),
    dstId: (0, pg_core_1.text)("dst_id")
        .notNull()
        .references(function () { return exports.kbObjects.id; }, { onDelete: "cascade" }),
    rel: (0, pg_core_1.text)("rel").notNull(),
}, function (table) { return ({
    pk: (0, pg_core_1.primaryKey)({ columns: [table.srcId, table.dstId, table.rel] }),
    relCheck: (0, pg_core_1.check)("rel_check", (0, drizzle_orm_1.sql)(templateObject_4 || (templateObject_4 = __makeTemplateObject(["", " IN ('belongs_to', 'refines', 'contradicts')"], ["", " IN ('belongs_to', 'refines', 'contradicts')"])), table.rel)),
}); });
// Generation events for learning
exports.genEvents = (0, pg_core_1.pgTable)("gen_events", {
    id: (0, pg_core_1.bigserial)("id", { mode: "number" }).primaryKey(),
    userId: (0, pg_core_1.text)("user_id"),
    prompt: (0, pg_core_1.text)("prompt").notNull(),
    intent: (0, pg_core_1.jsonb)("intent"),
    plan: (0, pg_core_1.jsonb)("plan"),
    doc: (0, pg_core_1.jsonb)("doc"),
    usedObjectIds: (0, pg_core_1.text)("used_object_ids").array().notNull(),
    modelInfo: (0, pg_core_1.jsonb)("model_info"),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow(),
}, function (table) { return ({
    userTimeIdx: (0, pg_core_1.index)("idx_gen_events_user_time").on(table.userId, table.createdAt),
}); });
// User feedback for preference learning
exports.genFeedback = (0, pg_core_1.pgTable)("gen_feedback", {
    eventId: (0, pg_core_1.bigserial)("event_id", { mode: "number" }).references(function () { return exports.genEvents.id; }, { onDelete: "cascade" }),
    userId: (0, pg_core_1.text)("user_id"),
    signal: (0, pg_core_1.text)("signal").notNull(),
    weight: (0, pg_core_1.numeric)("weight").notNull().default("1.0"),
    notes: (0, pg_core_1.text)("notes"),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow(),
}, function (table) { return ({
    signalIdx: (0, pg_core_1.index)("idx_gen_feedback_signal").on(table.signal, table.createdAt),
    signalCheck: (0, pg_core_1.check)("signal_check", (0, drizzle_orm_1.sql)(templateObject_5 || (templateObject_5 = __makeTemplateObject(["", " IN ('kept', 'edited', 'regenerated', 'exported', 'favorited', 'reported')"], ["", " IN ('kept', 'edited', 'regenerated', 'exported', 'favorited', 'reported')"])), table.signal)),
}); });
// Learned user preferences
exports.userPreferences = (0, pg_core_1.pgTable)("user_preferences", {
    userId: (0, pg_core_1.text)("user_id").primaryKey(),
    weights: (0, pg_core_1.jsonb)("weights").notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { withTimezone: true }).defaultNow(),
});
// Global preferences (aggregated from all users)
exports.globalPreferences = (0, pg_core_1.pgTable)("global_preferences", {
    id: (0, pg_core_1.boolean)("id").primaryKey().default(true),
    weights: (0, pg_core_1.jsonb)("weights").notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { withTimezone: true }).defaultNow(),
});
// Grounding cache for token optimization
exports.groundingCache = (0, pg_core_1.pgTable)("grounding_cache", {
    id: (0, pg_core_1.text)("id").primaryKey(),
    promptHash: (0, pg_core_1.text)("prompt_hash").notNull(),
    groundingData: (0, pg_core_1.jsonb)("grounding_data").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow(),
    expiresAt: (0, pg_core_1.timestamp)("expires_at", { withTimezone: true }).notNull(),
}, function (table) { return ({
    hashIdx: (0, pg_core_1.index)("idx_grounding_cache_hash").on(table.promptHash),
    expiresIdx: (0, pg_core_1.index)("idx_grounding_cache_expires").on(table.expiresAt),
}); });
// Audit trail for KB changes
exports.kbAudit = (0, pg_core_1.pgTable)("kb_audit", {
    id: (0, pg_core_1.bigserial)("id", { mode: "number" }).primaryKey(),
    objectId: (0, pg_core_1.text)("object_id").notNull(),
    action: (0, pg_core_1.text)("action").notNull(),
    beforeState: (0, pg_core_1.jsonb)("before_state"),
    afterState: (0, pg_core_1.jsonb)("after_state"),
    userId: (0, pg_core_1.text)("user_id"),
    reason: (0, pg_core_1.text)("reason"),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow(),
});
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5;
