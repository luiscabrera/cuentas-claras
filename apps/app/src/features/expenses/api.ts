import {
  cleanName,
  DEFAULT_CURRENCY,
  expenseFormSchema,
  findByName,
  monthRange,
  parseAmount,
  type ExpenseFormValues,
  type YearMonth,
} from '@cuentas-claras/core';
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export type Category = { id: string; name: string; icon: string | null; sort_order: number };
export type Merchant = {
  id: string;
  name: string;
  default_category_id: string | null;
  usage: number;
};

const EXPENSE_COLUMNS =
  'id, amount_cents, currency, spent_at, note, paid_by, category_id, merchant_id, created_by, category:categories(id, name, icon), merchant:merchants(id, name)';

export const expenseKeys = {
  all: (householdId: string) => ['expenses', householdId] as const,
  month: (householdId: string, ym: YearMonth) =>
    ['expenses', householdId, 'month', ym.year, ym.month] as const,
  detail: (householdId: string, id: string) => ['expenses', householdId, 'detail', id] as const,
  categories: (householdId: string) => ['categories', householdId] as const,
  merchants: (householdId: string) => ['merchants', householdId] as const,
};

export function useCategories(householdId: string) {
  return useQuery({
    queryKey: expenseKeys.categories(householdId),
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, icon, sort_order')
        .eq('household_id', householdId)
        .is('archived_at', null)
        .order('sort_order')
        .order('name');
      if (error) throw error;
      return data;
    },
  });
}

/** Comercios del hogar con cuántas veces se usaron (para sugerir primero los más usados). */
export function useMerchants(householdId: string) {
  return useQuery({
    queryKey: expenseKeys.merchants(householdId),
    queryFn: async (): Promise<Merchant[]> => {
      const { data, error } = await supabase
        .from('merchants')
        .select('id, name, default_category_id, expenses(count)')
        .eq('household_id', householdId)
        .is('archived_at', null);
      if (error) throw error;
      return data.map(({ expenses, ...merchant }) => ({
        ...merchant,
        usage: expenses[0]?.count ?? 0,
      }));
    },
  });
}

async function fetchMonth(householdId: string, ym: YearMonth) {
  const { start, end } = monthRange(ym);
  const { data, error } = await supabase
    .from('expenses')
    .select(EXPENSE_COLUMNS)
    .eq('household_id', householdId)
    .gte('spent_at', start.toISOString())
    .lt('spent_at', end.toISOString())
    .order('spent_at', { ascending: false });
  if (error) throw error;
  return data;
}

export type Expense = Awaited<ReturnType<typeof fetchMonth>>[number];

export function useMonthExpenses(householdId: string, ym: YearMonth) {
  return useQuery({
    queryKey: expenseKeys.month(householdId, ym),
    queryFn: () => fetchMonth(householdId, ym),
  });
}

export function useExpense(householdId: string, id: string) {
  return useQuery({
    queryKey: expenseKeys.detail(householdId, id),
    queryFn: async (): Promise<Expense> => {
      const { data, error } = await supabase
        .from('expenses')
        .select(EXPENSE_COLUMNS)
        .eq('household_id', householdId)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

/**
 * El id del comercio escrito: usa uno existente (sin importar mayúsculas ni tildes)
 * o lo crea con la categoría elegida como categoría por defecto.
 */
async function resolveMerchant(
  queryClient: QueryClient,
  householdId: string,
  name: string,
  categoryId: string,
): Promise<string | null> {
  const merchantName = cleanName(name);
  if (!merchantName) return null;

  const cached = queryClient.getQueryData<Merchant[]>(expenseKeys.merchants(householdId)) ?? [];
  const existing = findByName(cached, merchantName);
  if (existing) return existing.id;

  const { data, error } = await supabase
    .from('merchants')
    .insert({ household_id: householdId, name: merchantName, default_category_id: categoryId })
    .select('id')
    .single();
  if (!error) return data.id;

  // Lo creó la otra persona hace un instante: lo buscamos.
  if (error.code === '23505') {
    const { data: all, error: listError } = await supabase
      .from('merchants')
      .select('id, name')
      .eq('household_id', householdId);
    if (listError) throw listError;
    const match = findByName(all, merchantName);
    if (match) return match.id;
  }
  throw error;
}

async function toRow(queryClient: QueryClient, householdId: string, values: ExpenseFormValues) {
  const parsed = expenseFormSchema.parse(values);
  return {
    amount_cents: parseAmount(parsed.amount)!,
    category_id: parsed.categoryId,
    merchant_id: await resolveMerchant(
      queryClient,
      householdId,
      parsed.merchantName,
      parsed.categoryId,
    ),
    paid_by: parsed.paidBy,
    spent_at: parsed.spentAt.toISOString(),
    note: parsed.note || null,
  };
}

function invalidateExpenses(queryClient: QueryClient, householdId: string) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: expenseKeys.all(householdId) }),
    queryClient.invalidateQueries({ queryKey: expenseKeys.merchants(householdId) }),
  ]);
}

export function useCreateExpense(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: ExpenseFormValues) => {
      const row = await toRow(queryClient, householdId, values);
      const { error } = await supabase
        .from('expenses')
        .insert({ ...row, household_id: householdId, currency: DEFAULT_CURRENCY });
      if (error) throw error;
    },
    onSuccess: () => invalidateExpenses(queryClient, householdId),
  });
}

export function useUpdateExpense(householdId: string, id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: ExpenseFormValues) => {
      const row = await toRow(queryClient, householdId, values);
      const { error } = await supabase.from('expenses').update(row).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => invalidateExpenses(queryClient, householdId),
  });
}

export function useDeleteExpense(householdId: string, id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
    },
    // El gasto ya no existe: se recargan las listas, pero no su detalle (la pantalla se está cerrando).
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: expenseKeys.all(householdId),
          predicate: (query) => query.queryKey[2] !== 'detail',
        }),
        queryClient.invalidateQueries({ queryKey: expenseKeys.merchants(householdId) }),
      ]),
  });
}
