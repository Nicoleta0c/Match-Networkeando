"use client";
/* Piezas pequeñas de la interfaz. Cada una reemplaza una función *HTML() del original. */
import { useRef, type CSSProperties, type ReactNode } from "react";
import { Cara } from "./Buscando";
import { alReves, colorDe, esAnon, iniciales, nombre, sinComillas, type Analisis, type Conexion, type Item, type Perfil } from "@/lib/match";

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

/* Tarjeta de un match: tu idea y su superpoder.
   Se invierte (su idea y tu superpoder) si no tienes idea propia o si eres tú quien le sirve a su idea. */
export function Carta({p, me, analisis, pie, sinCabeza}: {p: Perfil; me: Perfil; analisis: Analisis; pie?: ReactNode; sinCabeza?: boolean}) {
  // Cada parte dice de quién es: "Sueño de Luis", "Superpoder de Camila".
  const de = (x: Perfil, campo: string, tuyo: string) => esAnon(x) ? (x === me ? tuyo : campo + " de esta persona") : campo + " de " + x.alias.split(/\s+/)[0];
  const t = me.idea && !alReves(me, analisis)
    ? {ideaDe: me, ideaLbl: de(me, "Sueño", "Tu sueño"), ideaTxt: me.idea, poderDe: p, poderLbl: de(p, "Superpoder", ""), poderTxt: p.power}
    : {ideaDe: p, ideaLbl: de(p, "Sueño", ""), ideaTxt: p.idea, poderDe: me, poderLbl: de(me, "Superpoder", "Tu superpoder"), poderTxt: me.power};
  // La carita de quien escribió cada parte: la tuya en el color de la app, la del otro en su color.
  const cara = (x: Perfil) => <Cara color={x === me ? "var(--a)" : esAnon(x) ? "#3A3A34" : colorDe(x)}/>;
  return (
    <article className="carta" data-id={p.id}>
      {!sinCabeza && <div className="cabeza">
        <Avatar p={p}/>
        <div>
          <b>{nombre(p)}</b>
          {p.que ? <span className="sub">{p.que}</span> : null}
        </div>
        <span className="pct">{analisis.pct}%</span>
      </div>}
      <div className="par">
        <div className="lado idea">
          <div className="quien">{cara(t.ideaDe)}<small>{t.ideaLbl}</small></div>
          {t.ideaTxt ? <p>{t.ideaTxt}</p> : <p className="vacio">Todavía sin sueño propio. Quiere sumarse al de alguien.</p>}
        </div>
        <div className="lado poder">
          <div className="quien">{cara(t.poderDe)}<small>{t.poderLbl}</small></div>
          <p>{t.poderTxt}</p>
        </div>
      </div>
      {pie}
    </article>
  );
}

/* "Doble vía" (se ayudan los dos) o "Una vía" (la ayuda va en una sola dirección). */
export function Via({tipo}: {tipo: Conexion["tipo"]}) {
  return (
    <span className="via" data-tipo={tipo}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        {tipo === "doble"
          ? <path d="M4 8h15m-4-4 4 4-4 4M20 16H5m4-4-4 4 4 4"/>
          : <path d="M4 12h15m-4-4 4 4-4 4"/>}
      </svg>
      {tipo === "doble" ? "Doble vía" : "Una vía"}
    </span>
  );
}

/* Cómo se ayudan: qué hace por tu sueño, qué haces tú por el suyo, el primer paso y el rompehielo.
   En las tarjetas pequeñas (corto) no va el primer paso. */
function Ayuda({c, rompe, corto}: {c: Conexion; rompe?: string; corto?: boolean}) {
  return (
    <dl className={"ayuda" + (corto ? " corto" : "")}>
      {c.teAyuda && <div><dt>Te ayuda con</dt><dd>{c.teAyuda}</dd></div>}
      {c.leAyudas && <div><dt>Tú le ayudas con</dt><dd>{c.leAyudas}</dd></div>}
      {!corto && c.paso && <div><dt>Primer paso</dt><dd>{c.paso}</dd></div>}
      {rompe && <div className="ayuda-rompe"><dt>Rompehielo</dt><dd>“{sinComillas(rompe)}”</dd></div>}
    </dl>
  );
}

/* Pie de la tarjeta: su sueño, cómo se ayudan y cómo contactarle. */
export function Pie({me, x, conRazones, accion}: {me: Perfil; x: Item; conRazones?: boolean; accion?: ReactNode}) {
  const o = x.o, c = x.r.conexion;
  return (
    <div className="pie">
      {me.idea && o.idea && !alReves(me, x.r) && <p className="su-idea"><b>{esAnon(o) ? "Su sueño" : "Sueño de " + o.alias.split(/\s+/)[0]}:</b> {o.idea}</p>}
      {conRazones && (c
        ? <><Via tipo={c.tipo}/><Ayuda c={c} rompe={x.r.rompe} corto/></>
        : <>
          <ul className="razones">{x.r.razones.slice(0, 2).map((t, i) => <li key={i}>{t}</li>)}</ul>
          {x.r.rompe && <p className="rompe-mini">Rompehielo: “{sinComillas(x.r.rompe)}”</p>}
        </>)}
      {!esAnon(o) && o.contact && <>Escríbele: <Contacto t={o.contact}/></>}
      {accion && <div className="pie-accion">{accion}</div>}
    </div>
  );
}

/* Panel "Cómo se ayudan" con el anillo que se llena hasta el porcentaje. */
export function Porque({x, accion}: {me: Perfil; x: Item; accion?: ReactNode}) {
  const fin = (364.4 * (1 - x.r.pct / 100)).toFixed(1);
  const c = x.r.conexion;
  return (
    <div className="porque">
      <div className="anillo">
        <svg viewBox="0 0 136 136" aria-hidden="true">
          <circle className="f" cx="68" cy="68" r="58"/>
          <circle className="v" cx="68" cy="68" r="58" style={varCSS({"--fin": fin, strokeDashoffset: fin})}/>
        </svg>
        <b><span>{x.r.pct}%</span></b>
      </div>
      <h3>{c ? "Cómo se ayudan" : "Por qué encajan"}</h3>
      {(c || x.r.ia) && <div className="chips">{c && <Via tipo={c.tipo}/>}{x.r.ia && <span className="ia-chip">Según la IA</span>}</div>}
      {c ? <Ayuda c={c} rompe={x.r.rompe}/> : <ul>{x.r.razones.map((t, i) => <li key={i}>{t}</li>)}</ul>}
      {accion && <div className="porque-accion">{accion}</div>}
    </div>
  );
}


export function Aviso({children}: {children: ReactNode}) {
  if (!children) return null;
  return <div className="aviso" data-estado>{children}</div>;
}
