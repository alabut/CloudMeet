/**
 * Calendar Settings page
 */

import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getCurrentUser } from '$lib/server/auth';
import {
	googleCalendarHealthMessage,
	probeGoogleCalendarHealth
} from '$lib/server/google-calendar-health';

export const load: PageServerLoad = async (event) => {
	const userId = await getCurrentUser(event);

	if (!userId) {
		throw redirect(302, '/auth/login');
	}

	const db = event.platform?.env?.DB;
	const env = event.platform?.env;
	if (!db || !env) {
		return {
			user: null,
			outlookConfigured: false,
			googleCalendarOk: false,
			googleCalendarWarning: 'Platform environment not available.'
		};
	}

	// Get user info including calendar connection status
	const user = await db
		.prepare('SELECT id, google_refresh_token, outlook_refresh_token, settings FROM users WHERE id = ?')
		.bind(userId)
		.first<{ id: string; google_refresh_token: string | null; outlook_refresh_token: string | null; settings: string | null }>();

	// Check if Microsoft OAuth is configured
	const outlookConfigured = !!(env.MICROSOFT_CLIENT_ID && env.MICROSOFT_CLIENT_SECRET);

	// Parse user settings for global calendar defaults
	let userSettings: {
		defaultAvailabilityCalendars?: 'google' | 'outlook' | 'both';
		defaultInviteCalendar?: 'google' | 'outlook';
		selectedGoogleCalendars?: string[];
	} = {};
	try {
		userSettings = user?.settings ? JSON.parse(user.settings) : {};
	} catch {
		userSettings = {};
	}

	const googleHealth = await probeGoogleCalendarHealth(
		db,
		userId,
		env.GOOGLE_CLIENT_ID,
		env.GOOGLE_CLIENT_SECRET
	);

	return {
		user: user
			? {
					googleConnected: !!user.google_refresh_token,
					googleHealthy: googleHealth.ok,
					outlookConnected: !!user.outlook_refresh_token,
					defaultAvailabilityCalendars: userSettings.defaultAvailabilityCalendars,
					defaultInviteCalendar: userSettings.defaultInviteCalendar,
					selectedGoogleCalendars: userSettings.selectedGoogleCalendars
				}
			: null,
		outlookConfigured,
		googleCalendarOk: googleHealth.ok,
		googleCalendarWarning: googleCalendarHealthMessage(googleHealth)
	};
};
