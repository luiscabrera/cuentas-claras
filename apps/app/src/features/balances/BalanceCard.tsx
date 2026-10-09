import { computeBalances, formatMoney, type CurrencyBalance } from '@cuentas-claras/core';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { DogFace } from '@/components/mascots/Mascot';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { dogForMember, memberName } from '@/features/households/active-household';
import type { Household } from '@/features/households/api';

type PaidExpense = { paid_by: string; currency: string; amount_cents: number };

function resultSentence(balance: CurrencyBalance, household: Household, userId: string): string {
  const [transfer, ...rest] = balance.transfers;
  if (!transfer) return 'Están a mano.';
  const amount = formatMoney(transfer.amountCents, balance.currency);
  const from = memberName(household, transfer.fromUserId);
  const to = memberName(household, transfer.toUserId);
  const first =
    transfer.fromUserId === userId
      ? `Le debés ${amount} a ${to}.`
      : transfer.toUserId === userId
        ? `${from} te debe ${amount}.`
        : `${from} le debe ${amount} a ${to}.`;
  return rest.length
    ? `${first} Y ${rest.length} transferencia${rest.length > 1 ? 's' : ''} más.`
    : first;
}

/** "Cuentas claras" del mes: cuánto puso cada uno y quién le debe a quién (partes iguales). */
export function BalanceCard({
  household,
  userId,
  expenses,
  monthLabel,
}: {
  household: Household;
  userId: string;
  expenses: PaidExpense[];
  monthLabel: string;
}) {
  if (household.members.length < 2) {
    return (
      <View className="gap-3 rounded-[28px] border border-cielo-200 bg-white p-5">
        <View className="flex-row gap-2">
          <DogFace dog="pomelo" size={40} />
          <DogFace dog="trufa" size={40} />
        </View>
        <Text className="font-display-medium text-[18px] text-tinta">Sumá a tu pareja</Text>
        <Text className="text-[15px] leading-6 text-tinta-500">
          Cuando se sume alguien más, acá vas a ver cuánto puso cada uno y quién le debe a quién.
        </Text>
        <Button
          variant="secondary"
          icon="person-add-outline"
          label="Invitar"
          onPress={() => router.push('/ajustes')}
        />
      </View>
    );
  }

  const balances = computeBalances(household.members, expenses);
  const zero = { currency: 'ARS', totalCents: 0, transfers: [], members: [] } as CurrencyBalance;
  const shown = balances.length ? balances : [zero];

  return (
    <View
      testID="balance-card"
      className="gap-4 rounded-[28px] border border-cielo-200 bg-white p-5"
    >
      <Text className="font-display-medium text-[18px] text-tinta">
        Cuentas claras de {monthLabel}
      </Text>
      {shown.map((balance) => (
        <View key={balance.currency} className="gap-3">
          <Text className="text-[14px] text-tinta-500">Lo que puso cada uno</Text>
          {household.members.map((member) => {
            const paid = balance.members.find((m) => m.userId === member.user_id)?.paidCents ?? 0;
            return (
              <View key={member.user_id} className="flex-row items-center gap-3">
                <Avatar
                  dog={dogForMember(household, member.user_id)}
                  name={member.display_name}
                  size={40}
                />
                <Text className="flex-1 text-[16px] text-tinta-700" numberOfLines={1}>
                  {member.display_name}
                </Text>
                <Text
                  className="text-[16px] font-semibold text-tinta"
                  style={{ fontVariant: ['tabular-nums'] }}
                >
                  {formatMoney(paid, balance.currency)}
                </Text>
              </View>
            );
          })}
          <View className="mt-1 border-t border-dashed border-cielo-300 pt-4">
            <Text
              testID="balance-result"
              className="font-display-medium text-[20px] leading-7 text-fuego-700"
            >
              {resultSentence(balance, household, userId)}
            </Text>
            {balance.transfers.length ? (
              <Text className="mt-1 text-[14px] text-tinta-500">
                Así quedan a mano, repartiendo todo en partes iguales.
              </Text>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}
