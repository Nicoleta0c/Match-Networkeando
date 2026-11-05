"use client";
import { useState, type ReactNode } from "react";
import { UMBRAL, type Item, type Perfil } from "@/lib/match";
import { Aviso, Carta, Duo, Pie, Porque } from "./ui";
import { Buscando, type Busqueda } from "./Buscando";
import { Conversaciones } from "./Chat";
import type { Conv } from "./App";

type Props = {
  activo: boolean; aviso: ReactNode;
  busqueda: Busqueda | null; pasoFinal: string | null; ganador: string | null; ganadorPct: number | null;
  loaded: boolean; me: Perfil | null; todos: Item[];
  conIA: boolean; iaFallo: boolean;
  onBuscar: () => void;
  convs: Conv[]; perfiles: Map<string, Perfil>; onChat: (id: string) => void;
};

export function VistaClics({activo, aviso, busqueda, pasoFinal, ganador, ganadorPct, ...resto}: Props) {
  return (
    <section className="cont vista" data-view-panel="clics" aria-labelledby="t-clics" hidden={!activo}>
      <h2 className="titulo" id="t-clics">{busqueda ? "La app busca tu match por ti" : "Mis matches"}</h2>
      <Aviso>{aviso}</Aviso>
      {busqueda && resto.me
        ? <Buscando key={busqueda.id} b={busqueda} me={resto.me} pasoFinal={pasoFinal} ganador={ganador} pct={ganadorPct}/>
        : <Cuerpo {...resto}/>}
    </section>
  );
}

function Cuerpo({loaded, me, todos, conIA, iaFallo, onBuscar, convs, perfiles, onChat}: Omit<Props, "activo" | "aviso" | "busqueda" | "pasoFinal" | "ganador" | "ganadorPct">) {
  if (!loaded) return null;
  if (!me) return (
    <div className="vacio-grande">
      <Duo chico/>
      <p>Crea tu perfil y la app buscará con quién encajas mejor.</p>
      <div className="acciones"><a className="boton fuerte" href="#perfil">Crear mi perfil</a><a className="boton" href="#demo">Probar la demo</a></div>
    </div>
  );
  const buenos = todos.filter(x => x.r.pct >= UMBRAL);
  const lista = buenos.length ? buenos : todos.slice(0, 3);
  const mejor = lista[0];
  return (
    <>
      <div className="m-cabeza">
        <p className="intro">{todos.length ? (conIA ? "La IA revisó " : "La app revisó ") + todos.length + (todos.length === 1 ? " perfil" : " perfiles") + " y eligió quién encaja mejor contigo." : "Todavía no hay más gente en el salón."}</p>
        {todos.length > 0 && <button className="boton chico" type="button" id="b-buscar" onClick={onBuscar}>Buscar de nuevo</button>}
      </div>
      {!conIA && todos.length > 0 && iaFallo && <p className="nota">La IA no respondió, así que la app eligió con su método básico. Toca Buscar de nuevo para intentarlo.</p>}
      {me.anon && buenos.length > 0 && <div className="aviso"><strong>Tu perfil es anónimo.</strong> Tus matches solo pueden escribirte por el chat de la app. Si quieres, <a href="#perfil">agrega tu nombre y contacto</a>.</div>}
      <Conversaciones me={me} convs={convs} perfiles={perfiles} onAbrir={onChat}/>
      {!todos.length ? (
        <div className="vacio-grande"><Duo chico/><p>Cuando llegue más gente, la app buscará tu match sola. Vuelve en un rato.</p></div>
      ) : <>
        <div className="mejor" aria-label={buenos.length ? "Tu mejor match" : "Lo más cercano por ahora"}>
          <Carta p={mejor.o} me={me} analisis={mejor.r} sinCabeza/>
          <Porque me={me} x={mejor} accion={<Escribir id={mejor.o.id} convs={convs} onChat={onChat}/>}/>
        </div>
        {lista.length > 1 && <Otros n={Math.min(lista.length - 1, 12)}>
          {lista.slice(1, 13).map(x => <Carta key={x.o.id} p={x.o} me={me} analisis={x.r} pie={<Pie me={me} x={x} conRazones accion={<Escribir id={x.o.id} convs={convs} onChat={onChat} chico/>}/>}/>)}
        </Otros>}
      </>}
    </>
  );
}

/* "También encajan contigo" empieza cerrado: el botón + lo abre y el − lo cierra. */
function Otros({n, children}: {n: number; children: ReactNode}) {
  const [abierto, setAbierto] = useState(false);
  return (
    <section className="otros-caja">
      <h3 className="sub-t">
        <button type="button" className="desplegar" aria-expanded={abierto} aria-controls="otros-lista" onClick={() => setAbierto(a => !a)}>
          <span>También encajan contigo <span className="desplegar-n">{n}</span></span>
          <span className="desplegar-signo" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M5 12h14" /><path className="vertical" d="M12 5v14" /></svg>
          </span>
          <span className="sr">{abierto ? "Ocultar" : "Mostrar"}</span>
        </button>
      </h3>
      <div className="otros" id="otros-lista" hidden={!abierto}>{children}</div>
    </section>
  );
}

/* Botón para abrir el chat con un match. Si ya hablaron, dice "Seguir hablando". */
function Escribir({id, convs, onChat, chico}: {id: string; convs: Conv[]; onChat: (id: string) => void; chico?: boolean}) {
  const c = convs.find(x => x.id === id);
  return (
    <button type="button" className={"boton fuerte chat-abrir" + (chico ? " chico" : "")} onClick={() => onChat(id)}>
      {c ? "Seguir hablando" : "Escribirle por el chat"}
      {c && c.sinLeer > 0 && <span className="conv-n">{c.sinLeer}</span>}
    </button>
  );
}
