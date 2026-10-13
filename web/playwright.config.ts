import { defineConfig, devices } from '@playwright/test';

/**
 * E2E contra el entorno local real (frontend :4200 + backend :8081 + Oracle/RabbitMQ
 * en Docker). No se levanta ningún server desde acá: el arranque es el mismo de
 * siempre (.claude/launch.json / demo local), Playwright solo apunta a lo que
 * ya está corriendo.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: process.env['E2E_BASE_URL'] ?? 'http://localhost:4200',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
