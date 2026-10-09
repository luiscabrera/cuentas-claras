import type { CreateHouseholdValues, JoinHouseholdValues } from '@cuentas-claras/core';
import { createHouseholdSchema, joinHouseholdSchema } from '@cuentas-claras/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export type Member = {
  user_id: string;
  display_name: string;
  role: string;
  joined_at: string;
};

export type Household = {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
  /** Ordenados por antigüedad: el primero es quien creó el hogar. */
  members: Member[];
};

export const householdKeys = {
  all: ['households'] as const,
  forUser: (userId: string | undefined) => ['households', userId] as const,
};

export function useHouseholds(userId: string | undefined) {
  return useQuery({
    queryKey: householdKeys.forUser(userId),
    enabled: !!userId,
    queryFn: async (): Promise<Household[]> => {
      const { data, error } = await supabase
        .from('households')
        .select(
          'id, name, invite_code, created_at, household_members(user_id, display_name, role, joined_at)',
        )
        .order('created_at');
      if (error) throw error;
      return data.map(({ household_members, ...household }) => ({
        ...household,
        members: [...household_members].sort((a, b) => a.joined_at.localeCompare(b.joined_at)),
      }));
    },
  });
}

/** Crea un hogar (con las categorías iniciales) y devuelve su id. */
export function useCreateHousehold() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: CreateHouseholdValues) => {
      const { householdName, displayName } = createHouseholdSchema.parse(values);
      const { data, error } = await supabase.rpc('create_household', {
        p_name: householdName,
        p_display_name: displayName,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: householdKeys.all }),
  });
}

/** Se suma al hogar del código y devuelve su id. */
export function useJoinHousehold() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: JoinHouseholdValues) => {
      const { inviteCode, displayName } = joinHouseholdSchema.parse(values);
      const { data, error } = await supabase.rpc('join_household', {
        p_invite_code: inviteCode,
        p_display_name: displayName,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: householdKeys.all }),
  });
}
