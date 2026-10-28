-- Encuadre de miniaturas; nunca modifica los originales.
alter table public.exposicion add column if not exists portada_foco_x integer not null default 50 check (portada_foco_x between 0 and 100);
alter table public.exposicion add column if not exists portada_foco_y integer not null default 50 check (portada_foco_y between 0 and 100);

create or replace function public.reordenar_grupos(p_ids uuid[], p_tipo text)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  if auth.uid() is null or p_tipo is null or p_tipo not in ('exposicion','trabajo') then
    raise exception 'No autorizado';
  end if;
  lock table public.exposicion in share row exclusive mode;
  if p_ids is null or cardinality(p_ids) = 0 or cardinality(p_ids) > 2000 or
    cardinality(p_ids) <> (select count(distinct id) from unnest(p_ids) id) or
    cardinality(p_ids) <> (select count(*) from public.exposicion where tipo = p_tipo) or
    exists (select 1 from unnest(p_ids) as entrada(id) where not exists (
      select 1 from public.exposicion e where e.id = entrada.id and e.tipo = p_tipo
    )) then raise exception 'La lista cambió; recarga el panel'; end if;
  update public.exposicion e set orden = posiciones.pos
    from unnest(p_ids) with ordinality as posiciones(id, pos)
    where e.id = posiciones.id and e.tipo = p_tipo;
end;
$$;
revoke all on function public.reordenar_grupos(uuid[], text) from public, anon;
grant execute on function public.reordenar_grupos(uuid[], text) to authenticated;
