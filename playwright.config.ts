import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './test/browser',
  fullyParallel: true,
  use: { baseURL: 'http://127.0.0.1:5174' },
  webServer: {
    command: 'pnpm exec vite --config test/browser/vite.config.ts --host 127.0.0.1 --port 5174 --strictPort',
    url: 'http://127.0.0.1:5174/fixture.html',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'chromium-auto', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox-auto', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit-auto', use: { ...devices['Desktop Safari'] } },
  ],
});
