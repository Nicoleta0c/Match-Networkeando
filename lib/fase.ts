/* La fase de cada evento:
   - "registro": la gente llena su perfil y espera. Todavía no ve su match.
   - "matches": la presentadora tocó «Empezar los matches» y en todos los celulares aparece el match.
   Se guarda en un archivo pequeño (prisma/fase.json) para que no se pierda si el servidor se reinicia.
   Cada evento empieza en "registro". */
import { promises as fs } from "node:fs";
import path from "node:path";

export type Fase = "registro" | "matches";
const ARCHIVO = path.join(process.cwd(), "prisma", "fase.json");

async function leerTodo(): Promise<Record<string, Fase>> {
  try {
    const d = JSON.parse(await fs.readFile(ARCHIVO, "utf8"));
    return d && typeof d === "object" ? d : {};
  } catch { return {}; }
}

export async function leerFase(evento: string): Promise<Fase> {
  return (await leerTodo())[evento] === "matches" ? "matches" : "registro";
}

export async function ponerFase(evento: string, fase: Fase) {
  const todo = await leerTodo();
  todo[evento] = fase;
  await fs.writeFile(ARCHIVO, JSON.stringify(todo, null, 2));
}
