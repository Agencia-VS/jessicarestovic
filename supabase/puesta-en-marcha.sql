-- ---------------------------------------------------------------------------
-- Puesta en marcha completa de la base de datos
--
-- Junta las migraciones de supabase/migrations/ en orden, para pegarlo de una
-- sola vez en el SQL Editor de Supabase.
--
-- Se puede volver a correr sin romper nada: las tablas, índices y triggers son
-- idempotentes, las inserciones usan on conflict do nothing y las políticas se
-- borran antes de crearse.
--
-- GENERADO — no editar a mano. Editar las migraciones y correr:
--   npm run sql
-- ---------------------------------------------------------------------------

-- ===========================================================================
-- 0001_schema.sql
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Modelo de contenido de jessicarestovic.com
--
-- Tres entidades de contenido, según el brief (§05 «Modelo de contenido»):
--   obra         cada pieza individual, opcionalmente dentro de una exposición
--   exposicion   un hito de la trayectoria, con sus fotos de sala
--   mensaje      cada envío de los formularios de Contacto o Clases
--
-- Y una tabla de contenido editable (`pagina`) para los textos de «Sobre mí»
-- y «Clases», que Jessica administra desde el panel pero no son colecciones.
-- ---------------------------------------------------------------------------

create extension if not exists "pgcrypto";

-- Toca `actualizado_en` en cada update. Se reutiliza en todas las tablas.
create or replace function public.touch_actualizado_en()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- obra
--
-- `imagen_ancho` / `imagen_alto` se guardan al subir la foto para poder
-- reservar el espacio exacto en la retícula sin recortar la obra (§08).
-- ---------------------------------------------------------------------------
create table if not exists public.obra (
  id            uuid primary key default gen_random_uuid(),
  titulo        text not null,
  exposicion_id uuid,
  conjunto      text,
  anio          integer,
  tecnica       text,
  dimensiones   text,
  imagen_path   text not null,
  imagen_alt    text not null,
  imagen_ancho  integer,
  imagen_alto   integer,
  destacada     boolean not null default false,
  publicada     boolean not null default true,
  orden         integer not null default 0,
  creado_en     timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  constraint obra_titulo_no_vacio check (length(btrim(titulo)) > 0),
  constraint obra_conjunto_no_vacio check (conjunto is null or length(btrim(conjunto)) > 0),
  -- El texto alternativo es obligatorio: accesibilidad y SEO (§06).
  constraint obra_alt_no_vacio check (length(btrim(imagen_alt)) > 0),
  constraint obra_anio_plausible check (anio is null or (anio between 1900 and 2100)),
  constraint obra_dimensiones_imagen check (
    (imagen_ancho is null and imagen_alto is null)
    or (imagen_ancho > 0 and imagen_alto > 0)
  )
);

create index if not exists obra_exposicion_orden_idx on public.obra (exposicion_id, orden, creado_en);
create index if not exists obra_destacada_idx on public.obra (orden) where destacada and publicada;
create index if not exists obra_publicada_idx on public.obra (publicada);

create or replace trigger obra_touch
  before update on public.obra
  for each row execute function public.touch_actualizado_en();

-- ---------------------------------------------------------------------------
-- exposicion
-- ---------------------------------------------------------------------------
create table if not exists public.exposicion (
  id            uuid primary key default gen_random_uuid(),
  titulo        text not null,
  slug          text not null unique,
  lugar         text,
  anio          integer,
  descripcion   text,
  publicada     boolean not null default true,
  orden         integer not null default 0,
  creado_en     timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  constraint exposicion_titulo_no_vacio check (length(btrim(titulo)) > 0),
  constraint exposicion_anio_plausible check (anio is null or (anio between 1900 and 2100))
);

-- El orden editorial lo fija Jessica; el año es un dato, no el criterio de
-- ordenación del listado (§05).
create index if not exists exposicion_orden_idx on public.exposicion (orden, creado_en);

create or replace trigger exposicion_touch
  before update on public.exposicion
  for each row execute function public.touch_actualizado_en();

do $$
begin
  alter table public.obra
    add constraint obra_exposicion_id_fkey
    foreign key (exposicion_id) references public.exposicion (id) on delete set null;
exception
  when duplicate_object then null;
end $$;

