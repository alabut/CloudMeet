import type { PrimaryCalendarEvent } from './google-calendar';
import {
	addCalendarDays,
	formatPacificDate,
	listDateStrings,
	rulesOverlapTimedEvent
} from './booking-rules';
import type { AvailabilityRule } from './availability-slots';

export function getPrimaryBlackoutDates(params: {
	events: PrimaryCalendarEvent[];
	rulesByDate: Map<string, AvailabilityRule[]>;
	availabilityTimezone?: string;
}): Set<string> {
	const blackoutDates = new Set<string>();

	for (const event of params.events) {
		if (event.status === 'cancelled' || event.status === 'canceled') continue;
		if (!event.start || !event.end) {
			throw new Error('Unverifiable primary calendar event: missing start or end');
		}

		const hasAllDayDate = !!event.start.date || !!event.end.date;
		if (hasAllDayDate) {
			if (
				!event.start.date ||
				!event.end.date ||
				event.start.dateTime ||
				event.end.dateTime ||
				!isValidCalendarDate(event.start.date) ||
				!isValidCalendarDate(event.end.date) ||
				event.start.date >= event.end.date
			) {
				throw new Error('Unverifiable primary calendar event: invalid all-day bounds');
			}
			for (const date of listDateStrings(event.start.date, event.end.date)) {
				blackoutDates.add(date);
			}
			continue;
		}

		if (!event.start.dateTime || !event.end.dateTime) {
			throw new Error('Unverifiable primary calendar event: missing date or date-time bounds');
		}

		const eventStart = new Date(event.start.dateTime);
		const eventEnd = new Date(event.end.dateTime);
		if (
			Number.isNaN(eventStart.getTime()) ||
			Number.isNaN(eventEnd.getTime()) ||
			eventEnd <= eventStart
		) {
			throw new Error('Unverifiable primary calendar event: invalid date-time bounds');
		}

		let date = formatPacificDate(eventStart);
		const finalDate = formatPacificDate(new Date(eventEnd.getTime() - 1));
		const endExclusive = addCalendarDays(finalDate, 1);

		while (date < endExclusive) {
			const rules = params.rulesByDate.get(date) || [];
			if (
				rules.length > 0 &&
					rulesOverlapTimedEvent({
						dateStr: date,
						rules,
						eventStart,
						eventEnd,
						availabilityTimezone: params.availabilityTimezone
					})
			) {
				blackoutDates.add(date);
			}
			date = addCalendarDays(date, 1);
		}
	}

	return blackoutDates;
}

function isValidCalendarDate(value: string): boolean {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
	const parsed = new Date(`${value}T00:00:00.000Z`);
	return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
