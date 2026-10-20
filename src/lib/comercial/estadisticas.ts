export function fechaChile(ahora = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Santiago", year:"numeric", month:"2-digit", day:"2-digit" }).format(ahora);
}
export function sumarDias(fecha: string, dias: number) {
  const d = new Date(fecha + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + dias); return d.toISOString().slice(0,10);
}
function fechaValida(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && Number.isFinite(Date.parse(s)) && new Date(s).toISOString().slice(0,10) === s;
}
export function rangoFechas(params: { dias?: string; desde?: string; hasta?: string }, hoy = fechaChile()) {
  const dias = ["7","30","90"].includes(params.dias ?? "") ? Number(params.dias) : 30;
  if (params.desde && params.hasta && fechaValida(params.desde) && fechaValida(params.hasta)) {
    const amplitud = (Date.parse(params.hasta) - Date.parse(params.desde)) / 86400000;
    if (amplitud >= 0 && amplitud < 90 && params.hasta <= hoy && params.desde >= sumarDias(hoy, -179)) return { desde:params.desde, hasta:params.hasta };
  }
  return { desde:sumarDias(hoy, 1 - dias), hasta:hoy };
}
export function porcentaje(convertidas: number, sesiones: number) {
  return sesiones > 0 ? Math.round(convertidas / sesiones * 1000) / 10 : 0;
}
export function csvCelda(valor: unknown) {
  const texto = String(valor ?? "");
  const seguro = /^[\s]*[=+@\-\t\r]/.test(texto) ? "'" + texto : texto;
  return '"' + seguro.replaceAll('"', '""') + '"';
}
