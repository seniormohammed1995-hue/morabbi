import { defineConfig } from '@playwright/test'

/**
 * Google Play store graphics: phone screenshots (1080×1920) and the feature graphic (1024×500).
 * Run with: npm run store:shots — output goes to store/graphics/.
 */
export default defineConfig({
  testDir: '.',
  testMatch: 'shots.spec.ts',
  timeout: 90_000,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5197',
    locale: 'ar-EG',
    timezoneId: 'Africa/Cairo',
    serviceWorkers: 'block',
    colorScheme: 'light',
  },
  webServer: {
    command: 'npx vite --port 5197 --strictPort',
    url: 'http://localhost:5197',
    cwd: '..',
    reuseExistingServer: false,
    timeout: 60_000,
  },
})
