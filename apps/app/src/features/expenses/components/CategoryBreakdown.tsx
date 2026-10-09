import { formatMoney, totalsByCategory } from '@cuentas-claras/core';
import { Text, View } from 'react-native';

import type { Expense } from '../api';

/** En qué se fue la plata del mes (en pesos), de mayor a menor. */
export function CategoryBreakdown({ expenses }: { expenses: Expense[] }) {
  const totals = totalsByCategory(expenses, 'ARS');
  if (totals.length === 0) return null;
  const max = totals[0]!.totalCents;
  const byId = new Map(expenses.map((e) => [e.category_id, e.category]));

  return (
    <View className="gap-3">
      <Text className="font-display-medium text-[18px] text-tinta">En qué se fue</Text>
      <View className="gap-3.5">
        {totals.map((total) => {
          const category = byId.get(total.categoryId);
          return (
            <View key={total.categoryId} className="gap-1.5">
              <View className="flex-row items-center gap-2">
                <Text className="text-[16px]">{category?.icon ?? '•'}</Text>
                <Text className="flex-1 text-[15px] text-tinta-700" numberOfLines={1}>
                  {category?.name ?? 'Sin categoría'}
                </Text>
                <Text
                  className="text-[15px] font-semibold text-tinta"
                  style={{ fontVariant: ['tabular-nums'] }}
                >
                  {formatMoney(total.totalCents)}
                </Text>
              </View>
              <View className="h-2 overflow-hidden rounded-full bg-cielo-100">
                <View
                  className="h-2 rounded-full bg-fuego-400"
                  style={{ width: `${Math.max(4, Math.round((total.totalCents / max) * 100))}%` }}
                />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
