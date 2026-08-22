/**
 * Shared slot-generation logic for the availability endpoints.
 *
 * `src/routes/api/availability/+server.ts` (single day, returns actual slots) and
 * `src/routes/api/availability/month/+server.ts` (whole month, returns which
 * dates have at least one slot) both need to turn a set of weekly
 * availability rules plus a list of busy periods into concrete bookable
 * slots for a given date. They used to each carry their own copy of this
 * logic (same as the `createDateInTimezone` helper before it), which is how
 * the two endpoints previously drifted out of sync on a date-parsing bug
 * (fixed in e0c4437) and can drift again. Keeping one implementation means
 * "a date is available" and "a date has slots" can never disagree because
 * of divergent slot math - only because of divergent inputs (rules/busy
 * times), which is a much smaller surface to keep consistent.
 */

export interface TimeSlot {
	start: string;
	end: string;
}

export interface AvailabilityRule {
	start_time: string;
	end_time: string;
}

/**
 * Convert a (dateStr, timeStr) pair expressed in `timezone` into the
 * equivalent UTC Date. E.g. createDateInTimezone('2026-08-31', '09:00',
 * 'America/Los_Angeles') returns the Date for 2026-08-31T16:00:00Z.
 */
export function createDateInTimezone(dateStr: string, timeStr: string, timezone: string): Date {
	const [hour, minute] = timeStr.split(':').map(Number);
	const dateTimeStr = `${dateStr}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;

	const formatter = new Intl.DateTimeFormat('en-US', {
		timeZone: timezone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: false
	});

	// Start with a UTC interpretation, then measure how far off that is from
	// the intended timezone and correct for it.
	const targetDate = new Date(dateTimeStr + 'Z');
	const parts = formatter.formatToParts(targetDate);
	const tzHour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
	const tzMinute = parseInt(parts.find(p => p.type === 'minute')?.value || '0');

	const targetMinutes = hour * 60 + minute;
	const actualMinutes = tzHour * 60 + tzMinute;
	let offsetMinutes = actualMinutes - targetMinutes;

	if (offsetMinutes > 12 * 60) offsetMinutes -= 24 * 60;
	if (offsetMinutes < -12 * 60) offsetMinutes += 24 * 60;

	return new Date(targetDate.getTime() - offsetMinutes * 60 * 1000);
}

/**
 * Generate the bookable slots for a single date, given that date's
 * availability rules, the event duration, and the busy periods (calendar
 * events + existing bookings) that might conflict with them.
 *
 * Both endpoints call this with the same inputs for the same date and get
 * the same output - the day endpoint returns it directly, the month
 * endpoint just checks `.length > 0`.
 */
export function generateAvailableSlots(params: {
	dateStr: string;
	rules: AvailabilityRule[];
	timezone: string;
	durationMinutes: number;
	busySlots: TimeSlot[];
	now?: Date;
}): TimeSlot[] {
	const { dateStr, rules, timezone, durationMinutes, busySlots, now = new Date() } = params;
	const slots: TimeSlot[] = [];

	for (const rule of rules) {
		const currentTime = createDateInTimezone(dateStr, rule.start_time, timezone);
		const endTime = createDateInTimezone(dateStr, rule.end_time, timezone);

		const slotIncrement = Math.min(30, durationMinutes);

		while (currentTime < endTime) {
			const slotEnd = new Date(currentTime);
			slotEnd.setMinutes(slotEnd.getMinutes() + durationMinutes);

			if (slotEnd > endTime) {
				break;
			}

			if (currentTime < now) {
				currentTime.setMinutes(currentTime.getMinutes() + slotIncrement);
				continue;
			}

			const hasConflict = busySlots.some(busy => {
				const busyStart = new Date(busy.start);
				const busyEnd = new Date(busy.end);
				return (
					(currentTime >= busyStart && currentTime < busyEnd) ||
					(slotEnd > busyStart && slotEnd <= busyEnd) ||
					(currentTime <= busyStart && slotEnd >= busyEnd)
				);
			});

			if (!hasConflict) {
				slots.push({
					start: currentTime.toISOString(),
					end: slotEnd.toISOString()
				});
			}

			currentTime.setMinutes(currentTime.getMinutes() + slotIncrement);
		}
	}

	return slots;
}
