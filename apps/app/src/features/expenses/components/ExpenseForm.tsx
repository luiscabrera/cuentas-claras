import { expenseFormSchema, type ExpenseFormValues } from '@cuentas-claras/core';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Text, View } from 'react-native';

import { Button, IconButton } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import type { Household } from '@/features/households/api';
import { errorMessage } from '@/lib/errors';
import palette from '@/theme/palette';

import { useCategories, useMerchants } from '../api';
import { AmountInput } from './AmountInput';
import { CategoryPicker } from './CategoryPicker';
import { DateTimeField } from './DateTimeField';
import { MerchantField } from './MerchantField';
import { PayerPicker } from './PayerPicker';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-2.5">
      <Text className="font-display-medium text-[17px] text-tinta">{title}</Text>
      {children}
    </View>
  );
}

/** El formulario de alta y edición de gastos. */
export function ExpenseForm({
  title,
  household,
  userId,
  defaultValues,
  submitLabel,
  onSubmit,
  isSubmitting,
  error,
  extraActions,
}: {
  title: string;
  household: Household;
  userId: string;
  defaultValues?: Partial<ExpenseFormValues>;
  submitLabel: string;
  onSubmit: (values: ExpenseFormValues) => void;
  isSubmitting: boolean;
  error: unknown;
  extraActions?: ReactNode;
}) {
  const categories = useCategories(household.id);
  const merchants = useMerchants(household.id);

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      amount: '',
      categoryId: '',
      merchantName: '',
      paidBy: userId,
      // Fecha y hora de ahora: se pueden cambiar si el gasto fue antes.
      spentAt: new Date(),
      note: '',
      ...defaultValues,
    },
  });

  const submit = form.handleSubmit(onSubmit);
  const loading = categories.isPending || merchants.isPending;

  return (
    <Screen
      header={
        <View className="flex-row items-center gap-1 px-2 pt-2">
          <IconButton icon="close" label="Cerrar" onPress={() => router.back()} />
          <Text className="font-display text-[22px] text-tinta">{title}</Text>
        </View>
      }
      footer={
        <View className="gap-2">
          {error ? (
            <Text className="text-center text-[15px] text-error" accessibilityRole="alert">
              {errorMessage(error)}
            </Text>
          ) : null}
          <Button
            testID="expense-submit"
            size="lg"
            icon="checkmark"
            label={submitLabel}
            loading={isSubmitting}
            disabled={loading}
            onPress={submit}
          />
          {extraActions}
        </View>
      }
    >
      <View className="gap-7 pt-3">
        <Controller
          control={form.control}
          name="amount"
          render={({ field, fieldState }) => (
            <AmountInput
              value={field.value}
              onChange={field.onChange}
              error={fieldState.error?.message}
              autoFocus={!defaultValues?.amount}
            />
          )}
        />

        {loading ? (
          <ActivityIndicator color={palette.cielo[600]} />
        ) : (
          <>
            <Section title="¿Dónde?">
              <Controller
                control={form.control}
                name="merchantName"
                render={({ field, fieldState }) => (
                  <MerchantField
                    merchants={merchants.data ?? []}
                    value={field.value}
                    onChange={field.onChange}
                    error={fieldState.error?.message}
                    onPick={(merchant) => {
                      field.onChange(merchant.name);
                      // El comercio trae su categoría de siempre (Coto → Almacén).
                      if (merchant.default_category_id) {
                        form.setValue('categoryId', merchant.default_category_id, {
                          shouldValidate: true,
                        });
                      }
                    }}
                  />
                )}
              />
            </Section>

            <Section title="¿En qué?">
              <Controller
                control={form.control}
                name="categoryId"
                render={({ field, fieldState }) => (
                  <CategoryPicker
                    categories={categories.data ?? []}
                    value={field.value}
                    onChange={field.onChange}
                    error={fieldState.error?.message}
                  />
                )}
              />
            </Section>

            {household.members.length > 1 ? (
              <Section title="¿Quién pagó?">
                <Controller
                  control={form.control}
                  name="paidBy"
                  render={({ field }) => (
                    <PayerPicker
                      household={household}
                      userId={userId}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </Section>
            ) : null}

            <Section title="¿Cuándo?">
              <Controller
                control={form.control}
                name="spentAt"
                render={({ field }) => (
                  <DateTimeField value={field.value} onChange={field.onChange} />
                )}
              />
            </Section>

            <Controller
              control={form.control}
              name="note"
              render={({ field, fieldState }) => (
                <TextField
                  testID="expense-note"
                  label="Nota"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={fieldState.error?.message}
                  placeholder="Opcional"
                  maxLength={280}
                />
              )}
            />
          </>
        )}
      </View>
    </Screen>
  );
}
