/**
 * Reschedule Booking API endpoint
 * Reschedules a booking to a new time slot without requiring attendee to re-enter details
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createCalendarEvent, cancelCalendarEvent, getBusyTimes, getPrimaryCalendarEvents, getValidAccessToken } from '$lib/server/google-calendar';
import { sendRescheduleEmail, sendAdminRescheduleNotification, getEmailTemplates, isEmailEnabled } from '$lib/server/email';
import { invalidateAvailabilityCache } from '$lib/server/availability-cache';
import { buildCalendarEventDescription } from '$lib/server/calendar-event-description';
import { getConfiguredZoomMeetingUrl } from '$lib/server/zoom';
import { meetingJoinLabel } from '$lib/meeting';
import { createDateInTimezone } from '$lib/server/availability-slots';
import {
	addCalendarDays,
	assertStartInBookingWindow,
	claimPacificDateReservation,
	formatPacificDate,
	isPacificDateConsumed,
	PACIFIC_TIMEZONE,
	releaseBookingDateReservations
} from '$lib/server/booking-rules';
import { calendarOutageBody, signalCalendarHealthcheckFailure } from '$lib/server/calendar-outage';
import { getPrimaryBlackoutDates } from '$lib/server/primary-calendar-blackouts';

export const POST: RequestHandler = async ({ request, platform }) => {
	const env = platform?.env;
	if (!env) {
		throw error(500, 'Platform env not available');
	}

	try {
		const body = await request.json() as {
			bookingId: string;
			newStartTime: string;
			newEndTime: string;
			timezone?: string;
		};
		const { bookingId, newStartTime, newEndTime, timezone } = body;

		// Validate required fields
		if (!bookingId || !newStartTime || !newEndTime) {
			throw error(400, 'Missing required fields');
		}

		const db = env.DB;

		// Get the original booking with all details
		const originalBooking = await db
			.prepare(
				`SELECT b.id, b.user_id, b.event_type_id, b.start_time, b.end_time,
					b.attendee_name, b.attendee_email, b.attendee_notes, b.google_event_id,
					e.name as event_name, e.slug as event_slug, e.description as event_description,
					e.duration_minutes as duration, e.availability_calendars,
					u.id as host_user_id, u.name as host_name, u.email as host_email,
					u.contact_email, u.settings, u.brand_color, u.timezone
				FROM bookings b
				JOIN event_types e ON b.event_type_id = e.id
				JOIN users u ON b.user_id = u.id
				WHERE b.id = ? AND b.status IN ('confirmed', 'rescheduled')`
			)
			.bind(bookingId)
			.first<{
				id: string;
				user_id: string;
				event_type_id: string;
				start_time: string;
				end_time: string;
				attendee_name: string;
				attendee_email: string;
				attendee_notes: string | null;
				google_event_id: string | null;
				event_name: string;
				event_slug: string;
				event_description: string | null;
				duration: number;
				availability_calendars: string | null;
				host_user_id: string;
				host_name: string;
				host_email: string;
				contact_email: string | null;
				settings: string | null;
				brand_color: string | null;
				timezone: string | null;
			}>();

		if (!originalBooking) {
			throw error(404, 'Booking not found or already cancelled');
		}

		let userSettings: { defaultAvailabilityCalendars?: string; selectedGoogleCalendars?: string[] } = {};
		try {
			userSettings = originalBooking.settings ? JSON.parse(originalBooking.settings) : {};
		} catch {
			userSettings = {};
		}
		const availabilityCalendars = originalBooking.availability_calendars || userSettings.defaultAvailabilityCalendars || 'both';
		const useGoogleCalendar = availabilityCalendars === 'google' || availabilityCalendars === 'both';

		const newStartDateTime = new Date(newStartTime);
		const newEndDateTime = new Date(newEndTime);
		const oldStartDateTime = new Date(originalBooking.start_time);
		const oldEndDateTime = new Date(originalBooking.end_time);
		assertStartInBookingWindow(newStartTime);
		const sourcePacificDate = formatPacificDate(oldStartDateTime);
		const destinationPacificDate = formatPacificDate(newStartDateTime);

		// Check for conflicts with existing bookings (excluding the original booking)
		const conflict = await db
			.prepare(
				`SELECT id FROM bookings
				WHERE user_id = ? AND status = 'confirmed' AND id != ?
				AND (
					(start_time <= ? AND end_time > ?)
					OR (start_time < ? AND end_time >= ?)
					OR (start_time >= ? AND end_time <= ?)
				)`
			)
			.bind(
				originalBooking.user_id,
				bookingId,
				newStartTime, newStartTime,
				newEndTime, newEndTime,
				newStartTime, newEndTime
			)
			.first();

		if (conflict) {
			throw error(409, 'This time slot is no longer available');
		}

		if (
			destinationPacificDate !== sourcePacificDate &&
			await isPacificDateConsumed(db, originalBooking.user_id, destinationPacificDate, { excludeBookingId: bookingId })
		) {
			throw error(409, 'This date is no longer available');
		}
		const matchingProposalReservation = destinationPacificDate !== sourcePacificDate
			? await db
					.prepare(
						`SELECT r.proposal_id
						FROM booking_date_reservations r
						JOIN reschedule_proposals p ON p.id = r.proposal_id
						WHERE r.user_id = ? AND r.pacific_date = ? AND r.released_at IS NULL
						AND p.booking_id = ? AND p.status = 'pending'
						LIMIT 1`
					)
					.bind(originalBooking.user_id, destinationPacificDate, bookingId)
					.first<{ proposal_id: string }>()
			: null;

		// Cancel old Google Calendar event and create new one with recurring Zoom link
		let newCalendarEventId: string | null = null;
		const zoomUrl = getConfiguredZoomMeetingUrl(env);
		let newMeetingUrl: string | null = zoomUrl;
		let destinationReservationClaimed = false;
		let accessToken = '';

		try {
			accessToken = await getValidAccessToken(
				db,
				originalBooking.user_id,
				env.GOOGLE_CLIENT_ID,
				env.GOOGLE_CLIENT_SECRET
			);

			const availabilityRules = await db
				.prepare(
					`SELECT start_time, end_time
					FROM availability_rules
					WHERE user_id = ? AND day_of_week = ?
					ORDER BY start_time`
				)
				.bind(originalBooking.user_id, new Date(`${destinationPacificDate}T00:00:00Z`).getUTCDay())
				.all<{ start_time: string; end_time: string }>();

			const primaryEvents = await getPrimaryCalendarEvents(
				accessToken,
				createDateInTimezone(destinationPacificDate, '00:00', PACIFIC_TIMEZONE),
				createDateInTimezone(addCalendarDays(destinationPacificDate, 1), '00:00', PACIFIC_TIMEZONE)
			);
			const blackoutDates = getPrimaryBlackoutDates({
				events: primaryEvents,
				rulesByDate: new Map([[destinationPacificDate, availabilityRules.results || []]]),
				availabilityTimezone: originalBooking.timezone || PACIFIC_TIMEZONE
			});
			if (blackoutDates.has(destinationPacificDate)) {
				throw error(409, 'This date is no longer available');
			}
			if (useGoogleCalendar) {
				const googleBusy = await getBusyTimes(
					accessToken,
					newStartDateTime,
					newEndDateTime,
					userSettings.selectedGoogleCalendars
				);
				if (googleBusy.length > 0) {
					throw error(409, 'This time slot is no longer available');
				}
			}
		} catch (err: any) {
			if (err?.status === 409) throw err;
			console.error('Error checking primary Google Calendar:', err);
			await signalCalendarHealthcheckFailure(env);
			return json(calendarOutageBody(), { status: 503 });
		}

		try {
			if (destinationPacificDate !== sourcePacificDate && !matchingProposalReservation) {
				await claimPacificDateReservation(db, {
					userId: originalBooking.user_id,
					pacificDate: destinationPacificDate,
					bookingId,
					kind: 'booking'
				});
				destinationReservationClaimed = true;
			}

			// Create new calendar event (Zoom location, no Google Meet conference)
			const calendarEvent = await createCalendarEvent(accessToken, {
				summary: `${originalBooking.event_name} with ${originalBooking.attendee_name}`,
				description: buildCalendarEventDescription({
					eventDescription: originalBooking.event_description,
					attendeeName: originalBooking.attendee_name,
					attendeeEmail: originalBooking.attendee_email,
					attendeeNotes: originalBooking.attendee_notes,
					bookingId: originalBooking.id,
					appUrl: env.APP_URL,
					meetingUrl: zoomUrl,
					meetingJoinLabel: meetingJoinLabel('zoom')
				}),
				location: zoomUrl,
				start: {
					dateTime: newStartDateTime.toISOString(),
					timeZone: 'UTC'
				},
				end: {
					dateTime: newEndDateTime.toISOString(),
					timeZone: 'UTC'
				},
				attendees: [
					{ email: originalBooking.attendee_email }
				]
			});

			newCalendarEventId = calendarEvent.id;
		} catch (err: any) {
			if (destinationReservationClaimed) {
				await releaseBookingDateReservations(db, { bookingId, pacificDate: destinationPacificDate });
			}
			if (err?.status === 409) throw err;
			console.error('Error with Google Calendar:', err);
			const detail = err instanceof Error ? err.message : String(err);
			if (detail.includes('invalid_grant') || detail.includes('expired or revoked')) {
				throw error(
					503,
					'Google Calendar access expired. The host needs to reconnect Google before this meeting can be rescheduled.'
				);
			}
			throw error(503, 'Could not update the Google Calendar invitation. Please try again.');
		}

		try {
			const bookingMoved = `EXISTS (
				SELECT 1 FROM bookings
				WHERE id = ? AND status = 'confirmed' AND start_time = ?
			)`;
			const stateStatements = [];
			if (matchingProposalReservation?.proposal_id) {
				stateStatements.push(
					db
						.prepare(
							`UPDATE booking_date_reservations
							SET booking_id = ?, proposal_id = NULL, kind = 'booking'
							WHERE proposal_id = ? AND pacific_date = ? AND released_at IS NULL
							AND proposal_id IN (
								SELECT id FROM reschedule_proposals
								WHERE booking_id = ? AND status = 'pending'
							)
							AND EXISTS (
								SELECT 1 FROM bookings
								WHERE id = ? AND status IN ('confirmed', 'rescheduled') AND start_time = ?
							)`
						)
						.bind(
							bookingId,
							matchingProposalReservation.proposal_id,
							destinationPacificDate,
							bookingId,
							bookingId,
							originalBooking.start_time
						)
				);
			}
			const destinationReservationGuard = destinationPacificDate !== sourcePacificDate
				? `AND EXISTS (
					SELECT 1 FROM booking_date_reservations
					WHERE booking_id = ? AND pacific_date = ? AND kind = 'booking' AND released_at IS NULL
				)`
				: '';
			const bookingUpdateIndex = stateStatements.length;
			stateStatements.push(
				db
					.prepare(
						`UPDATE bookings SET
							start_time = ?,
							end_time = ?,
							google_event_id = ?,
							meeting_url = ?,
							status = 'confirmed'
						WHERE id = ? AND status IN ('confirmed', 'rescheduled') AND start_time = ?
						${destinationReservationGuard}`
					)
					.bind(
						newStartTime,
						newEndTime,
						newCalendarEventId,
						newMeetingUrl,
						bookingId,
						originalBooking.start_time,
						...(destinationPacificDate !== sourcePacificDate ? [bookingId, destinationPacificDate] : [])
					)
			);

			if (destinationPacificDate !== sourcePacificDate) {
				stateStatements.push(
					db
						.prepare(
							`UPDATE booking_date_reservations
							SET released_at = CURRENT_TIMESTAMP
							WHERE booking_id = ? AND pacific_date = ? AND released_at IS NULL
							AND ${bookingMoved}`
						)
						.bind(bookingId, sourcePacificDate, bookingId, newStartTime)
				);
			}

			stateStatements.push(
				db
					.prepare(
						`UPDATE booking_date_reservations
						SET released_at = CURRENT_TIMESTAMP
						WHERE released_at IS NULL AND proposal_id IN (
							SELECT id FROM reschedule_proposals WHERE booking_id = ? AND status = 'pending'
						)
						AND ${bookingMoved}`
					)
					.bind(bookingId, bookingId, newStartTime),
				db
					.prepare(
						`UPDATE reschedule_proposals
						SET status = 'counter_proposed', responded_at = CURRENT_TIMESTAMP
						WHERE booking_id = ? AND status = 'pending' AND ${bookingMoved}`
					)
					.bind(bookingId, bookingId, newStartTime)
			);

			const stateResults = await db.batch(stateStatements);
			if (stateResults[bookingUpdateIndex]?.meta?.changes === 0) {
				throw error(409, 'Booking is no longer available to reschedule');
			}
		} catch (err) {
			if (accessToken && newCalendarEventId) {
				try {
					await cancelCalendarEvent(accessToken, newCalendarEventId);
				} catch (cleanupErr) {
					console.error('Failed to remove uncommitted rescheduled calendar event:', cleanupErr);
				}
			}
			if (destinationReservationClaimed) {
				await releaseBookingDateReservations(db, { bookingId, pacificDate: destinationPacificDate });
			}
			if (err && typeof err === 'object' && 'status' in err) {
				throw err;
			}
			console.error('Error updating rescheduled booking:', err);
			const detail = err instanceof Error ? err.message : String(err);
			if (detail.includes('invalid_grant') || detail.includes('expired or revoked')) {
				throw error(
					503,
					'Google Calendar access expired. The host needs to reconnect Google before this meeting can be rescheduled.'
				);
			}
			throw error(500, 'Failed to reschedule booking');
		}

		// Cancel the old calendar event only after the new booking state is committed,
		// so a lost race never leaves a live booking without its invitation.
		if (originalBooking.google_event_id) {
			try {
				await cancelCalendarEvent(accessToken, originalBooking.google_event_id);
			} catch (err) {
				console.error('Error cancelling old Google Calendar event:', err);
			}
		}

		// Cancel any old scheduled reminder emails and create new ones
		await db
			.prepare(`UPDATE scheduled_emails SET status = 'cancelled' WHERE booking_id = ? AND status = 'pending'`)
			.bind(bookingId)
			.run();

		// Invalidate availability cache (both month grid and per-day slots)
		await invalidateAvailabilityCache(env.KV);

		// Send reschedule email (not cancellation email!)
		if (env.EMAILIT_API_KEY) {
			try {
				// Parse user settings for time format
				let timeFormat: '12h' | '24h' = '12h';
				try {
					const settings = originalBooking.settings ? JSON.parse(originalBooking.settings) : {};
					timeFormat = settings.timeFormat === '24h' ? '24h' : '12h';
				} catch {
					// Keep default
				}

				const replyToEmail = originalBooking.contact_email || originalBooking.host_email;
				const templates = await getEmailTemplates(db, originalBooking.user_id);

				// Check if reschedule email template is enabled (default to true)
				if (isEmailEnabled(templates, 'reschedule')) {
					const template = templates.get('reschedule');
					await sendRescheduleEmail(
						{
							attendeeName: originalBooking.attendee_name,
							attendeeEmail: originalBooking.attendee_email,
							eventName: originalBooking.event_name,
							eventDescription: originalBooking.event_description || '',
							startTime: newStartDateTime,
							endTime: newEndDateTime,
							oldStartTime: oldStartDateTime,
							oldEndTime: oldEndDateTime,
							meetingUrl: newMeetingUrl,
							meetingType: 'zoom',
							bookingId: originalBooking.id,
							hostName: originalBooking.host_name,
							hostEmail: originalBooking.host_email,
							hostContactEmail: originalBooking.contact_email || undefined,
							appUrl: env.APP_URL || '',
							timeFormat,
							timezone: timezone || 'UTC',
							brandColor: originalBooking.brand_color || undefined,
							attendeeNotes: originalBooking.attendee_notes
						},
						{
							apiKey: env.EMAILIT_API_KEY,
							from: env.EMAIL_FROM || originalBooking.host_email,
							replyTo: replyToEmail
						},
						template?.subject || undefined
					);
				}

				// Send admin notification
				try {
					await sendAdminRescheduleNotification(
						{
							attendeeName: originalBooking.attendee_name,
							attendeeEmail: originalBooking.attendee_email,
							eventName: originalBooking.event_name,
							eventDescription: originalBooking.event_description || '',
							startTime: newStartDateTime,
							endTime: newEndDateTime,
							oldStartTime: oldStartDateTime,
							oldEndTime: oldEndDateTime,
							meetingUrl: newMeetingUrl,
							meetingType: 'zoom',
							bookingId: originalBooking.id,
							hostName: originalBooking.host_name,
							hostEmail: originalBooking.host_email,
							appUrl: env.APP_URL || '',
							timeFormat,
							timezone: timezone || 'UTC',
							brandColor: originalBooking.brand_color || undefined,
							attendeeNotes: originalBooking.attendee_notes
						},
						originalBooking.host_email,
						{
							apiKey: env.EMAILIT_API_KEY,
							from: env.EMAIL_FROM || originalBooking.host_email
						}
					);
				} catch (adminEmailErr) {
					console.error('Failed to send admin reschedule notification:', adminEmailErr);
				}

				// Schedule new reminder emails
				const reminderTypes = ['reminder_24h', 'reminder_1h'] as const;
				const reminderOffsets: Record<string, number> = {
					'reminder_24h': 24 * 60 * 60 * 1000,
					'reminder_1h': 60 * 60 * 1000
				};

				for (const reminderType of reminderTypes) {
					if (isEmailEnabled(templates, reminderType)) {
						const scheduledFor = new Date(newStartDateTime.getTime() - reminderOffsets[reminderType]);
						if (scheduledFor > new Date()) {
							await db
								.prepare(`INSERT INTO scheduled_emails (booking_id, template_type, scheduled_for) VALUES (?, ?, ?)`)
								.bind(bookingId, reminderType, scheduledFor.toISOString())
								.run();
						}
					}
				}
			} catch (emailError) {
				console.error('Failed to send reschedule email:', emailError);
			}
		}

		return json({
			success: true,
			bookingId,
			meetingUrl: newMeetingUrl,
			meetingType: 'zoom'
		});
	} catch (err: any) {
		console.error('Reschedule error:', err);
		if (err?.status) throw err;
		throw error(500, 'Failed to reschedule booking');
	}
};
