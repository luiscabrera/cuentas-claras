-- ============================================================================
-- Datos de prueba para desarrollo local (`pnpm db:reset`). NO se usan en producción.
--
-- Usuarios (contraseña para los dos: cuentas-claras):
--   pomelo@example.com · trufa@example.com
-- Hogar "Casa" con código de invitación CA5A000001 y gastos de este mes y del anterior.
-- Las fechas son relativas a hoy, así que siempre hay datos "frescos".
-- ============================================================================

do $$
declare
  v_pomelo    uuid := '9f0c1d2e-3a4b-4c5d-8e6f-7a8b9c0d1e01';
  v_trufa     uuid := '9f0c1d2e-3a4b-4c5d-8e6f-7a8b9c0d1e02';
  v_household uuid;
  v_user      record;
begin
  -- Usuarios de Supabase Auth (con email confirmado)
  for v_user in
    select * from (values (v_pomelo, 'pomelo@example.com'), (v_trufa, 'trufa@example.com')) as u(id, email)
  loop
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change, email_change_token_new,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user.id, 'authenticated', 'authenticated',
      v_user.email, extensions.crypt('cuentas-claras', extensions.gen_salt('bf')), now(),
      '{"provider": "email", "providers": ["email"]}', '{}', now(), now(),
      '', '', '', '', '', '', '', ''
    );

    insert into auth.identities (
      id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), v_user.id, v_user.id::text,
      jsonb_build_object('sub', v_user.id::text, 'email', v_user.email, 'email_verified', true),
      'email', now(), now(), now()
    );
  end loop;

  -- Pomelo crea el hogar y Trufa se une, por los mismos RPC que usa la app.
  perform set_config('request.jwt.claims', json_build_object('sub', v_pomelo, 'role', 'authenticated')::text, true);
  v_household := public.create_household('Casa', 'Pomelo');
  update public.households set invite_code = 'CA5A000001' where id = v_household;

  perform set_config('request.jwt.claims', json_build_object('sub', v_trufa, 'role', 'authenticated')::text, true);
  perform public.join_household('CA5A000001', 'Trufa');

  perform set_config('request.jwt.claims', '', true);

  -- Comercios, con su categoría por defecto
  insert into public.merchants (household_id, name, default_category_id)
  select v_household, m.name, c.id
  from (values
    ('Coto', 'Almacén / Supermercado'),
    ('Chino de la esquina', 'Almacén / Supermercado'),
    ('Verdulería', 'Almacén / Supermercado'),
    ('Carnicería', 'Almacén / Supermercado'),
    ('Rappi', 'Comidas'),
    ('Edesur', 'Servicios'),
    ('Metrogas', 'Servicios'),
    ('Farmacity', 'Salud / Farmacia'),
    ('Pet shop', 'Mascotas')
  ) as m(name, category)
  join public.categories c on c.household_id = v_household and c.name = m.category;

  -- Gastos: monto en pesos, categoría, comercio, quién pagó, hace cuánto y nota
  insert into public.expenses (
    household_id, amount_cents, category_id, merchant_id, paid_by, created_by, spent_at, note
  )
  select
    v_household, (g.pesos * 100)::bigint, c.id, m.id, g.paid_by, g.paid_by,
    date_trunc('minute', now()) - g.ago, g.note
  from (values
    (48250,  'Almacén / Supermercado', 'Coto',                v_pomelo, interval '2 hours',              null),
    (3100,   'Almacén / Supermercado', 'Chino de la esquina', v_trufa,  interval '5 hours',              'Pan y leche'),
    (21400,  'Comidas',                'Rappi',               v_trufa,  interval '1 day 3 hours',        'Sushi'),
    (12800,  'Almacén / Supermercado', 'Verdulería',          v_pomelo, interval '2 days 4 hours',       null),
    (38900,  'Servicios',              'Edesur',              v_pomelo, interval '3 days 1 hour',        'Luz'),
    (26750,  'Servicios',              'Metrogas',            v_trufa,  interval '4 days 6 hours',       'Gas'),
    (19300,  'Mascotas',               'Pet shop',            v_trufa,  interval '5 days 2 hours',       'Alimento para Pomelo y Trufa'),
    (15600,  'Almacén / Supermercado', 'Carnicería',          v_pomelo, interval '6 days 5 hours',       null),
    (8900,   'Salud / Farmacia',       'Farmacity',           v_trufa,  interval '8 days 3 hours',       null),
    (9500,   'Salidas',                null,                  v_pomelo, interval '9 days 2 hours',       'Cine'),
    (210000, 'Alquiler / Expensas',    null,                  v_pomelo, interval '10 days',              'Expensas'),
    (52300,  'Almacén / Supermercado', 'Coto',                v_trufa,  interval '33 days 4 hours',      null),
    (18700,  'Comidas',                'Rappi',               v_pomelo, interval '36 days 2 hours',      null),
    (36100,  'Servicios',              'Edesur',              v_trufa,  interval '40 days 1 hour',       'Luz')
  ) as g(pesos, category, merchant, paid_by, ago, note)
  join public.categories c on c.household_id = v_household and c.name = g.category
  left join public.merchants m on m.household_id = v_household and m.name = g.merchant;
end;
$$;
