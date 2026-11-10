import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { db, aDocumento } from "@/lib/db";
import { miId } from "@/lib/identidad";
import { eventoDeLaVista, leerEventos, nombreEvento } from "@/lib/evento";
import { leerFase, leerQuitados, leerRonda } from "@/lib/almacen";
import { esPresentadora } from "@/lib/presentadora";

/* GET /api/perfiles: los perfiles de este evento (máximo 800) y quién eres tú.
   - Los que la presentadora quitó no salen para nadie.
   - En la fase de registro, cada celular solo recibe su propio perfil (más el total de gente):
     nadie puede ver los perfiles ni los matches de los demás antes de tiempo. La presentadora sí ve todo.
   - La presentadora puede pedir otro evento (?evento=…) para mirarlo; los demás siempre ven el activo.
   - Si no tienes perfil en el evento activo pero sí en uno anterior, se manda (para «usar mi perfil anterior»).
   Con ETag: si nada cambió desde la última vez, responde 304 sin cuerpo y ahorra Wi-Fi en el evento. */
export async function GET(req: NextRequest) {
  const yo = await miId(req);
  const presentadora = await esPresentadora(req);
  const {activo, evento} = await eventoDeLaVista(req, presentadora);
  const [filas, fase, quitados, ronda, guardados] = await Promise.all([
    db.perfil.findMany({where: {evento}, orderBy: {createdAt: "desc"}, take: 800}),
    leerFase(evento), leerQuitados(evento), leerRonda(evento), leerEventos()
  ]);
  const validos = filas.filter(f => !quitados.has(f.id));
  const visibles = fase === "matches" || presentadora ? validos : validos.filter(f => f.id === yo);
  // Si la presentadora te quitó, los demás ya no te ven, pero tus datos siguen siendo tuyos: tu celular sí los ve.
  const propio = filas.find(f => f.id === yo);
  if (propio && quitados.has(yo)) visibles.push(propio);

  // Tu perfil de un evento anterior (si en este todavía no tienes): para ofrecerte usarlo otra vez.
  let anterior: Record<string, unknown> | null = null;
  if (evento === activo && !propio) {
    const viejo = await db.perfil.findUnique({where: {id: yo}});
    if (viejo && viejo.evento && viejo.evento !== activo) {
      const d = aDocumento(viejo) as Record<string, unknown>;
      anterior = {idea: d.idea, power: d.power, anon: d.anon, alias: d.alias, que: d.que, contact: d.contact, evento: nombreEvento(viejo.evento, guardados)};
    }
  }
  const info = {id: evento, nombre: nombreEvento(evento, guardados), activo: evento === activo};
  const cuerpo = JSON.stringify({yo, fase, ronda, presentadora, evento: info, anterior, total: validos.length, quitado: quitados.has(yo), perfiles: visibles.map(aDocumento)});
  const etag = '"' + createHash("sha1").update(cuerpo).digest("base64url") + '"';
  const cabeceras = {"Cache-Control": "private, no-cache", "ETag": etag, "Content-Type": "application/json"};
  if (req.headers.get("if-none-match") === etag) return new Response(null, {status: 304, headers: cabeceras});
  return new Response(cuerpo, {headers: cabeceras});
}
