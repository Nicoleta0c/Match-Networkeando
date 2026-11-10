import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { eventoActual, hoyRD, leerEventos, nombreEvento } from "@/lib/evento";
import { activarEvento, crearEvento, renombrarEvento } from "@/lib/almacen";
import { esPresentadora, pideClave, sinClaveMensaje } from "@/lib/presentadora";

/* Eventos (solo la presentadora).
   GET /api/eventos: todos los eventos, con cuánta gente hubo y cuál es el activo.
   POST /api/eventos {accion: "crear", nombre}: crea uno nuevo y lo deja activo (el anterior queda guardado).
   POST /api/eventos {accion: "activar", id}: vuelve a dejar activo un evento.
   POST /api/eventos {accion: "renombrar", id, nombre}: le cambia el nombre. */

const sinPermiso = () => Response.json({error: sinClaveMensaje(), pideClave: pideClave()}, {status: 403});
const limpiarNombre = (v: unknown) => typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, 80) : "";

export async function GET(req: NextRequest) {
  if (!(await esPresentadora(req))) return sinPermiso();
  const [activo, guardados, grupos] = await Promise.all([
    eventoActual(), leerEventos(),
    db.perfil.groupBy({by: ["evento"], where: {evento: {not: ""}}, _count: {_all: true}, _min: {createdAt: true}})
  ]);
  const lista = new Map<string, {id: string; nombre: string; personas: number; desde: number; activo: boolean}>();
  for (const g of grupos) {
    lista.set(g.evento, {id: g.evento, nombre: nombreEvento(g.evento, guardados), personas: g._count._all, desde: g._min.createdAt ?? 0, activo: g.evento === activo});
  }
  // Eventos recién creados (todavía sin gente).
  for (const [id, info] of Object.entries(guardados)) {
    if (!lista.has(id)) lista.set(id, {id, nombre: info.nombre, personas: 0, desde: info.creado, activo: id === activo});
  }
  if (!lista.has(activo)) lista.set(activo, {id: activo, nombre: nombreEvento(activo, guardados), personas: 0, desde: Date.now(), activo: true});
  // El activo primero; después, del más reciente al más viejo.
  const eventos = [...lista.values()].sort((a, b) => Number(b.activo) - Number(a.activo) || b.desde - a.desde);
  return Response.json({activo, eventos}, {headers: {"Cache-Control": "no-store"}});
}

export async function POST(req: NextRequest) {
  if (!(await esPresentadora(req))) return sinPermiso();
  let cuerpo: {accion?: unknown; id?: unknown; nombre?: unknown};
  try { cuerpo = await req.json(); } catch { return Response.json({error: "El cuerpo no es JSON válido."}, {status: 400}); }
  const nombre = limpiarNombre(cuerpo.nombre);
  const id = typeof cuerpo.id === "string" ? cuerpo.id.trim().slice(0, 80) : "";
  if (cuerpo.accion === "crear") {
    if (nombre.length < 3) return Response.json({error: "Ponle un nombre al evento."}, {status: 400});
    return Response.json({ok: true, id: await crearEvento(nombre, hoyRD())});
  }
  if (cuerpo.accion === "activar" && id) { await activarEvento(id); return Response.json({ok: true}); }
  if (cuerpo.accion === "renombrar" && id && nombre.length >= 3) { await renombrarEvento(id, nombre); return Response.json({ok: true}); }
  return Response.json({error: "Acción desconocida."}, {status: 400});
}
