import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { IconButton } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { HouseholdSetup } from '@/features/households/components/HouseholdSetup';
import { useUserId } from '@/features/auth/session';
import { useActiveHouseholdState } from '@/features/households/active-household';

/** Crear otro hogar o sumarse a otro (desde Ajustes). */
export default function NewHouseholdScreen() {
  const userId = useUserId();
  const { household } = useActiveHouseholdState();
  const myName = household?.members.find((m) => m.user_id === userId)?.display_name ?? '';

  return (
    <Screen
      header={
        <View className="flex-row items-center gap-1 px-2 pt-2">
          <IconButton icon="chevron-back" label="Volver" onPress={() => router.back()} />
          <Text className="font-display text-[22px] text-tinta">Otro hogar</Text>
        </View>
      }
    >
      <Text className="pb-5 pt-2 text-[16px] leading-6 text-tinta-500">
        Podés tener más de un hogar (por ejemplo, la casa y unas vacaciones compartidas) y pasar de
        uno a otro desde Ajustes.
      </Text>
      <HouseholdSetup defaultDisplayName={myName} onDone={() => router.replace('/')} />
    </Screen>
  );
}
