import { defineConfig } from "@playwright/test";

// Uses the Google Chrome already installed on this Mac (no browser download).
export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:5173",
    channel: "chrome",
    viewport: { width: 1440, height: 900 },
    acceptDownloads: true,
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173/api/health",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
