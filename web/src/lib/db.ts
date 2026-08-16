import { DatabaseSync } from "node:sqlite";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { LEARNING_PATH, VERSION_META } from "./constants";

export const PROGRESS_STATUSES = ["not_started", "in_progress", "completed"] as const;
export type ProgressStatus = (typeof PROGRESS_STATUSES)[number];

export interface Lesson {
	slug: string;
	title: string;
	subtitle: string;
	coreAddition: string;
	keyInsight: string;
	layer: string;
	prevVersion: string | null;
	sortOrder: number;
}

export interface LessonProgress {
	lessonSlug: string;
	status: ProgressStatus;
	updatedAt: string;
}

const DEFAULT_DB_PATH = resolve(process.cwd(), "data/learn.db");

/**
 * Resolve the schema file. Under Next.js the process cwd is the web/ project
 * root, but fall back to a path relative to this module when that fails
 * (e.g. when bundled into a different working directory).
 */
function resolveSchemaFile(): string {
	const fromCwd = resolve(process.cwd(), "db/schema.sql");
	if (existsSync(fromCwd)) {
		return fromCwd;
	}
	return fileURLToPath(new URL("../../db/schema.sql", import.meta.url));
}

export class LessonDb {
	private constructor(private readonly db: DatabaseSync) {}

	/**
	 * Open (or create) a SQLite database, apply the schema, and seed the
	 * curriculum when the lessons table is empty. Pass `{ seed: false }` to
	 * skip seeding (e.g. tests that set up their own fixtures).
	 */
	static open(
		dbPath: string = process.env.DB_PATH ?? DEFAULT_DB_PATH,
		options: { seed?: boolean } = {},
	): LessonDb {
		if (dbPath !== ":memory:") {
			mkdirSync(dirname(dbPath), { recursive: true });
		}
		const db = new DatabaseSync(dbPath);
		db.exec("PRAGMA foreign_keys = ON;");
		db.exec(readFileSync(resolveSchemaFile(), "utf8"));
		const lessonDb = new LessonDb(db);
		if (options.seed !== false) {
			lessonDb.seedIfEmpty();
		}
		return lessonDb;
	}

	/** Insert the curriculum into an empty lessons table (idempotent). */
	seedIfEmpty(): void {
		const { total } = this.db
			.prepare("SELECT COUNT(*) AS total FROM lessons")
			.get() as { total: number };
		if (total > 0) {
			return;
		}
		const insert = this.db.prepare(`
			INSERT INTO lessons (slug, title, subtitle, core_addition, key_insight, layer, prev_version, sort_order)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?)
		`);
		LEARNING_PATH.forEach((slug, index) => {
			const meta = VERSION_META[slug];
			if (!meta) {
				throw new Error(`Missing VERSION_META entry for ${slug}`);
			}
			insert.run(
				slug,
				meta.title,
				meta.subtitle,
				meta.coreAddition,
				meta.keyInsight,
				meta.layer,
				meta.prevVersion,
				index + 1,
			);
		});
	}

	close(): void {
		this.db.close();
	}

	listLessons(): Lesson[] {
		const rows = this.db
			.prepare(
				`SELECT slug, title, subtitle, core_addition, key_insight, layer, prev_version, sort_order
				 FROM lessons
				 ORDER BY sort_order ASC`,
			)
			.all() as Record<string, unknown>[];
		return rows.map(toLesson);
	}

	getLesson(slug: string): Lesson | null {
		const row = this.db
			.prepare(
				`SELECT slug, title, subtitle, core_addition, key_insight, layer, prev_version, sort_order
				 FROM lessons
				 WHERE slug = ?`,
			)
			.get(slug) as Record<string, unknown> | undefined;
		return row ? toLesson(row) : null;
	}

	listProgress(): LessonProgress[] {
		const rows = this.db
			.prepare(
				`SELECT lesson_slug, status, updated_at
				 FROM lesson_progress
				 ORDER BY lesson_slug ASC`,
			)
			.all() as Record<string, unknown>[];
		return rows.map(toLessonProgress);
	}

	getProgress(slug: string): LessonProgress | null {
		const row = this.db
			.prepare(
				`SELECT lesson_slug, status, updated_at
				 FROM lesson_progress
				 WHERE lesson_slug = ?`,
			)
			.get(slug) as Record<string, unknown> | undefined;
		return row ? toLessonProgress(row) : null;
	}

	/**
	 * Insert or update progress for a lesson. Throws if the lesson slug does
	 * not exist or the status is invalid.
	 */
	upsertProgress(slug: string, status: ProgressStatus): LessonProgress {
		const lesson = this.getLesson(slug);
		if (!lesson) {
			throw new Error(`Lesson not found: ${slug}`);
		}
		if (!PROGRESS_STATUSES.includes(status)) {
			throw new Error(`Invalid status: ${status}`);
		}
		this.db
			.prepare(
				`INSERT INTO lesson_progress (lesson_slug, status, updated_at)
				 VALUES (?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
				 ON CONFLICT(lesson_slug) DO UPDATE SET
				   status = excluded.status,
				   updated_at = excluded.updated_at`,
			)
			.run(slug, status);
		return this.getProgress(slug) as LessonProgress;
	}

	/** Delete progress for a lesson. Returns true when a row was removed. */
	deleteProgress(slug: string): boolean {
		const result = this.db
			.prepare("DELETE FROM lesson_progress WHERE lesson_slug = ?")
			.run(slug);
		return Number(result.changes) > 0;
	}
}

function toLesson(row: Record<string, unknown>): Lesson {
	return {
		slug: String(row.slug),
		title: String(row.title),
		subtitle: String(row.subtitle),
		coreAddition: String(row.core_addition),
		keyInsight: String(row.key_insight),
		layer: String(row.layer),
		prevVersion: row.prev_version == null ? null : String(row.prev_version),
		sortOrder: Number(row.sort_order),
	};
}

function toLessonProgress(row: Record<string, unknown>): LessonProgress {
	return {
		lessonSlug: String(row.lesson_slug),
		status: String(row.status) as ProgressStatus,
		updatedAt: String(row.updated_at),
	};
}

/** Default instance backed by data/learn.db (override with DB_PATH). */
export const db = LessonDb.open();
