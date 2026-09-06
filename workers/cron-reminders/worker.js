/**
 * Cron Worker for CloudMeet
 * - Every 5 minutes: send due reminder emails
 * - Same tick: check Google Calendar token health
 */

export default {
	async scheduled(event, env) {
		const secret = env.CRON_SECRET;
		const base = env.APP_URL;

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
		} catch (err) {
			console.error('Cron health failed:', err);
		}
	}
};
