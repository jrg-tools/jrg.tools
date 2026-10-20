import { buildClerkProps } from 'svelte-clerk/server';

export const load = ({ locals }) => ({
	...buildClerkProps(locals.auth()),
	signedIn: !!locals.auth().userId,
	isAdmin: locals.isAdmin
});
