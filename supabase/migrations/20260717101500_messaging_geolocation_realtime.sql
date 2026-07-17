set search_path to recyclapp_schema, public;

alter table "d_usuario"
  add column if not exists "id_usuario_auth" uuid;

create unique index if not exists "d_usuario_id_usuario_auth_key"
  on "d_usuario" ("id_usuario_auth");

create table if not exists "t_conversacion" (
  "id_conversacion" uuid not null default gen_random_uuid(),
  "id_publicacion" uuid,
  "id_usuario_creador" uuid not null,
  "asunto" varchar(160) not null,
  "estado" varchar(30) not null default 'ABIERTA',
  "fecha_creacion" timestamp(3) not null default current_timestamp,
  "fecha_actualizacion" timestamp(3) not null default current_timestamp,
  constraint "t_conversacion_pkey" primary key ("id_conversacion"),
  constraint "t_conversacion_id_publicacion_fkey"
    foreign key ("id_publicacion")
    references "d_publicacion" ("id_publicacion")
    on delete cascade
    on update cascade,
  constraint "t_conversacion_id_usuario_creador_fkey"
    foreign key ("id_usuario_creador")
    references "d_usuario" ("id_usuario")
    on delete cascade
    on update cascade
);

create index if not exists "t_conversacion_id_publicacion_fecha_creacion_idx"
  on "t_conversacion" ("id_publicacion", "fecha_creacion");

create index if not exists "t_conversacion_id_usuario_creador_fecha_creacion_idx"
  on "t_conversacion" ("id_usuario_creador", "fecha_creacion");

create table if not exists "r_conversacion_participante" (
  "id_conversacion_participante" uuid not null default gen_random_uuid(),
  "id_conversacion" uuid not null,
  "id_usuario" uuid not null,
  "fecha_union" timestamp(3) not null default current_timestamp,
  "fecha_ultima_lectura" timestamp(3),
  "silenciado" boolean not null default false,
  constraint "r_conversacion_participante_pkey" primary key ("id_conversacion_participante"),
  constraint "r_conversacion_participante_id_conversacion_fkey"
    foreign key ("id_conversacion")
    references "t_conversacion" ("id_conversacion")
    on delete cascade
    on update cascade,
  constraint "r_conversacion_participante_id_usuario_fkey"
    foreign key ("id_usuario")
    references "d_usuario" ("id_usuario")
    on delete cascade
    on update cascade,
  constraint "r_conversacion_participante_id_conversacion_id_usuario_key"
    unique ("id_conversacion", "id_usuario")
);

create index if not exists "r_conversacion_participante_id_usuario_fecha_ultima_lectura_idx"
  on "r_conversacion_participante" ("id_usuario", "fecha_ultima_lectura");

create table if not exists "t_mensaje_chat" (
  "id_mensaje_chat" uuid not null default gen_random_uuid(),
  "id_conversacion" uuid not null,
  "id_usuario_emisor" uuid not null,
  "tipo_mensaje" varchar(20) not null default 'TEXT',
  "contenido" text,
  "latitud" decimal(9, 6),
  "longitud" decimal(9, 6),
  "precision_metros" decimal(10, 2),
  "etiqueta_ubicacion" varchar(160),
  "fecha_creacion" timestamp(3) not null default current_timestamp,
  "fecha_actualizacion" timestamp(3) not null default current_timestamp,
  constraint "t_mensaje_chat_pkey" primary key ("id_mensaje_chat"),
  constraint "t_mensaje_chat_id_conversacion_fkey"
    foreign key ("id_conversacion")
    references "t_conversacion" ("id_conversacion")
    on delete cascade
    on update cascade,
  constraint "t_mensaje_chat_id_usuario_emisor_fkey"
    foreign key ("id_usuario_emisor")
    references "d_usuario" ("id_usuario")
    on delete cascade
    on update cascade
);

create index if not exists "t_mensaje_chat_id_conversacion_fecha_creacion_idx"
  on "t_mensaje_chat" ("id_conversacion", "fecha_creacion");

create index if not exists "t_mensaje_chat_id_usuario_emisor_fecha_creacion_idx"
  on "t_mensaje_chat" ("id_usuario_emisor", "fecha_creacion");

