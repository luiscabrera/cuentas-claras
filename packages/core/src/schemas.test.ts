import { describe, expect, it } from 'vitest';

import {
  expenseFormSchema,
  inviteCodeSchema,
  joinHouseholdSchema,
  signInSchema,
  signUpSchema,
} from './schemas';

const firstError = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
  result.error?.issues[0]?.message;

describe('login', () => {
  it('normaliza el email', () => {
    expect(signInSchema.parse({ email: '  Luis@Mail.COM ', password: 'x' }).email).toBe(
      'luis@mail.com',
    );
  });

  it('avisa si el email no es válido', () => {
    expect(firstError(signInSchema.safeParse({ email: 'luis', password: 'x' }))).toBe(
      'Ingresá un email válido',
    );
  });

  it('pide 6 caracteres de contraseña para registrarse', () => {
    expect(firstError(signUpSchema.safeParse({ email: 'a@b.co', password: '123' }))).toBe(
      'Usá al menos 6 caracteres',
    );
  });
});

describe('código de invitación', () => {
  it('perdona minúsculas, espacios, guiones y la O', () => {
    expect(inviteCodeSchema.parse(' a1b2c-3d4e o ')).toBe('A1B2C3D4E0');
  });

  it('rechaza códigos inválidos', () => {
    expect(inviteCodeSchema.safeParse('ZZZZZZZZZZ').success).toBe(false);
    expect(inviteCodeSchema.safeParse('A1B2').success).toBe(false);
  });

  it('se usa para unirse a un hogar', () => {
    expect(joinHouseholdSchema.parse({ displayName: ' Cris ', inviteCode: 'a1b2c3d4e5' })).toEqual({
      displayName: 'Cris',
      inviteCode: 'A1B2C3D4E5',
    });
  });
});

describe('gasto', () => {
  const valido = {
    amount: '12.500,50',
    categoryId: 'cat',
    merchantName: ' Coto ',
    paidBy: 'luis',
    spentAt: new Date('2026-10-08T21:42:00Z'),
    note: '',
  };

  it('acepta un gasto válido', () => {
    expect(expenseFormSchema.parse(valido).merchantName).toBe('Coto');
  });

  it.each([
    ['', 'Ingresá el monto'],
    ['0', 'Ingresá un monto válido, por ejemplo 12.500,50'],
    ['doce', 'Ingresá un monto válido, por ejemplo 12.500,50'],
    ['99.999.999.999', 'Ese monto es demasiado grande'],
  ])('rechaza el monto "%s"', (amount, message) => {
    expect(firstError(expenseFormSchema.safeParse({ ...valido, amount }))).toBe(message);
  });

  it('pide categoría', () => {
    expect(firstError(expenseFormSchema.safeParse({ ...valido, categoryId: '' }))).toBe(
      'Elegí una categoría',
    );
  });
});
