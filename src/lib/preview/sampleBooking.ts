import { formatDateLocal } from '$lib/utils/dateFormatters';

export const PREVIEW_BOOKING_ID = 'preview-sample-booking';
export const PREVIEW_MEETING_URL = 'https://zoom.us/j/12345678901';

export function isLoopbackHost(hostname: string): boolean {
	return (
		hostname === 'localhost' ||
		hostname === '127.0.0.1' ||
		hostname === '::1' ||
		hostname === '[::1]'
	);
}

export function isLocalPreviewBooking(bookingId: string, hostname: string): boolean {
	return bookingId === PREVIEW_BOOKING_ID && isLoopbackHost(hostname);
}

/** Near-future sample slot for the 30-minute Al Abut preview flow. */
export function getPreviewSampleSlot() {
	const start = new Date();
	start.setDate(start.getDate() + 3);
	start.setHours(14, 0, 0, 0);
	const end = new Date(start);
	end.setMinutes(end.getMinutes() + 30);
	return {
		date: formatDateLocal(start),
		slot: { start: start.toISOString(), end: end.toISOString() }
	};
}

/** Static 30-minute slots for loopback preview availability QA. */
export function getLocalPreviewSlots(sampleSlot: { start: string; end: string }) {
	const day = new Date(sampleSlot.start);
	const durationMs = new Date(sampleSlot.end).getTime() - day.getTime();
	return [9, 10, 11, 13, 14, 15, 16].map((hour) => {
		if (hour === 14) return sampleSlot;
		const slotStart = new Date(day);
		slotStart.setHours(hour, 0, 0, 0);
		const slotEnd = new Date(slotStart.getTime() + durationMs);
		return { start: slotStart.toISOString(), end: slotEnd.toISOString() };
	});
}

export function getCancelPreviewBooking() {
	const { slot } = getPreviewSampleSlot();
	return {
		id: PREVIEW_BOOKING_ID,
		start_time: slot.start,
		end_time: slot.end,
		attendee_name: 'Preview Attendee',
		attendee_email: 'preview@example.com',
		status: 'confirmed',
		google_event_id: null,
		event_name: '30-minute conversation',
		event_slug: '30min',
		host_name: 'Al Abut'
	};
}

export function getReschedulePreviewBooking() {
	const { slot } = getPreviewSampleSlot();
	return {
		id: PREVIEW_BOOKING_ID,
		startTime: slot.start,
		endTime: slot.end,
		attendeeName: 'Preview Attendee',
		attendeeEmail: 'preview@example.com',
		attendeeNotes: null,
		eventName: '30-minute conversation',
		eventSlug: '30min',
		duration: 30,
		description: "Let's talk about product design, startups or anything else.",
		coverImage: null,
		inviteCalendar: 'google',
		hostName: 'Al Abut',
		profileImage: null,
		brandColor: '#3b82f6'
	};
}
