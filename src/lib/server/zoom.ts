import { error } from '@sveltejs/kit';

/**
 * Recurring Zoom Pro meeting URL from server env.
 * Required for Google Calendar–backed bookings (Zoom video, not Google Meet).
 */
export function getConfiguredZoomMeetingUrl(env: { ZOOM_MEETING_URL?: string }): string {
	const url = env.ZOOM_MEETING_URL?.trim();
	if (!url) {
		throw error(500, 'Zoom meeting URL is not configured. Set ZOOM_MEETING_URL.');
	}
	return url;
}
