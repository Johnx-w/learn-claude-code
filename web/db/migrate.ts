/**
 * Database migration + seed script.
 *
 * Applies `db/schema.sql` to a SQLite database and seeds the `lessons` table
 * from the curriculum metadata in `src/lib/constants.ts` when the table is
 * empty. Safe to run repeatedly (idempotent).
 *
 * Usage:
 *   npm run db:migrate                # creates/upgrades data/learn.db
 *   DB_PATH=:memory: npm run db:migrate
 */
import { DatabaseSync } from "node:sqlite";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { LEARNING_PATH, VERSION_META } from "../src/lib/constants";

const SCHEMA_FILE = fileURLToPath(new URL("./schema.sql", import.meta.url));
const DEFAULT_DB_PATH = resolve(process.cwd(), "data/learn.db");
const DB_PATH = process.env.DB_PATH ?? DEFAULT_DB_PATH;

function main(): void {
	if (DB_PATH !== ":memory:") {
		mkdirSync(dirname(DB_PATH), { recursive: true });
	}

	const db = new DatabaseSync(DB_PATH);
	try {
		db.exec("PRAGMA foreign_keys = ON;");
		db.exec(readFileSync(SCHEMA_FILE, "utf8"));

		let { total } = db
			.prepare("SELECT COUNT(*) AS total FROM lessons")
			.get() as { total: number };

		if (total === 0) {
			seedLessons(db);
			total = LEARNING_PATH.length;
			console.log(`Seeded ${LEARNING_PATH.length} lessons.`);
		} else {
			console.log(`Lessons table already has ${total} rows; skipping seed.`);
		}

		const { progress } = db
			.prepare("SELECT COUNT(*) AS progress FROM lesson_progress")
			.get() as { progress: number };
		console.log(`Database ready at ${DB_PATH} (${total} lessons, ${progress} progress rows).`);
	} finally {
		db.close();
	}
}

function seedLessons(db: DatabaseSync): void {
	const insert = db.prepare(`
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

main();
