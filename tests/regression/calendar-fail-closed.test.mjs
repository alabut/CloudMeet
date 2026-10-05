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
	const restore = installFetchMock(async (url, init) => {
		const href = String(url);
		fetches.push(href);
		if (href.includes('/token')) return jsonResponse({ access_token: 'access-token' });
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
				startTime: '2030-01-07T10:00:00.000Z',
				endTime: '2030-01-07T10:30:00.000Z',
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

test('scheduled health probe performs an authenticated primary calendar read after token refresh', async () => {
	const { probeGoogleCalendarHealth } = await import('../../src/lib/server/google-calendar-health.ts');
	const db = makeDb();
	const fetches = [];
	const restore = installFetchMock(async (url) => {
		fetches.push(String(url));
		if (String(url).includes('/token')) return jsonResponse({ access_token: 'access-token' });
		if (String(url).includes('/freeBusy')) {
			return jsonResponse({ calendars: { primary: { errors: [{ reason: 'backendError' }], busy: [] } } });
		}
		throw new Error(`unexpected fetch ${url}`);
	});

	const result = await probeGoogleCalendarHealth(db, 'user-1', 'client', 'secret');

	assert.deepEqual(result, { ok: false, reason: 'unknown' });
	assert(fetches.some((url) => url.includes('/freeBusy')));
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
