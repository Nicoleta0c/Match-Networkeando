"use client";
import { useEffect, useRef } from "react";
import { Duo } from "./ui";
import { QR } from "./QR";
import { enU, punto, trazar } from "@/lib/hilo";

/* Ejemplo de la portada: una idea y el superpoder que la hace posible. */
const EJEMPLO = {idea: "Dar una charla gratis sobre finanzas para jóvenes", poder: "Coordinador de voluntariados"};

export function VistaInicio({activo, qrUrl}: {activo: boolean; qrUrl: string}) {
  const escena = useRef<HTMLDivElement>(null);
  const hilo = useRef<SVGPathElement>(null);
  const nudo = useRef<HTMLDivElement>(null);

  // El hilo baja en U por debajo de los personajes y une tu idea con su superpoder.
  function dibujar(animar: boolean) {
    const e = escena.current, h = hilo.current, n = nudo.current;
    if (!e || !h || !n || !e.offsetWidth) return;
    const izq = e.querySelector(".chip.izq")!, der = e.querySelector(".chip.der")!, duo = e.querySelector(".duo")!;
    const ancho = innerWidth > 900;
    n.hidden = !ancho;
    if (!ancho) { h.setAttribute("d", ""); return; }
    h.setAttribute("d", enU(punto(izq, e, "der"), punto(der, e, "izq"), duo.getBoundingClientRect().height * .62));
    const m = h.getPointAtLength(h.getTotalLength() / 2);
    n.style.left = m.x + "px"; n.style.top = m.y + "px";
    if (animar) {
      n.classList.remove("ver");
      trazar(h, 1300, 900).then(() => n.classList.add("ver"));
    } else {
      h.style.transition = "none"; h.style.strokeDasharray = "none"; h.style.strokeDashoffset = "0";
      n.classList.add("ver");
    }
  }

  useEffect(() => {
    if (!activo) return;
    const t = setTimeout(() => dibujar(true), 50);
    let r: ReturnType<typeof setTimeout> | undefined;
    const alCambiar = () => { clearTimeout(r); r = setTimeout(() => dibujar(false), 150); };
    addEventListener("resize", alCambiar);
    return () => { clearTimeout(t); clearTimeout(r); removeEventListener("resize", alCambiar); };
  }, [activo]);

  return (
    <section className="cont vista" data-view-panel="inicio" aria-labelledby="t-inicio" hidden={!activo}>
      <div className="heroe">
        <h1 id="t-inicio">Haz match con quien puede hacer realidad <span className="marca">tu sueño</span>.</h1>
        <div className="escena" ref={escena} onClick={e => { if ((e.target as Element).closest(".duo")) dibujar(true); }}>
          <svg className="hilos" aria-hidden="true"><path className="hilo" ref={hilo}/></svg>
          <div className="chip izq"><small>Tu sueño</small>{EJEMPLO.idea}<span className="punto"></span></div>
          <Duo/>
          <div className="chip der"><small>Su superpoder</small>{EJEMPLO.poder}<span className="punto"></span></div>
          <div className="nudo" ref={nudo} aria-hidden="true">98%</div>
        </div>
      </div>

      <div className="como">
        <figure className="qr-carta" aria-label="Código QR para entrar">
          <QR url={qrUrl}/>
          <b>Escanea con la cámara</b>
        </figure>
        <div>
          <h2 className="titulo">Tres pasos y la app hace el resto</h2>
          <ol className="pasos">
            <li data-n="1"><h3><span className="sr">Paso 1: </span>Escanea el código y entra desde el navegador.</h3><p>Sin descargar nada. Te lleva directo a crear tu perfil.</p></li>
            <li data-n="2"><h3><span className="sr">Paso 2: </span>Cuenta tu sueño y tu superpoder, con tus palabras.</h3><p>Con tu nombre o de forma anónima.</p></li>
            <li data-n="3"><h3><span className="sr">Paso 3: </span>La app encuentra tu match.</h3><p>Compara tu sueño y tu superpoder con los de todos y te muestra quién encaja mejor contigo. Tú no tienes que elegir.</p></li>
          </ol>
          <div className="acciones">
            <a className="boton fuerte" href="#perfil">Crear mi perfil</a>
            <a className="boton" href="#demo">Probar la demo</a>
          </div>
        </div>
      </div>
    </section>
  );
}
