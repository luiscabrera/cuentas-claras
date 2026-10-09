import { z } from 'zod';

import { MAX_AMOUNT_CENTS, parseAmount } from './money';

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: 'Ingresá un email válido' }));

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Ingresá tu contraseña'),
});
export type SignInValues = z.infer<typeof signInSchema>;

export const signUpSchema = z.object({
  email: emailSchema,
  // Supabase pide 6 caracteres como mínimo.
  password: z.string().min(6, 'Usá al menos 6 caracteres'),
});
export type SignUpValues = z.infer<typeof signUpSchema>;

export const displayNameSchema = z
  .string()
  .trim()
  .min(1, 'Contanos cómo te llamás')
  .max(40, 'Usá 40 caracteres como máximo');

export const householdNameSchema = z
  .string()
  .trim()
  .min(1, 'Ponele un nombre')
  .max(60, 'Usá 60 caracteres como máximo');

/** El código de invitación: 10 caracteres de 0-9 y A-F. Perdona espacios, guiones y la O por 0. */
export const inviteCodeSchema = z
  .string()
  .transform((value) => value.replace(/[\s-]/g, '').toUpperCase().replace(/O/g, '0'))
  .pipe(z.string().regex(/^[0-9A-F]{10}$/, 'El código tiene 10 letras y números'));

export const createHouseholdSchema = z.object({
  displayName: displayNameSchema,
  householdName: householdNameSchema,
});
export type CreateHouseholdValues = z.input<typeof createHouseholdSchema>;

export const joinHouseholdSchema = z.object({
  displayName: displayNameSchema,
  inviteCode: inviteCodeSchema,
});
export type JoinHouseholdValues = z.input<typeof joinHouseholdSchema>;

/** El formulario de gasto: todo como lo escribe la persona; se convierte al guardar. */
export const expenseFormSchema = z.object({
  amount: z
    .string()
    .trim()
    .min(1, 'Ingresá el monto')
    .refine(
      (value) => (parseAmount(value) ?? 0) > 0,
      'Ingresá un monto válido, por ejemplo 12.500,50',
    )
    .refine(
      (value) => (parseAmount(value) ?? 0) <= MAX_AMOUNT_CENTS,
      'Ese monto es demasiado grande',
    ),
  categoryId: z.string().min(1, 'Elegí una categoría'),
  merchantName: z.string().trim().max(60, 'Usá 60 caracteres como máximo'),
  paidBy: z.string().min(1, 'Elegí quién pagó'),
  spentAt: z.date({ error: 'Elegí la fecha' }),
  note: z.string().trim().max(280, 'Usá 280 caracteres como máximo'),
});
export type ExpenseFormValues = z.input<typeof expenseFormSchema>;
