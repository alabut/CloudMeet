import { test } from '@playwright/test';
import { previewUrls } from './helpers/preview-urls';
import { capturePreview, isDesktopProject, prepareVisualPage } from './helpers/visual';

test.beforeEach(async ({ page }) => {
	await prepareVisualPage(page);
});

test.describe('booking', () => {
	test('success', async ({ page }) => {
		await capturePreview(page, previewUrls.booking.success, 'booking-success.png', 'viewport');
	});

	test('details', async ({ page }, testInfo) => {
		test.skip(!isDesktopProject(testInfo.project.name), 'Desktop-only preview state');
		await capturePreview(page, previewUrls.booking.details, 'booking-details.png', 'viewport');
	});
});
