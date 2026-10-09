-- ============================================================================
-- Cuentas Claras · esquema inicial
--
-- Hogares (households) con sus miembros, categorías, comercios y gastos.
-- Todo cuelga de household_id y Row Level Security garantiza que cada usuario
-- vea y toque solo los datos de los hogares a los que pertenece.
--
-- Convenciones:
--   * Plata en centavos enteros (amount_cents bigint). Nunca floats.
--   * Fechas en timestamptz (UTC); la app las muestra en
--     America/Argentina/Buenos_Aires.
--   * Categorías y comercios son datos de cada hogar: se archivan
--     (archived_at), no se borran.
--   * Crear un hogar o unirse a uno se hace solo por RPC (create_household,
--     join_household): el cliente nunca inserta miembros directamente.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- Esquema privado para funciones auxiliares (la API de Supabase no lo expone)
-- ----------------------------------------------------------------------------
create schema if not exists private;
grant usage on schema private to authenticated;


-- ----------------------------------------------------------------------------
-- Tablas
-- ----------------------------------------------------------------------------
create table public.households (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(trim(name)) between 1 and 60),
  -- Código para invitar a alguien al hogar: 10 caracteres (0-9, A-F).
  invite_code text not null unique
              default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  created_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now()
);

create table public.household_members (
  household_id uuid not null references public.households (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 1 and 40),
  role         text not null default 'member' check (role in ('owner', 'member')),
  joined_at    timestamptz not null default now(),
  primary key (household_id, user_id)
);

create table public.categories (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name         text not null check (char_length(trim(name)) between 1 and 40),
  icon         text,
  sort_order   integer not null default 0,
  archived_at  timestamptz,
  created_at   timestamptz not null default now(),
  -- Destino de las FK compuestas: un gasto solo puede usar categorías de su hogar.
  unique (household_id, id)
);

create table public.merchants (
  id                  uuid primary key default gen_random_uuid(),
  household_id        uuid not null references public.households (id) on delete cascade,
  name                text not null check (char_length(trim(name)) between 1 and 60),
  -- Al elegir este comercio, la app preselecciona esta categoría.
  default_category_id uuid,
  archived_at         timestamptz,
  created_at          timestamptz not null default now(),
  unique (household_id, id),
  foreign key (household_id, default_category_id)
    references public.categories (household_id, id)
);

