import type { NextRequest } from "next/server";
import { eventoActual } from "@/lib/evento";
import { leerFase, ponerFase } from "@/lib/fase";
import { entrar, esPresentadora, pideClave, sinClaveMensaje } from "@/lib/presentadora";

/* GET /api/fase: en qué fase está el evento de hoy ("registro" o "matches").
   POST /api/fase {fase, clave?}: la presentadora la cambia (ver lib/presentadora.ts). */

export async function GET() {
  return Response.json({fase: await leerFase(eventoActual())});
}

export async function POST(req: NextRequest) {
  let cuerpo: {fase?: unknown; clave?: unknown};
  try { cuerpo = await req.json(); } catch { return Response.json({error: "El cuerpo no es JSON válido."}, {status: 400}); }
  if (cuerpo.fase !== "registro" && cuerpo.fase !== "matches") return Response.json({error: "Fase desconocida."}, {status: 400});

  if (!(await esPresentadora(req)) && !(await entrar(req, cuerpo.clave))) {
    return Response.json({error: pideClave() ? "Clave incorrecta." : sinClaveMensaje(), pideClave: pideClave()}, {status: 403});
  }
  await ponerFase(eventoActual(), cuerpo.fase);
  return Response.json({fase: cuerpo.fase});
}