create table if not exists "d_ubicacion_usuario_actual" (
  "id_usuario" uuid not null,
  "latitud" decimal(9, 6) not null,
  "longitud" decimal(9, 6) not null,
  "precision_metros" decimal(10, 2),
  "fecha_captura" timestamp(3) not null,
  "fuente" varchar(30) not null default 'ACCESS',
  "id_conversacion_compartida" uuid,
  "fecha_creacion" timestamp(3) not null default current_timestamp,
  "fecha_actualizacion" timestamp(3) not null default current_timestamp,
  constraint "d_ubicacion_usuario_actual_pkey" primary key ("id_usuario"),
  constraint "d_ubicacion_usuario_actual_id_usuario_fkey"
    foreign key ("id_usuario")
    references "d_usuario" ("id_usuario")
    on delete cascade
    on update cascade,
  constraint "d_ubicacion_usuario_actual_id_conversacion_compartida_fkey"
    foreign key ("id_conversacion_compartida")
    references "t_conversacion" ("id_conversacion")
    on delete set null
    on update cascade
);

create index if not exists "d_ubicacion_usuario_actual_fecha_captura_idx"
  on "d_ubicacion_usuario_actual" ("fecha_captura");

create index if not exists "d_ubicacion_usuario_actual_id_conversacion_compartida_idx"
  on "d_ubicacion_usuario_actual" ("id_conversacion_compartida");

create or replace function recyclapp_schema.set_fecha_actualizacion()
returns trigger
language plpgsql
as $$
begin
  new."fecha_actualizacion" = current_timestamp;
  return new;
end;
$$;

drop trigger if exists "set_t_conversacion_fecha_actualizacion" on "t_conversacion";
create trigger "set_t_conversacion_fecha_actualizacion"
before update on "t_conversacion"
for each row
execute function recyclapp_schema.set_fecha_actualizacion();

drop trigger if exists "set_t_mensaje_chat_fecha_actualizacion" on "t_mensaje_chat";
create trigger "set_t_mensaje_chat_fecha_actualizacion"
before update on "t_mensaje_chat"
for each row
execute function recyclapp_schema.set_fecha_actualizacion();

drop trigger if exists "set_d_ubicacion_usuario_actual_fecha_actualizacion" on "d_ubicacion_usuario_actual";
create trigger "set_d_ubicacion_usuario_actual_fecha_actualizacion"
before update on "d_ubicacion_usuario_actual"
for each row
execute function recyclapp_schema.set_fecha_actualizacion();

create or replace function recyclapp_schema.current_app_user_id()
returns uuid
language sql
stable
security definer
set search_path = recyclapp_schema, public
as $$
  select u."id_usuario"
  from recyclapp_schema."d_usuario" u
  where u."id_usuario_auth" = (select auth.uid())
    and u."activo" = true
  limit 1;
$$;

