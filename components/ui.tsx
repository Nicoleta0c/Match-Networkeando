"use client";
/* Piezas pequeñas de la interfaz. Cada una reemplaza una función *HTML() del original. */
import { useRef, type CSSProperties, type ReactNode } from "react";
import { claveMatch, colorDe, esAnon, iniciales, nombre, sinComillas, type Item, type Perfil } from "@/lib/match";

const varCSS = (vars: Record<string, string>) => vars as CSSProperties;

export function Iconos() {
  return (
    <svg width="0" height="0" style={{position: "absolute"}} aria-hidden="true">
      <symbol id="i-x" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"/></symbol>
      <symbol id="i-si" viewBox="0 0 24 24"><circle cx="9" cy="12" r="5.5" fill="none" stroke="currentColor" strokeWidth="2.4"/><circle cx="15" cy="12" r="5.5" fill="none" stroke="currentColor" strokeWidth="2.4"/></symbol>
      <symbol id="i-anon" viewBox="0 0 24 24"><path d="M3 10c2.5-1.5 5-1.5 9 0 4-1.5 6.5-1.5 9 0-.5 4-3 6-5.5 6-2 0-3-1.5-3.5-3h0c-.5 1.5-1.5 3-3.5 3C6 16 3.5 14 3 10z" fill="#fff"/><circle cx="8" cy="11.5" r="1.4" fill="#2A1E5C"/><circle cx="16" cy="11.5" r="1.4" fill="#2A1E5C"/></symbol>
    </svg>
  );
}

/* Los dos personajes. Al tocarlos vuelven a hacer match. */
export function Duo({chico}: {chico?: boolean}) {
  const ref = useRef<HTMLDivElement>(null);
  const repetir = () => {
    const d = ref.current; if (!d) return;
    d.classList.remove("juntar"); void d.offsetWidth; d.classList.add("juntar");
  };
  return (
    <div ref={ref} className={"duo juntar " + (chico ? "chico" : "")} role="img" aria-label="Dos personas haciendo networking: una con su celular y otra con su laptop" title="Tócalos para que vuelvan a hacer match" onClick={repetir}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="dL" src="/duo-l.webp" alt=""/>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="dR" src="/duo-r.webp" alt=""/>
      <span className="chispa"></span><span className="chispa b"></span>
    </div>
  );
}

export function Avatar({p, extra}: {p: Perfil; extra?: string}) {
  if (esAnon(p)) return <span className={"av anon " + (extra || "")} aria-hidden="true"><svg><use href="#i-anon"/></svg></span>;
  return <span className={"av " + (extra || "")} style={varCSS({"--c": colorDe(p)})} aria-hidden="true">{iniciales(p)}</span>;
}

export function Contacto({t}: {t: string}) {
  if (!t) return null;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return <a href={"mailto:" + t}>{t}</a>;
  const d = t.replace(/[^\d]/g, "");
  if (/^[+\d\s().-]+$/.test(t) && d.length >= 8) return <a href={"https://wa.me/" + d} target="_blank" rel="noopener">{t} (WhatsApp)</a>;
  return <>{t}</>;
}

/* Tarjeta de un perfil. Con par=true muestra "Tu idea" + "Su superpoder". */
export function Carta({p, me, analisis, cls, par, pie}: {p: Perfil; me: Perfil | null; analisis?: {pct: number}; cls?: string; par?: boolean; pie?: ReactNode}) {
  const etiqueta = analisis ? analisis.pct + "% compatible" : "";
  const t = {ideaLbl: "Su idea", ideaTxt: p.idea, poderLbl: "Su superpoder", poderTxt: p.power};
  if (par && me) {
    if (me.idea) { t.ideaLbl = "Tu idea"; t.ideaTxt = me.idea; }
    else { t.poderLbl = "Tu superpoder"; t.poderTxt = me.power; }
  }
  return (
    <article className={"carta " + (cls || "")} data-id={p.id}>
      <div className="carta-cabeza">
        <Avatar p={p}/>
        <div>
          <div className="nom">{nombre(p)}{me && p.id === me.id ? " (tú)" : ""}</div>
          {p.anon ? <div className="sub">Perfil anónimo{p.que ? ", " + p.que : ""}</div> : (p.que ? <div className="sub">{p.que}</div> : null)}
        </div>
      </div>
      {etiqueta && <span className="compat">{etiqueta}</span>}
      <div className="carta-idea"><div className="lado">{t.ideaLbl}</div>{t.ideaTxt ? <p>{t.ideaTxt}</p> : <p className="vacio">Todavía sin idea propia. Quiere sumarse a la de alguien.</p>}</div>
      <div className="carta-poder">{par && <span className="une" aria-hidden="true">+</span>}<div className="lado">{t.poderLbl}</div><p>{t.poderTxt}</p></div>
      {pie}
    </article>
  );
}

/* Pie de la tarjeta en Mis matches: su idea, razones y cómo contactarle. */
export function Pie({me, x, conRazones}: {me: Perfil; x: Item; conRazones?: boolean}) {
  const o = x.o;
  return (
    <div className="clic-contacto">
      {me.idea ? (o.idea ? <p className="su-idea"><b>Su idea:</b> {o.idea}</p> : null) : <p className="su-idea"><b>Su superpoder:</b> {o.power}</p>}
      {conRazones && <>
        <ul className="razones">{x.r.razones.slice(0, 2).map((t, i) => <li key={i}>{t}</li>)}</ul>
        {x.r.rompe && <p className="rompe-mini">Rompehielos: “{sinComillas(x.r.rompe)}”</p>}
      </>}
      {(!esAnon(o) && o.contact)
        ? <>Escríbele: <Contacto t={o.contact}/></>
        : <>Clave para encontrarse:<span className="clave-chip">{claveMatch(me.id, o.id)}</span></>}
    </div>
  );
}

/* Panel "Por qué encajan" con el anillo de porcentaje. */
export function Porque({x}: {x: Item}) {
  const fin = (339.3 * (1 - x.r.pct / 100)).toFixed(1);
  return (
    <div className="porque">
      <div className="anillo-pct">
        <svg viewBox="0 0 132 132" aria-hidden="true">
          <defs><linearGradient id="grad-pct" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#5B2EFF"/><stop offset="1" stopColor="#F0306F"/></linearGradient></defs>
          <circle className="fondo" cx="66" cy="66" r="54"/>
          <circle className="valor" cx="66" cy="66" r="54" style={varCSS({"--fin": fin, strokeDashoffset: fin})}/>
        </svg>
        <b>{x.r.pct}%</b>
      </div>
      <h3>Por qué encajan {x.r.ia && <span className="ia-chip">Según la IA</span>}</h3>
      <ul className="razones">{x.r.razones.map((t, i) => <li key={i}>{t}</li>)}</ul>
      {x.r.rompe && <p className="rompe"><small>Para romper el hielo</small>“{sinComillas(x.r.rompe)}”</p>}
    </div>
  );
}

export function Aviso({children}: {children: ReactNode}) {
  if (!children) return null;
  return <div className="aviso" data-estado>{children}</div>;
}
