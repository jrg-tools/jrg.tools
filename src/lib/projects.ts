export const KINDS = ['hardware', 'web'] as const;
export type Kind = (typeof KINDS)[number];

/** How a hardware build was made, ticked on /admin; the label above its name lists them. */
export const STEPS = { soldered: 'Soldered', firmware: 'Firmware', printed: '3D' } as const;
export type Step = keyof typeof STEPS;

/** The yellow line above a project's name: "2026 · Soldered · Firmware · 3D", steps in `STEPS` order. */
export const label = (p: Pick<Project, 'year' | 'kind' | 'ai' | 'steps'>) =>
	[
		p.year,
		...(p.kind === 'hardware'
			? (Object.keys(STEPS) as Step[]).filter((s) => p.steps?.includes(s)).map((s) => STEPS[s])
			: [p.ai ? 'Web app · self-hosted AI' : 'Web app'])
	].join(' · ');

/** Hand-drawn pictures on the page: isometric figures for hardware, card illustrations for web apps. */
export const ARTS = [
	'ab98',
	'mayanhcu',
	'inkbridge',
	'trip',
	'tree',
	'revelado',
	'eink-card'
] as const;
export type Art = (typeof ARTS)[number];

export interface Project {
	id: string;
	name: string;
	tagline: string;
	kind: Kind;
	/** The year it was made, for the year filter. */
	year: number;
	summary: string;
	features: string[];
	stack: string[];
	/** For apps whose AI runs on my own hardware: what runs and where. */
	ai?: string | null;
	/** One of the drawings on the page; without one, `image` (a URL) is shown instead, if any. */
	art?: Art | null;
	image?: string | null;
	/** Shown on top of the page, before the rest. */
	featured?: boolean;
	/** Hardware only. */
	steps?: Step[];
}

/** The text above the projects, edited on /admin. */
export interface Header {
	eyebrow: string;
	title: string;
	intro: string;
}

/** The page anchor from the name: "Máy Anh Cũ" → "may-anh-cu". */
export const slugify = (name: string) =>
	name
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/đ/gi, 'd')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 40) || 'project';

const lines = (value: FormDataEntryValue | null, split: RegExp) =>
	String(value ?? '')
		.split(split)
		.map((s) => s.trim())
		.filter(Boolean);

/** The admin form, checked field by field: the project as typed, and the names of the invalid fields. */
export function parseProject(form: FormData): { project: Project; errors: string[] } {
	const text = (key: string) => String(form.get(key) ?? '').trim();
	const project: Project = {
		id: slugify(text('name')),
		name: text('name'),
		tagline: text('tagline'),
		kind: text('kind') as Kind,
		year: Number(text('year')),
		summary: text('summary'),
		features: lines(form.get('features'), /\n/),
		stack: lines(form.get('stack'), /,/),
		ai: text('ai') || null,
		art: (text('art') || null) as Art | null,
		image: text('image') || null,
		featured: form.has('featured'),
		steps:
			text('kind') === 'hardware'
				? (Object.keys(STEPS) as Step[]).filter((s) => form.getAll('steps').includes(s))
				: []
	};
	const errors = [
		!project.name && 'name',
		!KINDS.includes(project.kind) && 'kind',
		!Number.isInteger(project.year) || project.year < 2000 || project.year > 2100 ? 'year' : false,
		project.art && !ARTS.includes(project.art) && 'art',
		project.image && !/^(https?:\/\/|\/)/.test(project.image) && 'image'
	].filter((e): e is string => !!e);
	return { project, errors };
}
