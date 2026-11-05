import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

/* Identidad anónima.
   La cookie guarda una LLAVE secreta al azar que JavaScript no puede leer. Tu id (el que ven los demás
   en el match, el chat y el mapa) sale de esa llave con un hash: con la llave se calcula el id, pero
   con el id no se puede sacar la llave. Así nadie puede hacerse pasar por otra persona copiando su id.

   Antes la cookie se llamaba "nw_uid" y era igual al id, que la app muestra a todos. Por eso esa
   cookie vieja ya no sirve para nada y se borra. */
const COOKIE = "nw_llave";
const COOKIE_VIEJA = "nw_uid";
const UN_ANO = 60 * 60 * 24 * 365;
const FORMATO = /^[0-9a-f]{64}$/;

/** El id público que sale de una llave, con el mismo formato de siempre (8-4-4-4-12). */
function idDeLlave(llave: string) {
  const h = createHash("sha256").update("networkeando-id:" + llave).digest("hex");
  return [h.slice(0, 8), h.slice(8, 12), h.slice(12, 16), h.slice(16, 20), h.slice(20, 32)].join("-");
}

/** Devuelve el id de esta persona. Si no tiene llave, le crea una y la guarda en la cookie. */
export async function miId(req: NextRequest) {
  const c = await cookies();
  if (c.get(COOKIE_VIEJA)) c.delete(COOKIE_VIEJA);
  const actual = c.get(COOKIE)?.value;
  if (actual && FORMATO.test(actual)) return idDeLlave(actual);
  // 32 bytes al azar: imposible de adivinar.
  const nueva = randomBytes(32).toString("hex");
  c.set(COOKIE, nueva, {httpOnly: true, sameSite: "lax", path: "/", maxAge: UN_ANO, secure: req.nextUrl.protocol === "https:"});
  return idDeLlave(nueva);
}

/** El id de la cookie, sin crear una llave nueva. */
export async function idDeCookie() {
  const v = (await cookies()).get(COOKIE)?.value;
  return v && FORMATO.test(v) ? idDeLlave(v) : null;
}
