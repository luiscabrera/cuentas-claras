/** Moneda por defecto de los gastos. */
export const DEFAULT_CURRENCY = 'ARS';

/** Tope de cordura para un gasto: $ 1.000 millones. */
export const MAX_AMOUNT_CENTS = 100_000_000_000;

const LOCALE = 'es-AR';

/** "12.500" o "1.250.000": grupos de a tres dígitos separados por punto. */
function hasValidThousands(value: string): boolean {
  if (!value.includes('.')) return /^\d*$/.test(value);
  return /^\d{1,3}(\.\d{3})+$/.test(value);
}

/**
 * Convierte lo que escribe la persona a centavos enteros, sin pasar por floats.
 *
 * Acepta el formato argentino ("12.500,50"), sin separadores de miles ("12500,5")
 * y punto decimal ("12500.50"). Un único punto seguido de exactamente tres dígitos
 * se toma como separador de miles ("12.500" son doce mil quinientos).
 * Devuelve `null` si no es un monto válido.
 */
export function parseAmount(input: string): number | null {
  const cleaned = input.replace(/[\s $]/g, '');
  if (!cleaned || !/^[\d.,]+$/.test(cleaned)) return null;

  let integerPart: string;
  let fractionPart = '';
  const lastComma = cleaned.lastIndexOf(',');

  if (lastComma !== -1) {
    // Con coma: la coma es el decimal y los puntos separan miles.
    integerPart = cleaned.slice(0, lastComma);
    fractionPart = cleaned.slice(lastComma + 1);
    if (integerPart.includes(',') || fractionPart.includes('.')) return null;
    if (!hasValidThousands(integerPart)) return null;
    integerPart = integerPart.replaceAll('.', '');
  } else {
    const dots = cleaned.split('.').length - 1;
    const lastDot = cleaned.lastIndexOf('.');
    if (dots === 1 && cleaned.length - lastDot - 1 !== 3) {
      // "12500.5": punto decimal.
      integerPart = cleaned.slice(0, lastDot);
      fractionPart = cleaned.slice(lastDot + 1);
    } else {
      if (!hasValidThousands(cleaned)) return null;
      integerPart = cleaned.replaceAll('.', '');
    }
  }

  if (fractionPart.length > 2) return null;
  if (integerPart === '' && fractionPart === '') return null;

  const cents = Number(integerPart || '0') * 100 + Number(fractionPart.padEnd(2, '0'));
  return Number.isSafeInteger(cents) ? cents : null;
}

const formatters = new Map<string, Intl.NumberFormat>();

function getFormatter(key: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(LOCALE, options);
    formatters.set(key, formatter);
  }
  return formatter;
}

/**
 * Muestra un monto en formato argentino: `$ 12.500,50`.
 * Los centavos se muestran solo si hay centavos (`$ 12.500`), salvo que se pida lo contrario.
 * Ojo: Intl separa el signo del número con un espacio no separable (U+00A0).
 */
export function formatMoney(
  cents: number,
  currency: string = DEFAULT_CURRENCY,
  { alwaysShowCents = false }: { alwaysShowCents?: boolean } = {},
): string {
  const digits = alwaysShowCents || cents % 100 !== 0 ? 2 : 0;
  return getFormatter(`money:${currency}:${digits}`, {
    style: 'currency',
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(cents / 100);
}

/** El monto como para precargar un input: `12.500,50` o `12.500` (sin signo de moneda). */
export function formatAmountInput(cents: number): string {
  const digits = cents % 100 !== 0 ? 2 : 0;
  return getFormatter(`input:${digits}`, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(cents / 100);
}
