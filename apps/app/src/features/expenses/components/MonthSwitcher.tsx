import { formatMonth, type YearMonth } from '@cuentas-claras/core';
import { Text, View } from 'react-native';

import { IconButton } from '@/components/ui/Button';

export function MonthSwitcher({
  value,
  onPrevious,
  onNext,
  canGoNext,
}: {
  value: YearMonth;
  onPrevious: () => void;
  onNext: () => void;
  canGoNext: boolean;
}) {
  return (
    <View className="flex-row items-center justify-between">
      <IconButton
        icon="chevron-back"
        label="Mes anterior"
        onPress={onPrevious}
        testID="month-previous"
      />
      <Text testID="month-label" className="font-display-medium text-[18px] text-tinta">
        {formatMonth(value)}
      </Text>
      {canGoNext ? (
        <IconButton
          icon="chevron-forward"
          label="Mes siguiente"
          onPress={onNext}
          testID="month-next"
        />
      ) : (
        <View className="h-11 w-11" />
      )}
    </View>
  );
}
