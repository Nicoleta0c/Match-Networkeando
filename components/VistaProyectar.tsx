"use client";
import { useEffect, useState } from "react";
import { QR } from "./QR";
import type { Fase } from "@/lib/fase";

type Props = {
  activo: boolean; qrUrl: string; perfiles: number; pares: number;
  /** Fase del evento (null en la demo: ahí no hay botón). */
  fase: Fase | null; cambiando: boolean; onFase: (f: Fase) => void;
};

export function VistaProyectar({activo, qrUrl, perfiles, pares, fase, cambiando, onFase}: Props) {
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
        <a className="boton chico" href="#inicio">Salir</a>
      </div>
      <div className="proy">
        <figure className="qr-carta" aria-label="Código QR para entrar">
          <QR url={qrUrl}/>
          <b>Escanea con la cámara</b>
        </figure>
        <div>
          {registro
            ? <h1 id="t-proy">Escanea y escribe tu <span className="marca">sueño</span> y tu superpoder.</h1>
            : <h1 id="t-proy">Escanea y la app te busca tu <span className="marca">match</span>.</h1>}
          <p className="intro">{registro
            ? "Cuando estemos todos, empezamos los matches al mismo tiempo."
            : "Tu sueño, tu superpoder y la gente del evento que encaja contigo."}</p>
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
                  <p className="fase-lista"><span aria-hidden="true"></span>Los matches ya empezaron: todos ven el suyo en su celular.</p>
                  <button className="borrar" type="button" disabled={cambiando} onClick={() => { if (confirm("¿Volver a la fase de registro? Los celulares dejan de mostrar los matches hasta que los empieces otra vez.")) onFase("registro"); }}>Volver a la fase de registro</button>
                </>}
            {registro && perfiles < 2 && <small>Hacen falta al menos 2 personas registradas.</small>}
          </div>}
        </div>
      </div>
    </section>
  );
}
