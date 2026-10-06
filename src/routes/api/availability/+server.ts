/**
 * Availability API endpoint
 * Returns available time slots based on:
 * 1. User's availability rules (weekly schedule)
 * 2. Google Calendar busy times
 * 3. Outlook Calendar busy times
 * 4. Existing bookings
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getBusyTimes, getPrimaryCalendarEvents, getValidAccessToken } from '$lib/server/google-calendar';
import { getOutlookBusyTimes, getValidOutlookAccessToken } from '$lib/server/outlook-calendar';
import { createDateInTimezone, generateAvailableSlots, type TimeSlot } from '$lib/server/availability-slots';
import { calendarOutageBody, signalCalendarHealthcheckFailure } from '$lib/server/calendar-outage';
import {
	addCalendarDays,
	filterSlotsToBookingWindow,
	getConsumedPacificDates,
	PACIFIC_TIMEZONE
} from '$lib/server/booking-rules';
import { getPrimaryBlackoutDates } from '$lib/server/primary-calendar-blackouts';

export const GET: RequestHandler = async ({ url, platform }) => {
	const requestStartedAt = new Date();
	const env = platform?.env;
	if (!env) {
		throw error(500, 'Platform env not available');
	}

	const eventSlug = url.searchParams.get('event');
	const date = url.searchParams.get('date'); // YYYY-MM-DD

	if (!eventSlug || !date) {
		throw error(400, 'Missing required parameters');
	}

	try {
		const db = env.DB;

		// Get the first (and only) user for single-user setup
		const user = await db
			.prepare('SELECT id, slug, timezone, settings FROM users LIMIT 1')
			.first<{ id: string; slug: string; timezone: string | null; settings: string | null }>();

		if (!user) {
			throw error(404, 'User not found');
		}

		const userTimezone = user.timezone || 'UTC';

		// Parse user settings for global calendar defaults
		let userSettings: { defaultAvailabilityCalendars?: string; selectedGoogleCalendars?: string[] } = {};
		try {
			userSettings = user.settings ? JSON.parse(user.settings) : {};
		} catch {
			userSettings = {};
		}

		const eventType = await db
			.prepare('SELECT id, duration_minutes as duration, availability_calendars FROM event_types WHERE user_id = ? AND slug = ? AND is_active = 1')
			.bind(user.id, eventSlug)
			.first<{ id: string; duration: number; availability_calendars: string | null }>();

		if (!eventType) {
			throw error(404, 'Event type not found or inactive');
		}

		const consumedDates = await getConsumedPacificDates(db, user.id);
		if (consumedDates.has(date)) {
			return json({ slots: [] });
		}

		// Get calendar settings: use event type override if set, otherwise use global settings
		const availabilityCalendars = eventType.availability_calendars || userSettings.defaultAvailabilityCalendars || 'both';
		const useGoogleCalendar = availabilityCalendars === 'google' || availabilityCalendars === 'both';
		const useOutlookCalendar = availabilityCalendars === 'outlook' || availabilityCalendars === 'both';

		// Parse date as LOCAL midnight, not UTC.
		// `new Date('2026-08-24')` is parsed as UTC midnight, but .getDay() reads it
		// back in local time - so in any UTC-negative zone it reports the PREVIOUS day
		// and availability rules are looked up for the wrong weekday. The month
		// endpoint uses the local component constructor, so the two disagreed.
		// This only stayed hidden in production because Workers run with TZ=UTC.
		const [reqYear, reqMonth, reqDay] = date.split('-').map(Number);
		const requestedDate = new Date(Date.UTC(reqYear, reqMonth - 1, reqDay));
		const dayOfWeek = requestedDate.getUTCDay();

		// Get availability rules for this day
		const availabilityRules = await db
			.prepare(
				`SELECT start_time, end_time
				FROM availability_rules
				WHERE user_id = ? AND day_of_week = ?
				ORDER BY start_time`
			)
			.bind(user.id, dayOfWeek)
			.all<{ start_time: string; end_time: string }>();

		if (!availabilityRules.results || availabilityRules.results.length === 0) {
			return json({ slots: [] });
		}

		// Get busy times from connected calendars. Query the Pacific day that
		// corresponds to the public booking date, not the worker's UTC day.
		const startOfDay = createDateInTimezone(date, '00:00', PACIFIC_TIMEZONE);
		const endOfDay = createDateInTimezone(addCalendarDays(date, 1), '00:00', PACIFIC_TIMEZONE);

		let busySlots: TimeSlot[] = [];
		let googleAccessToken: string | null = null;

		try {
			googleAccessToken = await getValidAccessToken(
				db,
				user.id,
				env.GOOGLE_CLIENT_ID,
				env.GOOGLE_CLIENT_SECRET
			);
			const primaryEvents = await getPrimaryCalendarEvents(googleAccessToken, startOfDay, endOfDay);
			const blackoutDates = getPrimaryBlackoutDates({
				events: primaryEvents,
				rulesByDate: new Map([[date, availabilityRules.results]]),
				availabilityTimezone: userTimezone
			});
			if (blackoutDates.has(date)) {
				return json({ slots: [] });
			}

			// Fetch Google Calendar busy times (if enabled in settings)
			if (useGoogleCalendar) {
				// Use selected calendars if configured, otherwise query all
				const selectedCalendars = userSettings.selectedGoogleCalendars;
				const googleBusy = await getBusyTimes(googleAccessToken, startOfDay, endOfDay, selectedCalendars);
				busySlots.push(...googleBusy);
			}
		} catch (err) {
			console.error('Error fetching Google Calendar availability:', err);
			await signalCalendarHealthcheckFailure(env);
			return json(calendarOutageBody(), { status: 503 });
		}

		// Fetch Outlook Calendar busy times (if configured, connected, and enabled in settings)
		if (useOutlookCalendar && env.MICROSOFT_CLIENT_ID && env.MICROSOFT_CLIENT_SECRET) {
			try {
				const outlookToken = await getValidOutlookAccessToken(
					db,
					user.id,
					env.MICROSOFT_CLIENT_ID,
					env.MICROSOFT_CLIENT_SECRET
				);
				const outlookBusy = await getOutlookBusyTimes(outlookToken, startOfDay, endOfDay);
				busySlots.push(...outlookBusy);
			} catch (err) {
				// User may not have Outlook connected - that's fine
				console.error('Error fetching Outlook Calendar busy times:', err);
			}
		}

		// Generate available slots (shared with the month endpoint - see
		// availability-slots.ts for why this isn't duplicated here).
		const slots: TimeSlot[] = filterSlotsToBookingWindow(generateAvailableSlots({
			dateStr: date,
			rules: availabilityRules.results,
			timezone: userTimezone,
			durationMinutes: eventType.duration,
			busySlots,
			now: requestStartedAt
		}), requestStartedAt);

		return json({ slots });
	} catch (err: any) {
		console.error('Availability API error:', err);
		if (err?.status) throw err; // Re-throw SvelteKit errors
		throw error(500, 'Failed to fetch availability');
	}
};
