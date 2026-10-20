import Database from 'better-sqlite3';
import { asc, desc, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { env } from '$env/dynamic/private';
import type { Header, Project } from '$lib/projects';
import * as schema from './schema';

// The same pragmas as jrg-life: WAL so reads don't wait for writes.
const path = env.DATABASE_URL || 'local.db';
let sqlite: Database.Database;
try {
	sqlite = new Database(path);
} catch (cause) {
	// The usual cause in Docker: the mounted folder belongs to root, and the app runs as `node` (uid 1000).
	throw new Error(`Cannot open the database ${path}: is its folder writable by uid 1000?`, {
		cause
	});
}
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('busy_timeout = 5000');
sqlite.pragma('synchronous = NORMAL');
const db = drizzle(sqlite, { schema });
const { projects, settings } = schema;

// Pending migrations (./drizzle) are applied at start; 0004_seed fills an empty database once.
migrate(db, { migrationsFolder: 'drizzle' });

export const listProjects = (): Promise<(Project & { position: number })[]> =>
	db
		.select()
		.from(projects)
		.orderBy(desc(projects.year), asc(projects.position), desc(projects.createdAt));

/** Insert (at the top of its year: position 0, newest), or update the project that had id `original`. */
export async function saveProject(project: Project, original?: string) {
	if (original) await db.update(projects).set(project).where(eq(projects.id, original));
	else await db.insert(projects).values(project);
}

/** The dragged order: each id's place in the list becomes its position. */
export function saveOrder(ids: string[]) {
	db.transaction((tx) =>
		ids.forEach((id, position) =>
			tx.update(projects).set({ position }).where(eq(projects.id, id)).run()
		)
	);
}

export async function deleteProject(id: string) {
	await db.delete(projects).where(eq(projects.id, id));
}

/** The saved header (blank if its row was removed). */
export function getHeader(): Header {
	const saved = db.select().from(settings).where(eq(settings.key, 'header')).get()?.value;
	return { eyebrow: '', title: '', intro: '', ...(saved as Partial<Header>) };
}

export function saveHeader(value: Header) {
	db.insert(settings)
		.values({ key: 'header', value })
		.onConflictDoUpdate({ target: settings.key, set: { value } })
		.run();
}
