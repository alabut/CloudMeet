import { test } from '@playwright/test';
import { previewUrls } from './helpers/preview-urls';
import { capturePreview, prepareVisualPage } from './helpers/visual';

test.beforeEach(async ({ page }) => {
	await prepareVisualPage(page);
});

test.describe('cancel', () => {
	test('form', async ({ page }) => {
		await capturePreview(page, previewUrls.cancel.form, 'cancel-form.png', 'fullPage');
	});

	test('error', async ({ page }) => {
		await capturePreview(page, previewUrls.cancel.error, 'cancel-error.png', 'fullPage');
	});

	test('success', async ({ page }) => {
		await capturePreview(page, previewUrls.cancel.success, 'cancel-success.png', 'viewport');
	});

	test('already cancelled', async ({ page }) => {
		await capturePreview(
			page,
			previewUrls.cancel.alreadyCancelled,
			'cancel-already-cancelled.png',
			'viewport'
		);
	});
});
