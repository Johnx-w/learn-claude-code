-- ============================================================================
-- learn-claude-code web ¡ª database schema
-- Engine: SQLite (node:sqlite / DatabaseSync, Node.js 24+)
-- This file is the single source of truth for the schema. It is applied by
-- `db/migrate.ts` and by `src/lib/db.ts` at open time (idempotent).
-- ============================================================================

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- ----------------------------------------------------------------------------
-- lessons ¡ª one row per curriculum chapter (s01..s17).
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lessons (
	slug          TEXT PRIMARY KEY,                -- e.g. 's10'
	title         TEXT NOT NULL,
	subtitle      TEXT NOT NULL DEFAULT '',
	core_addition TEXT NOT NULL DEFAULT '',
	key_insight   TEXT NOT NULL DEFAULT '',
	layer         TEXT NOT NULL CHECK (layer IN (
	                  'tools',
	                  'planning',
	                  'memory',
	                  'concurrency',
	                  'collaboration'
	              )),
	prev_version  TEXT REFERENCES lessons(slug) ON DELETE SET NULL,
	sort_order    INTEGER NOT NULL
);

-- ----------------------------------------------------------------------------
-- lesson_progress ¡ª learner progress for each lesson.
-- One row per lesson; FK keeps progress in sync with the curriculum.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lesson_progress (
	lesson_slug TEXT PRIMARY KEY REFERENCES lessons(slug) ON DELETE CASCADE,
	status      TEXT NOT NULL DEFAULT 'not_started' CHECK (
	                status IN ('not_started', 'in_progress', 'completed')
	            ),
	updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Lessons are usually listed in curriculum order.
CREATE INDEX IF NOT EXISTS idx_lessons_sort_order ON lessons(sort_order);
