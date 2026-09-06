/**
 * Probe whether the stored Google refresh token can still mint an access token.
 */

import { getValidAccessToken } from './google-calendar';

export type GoogleCalendarHealth =
	| { ok: true }
	| { ok: false; reason: 'missing_token' | 'invalid_grant' | 'unknown' };

export async function probeGoogleCalendarHealth(
	db: D1Database,
	userId: string,
	clientId: string,
	clientSecret: string
): Promise<GoogleCalendarHealth> {
	const user = await db
		.prepare('SELECT google_refresh_token FROM users WHERE id = ?')
		.bind(userId)
		.first<{ google_refresh_token: string | null }>();

	if (!user?.google_refresh_token) {
		return { ok: false, reason: 'missing_token' };
	}

	try {
		await getValidAccessToken(db, userId, clientId, clientSecret);
		return { ok: true };
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		if (message.includes('invalid_grant') || message.includes('expired or revoked')) {
			return { ok: false, reason: 'invalid_grant' };
		}
		return { ok: false, reason: 'unknown' };
	}
}

export function googleCalendarHealthMessage(health: GoogleCalendarHealth): string | null {
	if (health.ok) return null;
	if (health.reason === 'missing_token') {
		return 'Google Calendar is not connected. Log in again to reconnect.';
	}
	if (health.reason === 'invalid_grant') {
		return 'Google Calendar access expired or was revoked. Log in again to reconnect so bookings can create calendar invites.';
	}
	return 'Google Calendar is not responding. Log in again to reconnect.';
}
