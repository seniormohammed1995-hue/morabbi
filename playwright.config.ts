import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'e2e',
  timeout: 45_000,
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    ...devices['Pixel 5'],
    baseURL: 'http://localhost:5190',
    viewport: { width: 360, height: 780 },
    locale: 'ar-EG',
    timezoneId: 'Africa/Cairo',
    serviceWorkers: 'block',
  },
  webServer: {
    command: 'npx vite --port 5190 --strictPort',
    url: 'http://localhost:5190',
    reuseExistingServer: false,
    timeout: 60_000,
  },
})
