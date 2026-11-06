/* ¿Quién es la presentadora? Puede cambiar la fase, ver todos los perfiles y quitar los malos.
   - Si en .env.local pusiste CLAVE_PRESENTADORA="...", entra quien escriba esa clave una vez
     (se le guarda una cookie que JavaScript no puede leer).
   - Si no la pusiste, solo la computadora donde corre la app (localhost). */
import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

const COOKIE = "nw_presentadora";
const LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

const clave = () => (process.env.CLAVE_PRESENTADORA || "").trim();
/** Lo que se guarda en la cookie: un hash de la clave, nunca la clave misma. */
const sello = (c: string) => createHash("sha256").update("networkeando-presentadora:" + c).digest("hex");

export async function esPresentadora(req: NextRequest) {
  const c = clave();
  if (!c) return LOCAL.test(req.headers.get("host") || "");
  return (await cookies()).get(COOKIE)?.value === sello(c);
}

/** Si la clave es correcta, deja la cookie puesta (un día). */
export async function entrar(req: NextRequest, intento: unknown) {
  const c = clave();
  if (!c || typeof intento !== "string" || intento !== c) return false;
  (await cookies()).set(COOKIE, sello(c), {httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24, secure: req.nextUrl.protocol === "https:"});
  return true;
}

export const pideClave = () => !!clave();
