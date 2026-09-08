-- ---------------------------------------------------------------------------
-- REINICIO DE CONTENIDO — ACCIÓN DESTRUCTIVA
--
-- Este archivo elimina las tablas públicas creadas por este proyecto para
-- poder aplicar desde cero la puesta-en-marcha.sql corregida. Se perderán las
-- filas de obras, exposiciones, mensajes y páginas que existan en public.
--
-- No elimina usuarios de auth ni el bucket de Storage. Después de ejecutarlo,
-- pega supabase/puesta-en-marcha.sql completo.
-- ---------------------------------------------------------------------------

drop table if exists
  public.exposicion_serie,
  public.exposicion_obra,
  public.exposicion_foto,
  public.obra,
  public.exposicion,
  public.serie,
  public.mensaje,
  public.pagina
cascade;
