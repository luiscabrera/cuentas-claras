import { fromDateTimeLocalValue, toDateTimeLocalValue } from '@cuentas-claras/core';

import palette from '@/theme/palette';

import type { DateTimeFieldProps } from './DateTimeField.types';

/** En la web, el selector de fecha y hora del navegador (en el celu abre la ruedita nativa). */
export function DateTimeField({ value, onChange }: DateTimeFieldProps) {
  return (
    <input
      type="datetime-local"
      aria-label="Fecha y hora del gasto"
      data-testid="expense-datetime"
      value={toDateTimeLocalValue(value)}
      onChange={(event) => {
        const date = fromDateTimeLocalValue(event.target.value);
        if (date) onChange(date);
      }}
      style={{
        minHeight: 48,
        borderRadius: 16,
        border: `1px solid ${palette.cielo[200]}`,
        backgroundColor: '#FFFFFF',
        padding: '0 16px',
        fontSize: 17,
        color: palette.tinta.DEFAULT,
        fontFamily: 'inherit',
        width: '100%',
        boxSizing: 'border-box',
      }}
    />
  );
}
