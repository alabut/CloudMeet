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
}): Set<string> {
	const blackoutDates = new Set<string>();

	for (const event of params.events) {
		if (event.status === 'cancelled' || event.status === 'canceled') continue;

		if (event.start.date && event.end.date) {
			for (const date of listDateStrings(event.start.date, event.end.date)) {
				blackoutDates.add(date);
			}
			continue;
		}

		if (!event.start.dateTime || !event.end.dateTime) continue;

		const eventStart = new Date(event.start.dateTime);
		const eventEnd = new Date(event.end.dateTime);
		if (Number.isNaN(eventStart.getTime()) || Number.isNaN(eventEnd.getTime())) continue;

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
					eventEnd
				})
			) {
				blackoutDates.add(date);
			}
			date = addCalendarDays(date, 1);
		}
	}

	return blackoutDates;
}
