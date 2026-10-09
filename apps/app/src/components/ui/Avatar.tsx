import { Text, View } from 'react-native';

import { DogFace } from '@/components/mascots/Mascot';
import type { DogName } from '@/components/mascots/shapes';

/** Pomelo o Trufa según el orden en el hogar; si no hay perro, la inicial. */
export function Avatar({
  dog,
  name,
  size = 36,
}: {
  dog: DogName | null;
  name: string;
  size?: number;
}) {
  if (dog) return <DogFace dog={dog} size={size} />;
  return (
    <View
      className="items-center justify-center rounded-full bg-cielo-200"
      style={{ width: size, height: size }}
      accessibilityLabel={name}
    >
      <Text className="font-display text-tinta-700" style={{ fontSize: size * 0.45 }}>
        {name.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}
