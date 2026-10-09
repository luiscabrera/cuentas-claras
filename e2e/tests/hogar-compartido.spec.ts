import { expect, test } from '@playwright/test';

import { addExpense, newPerson, signUp, uniqueEmail } from './helpers';

test('dos personas comparten un hogar y las cuentas cierran', async ({ page: luis, browser }) => {
  // Luis se registra y arma el hogar.
  await signUp(luis, uniqueEmail('luis'));
  await luis.getByTestId('setup-display-name').fill('Luis');
  await luis.getByTestId('setup-household-name').fill('Casa E2E');
  await luis.getByTestId('setup-submit').click();
  await expect(luis.getByTestId('household-name')).toHaveText('Casa E2E');
  await expect(luis.getByTestId('empty-month')).toBeVisible();

  // El código de invitación está en Ajustes.
  await luis.getByTestId('open-settings').click();
  const code = (await luis.getByTestId('invite-code').textContent())?.trim() ?? '';
  expect(code).toMatch(/^[0-9A-F]{10}$/);
  await luis.getByRole('button', { name: 'Volver' }).click();

  // Cris se registra y se suma con el código (en minúsculas también funciona).
  const cris = await newPerson(browser);
  await signUp(cris, uniqueEmail('cris'));
  await cris.getByRole('radio', { name: 'Tengo un código' }).click();
  await cris.getByTestId('setup-display-name').fill('Cris');
  await cris.getByTestId('setup-invite-code').fill('0000000000');
  await cris.getByTestId('setup-submit').click();
  await expect(cris.getByText('El código de invitación no existe.')).toBeVisible();
  await cris.getByTestId('setup-invite-code').fill(code.toLowerCase());
  await cris.getByTestId('setup-submit').click();
  await expect(cris.getByTestId('household-name')).toHaveText('Casa E2E');

  // El monto es obligatorio.
  await cris.getByTestId('add-expense').click();
  await cris.getByTestId('expense-submit').click();
  await expect(cris.getByText('Ingresá el monto')).toBeVisible();
  await cris.getByRole('button', { name: 'Cerrar' }).click();

  // Cris carga un gasto en un comercio nuevo, que pagó Luis.
  await addExpense(cris, {
    amount: '25.000',
    merchant: 'Verdulería Don Pepe',
    category: 'Almacén / Supermercado',
    payer: 'Luis',
  });
  await expect(cris.getByTestId('month-total')).toHaveText('$ 25.000');
  await expect(cris.getByTestId('balance-result')).toHaveText('Le debés $ 12.500 a Luis.');

  // Luis lo ve, y el comercio nuevo ya le aparece sugerido con su categoría.
  await luis.reload();
  await expect(luis.getByTestId('balance-result')).toHaveText('Cris te debe $ 12.500.');
  await addExpense(luis, { amount: '4000', merchant: 'verd', pickMerchant: 'Verdulería Don Pepe' });
  await expect(luis.getByTestId('month-total')).toHaveText('$ 29.000');
  await expect(luis.getByTestId('balance-result')).toHaveText('Cris te debe $ 14.500.');

  // Editar: el gasto más nuevo queda primero en la lista.
  await luis.getByTestId('expense-row').first().click();
  await expect(luis.getByTestId('expense-amount')).toHaveValue('4.000');
  await luis.getByTestId('expense-amount').fill('5.000');
  await luis.getByTestId('expense-submit').click();
  await expect(luis.getByTestId('toast')).toHaveText('Cambios guardados');
  await expect(luis.getByTestId('month-total')).toHaveText('$ 30.000');

  // Borrar, confirmando el diálogo.
  luis.once('dialog', (dialog) => void dialog.accept());
  await luis.getByTestId('expense-row').first().click();
  await luis.getByTestId('expense-delete').click();
  await expect(luis.getByTestId('toast')).toHaveText('Gasto borrado');
  await expect(luis.getByTestId('month-total')).toHaveText('$ 25.000');

  // Alguien de otro hogar no ve nada de esto.
  const intruso = await newPerson(browser);
  await signUp(intruso, uniqueEmail('intruso'));
  await intruso.getByTestId('setup-display-name').fill('Intruso');
  await intruso.getByTestId('setup-household-name').fill('Otra casa');
  await intruso.getByTestId('setup-submit').click();
  await expect(intruso.getByTestId('household-name')).toHaveText('Otra casa');
  await expect(intruso.getByTestId('empty-month')).toBeVisible();

  // Cerrar sesión vuelve al login.
  await luis.getByTestId('open-settings').click();
  await luis.getByTestId('sign-out').click();
  await expect(luis.getByTestId('login-email')).toBeVisible();
});
