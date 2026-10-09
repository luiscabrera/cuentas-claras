# Cuentas Claras

App para que un hogar (hoy, Luis y su pareja) registre los gastos compartidos en segundos y sepa en todo momento quién le debe a quién. Reemplaza el Excel que usábamos. Primero web (instalable en el celu como PWA); después, app nativa Android/iOS desde la misma base de código.

El plan por fases y los prompts de cada etapa están en `docs/ROADMAP.md`. Cómo correrlo en local, en el `README.md`.

## Cómo trabajar en este repo

- Respondé siempre en español rioplatense.
- Antes de implementar algo no trivial, proponé un plan corto y esperá el OK.
- Una feature = una rama (`feat/…`, `fix/…`, `chore/…`) = un PR. Nunca commitees directo a `main`.
- Commits chicos en Conventional Commits, con la descripción en español: `feat: alta rápida de gasto`.
- Antes de dar algo por terminado: `pnpm lint && pnpm typecheck && pnpm test` en verde y, si tocaste UI, probala en el navegador.
- Si una decisión de este archivo deja de tener sentido, decímelo en vez de esquivarla.

## Stack

- **Monorepo:** pnpm 11 workspaces + Turborepo. La versión de pnpm está fijada en `packageManager`; Node 24 en `.nvmrc`.
- **App (web + Android + iOS):** Expo con Expo Router y TypeScript estricto, en `apps/app`. Web en modo SPA (`web.output: "single"`).
- **Estilos:** NativeWind 4 con Tailwind 3. La guía de Tailwind de Expo ahora es solo para web: seguí la documentación de NativeWind. Colores en `apps/app/src/theme/palette.js`.
- **Datos del servidor:** supabase-js + TanStack Query.
- **Formularios:** React Hook Form + Zod (los esquemas viven en `packages/core`).
- **Backend:** Supabase: Postgres, Auth y Row Level Security (Realtime en la Fase 2).
- **Lógica de dominio:** `packages/core`, TypeScript puro con Vitest.
- **Pruebas de punta a punta:** Playwright en `e2e/`, contra la web exportada y Supabase local. El CI las corre en cada PR.
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
    mascots/               Pomelo y Trufa en SVG (shapes.ts), también para los íconos
  src/lib/                 cliente de Supabase, QueryClient, utilidades
  src/theme/palette.js     colores (cielo, fuego, tinta), compartidos con Tailwind
  public/                  index.html y manifest de la PWA
  scripts/                 generador de íconos y splash
packages/core/             dominio puro: tipos, esquemas Zod, plata, fechas, saldos (+ tests)
supabase/
  migrations/              la ÚNICA forma de cambiar el esquema
  seed.sql                 datos de prueba para desarrollo local
e2e/                       pruebas de punta a punta (Playwright)
docs/ROADMAP.md
```

## Comandos (desde la raíz)

| Comando                                      | Qué hace                                                                                |
| -------------------------------------------- | --------------------------------------------------------------------------------------- |
| `pnpm dev`                                   | Levanta la app en el navegador                                                          |
| `pnpm lint` · `pnpm typecheck` · `pnpm test` | Lo mismo que corre el CI                                                                |
| `pnpm build`                                 | Exporta la web a `apps/app/dist` (usa `apps/app/.env`)                                  |
| `pnpm e2e`                                   | Pruebas de punta a punta contra `apps/app/dist` (antes: `pnpm db:reset` y `pnpm build`) |
| `pnpm format`                                | Prettier sobre todo el repo (`pnpm format:check` solo revisa)                           |
| `pnpm db:start` · `pnpm db:stop`             | Prende y apaga Supabase local (necesita Docker)                                         |
| `pnpm db:reset`                              | Recrea la base local: migraciones + seed                                                |
| `pnpm db:types`                              | Regenera `packages/core/src/database.types.ts` (solo el esquema `public`)               |
| `pnpm --filter @cuentas-claras/app icons`    | Regenera íconos, splash y favicon a partir de las mascotas                              |

Si agregás o cambiás comandos, actualizá esta tabla.

- `pnpm typecheck` en la app corre antes `expo customize tsconfig.json`, que genera `expo-env.d.ts` y los tipos de las rutas.
- lefthook corre Prettier y ESLint sobre lo que commiteás.
- Datos de prueba (`seed.sql`): `pomelo@example.com` y `trufa@example.com`, contraseña `cuentas-claras`, en el hogar "Casa" (código `CA5A000001`), con gastos de los últimos 40 días (las fechas son relativas a cuando corrés el seed).

## Reglas del dominio

- **Todo pertenece a un hogar** (`household_id`). Un usuario puede estar en varios; la app trabaja con el hogar activo.
- **Plata en centavos enteros** (`amount_cents`, bigint). Nunca floats. Convertir y mostrar solo con `parseAmount` y `formatMoney` de `packages/core` (locale `es-AR`: `$ 12.500,50`).
- **Moneda** en cada gasto (`currency`, ISO 4217, `ARS` por defecto). Nunca sumar monedas distintas.
- **Fecha y hora:** `spent_at` (timestamptz, UTC en la base). El formulario la completa sola con la hora del dispositivo y se puede editar. Se muestra en `America/Argentina/Buenos_Aires`, formato `dd/MM HH:mm`.
- **Categorías y comercios son datos** de cada hogar, no enums en el código. Si tienen gastos no se borran: se archivan (`archived_at`).
- **Quién pagó:** `paid_by` es un miembro del hogar (por defecto, quien carga). En v1 cada gasto se reparte en partes iguales y el saldo es **por mes**: `computeBalances` (`packages/core`) lo calcula con los gastos del mes que se está viendo. La vista `member_paid_totals` (totales de siempre) queda para cuando haya liquidaciones (Fase 2).

## Base de datos (Supabase)

- El esquema se cambia SOLO con migraciones nuevas (`pnpm supabase migration new <nombre>`). Nunca edites una migración ya aplicada: hacé otra.
- Toda tabla nueva lleva `enable row level security` y sus políticas en la misma migración. Para filtrar por hogar: `household_id in (select private.my_household_ids())`.
- Funciones `security definer`: siempre con `set search_path = ''` y nombres calificados. Las auxiliares van en el esquema `private`, que la API no expone.
- Crear un hogar y unirse a uno: solo por RPC, `create_household(p_name, p_display_name)` y `join_household(p_invite_code, p_display_name)`.
- Después de cada migración: `pnpm db:reset` y `pnpm db:types`. El CI falla si los tipos no coinciden con las migraciones.
- En la app solo va la clave pública de Supabase (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_KEY`). La clave secreta (service_role) nunca entra al cliente ni al repo.

