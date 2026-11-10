/* El evento activo: el que recibe los registros nuevos del QR.
   - Si la presentadora creó o eligió uno en el panel, es ese.
   - Si no, el de la variable EVENTO (en Railway: "2026-11-06").
   - Si tampoco, la fecha de hoy en República Dominicana (ej. "2026-11-06").
   La presentadora también puede «ver» un evento anterior: solo cambia lo que ve ella, no los celulares. */
import type { NextRequest } from "next/server";
import { leerActivo, leerEventos, type InfoEvento } from "./almacen";

/** La fecha de hoy en República Dominicana, como 2026-11-06. */
export function hoyRD() {
  return new Intl.DateTimeFormat("en-CA", {timeZone: "America/Santo_Domingo", year: "numeric", month: "2-digit", day: "2-digit"}).format(new Date());
}
/** El evento de siempre (sin elegir nada en el panel). */
function eventoPorDefecto() {
  return (process.env.EVENTO || "").trim().slice(0, 60) || hoyRD();
}
export async function eventoActual() {
  return (await leerActivo()) || eventoPorDefecto();
}

/* Nombres que ya tenían los eventos de antes de esta función. */
const NOMBRES_DE_ANTES: Record<string, string> = {"2026-11-06": "Lanzamiento Mapa de Sueños"};
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

/** El nombre para mostrar de un evento. */
export function nombreEvento(id: string, guardados: Record<string, InfoEvento>) {
  if (guardados[id]?.nombre) return guardados[id].nombre;
  if (NOMBRES_DE_ANTES[id]) return NOMBRES_DE_ANTES[id];
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(id);
  return m ? `Evento del ${+m[3]} de ${MESES[+m[2] - 1]} de ${m[1]}` : id;
}

/** El evento que se está mirando: el que pide la presentadora (?evento=…) o, si no, el activo. */
export async function eventoDeLaVista(req: NextRequest, presentadora: boolean) {
  const activo = await eventoActual();
  const pedido = (req.nextUrl.searchParams.get("evento") || "").trim().slice(0, 80);
  return {activo, evento: presentadora && pedido ? pedido : activo};
}

export { leerEventos };
