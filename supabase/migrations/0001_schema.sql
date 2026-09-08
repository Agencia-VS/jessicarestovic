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
