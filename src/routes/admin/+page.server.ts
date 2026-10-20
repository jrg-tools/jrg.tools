import { fail, redirect } from '@sveltejs/kit';
import { parseProject } from '$lib/projects';
import {
	deleteProject,
	getHeader,
	listProjects,
	saveHeader,
	saveOrder,
	saveProject
} from '$lib/server/db';

// The admin check is in hooks.server.ts, for this load and every action.
export const load = async ({ url }) => {
	const projects = await listProjects();
	const id = url.searchParams.get('edit');
	return { projects, editing: projects.find((p) => p.id === id) ?? null, header: getHeader() };
};

export const actions = {
	save: async ({ request }) => {
		const form = await request.formData();
		const { project, errors } = parseProject(form);
		if (errors.length) return fail(400, { errors });
		const original = String(form.get('original') ?? '') || undefined;
		// A new project's anchor comes from its name (-2, -3… if taken); an edit keeps it, so links stay.
		const ids = new Set((await listProjects()).map((p) => p.id));
		let id = original ?? project.id;
		for (let n = 2; !original && ids.has(id); n++) id = `${project.id}-${n}`;
		await saveProject({ ...project, id }, original);
		redirect(303, `/admin?saved=1#${id}`);
	},
	/** The text above the projects; an empty field leaves its line out of the page. */
	header: async ({ request }) => {
		const form = await request.formData();
		const text = (key: string) => String(form.get(key) ?? '').trim();
		saveHeader({
			eyebrow: text('eyebrow'),
			title: text('title'),
			intro: text('intro')
		});
		return { headerSaved: true };
	},
	/** The dragged order, as comma-separated ids. */
	order: async ({ request }) => {
		const ids = String((await request.formData()).get('ids') ?? '').split(',');
		saveOrder(ids.slice(0, 1000));
	},
	delete: async ({ request }) => {
		await deleteProject(String((await request.formData()).get('id') ?? ''));
		redirect(303, '/admin');
	}
};
