/**
 * Cron Worker for CloudMeet
 * - Every 5 minutes: send due reminder emails (no-op if Emailit is unset)
 * - Same tick: check Google Calendar token health
 * - Ping HEALTHCHECK_URL (healthchecks.io) so silence or /fail emails Al
 */

async function pingWatchdog(url, failed) {
	if (!url) return;
	const base = String(url).replace(/\/$/, '');
	const target = failed ? `${base}/fail` : base;
	try {
		await fetch(target, { method: 'GET', redirect: 'follow' });
	} catch (err) {
		console.error('Healthcheck ping failed:', err);
	}
}

export default {
	async scheduled(event, env) {
		const secret = env.CRON_SECRET;
		const base = env.APP_URL;
		let healthFailed = true;

		try {
			const remindersUrl = `${base}/api/cron/send-reminders?secret=${secret}`;
			const remindersResponse = await fetch(remindersUrl);
			const remindersResult = await remindersResponse.json();
			console.log('Cron reminder result:', remindersResult);
		} catch (err) {
			console.error('Cron reminder failed:', err);
		}

		try {
			const healthUrl = `${base}/api/cron/health?secret=${secret}`;
			const healthResponse = await fetch(healthUrl);
			const healthResult = await healthResponse.json();
			console.log('Cron health result:', healthResult);
			healthFailed = !healthResponse.ok || healthResult.ok === false;
		} catch (err) {
			console.error('Cron health failed:', err);
			healthFailed = true;
		}

		await pingWatchdog(env.HEALTHCHECK_URL, healthFailed);
	}
};
