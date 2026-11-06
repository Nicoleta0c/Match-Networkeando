// Muestra cómo le sale el match a varias personas del evento de hoy (con el método básico, sin IA):
// su sueño y sus 3 mejores matches, con la frase de "En esto te puede ayudar".
//
//   node --no-warnings scripts/probar-matches.mjs        (8 personas al azar)
//   node --no-warnings scripts/probar-matches.mjs 20     (20 personas)
import { PrismaClient } from "@prisma/client";
const { limpiar, ordenarMatches, UMBRAL } = await import("../lib/match.ts");

const cuantas = Number(process.argv[2]) || 8;
const evento = (process.env.EVENTO || "").trim().slice(0, 60) ||
  new Intl.DateTimeFormat("en-CA", {timeZone: "America/Santo_Domingo", year: "numeric", month: "2-digit", day: "2-digit"}).format(new Date());

const db = new PrismaClient();
const filas = await db.perfil.findMany({where: {evento}});
await db.$disconnect();
const lista = (t) => { try { const v = JSON.parse(t); return Array.isArray(v) ? v : []; } catch { return []; } };
const gente = filas.map(f => limpiar(f.id, {...f, needs: lista(f.needs), likes: []})).filter(p => p.power);
if (!gente.length) { console.log(`No hay nadie en el evento ${evento}. Carga ejemplos: node --no-warnings scripts/simulacion.mjs guardar`); process.exit(0); }

// Unas personas con sueño, repartidas por la lista (siempre las mismas para poder comparar).
const conSueno = gente.filter(p => p.idea);
const paso = Math.max(1, Math.floor(conSueno.length / cuantas));
const elegidas = conSueno.filter((_, i) => i % paso === 0).slice(0, cuantas);

for (const yo of elegidas) {
  console.log("\n━━━ SUEÑO: " + yo.idea);
  console.log("    (su superpoder: " + yo.power + ")");
  const top = ordenarMatches(yo, gente).filter(x => x.r.pct >= UMBRAL).slice(0, 3);
  if (!top.length) { console.log("    Sin match todavía."); continue; }
  top.forEach((x, i) => {
    const titulo = x.r.conexion?.teAyuda ? "En esto te puede ayudar" : "En esto puedes ayudar tú";
    console.log(`  ${i + 1}. ${x.r.pct}% · superpoder: "${x.o.power}"`);
    console.log(`     ${titulo}: ${x.r.conexion?.texto ?? "(sin texto)"}`);
  });
}
console.log(`\n${elegidas.length} personas de ${gente.length} en el evento ${evento}.`);
