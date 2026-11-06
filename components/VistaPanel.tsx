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

export function VistaPanel({activo, cambiando, onFase}: {activo: boolean; cambiando: boolean; onFase: (f: Fase) => void}) {
  const [datos, setDatos] = useState<Datos | null>(null);
  const [pideClave, setPideClave] = useState<string | null>(null);
  const [clave, setClave] = useState("");
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [vuelta, setVuelta] = useState(0);

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
    let pares = 0;
    for (let i = 0; i < activos.length; i++) for (let j = i + 1; j < activos.length; j++) {
      if (Math.max(analizar(activos[i], activos[j]).pct, analizar(activos[j], activos[i]).pct) >= UMBRAL) pares++;
    }
    return {perfiles, activos: activos.length, quitados: perfiles.length - activos.length, conMatch: mejor.size, pares, mejor};
  }, [datos]);

  const fase = datos?.fase ?? "registro";

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

        <p className="panel-nota">Todos entran aceptados. Si alguien escribió algo que no va, tócale <b>Quitar</b>: deja de salir en los matches y en los números.</p>

        {!calculo.perfiles.length
          ? <div className="vacio-grande"><p>Todavía no se ha registrado nadie. Los perfiles aparecen aquí en cuanto la gente escanea el QR.</p></div>
          : <ul className="panel-lista">
              {calculo.perfiles.map(({fila, p}) => {
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
      </>}
    </section>
  );
}
