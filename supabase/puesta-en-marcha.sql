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
-- Cuatro entidades, según el brief (§05 «Modelo de contenido»):
--   serie        agrupa obras relacionadas — resuelve la duplicación actual
--                entre «Trabajos» y «Expos» del sitio en Wix
--   obra         cada pieza individual
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
-- serie
-- ---------------------------------------------------------------------------
create table if not exists public.serie (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null,
  slug          text not null unique,
  descripcion   text,
  orden         integer not null default 0,
  creado_en     timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  constraint serie_nombre_no_vacio check (length(btrim(nombre)) > 0)
);

create index if not exists serie_orden_idx on public.serie (orden, nombre);

create or replace trigger serie_touch
  before update on public.serie
  for each row execute function public.touch_actualizado_en();

-- ---------------------------------------------------------------------------
-- obra
--
-- `imagen_ancho` / `imagen_alto` se guardan al subir la foto para poder
-- reservar el espacio exacto en la retícula sin recortar la obra (§08).
-- ---------------------------------------------------------------------------
create table if not exists public.obra (
  id            uuid primary key default gen_random_uuid(),
  titulo        text not null,
  serie_id      uuid references public.serie (id) on delete set null,
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
  -- El texto alternativo es obligatorio: accesibilidad y SEO (§06).
  constraint obra_alt_no_vacio check (length(btrim(imagen_alt)) > 0),
  constraint obra_anio_plausible check (anio is null or (anio between 1900 and 2100)),
  constraint obra_dimensiones_imagen check (
    (imagen_ancho is null and imagen_alto is null)
    or (imagen_ancho > 0 and imagen_alto > 0)
  )
);

create index if not exists obra_serie_orden_idx on public.obra (serie_id, orden, creado_en);
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

-- Listado cronológico tipo CV: más reciente primero (§05).
create index if not exists exposicion_cronologico_idx on public.exposicion (anio desc nulls last, orden);

create or replace trigger exposicion_touch
  before update on public.exposicion
  for each row execute function public.touch_actualizado_en();

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

-- Obras relacionadas con una exposición (opcional, §05).
create table if not exists public.exposicion_obra (
  exposicion_id uuid not null references public.exposicion (id) on delete cascade,
  obra_id       uuid not null references public.obra (id) on delete cascade,
  orden         integer not null default 0,
  primary key (exposicion_id, obra_id)
);

create index if not exists exposicion_obra_obra_idx on public.exposicion_obra (obra_id);

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

alter table public.serie            enable row level security;
alter table public.obra             enable row level security;
alter table public.exposicion       enable row level security;
alter table public.exposicion_foto  enable row level security;
alter table public.exposicion_obra  enable row level security;
alter table public.mensaje          enable row level security;
alter table public.pagina           enable row level security;

-- --- Lectura pública -------------------------------------------------------

drop policy if exists "serie visible para todos" on public.serie;
create policy "serie visible para todos"
  on public.serie for select
  to anon, authenticated
  using (true);

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

drop policy if exists "relacion exposicion-obra visible para todos" on public.exposicion_obra;
create policy "relacion exposicion-obra visible para todos"
  on public.exposicion_obra for select
  to anon, authenticated
  using (true);

drop policy if exists "pagina visible para todos" on public.pagina;
create policy "pagina visible para todos"
  on public.pagina for select
  to anon, authenticated
  using (true);

-- --- Escritura: solo con sesión --------------------------------------------
-- Una política `for all` por tabla cubre insert / update / delete del panel.

drop policy if exists "serie administrable con sesion" on public.serie;
create policy "serie administrable con sesion"
  on public.serie for all
  to authenticated
  using (true) with check (true);

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

drop policy if exists "relacion exposicion-obra administrable con sesion" on public.exposicion_obra;
create policy "relacion exposicion-obra administrable con sesion"
  on public.exposicion_obra for all
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
-- Las series y exposiciones vienen de la auditoría de jessicarestovic.com
-- (§03 del brief): son los datos reales que hoy están repartidos en 15 páginas
-- de Wix, ya normalizados en el modelo nuevo. «Ensambles al Cubo» aparece una
-- sola vez —como serie— y la exposición del mismo nombre la referencia, que es
-- justo la duplicación que el modelo nuevo resuelve.
--
-- Los textos de «Sobre mí» y «Clases» quedan como marcadores: hay que
-- reemplazarlos por los textos reales de Jessica desde el panel.
-- ---------------------------------------------------------------------------

insert into public.serie (nombre, slug, descripcion, orden) values
  ('Ensambles al Cubo',    'ensambles-al-cubo',    null, 1),
  ('Espacios Íntimos',     'espacios-intimos',     'Grafito sobre tela.', 2),
  ('Sur',                  'sur',                  'Serie en grafito sobre tela inspirada en la Patagonia.', 3),
  ('De lo Residual',       'de-lo-residual',       'Huellas del tiempo sobre distintas superficies.', 4),
  ('De lo Precario',       'de-lo-precario',       'Materiales simples y frágiles como lenguaje.', 5),
  ('Volúmenes',            'volumenes',            null, 6),
  ('A partir de lo simple','a-partir-de-lo-simple','Documentación de proceso: obra en curso y obra terminada.', 7)