-- Fotos de sala / montaje de cada exposición.
create table if not exists public.exposicion_foto (
  id            uuid primary key default gen_random_uuid(),
  exposicion_id uuid not null references public.exposicion (id) on delete cascade,
  imagen_path   text not null,
  imagen_alt    text not null,
  orden         integer not null default 0,
  creado_en     timestamptz not null default now(),
  constraint exposicion_foto_alt_no_vacio check (length(btrim(imagen_alt)) > 0)
);

create index if not exists exposicion_foto_orden_idx on public.exposicion_foto (exposicion_id, orden);

-- ---------------------------------------------------------------------------
-- mensaje
-- ---------------------------------------------------------------------------
do $$
begin
  create type public.mensaje_origen as enum ('contacto', 'clases');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.mensaje (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null,
  email         text not null,
  telefono      text,
  mensaje       text not null,
  origen        public.mensaje_origen not null,
  leido         boolean not null default false,
  creado_en     timestamptz not null default now(),
  constraint mensaje_nombre_no_vacio check (length(btrim(nombre)) > 0),
  constraint mensaje_texto_no_vacio check (length(btrim(mensaje)) > 0),
  constraint mensaje_email_plausible check (email ~* '^[^@\s]+@[^@\s.]+\.[^@\s]+$')
);

create index if not exists mensaje_bandeja_idx on public.mensaje (leido, creado_en desc);

-- ---------------------------------------------------------------------------
-- pagina — contenido editable de «Sobre mí» y «Clases»
-- ---------------------------------------------------------------------------
create table if not exists public.pagina (
  clave         text primary key,
  contenido     jsonb not null default '{}'::jsonb,
  actualizado_en timestamptz not null default now(),
  constraint pagina_clave_conocida check (clave in ('sobre-mi', 'clases'))
);

create or replace trigger pagina_touch
  before update on public.pagina
  for each row execute function public.touch_actualizado_en();

-- ===========================================================================
-- 0002_rls_storage.sql
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Seguridad y almacenamiento
--
-- Regla general (§07 «Acceso»): no hay registro público. El sitio público lee
-- solo contenido publicado; el panel exige sesión. Los formularios de Contacto
-- y Clases son la única escritura que puede hacer un visitante anónimo.
-- ---------------------------------------------------------------------------

alter table public.obra             enable row level security;
alter table public.exposicion       enable row level security;
alter table public.exposicion_foto  enable row level security;
alter table public.mensaje          enable row level security;
alter table public.pagina           enable row level security;

-- --- Lectura pública -------------------------------------------------------

drop policy if exists "obra publicada visible para todos" on public.obra;
create policy "obra publicada visible para todos"
  on public.obra for select
  to anon, authenticated
  using (publicada or auth.role() = 'authenticated');

drop policy if exists "exposicion publicada visible para todos" on public.exposicion;
create policy "exposicion publicada visible para todos"
  on public.exposicion for select
  to anon, authenticated
  using (publicada or auth.role() = 'authenticated');

drop policy if exists "fotos de exposicion publicada visibles para todos" on public.exposicion_foto;
create policy "fotos de exposicion publicada visibles para todos"
  on public.exposicion_foto for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.exposicion e
      where e.id = exposicion_id
        and (e.publicada or auth.role() = 'authenticated')
    )
  );

drop policy if exists "pagina visible para todos" on public.pagina;
create policy "pagina visible para todos"
  on public.pagina for select
  to anon, authenticated
  using (true);

-- --- Escritura: solo con sesión --------------------------------------------
-- Una política `for all` por tabla cubre insert / update / delete del panel.

drop policy if exists "obra administrable con sesion" on public.obra;
create policy "obra administrable con sesion"
  on public.obra for all
  to authenticated
  using (true) with check (true);

drop policy if exists "exposicion administrable con sesion" on public.exposicion;
create policy "exposicion administrable con sesion"
  on public.exposicion for all
  to authenticated
  using (true) with check (true);

drop policy if exists "fotos de exposicion administrables con sesion" on public.exposicion_foto;
create policy "fotos de exposicion administrables con sesion"
  on public.exposicion_foto for all
  to authenticated
  using (true) with check (true);

drop policy if exists "pagina administrable con sesion" on public.pagina;
create policy "pagina administrable con sesion"
  on public.pagina for all
  to authenticated
  using (true) with check (true);

-- --- Mensajes --------------------------------------------------------------
-- Cualquiera puede enviar un mensaje; solo Jessica puede leerlos o marcarlos.

