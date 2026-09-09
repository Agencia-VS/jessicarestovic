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
