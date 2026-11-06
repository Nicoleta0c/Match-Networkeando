"use client";
/* Mapa de Sueños: la red en vivo para la pantalla grande.
   Es general: muestra a todo el mundo, de todos los eventos, y crece de evento en evento. */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { QR } from "./QR";
import { Via } from "./ui";
import { Motor, type Filtro, type Foco } from "./mapaMotor";
import type { Perfil } from "@/lib/match";
import { construirRed, nombreEvento, type Red } from "@/lib/red";

const CADA_MS = 5000;

type Props = {activo: boolean; qrUrl: string; demo: Map<string, Perfil> | null};

export function VistaMapa({activo, qrUrl, demo}: Props) {
  const [redReal, setRedReal] = useState<Red | null>(null);
  const [error, setError] = useState(false);
  const [pantalla, setPantalla] = useState(false);
  const [anuncio, setAnuncio] = useState("");
  const [foco, setFoco] = useState<Foco | null>(null);
  const [filtro, setFiltro] = useState<Filtro>(null);
  const lienzo = useRef<HTMLCanvasElement>(null);
  const pie = useRef<HTMLDivElement>(null);
  const tarjeta = useRef<HTMLDivElement>(null);
  const motor = useRef<Motor | null>(null);
  const antes = useRef<number | null>(null);

  // En la demo la red se arma aquí mismo con la gente de ejemplo; en el evento viene del servidor.
  const redDemo = useMemo(() => demo ? construirRed([{evento: "Demo", perfiles: [...demo.values()]}], "Demo", id => id) : null, [demo]);
  const red = demo ? redDemo : redReal;

  useEffect(() => { setPantalla(document.fullscreenEnabled); }, []);

  /* Pide la red cada 5 segundos mientras la vista está abierta. */
  useEffect(() => {
    if (!activo || demo) return;
    let parado = false, firma = "";
    let t: ReturnType<typeof setTimeout> | undefined;
    async function cargar() {
      try {
        if (!document.hidden) {
          const r = await fetch("/api/mapa", {cache: "no-cache"});
          if (!r.ok) throw new Error("HTTP " + r.status);
          const txt = await r.text();
          if (parado) return;
          if (txt !== firma) { firma = txt; setRedReal(JSON.parse(txt) as Red); }
          setError(false);
        }
      } catch {
        if (!parado) setError(true);
      } finally {
        if (!parado) t = setTimeout(cargar, CADA_MS);
      }
    }
    cargar();
    return () => { parado = true; clearTimeout(t); };
  }, [activo, demo]);

  useEffect(() => {
    if (!activo || !lienzo.current) return;
    const m = new Motor(lienzo.current);
    m.onFoco = setFoco;
    motor.current = m;
    return () => { m.destruir(); motor.current = null; antes.current = null; setFoco(null); };
  }, [activo]);

  /* Le dice al motor cuánto ocupan los textos de arriba y de abajo, para que la red quede en el hueco.
     En el celular la tarjeta del foco va arriba a lo ancho; en pantallas grandes va a un lado. */
  useLayoutEffect(() => {
    if (!activo) return;
    const medir = () => {
      const p = pie.current, t = tarjeta.current;
      const abajo = p ? p.offsetHeight - 40 : 0;
      // Si la tarjeta va arriba a lo ancho (celular, tablet en vertical), la red empieza debajo de ella.
      const arriba = t && t.offsetWidth > window.innerWidth * .6 ? t.offsetTop + t.offsetHeight + 12 : 72;
      const r = t?.getBoundingClientRect();
      motor.current?.reservar(arriba, abajo, r ? [r.left - 8, r.top - 8, r.right + 8, r.bottom + 8] : null);
    };
    medir();
    const ro = new ResizeObserver(medir);
    if (pie.current) ro.observe(pie.current);
    if (tarjeta.current) ro.observe(tarjeta.current);
    window.addEventListener("resize", medir);
    return () => { ro.disconnect(); window.removeEventListener("resize", medir); };
  }, [activo, foco]);
  useEffect(() => { motor.current?.datos(red); }, [red, activo]);
  useEffect(() => { motor.current?.filtrar(filtro); }, [filtro, activo]);
  // Al salir del mapa, el filtro se quita.
  useEffect(() => { if (!activo) setFiltro(null); }, [activo]);

  const datos = useMemo(() => {
    if (!red) return null;
    const actual = red.eventos.findIndex(e => e.nombre === red.evento);
    const cuenta = (enNivel: (e: number) => boolean) => {
      let personas = 0, doble = 0, una = 0;
      const unidos = new Set<number>();
      red.nodos.forEach(n => { if (enNivel(n.e)) personas++; });
      for (const [a, b, t] of red.enlaces) {
        if (!t || !enNivel(red.nodos[a].e)) continue;
        if (t === 2) doble++; else una++;
        unidos.add(a); unidos.add(b);
      }
      return {personas, doble, una, solos: personas - unidos.size};
    };
    return {actual, eventos: red.eventos.length, todos: cuenta(() => true), hoy: cuenta(e => e === actual)};
  }, [red]);

  // Aviso para lectores de pantalla cuando alguien se suma al evento.
  useEffect(() => {
    if (!activo || !datos) return;
    const n = datos.hoy.personas;
    if (antes.current !== null && n > antes.current) setAnuncio(n - antes.current === 1 ? `Se sumó una persona al mapa. Ya son ${n}.` : `Se sumaron ${n - antes.current} personas. Ya son ${n}.`);
    antes.current = n;
  }, [datos, activo]);

  const alternarPantalla = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen().catch(() => setPantalla(false));
  };

  // El mapa es general: cuenta a todo el mundo, de todos los eventos.
  const c = datos ? datos.todos : null;
  const plural = (n: number, uno: string, varios: string) => n + " " + (n === 1 ? uno : varios);
  const linea = !datos || !red ? "" : (datos.eventos > 1
    ? plural(datos.eventos, "evento", "eventos")
    : (demo ? "Demo" : nombreEvento(red.evento))) + " · " + plural(datos.todos.personas, "persona", "personas");
  const vacio = !c || c.personas === 0;
  const resumen = c ? `Mapa de Sueños: ${plural(c.personas, "persona", "personas")}, ${plural(c.doble, "pareja", "parejas")} que se impulsan los dos, ${c.una} donde uno impulsa al otro y ${c.solos} buscando su conexión.` : "Mapa de Sueños";

  return (
    <section data-view-panel="mapa" aria-labelledby="t-mapa" hidden={!activo}>
      <div className="mapa">
        <canvas ref={lienzo} className="mapa-red" role="img" aria-label={resumen}/>
        {vacio && <div className="mapa-vacio">
          <p>{error ? "No se pudo cargar el mapa. Revisa la conexión." : red ? "El mapa se arma cuando la gente escanea el QR." : "Cargando el mapa…"}</p>
        </div>}

        <div className="salir">
          <button className="boton chico mapa-pantalla" type="button" hidden={!pantalla} onClick={alternarPantalla}>Pantalla completa</button>
          <a className="boton chico" href="#proyectar">Ver el QR</a>
          <a className="boton chico" href="#inicio">Salir</a>
        </div>

        {/* El foco: un sueño del salón y el superpoder que lo ayuda, sin nombres. */}
        {foco && <div className="mapa-foco" ref={tarjeta} key={foco.id}>
          {foco.tipo === "sola"
            ? <span className="via" data-tipo="una">Buscando su conexión</span>
            : <Via tipo={foco.tipo}/>}
          {foco.filas.map((x, i) => <div className="foco-fila" key={i}>
            {x.sueno && <p className="foco-sueno"><small>Sueño</small>{x.sueno}</p>}
            {x.poder && <p className="foco-poder"><small>Superpoder · lo que mejor sabe hacer</small>{x.poder}</p>}
          </div>)}
        </div>}

        <div className="mapa-pie" ref={pie}>
          <div className="mapa-txt">
            <h1 id="t-mapa">Mapa de Sueños</h1>
            {linea && <p className="mapa-dato">{linea}<span className="mapa-pista"> · Toca un punto para ver su sueño, o un tipo de match para filtrar</span></p>}
            {c && !vacio && <ul className="mapa-leyenda">
              <li><svg viewBox="0 0 28 14" aria-hidden="true"><circle cx="14" cy="7" r="5" fill="var(--a)"/></svg>Trae un sueño</li>
              <li><svg viewBox="0 0 28 14" aria-hidden="true"><circle cx="14" cy="7" r="5" fill="var(--h)"/></svg>Pone su superpoder</li>
              <li><Filtrar f="doble" actual={filtro} onCambiar={setFiltro}><svg viewBox="0 0 28 14" aria-hidden="true"><path d="M2 7h24" stroke="var(--h)" strokeWidth="4" strokeLinecap="round"/></svg><b>{c.doble}</b>&nbsp;se impulsan los dos</Filtrar></li>
              <li><Filtrar f="una" actual={filtro} onCambiar={setFiltro}><svg viewBox="0 0 28 14" aria-hidden="true"><path d="M2 7h24" stroke="var(--h)" strokeWidth="2" strokeLinecap="round" opacity=".55"/></svg><b>{c.una}</b>&nbsp;uno impulsa al otro</Filtrar></li>
              <li><Filtrar f="sola" actual={filtro} onCambiar={setFiltro}><svg viewBox="0 0 28 14" aria-hidden="true"><circle cx="14" cy="7" r="4.5" fill="none" stroke="var(--m)" strokeWidth="1.8"/></svg><b>{c.solos}</b>&nbsp;buscando su conexión</Filtrar></li>
            </ul>}
          </div>
          <figure className="mapa-qr">
            <QR url={qrUrl}/>
            <figcaption>Escanea y súmate al mapa</figcaption>
          </figure>
        </div>
        <p className="sr" aria-live="polite">{anuncio}</p>
      </div>
    </section>
  );
}

/* Un tipo de la leyenda que también es botón: filtra la red. Otro clic quita el filtro. */
function Filtrar({f, actual, onCambiar, children}: {f: Filtro; actual: Filtro; onCambiar: (f: Filtro) => void; children: React.ReactNode}) {
  return (
    <button type="button" className="filtrar" aria-pressed={actual === f} onClick={() => onCambiar(actual === f ? null : f)}>
      {children}
    </button>
  );
}
