import { defineConfig } from 'eslint/config';
import expoConfig from 'eslint-config-expo/flat.js';

export default defineConfig([
  expoConfig,
  // core no usa React; esto evita el aviso de eslint-plugin-react.
  { settings: { react: { version: '19.2' } } },
]);
