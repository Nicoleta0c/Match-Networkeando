/* Punto de encuentro: la app le asigna a cada pareja un lugar del evento.
   Así nadie tiene que decir dónde está; los dos ven el mismo punto. */

/** Lugares del evento. Los organizadores ponen un letrero con cada número. (Es un ejemplo: cámbialos por los del salón.) */
export const PUNTOS = [
  {n: 1, lugar: "Mesa del café"},
  {n: 2, lugar: "Entrada principal"},
  {n: 3, lugar: "Junto al escenario"},
  {n: 4, lugar: "Rincón de las plantas"},
  {n: 5, lugar: "Barra de bebidas"},
  {n: 6, lugar: "Puerta de la terraza"}
];

export type Punto = (typeof PUNTOS)[number];

/** Siempre da el mismo punto para la misma pareja, sin importar quién lo pida. */
export function puntoDeEncuentro(a: string, b: string): Punto {
  const llave = [a, b].sort().join("|");
  let h = 2166136261;
  for (let i = 0; i < llave.length; i++) { h ^= llave.charCodeAt(i); h = Math.imul(h, 16777619); }
  // Mezcla final para que parejas parecidas no caigan todas en el mismo punto.
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
  return PUNTOS[(h >>> 0) % PUNTOS.length];
}
