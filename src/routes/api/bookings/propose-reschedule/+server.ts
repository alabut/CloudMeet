/**
 * Host-initiated reschedule proposal API endpoint
 * Creates a reschedule proposal and sends email to attendee
 */

import { json, error, type RequestEvent } from '@sveltejs/kit';
import { getCurrentUser } from '$lib/server/auth';
import { getEmailTemplates, isEmailEnabled } from '$lib/server/email';
import { getBusyTimes, getPrimaryCalendarEvents, getValidAccessToken } from '$lib/server/google-calendar';
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
import { getPrimaryBlackoutDates } from '$lib/server/primary-calendar-blackouts';
import { calendarOutageBody, signalCalendarHealthcheckFailure } from '$lib/server/calendar-outage';

export const POST = async (event: RequestEvent) => {
	const env = event.platform?.env;
	if (!env) {
		throw error(500, 'Platform env not available');
	}

	const db = env.DB;

	// Get current user
	const userId = await getCurrentUser(event);
	if (!userId) {
		throw error(401, 'Unauthorized');
	}

	try {
		const body = await event.request.json() as {
			bookingId: string;
			proposedStartTime: string;
			proposedEndTime: string;
			message?: string | null;
		};

		const { bookingId, proposedStartTime, proposedEndTime, message } = body;

		if (!bookingId || !proposedStartTime || !proposedEndTime) {
			throw error(400, 'Booking ID and proposed times are required');
		}

		// Get booking and verify ownership
		const booking = await db
			.prepare(
				`SELECT b.id, b.user_id, b.status, b.start_time, b.end_time,
				b.attendee_name, b.attendee_email, b.attendee_notes,
					e.name as event_name, e.slug as event_slug, e.availability_calendars,
					u.name as host_name, u.email as host_email, u.contact_email, u.settings, u.brand_color, u.timezone
				FROM bookings b
				JOIN event_types e ON b.event_type_id = e.id
				JOIN users u ON b.user_id = u.id
				WHERE b.id = ?`
			)
			.bind(bookingId)
			.first<{
				id: string;
				user_id: string;
				status: string;
				start_time: string;
				end_time: string;
				attendee_name: string;
				attendee_email: string;
				attendee_notes: string | null;
				event_name: string;
				event_slug: string;
				availability_calendars: string | null;
				host_name: string;
				host_email: string;
				contact_email: string | null;
				settings: string | null;
				brand_color: string | null;
				timezone: string | null;
			}>();

		if (!booking) {
			throw error(404, 'Booking not found');
		}

		if (booking.user_id !== userId) {
			throw error(403, 'You do not have permission to reschedule this booking');
		}

		if (booking.status !== 'confirmed') {
			throw error(400, 'Only confirmed bookings can be rescheduled');
		}

		assertStartInBookingWindow(proposedStartTime);
		const sourcePacificDate = formatPacificDate(new Date(booking.start_time));
		const destinationPacificDate = formatPacificDate(new Date(proposedStartTime));
		if (
			destinationPacificDate !== sourcePacificDate &&
			await isPacificDateConsumed(db, booking.user_id, destinationPacificDate, { excludeBookingId: bookingId })
		) {
			throw error(409, 'This date is no longer available');
		}

		let userSettings: { defaultAvailabilityCalendars?: string; selectedGoogleCalendars?: string[] } = {};
		try {
			userSettings = booking.settings ? JSON.parse(booking.settings) : {};
		} catch {
			userSettings = {};
		}
		const availabilityCalendars = booking.availability_calendars || userSettings.defaultAvailabilityCalendars || 'both';
		const useGoogleCalendar = availabilityCalendars === 'google' || availabilityCalendars === 'both';

		try {
			const accessToken = await getValidAccessToken(
				db,
				booking.user_id,
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
				.bind(booking.user_id, new Date(`${destinationPacificDate}T00:00:00Z`).getUTCDay())
				.all<{ start_time: string; end_time: string }>();
			const primaryEvents = await getPrimaryCalendarEvents(
				accessToken,
				createDateInTimezone(destinationPacificDate, '00:00', PACIFIC_TIMEZONE),
				createDateInTimezone(addCalendarDays(destinationPacificDate, 1), '00:00', PACIFIC_TIMEZONE)
			);
			const blackoutDates = getPrimaryBlackoutDates({
				events: primaryEvents,
				rulesByDate: new Map([[destinationPacificDate, availabilityRules.results || []]]),
				availabilityTimezone: booking.timezone || PACIFIC_TIMEZONE
			});
			if (blackoutDates.has(destinationPacificDate)) {
				throw error(409, 'This date is no longer available');
			}
			if (useGoogleCalendar) {
				const googleBusy = await getBusyTimes(
					accessToken,
					new Date(proposedStartTime),
					new Date(proposedEndTime),
					userSettings.selectedGoogleCalendars
				);
				if (googleBusy.length > 0) {
					throw error(409, 'This time slot is no longer available');
				}
			}
		} catch (err: any) {
			if (err?.status === 409) throw err;
			console.error('Error revalidating primary calendar for proposal:', err);
			await signalCalendarHealthcheckFailure(env);
			return json(calendarOutageBody(), { status: 503 });
		}

		// Generate a unique response token
		const proposalId = crypto.randomUUID();
		const responseToken = crypto.randomUUID();
		let destinationReservationClaimed = false;

		// Create reschedule proposal
		try {
			await db
				.prepare(
					`INSERT INTO reschedule_proposals
					(id, booking_id, proposed_start_time, proposed_end_time, message, proposed_by, response_token, expires_at)
					VALUES (?, ?, ?, ?, ?, 'host', ?, datetime('now', '+7 days'))`
				)
				.bind(proposalId, bookingId, proposedStartTime, proposedEndTime, message || null, responseToken)
				.run();

			if (destinationPacificDate !== sourcePacificDate) {
				await claimPacificDateReservation(db, {
					userId: booking.user_id,
					pacificDate: destinationPacificDate,
					proposalId,
					kind: 'proposal'
				});
				destinationReservationClaimed = true;
			}

			// Mark original booking as having a pending proposal
			const bookingUpdate = await db
				.prepare(
					`UPDATE bookings
					SET status = 'rescheduled'
					WHERE id = ? AND status = 'confirmed' AND start_time = ?`
				)
				.bind(bookingId, booking.start_time)
				.run();
			if (bookingUpdate.meta?.changes !== 1) {
				throw error(409, 'Booking is no longer available to reschedule');
			}
		} catch (err) {
			if (destinationReservationClaimed) {
				await releaseBookingDateReservations(db, { proposalId });
			}
			await db
				.prepare(`DELETE FROM reschedule_proposals WHERE id = ?`)
				.bind(proposalId)
				.run();
			throw err;
		}

		// Send email to attendee with proposal
		if (env.EMAILIT_API_KEY) {
			try {
				// Parse user settings for time format
				let timeFormat: '12h' | '24h' = '12h';
				try {
					const settings = booking.settings ? JSON.parse(booking.settings) : {};
					timeFormat = settings.timeFormat === '24h' ? '24h' : '12h';
				} catch {
					// Keep default
				}

				const appUrl = env.APP_URL || '';
				const responseUrl = `${appUrl}/reschedule-response/${responseToken}`;

				// Send proposal email
				await sendRescheduleProposalEmail(
					{
						attendeeName: booking.attendee_name,
						attendeeEmail: booking.attendee_email,
						eventName: booking.event_name,
						eventSlug: booking.event_slug,
						hostName: booking.host_name,
						hostEmail: booking.host_email,
						oldStartTime: new Date(booking.start_time),
						oldEndTime: new Date(booking.end_time),
						newStartTime: new Date(proposedStartTime),
						newEndTime: new Date(proposedEndTime),
						message: message || null,
						responseUrl,
						appUrl,
						timeFormat,
						brandColor: booking.brand_color || '#3b82f6'
					},
					{
						apiKey: env.EMAILIT_API_KEY,
						from: env.EMAIL_FROM || booking.host_email,
						replyTo: booking.contact_email || booking.host_email
					}
				);
			} catch (emailErr) {
				console.error('Failed to send reschedule proposal email:', emailErr);
				// Don't fail the request if email fails
			}
		}

		return json({ success: true, responseToken });
	} catch (err: any) {
		console.error('Propose reschedule error:', err);
		if (err?.status) throw err;
		throw error(500, 'Failed to create reschedule proposal');
	}
};

interface RescheduleProposalEmailData {
	attendeeName: string;
	attendeeEmail: string;
	eventName: string;
	eventSlug: string;
	hostName: string;
	hostEmail: string;
	oldStartTime: Date;
	oldEndTime: Date;
	newStartTime: Date;
	newEndTime: Date;
	message: string | null;
	responseUrl: string;
	appUrl: string;
	timeFormat: '12h' | '24h';
	brandColor: string;
}

interface EmailConfig {
	apiKey: string;
	from: string;
	replyTo: string;
}

async function sendRescheduleProposalEmail(data: RescheduleProposalEmailData, config: EmailConfig): Promise<void> {
	const formatDate = (date: Date) => date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
	const formatTime = (date: Date) => date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: data.timeFormat === '12h' });

	const htmlBody = `
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Reschedule Request</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6;">
	<table role="presentation" style="width: 100%; border-collapse: collapse;">
		<tr>
			<td align="center" style="padding: 40px 20px;">
				<table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
					<!-- Header -->
					<tr>
						<td style="padding: 40px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); text-align: center;">
							<h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Reschedule Request</h1>
						</td>
					</tr>

					<!-- Body -->
					<tr>
						<td style="padding: 40px;">
							<p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 24px;">
								Hi <strong>${data.attendeeName}</strong>,
							</p>
							<p style="margin: 0 0 30px; color: #4b5563; font-size: 16px; line-height: 24px;">
								<strong>${data.hostName}</strong> would like to reschedule your meeting.
							</p>

							${data.message ? `
							<div style="margin: 0 0 30px; padding: 16px; background-color: #f9fafb; border-radius: 8px; border-left: 4px solid #f59e0b;">
								<p style="margin: 0; color: #4b5563; font-size: 15px; line-height: 22px;">${data.message}</p>
							</div>
							` : ''}

							<!-- Time comparison -->
							<table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
								<tr>
									<td style="width: 48%; vertical-align: top;">
										<div style="background-color: #fef2f2; border-radius: 8px; padding: 16px; border: 1px solid #fecaca;">
											<div style="color: #991b1b; font-size: 12px; font-weight: 600; margin-bottom: 8px; text-transform: uppercase;">Original Time</div>
											<div style="color: #111827; font-size: 15px; font-weight: 500; text-decoration: line-through;">${formatDate(data.oldStartTime)}</div>
											<div style="color: #6b7280; font-size: 14px; text-decoration: line-through;">${formatTime(data.oldStartTime)} - ${formatTime(data.oldEndTime)}</div>
										</div>
									</td>
									<td style="width: 4%; text-align: center; vertical-align: middle;">
										<span style="color: #9ca3af; font-size: 20px;">→</span>
									</td>
									<td style="width: 48%; vertical-align: top;">
										<div style="background-color: #f0fdf4; border-radius: 8px; padding: 16px; border: 1px solid #bbf7d0;">
											<div style="color: #166534; font-size: 12px; font-weight: 600; margin-bottom: 8px; text-transform: uppercase;">Proposed Time</div>
											<div style="color: #111827; font-size: 15px; font-weight: 500;">${formatDate(data.newStartTime)}</div>
											<div style="color: #6b7280; font-size: 14px;">${formatTime(data.newStartTime)} - ${formatTime(data.newEndTime)}</div>
										</div>
									</td>
								</tr>
							</table>

							<!-- Action buttons -->
							<table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
								<tr>
									<td align="center">
										<a href="${data.responseUrl}?action=accept" style="display: inline-block; padding: 14px 28px; background-color: #10b981; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; margin: 0 8px;">Accept New Time</a>
										<a href="${data.responseUrl}?action=decline" style="display: inline-block; padding: 14px 28px; background-color: #ef4444; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; margin: 0 8px;">Decline</a>
									</td>
								</tr>
							</table>

							<p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 20px; text-align: center;">
								Or <a href="${data.responseUrl}?action=counter" style="color: ${data.brandColor}; text-decoration: none;">propose a different time</a>
							</p>
						</td>
					</tr>

					<!-- Footer -->
					<tr>
						<td style="padding: 30px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
							<p style="margin: 0; color: #6b7280; font-size: 12px; line-height: 18px; text-align: center;">
								This reschedule request was sent by ${data.hostName}.<br>
								Scheduling by <a href="https://alabut.com" style="color: #6b7280; text-decoration: none;">Al Abut</a>
							</p>
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
</body>
</html>
	`;

	const response = await fetch('https://api.emailit.com/v1/emails', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${config.apiKey}`
		},
		body: JSON.stringify({
			from: `${data.hostName} <${config.from}>`,
			to: data.attendeeEmail,
			reply_to: config.replyTo,
			subject: `Reschedule Request: ${data.eventName} with ${data.hostName}`,
			html: htmlBody
		})
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Failed to send email: ${errorText}`);
	}
}
