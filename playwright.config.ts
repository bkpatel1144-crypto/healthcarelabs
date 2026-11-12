import { defineConfig } from '@playwright/test';

/**
 * Two suites, both against the local Firebase emulators (never the live
 * project — the dev server is started with a `demo-` project ID):
 *
 *   rules — security-rule checks straight against Firestore, no browser
 *   e2e   — real user journeys in Microsoft Edge
 *
 * Start the emulators first:  npm run emulators
 *   (Restart them after editing firestore.rules: the emulator says “Rules
 *   updated” but does not reload rules for the named `healthcarelabs` database.)
 * Then:                        npm run test:e2e
 */
const PORT = 5199;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    channel: 'msedge',
    headless: true,
    viewport: { width: 1280, height: 900 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'rules', testMatch: /rules\.spec\.ts/ },
    { name: 'e2e', testMatch: /(flows|content|lifecycle)\.spec\.ts/ },
    { name: 'monkey', testMatch: /monkey\.spec\.ts/ },
  ],
  webServer: {
    command: `npx vite --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 120_000,
    env: {
      VITE_USE_EMULATORS: 'true',
      VITE_FIREBASE_PROJECT_ID: 'demo-healthcarelabs',
      VITE_FIREBASE_API_KEY: 'demo-api-key',
      VITE_FIREBASE_AUTH_DOMAIN: 'localhost',
    },
  },
});
