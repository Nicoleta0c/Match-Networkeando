import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

/* Identidad anónima: un id al azar guardado en una cookie que JavaScript no puede leer. */
const COOKIE = "nw_uid";
const UN_ANO = 60 * 60 * 24 * 365;
const FORMATO = /^[0-9a-f-]{36}$/;

/** Devuelve el id de esta persona. Si no tiene, le crea uno y lo guarda en la cookie. */
export async function miId(req: NextRequest) {
  const c = await cookies();
  const actual = c.get(COOKIE)?.value;
  if (actual && FORMATO.test(actual)) return actual;
  const nuevo = crypto.randomUUID();
  c.set(COOKIE, nuevo, {httpOnly: true, sameSite: "lax", path: "/", maxAge: UN_ANO, secure: req.nextUrl.protocol === "https:"});
  return nuevo;
}

/** El id de la cookie, sin crear uno nuevo. */
export async function idDeCookie() {
  const v = (await cookies()).get(COOKIE)?.value;
  return v && FORMATO.test(v) ? v : null;
}
