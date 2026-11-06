import type { NextRequest } from "next/server";
import { db, aDocumento } from "@/lib/db";
import { eventoActual } from "@/lib/evento";
import { leerFase, leerQuitados, nuevaRonda, quitar, reiniciarEvento } from "@/lib/almacen";
import { entrar, esPresentadora, pideClave, sinClaveMensaje } from "@/lib/presentadora";

/* Panel de la presentadora.
   GET /api/panel: todos los perfiles del evento (también los quitados, marcados) y la fase.
   POST /api/panel {clave}: entrar con la clave (deja la cookie).
   POST /api/panel {id, quitar: true|false}: quita o devuelve un perfil.
   POST /api/panel {accion: "repetir"}: a todos les vuelve a salir «Ver mi match».
   POST /api/panel {accion: "reiniciar"}: vuelve a registro (los perfiles registrados se quedan). */

const sinPermiso = () => Response.json({error: sinClaveMensaje(), pideClave: pideClave()}, {status: 403});

export async function GET(req: NextRequest) {
  if (!(await esPresentadora(req))) return sinPermiso();
  const evento = eventoActual();
  const [filas, fase, quitados] = await Promise.all([
    db.perfil.findMany({where: {evento}, orderBy: {createdAt: "desc"}, take: 800}), leerFase(evento), leerQuitados(evento)
  ]);
  return Response.json({evento, fase, perfiles: filas.map(f => ({...aDocumento(f), quitado: quitados.has(f.id)}))}, {headers: {"Cache-Control": "no-store"}});
}

export async function POST(req: NextRequest) {
  let cuerpo: {id?: unknown; quitar?: unknown; clave?: unknown; accion?: unknown};
  try { cuerpo = await req.json(); } catch { return Response.json({error: "El cuerpo no es JSON válido."}, {status: 400}); }
  if (cuerpo.clave !== undefined) {
    return (await entrar(req, cuerpo.clave)) ? Response.json({ok: true}) : Response.json({error: "Clave incorrecta."}, {status: 403});
  }
  if (!(await esPresentadora(req))) return sinPermiso();
  const evento = eventoActual();
  if (cuerpo.accion === "repetir") { await nuevaRonda(evento); return Response.json({ok: true}); }
  if (cuerpo.accion === "reiniciar") { await reiniciarEvento(evento); return Response.json({ok: true}); }
  if (typeof cuerpo.id !== "string" || typeof cuerpo.quitar !== "boolean") return Response.json({error: "Faltan id y quitar."}, {status: 400});
  await quitar(eventoActual(), cuerpo.id, cuerpo.quitar);
  return Response.json({ok: true});
}
