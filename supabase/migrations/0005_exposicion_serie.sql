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
