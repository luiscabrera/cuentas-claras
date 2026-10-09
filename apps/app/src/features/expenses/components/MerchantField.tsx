import { cleanName, findByName, suggestMerchants } from '@cuentas-claras/core';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Text, View } from 'react-native';

import { TextField } from '@/components/ui/TextField';
import palette from '@/theme/palette';

import type { Merchant } from '../api';

/** Comercio opcional, con los más usados del hogar a un toque. */
export function MerchantField({
  merchants,
  value,
  onChange,
  onPick,
  error,
}: {
  merchants: Merchant[];
  value: string;
  onChange: (value: string) => void;
  onPick: (merchant: Merchant) => void;
  error?: string;
}) {
  const exact = findByName(merchants, value);
  const name = cleanName(value);
  const suggestions = exact ? [] : suggestMerchants(merchants, value);

  return (
    <View className="gap-2">
      <TextField
        testID="expense-merchant"
        accessibilityLabel="Comercio"
        value={value}
        onChangeText={onChange}
        placeholder="Coto, la verdulería, Rappi…"
        error={error}
        autoCorrect={false}
        returnKeyType="done"
      />
      {suggestions.length > 0 || (name && !exact) ? (
        <View className="flex-row flex-wrap gap-2">
          {suggestions.map((merchant) => (
            <Pressable
              key={merchant.id}
              accessibilityRole="button"
              accessibilityLabel={`Elegir ${merchant.name}`}
              onPress={() => onPick(merchant)}
              className="min-h-[40px] justify-center rounded-full bg-cielo-100 px-4 active:bg-cielo-200"
            >
              <Text className="text-[15px] text-tinta-700">{merchant.name}</Text>
            </Pressable>
          ))}
          {name && !exact ? (
            <View className="min-h-[40px] flex-row items-center gap-1 rounded-full border border-dashed border-cielo-400 px-4">
              <Ionicons name="add" size={16} color={palette.cielo[700]} />
              <Text className="text-[15px] text-cielo-700">Se agrega «{name}»</Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
