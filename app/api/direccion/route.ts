import dgram from "node:dgram";
import os from "node:os";
import type { NextRequest } from "next/server";

/* GET /api/direccion: la dirección de esta laptop en el Wi-Fi (por ejemplo http://192.168.1.20:3000).
   Si abres la app como "localhost", el QR usa esta dirección para que los celulares puedan entrar.
   Solo responde a quien está en la misma laptop, para no mostrar la IP interna a nadie más. */
const LOCALES = new Set(["localhost", "127.0.0.1", "[::1]"]);
const PRIVADA = /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/;

/* La IP de la conexión por la que sale internet (la ruta por defecto, normalmente el Wi-Fi).
   "Conectar" un socket UDP no envía nada: solo le pregunta al sistema qué red usaría. */
function ipDeSalida(): Promise<string | null> {
  return new Promise(ok => {
    const s = dgram.createSocket("udp4");
    const fin = (ip: string | null) => { try { s.close(); } catch {} ok(ip); };
    s.on("error", () => fin(null));
    s.connect(53, "1.1.1.1", () => {
      try { fin(s.address().address); } catch { fin(null); }
    });
  });
}

/* Si no hay ruta a internet, la primera IP privada que tenga la laptop. */
function primeraPrivada() {
  const ips = Object.values(os.networkInterfaces()).flat()
    .filter(i => i && i.family === "IPv4" && !i.internal).map(i => i!.address);
  return ips.find(a => PRIVADA.test(a)) ?? ips[0] ?? null;
}

export async function GET(req: NextRequest) {
  // La cabecera Host trae lo que la persona escribió en el navegador (en producción
  // req.nextUrl usa el hostname con el que arrancó el servidor, como 0.0.0.0).
  const host = new URL("http://" + (req.headers.get("host") || "x"));
  if (!LOCALES.has(host.hostname)) return Response.json({url: null});
  const salida = await ipDeSalida();
  const ip = salida && salida !== "0.0.0.0" ? salida : primeraPrivada();
  const puerto = host.port;
  return Response.json({url: ip ? "http://" + ip + (puerto ? ":" + puerto : "") : null});
}
