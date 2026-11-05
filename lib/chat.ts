/* Reglas del chat temporal. Las usan el servidor y el navegador. */

/** Largo máximo de un mensaje. Es para ponerse de acuerdo, no para conversar horas. */
export const MAX_TEXTO = 200;
/** Los mensajes se borran solos después de estas horas. */
export const HORAS = 12;
/** Mensajes de un toque. */
export const RAPIDAS = [
  "¡Hola! Me salió que encajamos. ¿Dónde estás?",
  "Voy para allá.",
  "Ya llegué 👋",
  "Dame 5 minutos y llego.",
  "Ahora no puedo, ¿te escribo en un rato?"
];

export type Mensaje = {id: number; de: string; para: string; texto: string; creado: number};

/** Limpia lo que escribió la persona: sin espacios de más y sin saltos de línea. */
export function limpiarTexto(t: unknown) {
  if (typeof t !== "string") return "";
  return t.replace(/\s+/g, " ").trim();
}
