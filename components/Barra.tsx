"use client";
import type { Vista } from "./App";

/* Menú: Inicio y Mi perfil para todos. «Matches» aparece cuando la presentadora los empieza;
   «Proyectar» solo lo ve la presentadora. */
type Props = {vista: Vista; burbuja: number; verMatches: boolean; presentadora: boolean};

export function Barra({vista, burbuja, verMatches, presentadora}: Props) {
  const actual = (v: Vista) => vista === v ? "page" as const : undefined;
  return (
    <header className="barra">
      <div className="cont barra-in">
        <a className="logo" href="#inicio" aria-label="Networkeando RD, inicio">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="logo-img" src="/logo-networkeando.webp" alt="" width={2000} height={587}/>
        </a>
        <nav className="nav" aria-label="Secciones">
          <a href="#inicio" aria-current={actual("inicio")}>Inicio</a>
          <a href="#perfil" aria-current={actual("perfil")}>Mi perfil</a>
          {verMatches && <a href="#clics" aria-current={actual("clics")}>Matches<span className="burbuja" id="burbuja" hidden={!burbuja}>{burbuja || ""}</span></a>}
          {presentadora && <a className="opc" href="#proyectar">Proyectar</a>}
        </nav>
      </div>
    </header>
  );
}
