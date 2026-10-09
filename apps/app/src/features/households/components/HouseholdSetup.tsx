import {
  createHouseholdSchema,
  joinHouseholdSchema,
  type CreateHouseholdValues,
  type JoinHouseholdValues,
} from '@cuentas-claras/core';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Segmented } from '@/components/ui/Segmented';
import { TextField } from '@/components/ui/TextField';
import { useToast } from '@/components/ui/Toast';
import { errorMessage } from '@/lib/errors';

import { useActiveHouseholdState } from '../active-household';
import { useCreateHousehold, useJoinHousehold } from '../api';

type Mode = 'crear' | 'unirme';

/** Crear un hogar o sumarse a uno con el código de invitación. */
export function HouseholdSetup({
  defaultDisplayName = '',
  onDone,
}: {
  defaultDisplayName?: string;
  onDone?: () => void;
}) {
  const [mode, setMode] = useState<Mode>('crear');
  const { setActive } = useActiveHouseholdState();
  const toast = useToast();
  const create = useCreateHousehold();
  const join = useJoinHousehold();

  const createForm = useForm<CreateHouseholdValues>({
    resolver: zodResolver(createHouseholdSchema),
    defaultValues: { displayName: defaultDisplayName, householdName: 'Casa' },
  });
  const joinForm = useForm<JoinHouseholdValues>({
    resolver: zodResolver(joinHouseholdSchema),
    defaultValues: { displayName: defaultDisplayName, inviteCode: '' },
  });

  const submitCreate = createForm.handleSubmit(async (values) => {
    const id = await create.mutateAsync(values).catch(() => null);
    if (!id) return;
    setActive(id);
    toast.show('¡Hogar creado!');
    onDone?.();
  });

  const submitJoin = joinForm.handleSubmit(async (values) => {
    const id = await join.mutateAsync(values).catch(() => null);
    if (!id) return;
    setActive(id);
    toast.show('¡Listo, ya estás en el hogar!');
    onDone?.();
  });

  const mutation = mode === 'crear' ? create : join;

  return (
    <View className="gap-5">
      <Segmented
        accessibilityLabel="Crear un hogar o unirme a uno"
        value={mode}
        onChange={(next) => {
          // El nombre se escribe una sola vez aunque se cambie de opción.
          if (next === 'unirme')
            joinForm.setValue('displayName', createForm.getValues('displayName'));
          else createForm.setValue('displayName', joinForm.getValues('displayName'));
          setMode(next);
          create.reset();
          join.reset();
        }}
        options={[
          { value: 'crear', label: 'Crear un hogar' },
          { value: 'unirme', label: 'Tengo un código' },
        ]}
      />

      {mode === 'crear' ? (
        <>
          <Controller
            control={createForm.control}
            name="displayName"
            render={({ field, fieldState }) => (
              <TextField
                testID="setup-display-name"
                label="¿Cómo te llamamos?"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
                autoComplete="given-name"
                placeholder="Tu nombre"
              />
            )}
          />
          <Controller
            control={createForm.control}
            name="householdName"
            render={({ field, fieldState }) => (
              <TextField
                testID="setup-household-name"
                label="Nombre del hogar"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
                hint="Después vas a poder invitar a tu pareja con un código."
              />
            )}
          />
        </>
      ) : (
        <>
          <Controller
            control={joinForm.control}
            name="displayName"
            render={({ field, fieldState }) => (
              <TextField
                testID="setup-display-name"
                label="¿Cómo te llamamos?"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
                autoComplete="given-name"
                placeholder="Tu nombre"
              />
            )}
          />
          <Controller
            control={joinForm.control}
            name="inviteCode"
            render={({ field, fieldState }) => (
              <TextField
                testID="setup-invite-code"
                label="Código de invitación"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
                autoCapitalize="characters"
                autoCorrect={false}
                placeholder="Por ejemplo, CA5A000001"
                hint="Lo encuentra en Ajustes quien ya está en el hogar."
              />
            )}
          />
        </>
      )}

      {mutation.error ? (
        <Text className="text-[15px] text-error" accessibilityRole="alert">
          {errorMessage(mutation.error)}
        </Text>
      ) : null}

      <Button
        testID="setup-submit"
        size="lg"
        label={mode === 'crear' ? 'Crear hogar' : 'Unirme al hogar'}
        loading={mutation.isPending}
        onPress={mode === 'crear' ? submitCreate : submitJoin}
      />
    </View>
  );
}
