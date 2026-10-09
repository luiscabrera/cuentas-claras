# Roadmap · Cuentas Claras

Cada fase termina con algo usable y cada ítem es un PR. Los prompts están pensados para pegarlos tal cual en Claude Code, desde la raíz del repo; todos piden un plan antes de tocar código.

**Dónde estamos:** el PR #1 trae las Fases 0 y 1 hechas (monorepo, automatizaciones y MVP). Lo que queda de esas fases son pasos que necesitan tus cuentas (Supabase, Vercel, GitHub): están marcados con ⏳.

---

## Fase 0 · Base del repo

**Objetivo:** monorepo armado, CI en verde, base local andando y la web publicada.

### Una sola vez, en tu compu
- **Git** y **GitHub CLI**, logueado con `gh auth login`. Claude Code lo usa para abrir PRs y para instalar la integración con GitHub.
- **Node.js 24** (con `fnm` o `nvm`, toman el `.nvmrc`) y **pnpm 11** (`npm install -g pnpm@11`).
- **Docker Desktop** (u OrbStack en Mac): lo necesita Supabase local.
- **jq**: lo usa el hook que formatea lo que edita Claude Code.
- **Claude Code**.
- **Expo Go** en el celu, para probar la app nativa más adelante.

### Pasos
1. ⏳ Cloná el repo: `gh repo clone luiscabrera/cuentas-claras && cd cuentas-claras`. Después seguí el README para correrlo en local.
2. ✅ Kit inicial en `main`: `CLAUDE.md`, este roadmap y la migración de la base. Fue el único commit directo a `main`; de acá en adelante, todo por PR.
3. ✅ Monorepo y automatizaciones (Prompts 0 y 0.1): hechos en el PR #1. ⏳ Revisalo y mergealo con "Rebase and merge" o "Create a merge commit", así quedan los commits chicos.
4. ⏳ Creá el proyecto en Supabase (región São Paulo, la más cercana) y guardá la contraseña de la base en tu gestor de contraseñas.
5. ⏳ En la configuración de Auth de Supabase, desactivá la confirmación por mail (ver "Cosas a saber").
6. ⏳ Con el PR #1 ya mergeado, cargá los secrets para que las migraciones lleguen solas a producción y corré el workflow una vez a mano (el esquema inicial ya estaba en `main` antes del PR, así que no se dispara solo):
   ```bash
   gh secret set SUPABASE_ACCESS_TOKEN   # token personal: supabase.com/dashboard/account/tokens
   gh secret set SUPABASE_DB_PASSWORD    # la contraseña de la base del paso 4
   gh secret set SUPABASE_PROJECT_ID     # Project Settings → General → Project ID
   gh workflow run db-deploy.yml
   ```
   Si preferís hacerlo a mano: `pnpm supabase login`, `pnpm supabase link --project-ref <id>` y `pnpm supabase db push`.
7. ⏳ Importá el repo en Vercel (Framework Preset: Other; el resto lo toma de `vercel.json`) y cargá estas variables de entorno:
   - `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_KEY`: la URL y la publishable key del proyecto (en Project Settings: Data API para la URL y API Keys para la clave). Nunca la secret key.
   - `ENABLE_EXPERIMENTAL_COREPACK=1`: para que Vercel use el pnpm 11 fijado en `packageManager`.
8. ⏳ En Claude Code: `/install-github-app`. Elegí el workflow de `@claude` y el de revisión de PRs, y autenticá con tu suscripción de Claude (o con una API key).
9. ⏳ Protegé `main` con un ruleset (Settings → Rules): todo entra por PR y con los dos checks del CI en verde ("Formato, lint, tipos, tests y build" y "De punta a punta (Supabase local + Playwright)"), sin aprobaciones obligatorias (no podés aprobar tus propios PRs). En la configuración de seguridad del repo, confirmá que estén activos el escaneo de secretos y la protección al pushear, y prendé CodeQL.

¿Querés que Claude Code te lleve de la mano en los pasos 4 a 7? Usá el **Prompt 1.1**.

