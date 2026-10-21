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
