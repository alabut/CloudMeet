export interface CalendarEventInput {
	title: string;
	start: string;
	end: string;
	meetingUrl: string | null;
	joinLabel?: string;
	bookingId?: string | null;
}

export class CalendarEventValidationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'CalendarEventValidationError';
	}
}

interface ParsedCalendarRange {
	startUtc: string;
	endUtc: string;
}

/** Format a Date as a UTC datetime (YYYYMMDDTHHmmssZ). */
function formatUtcDateTime(date: Date): string {
	const pad = (n: number) => String(n).padStart(2, '0');
	return (
		date.getUTCFullYear() +
		pad(date.getUTCMonth() + 1) +
		pad(date.getUTCDate()) +
		'T' +
		pad(date.getUTCHours()) +
		pad(date.getUTCMinutes()) +
		pad(date.getUTCSeconds()) +
		'Z'
	);
}

/** Shared start/end parsing and validation for all calendar outputs. */
function parseCalendarRange(start: string, end: string): ParsedCalendarRange {
	const startDate = new Date(start);
	const endDate = new Date(end);
	const startMs = startDate.getTime();
	const endMs = endDate.getTime();

	if (!Number.isFinite(startMs)) {
		throw new CalendarEventValidationError(`Invalid calendar start date: ${start}`);
	}
	if (!Number.isFinite(endMs)) {
		throw new CalendarEventValidationError(`Invalid calendar end date: ${end}`);
	}
	if (endMs <= startMs) {
		throw new CalendarEventValidationError('Calendar end must be after start');
	}

	return {
		startUtc: formatUtcDateTime(startDate),
		endUtc: formatUtcDateTime(endDate)
	};
}

function utf8ByteLength(value: string): number {
	return new TextEncoder().encode(value).length;
}

function sliceUtf8ByBytes(value: string, maxBytes: number): { head: string; tail: string } {
	const bytes = new TextEncoder().encode(value);
	if (bytes.length <= maxBytes) {
		return { head: value, tail: '' };
	}

	let cut = maxBytes;
	while (cut > 0 && (bytes[cut] & 0xc0) === 0x80) {
		cut--;
	}

	return {
		head: new TextDecoder().decode(bytes.subarray(0, cut)),
		tail: new TextDecoder().decode(bytes.subarray(cut))
	};
}

/** RFC 5545 content-line folding at 75 UTF-8 octets with CRLF continuations. */
export function foldIcsLine(line: string): string {
	const maxOctets = 75;
	if (utf8ByteLength(line) <= maxOctets) {
		return line;
	}

	const segments: string[] = [];
	let rest = line;

	const first = sliceUtf8ByBytes(rest, maxOctets);
	segments.push(first.head);
	rest = first.tail;

	while (rest.length > 0) {
		rest = ` ${rest}`;
		const next = sliceUtf8ByBytes(rest, maxOctets);
		segments.push(next.head);
		rest = next.tail;
	}

	return segments.join('\r\n');
}

/** RFC 5545 TEXT value escaping. */
export function escapeIcsText(value: string): string {
	return value
		.replace(/\\/g, '\\\\')
		.replace(/;/g, '\\;')
		.replace(/,/g, '\\,')
		.replace(/\r\n/g, '\\n')
		.replace(/\n/g, '\\n')
		.replace(/\r/g, '\\n');
}

function buildEventDetails(meetingUrl: string | null, joinLabel?: string): string {
	if (!meetingUrl) return '';
	if (joinLabel) return `${joinLabel}: ${meetingUrl}`;
	return meetingUrl;
}

/** Build a Google Calendar "Add event" URL. */
export function buildGoogleCalendarUrl(event: CalendarEventInput): string {
	const { startUtc, endUtc } = parseCalendarRange(event.start, event.end);
	const params = new URLSearchParams();
	params.set('action', 'TEMPLATE');
	params.set('text', event.title);
	params.set('dates', `${startUtc}/${endUtc}`);

	const details = buildEventDetails(event.meetingUrl, event.joinLabel);
	if (event.meetingUrl) {
		params.set('location', event.meetingUrl);
	}
	if (details) {
		params.set('details', details);
	}

	return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function buildIcsUid(event: CalendarEventInput): string {
	if (event.bookingId) {
		return `booking-${event.bookingId}@cloudmeet`;
	}
	const seed = `${event.title}-${event.start}-${event.end}`;
	let hash = 0;
	for (let i = 0; i < seed.length; i++) {
		hash = (hash * 31 + seed.charCodeAt(i)) | 0;
	}
	return `event-${Math.abs(hash)}@cloudmeet`;
}

/** Generate RFC 5545 ICS content with CRLF line endings. */
export function buildIcsContent(event: CalendarEventInput): string {
	const { startUtc, endUtc } = parseCalendarRange(event.start, event.end);
	const dtstamp = formatUtcDateTime(new Date());
	const uid = buildIcsUid(event);
	const summary = escapeIcsText(event.title);
	const location = event.meetingUrl ? escapeIcsText(event.meetingUrl) : '';
	const description = escapeIcsText(buildEventDetails(event.meetingUrl, event.joinLabel));

	const lines = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//CloudMeet//EN',
		'CALSCALE:GREGORIAN',
		'METHOD:PUBLISH',
		'BEGIN:VEVENT',
		`UID:${uid}`,
		`DTSTAMP:${dtstamp}`,
		`DTSTART:${startUtc}`,
		`DTEND:${endUtc}`,
		`SUMMARY:${summary}`
	];

	if (location) {
		lines.push(`LOCATION:${location}`);
	}
	if (description) {
		lines.push(`DESCRIPTION:${description}`);
	}

	lines.push('END:VEVENT', 'END:VCALENDAR');

	return lines.map(foldIcsLine).join('\r\n') + '\r\n';
}

/** Sanitize an event title for use as a download filename. */
export function sanitizeIcsFilename(title: string): string {
	const base = title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 60);
	return (base || 'event') + '.ics';
}

/** Trigger a client-side .ics download. */
export function downloadIcsFile(event: CalendarEventInput): void {
	const content = buildIcsContent(event);
	const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement('a');
	anchor.href = url;
	anchor.download = sanitizeIcsFilename(event.title);
	document.body.appendChild(anchor);
	anchor.click();
	document.body.removeChild(anchor);
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}
