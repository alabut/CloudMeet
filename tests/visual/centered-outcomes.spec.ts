import { test } from '@playwright/test';
import { previewUrls } from './helpers/preview-urls';
import { capturePreview, prepareVisualPage } from './helpers/visual';

test.beforeEach(async ({ page }) => {
	await prepareVisualPage(page);
});

/**
 * Short-laptop (1280×720) coverage for centered outcome screens only.
 * Runs exclusively in short-laptop-dark / short-laptop-light projects.
 */
test.describe('centered outcomes', () => {
	test('booking success', async ({ page }) => {
		await capturePreview(page, previewUrls.booking.success, 'booking-success.png', 'viewport');
	});

	test('cancel success', async ({ page }) => {
		await capturePreview(page, previewUrls.cancel.success, 'cancel-success.png', 'viewport');
	});

	test('cancel already cancelled', async ({ page }) => {
		await capturePreview(
			page,
			previewUrls.cancel.alreadyCancelled,
			'cancel-already-cancelled.png',
			'viewport'
		);
	});

	test('reschedule success', async ({ page }) => {
		await capturePreview(page, previewUrls.reschedule.success, 'reschedule-success.png', 'viewport');
	});

	test('reschedule response accepted', async ({ page }) => {
		await capturePreview(
			page,
			previewUrls.rescheduleResponse.accepted,
			'reschedule-response-accepted.png',
			'viewport'
		);
	});

	test('reschedule response declined', async ({ page }) => {
		await capturePreview(
			page,
			previewUrls.rescheduleResponse.declined,
			'reschedule-response-declined.png',
			'viewport'
		);
	});

	test('reschedule response already accepted', async ({ page }) => {
		await capturePreview(
			page,
			previewUrls.rescheduleResponse.alreadyAccepted,
			'reschedule-response-already-accepted.png',
			'viewport'
		);
	});

	test('reschedule response already declined', async ({ page }) => {
		await capturePreview(
			page,
			previewUrls.rescheduleResponse.alreadyDeclined,
			'reschedule-response-already-declined.png',
			'viewport'
		);
	});
});