### Prompt 0 · Armar el monorepo (hecho en el PR #1, queda como referencia)
```text
Leé CLAUDE.md y docs/ROADMAP.md. Vamos con la Fase 0. Antes de tocar nada, mostrame el plan.

1. Monorepo con pnpm workspaces + Turborepo: package.json raíz con los scripts de la tabla de comandos de CLAUDE.md, pnpm-workspace.yaml, turbo.json, .nvmrc con la LTS actual de Node, .editorconfig, Prettier y "packageManager" fijado.
2. apps/app con create-expo-app (plantilla por defecto: TypeScript + Expo Router), rutas en src/app, web en modo single (SPA), NativeWind y alias @/ → src/. Confirmá que Metro resuelva bien los paquetes del workspace.
3. packages/core con TypeScript, Vitest y Zod. Primeras funciones, con tests: parseAmount("12.500,50") → 1250050 y formatMoney(1250050, "ARS") → "$ 12.500,50" (Intl pone un espacio no separable después del $).
4. Supabase CLI como devDependency de la raíz. `supabase init` sin tocar supabase/migrations. Scripts db:start, db:reset y db:types. Levantá la base local, aplicá la migración y generá los tipos.
5. .env.example con EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_KEY, y el cliente de Supabase tipado en apps/app/src/lib/supabase.ts.
6. .github/workflows/ci.yml: en cada PR y push a main → pnpm install con caché, lint, typecheck, test y `expo export -p web`.
7. .github/dependabot.yml: npm y github-actions, semanal y agrupado. Ignorá expo, expo-*, @expo/*, react, react-dom y react-native* (esos se suben con expo install --fix).
8. vercel.json para servir el export web como SPA, siguiendo la guía "Publish websites" de Expo.
9. .claude/settings.json con un hook PostToolUse que corra Prettier sobre cada archivo que edites, y permisos pre-aprobados para los comandos de pnpm y git que uses seguido.
10. Corré lint, typecheck, test y la app en el navegador. Si todo pasa: commits chicos en la rama chore/setup y abrí un PR con gh.
```

### Prompt 0.1 · Migraciones automáticas (hecho en el PR #1, queda como referencia)
```text
Creá .github/workflows/db-deploy.yml: cuando entra a main un cambio en supabase/migrations/**, linkea el proyecto y corre `supabase db push`; que también se pueda disparar a mano (workflow_dispatch). Usá los secrets SUPABASE_ACCESS_TOKEN, SUPABASE_DB_PASSWORD y SUPABASE_PROJECT_ID y decime cómo cargarlos con gh secret set. Plan primero.
```

---

## Fase 1 · MVP: cargar gastos

**Objetivo:** los dos usan la web desde el celu para cargar todos los gastos del mes.

- [x] Login y hogar compartido (Prompt 1) · PR #1
- [x] Alta rápida de gasto (Prompt 2) · PR #1
- [x] Lista del mes, totales y saldo (Prompt 3) · PR #1
- [x] Web instalable como app (Prompt 4) · PR #1
- [x] Hooks de pre-commit (lefthook) y tipos de la base chequeados en el CI · PR #1
- [x] Extra: pruebas de punta a punta con Playwright contra Supabase local, en cada PR · PR #1
- [ ] ⏳ Ponerla en producción (pasos 4 a 9 de la Fase 0, o el Prompt 1.1)
- [ ] ⏳ Registrarse los dos y desactivar los registros nuevos en Supabase (Authentication → Sign In / Providers → "Allow new users to sign up")
- [ ] Usarla una semana de verdad y anotar lo que moleste (Prompt 1.2)

**Diferencias con lo planeado**, para que las confirmes en el PR:
- El saldo es **por mes**: "Cuentas claras" usa los gastos del mes que estás viendo, como cuando cerraban el Excel a fin de mes. La vista `member_paid_totals` (totales de siempre) va a tener sentido cuando existan las liquidaciones de la Fase 2.
- Los tests de RLS con pgTAP siguen en la Fase 2, pero el e2e ya prueba que alguien de otro hogar no ve nada.

### Prompt 1 · Login y hogar (hecho en el PR #1)
```text
Fase 1: login y hogar. Plan primero.
- Ingreso y registro con email y contraseña (Supabase Auth). Sesión persistente en web y nativo. Rutas protegidas con Expo Router: sin sesión → /login.
- Si el usuario no tiene hogar: crear uno (RPC create_household) o unirse con un código (RPC join_household), pidiendo cómo quiere que lo llamen.
- El hogar activo se recuerda en el dispositivo.
- Ajustes: código de invitación con botones Copiar y Compartir, y Cerrar sesión.
- Errores de Supabase traducidos a mensajes cortos en castellano.
```

### Prompt 2 · Cargar un gasto (hecho en el PR #1)
```text
Fase 1: pantalla "Nuevo gasto". Se tiene que poder completar en menos de 10 segundos desde el celu. Plan primero.
- Monto arriba, con foco automático y teclado numérico; se guarda en centavos con parseAmount.
- Categorías del hogar como botones grandes con su ícono, ordenadas por sort_order.
- Comercio opcional con autocompletado (primero los más usados del hogar) y opción "Agregar «…»". Si el comercio tiene categoría por defecto, preseleccionala; si es nuevo, guardale como default la categoría elegida.
- Quién pagó: yo por defecto, con un toggle para el otro miembro.
- Fecha y hora: se completan solas con las del dispositivo; tocándolas se pueden cambiar.
- Nota opcional.
- Esquema Zod en packages/core, mutación con TanStack Query, aviso al guardar y vuelta al inicio.
```

