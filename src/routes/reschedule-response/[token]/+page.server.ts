/**
 * Reschedule proposal response page
 * Allows attendee to accept, decline, or counter-propose
 */

import { error, redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { createCalendarEvent, cancelCalendarEvent, getBusyTimes, getPrimaryCalendarEvents, getValidAccessToken } from '$lib/server/google-calendar';
import { sendAdminRescheduleNotification, sendAdminCancellationNotification } from '$lib/server/email';
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
	closePendingRescheduleProposals,
	releaseBookingDateReservations
} from '$lib/server/booking-rules';
import { getPrimaryBlackoutDates } from '$lib/server/primary-calendar-blackouts';
import { signalCalendarHealthcheckFailure } from '$lib/server/calendar-outage';
import {
	getProposalPreviewRecord,
	isLocalPreviewProposal,
	parseProposalPreviewState
} from '$lib/preview/sampleBooking';

export const load: PageServerLoad = async ({ params, url, platform }) => {
	const token = params.token;
	const action = url.searchParams.get('action');

	if (isLocalPreviewProposal(token, url.hostname)) {
		const previewState = parseProposalPreviewState(url.searchParams.get('preview'));
		if (url.searchParams.get('preview') && !previewState) {
			throw error(404, 'Not found');
		}

		const state = previewState ?? 'pending';
		const proposal = getProposalPreviewRecord(
			state,
			state !== 'pending-no-message'
		);

		const alreadyResponded =
			state === 'already-accepted' ||
			state === 'already-declined' ||
			proposal.status !== 'pending';

		return {
			proposal,
			alreadyResponded,
			action: state === 'counter' ? 'counter' : action,
			isPreview: true,
			previewState: state
		};
	}

	const db = platform?.env?.DB;
	if (!db) {
		throw error(500, 'Database not available');
	}

	// Get the proposal
	const proposal = await db
		.prepare(
			`SELECT p.id, p.booking_id, p.proposed_start_time, p.proposed_end_time, p.message, p.status, p.proposed_by,
				p.expires_at, CASE WHEN p.expires_at IS NOT NULL AND p.expires_at <= CURRENT_TIMESTAMP THEN 1 ELSE 0 END as is_expired,
				b.attendee_name, b.attendee_email, b.start_time as original_start_time, b.end_time as original_end_time,
				b.status as booking_status,
				b.google_event_id, b.attendee_notes,
				e.name as event_name, e.slug as event_slug, e.duration_minutes,
				e.availability_calendars,
				u.id as user_id, u.name as host_name, u.email as host_email, u.brand_color, u.settings, u.timezone
			FROM reschedule_proposals p
			JOIN bookings b ON p.booking_id = b.id
			JOIN event_types e ON b.event_type_id = e.id
			JOIN users u ON b.user_id = u.id
			WHERE p.response_token = ?`
		)
		.bind(token)
		.first<{
			id: string;
			booking_id: string;
			proposed_start_time: string;
			proposed_end_time: string;
			message: string | null;
			status: string;
			proposed_by: string;
			expires_at: string | null;
			is_expired: number;
			attendee_name: string;
			attendee_email: string;
			original_start_time: string;
			original_end_time: string;
			booking_status: string;
			google_event_id: string | null;
			attendee_notes: string | null;
			event_name: string;
			event_slug: string;
			duration_minutes: number;
			user_id: string;
			host_name: string;
			host_email: string;
			brand_color: string | null;
			settings: string | null;
		}>();

	if (!proposal) {
		throw error(404, 'Reschedule proposal not found or has expired');
	}
	if (proposal.status === 'pending' && (proposal.is_expired || proposal.booking_status !== 'rescheduled')) {
		await closePendingRescheduleProposals(db, proposal.booking_id, 'expired');
		proposal.status = 'expired';
	}

	if (proposal.status !== 'pending') {
		return {
			proposal,
			alreadyResponded: true,
			action,
			isPreview: false,
			previewState: null
		};
	}

	return {
		proposal,
		alreadyResponded: false,
		action,
		isPreview: false,
		previewState: null
	};
};

