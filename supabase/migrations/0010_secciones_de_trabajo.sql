alter table public.exposicion add column if not exists seccion text;

update public.exposicion
set seccion = case
  when slug in ('ilustraciones', 'ilustraciones-en-acuarela')
    or lower(btrim(titulo)) = 'ilustraciones' then 'ilustraciones'
  else 'recientes'
end
where tipo = 'trabajo' and seccion is null;

alter table public.exposicion drop constraint if exists exposicion_seccion_de_trabajo;
alter table public.exposicion add constraint exposicion_seccion_de_trabajo check (
  (tipo = 'exposicion' and seccion is null) or
  (tipo = 'trabajo' and seccion is not null and seccion in ('ilustraciones', 'recientes'))
);

create index if not exists exposicion_seccion_orden_idx
  on public.exposicion (seccion, orden) where tipo = 'trabajo';

-- Las altas y los traslados se agregan al final de su sección en la misma escritura.
create or replace function public.ubicar_conjunto_en_seccion()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if new.tipo <> 'trabajo' then return new; end if;
  if tg_op = 'UPDATE' then
    if old.tipo = new.tipo and old.seccion is not distinct from new.seccion then
      return new;
    end if;
  end if;

  perform pg_advisory_xact_lock(hashtextextended('public.exposicion:secciones', 0));
  select coalesce(max(orden), 0) + 1 into new.orden
  from public.exposicion where tipo = 'trabajo' and seccion = new.seccion;
  return new;
end;
$$;

create or replace trigger exposicion_ubicar_conjunto
  before insert or update of tipo, seccion on public.exposicion
  for each row execute function public.ubicar_conjunto_en_seccion();

-- El argumento por omisión conserva la llamada existente para exposiciones.
drop function if exists public.reordenar_grupos(uuid[], text);
create or replace function public.reordenar_grupos(p_ids uuid[], p_tipo text, p_seccion text default null)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  if auth.uid() is null or p_tipo is null or p_tipo not in ('exposicion', 'trabajo') or
    (p_tipo = 'exposicion' and p_seccion is not null) or
    (p_tipo = 'trabajo' and (p_seccion is null or p_seccion not in ('ilustraciones', 'recientes'))) then
    raise exception 'No autorizado';
  end if;

  lock table public.exposicion in share row exclusive mode;
  if p_ids is null or cardinality(p_ids) = 0 or cardinality(p_ids) > 2000 or
    cardinality(p_ids) <> (select count(distinct id) from unnest(p_ids) id) or
    cardinality(p_ids) <> (select count(*) from public.exposicion where tipo = p_tipo and seccion is not distinct from p_seccion) or
    exists (select 1 from unnest(p_ids) as entrada(id) where not exists (
      select 1 from public.exposicion e
      where e.id = entrada.id and e.tipo = p_tipo and e.seccion is not distinct from p_seccion
    )) then raise exception 'La lista cambió; recarga el panel'; end if;

  update public.exposicion e set orden = posiciones.pos
    from unnest(p_ids) with ordinality as posiciones(id, pos)
    where e.id = posiciones.id and e.tipo = p_tipo and e.seccion is not distinct from p_seccion;
end;
$$;

revoke all on function public.reordenar_grupos(uuid[], text, text) from public, anon;
grant execute on function public.reordenar_grupos(uuid[], text, text) to authenticated;
