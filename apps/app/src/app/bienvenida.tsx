import { Text, View } from 'react-native';

import { DogFace } from '@/components/mascots/Mascot';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { useSignOut } from '@/features/auth/api';
import { useSession } from '@/features/auth/session';
import { HouseholdSetup } from '@/features/households/components/HouseholdSetup';

/** Primera vez: crear el hogar o sumarse al de la pareja. */
export default function WelcomeScreen() {
  const { session } = useSession();
  const signOut = useSignOut();

  return (
    <Screen
      footer={
        <Button
          variant="ghost"
          label="Cerrar sesión"
          loading={signOut.isPending}
          onPress={() => signOut.mutate()}
        />
      }
    >
      <View className="items-center pb-6 pt-10">
        <View className="flex-row gap-3">
          <DogFace dog="pomelo" size={72} />
          <DogFace dog="trufa" size={72} />
        </View>
        <Text className="mt-4 font-display text-[28px] text-tinta">¡Hola!</Text>
        <Text className="mt-1 text-center text-[16px] leading-6 text-tinta-500">
          Armá tu hogar para empezar a cargar gastos, o sumate al de tu pareja con su código.
        </Text>
      </View>
      <HouseholdSetup key={session?.user.id} />
    </Screen>
  );
}
