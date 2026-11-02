"use client";
import { useEffect, useRef, type CSSProperties } from "react";
import { claveMatch, esAnon, nombre, sinComillas, type Analisis, type Perfil } from "@/lib/match";
import { Avatar, Contacto } from "./ui";

const TITULOS = {nombre: "¡Hicieron match!", yoanon: "¡Hicieron match!", anon: "¡Match con alguien anónimo!", secreto: "¡Match en secreto!"};
const SELLOS = {nombre: "", yoanon: "Estás en anónimo", anon: "Match anónimo", secreto: "Match entre anónimos"};

type Props = {me: Perfil; o: Perfil; r: Analisis; onCerrar: () => void; onSeguir: () => void};

export function MatchModal({me, o, r, onCerrar, onSeguir}: Props) {
  const seguirRef = useRef<HTMLButtonElement>(null);
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
    return () => {
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

  return (
    <div className="match" id="match" role="dialog" aria-modal="true" aria-labelledby="m-titulo">
      <div className={"match-in " + tipo}>
        <div className={"m-sello " + (tipo === "yoanon" ? "amarillo" : "oscuro")} id="m-sello" hidden={tipo === "nombre"}>{SELLOS[tipo]}</div>
        <div className="match-avs" id="m-avs">
          {yoA
            ? <span className="av anon izq" aria-hidden="true">Tú</span>
            : <span className="av izq" style={{"--c": "#7B61FF"} as CSSProperties} aria-hidden="true">Tú</span>}
          <Avatar p={o} extra="der"/>
        </div>
        <div className="m-chips"><span className="m-pct" id="m-pct">{r.pct}% compatible</span><span className="ia-chip" id="m-ia" hidden={!r.ia}>Elegido con IA</span></div>
        <h2 id="m-titulo">{TITULOS[tipo]}</h2>
        <p id="m-texto">{texto.trim()}</p>
        {r.rompe && <p className="rompe m-rompe" id="m-rompe"><small>Para romper el hielo</small>“{sinComillas(r.rompe)}”</p>}
        {!otroA && o.contact && <div className="match-contacto" id="m-contacto">Escríbele: <Contacto t={o.contact}/></div>}
        <div className="m-clave" id="m-clave" hidden={!otroA}><small>Clave para encontrarse en el evento</small><b id="m-clave-txt">{claveMatch(me.id, o.id)}</b></div>
        <div className="m-nota" id="m-nota" hidden={!yoA}>{otroA ? "Si te revelas, le llegará tu nombre y tu contacto." : nombre(o) + " no puede escribirte mientras sigas en anónimo."}</div>
        <div className="acciones">
          <button className="boton fuerte" type="button" id="m-seguir" ref={seguirRef} onClick={onSeguir}>Ver todos mis matches</button>
          <a className="boton" href="#perfil" id="m-revelar" hidden={!yoA} onClick={onCerrar}>Mostrar mi nombre</a>
        </div>
      </div>
    </div>
  );
}
