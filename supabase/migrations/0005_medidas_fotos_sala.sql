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
