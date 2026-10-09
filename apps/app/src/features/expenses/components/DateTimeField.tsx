import { APP_TIME_ZONE, formatWhen } from '@cuentas-claras/core';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Platform, Pressable, Text, View } from 'react-native';

import type { DateTimeFieldProps } from './DateTimeField.types';

/**
 * En el celu: iOS muestra el selector compacto; Android abre primero la fecha y después la hora.
 * (La versión web está en DateTimeField.web.tsx.)
 */
export function DateTimeField({ value, onChange }: DateTimeFieldProps) {
  if (Platform.OS === 'ios') {
    return (
      <View className="min-h-[48px] flex-row items-center justify-between rounded-2xl border border-cielo-200 bg-white px-4">
        <Text className="text-[17px] text-tinta">{formatWhen(value)}</Text>
        <DateTimePicker
          value={value}
          mode="datetime"
          display="compact"
          locale="es-AR"
          timeZoneName={APP_TIME_ZONE}
          onChange={(_, date) => date && onChange(date)}
        />
      </View>
    );
  }

  const openAndroid = () => {
    DateTimePickerAndroid.open({
      value,
      mode: 'date',
      timeZoneName: APP_TIME_ZONE,
      onChange: (event, date) => {
        if (event.type !== 'set' || !date) return;
        DateTimePickerAndroid.open({
          value: date,
          mode: 'time',
          is24Hour: true,
          timeZoneName: APP_TIME_ZONE,
          onChange: (timeEvent, time) => {
            if (timeEvent.type === 'set' && time) onChange(time);
          },
        });
      },
    });
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Cambiar fecha y hora"
      onPress={openAndroid}
      className="min-h-[48px] flex-row items-center justify-between rounded-2xl border border-cielo-200 bg-white px-4"
    >
      <Text className="text-[17px] text-tinta">{formatWhen(value)}</Text>
      <Text className="text-[15px] font-medium text-cielo-700">Cambiar</Text>
    </Pressable>
  );
}
