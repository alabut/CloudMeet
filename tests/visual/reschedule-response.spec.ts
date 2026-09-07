import { test } from '@playwright/test';
import { previewUrls } from './helpers/preview-urls';
import { capturePreview, prepareVisualPage } from './helpers/visual';

test.beforeEach(async ({ page }) => {
	await prepareVisualPage(page);
});

test.describe('reschedule response', () => {
	test('pending', async ({ page }) => {
		await capturePreview(
			page,
			previewUrls.rescheduleResponse.pending,
			'reschedule-response-pending.png',
			'fullPage'
		);
	});

	test('counter', async ({ page }) => {
		await capturePreview(
			page,
			previewUrls.rescheduleResponse.counter,
			'reschedule-response-counter.png',
			'fullPage'
		);
	});

	test('accepted', async ({ page }) => {
		await capturePreview(
			page,
			previewUrls.rescheduleResponse.accepted,
			'reschedule-response-accepted.png',
			'viewport'
		);
	});

	test('declined', async ({ page }) => {
		await capturePreview(
			page,
			previewUrls.rescheduleResponse.declined,
			'reschedule-response-declined.png',
			'viewport'
		);
	});

	test('already accepted', async ({ page }) => {
		await capturePreview(
			page,
			previewUrls.rescheduleResponse.alreadyAccepted,
			'reschedule-response-already-accepted.png',
			'viewport'
		);
	});

	test('already declined', async ({ page }) => {
		await capturePreview(
			page,
			previewUrls.rescheduleResponse.alreadyDeclined,
			'reschedule-response-already-declined.png',
			'viewport'
		);
	});
});
