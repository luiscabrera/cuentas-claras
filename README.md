# Cuentas Claras

Los gastos de la casa, en segundos y sin Excel. Cada uno carga lo que pagó desde el celu y la app dice en todo momento quién le debe a quién. Las mascotas son Pomelo y Trufa, los salchichas de la casa.

Hoy es una web instalable en el celu (PWA); la app nativa para Android e iOS sale de la misma base de código.

## Qué hace

- **Cuenta y hogar:** te registrás con email y contraseña, armás el hogar y le pasás el código de invitación a tu pareja.
- **Cargar un gasto en menos de 10 segundos:** monto primero, comercio con autocompletado (los más usados arriba, y cada comercio trae su categoría), categoría con botones grandes, quién pagó, y la fecha y la hora se completan solas.
- **Inicio:** total del mes, "Cuentas claras" (cuánto puso cada uno y quién le debe cuánto a quién), gastos por categoría y la lista del mes agrupada por día. Se puede ir a meses anteriores.
- **Editar y borrar** gastos, **ajustes** con el código de invitación, los miembros y los hogares.

## Stack

| Parte                     | Con qué                                                                                           |
| ------------------------- | ------------------------------------------------------------------------------------------------- |
| App (web + Android + iOS) | Expo SDK 57 (React Native 0.86, React 19), Expo Router, TypeScript estricto                       |
| Estilos                   | NativeWind 4 + Tailwind 3, fuente Fredoka para títulos y montos                                   |
| Datos y formularios       | supabase-js + TanStack Query 5, React Hook Form + Zod 4                                           |
| Backend                   | Supabase: Postgres 17, Auth y Row Level Security                                                  |
| Lógica de dominio         | `packages/core`: TypeScript puro con Vitest (plata en centavos, fechas en hora argentina, saldos) |
| Pruebas de punta a punta  | Playwright contra la web exportada y Supabase local                                               |
| Monorepo                  | pnpm 11 workspaces + Turborepo                                                                    |
| Automatización            | GitHub Actions (CI y migraciones), Dependabot, lefthook, Vercel                                   |

## Correrlo en tu compu

Necesitás **Node 24** (`fnm use` o `nvm use` toman el `.nvmrc`), **pnpm 11** (`npm install -g pnpm@11`) y **Docker Desktop** abierto.

```bash
pnpm install
pnpm db:start                               # Supabase local; la primera vez baja las imágenes y tarda
cp apps/app/.env.example apps/app/.env      # completalo con la API URL y la Publishable key que imprime db:start
pnpm dev                                    # la app en el navegador, en http://localhost:8081
```

La base local arranca con datos de prueba: entrá con `pomelo@example.com` o `trufa@example.com` (contraseña `cuentas-claras`). Comparten el hogar "Casa", con el código de invitación `CA5A000001`. Para volver a esos datos: `pnpm db:reset`.

Para verla como en el celu, usá las herramientas de desarrollo del navegador con 375 px de ancho.

## Pruebas

```bash
pnpm lint && pnpm typecheck && pnpm test    # lo mismo que corre el CI
```

Las pruebas de punta a punta usan la web exportada contra tu Supabase local:

```bash
pnpm db:reset                                                      # base limpia con los datos de prueba
pnpm --filter @cuentas-claras/app build                            # exporta la web con apps/app/.env
pnpm --filter @cuentas-claras/e2e exec playwright install chromium # solo la primera vez
pnpm e2e
```

En cada PR, el CI corre todo esto solo: formato, lint, tipos, tests, build, Supabase local con Playwright y un chequeo de que los tipos de la base coincidan con las migraciones.

## Cómo está organizado

```
apps/app/          la app Expo (rutas en src/app, features en src/features)
packages/core/     dominio puro: plata, fechas, saldos y esquemas, con tests
supabase/          migraciones, seed y configuración de Supabase local
e2e/               pruebas de punta a punta con Playwright
docs/ROADMAP.md    fases, pasos pendientes y prompts para Claude Code
CLAUDE.md          reglas del proyecto para trabajar con Claude Code
```

## Deploy

- **Web:** Vercel, con una URL de prueba por PR y producción desde `main` (`vercel.json`).
- **Base:** Supabase. Las migraciones nuevas se aplican solas al entrar a `main` (`.github/workflows/db-deploy.yml`).

Los pasos para dejar andando las dos cosas están en [docs/ROADMAP.md](docs/ROADMAP.md).

## Pomelo y Trufa

Pomelo (negro y fuego) y Trufa (chocolate y fuego) están dibujados con formas SVG en `apps/app/src/components/mascots/shapes.ts`. De ahí salen las caritas de quién pagó, el logo (los dos acostados, uno arriba del otro, forman un "=") y los íconos de la app, que se regeneran con `pnpm --filter @cuentas-claras/app icons`.

## Licencia

[MIT](LICENSE)
