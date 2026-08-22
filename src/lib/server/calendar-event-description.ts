export interface CalendarEventDescriptionParams {
	eventDescription?: string | null;
	attendeeName: string;
	attendeeEmail: string;
	attendeeNotes?: string | null;
	bookingId: string;
	appUrl?: string;
}

/**
 * Build the calendar event description body shared by Google and Outlook invites.
 * Includes attendee details and reschedule/cancel links when APP_URL is configured.
 */
export function buildCalendarEventDescription(params: CalendarEventDescriptionParams): string {
	const { eventDescription, attendeeName, attendeeEmail, attendeeNotes, bookingId, appUrl } = params;

	const baseUrl = (appUrl || '').replace(/\/$/, '');
	const rescheduleCancelLines = baseUrl
		? `\n\nNeed to make a change?\nReschedule: ${baseUrl}/reschedule/${bookingId}\nCancel: ${baseUrl}/cancel/${bookingId}`
		: '';

	return `${eventDescription || ''}\n\nAttendee: ${attendeeName} (${attendeeEmail})${attendeeNotes ? `\n\nNotes from attendee:\n${attendeeNotes}` : ''}${rescheduleCancelLines}`;
}
