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
