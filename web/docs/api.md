# API

The web app exposes a small REST API under `/api` for reading the curriculum and tracking learner progress. All endpoints return JSON.

- **Base path:** `/api`
- **Response envelope:** successful responses use `{ "data": ... }`; errors use `{ "error": "..." }` with an appropriate HTTP status code.
- **Caching:** responses are always dynamic (`force-dynamic`); they are never statically cached because the SQLite database is a local file.

## Endpoint overview

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/lessons` | List all lessons in curriculum order |
| `GET` | `/api/lessons/{slug}` | Get a single lesson |
| `GET` | `/api/progress` | List all lesson progress rows |
| `PUT` | `/api/progress/{slug}` | Create or update progress for a lesson |
| `DELETE` | `/api/progress/{slug}` | Delete progress for a lesson |

---

## GET /api/lessons

Returns the full curriculum in learning order (`sort_order` ascending).

**Success `200`**

```json
{
  "data": [
    {
      "slug": "s01",
      "title": "The Agent Loop",
      "subtitle": "One Loop Is All You Need",
      "coreAddition": "Minimal model/tool loop",
      "keyInsight": "The smallest useful agent is a loop that calls the model, runs tools, and feeds results back.",
      "layer": "tools",
      "prevVersion": null,
      "sortOrder": 1
    }
  ]
}
```

**Errors:** none.

---

## GET /api/lessons/{slug}

Returns a single lesson by slug, e.g. `/api/lessons/s10`.

**Success `200`**

```json
{
  "data": {
    "slug": "s10",
    "title": "Task System",
    "subtitle": "Break Big Goals into Small Tasks",
    "coreAddition": "Task board",
    "keyInsight": "A task graph turns vague goals into ordered, observable work.",
    "layer": "collaboration",
    "prevVersion": "s09",
    "sortOrder": 10
  }
}
```

**Errors**

| Status | Body | When |
|--------|------|------|
| `404` | `{ "error": "Lesson not found: s99" }` | No lesson with that slug |

---

## GET /api/progress

Returns all lesson progress rows, ordered by lesson slug ascending.

**Success `200`**

```json
{
  "data": [
    {
      "lessonSlug": "s01",
      "status": "completed",
      "updatedAt": "2026-08-15T14:51:02.123Z"
    }
  ]
}
```

**Errors:** none.

---

## PUT /api/progress/{slug}

Creates or updates progress for a lesson, e.g. `/api/progress/s03`. The lesson must already exist.

**Request body**

```json
{ "status": "in_progress" }
```

`status` must be one of: `not_started`, `in_progress`, `completed`.

**Success `200`**

```json
{
  "data": {
    "lessonSlug": "s03",
    "status": "in_progress",
    "updatedAt": "2026-08-15T14:51:02.123Z"
  }
}
```

**Errors**

| Status | Body | When |
|--------|------|------|
| `400` | `{ "error": "Request body must be valid JSON." }` | Body is not valid JSON |
| `400` | `{ "error": "Invalid status. Expected one of: not_started, in_progress, completed." }` | `status` is missing or not one of the allowed values |
| `404` | `{ "error": "Lesson not found: s99" }` | No lesson with that slug |

---

## DELETE /api/progress/{slug}

Removes progress for a lesson, e.g. `/api/progress/s03`.

**Success `200`**

```json
{
  "data": {
    "lessonSlug": "s03",
    "deleted": true
  }
}
```

**Errors**

| Status | Body | When |
|--------|------|------|
| `404` | `{ "error": "No progress found for lesson: s03" }` | No progress row exists for that lesson |

---

## Common notes

- **Status values:** `not_started`, `in_progress`, `completed`.
- **Timestamps:** `updatedAt` is UTC ISO-8601 with millisecond precision, set by the database (`strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`).
- **Layer values:** `tools`, `planning`, `memory`, `concurrency`, `collaboration`.

See [Database](./database.md) for the underlying schema.
