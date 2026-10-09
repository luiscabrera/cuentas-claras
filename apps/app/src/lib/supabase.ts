import type { Database } from '@cuentas-claras/core';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import './polyfills';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY;

/** true si falta configurar Supabase: la app muestra cómo hacerlo en vez de romperse. */
export const isSupabaseConfigured = Boolean(url && key);

export const supabase = createClient<Database>(url || 'http://localhost', key || 'sin-configurar', {
  auth: {
    // En la web supabase-js usa localStorage; en el celu, AsyncStorage.
    ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// En el celu, refrescar la sesión solo mientras la app está en primer plano.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