drop policy if exists "cualquiera puede enviar un mensaje" on public.mensaje;
create policy "cualquiera puede enviar un mensaje"
  on public.mensaje for insert
  to anon, authenticated
  with check (true);

drop policy if exists "mensajes visibles solo con sesion" on public.mensaje;
create policy "mensajes visibles solo con sesion"
  on public.mensaje for select
  to authenticated
  using (true);

drop policy if exists "mensajes actualizables solo con sesion" on public.mensaje;
create policy "mensajes actualizables solo con sesion"
  on public.mensaje for update
  to authenticated
  using (true) with check (true);

drop policy if exists "mensajes eliminables solo con sesion" on public.mensaje;
create policy "mensajes eliminables solo con sesion"
  on public.mensaje for delete
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- Storage: un bucket público para las imágenes de obras y exposiciones.
-- Lectura abierta (las fotos se sirven en el sitio); subida y borrado solo
-- con sesión.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'obras',
  'obras',
  true,
  16777216, -- 16 MB: el máximo de la spec de imágenes es 15 MB (§08)
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "imagenes de obras visibles para todos" on storage.objects;
create policy "imagenes de obras visibles para todos"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'obras');

drop policy if exists "subir imagenes con sesion" on storage.objects;
create policy "subir imagenes con sesion"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'obras');

drop policy if exists "reemplazar imagenes con sesion" on storage.objects;
create policy "reemplazar imagenes con sesion"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'obras') with check (bucket_id = 'obras');

drop policy if exists "borrar imagenes con sesion" on storage.objects;
create policy "borrar imagenes con sesion"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'obras');

-- ===========================================================================
-- 0003_contenido_inicial.sql
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Contenido inicial
--
-- Las exposiciones vienen de la auditoría de jessicarestovic.com (§03 del
-- brief): son los datos reales que hoy están repartidos en 15 páginas de Wix,
-- ya normalizados en el modelo nuevo.
--
-- Los textos de «Sobre mí» y «Clases» quedan como marcadores: hay que
-- reemplazarlos por los textos reales de Jessica desde el panel.
-- ---------------------------------------------------------------------------

insert into public.exposicion (titulo, slug, lugar, anio, descripcion, orden) values
  ('Fundación Guayasamín', 'fundacion-guayasamin', 'Quito, Ecuador', null,
   'Dos obras de 1,6 × 1,6 m, óleo sobre tela.', 1),
  ('Sur', 'sur', null, null,
   'Serie en grafito sobre tela inspirada en la Patagonia.', 2),
  ('Ensambles al Cubo', 'ensambles-al-cubo', null, null, null, 3),
  ('De lo residual y lo efímero', 'de-lo-residual-y-lo-efimero', null, null,
   'Huellas del tiempo sobre distintas superficies.', 4),
  ('De lo precario', 'de-lo-precario', null, null,
   'Materiales simples y frágiles como lenguaje.', 5),
  ('Volúmenes', 'volumenes', 'Feria La Porfía', 2013, null, 6),
  ('A partir de lo simple', 'a-partir-de-lo-simple', null, null,
   'Documentación de proceso: obra en curso y obra terminada.', 7)
on conflict (slug) do nothing;

-- «Sobre mí»: el retrato y la biografía se cargan desde el panel.
insert into public.pagina (clave, contenido) values (
  'sobre-mi',
  jsonb_build_object(
    'titulo', 'Sobre mí',
    'biografia', E'Reemplazar por la biografía de Jessica. El texto que hoy está en /about del sitio en Wix sirve casi tal cual.',
    'cita', 'Un trabajo obsesivo en que el tiempo y el ritmo pausado del hacer es el gestor de espacios íntimos.',
    'retrato_path', null,
    'retrato_alt', null
  )
)
on conflict (clave) do nothing;

-- «Clases»: talleres en su taller, máximo 3 personas (§03, /clases).
insert into public.pagina (clave, contenido) values (
  'clases',
  jsonb_build_object(
    'titulo', 'Clases',
    'introduccion', E'Talleres en mi taller, en grupos de máximo tres personas. Escríbeme y conversamos qué te interesa aprender.',
    'tecnicas', jsonb_build_array('Acuarela', 'Monocopia', 'Dibujo'),
    'nota', 'Cupos limitados: máximo 3 personas por taller.'
  )
)
on conflict (clave) do nothing;

