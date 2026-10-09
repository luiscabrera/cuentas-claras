import { expect, test } from '@playwright/test';

import { signIn } from './helpers';

// Usa los datos de supabase/seed.sql (se cargan con `pnpm db:reset`).
test('se puede entrar con los usuarios de prueba', async ({ page }) => {
  await signIn(page, 'pomelo@example.com', 'mal');
  await expect(page.getByText('El email o la contraseña no son correctos.')).toBeVisible();

  await signIn(page, 'pomelo@example.com', 'cuentas-claras');
  await expect(page.getByTestId('household-name')).toHaveText('Casa');

  // Escribir un comercio conocido, aunque no se elija de la lista, trae su categoría.
  await page.getByTestId('add-expense').click();
  await page.getByTestId('expense-merchant').fill('coto');
  await expect(page.getByTestId('category-Almacén / Supermercado')).toBeChecked();
  await page.getByRole('button', { name: 'Cerrar' }).click();

  await page.getByTestId('open-settings').click();
  await expect(page.getByTestId('invite-code')).toHaveText('CA5A000001');
  await expect(page.getByTestId('member-name')).toHaveText(['Pomelo (vos)', 'Trufa']);
});
