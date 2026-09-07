import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { isLoopbackHost, parseOverviewState, getOverviewFixture } from '$lib/preview/sampleDashboard';

export const load: PageServerLoad = async ({ url }) => {
	if (!isLoopbackHost(url.hostname)) {
		throw error(404, 'Not found');
	}
	const state = parseOverviewState(url.searchParams.get('preview'));
	return { state, fixture: getOverviewFixture(state) };
};
