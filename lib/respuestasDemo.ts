/* Respuestas de la persona de ejemplo en el chat de la demo, sin IA.
   Mira lo que escribiste y contesta algo que tenga sentido, usando su perfil y el punto de encuentro. */
import { MAX_TEXTO } from "./chat";
import type { Punto } from "./encuentro";

type Otro = {alias?: string; que?: string; power?: string; idea?: string; anon?: boolean};

const norm = (t: string) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const tiene = (t: string, ...palabras: string[]) => palabras.some(p => t.includes(p));
const primeraMin = (t: string) => t ? t[0].toLowerCase() + t.slice(1) : t;

/** Devuelve la respuesta a tu último mensaje. `n` es cuántas veces ya contestó (para no repetirse). */
export function respuestaDemo(otro: Otro, punto: Punto, texto: string, n: number): string {
  const t = norm(texto);
  const sitio = "punto " + punto.n + " (" + punto.lugar.toLowerCase() + ")";
  const lugar = "el " + sitio, alLugar = "al " + sitio;
  const quien = !otro.anon && otro.alias ? "Soy " + otro.alias.split(/\s+/)[0] + (otro.que ? ", de " + otro.que : "") + ". " : "";
  let r: string;

  if (tiene(t, "ya estoy", "ya llegue", "llegue", "estoy aqui", "estoy en el punto")) {
    r = "¡Perfecto! Voy llegando " + alLugar + ". Dame un minutito 👋";
  } else if (tiene(t, "voy para", "voy al", "ya voy", "voy saliendo", "en camino", "vamos")) {
    r = "¡Dale! Yo también voy para " + lugar + ". Nos vemos ahí.";
  } else if (tiene(t, "minuto", "un rato", "ahora no", "despues", "espera", "ocupad")) {
    r = "Sin prisa. Cuando puedas, te espero en " + lugar + ".";
  } else if (tiene(t, "como te reconozco", "como te encuentro", "como eres", "que llevas", "ropa", "color")) {
    r = "Busca el letrero con el número " + punto.n + ": ahí voy a estar. Yo te escribo cuando llegue 😊";
  } else if (tiene(t, "superpoder", "que sabes", "a que te dedicas", "que haces", "en que me ayudas", "como me ayudas")) {
    r = "Mi superpoder: " + primeraMin(otro.power || "ayudar a que las ideas salgan") + ". ¿Te cuento más en " + lugar + "?";
  } else if (tiene(t, "tu idea", "tu proyecto", "que quieres hacer", "en que estas")) {
    r = otro.idea ? "Mi idea es " + primeraMin(otro.idea) + ". Me encantaría oír la tuya en persona." : "No tengo idea propia: quiero sumarme a una. ¡La tuya me llamó la atención!";
  } else if (tiene(t, "gracias", "perfecto", "listo", "de acuerdo", "ok", "dale")) {
    r = "¡A ti! Nos vemos ahorita en " + lugar + ".";
  } else if (tiene(t, "hola", "buenas", "saludos", "que tal", "klk")) {
    r = "¡Hola! " + quien + "Qué bueno que encajamos. ¿Nos vemos en " + lugar + "?";
  } else if (n === 0) {
    r = "¡Hola! " + quien + "Me encantaría hablar contigo. ¿Nos vemos en " + lugar + "?";
  } else if (t.includes("?")) {
    r = "¡Buena pregunta! Mejor lo hablamos en persona en " + lugar + ".";
  } else {
    const varias = [
      "¡Me parece bien! Te espero en " + lugar + ".",
      "Claro que sí. Avísame cuando vayas para el punto " + punto.n + ".",
      "¡Suena bien! Lo hablamos mejor en persona en " + lugar + "."
    ];
    r = varias[n % varias.length];
  }
  return r.slice(0, MAX_TEXTO);
}
