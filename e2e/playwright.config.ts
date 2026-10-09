import { defineConfig } from '@playwright/test';

import { BASE_URL, CONTEXT_OPTIONS, PORT } from './env';

/**
 * Pruebas de punta a punta: la app web exportada (apps/app/dist) contra Supabase local.
 * Antes: `pnpm db:start`, `pnpm db:reset` y el build web apuntando a Supabase local
 * (ver docs/ROADMAP.md, o el job "e2e" de .github/workflows/ci.yml).
 */
export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list'], ['html', { open: 'never' }]] : [['list']],
  use: {
    ...CONTEXT_OPTIONS,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // Para usar un Chromium ya instalado en vez de descargar uno.
    launchOptions: process.env.PW_CHROMIUM_PATH
      ? { executablePath: process.env.PW_CHROMIUM_PATH }
      : {},
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `node serve.mjs ../apps/app/dist ${PORT}`,
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
      },
});
