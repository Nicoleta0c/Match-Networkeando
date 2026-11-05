import { createHash, randomBytes } from "node:crypto";
import type { NextRequest } from "next/server";
import { aDocumento, db } from "@/lib/db";
import { limpiar, type Perfil } from "@/lib/match";
import { eventoActual } from "@/lib/evento";
import { construirRed, type Red } from "@/lib/red";

/* GET /api/mapa: la red del Mapa de Sueños con los dos niveles (todos los eventos y este evento).
   Sin nombres ni textos. Los ids reales no salen: cada persona va con una clave que no se puede
   revertir (cambia si el servidor se reinicia). Con ETag, como /api/perfiles. */

const MAX_PERFILES = 3000;
const g = globalThis as typeof globalThis & {__salMapa?: string; __cacheMapa?: {firma: string; red: Red}};
const sal = (g.__salMapa ??= randomBytes(16).toString("hex"));
const clave = (id: string) => createHash("sha256").update(sal + id).digest("base64url").slice(0, 12);

export async function GET(req: NextRequest) {
  const actual = eventoActual();
  // Los perfiles sin evento son pruebas de antes de esta versión: no cuentan en el mapa.
  const filas = await db.perfil.findMany({where: {evento: {not: ""}}, orderBy: {createdAt: "asc"}, take: MAX_PERFILES});

  // Calcular los empalmes cuesta: solo se rehace si alguien entró, salió o cambió su perfil.
  const firma = actual + "|" + filas.length + "|" + filas.reduce((m, f) => Math.max(m, f.updatedAt.getTime()), 0);
  let red = g.__cacheMapa?.firma === firma ? g.__cacheMapa.red : null;
  if (!red) {
    const grupos = new Map<string, Perfil[]>();
    for (const f of filas) {
      // Los perfiles de ejemplo (scripts/ejemplos.mjs) sirven para practicar hoy, pero nunca
      // cuentan como gente real de otros eventos.
      if (f.id.startsWith("ejemplo-") && f.evento !== actual) continue;
      const p = limpiar(f.id, aDocumento(f));
      if (!p.power) continue;
      grupos.set(f.evento, [...(grupos.get(f.evento) ?? []), p]);
    }
    red = construirRed([...grupos].map(([evento, perfiles]) => ({evento, perfiles})), actual, clave);
    g.__cacheMapa = {firma, red};
  }

  const cuerpo = JSON.stringify(red);
  const etag = '"' + createHash("sha1").update(cuerpo).digest("base64url") + '"';
  const cabeceras = {"Cache-Control": "no-cache", "ETag": etag, "Content-Type": "application/json"};
  if (req.headers.get("if-none-match") === etag) return new Response(null, {status: 304, headers: cabeceras});
  return new Response(cuerpo, {headers: cabeceras});
}
