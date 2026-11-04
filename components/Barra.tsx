"use client";
import type { Vista } from "./App";

type Props = {vista: Vista; burbuja: number};

/* Logo: dos personas unidas por el hilo dorado. */
export function Logo() {
  return (
    <svg viewBox="0 0 34 20" aria-hidden="true">
      <circle cx="5" cy="10" r="4.5" fill="var(--a)"/><circle cx="29" cy="10" r="4.5" fill="var(--t)"/>
      <path d="M9 10 C14 2, 20 18, 25 10" stroke="var(--h)" strokeWidth="3" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

export function Barra({vista, burbuja}: Props) {
  const actual = (v: Vista) => vista === v ? "page" as const : undefined;
  return (
    <header className="barra">
      <div className="cont barra-in">
        <a className="logo" href="#inicio" aria-label="Networkeando RD, inicio"><Logo/>Networkeando RD</a>
        <nav className="nav" aria-label="Secciones">
          <a href="#inicio" aria-current={actual("inicio")}>Inicio</a>
          <a href="#perfil" aria-current={actual("perfil")}>Mi perfil</a>
          <a href="#clics" aria-current={actual("clics")}>Mis matches<span className="burbuja" id="burbuja" hidden={!burbuja}>{burbuja || ""}</span></a>
          <a className="opc" href="#proyectar">Proyectar</a>
        </nav>
      </div>
    </header>
  );
}
