import { formatDateLocal } from '$lib/utils/dateFormatters';

export const PREVIEW_BOOKING_ID = 'preview-sample-booking';
export const PREVIEW_PROPOSAL_TOKEN = 'preview-sample-proposal';
export const PREVIEW_MEETING_URL = 'https://zoom.us/j/12345678901';
export const PREVIEW_TIMEZONE = 'America/Los_Angeles';

/** Fixed fixture: 2030-09-11 2:00–2:30 PM America/Los_Angeles (PDT, UTC-7). */
export const PREVIEW_SAMPLE_DATE = '2030-09-11';
const PREVIEW_SLOT_START_ISO = '2030-09-11T21:00:00.000Z';
const PREVIEW_SLOT_END_ISO = '2030-09-11T21:30:00.000Z';

/** Original time for proposal previews — one week earlier, same clock time. */
const PREVIEW_ORIGINAL_START_ISO = '2030-09-04T21:00:00.000Z';
const PREVIEW_ORIGINAL_END_ISO = '2030-09-04T21:30:00.000Z';

export const CANCEL_PREVIEW_STATES = [
	'form',
	'reason',
	'error',
	'submitting',
	'success',
	'already-cancelled'
] as const;
export type CancelPreviewState = (typeof CANCEL_PREVIEW_STATES)[number];

export const RESCHEDULE_PREVIEW_STATES = [
	'form',
	'selected',
	'loading',
	'empty',
	'error',
	'submitting',
	'success'
] as const;
export type ReschedulePreviewState = (typeof RESCHEDULE_PREVIEW_STATES)[number];

export const PROPOSAL_PREVIEW_STATES = [
	'pending',
	'pending-no-message',
	'error',
	'counter',
	'accepted',
	'declined',
	'already-accepted',
	'already-declined',
	'submitting-accept',
	'submitting-decline'
] as const;
export type ProposalPreviewState = (typeof PROPOSAL_PREVIEW_STATES)[number];

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

export function isLocalPreviewProposal(token: string, hostname: string): boolean {
	return token === PREVIEW_PROPOSAL_TOKEN && isLoopbackHost(hostname);
}

export function parseCancelPreviewState(
	state: string | null | undefined
): CancelPreviewState | null {
	if (!state || state === 'form') return 'form';
	return CANCEL_PREVIEW_STATES.includes(state as CancelPreviewState)
		? (state as CancelPreviewState)
		: null;
}

export function parseReschedulePreviewState(
	state: string | null | undefined
): ReschedulePreviewState | null {
	if (!state || state === 'form') return 'form';
	return RESCHEDULE_PREVIEW_STATES.includes(state as ReschedulePreviewState)
		? (state as ReschedulePreviewState)
		: null;
}

export function parseProposalPreviewState(
	state: string | null | undefined
): ProposalPreviewState | null {
	if (!state || state === 'pending') return 'pending';
	return PROPOSAL_PREVIEW_STATES.includes(state as ProposalPreviewState)
		? (state as ProposalPreviewState)
		: null;
}

/** Deterministic sample slot for loopback preview flows. */
export function getPreviewSampleSlot() {
	return {
		date: PREVIEW_SAMPLE_DATE,
		slot: { start: PREVIEW_SLOT_START_ISO, end: PREVIEW_SLOT_END_ISO },
		timezone: PREVIEW_TIMEZONE
	};
}

/** Build an ISO slot at a given hour on the preview date in Pacific time (September = PDT). */
function pacificSlotIso(dateStr: string, hour: number, durationMinutes: number) {
	const utcHour = hour + 7;
	const start = new Date(`${dateStr}T${String(utcHour).padStart(2, '0')}:00:00.000Z`);
	const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
	return { start: start.toISOString(), end: end.toISOString() };
}

/** Static 30-minute slots for loopback preview availability QA. */
export function getLocalPreviewSlots(sampleSlot: { start: string; end: string }) {
	const durationMs = new Date(sampleSlot.end).getTime() - new Date(sampleSlot.start).getTime();
	const durationMinutes = durationMs / (60 * 1000);
	return [9, 10, 11, 13, 14, 15, 16].map((hour) => {
		if (hour === 14) return sampleSlot;
		return pacificSlotIso(PREVIEW_SAMPLE_DATE, hour, durationMinutes);
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

export type ProposalPreviewRecord = {
	id: string;
	booking_id: string;
	proposed_start_time: string;
	proposed_end_time: string;
	message: string | null;
	status: string;
	proposed_by: string;
	attendee_name: string;
	attendee_email: string;
	original_start_time: string;
	original_end_time: string;
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
};

export function getProposalPreviewRecord(
	state: ProposalPreviewState,
	includeMessage = true
): ProposalPreviewRecord {
	const { slot } = getPreviewSampleSlot();
	const status =
		state === 'already-accepted'
			? 'accepted'
			: state === 'already-declined'
				? 'declined'
				: state === 'accepted' || state === 'declined'
					? state
					: 'pending';

	return {
		id: 'preview-proposal-id',
		booking_id: PREVIEW_BOOKING_ID,
		proposed_start_time: slot.start,
		proposed_end_time: slot.end,
		message:
			includeMessage && state !== 'pending-no-message'
				? 'Would Thursday work better? I have a conflict at our original time.'
				: null,
		status,
		proposed_by: 'host',
		attendee_name: 'Preview Attendee',
		attendee_email: 'preview@example.com',
		original_start_time: PREVIEW_ORIGINAL_START_ISO,
		original_end_time: PREVIEW_ORIGINAL_END_ISO,
		google_event_id: null,
		attendee_notes: null,
		event_name: '30-minute conversation',
		event_slug: '30min',
		duration_minutes: 30,
		user_id: 'preview-user-id',
		host_name: 'Al Abut',
		host_email: 'alabut@gmail.com',
		brand_color: '#f15403',
		settings: null
	};
}
