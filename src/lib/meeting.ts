/**
 * Video meeting provider helpers.
 * Calendar invite provider (Google vs Outlook) is separate from the video link type.
 */

export type MeetingType = 'zoom' | 'teams' | 'google_meet';

/** Map invite calendar to the video meeting used for that booking path. */
export function meetingTypeForInviteCalendar(inviteCalendar: string | null | undefined): MeetingType {
	return inviteCalendar === 'outlook' ? 'teams' : 'zoom';
}

export function meetingShortLabel(type: MeetingType): string {
	switch (type) {
		case 'teams':
			return 'Microsoft Teams';
		case 'google_meet':
			return 'Google Meet';
		case 'zoom':
		default:
			return 'Zoom';
	}
}

export function meetingJoinLabel(type: MeetingType): string {
	switch (type) {
		case 'teams':
			return 'Join Microsoft Teams Meeting';
		case 'google_meet':
			return 'Join Google Meet';
		case 'zoom':
		default:
			return 'Join Zoom Meeting';
	}
}

/** Dashboard / settings copy for which calendar sends invites (+ which video link). */
export function inviteCalendarOptionLabel(inviteCalendar: string | null | undefined): string {
	if (inviteCalendar === 'outlook') return 'Outlook Calendar (Microsoft Teams)';
	return 'Google Calendar (Zoom)';
}

/** Best-effort type for stored meeting URLs (e.g. reminder emails). */
export function inferMeetingTypeFromUrl(url: string | null | undefined): MeetingType {
	if (!url) return 'zoom';
	const lower = url.toLowerCase();
	if (lower.includes('teams.microsoft.com') || lower.includes('teams.live.com')) return 'teams';
	if (lower.includes('meet.google.com')) return 'google_meet';
	return 'zoom';
}
