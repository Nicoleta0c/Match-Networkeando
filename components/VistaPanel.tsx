"use client";
/* Panel de la presentadora (#panel): solo lo abre su computadora o quien tenga la clave.
   - Ve llegar los perfiles en vivo, con el mejor match de cada uno.
   - Todos entran aceptados; ella quita los malos (y los puede devolver).
   - Desde aquí empieza los matches para todos. */
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { UMBRAL, analizar, limpiar, ordenarMatches, type Perfil } from "@/lib/match";
import type { Fase } from "@/lib/fase";

type Fila = Record<string, unknown> & {id: string; quitado: boolean};
type Datos = {evento: string; fase: Fase; perfiles: Fila[]};
const POR_PAGINA = 20;
const TOP = 7;
const nombre = (p: Perfil) => p.anon || !p.alias ? "Anónimo" : p.alias;

export function VistaPanel({activo, cambiando, onFase}: {activo: boolean; cambiando: boolean; onFase: (f: Fase) => void}) {
  const [datos, setDatos] = useState<Datos | null>(null);
  const [pideClave, setPideClave] = useState<string | null>(null);
  const [clave, setClave] = useState("");
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [vuelta, setVuelta] = useState(0);
  const [pagina, setPagina] = useState(0);

  /* Pide los perfiles cada 4 segundos mientras el panel está abierto. */
  useEffect(() => {
    if (!activo) return;
    let parado = false;
    let t: ReturnType<typeof setTimeout> | undefined;
    async function cargar() {
      try {
        const r = await fetch("/api/panel", {cache: "no-store"});
        const d = await r.json().catch(() => ({}));
        if (parado) return;
        if (r.status === 403) { setPideClave(d.error || "Escribe la clave de la presentadora."); setDatos(null); }
        else if (r.ok) { setPideClave(null); setDatos(d as Datos); }
      } catch {}
      finally { if (!parado) t = setTimeout(cargar, 4000); }
    }
    cargar();
    return () => { parado = true; clearTimeout(t); };
  }, [activo, vuelta]);

  const entrar = async (e: FormEvent) => {
    e.preventDefault();
    const r = await fetch("/api/panel", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({clave})});
    if (r.ok) { setClave(""); setVuelta(v => v + 1); }
    else setPideClave("Clave incorrecta. Inténtalo otra vez.");
  };

  const cambiarQuitado = async (id: string, quitar: boolean) => {
    setOcupado(id);
    try {
      await fetch("/api/panel", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({id, quitar})});
      setDatos(d => d && {...d, perfiles: d.perfiles.map(p => p.id === id ? {...p, quitado: quitar} : p)});
    } finally { setOcupado(null); }
  };

  /* El mejor match de cada persona, entre los que siguen en el evento. */
  const calculo = useMemo(() => {
    if (!datos) return null;
    const perfiles = datos.perfiles.map(f => ({fila: f, p: limpiar(f.id, f)}));
    const activos = perfiles.filter(x => !x.fila.quitado && x.p.power).map(x => x.p);
    const mejor = new Map<string, {o: Perfil; pct: number}>();
    for (const p of activos) {
      const x = ordenarMatches(p, activos)[0];
      if (x && x.r.pct >= UMBRAL) mejor.set(p.id, {o: x.o, pct: x.r.pct});
    }
    /* Cada par: «suena» es la persona cuyo sueño recibe ayuda y «ayuda» la que tiene el superpoder. */
    const lista: {suena: Perfil; ayuda: Perfil; pct: number; doble: boolean}[] = [];
    for (let i = 0; i < activos.length; i++) for (let j = i + 1; j < activos.length; j++) {
      const a = activos[i], b = activos[j];
      const ab = analizar(a, b).pct, ba = analizar(b, a).pct;
      if (Math.max(ab, ba) < UMBRAL) continue;
      lista.push(ab >= ba ? {suena: a, ayuda: b, pct: ab, doble: ba >= UMBRAL} : {suena: b, ayuda: a, pct: ba, doble: ab >= UMBRAL});
    }
    /* Los mejores para presentar: hasta 7, sin repetir personas. */
    lista.sort((x, y) => y.pct - x.pct);
    const usados = new Set<string>(), top: typeof lista = [];
    for (const x of lista) {
      if (top.length >= TOP) break;
      if (usados.has(x.suena.id) || usados.has(x.ayuda.id)) continue;
      usados.add(x.suena.id); usados.add(x.ayuda.id); top.push(x);
    }
    return {perfiles, activos: activos.length, quitados: perfiles.length - activos.length, conMatch: mejor.size, pares: lista.length, mejor, top};
  }, [datos]);

  const fase = datos?.fase ?? "registro";
  const paginas = Math.max(1, Math.ceil((calculo?.perfiles.length ?? 0) / POR_PAGINA));
  const pag = Math.min(pagina, paginas - 1);
  const enPagina = calculo ? calculo.perfiles.slice(pag * POR_PAGINA, (pag + 1) * POR_PAGINA) : [];

  return (
    <section className="cont vista panel" data-view-panel="panel" aria-labelledby="t-panel" hidden={!activo}>
      <h2 className="titulo" id="t-panel">Panel</h2>

      {pideClave !== null && (
        <form className="panel-clave" onSubmit={entrar}>
          <label htmlFor="f-clave">{pideClave}</label>
          <div>
            <input id="f-clave" type="password" autoComplete="current-password" value={clave} onChange={e => setClave(e.target.value)}/>
            <button className="boton fuerte" type="submit">Entrar</button>
          </div>
        </form>
      )}

      {datos && calculo && <>
        <div className="panel-cabeza">
          <div className="cifras">
            <div className="cifra"><b>{calculo.activos}</b>en el evento</div>
            <div className="cifra"><b>{calculo.conMatch}</b>con match</div>
            <div className="cifra"><b>{calculo.pares}</b>matches detectados</div>
            {calculo.quitados > 0 && <div className="cifra"><b>{calculo.quitados}</b>quitados</div>}
          </div>
          <div className="fase">
            {fase === "registro"
              ? <button className="boton fuerte fase-empezar" type="button" disabled={cambiando || calculo.activos < 2} onClick={() => { onFase("matches"); setTimeout(() => setVuelta(v => v + 1), 800); }}>{cambiando ? "Empezando…" : "Empezar los matches"}</button>
              : <>
                  <p className="fase-lista"><span aria-hidden="true"></span>Los matches ya empezaron: todos pueden ver el suyo.</p>
                  <button className="borrar" type="button" disabled={cambiando} onClick={() => { if (confirm("¿Volver a la fase de registro? Los celulares dejan de mostrar los matches.")) { onFase("registro"); setTimeout(() => setVuelta(v => v + 1), 800); } }}>Volver a la fase de registro</button>
                </>}
          </div>
        </div>

        {calculo.top.length > 0 && <section className="panel-top" aria-labelledby="t-top">
          <h3 id="t-top">Los mejores matches para presentar</h3>
          <ol>
            {calculo.top.map(x => (
              <li key={x.suena.id + x.ayuda.id}>
                <b className="panel-top-pct">{x.pct} %</b>
                <div>
                  <p><small>Sueño de {nombre(x.suena)}</small>{x.suena.idea}</p>
                  <p><small>Superpoder de {nombre(x.ayuda)}</small>{x.ayuda.power}</p>
                  {x.doble && <p className="panel-top-doble">Se ayudan los dos</p>}
                </div>
              </li>
            ))}
          </ol>
        </section>}

        <p className="panel-nota">Todos entran aceptados. Si alguien escribió algo que no va, tócale <b>Quitar</b>: deja de salir en los matches y en los números.</p>

        {!calculo.perfiles.length
          ? <div className="vacio-grande"><p>Todavía no se ha registrado nadie. Los perfiles aparecen aquí en cuanto la gente escanea el QR.</p></div>
          : <ul className="panel-lista">
              {enPagina.map(({fila, p}) => {
                const m = calculo.mejor.get(p.id);
                const quien = p.anon || !p.alias ? "Anónimo" : p.alias + (p.contact ? " · " + p.contact : "");
                return (
                  <li key={p.id} className={fila.quitado ? "quitado" : ""}>
                    <div className="panel-texto">
                      <p className="panel-sueno"><small>Sueño</small>{p.idea || "—"}</p>
                      <p className="panel-poder"><small>Superpoder</small>{p.power}</p>
                      <p className="panel-quien">{quien}{fila.quitado ? " · Quitado" : m ? ` · Mejor match: «${m.o.power}» (${m.pct} %)` : " · Sin match todavía"}</p>
                    </div>
                    <button type="button" className={fila.quitado ? "boton chico" : "boton chico panel-quitar"} disabled={ocupado === p.id} onClick={() => cambiarQuitado(p.id, !fila.quitado)}>
                      {fila.quitado ? "Devolver" : "Quitar"}
                    </button>
                  </li>
                );
              })}
            </ul>}

        {paginas > 1 && (
          <nav className="panel-paginas" aria-label="Páginas">
            <button type="button" className="boton chico" disabled={pag === 0} onClick={() => setPagina(pag - 1)}>Anterior</button>
            <span>Página {pag + 1} de {paginas}</span>
            <button type="button" className="boton chico" disabled={pag >= paginas - 1} onClick={() => setPagina(pag + 1)}>Siguiente</button>
          </nav>
        )}
      </>}
    </section>
  );
}
