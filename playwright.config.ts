import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:41737',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      grepInvert: /touch interactions/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      grepInvert: /touch interactions/,
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'mobile-chromium',
      grep: /touch interactions/,
      use: { ...devices['Pixel 7'] },
    },
  ],
  webServer: {
    command: 'pnpm vite --host 127.0.0.1 --port 41737 --strictPort',
    port: 41737,
    reuseExistingServer: false,
  },
});
