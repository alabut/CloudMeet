import { test } from '@playwright/test';
import { previewUrls } from './helpers/preview-urls';
import { capturePreview, prepareVisualPage } from './helpers/visual';

test.beforeEach(async ({ page }) => {
	await prepareVisualPage(page);
});

test.describe('reschedule', () => {
	test('form', async ({ page }) => {
		await capturePreview(page, previewUrls.reschedule.form, 'reschedule-form.png', 'fullPage');
	});

	test('selected', async ({ page }) => {
		await capturePreview(page, previewUrls.reschedule.selected, 'reschedule-selected.png', 'fullPage');
	});

	test('error', async ({ page }) => {
		await capturePreview(page, previewUrls.reschedule.error, 'reschedule-error.png', 'fullPage');
	});

	test('success', async ({ page }) => {
		await capturePreview(page, previewUrls.reschedule.success, 'reschedule-success.png', 'viewport');
	});
});
