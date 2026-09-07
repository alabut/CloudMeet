/**
 * Localhost-only visual QA/learning surface — not part of the public product.
 * Returns 404 on any non-loopback hostname.
 */

import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { isLoopbackHost } from '$lib/preview/sampleBooking';

export const load: PageServerLoad = async ({ url }) => {
	if (!isLoopbackHost(url.hostname)) {
		throw error(404, 'Not found');
	}

	return {};
};
