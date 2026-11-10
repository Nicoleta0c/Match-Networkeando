"use client";
/* Panel de la presentadora (#panel): solo lo abre su computadora o quien tenga la clave.
   - Ve llegar los perfiles en vivo, con el mejor match de cada uno.
   - Todos entran aceptados; ella quita los malos (y los puede devolver).
   - Desde aquí empieza los matches para todos.
   - Eventos: crea uno nuevo (el anterior queda guardado), vuelve a activar uno o mira uno anterior. */
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { UMBRAL, limpiar, mejoresParejas, ordenarMatches, type Perfil } from "@/lib/match";
import type { Fase } from "@/lib/fase";
import type { InfoEvento } from "./App";

type Fila = Record<string, unknown> & {id: string; quitado: boolean};
type Datos = {evento: string; fase: Fase; perfiles: Fila[]};
const POR_PAGINA = 20;
type Evento = {id: string; nombre: string; personas: number; activo: boolean};

type Props = {
  activo: boolean; cambiando: boolean; onFase: (f: Fase) => void;
  /** El evento que se está mirando, y el que eligió mirar la presentadora (null = el activo). */
  evento: InfoEvento | null; verEvento: string | null; onVerEvento: (id: string | null) => void;
};

export function VistaPanel({activo, cambiando, onFase, evento, verEvento, onVerEvento}: Props) {
  const [datos, setDatos] = useState<Datos | null>(null);
  const [pideClave, setPideClave] = useState<string | null>(null);
  const [clave, setClave] = useState("");
  const [faltaClave, setFaltaClave] = useState(false);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [vuelta, setVuelta] = useState(0);
  const [pagina, setPagina] = useState(0);
  /* Los sueños se ven borrosos hasta que tocas «Mostrar»; ahí aparecen los botones de Quitar. */
  const [remover, setRemover] = useState(false);

  /* Pide los perfiles cada 4 segundos mientras el panel está abierto. */
  useEffect(() => {
    if (!activo) return;
    let parado = false;
    let t: ReturnType<typeof setTimeout> | undefined;
    async function cargar() {
      try {
        const r = await fetch("/api/panel" + (verEvento ? "?evento=" + encodeURIComponent(verEvento) : ""), {cache: "no-store"});
        const d = await r.json().catch(() => ({}));
        if (parado) return;
        if (r.status === 403) { setPideClave(d.error || "Escribe la clave de la presentadora."); setFaltaClave(d.pideClave === false); setDatos(null); }
        else if (r.ok) { setPideClave(null); setDatos(d as Datos); }
      } catch {}
      finally { if (!parado) t = setTimeout(cargar, 4000); }
    }
    cargar();
    return () => { parado = true; clearTimeout(t); };
  }, [activo, vuelta, verEvento]);
  useEffect(() => { setPagina(0); }, [verEvento]);

  /* La lista de eventos. */
  const [eventos, setEventos] = useState<Evento[] | null>(null);
  useEffect(() => {
    if (!activo) return;
    fetch("/api/eventos", {cache: "no-store"}).then(r => r.ok ? r.json() : null).then(d => { if (d) setEventos(d.eventos); }).catch(() => {});
  }, [activo, vuelta, verEvento]);
  const eventoActivo = eventos?.find(e => e.activo);
  const viendoAnterior = !!evento && !evento.activo;

  /* Las acciones de eventos se hacen con un formulario dentro del panel (sin ventanitas del navegador,
     que algunos navegadores no muestran): «nuevo» y «renombrar» piden un nombre; «activar» pide confirmar. */
  const [formEvento, setFormEvento] = useState<{tipo: "nuevo"} | {tipo: "renombrar" | "activar"; e: Evento} | null>(null);
  const [nombreEvento, setNombreEvento] = useState("");
  const [errorEvento, setErrorEvento] = useState("");
  const abrirForm = (f: NonNullable<typeof formEvento>) => {
    setFormEvento(f); setErrorEvento("");
    setNombreEvento(f.tipo === "renombrar" ? f.e.nombre : "");
  };
  const enviarEvento = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!formEvento) return;
    const nombre = nombreEvento.replace(/\s+/g, " ").trim();
    if (formEvento.tipo !== "activar" && nombre.length < 3) { setErrorEvento("Escribe un nombre de al menos 3 letras."); return; }
    const cuerpo = formEvento.tipo === "nuevo" ? {accion: "crear", nombre}
      : formEvento.tipo === "renombrar" ? {accion: "renombrar", id: formEvento.e.id, nombre}
      : {accion: "activar", id: formEvento.e.id};
    const r = await fetch("/api/eventos", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(cuerpo)});
    if (!r.ok) { setErrorEvento((await r.json().catch(() => ({}))).error || "No se pudo. Inténtalo otra vez."); return; }
    if (formEvento.tipo !== "renombrar") onVerEvento(null);
    setFormEvento(null); setVuelta(v => v + 1);
  };

  const entrar = async (e: FormEvent) => {
    e.preventDefault();
    const r = await fetch("/api/panel", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({clave})});
    if (r.ok) { setClave(""); setVuelta(v => v + 1); }
    else setPideClave("Clave incorrecta. Inténtalo otra vez.");
  };

  /* Opciones discretas al final del panel: repetir los matches o borrar todo el evento. */
  const [aviso, setAviso] = useState("");
  const accion = async (a: "repetir" | "reiniciar" | "borrarTodo") => {
    if (a === "repetir" && !confirm("¿Mostrar el match de nuevo? A todos les vuelve a salir el botón «Ver mi match».")) return;
    if (a === "reiniciar" && !confirm("¿Reiniciar los matches? El evento vuelve a registro. Los perfiles registrados se quedan.")) return;
    if (a === "borrarTodo") {
      if (!confirm("¿Borrar TODOS los perfiles del evento y empezar de cero? Esto no se puede deshacer.")) return;
      if ((prompt("Para confirmar, escribe BORRAR") || "").trim().toUpperCase() !== "BORRAR") return;
    }
    const r = await fetch("/api/panel", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({accion: a})});
    const d = await r.json().catch(() => ({}));
    setAviso(!r.ok ? "No se pudo. Inténtalo otra vez." : a === "repetir" ? "Listo: a todos les vuelve a salir «Ver mi match»." : a === "reiniciar" ? "Listo: el evento volvió a registro. Los perfiles siguen ahí." : `Listo: se borraron ${d.borrados ?? 0} perfiles. El evento empieza de cero.`);
    setPagina(0); setVuelta(v => v + 1);
  };

  const cambiarQuitado = async (id: string, quitar: boolean) => {
    setOcupado(id);
    try {
      await fetch("/api/panel", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({id, quitar, evento: datos?.evento})});
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
    const {total: pares} = mejoresParejas(activos, 0);
    return {perfiles, activos: activos.length, quitados: perfiles.length - activos.length, conMatch: mejor.size, pares, mejor};
  }, [datos]);

  /* Descarga todos los perfiles del evento en un archivo que abre en Excel (con el mejor match de cada uno). */
  const descargar = () => {
    if (!datos || !calculo) return;
    const celda = (v: unknown) => '"' + String(v ?? "").replace(/"/g, '""').replace(/\s*\n\s*/g, " ") + '"';
    const hora = (ms: number) => ms ? new Date(ms).toLocaleString("es-DO", {timeZone: "America/Santo_Domingo"}) : "";
    const filas = [["Fecha", "Nombre", "Contacto", "A qué se dedica", "Sueño", "Superpoder", "Mejor match", "Superpoder del match", "Compatibilidad", "Quitado"]];
    for (const {fila, p} of calculo.perfiles) {
      const m = calculo.mejor.get(p.id);
      filas.push([hora(p.createdAt), p.anon ? "Anónimo" : p.alias, p.anon ? "" : p.contact, p.anon ? "" : p.que, p.idea, p.power,
        m ? (m.o.anon || !m.o.alias ? "Anónimo" : m.o.alias) : "", m ? m.o.power : "", m ? m.pct + " %" : "", fila.quitado ? "Sí" : ""]);
    }
    // Punto y coma y BOM: así Excel en español separa bien las columnas y respeta las tildes.
    const texto = "\uFEFF" + filas.map(f => f.map(celda).join(";")).join("\r\n");
    const url = URL.createObjectURL(new Blob([texto], {type: "text/csv;charset=utf-8"}));
    const a = document.createElement("a");
    const nombre = (evento?.id === datos.evento ? evento.nombre : datos.evento).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
    a.href = url; a.download = `networkeando-${nombre || datos.evento}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const fase = datos?.fase ?? "registro";
  const paginas = Math.max(1, Math.ceil((calculo?.perfiles.length ?? 0) / POR_PAGINA));
  const pag = Math.min(pagina, paginas - 1);
  const enPagina = calculo ? calculo.perfiles.slice(pag * POR_PAGINA, (pag + 1) * POR_PAGINA) : [];

  return (
    <section className="cont vista panel" data-view-panel="panel" aria-labelledby="t-panel" hidden={!activo}>
      <div className="panel-titulo">
        <h2 className="titulo" id="t-panel">Panel</h2>
        {datos && <div className="panel-acciones">
          <button type="button" className="boton chico" onClick={descargar}>Descargar datos</button>
          <a className="boton chico" href="#mapa">Mapa</a>
        </div>}
      </div>

      {pideClave !== null && (
        <form className="panel-clave" onSubmit={entrar}>
          <label htmlFor="f-clave">{pideClave}</label>
          {!faltaClave && <div>
            <input id="f-clave" type="password" autoComplete="current-password" value={clave} onChange={e => setClave(e.target.value)}/>
            <button className="boton fuerte" type="submit">Entrar</button>
          </div>}
        </form>
      )}

      {datos && eventos && (
        <details className="panel-eventos">
          <summary>
            <span>Eventos</span>
            <span className="panel-eventos-actual">{viendoAnterior ? <>Viendo: <b>{evento?.nombre}</b></> : <>Activo: <b>{eventoActivo?.nombre}</b></>}</span>
          </summary>
          <div className="panel-eventos-cuerpo">
            <p className="panel-nota">El <b>activo</b> recibe los registros nuevos del QR. Los demás quedan guardados: los puedes ver, proyectar y buscar sus matches.</p>
            <ul>
              {eventos.map(e => {
                const viendo = evento?.id === e.id;
                return (
                  <li key={e.id} className={viendo ? "viendo" : ""}>
                    <div>
                      <b>{e.nombre}</b>
                      <small>{e.personas} {e.personas === 1 ? "persona" : "personas"}{e.activo ? " · Activo" : ""}{viendo ? " · Lo estás viendo" : ""}</small>
                    </div>
                    <div className="panel-eventos-botones">
                      {!viendo && <button type="button" className="boton chico" onClick={() => onVerEvento(e.activo ? null : e.id)}>Ver</button>}
                      {!e.activo && <button type="button" className="boton chico" onClick={() => abrirForm({tipo: "activar", e})}>Hacerlo activo</button>}
                      <button type="button" className="boton chico" onClick={() => abrirForm({tipo: "renombrar", e})}>Renombrar</button>
                    </div>
                  </li>
                );
              })}
            </ul>
            {formEvento
              ? <form className="panel-evento-form" onSubmit={enviarEvento}>
                  {formEvento.tipo === "activar"
                    ? <p>¿Hacer activo <b>{formEvento.e.nombre}</b>? Los registros nuevos del QR irán a ese evento. Los demás quedan guardados.</p>
                    : <>
                        <label htmlFor="f-evento">{formEvento.tipo === "nuevo" ? "Nombre del nuevo evento" : <>Nuevo nombre para <b>{formEvento.e.nombre}</b></>}</label>
                        <input id="f-evento" type="text" maxLength={80} autoFocus placeholder="Ej.: Hackathon Santo Domingo" value={nombreEvento} onChange={e => setNombreEvento(e.target.value)}/>
                        {formEvento.tipo === "nuevo" && <small>Será el evento activo: los registros nuevos del QR irán ahí. <b>{eventoActivo?.nombre ?? "El evento actual"}</b> queda guardado con todos sus perfiles.</small>}
                      </>}
                  {errorEvento && <p className="error" role="alert">{errorEvento}</p>}
                  <div className="panel-eventos-botones">
                    <button type="submit" className="boton fuerte">{formEvento.tipo === "nuevo" ? "Crear evento" : formEvento.tipo === "renombrar" ? "Guardar nombre" : "Sí, hacerlo activo"}</button>
                    <button type="button" className="boton chico" onClick={() => setFormEvento(null)}>Cancelar</button>
                  </div>
                </form>
              : <button type="button" className="boton fuerte" onClick={() => abrirForm({tipo: "nuevo"})}>Nuevo evento</button>}
          </div>
        </details>
      )}

      {datos && calculo && <>
        <div className="panel-cabeza">
          <div className="cifras">
            <div className="cifra"><b>{calculo.activos}</b>en el evento</div>
            <div className="cifra"><b>{calculo.conMatch}</b>con match</div>
            <div className="cifra"><b>{calculo.pares}</b>matches detectados</div>
          </div>
          {viendoAnterior
            ? <p className="panel-nota">Evento anterior: puedes proyectarlo y buscar sus matches en <a href="#clics">Matches</a>. Los registros nuevos van al evento activo.</p>
            : <div className="fase">
            {fase === "registro"
              ? <button className="boton fuerte fase-empezar" type="button" disabled={cambiando || calculo.activos < 2} onClick={() => { onFase("matches"); setTimeout(() => setVuelta(v => v + 1), 800); }}>{cambiando ? "Empezando…" : "Empezar los matches"}</button>
              : <>
                  <p className="fase-lista"><span aria-hidden="true"></span>Los matches ya empezaron: todos pueden ver el suyo.</p>
                  <button className="borrar" type="button" disabled={cambiando} onClick={() => { if (confirm("¿Volver a la fase de registro? Los celulares dejan de mostrar los matches.")) { onFase("registro"); setTimeout(() => setVuelta(v => v + 1), 800); } }}>Volver a la fase de registro</button>
                </>}
          </div>}
        </div>

        <div className="panel-remover">
          <button type="button" className="boton chico" aria-pressed={remover} onClick={() => setRemover(r => !r)}>{remover ? "Ocultar" : "Mostrar"}</button>
        </div>

        {!calculo.perfiles.length
          ? <div className="vacio-grande"><p>Todavía no se ha registrado nadie. Los perfiles aparecen aquí en cuanto la gente escanea el QR.</p></div>
          : <ul className={remover ? "panel-lista" : "panel-lista disimulado"}>
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
                    {remover && <button type="button" className={fila.quitado ? "boton chico" : "boton chico panel-quitar"} disabled={ocupado === p.id} onClick={() => cambiarQuitado(p.id, !fila.quitado)}>
                      {fila.quitado ? "Devolver" : "Quitar"}
                    </button>}
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

        {!viendoAnterior && <details className="panel-opciones">
          <summary>Opciones</summary>
          <div>
            {fase === "matches" && <button type="button" className="boton chico" onClick={() => accion("repetir")}>Mostrar match de nuevo</button>}
            <button type="button" className="boton chico panel-quitar" onClick={() => accion("reiniciar")}>Reiniciar matches</button>
            <button type="button" className="boton chico panel-quitar" onClick={() => accion("borrarTodo")}>Borrar todos los perfiles</button>
          </div>
          {aviso && <p className="panel-nota" role="status">{aviso}</p>}
        </details>}
      </>}
    </section>
  );
}
