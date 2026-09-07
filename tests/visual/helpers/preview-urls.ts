export const PREVIEW_BOOKING_ID = 'preview-sample-booking';
export const PREVIEW_PROPOSAL_TOKEN = 'preview-sample-proposal';

/** Deterministic loopback preview paths (use with Playwright baseURL). */
export const previewUrls = {
	booking: {
		success: '/30min?preview=success',
		details: '/30min?preview=details'
	},
	cancel: {
		form: `/cancel/${PREVIEW_BOOKING_ID}`,
		error: `/cancel/${PREVIEW_BOOKING_ID}?preview=error`,
		success: `/cancel/${PREVIEW_BOOKING_ID}?preview=success`,
		alreadyCancelled: `/cancel/${PREVIEW_BOOKING_ID}?preview=already-cancelled`
	},
	reschedule: {
		form: `/reschedule/${PREVIEW_BOOKING_ID}`,
		selected: `/reschedule/${PREVIEW_BOOKING_ID}?preview=selected`,
		error: `/reschedule/${PREVIEW_BOOKING_ID}?preview=error`,
		success: `/reschedule/${PREVIEW_BOOKING_ID}?preview=success`
	},
	rescheduleResponse: {
		pending: `/reschedule-response/${PREVIEW_PROPOSAL_TOKEN}`,
		counter: `/reschedule-response/${PREVIEW_PROPOSAL_TOKEN}?preview=counter`,
		accepted: `/reschedule-response/${PREVIEW_PROPOSAL_TOKEN}?preview=accepted`,
		declined: `/reschedule-response/${PREVIEW_PROPOSAL_TOKEN}?preview=declined`,
		alreadyAccepted: `/reschedule-response/${PREVIEW_PROPOSAL_TOKEN}?preview=already-accepted`,
		alreadyDeclined: `/reschedule-response/${PREVIEW_PROPOSAL_TOKEN}?preview=already-declined`
	},
	privacy: '/privacy',
	errors: {
		notFound: '/__preview/error/404',
		serverError: '/__preview/error/500'
	},
	dashboard: {
		overviewConnected: '/__preview/dashboard/overview?preview=connected',
		overviewEmpty: '/__preview/dashboard/overview?preview=empty',
		overviewLoading: '/__preview/dashboard/overview?preview=loading',
		overviewError: '/__preview/dashboard/overview?preview=error',
		eventTypeNew: '/__preview/dashboard/event-type?preview=new',
		eventTypeEdit: '/__preview/dashboard/event-type?preview=edit',
		calendarsConnected: '/__preview/dashboard/calendars?preview=connected',
		calendarsDisconnected: '/__preview/dashboard/calendars?preview=disconnected',
		availability: '/__preview/dashboard/availability',
		emails: '/__preview/dashboard/emails?preview=default',
		cancelModal: '/__preview/dashboard/cancel-modal?preview=form',
		rescheduleModalForm: '/__preview/dashboard/reschedule-modal?preview=form',
		rescheduleModalSelected: '/__preview/dashboard/reschedule-modal?preview=selected',
		designSystemCatalog: '/design-system/dashboard'
	}
} as const;

/** All canonical preview paths exercised by visual and behavior suites. */
export const allPreviewPaths = [
	previewUrls.booking.success,
	previewUrls.booking.details,
	previewUrls.cancel.form,
	previewUrls.cancel.error,
	previewUrls.cancel.success,
	previewUrls.cancel.alreadyCancelled,
	previewUrls.reschedule.form,
	previewUrls.reschedule.selected,
	previewUrls.reschedule.error,
	previewUrls.reschedule.success,
	previewUrls.rescheduleResponse.pending,
	previewUrls.rescheduleResponse.counter,
	previewUrls.rescheduleResponse.accepted,
	previewUrls.rescheduleResponse.declined,
	previewUrls.rescheduleResponse.alreadyAccepted,
	previewUrls.rescheduleResponse.alreadyDeclined,
	previewUrls.privacy,
	previewUrls.errors.notFound,
	previewUrls.errors.serverError,
	previewUrls.dashboard.overviewConnected,
	previewUrls.dashboard.overviewEmpty,
	previewUrls.dashboard.overviewLoading,
	previewUrls.dashboard.overviewError,
	previewUrls.dashboard.eventTypeNew,
	previewUrls.dashboard.eventTypeEdit,
	previewUrls.dashboard.calendarsConnected,
	previewUrls.dashboard.calendarsDisconnected,
	previewUrls.dashboard.availability,
	previewUrls.dashboard.emails,
	previewUrls.dashboard.cancelModal,
	previewUrls.dashboard.rescheduleModalForm,
	previewUrls.dashboard.rescheduleModalSelected,
	previewUrls.dashboard.designSystemCatalog
] as const;
