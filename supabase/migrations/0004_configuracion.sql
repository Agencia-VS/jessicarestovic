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
