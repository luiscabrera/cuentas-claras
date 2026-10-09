# Cuentas Claras

App para que un hogar (hoy, Luis y su pareja) registre los gastos compartidos en segundos y sepa en todo momento quién le debe a quién. Reemplaza el Excel que usábamos. Primero web (instalable en el celu como PWA); después, app nativa Android/iOS desde la misma base de código.

El plan por fases y los prompts de cada etapa están en `docs/ROADMAP.md`.

## Cómo trabajar en este repo
- Respondé siempre en español rioplatense.
- Antes de implementar algo no trivial, proponé un plan corto y esperá el OK.
- Una feature = una rama (`feat/…`, `fix/…`, `chore/…`) = un PR. Nunca commitees directo a `main`.
- Commits chicos en Conventional Commits, con la descripción en español: `feat: alta rápida de gasto`.
- Antes de dar algo por terminado: `pnpm lint && pnpm typecheck && pnpm test` en verde y, si tocaste UI, probala en el navegador.
- Si una decisión de este archivo deja de tener sentido, decímelo en vez de esquivarla.

## Stack
- **Monorepo:** pnpm workspaces + Turborepo.
- **App (web + Android + iOS):** Expo con Expo Router y TypeScript estricto, en `apps/app`. Web en modo SPA (`web.output: "single"`).
- **Estilos:** Tailwind con NativeWind (seguí la guía de Tailwind de Expo).
- **Datos del servidor:** supabase-js + TanStack Query.
- **Formularios:** React Hook Form + Zod (los esquemas viven en `packages/core`).
- **Backend:** Supabase: Postgres, Auth y Row Level Security (Realtime en la Fase 2).
- **Lógica de dominio:** `packages/core`, TypeScript puro con Vitest.
- **Deploy web:** Vercel (preview por PR, producción desde `main`).
- **Móvil (Fase 3):** EAS Build y EAS Update.

## Estructura
```
apps/app/                  Expo: web + Android + iOS
  src/app/                 rutas de Expo Router (pantallas finas: solo componen)
  src/features/<feature>/  expenses, households, balances, auth…
    api.ts                 queries y mutations (TanStack Query + Supabase)
    components/  hooks/
  src/components/          UI reutilizable, sin lógica de negocio
  src/lib/                 cliente de Supabase, QueryClient, utilidades
packages/core/             dominio puro: tipos, esquemas Zod, plata, fechas, saldos (+ tests)
supabase/
  migrations/              la ÚNICA forma de cambiar el esquema
  seed.sql                 datos de prueba para desarrollo local
docs/ROADMAP.md
```

## Comandos (desde la raíz)
| Comando | Qué hace |
|---|---|
| `pnpm dev` | Levanta la app en el navegador |
| `pnpm lint` · `pnpm typecheck` · `pnpm test` | Lo mismo que corre el CI |
| `pnpm db:start` | Supabase local (necesita Docker) |
| `pnpm db:reset` | Recrea la base local: migraciones + seed |
| `pnpm db:types` | Regenera `packages/core/src/database.types.ts` |

Si agregás o cambiás comandos, actualizá esta tabla.

## Reglas del dominio
- **Todo pertenece a un hogar** (`household_id`). Un usuario puede estar en varios; la app trabaja con el hogar activo.
- **Plata en centavos enteros** (`amount_cents`, bigint). Nunca floats. Convertir y mostrar solo con `parseAmount` y `formatMoney` de `packages/core` (locale `es-AR`: `$ 12.500,50`).
- **Moneda** en cada gasto (`currency`, ISO 4217, `ARS` por defecto). Nunca sumar monedas distintas.
- **Fecha y hora:** `spent_at` (timestamptz, UTC en la base). El formulario la completa sola con la hora del dispositivo y se puede editar. Se muestra en `America/Argentina/Buenos_Aires`, formato `dd/MM HH:mm`.
- **Categorías y comercios son datos** de cada hogar, no enums en el código. Si tienen gastos no se borran: se archivan (`archived_at`).
- **Quién pagó:** `paid_by` es un miembro del hogar (por defecto, quien carga). En v1 cada gasto se reparte en partes iguales; el saldo se calcula en `packages/core` a partir de la vista `member_paid_totals`.

## Base de datos (Supabase)
- El esquema se cambia SOLO con migraciones nuevas (`pnpm supabase migration new <nombre>`). Nunca edites una migración ya aplicada: hacé otra.
- Toda tabla nueva lleva `enable row level security` y sus políticas en la misma migración. Para filtrar por hogar: `household_id in (select private.my_household_ids())`.
- Funciones `security definer`: siempre con `set search_path = ''` y nombres calificados. Las auxiliares van en el esquema `private`, que la API no expone.
- Crear un hogar y unirse a uno: solo por RPC, `create_household(p_name, p_display_name)` y `join_household(p_invite_code, p_display_name)`.
- Después de cada migración: `pnpm db:reset` y `pnpm db:types`.
- En la app solo va la clave pública de Supabase (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_KEY`). La clave secreta (service_role) nunca entra al cliente ni al repo.

## Expo y dependencias
- Dependencias de la app: desde `apps/app`, `pnpm expo install <paquete>`, así respetan la versión del SDK.
- `expo`, `react`, `react-native` y los `expo-*` no se actualizan sueltos: se suben juntos (`pnpm expo install expo@latest` y después `pnpm expo install --fix`) en un PR propio.
- Antes de sumar una librería, confirmá que funcione en web y en nativo; si no, aislala en `*.web.tsx` / `*.native.tsx`.

## Producto
- Cargar un gasto tiene que llevar menos de 10 segundos desde el celular: monto primero (teclado numérico), categoría con botones grandes, comercio con autocompletado de los más usados, fecha y hora automáticas, guardar.
- Mobile-first también en web: probá en 375 px de ancho.
- Elegir un comercio con categoría por defecto la preselecciona (ej.: Coto → Almacén / Supermercado).
- Textos cortos, en castellano y con voseo ("Cargá un gasto").

## No hacer
- Llamar a Supabase desde componentes: siempre por los hooks de `features/*/api.ts`.
- Guardar secretos en el código o en el repo (`.env` está en el `.gitignore`).
- Usar `any`, `@ts-ignore` o apagar reglas del linter para que pase.
- Sumar dependencias pesadas sin preguntar.