export const actions: Actions = {
	accept: async ({ params, platform, url }) => {
		const token = params.token;

		if (isLocalPreviewProposal(token, url.hostname)) {
			return fail(400, { error: 'Preview mode cannot accept proposals' });
		}

		const db = platform?.env?.DB;
		const env = platform?.env;
		if (!db || !env) {
			return fail(500, { error: 'Database not available' });
		}

		try {
			// Get proposal details
			const proposal = await db
				.prepare(
					`SELECT p.id, p.booking_id, p.proposed_start_time, p.proposed_end_time, p.status, p.expires_at,
						CASE WHEN p.expires_at IS NOT NULL AND p.expires_at <= CURRENT_TIMESTAMP THEN 1 ELSE 0 END as is_expired,
						b.attendee_name, b.attendee_email, b.google_event_id, b.attendee_notes,
						b.start_time as original_start_time, b.end_time as original_end_time,
						b.status as booking_status,
						e.id as event_type_id, e.name as event_name, e.description as event_description, e.duration_minutes,
						e.availability_calendars,
						u.id as user_id, u.name as host_name, u.email as host_email, u.contact_email, u.brand_color, u.settings, u.timezone
					FROM reschedule_proposals p
					JOIN bookings b ON p.booking_id = b.id
					JOIN event_types e ON b.event_type_id = e.id
					JOIN users u ON b.user_id = u.id
					WHERE p.response_token = ?`
				)
				.bind(token)
				.first<{
					id: string;
					booking_id: string;
					proposed_start_time: string;
					proposed_end_time: string;
					status: string;
					expires_at: string | null;
					is_expired: number;
					attendee_name: string;
					attendee_email: string;
					google_event_id: string | null;
					attendee_notes: string | null;
					original_start_time: string;
					original_end_time: string;
					booking_status: string;
					event_type_id: string;
					event_name: string;
					event_description: string | null;
					duration_minutes: number;
					availability_calendars: string | null;
					user_id: string;
					host_name: string;
					host_email: string;
					contact_email: string | null;
					brand_color: string | null;
					settings: string | null;
					timezone: string | null;
				}>();

			if (!proposal || proposal.status !== 'pending') {
				return fail(400, { error: 'Proposal already responded to or expired' });
			}

			if (proposal.is_expired || proposal.booking_status !== 'rescheduled') {
				await closePendingRescheduleProposals(db, proposal.booking_id, 'expired');
				return fail(409, { error: 'This reschedule proposal is no longer available' });
			}

			try {
				assertStartInBookingWindow(proposal.proposed_start_time);
			} catch {
				await closePendingRescheduleProposals(db, proposal.booking_id, 'expired');
				return fail(409, { error: 'This time is outside the booking window' });
			}
			const sourcePacificDate = formatPacificDate(new Date(proposal.original_start_time));
			const destinationPacificDate = formatPacificDate(new Date(proposal.proposed_start_time));
			if (
				destinationPacificDate !== sourcePacificDate &&
				await isPacificDateConsumed(db, proposal.user_id, destinationPacificDate, {
					excludeBookingId: proposal.booking_id,
					excludeProposalId: proposal.id
				})
			) {
				return fail(409, { error: 'This date is no longer available' });
			}

			const stillPending = await db
				.prepare(
					`SELECT 1
					FROM reschedule_proposals p
					JOIN bookings b ON b.id = p.booking_id
					WHERE p.id = ? AND p.status = 'pending' AND b.status = 'rescheduled'
					AND (p.expires_at IS NULL OR p.expires_at > CURRENT_TIMESTAMP)`
				)
				.bind(proposal.id)
				.first();
			if (!stillPending) {
				await closePendingRescheduleProposals(db, proposal.booking_id, 'expired');
				return fail(409, { error: 'This reschedule proposal is no longer available' });
			}

			let userSettings: { defaultAvailabilityCalendars?: string; selectedGoogleCalendars?: string[] } = {};
			try {
				userSettings = proposal.settings ? JSON.parse(proposal.settings) : {};
			} catch {
				userSettings = {};
			}
			const availabilityCalendars = proposal.availability_calendars || userSettings.defaultAvailabilityCalendars || 'both';
			const useGoogleCalendar = availabilityCalendars === 'google' || availabilityCalendars === 'both';
			try {
				const accessToken = await getValidAccessToken(
					db,
					proposal.user_id,
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
					.bind(proposal.user_id, new Date(`${destinationPacificDate}T00:00:00Z`).getUTCDay())
					.all<{ start_time: string; end_time: string }>();
				const primaryEvents = await getPrimaryCalendarEvents(
					accessToken,
					createDateInTimezone(destinationPacificDate, '00:00', PACIFIC_TIMEZONE),
					createDateInTimezone(addCalendarDays(destinationPacificDate, 1), '00:00', PACIFIC_TIMEZONE)
				);
				const blackoutDates = getPrimaryBlackoutDates({
					events: primaryEvents,
					rulesByDate: new Map([[destinationPacificDate, availabilityRules.results || []]]),
					availabilityTimezone: proposal.timezone || PACIFIC_TIMEZONE
				});
				if (blackoutDates.has(destinationPacificDate)) {
					return fail(409, { error: 'This date is no longer available' });
				}
				if (useGoogleCalendar) {
					const busy = await getBusyTimes(
						accessToken,
						new Date(proposal.proposed_start_time),
						new Date(proposal.proposed_end_time),
						userSettings.selectedGoogleCalendars
					);
					if (busy.length > 0) {
						return fail(409, { error: 'This time slot is no longer available' });
					}
				}
			} catch (err) {
				console.error('Failed to verify primary calendar before accepting proposal:', err);
				await signalCalendarHealthcheckFailure(env);
				return fail(503, {
					error:
						'Availability is temporarily unavailable because the host calendar could not be checked. Please try again soon.'
				});
			}

			let proposalReservationClaimed = false;
			if (destinationPacificDate !== sourcePacificDate) {
				const ownReservation = await db
					.prepare(
						`SELECT id FROM booking_date_reservations
						WHERE proposal_id = ? AND pacific_date = ? AND released_at IS NULL`
					)
					.bind(proposal.id, destinationPacificDate)
					.first();
				if (!ownReservation) {
					try {
						await claimPacificDateReservation(db, {
							userId: proposal.user_id,
							pacificDate: destinationPacificDate,
							proposalId: proposal.id,
							kind: 'proposal'
						});
						proposalReservationClaimed = true;
					} catch (err: any) {
						if (err?.status === 409) return fail(409, { error: 'This date is no longer available' });
						throw err;
					}
				}
			}

			// Create new Google Calendar event with recurring Zoom link
			const zoomUrl = getConfiguredZoomMeetingUrl(env);
			let newMeetingUrl: string | null = zoomUrl;
			let newGoogleEventId: string | null = null;
			let eventAccessToken: string | null = null;

			try {
				eventAccessToken = await getValidAccessToken(
					db,
					proposal.user_id,
					env.GOOGLE_CLIENT_ID,
					env.GOOGLE_CLIENT_SECRET
				);

				const calendarEvent = await createCalendarEvent(eventAccessToken, {
					summary: `${proposal.event_name} with ${proposal.attendee_name}`,
					description: buildCalendarEventDescription({
						eventDescription: proposal.event_description,
						attendeeName: proposal.attendee_name,
						attendeeEmail: proposal.attendee_email,
						attendeeNotes: proposal.attendee_notes,
						bookingId: proposal.booking_id,
						appUrl: env.APP_URL,
						meetingUrl: zoomUrl,
						meetingJoinLabel: meetingJoinLabel('zoom')
					}),
					location: zoomUrl,
					start: {
						dateTime: new Date(proposal.proposed_start_time).toISOString(),
						timeZone: 'UTC'
					},
					end: {
						dateTime: new Date(proposal.proposed_end_time).toISOString(),
						timeZone: 'UTC'
					},
					attendees: [{ email: proposal.attendee_email }]
				});

				newGoogleEventId = calendarEvent.id;
			} catch (err) {
				console.error('Failed to create new calendar event:', err);
				return fail(503, {
					error:
						'Google Calendar could not be updated. The host may need to reconnect Google Calendar.'
				});
			}

			const acceptStatements = [
				db
					.prepare(
						`UPDATE reschedule_proposals
						SET status = 'accepted', responded_at = CURRENT_TIMESTAMP
						WHERE id = ? AND status = 'pending'
						AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
						AND EXISTS (SELECT 1 FROM bookings WHERE id = ? AND status = 'rescheduled')`
					)
					.bind(proposal.id, proposal.booking_id),
				db
					.prepare(
						`UPDATE bookings
						SET start_time = ?, end_time = ?, status = 'confirmed', google_event_id = ?, meeting_url = ?
						WHERE id = ? AND status = 'rescheduled'
						AND EXISTS (SELECT 1 FROM reschedule_proposals WHERE id = ? AND status = 'accepted')`
					)
					.bind(
						proposal.proposed_start_time,
						proposal.proposed_end_time,
						newGoogleEventId,
						newMeetingUrl,
						proposal.booking_id,
						proposal.id
					),
				db
					.prepare(
						`UPDATE booking_date_reservations
						SET booking_id = ?, proposal_id = NULL, kind = 'booking'
						WHERE proposal_id = ? AND released_at IS NULL
						AND EXISTS (SELECT 1 FROM reschedule_proposals WHERE id = ? AND status = 'accepted')`
					)
					.bind(proposal.booking_id, proposal.id, proposal.id),
				...(destinationPacificDate !== sourcePacificDate
					? [
							db
								.prepare(
									`UPDATE booking_date_reservations
									SET released_at = CURRENT_TIMESTAMP
									WHERE booking_id = ? AND pacific_date = ? AND released_at IS NULL
									AND EXISTS (SELECT 1 FROM reschedule_proposals WHERE id = ? AND status = 'accepted')`
								)
								.bind(proposal.booking_id, sourcePacificDate, proposal.id)
						]
					: []),
				db
					.prepare(
						`UPDATE booking_date_reservations
						SET released_at = CURRENT_TIMESTAMP
						WHERE released_at IS NULL AND proposal_id IN (
							SELECT id FROM reschedule_proposals WHERE booking_id = ? AND status = 'pending'
						)
						AND EXISTS (SELECT 1 FROM reschedule_proposals WHERE id = ? AND status = 'accepted')`
					)
					.bind(proposal.booking_id, proposal.id),
				db
					.prepare(
						`UPDATE reschedule_proposals
						SET status = 'counter_proposed', responded_at = CURRENT_TIMESTAMP
						WHERE booking_id = ? AND status = 'pending'
						AND EXISTS (SELECT 1 FROM reschedule_proposals WHERE id = ? AND status = 'accepted')`
					)
					.bind(proposal.booking_id, proposal.id)
			];

			let acceptResults;
			try {
				acceptResults = await db.batch(acceptStatements);
			} catch (err) {
				if (eventAccessToken && newGoogleEventId) {
					try {
						await cancelCalendarEvent(eventAccessToken, newGoogleEventId);
					} catch (cleanupErr) {
						console.error('Failed to remove uncommitted rescheduled calendar event:', cleanupErr);
					}
				}
				throw err;
			}
			if (acceptResults[0]?.meta?.changes === 0) {
				if (eventAccessToken && newGoogleEventId) {
					try {
						await cancelCalendarEvent(eventAccessToken, newGoogleEventId);
					} catch (cleanupErr) {
						console.error('Failed to remove uncommitted rescheduled calendar event:', cleanupErr);
					}
				}
				if (proposalReservationClaimed) {
					await releaseBookingDateReservations(db, { proposalId: proposal.id });
				}
				return fail(409, { error: 'This reschedule proposal is no longer available' });
			}

			// Cancel the old calendar event only after the accepted state is committed,
			// so a lost race never leaves a live booking without its invitation.
			if (proposal.google_event_id && eventAccessToken) {
				try {
					await cancelCalendarEvent(eventAccessToken, proposal.google_event_id);
				} catch (err) {
					console.error('Failed to cancel old calendar event:', err);
				}
			}

			// Send admin notification about accepted reschedule
			if (env.EMAILIT_API_KEY) {
				try {
					let timeFormat: '12h' | '24h' = '12h';
					try {
						const settings = proposal.settings ? JSON.parse(proposal.settings) : {};
						timeFormat = settings.timeFormat === '24h' ? '24h' : '12h';
					} catch {
						// Keep default
					}

					await sendAdminRescheduleNotification(
						{
							attendeeName: proposal.attendee_name,
							attendeeEmail: proposal.attendee_email,
							eventName: proposal.event_name,
							eventDescription: proposal.event_description || '',
							startTime: new Date(proposal.proposed_start_time),
							endTime: new Date(proposal.proposed_end_time),
							oldStartTime: new Date(proposal.original_start_time),
							oldEndTime: new Date(proposal.original_end_time),
							meetingUrl: newMeetingUrl,
							meetingType: 'zoom',
							bookingId: proposal.booking_id,
							hostName: proposal.host_name,
							hostEmail: proposal.host_email,
							appUrl: env.APP_URL || '',
							timeFormat,
							brandColor: proposal.brand_color || '#3b82f6',
							attendeeNotes: proposal.attendee_notes
						},
						proposal.host_email,
						{
							apiKey: env.EMAILIT_API_KEY,
							from: env.EMAIL_FROM || proposal.host_email
						}
					);
				} catch (emailErr) {
					console.error('Failed to send admin reschedule notification:', emailErr);
				}
			}

			throw redirect(303, `/reschedule-response/${token}?success=accepted`);
		} catch (err: unknown) {
			if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 303) {
				throw err;
			}
			console.error('Accept proposal error:', err);
			return fail(500, { error: 'Failed to accept proposal' });
		}
	},

	decline: async ({ params, platform, url }) => {
		const token = params.token;

		if (isLocalPreviewProposal(token, url.hostname)) {
			return fail(400, { error: 'Preview mode cannot decline proposals' });
		}

		const db = platform?.env?.DB;
		const env = platform?.env;
		if (!db || !env) {
			return fail(500, { error: 'Database not available' });
		}

		try {
			const proposal = await db
				.prepare(
					`SELECT p.id, p.booking_id, p.status, p.proposed_start_time, p.proposed_end_time,
					b.google_event_id, b.attendee_name, b.attendee_email, b.attendee_notes,
					b.start_time as original_start_time, b.end_time as original_end_time,
					e.name as event_name, e.description as event_description,
					u.id as user_id, u.name as host_name, u.email as host_email, u.brand_color, u.settings
					FROM reschedule_proposals p
					JOIN bookings b ON p.booking_id = b.id
					JOIN event_types e ON b.event_type_id = e.id
					JOIN users u ON b.user_id = u.id
					WHERE p.response_token = ?`
				)
				.bind(token)
				.first<{
					id: string;
					booking_id: string;
					status: string;
					proposed_start_time: string;
					proposed_end_time: string;
					google_event_id: string | null;
					attendee_name: string;
					attendee_email: string;
					attendee_notes: string | null;
					original_start_time: string;
					original_end_time: string;
					event_name: string;
					event_description: string | null;
					user_id: string;
					host_name: string;
					host_email: string;
					brand_color: string | null;
					settings: string | null;
				}>();

			if (!proposal || proposal.status !== 'pending') {
				return fail(400, { error: 'Proposal already responded to or expired' });
			}

			if (proposal.google_event_id) {
				try {
					const accessToken = await getValidAccessToken(
						db,
						proposal.user_id,
						env.GOOGLE_CLIENT_ID,
						env.GOOGLE_CLIENT_SECRET
					);
					await cancelCalendarEvent(accessToken, proposal.google_event_id);
				} catch (err) {
					console.error('Failed to cancel calendar event:', err);
				}
			}

			await db
				.prepare(
					`UPDATE bookings SET status = 'canceled', canceled_at = CURRENT_TIMESTAMP, canceled_by = 'attendee' WHERE id = ?`
				)
				.bind(proposal.booking_id)
				.run();

			await db
				.prepare(
					`UPDATE reschedule_proposals SET status = 'declined', responded_at = CURRENT_TIMESTAMP WHERE id = ?`
				)
				.bind(proposal.id)
				.run();

			await releaseBookingDateReservations(db, { proposalId: proposal.id });

			if (env.EMAILIT_API_KEY) {
				try {
					let timeFormat: '12h' | '24h' = '12h';
					try {
						const settings = proposal.settings ? JSON.parse(proposal.settings) : {};
						timeFormat = settings.timeFormat === '24h' ? '24h' : '12h';
					} catch {
						// Keep default
					}

					await sendAdminCancellationNotification(
						{
							attendeeName: proposal.attendee_name,
							attendeeEmail: proposal.attendee_email,
							eventName: proposal.event_name,
							eventDescription: proposal.event_description || '',
							startTime: new Date(proposal.original_start_time),
							endTime: new Date(proposal.original_end_time),
							meetingUrl: null,
							bookingId: proposal.booking_id,
							hostName: proposal.host_name,
							hostEmail: proposal.host_email,
							appUrl: env.APP_URL || '',
							timeFormat,
							brandColor: proposal.brand_color || '#3b82f6',
							attendeeNotes: proposal.attendee_notes,
							customMessage:
								'Attendee declined the reschedule proposal and cancelled the meeting.'
						},
						proposal.host_email,
						{
							apiKey: env.EMAILIT_API_KEY,
							from: env.EMAIL_FROM || proposal.host_email
						}
					);
				} catch (emailErr) {
					console.error('Failed to send admin cancellation notification:', emailErr);
				}
			}

			throw redirect(303, `/reschedule-response/${token}?success=declined`);
		} catch (err: unknown) {
			if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 303) {
				throw err;
			}
			console.error('Decline proposal error:', err);
			return fail(500, { error: 'Failed to decline proposal' });
		}
	}
};
