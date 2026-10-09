import { formatMoney, formatTime, groupByDay } from '@cuentas-claras/core';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { dogForMember, memberName } from '@/features/households/active-household';
import type { Household } from '@/features/households/api';

import type { Expense } from '../api';

function ExpenseRow({ expense, household }: { expense: Expense; household: Household }) {
  const title = expense.merchant?.name ?? expense.category?.name ?? 'Gasto';
  const details = [
    expense.merchant ? expense.category?.name : null,
    formatTime(new Date(expense.spent_at)),
    expense.note,
  ]
    .filter(Boolean)
    .join(' · ');
  const payer = memberName(household, expense.paid_by);

  return (
    <Pressable
      testID="expense-row"
      role="button"
      accessibilityLabel={`${title}, ${formatMoney(expense.amount_cents, expense.currency)}, pagó ${payer}`}
      onPress={() => router.push({ pathname: '/gasto/[id]', params: { id: expense.id } })}
      className="flex-row items-center gap-3 px-4 py-3 active:bg-cielo-50"
    >
      <View className="h-10 w-10 items-center justify-center rounded-full bg-cielo-100">
        <Text className="text-[18px]">{expense.category?.icon ?? '•'}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-[16px] font-medium text-tinta" numberOfLines={1}>
          {title}
        </Text>
        <Text className="text-[14px] text-tinta-500" numberOfLines={1}>
          {details}
        </Text>
      </View>
      <View className="items-end gap-1">
        <Text
          className="text-[16px] font-semibold text-tinta"
          style={{ fontVariant: ['tabular-nums'] }}
        >
          {formatMoney(expense.amount_cents, expense.currency)}
        </Text>
        {household.members.length > 1 ? (
          <Avatar dog={dogForMember(household, expense.paid_by)} name={payer} size={20} />
        ) : null}
      </View>
    </Pressable>
  );
}

/** Los gastos del mes agrupados por día, del más reciente al más viejo. */
export function ExpenseList({
  expenses,
  household,
}: {
  expenses: Expense[];
  household: Household;
}) {
  const days = groupByDay(expenses);
  return (
    <View className="gap-5">
      {days.map((day) => (
        <View key={day.key} className="gap-2">
          <View className="flex-row items-baseline justify-between px-1">
            <Text className="font-display-medium text-[16px] text-tinta">{day.heading}</Text>
            <Text className="text-[14px] text-tinta-500" style={{ fontVariant: ['tabular-nums'] }}>
              {day.totals.map((t) => formatMoney(t.totalCents, t.currency)).join(' + ')}
            </Text>
          </View>
          <View className="overflow-hidden rounded-3xl border border-cielo-200 bg-white">
            {day.items.map((expense, index) => (
              <View key={expense.id} className={index > 0 ? 'border-t border-cielo-100' : ''}>
                <ExpenseRow expense={expense} household={household} />
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}
