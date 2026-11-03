"use client";
import { useEffect, useRef, useState, type FormEvent, type ReactNode, type RefObject } from "react";
import { LIMITES, type Perfil } from "@/lib/match";
import { Aviso } from "./ui";

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
      <h2 className="titulo" id="t-perfil">Mi perfil</h2>
      <p className="intro">Dos cosas: lo que quieres hacer y lo que mejor haces. El hilo hace el resto.</p>
      <Aviso>{aviso}</Aviso>
      <form className="form" id="form" noValidate onSubmit={enviar} onInput={tocar}>
        <div className="bloques">
          <div className="bloque idea">
            <h3>Mi idea</h3>
            <label htmlFor="f-idea">¿Qué quieres hacer realidad?</label>
            <textarea id="f-idea" maxLength={LIMITES.idea} placeholder="Dar una charla gratis sobre finanzas para jóvenes" value={idea} onChange={e => setIdea(e.target.value)}></textarea>
            <span className="cuenta" aria-hidden="true">{idea.length}/{LIMITES.idea}</span>
          </div>
          <span className="union" aria-hidden="true"></span>
          <div className="bloque poder">
            <h3>Mi superpoder</h3>
            <label htmlFor="f-poder">¿Qué es lo que mejor haces?</label>
            <textarea id="f-poder" ref={poderRef} aria-invalid={malo === "poder" || undefined} aria-describedby={malo === "poder" ? "error" : undefined} maxLength={LIMITES.power} placeholder="Coordinador de voluntariados" value={poder} onChange={e => setPoder(e.target.value)}></textarea>
            <span className="cuenta" aria-hidden="true">{poder.length}/{LIMITES.power}</span>
          </div>
        </div>
        <div className="fila">
          <div className="segmento" role="group" aria-label="Cómo quieres aparecer">
            <button type="button" aria-pressed={anon} onClick={() => { tocar(); setAnon(true); }}>Anónimo</button>
            <button type="button" aria-pressed={!anon} onClick={() => { tocar(); setAnon(false); }}>Con mi nombre</button>
          </div>
          <div className="campos-nombre" id="campos-nombre" hidden={anon}>
            <label className="sr" htmlFor="f-nombre">Tu nombre</label><input type="text" id="f-nombre" ref={nombreRef} aria-invalid={malo === "nombre" || undefined} aria-describedby={malo === "nombre" ? "error" : undefined} maxLength={LIMITES.alias} autoComplete="name" placeholder="Tu nombre" value={alias} onChange={e => setAlias(e.target.value)}/>
            <label className="sr" htmlFor="f-que">A qué te dedicas</label><input type="text" id="f-que" maxLength={LIMITES.que} placeholder="A qué te dedicas (opcional)" value={que} onChange={e => setQue(e.target.value)}/>
            <label className="sr" htmlFor="f-contacto">Cómo contactarte</label><input type="text" id="f-contacto" ref={contactoRef} aria-invalid={malo === "contacto" || undefined} aria-describedby={malo === "contacto" ? "error" : undefined} maxLength={LIMITES.contact} placeholder="@usuario, WhatsApp o correo" value={contacto} onChange={e => setContacto(e.target.value)}/>
          </div>
          <button className="boton fuerte" type="submit" id="b-guardar" disabled={!puede || guardando}>{me ? "Guardar y buscar de nuevo" : "Guardar y buscar mi match"}</button>
        </div>
        <p className="nota" id="nota-anon" hidden={!anon}>Nadie verá tu nombre. Igual puedes hacer match; cuando quieras que te contacten, cambias a Con mi nombre.</p>
        <p className="nota" id="nota-nombre" hidden={anon}>Tu nombre y tu contacto se ven en tu tarjeta.</p>
        <p className="error" id="error" role="alert">{error}</p>
        <button className="borrar" type="button" id="b-quitar" hidden={!me} disabled={!puede} onClick={quitar}>{armado ? "Toca otra vez para borrarlo" : "Borrar mi perfil"}</button>
      </form>
    </section>
  );
}
