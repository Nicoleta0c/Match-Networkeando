/* Dibujo de los hilos dorados (SVG) que unen dos elementos de la pantalla. Solo navegador. */

export type Punto = [number, number];
export type Lado = "izq" | "der" | "centro";

/** Punto de un elemento (borde izquierdo, derecho o centro) medido dentro de `ref`. */
export function punto(el: Element, ref: Element, lado: Lado): Punto {
  const r = el.getBoundingClientRect(), R = ref.getBoundingClientRect();
  const x = lado === "izq" ? r.left : lado === "der" ? r.right : r.left + r.width / 2;
  return [x - R.left, r.top + r.height / 2 - R.top];
}

/** Curva suave en forma de S entre dos puntos. */
export function curva(a: Punto, b: Punto, comba: number) {
  const mx = (a[0] + b[0]) / 2;
  return `M${a[0]} ${a[1]} C${mx} ${a[1] + comba}, ${mx} ${b[1] - comba}, ${b[0]} ${b[1]}`;
}

/** Curva en forma de U que baja `profundidad` entre los dos puntos. */
export function enU(a: Punto, b: Punto, profundidad: number) {
  const dx = (b[0] - a[0]) * .18;
  return `M${a[0]} ${a[1]} C${a[0] + dx} ${a[1] + profundidad}, ${b[0] - dx} ${b[1] + profundidad}, ${b[0]} ${b[1]}`;
}

export const sinMovimiento = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Dibuja el trazo de un path como si se tejiera. Devuelve una promesa que se cumple al terminar. */
export function trazar(path: SVGPathElement, dur: number, espera = 0): Promise<void> {
  const L = path.getTotalLength();
  const quieto = sinMovimiento();
  path.style.transition = "none";
  path.style.strokeDasharray = String(L);
  path.style.strokeDashoffset = quieto ? "0" : String(L);
  path.getBoundingClientRect();
  if (quieto) return Promise.resolve();
  return new Promise(ok => setTimeout(() => {
    path.style.transition = `stroke-dashoffset ${dur}ms cubic-bezier(.23,1,.32,1)`;
    path.style.strokeDashoffset = "0";
    setTimeout(ok, dur);
  }, espera));
}
