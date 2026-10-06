import { error } from '@sveltejs/kit';
import { createDateInTimezone, type AvailabilityRule, type TimeSlot } from './availability-slots';

export const PACIFIC_TIMEZONE = 'America/Los_Angeles';
export const BOOKING_WINDOW_LOWER_HOURS = 48;
export const BOOKING_WINDOW_UPPER_DAYS = 16;

export interface BookingWindow {
	start: Date;
	end: Date;
}

export function getBookingWindow(now = new Date()): BookingWindow {
	return {
		start: new Date(now.getTime() + BOOKING_WINDOW_LOWER_HOURS * 60 * 60 * 1000),
		end: new Date(now.getTime() + BOOKING_WINDOW_UPPER_DAYS * 24 * 60 * 60 * 1000)
	};
}

export function isStartInBookingWindow(start: Date, now = new Date()): boolean {
	const window = getBookingWindow(now);
	return start >= window.start && start < window.end;
}

export function assertStartInBookingWindow(startTime: string, now = new Date()): void {
	const start = new Date(startTime);
	if (Number.isNaN(start.getTime()) || !isStartInBookingWindow(start, now)) {
		throw error(409, 'This time is outside the booking window');
	}
}

export function filterSlotsToBookingWindow(slots: TimeSlot[], now = new Date()): TimeSlot[] {
	return slots.filter(slot => isStartInBookingWindow(new Date(slot.start), now));
}

export function formatPacificDate(date: Date): string {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone: PACIFIC_TIMEZONE,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	}).formatToParts(date);

	const year = parts.find(part => part.type === 'year')?.value;
	const month = parts.find(part => part.type === 'month')?.value;
	const day = parts.find(part => part.type === 'day')?.value;
	if (!year || !month || !day) {
		throw new Error('Could not format Pacific date');
	}
	return `${year}-${month}-${day}`;
}

export function addCalendarDays(dateStr: string, days: number): string {
	const [year, month, day] = dateStr.split('-').map(Number);
	const date = new Date(Date.UTC(year, month - 1, day + days, 12, 0, 0));
	return date.toISOString().slice(0, 10);
}

export function listDateStrings(startInclusive: string, endExclusive: string): string[] {
	const dates: string[] = [];
	for (let date = startInclusive; date < endExclusive; date = addCalendarDays(date, 1)) {
		dates.push(date);
	}
	return dates;
}

export function intervalOverlaps(
	startA: Date,
	endA: Date,
	startB: Date,
	endB: Date
): boolean {
	return startA < endB && endA > startB;
}

export function rulesOverlapTimedEvent(params: {
	dateStr: string;
	rules: AvailabilityRule[];
	eventStart: Date;
	eventEnd: Date;
	availabilityTimezone?: string;
}): boolean {
	const availabilityTimezone = params.availabilityTimezone || PACIFIC_TIMEZONE;
	for (const rule of params.rules) {
		const availabilityStart = createDateInTimezone(params.dateStr, rule.start_time, availabilityTimezone);
		const availabilityEnd = createDateInTimezone(params.dateStr, rule.end_time, availabilityTimezone);
		if (intervalOverlaps(params.eventStart, params.eventEnd, availabilityStart, availabilityEnd)) {
			return true;
		}
	}
	return false;
}

export async function getConsumedPacificDates(
	db: D1Database,
	userId: string,
	options: { excludeBookingId?: string | null; excludeProposalId?: string | null } = {}
): Promise<Set<string>> {
	const consumed = new Set<string>();
	await expireStaleRescheduleProposals(db, userId);

	try {
		let reservationSql = `SELECT pacific_date
			FROM booking_date_reservations
			WHERE user_id = ? AND released_at IS NULL`;
		const reservationBindings: string[] = [userId];
		if (options.excludeBookingId) {
			reservationSql += `
				AND (booking_id IS NULL OR booking_id != ?)
				AND (proposal_id IS NULL OR proposal_id NOT IN (
					SELECT id FROM reschedule_proposals WHERE booking_id = ?
				))`;
			reservationBindings.push(options.excludeBookingId, options.excludeBookingId);
		}
		if (options.excludeProposalId) {
			reservationSql += ` AND (proposal_id IS NULL OR proposal_id != ?)`;
			reservationBindings.push(options.excludeProposalId);
		}
		const reservations = await db
			.prepare(reservationSql)
			.bind(...reservationBindings)
			.all<{ pacific_date: string }>();

		for (const row of reservations.results || []) {
			consumed.add(row.pacific_date);
		}
	} catch (err) {
		// The migration may not exist in older local databases yet. Legacy
		// booking rows below still preserve occupied dates until migrations run.
		const message = err instanceof Error ? err.message : String(err);
		if (!message.includes('booking_date_reservations')) {
			throw err;
		}
	}

	const legacyBookings = await db
		.prepare(
			`SELECT id, start_time
			FROM bookings
			WHERE user_id = ? AND status != 'canceled'`
		)
		.bind(userId)
		.all<{ id: string; start_time: string }>();

	for (const booking of legacyBookings.results || []) {
		if (options.excludeBookingId && booking.id === options.excludeBookingId) continue;
		consumed.add(formatPacificDate(new Date(booking.start_time)));
	}

	return consumed;
}

