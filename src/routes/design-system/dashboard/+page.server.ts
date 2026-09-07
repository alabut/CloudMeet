/**
 * Localhost-only visual QA surface for the dashboard design system.
 * Returns 404 on any non-loopback hostname.
 */

import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { isLoopbackHost } from '$lib/preview/sampleDashboard';

export const load: PageServerLoad = async ({ url }) => {
	if (!isLoopbackHost(url.hostname)) {
		throw error(404, 'Not found');
	}
	return {};
};
