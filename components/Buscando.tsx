"use client";
import { useEffect, useRef, useState } from "react";
import { nombre, type Perfil } from "@/lib/match";
import { curva, punto, trazar } from "@/lib/hilo";
import { Avatar } from "./ui";

/* muestra: hasta 6 personas del salón a las que se les tira un hilo mientras la app busca. */
export type Busqueda = {id: number; muestra: Perfil[]; pasos: string[]; total: number; reduce: boolean};

/* Dónde se dibuja cada persona dentro del recuadro (porcentajes). */
const POS: [number, number][] = [[62, 18], [80, 30], [88, 58], [74, 80], [56, 74], [50, 40]];
const NS = "http://www.w3.org/2000/svg";

/* La app tira un hilo hacia cada persona y se queda con la que mejor encaja (ganador). */
export function Buscando({b, me, pasoFinal, ganador}: {b: Busqueda; me: Perfil; pasoFinal: string | null; ganador: string | null}) {
  const caja = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const [paso, setPaso] = useState(b.pasos[0]);

  function hiloHacia(id: string, clase: string) {
    const c = caja.current, s = svg.current;
    const yo = c?.querySelector(".nodo.yo .av"), otro = c?.querySelector(`.nodo[data-id="${CSS.escape(id)}"] .av`);
    if (!c || !s || !yo || !otro) return null;
    const p = document.createElementNS(NS, "path");
    p.setAttribute("class", "hilo " + clase);
    const a = punto(yo, c, "centro"), z = punto(otro, c, "centro");
    p.setAttribute("d", curva(a, z, (z[1] - a[1]) * .25));
    s.appendChild(p);
    return p;
  }

  // Un hilo fino hacia cada persona, uno detrás de otro, repartidos en el tiempo de la búsqueda.
  useEffect(() => {
    let vivo = true;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const tramo = b.total / Math.max(1, b.muestra.length);
    const dur = Math.min(380, tramo * .7);
    b.muestra.forEach((p, i) => timers.push(setTimeout(async () => {
      if (!vivo) return;
      setPaso(b.pasos[Math.min(b.pasos.length - 1, Math.floor(i * b.pasos.length / b.muestra.length))]);
      const h = hiloHacia(p.id, "fino");
      if (!h) return;
      await trazar(h, b.reduce ? 0 : dur);
      timers.push(setTimeout(() => h.classList.add("tenue"), 120));
    }, i * tramo)));
    return () => { vivo = false; timers.forEach(clearTimeout); if (svg.current) svg.current.innerHTML = ""; };
  }, [b]);

  // Cuando la app ya eligió, el hilo grueso va hacia tu match.
  useEffect(() => {
    if (!ganador) return;
    const h = hiloHacia(ganador, "");
    if (h) trazar(h, b.reduce ? 0 : 650);
  }, [ganador, b.reduce]);

  return (
    <>
      <div className="radar" ref={caja}>
        <svg className="hilos" ref={svg} aria-hidden="true"></svg>
        <div className="nodo yo" style={{left: "16%", top: "50%"}}>
          <span className="av">Tú</span><small>{me.idea ? recortar(me.idea) : recortar(me.power)}</small>
        </div>
        {b.muestra.map((p, i) => (
          <div key={p.id} className={"nodo" + (ganador === p.id ? " gana" : "")} data-id={p.id} style={{left: POS[i][0] + "%", top: POS[i][1] + "%", animationDelay: i * 60 + "ms"}}>
            <Avatar p={p}/><small>{nombre(p).split(" ")[0]}</small>
          </div>
        ))}
      </div>
      <p className="estado" aria-live="polite">{ganador ? "¡Listo! Encontramos tu match." : (pasoFinal ?? paso)}</p>
    </>
  );
}

function recortar(t: string) { return t.length > 22 ? t.slice(0, 21).trimEnd() + "…" : t; }
