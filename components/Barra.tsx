"use client";
import type { Vista } from "./App";

type Props = {
  vista: Vista; burbuja: number;
  demo: boolean; demoAnon: boolean;
  onDemoComo: (anon: boolean) => void; onSalirDemo: () => void;
};

/* Logo: dos personas unidas por el hilo dorado. */
export function Logo() {
  return (
    <svg viewBox="0 0 34 20" aria-hidden="true">
      <circle cx="5" cy="10" r="4.5" fill="var(--a)"/><circle cx="29" cy="10" r="4.5" fill="var(--t)"/>
      <path d="M9 10 C14 2, 20 18, 25 10" stroke="var(--h)" strokeWidth="3" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

export function Barra({vista, burbuja, demo, demoAnon, onDemoComo, onSalirDemo}: Props) {
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
      <div className="demo-barra" id="demo-barra" hidden={!demo}>
        <div className="cont demo-barra-in">
          <span><span className="d-largo">Estás en la demo con perfiles de ejemplo. Nada de esto se guarda.</span><span className="d-corto">Demo: nada de esto se guarda</span></span>
          <div className="demo-como">
            <span>Probar como:</span>
            <div className="demo-seg" role="group" aria-label="Probar la demo como">
              <button type="button" aria-pressed={!demoAnon} onClick={() => onDemoComo(false)}>Con nombre</button>
              <button type="button" aria-pressed={demoAnon} onClick={() => onDemoComo(true)}>Anónimo</button>
            </div>
          </div>
          <button type="button" id="b-salir-demo" onClick={onSalirDemo}>Salir</button>
        </div>
      </div>
    </header>
  );
}
