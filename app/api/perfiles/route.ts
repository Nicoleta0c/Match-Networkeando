import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { db, aDocumento } from "@/lib/db";
import { miId } from "@/lib/identidad";
import { eventoActual } from "@/lib/evento";
import { leerFase, leerQuitados } from "@/lib/almacen";
import { esPresentadora } from "@/lib/presentadora";

/* GET /api/perfiles: los perfiles de este evento (máximo 800) y quién eres tú.
   - Los que la presentadora quitó no salen para nadie.
   - En la fase de registro, cada celular solo recibe su propio perfil (más el total de gente):
     nadie puede ver los perfiles ni los matches de los demás antes de tiempo. La presentadora sí ve todo.
   Con ETag: si nada cambió desde la última vez, responde 304 sin cuerpo y ahorra Wi-Fi en el evento. */
export async function GET(req: NextRequest) {
  const yo = await miId(req);
  const evento = eventoActual();
  const [filas, fase, quitados, presentadora] = await Promise.all([
    db.perfil.findMany({where: {evento}, orderBy: {createdAt: "desc"}, take: 800}),
    leerFase(evento), leerQuitados(evento), esPresentadora(req)
  ]);
  const validos = filas.filter(f => !quitados.has(f.id));
  const visibles = fase === "matches" || presentadora ? validos : validos.filter(f => f.id === yo);
  const cuerpo = JSON.stringify({yo, fase, presentadora, total: validos.length, quitado: quitados.has(yo), perfiles: visibles.map(aDocumento)});
  const etag = '"' + createHash("sha1").update(cuerpo).digest("base64url") + '"';
  const cabeceras = {"Cache-Control": "private, no-cache", "ETag": etag, "Content-Type": "application/json"};
  if (req.headers.get("if-none-match") === etag) return new Response(null, {status: 304, headers: cabeceras});
  return new Response(cuerpo, {headers: cabeceras});
}
