import { describe, expect, it } from 'vitest';

import {
  addMonths,
  currentYearMonth,
  dayKey,
  formatDateTime,
  formatDayHeading,
  formatMonth,
  formatTime,
  formatWhen,
  fromDateTimeLocalValue,
  monthRange,
  toDateTimeLocalValue,
  zonedParts,
  zonedTimeToDate,
} from './dates';

// Argentina está en UTC-3 todo el año.
const iso = (s: string) => new Date(s);

describe('zonedParts', () => {
  it('convierte un instante UTC a la hora de Buenos Aires', () => {
    expect(zonedParts(iso('2026-10-09T02:30:15Z'))).toEqual({
      year: 2026,
      month: 10,
      day: 8,
      hour: 23,
      minute: 30,
      second: 15,
    });
  });

  it('maneja la medianoche', () => {
    expect(zonedParts(iso('2026-10-09T03:00:00Z')).hour).toBe(0);
  });
});

describe('zonedTimeToDate', () => {
  it('interpreta la fecha como hora argentina', () => {
    expect(zonedTimeToDate({ year: 2026, month: 10, day: 1 }).toISOString()).toBe(
      '2026-10-01T03:00:00.000Z',
    );
    expect(
      zonedTimeToDate({ year: 2026, month: 10, day: 8, hour: 18, minute: 42 }).toISOString(),
    ).toBe('2026-10-08T21:42:00.000Z');
  });
});

describe('meses', () => {
  it('sabe en qué mes estamos en Argentina aunque en UTC ya sea otro', () => {
    expect(currentYearMonth(iso('2026-11-01T01:00:00Z'))).toEqual({ year: 2026, month: 10 });
  });

  it('suma y resta meses cruzando el año', () => {
    expect(addMonths({ year: 2026, month: 12 }, 1)).toEqual({ year: 2027, month: 1 });
    expect(addMonths({ year: 2026, month: 1 }, -1)).toEqual({ year: 2025, month: 12 });
    expect(addMonths({ year: 2026, month: 5 }, -17)).toEqual({ year: 2024, month: 12 });
  });

  it('calcula el rango del mes en hora argentina', () => {
    const { start, end } = monthRange({ year: 2026, month: 12 });
    expect(start.toISOString()).toBe('2026-12-01T03:00:00.000Z');
    expect(end.toISOString()).toBe('2027-01-01T03:00:00.000Z');
  });

  it('formatea el nombre del mes', () => {
    expect(formatMonth({ year: 2026, month: 10 })).toBe('Octubre 2026');
  });
});

describe('formato de fechas y horas', () => {
  const gasto = iso('2026-10-08T21:42:00Z'); // jueves 8/10 18:42 en Buenos Aires

  it('formatea hora y fecha', () => {
    expect(formatTime(gasto)).toBe('18:42');
    expect(formatDateTime(gasto)).toBe('08/10 18:42');
    expect(dayKey(gasto)).toBe('2026-10-08');
  });

  it('dice Hoy, Ayer o el día de la semana', () => {
    expect(formatDayHeading(gasto, iso('2026-10-09T02:00:00Z'))).toBe('Hoy');
    expect(formatDayHeading(gasto, iso('2026-10-09T12:00:00Z'))).toBe('Ayer');
    expect(formatDayHeading(gasto, iso('2026-10-12T12:00:00Z'))).toBe('Jueves 8');
  });

  it('dice cuándo fue un gasto', () => {
    expect(formatWhen(gasto, iso('2026-10-08T23:00:00Z'))).toBe('Hoy 18:42');
    expect(formatWhen(gasto, iso('2026-10-09T15:00:00Z'))).toBe('Ayer 18:42');
    expect(formatWhen(gasto, iso('2026-10-20T15:00:00Z'))).toBe('08/10 18:42');
  });

  it('va y vuelve del formato de <input type="datetime-local">', () => {
    expect(toDateTimeLocalValue(gasto)).toBe('2026-10-08T18:42');
    expect(fromDateTimeLocalValue('2026-10-08T18:42')?.toISOString()).toBe(
      '2026-10-08T21:42:00.000Z',
    );
    expect(fromDateTimeLocalValue('cualquier cosa')).toBeNull();
  });
});
