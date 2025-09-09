# SVG AI Knowledge Base Database

This directory contains the database schema, migrations, and utilities for the SVG AI Knowledge Base system.

## Overview

The knowledge base uses PostgreSQL with optional pgvector extension for semantic similarity search. The database stores:

- **Knowledge Objects**: Style packs, motifs, glossary terms, rules, and few-shot examples
- **Generation Events**: Logs of all SVG generation attempts for learning
- **User Feedback**: Signals for preference learning (kept, edited, exported, etc.)
- **Preferences**: User and global preferences learned from feedback
- **Audit Trail**: Complete change history for transparency

## Quick Start

### 1. Setup Database

```bash
# Install and setup PostgreSQL database
bun run db:setup

# Run migrations
bun run db:migrate

# Seed with default data
bun run db:seed
```

### 2. Development Commands

```bash
# Generate new migration after schema changes
bun run db:generate

# Run migrations
bun run db:migrate

# Open Drizzle Studio (database GUI)
bun run db:studio

# Reset database (WARNING: deletes all data)
bun run db:reset

# Re-seed database
bun run db:seed
```

## Database Schema

### Core Tables

#### `kb_objects`

Unified storage for all knowledge base objects:

- `id`: Unique identifier
- `kind`: Object type (style_pack, motif, glossary, rule, fewshot)
- `title`: Human-readable name
- `body`: JSON content (structured, task-ready, <500 tokens)
- `tags`: Array of tags for filtering
- `version`: Semantic version (1.0.0)
- `status`: Lifecycle status (active, deprecated, experimental)
- `embedding`: Vector embedding for similarity search (optional)
- `quality_score`: Curator rating + eval pass rate
- `parent_id`: Version lineage tracking
- `source_provenance`: Creation metadata

#### `kb_links`

Relationships between knowledge objects:

- `src_id`, `dst_id`: Object IDs
- `rel`: Relationship type (belongs_to, refines, contradicts)

#### `gen_events`

Generation event logging for learning:

- `user_id`: User identifier (optional)
- `prompt`: User input prompt
- `intent`: Normalized design intent (JSON)
- `plan`: Composition plan (JSON)
- `doc`: Final SVG document (JSON)
- `used_object_ids`: KB objects used in generation
- `model_info`: Model and parameters used

#### `gen_feedback`

User feedback signals for preference learning:

- `event_id`: Reference to generation event
- `signal`: Feedback type (kept, edited, regenerated, exported, favorited, reported)
- `weight`: Signal strength (exported +2, favorited +1.5, kept +1, etc.)

#### `user_preferences` / `global_preferences`

Learned preferences from feedback:

- `weights`: JSON object with preference scores for motifs, tags, etc.

#### `grounding_cache`

Token cost optimization cache:

- `prompt_hash`: Hash of prompt + user context
- `grounding_data`: Cached grounding result
- `expires_at`: TTL (5-15 minutes)

## Knowledge Object Types

### Style Packs

Define visual style parameters:

```json
{
  "name": "Mediterranean Line Art",
  "description": "Clean line art inspired by Mediterranean architecture",
  "styleParameters": {
    "colorPalette": ["#2563eb", "#0ea5e9"],
    "strokeWidth": 2,
    "cornerRadius": 4,
    "fillOpacity": 0,
    "strokeOpacity": 1
  }
}
```

### Motifs

Reusable design elements:

```json
{
  "name": "Mediterranean Arch",
  "description": "Classic rounded arch",
  "parameters": {
    "shapes": [{ "type": "path", "pathData": "M 10 50 Q 50 10 90 50" }],
    "layoutHints": ["center", "architectural"]
  }
}
```

### Glossary

Design terminology and guidelines:

```json
{
  "term": "stroke-width",
  "definition": "The width of the outline of SVG shapes",
  "guidelines": {
    "thin": "1-1.5px for delicate details",
    "medium": "2-3px for standard elements"
  }
}
```

### Rules

System constraints and policies:

```json
{
  "rule": "stroke-only",
  "description": "All elements must use stroke rendering without fill",
  "constraints": { "fill": "none", "stroke": "required" }
}
```

## Vector Similarity Search

When pgvector is available, the system uses semantic similarity search:

1. **Embedding Generation**: Uses OpenAI text-embedding-3-small
2. **Similarity Search**: Cosine similarity with ivfflat index
3. **Fallback**: Tag-based filtering when embeddings unavailable

## Preference Learning

The system learns from user feedback:

### Signal Weights

- `exported`: +2.0 (strong positive)
- `favorited`: +1.5 (positive)
- `kept`: +1.0 (neutral positive)
- `edited`: +0.5 (weak positive)
- `regenerated`: -0.5 (weak negative)
- `reported`: -3.0 (strong negative)

### Scoring Algorithm

```
score = α * similarity + β * preference + γ * quality - δ * freshness
```

Where: α=0.6, β=0.2, γ=0.2, δ=0.1

### Bias Controls

- Preference caps (max 1.5x boost) prevent echo chambers
- Diverse sampling with MMR algorithm
- Content governance filters

## Environment Variables

```bash
# Required
DATABASE_URL=postgresql://user:password@localhost:5432/svg_ai_dev

# Optional (for embeddings)
OPENAI_API_KEY=sk-...
```

## Monitoring

### Health Checks

```typescript
import { checkDatabaseHealth } from "./config";
const isHealthy = await checkDatabaseHealth();
```

### Performance Metrics

- Cache hit/miss ratios
- Token usage and costs
- Object usage patterns
- Preference learning effectiveness

## Security

### Content Governance

- Token budget limits (500 tokens per object)
- Content policy validation
- Bias detection and prevention
- Audit trail for all changes

### Data Protection

- User preference isolation
- Secure connection strings
- Input sanitization
- Access control validation

## Troubleshooting

### Common Issues

1. **pgvector not available**
   - System falls back to tag-based filtering
   - Install pgvector for better similarity search

2. **Migration failures**
   - Check PostgreSQL version compatibility
   - Ensure database user has proper permissions

3. **Performance issues**
   - Check index usage with `EXPLAIN ANALYZE`
   - Monitor cache hit ratios
   - Consider connection pooling

### Debug Commands

```bash
# Check database connection
psql $DATABASE_URL -c "SELECT 1"

# View table sizes
psql $DATABASE_URL -c "SELECT schemaname,tablename,pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size FROM pg_tables WHERE schemaname='public';"

# Check index usage
psql $DATABASE_URL -c "SELECT schemaname,tablename,attname,n_distinct,correlation FROM pg_stats WHERE schemaname='public';"
```
