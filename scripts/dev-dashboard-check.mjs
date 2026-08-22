#!/usr/bin/env node
/**
 * Local-only dashboard verification.
 *
 * WHY THIS EXISTS
 * The dashboard sits behind a real Google OAuth login. Automated agents cannot
 * log in (they must never type a password), so every dashboard page has been
 * invisible to automated checks -- which is exactly where several bugs hid.
 *
 * HOW IT WORKS
 * Session tokens in this app are self-contained: base64(payload) + "." +
 * sha256(payload + JWT_SECRET), verified with no database lookup (see
 * src/lib/server/auth.ts). So a valid session can be minted directly from the
 * local secret, with no browser and no login.
 *
 * WHY THIS IS SAFE
 *   - It reads JWT_SECRET from .dev.vars at runtime and NEVER prints it. The
 *     minted token is never written to disk or stdout either.
 *   - The token is signed with the LOCAL secret. Production uses a different
 *     secret, so a token minted here is worthless against the live site.
 *   - The target host is hardcoded to localhost and validated below. Pointing
 *     this at production is refused, not merely discouraged.
 *   - It changes nothing in the app. There is no bypass in application code,
 *     no dev-only auth branch, nothing that could ship. Delete this file and
 *     the app is unchanged.
 *
 * USAGE
 *   node scripts/dev-dashboard-check.mjs [port]
 * Requires a local dev server (npm run dev) and local D1 seeded with a user.
 */

import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const PORT = process.argv[2] ?? '8788';
const ORIGIN = `http://localhost:${PORT}`;

// Refuse to run against anything but loopback. Belt and braces: the origin is
// built from a port only, but validate anyway so a future edit cannot widen it.
if (!/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(ORIGIN)) {
	console.error(`Refusing to run against non-local origin: ${ORIGIN}`);
	process.exit(1);
}

function readLocalSecret() {
	// Read .dev.vars WITHOUT echoing it anywhere.
	let raw;
	try {
		raw = readFileSync(new URL('../.dev.vars', import.meta.url), 'utf8');
	} catch {
		console.error('Could not read .dev.vars. Run this from the repo with local dev configured.');
		process.exit(1);
	}
	const line = raw.split('\n').find((l) => l.trim().startsWith('JWT_SECRET'));
	if (!line) {
		console.error('JWT_SECRET not found in .dev.vars');
		process.exit(1);
	}
	return line.slice(line.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '');
}

function localUserId() {
	const out = execFileSync(
		'npx',
		['wrangler', 'd1', 'execute', 'cloudmeet', '--local', '--command', 'SELECT id FROM users LIMIT 1;', '--json'],
		{ encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
	);
	const m = out.match(/"id":\s*"([^"]+)"/);
	if (!m) {
		console.error('No user found in local D1. Seed one first.');
		process.exit(1);
	}
	return m[1];
}

function mintToken(userId, secret) {
	// Mirrors createSessionToken() in src/lib/server/auth.ts.
	const data = Buffer.from(JSON.stringify({ userId, iat: Date.now() })).toString('base64');
	const sig = createHash('sha256').update(`${data}.${secret}`).digest('hex');
	return `${data}.${sig}`; // never logged
}

const ROUTES = [
	'/dashboard',
	'/dashboard/availability',
	'/dashboard/emails',
	'/dashboard/calendars',
	'/dashboard/event-types/new'
];

const token = mintToken(localUserId(), readLocalSecret());

console.log(`Checking ${ROUTES.length} dashboard routes on ${ORIGIN}\n`);

let failures = 0;
for (const route of ROUTES) {
	let status = 0;
	let html = '';
	try {
		const res = await fetch(`${ORIGIN}${route}`, {
			headers: { cookie: `session=${token}` },
			redirect: 'manual'
		});
		status = res.status;
		html = await res.text();
	} catch (err) {
		console.log(`  ${route}\n    UNREACHABLE - is the dev server running on ${PORT}?`);
		failures++;
		continue;
	}

	const authed = status === 200;
	// A redirect means the minted session was rejected -- usually a stale or
	// mismatched JWT_SECRET, not a broken page.
	const note = status === 302 ? ' (redirected to login - session rejected)' : '';

	// Cheap content signals. These are not a substitute for looking at it, but
	// they catch the obvious: a page that errored, or one that rendered empty.
	const signals = [];
	if (/Internal Error|Unexpected Error|500/i.test(html.slice(0, 2000))) signals.push('ERROR TEXT');
	if (html.length < 500) signals.push(`SUSPICIOUSLY SHORT (${html.length}b)`);
	// Public-theme tokens must never leak into the dashboard; it stays vanilla.
	if (/\bbg-bg\b|\bfont-display\b|public-flow/.test(html)) signals.push('PUBLIC THEME LEAKED');

	if (!authed || signals.length) failures++;
	console.log(
		`  ${route}\n    status=${status}${note} bytes=${html.length}` +
			(signals.length ? `\n    !! ${signals.join(', ')}` : '')
	);
}

console.log(`\n${failures ? `${failures} route(s) need attention` : 'All dashboard routes OK'}`);
process.exit(failures ? 1 : 0);
