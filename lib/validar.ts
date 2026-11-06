import { AREAS, LIMITES } from "./match";

/* Revisa en el servidor lo que manda el navegador. Mismos tipos y largos que limpiar(). */
export type PerfilEntrada = {idea: string; needs: number[]; power: string; anon: boolean; alias: string; que: string; contact: string};

export function validarPerfil(d: unknown): {ok: true; datos: PerfilEntrada} | {ok: false; error: string} {
  if (!d || typeof d !== "object" || Array.isArray(d)) return {ok: false, error: "El cuerpo debe ser un objeto JSON."};
  const o = d as Record<string, unknown>;

  const texto = (campo: keyof typeof LIMITES): string | null => {
    const v = o[campo];
    if (v === undefined || v === null) return "";
    if (typeof v !== "string") return null;
    return v.trim();
  };
  const campos = {} as Record<keyof typeof LIMITES, string>;
  for (const campo of Object.keys(LIMITES) as (keyof typeof LIMITES)[]) {
    const v = texto(campo);
    if (v === null) return {ok: false, error: `"${campo}" debe ser texto.`};
    if (v.length > LIMITES[campo]) return {ok: false, error: `"${campo}" puede tener como máximo ${LIMITES[campo]} caracteres.`};
    campos[campo] = v;
  }
  // Los dos son obligatorios: el sueño y el superpoder.
  if (!campos.idea) return {ok: false, error: "Escribe tu sueño para continuar."};
  if (!campos.power) return {ok: false, error: "Escribe tu superpoder para continuar."};

  if (o.anon !== undefined && typeof o.anon !== "boolean") return {ok: false, error: '"anon" debe ser true o false.'};
  const anon = o.anon !== false;

  let needs: number[] = [];
  if (o.needs !== undefined) {
    if (!Array.isArray(o.needs) || !o.needs.every(x => Number.isInteger(x) && x >= 1 && x <= AREAS.length)) {
      return {ok: false, error: `"needs" debe ser una lista de números del 1 al ${AREAS.length}.`};
    }
    needs = [...new Set(o.needs as number[])].slice(0, 3);
  }
  if (!campos.idea) needs = [];

  if (!anon && !campos.alias) return {ok: false, error: "Escribe tu nombre o cambia a Anónimo."};
  if (!anon && !campos.contact) return {ok: false, error: "Agrega cómo contactarte para que tus matches puedan escribirte."};

  return {ok: true, datos: {
    idea: campos.idea, needs, power: campos.power, anon,
    alias: anon ? "" : campos.alias, que: anon ? "" : campos.que, contact: anon ? "" : campos.contact
  }};
}
