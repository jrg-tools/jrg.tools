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

/** The text above the projects until it is first saved on /admin. */
export const HEADER = {
	eyebrow: 'Projects',
	title: "What I've been building",
	intro: 'Small devices, printed and soldered on my desk, and web apps for the people around me.'
};
export type Header = typeof HEADER;

/** The first run of the database starts with these, newest first; edit them on /admin. */
export const PROJECTS: Project[] = [
	{
		id: 'ab98',
		name: 'AB98',
		tagline: 'A pocket music player shaped like a cassette Walkman',
		kind: 'hardware',
		year: 2026,
		summary:
			'Plays music from a micro SD card through a headphone jack, with a little cassette on screen whose reels turn while a song plays. When you want new music it joins your Wi-Fi, or starts its own hotspot, and serves a web page styled as the same Walkman to manage the card.',
		features: [
			'MP3, AAC, FLAC and WAV, a folder per tape',
			'Playlists and smart lists, on the device and the web',
			'Copies albums and artists from a Navidrome server',
			'Sleeps after five minutes; the play key wakes it',
			'English, Spanish, Vietnamese and Japanese'
		],
		stack: ['ESP32-S3', 'PCM5102A DAC', 'SvelteKit', 'FreeCAD', 'PLA'],
		art: 'ab98',
		steps: ['soldered', 'firmware', 'printed']
	},
	{
		id: 'mayanhcu',
		name: 'Máy Anh Cũ',
		tagline: 'A tiny film camera with a web darkroom',
		kind: 'hardware',
		year: 2026,
		summary:
			'A camera, and a film emulator, built around a thumb-sized ESP32-S3 with an OV2640 sensor. Load a roll of a film stock, shoot frame by frame through a live viewfinder, then browse and download the rolls from a page the camera serves itself.',
		features: [
			'Film stocks that tune the sensor before every shot',
			'Live viewfinder with a grid on a 1.8" screen',
			'Rolls saved to micro SD, frame by frame',
			'Flash LED and a real shutter button',
			'Battery gauge, radio off until you need it'
		],
		stack: ['XIAO ESP32-S3 Sense', 'OV2640', 'ST7735', 'MAX17048', 'SvelteKit'],
		art: 'mayanhcu',
		steps: ['soldered', 'firmware', 'printed']
	},
	{
		id: 'inkbridge',
		name: 'inkbridge',
		tagline: 'An always-on Home Assistant launcher on e-ink',
		kind: 'hardware',
		year: 2026,
		summary:
			'Two mechanical keys and a 2.13" e-paper screen with a grid of icon buttons, each one a Home Assistant script. Press one and it runs. Everything is configured from a web page the device serves, and it naps in light sleep between presses for weeks on a charge.',
		features: [
			'Icon grid of scripts, set up from the web',
			'Saved Wi-Fi networks tried in order',
			'Light sleep, instant wake on either key',
			'Lucide icons rasterised to 1-bit for the panel',
			'Two Cherry MX switches, sub-second feedback'
		],
		stack: ['XIAO ESP32-S3', 'e-Paper 2.13"', 'Cherry MX', 'Home Assistant', 'SvelteKit'],
		art: 'inkbridge',
		steps: ['soldered', 'firmware', 'printed']
	},
	{
		id: 'trip',
		art: 'trip',
		name: 'Trip',
		tagline: 'A family trip planner everyone edits together',
		kind: 'web',
		year: 2026,
		summary:
			'One shared page per trip where plans, lists, photos and documents live under their day, edited live by the whole family. A budget splits expenses across currencies, an assistant turns a brainstorm or a booking into events, and the whole trip prints as a PDF that also works offline.',
		features: [
			'Live co-editing with presence and comments',
			'Expenses with shares, settlements and currency rates',
			'Local AI: organise notes, read bookings and receipts',
			'Trip PDF and offline reading'
		],
		stack: ['SvelteKit', 'Svelte 5', 'SQLite', 'Drizzle', 'Yjs', 'Ollama'],
		ai: 'Every AI feature runs on a small Qwen 3.5 model on my own server (Ollama behind Open WebUI). Bookings, receipts and plans never leave the house.'
	},
	{
		id: 'tree',
		art: 'tree',
		name: 'Generations',
		tagline: 'A family tree you can walk in any direction',
		kind: 'web',
		year: 2026,
		summary:
			"A genealogy app that loads a person's whole family neighbourhood at once, ancestors, descendants, partners and siblings, and lets you keep walking from any relative without reloading. Writers edit with care: precise genealogical dates, a full audit trail with restore, and GEDCOM in and out.",
		features: [
			'Navigable graph from any person',
			'Approximate and ranged genealogical dates',
			'Audit log with one-click restore',
			'GEDCOM 5.5.1 and 7.0 import and export',
			'Ask about the family in a chat, through an MCP server'
		],
		stack: ['SvelteKit', 'SQLite', 'Drizzle', 'GEDCOM', 'MCP', 'Ollama'],
		ai: 'The family chat runs on a local model (Ollama behind Open WebUI) reading the tree through MCP, so living relatives stay in the house.'
	},
	{
		id: 'revelado',
		art: 'revelado',
		name: 'Revelado',
		tagline: 'A darkroom that develops photos with AI',
		kind: 'web',
		year: 2026,
		summary:
			'Upload a photo, pick a film stock or describe the change you want, and an image-editing model develops it. Paint a mask to edit only part of the frame, compare before and after with a slider, and step back through every version.',
		features: [
			'Film presets: Portra 400, Tri-X, CineStill 800T, Velvia 50 and more',
			'Brush masks to edit only part of the image',
			'Before and after compare slider',
			'Version history for every edit'
		],
		stack: ['SvelteKit', 'ComfyUI', 'Qwen-Image-Edit', 'Docker'],
		ai: 'Photos are developed by Qwen-Image-Edit in ComfyUI on my own GPU. No photo is sent to a cloud service.'
	},
	{
		id: 'eink-card',
		art: 'eink-card',
		name: 'E-ink Card',
		tagline: 'A business card for an e-ink reader',
		kind: 'web',
		year: 2026,
		summary:
			'Design a minimal business card for Xteink e-readers, preview it exactly as the e-ink panel will show it, and send it straight to the device over the local network, where it becomes the sleep screen. Everything renders in the browser; nothing leaves your phone except the upload to your own reader.',
		features: [
			'Pixel-exact preview for the X3 and X4 family',
			'Optional QR code for a link of your choice',
			'Finds a CrossPoint reader on the network and sends it',
			'No accounts, no server-side data'
		],
		stack: ['SvelteKit', 'Canvas', 'BMP encoder', 'CrossPoint']
	}
];

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
