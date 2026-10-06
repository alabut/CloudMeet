import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { registerHooks } from 'node:module';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

const routeModules = new Map();
const projectRoot = new URL('../../', import.meta.url);

registerHooks({
	resolve(specifier, context, nextResolve) {
		if (specifier.startsWith('$lib/')) {
			const relative = specifier.replace('$lib/', 'src/lib/');
			return nextResolve(new URL(`${relative}.ts`, projectRoot).href, context);
		}
		if (specifier === './auth.js' && context.parentURL?.endsWith('/src/lib/server/google-calendar.ts')) {
			return nextResolve(new URL('src/lib/server/auth.ts', projectRoot).href, context);
		}
		if ((specifier.startsWith('./') || specifier.startsWith('../')) && context.parentURL) {
			const target = new URL(specifier, context.parentURL);
			if (!target.pathname.match(/\.[cm]?[jt]s$/)) {
				const tsPath = `${target.pathname}.ts`;
				if (existsSync(tsPath)) return nextResolve(pathToFileURL(tsPath).href, context);
				const indexTsPath = `${target.pathname}/index.ts`;
				if (existsSync(indexTsPath)) return nextResolve(pathToFileURL(indexTsPath).href, context);
			}
		}
		return nextResolve(specifier, context);
	}
});

