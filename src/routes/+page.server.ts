import { getHeader, listProjects } from '$lib/server/db';

export const load = async () => ({ projects: await listProjects(), header: getHeader() });
