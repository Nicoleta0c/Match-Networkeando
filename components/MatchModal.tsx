"use client";
import { useEffect, useRef } from "react";
import { claveMatch, esAnon, nombre, sinComillas, type Analisis, type Perfil } from "@/lib/match";
import { curva, punto, trazar } from "@/lib/hilo";
import { Avatar, Contacto } from "./ui";

const TITULOS = {nombre: "¡Hicieron match!", yoanon: "¡Hicieron match!", anon: "¡Match con alguien anónimo!", secreto: "¡Match en secreto!"};
const SELLOS = {nombre: "", yoanon: "Estás en anónimo", anon: "Match anónimo", secreto: "Match entre anónimos"};

type Props = {me: Perfil; o: Perfil; r: Analisis; onCerrar: () => void; onSeguir: () => void};

export function MatchModal({me, o, r, onCerrar, onSeguir}: Props) {
  const seguirRef = useRef<HTMLButtonElement>(null);
  const pareja = useRef<HTMLDivElement>(null);
  const hilo = useRef<SVGPathElement>(null);
  const cerrarRef = useRef(onCerrar);
  cerrarRef.current = onCerrar;

  // Al abrir: foco en el botón principal, Escape para cerrar y el resto de la página inerte
  // (el foco no puede salirse del modal). Al cerrar: el foco vuelve a donde estaba.
  useEffect(() => {
    const previo = document.activeElement as HTMLElement | null;
    const fuera = [...document.querySelectorAll<HTMLElement>("header.barra, main")];
    fuera.forEach(el => { el.inert = true; });
    seguirRef.current?.focus();
    const tecla = (e: KeyboardEvent) => { if (e.key === "Escape") cerrarRef.current(); };
    document.addEventListener("keydown", tecla);
    // El hilo que une a los dos se mide cuando la tarjeta terminó de entrar (su animación la escala).
    const t = setTimeout(() => {
      const p = pareja.current, h = hilo.current;
      if (!p || !h) return;
      const avs = p.querySelectorAll(".av");
      h.setAttribute("d", curva(punto(avs[0], p, "der"), punto(avs[1], p, "izq"), 40));
      trazar(h, 600);
    }, 360);
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", tecla);
      fuera.forEach(el => { el.inert = false; });
      previo?.focus?.();
    };
  }, []);

  const yoA = esAnon(me), otroA = esAnon(o);
  const tipo = yoA && otroA ? "secreto" : (otroA ? "anon" : (yoA ? "yoanon" : "nombre"));
  const porque = r.razones[0] || "";
  let texto;
  if (tipo === "nombre" || tipo === "yoanon") texto = (r.ia ? "La IA eligió a " : "La app eligió a ") + nombre(o) + " como tu mejor match. " + porque;
  else if (tipo === "anon") texto = "Tu mejor match todavía no muestra su nombre, pero puede ver tu contacto y escribirte. " + porque;
  else texto = "Ninguno de los dos muestra su nombre todavía. " + porque;
  const sube = (ms: number) => ({className: "sube", style: {animationDelay: ms + "ms"}});

  return (
    <div className="modal" id="match" role="dialog" aria-modal="true" aria-labelledby="m-titulo">
      <div className="modal-in">
        {tipo !== "nombre" && <div className="m-sello">{SELLOS[tipo]}</div>}
        <div className="pareja" ref={pareja}>
          <svg className="hilos" aria-hidden="true"><path className="hilo" ref={hilo} style={{strokeDashoffset: 9999}}/></svg>
          <span className={"av tu" + (yoA ? " anon" : "")} aria-hidden="true">Tú</span>
          <Avatar p={o}/>
        </div>
        <h2 id="m-titulo" {...sube(350)}>{TITULOS[tipo]}</h2>
        <div {...sube(450)}><span className="pct">{r.pct}% compatible{r.ia && <span className="ia-chip">IA</span>}</span></div>
        <p {...sube(520)}>{texto.trim()}</p>
        {r.rompe && <p className="rompe sube" style={{animationDelay: "560ms", textAlign: "left"}}><small>Para romper el hielo</small>“{sinComillas(r.rompe)}”</p>}
        {!otroA && o.contact && <div className="contacto sube" style={{animationDelay: "600ms"}}>Escríbele: <Contacto t={o.contact}/></div>}
        {otroA && <div className="m-clave sube" style={{animationDelay: "600ms"}}><small>Clave para encontrarse en el evento</small><b>{claveMatch(me.id, o.id)}</b></div>}
        {yoA && <div className="m-nota sube" style={{animationDelay: "640ms"}}>{otroA ? "Si te revelas, le llegará tu nombre y tu contacto." : nombre(o) + " no puede escribirte mientras sigas en anónimo."}</div>}
        <div className="acciones sube" style={{animationDelay: "680ms"}}>
          <button className="boton fuerte" type="button" ref={seguirRef} onClick={onSeguir}>Ver mis matches</button>
          {yoA && <a className="boton" href="#perfil" onClick={onCerrar}>Mostrar mi nombre</a>}
        </div>
      </div>
    </div>
  );
}
