import { describe, expect, it } from 'vitest';

import { formatAmountInput, formatMoney, parseAmount } from './money';

const NBSP = ' ';

describe('parseAmount', () => {
  it.each([
    ['12.500,50', 1_250_050],
    ['12500,5', 1_250_050],
    ['12500,50', 1_250_050],
    ['12500', 1_250_000],
    ['12.500', 1_250_000],
    ['1.250.000', 125_000_000],
    ['1.250.000,99', 125_000_099],
    ['12500.50', 1_250_050],
    ['12500.5', 1_250_050],
    ['1.5', 150],
    ['0,5', 50],
    [',5', 50],
    ['12,', 1_200],
    ['$ 12.500,50', 1_250_050],
    [`$${NBSP}12.500`, 1_250_000],
    ['  999  ', 99_900],
    ['0', 0],
  ])('"%s" → %i centavos', (input, expected) => {
    expect(parseAmount(input)).toBe(expected);
  });

  it.each([
    '',
    '   ',
    'abc',
    '-5',
    '12,5,0',
    '1,234,56',
    '12.50.0',
    '1.2345',
    '12,345',
    '1e5',
    '12.5,0',
  ])('rechaza "%s"', (input) => {
    expect(parseAmount(input)).toBeNull();
  });

  it('no pierde centavos por errores de punto flotante', () => {
    expect(parseAmount('0,29')).toBe(29);
    expect(parseAmount('1.234.567,89')).toBe(123_456_789);
  });
});

describe('formatMoney', () => {
  it('usa el formato argentino', () => {
    expect(formatMoney(1_250_050, 'ARS')).toBe(`$${NBSP}12.500,50`);
  });

  it('esconde los centavos cuando no hay', () => {
    expect(formatMoney(1_250_000)).toBe(`$${NBSP}12.500`);
    expect(formatMoney(0)).toBe(`$${NBSP}0`);
  });

  it('puede mostrar siempre los centavos', () => {
    expect(formatMoney(1_250_000, 'ARS', { alwaysShowCents: true })).toBe(`$${NBSP}12.500,00`);
  });

  it('distingue los dólares', () => {
    expect(formatMoney(1_050, 'USD')).toBe(`US$${NBSP}10,50`);
  });

  it('muestra montos negativos', () => {
    expect(formatMoney(-150_000)).toBe(`-$${NBSP}1.500`);
  });
});

describe('formatAmountInput', () => {
  it('deja el monto listo para editar', () => {
    expect(formatAmountInput(1_250_050)).toBe('12.500,50');
    expect(formatAmountInput(1_250_000)).toBe('12.500');
  });

  it.each([1, 99, 100, 1_250_050, 125_000_099, 99_999_999_999])('ida y vuelta con %i', (cents) => {
    expect(parseAmount(formatAmountInput(cents))).toBe(cents);
  });
});