-- ===========================================================================
-- 0004_configuracion.sql
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Configuración editable desde el panel
--
-- El correo, el teléfono, el Instagram y la cita de portada estaban fijos en
-- el código: cambiarlos exigía un desarrollador y un despliegue. Pasan a ser
-- contenido, como el resto.
--
-- Reutiliza la tabla `pagina`: es el mismo patrón de «un documento con forma
-- libre», así que solo hay que admitir la clave nueva.
-- ---------------------------------------------------------------------------

alter table public.pagina drop constraint if exists pagina_clave_conocida;

alter table public.pagina
  add constraint pagina_clave_conocida
  check (clave in ('sobre-mi', 'clases', 'configuracion'));

-- El teléfono se guarda tal como se lee; el enlace de WhatsApp se arma solo a
-- partir de sus dígitos. El Instagram se guarda como usuario, sin la URL.
insert into public.pagina (clave, contenido) values (
  'configuracion',
  jsonb_build_object(
    'email', 'jessicarestoviclucic@gmail.com',
    'telefono', '+56 9 8747 2258',
    'instagram', '@jessica_restovic',
    'cita', 'Un trabajo obsesivo en que el tiempo y el ritmo pausado del hacer es el gestor de espacios íntimos.'
  )
)
on conflict (clave) do nothing;

-- ===========================================================================
-- 0005_medidas_fotos_sala.sql
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Medidas de las fotos de sala y descripciones enriquecidas de «Clases».
-- ---------------------------------------------------------------------------

alter table public.exposicion_foto
  add column if not exists imagen_ancho integer,
  add column if not exists imagen_alto integer;

-- Una foto cargada a medias no puede reservar una proporción válida. Las
-- filas antiguas se consideran sin medidas y quedan listas para completar en
-- una edición posterior.
update public.exposicion_foto
set imagen_ancho = null,
    imagen_alto = null
where (imagen_ancho is null) <> (imagen_alto is null);

alter table public.exposicion_foto
  drop constraint if exists exposicion_foto_dimensiones_imagen;

alter table public.exposicion_foto
  add constraint exposicion_foto_dimensiones_imagen check (
    (imagen_ancho is null and imagen_alto is null)
    or (imagen_ancho > 0 and imagen_alto > 0)
  );

update public.pagina
set contenido = jsonb_set(
  contenido,
  '{tecnicas}',
  jsonb_build_array(
    'Acuarela — Papel, aguadas, transparencia',
    'Monocopia — Impresión única sobre placa',
    'Dibujo — Grafito y carboncillo del natural'
  )
)
where clave = 'clases'
  and contenido -> 'tecnicas' = jsonb_build_array('Acuarela', 'Monocopia', 'Dibujo');

-- ===========================================================================
-- 0006_conjuntos_de_trabajo.sql
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Conjuntos de trabajo
--
-- Un conjunto de trabajos y una exposición son la misma cosa —un grupo de
-- obras con nombre—; la diferencia es que la exposición tuvo sala, con su
-- lugar, su año y sus vistas de montaje. Así que comparten tabla y se
-- distinguen por `tipo`, en vez de duplicar la entidad, sus políticas y su
-- formulario.
--
-- El sitio los muestra en dos pestañas: «Exposiciones» lista las muestras y
-- «Trabajos» los conjuntos —«Trabajos recientes», «Ilustraciones en
-- Acuarela»—, cada uno con su conteo de imágenes.
-- ---------------------------------------------------------------------------

alter table public.exposicion
  add column if not exists tipo text not null default 'exposicion';

alter table public.exposicion drop constraint if exists exposicion_tipo_conocido;

alter table public.exposicion
  add constraint exposicion_tipo_conocido check (tipo in ('exposicion', 'trabajo'));

-- Cada pestaña lee su tipo en el orden editorial que fijó Jessica.
create index if not exists exposicion_tipo_orden_idx
  on public.exposicion (tipo, orden, creado_en);

-- «Trabajos recientes» deja de ser una página que junta todo y pasa a ser un
-- conjunto como cualquier otro. Se crea acá para que la pestaña tenga dónde
-- caer, y para que las obras que hoy no pertenecen a ninguna muestra —las que
-- se veían en esa página— sigan teniendo una casa en el sitio en vez de
-- quedar invisibles.
insert into public.exposicion (titulo, slug, tipo, publicada, orden)
select
  'Trabajos recientes',
  'trabajos-recientes',
  'trabajo',
  true,
  coalesce((select max(orden) from public.exposicion), 0) + 1