on conflict (slug) do nothing;

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
-- 0005_exposicion_serie.sql
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- La serie que mostró cada exposición
--
-- El diseño entra al cuerpo de obra por la trayectoria: desde una exposición
-- se pasa a «Ver la serie», y la página de serie vuelve a la exposición de la
-- que se entró. Ese enlace no existía —`exposicion_obra` relaciona piezas
-- sueltas, no la serie— así que la exposición gana una referencia opcional a
-- la serie que expuso.
--
-- Es opcional a propósito: una muestra colectiva o una selección de varias
-- series simplemente queda sin serie, como «Fundación Guayasamín».
-- ---------------------------------------------------------------------------

alter table public.exposicion
  add column if not exists serie_id uuid references public.serie (id) on delete set null;

create index if not exists exposicion_serie_idx on public.exposicion (serie_id);

-- Enlaza las exposiciones sembradas con su serie. Los pares vienen de la
-- auditoría: el título de la muestra y el de la serie coinciden salvo en «De
-- lo residual y lo efímero», que expuso la serie «De lo Residual».
update public.exposicion as e
set serie_id = s.id
from public.serie as s
where e.serie_id is null
  and s.slug = case e.slug
    when 'ensambles-al-cubo'            then 'ensambles-al-cubo'
    when 'sur'                          then 'sur'
    when 'volumenes'                    then 'volumenes'
    when 'de-lo-precario'               then 'de-lo-precario'
    when 'a-partir-de-lo-simple'        then 'a-partir-de-lo-simple'
    when 'de-lo-residual-y-lo-efimero'  then 'de-lo-residual'
    else null
  end;

-- ---------------------------------------------------------------------------
-- Las medidas de cada foto de sala
--
-- La obra ya guardaba ancho y alto: es lo que permite reservar el espacio
-- exacto antes de que la foto cargue, para que nada se recorte ni salte. Las
-- vistas de montaje se muestran igual —«la foto dicta la tarjeta»— así que
-- necesitan el mismo dato. El panel ya lee las medidas para validarlas al
-- subir; ahora también las guarda.
-- ---------------------------------------------------------------------------

alter table public.exposicion_foto
  add column if not exists imagen_ancho integer,
  add column if not exists imagen_alto integer;

-- ---------------------------------------------------------------------------
-- Técnicas de «Clases» con su descripción
--
-- El diseño muestra cada técnica en una fila: el nombre en serif grande a la
-- izquierda y una descripción corta a la derecha. Se guardan en la misma línea
-- separadas por un guion largo, así el panel sigue siendo un campo de texto
-- con una técnica por línea y no una tabla aparte.
-- ---------------------------------------------------------------------------

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
-- 0006_exposicion_series.sql
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Una muestra puede exponer varias series
--
-- `exposicion.serie_id` admitía una sola, y eso dejaba obra sin puerta de
-- entrada: «Ensambles al Cubo» mostró también «Espacios Íntimos», pero el
-- lugar ya lo ocupaba la serie homónima, así que «Espacios Íntimos» quedaba
-- sin ninguna exposición que la mostrara. Como el sitio entra al cuerpo de
-- obra por la trayectoria, una serie sin exposición no se alcanza.
--
-- La relación real es de muchos a muchos en los dos sentidos: una muestra
-- puede reunir varias series, y una serie puede volver a exponerse años
-- después. La tabla intermedia expresa las dos cosas y deja de perder datos.
-- ---------------------------------------------------------------------------

create table if not exists public.exposicion_serie (
  exposicion_id uuid not null references public.exposicion (id) on delete cascade,
  serie_id      uuid not null references public.serie (id) on delete cascade,
  orden         integer not null default 0,
  primary key (exposicion_id, serie_id)
);

create index if not exists exposicion_serie_serie_idx on public.exposicion_serie (serie_id);
create index if not exists exposicion_serie_orden_idx on public.exposicion_serie (exposicion_id, orden);

alter table public.exposicion_serie enable row level security;

drop policy if exists "series de exposicion visibles para todos" on public.exposicion_serie;
create policy "series de exposicion visibles para todos"
  on public.exposicion_serie for select
  to anon, authenticated
  using (true);

drop policy if exists "series de exposicion administrables con sesion" on public.exposicion_serie;
create policy "series de exposicion administrables con sesion"
  on public.exposicion_serie for all
  to authenticated
  using (true) with check (true);

-- Traspasa lo que ya estaba en la columna, sin perder nada.
insert into public.exposicion_serie (exposicion_id, serie_id, orden)
select e.id, e.serie_id, 0
from public.exposicion as e
where e.serie_id is not null
on conflict do nothing;

-- El dato que no cabía: «Ensambles al Cubo» expuso además «Espacios Íntimos».
insert into public.exposicion_serie (exposicion_id, serie_id, orden)
select e.id, s.id, 1
from public.exposicion as e, public.serie as s
where e.slug = 'ensambles-al-cubo'
  and s.slug = 'espacios-intimos'
on conflict do nothing;

-- Una sola fuente de verdad: la columna se va.
alter table public.exposicion drop column if exists serie_id;
