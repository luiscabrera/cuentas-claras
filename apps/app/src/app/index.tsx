import {
  addMonths,
  currentYearMonth,
  formatMoney,
  isSameYearMonth,
  monthName,
  totalsByCurrency,
  type YearMonth,
} from '@cuentas-claras/core';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { Dachshund, LogoMark } from '@/components/mascots/Mascot';
import { Button, IconButton } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { useUserId } from '@/features/auth/session';
import { BalanceCard } from '@/features/balances/BalanceCard';
import { useMonthExpenses } from '@/features/expenses/api';
import { CategoryBreakdown } from '@/features/expenses/components/CategoryBreakdown';
import { ExpenseList } from '@/features/expenses/components/ExpenseList';
import { MonthSwitcher } from '@/features/expenses/components/MonthSwitcher';
import { useHousehold } from '@/features/households/active-household';
import { errorMessage } from '@/lib/errors';
import palette from '@/theme/palette';

export default function HomeScreen() {
  const household = useHousehold();
  const userId = useUserId();
  const [month, setMonth] = useState<YearMonth>(() => currentYearMonth());
  const expenses = useMonthExpenses(household.id, month);
  const isCurrentMonth = isSameYearMonth(month, currentYearMonth());

  const list = expenses.data ?? [];
  const totals = totalsByCurrency(list);
  const ars = totals.find((t) => t.currency === 'ARS')?.totalCents ?? 0;
  const others = totals.filter((t) => t.currency !== 'ARS');

  return (
    <Screen
      onRefresh={() => void expenses.refetch()}
      refreshing={expenses.isRefetching}
      header={
        <View className="flex-row items-center gap-3 px-5 pt-2">
          <LogoMark width={44} style="plano" />
          <Text
            testID="household-name"
            className="flex-1 font-display text-[24px] text-tinta"
            numberOfLines={1}
          >
            {household.name}
          </Text>
          <IconButton
            testID="open-settings"
            icon="settings-outline"
            label="Ajustes"
            onPress={() => router.push('/ajustes')}
          />
        </View>
      }
      footer={
        <Button
          testID="add-expense"
          size="lg"
          icon="add"
          label="Cargá un gasto"
          onPress={() => router.push('/gasto/nuevo')}
        />
      }
    >
      <View className="gap-7 pt-2">
        <MonthSwitcher
          value={month}
          onPrevious={() => setMonth((m) => addMonths(m, -1))}
          onNext={() => setMonth((m) => addMonths(m, 1))}
          canGoNext={!isCurrentMonth}
        />

        {expenses.isPending ? (
          <ActivityIndicator className="py-16" color={palette.cielo[600]} />
        ) : expenses.error ? (
          <View className="items-center gap-4 py-12">
            <Text className="text-center text-[16px] text-tinta-700">
              {errorMessage(expenses.error)}
            </Text>
            <Button
              variant="secondary"
              icon="refresh"
              label="Reintentar"
              onPress={() => void expenses.refetch()}
            />
          </View>
        ) : list.length === 0 ? (
          <View className="items-center gap-3 py-10" testID="empty-month">
            <Dachshund dog="pomelo" pose="durmiendo" width={190} />
            <Text className="text-center font-display-medium text-[20px] text-tinta">
              No hay gastos en {monthName(month)}
            </Text>
            <Text className="text-center text-[15px] text-tinta-500">
              {isCurrentMonth
                ? 'Cargá el primero con el botón de abajo.'
                : 'Este mes quedó en blanco.'}
            </Text>
            {household.members.length < 2 ? (
              <View className="mt-4 w-full">
                <BalanceCard
                  household={household}
                  userId={userId}
                  expenses={[]}
                  monthLabel={monthName(month)}
                />
              </View>
            ) : null}
          </View>
        ) : (
          <>
            <View>
              <Text className="text-[15px] text-tinta-500">Gastaron en {monthName(month)}</Text>
              <Text
                testID="month-total"
                className="font-display text-[44px] leading-[52px] text-tinta"
                style={{ fontVariant: ['tabular-nums'] }}
              >
                {formatMoney(ars)}
              </Text>
              {others.length ? (
                <Text className="text-[15px] text-tinta-700">
                  y {others.map((t) => formatMoney(t.totalCents, t.currency)).join(' + ')}
                </Text>
              ) : null}
              <Text className="text-[15px] text-tinta-500">
                {list.length === 1 ? '1 gasto' : `${list.length} gastos`}
              </Text>
            </View>

            <BalanceCard
              household={household}
              userId={userId}
              expenses={list}
              monthLabel={monthName(month)}
            />
            <CategoryBreakdown expenses={list} />
            <View className="gap-3">
              <Text className="font-display-medium text-[18px] text-tinta">Gastos</Text>
              <ExpenseList expenses={list} household={household} />
            </View>
          </>
        )}
      </View>
    </Screen>
  );
}
