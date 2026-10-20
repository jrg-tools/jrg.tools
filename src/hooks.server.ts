import { redirect, type Handle } from '@sveltejs/kit';
import { clerkClient, withClerkHandler } from 'svelte-clerk/server';

/** This app's name in Clerk `privateMetadata.scope`: the same Clerk users sign in to every app. */
const SCOPE = 'tools';

/** `scope` is a comma-separated list ("tree,trip,tools") or an array of app names. */
const hasScope = (value: unknown) =>
	(Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : []).some(
		(s) => typeof s === 'string' && s.trim().toLowerCase() === SCOPE
	);

/** userId → admin, so pages don't call the Clerk API on every request; /admin always asks again. */
const cache = new Map<string, { admin: boolean; at: number }>();
async function isAdmin(userId: string, maxAgeMs: number) {
	const hit = cache.get(userId);
	if (hit && Date.now() - hit.at < maxAgeMs) return hit.admin;
	const { role, scope } = (await clerkClient.users.getUser(userId)).privateMetadata ?? {};
	const admin = role === 'admin' && hasScope(scope);
	cache.set(userId, { admin, at: Date.now() });
	return admin;
}

const clerk = withClerkHandler();

/** Every page knows who is signed in (for the header); /admin (page and actions) needs an admin. */
export const handle: Handle = (input) => {
	const { pathname, search } = input.event.url;
	// The health check must not depend on the Clerk API.
	if (pathname.startsWith('/api/health')) return input.resolve(input.event);
	return clerk({
		...input,
		resolve: async (event, opts) => {
			const { userId } = event.locals.auth();
			const inAdmin = pathname === '/admin' || pathname.startsWith('/admin/');
			if (inAdmin && !userId)
				redirect(303, `/sign-in?redirect_url=${encodeURIComponent(pathname + search)}`);
			event.locals.isAdmin = !!userId && (await isAdmin(userId, inAdmin ? 0 : 60_000));
			if (inAdmin && !event.locals.isAdmin) return new Response('Forbidden', { status: 403 });
			return input.resolve(event, opts);
		}
	});
};
