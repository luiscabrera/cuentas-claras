import { router } from 'expo-router';

import { useToast } from '@/components/ui/Toast';
import { useUserId } from '@/features/auth/session';
import { useCreateExpense } from '@/features/expenses/api';
import { ExpenseForm } from '@/features/expenses/components/ExpenseForm';
import { useHousehold } from '@/features/households/active-household';

export default function NewExpenseScreen() {
  const household = useHousehold();
  const userId = useUserId();
  const create = useCreateExpense(household.id);
  const toast = useToast();

  return (
    <ExpenseForm
      title="Nuevo gasto"
      household={household}
      userId={userId}
      submitLabel="Guardar gasto"
      isSubmitting={create.isPending}
      error={create.error}
      onSubmit={(values) =>
        create.mutate(values, {
          onSuccess: () => {
            toast.show('Gasto guardado');
            if (router.canGoBack()) router.back();
            else router.replace('/');
          },
        })
      }
    />
  );
}
