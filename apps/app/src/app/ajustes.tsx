import Ionicons from '@expo/vector-icons/Ionicons';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Platform, Pressable, Share, Text, View } from 'react-native';

import { Button, IconButton } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Screen } from '@/components/ui/Screen';
import { useToast } from '@/components/ui/Toast';
import { useSignOut } from '@/features/auth/api';
import { useSession } from '@/features/auth/session';
import {
  dogForMember,
  useActiveHouseholdState,
  useHousehold,
} from '@/features/households/active-household';
import palette from '@/theme/palette';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-3">
      <Text className="font-display-medium text-[18px] text-tinta">{title}</Text>
      {children}
    </View>
  );
}

export default function SettingsScreen() {
  const household = useHousehold();
  const { households, setActive } = useActiveHouseholdState();
  const { session } = useSession();
  const signOut = useSignOut();
  const toast = useToast();
  const userId = session?.user.id;

  const invite = `Sumate a «${household.name}» en Cuentas Claras con el código ${household.invite_code}`;

  const copyCode = async () => {
    await Clipboard.setStringAsync(household.invite_code);
    toast.show('Código copiado');
  };

  const shareCode = async () => {
    // En la web, si el navegador no puede compartir, copiamos el mensaje.
    if (Platform.OS === 'web' && !(typeof navigator !== 'undefined' && 'share' in navigator)) {
      await Clipboard.setStringAsync(invite);
      toast.show('Invitación copiada');
      return;
    }
    try {
      await Share.share({ message: invite });
    } catch {
      await Clipboard.setStringAsync(invite);
      toast.show('Invitación copiada');
    }
  };

  return (
    <Screen
      header={
        <View className="flex-row items-center gap-1 px-2 pt-2">
          <IconButton icon="chevron-back" label="Volver" onPress={() => router.back()} />
          <Text className="font-display text-[22px] text-tinta">Ajustes</Text>
        </View>
      }
    >
      <View className="gap-8 pt-3">
        <Section title={household.name}>
          <View className="gap-4 rounded-[28px] border border-cielo-200 bg-white p-5">
            <Text className="text-[15px] leading-6 text-tinta-500">
              Para sumar a alguien al hogar, pasale este código. Lo carga al crear su cuenta, en
              «Tengo un código».
            </Text>
            <Text
              testID="invite-code"
              selectable
              className="text-center font-display text-[32px] tracking-[4px] text-tinta"
            >
              {household.invite_code}
            </Text>
            <View className="flex-row gap-2">
              <View className="flex-1">
                <Button variant="secondary" icon="copy-outline" label="Copiar" onPress={copyCode} />
              </View>
              <View className="flex-1">
                <Button icon="share-outline" label="Compartir" onPress={shareCode} />
              </View>
            </View>
          </View>
        </Section>

        <Section title="Miembros">
          <View className="overflow-hidden rounded-3xl border border-cielo-200 bg-white">
            {household.members.map((member, index) => (
              <View
                key={member.user_id}
                className={`flex-row items-center gap-3 px-4 py-3 ${index > 0 ? 'border-t border-cielo-100' : ''}`}
              >
                <Avatar
                  dog={dogForMember(household, member.user_id)}
                  name={member.display_name}
                  size={40}
                />
                <Text testID="member-name" className="flex-1 text-[16px] text-tinta">
                  {member.display_name}
                  {member.user_id === userId ? ' (vos)' : ''}
                </Text>
                {member.role === 'owner' ? (
                  <Text className="text-[14px] text-tinta-500">creó el hogar</Text>
                ) : null}
              </View>
            ))}
          </View>
        </Section>

        <Section title="Tus hogares">
          {households.length > 1 ? (
            <View
              role="radiogroup"
              className="overflow-hidden rounded-3xl border border-cielo-200 bg-white"
            >
              {households.map((h, index) => {
                const selected = h.id === household.id;
                return (
                  <Pressable
                    key={h.id}
                    role="radio"
                    aria-checked={selected}
                    onPress={() => {
                      setActive(h.id);
                      toast.show(`Ahora estás en «${h.name}»`);
                    }}
                    className={`min-h-[52px] flex-row items-center gap-3 px-4 active:bg-cielo-50 ${
                      index > 0 ? 'border-t border-cielo-100' : ''
                    }`}
                  >
                    <Ionicons
                      name={selected ? 'radio-button-on' : 'radio-button-off'}
                      size={22}
                      color={selected ? palette.fuego[600] : palette.tinta[400]}
                    />
                    <Text className="flex-1 text-[16px] text-tinta">{h.name}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
          <Button
            variant="secondary"
            icon="add"
            label="Crear o sumarme a otro hogar"
            onPress={() => router.push('/hogares/nuevo')}
          />
        </Section>

        <Section title="Tu cuenta">
          <Text className="text-[15px] text-tinta-500">{session?.user.email}</Text>
          <Button
            testID="sign-out"
            variant="secondary"
            icon="log-out-outline"
            label="Cerrar sesión"
            loading={signOut.isPending}
            onPress={() => signOut.mutate()}
          />
        </Section>

        <Text className="pb-4 text-center text-[14px] text-tinta-400">
          Cuentas Claras · con Pomelo y Trufa 🐾
        </Text>
      </View>
    </Screen>
  );
}
