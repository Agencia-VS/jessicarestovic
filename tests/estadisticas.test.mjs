import test from "node:test";
import assert from "node:assert/strict";
import { fechaChile, rangoFechas, porcentaje, csvCelda } from "../src/lib/comercial/estadisticas.ts";

test("la fecha usa el día de Chile, no el UTC", () => {
  assert.equal(fechaChile(new Date("2026-01-02T01:00:00Z")), "2026-01-01");
});
test("rango inclusivo, años bisiestos y entradas inválidas", () => {
  assert.deepEqual(rangoFechas({dias:"7"}, "2026-10-20"), {desde:"2026-10-14",hasta:"2026-10-20"});
  assert.deepEqual(rangoFechas({desde:"2024-02-29",hasta:"2024-03-01"}, "2024-03-01"), {desde:"2024-02-29",hasta:"2024-03-01"});
  for (const params of [
    {desde:"2026-02-30",hasta:"2026-03-01"},
    {desde:"2026-01-01",hasta:"2026-10-20"},
    {desde:"2026-10-21",hasta:"2026-10-22"},
    {desde:"2026-10-20",hasta:"2026-10-19"},
  ]) assert.deepEqual(rangoFechas(params, "2026-10-20"), {desde:"2026-09-21",hasta:"2026-10-20"});
});
test("conversión soporta cero visitas y redondea a una décima", () => {
  assert.equal(porcentaje(0,0),0);
  assert.equal(porcentaje(1,3),33.3);
});
test("CSV protege fórmulas, comillas y saltos", () => {
  for (const valor of ["=1+1","+cmd","-cmd","@cmd","  =cmd","\t=cmd"])
    assert.ok(csvCelda(valor).startsWith("\"'"));
  assert.equal(csvCelda('a"b'), '"a""b"');
  assert.equal(csvCelda("a\nb"), '"a\nb"');
});