## Expo y dependencias

- Dependencias de la app: desde `apps/app`, `pnpm expo install <paquete>`, así respetan la versión del SDK.
- `expo`, `react`, `react-native` y los `expo-*` no se actualizan sueltos: se suben juntos (`pnpm expo install expo@latest` y después `pnpm expo install --fix`) en un PR propio.
- Antes de sumar una librería, confirmá que funcione en web y en nativo; si no, aislala en `*.web.tsx` / `*.native.tsx`.
- Si un paquete necesita correr scripts al instalarse, pnpm 11 pide aprobarlo con `pnpm approve-builds` (queda en `allowBuilds` de `pnpm-workspace.yaml`).
- `AGENTS.md` (raíz) lo escribe Turborepo: no lo edites. `apps/app/AGENTS.md` viene de la plantilla de Expo; si choca con este archivo, manda este (por ejemplo, `pnpm expo install` y no `npx expo install`).

## Producto

- Cargar un gasto tiene que llevar menos de 10 segundos desde el celular: monto primero (teclado numérico), categoría con botones grandes, comercio con autocompletado de los más usados, fecha y hora automáticas, guardar.
- Mobile-first también en web: probá en 375 px de ancho.
- Elegir un comercio con categoría por defecto la preselecciona (ej.: Coto → Almacén / Supermercado). Escribir su nombre exacto también, si todavía no hay categoría elegida.
- Textos cortos, en castellano y con voseo ("Cargá un gasto").

## Interfaz

- **Estética:** fondo celeste (`cielo`), acciones en color fuego (`fuego`, el marrón claro de los salchichas) y texto chocolate (`tinta`). Fredoka para títulos y montos; la fuente del sistema para el resto.
- **Mascotas:** Pomelo (macho, negro y fuego) y Trufa (hembra, chocolate y fuego). Se dibujan con las formas de `src/components/mascots/shapes.ts`, no con imágenes sueltas. La carita de cada gasto muestra quién pagó: el primer miembro del hogar es Pomelo y el segundo, Trufa.
- **Accesibilidad:** usá `role` y las props `aria-*` (`aria-checked`, `aria-disabled`, `aria-busy`…). react-native-web ignora `accessibilityState` y da por obsoleto `accessibilityRole`.
- **Pruebas:** `e2e/` encuentra los elementos por `testID` y por rol y nombre accesible. Si cambiás un `testID` o un texto que se usa ahí, actualizá las pruebas.

## No hacer

- Llamar a Supabase desde componentes: siempre por los hooks de `features/*/api.ts`.
- Guardar secretos en el código o en el repo (`.env` está en el `.gitignore`).
- Usar `any`, `@ts-ignore` o apagar reglas del linter para que pase.
- Sumar dependencias pesadas sin preguntar.
