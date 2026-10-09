import { forwardRef } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';

import palette from '@/theme/palette';

type Props = TextInputProps & { label?: string; error?: string; hint?: string };

export const TextField = forwardRef<TextInput, Props>(function TextField(
  { label, error, hint, className, ...props },
  ref,
) {
  return (
    <View className="gap-1.5">
      {label ? <Text className="text-[15px] font-medium text-tinta-700">{label}</Text> : null}
      <TextInput
        ref={ref}
        placeholderTextColor={palette.tinta[400]}
        accessibilityLabel={props.accessibilityLabel ?? label}
        className={`min-h-[48px] rounded-2xl border bg-white px-4 text-[17px] text-tinta ${
          error ? 'border-error' : 'border-cielo-200 focus:border-cielo-500'
        } ${className ?? ''}`}
        {...props}
      />
      {error ? (
        <Text className="text-[14px] text-error" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text className="text-[14px] text-tinta-500">{hint}</Text>
      ) : null}
    </View>
  );
});
