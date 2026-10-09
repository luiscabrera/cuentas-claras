import '@/global.css';

import { useFonts } from 'expo-font';
import { Fredoka_500Medium } from '@expo-google-fonts/fredoka/500Medium';
import { Fredoka_600SemiBold } from '@expo-google-fonts/fredoka/600SemiBold';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LogoMark } from '@/components/mascots/Mascot';
import { ToastProvider } from '@/components/ui/Toast';
import { SessionProvider, useSession } from '@/features/auth/session';
import { useHouseholds } from '@/features/households/api';
import {
  ActiveHouseholdProvider,
  useActiveHouseholdState,
} from '@/features/households/active-household';
import { queryClient } from '@/lib/query-client';
import { isSupabaseConfigured } from '@/lib/supabase';
import palette from '@/theme/palette';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Fredoka_500Medium, Fredoka_600SemiBold });

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <ToastProvider>
            <StatusBar style="dark" />
            {isSupabaseConfigured ? <Gate fontsLoaded={fontsLoaded} /> : <MissingConfig />}
          </ToastProvider>
        </SessionProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

/** Espera la sesión y los hogares antes de decidir qué pantallas se pueden ver. */
function Gate({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { session, isLoading } = useSession();
  const households = useHouseholds(session?.user.id);
  const loadingHouseholds = !!session && households.isPending;

  if (!fontsLoaded || isLoading || loadingHouseholds) return <Loading />;

  return (
    <ActiveHouseholdProvider households={households.data ?? []}>
      <Navigator signedIn={!!session} />
    </ActiveHouseholdProvider>
  );
}

function Navigator({ signedIn }: { signedIn: boolean }) {
  const { household, isReady } = useActiveHouseholdState();

  useEffect(() => {
    if (isReady) void SplashScreen.hideAsync();
  }, [isReady]);

  if (!isReady) return <Loading />;

  const hasHousehold = !!household;
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: palette.cielo[50] },
      }}
    >
      <Stack.Protected guard={signedIn && hasHousehold}>
        <Stack.Screen name="index" />
        <Stack.Screen name="gasto/nuevo" options={{ presentation: 'modal' }} />
        <Stack.Screen name="gasto/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="ajustes" />
        <Stack.Screen name="hogares/nuevo" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && !hasHousehold}>
        <Stack.Screen name="bienvenida" />
      </Stack.Protected>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="login" />
      </Stack.Protected>
    </Stack>
  );
}

function Loading() {
  return (
    <View className="flex-1 items-center justify-center bg-cielo-50" accessibilityLabel="Cargando">
      <LogoMark width={120} />
    </View>
  );
}

function MissingConfig() {
  return (
    <View className="flex-1 items-center justify-center gap-3 bg-cielo-50 px-8">
      <LogoMark width={140} />
      <Text className="text-center font-display text-[22px] text-tinta">
        Falta conectar Supabase
      </Text>
      <Text className="text-center text-[16px] leading-6 text-tinta-700">
        Copiá apps/app/.env.example como apps/app/.env, completá la URL y la clave de Supabase y
        volvé a levantar la app.
      </Text>
    </View>
  );
}
