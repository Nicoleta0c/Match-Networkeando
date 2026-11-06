import type { NextRequest } from "next/server";
import { db, aDocumento } from "@/lib/db";
import { eventoActual } from "@/lib/evento";
import { leerFase, leerQuitados, quitar } from "@/lib/almacen";
import { entrar, esPresentadora, pideClave } from "@/lib/presentadora";

/* Panel de la presentadora.
   GET /api/panel: todos los perfiles del evento (también los quitados, marcados) y la fase.
   POST /api/panel {clave}: entrar con la clave (deja la cookie).
   POST /api/panel {id, quitar: true|false}: quita o devuelve un perfil. */

const sinPermiso = () => Response.json({error: pideClave() ? "Escribe la clave de la presentadora." : "Solo se puede desde la computadora de la presentadora.", pideClave: pideClave()}, {status: 403});

export async function GET(req: NextRequest) {
  if (!(await esPresentadora(req))) return sinPermiso();
  const evento = eventoActual();
  const [filas, fase, quitados] = await Promise.all([
    db.perfil.findMany({where: {evento}, orderBy: {createdAt: "desc"}, take: 800}), leerFase(evento), leerQuitados(evento)
  ]);
  return Response.json({evento, fase, perfiles: filas.map(f => ({...aDocumento(f), quitado: quitados.has(f.id)}))}, {headers: {"Cache-Control": "no-store"}});
}

export async function POST(req: NextRequest) {
  let cuerpo: {id?: unknown; quitar?: unknown; clave?: unknown};
  try { cuerpo = await req.json(); } catch { return Response.json({error: "El cuerpo no es JSON válido."}, {status: 400}); }
  if (cuerpo.clave !== undefined) {
    return (await entrar(req, cuerpo.clave)) ? Response.json({ok: true}) : Response.json({error: "Clave incorrecta."}, {status: 403});
  }
  if (!(await esPresentadora(req))) return sinPermiso();
  if (typeof cuerpo.id !== "string" || typeof cuerpo.quitar !== "boolean") return Response.json({error: "Faltan id y quitar."}, {status: 400});
  await quitar(eventoActual(), cuerpo.id, cuerpo.quitar);
  return Response.json({ok: true});
}