### Prompt 3 · Lista, totales y saldo (hecho en el PR #1)
```text
Fase 1: pantalla de inicio. Plan primero.
- Total del mes, total por categoría y la lista de gastos del mes agrupada por día (hora, categoría, comercio, monto y quién pagó). Navegación entre meses.
- Tocar un gasto → editarlo o borrarlo (con confirmación).
- Tarjeta "Cuentas claras": cuánto pagó cada uno y quién le debe cuánto a quién. Función computeBalances en packages/core (partes iguales) sobre la vista member_paid_totals, con tests para 2 y 3 miembros, montos que no dividen exacto y más de una moneda.
```

### Prompt 4 · Web instalable (hecho en el PR #1)
```text
Fase 1: hacé la web instalable como PWA (manifest, íconos, theme color, nombre "Cuentas Claras") siguiendo la guía de PWA de Expo, y verificá que el deploy de Vercel la sirva bien. Plan primero.
```

### Prompt 1.1 · Producción, de la mano
```text
Ayudame a poner Cuentas Claras en producción siguiendo los pasos 4 a 9 de la Fase 0 en docs/ROADMAP.md. Andá de a un paso y esperá mi OK antes de cada uno; lo que necesite mis cuentas (crear el proyecto, copiar claves) decime exactamente dónde hacer clic. Usá gh para los secrets y para correr db-deploy.yml, y la CLI de Vercel si hace falta. Al final, verificá que la web de producción cargue, que pueda registrarme y que aparezca el formulario para crear el hogar. Nunca pegues claves en el chat ni en archivos del repo.
```

### Prompt 1.2 · Lo que molestó en la primera semana
```text
Usamos Cuentas Claras una semana. Esto es lo que nos molestó o nos faltó: <lista>. Ordenalo de lo más simple a lo más difícil, proponé un plan corto para cada cosa y hacé un PR por tema.
```

---

## Fase 2 · Cuentas claras de verdad

- Reparto por gasto: 50/50, porcentajes, "solo mío", "solo tuyo".
- Liquidaciones: registrar "te transferí $X" para dejar el saldo en cero, con historial.
- Tiempo real: ver al instante lo que carga el otro (Supabase Realtime).
- Importar el Excel viejo (CSV) con una pantalla para mapear columnas.
- Medio de pago: efectivo, débito, crédito, Mercado Pago.
- Tests de las políticas de seguridad con pgTAP (`supabase test db`) en el CI.

### Prompt 5 · Repartos y liquidaciones
```text
Fase 2: repartos y liquidaciones. Plan primero, empezando por el modelo de datos.
- Migración con expense_splits (gasto, miembro, monto en centavos) y settlements (quién le pagó a quién, cuánto y cuándo), con RLS como el resto de las tablas.
- En la misma migración, completá los gastos existentes con partes iguales.
- Al cargar un gasto: 50/50 por defecto, con "Solo mío", "Solo del otro" y porcentaje.
- Recalculá el saldo con repartos y liquidaciones. Decidamos juntos si sigue siendo por mes o pasa a ser acumulado. Tests primero.
- Tests de RLS con pgTAP en supabase/tests y un paso del CI que los corra.
```

### Prompt 6 · Tiempo real
```text
Fase 2: tiempo real. Cuando uno carga, edita o borra un gasto, el otro lo ve al instante sin recargar. Plan primero.
- Migración que sume expenses a la publicación supabase_realtime.
- Suscripción a postgres_changes de expenses filtrada por el hogar activo, que invalide las queries del hogar en TanStack Query. Cerrala al cambiar de hogar o de sesión.
- En el job e2e del CI, sacá realtime de los servicios excluidos y sumá un caso con dos navegadores.
```

### Prompt 7 · Importar el Excel
```text
Fase 2: importar el Excel viejo. Te paso un CSV de ejemplo. Plan primero.
- Pantalla para subir el CSV, mapear columnas (fecha, monto, categoría, comercio, quién pagó, nota) y ver una vista previa con los errores de cada fila antes de confirmar.
- El parseo y la validación van en packages/core con tests (montos como "12.500,50", fechas dd/MM/yyyy).
- Categorías y comercios que no existan se crean. Importar dos veces el mismo archivo no duplica gastos.
```

### Prompt 8 · Medio de pago
```text
Fase 2: medio de pago (efectivo, débito, crédito, Mercado Pago) como dato de cada hogar, igual que las categorías, con el último usado preseleccionado. Migración, tipos, formulario y un filtro en la lista. Plan primero.
```

---

## Fase 3 · App nativa

- La misma app Expo, compilada con EAS Build. En Android se puede instalar directo para uso personal; en iOS, fuera de desarrollo, hace falta el Apple Developer Program (pago anual), o seguir usando la PWA.
- EAS Update para mandar cambios sin reinstalar.
- Acceso rápido a "Nuevo gasto" (atajo o widget).
- Login con Google o Apple.
- Builds y updates automáticos desde GitHub Actions o EAS Workflows.

