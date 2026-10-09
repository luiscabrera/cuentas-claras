import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { DogName } from '@/components/mascots/shapes';
import { storage } from '@/lib/storage';

import type { Household, Member } from './api';

type ActiveHouseholdState = {
  households: Household[];
  household: Household | null;
  isReady: boolean;
  setActive: (id: string) => void;
};

const ActiveHouseholdContext = createContext<ActiveHouseholdState | null>(null);

export function ActiveHouseholdProvider({
  households,
  children,
}: {
  households: Household[];
  children: ReactNode;
}) {
  const [storedId, setStoredId] = useState<string | null>(null);
  const [isReady, setReady] = useState(false);

  useEffect(() => {
    storage.getActiveHousehold().then((id) => {
      setStoredId(id);
      setReady(true);
    });
  }, []);

  const value = useMemo<ActiveHouseholdState>(
    () => ({
      households,
      household: households.find((h) => h.id === storedId) ?? households[0] ?? null,
      isReady,
      setActive: (id) => {
        setStoredId(id);
        void storage.setActiveHousehold(id);
      },
    }),
    [households, storedId, isReady],
  );

  return (
    <ActiveHouseholdContext.Provider value={value}>{children}</ActiveHouseholdContext.Provider>
  );
}

export function useActiveHouseholdState() {
  const state = useContext(ActiveHouseholdContext);
  if (!state) throw new Error('Falta ActiveHouseholdProvider');
  return state;
}

/** El hogar con el que se está trabajando. Solo en pantallas protegidas (siempre hay uno). */
export function useHousehold(): Household {
  const { household } = useActiveHouseholdState();
  if (!household) throw new Error('No hay hogar activo');
  return household;
}

/** Pomelo para el primer miembro, Trufa para el segundo; el resto, sin perro (por ahora). */
export function dogForMember(household: Household, userId: string): DogName | null {
  const index = household.members.findIndex((m) => m.user_id === userId);
  if (index === 0) return 'pomelo';
  if (index === 1) return 'trufa';
  return null;
}

export function memberName(household: Household, userId: string): string {
  return household.members.find((m: Member) => m.user_id === userId)?.display_name ?? 'Alguien';
}
