import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { db, aDocumento } from "@/lib/db";
import { miId } from "@/lib/identidad";
import { eventoActual } from "@/lib/evento";

/* GET /api/perfiles: los perfiles de este evento, los más recientes primero (máximo 800), y quién eres tú.
   Con ETag: si nada cambió desde la última vez, responde 304 sin cuerpo y ahorra Wi-Fi en el evento. */
export async function GET(req: NextRequest) {
  const yo = await miId(req);
  const filas = await db.perfil.findMany({where: {evento: eventoActual()}, orderBy: {createdAt: "desc"}, take: 800});
  const cuerpo = JSON.stringify({yo, perfiles: filas.map(aDocumento)});
  const etag = '"' + createHash("sha1").update(cuerpo).digest("base64url") + '"';
  const cabeceras = {"Cache-Control": "private, no-cache", "ETag": etag, "Content-Type": "application/json"};
  if (req.headers.get("if-none-match") === etag) return new Response(null, {status: 304, headers: cabeceras});
  return new Response(cuerpo, {headers: cabeceras});
}
