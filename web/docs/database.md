# Database

The web app stores its curriculum and learner progress in a local **SQLite** database.

- **Engine:** SQLite via `node:sqlite` (`DatabaseSync`, built into Node.js 24+ ¡ª no extra dependency)
- **Database file:** `data/learn.db`
- **Schema source of truth:** [`db/schema.sql`](../db/schema.sql)
- **Migration script:** [`db/migrate.ts`](../db/migrate.ts) ¡ª run with `npm run db:migrate`
- **Access layer:** [`src/lib/db.ts`](../src/lib/db.ts) (`LessonDb` class)

The schema is applied idempotently by both `db/migrate.ts` and `src/lib/db.ts` at open time. When the `lessons` table is empty, the curriculum is seeded from `VERSION_META` in [`src/lib/constants.ts`](../src/lib/constants.ts).

## Tables

### `lessons`

One row per curriculum chapter (`s01` ... `s17`).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `slug` | TEXT | `PRIMARY KEY` | Lesson identifier, e.g. `s10` |
| `title` | TEXT | `NOT NULL` | Display title |
| `subtitle` | TEXT | `NOT NULL DEFAULT ''` | Short subtitle |
| `core_addition` | TEXT | `NOT NULL DEFAULT ''` | What this version adds |
| `key_insight` | TEXT | `NOT NULL DEFAULT ''` | The key takeaway |
| `layer` | TEXT | `NOT NULL` + `CHECK` | Curriculum layer (see below) |
| `prev_version` | TEXT | `REFERENCES lessons(slug) ON DELETE SET NULL` | Previous lesson in the chain |
| `sort_order` | INTEGER | `NOT NULL` | Position in curriculum order |

**`layer` allowed values:**

| Value | Meaning |
|-------|---------|
| `tools` | Tools & Execution |
| `planning` | Planning & Control |
| `memory` | Memory Management |
| `concurrency` | Concurrency & Scheduling |
| `collaboration` | Multi-Agent Platform |

### `lesson_progress`

One row per lesson; tracks a learner's progress for that lesson.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `lesson_slug` | TEXT | `PRIMARY KEY`, `REFERENCES lessons(slug) ON DELETE CASCADE` | The lesson being tracked |
| `status` | TEXT | `NOT NULL DEFAULT 'not_started'` + `CHECK` | Progress status (see below) |
| `updated_at` | TEXT | `NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))` | Last update, UTC ISO-8601 |

**`status` allowed values:** `not_started`, `in_progress`, `completed`.

## Foreign keys

| Constraint | Child column | Parent table / column | On delete |
|------------|--------------|------------------------|-----------|
| `lesson_progress.lesson_slug` -> `lessons.slug` | `lesson_slug` | `lessons.slug` | `CASCADE` |
| `lessons.prev_version` -> `lessons.slug` | `prev_version` | `lessons.slug` (self-reference) | `SET NULL` |

Foreign keys are enforced (`PRAGMA foreign_keys = ON`). Deleting a lesson cascades to its progress rows; a deleted `prev_version` is set to `NULL` instead of blocking the delete.

## Indexes

| Index | Table | Columns | Purpose |
|-------|-------|---------|---------|
| `idx_lessons_sort_order` | `lessons` | `sort_order` | Fast curriculum-ordered listing |

`lesson_progress` uses `lesson_slug` as its primary key, so lookups by lesson need no extra index.

## Relationship diagram

```
lessons
  +---------------+                                   +------------------+
  | slug (PK)     | <---+                             | lesson_progress  |
  | title         |     | prev_version                |------------------|
  | subtitle      |     | (self-reference,            | lesson_slug (PK) |
  | core_addition |     |  ON DELETE SET NULL)        |   (FK -> lessons|
  | key_insight   |     |                             |    ON DELETE    |
  | layer         |     +-----------------------------|    CASCADE)     |
  | prev_version  |                                   | status          |
  | sort_order    |                                   | updated_at      |
  +---------------+                                   +------------------+
```

- One **lesson** owns zero or more **progress** rows (1:N).
- A lesson may reference another lesson as its **previous version** (self-referencing 1:1 optional).

## Usage

```bash
cd web
npm run db:migrate   # create/upgrade data/learn.db (idempotent)
```

For tests or throwaway setups, point `DB_PATH` at `:memory:`:

```bash
DB_PATH=:memory: npm run db:migrate
```

See [API](./api.md) for how the database is exposed over HTTP.
