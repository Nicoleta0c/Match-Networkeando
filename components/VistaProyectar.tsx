"use client";
import { useEffect, useState } from "react";
import { QR } from "./QR";
import { Logo } from "./Barra";

export function VistaProyectar({activo, qrUrl, perfiles, pares}: {activo: boolean; qrUrl: string; perfiles: number; pares: number}) {
  const [pantalla, setPantalla] = useState(false);
  useEffect(() => { setPantalla(document.fullscreenEnabled); }, []);

  const alternar = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen().catch(() => setPantalla(false));
  };

  return (
    <section data-view-panel="proyectar" aria-labelledby="t-proy" hidden={!activo}>
      <div className="salir">
        <button className="boton chico" type="button" id="b-pantalla" hidden={!pantalla} onClick={alternar}>Pantalla completa</button>
        <a className="boton chico" href="#inicio">Salir</a>
      </div>
      <div className="proy">
        <figure className="qr-carta" aria-label="Código QR para entrar">
          <QR url={qrUrl}/>
          <b>Escanea con la cámara</b>
        </figure>
        <div>
          <p className="logo" style={{marginBottom: 20}}><Logo/>Networkeando RD</p>
          <h1 id="t-proy">Escanea y la app te busca tu <span className="marca">match</span>.</h1>
          <p className="intro">Tu sueño, tu superpoder y la gente del evento que encaja contigo.</p>
          <div className="cifras" aria-live="polite">
            <div className="cifra"><b id="n-perfiles">{perfiles}</b>perfiles</div>
            <div className="cifra"><b id="n-clics">{pares}</b>matches encontrados</div>
          </div>
        </div>
      </div>
    </section>
  );
}
