import type { NextRequest } from "next/server";
import { db, aDocumento } from "@/lib/db";
import { idDeCookie } from "@/lib/identidad";
import { validarPerfil } from "@/lib/validar";

const MAX_BYTES = 8 * 1024;

/* Solo puedes tocar tu propio perfil: el id de la URL tiene que ser el de tu cookie. */
async function esMio(ctx: RouteContext<"/api/perfiles/[id]">) {
  const {id} = await ctx.params;
  const yo = await idDeCookie();
  return yo && yo === id ? id : null;
}

/* PUT /api/perfiles/[id]: crea o actualiza tu perfil. */
export async function PUT(req: NextRequest, ctx: RouteContext<"/api/perfiles/[id]">) {
  const id = await esMio(ctx);
  if (!id) return Response.json({error: "Solo puedes editar tu propio perfil."}, {status: 403});

  const crudo = await req.text();
  if (crudo.length > MAX_BYTES) return Response.json({error: "El perfil es demasiado grande."}, {status: 413});
  let cuerpo: unknown;
  try { cuerpo = JSON.parse(crudo); } catch { return Response.json({error: "El cuerpo no es JSON válido."}, {status: 400}); }

  const v = validarPerfil(cuerpo);
  if (!v.ok) return Response.json({error: v.error}, {status: 400});
  const {needs, ...resto} = v.datos;

  // La fecha de creación la pone el servidor y no cambia al editar.
  const fila = await db.perfil.upsert({
    where: {id},
    create: {id, ...resto, needs: JSON.stringify(needs), createdAt: Date.now()},
    update: {...resto, needs: JSON.stringify(needs)}
  });
  return Response.json(aDocumento(fila));
}

/* DELETE /api/perfiles/[id]: borra tu perfil. */
export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/perfiles/[id]">) {
  const id = await esMio(ctx);
  if (!id) return Response.json({error: "Solo puedes borrar tu propio perfil."}, {status: 403});
  await db.perfil.deleteMany({where: {id}});
  return new Response(null, {status: 204});
}
