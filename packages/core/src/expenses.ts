import { dayKey, formatDayHeading } from './dates';

/** Lo mínimo de un gasto para resumirlo (las columnas tal cual vienen de la base). */
export type SummaryExpense = {
  amount_cents: number;
  currency: string;
  spent_at: string;
  category_id: string;
};

export type CurrencyTotal = { currency: string; totalCents: number };

export function totalsByCurrency(expenses: readonly SummaryExpense[]): CurrencyTotal[] {
  const totals = new Map<string, number>();
  for (const { currency, amount_cents } of expenses) {
    totals.set(currency, (totals.get(currency) ?? 0) + amount_cents);
  }
  return [...totals.entries()]
    .map(([currency, totalCents]) => ({ currency, totalCents }))
    .sort((a, b) => b.totalCents - a.totalCents);
}

export type CategoryTotal = { categoryId: string; totalCents: number; count: number };

/** Total por categoría en una moneda, de mayor a menor. */
export function totalsByCategory(
  expenses: readonly SummaryExpense[],
  currency: string,
): CategoryTotal[] {
  const totals = new Map<string, CategoryTotal>();
  for (const expense of expenses) {
    if (expense.currency !== currency) continue;
    const current = totals.get(expense.category_id) ?? {
      categoryId: expense.category_id,
      totalCents: 0,
      count: 0,
    };
    current.totalCents += expense.amount_cents;
    current.count += 1;
    totals.set(expense.category_id, current);
  }
  return [...totals.values()].sort((a, b) => b.totalCents - a.totalCents);
}

export type DayGroup<T> = { key: string; heading: string; items: T[]; totals: CurrencyTotal[] };

/** Agrupa por día (hora argentina), del más reciente al más viejo. */
export function groupByDay<T extends SummaryExpense>(
  expenses: readonly T[],
  now: Date = new Date(),
): DayGroup<T>[] {
  const sorted = [...expenses].sort(
    (a, b) => new Date(b.spent_at).getTime() - new Date(a.spent_at).getTime(),
  );
  const groups = new Map<string, DayGroup<T>>();
  for (const expense of sorted) {
    const date = new Date(expense.spent_at);
    const key = dayKey(date);
    let group = groups.get(key);
    if (!group) {
      group = { key, heading: formatDayHeading(date, now), items: [], totals: [] };
      groups.set(key, group);
    }
    group.items.push(expense);
  }
  for (const group of groups.values()) group.totals = totalsByCurrency(group.items);
  return [...groups.values()];
}
