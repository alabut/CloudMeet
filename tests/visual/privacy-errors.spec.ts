import { test } from '@playwright/test';
import { previewUrls } from './helpers/preview-urls';
import { capturePreview, prepareVisualPage } from './helpers/visual';

test.beforeEach(async ({ page }) => {
	await prepareVisualPage(page);
});

test.describe('privacy and public errors', () => {
	test('privacy', async ({ page }) => {
		await capturePreview(page, previewUrls.privacy, 'privacy.png', 'fullPage');
	});

	test('404', async ({ page }) => {
		await capturePreview(page, previewUrls.errors.notFound, 'error-404.png', 'viewport');
	});

	test('500', async ({ page }) => {
		await capturePreview(page, previewUrls.errors.serverError, 'error-500.png', 'viewport');
	});
});
