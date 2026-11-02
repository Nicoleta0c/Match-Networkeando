"use client";
import { Duo } from "./ui";
import { QR } from "./QR";

export function VistaInicio({activo, qrUrl}: {activo: boolean; qrUrl: string}) {
  return (
    <section data-view-panel="inicio" aria-labelledby="t-inicio" hidden={!activo}>
      <div className="heroe">
        <Duo/>
        <h1 id="t-inicio">Haz match con quien puede hacer realidad tu idea.</h1>
        <div className="acciones">
          <a className="boton fuerte" href="#perfil">Crear mi perfil</a>
          <a className="boton" href="#demo">Probar la demo</a>
        </div>
      </div>
      <div className="como">
        <figure className="qr-carta" style={{margin: 0}} aria-label="Código QR para entrar">
          <QR url={qrUrl}/>
          <b>Escanea con la cámara</b>
        </figure>
        <ol className="pasos">
          <li><p className="kicker">Paso 1</p><h3>Escanea el código y entra desde el navegador.</h3><p>Sin descargar nada. Te lleva directo a crear tu perfil.</p></li>
          <li><p className="kicker">Paso 2</p><h3>Cuenta tu idea y tu superpoder, con tus palabras.</h3><p>Con tu nombre o de forma anónima. Si todavía no tienes idea, ofrece tu superpoder.</p></li>
          <li><p className="kicker">Paso 3</p><h3>La app encuentra tu match.</h3><p>Compara tu idea y tu superpoder con los de todos y te muestra quién encaja mejor contigo. Tú no tienes que elegir.</p></li>
        </ol>
      </div>
      <p style={{textAlign: "center", margin: "64px 0 0"}}><a className="boton chico" href="#proyectar">Proyectar el código en el evento</a></p>
    </section>
  );
}
