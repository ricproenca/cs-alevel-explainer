import { defineConfig } from "@playwright/test";

const port = 4322;

export default defineConfig({
  testDir: "tests",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${port}/cs-alevel-explainer/`,
    // Locally, use the installed Chrome so no browser download is needed.
    channel: process.env.CI ? undefined : "chrome",
  },
  webServer: {
    command: `npm run build && npm run preview -- --port ${port}`,
    url: `http://localhost:${port}/cs-alevel-explainer/`,
    reuseExistingServer: !process.env.CI,
  },
});
