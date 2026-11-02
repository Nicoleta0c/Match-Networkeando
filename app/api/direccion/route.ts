import os from "node:os";
import type { NextRequest } from "next/server";

/* GET /api/direccion: la dirección de esta laptop en el Wi-Fi (por ejemplo http://192.168.1.20:3000).
   Si abres la app como "localhost", el QR usa esta dirección para que los celulares puedan entrar.
   Solo responde a quien está en la misma laptop, para no mostrar la IP interna a nadie más. */
const LOCALES = new Set(["localhost", "127.0.0.1", "[::1]"]);
const PRIVADA = /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/;

export function GET(req: NextRequest) {
  // La cabecera Host trae lo que la persona escribió en el navegador (en producción
  // req.nextUrl usa el hostname con el que arrancó el servidor, como 0.0.0.0).
  const host = new URL("http://" + (req.headers.get("host") || "x"));
  if (!LOCALES.has(host.hostname)) return Response.json({url: null});
  const ips = Object.values(os.networkInterfaces()).flat()
    .filter(i => i && i.family === "IPv4" && !i.internal).map(i => i!.address);
  const ip = ips.find(a => PRIVADA.test(a)) ?? ips[0];
  const puerto = host.port;
  return Response.json({url: ip ? "http://" + ip + (puerto ? ":" + puerto : "") : null});
}
