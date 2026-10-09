import { describe, expect, it } from 'vitest';

import { computeBalances } from './balances';

const luis = { user_id: 'luis', display_name: 'Luis' };
const cris = { user_id: 'cris', display_name: 'Cris' };
const tercero = { user_id: 'tercero', display_name: 'Tercero' };

const gasto = (paid_by: string, amount_cents: number, currency = 'ARS') => ({
  paid_by,
  amount_cents,
  currency,
});

describe('computeBalances', () => {
  it('sin gastos no hay saldo', () => {
    expect(computeBalances([luis, cris], [])).toEqual([]);
  });

  it('entre dos: el que pagó menos le debe la mitad de la diferencia', () => {
    const [ars] = computeBalances([luis, cris], [gasto('luis', 1_000_000), gasto('cris', 400_000)]);
    expect(ars).toMatchObject({ currency: 'ARS', totalCents: 1_400_000 });
    expect(ars?.members).toEqual([
      {
        userId: 'luis',
        displayName: 'Luis',
        paidCents: 1_000_000,
        shareCents: 700_000,
        netCents: 300_000,
      },
      {
        userId: 'cris',
        displayName: 'Cris',
        paidCents: 400_000,
        shareCents: 700_000,
        netCents: -300_000,
      },
    ]);
    expect(ars?.transfers).toEqual([
      { fromUserId: 'cris', toUserId: 'luis', amountCents: 300_000 },
    ]);
  });

  it('si pagaron lo mismo, están a mano', () => {
    const [ars] = computeBalances([luis, cris], [gasto('luis', 5_000), gasto('cris', 5_000)]);
    expect(ars?.transfers).toEqual([]);
    expect(ars?.members.every((m) => m.netCents === 0)).toBe(true);
  });

  it('reparte los centavos que no dividen exacto sin perder ninguno', () => {
    const [ars] = computeBalances([luis, cris, tercero], [gasto('luis', 1_000)]);
    const shares = ars?.members.map((m) => m.shareCents);
    expect(shares).toEqual([334, 333, 333]);
    expect(shares?.reduce((a, b) => a + b, 0)).toBe(1_000);
    expect(ars?.transfers).toEqual([
      { fromUserId: 'cris', toUserId: 'luis', amountCents: 333 },
      { fromUserId: 'tercero', toUserId: 'luis', amountCents: 333 },
    ]);
  });

  it('entre tres arma el mínimo de transferencias', () => {
    const [ars] = computeBalances(
      [luis, cris, tercero],
      [gasto('luis', 90_000), gasto('cris', 30_000), gasto('tercero', 0)],
    );
    // Total 120.000 → 40.000 cada uno: Luis +50.000, Cris -10.000, Tercero -40.000.
    expect(ars?.transfers).toEqual([
      { fromUserId: 'tercero', toUserId: 'luis', amountCents: 40_000 },
      { fromUserId: 'cris', toUserId: 'luis', amountCents: 10_000 },
    ]);
  });

  it('nunca mezcla monedas', () => {
    const result = computeBalances(
      [luis, cris],
      [gasto('luis', 10_000, 'USD'), gasto('cris', 200_000, 'ARS'), gasto('cris', 2_000, 'USD')],
    );
    expect(result.map((r) => [r.currency, r.totalCents])).toEqual([
      ['ARS', 200_000],
      ['USD', 12_000],
    ]);
    expect(result.find((r) => r.currency === 'USD')?.transfers).toEqual([
      { fromUserId: 'cris', toUserId: 'luis', amountCents: 4_000 },
    ]);
  });

  it('cuenta a quien pagó aunque ya no figure como miembro', () => {
    const [ars] = computeBalances([luis], [gasto('fantasma', 2_000)]);
    expect(ars?.members.map((m) => m.displayName)).toEqual(['Luis', 'Alguien']);
    expect(ars?.transfers).toEqual([
      { fromUserId: 'luis', toUserId: 'fantasma', amountCents: 1_000 },
    ]);
  });
});
