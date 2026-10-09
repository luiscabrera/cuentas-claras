import { describe, expect, it } from 'vitest';

import { groupByDay, totalsByCategory, totalsByCurrency } from './expenses';
import { findByName, normalizeName, suggestMerchants } from './merchants';

const gasto = (
  spent_at: string,
  amount_cents: number,
  category_id = 'super',
  currency = 'ARS',
) => ({
  spent_at,
  amount_cents,
  category_id,
  currency,
});

describe('totales', () => {
  const gastos = [
    gasto('2026-10-08T21:42:00Z', 1_250_000, 'super'),
    gasto('2026-10-08T12:00:00Z', 300_000, 'comidas'),
    gasto('2026-10-02T12:00:00Z', 450_000, 'super'),
    gasto('2026-10-03T12:00:00Z', 5_000, 'super', 'USD'),
  ];

  it('suma por moneda', () => {
    expect(totalsByCurrency(gastos)).toEqual([
      { currency: 'ARS', totalCents: 2_000_000 },
      { currency: 'USD', totalCents: 5_000 },
    ]);
  });

  it('suma por categoría en una moneda, de mayor a menor', () => {
    expect(totalsByCategory(gastos, 'ARS')).toEqual([
      { categoryId: 'super', totalCents: 1_700_000, count: 2 },
      { categoryId: 'comidas', totalCents: 300_000, count: 1 },
    ]);
  });
});

describe('groupByDay', () => {
  it('agrupa por día argentino, del más nuevo al más viejo', () => {
    const groups = groupByDay(
      [
        gasto('2026-10-08T12:00:00Z', 100),
        gasto('2026-10-09T02:30:00Z', 200), // 8/10 23:30 en Buenos Aires
        gasto('2026-10-07T15:00:00Z', 300),
      ],
      new Date('2026-10-09T12:00:00Z'),
    );
    expect(groups.map((g) => [g.key, g.heading, g.items.map((i) => i.amount_cents)])).toEqual([
      ['2026-10-08', 'Ayer', [200, 100]],
      ['2026-10-07', 'Miércoles 7', [300]],
    ]);
    expect(groups[0]?.totals).toEqual([{ currency: 'ARS', totalCents: 300 }]);
  });
});

describe('comercios', () => {
  const comercios = [
    { id: '1', name: 'Coto', usage: 12 },
    { id: '2', name: 'Carnicería Don José', usage: 3 },
    { id: '3', name: 'Chino de la esquina', usage: 20 },
    { id: '4', name: 'Día', usage: 1 },
  ];

  it('normaliza nombres', () => {
    expect(normalizeName('  Carnicería   DON José ')).toBe('carniceria don jose');
  });

  it('encuentra por nombre sin importar tildes ni mayúsculas', () => {
    expect(findByName(comercios, 'COTO')?.id).toBe('1');
    expect(findByName(comercios, 'dia')?.id).toBe('4');
    expect(findByName(comercios, '  ')).toBeUndefined();
  });

  it('sin texto sugiere los más usados', () => {
    expect(suggestMerchants(comercios, '').map((c) => c.name)).toEqual([
      'Chino de la esquina',
      'Coto',
      'Carnicería Don José',
      'Día',
    ]);
  });

  it('con texto prioriza los que empiezan igual', () => {
    expect(suggestMerchants(comercios, 'c').map((c) => c.name)).toEqual([
      'Chino de la esquina',
      'Coto',
      'Carnicería Don José',
    ]);
    expect(suggestMerchants(comercios, 'jose').map((c) => c.name)).toEqual(['Carnicería Don José']);
  });

  it('respeta el límite', () => {
    expect(suggestMerchants(comercios, '', 2)).toHaveLength(2);
  });
});
