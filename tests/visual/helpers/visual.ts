import { expect, type Page } from '@playwright/test';

/** Fixed browser clock: noon PDT on the preview sample date (2030-09-11). */
export const VISUAL_FIXED_NOW_ISO = '2030-09-11T19:00:00.000Z';
export const VISUAL_FIXED_NOW = new Date(VISUAL_FIXED_NOW_ISO);

const STABILITY_CSS = `
	*, *::before, *::after {
		animation-duration: 0s !important;
		animation-delay: 0s !important;
		transition-duration: 0s !important;
		transition-delay: 0s !important;
		caret-color: transparent !important;
	}
`;

const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost', '::1', '[::1]']);

const TRANSACTION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export type ScreenshotMode = 'viewport' | 'fullPage';

export function isLocalHost(hostname: string): boolean {
	return LOCAL_HOSTS.has(hostname);
}

/** Freeze browser Date before navigation so timezone labels and calendar "today" are stable. */
export async function installFixedClock(page: Page): Promise<void> {
	await page.clock.install({ time: VISUAL_FIXED_NOW });
}

/** Block any request that would leave loopback (never contact production). */
export async function blockNonLocalHosts(page: Page): Promise<void> {
	await page.route('**/*', (route) => {
		const { hostname } = new URL(route.request().url());
		if (isLocalHost(hostname)) {
			route.continue();
			return;
		}
		route.abort('blockedbyclient');
	});
}

export function createTransactionMonitor(page: Page) {
	const transactions: string[] = [];

	page.on('request', (request) => {
		if (!TRANSACTION_METHODS.has(request.method())) return;

		const { hostname, pathname } = new URL(request.url());
		if (!isLocalHost(hostname)) {
			transactions.push(`${request.method()} ${request.url()}`);
			return;
		}

		// Local form actions and API writes count as transactions.
		if (pathname.startsWith('/api/') || pathname.includes('?/')) {
			transactions.push(`${request.method()} ${pathname}`);
		}
	});

	return {
		getTransactions: () => [...transactions],
		assertNone: () => {
			expect(transactions, 'Preview pages must not perform transaction requests').toEqual([]);
		}
	};
}

/** Shared per-test setup for visual and behavior suites. */
export async function prepareVisualPage(page: Page): Promise<void> {
	await installFixedClock(page);
	await blockNonLocalHosts(page);
}

export async function waitForVisualStability(page: Page): Promise<void> {
	await page.addStyleTag({ content: STABILITY_CSS });
	await page.waitForLoadState('domcontentloaded');
	await page.waitForLoadState('load');
	await page.evaluate(async () => {
		if (document.fonts?.ready) {
			await document.fonts.ready;
		}
	});
	await page.waitForFunction(
		() => document.readyState === 'complete',
		undefined,
		{ timeout: 10_000 }
	);
}

export async function assertNoHorizontalOverflow(page: Page): Promise<void> {
	const hasOverflow = await page.evaluate(() => {
		const doc = document.documentElement;
		return doc.scrollWidth > doc.clientWidth + 1;
	});
	expect(hasOverflow, 'Page has horizontal overflow').toBe(false);
}

export async function gotoPreview(page: Page, path: string): Promise<void> {
	await page.goto(path, { waitUntil: 'domcontentloaded' });
	await waitForVisualStability(page);
}

export async function expectStableScreenshot(
	page: Page,
	name: string,
	mode: ScreenshotMode = 'viewport'
): Promise<void> {
	await assertNoHorizontalOverflow(page);
	await expect(page).toHaveScreenshot(name, {
		fullPage: mode === 'fullPage',
		animations: 'disabled'
	});
}

export async function capturePreview(
	page: Page,
	path: string,
	name: string,
	mode: ScreenshotMode = 'viewport'
): Promise<void> {
	await gotoPreview(page, path);
	await expectStableScreenshot(page, name, mode);
}

export function isDesktopProject(projectName: string): boolean {
	return projectName.startsWith('desktop');
}
