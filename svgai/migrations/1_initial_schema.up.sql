-- Enable extensions
CREATE EXTENSION IF NOT EXISTS vector;

-- Unified knowledge objects table
CREATE TABLE kb_objects (
    id TEXT PRIMARY KEY,
    kind TEXT NOT NULL CHECK (kind IN ('style_pack', 'motif', 'glossary', 'rule', 'fewshot')),
    title TEXT NOT NULL,
    body JSONB NOT NULL,
    tags TEXT[] DEFAULT '{}',
    version TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deprecated', 'experimental')),
    embedding vector(1536), -- Using pgvector extension
    quality_score NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    parent_id TEXT REFERENCES kb_objects(id),
    source_provenance JSONB
);

-- Create indexes
CREATE INDEX idx_kb_objects_kind_status ON kb_objects(kind, status);
CREATE INDEX idx_kb_objects_tags ON kb_objects USING GIN(tags);
CREATE INDEX idx_kb_objects_updated ON kb_objects(updated_at);
CREATE INDEX idx_kb_objects_quality ON kb_objects(quality_score DESC);
CREATE INDEX idx_kb_objects_embedding ON kb_objects USING ivfflat(embedding vector_cosine_ops);

-- Object relationships table
CREATE TABLE kb_links (
    src_id TEXT NOT NULL REFERENCES kb_objects(id) ON DELETE CASCADE,
    dst_id TEXT NOT NULL REFERENCES kb_objects(id) ON DELETE CASCADE,
    rel TEXT NOT NULL CHECK (rel IN ('belongs_to', 'refines', 'contradicts')),
    PRIMARY KEY (src_id, dst_id, rel)
);

-- Generation events for learning
CREATE TABLE gen_events (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT,
    prompt TEXT NOT NULL,
    intent JSONB,
    plan JSONB,
    doc JSONB,
    used_object_ids TEXT[] NOT NULL,
    model_info JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gen_events_user_time ON gen_events(user_id, created_at);

-- User feedback for preference learning
CREATE TABLE gen_feedback (
    event_id BIGINT REFERENCES gen_events(id) ON DELETE CASCADE,
    user_id TEXT,
    signal TEXT NOT NULL CHECK (signal IN ('kept', 'edited', 'regenerated', 'exported', 'favorited', 'reported')),
    weight NUMERIC NOT NULL DEFAULT 1.0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gen_feedback_signal ON gen_feedback(signal, created_at);

-- Learned user preferences
CREATE TABLE user_preferences (
    user_id TEXT PRIMARY KEY,
    weights JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Global preferences (aggregated from all users)
CREATE TABLE global_preferences (
    id BOOLEAN PRIMARY KEY DEFAULT TRUE,
    weights JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grounding cache for token optimization
CREATE TABLE grounding_cache (
    id TEXT PRIMARY KEY,
    prompt_hash TEXT NOT NULL,
    grounding_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_grounding_cache_hash ON grounding_cache(prompt_hash);
CREATE INDEX idx_grounding_cache_expires ON grounding_cache(expires_at);

-- Audit trail for KB changes
CREATE TABLE kb_audit (
    id BIGSERIAL PRIMARY KEY,
    object_id TEXT NOT NULL,
    action TEXT NOT NULL,
    before_state JSONB,
    after_state JSONB,
    user_id TEXT,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);