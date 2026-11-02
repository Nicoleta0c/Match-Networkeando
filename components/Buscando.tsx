"use client";
import { useEffect, useState } from "react";
import { nombre, type Perfil } from "@/lib/match";
import { Avatar, Duo } from "./ui";

export type Busqueda = {id: number; otros: Perfil[]; pasos: string[]; total: number; reduce: boolean};

/* Animación "Revisando N perfiles…" mientras la app (o la IA) elige tu match. */
export function Buscando({b, pasoFinal}: {b: Busqueda; pasoFinal: string | null}) {
  const [paso, setPaso] = useState("");
  const [cara, setCara] = useState<Perfil | null>(null);
  const [lleno, setLleno] = useState(false);

  useEffect(() => {
    const timers = b.pasos.map((t, i) => setTimeout(() => setPaso(t), i * b.total / b.pasos.length));
    let k = 0, tick: ReturnType<typeof setTimeout> | undefined;
    const siguiente = () => {
      const o = b.otros[k++ % b.otros.length];
      if (o) setCara(o);
      tick = setTimeout(siguiente, 150);
    };
    if (b.otros.length && !b.reduce) siguiente();
    let r2 = 0;
    const r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(() => setLleno(true)); });
    return () => { timers.forEach(clearTimeout); clearTimeout(tick); cancelAnimationFrame(r1); cancelAnimationFrame(r2); };
  }, [b]);

  return (
    <>
      <Duo chico/>
      <p className="b-paso" id="b-paso" aria-live="polite">{pasoFinal ?? paso}</p>
      <div className="b-barra"><span id="b-prog" style={lleno ? {transition: "transform " + b.total + "ms linear", transform: "scaleX(1)"} : undefined}></span></div>
      <div className="b-caras" id="b-caras" aria-hidden="true">{cara && <><Avatar p={cara}/><span>{nombre(cara)}</span></>}</div>
    </>
  );
}
