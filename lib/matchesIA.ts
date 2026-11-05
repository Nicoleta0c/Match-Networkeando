/* Matches que eligió la IA, guardados en la memoria del servidor.
   El chat solo deja escribirle a tu match. El servidor lo revisa con el método básico,
   pero la IA a veces elige a alguien que el método básico no ve: así ese chat también funciona.
   Se pierde si el servidor se reinicia (entonces solo cuenta el método básico). */

const g = globalThis as typeof globalThis & {__matchesIA?: Map<string, Set<string>>};
const aprobados = (g.__matchesIA ??= new Map());

export function aprobarMatches(yo: string, ids: string[]) {
  const s = aprobados.get(yo) ?? new Set<string>();
  ids.forEach(id => s.add(id));
  aprobados.set(yo, s);
}

/** ¿La IA juntó a estas dos personas (en cualquier dirección)? */
export function matchIA(a: string, b: string) {
  return !!(aprobados.get(a)?.has(b) || aprobados.get(b)?.has(a));
}
