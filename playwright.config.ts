import { defineConfig, devices } from '@playwright/test';

const config = defineConfig({
  testDir: './',
  testMatch: '**/*.spec.{ts,js}',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  timeout: 60000,
  use: {
    baseURL: 'http://localhost:5137',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1920, height: 1080 },
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'echo "Servers already running"',
    url: 'http://localhost:5137',
    reuseExistingServer: true,
  },
});
