/* Un archivo pequeño (estado.json) con lo que decide la presentadora en cada evento:
   - la fase ("registro" o "matches"),
   - los perfiles que quitó (por si alguien escribió algo malo),
   - la ronda: sube cada vez que ella pide «Mostrar match de nuevo» (a todos les vuelve el botón).
   Vive en la misma carpeta que la base de datos (DATABASE_URL): así, al publicar en Railway o Render,
   queda en el disco y no se pierde si el servidor se reinicia. */
import { promises as fs } from "node:fs";
import path from "node:path";

export type Fase = "registro" | "matches";
type Estado = {fase: Record<string, Fase>; quitados: Record<string, string[]>; ronda: Record<string, number>};

/** La carpeta de la base de datos. "file:./dev.db" es relativo a la carpeta prisma (como lo lee Prisma). */
function carpetaDatos() {
  const url = process.env.DATABASE_URL || "file:./dev.db";
  const ruta = url.startsWith("file:") ? url.slice(5) : "./dev.db";
  const absoluta = path.isAbsolute(ruta) ? ruta : path.join(process.cwd(), "prisma", ruta);
  return path.dirname(absoluta);
}
const ARCHIVO = () => path.join(carpetaDatos(), "estado.json");

async function leer(): Promise<Estado> {
  try {
    const d = JSON.parse(await fs.readFile(ARCHIVO(), "utf8"));
    return {fase: d?.fase ?? {}, quitados: d?.quitados ?? {}, ronda: d?.ronda ?? {}};
  } catch { return {fase: {}, quitados: {}, ronda: {}}; }
}
async function escribir(e: Estado) {
  await fs.writeFile(ARCHIVO(), JSON.stringify(e, null, 2));
}

export async function leerFase(evento: string): Promise<Fase> {
  return (await leer()).fase[evento] === "matches" ? "matches" : "registro";
}
export async function ponerFase(evento: string, fase: Fase) {
  const e = await leer();
  e.fase[evento] = fase;
  await escribir(e);
}

/** Los perfiles que la presentadora quitó en este evento. */
export async function leerQuitados(evento: string): Promise<Set<string>> {
  return new Set((await leer()).quitados[evento] ?? []);
}
export async function quitar(evento: string, id: string, quitado: boolean) {
  const e = await leer();
  const s = new Set(e.quitados[evento] ?? []);
  if (quitado) s.add(id); else s.delete(id);
  e.quitados[evento] = [...s];
  await escribir(e);
}

/** La ronda de matches de este evento. */
export async function leerRonda(evento: string): Promise<number> {
  return (await leer()).ronda[evento] ?? 0;
}
/** «Mostrar match de nuevo»: a todos les vuelve a salir el botón «Ver mi match». */
export async function nuevaRonda(evento: string) {
  const e = await leer();
  e.ronda[evento] = (e.ronda[evento] ?? 0) + 1;
  await escribir(e);
}
/** «Reiniciar matches»: el evento vuelve a registro. Los perfiles y los quitados se quedan. */
export async function reiniciarEvento(evento: string) {
  const e = await leer();
  e.fase[evento] = "registro";
  e.ronda[evento] = (e.ronda[evento] ?? 0) + 1;
  await escribir(e);
}
