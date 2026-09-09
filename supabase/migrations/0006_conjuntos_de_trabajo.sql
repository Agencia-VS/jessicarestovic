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
