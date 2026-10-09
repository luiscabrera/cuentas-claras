import type { SignInValues, SignUpValues } from '@cuentas-claras/core';
import { useMutation } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export function useSignIn() {
  return useMutation({
    mutationFn: async ({ email, password }: SignInValues) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
  });
}

export function useSignUp() {
  return useMutation({
    /** Devuelve true si hay que confirmar el email antes de poder entrar. */
    mutationFn: async ({ email, password }: SignUpValues) => {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      return { needsConfirmation: !data.session };
    },
  });
}

export function useSignOut() {
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
  });
}
