import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { idDeCookie } from "@/lib/identidad";

/* POST /api/chat/bloquear: cuerpo {id}. Esa persona ya no puede escribirte,
   y la conversación entre ustedes se borra para los dos. */
export async function POST(req: NextRequest) {
  const yo = await idDeCookie();
  if (!yo) return Response.json({error: "No pudimos identificar tu sesión."}, {status: 403});

  let cuerpo: {id?: unknown};
  try { cuerpo = await req.json(); } catch { return Response.json({error: "El cuerpo no es JSON válido."}, {status: 400}); }
  const otro = typeof cuerpo.id === "string" ? cuerpo.id : "";
  if (!otro || otro === yo) return Response.json({error: "Falta a quién bloquear."}, {status: 400});

  await db.bloqueo.upsert({where: {de_para: {de: yo, para: otro}}, create: {de: yo, para: otro}, update: {}});
  await db.mensaje.deleteMany({where: {OR: [{de: yo, para: otro}, {de: otro, para: yo}]}});
  return new Response(null, {status: 204});
}
