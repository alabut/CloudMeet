/**
 * Deterministic fixture data for dashboard preview routes.
 * All data is static — no auth, D1, calendar API, or email calls.
 */

export { isLoopbackHost } from './sampleBooking';

// ---------------------------------------------------------------------------
// Preview state enums
// ---------------------------------------------------------------------------

export const OVERVIEW_PREVIEW_STATES = [
	'connected',
	'warning',
	'empty',
	'loading',
	'error'
] as const;
export type OverviewPreviewState = (typeof OVERVIEW_PREVIEW_STATES)[number];

export const EVENT_TYPE_PREVIEW_STATES = ['new', 'edit'] as const;
export type EventTypePreviewState = (typeof EVENT_TYPE_PREVIEW_STATES)[number];

export const CALENDAR_PREVIEW_STATES = ['connected', 'disconnected'] as const;
export type CalendarPreviewState = (typeof CALENDAR_PREVIEW_STATES)[number];

export const EMAIL_PREVIEW_STATES = ['default', 'loading'] as const;
export type EmailPreviewState = (typeof EMAIL_PREVIEW_STATES)[number];

export const CANCEL_MODAL_PREVIEW_STATES = ['form', 'error'] as const;
export type CancelModalPreviewState = (typeof CANCEL_MODAL_PREVIEW_STATES)[number];

export const RESCHEDULE_MODAL_PREVIEW_STATES = ['form', 'selected', 'loading', 'empty'] as const;
export type RescheduleModalPreviewState = (typeof RESCHEDULE_MODAL_PREVIEW_STATES)[number];

export const DASHBOARD_PREVIEW_STATES = [
	...OVERVIEW_PREVIEW_STATES,
	...EVENT_TYPE_PREVIEW_STATES,
	...CALENDAR_PREVIEW_STATES,
	...EMAIL_PREVIEW_STATES
] as const;

// ---------------------------------------------------------------------------
// Parse helpers
// ---------------------------------------------------------------------------

function parseState<T extends string>(
	value: string | null | undefined,
	states: readonly T[],
	fallback: T
): T {
	if (!value || !states.includes(value as T)) return fallback;
	return value as T;
}

export function parseOverviewState(
	state: string | null | undefined
): OverviewPreviewState {
	return parseState(state, OVERVIEW_PREVIEW_STATES, 'connected');
}

export function parseEventTypeState(
	state: string | null | undefined
): EventTypePreviewState {
	return parseState(state, EVENT_TYPE_PREVIEW_STATES, 'new');
}

export function parseCalendarState(
	state: string | null | undefined
): CalendarPreviewState {
	return parseState(state, CALENDAR_PREVIEW_STATES, 'connected');
}

export function parseEmailState(
	state: string | null | undefined
): EmailPreviewState {
	return parseState(state, EMAIL_PREVIEW_STATES, 'default');
}

export function parseCancelModalState(
	state: string | null | undefined
): CancelModalPreviewState {
	return parseState(state, CANCEL_MODAL_PREVIEW_STATES, 'form');
}

export function parseRescheduleModalState(
	state: string | null | undefined
): RescheduleModalPreviewState {
	return parseState(state, RESCHEDULE_MODAL_PREVIEW_STATES, 'form');
}

// ---------------------------------------------------------------------------
// Fixture: upcoming bookings
// ---------------------------------------------------------------------------

export type DashboardBooking = {
	id: string;
	attendee_name: string;
	attendee_email: string;
	event_type_name: string;
	event_type_slug: string;
	event_type_id: string;
	duration_minutes: number;
	start_time: string;
	end_time: string;
	status: 'confirmed' | 'canceled' | 'pending' | 'rescheduled';
};

export const PREVIEW_EVENT_TYPES = [
	{
		id: 'evt-30min',
		name: '30-minute conversation',
		slug: '30min',
		duration: 30,
		description: "Let's talk about product design, startups, or anything else you'd like to discuss.",
		is_active: true
	},
	{
		id: 'evt-60min',
		name: '60-minute deep dive',
		slug: '60min',
		duration: 60,
		description: 'A longer session for strategy, architecture, or detailed feedback.',
		is_active: true
	}
];

