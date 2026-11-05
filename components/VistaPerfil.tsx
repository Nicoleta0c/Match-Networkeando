"use client";
import { useEffect, useRef, useState, type FormEvent, type ReactNode, type RefObject } from "react";
import { LIMITES, type Perfil } from "@/lib/match";
import { Aviso } from "./ui";
import { Cara } from "./Buscando";

export type DatosForm = {idea: string; power: string; anon: boolean; alias: string; que: string; contact: string};

type Props = {
  activo: boolean; aviso: ReactNode; me: Perfil | null;
  puede: boolean; guardando: boolean;
  /* Cada vez que cambia, el formulario se vuelve a llenar con el perfil guardado (llenarForm del original). */
  relleno: number;
  tocadoRef: RefObject<boolean>;
  onGuardar: (d: DatosForm) => Promise<boolean>;
  onBorrar: () => Promise<boolean>;
};

export function VistaPerfil({activo, aviso, me, puede, guardando, relleno, tocadoRef, onGuardar, onBorrar}: Props) {
  const [idea, setIdea] = useState("");
  const [poder, setPoder] = useState("");
  const [anon, setAnon] = useState(true);
  const [alias, setAlias] = useState("");
  const [que, setQue] = useState("");
  const [contacto, setContacto] = useState("");
  const [error, setError] = useState("");
  const [malo, setMalo] = useState<"poder" | "nombre" | "contacto" | null>(null);
  const [armado, setArmado] = useState(false);
  const poderRef = useRef<HTMLTextAreaElement>(null);
  const nombreRef = useRef<HTMLInputElement>(null);
  const contactoRef = useRef<HTMLInputElement>(null);
  const ultimoRelleno = useRef(-1);

  useEffect(() => {
    const pedido = relleno !== ultimoRelleno.current;
    ultimoRelleno.current = relleno;
    // Si llegan perfiles nuevos mientras la persona escribe, no le borramos lo escrito.
    if (!pedido && tocadoRef.current) return;
    if (me) {
      setIdea(me.idea); setPoder(me.power); setAnon(me.anon);
      setAlias(me.alias); setQue(me.que); setContacto(me.contact);
    }
    setArmado(false); setError(""); setMalo(null);
  }, [relleno, me, tocadoRef]);

  const tocar = () => { tocadoRef.current = true; };

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setError(""); setMalo(null);
    const d: DatosForm = {idea: idea.trim(), power: poder.trim(), anon, alias: alias.trim(), que: que.trim(), contact: contacto.trim()};
    if (!d.power) { setError("Escribe tu superpoder para continuar."); setMalo("poder"); poderRef.current?.focus(); return; }
    if (!anon && !d.alias) { setError("Escribe tu nombre o cambia a Anónimo."); setMalo("nombre"); nombreRef.current?.focus(); return; }
    if (!anon && !d.contact) { setError("Agrega cómo contactarte para que tus matches puedan escribirte."); setMalo("contacto"); contactoRef.current?.focus(); return; }
    await onGuardar(d);
  };

  const quitar = async () => {
    if (!armado) { setArmado(true); return; }
    if (await onBorrar()) {
      setIdea(""); setPoder(""); setAlias(""); setQue(""); setContacto(""); setAnon(true);
    }
  };

  return (
    <section className="cont vista" data-view-panel="perfil" aria-labelledby="t-perfil" hidden={!activo}>
      <h2 className="titulo" id="t-perfil">Preséntate</h2>
      <Aviso>{aviso}</Aviso>
      <form className="form" id="form" noValidate onSubmit={enviar} onInput={tocar}>
        {/* Escribes directo en tu tarjeta: así se verá cuando hagas match. */}
        <div className="bloques">
          <div className="bloque idea">
            <label className="bloque-et" htmlFor="f-idea">
              <Cara color="var(--a)"/>
              <span><b>Mi sueño</b><small>¿Cuál es tu sueño o qué quieres lograr?</small></span>
            </label>
            <textarea id="f-idea" rows={3} maxLength={LIMITES.idea} placeholder="Ej.: lanzar una app para que los colmados lleven el fiado en el celular" aria-describedby="ayuda-idea" value={idea} onChange={e => setIdea(e.target.value)}></textarea>
            <div className="bloque-pie">
              <span id="ayuda-idea">Opcional: si no tienes uno, te sumas al de alguien.</span>
              <span className="cuenta" aria-hidden="true">{idea.length}/{LIMITES.idea}</span>
            </div>
          </div>
          <span className="union" aria-hidden="true"></span>
          <div className="bloque poder">
            <label className="bloque-et" htmlFor="f-poder">
              <Cara color="var(--h)"/>
              <span><b>Mi superpoder</b><small>¿Qué es lo que mejor haces?</small></span>
            </label>
            <textarea id="f-poder" rows={3} ref={poderRef} aria-invalid={malo === "poder" || undefined} aria-describedby={malo === "poder" ? "error" : "ayuda-poder"} maxLength={LIMITES.power} placeholder="Ej.: programo apps en Flutter" value={poder} onChange={e => setPoder(e.target.value)}></textarea>
            <div className="bloque-pie">
              <span id="ayuda-poder">Algo concreto que sabes hacer bien.</span>
              <span className="cuenta" aria-hidden="true">{poder.length}/{LIMITES.power}</span>
            </div>
          </div>
        </div>

        <p className="error" id="error" role="alert">{error}</p>
        <div className="form-acciones">
          <button className="boton fuerte" type="submit" id="b-guardar" disabled={!puede || guardando}>{me ? "Guardar y buscar de nuevo" : "Guardar y buscar mi match"}</button>
          {/* Solo dos preguntas. Quien quiera, abre esto y sale con su nombre; si no, queda anónimo. */}
          <details className="aparecer" open={!anon} onToggle={e => { const abierto = e.currentTarget.open; if (abierto === anon) { tocar(); setAnon(!abierto); } }}>
            <summary>
              <span className="desplegar-signo" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M5 12h14"/><path className="vertical" d="M12 5v14"/></svg>
              </span>
              <span>Mi nombre <small>(opcional)</small></span>
            </summary>
            <div className="campos-nombre" id="campos-nombre">
              <div className="campo">
                <label htmlFor="f-nombre">Tu nombre</label>
                <input type="text" id="f-nombre" ref={nombreRef} aria-invalid={malo === "nombre" || undefined} aria-describedby={malo === "nombre" ? "error" : undefined} maxLength={LIMITES.alias} autoComplete="name" placeholder="Ej.: Paola Jiménez" value={alias} onChange={e => setAlias(e.target.value)}/>
              </div>
              <div className="campo">
                <label htmlFor="f-que">A qué te dedicas <span>(opcional)</span></label>
                <input type="text" id="f-que" maxLength={LIMITES.que} placeholder="Ej.: Ingeniería de Software" value={que} onChange={e => setQue(e.target.value)}/>
              </div>
              <div className="campo">
                <label htmlFor="f-contacto">Cómo contactarte</label>
                <input type="text" id="f-contacto" ref={contactoRef} aria-invalid={malo === "contacto" || undefined} aria-describedby={malo === "contacto" ? "error" : undefined} maxLength={LIMITES.contact} placeholder="@usuario, WhatsApp o correo" value={contacto} onChange={e => setContacto(e.target.value)}/>
              </div>
            </div>
          </details>
          <button className="borrar" type="button" id="b-quitar" hidden={!me} disabled={!puede} onClick={quitar}>{armado ? "Toca otra vez para borrarlo" : "Borrar mi perfil"}</button>
        </div>
      </form>
    </section>
  );
}
