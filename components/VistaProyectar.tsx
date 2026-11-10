"use client";
import { useEffect, useState } from "react";
import { QR } from "./QR";
import type { Fase } from "@/lib/fase";

type Props = {
  activo: boolean; qrUrl: string; perfiles: number; pares: number;
  /** Fase del evento (null en la demo: ahí no hay botón). */
  fase: Fase | null; cambiando: boolean; onFase: (f: Fase) => void;
  /** Si la presentadora está mirando un evento anterior: su nombre (ahí no hay QR, ya cerró). */
  anterior: string | null;
};

export function VistaProyectar({activo, qrUrl, perfiles, pares, fase, cambiando, onFase, anterior}: Props) {
  const [pantalla, setPantalla] = useState(false);
  useEffect(() => { setPantalla(document.fullscreenEnabled); }, []);

  const alternar = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen().catch(() => setPantalla(false));
  };
  const registro = fase === "registro";

  return (
    <section data-view-panel="proyectar" aria-labelledby="t-proy" hidden={!activo}>
      {/* El logo va arriba a la izquierda, donde estaría la barra (que aquí se oculta). */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="logo-proy" src="/logo-networkeando.webp" alt="Networkeando RD" width={2000} height={587}/>
      <div className="salir">
        <button className="boton chico" type="button" id="b-pantalla" hidden={!pantalla} onClick={alternar}>Pantalla completa</button>
        <a className="boton chico" href="#panel">Panel</a>
        <a className="boton chico" href="#inicio">Salir</a>
      </div>
      {anterior ? (
        /* Evento anterior: su nombre y cómo les fue, sin QR (el registro ya cerró). */
        <div className="proy proy-anterior">
          <div>
            <p className="proy-etiqueta">Evento anterior</p>
            <h1 id="t-proy">{anterior}</h1>
            <div className="cifras" aria-live="polite">
              <div className="cifra"><b>{perfiles}</b>{perfiles === 1 ? "persona" : "personas"}</div>
              <div className="cifra"><b>{pares}</b>matches encontrados</div>
            </div>
          </div>
        </div>
      ) : <div className="proy">
        <figure className="qr-carta" aria-label="Código QR para entrar">
          <QR url={qrUrl}/>
          <b>Escanea con la cámara</b>
        </figure>
        <div>
          {registro
            ? <h1 id="t-proy">Escanea y escribe tu <span className="marca">sueño</span> y tu superpoder.</h1>
            : <h1 id="t-proy">Escanea y la app te busca tu <span className="marca">match</span>.</h1>}
          <div className="cifras" aria-live="polite">
            <div className="cifra"><b id="n-perfiles">{perfiles}</b>{perfiles === 1 ? "registrado" : "registrados"}</div>
            <div className="cifra"><b id="n-clics">{pares}</b>{registro ? "matches detectados" : "matches encontrados"}</div>
          </div>
          {fase && <div className="fase">
            {registro
              ? <button className="boton fuerte fase-empezar" type="button" disabled={cambiando || perfiles < 2} onClick={() => onFase("matches")}>
                  {cambiando ? "Empezando…" : "Empezar los matches"}
                </button>
              : <>
                  {/* Volver a registro se hace desde el panel, no frente al público. */}
                  <p className="fase-lista"><span aria-hidden="true"></span>Los matches ya empezaron</p>
                </>}
          </div>}
        </div>
      </div>}
    </section>
  );
}
