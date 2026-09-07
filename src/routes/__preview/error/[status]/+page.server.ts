/**
 * Loopback-only preview route for public error boundary states.
 */

import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { isLoopbackHost } from '$lib/preview/sampleBooking';

const ALLOWED_STATUSES = new Set([400, 404, 500]);

export const load: PageServerLoad = async ({ params, url }) => {
	if (!isLoopbackHost(url.hostname)) {
		throw error(404, 'Not found');
	}

	const status = Number(params.status);
	if (!ALLOWED_STATUSES.has(status)) {
		throw error(404, 'Not found');
	}

	throw error(status, `Preview error ${status}`);
};
