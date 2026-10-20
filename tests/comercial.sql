-- Ejecutar solo en una base VACÍA y desechable, como superusuario.
\set ON_ERROR_STOP on
begin;
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create schema auth;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid
$$;
grant usage on schema public,auth to anon,authenticated,service_role;
create table public.exposicion(id uuid primary key, tipo text not null, orden integer not null default 0);
create table public.mensaje(id uuid primary key);
grant select,update on public.exposicion to authenticated;
alter table public.exposicion enable row level security;
create policy admin_contenido on public.exposicion to authenticated using(auth.uid() is not null) with check(auth.uid() is not null);
\ir ../supabase/migrations/0007_grilla_orden.sql
\ir ../supabase/migrations/0008_contactos_metricas.sql

create function public.comprobar(ok boolean, detalle text) returns void language plpgsql as $$
begin if ok is not true then raise exception 'Prueba fallida: %',detalle; end if; end $$;
insert into auth.users values('00000000-0000-4000-8000-000000000001'),('00000000-0000-4000-8000-000000000002');
insert into public.admin_comercial values('00000000-0000-4000-8000-000000000001');
insert into public.exposicion(id,tipo) values
('10000000-0000-4000-8000-000000000001','exposicion'),
('10000000-0000-4000-8000-000000000002','exposicion'),
('10000000-0000-4000-8000-000000000003','trabajo');

set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
select public.reordenar_grupos(array['10000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001']::uuid[],'exposicion');
select public.comprobar((select orden=1 from public.exposicion where id='10000000-0000-4000-8000-000000000002'),'orden de izquierda a derecha');
do $$ begin
  begin
    perform public.reordenar_grupos(array['10000000-0000-4000-8000-000000000001']::uuid[],'exposicion');
    raise exception 'lista parcial aceptada';
  exception when raise_exception then
    if sqlerrm='lista parcial aceptada' then raise; end if;
  end;
  begin
    perform public.reordenar_grupos(array['10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001']::uuid[],'exposicion');
    raise exception 'lista duplicada aceptada';
  exception when raise_exception then
    if sqlerrm='lista duplicada aceptada' then raise; end if;
  end;
end $$;
select public.comprobar((select orden=1 from public.exposicion where id='10000000-0000-4000-8000-000000000002'),'fallo conserva orden');
reset role;

set local role service_role;
select public.comprobar(public.registrar_contacto('20000000-0000-4000-8000-000000000001','Prueba','prueba@example.invalid','obra',null,true,'hash-prueba','2026-10-20'),'primer registro');
select public.comprobar(not public.registrar_contacto('20000000-0000-4000-8000-000000000001','Prueba','prueba@example.invalid','obra',null,true,'hash-prueba','2026-10-20'),'reintento idempotente');
select public.comprobar((select count(*)=2 from public.consentimiento_contacto),'dos finalidades separadas');
select public.retirar_novedades('hash-prueba','2026-10-20');
select public.retirar_novedades('hash-prueba','2026-10-20');
select public.comprobar((select not novedades from public.contacto_lead),'revocación');
select public.comprobar((select count(*)=3 from public.consentimiento_contacto),'baja idempotente');
insert into public.preferencia_analitica values('30000000-0000-4000-8000-000000000001',true,'2026-10-20',now());
insert into public.evento_web(id,sesion_id,consentimiento_id,evento,ruta,origen,dispositivo,creado_en)
select gen_random_uuid(),'40000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','pagina','/','directo','movil',now() from generate_series(1,1101);
insert into public.evento_web(id,sesion_id,consentimiento_id,evento,ruta,origen,dispositivo)
select gen_random_uuid(),'40000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','whatsapp','/contacto','directo','movil' from generate_series(1,3);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',true);
select public.comprobar((select count(*)=0 from public.contacto_lead),'cuenta sin permiso no lee contactos');
select public.comprobar((select count(*)=0 from public.evento_web),'cuenta sin permiso no lee eventos');
do $$ begin
  begin
    perform public.resumen_comercial(current_date,current_date);
    raise exception 'cuenta sin permiso accedió a resumen';
  exception when raise_exception then
    if sqlerrm='cuenta sin permiso accedió a resumen' then raise; end if;
  end;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
do $$ declare r jsonb; begin
  r := public.resumen_comercial((now() at time zone 'America/Santiago')::date,(now() at time zone 'America/Santiago')::date);
  perform public.comprobar((r->'periodos'->0->>'vistas')::int=1101,'sin truncar 1000 filas');
  perform public.comprobar((r->'periodos'->0->>'sesiones')::int=1,'sesión deduplicada');
  perform public.comprobar((r->'periodos'->0->>'conversiones')::int=1,'conversión deduplicada');
  perform public.comprobar((r->'periodos'->0->>'whatsapp')::int=3,'clics individuales');
end $$;
reset role;

select public.comprobar(not has_table_privilege('anon','public.contacto_lead','select'),'anon no lee contactos');
select public.comprobar(not has_function_privilege('anon','public.registrar_contacto(uuid,text,text,text,uuid,boolean,text,text)','execute'),'anon no escribe contactos por RPC');
select public.comprobar(not has_function_privilege('authenticated','public.depurar_comercial()','execute'),'admin no ejecuta cron por RPC');
update public.contacto_lead set actualizado_en=now()-interval '13 months';
insert into public.preferencia_analitica values('30000000-0000-4000-8000-000000000002',true,'vieja',now()-interval '181 days');
insert into public.evento_web values(gen_random_uuid(),gen_random_uuid(),'30000000-0000-4000-8000-000000000002','pagina','/','directo','movil',now()-interval '181 days');
select public.depurar_comercial();
select public.comprobar((select count(*)=0 from public.contacto_lead),'contactos vencidos eliminados');
select public.comprobar((select count(*)=0 from public.consentimiento_contacto),'consentimientos eliminados en cascada');
select public.comprobar((select count(*)=1104 from public.evento_web),'retención de eventos');
rollback;