export async function isPacificDateConsumed(
	db: D1Database,
	userId: string,
	pacificDate: string,
	options: { excludeBookingId?: string | null; excludeProposalId?: string | null } = {}
): Promise<boolean> {
	const consumed = await getConsumedPacificDates(db, userId, options);
	return consumed.has(pacificDate);
}

export async function closePendingRescheduleProposals(
	db: D1Database,
	bookingId: string,
	status: 'expired' | 'counter_proposed'
): Promise<void> {
	await db.batch([
		db
			.prepare(
				`UPDATE booking_date_reservations
				SET released_at = CURRENT_TIMESTAMP
				WHERE released_at IS NULL AND proposal_id IN (
					SELECT id FROM reschedule_proposals WHERE booking_id = ? AND status = 'pending'
				)`
			)
			.bind(bookingId),
		db
			.prepare(
				`UPDATE reschedule_proposals
				SET status = ?, responded_at = CURRENT_TIMESTAMP
				WHERE booking_id = ? AND status = 'pending'`
			)
			.bind(status, bookingId),
		...(status === 'expired'
			? [
					db
						.prepare(
							`UPDATE bookings
							SET status = 'confirmed'
							WHERE id = ? AND status = 'rescheduled'
							AND NOT EXISTS (
								SELECT 1 FROM reschedule_proposals
								WHERE booking_id = ? AND status = 'pending'
							)`
						)
						.bind(bookingId, bookingId)
				]
			: [])
	]);
}

export async function expireStaleRescheduleProposals(db: D1Database, userId: string): Promise<void> {
	const staleProposal = await db
		.prepare(
			`SELECT 1
			FROM reschedule_proposals p
			JOIN bookings b ON b.id = p.booking_id
			WHERE b.user_id = ? AND p.status = 'pending'
			AND p.expires_at IS NOT NULL AND p.expires_at <= CURRENT_TIMESTAMP
			LIMIT 1`
		)
		.bind(userId)
		.first();
	if (!staleProposal) return;

	await db.batch([
		db
			.prepare(
				`UPDATE booking_date_reservations
				SET released_at = CURRENT_TIMESTAMP
				WHERE user_id = ? AND released_at IS NULL AND proposal_id IN (
					SELECT p.id
					FROM reschedule_proposals p
					JOIN bookings b ON b.id = p.booking_id
					WHERE b.user_id = ? AND p.status = 'pending'
					AND p.expires_at IS NOT NULL AND p.expires_at <= CURRENT_TIMESTAMP
				)`
			)
			.bind(userId, userId),
		db
			.prepare(
				`UPDATE reschedule_proposals
				SET status = 'expired', responded_at = CURRENT_TIMESTAMP
				WHERE status = 'pending' AND expires_at IS NOT NULL
				AND expires_at <= CURRENT_TIMESTAMP
				AND booking_id IN (SELECT id FROM bookings WHERE user_id = ?)`
			)
			.bind(userId),
		db
			.prepare(
				`UPDATE bookings
				SET status = 'confirmed'
				WHERE user_id = ? AND status = 'rescheduled'
				AND id IN (
					SELECT booking_id FROM reschedule_proposals
					WHERE status = 'expired' AND expires_at IS NOT NULL AND expires_at <= CURRENT_TIMESTAMP
				)
				AND NOT EXISTS (
					SELECT 1 FROM reschedule_proposals
					WHERE booking_id = bookings.id AND status = 'pending'
				)`
			)
			.bind(userId)
	]);
}

export async function claimPacificDateReservation(
	db: D1Database,
	params: {
		id?: string;
		userId: string;
		pacificDate: string;
		bookingId?: string | null;
		proposalId?: string | null;
		kind: 'booking' | 'proposal';
	}
): Promise<string> {
	const id = params.id || crypto.randomUUID();
	try {
		await db
			.prepare(
				`INSERT INTO booking_date_reservations
				(id, user_id, pacific_date, booking_id, proposal_id, kind, created_at)
				VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
			)
			.bind(
				id,
				params.userId,
				params.pacificDate,
				params.bookingId || null,
				params.proposalId || null,
				params.kind
			)
			.run();
		return id;
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		if (message.toLowerCase().includes('unique') || message.toLowerCase().includes('constraint')) {
			throw error(409, 'This date is no longer available');
		}
		throw err;
	}
}

export async function releaseBookingDateReservations(
	db: D1Database,
	params: { bookingId?: string | null; proposalId?: string | null; pacificDate?: string | null }
): Promise<void> {
	if (params.bookingId && params.pacificDate) {
		await db
			.prepare(
				`UPDATE booking_date_reservations
				SET released_at = CURRENT_TIMESTAMP
				WHERE booking_id = ? AND pacific_date = ? AND released_at IS NULL`
			)
			.bind(params.bookingId, params.pacificDate)
			.run();
		return;
	}

	if (params.proposalId) {
		await db
			.prepare(
				`UPDATE booking_date_reservations
				SET released_at = CURRENT_TIMESTAMP
				WHERE proposal_id = ? AND released_at IS NULL`
			)
			.bind(params.proposalId)
			.run();
	}

	if (params.bookingId && !params.pacificDate) {
		await db
			.prepare(
				`UPDATE booking_date_reservations
				SET released_at = CURRENT_TIMESTAMP
				WHERE booking_id = ? AND released_at IS NULL`
			)
			.bind(params.bookingId)
			.run();
	}
}
