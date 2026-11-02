"use client";
import type { Vista } from "./App";

type Props = {
  vista: Vista; burbuja: number;
  demo: boolean; demoAnon: boolean;
  onDemoComo: (anon: boolean) => void; onSalirDemo: () => void;
};

export function Barra({vista, burbuja, demo, demoAnon, onDemoComo, onSalirDemo}: Props) {
  const actual = (v: Vista) => vista === v ? "page" as const : undefined;
  return (
    <header className="barra">
      <div className="barra-in">
        <a className="marca" href="#inicio" aria-label="Networkeando RD, inicio">Networkeando RD</a>
        <nav className="nav" aria-label="Secciones">
          <a href="#inicio" aria-current={actual("inicio")}><svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>Inicio</a>
          <a href="#perfil" aria-current={actual("perfil")}><svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4.5-6 8-6s7 2 8 6"/></svg>Mi perfil</a>
          <a href="#clics" aria-current={actual("clics")}><svg className="ico" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-si"/></svg>Mis matches<span className="burbuja" id="burbuja" hidden={!burbuja}>{burbuja || ""}</span></a>
        </nav>
      </div>
      <div className="demo-barra" id="demo-barra" hidden={!demo}>
        <div className="demo-barra-in">
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
