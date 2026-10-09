import { formatAmountInput } from '@cuentas-claras/core';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { useToast } from '@/components/ui/Toast';
import { useUserId } from '@/features/auth/session';
import { useDeleteExpense, useExpense, useUpdateExpense } from '@/features/expenses/api';
import { ExpenseForm } from '@/features/expenses/components/ExpenseForm';
import { useHousehold } from '@/features/households/active-household';
import { confirm } from '@/lib/confirm';
import { errorMessage } from '@/lib/errors';
import palette from '@/theme/palette';

export default function EditExpenseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const household = useHousehold();
  const userId = useUserId();
  const expense = useExpense(household.id, id);
  const update = useUpdateExpense(household.id, id);
  const remove = useDeleteExpense(household.id, id);
  const toast = useToast();

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  if (expense.isPending || expense.error) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center gap-4 pt-24">
          {expense.error ? (
            <>
              <Text className="text-center text-[16px] text-tinta-700">
                {errorMessage(expense.error)}
              </Text>
              <Button variant="secondary" label="Volver" onPress={close} />
            </>
          ) : (
            <ActivityIndicator color={palette.cielo[600]} />
          )}
        </View>
      </Screen>
    );
  }

  const data = expense.data;
  const askToDelete = async () => {
    const ok = await confirm('¿Borrar este gasto?', 'No se puede deshacer.', 'Borrar');
    if (!ok) return;
    remove.mutate(undefined, {
      onSuccess: () => {
        toast.show('Gasto borrado');
        close();
      },
    });
  };

  return (
    <ExpenseForm
      title="Editar gasto"
      household={household}
      userId={userId}
      defaultValues={{
        amount: formatAmountInput(data.amount_cents),
        categoryId: data.category_id,
        merchantName: data.merchant?.name ?? '',
        paidBy: data.paid_by,
        spentAt: new Date(data.spent_at),
        note: data.note ?? '',
      }}
      submitLabel="Guardar cambios"
      isSubmitting={update.isPending}
      error={update.error ?? remove.error}
      onSubmit={(values) =>
        update.mutate(values, {
          onSuccess: () => {
            toast.show('Cambios guardados');
            close();
          },
        })
      }
      extraActions={
        <Button
          testID="expense-delete"
          variant="danger"
          icon="trash-outline"
          label="Borrar gasto"
          loading={remove.isPending}
          onPress={askToDelete}
        />
      }
    />
  );
}
