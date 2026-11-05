/* Respuestas de la persona de ejemplo en el chat de la demo, sin IA.
   Mira lo que escribiste y contesta algo que tenga sentido, usando su perfil. */
import { MAX_TEXTO } from "./chat";

type Otro = {alias?: string; que?: string; power?: string; idea?: string; anon?: boolean};

const norm = (t: string) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const tiene = (t: string, ...palabras: string[]) => palabras.some(p => t.includes(p));
const primeraMin = (t: string) => t ? t[0].toLowerCase() + t.slice(1) : t;

/** Devuelve la respuesta a tu último mensaje. `n` es cuántas veces ya contestó (para no repetirse). */
export function respuestaDemo(otro: Otro, texto: string, n: number): string {
  const t = norm(texto);
  const quien = !otro.anon && otro.alias ? "Soy " + otro.alias.split(/\s+/)[0] + (otro.que ? ", de " + otro.que : "") + ". " : "";
  let r: string;

  if (tiene(t, "ya estoy", "ya llegue", "llegue", "estoy aqui")) {
    r = "¡Perfecto! Voy llegando. Dame un minutito 👋";
  } else if (tiene(t, "donde estas", "donde nos vemos", "donde te encuentro", "donde quedamos")) {
    r = "Estoy cerca de la entrada. ¿Te queda bien vernos ahí?";
  } else if (tiene(t, "voy para", "voy alla", "ya voy", "voy saliendo", "en camino", "vamos")) {
    r = "¡Dale! Te espero. Avísame cuando llegues.";
  } else if (tiene(t, "minuto", "un rato", "ahora no", "despues", "espera", "ocupad")) {
    r = "Sin prisa. Escríbeme cuando puedas y nos vemos.";
  } else if (tiene(t, "como te reconozco", "como eres", "que llevas", "ropa", "color")) {
    r = "Tengo camisa azul. Yo te escribo cuando te vea 😊";
  } else if (tiene(t, "superpoder", "que sabes", "a que te dedicas", "que haces", "en que me ayudas", "como me ayudas")) {
    r = "Mi superpoder: " + primeraMin(otro.power || "ayudar a que los sueños salgan") + ". ¿Te cuento más en persona?";
  } else if (tiene(t, "tu sueno", "tu idea", "tu proyecto", "que quieres hacer", "que quieres lograr", "en que estas")) {
    r = otro.idea ? "Mi sueño es " + primeraMin(otro.idea) + ". Me encantaría oír el tuyo en persona." : "No tengo un sueño propio todavía: quiero sumarme a uno. ¡El tuyo me llamó la atención!";
  } else if (tiene(t, "gracias", "perfecto", "listo", "de acuerdo", "ok", "dale")) {
    r = "¡A ti! Nos vemos ahorita.";
  } else if (tiene(t, "hola", "buenas", "saludos", "que tal", "klk")) {
    r = "¡Hola! " + quien + "Qué bueno que encajamos. ¿Dónde estás? Así nos vemos.";
  } else if (n === 0) {
    r = "¡Hola! " + quien + "Me encantaría hablar contigo. ¿Nos vemos ahorita?";
  } else if (t.includes("?")) {
    r = "¡Buena pregunta! Mejor lo hablamos en persona.";
  } else {
    const varias = [
      "¡Me parece bien! Dime dónde estás y voy.",
      "Claro que sí. Avísame cuando estés libre.",
      "¡Suena bien! Lo hablamos mejor en persona."
    ];
    r = varias[n % varias.length];
  }
  return r.slice(0, MAX_TEXTO);
}
