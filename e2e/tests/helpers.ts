import { expect, type Browser, type Page } from '@playwright/test';

import { CONTEXT_OPTIONS } from '../env';

export const PASSWORD = 'secreto-123';

/** Un email nuevo por corrida, para no chocar con datos de corridas anteriores. */
export function uniqueEmail(name: string): string {
  return `${name}.${Date.now()}.${Math.floor(Math.random() * 1e6)}@example.com`;
}

/** Otra persona, con su propio navegador (su propia sesión). */
export async function newPerson(browser: Browser): Promise<Page> {
  const context = await browser.newContext(CONTEXT_OPTIONS);
  return context.newPage();
}

export async function signUp(page: Page, email: string) {
  await page.goto('/');
  await page.getByRole('radio', { name: 'Crear cuenta' }).click();
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill(PASSWORD);
  await page.getByTestId('login-submit').click();
  await expect(page.getByTestId('setup-submit')).toBeVisible();
}

export async function signIn(page: Page, email: string, password: string) {
  await page.goto('/');
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill(password);
  await page.getByTestId('login-submit').click();
}

type NewExpense = {
  amount: string;
  /** Texto a escribir en el comercio. */
  merchant?: string;
  /** Comercio sugerido a elegir después de escribir. */
  pickMerchant?: string;
  category?: string;
  /** Nombre de quien pagó, si no es quien carga. */
  payer?: string;
};

export async function addExpense(page: Page, expense: NewExpense) {
  await page.getByTestId('add-expense').click();
  await page.getByTestId('expense-amount').fill(expense.amount);
  if (expense.merchant) await page.getByTestId('expense-merchant').fill(expense.merchant);
  if (expense.pickMerchant) {
    await page.getByRole('button', { name: `Elegir ${expense.pickMerchant}` }).click();
  }
  if (expense.category) await page.getByTestId(`category-${expense.category}`).click();
  if (expense.payer) await page.getByRole('radio', { name: expense.payer, exact: true }).click();
  await page.getByTestId('expense-submit').click();
  await expect(page.getByTestId('toast')).toHaveText('Gasto guardado');
}
