import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { aDocumento, db } from "@/lib/db";
import { UMBRAL, analizar, limpiar } from "@/lib/match";
import { idDeCookie } from "@/lib/identidad";
import { matchIA } from "@/lib/matchesIA";
import { HORAS, MAX_TEXTO, limpiarTexto } from "@/lib/chat";

const desde = () => Date.now() - HORAS * 60 * 60 * 1000;
/* Para que nadie llene el chat de golpe: como máximo 15 mensajes por minuto. */
const POR_MINUTO = 15;

/* GET /api/chat: tus mensajes (los que enviaste y los que te enviaron) de las últimas 12 horas.
   También la lista de personas que bloqueaste. Con ETag, igual que /api/perfiles. */
export async function GET(req: NextRequest) {
  const yo = await idDeCookie();
  if (!yo) return Response.json({mensajes: [], bloqueados: []});

  // El chat es temporal: lo viejo se borra aquí mismo.
  await db.mensaje.deleteMany({where: {creado: {lt: desde()}}});

  const bloqueos = await db.bloqueo.findMany({where: {OR: [{de: yo}, {para: yo}]}});
  const cortados = new Set(bloqueos.map(b => b.de === yo ? b.para : b.de));
  const filas = await db.mensaje.findMany({
    where: {OR: [{de: yo}, {para: yo}], creado: {gte: desde()}},
    orderBy: {creado: "asc"}, take: 1000
  });
  const mensajes = filas.filter(m => !cortados.has(m.de === yo ? m.para : m.de));
  const bloqueados = bloqueos.filter(b => b.de === yo).map(b => b.para);

  const cuerpo = JSON.stringify({mensajes, bloqueados});
  const etag = '"' + createHash("sha1").update(cuerpo).digest("base64url") + '"';
  const cabeceras = {"Cache-Control": "private, no-cache", "ETag": etag, "Content-Type": "application/json"};
  if (req.headers.get("if-none-match") === etag) return new Response(null, {status: 304, headers: cabeceras});
  return new Response(cuerpo, {headers: cabeceras});
}

/* POST /api/chat: envía un mensaje. Cuerpo: {para, texto}. */
export async function POST(req: NextRequest) {
  const yo = await idDeCookie();
  if (!yo || !(await db.perfil.findUnique({where: {id: yo}, select: {id: true}}))) {
    return Response.json({error: "Crea tu perfil para poder escribir."}, {status: 403});
  }

  let cuerpo: {para?: unknown; texto?: unknown};
  try { cuerpo = await req.json(); } catch { return Response.json({error: "El cuerpo no es JSON válido."}, {status: 400}); }

  const para = typeof cuerpo.para === "string" ? cuerpo.para : "";
  const texto = limpiarTexto(cuerpo.texto);
  if (!texto) return Response.json({error: "Escribe un mensaje."}, {status: 400});
  if (texto.length > MAX_TEXTO) return Response.json({error: `El mensaje puede tener como máximo ${MAX_TEXTO} caracteres.`}, {status: 400});
  const filaOtro = para && para !== yo ? await db.perfil.findUnique({where: {id: para}}) : null;
  if (!filaOtro) return Response.json({error: "Esa persona ya no está en el evento."}, {status: 404});

  // El chat es solo entre matches: si no encajan (en ninguna dirección) ni la IA los juntó, no se puede escribir.
  const filaYo = await db.perfil.findUnique({where: {id: yo}});
  const a = limpiar(yo, aDocumento(filaYo!)), b = limpiar(para, aDocumento(filaOtro));
  if (!matchIA(yo, para) && Math.max(analizar(a, b).pct, analizar(b, a).pct) < UMBRAL) {
    return Response.json({error: "Solo puedes escribirle a tu match."}, {status: 403});
  }

  const bloqueo = await db.bloqueo.findFirst({where: {OR: [{de: yo, para}, {de: para, para: yo}]}});
  if (bloqueo) return Response.json({error: "No puedes escribirle a esta persona."}, {status: 403});

  const recientes = await db.mensaje.count({where: {de: yo, creado: {gte: Date.now() - 60_000}}});
  if (recientes >= POR_MINUTO) return Response.json({error: "Vas muy rápido. Espera un momento."}, {status: 429});

  const m = await db.mensaje.create({data: {de: yo, para, texto, creado: Date.now()}});
  return Response.json(m);
}
