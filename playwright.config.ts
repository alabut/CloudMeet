import { defineConfig, devices } from '@playwright/test';

const port = 4173;
const baseURL = `http://127.0.0.1:${port}`;

const sharedUse = {
	baseURL,
	locale: 'en-US',
	timezoneId: 'America/Los_Angeles',
	reducedMotion: 'reduce' as const,
	trace: 'retain-on-failure' as const,
	...devices['Desktop Chrome']
};

export default defineConfig({
	testDir: 'tests/visual',
	fullyParallel: false,
	workers: 1,
	retries: 0,
	reporter: [
		['list'],
		['html', { open: 'on-failure', outputFolder: 'playwright-report' }]
	],
	snapshotPathTemplate:
		'{testDir}/{testFileDir}/{testFileName}-snapshots/{projectName}/{arg}{ext}',
	use: {
		...sharedUse,
		screenshot: 'only-on-failure'
	},
	webServer: {
		command: `npm run dev -- --port ${port}`,
		url: baseURL,
		reuseExistingServer: !process.env.CI,
		timeout: 180_000,
		stdout: 'pipe',
		stderr: 'pipe'
	},
	projects: [
		{
			name: 'phone-dark',
			testIgnore: /centered-outcomes\.spec\.ts/,
			use: {
				...sharedUse,
				viewport: { width: 390, height: 844 },
				colorScheme: 'dark'
			}
		},
		{
			name: 'phone-light',
			testIgnore: /centered-outcomes\.spec\.ts/,
			use: {
				...sharedUse,
				viewport: { width: 390, height: 844 },
				colorScheme: 'light'
			}
		},
		{
			name: 'desktop-dark',
			testIgnore: /centered-outcomes\.spec\.ts/,
			use: {
				...sharedUse,
				viewport: { width: 1440, height: 1000 },
				colorScheme: 'dark'
			}
		},
		{
			name: 'desktop-light',
			testIgnore: /centered-outcomes\.spec\.ts/,
			use: {
				...sharedUse,
				viewport: { width: 1440, height: 1000 },
				colorScheme: 'light'
			}
		},
		{
			name: 'short-laptop-dark',
			testMatch: /centered-outcomes\.spec\.ts/,
			use: {
				...sharedUse,
				viewport: { width: 1280, height: 720 },
				colorScheme: 'dark'
			}
		},
		{
			name: 'short-laptop-light',
			testMatch: /centered-outcomes\.spec\.ts/,
			use: {
				...sharedUse,
				viewport: { width: 1280, height: 720 },
				colorScheme: 'light'
			}
		}
	]
});
