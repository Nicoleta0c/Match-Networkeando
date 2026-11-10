"use client";
import { useEffect, useRef, useState, type FormEvent, type ReactNode, type RefObject } from "react";
import { LIMITES, type Perfil } from "@/lib/match";
import { revisarTextos } from "@/lib/validar";
import { Aviso } from "./ui";
import { Cara } from "./Buscando";
import type { PerfilAnterior } from "./App";

export type DatosForm = {idea: string; power: string; anon: boolean; alias: string; que: string; contact: string};

type Props = {
  /** Ya empezaron los matches (o es la demo): el botón también busca. */
  buscar: boolean;
  activo: boolean; aviso: ReactNode; me: Perfil | null;
  /** Tu perfil de un evento anterior (si en este todavía no tienes): se ofrece para no escribir todo otra vez. */
  anterior: PerfilAnterior | null;
  puede: boolean; guardando: boolean;
  /* Cada vez que cambia, el formulario se vuelve a llenar con el perfil guardado (llenarForm del original). */
  relleno: number;
  tocadoRef: RefObject<boolean>;
  /** true si se guardó; si el texto no parece real, el aviso y el campo a corregir. */
  onGuardar: (d: DatosForm) => Promise<boolean | {error: string; campo: "idea" | "poder"}>;
  onBorrar: () => Promise<boolean>;
};

export function VistaPerfil({activo, buscar, aviso, me, anterior, puede, guardando, relleno, tocadoRef, onGuardar, onBorrar}: Props) {
  const [idea, setIdea] = useState("");
  const [poder, setPoder] = useState("");
  // "Mi nombre" siempre empieza cerrado; lo abre quien quiera. Ser anónimo depende de si escribes tu nombre.
  const [abierto, setAbierto] = useState(false);
  const [alias, setAlias] = useState("");
  const [que, setQue] = useState("");
  const [contacto, setContacto] = useState("");
  const [usoAnterior, setUsoAnterior] = useState(false);
  const [error, setError] = useState("");
  const [malo, setMalo] = useState<"idea" | "poder" | "nombre" | "contacto" | null>(null);
  const [armado, setArmado] = useState(false);
  const ideaRef = useRef<HTMLTextAreaElement>(null);
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
      setIdea(me.idea); setPoder(me.power);
      setAlias(me.anon ? "" : me.alias); setQue(me.anon ? "" : me.que); setContacto(me.anon ? "" : me.contact);
    }
    setAbierto(false); setArmado(false); setError(""); setMalo(null);
  }, [relleno, me, tocadoRef]);

  const tocar = () => { tocadoRef.current = true; };

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setError(""); setMalo(null);
    const nombre = alias.trim(), contact = contacto.trim();
    // Con nombre o con contacto, sales con tu nombre; si no escribes nada ahí, quedas anónimo.
    const anon = !nombre && !contact;
    const d: DatosForm = {idea: idea.trim(), power: poder.trim(), anon, alias: nombre, que: que.trim(), contact};
    if (!d.idea) { setError("Escribe tu sueño para continuar."); setMalo("idea"); ideaRef.current?.focus(); return; }
    if (!d.power) { setError("Escribe tu superpoder para continuar."); setMalo("poder"); poderRef.current?.focus(); return; }
    // Que escriban algo real (las mismas reglas rápidas que revisa el servidor).
    const rapido = revisarTextos(d.idea, d.power);
    if (rapido) { avisar(rapido); return; }
    if (!anon && !d.alias) { setAbierto(true); setError("Escribe tu nombre, o borra el contacto para quedar anónimo."); setMalo("nombre"); setTimeout(() => nombreRef.current?.focus()); return; }
    if (!anon && !d.contact) { setAbierto(true); setError("Agrega cómo contactarte para que tus matches puedan escribirte."); setMalo("contacto"); setTimeout(() => contactoRef.current?.focus()); return; }
    const r = await onGuardar(d);
    if (r && typeof r === "object") avisar(r);
  };
  function avisar(p: {error: string; campo: "idea" | "poder"}) {
    setError(p.error); setMalo(p.campo);
    (p.campo === "idea" ? ideaRef : poderRef).current?.focus();
  }

  const quitar = async () => {
    if (!armado) { setArmado(true); return; }
    if (await onBorrar()) {
      setIdea(""); setPoder(""); setAlias(""); setQue(""); setContacto(""); setAbierto(false);
    }
  };

  return (
    <section className="cont vista" data-view-panel="perfil" aria-labelledby="t-perfil" hidden={!activo}>
      <h2 className="titulo" id="t-perfil">Mi perfil</h2>
      <Aviso>{aviso}</Aviso>
      {!me && anterior && !usoAnterior && (
        <div className="perfil-anterior">
          <p>Ya usaste la app en <b>{anterior.evento}</b>. ¿Quieres usar el mismo perfil? Lo puedes cambiar antes de guardar.</p>
          <button type="button" className="boton chico fuerte" onClick={() => {
            setIdea(anterior.idea); setPoder(anterior.power);
            setAlias(anterior.anon ? "" : anterior.alias); setQue(anterior.anon ? "" : anterior.que); setContacto(anterior.anon ? "" : anterior.contact);
            if (!anterior.anon) setAbierto(true);
            tocadoRef.current = true; setUsoAnterior(true);
          }}>Usar mi perfil anterior</button>
        </div>
      )}
      <form className="form" id="form" noValidate onSubmit={enviar} onInput={tocar}>
        {/* Escribes directo en tu tarjeta: así se verá cuando hagas match. */}
        <div className="bloques">
          <div className="bloque idea">
            <label className="bloque-et" htmlFor="f-idea">
              <Cara color="var(--a)"/>
              <span><b>Mi sueño</b><small>¿Cuál es tu sueño o qué quieres lograr?</small></span>
            </label>
            <textarea id="f-idea" rows={3} ref={ideaRef} required aria-invalid={malo === "idea" || undefined} aria-describedby={malo === "idea" ? "error" : undefined} maxLength={LIMITES.idea} placeholder="Ej.: lanzar una app para que los colmados lleven el fiado en el celular" value={idea} onChange={e => setIdea(e.target.value)}></textarea>
          </div>
          <span className="union" aria-hidden="true"></span>
          <div className="bloque poder">
            <label className="bloque-et" htmlFor="f-poder">
              <Cara color="var(--h)"/>
              <span><b>Mi superpoder</b><small>¿Qué es lo que mejor haces?</small></span>
            </label>
            <textarea id="f-poder" rows={3} ref={poderRef} required aria-invalid={malo === "poder" || undefined} aria-describedby={malo === "poder" ? "error" : undefined} maxLength={LIMITES.power} placeholder="Ej.: programo apps en Flutter" value={poder} onChange={e => setPoder(e.target.value)}></textarea>
          </div>
        </div>

        <p className="error" id="error" role="alert">{error}</p>
        <div className="form-acciones">
          <button className="boton fuerte" type="submit" id="b-guardar" disabled={!puede || guardando}>{!buscar ? "Guardar" : me ? "Guardar y buscar de nuevo" : "Guardar y buscar mi match"}</button>
          {/* Solo dos preguntas. Quien quiera, abre esto y pone su nombre; si no, queda anónimo. */}
          <details className="aparecer" open={abierto} onToggle={e => setAbierto(e.currentTarget.open)}>
            <summary>
              <span className="desplegar-signo" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M5 12h14"/><path className="vertical" d="M12 5v14"/></svg>
              </span>
              <span>Mi nombre <small>{!abierto && alias.trim() ? "· " + alias.trim() : "(opcional)"}</small></span>
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
