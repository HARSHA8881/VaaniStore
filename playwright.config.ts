import { defineConfig, devices } from "@playwright/test";

// E2E_PORT lets tests run beside a dev server you already have open on 3000.
const port = Number(process.env.E2E_PORT ?? 3000);

/** One end-to-end flow on a phone-sized screen (our users are on Android phones). */
export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  forbidOnly: !!process.env.CI,
  use: { baseURL: `http://localhost:${port}`, trace: "retain-on-failure" },
  projects: [{ name: "mobile-chrome", use: { ...devices["Pixel 7"] } }],
  webServer: {
    // CI tests the production build; locally the dev server is faster to start.
    command: process.env.CI ? `npm run start -- -p ${port}` : `npm run dev -- -p ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
