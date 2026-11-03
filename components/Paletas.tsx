"use client";
import { useEffect, useState } from "react";

/* Selector de las 4 paletas oscuras. La elección se guarda solo en este navegador. */
const PALETAS = [
  {id: "a", nombre: "Petróleo profundo", fondo: "#061918", hilo: "#F8C000"},
  {id: "b", nombre: "Tinta y oro", fondo: "#0F0F0D", hilo: "#F8C000"},
  {id: "c", nombre: "Grafito y menta", fondo: "#111517", hilo: "#3FE0C5"},
  {id: "d", nombre: "Noche y lima", fondo: "#07141C", hilo: "#D6F53C"}
];
const CLAVE = "paleta";

export function Paletas() {
  const [actual, setActual] = useState("b");

  useEffect(() => {
    let guardada: string | null = null;
    try { guardada = localStorage.getItem(CLAVE); } catch {}
    if (guardada && PALETAS.some(p => p.id === guardada)) elegir(guardada);
  }, []);

  function elegir(id: string) {
    setActual(id);
    if (id === "b") delete document.documentElement.dataset.paleta;
    else document.documentElement.dataset.paleta = id;
    try { localStorage.setItem(CLAVE, id); } catch {}
  }

  return (
    <div className="paletas" role="group" aria-label="Colores de la app">
      <span>Colores</span>
      {PALETAS.map(p => (
        <button key={p.id} type="button" aria-pressed={actual === p.id} aria-label={p.nombre} title={p.nombre}
          style={{background: `linear-gradient(135deg,${p.fondo} 50%,${p.hilo} 50%)`}} onClick={() => elegir(p.id)}/>
      ))}
    </div>
  );
}