### Prompt 9 · La app en el celu
```text
Fase 3: la app nativa. Plan primero.
- Probala en Expo Go (`pnpm --filter @cuentas-claras/app start`) y arreglá lo que se vea o funcione distinto que en la web: teclado numérico, fecha y hora, avisos, áreas seguras, tirar para actualizar.
- eas.json con perfiles development, preview (APK para instalar directo en Android) y production, y EAS Update con un canal por perfil.
- Sumá al README cómo instalar la APK y cómo mandar un update.
```

## Fase 4 · Ideas para seguir escalando

- Gastos fijos y recurrentes (alquiler, expensas, servicios) con recordatorio.
- Presupuesto por categoría con aviso cuando se acerca al límite.
- Gastos en dólares con la cotización del día.
- Foto del ticket: la IA completa monto, comercio y categoría.
- Bot de WhatsApp o Telegram: "gasté 12.500 en el chino".
- Resumen mensual por mail.
- Exportar a CSV o Google Sheets.
- Más miembros (familia, roommates): el modelo de datos ya lo soporta.

---

## Automatización

| Qué | Cómo | Estado |
|---|---|---|
| Formato, lint, tipos, tests y build web en cada PR | GitHub Actions (`ci.yml`) | ✅ |
| Pruebas de punta a punta contra Supabase local en cada PR | Job `e2e` de `ci.yml` con Playwright | ✅ |
| Tipos de la base siempre al día | El CI los regenera y falla si cambiaron | ✅ |
| Formato y lint antes de cada commit | lefthook | ✅ |
| Formato automático de lo que edita Claude Code | Hook PostToolUse en `.claude/settings.json` | ✅ |
| Dependencias al día | Dependabot semanal y agrupado, sin tocar Expo/RN | ✅ |
| Migraciones a producción al mergear | `db-deploy.yml` con `supabase db push` | ⏳ faltan los secrets |
| URL de prueba por PR y producción al mergear | Vercel conectado al repo (`vercel.json`) | ⏳ falta importarlo |
| `@claude` en issues y PRs, y revisión automática de PRs | `/install-github-app` | ⏳ |
| `main` protegida: todo por PR y con el CI en verde | Ruleset de GitHub | ⏳ |
| Claves filtradas y código vulnerable | Escaneo de secretos, protección al pushear y CodeQL (gratis en repos públicos) | ⏳ |
| Políticas de seguridad (RLS) testeadas | pgTAP + `supabase test db` en el CI | Fase 2 |
| Changelog y versiones | Release Please (opcional) | Fase 2 |
| Builds y updates de la app | EAS Workflows o Actions con `eas build` / `eas update` | Fase 3 |

## Trabajar con Claude Code

- Cada feature arranca en modo plan (Shift+Tab): que te muestre el plan antes de tocar código.
- Una sesión por feature; `/clear` entre tareas que no tienen nada que ver.
- Si algo se ve mal, pasale una captura de pantalla.
- Para que consulte la base, usá el MCP de Supabase **solo contra la base local**: `claude mcp add --transport http supabase-local http://localhost:54321/mcp`. Nunca lo conectes a producción.
- Para tareas chicas sin abrir la terminal: creá un issue en GitHub y comentá `@claude implementá esto`.
- Claude Code en la web (claude.ai/code) puede trabajar en la nube y dejarte un PR mientras no estás, como el PR #1. Ahí no hay Docker, así que no puede levantar Supabase local: las pruebas de punta a punta las corre el CI.

## Cosas a saber

- **Repo público:** cualquiera puede ver el código, pero no los datos, que viven en Supabase. Las claves van solo en `.env` (está en el `.gitignore`) y en los secrets de GitHub y Vercel; el escaneo de secretos de GitHub ayuda a detectar si se escapa alguna. A cambio, tenés gratis los rulesets, el escaneo de secretos y CodeQL. El workflow de `@claude` solo responde a quien tiene permiso de escritura en el repo.
- **Supabase gratis:** el proyecto se pausa después de una semana sin uso y se reactiva desde el panel. Hay hasta 2 proyectos gratis.
- **Mails de Supabase:** sin un SMTP propio, Supabase solo le manda mails a los miembros del equipo del proyecto. Por eso el login arranca con email y contraseña, sin confirmación por mail. Si más adelante querés links mágicos o recuperar contraseña por mail, configurá un SMTP (por ejemplo, Resend).
- **Expo y Dependabot:** nunca mergees una suba suelta de `expo-*` o `react-native`; el SDK se actualiza entero.
- **Vercel y pnpm:** sin `ENABLE_EXPERIMENTAL_COREPACK=1`, Vercel elige la versión de pnpm por el lockfile y puede no ser la 11.
