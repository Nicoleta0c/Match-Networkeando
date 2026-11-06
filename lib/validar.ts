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

/* ---------- Que escriban algo real ----------
   Reglas rápidas (sirven en el celular y en el servidor) contra textos de relleno o de broma:
   letras al azar, risas, "nada", "asdf", groserías, o textos demasiado cortos para decir algo. */
const sinTildes = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const RELLENO = /(^|[^a-z])(asdf\w*|qwer\w*|zxcv\w*|hjkl\w*|(ja){2,}j?|(je){2,}j?|(ha){2,}h?|(ji){2,}j?|xd+|lol|nada|no se|nose|ninguno|ninguna|test|prueba|hola|ok|equis|bla+(bla)*)([^a-z]|$)/;
const GROSERIAS = /(^|[^a-z])(mierda|puta|puto|pendej\w*|mamague\w*|singa\w*|cabron\w*|maldit\w*|culo|verga|idiota|estupid\w*)([^a-z]|$)/;

/** Revisa que el sueño y el superpoder digan algo real. Devuelve el problema (o null si está bien). */
export function revisarTextos(idea: string, power: string): {campo: "idea" | "poder"; error: string} | null {
  const malo = (t: string, minLetras: number) => {
    const n = sinTildes(t).trim();
    const letras = (n.match(/[a-zñ]/g) || []).length;
    const palabras = n.split(/\s+/).filter(w => /[a-zñ]{2,}/.test(w));
    if (letras < minLetras) return "corto";
    if (letras < n.replace(/\s/g, "").length * 0.6) return "raro";              // casi puros números o símbolos
    if (/(.)\1{3,}/.test(n)) return "raro";                                      // "aaaa", "!!!!"
    if (palabras.some(w => w.length >= 5 && !/[aeiouy]/.test(w))) return "raro"; // "sdfgh"
    if (GROSERIAS.test(n)) return "grosero";
    if (RELLENO.test(n) && palabras.length <= 4) return "relleno";
    return null;
  };
  const MENSAJE = {
    corto: "es muy corto. Cuéntalo en una frase, con tus palabras.",
    raro: "no se entiende. Escríbelo con palabras reales.",
    grosero: "tiene palabras ofensivas. Escríbelo de forma respetuosa.",
    relleno: "parece de relleno o de broma. Escribe algo real para que la app te encuentre un buen match."
  } as const;
  const a = malo(idea, 12);
  if (a) return {campo: "idea", error: "Tu sueño " + MENSAJE[a]};
  const b = malo(power, 6);
  if (b) return {campo: "poder", error: "Tu superpoder " + MENSAJE[b]};
  return null;
}
