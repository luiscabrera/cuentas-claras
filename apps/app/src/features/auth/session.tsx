import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { queryClient } from '@/lib/query-client';
import { supabase } from '@/lib/supabase';

type SessionState = { session: Session | null; isLoading: boolean };

const SessionContext = createContext<SessionState>({ session: null, isLoading: true });

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({ session: null, isLoading: true });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setState({ session: data.session, isLoading: false });
    });

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      // Al cerrar sesión se borra todo lo cacheado: nada de un usuario queda para el siguiente.
      if (event === 'SIGNED_OUT') queryClient.clear();
      setState({ session, isLoading: false });
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return <SessionContext.Provider value={state}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}

/** El id del usuario logueado. Solo usar en pantallas que requieren sesión. */
export function useUserId(): string {
  const { session } = useSession();
  if (!session) throw new Error('useUserId se usó sin sesión');
  return session.user.id;
}
