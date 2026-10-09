import { isAuthApiError } from '@supabase/supabase-js';

const AUTH_MESSAGES: Record<string, string> = {
  invalid_credentials: 'El email o la contraseña no son correctos.',
  user_already_exists: 'Ya hay una cuenta con ese email. Ingresá con tu contraseña.',
  email_exists: 'Ya hay una cuenta con ese email. Ingresá con tu contraseña.',
  weak_password: 'Esa contraseña es muy fácil de adivinar. Probá con otra.',
  signup_disabled: 'Los registros están cerrados. Pedile acceso a quien administra la app.',
  email_not_confirmed: 'Confirmá tu email con el link que te mandamos y volvé a ingresar.',
  email_address_invalid: 'Ese email no es válido.',
  email_address_not_authorized: 'Ese email no puede recibir correos de esta app todavía.',
  over_request_rate_limit: 'Demasiados intentos seguidos. Esperá un minuto y probá de nuevo.',
  over_email_send_rate_limit: 'Demasiados intentos seguidos. Esperá un minuto y probá de nuevo.',
  session_expired: 'Tu sesión venció. Ingresá de nuevo.',
  session_not_found: 'Tu sesión venció. Ingresá de nuevo.',
  refresh_token_not_found: 'Tu sesión venció. Ingresá de nuevo.',
};

const DB_MESSAGES: Record<string, string> = {
  '42501': 'No tenés permiso para hacer eso.',
  '23505': 'Eso ya existe.',
  '23503': 'Algo de lo que elegiste ya no existe. Recargá la pantalla.',
  '28000': 'Tu sesión venció. Ingresá de nuevo.',
  PGRST116: 'No encontramos lo que buscabas.',
};

/** Un mensaje claro en castellano para cualquier error de Supabase o de la red. */
export function errorMessage(error: unknown): string {
  if (isAuthApiError(error) && error.code && AUTH_MESSAGES[error.code]) {
    return AUTH_MESSAGES[error.code]!;
  }
  if (error && typeof error === 'object') {
    const { code, message } = error as { code?: string; message?: string };
    // Los RPC (create_household, join_household) ya devuelven mensajes en castellano.
    if (code === 'P0002' && message) return message.endsWith('.') ? message : `${message}.`;
    if (code && DB_MESSAGES[code]) return DB_MESSAGES[code]!;
    if (message && /fetch|network|failed to fetch/i.test(message)) {
      return 'No hay conexión con el servidor. Revisá tu internet y probá de nuevo.';
    }
  }
  return 'Algo salió mal. Probá de nuevo.';
}
