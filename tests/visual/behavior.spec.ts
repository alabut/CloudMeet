import { expect, test } from '@playwright/test';
import { allPreviewPaths, previewUrls } from './helpers/preview-urls';
import {
	assertNoHorizontalOverflow,
	createTransactionMonitor,
	gotoPreview,
	prepareVisualPage
} from './helpers/visual';

test.beforeEach(async ({ page }) => {
	await prepareVisualPage(page);
});

test('root redirects to /30min', async ({ page }) => {
	await page.goto('/', { waitUntil: 'domcontentloaded' });
	await expect(page).toHaveURL(/\/30min$/);
});

test('preview pages have no horizontal overflow', async ({ page }) => {
	for (const path of allPreviewPaths) {
		await gotoPreview(page, path);
		await assertNoHorizontalOverflow(page);
	}
});

test('preview pages make no transaction requests', async ({ page }) => {
	const monitor = createTransactionMonitor(page);

	for (const path of allPreviewPaths) {
		await gotoPreview(page, path);
	}

	monitor.assertNone();
});

test('key preview links and controls are visible and focusable', async ({ page }) => {
	await gotoPreview(page, previewUrls.cancel.form);
	await expect(page.getByRole('heading', { name: 'Cancel Booking' })).toBeVisible();
	await expect(page.getByLabel(/reason for cancellation/i)).toBeVisible();
	await expect(page.getByRole('button', { name: /yes, cancel booking/i })).toBeVisible();
	await expect(page.getByRole('link', { name: /keep booking/i })).toBeVisible();
	await page.getByRole('link', { name: /keep booking/i }).focus();
	await expect(page.getByRole('link', { name: /keep booking/i })).toBeFocused();

	await gotoPreview(page, previewUrls.rescheduleResponse.pending);
	await expect(page.getByRole('button', { name: /accept new time/i })).toBeVisible();
	await expect(page.getByRole('button', { name: /decline & cancel meeting/i })).toBeVisible();
	await page.getByRole('button', { name: /accept new time/i }).focus();
	await expect(page.getByRole('button', { name: /accept new time/i })).toBeFocused();

	await gotoPreview(page, previewUrls.booking.success);
	await expect(page.getByRole('heading', { name: /you are scheduled/i })).toBeVisible();
	await expect(page.getByRole('link', { name: /^reschedule$/i })).toBeVisible();
	await expect(page.getByRole('link', { name: /^cancel$/i })).toBeVisible();
	await page.getByRole('link', { name: /^reschedule$/i }).focus();
	await expect(page.getByRole('link', { name: /^reschedule$/i })).toBeFocused();

	await gotoPreview(page, previewUrls.dashboard.cancelModal);
	await expect(page.getByRole('dialog', { name: /cancel booking/i })).toBeVisible();
	await expect(page.getByRole('button', { name: /close dialog/i })).toBeVisible();
	await page.getByRole('button', { name: /close dialog/i }).focus();
	await expect(page.getByRole('button', { name: /close dialog/i })).toBeFocused();

	await gotoPreview(page, previewUrls.dashboard.rescheduleModalForm);
	await expect(page.getByRole('dialog', { name: /propose new time/i })).toBeVisible();
	const firstSlot = page.getByRole('button', { name: /\d{1,2}:\d{2}\s*(AM|PM)/i }).first();
	await expect(firstSlot).toBeVisible();
	await firstSlot.focus();
	await expect(firstSlot).toBeFocused();

	await gotoPreview(page, previewUrls.dashboard.overviewConnected);
	await expect(page.getByRole('link', { name: /^calendars$/i })).toBeVisible();
	await expect(page.getByRole('link', { name: /set availability/i })).toBeVisible();
	await page.setViewportSize({ width: 390, height: 844 });
	await expect(page.getByRole('link', { name: /^calendars$/i })).toBeVisible();
	await expect(page.getByRole('link', { name: /set availability/i })).toBeVisible();
	await page.getByRole('link', { name: /set availability/i }).focus();
	await expect(page.getByRole('link', { name: /set availability/i })).toBeFocused();
});
