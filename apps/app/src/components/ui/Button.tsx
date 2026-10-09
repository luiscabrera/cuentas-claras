import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import palette from '@/theme/palette';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const CONTAINER: Record<Variant, string> = {
  primary: 'bg-fuego-600 active:bg-fuego-700',
  secondary: 'border border-cielo-200 bg-white active:bg-cielo-100',
  ghost: 'active:bg-cielo-100',
  danger: 'active:bg-fuego-50',
};
const LABEL: Record<Variant, string> = {
  primary: 'text-white',
  secondary: 'text-tinta',
  ghost: 'text-cielo-700',
  danger: 'text-error',
};
const ICON: Record<Variant, string> = {
  primary: '#FFFFFF',
  secondary: palette.tinta.DEFAULT,
  ghost: palette.cielo[700],
  danger: palette.error,
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  size = 'md',
  testID,
}: {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  icon?: ComponentProps<typeof Ionicons>['name'];
  loading?: boolean;
  disabled?: boolean;
  size?: 'md' | 'lg';
  testID?: string;
}) {
  const inactive = disabled || loading;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      className={`flex-row items-center justify-center gap-2 rounded-full px-5 ${
        size === 'lg' ? 'min-h-[56px]' : 'min-h-[44px]'
      } ${CONTAINER[variant]} ${inactive ? 'opacity-60' : ''}`}
    >
      {loading ? (
        <ActivityIndicator color={ICON[variant]} />
      ) : (
        <View className="flex-row items-center gap-2">
          {icon ? (
            <Ionicons name={icon} size={size === 'lg' ? 22 : 18} color={ICON[variant]} />
          ) : null}
          <Text
            className={`font-semibold ${size === 'lg' ? 'text-[17px]' : 'text-[15px]'} ${LABEL[variant]}`}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export function IconButton({
  icon,
  label,
  onPress,
  testID,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={8}
      className="h-11 w-11 items-center justify-center rounded-full active:bg-cielo-100"
    >
      <Ionicons name={icon} size={24} color={palette.tinta.DEFAULT} />
    </Pressable>
  );
}
