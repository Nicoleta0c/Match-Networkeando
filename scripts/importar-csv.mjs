/* Carga en la base de datos LOCAL los perfiles de un archivo «Descargar datos» del panel.
   Sirve para probar en tu computadora con los datos de un evento real, sin tocar la app publicada.

   Uso:  node scripts/importar-csv.mjs "C:\ruta\networkeando-2026-11-06.csv" 2026-11-06
   - El segundo dato es el evento donde quedan (por defecto, el del nombre del archivo o hoy).
   - Antes de cargar, borra los perfiles que ya había en ese evento en la base local.
   Los perfiles quedan con ids «importado-1», «importado-2»… (no son los de los celulares reales). */
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

const [archivo, eventoArg] = process.argv.slice(2);
if (!archivo) { console.error("Falta el archivo .csv"); process.exit(1); }
const evento = eventoArg || (archivo.match(/(\d{4}-\d{2}-\d{2})/) || [])[1] || new Date().toISOString().slice(0, 10);

/** Lee el CSV del panel (punto y coma, comillas dobles, con BOM). */
function leerCSV(texto) {
  const filas = []; let fila = [], celda = "", comillas = false;
  texto = texto.replace(/^\uFEFF/, "");
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (comillas) {
      if (c === '"' && texto[i + 1] === '"') { celda += '"'; i++; }
      else if (c === '"') comillas = false;
      else celda += c;
    } else if (c === '"') comillas = true;
    else if (c === ";") { fila.push(celda); celda = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && texto[i + 1] === "\n") i++;
      fila.push(celda); celda = "";
      if (fila.some(x => x !== "")) filas.push(fila);
      fila = [];
    } else celda += c;
  }
  if (celda || fila.length) { fila.push(celda); filas.push(fila); }
  return filas;
}

/** «6/11/2026, 5:23:45 p. m.» (hora de República Dominicana, UTC-4) -> milisegundos. */
function fecha(t) {
  const m = /(\d+)\/(\d+)\/(\d{4}),?\s+(\d+):(\d+)(?::(\d+))?\s*([ap])/i.exec(t || "");
  if (!m) return Date.now();
  let h = +m[4] % 12; if (m[7].toLowerCase() === "p") h += 12;
  return Date.UTC(+m[3], +m[2] - 1, +m[1], h + 4, +m[5], +(m[6] || 0));
}

const filas = leerCSV(readFileSync(archivo, "utf8"));
const cab = filas.shift();
const col = n => cab.indexOf(n);
const C = {fecha: col("Fecha"), nombre: col("Nombre"), contacto: col("Contacto"), que: col("A qué se dedica"), idea: col("Sueño"), power: col("Superpoder")};
if (C.idea < 0 || C.power < 0) { console.error("El archivo no parece un «Descargar datos» del panel."); process.exit(1); }

const db = new PrismaClient();
const {count} = await db.perfil.deleteMany({where: {evento}});
let n = 0;
for (const f of filas) {
  const power = (f[C.power] || "").trim();
  if (!power) continue;
  const nombre = (f[C.nombre] || "").trim();
  const anon = !nombre || nombre === "Anónimo";
  n++;
  await db.perfil.create({data: {
    id: "importado-" + n, evento, idea: (f[C.idea] || "").trim(), power, needs: "[]", anon,
    alias: anon ? "" : nombre, que: anon ? "" : (f[C.que] || "").trim(), contact: anon ? "" : (f[C.contacto] || "").trim(),
    likes: "[]", color: "", createdAt: fecha(f[C.fecha])
  }});
}
console.log(`Evento ${evento}: se quitaron ${count} perfiles que había y se cargaron ${n} del archivo.`);
await db.$disconnect();
