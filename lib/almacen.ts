/* Un archivo pequeño (estado.json) con lo que decide la presentadora en cada evento:
   - la fase ("registro" o "matches"),
   - los perfiles que quitó (por si alguien escribió algo malo),
   - la ronda: sube cada vez que ella pide «Mostrar match de nuevo» (a todos les vuelve el botón),
   - los eventos que ella creó (con su nombre) y cuál es el activo (el que recibe los registros nuevos).
   Vive en la misma carpeta que la base de datos (DATABASE_URL): así, al publicar en Railway o Render,
   queda en el disco y no se pierde si el servidor se reinicia. */
import { promises as fs } from "node:fs";
import path from "node:path";

export type Fase = "registro" | "matches";
export type InfoEvento = {nombre: string; creado: number};
type Estado = {fase: Record<string, Fase>; quitados: Record<string, string[]>; ronda: Record<string, number>; eventos: Record<string, InfoEvento>; activo?: string};

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
    return {fase: d?.fase ?? {}, quitados: d?.quitados ?? {}, ronda: d?.ronda ?? {}, eventos: d?.eventos ?? {}, activo: typeof d?.activo === "string" ? d.activo : undefined};
  } catch { return {fase: {}, quitados: {}, ronda: {}, eventos: {}}; }
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

/** «Borrar todos los perfiles»: el evento empieza de cero (registro, sin quitados). Los perfiles se borran aparte. */
export async function limpiarEvento(evento: string) {
  const e = await leer();
  e.fase[evento] = "registro";
  e.quitados[evento] = [];
  e.ronda[evento] = (e.ronda[evento] ?? 0) + 1;
  await escribir(e);
}

/* ---------- Eventos ----------
   Cada perfil guarda su evento. Aquí se guardan los nombres y cuál es el activo.
   Crear un evento nuevo no borra nada: el anterior queda con todos sus perfiles. */

/** El evento activo que eligió la presentadora (o nada, si nunca creó uno). */
export async function leerActivo(): Promise<string | undefined> {
  return (await leer()).activo;
}
/** Los nombres guardados de los eventos. */
export async function leerEventos(): Promise<Record<string, InfoEvento>> {
  return (await leer()).eventos;
}
/** Crea un evento nuevo y lo deja activo (vacío, en registro). Devuelve su id. */
export async function crearEvento(nombre: string, hoy: string): Promise<string> {
  const e = await leer();
  let id = hoy + "-" + Math.random().toString(36).slice(2, 6);
  while (e.eventos[id]) id = hoy + "-" + Math.random().toString(36).slice(2, 6);
  e.eventos[id] = {nombre, creado: Date.now()};
  e.fase[id] = "registro";
  e.activo = id;
  await escribir(e);
  return id;
}
/** Vuelve a dejar activo un evento (por ejemplo, uno anterior). */
export async function activarEvento(id: string) {
  const e = await leer();
  e.activo = id;
  await escribir(e);
}
/** Le cambia el nombre a un evento. */
export async function renombrarEvento(id: string, nombre: string) {
  const e = await leer();
  e.eventos[id] = {nombre, creado: e.eventos[id]?.creado ?? Date.now()};
  await escribir(e);
}