export const PREVIEW_BOOKINGS: DashboardBooking[] = [
	{
		id: 'bk-001',
		attendee_name: 'Jordan Chen',
		attendee_email: 'jordan@example.com',
		event_type_name: '30-minute conversation',
		event_type_slug: '30min',
		event_type_id: 'evt-30min',
		duration_minutes: 30,
		start_time: '2030-09-12T18:00:00.000Z',
		end_time: '2030-09-12T18:30:00.000Z',
		status: 'confirmed'
	},
	{
		id: 'bk-002',
		attendee_name: 'Priya Nair',
		attendee_email: 'priya@example.com',
		event_type_name: '60-minute deep dive',
		event_type_slug: '60min',
		event_type_id: 'evt-60min',
		duration_minutes: 60,
		start_time: '2030-09-13T15:00:00.000Z',
		end_time: '2030-09-13T16:00:00.000Z',
		status: 'confirmed'
	},
	{
		id: 'bk-003',
		attendee_name: 'Sam Okonkwo',
		attendee_email: 'sam@example.com',
		event_type_name: '30-minute conversation',
		event_type_slug: '30min',
		event_type_id: 'evt-30min',
		duration_minutes: 30,
		start_time: '2030-09-14T20:00:00.000Z',
		end_time: '2030-09-14T20:30:00.000Z',
		status: 'confirmed'
	}
];

// ---------------------------------------------------------------------------
// Fixture: overview states
// ---------------------------------------------------------------------------

export function getOverviewFixture(state: OverviewPreviewState) {
	const base = {
		hostName: 'Al Abut',
		bookingPageUrl: 'http://localhost:5173/',
		appUrl: 'http://localhost:5173',
		user: {
			name: 'Al Abut',
			email: 'alabut@gmail.com',
			profile_image: null,
			brand_color: '#f15403'
		},
		eventTypes: PREVIEW_EVENT_TYPES,
		upcomingCount: 3,
		thisWeekCount: 2,
		googleCalendarOk: true,
		googleCalendarWarning: null as string | null
	};

	if (state === 'empty') {
		return { ...base, bookings: [], upcomingCount: 0, thisWeekCount: 0 };
	}
	if (state === 'loading') {
		return { ...base, bookings: null, loading: true };
	}
	if (state === 'error') {
		return { ...base, bookings: null, error: 'Could not load bookings. Try refreshing.' };
	}
	if (state === 'warning') {
		return {
			...base,
			bookings: PREVIEW_BOOKINGS,
			googleCalendarOk: false,
			googleCalendarWarning:
				'Google Calendar connection expired. Bookings will not sync until you reconnect.'
		};
	}
	return { ...base, bookings: PREVIEW_BOOKINGS };
}

// ---------------------------------------------------------------------------
// Fixture: event type form
// ---------------------------------------------------------------------------

export type EventTypeFixture = {
	id?: string;
	name: string;
	slug: string;
	duration: number;
	description: string;
	location: string;
	is_active: boolean;
};

export function getEventTypeFixture(state: EventTypePreviewState): EventTypeFixture {
	if (state === 'edit') {
		return {
			id: 'evt-30min',
			name: '30-minute conversation',
			slug: '30min',
			duration: 30,
			description:
				"Let's talk about product design, startups, or anything else you'd like to discuss.",
			location: 'zoom',
			is_active: true
		};
	}
	// new
	return {
		name: '',
		slug: '',
		duration: 30,
		description: '',
		location: 'zoom',
		is_active: true
	};
}

// ---------------------------------------------------------------------------
// Fixture: calendar settings
// ---------------------------------------------------------------------------

export type CalendarConnectionFixture = {
	provider: 'google' | 'outlook';
	label: string;
	connected: boolean;
	email?: string;
	lastSync?: string;
};

export function getCalendarSettingsFixture(
	state: CalendarPreviewState
): CalendarConnectionFixture[] {
	if (state === 'disconnected') {
		return [
			{ provider: 'google', label: 'Google Calendar', connected: false },
			{ provider: 'outlook', label: 'Outlook / Office 365', connected: false }
		];
	}
	// connected
	return [
		{
			provider: 'google',
			label: 'Google Calendar',
			connected: true,
			email: 'alabut@gmail.com',
			lastSync: '2030-09-11T21:15:00.000Z'
		},
		{ provider: 'outlook', label: 'Outlook / Office 365', connected: false }
	];
}

// ---------------------------------------------------------------------------
// Fixture: email templates
// ---------------------------------------------------------------------------

export type EmailTemplateFixture = {
	id: string;
	name: string;
	subject: string;
	trigger: string;
	enabled: boolean;
};

