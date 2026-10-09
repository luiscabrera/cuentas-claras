import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { Dachshund } from '@/components/mascots/Mascot';
import { Button } from '@/components/ui/Button';

export default function NotFoundScreen() {
  return (
    <View className="flex-1 items-center justify-center gap-4 bg-cielo-50 px-8">
      <Dachshund dog="trufa" width={200} />
      <Text className="text-center font-display text-[24px] text-tinta">Esta página no existe</Text>
      <Text className="text-center text-[16px] text-tinta-500">
        Trufa la buscó por todos lados y no la encontró.
      </Text>
      <Button label="Ir al inicio" icon="home-outline" onPress={() => router.replace('/')} />
    </View>
  );
}