create table public.expenses (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  amount_cents bigint not null check (amount_cents > 0),
  currency     text not null default 'ARS' check (currency ~ '^[A-Z]{3}$'),
  category_id  uuid not null,
  merchant_id  uuid,
  note         text check (char_length(note) <= 280),
  -- La app manda la hora del dispositivo al abrir el formulario; now() es el respaldo.
  spent_at     timestamptz not null default now(),
  -- Quién pagó: cualquier miembro del hogar (por defecto, quien lo carga).
  paid_by      uuid not null default auth.uid(),
  created_by   uuid default auth.uid() references auth.users (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  foreign key (household_id, category_id)
    references public.categories (household_id, id),
  foreign key (household_id, merchant_id)
    references public.merchants (household_id, id),
  foreign key (household_id, paid_by)
    references public.household_members (household_id, user_id)
);


-- ----------------------------------------------------------------------------
-- Índices (incluye todas las FK, para que el linter de Supabase no se queje)
-- ----------------------------------------------------------------------------
create index households_created_by_idx       on public.households (created_by);
create index household_members_user_id_idx   on public.household_members (user_id);
create unique index categories_household_name_key on public.categories (household_id, lower(name));
create unique index merchants_household_name_key  on public.merchants (household_id, lower(name));
create index merchants_default_category_idx  on public.merchants (household_id, default_category_id);
create index expenses_household_spent_at_idx on public.expenses (household_id, spent_at desc);
create index expenses_category_idx           on public.expenses (household_id, category_id);
create index expenses_merchant_idx           on public.expenses (household_id, merchant_id);
create index expenses_paid_by_idx            on public.expenses (household_id, paid_by);
create index expenses_created_by_idx         on public.expenses (created_by);


-- ----------------------------------------------------------------------------
-- Funciones auxiliares
-- ----------------------------------------------------------------------------

-- Hogares del usuario actual. Es security definer para leer household_members
-- sin pasar por su propia política (evita la recursión) y se usa en las
-- políticas como `household_id in (select private.my_household_ids())`,
-- que Postgres evalúa una sola vez por consulta.
create function private.my_household_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select m.household_id
  from public.household_members m
  where m.user_id = (select auth.uid());
$$;

revoke all on function private.my_household_ids() from public;
grant execute on function private.my_household_ids() to authenticated;

-- Mantiene updated_at y no deja reescribir quién y cuándo creó el gasto.
create function private.expenses_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.created_by := old.created_by;
  new.created_at := old.created_at;
  new.updated_at := now();
  return new;
end;
$$;

create trigger expenses_before_update
  before update on public.expenses
  for each row execute function private.expenses_before_update();


-- ----------------------------------------------------------------------------
-- RPC: crear un hogar y unirse a uno
-- ----------------------------------------------------------------------------

-- Crea el hogar, suma al usuario como dueño y carga las categorías iniciales.
create function public.create_household(p_name text, p_display_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id      uuid := (select auth.uid());
  v_household_id uuid;
begin
  if v_user_id is null then
    raise exception 'Necesitás iniciar sesión' using errcode = '28000';
  end if;

  insert into public.households (name, created_by)
  values (trim(p_name), v_user_id)
  returning id into v_household_id;

  insert into public.household_members (household_id, user_id, display_name, role)
  values (v_household_id, v_user_id, trim(p_display_name), 'owner');

  insert into public.categories (household_id, name, icon, sort_order)
  values
    (v_household_id, 'Almacén / Supermercado', '🛒',  10),
    (v_household_id, 'Comidas',                '🍕',  20),
    (v_household_id, 'Servicios',              '💡',  30),
    (v_household_id, 'Alquiler / Expensas',    '🏢',  40),
    (v_household_id, 'Hogar',                  '🏠',  50),
    (v_household_id, 'Transporte',             '🚌',  60),
    (v_household_id, 'Salud / Farmacia',       '💊',  70),
    (v_household_id, 'Mascotas',               '🐾',  80),
    (v_household_id, 'Salidas',                '🎬',  90),
    (v_household_id, 'Otros',                  '📦', 100);

  return v_household_id;
end;
$$;

-- Suma al usuario actual al hogar del código. Si ya era miembro, no hace nada.
create function public.join_household(p_invite_code text, p_display_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id      uuid := (select auth.uid());
  v_household_id uuid;
begin
  if v_user_id is null then
    raise exception 'Necesitás iniciar sesión' using errcode = '28000';
  end if;

  select h.id into v_household_id
  from public.households h
  where h.invite_code = upper(trim(p_invite_code));

  if v_household_id is null then
    raise exception 'El código de invitación no existe' using errcode = 'P0002';
  end if;

  insert into public.household_members (household_id, user_id, display_name)
  values (v_household_id, v_user_id, trim(p_display_name))
  on conflict (household_id, user_id) do nothing;

  return v_household_id;
end;
$$;

revoke all on function public.create_household(text, text) from public, anon;
revoke all on function public.join_household(text, text)   from public, anon;
grant execute on function public.create_household(text, text) to authenticated;
grant execute on function public.join_household(text, text)   to authenticated;


-- ----------------------------------------------------------------------------
-- Vista: cuánto pagó cada miembro, por moneda. Es la base del saldo
-- ("quién le debe a quién"), que se calcula en packages/core.
-- security_invoker hace que respete las políticas de expenses.
-- ----------------------------------------------------------------------------
create view public.member_paid_totals
with (security_invoker = true)
as
select
  e.household_id,
  e.paid_by                   as user_id,
  e.currency,
  sum(e.amount_cents)::bigint as paid_cents,
  count(*)::integer           as expense_count
from public.expenses e
group by e.household_id, e.paid_by, e.currency;


-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
alter table public.households        enable row level security;
alter table public.household_members enable row level security;
alter table public.categories        enable row level security;
alter table public.merchants         enable row level security;
alter table public.expenses          enable row level security;

-- Hogares y miembros: desde el cliente solo se leen (el alta va por RPC).
create policy "Members can view their households"
  on public.households for select to authenticated
  using (id in (select private.my_household_ids()));

create policy "Members can view fellow members"
  on public.household_members for select to authenticated
  using (household_id in (select private.my_household_ids()));

-- Categorías: ver, agregar y editar. No se borran: se archivan.
create policy "Members can view categories"
  on public.categories for select to authenticated
  using (household_id in (select private.my_household_ids()));

create policy "Members can add categories"
  on public.categories for insert to authenticated
  with check (household_id in (select private.my_household_ids()));

create policy "Members can edit categories"
  on public.categories for update to authenticated
  using (household_id in (select private.my_household_ids()))
  with check (household_id in (select private.my_household_ids()));

-- Comercios: igual que las categorías.
create policy "Members can view merchants"
  on public.merchants for select to authenticated
  using (household_id in (select private.my_household_ids()));

create policy "Members can add merchants"
  on public.merchants for insert to authenticated
  with check (household_id in (select private.my_household_ids()));

create policy "Members can edit merchants"
  on public.merchants for update to authenticated
  using (household_id in (select private.my_household_ids()))
  with check (household_id in (select private.my_household_ids()));

-- Gastos: cualquier miembro del hogar los ve, carga, edita y borra.
create policy "Members can view expenses"
  on public.expenses for select to authenticated
  using (household_id in (select private.my_household_ids()));

create policy "Members can add expenses"
  on public.expenses for insert to authenticated
  with check (
    household_id in (select private.my_household_ids())
    and created_by = (select auth.uid())
  );

create policy "Members can edit expenses"
  on public.expenses for update to authenticated
  using (household_id in (select private.my_household_ids()))
  with check (household_id in (select private.my_household_ids()));

create policy "Members can delete expenses"
  on public.expenses for delete to authenticated
  using (household_id in (select private.my_household_ids()));

-- Sin sesión no se ve nada: además de las políticas, se le quita todo a anon.
revoke all on public.households, public.household_members, public.categories,
              public.merchants, public.expenses, public.member_paid_totals
  from anon;