async function loadRoute(path) {
	if (!routeModules.has(path)) {
		const module = await import(pathToFileURL(new URL(path.replace(/^\//, ''), projectRoot).pathname));
		routeModules.set(path, module);
	}
	return routeModules.get(path);
}

function jsonResponse(body, init = {}) {
	return new Response(JSON.stringify(body), {
		status: init.status ?? 200,
		headers: { 'Content-Type': 'application/json' }
	});
}

function textResponse(body, init = {}) {
	return new Response(body, { status: init.status ?? 200 });
}

function makeKv() {
	const store = new Map();
	return {
		puts: [],
		deletes: [],
		async get(key) {
			return store.get(key) ?? null;
		},
		async put(key, value, options) {
			this.puts.push({ key, value, options });
			store.set(key, value);
		},
		async delete(key) {
			this.deletes.push(key);
			store.delete(key);
		}
	};
}

function makeDb(overrides = {}) {
	const state = {
		bookingInserts: 0,
		...overrides
	};

	const rows = {
		user: {
			id: 'user-1',
			email: 'host@example.com',
			name: 'AL',
			slug: '30min',
			contact_email: null,
			timezone: 'UTC',
			settings: JSON.stringify({
				defaultAvailabilityCalendars: 'google',
				defaultInviteCalendar: 'google',
				selectedGoogleCalendars: ['primary']
			}),
			brand_color: '#3b82f6',
			outlook_refresh_token: null,
			google_refresh_token: 'refresh-token'
		},
		eventType: {
			id: 'event-1',
			name: '30-minute conversation',
			duration: 30,
			description: 'A conversation',
			availability_calendars: 'google',
			invite_calendar: 'google'
		},
		availabilityRules: [{ start_time: '09:00', end_time: '17:00' }],
		monthAvailabilityRules: [{ day_of_week: 1, start_time: '09:00', end_time: '17:00' }],
		bookings: [],
		conflict: null,
		...overrides.rows
	};

	function resultFor(sql, binds, method) {
		if (sql.includes('SELECT id, slug, timezone, settings FROM users LIMIT 1')) return rows.user;
		if (sql.includes('SELECT id, email, name, slug, contact_email, settings')) return rows.user;
		if (sql.includes('SELECT google_refresh_token FROM users WHERE id = ?')) {
			return { google_refresh_token: rows.user.google_refresh_token };
		}
		if (sql.includes('SELECT id, duration_minutes as duration, availability_calendars')) {
			return rows.eventType;
		}
		if (sql.includes('SELECT id, name, duration_minutes as duration')) {
			return rows.eventType;
		}
		if (sql.includes('FROM availability_rules') && sql.includes('day_of_week')) {
			return method === 'all' ? { results: rows.availabilityRules } : rows.availabilityRules[0];
		}
		if (sql.includes('FROM availability_rules')) {
			return { results: rows.monthAvailabilityRules };
		}
		if (sql.includes('FROM bookings') && sql.includes("status = 'confirmed'")) {
			if (method === 'first') return rows.conflict;
			return { results: rows.bookings };
		}
		if (sql.includes('INSERT INTO bookings')) {
			return {
				async run() {
					state.bookingInserts += 1;
					return { success: true };
				}
			};
		}
		return method === 'all' ? { results: [] } : null;
	}

	return {
		state,
		prepare(sql) {
			const query = {
				binds: [],
				bind(...values) {
					this.binds = values;
					return this;
				},
				async first() {
					return resultFor(sql, this.binds, 'first');
				},
				async all() {
					return resultFor(sql, this.binds, 'all');
				},
				async run() {
					const result = resultFor(sql, this.binds, 'run');
					return typeof result?.run === 'function' ? result.run() : { success: true };
				}
			};
			return query;
		}
	};
}

function makeEnv(db = makeDb()) {
	return {
		DB: db,
		KV: makeKv(),
		GOOGLE_CLIENT_ID: 'client',
		GOOGLE_CLIENT_SECRET: 'secret',
		APP_URL: 'https://cloudmeet.example',
		HEALTHCHECK_URL: 'https://hc.example/check'
	};
}

function installFetchMock(handler) {
	const originalFetch = globalThis.fetch;
	globalThis.fetch = handler;
	return () => {
		globalThis.fetch = originalFetch;
	};
}

test('Google FreeBusy per-calendar errors and missing required calendars fail closed', async () => {
	const google = await import('../../src/lib/server/google-calendar.ts');

	let restore = installFetchMock(async () => jsonResponse({
		calendars: {
			primary: {
				errors: [{ reason: 'notFound' }],
				busy: []
			}
		}
	}));

	await assert.rejects(
		() => google.getBusyTimes('token', new Date('2030-01-01T00:00:00Z'), new Date('2030-01-02T00:00:00Z'), ['primary']),
		/calendar/i
	);
	restore();

	restore = installFetchMock(async () => jsonResponse({ calendars: {} }));
	await assert.rejects(
		() => google.getBusyTimes('token', new Date('2030-01-01T00:00:00Z'), new Date('2030-01-02T00:00:00Z'), ['primary']),
		/calendar/i
	);
	restore();

	restore = installFetchMock(async (url) => {
		if (String(url).includes('/calendarList')) return jsonResponse({ items: [] });
		if (String(url).includes('/freeBusy')) return jsonResponse({ calendars: {} });
		throw new Error(`unexpected fetch ${url}`);
	});
	await assert.rejects(
		() => google.getBusyTimes('token', new Date('2030-01-01T00:00:00Z'), new Date('2030-01-02T00:00:00Z')),
		/calendar/i
	);
	restore();
});

test('day availability returns a machine-readable calendar outage and does not cache empty slots', async () => {
	const { GET } = await loadRoute('/src/routes/api/availability/+server.ts');
	const env = makeEnv();
	const fetches = [];
	const restore = installFetchMock(async (url) => {
		fetches.push(String(url));
		if (String(url).includes('/token')) return jsonResponse({ access_token: 'access-token' });
		if (String(url).includes('/freeBusy')) return textResponse('calendar unavailable', { status: 503 });
		if (String(url).startsWith('https://hc.example')) return textResponse('ok');
		throw new Error(`unexpected fetch ${url}`);
	});

	const response = await GET({
		url: new URL('https://local.test/api/availability?event=30min&date=2030-01-07'),
		platform: { env }
	});

	assert.equal(response.status, 503);
	assert.deepEqual(await response.json(), {
		error: 'calendar_unavailable',
		code: 'calendar_unavailable',
		message: 'Availability is temporarily unavailable because the host calendar could not be checked. Please try again soon.'
	});
	assert.equal(env.KV.puts.length, 0);
	assert(fetches.some((url) => url === 'https://hc.example/check/fail'));
	restore();
});

test('month availability returns a machine-readable calendar outage and does not cache an empty month', async () => {
	const { GET } = await loadRoute('/src/routes/api/availability/month/+server.ts');
	const env = makeEnv();
	const restore = installFetchMock(async (url) => {
		if (String(url).includes('/token')) return jsonResponse({ access_token: 'access-token' });
		if (String(url).includes('/freeBusy')) return jsonResponse({ calendars: {} });
		if (String(url).startsWith('https://hc.example')) return textResponse('ok');
		throw new Error(`unexpected fetch ${url}`);
	});

	const response = await GET({
		url: new URL('https://local.test/api/availability/month?event=30min&month=2030-01'),
		platform: { env }
	});

	assert.equal(response.status, 503);
	assert.equal((await response.json()).code, 'calendar_unavailable');
	assert.equal(env.KV.puts.length, 0);
	restore();
});

test('booking submission revalidates Google availability before invite creation or confirmed insert', async () => {
	const { POST } = await loadRoute('/src/routes/api/bookings/+server.ts');
	const db = makeDb();
	const env = makeEnv(db);
	const fetches = [];
	let createInviteCalls = 0;
	const start = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
	start.setUTCHours(18, 0, 0, 0);
	const end = new Date(start.getTime() + 30 * 60 * 1000);
	const restore = installFetchMock(async (url, init) => {
		const href = String(url);
		fetches.push(href);
		if (href.includes('/token')) return jsonResponse({ access_token: 'access-token' });
		if (href.includes('/calendars/primary/events')) return jsonResponse({ items: [] });
		if (href.includes('/freeBusy')) return textResponse('calendar unavailable', { status: 503 });
		if (href.includes('/events') && init?.method === 'POST') {
			createInviteCalls += 1;
			return jsonResponse({ id: 'google-event-1' });
		}
		if (href.startsWith('https://hc.example')) return textResponse('ok');
		throw new Error(`unexpected fetch ${url}`);
	});

	const response = await POST({
		request: new Request('https://local.test/api/bookings', {
			method: 'POST',
			body: JSON.stringify({
				eventSlug: '30min',
				startTime: start.toISOString(),
				endTime: end.toISOString(),
				attendeeName: 'Booker',
				attendeeEmail: 'booker@example.com'
			})
		}),
		platform: { env }
	});

	assert.equal(response.status, 503);
	assert.equal((await response.json()).code, 'calendar_unavailable');
	assert.equal(createInviteCalls, 0);
	assert.equal(db.state.bookingInserts, 0);
	assert(fetches.includes('https://hc.example/check/fail'));
	restore();
});

test('scheduled health probe fails closed when the primary Events API read fails', async () => {
	const { probeGoogleCalendarHealth } = await import('../../src/lib/server/google-calendar-health.ts');
	const db = makeDb();
	const fetches = [];
	const restore = installFetchMock(async (url) => {
		fetches.push(String(url));
		if (String(url).includes('/token')) return jsonResponse({ access_token: 'access-token' });
		if (String(url).includes('/calendars/primary/events')) {
			return textResponse('backend error', { status: 503 });
		}
		throw new Error(`unexpected fetch ${url}`);
	});

	const result = await probeGoogleCalendarHealth(db, 'user-1', 'client', 'secret');

	assert.deepEqual(result, { ok: false, reason: 'unknown' });
	assert(fetches.some((url) => url.includes('/calendars/primary/events')));
	restore();
});

test('public booking page has distinct calendar-outage UI state separate from valid empty availability', async () => {
	const source = await readFile(new URL('../../src/routes/[slug]/+page.svelte', import.meta.url), 'utf8');
	const timeSlotSource = await readFile(new URL('../../src/lib/components/booking/TimeSlotList.svelte', import.meta.url), 'utf8');

	assert.match(source, /availabilityStatus/);
	assert.match(source, /calendar_unavailable/);
	assert.match(source, /Availability is temporarily unavailable/);
	assert.match(source, /calendar-availability-alert/);
	assert.match(source, /Retry availability/);
	assert.match(source, /onclick=\{fetchMonthAvailability\}/);
	assert.match(timeSlotSource, /availabilityStatus/);
	assert.match(timeSlotSource, /role="alert"/);
	assert.match(timeSlotSource, /Retry availability/);
	assert.match(timeSlotSource, /Availability is temporarily unavailable/);
	assert.match(timeSlotSource, /No times available/);
});

test('scheduled worker reports calendar failure and sends a success signal after recovery', async () => {
	const { default: worker } = await import('../../workers/cron-reminders/worker.js');
	const env = {
		APP_URL: 'https://cloudmeet.test',
		CRON_SECRET: 'local-test-secret',
		HEALTHCHECK_URL: 'https://hc.example/check'
	};
	const fetches = [];
	let calendarHealthy = false;
	const restore = installFetchMock(async (url) => {
		const href = String(url);
		fetches.push(href);
		if (href.includes('/api/cron/send-reminders')) return jsonResponse({ ok: true });
		if (href.includes('/api/cron/health')) return jsonResponse({ ok: calendarHealthy });
		if (href === 'https://hc.example/check/fail' || href === 'https://hc.example/check') {
			return textResponse('ok');
		}
		throw new Error(`unexpected fetch ${url}`);
	});

	await worker.scheduled({}, env);
	assert(fetches.includes('https://hc.example/check/fail'));

	calendarHealthy = true;
	fetches.length = 0;
	await worker.scheduled({}, env);
	assert(fetches.includes('https://hc.example/check'));
	assert(!fetches.includes('https://hc.example/check/fail'));
	restore();
});

test('rolling booking window is lower-inclusive and upper-exclusive', async () => {
	const {
		getBookingWindow,
		isStartInBookingWindow,
		filterSlotsToBookingWindow
	} = await import('../../src/lib/server/booking-rules.ts');
	const now = new Date('2030-03-01T12:00:00.000Z');
	const window = getBookingWindow(now);

	assert.equal(window.start.toISOString(), '2030-03-03T12:00:00.000Z');
	assert.equal(window.end.toISOString(), '2030-03-17T12:00:00.000Z');
	assert.equal(isStartInBookingWindow(new Date('2030-03-03T11:59:59.999Z'), now), false);
	assert.equal(isStartInBookingWindow(new Date('2030-03-03T12:00:00.000Z'), now), true);
	assert.equal(isStartInBookingWindow(new Date('2030-03-17T11:59:59.999Z'), now), true);
	assert.equal(isStartInBookingWindow(new Date('2030-03-17T12:00:00.000Z'), now), false);

	assert.deepEqual(filterSlotsToBookingWindow([
		{ start: '2030-03-03T11:59:59.999Z', end: '2030-03-03T12:29:59.999Z' },
		{ start: '2030-03-03T12:00:00.000Z', end: '2030-03-03T12:30:00.000Z' },
		{ start: '2030-03-17T12:00:00.000Z', end: '2030-03-17T12:30:00.000Z' }
	], now), [
		{ start: '2030-03-03T12:00:00.000Z', end: '2030-03-03T12:30:00.000Z' }
	]);
});

test('Pacific date grouping handles UTC midnight and DST boundaries', async () => {
	const { formatPacificDate } = await import('../../src/lib/server/booking-rules.ts');

	assert.equal(formatPacificDate(new Date('2030-01-10T07:59:59.000Z')), '2030-01-09');
	assert.equal(formatPacificDate(new Date('2030-01-10T08:00:00.000Z')), '2030-01-10');
	assert.equal(formatPacificDate(new Date('2030-03-10T09:59:59.000Z')), '2030-03-10');
	assert.equal(formatPacificDate(new Date('2030-03-10T10:00:00.000Z')), '2030-03-10');
	assert.equal(formatPacificDate(new Date('2030-11-03T08:59:59.000Z')), '2030-11-03');
	assert.equal(formatPacificDate(new Date('2030-11-03T09:00:00.000Z')), '2030-11-03');
});

test('primary calendar blackouts include free all-day and timed availability overlaps only', async () => {
	const { getPrimaryBlackoutDates } = await import('../../src/lib/server/primary-calendar-blackouts.ts');

	const rulesByDate = new Map([
		['2030-04-10', [{ start_time: '09:00', end_time: '17:00' }]],
		['2030-04-11', [{ start_time: '09:00', end_time: '17:00' }]],
		['2030-04-12', [{ start_time: '09:00', end_time: '17:00' }]],
		['2030-04-13', [{ start_time: '09:00', end_time: '17:00' }]]
	]);
	const blackouts = getPrimaryBlackoutDates({
		rulesByDate,
		events: [
			{
				id: 'free-all-day',
				status: 'confirmed',
				transparency: 'transparent',
				start: { date: '2030-04-10' },
				end: { date: '2030-04-12' }
			},
			{
				id: 'outside-hours',
				status: 'confirmed',
				transparency: 'transparent',
				start: { dateTime: '2030-04-12T03:00:00.000-07:00' },
				end: { dateTime: '2030-04-12T04:00:00.000-07:00' }
			},
			{
				id: 'inside-hours',
				status: 'confirmed',
				transparency: 'transparent',
				start: { dateTime: '2030-04-13T09:30:00.000-07:00' },
				end: { dateTime: '2030-04-13T10:00:00.000-07:00' }
			},
			{
				id: 'cancelled',
				status: 'cancelled',
				start: { date: '2030-04-12' },
				end: { date: '2030-04-13' }
			}
		]
	});

	assert.deepEqual([...blackouts].sort(), ['2030-04-10', '2030-04-11', '2030-04-13']);
});

test('date reservation uniqueness produces one same-date winner', async () => {
	const { claimPacificDateReservation } = await import('../../src/lib/server/booking-rules.ts');
	const active = new Set();
	const db = {
		prepare() {
			return {
				bind(_id, userId, pacificDate) {
					this.key = `${userId}:${pacificDate}`;
					return this;
				},
				async run() {
					if (active.has(this.key)) throw new Error('UNIQUE constraint failed');
					active.add(this.key);
					return { success: true };
				}
			};
		}
	};

	const first = await claimPacificDateReservation(db, {
		id: 'reservation-1',
		userId: 'user-1',
		pacificDate: '2030-05-01',
		bookingId: 'booking-1',
		kind: 'booking'
	});
	assert.equal(first, 'reservation-1');
	await assert.rejects(
		() => claimPacificDateReservation(db, {
			id: 'reservation-2',
			userId: 'user-1',
			pacificDate: '2030-05-01',
			bookingId: 'booking-2',
			kind: 'booking'
		}),
		/date is no longer available/
	);
});

test('legacy canceled booking rows keep their Pacific date consumed', async () => {
	const { getConsumedPacificDates } = await import('../../src/lib/server/booking-rules.ts');
	const db = {
		prepare(sql) {
			return {
				bind() {
					return this;
				},
				async first() {
					return null;
				},
				async all() {
					if (sql.includes('booking_date_reservations')) return { results: [] };
					return {
						results: [
							{ id: 'cancelled-booking', start_time: '2030-01-10T07:30:00.000Z' }
						]
					};
				}
			};
		},
		async batch() { return []; }
	};

	assert.deepEqual(await getConsumedPacificDates(db, 'user-1'), new Set(['2030-01-09']));
});

test('scheduled health probe uses the primary Events API read', async () => {
	const { probeGoogleCalendarHealth } = await import('../../src/lib/server/google-calendar-health.ts');
	const db = makeDb();
	const fetches = [];
	const restore = installFetchMock(async (url) => {
		const href = String(url);
		fetches.push(href);
		if (href.includes('/token')) return jsonResponse({ access_token: 'access-token' });
		if (href.includes('/calendars/primary/events')) return jsonResponse({ items: [] });
		throw new Error(`unexpected fetch ${url}`);
	});

	const result = await probeGoogleCalendarHealth(db, 'user-1', 'client', 'secret');

	assert.deepEqual(result, { ok: true });
	assert(fetches.some((url) => url.includes('/calendars/primary/events')));
	assert(!fetches.some((url) => url.includes('/freeBusy')));
	restore();
});

test('day availability ignores stale cached slots outside the rolling window', async () => {
	const source = await readFile(new URL('../../src/routes/api/availability/+server.ts', import.meta.url), 'utf8');

	assert.doesNotMatch(source, /KV\.get\(cacheKey\)/);
	assert.doesNotMatch(source, /KV\.put\(cacheKey/);
	assert.match(source, /filterSlotsToBookingWindow/);
	assert.match(source, /getPrimaryCalendarEvents/);
});

test('month availability ignores stale cached dates outside the rolling window', async () => {
	const source = await readFile(new URL('../../src/routes/api/availability/month/+server.ts', import.meta.url), 'utf8');

	assert.doesNotMatch(source, /KV\.get\(cacheKey\)/);
	assert.doesNotMatch(source, /KV\.put\(cacheKey/);
	assert.match(source, /filterSlotsToBookingWindow/);
	assert.match(source, /getPrimaryCalendarEvents/);
});

test('secondary calendars stay slot-only while primary events drive date blackouts', async () => {
	const daySource = await readFile(new URL('../../src/routes/api/availability/+server.ts', import.meta.url), 'utf8');
	const blackoutSource = await readFile(new URL('../../src/lib/server/primary-calendar-blackouts.ts', import.meta.url), 'utf8');

	assert.match(daySource, /getPrimaryCalendarEvents\(googleAccessToken/);
	assert.match(daySource, /getBusyTimes\(googleAccessToken, startOfDay, endOfDay, selectedCalendars\)/);
	assert.match(blackoutSource, /event\.start\.date/);
	assert.match(blackoutSource, /rulesOverlapTimedEvent/);
});

test('direct reschedule reserves destination and releases source only after booking update', async () => {
	const source = await readFile(new URL('../../src/routes/api/bookings/reschedule/+server.ts', import.meta.url), 'utf8');
	const stateUpdateSection = source.slice(source.indexOf('const stateStatements'), source.indexOf('const stateResults'));

	assert.match(source, /assertStartInBookingWindow\(newStartTime\)/);
	assert.match(source, /claimPacificDateReservation\(db, \{\s*userId: originalBooking\.user_id,\s*pacificDate: destinationPacificDate,\s*bookingId,/s);
	assert.match(stateUpdateSection, /UPDATE bookings SET[\s\S]*UPDATE booking_date_reservations[\s\S]*AND \$\{bookingMoved\}/);
	assert.match(stateUpdateSection, /WHERE booking_id = \? AND pacific_date = \? AND released_at IS NULL[\s\S]*AND \$\{bookingMoved\}/);
	assert.match(source, /releaseBookingDateReservations\(db, \{ bookingId, pacificDate: destinationPacificDate \}\)/);
});

test('direct reschedule adopts its own proposal hold and preserves date-conflict status', async () => {
	const source = await readFile(new URL('../../src/routes/api/bookings/reschedule/+server.ts', import.meta.url), 'utf8');
	const claimSection = source.slice(source.indexOf('const matchingProposalReservation'), source.indexOf('// Cancel old calendar event'));
	const stateUpdateSection = source.slice(source.indexOf('const stateStatements'), source.indexOf('const stateResults'));
	const calendarMutationCatchStart = source.indexOf('} catch (err: any) {', source.indexOf('newCalendarEventId = calendarEvent.id'));
	const calendarMutationCatch = source.slice(calendarMutationCatchStart, source.indexOf('try {\n\t\t\tconst bookingMoved', calendarMutationCatchStart));

	assert.match(claimSection, /FROM booking_date_reservations[\s\S]*JOIN reschedule_proposals[\s\S]*p\.booking_id = \?/);
	assert.match(claimSection, /destinationPacificDate !== sourcePacificDate && !matchingProposalReservation[\s\S]*claimPacificDateReservation/);
	assert.match(stateUpdateSection, /SET booking_id = \?, proposal_id = NULL, kind = 'booking'[\s\S]*proposal_id = \?/);
	assert.match(calendarMutationCatch, /err\?\.status === 409[\s\S]*throw err/);
});

test('reschedules cancel the old calendar event only after the guarded booking commit', async () => {
	const direct = await readFile(new URL('../../src/routes/api/bookings/reschedule/+server.ts', import.meta.url), 'utf8');
	const response = await readFile(new URL('../../src/routes/reschedule-response/[token]/+page.server.ts', import.meta.url), 'utf8');
	const acceptSection = response.slice(response.indexOf('accept: async'), response.indexOf('decline: async'));

	const directCommit = direct.indexOf('const stateResults = await db.batch');
	const directOldCancel = direct.indexOf('cancelCalendarEvent(accessToken, originalBooking.google_event_id)');
	assert.ok(directCommit > 0 && directOldCancel > directCommit, 'direct reschedule must cancel the old event after commit');

	const acceptCommit = acceptSection.indexOf('acceptResults = await db.batch');
	const acceptOldCancel = acceptSection.indexOf('proposal.google_event_id)');
	assert.ok(acceptCommit > 0 && acceptOldCancel > acceptCommit, 'accepted proposal must cancel the old event after commit');
	assert.match(acceptSection, /acceptResults\[0\]\?\.meta\?\.changes === 0[\s\S]*proposalReservationClaimed[\s\S]*releaseBookingDateReservations\(db, \{ proposalId: proposal\.id \}\)/);
});

test('pending proposals hold destination dates and clean up failed proposal claims', async () => {
	const source = await readFile(new URL('../../src/routes/api/bookings/propose-reschedule/+server.ts', import.meta.url), 'utf8');

	assert.match(source, /assertStartInBookingWindow\(proposedStartTime\)/);
	assert.match(source, /claimPacificDateReservation\(db, \{\s*userId: booking\.user_id,\s*pacificDate: destinationPacificDate,\s*proposalId,/s);
	assert.match(source, /UPDATE bookings\s+SET status = 'rescheduled'/);
	assert.match(source, /releaseBookingDateReservations\(db, \{ proposalId \}\)/);
	assert.match(source, /DELETE FROM reschedule_proposals WHERE id = \?/);
});

test('proposal creation cannot revive a canceled or changed booking', async () => {
	const source = await readFile(new URL('../../src/routes/api/bookings/propose-reschedule/+server.ts', import.meta.url), 'utf8');

	assert.match(source, /UPDATE bookings\s+SET status = 'rescheduled'\s+WHERE id = \? AND status = 'confirmed' AND start_time = \?/);
	assert.match(source, /bookingUpdate\.meta\?\.changes !== 1[\s\S]*throw error\(409, 'Booking is no longer available to reschedule'\)/);
});

test('accepted proposals move the reservation and declined proposals keep source consumed', async () => {
	const source = await readFile(new URL('../../src/routes/reschedule-response/[token]/+page.server.ts', import.meta.url), 'utf8');
	const acceptSection = source.slice(source.indexOf('accept: async'), source.indexOf('decline: async'));
	const declineSection = source.slice(source.indexOf('decline: async'));

	assert.match(acceptSection, /assertStartInBookingWindow\(proposal\.proposed_start_time\)/);
	assert.match(acceptSection, /SET status = 'accepted'/);
	assert.match(acceptSection, /SET booking_id = \?, proposal_id = NULL, kind = 'booking'/);
	assert.match(acceptSection, /SET released_at = CURRENT_TIMESTAMP[\s\S]*WHERE booking_id = \? AND pacific_date = \?/);
	assert.match(declineSection, /UPDATE bookings SET status = 'canceled'/);
	assert.match(declineSection, /releaseBookingDateReservations\(db, \{ proposalId: proposal\.id \}\)/);
	assert.doesNotMatch(declineSection, /pacificDate: sourcePacificDate/);
});

test('standalone cancellations do not release consumed Pacific dates', async () => {
	const dashboardCancel = await readFile(new URL('../../src/routes/api/bookings/cancel/+server.ts', import.meta.url), 'utf8');
	const attendeeCancel = await readFile(new URL('../../src/routes/cancel/[id]/+page.server.ts', import.meta.url), 'utf8');

	assert.doesNotMatch(dashboardCancel, /releaseBookingDateReservations/);
	assert.doesNotMatch(attendeeCancel, /releaseBookingDateReservations/);
	assert.match(dashboardCancel, /UPDATE bookings SET status = \?/);
	assert.match(attendeeCancel, /UPDATE bookings SET status = \?/);
});

test('cancelling a booking closes pending proposals and releases only their destination holds', async () => {
	const rulesSource = await readFile(new URL('../../src/lib/server/booking-rules.ts', import.meta.url), 'utf8');
	const dashboardCancel = await readFile(new URL('../../src/routes/api/bookings/cancel/+server.ts', import.meta.url), 'utf8');
	const attendeeCancel = await readFile(new URL('../../src/routes/cancel/[id]/+page.server.ts', import.meta.url), 'utf8');
	const directReschedule = await readFile(new URL('../../src/routes/api/bookings/reschedule/+server.ts', import.meta.url), 'utf8');

	assert.match(rulesSource, /export async function closePendingRescheduleProposals/);
	assert.match(rulesSource, /UPDATE booking_date_reservations[\s\S]*proposal_id IN \(\s*SELECT id FROM reschedule_proposals/);
	assert.match(dashboardCancel, /closePendingRescheduleProposals\(db, bookingId, 'expired'\)/);
	assert.match(attendeeCancel, /closePendingRescheduleProposals\(db, bookingId, 'expired'\)/);
	assert.match(directReschedule, /UPDATE booking_date_reservations[\s\S]*proposal_id IN \([\s\S]*UPDATE reschedule_proposals\s+SET status = 'counter_proposed'/);
});

test('expired proposal holds are released and legacy bookings stay in the date-cap check', async () => {
	const rules = await import('../../src/lib/server/booking-rules.ts');
	const statements = [];
	const db = {
		prepare(sql) {
			return {
				sql,
				bind(...values) {
					this.values = values;
					return this;
				},
				async first() {
					return /SELECT 1\s+FROM reschedule_proposals/.test(sql) ? { pending: 1 } : null;
				}
			};
		},
		async batch(queries) {
			statements.push(...queries.map(query => ({ sql: query.sql, values: query.values || [] })));
			return [];
		}
	};

	await rules.expireStaleRescheduleProposals(db, 'user-1');
	assert.equal(statements.length, 3);
	assert.match(statements[0].sql, /UPDATE booking_date_reservations[\s\S]*proposal_id IN/);
	assert.match(statements[1].sql, /UPDATE reschedule_proposals\s+SET status = 'expired'/);
	assert.match(statements[2].sql, /UPDATE bookings\s+SET status = 'confirmed'/);

	const legacyDb = {
		prepare(sql) {
			return {
				bind() { return this; },
				async first() { return null; },
				async all() {
					if (sql.includes('booking_date_reservations')) return { results: [] };
					return { results: [
						{ id: 'source-booking', start_time: '2030-01-10T07:30:00.000Z' },
						{ id: 'legacy-booking', start_time: '2030-01-11T07:30:00.000Z' }
					] };
				}
			};
		},
		async batch() { return []; }
	};
	const consumed = await rules.getConsumedPacificDates(legacyDb, 'user-1', {
		excludeBookingId: 'source-booking',
		excludeProposalId: 'proposal-1'
	});
	assert.deepEqual([...consumed].sort(), ['2030-01-10']);
});

test('proposal acceptance requires the original booking to remain pending and checks legacy date claims', async () => {
	const source = await readFile(new URL('../../src/routes/reschedule-response/[token]/+page.server.ts', import.meta.url), 'utf8');
	const acceptSection = source.slice(source.indexOf('accept: async'), source.indexOf('decline: async'));

	assert.match(acceptSection, /booking_status/);
	assert.match(acceptSection, /booking_status !== 'rescheduled'/);
	assert.match(acceptSection, /isPacificDateConsumed\(db, proposal\.user_id, destinationPacificDate, \{\s*excludeBookingId: proposal\.booking_id,\s*excludeProposalId: proposal\.id/s);
	assert.match(acceptSection, /proposal\.is_expired/);
	assert.match(acceptSection, /catch[\s\S]*This time is outside the booking window/);
});

test('malformed successful Calendar responses are unverifiable, not free', async () => {
	const google = await import('../../src/lib/server/google-calendar.ts');
	let restore = installFetchMock(async () => jsonResponse({ calendars: { primary: {} } }));
	await assert.rejects(
		() => google.getBusyTimes('token', new Date('2030-01-01T00:00:00Z'), new Date('2030-01-02T00:00:00Z'), ['primary']),
		/invalid FreeBusy busy intervals/i
	);
	restore();

	restore = installFetchMock(async () => jsonResponse({ calendars: { primary: { busy: [{ start: 'not-a-date', end: '2030-01-01T01:00:00Z' }] } } }));
	await assert.rejects(
		() => google.getBusyTimes('token', new Date('2030-01-01T00:00:00Z'), new Date('2030-01-02T00:00:00Z'), ['primary']),
		/invalid FreeBusy busy interval/i
	);
	restore();

	restore = installFetchMock(async () => jsonResponse({ calendars: { primary: { errors: {}, busy: [] } } }));
	await assert.rejects(
		() => google.getBusyTimes('token', new Date('2030-01-01T00:00:00Z'), new Date('2030-01-02T00:00:00Z'), ['primary']),
		/invalid FreeBusy calendar errors/i
	);
	restore();

	restore = installFetchMock(async () => jsonResponse({}));
	await assert.rejects(
		() => google.getPrimaryCalendarEvents('token', new Date('2030-01-01T00:00:00Z'), new Date('2030-01-02T00:00:00Z')),
		/invalid Events API response/i
	);
	restore();

	const { getPrimaryBlackoutDates } = await import('../../src/lib/server/primary-calendar-blackouts.ts');
	assert.throws(
		() => getPrimaryBlackoutDates({
			rulesByDate: new Map(),
			events: [{ id: 'malformed', status: 'confirmed', start: {}, end: {} }]
		}),
		/unverifiable primary calendar event/i
	);
});

test('availability routes use one request-start timestamp for exact booking-window boundaries', async () => {
	const daySource = await readFile(new URL('../../src/routes/api/availability/+server.ts', import.meta.url), 'utf8');
	const monthSource = await readFile(new URL('../../src/routes/api/availability/month/+server.ts', import.meta.url), 'utf8');

	assert.match(daySource, /const requestStartedAt = new Date\(\)/);
	assert.match(daySource, /filterSlotsToBookingWindow\([\s\S]*requestStartedAt/);
	assert.match(monthSource, /const requestStartedAt = new Date\(\)/);
	assert.match(monthSource, /getBookingWindow\(requestStartedAt\)/);
	assert.match(monthSource, /filterSlotsToBookingWindow\([\s\S]*requestStartedAt/);
});

test('monthly selected-calendar queries cover Pacific month boundaries', async () => {
	const monthSource = await readFile(new URL('../../src/routes/api/availability/month/+server.ts', import.meta.url), 'utf8');

	assert.match(monthSource, /const pacificMonthStart = createDateInTimezone\([\s\S]*PACIFIC_TIMEZONE\)/);
	assert.match(monthSource, /const pacificMonthEnd = createDateInTimezone\([\s\S]*PACIFIC_TIMEZONE\)/);
	assert.match(monthSource, /getBusyTimes\(googleAccessToken, pacificMonthStart, pacificMonthEnd, selectedCalendars\)/);
});
