/**
 * Cron health check: verify Google Calendar token still works.
 * Alerts the host at most once per day when the token is dead.
 */

import { json, error, type RequestEvent } from '@sveltejs/kit';
import { probeGoogleCalendarHealth } from '$lib/server/google-calendar-health';

const ALERT_KV_KEY = 'google_calendar_health_alert_sent';

export const GET = async ({ url, platform }: RequestEvent) => {
	const env = platform?.env;
	if (!env) {
		throw error(500, 'Platform env not available');
	}

	const cronSecret = url.searchParams.get('secret');
	if (env.CRON_SECRET && cronSecret !== env.CRON_SECRET) {
		throw error(401, 'Unauthorized');
	}

	const db = env.DB;
	const user = await db
		.prepare('SELECT id, email, name, contact_email FROM users LIMIT 1')
		.first<{ id: string; email: string; name: string; contact_email: string | null }>();

	if (!user) {
		return json({ ok: false, reason: 'no_user' });
	}

	const health = await probeGoogleCalendarHealth(
		db,
		user.id,
		env.GOOGLE_CLIENT_ID,
		env.GOOGLE_CLIENT_SECRET
	);

	if (health.ok) {
		await env.KV.delete(ALERT_KV_KEY);
		return json({ ok: true, googleCalendar: 'healthy' });
	}

	let alerted = false;
	const alreadyAlerted = await env.KV.get(ALERT_KV_KEY);
	if (!alreadyAlerted && env.EMAILIT_API_KEY && env.EMAIL_FROM) {
		const to = user.contact_email || user.email;
		const appUrl = (env.APP_URL || '').replace(/\/$/, '');
		const reconnectUrl = `${appUrl}/auth/login`;
		const subject = 'CloudMeet: Google Calendar needs reconnecting';
		const text = `Hi ${user.name},

CloudMeet could not refresh your Google Calendar connection (${health.reason}).

Until you reconnect, new bookings cannot create calendar invites.

Reconnect here: ${reconnectUrl}

— CloudMeet health check`;

		try {
			const response = await fetch('https://api.emailit.com/v2/emails', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${env.EMAILIT_API_KEY}`
				},
				body: JSON.stringify({
					from: `CloudMeet <${env.EMAIL_FROM}>`,
					to,
					subject,
					text
				})
			});
			if (response.ok) {
				alerted = true;
				await env.KV.put(ALERT_KV_KEY, '1', { expirationTtl: 60 * 60 * 24 });
			} else {
				console.error('Health alert email failed:', await response.text());
			}
		} catch (err) {
			console.error('Health alert email error:', err);
		}
	}

	return json({
		ok: false,
		googleCalendar: health.reason,
		alerted
	});
};
