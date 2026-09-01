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
create table public.serie (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null,
  slug          text not null unique,
  descripcion   text,
  orden         integer not null default 0,
  creado_en     timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  constraint serie_nombre_no_vacio check (length(btrim(nombre)) > 0)
);

create index serie_orden_idx on public.serie (orden, nombre);

create trigger serie_touch
  before update on public.serie
  for each row execute function public.touch_actualizado_en();

-- ---------------------------------------------------------------------------
-- obra
--
-- `imagen_ancho` / `imagen_alto` se guardan al subir la foto para poder
-- reservar el espacio exacto en la retícula sin recortar la obra (§08).
-- ---------------------------------------------------------------------------
create table public.obra (
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

create index obra_serie_orden_idx on public.obra (serie_id, orden, creado_en);
create index obra_destacada_idx on public.obra (orden) where destacada and publicada;
create index obra_publicada_idx on public.obra (publicada);

create trigger obra_touch
  before update on public.obra
  for each row execute function public.touch_actualizado_en();

-- ---------------------------------------------------------------------------
-- exposicion
-- ---------------------------------------------------------------------------
create table public.exposicion (
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
create index exposicion_cronologico_idx on public.exposicion (anio desc nulls last, orden);

create trigger exposicion_touch
  before update on public.exposicion
  for each row execute function public.touch_actualizado_en();

-- Fotos de sala / montaje de cada exposición.
create table public.exposicion_foto (
  id            uuid primary key default gen_random_uuid(),
  exposicion_id uuid not null references public.exposicion (id) on delete cascade,
  imagen_path   text not null,
  imagen_alt    text not null,
  orden         integer not null default 0,
  creado_en     timestamptz not null default now(),
  constraint exposicion_foto_alt_no_vacio check (length(btrim(imagen_alt)) > 0)
);

create index exposicion_foto_orden_idx on public.exposicion_foto (exposicion_id, orden);

-- Obras relacionadas con una exposición (opcional, §05).
create table public.exposicion_obra (
  exposicion_id uuid not null references public.exposicion (id) on delete cascade,
  obra_id       uuid not null references public.obra (id) on delete cascade,
  orden         integer not null default 0,
  primary key (exposicion_id, obra_id)
);

create index exposicion_obra_obra_idx on public.exposicion_obra (obra_id);

-- ---------------------------------------------------------------------------
-- mensaje
-- ---------------------------------------------------------------------------
create type public.mensaje_origen as enum ('contacto', 'clases');

create table public.mensaje (
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

create index mensaje_bandeja_idx on public.mensaje (leido, creado_en desc);

-- ---------------------------------------------------------------------------
-- pagina — contenido editable de «Sobre mí» y «Clases»
-- ---------------------------------------------------------------------------
create table public.pagina (
  clave         text primary key,
  contenido     jsonb not null default '{}'::jsonb,
  actualizado_en timestamptz not null default now(),
  constraint pagina_clave_conocida check (clave in ('sobre-mi', 'clases'))
);

create trigger pagina_touch
  before update on public.pagina
  for each row execute function public.touch_actualizado_en();
