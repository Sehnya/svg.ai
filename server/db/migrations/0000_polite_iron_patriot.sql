CREATE TABLE "gen_events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" text,
	"prompt" text NOT NULL,
	"intent" jsonb,
	"plan" jsonb,
	"doc" jsonb,
	"used_object_ids" text[] NOT NULL,
	"model_info" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "gen_feedback" (
	"event_id" bigserial NOT NULL,
	"user_id" text,
	"signal" text NOT NULL,
	"weight" numeric DEFAULT '1.0' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "signal_check" CHECK ("gen_feedback"."signal" IN ('kept', 'edited', 'regenerated', 'exported', 'favorited', 'reported'))
);
--> statement-breakpoint
CREATE TABLE "global_preferences" (
	"id" boolean PRIMARY KEY DEFAULT true NOT NULL,
	"weights" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "grounding_cache" (
	"id" text PRIMARY KEY NOT NULL,
	"prompt_hash" text NOT NULL,
	"grounding_data" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kb_audit" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"object_id" text NOT NULL,
	"action" text NOT NULL,
	"before_state" jsonb,
	"after_state" jsonb,
	"user_id" text,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "kb_links" (
	"src_id" text NOT NULL,
	"dst_id" text NOT NULL,
	"rel" text NOT NULL,
	CONSTRAINT "kb_links_src_id_dst_id_rel_pk" PRIMARY KEY("src_id","dst_id","rel"),
	CONSTRAINT "rel_check" CHECK ("kb_links"."rel" IN ('belongs_to', 'refines', 'contradicts'))
);
--> statement-breakpoint
CREATE TABLE "kb_objects" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"body" jsonb NOT NULL,
	"tags" text[] DEFAULT '{}',
	"version" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"embedding" text,
	"quality_score" numeric DEFAULT '0',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"parent_id" text,
	"source_provenance" jsonb,
	CONSTRAINT "kind_check" CHECK ("kb_objects"."kind" IN ('style_pack', 'motif', 'glossary', 'rule', 'fewshot')),
	CONSTRAINT "status_check" CHECK ("kb_objects"."status" IN ('active', 'deprecated', 'experimental'))
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"user_id" text PRIMARY KEY NOT NULL,
	"weights" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "gen_feedback" ADD CONSTRAINT "gen_feedback_event_id_gen_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."gen_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kb_links" ADD CONSTRAINT "kb_links_src_id_kb_objects_id_fk" FOREIGN KEY ("src_id") REFERENCES "public"."kb_objects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kb_links" ADD CONSTRAINT "kb_links_dst_id_kb_objects_id_fk" FOREIGN KEY ("dst_id") REFERENCES "public"."kb_objects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kb_objects" ADD CONSTRAINT "kb_objects_parent_id_kb_objects_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."kb_objects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_gen_events_user_time" ON "gen_events" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_gen_feedback_signal" ON "gen_feedback" USING btree ("signal","created_at");--> statement-breakpoint
CREATE INDEX "idx_grounding_cache_hash" ON "grounding_cache" USING btree ("prompt_hash");--> statement-breakpoint
CREATE INDEX "idx_grounding_cache_expires" ON "grounding_cache" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_kb_objects_kind_status" ON "kb_objects" USING btree ("kind","status");--> statement-breakpoint
CREATE INDEX "idx_kb_objects_tags" ON "kb_objects" USING gin ("tags");--> statement-breakpoint
CREATE INDEX "idx_kb_objects_updated" ON "kb_objects" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "idx_kb_objects_quality" ON "kb_objects" USING btree ("quality_score" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_kb_objects_embedding" ON "kb_objects" USING ivfflat ("embedding");