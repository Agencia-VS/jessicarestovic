-- ---------------------------------------------------------------------------
-- Una muestra puede exponer varias series
--
-- `exposicion.serie_id` admitía una sola, y eso dejaba obra sin puerta de
-- entrada: «Ensambles al Cubo» mostró también «Espacios Íntimos», pero el
-- lugar ya lo ocupaba la serie homónima, así que «Espacios Íntimos» quedaba
-- sin ninguna exposición que la mostrara. Como el sitio entra al cuerpo de
-- obra por la trayectoria, una serie sin exposición no se alcanza.
--
-- La relación real es de muchos a muchos en los dos sentidos: una muestra
-- puede reunir varias series, y una serie puede volver a exponerse años
-- después. La tabla intermedia expresa las dos cosas y deja de perder datos.
-- ---------------------------------------------------------------------------

create table if not exists public.exposicion_serie (
  exposicion_id uuid not null references public.exposicion (id) on delete cascade,
  serie_id      uuid not null references public.serie (id) on delete cascade,
  orden         integer not null default 0,
  primary key (exposicion_id, serie_id)
);

create index if not exists exposicion_serie_serie_idx on public.exposicion_serie (serie_id);
create index if not exists exposicion_serie_orden_idx on public.exposicion_serie (exposicion_id, orden);

alter table public.exposicion_serie enable row level security;

create policy "series de exposicion visibles para todos"
  on public.exposicion_serie for select
  to anon, authenticated
  using (true);

create policy "series de exposicion administrables con sesion"
  on public.exposicion_serie for all
  to authenticated
  using (true) with check (true);

-- Traspasa lo que ya estaba en la columna, sin perder nada.
insert into public.exposicion_serie (exposicion_id, serie_id, orden)
select e.id, e.serie_id, 0
from public.exposicion as e
where e.serie_id is not null
on conflict do nothing;

-- El dato que no cabía: «Ensambles al Cubo» expuso además «Espacios Íntimos».
insert into public.exposicion_serie (exposicion_id, serie_id, orden)
select e.id, s.id, 1
from public.exposicion as e, public.serie as s
where e.slug = 'ensambles-al-cubo'
  and s.slug = 'espacios-intimos'
on conflict do nothing;

-- Una sola fuente de verdad: la columna se va.
alter table public.exposicion drop column if exists serie_id;
