import { formatAmountInput, formatMoney, parseAmount } from '@cuentas-claras/core';
import { forwardRef } from 'react';
import { Text, TextInput, View } from 'react-native';

import palette from '@/theme/palette';

/** El monto, grande y primero: es lo único que siempre hay que escribir. */
export const AmountInput = forwardRef<
  TextInput,
  { value: string; onChange: (value: string) => void; error?: string; autoFocus?: boolean }
>(function AmountInput({ value, onChange, error, autoFocus }, ref) {
  const cents = parseAmount(value);
  // Si lo escrito no está en formato argentino ("12500.5"), mostramos cómo se va a guardar.
  const preview =
    cents && cents > 0 && formatAmountInput(cents) !== value.trim() ? formatMoney(cents) : null;

  return (
    <View className="gap-1">
      <View
        className={`flex-row items-center rounded-3xl border-2 bg-white px-5 ${
          error ? 'border-error' : 'border-cielo-200'
        }`}
      >
        <Text className="mr-2 font-display text-[40px] text-tinta-400">$</Text>
        <TextInput
          ref={ref}
          testID="expense-amount"
          accessibilityLabel="Monto"
          value={value}
          onChangeText={onChange}
          autoFocus={autoFocus}
          keyboardType="decimal-pad"
          inputMode="decimal"
          placeholder="0"
          placeholderTextColor={palette.tinta[200]}
          className="min-h-[80px] min-w-0 flex-1 font-display text-[44px] text-tinta"
        />
      </View>
      {error ? (
        <Text className="px-2 text-[14px] text-error" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : preview ? (
        <Text className="px-2 text-[14px] text-tinta-500">{preview}</Text>
      ) : null}
    </View>
  );
});
