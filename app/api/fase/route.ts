import type { NextRequest } from "next/server";
import { eventoActual } from "@/lib/evento";
import { leerFase, ponerFase } from "@/lib/fase";

/* GET /api/fase: en qué fase está el evento de hoy ("registro" o "matches").
   POST /api/fase {fase, clave}: la presentadora la cambia.

   Quién puede cambiarla:
   - Si en .env.local pusiste CLAVE_PRESENTADORA="...", hay que mandar esa clave.
   - Si no la pusiste, solo desde la misma computadora donde corre la app (localhost). */

const LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

export async function GET() {
  return Response.json({fase: await leerFase(eventoActual())});
}

export async function POST(req: NextRequest) {
  let cuerpo: {fase?: unknown; clave?: unknown};
  try { cuerpo = await req.json(); } catch { return Response.json({error: "El cuerpo no es JSON válido."}, {status: 400}); }
  if (cuerpo.fase !== "registro" && cuerpo.fase !== "matches") return Response.json({error: "Fase desconocida."}, {status: 400});

  const clave = (process.env.CLAVE_PRESENTADORA || "").trim();
  const permitido = clave ? cuerpo.clave === clave : LOCAL.test(req.headers.get("host") || "");
  if (!permitido) {
    return Response.json({error: clave ? "Clave incorrecta." : "Solo se puede desde la computadora de la presentadora.", pideClave: !!clave}, {status: 403});
  }
  await ponerFase(eventoActual(), cuerpo.fase);
  return Response.json({fase: cuerpo.fase});
}
