#!/usr/bin/env node
/**
 * Junta las migraciones en un solo archivo para pegar en el SQL Editor de
 * Supabase. Las políticas se preceden de un `drop policy if exists` para que
 * el archivo se pueda volver a correr sin fallar; el resto de las migraciones
 * ya usa `if not exists`.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DIR = "supabase/migrations";
const SALIDA = "supabase/puesta-en-marcha.sql";

const cabecera = `-- ---------------------------------------------------------------------------
-- Puesta en marcha completa de la base de datos
--
-- Junta las migraciones de supabase/migrations/ en orden, para pegarlo de una
-- sola vez en el SQL Editor de Supabase.
--
-- Se puede volver a correr sin romper nada: las tablas, índices y triggers son
-- idempotentes, las inserciones usan on conflict do nothing y las políticas se
-- borran antes de crearse.
--
-- GENERADO — no editar a mano. Editar las migraciones y correr:
--   npm run sql
-- ---------------------------------------------------------------------------
`;

const partes = readdirSync(DIR)
  .filter((n) => n.endsWith(".sql"))
  .sort()
  .map((nombre) => {
    const cuerpo = readFileSync(join(DIR, nombre), "utf8").trimEnd();
    const barra = "-- " + "=".repeat(75);
    return `\n${barra}\n-- ${nombre}\n${barra}\n\n${cuerpo}\n`;
  });

// Cada política se recrea, así el archivo tolera repetirse.
const conPoliticasRecreables = partes
  .join("")
  .replace(
    /create policy "([^"]+)"\n  on ([\w.]+)/g,
    (_, nombre, tabla) =>
      `drop policy if exists "${nombre}" on ${tabla};\ncreate policy "${nombre}"\n  on ${tabla}`,
  );

writeFileSync(SALIDA, cabecera + conPoliticasRecreables);
console.log(`${SALIDA}: ${cabecera.split("\n").length + conPoliticasRecreables.split("\n").length} líneas`);
