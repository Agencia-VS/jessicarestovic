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

create policy "serie visible para todos"
  on public.serie for select
  to anon, authenticated
  using (true);

create policy "obra publicada visible para todos"
  on public.obra for select
  to anon, authenticated
  using (publicada or auth.role() = 'authenticated');

create policy "exposicion publicada visible para todos"
  on public.exposicion for select
  to anon, authenticated
  using (publicada or auth.role() = 'authenticated');

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

create policy "relacion exposicion-obra visible para todos"
  on public.exposicion_obra for select
  to anon, authenticated
  using (true);

create policy "pagina visible para todos"
  on public.pagina for select
  to anon, authenticated
  using (true);

-- --- Escritura: solo con sesión --------------------------------------------
-- Una política `for all` por tabla cubre insert / update / delete del panel.

create policy "serie administrable con sesion"
  on public.serie for all
  to authenticated
  using (true) with check (true);

create policy "obra administrable con sesion"
  on public.obra for all
  to authenticated
  using (true) with check (true);

create policy "exposicion administrable con sesion"
  on public.exposicion for all
  to authenticated
  using (true) with check (true);

create policy "fotos de exposicion administrables con sesion"
  on public.exposicion_foto for all
  to authenticated
  using (true) with check (true);

create policy "relacion exposicion-obra administrable con sesion"
  on public.exposicion_obra for all
  to authenticated
  using (true) with check (true);

create policy "pagina administrable con sesion"
  on public.pagina for all
  to authenticated
  using (true) with check (true);

-- --- Mensajes --------------------------------------------------------------
-- Cualquiera puede enviar un mensaje; solo Jessica puede leerlos o marcarlos.

create policy "cualquiera puede enviar un mensaje"
  on public.mensaje for insert
  to anon, authenticated
  with check (true);

create policy "mensajes visibles solo con sesion"
  on public.mensaje for select
  to authenticated
  using (true);

create policy "mensajes actualizables solo con sesion"
  on public.mensaje for update
  to authenticated
  using (true) with check (true);

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

create policy "imagenes de obras visibles para todos"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'obras');

create policy "subir imagenes con sesion"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'obras');

create policy "reemplazar imagenes con sesion"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'obras') with check (bucket_id = 'obras');

create policy "borrar imagenes con sesion"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'obras');
