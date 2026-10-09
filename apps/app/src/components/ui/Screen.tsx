import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Contenedor de pantalla: fondo celeste, área segura y una columna de 480 px como máximo
 * (en la compu la app se ve como en el celu, centrada).
 */
export function Screen({
  children,
  header,
  footer,
  scroll = true,
  onRefresh,
  refreshing = false,
}: {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  scroll?: boolean;
  /** Tirar para abajo para recargar (en el celu). */
  onRefresh?: () => void;
  refreshing?: boolean;
}) {
  const body = scroll ? (
    <ScrollView
      className="flex-1"
      contentContainerClassName="px-5 pb-8"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> : undefined
      }
    >
      {children}
    </ScrollView>
  ) : (
    <View className="flex-1 px-5">{children}</View>
  );

  return (
    <SafeAreaView className="flex-1 bg-cielo-50" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        className="w-full max-w-[480px] flex-1 self-center"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {header}
        {body}
        {footer ? <View className="px-5 pb-3 pt-2">{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
