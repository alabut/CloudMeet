import { test } from '@playwright/test';
import { previewUrls } from './helpers/preview-urls';
import { capturePreview, isDesktopProject, prepareVisualPage } from './helpers/visual';

test.beforeEach(async ({ page }) => {
	await prepareVisualPage(page);
});

test.describe('dashboard previews', () => {
	test('overview connected', async ({ page }) => {
		await capturePreview(
			page,
			previewUrls.dashboard.overviewConnected,
			'dashboard-overview-connected.png',
			'viewport'
		);
	});

	test('overview empty', async ({ page }) => {
		await capturePreview(
			page,
			previewUrls.dashboard.overviewEmpty,
			'dashboard-overview-empty.png',
			'viewport'
		);
	});

	test('overview loading', async ({ page }) => {
		await capturePreview(
			page,
			previewUrls.dashboard.overviewLoading,
			'dashboard-overview-loading.png',
			'viewport'
		);
	});

	test('overview error', async ({ page }) => {
		await capturePreview(
			page,
			previewUrls.dashboard.overviewError,
			'dashboard-overview-error.png',
			'viewport'
		);
	});

	test('event type new', async ({ page }) => {
		await capturePreview(
			page,
			previewUrls.dashboard.eventTypeNew,
			'dashboard-event-type-new.png',
			'fullPage'
		);
	});

	test('event type edit', async ({ page }, testInfo) => {
		test.skip(!isDesktopProject(testInfo.project.name), 'Desktop-only preview state');
		await capturePreview(
			page,
			previewUrls.dashboard.eventTypeEdit,
			'dashboard-event-type-edit.png',
			'fullPage'
		);
	});

	test('calendars connected', async ({ page }) => {
		await capturePreview(
			page,
			previewUrls.dashboard.calendarsConnected,
			'dashboard-calendars-connected.png',
			'viewport'
		);
	});

	test('calendars disconnected', async ({ page }) => {
		await capturePreview(
			page,
			previewUrls.dashboard.calendarsDisconnected,
			'dashboard-calendars-disconnected.png',
			'viewport'
		);
	});

	test('availability', async ({ page }) => {
		await capturePreview(
			page,
			previewUrls.dashboard.availability,
			'dashboard-availability.png',
			'fullPage'
		);
	});

	test('emails', async ({ page }) => {
		await capturePreview(page, previewUrls.dashboard.emails, 'dashboard-emails.png', 'fullPage');
	});

	test('cancel modal', async ({ page }) => {
		await capturePreview(
			page,
			previewUrls.dashboard.cancelModal,
			'dashboard-cancel-modal.png',
			'viewport'
		);
	});

	test('reschedule modal form', async ({ page }) => {
		await capturePreview(
			page,
			previewUrls.dashboard.rescheduleModalForm,
			'dashboard-reschedule-modal-form.png',
			'viewport'
		);
	});

	test('reschedule modal selected', async ({ page }, testInfo) => {
		test.skip(!isDesktopProject(testInfo.project.name), 'Desktop-only preview state');
		await capturePreview(
			page,
			previewUrls.dashboard.rescheduleModalSelected,
			'dashboard-reschedule-modal-selected.png',
			'viewport'
		);
	});

	test('design system catalog', async ({ page }, testInfo) => {
		test.skip(!isDesktopProject(testInfo.project.name), 'Desktop-only catalog surface');
		await capturePreview(
			page,
			previewUrls.dashboard.designSystemCatalog,
			'dashboard-design-system-catalog.png',
			'fullPage'
		);
	});
});
