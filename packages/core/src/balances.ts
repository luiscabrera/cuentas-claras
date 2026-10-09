/**
 * Cuentas claras: cuánto pagó cada miembro, cuánto le toca y quién le debe a quién.
 * En v1 cada gasto se reparte en partes iguales entre todos los miembros del hogar.
 */

export type BalanceMember = { user_id: string; display_name: string };
export type PaidExpense = { paid_by: string; currency: string; amount_cents: number };

export type MemberBalance = {
  userId: string;
  displayName: string;
  /** Lo que puso de su bolsillo. */
  paidCents: number;
  /** Lo que le corresponde pagar. */
  shareCents: number;
  /** Positivo: le deben. Negativo: debe. */
  netCents: number;
};

export type Transfer = { fromUserId: string; toUserId: string; amountCents: number };

export type CurrencyBalance = {
  currency: string;
  totalCents: number;
  members: MemberBalance[];
  /** Las transferencias mínimas para quedar a mano. Vacío si ya están a mano. */
  transfers: Transfer[];
};

/**
 * Calcula el saldo por moneda (nunca se suman monedas distintas).
 * Los miembros se respetan en el orden recibido; los centavos que no se pueden
 * dividir en partes iguales se asignan de a uno, empezando por el primero.
 */
export function computeBalances(
  members: readonly BalanceMember[],
  expenses: readonly PaidExpense[],
): CurrencyBalance[] {
  const people = [...members];
  for (const expense of expenses) {
    // Por las dudas: alguien que pagó pero ya no figura como miembro.
    if (!people.some((m) => m.user_id === expense.paid_by)) {
      people.push({ user_id: expense.paid_by, display_name: 'Alguien' });
    }
  }
  if (people.length === 0) return [];

  const byCurrency = new Map<string, Map<string, number>>();
  for (const { currency, paid_by, amount_cents } of expenses) {
    const paid = byCurrency.get(currency) ?? new Map<string, number>();
    paid.set(paid_by, (paid.get(paid_by) ?? 0) + amount_cents);
    byCurrency.set(currency, paid);
  }

  return [...byCurrency.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([currency, paid]) => {
      const totalCents = [...paid.values()].reduce((sum, cents) => sum + cents, 0);
      const base = Math.floor(totalCents / people.length);
      const remainder = totalCents - base * people.length;

      const balances = people.map((member, index): MemberBalance => {
        const paidCents = paid.get(member.user_id) ?? 0;
        const shareCents = base + (index < remainder ? 1 : 0);
        return {
          userId: member.user_id,
          displayName: member.display_name,
          paidCents,
          shareCents,
          netCents: paidCents - shareCents,
        };
      });

      return { currency, totalCents, members: balances, transfers: settle(balances) };
    });
}

/** Empareja a quienes deben con quienes tienen que cobrar, de mayor a menor. */
function settle(balances: readonly MemberBalance[]): Transfer[] {
  const debtors = balances
    .filter((b) => b.netCents < 0)
    .map((b) => ({ userId: b.userId, cents: -b.netCents }))
    .sort((a, b) => b.cents - a.cents);
  const creditors = balances
    .filter((b) => b.netCents > 0)
    .map((b) => ({ userId: b.userId, cents: b.netCents }))
    .sort((a, b) => b.cents - a.cents);

  const transfers: Transfer[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i]!;
    const creditor = creditors[j]!;
    const amountCents = Math.min(debtor.cents, creditor.cents);
    transfers.push({ fromUserId: debtor.userId, toUserId: creditor.userId, amountCents });
    debtor.cents -= amountCents;
    creditor.cents -= amountCents;
    if (debtor.cents === 0) i++;
    if (creditor.cents === 0) j++;
  }
  return transfers;
}
