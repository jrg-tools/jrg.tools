import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
// Relative import: drizzle-kit loads this file outside Vite.
import type { Art, Kind, Step } from '../../projects';

export const projects = sqliteTable('projects', {
	/** The slug, also the page anchor (`/#ab98`). */
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	tagline: text('tagline').notNull(),
	kind: text('kind').$type<Kind>().notNull(),
	year: integer('year').notNull(),
	summary: text('summary').notNull(),
	features: text('features', { mode: 'json' }).$type<string[]>().notNull(),
	stack: text('stack', { mode: 'json' }).$type<string[]>().notNull(),
	ai: text('ai'),
	art: text('art').$type<Art>(),
	image: text('image'),
	steps: text('steps', { mode: 'json' }).$type<Step[]>().notNull().default([]),
	featured: integer('featured', { mode: 'boolean' }).notNull().default(false),
	/** Place within its year (newest year first), set by dragging on /admin; ties go newest first. */
	position: integer('position').notNull().default(0),
	createdAt: integer('created_at', { mode: 'timestamp_ms' })
		.notNull()
		.$defaultFn(() => new Date())
});

/** Page-wide text, e.g. `header`: what the admin saved, as JSON. */
export const settings = sqliteTable('settings', {
	key: text('key').primaryKey(),
	value: text('value', { mode: 'json' }).notNull()
});
