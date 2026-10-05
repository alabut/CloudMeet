/**
 * Monthly availability API endpoint
 * Returns which dates in a month have available slots
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getBusyTimes, getPrimaryCalendarEvents, getValidAccessToken } from '$lib/server/google-calendar';
import { getOutlookBusyTimes, getValidOutlookAccessToken } from '$lib/server/outlook-calendar';
import { generateAvailableSlots, createDateInTimezone, type TimeSlot } from '$lib/server/availability-slots';
import { calendarOutageBody, signalCalendarHealthcheckFailure } from '$lib/server/calendar-outage';
import {
	addCalendarDays,
	filterSlotsToBookingWindow,
	getBookingWindow,
	getConsumedPacificDates,
	PACIFIC_TIMEZONE
} from '$lib/server/booking-rules';
import { getPrimaryBlackoutDates } from '$lib/server/primary-calendar-blackouts';

export const GET: RequestHandler = async ({ url, platform }) => {
	const env = platform?.env;
	if (!env) {
		throw error(500, 'Platform env not available');
	}

	const eventSlug = url.searchParams.get('event');
	const month = url.searchParams.get('month'); // YYYY-MM

	if (!eventSlug || !month) {
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

		// Get calendar settings: use event type override if set, otherwise use global settings
		const availabilityCalendars = eventType.availability_calendars || userSettings.defaultAvailabilityCalendars || 'both';
		const useGoogleCalendar = availabilityCalendars === 'google' || availabilityCalendars === 'both';
		const useOutlookCalendar = availabilityCalendars === 'outlook' || availabilityCalendars === 'both';

		// Get all availability rules for this user
		const allRules = await db
			.prepare(
				`SELECT day_of_week, start_time, end_time
				FROM availability_rules
				WHERE user_id = ?
				ORDER BY day_of_week, start_time`
			)
			.bind(user.id)
			.all<{ day_of_week: number; start_time: string; end_time: string }>();

		// Group rules by day of week
		const rulesByDay = new Map<number, Array<{ start_time: string; end_time: string }>>();
		for (const rule of allRules.results || []) {
			if (!rulesByDay.has(rule.day_of_week)) {
				rulesByDay.set(rule.day_of_week, []);
			}
			rulesByDay.get(rule.day_of_week)!.push({ start_time: rule.start_time, end_time: rule.end_time });
		}

		// Parse month to get date range
		const [year, monthNum] = month.split('-').map(Number);
		const firstDay = new Date(year, monthNum - 1, 1);
		const lastDay = new Date(year, monthNum, 0);
		// Exclusive upper bound for calendar/booking queries: local midnight at
		// the START of the day AFTER the last day of the month. `lastDay` itself
		// is local midnight at the START of the last day, so using it directly
		// as a query end clips out virtually all of that day's events (only an
		// event starting exactly at midnight would fall inside the window). That
		// was silently hiding busy times on the last day of every month here -
		// see the commit message for how this was confirmed against a real
		// Google Calendar event.
		const rangeEnd = new Date(year, monthNum, 1);
		const bookingWindow = getBookingWindow();
		const windowStartDate = bookingWindow.start;
		const windowEndDate = bookingWindow.end;

		// Get busy times from connected calendars for the entire month
		let busySlots: TimeSlot[] = [];
		let googleAccessToken: string | null = null;
		const consumedDates = await getConsumedPacificDates(db, user.id);
		const rulesByDate = new Map<string, Array<{ start_time: string; end_time: string }>>();

		for (let day = 1; day <= lastDay.getDate(); day++) {
			const date = new Date(year, monthNum - 1, day);
			const dateStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
			const rules = rulesByDay.get(date.getDay());
			if (rules?.length) {
				rulesByDate.set(dateStr, rules);
			}
		}

		let primaryBlackoutDates = new Set<string>();

		try {
			googleAccessToken = await getValidAccessToken(
				db,
				user.id,
				env.GOOGLE_CLIENT_ID,
				env.GOOGLE_CLIENT_SECRET
			);
			const primaryEvents = await getPrimaryCalendarEvents(
				googleAccessToken,
				createDateInTimezone(`${year}-${String(monthNum).padStart(2, '0')}-01`, '00:00', PACIFIC_TIMEZONE),
				createDateInTimezone(`${rangeEnd.getFullYear()}-${String(rangeEnd.getMonth() + 1).padStart(2, '0')}-01`, '00:00', PACIFIC_TIMEZONE)
			);
			primaryBlackoutDates = getPrimaryBlackoutDates({ events: primaryEvents, rulesByDate });

			// Fetch Google Calendar busy times (if enabled)
			if (useGoogleCalendar) {
				// Use selected calendars if configured, otherwise query all
				const selectedCalendars = userSettings.selectedGoogleCalendars;
				const googleBusy = await getBusyTimes(googleAccessToken, firstDay, rangeEnd, selectedCalendars);
				busySlots.push(...googleBusy);
			}
		} catch (err) {
			console.error('Error fetching Google Calendar availability:', err);
			await signalCalendarHealthcheckFailure(env);
			return json(calendarOutageBody(), { status: 503 });
		}

		// Fetch Outlook Calendar busy times (if enabled and configured)
		if (useOutlookCalendar && env.MICROSOFT_CLIENT_ID && env.MICROSOFT_CLIENT_SECRET) {
			try {
				const outlookToken = await getValidOutlookAccessToken(
					db,
					user.id,
					env.MICROSOFT_CLIENT_ID,
					env.MICROSOFT_CLIENT_SECRET
				);
				const outlookBusy = await getOutlookBusyTimes(outlookToken, firstDay, rangeEnd);
				busySlots.push(...outlookBusy);
			} catch (err) {
				console.error('Error fetching Outlook Calendar busy times:', err);
			}
		}

		// Check each day in the month
		const availableDates: string[] = [];

		for (let day = 1; day <= lastDay.getDate(); day++) {
			const date = new Date(year, monthNum - 1, day);
			const dateStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

			const dayStart = createDateInTimezone(dateStr, '00:00', PACIFIC_TIMEZONE);
			const nextDayStart = createDateInTimezone(addCalendarDays(dateStr, 1), '00:00', PACIFIC_TIMEZONE);
			if (nextDayStart <= windowStartDate || dayStart >= windowEndDate) continue;
			if (consumedDates.has(dateStr) || primaryBlackoutDates.has(dateStr)) continue;

			const dayOfWeek = date.getDay();
			const rules = rulesByDay.get(dayOfWeek);

			// No availability rules for this day
			if (!rules || rules.length === 0) continue;

			// Check if at least one slot is available. Uses the same slot
			// generator as the day endpoint (see availability-slots.ts) so a date
			// only ever shows up here when the day endpoint would actually offer
			// a slot for it.
			const daySlots = filterSlotsToBookingWindow(generateAvailableSlots({
				dateStr,
				rules,
				timezone: userTimezone,
				durationMinutes: eventType.duration,
				busySlots
			}));

			if (daySlots.length > 0) {
				availableDates.push(dateStr);
			}
		}

		return json({ availableDates });
	} catch (err: any) {
		console.error('Monthly availability API error:', err);
		if (err?.status) throw err;
		throw error(500, 'Failed to fetch monthly availability');
	}
};
