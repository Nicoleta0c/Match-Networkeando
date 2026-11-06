import type { NextRequest } from "next/server";
import { db, aDocumento } from "@/lib/db";
import { idDeCookie } from "@/lib/identidad";
import { revisarTextos, validarPerfil } from "@/lib/validar";
import { moderarPerfil } from "@/lib/moderar";
import { eventoActual } from "@/lib/evento";

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

  // Que escriban algo real: primero reglas rápidas; después, si el texto cambió, la IA lo revisa.
  const rapido = revisarTextos(resto.idea, resto.power);
  if (rapido) return Response.json({error: rapido.error, campo: rapido.campo}, {status: 422});
  const antes = await db.perfil.findUnique({where: {id}, select: {idea: true, power: true}});
  if (!antes || antes.idea !== resto.idea || antes.power !== resto.power) {
    const ia = await moderarPerfil(resto.idea, resto.power);
    if (ia) return Response.json({error: ia.error, campo: ia.campo}, {status: 422});
  }

  // La fecha de creación la pone el servidor y no cambia al editar.
  // El evento también lo pone el servidor: al guardar, quedas en el evento de hoy.
  const evento = eventoActual();
  const fila = await db.perfil.upsert({
    where: {id},
    create: {id, ...resto, needs: JSON.stringify(needs), createdAt: Date.now(), evento},
    update: {...resto, needs: JSON.stringify(needs), evento}
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
