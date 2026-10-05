export const CALENDAR_UNAVAILABLE_CODE = 'calendar_unavailable';
export const CALENDAR_UNAVAILABLE_MESSAGE =
	'Availability is temporarily unavailable because the host calendar could not be checked. Please try again soon.';

export type CalendarOutageResponse = {
	error: typeof CALENDAR_UNAVAILABLE_CODE;
	code: typeof CALENDAR_UNAVAILABLE_CODE;
	message: typeof CALENDAR_UNAVAILABLE_MESSAGE;
};

export function calendarOutageBody(): CalendarOutageResponse {
	return {
		error: CALENDAR_UNAVAILABLE_CODE,
		code: CALENDAR_UNAVAILABLE_CODE,
		message: CALENDAR_UNAVAILABLE_MESSAGE
	};
}

export async function signalCalendarHealthcheckFailure(env: { HEALTHCHECK_URL?: string }): Promise<void> {
	if (!env.HEALTHCHECK_URL) return;
	const base = String(env.HEALTHCHECK_URL).replace(/\/$/, '');
	try {
		await fetch(`${base}/fail`, { method: 'GET', redirect: 'follow' });
	} catch (err) {
		console.error('Healthcheck failure ping failed:', err);
	}
}
