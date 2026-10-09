import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

export type SegmentedOption<T extends string> = { value: T; label: string; icon?: ReactNode };

/** Selector de opciones excluyentes (pestañas de login, quién pagó, etc.). */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
}) {
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      className="flex-row gap-1 rounded-full bg-cielo-100 p-1"
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            accessibilityLabel={option.label}
            onPress={() => onChange(option.value)}
            className={`min-h-[44px] flex-1 flex-row items-center justify-center gap-2 rounded-full px-3 ${
              selected ? 'bg-white shadow-sm' : ''
            }`}
          >
            {option.icon}
            <Text
              numberOfLines={1}
              className={`text-[15px] ${selected ? 'font-semibold text-tinta' : 'text-tinta-500'}`}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
