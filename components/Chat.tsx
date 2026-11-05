"use client";
/* Chat temporal con un match: para ponerse de acuerdo y encontrarse en el evento. */
import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { esAnon, nombre, type Perfil } from "@/lib/match";
import { HORAS, MAX_TEXTO, RAPIDAS, type Mensaje } from "@/lib/chat";
import { Avatar, PuntoEncuentro } from "./ui";

type Props = {
  me: Perfil; otroId: string; otro: Perfil | null; mensajes: Mensaje[]; escribiendo?: boolean;
  onEnviar: (texto: string) => Promise<boolean>; onBloquear: () => void; onCerrar: () => void;
};

const hora = (t: number) => new Date(t).toLocaleTimeString("es-DO", {hour: "numeric", minute: "2-digit"});

export function Chat({me, otroId, otro, mensajes, escribiendo, onEnviar, onBloquear, onCerrar}: Props) {
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const lista = useRef<HTMLDivElement>(null);
  const campo = useRef<HTMLInputElement>(null);

  // Siempre se ve el último mensaje.
  useLayoutEffect(() => { const l = lista.current; if (l) l.scrollTop = l.scrollHeight; }, [mensajes.length, escribiendo]);

  // El panel ocupa solo la parte visible de la pantalla: con el teclado abierto (iPhone y Android)
  // la caja para escribir sigue a la vista.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const raiz = document.documentElement.style;
    const medir = () => { raiz.setProperty("--vv-h", vv.height + "px"); raiz.setProperty("--vv-top", vv.offsetTop + "px"); };
    medir();
    vv.addEventListener("resize", medir); vv.addEventListener("scroll", medir);
    return () => {
      vv.removeEventListener("resize", medir); vv.removeEventListener("scroll", medir);
      raiz.removeProperty("--vv-h"); raiz.removeProperty("--vv-top");
    };
  }, []);

  // Escape cierra el chat; mientras está abierto, la página de atrás no se mueve.
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => { if (e.key === "Escape") onCerrar(); };
    window.addEventListener("keydown", tecla);
    document.body.classList.add("con-chat");
    if (window.matchMedia("(hover:hover) and (pointer:fine)").matches) campo.current?.focus();
    return () => { window.removeEventListener("keydown", tecla); document.body.classList.remove("con-chat"); };
  }, [onCerrar]);

  async function mandar(t: string) {
    const limpio = t.replace(/\s+/g, " ").trim();
    if (!limpio || enviando || !otro) return;
    setEnviando(true);
    const ok = await onEnviar(limpio);
    setEnviando(false);
    if (ok) setTexto("");
    campo.current?.focus();
  }
  const alEnviar = (e: FormEvent) => { e.preventDefault(); mandar(texto); };

  const titulo = otro ? nombre(otro) : "Persona que ya salió";
  const nada = !mensajes.length;
  return (
    <>
      <div className="chat-fondo" onClick={onCerrar} aria-hidden="true"/>
      <section className="chat" role="dialog" aria-modal="true" aria-labelledby="chat-t">
        <header className="chat-cabeza">
          {otro && <Avatar p={otro}/>}
          <div className="chat-quien">
            <b id="chat-t">{titulo}</b>
            <span>{otro ? (otro.que || (esAnon(otro) ? "Superpoder: " + otro.power : otro.power)) : "Ya no puede recibir mensajes."}</span>
          </div>
          <button type="button" className="chat-x" onClick={onCerrar} aria-label="Cerrar chat">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" fill="none"/></svg>
          </button>
        </header>
        {otro && <div className="chat-punto"><PuntoEncuentro a={me.id} b={otroId} chico/></div>}

        <div className="chat-lista" ref={lista} aria-live="polite">
          {nada && <p className="chat-vacio">La app ya les asignó dónde verse. Avísale cuando vayas para allá.</p>}
          {mensajes.map(m => (
            <div key={m.id} className={"burb " + (m.de === me.id ? "mia" : "suya")}>
              <p>{m.texto}</p>
              <time>{hora(m.creado)}</time>
            </div>
          ))}
          {escribiendo && otro && <p className="chat-escribe">{nombre(otro)} está escribiendo…</p>}
        </div>

        {otro && <>
          <div className="chat-rapidas" aria-label="Mensajes rápidos">
            {RAPIDAS.filter((_, i) => nada ? i < 4 : i > 0).map(r => (
              <button key={r} type="button" disabled={enviando} onClick={() => mandar(r)}>{r}</button>
            ))}
          </div>
          <form className="chat-form" onSubmit={alEnviar}>
            <input ref={campo} value={texto} onChange={e => setTexto(e.target.value)} maxLength={MAX_TEXTO}
              placeholder="Escribe un mensaje…" aria-label="Mensaje" enterKeyHint="send" autoComplete="off"/>
            <button type="submit" className="boton fuerte chico" disabled={enviando || !texto.trim()}>Enviar</button>
          </form>
        </>}

        <footer className="chat-pie">
          <span>Los mensajes se borran solos a las {HORAS} horas.</span>
          <button type="button" onClick={onBloquear}>Bloquear</button>
        </footer>
      </section>
    </>
  );
}

/* Lista de conversaciones abiertas, con los mensajes sin leer. */
export function Conversaciones({me, convs, perfiles, onAbrir}: {
  me: Perfil; convs: {id: string; ultimo: Mensaje; sinLeer: number}[];
  perfiles: Map<string, Perfil>; onAbrir: (id: string) => void;
}) {
  if (!convs.length) return null;
  return (
    <div className="convs">
      <h3 className="sub-t">Mensajes</h3>
      <ul>
        {convs.map(c => {
          const p = perfiles.get(c.id);
          return (
            <li key={c.id}>
              <button type="button" className={c.sinLeer ? "nuevo" : ""} onClick={() => onAbrir(c.id)}>
                {p ? <Avatar p={p}/> : <span className="av anon" aria-hidden="true"/>}
                <span className="conv-txt">
                  <b>{p ? nombre(p) : "Persona que ya salió"}</b>
                  <span>{c.ultimo.de === me.id ? "Tú: " : ""}{c.ultimo.texto}</span>
                </span>
                {c.sinLeer > 0 && <span className="conv-n" aria-label={c.sinLeer + " sin leer"}>{c.sinLeer}</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
