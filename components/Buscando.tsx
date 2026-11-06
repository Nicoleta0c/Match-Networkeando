"use client";
import { useEffect, useRef, useState } from "react";
import { colorDe, esAnon, nombre, type Perfil } from "@/lib/match";
import { curva, punto, trazar } from "@/lib/hilo";

/* muestra: hasta 6 personas del salón con las que la app prueba el hilo mientras busca. */
export type Busqueda = {id: number; muestra: Perfil[]; pasos: string[]; total: number; reduce: boolean};

/* Carita de los personajes de Networkeando, en el color de cada persona. */
export function Cara({color}: {color: string}) {
  return (
    <svg className="cara" viewBox="0 0 40 40" aria-hidden="true">
      <rect x="3" y="7" width="34" height="30" rx="9" fill={color} stroke="#141414" strokeWidth="2.5"/>
      <rect x="9" y="13" width="22" height="18" rx="5" fill="#F8F8F2"/>
      <circle cx="16" cy="20.5" r="2" fill="#141414"/><circle cx="24" cy="20.5" r="2" fill="#141414"/>
      <path d="M16 25.5q4 4 8 0" stroke="#141414" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <rect x="14" y="2" width="12" height="7" rx="2.5" fill={color} stroke="#141414" strokeWidth="2"/>
    </svg>
  );
}

const recortar = (t: string, n: number) => t.length > n ? t.slice(0, n - 1).trimEnd() + "…" : t;

/* Tu carita a la izquierda; a la derecha va pasando cada persona del salón y la onda se teje
   entre los dos. Al final se queda con tu match y muestra cuánto encajan. */
export function Buscando({b, me, pasoFinal, ganador, pct, etiqueta = "Tu sueño", listo = "¡Listo! Encontramos tu match."}: {b: Busqueda; me: Perfil; pasoFinal: string | null; ganador: string | null; pct: number | null; etiqueta?: string; listo?: string}) {
  const caja = useRef<HTMLDivElement>(null);
  const hilo = useRef<SVGPathElement>(null);
  const [i, setI] = useState(0);
  const [paso, setPaso] = useState(b.pasos[0]);
  const otro = ganador ? b.muestra.find(p => p.id === ganador) ?? b.muestra[i] : b.muestra[i];

  function tejer(dur: number) {
    const c = caja.current, h = hilo.current;
    const izq = c?.querySelector(".tu .cara"), der = c?.querySelector(".otro .cara");
    if (!c || !h || !izq || !der) return;
    h.setAttribute("d", curva(punto(izq, c, "der"), punto(der, c, "izq"), -46));
    trazar(h, b.reduce ? 0 : dur);
  }

  // Prueba el hilo con cada persona, una tras otra, repartidas en el tiempo de la búsqueda.
  useEffect(() => {
    const n = Math.max(1, b.muestra.length), tramo = b.total / n;
    const timers = b.muestra.map((_, k) => setTimeout(() => {
      setI(k);
      setPaso(b.pasos[Math.min(b.pasos.length - 1, Math.floor(k * b.pasos.length / n))]);
    }, k * tramo));
    return () => timers.forEach(clearTimeout);
  }, [b]);

  // Cada vez que cambia la persona de la derecha (o llega el ganador), la onda se vuelve a tejer.
  useEffect(() => {
    const t = setTimeout(() => tejer(ganador ? 700 : Math.min(420, b.total / Math.max(1, b.muestra.length) * .7)), 30);
    return () => clearTimeout(t);
  }, [i, ganador, b]);

  return (
    <>
      <div className={"tejido" + (ganador ? " listo" : "")} ref={caja}>
        <svg className="hilos" aria-hidden="true"><path className="hilo" ref={hilo}/></svg>
        <div className="extremo tu">
          <Cara color="var(--a)"/>
          <div className="ficha"><small>{etiqueta}</small><p>{recortar(me.idea || me.power, 70)}</p></div>
        </div>
        {otro && (
          <div className="extremo otro" key={otro.id}>
            <Cara color={esAnon(otro) ? "#3A3A34" : colorDe(otro)}/>
            <div className="ficha"><small>{nombre(otro)}</small><p>{recortar(otro.power, 70)}</p></div>
          </div>
        )}
        {ganador && pct != null && <div className="compatible">{pct}% compatible</div>}
      </div>
      <p className="estado" aria-live="polite">{ganador ? listo : (pasoFinal ?? paso)}</p>
    </>
  );
}
