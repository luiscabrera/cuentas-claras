import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    // Las fechas se prueban con el huso horario de la app, no con el de la máquina.
    env: { TZ: 'UTC' },
  },
});
