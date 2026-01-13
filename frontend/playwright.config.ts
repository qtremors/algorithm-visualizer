import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  workers: 1,
  timeout: 20_000,
  use: {
    baseURL: 'http://127.0.0.1:5173',
    viewport: { width: 1440, height: 1000 },
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
    },
  },
  webServer: [
    {
      command:
        'uv run --project ../backend uvicorn app.main:api --app-dir ../backend --port 8000 --ws-max-size 65536',
      url: 'http://127.0.0.1:8000/api/health',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npm run dev -- --host 127.0.0.1',
      url: 'http://127.0.0.1:5173',
      reuseExistingServer: !process.env.CI,
    },
  ],
});
