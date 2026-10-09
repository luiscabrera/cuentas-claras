/** La app exportada para web se sirve en este puerto (ver serve.mjs). */
export const PORT = Number(process.env.E2E_PORT ?? 4173);
export const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

/** Como un celu en Buenos Aires. */
export const CONTEXT_OPTIONS = {
  baseURL: BASE_URL,
  locale: 'es-AR',
  timezoneId: 'America/Argentina/Buenos_Aires',
  viewport: { width: 390, height: 844 },
};
