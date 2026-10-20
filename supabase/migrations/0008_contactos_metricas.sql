-- Acceso explícito al nuevo módulo: habilitar la cuenta desde SQL (ver docs).
create table if not exists public.admin_comercial (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.admin_comercial enable row level security;
revoke all on public.admin_comercial from anon, authenticated;
create or replace function public.es_admin_comercial() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.admin_comercial where user_id = auth.uid());
$$;
revoke all on function public.es_admin_comercial() from public, anon;
grant execute on function public.es_admin_comercial() to authenticated;

create table if not exists public.contacto_lead (
  id uuid primary key,
  nombre text not null check (char_length(nombre) between 2 and 100),
  email text not null check (char_length(email) <= 254),
  motivo text not null check (motivo in ('obra','precio','colaboracion','otra')),
  grupo_id uuid references public.exposicion(id) on delete set null,
  novedades boolean not null default false,
  estado text not null default 'nuevo' check (estado in ('nuevo','contactado','conversacion','cerrado')),
  baja_hash text not null unique,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
create table if not exists public.consentimiento_contacto (
  id uuid primary key default gen_random_uuid(),
  contacto_id uuid not null references public.contacto_lead(id) on delete cascade,
  finalidad text not null check (finalidad in ('guardar_contacto','novedades_email')),
  otorgado boolean not null,
  version text not null,
  creado_en timestamptz not null default now()
);
create table if not exists public.preferencia_analitica (
  id uuid primary key,
  aceptada boolean not null,
  version text not null,
  creado_en timestamptz not null default now()
);
create table if not exists public.evento_web (
  id uuid primary key,
  sesion_id uuid not null,
  consentimiento_id uuid not null references public.preferencia_analitica(id) on delete cascade,
  evento text not null check (evento in ('pagina','whatsapp','email','instagram','contacto')),
  ruta text not null check (char_length(ruta) <= 180),
  origen text not null check (origen in ('directo','instagram','google','facebook','bing','otro')),
  dispositivo text not null check (dispositivo in ('movil','tablet','computador')),
  creado_en timestamptz not null default now()
);
create index if not exists evento_web_fecha on public.evento_web(creado_en);
create index if not exists evento_web_sesion on public.evento_web(sesion_id, creado_en);
create index if not exists contacto_lead_fecha on public.contacto_lead(creado_en);
create index if not exists contacto_lead_email on public.contacto_lead(email);

create table if not exists public.limite_ingreso (
  clave text primary key, cantidad integer not null, vence timestamptz not null
);
alter table public.limite_ingreso enable row level security;
revoke all on public.limite_ingreso from anon, authenticated;
create or replace function public.permitir_ingreso(p_clave text, p_max integer)
returns boolean language plpgsql security definer set search_path = '' as $$
declare cantidad_actual integer;
begin
  insert into public.limite_ingreso(clave, cantidad, vence) values(p_clave,1,now()+interval '1 day')
  on conflict(clave) do update set cantidad = public.limite_ingreso.cantidad+1
  returning cantidad into cantidad_actual;
  return cantidad_actual <= p_max;
end;
$$;
revoke all on function public.permitir_ingreso(text, integer) from public, anon, authenticated;
grant execute on function public.permitir_ingreso(text, integer) to service_role;

alter table public.contacto_lead enable row level security;
alter table public.consentimiento_contacto enable row level security;
alter table public.preferencia_analitica enable row level security;
alter table public.evento_web enable row level security;
revoke all on public.contacto_lead, public.consentimiento_contacto, public.preferencia_analitica, public.evento_web from anon, authenticated;
grant select, update, delete on public.contacto_lead to authenticated;
grant select on public.consentimiento_contacto, public.evento_web to authenticated;
create policy "admin comercial lee contactos"
  on public.contacto_lead for select to authenticated using (public.es_admin_comercial());
create policy "admin comercial actualiza contactos"
  on public.contacto_lead for update to authenticated using (public.es_admin_comercial()) with check (public.es_admin_comercial());
create policy "admin comercial elimina contactos"
  on public.contacto_lead for delete to authenticated using (public.es_admin_comercial());
create policy "admin comercial lee consentimientos"
  on public.consentimiento_contacto for select to authenticated using (public.es_admin_comercial());
create policy "admin comercial lee eventos"
  on public.evento_web for select to authenticated using (public.es_admin_comercial());

-- Alta y autorizaciones juntas; un reintento no duplica el contacto.
create or replace function public.registrar_contacto(p_id uuid, p_nombre text, p_email text,
  p_motivo text, p_grupo uuid, p_novedades boolean, p_baja_hash text, p_version text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  insert into public.contacto_lead(id,nombre,email,motivo,grupo_id,novedades,baja_hash)
  values(p_id,p_nombre,p_email,p_motivo,p_grupo,p_novedades,p_baja_hash)
  on conflict (id) do nothing;
  if not found then return false; end if;
  insert into public.consentimiento_contacto(contacto_id,finalidad,otorgado,version) values
    (p_id,'guardar_contacto',true,p_version), (p_id,'novedades_email',p_novedades,p_version);
  return true;
end;
$$;
revoke all on function public.registrar_contacto(uuid,text,text,text,uuid,boolean,text,text) from public,anon,authenticated;
grant execute on function public.registrar_contacto(uuid,text,text,text,uuid,boolean,text,text) to service_role;

create or replace function public.retirar_novedades(p_hash text, p_version text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  with retirados as (
    update public.contacto_lead set novedades=false, actualizado_en=now()
    where novedades=true and email=(select email from public.contacto_lead where baja_hash=p_hash)
    returning id
  ) insert into public.consentimiento_contacto(contacto_id,finalidad,otorgado,version)
    select id,'novedades_email',false,p_version from retirados;
end;
$$;
revoke all on function public.retirar_novedades(text,text) from public,anon,authenticated;
grant execute on function public.retirar_novedades(text,text) to service_role;

create or replace function public.depurar_comercial() returns void
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.evento_web where creado_en < now()-interval '180 days';
  delete from public.preferencia_analitica where creado_en < now()-interval '180 days';
  delete from public.contacto_lead where actualizado_en < now()-interval '12 months';
  delete from public.limite_ingreso where vence < now();
end;
$$;
revoke all on function public.depurar_comercial() from public,anon,authenticated;
grant execute on function public.depurar_comercial() to service_role;

drop policy if exists "cualquiera puede enviar un mensaje" on public.mensaje;
revoke insert on public.mensaje from anon;

-- Agregación SQL sin el límite de 1000 filas de REST.
create or replace function public.resumen_comercial(p_desde date, p_hasta date)
returns jsonb language plpgsql stable security invoker set search_path = '' as $$
declare inicio timestamptz; fin timestamptz; anterior timestamptz; resultado jsonb;
begin
  if not public.es_admin_comercial() then raise exception 'No autorizado'; end if;
  if p_desde is null or p_hasta is null or p_hasta < p_desde or p_hasta-p_desde > 89 then
    raise exception 'Rango máximo: 90 días';
  end if;
  inicio := p_desde::timestamp at time zone 'America/Santiago';
  fin := (p_hasta+1)::timestamp at time zone 'America/Santiago';
  anterior := (p_desde-(p_hasta-p_desde+1))::timestamp at time zone 'America/Santiago';
  with datos as (select * from public.evento_web where creado_en >= anterior and creado_en < fin),
  periodos as (
    select case when creado_en >= inicio then 'actual' else 'anterior' end periodo,
      count(*) filter(where evento='pagina') vistas, count(distinct sesion_id) sesiones,
      count(distinct sesion_id) filter(where evento <> 'pagina') conversiones,
      count(*) filter(where evento='whatsapp') whatsapp,
      count(*) filter(where evento='email') email,
      count(*) filter(where evento='instagram') instagram
    from datos group by 1
  ), dias as (
    select (creado_en at time zone 'America/Santiago')::date dia,
      count(*) filter(where evento='pagina') vistas, count(distinct sesion_id) sesiones
    from datos where creado_en>=inicio group by 1
  ), paginas as (
    select ruta, count(*) vistas from datos where creado_en>=inicio and evento='pagina'
    group by ruta order by vistas desc, ruta limit 10
  ), fuentes as (
    select origen, count(distinct sesion_id) sesiones from datos where creado_en>=inicio group by origen
  ), dispositivos as (
    select dispositivo, count(distinct sesion_id) sesiones from datos where creado_en>=inicio group by dispositivo
  ) select jsonb_build_object(
    'periodos',coalesce((select jsonb_agg(to_jsonb(p)) from periodos p),'[]'::jsonb),
    'dias',coalesce((select jsonb_agg(to_jsonb(d) order by dia) from dias d),'[]'::jsonb),
    'paginas',coalesce((select jsonb_agg(to_jsonb(p)) from paginas p),'[]'::jsonb),
    'fuentes',coalesce((select jsonb_agg(to_jsonb(f)) from fuentes f),'[]'::jsonb),
    'dispositivos',coalesce((select jsonb_agg(to_jsonb(d)) from dispositivos d),'[]'::jsonb),
    'contactos',(select count(*) from public.contacto_lead where creado_en>=inicio and creado_en<fin),
    'contactos_anteriores',(select count(*) from public.contacto_lead where creado_en>=anterior and creado_en<inicio)
  ) into resultado;
  return resultado;
end;
$$;
revoke all on function public.resumen_comercial(date,date) from public, anon;
grant execute on function public.resumen_comercial(date,date) to authenticated;
grant all on public.admin_comercial, public.contacto_lead, public.consentimiento_contacto,
  public.preferencia_analitica, public.evento_web, public.limite_ingreso to service_role;
