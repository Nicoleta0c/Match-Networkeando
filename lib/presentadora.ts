/* ¿Quién es la presentadora? Puede cambiar la fase, ver todos los perfiles y quitar los malos.
   Entra solo quien escriba la clave CLAVE_PRESENTADORA (en .env.local, o en las Variables de Railway).
   Al escribirla bien se guarda una cookie que JavaScript no puede leer, válida por un día.
   Si la clave no está puesta, nadie entra (ni en tu computadora): el panel avisa que falta. */
import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

const COOKIE = "nw_presentadora";

const clave = () => (process.env.CLAVE_PRESENTADORA || "").trim();
/** Lo que se guarda en la cookie: un hash de la clave, nunca la clave misma. */
const sello = (c: string) => createHash("sha256").update("networkeando-presentadora:" + c).digest("hex");

export async function esPresentadora(_req: NextRequest) {
  const c = clave();
  if (!c) return false;
  return (await cookies()).get(COOKIE)?.value === sello(c);
}

/** Si la clave es correcta, deja la cookie puesta (un día). */
export async function entrar(req: NextRequest, intento: unknown) {
  const c = clave();
  if (!c || typeof intento !== "string" || intento !== c) {
    // Clave equivocada: espera 1 segundo, para que nadie pueda probar miles de claves rápido.
    if (c && intento !== undefined) await new Promise(r => setTimeout(r, 1000));
    return false;
  }
  (await cookies()).set(COOKIE, sello(c), {httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24, secure: req.nextUrl.protocol === "https:"});
  return true;
}

export const pideClave = () => !!clave();

/** Mensaje cuando alguien sin permiso intenta entrar. */
export const sinClaveMensaje = () => pideClave()
  ? "Escribe la clave de la presentadora."
  : "Falta la clave de la presentadora: ponla como CLAVE_PRESENTADORA en .env.local (o en las Variables de Railway) y reinicia la app.";
