import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI
    ? 2
    : 0,
  reporter: process.env.CI
    ? [['github'], ['html', {
        open: 'never',
      }]]
    : [['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    permissions: ['notifications'],
  },
  projects: [
    {
      name: 'chromium',
      // The default headless shell ships no Notifications API, so every permission reads denied.
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chromium',
      },
    },
  ],
  webServer: {
    command: `pnpm --filter playground preview --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
