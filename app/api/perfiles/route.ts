import type { NextRequest } from "next/server";
import { db, aDocumento } from "@/lib/db";
import { miId } from "@/lib/identidad";

/* GET /api/perfiles: los perfiles más recientes primero (máximo 800) y quién eres tú. */
export async function GET(req: NextRequest) {
  const yo = await miId(req);
  const filas = await db.perfil.findMany({orderBy: {createdAt: "desc"}, take: 800});
  return Response.json({yo, perfiles: filas.map(aDocumento)}, {headers: {"Cache-Control": "no-store"}});
}
