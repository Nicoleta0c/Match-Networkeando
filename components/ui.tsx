"use client";
/* Piezas pequeñas de la interfaz. Cada una reemplaza una función *HTML() del original. */
import { useRef, type CSSProperties, type ReactNode } from "react";
import { alReves, claveMatch, colorDe, esAnon, iniciales, nombre, sinComillas, type Analisis, type Item, type Perfil } from "@/lib/match";

const varCSS = (vars: Record<string, string>) => vars as CSSProperties;

export function Iconos() {
  return (
    <svg width="0" height="0" style={{position: "absolute"}} aria-hidden="true">
      <symbol id="i-anon" viewBox="0 0 24 24"><path d="M3 10c2.5-1.5 5-1.5 9 0 4-1.5 6.5-1.5 9 0-.5 4-3 6-5.5 6-2 0-3-1.5-3.5-3h0c-.5 1.5-1.5 3-3.5 3C6 16 3.5 14 3 10z" fill="#fff"/><circle cx="8" cy="11.5" r="1.4" fill="#2B2B27"/><circle cx="16" cy="11.5" r="1.4" fill="#2B2B27"/></symbol>
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

/* Tarjeta de un match: tu idea y su superpoder unidos por la cuerda dorada.
   Se invierte (su idea y tu superpoder) si no tienes idea propia o si eres tú quien le sirve a su idea. */
export function Carta({p, me, analisis, pie}: {p: Perfil; me: Perfil; analisis: Analisis; pie?: ReactNode}) {
  const t = me.idea && !alReves(me, analisis)
    ? {ideaLbl: "Tu idea", ideaTxt: me.idea, poderLbl: "Su superpoder", poderTxt: p.power}
    : {ideaLbl: "Su idea", ideaTxt: p.idea, poderLbl: "Tu superpoder", poderTxt: me.power};
  return (
    <article className="carta" data-id={p.id}>
      <div className="cabeza">
        <Avatar p={p}/>
        <div>
          <b>{nombre(p)}</b>
          {p.anon ? <span className="sub">Perfil anónimo{p.que ? ", " + p.que : ""}</span> : (p.que ? <span className="sub">{p.que}</span> : null)}
        </div>
        <span className="pct">{analisis.pct}%</span>
      </div>
      <div className="par">
        <div className="lado"><small>{t.ideaLbl}</small>{t.ideaTxt ? <p>{t.ideaTxt}</p> : <p className="vacio">Todavía sin idea propia. Quiere sumarse a la de alguien.</p>}</div>
        <span className="cuerda" aria-hidden="true"></span>
        <div className="lado poder"><small>{t.poderLbl}</small><p>{t.poderTxt}</p></div>
      </div>
      {pie}
    </article>
  );
}

/* Pie de la tarjeta: su idea, razones y cómo contactarle. */
export function Pie({me, x, conRazones}: {me: Perfil; x: Item; conRazones?: boolean}) {
  const o = x.o;
  return (
    <div className="pie">
      {me.idea && o.idea && !alReves(me, x.r) && <p className="su-idea"><b>Su idea:</b> {o.idea}</p>}
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

/* Panel "Por qué encajan" con el anillo que se llena hasta el porcentaje. */
export function Porque({x}: {x: Item}) {
  const fin = (364.4 * (1 - x.r.pct / 100)).toFixed(1);
  return (
    <div className="porque">
      <div className="anillo">
        <svg viewBox="0 0 136 136" aria-hidden="true">
          <circle className="f" cx="68" cy="68" r="58"/>
          <circle className="v" cx="68" cy="68" r="58" style={varCSS({"--fin": fin, strokeDashoffset: fin})}/>
        </svg>
        <b><span>{x.r.pct}%</span></b>
      </div>
      <h3>Por qué encajan {x.r.ia && <span className="ia-chip">Según la IA</span>}</h3>
      <ul>{x.r.razones.map((t, i) => <li key={i}>{t}</li>)}</ul>
      {x.r.rompe && <p className="rompe"><small>Para romper el hielo</small>“{sinComillas(x.r.rompe)}”</p>}
    </div>
  );
}

export function Aviso({children}: {children: ReactNode}) {
  if (!children) return null;
  return <div className="aviso" data-estado>{children}</div>;
}
