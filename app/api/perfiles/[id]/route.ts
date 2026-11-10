import type { NextRequest } from "next/server";
import { db, aDocumento } from "@/lib/db";
import { idDeCookie } from "@/lib/identidad";
import { revisarTextos, validarPerfil } from "@/lib/validar";
import { moderarPerfil } from "@/lib/moderar";
import { eventoActual } from "@/lib/evento";
import { leerQuitados, quitar } from "@/lib/almacen";

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
  const evento = await eventoActual();
  const existente = await db.perfil.findUnique({where: {id}});
  const antes = existente && existente.evento === evento ? existente : null;
  if (!antes || antes.idea !== resto.idea || antes.power !== resto.power) {
    const ia = await moderarPerfil(resto.idea, resto.power);
    if (ia) return Response.json({error: ia.error, campo: ia.campo}, {status: 422});
  }

  // ¿Tu perfil era de un evento anterior? Antes de pasarte al evento activo, dejamos una copia en el
  // anterior, para que ese evento no pierda a nadie (sus números, su mapa y sus matches quedan igual).
  if (existente && existente.evento && existente.evento !== evento) {
    const {id: _viejo, updatedAt: _u, ...datos} = existente;
    const copia = id + "@" + existente.evento;
    await db.perfil.upsert({where: {id: copia}, create: {...datos, id: copia}, update: datos});
    if ((await leerQuitados(existente.evento)).has(id)) await quitar(existente.evento, copia, true);
  }

  // La fecha de creación la pone el servidor (y es nueva si es tu primer perfil en este evento).
  // El evento también lo pone el servidor: al guardar, quedas en el evento activo.
  const fila = await db.perfil.upsert({
    where: {id},
    create: {id, ...resto, needs: JSON.stringify(needs), createdAt: Date.now(), evento},
    update: {...resto, needs: JSON.stringify(needs), evento, ...(antes ? {} : {createdAt: Date.now(), likes: "[]"})}
  });
  return Response.json(aDocumento(fila));
}

/* DELETE /api/perfiles/[id]: borra tu perfil. */
export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/perfiles/[id]">) {
  const id = await esMio(ctx);
  if (!id) return Response.json({error: "Solo puedes borrar tu propio perfil."}, {status: 403});
  // Solo tu perfil del evento activo: lo de eventos anteriores queda guardado.
  await db.perfil.deleteMany({where: {id, evento: await eventoActual()}});
  return new Response(null, {status: 204});
}