where not exists (
  select 1 from public.exposicion where slug = 'trabajos-recientes'
);

update public.obra
set exposicion_id = (
  select id from public.exposicion where slug = 'trabajos-recientes'
)
where exposicion_id is null;

-- ===========================================================================
-- 0007_grilla_orden.sql
-- ===========================================================================

-- Encuadre de miniaturas; nunca modifica los originales.
alter table public.exposicion add column if not exists portada_foco_x integer not null default 50 check (portada_foco_x between 0 and 100);
alter table public.exposicion add column if not exists portada_foco_y integer not null default 50 check (portada_foco_y between 0 and 100);

create or replace function public.reordenar_grupos(p_ids uuid[], p_tipo text)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  if auth.uid() is null or p_tipo is null or p_tipo not in ('exposicion','trabajo') then
    raise exception 'No autorizado';
  end if;
  lock table public.exposicion in share row exclusive mode;
  if p_ids is null or cardinality(p_ids) = 0 or cardinality(p_ids) > 2000 or
    cardinality(p_ids) <> (select count(distinct id) from unnest(p_ids) id) or
    cardinality(p_ids) <> (select count(*) from public.exposicion where tipo = p_tipo) or
    exists (select 1 from unnest(p_ids) as entrada(id) where not exists (
      select 1 from public.exposicion e where e.id = entrada.id and e.tipo = p_tipo
    )) then raise exception 'La lista cambió; recarga el panel'; end if;
  update public.exposicion e set orden = posiciones.pos
    from unnest(p_ids) with ordinality as posiciones(id, pos)
    where e.id = posiciones.id and e.tipo = p_tipo;
end;
$$;
revoke all on function public.reordenar_grupos(uuid[], text) from public, anon;
grant execute on function public.reordenar_grupos(uuid[], text) to authenticated;

-- ===========================================================================
-- 0008_contactos_metricas.sql
-- ===========================================================================

-- Acceso explícito al nuevo módulo: habilitar la cuenta desde SQL (ver docs).
create table if not exists public.admin_comercial (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.admin_comercial enable row level security;
revoke all on public.admin_comercial from anon, authenticated;
create or replace function public.es_admin_comercial() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.admin_comercial where user_id = auth.uid());
$$;
revoke all on function public.es_admin_comercial() from public, anon;
grant execute on function public.es_admin_comercial() to authenticated;

