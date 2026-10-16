import { json } from '@sveltejs/kit';

export const GET = () => json({ status: 'ok', timestamp: new Date().toISOString() });