create or replace function recyclapp_schema.user_can_access_conversation(target_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = recyclapp_schema, public
as $$
  select exists (
    select 1
    from recyclapp_schema."r_conversacion_participante" p
    where p."id_conversacion" = target_conversation_id
      and p."id_usuario" = recyclapp_schema.current_app_user_id()
  );
$$;

create or replace function recyclapp_schema.users_share_conversation(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = recyclapp_schema, public
as $$
  select exists (
    select 1
    from recyclapp_schema."r_conversacion_participante" own_participation
    join recyclapp_schema."r_conversacion_participante" target_participation
      on target_participation."id_conversacion" = own_participation."id_conversacion"
    where own_participation."id_usuario" = recyclapp_schema.current_app_user_id()
      and target_participation."id_usuario" = target_user_id
  );
$$;

grant execute on function recyclapp_schema.current_app_user_id() to authenticated, service_role;
grant execute on function recyclapp_schema.user_can_access_conversation(uuid) to authenticated, service_role;
grant execute on function recyclapp_schema.users_share_conversation(uuid) to authenticated, service_role;

grant select, insert on table recyclapp_schema."t_conversacion" to authenticated, service_role;
grant select, update on table recyclapp_schema."r_conversacion_participante" to authenticated, service_role;
grant select, insert on table recyclapp_schema."t_mensaje_chat" to authenticated, service_role;
grant select, insert, update on table recyclapp_schema."d_ubicacion_usuario_actual" to authenticated, service_role;

revoke all on table recyclapp_schema."t_conversacion" from anon;
revoke all on table recyclapp_schema."r_conversacion_participante" from anon;
revoke all on table recyclapp_schema."t_mensaje_chat" from anon;
revoke all on table recyclapp_schema."d_ubicacion_usuario_actual" from anon;

alter table recyclapp_schema."t_conversacion" enable row level security;
alter table recyclapp_schema."r_conversacion_participante" enable row level security;
alter table recyclapp_schema."t_mensaje_chat" enable row level security;
alter table recyclapp_schema."d_ubicacion_usuario_actual" enable row level security;

create policy "participants can read own conversations"
on recyclapp_schema."t_conversacion"
for select
to authenticated
using (recyclapp_schema.user_can_access_conversation("id_conversacion"));

create policy "participants can create conversations they start"
on recyclapp_schema."t_conversacion"
for insert
to authenticated
with check ("id_usuario_creador" = recyclapp_schema.current_app_user_id());

create policy "participants can read own memberships"
on recyclapp_schema."r_conversacion_participante"
for select
to authenticated
using ("id_usuario" = recyclapp_schema.current_app_user_id());

create policy "participants can update own read state"
on recyclapp_schema."r_conversacion_participante"
for update
to authenticated
using ("id_usuario" = recyclapp_schema.current_app_user_id())
with check ("id_usuario" = recyclapp_schema.current_app_user_id());

create policy "conversation members can read messages"
on recyclapp_schema."t_mensaje_chat"
for select
to authenticated
using (recyclapp_schema.user_can_access_conversation("id_conversacion"));

create policy "conversation members can insert their own messages"
on recyclapp_schema."t_mensaje_chat"
for insert
to authenticated
with check (
  "id_usuario_emisor" = recyclapp_schema.current_app_user_id()
  and recyclapp_schema.user_can_access_conversation("id_conversacion")
  and (
    ("tipo_mensaje" = 'TEXT' and nullif(trim(coalesce("contenido", '')), '') is not null)
    or ("tipo_mensaje" = 'LOCATION' and "latitud" is not null and "longitud" is not null)
    or ("tipo_mensaje" = 'SYSTEM')
  )
);

create policy "users can read own location or shared peers"
on recyclapp_schema."d_ubicacion_usuario_actual"
for select
to authenticated
using (
  "id_usuario" = recyclapp_schema.current_app_user_id()
  or recyclapp_schema.users_share_conversation("id_usuario")
);

create policy "users can insert own last location"
on recyclapp_schema."d_ubicacion_usuario_actual"
for insert
to authenticated
with check (
  "id_usuario" = recyclapp_schema.current_app_user_id()
  and (
    "id_conversacion_compartida" is null
    or recyclapp_schema.user_can_access_conversation("id_conversacion_compartida")
  )
);

create policy "users can update own last location"
on recyclapp_schema."d_ubicacion_usuario_actual"
for update
to authenticated
using ("id_usuario" = recyclapp_schema.current_app_user_id())
with check (
  "id_usuario" = recyclapp_schema.current_app_user_id()
  and (
    "id_conversacion_compartida" is null
    or recyclapp_schema.user_can_access_conversation("id_conversacion_compartida")
  )
);

create policy "conversation members can receive presence"
on realtime."messages"
for select
to authenticated
using (
  exists (
    select 1
    from recyclapp_schema."r_conversacion_participante" p
    where p."id_usuario" = recyclapp_schema.current_app_user_id()
      and ('conversation:' || p."id_conversacion"::text) = realtime.topic()
      and realtime."messages"."extension" in ('presence', 'broadcast')
  )
);

create policy "conversation members can send presence"
on realtime."messages"
for insert
to authenticated
with check (
  exists (
    select 1
    from recyclapp_schema."r_conversacion_participante" p
    where p."id_usuario" = recyclapp_schema.current_app_user_id()
      and ('conversation:' || p."id_conversacion"::text) = realtime.topic()
      and realtime."messages"."extension" in ('presence', 'broadcast')
  )
);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'recyclapp_schema'
      and tablename = 't_mensaje_chat'
  ) then
    execute 'alter publication supabase_realtime add table recyclapp_schema."t_mensaje_chat"';
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'recyclapp_schema'
      and tablename = 'd_ubicacion_usuario_actual'
  ) then
    execute 'alter publication supabase_realtime add table recyclapp_schema."d_ubicacion_usuario_actual"';
  end if;
end $$;