export function getEmailTemplatesFixture(): EmailTemplateFixture[] {
	return [
		{
			id: 'tpl-confirm',
			name: 'Booking Confirmation',
			subject: 'Your meeting with Al Abut is confirmed',
			trigger: 'On booking',
			enabled: false
		},
		{
			id: 'tpl-reminder',
			name: '24-Hour Reminder',
			subject: "Reminder: you have a meeting with Al Abut tomorrow",
			trigger: '24h before',
			enabled: false
		},
		{
			id: 'tpl-cancel',
			name: 'Cancellation Notice',
			subject: 'Your meeting has been cancelled',
			trigger: 'On cancellation',
			enabled: false
		},
		{
			id: 'tpl-reschedule',
			name: 'Reschedule Proposal',
			subject: 'Al Abut would like to reschedule',
			trigger: 'On proposal',
			enabled: false
		}
	];
}

// ---------------------------------------------------------------------------
// Fixture: availability
// ---------------------------------------------------------------------------

export type AvailabilityWindow = {
	day: string;
	enabled: boolean;
	start: string;
	end: string;
};

export function getAvailabilityFixture(): AvailabilityWindow[] {
	return [
		{ day: 'Monday', enabled: true, start: '09:00', end: '17:00' },
		{ day: 'Tuesday', enabled: true, start: '09:00', end: '17:00' },
		{ day: 'Wednesday', enabled: true, start: '09:00', end: '12:00' },
		{ day: 'Thursday', enabled: true, start: '09:00', end: '17:00' },
		{ day: 'Friday', enabled: false, start: '09:00', end: '17:00' },
		{ day: 'Saturday', enabled: false, start: '10:00', end: '14:00' },
		{ day: 'Sunday', enabled: false, start: '10:00', end: '14:00' }
	];
}

// ---------------------------------------------------------------------------
// Fixture: cancel modal booking
// ---------------------------------------------------------------------------

export function getCancelModalFixture() {
	const booking = PREVIEW_BOOKINGS[0];
	return {
		id: booking.id,
		attendee_name: booking.attendee_name,
		attendee_email: booking.attendee_email,
		event_type_name: booking.event_type_name,
		event_type_slug: booking.event_type_slug,
		event_type_id: booking.event_type_id,
		duration_minutes: booking.duration_minutes,
		start_time: booking.start_time,
		end_time: booking.end_time,
		status: booking.status
	};
}

export function getCalendarPreviewUser(state: CalendarPreviewState) {
	if (state === 'disconnected') {
		return {
			googleConnected: false,
			googleHealthy: false,
			outlookConnected: false,
			defaultAvailabilityCalendars: 'google' as const,
			defaultInviteCalendar: 'google' as const,
			selectedGoogleCalendars: [] as string[]
		};
	}
	return {
		googleConnected: true,
		googleHealthy: true,
		outlookConnected: false,
		defaultAvailabilityCalendars: 'google' as const,
		defaultInviteCalendar: 'google' as const,
		selectedGoogleCalendars: ['primary']
	};
}

export function getCalendarPreviewGoogleCalendars(state: CalendarPreviewState) {
	if (state === 'disconnected') return [];
	return [
		{ id: 'primary', summary: 'alabut@gmail.com', primary: true },
		{ id: 'work', summary: 'Work calendar' }
	];
}

// ---------------------------------------------------------------------------
// Fixture: reschedule modal
// ---------------------------------------------------------------------------

export function getRescheduleModalFixture(state: RescheduleModalPreviewState) {
	const booking = getCancelModalFixture();
	const slots = [
		{ start: '2030-09-13T16:00:00.000Z', end: '2030-09-13T16:30:00.000Z' },
		{ start: '2030-09-13T17:00:00.000Z', end: '2030-09-13T17:30:00.000Z' },
		{ start: '2030-09-13T18:00:00.000Z', end: '2030-09-13T18:30:00.000Z' },
		{ start: '2030-09-14T15:00:00.000Z', end: '2030-09-14T15:30:00.000Z' }
	];
	if (state === 'empty') {
		return { booking, slots: [], selectedSlot: null, selectedDate: '2030-09-13', selectedTime: null, loading: false };
	}
	if (state === 'loading') {
		return { booking, slots: null, selectedSlot: null, selectedDate: '2030-09-13', selectedTime: null, loading: true };
	}
	const selectedSlot = state === 'selected' ? slots[1] : null;
	const selectedDate = selectedSlot ? selectedSlot.start.split('T')[0] : '2030-09-13';
	const selectedTime = selectedSlot?.start ?? null;
	return { booking, slots, selectedSlot, selectedDate, selectedTime, loading: false };
}
