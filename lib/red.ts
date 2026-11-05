/* La red del Mapa de Sueños: cada persona es un nodo y cada empalme es una línea.
   Se usa en el servidor (/api/mapa, con los datos reales) y en el navegador (modo demo).
   No lleva nombres ni textos: solo si la persona tiene sueño y con quién empalma. */
import { UMBRAL, analizar, type Perfil } from "./match";

/** 2 = doble vía (se ayudan los dos), 1 = una vía, 0 = cerca pero no empalman. */
export type TipoEnlace = 0 | 1 | 2;

export type Red = {
  /** El evento de hoy (su nombre o su fecha). */
  evento: string;
  /** Los eventos con gente, del más viejo al más nuevo. */
  eventos: {nombre: string; n: number}[];
  /** k: clave estable sin datos personales; e: índice del evento; s: 1 si escribió un sueño (0 = hacedor). */
  nodos: {k: string; e: number; s: 0 | 1}[];
  /** [a, b, tipo] con índices de nodos. En una vía, a es quien ayuda y b quien tiene el sueño. */
  enlaces: [number, number, TipoEnlace][];
};

/* Los "cerca pero no empalman" llenan la pantalla si son muchos: cada persona muestra solo sus 2 más cercanos. */
const CERCA = UMBRAL - 15, MAX_CERCA = 2;

export function construirRed(grupos: {evento: string; perfiles: Perfil[]}[], actual: string, clave: (id: string) => string): Red {
  const red: Red = {evento: actual, eventos: [], nodos: [], enlaces: []};
  grupos.forEach(g => {
    if (!g.perfiles.length) return;
    const e = red.eventos.push({nombre: g.evento, n: g.perfiles.length}) - 1;
    const base = red.nodos.length;
    g.perfiles.forEach(p => red.nodos.push({k: clave(p.id), e, s: p.idea ? 1 : 0}));
    const cerca: [number, number, number][] = [];
    const ps = g.perfiles;
    for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) {
      const ab = analizar(ps[i], ps[j]), ba = analizar(ps[j], ps[i]);
      const pct = Math.max(ab.pct, ba.pct);
      if (pct >= UMBRAL) {
        // ab.conexion.teAyuda: j le sirve al sueño de i. ba.conexion.teAyuda: i le sirve al de j.
        const jAyuda = !!(ab.conexion?.teAyuda || ba.conexion?.leAyudas), iAyuda = !!(ba.conexion?.teAyuda || ab.conexion?.leAyudas);
        if (jAyuda && iAyuda) red.enlaces.push([base + i, base + j, 2]);
        else red.enlaces.push(iAyuda ? [base + i, base + j, 1] : [base + j, base + i, 1]);
      } else if (pct >= CERCA) cerca.push([i, j, pct]);
    }
    // De los cercanos, solo los más fuertes de cada persona.
    const usados = new Map<number, number>();
    cerca.sort((x, y) => y[2] - x[2]).forEach(([i, j]) => {
      if ((usados.get(i) ?? 0) >= MAX_CERCA || (usados.get(j) ?? 0) >= MAX_CERCA) return;
      usados.set(i, (usados.get(i) ?? 0) + 1); usados.set(j, (usados.get(j) ?? 0) + 1);
      red.enlaces.push([base + i, base + j, 0]);
    });
  });
  return red;
}

/** "2026-11-06" -> "6 nov 2026". Un nombre puesto a mano se queda igual. */
export function nombreEvento(e: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(e);
  if (!m) return e;
  const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${+m[3]} ${meses[+m[2] - 1]} ${m[1]}`;
}
