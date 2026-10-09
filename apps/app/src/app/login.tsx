import { signInSchema, signUpSchema, type SignInValues } from '@cuentas-claras/core';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Text, TextInput, View } from 'react-native';

import { LogoMark } from '@/components/mascots/Mascot';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Segmented } from '@/components/ui/Segmented';
import { TextField } from '@/components/ui/TextField';
import { useSignIn, useSignUp } from '@/features/auth/api';
import { errorMessage } from '@/lib/errors';

type Mode = 'ingresar' | 'registrarme';

export default function LoginScreen() {
  const [mode, setMode] = useState<Mode>('ingresar');
  const [notice, setNotice] = useState<string | null>(null);
  const signIn = useSignIn();
  const signUp = useSignUp();
  const passwordRef = useRef<TextInput>(null);

  // El resolver lee el modo actual: registrarse pide una contraseña más larga.
  const modeRef = useRef(mode);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);
  const form = useForm<SignInValues>({
    resolver: (values, context, options) =>
      zodResolver(modeRef.current === 'ingresar' ? signInSchema : signUpSchema)(
        values,
        context,
        options,
      ),
    defaultValues: { email: '', password: '' },
  });

  const mutation = mode === 'ingresar' ? signIn : signUp;
  const submit = form.handleSubmit(async (values) => {
    setNotice(null);
    if (mode === 'ingresar') {
      await signIn.mutateAsync(values).catch(() => {});
    } else {
      const result = await signUp.mutateAsync(values).catch(() => null);
      if (result?.needsConfirmation) {
        setNotice('Te mandamos un email para confirmar la cuenta. Abrilo y después ingresá.');
      }
    }
  });

  const changeMode = (next: Mode) => {
    setMode(next);
    setNotice(null);
    signIn.reset();
    signUp.reset();
    form.clearErrors();
  };

  return (
    <Screen>
      <View className="items-center pb-8 pt-10">
        <LogoMark width={176} />
        <Text className="mt-5 font-display text-[34px] text-tinta">Cuentas Claras</Text>
        <Text className="mt-1 text-center text-[16px] text-tinta-500">
          Las cuentas claras conservan la amistad.
        </Text>
      </View>

      <View className="gap-5">
        <Segmented
          accessibilityLabel="Ingresar o crear una cuenta"
          value={mode}
          onChange={changeMode}
          options={[
            { value: 'ingresar', label: 'Ingresar' },
            { value: 'registrarme', label: 'Crear cuenta' },
          ]}
        />

        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <TextField
              testID="login-email"
              label="Email"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              inputMode="email"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
          )}
        />

        <Controller
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <TextField
              ref={passwordRef}
              testID="login-password"
              label="Contraseña"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              hint={mode === 'registrarme' ? 'Al menos 6 caracteres.' : undefined}
              secureTextEntry
              autoComplete={mode === 'ingresar' ? 'current-password' : 'new-password'}
              returnKeyType="go"
              onSubmitEditing={submit}
            />
          )}
        />

        {mutation.error ? (
          <Text className="text-[15px] text-error" accessibilityRole="alert">
            {errorMessage(mutation.error)}
          </Text>
        ) : null}
        {notice ? (
          <Text className="text-[15px] text-cielo-700" accessibilityRole="alert">
            {notice}
          </Text>
        ) : null}

        <Button
          testID="login-submit"
          size="lg"
          label={mode === 'ingresar' ? 'Ingresar' : 'Crear cuenta'}
          loading={mutation.isPending}
          onPress={submit}
        />
      </View>
    </Screen>
  );
}