create table if not exists public.contacto_lead (
  id uuid primary key,
  nombre text not null check (char_length(nombre) between 2 and 100),
  email text not null check (char_length(email) <= 254),
  motivo text not null check (motivo in ('obra','precio','colaboracion','otra')),
  grupo_id uuid references public.exposicion(id) on delete set null,
  novedades boolean not null default false,
  estado text not null default 'nuevo' check (estado in ('nuevo','contactado','conversacion','cerrado')),
  baja_hash text not null unique,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
create table if not exists public.consentimiento_contacto (
  id uuid primary key default gen_random_uuid(),
  contacto_id uuid not null references public.contacto_lead(id) on delete cascade,
  finalidad text not null check (finalidad in ('guardar_contacto','novedades_email')),
  otorgado boolean not null,
  version text not null,
  creado_en timestamptz not null default now()
);
create table if not exists public.preferencia_analitica (
  id uuid primary key,
  aceptada boolean not null,
  version text not null,
  creado_en timestamptz not null default now()
);
create table if not exists public.evento_web (
  id uuid primary key,
  sesion_id uuid not null,
  consentimiento_id uuid not null references public.preferencia_analitica(id) on delete cascade,
  evento text not null check (evento in ('pagina','whatsapp','email','instagram','contacto')),
  ruta text not null check (char_length(ruta) <= 180),
  origen text not null check (origen in ('directo','instagram','google','facebook','bing','otro')),
  dispositivo text not null check (dispositivo in ('movil','tablet','computador')),
  creado_en timestamptz not null default now()
);
create index if not exists evento_web_fecha on public.evento_web(creado_en);
create index if not exists evento_web_sesion on public.evento_web(sesion_id, creado_en);
create index if not exists contacto_lead_fecha on public.contacto_lead(creado_en);
create index if not exists contacto_lead_email on public.contacto_lead(email);

create table if not exists public.limite_ingreso (
  clave text primary key, cantidad integer not null, vence timestamptz not null
);
alter table public.limite_ingreso enable row level security;
revoke all on public.limite_ingreso from anon, authenticated;
create or replace function public.permitir_ingreso(p_clave text, p_max integer)
returns boolean language plpgsql security definer set search_path = '' as $$
declare cantidad_actual integer;
begin
  insert into public.limite_ingreso(clave, cantidad, vence) values(p_clave,1,now()+interval '1 day')
  on conflict(clave) do update set cantidad = public.limite_ingreso.cantidad+1
  returning cantidad into cantidad_actual;
  return cantidad_actual <= p_max;
end;
$$;
revoke all on function public.permitir_ingreso(text, integer) from public, anon, authenticated;
grant execute on function public.permitir_ingreso(text, integer) to service_role;

alter table public.contacto_lead enable row level security;
alter table public.consentimiento_contacto enable row level security;
alter table public.preferencia_analitica enable row level security;
alter table public.evento_web enable row level security;
revoke all on public.contacto_lead, public.consentimiento_contacto, public.preferencia_analitica, public.evento_web from anon, authenticated;
grant select, update, delete on public.contacto_lead to authenticated;
grant select on public.consentimiento_contacto, public.evento_web to authenticated;
drop policy if exists "admin comercial lee contactos" on public.contacto_lead;
create policy "admin comercial lee contactos"
  on public.contacto_lead for select to authenticated using (public.es_admin_comercial());
drop policy if exists "admin comercial actualiza contactos" on public.contacto_lead;
create policy "admin comercial actualiza contactos"
  on public.contacto_lead for update to authenticated using (public.es_admin_comercial()) with check (public.es_admin_comercial());
drop policy if exists "admin comercial elimina contactos" on public.contacto_lead;
create policy "admin comercial elimina contactos"
  on public.contacto_lead for delete to authenticated using (public.es_admin_comercial());
drop policy if exists "admin comercial lee consentimientos" on public.consentimiento_contacto;
create policy "admin comercial lee consentimientos"
  on public.consentimiento_contacto for select to authenticated using (public.es_admin_comercial());
drop policy if exists "admin comercial lee eventos" on public.evento_web;
create policy "admin comercial lee eventos"
  on public.evento_web for select to authenticated using (public.es_admin_comercial());

-- Alta y autorizaciones juntas; un reintento no duplica el contacto.
create or replace function public.registrar_contacto(p_id uuid, p_nombre text, p_email text,
  p_motivo text, p_grupo uuid, p_novedades boolean, p_baja_hash text, p_version text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  insert into public.contacto_lead(id,nombre,email,motivo,grupo_id,novedades,baja_hash)
  values(p_id,p_nombre,p_email,p_motivo,p_grupo,p_novedades,p_baja_hash)
  on conflict (id) do nothing;
  if not found then return false; end if;
  insert into public.consentimiento_contacto(contacto_id,finalidad,otorgado,version) values
    (p_id,'guardar_contacto',true,p_version), (p_id,'novedades_email',p_novedades,p_version);
  return true;
end;
$$;
revoke all on function public.registrar_contacto(uuid,text,text,text,uuid,boolean,text,text) from public,anon,authenticated;
grant execute on function public.registrar_contacto(uuid,text,text,text,uuid,boolean,text,text) to service_role;

create or replace function public.retirar_novedades(p_hash text, p_version text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  with retirados as (
    update public.contacto_lead set novedades=false, actualizado_en=now()
    where novedades=true and email=(select email from public.contacto_lead where baja_hash=p_hash)
    returning id
  ) insert into public.consentimiento_contacto(contacto_id,finalidad,otorgado,version)
    select id,'novedades_email',false,p_version from retirados;
end;
$$;
revoke all on function public.retirar_novedades(text,text) from public,anon,authenticated;
grant execute on function public.retirar_novedades(text,text) to service_role;

create or replace function public.depurar_comercial() returns void
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.evento_web where creado_en < now()-interval '180 days';
  delete from public.preferencia_analitica where creado_en < now()-interval '180 days';
  delete from public.contacto_lead where actualizado_en < now()-interval '12 months';
  delete from public.limite_ingreso where vence < now();
end;
$$;
revoke all on function public.depurar_comercial() from public,anon,authenticated;
grant execute on function public.depurar_comercial() to service_role;

drop policy if exists "cualquiera puede enviar un mensaje" on public.mensaje;
revoke insert on public.mensaje from anon;

-- Agregación SQL sin el límite de 1000 filas de REST.
create or replace function public.resumen_comercial(p_desde date, p_hasta date)
returns jsonb language plpgsql stable security invoker set search_path = '' as $$
declare inicio timestamptz; fin timestamptz; anterior timestamptz; resultado jsonb;
begin
  if not public.es_admin_comercial() then raise exception 'No autorizado'; end if;
  if p_desde is null or p_hasta is null or p_hasta < p_desde or p_hasta-p_desde > 89 then
    raise exception 'Rango máximo: 90 días';
  end if;
  inicio := p_desde::timestamp at time zone 'America/Santiago';
  fin := (p_hasta+1)::timestamp at time zone 'America/Santiago';
  anterior := (p_desde-(p_hasta-p_desde+1))::timestamp at time zone 'America/Santiago';
  with datos as (select * from public.evento_web where creado_en >= anterior and creado_en < fin),
  periodos as (
    select case when creado_en >= inicio then 'actual' else 'anterior' end periodo,
      count(*) filter(where evento='pagina') vistas, count(distinct sesion_id) sesiones,
      count(distinct sesion_id) filter(where evento <> 'pagina') conversiones,
      count(*) filter(where evento='whatsapp') whatsapp,
      count(*) filter(where evento='email') email,
      count(*) filter(where evento='instagram') instagram
    from datos group by 1
  ), dias as (
    select (creado_en at time zone 'America/Santiago')::date dia,
      count(*) filter(where evento='pagina') vistas, count(distinct sesion_id) sesiones
    from datos where creado_en>=inicio group by 1
  ), paginas as (
    select ruta, count(*) vistas from datos where creado_en>=inicio and evento='pagina'
    group by ruta order by vistas desc, ruta limit 10
  ), fuentes as (
    select origen, count(distinct sesion_id) sesiones from datos where creado_en>=inicio group by origen
  ), dispositivos as (
    select dispositivo, count(distinct sesion_id) sesiones from datos where creado_en>=inicio group by dispositivo
  ) select jsonb_build_object(
    'periodos',coalesce((select jsonb_agg(to_jsonb(p)) from periodos p),'[]'::jsonb),
    'dias',coalesce((select jsonb_agg(to_jsonb(d) order by dia) from dias d),'[]'::jsonb),
    'paginas',coalesce((select jsonb_agg(to_jsonb(p)) from paginas p),'[]'::jsonb),
    'fuentes',coalesce((select jsonb_agg(to_jsonb(f)) from fuentes f),'[]'::jsonb),
    'dispositivos',coalesce((select jsonb_agg(to_jsonb(d)) from dispositivos d),'[]'::jsonb),
    'contactos',(select count(*) from public.contacto_lead where creado_en>=inicio and creado_en<fin),
    'contactos_anteriores',(select count(*) from public.contacto_lead where creado_en>=anterior and creado_en<inicio)
  ) into resultado;
  return resultado;
end;
$$;
revoke all on function public.resumen_comercial(date,date) from public, anon;
grant execute on function public.resumen_comercial(date,date) to authenticated;
grant all on public.admin_comercial, public.contacto_lead, public.consentimiento_contacto,
  public.preferencia_analitica, public.evento_web, public.limite_ingreso to service_role;

-- ===========================================================================
-- 0009_metadatos_fotos_sala.sql
-- ===========================================================================

-- Cada foto de sala puede llevar un título y las dimensiones de la obra
-- representada. imagen_ancho/imagen_alto siguen siendo las medidas del archivo
-- para reservar su proporción en la galería.
alter table public.exposicion_foto
  add column if not exists titulo text,
  add column if not exists dimensiones text;

alter table public.exposicion_foto
  drop constraint if exists exposicion_foto_titulo_no_vacio,
  drop constraint if exists exposicion_foto_dimensiones_no_vacias;

alter table public.exposicion_foto
  add constraint exposicion_foto_titulo_no_vacio
    check (titulo is null or length(btrim(titulo)) > 0),
  add constraint exposicion_foto_dimensiones_no_vacias
    check (dimensiones is null or length(btrim(dimensiones)) > 0);
