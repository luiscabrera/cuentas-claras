/**
 * Fechas en el huso horario de la app. En la base todo se guarda como instante (UTC);
 * para mostrar, agrupar por día o calcular el mes se usa la hora de Buenos Aires.
 */
export const APP_TIME_ZONE = 'America/Argentina/Buenos_Aires';

const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
] as const;

const WEEKDAYS = [
  'domingo',
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
] as const;

/** Un mes calendario. `month` va de 1 a 12. */
export type YearMonth = { year: number; month: number };

export type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

const partsFormatters = new Map<string, Intl.DateTimeFormat>();

function getPartsFormatter(timeZone: string): Intl.DateTimeFormat {
  let formatter = partsFormatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hourCycle: 'h23',
    });
    partsFormatters.set(timeZone, formatter);
  }
  return formatter;
}

/** Año, mes, día, hora, minuto y segundo "de reloj" de un instante en un huso horario. */
export function zonedParts(date: Date, timeZone: string = APP_TIME_ZONE): ZonedParts {
  const values: Record<string, number> = {};
  for (const part of getPartsFormatter(timeZone).formatToParts(date)) {
    if (part.type !== 'literal') values[part.type] = Number(part.value);
  }
  return {
    year: values.year ?? 0,
    month: values.month ?? 0,
    day: values.day ?? 0,
    // Algunos motores devuelven "24" para la medianoche.
    hour: (values.hour ?? 0) % 24,
    minute: values.minute ?? 0,
    second: values.second ?? 0,
  };
}

function offsetMs(date: Date, timeZone: string): number {
  const p = zonedParts(date, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** El instante que corresponde a una fecha y hora "de reloj" en el huso de la app. */
export function zonedTimeToDate(
  {
    year,
    month,
    day,
    hour = 0,
    minute = 0,
  }: Pick<ZonedParts, 'year' | 'month' | 'day'> & Partial<Pick<ZonedParts, 'hour' | 'minute'>>,
  timeZone: string = APP_TIME_ZONE,
): Date {
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  const first = offsetMs(new Date(guess), timeZone);
  const second = offsetMs(new Date(guess - first), timeZone);
  return new Date(guess - second);
}

export function currentYearMonth(now: Date = new Date()): YearMonth {
  const { year, month } = zonedParts(now);
  return { year, month };
}

export function addMonths({ year, month }: YearMonth, delta: number): YearMonth {
  const index = year * 12 + (month - 1) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

export function isSameYearMonth(a: YearMonth, b: YearMonth): boolean {
  return a.year === b.year && a.month === b.month;
}

/** Desde el primer instante del mes (incluido) hasta el primero del mes siguiente (excluido). */
export function monthRange(ym: YearMonth): { start: Date; end: Date } {
  const next = addMonths(ym, 1);
  return {
    start: zonedTimeToDate({ year: ym.year, month: ym.month, day: 1 }),
    end: zonedTimeToDate({ year: next.year, month: next.month, day: 1 }),
  };
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
const pad = (n: number) => String(n).padStart(2, '0');

/** "Octubre 2026" */
export function formatMonth({ year, month }: YearMonth): string {
  return `${capitalize(MONTHS[month - 1] ?? '')} ${year}`;
}

/** "octubre", para usar dentro de una frase. */
export function monthName({ month }: YearMonth): string {
  return MONTHS[month - 1] ?? '';
}

/** Clave del día en la hora de la app ("2026-10-08"), para agrupar. */
export function dayKey(date: Date): string {
  const p = zonedParts(date);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** "18:42" */
export function formatTime(date: Date): string {
  const p = zonedParts(date);
  return `${pad(p.hour)}:${pad(p.minute)}`;
}

/** "08/10 18:42" */
export function formatDateTime(date: Date): string {
  const p = zonedParts(date);
  return `${pad(p.day)}/${pad(p.month)} ${pad(p.hour)}:${pad(p.minute)}`;
}

function weekday(p: Pick<ZonedParts, 'year' | 'month' | 'day'>): string {
  return WEEKDAYS[new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay()] ?? '';
}

/** "Hoy", "Ayer" o "Jueves 8". */
export function formatDayHeading(date: Date, now: Date = new Date()): string {
  const key = dayKey(date);
  if (key === dayKey(now)) return 'Hoy';
  if (key === dayKey(new Date(now.getTime() - 24 * 60 * 60 * 1000))) return 'Ayer';
  const p = zonedParts(date);
  return `${capitalize(weekday(p))} ${p.day}`;
}

/** "Hoy 18:42", "Ayer 09:10" o "08/10 18:42": para mostrar cuándo fue un gasto. */
export function formatWhen(date: Date, now: Date = new Date()): string {
  const heading = formatDayHeading(date, now);
  if (heading === 'Hoy' || heading === 'Ayer') return `${heading} ${formatTime(date)}`;
  return formatDateTime(date);
}

/** Valor para un `<input type="datetime-local">` en la hora de la app: "2026-10-08T18:42". */
export function toDateTimeLocalValue(date: Date): string {
  const p = zonedParts(date);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

/** Lee el valor de un `<input type="datetime-local">` como hora de la app. */
export function fromDateTimeLocalValue(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match.map(Number);
  return zonedTimeToDate({
    year: year ?? 0,
    month: month ?? 0,
    day: day ?? 0,
    hour: hour ?? 0,
    minute: minute ?? 0,
  });
}
