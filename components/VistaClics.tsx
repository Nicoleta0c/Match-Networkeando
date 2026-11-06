"use client";
import { useState, type ReactNode } from "react";
import { UMBRAL, esAnon, nombre, type Item, type Pareja, type Perfil } from "@/lib/match";
import { Aviso, Carta, Duo, Pie, Porque } from "./ui";
import { Buscando, type Busqueda } from "./Buscando";

type Props = {
  activo: boolean; aviso: ReactNode;
  busqueda: Busqueda | null; pasoFinal: string | null; ganador: string | null; ganadorPct: number | null;
  loaded: boolean; me: Perfil | null; todos: Item[];
  conIA: boolean; iaFallo: boolean;
  /** Si la IA no encontró ninguna conexión: qué tipo de persona te conviene buscar. */
  consejo: string;
  onBuscar: () => void;
  /** Fase de registro: la presentadora todavía no empezó los matches. */
  esperando: boolean;
  /** Cuánta gente hay en el evento. */
  personas: number;
  /** Ya empezaron los matches y todavía no vio el suyo: se muestra el botón «Ver mi match». */
  revelar: boolean; onRevelar: () => void;
  /** Solo la presentadora, cuando empezaron los matches: busca las 5 mejores parejas para mostrar. */
  admin: {pareja: Pareja | null; i: number; n: number; buscado: boolean; busqueda: Busqueda | null; ganador: string | null; onBuscar: () => void} | null;
};

export function VistaClics({activo, aviso, busqueda, pasoFinal, ganador, ganadorPct, admin, ...resto}: Props) {
  if (admin) return (
    <section className="cont vista" data-view-panel="clics" aria-labelledby="t-clics" hidden={!activo}>
      <h2 className="titulo" id="t-clics">{admin.busqueda ? "La app busca un match" : "Matches"}</h2>
      <Admin a={admin}/>
    </section>
  );
  return (
    <section className="cont vista" data-view-panel="clics" aria-labelledby="t-clics" hidden={!activo}>
      <h2 className="titulo" id="t-clics">{busqueda ? "La app busca tu match por ti" : resto.revelar ? "Llegó el momento" : resto.esperando && resto.me ? "¡Ya estás en el Mapa de Sueños!" : "Mis matches"}</h2>
      <Aviso>{aviso}</Aviso>
      {busqueda && resto.me
        ? <Buscando key={busqueda.id} b={busqueda} me={resto.me} pasoFinal={pasoFinal} ganador={ganador} pct={ganadorPct}/>
        : resto.revelar && resto.loaded
          ? <div className="vacio-grande revelar">
              <Duo chico/>
              <p><b>¡Empezaron los matches!</b> Cuando quieras, toca el botón para ver con quién encajas.</p>
              <button className="boton fuerte revelar-boton" type="button" onClick={resto.onRevelar}>Ver mi match</button>
            </div>
          : <Cuerpo {...resto}/>}
    </section>
  );
}

function Cuerpo({loaded, me, todos, conIA, consejo, iaFallo, onBuscar, esperando, personas}:Omit<Props, "activo" | "aviso" | "busqueda" | "pasoFinal" | "ganador" | "ganadorPct" | "admin">) {
  if (!loaded) return null;
  if (!me) return (
    <div className="vacio-grande">
      <Duo chico/>
      <p>Crea tu perfil y la app buscará con quién encajas mejor.</p>
      <div className="acciones"><a className="boton fuerte" href="#perfil">Crear mi perfil</a></div>
    </div>
  );
  // Fase de registro: tu perfil ya está guardado y esperas a que la presentadora empiece los matches.
  if (esperando) return (
    <div className="vacio-grande esperando">
      <Duo chico/>
      <p><b>Tu sueño y tu superpoder ya están en el mapa.</b> Cuando la presentadora empiece los matches, aquí aparecerá con quién encajas. No cierres esta página.</p>
      <p className="esperando-cifra" aria-live="polite"><b>{personas}</b> {personas === 1 ? "persona en el mapa" : "personas en el mapa"}</p>
      <div className="acciones"><a className="boton" href="#perfil">Revisar mi perfil</a></div>
    </div>
  );
  const buenos = todos.filter(x => x.r.pct >= UMBRAL);
  const lista = buenos.length ? buenos : todos.slice(0, 3);
  const mejor = lista[0];
  return (
    <>
      <div className="m-cabeza">
        {!todos.length && <p className="intro">Todavía no hay más gente en el salón.</p>}
        {todos.length > 0 && <button className="boton chico" type="button" id="b-buscar" onClick={onBuscar}>Buscar de nuevo</button>}
      </div>
      {!conIA && todos.length > 0 && iaFallo && <p className="nota">La IA no respondió, así que la app eligió con su método básico. Toca Buscar de nuevo para intentarlo.</p>}
      {conIA && consejo && !buenos.length && <div className="aviso"><strong>Todavía no hay una conexión clara para ti.</strong> {consejo}</div>}
      {me.anon && buenos.length > 0 && <div className="aviso"><strong>Tu perfil es anónimo.</strong> Tus matches no ven tu contacto. Si quieres que te escriban, <a href="#perfil">agrega tu nombre y contacto</a>.</div>}
      {!todos.length ? (
        <div className="vacio-grande"><Duo chico/><p>Cuando llegue más gente, la app buscará tu match sola. Vuelve en un rato.</p></div>
      ) : <>
        <div className="mejor" aria-label={buenos.length ? "Tu mejor match" : "Lo más cercano por ahora"}>
          <Carta p={mejor.o} me={me} analisis={mejor.r} sinCabeza/>
          <Porque me={me} x={mejor}/>
        </div>
        {lista.length > 1 && <Otros n={Math.min(lista.length - 1, 12)}>
          {lista.slice(1, 13).map(x => <Carta key={x.o.id} p={x.o} me={me} analisis={x.r} pie={<Pie me={me} x={x} conRazones/>}/>)}
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

/* La presentadora: busca un match a la vez, con la misma animación y la misma tarjeta que ve cada persona. */
function Admin({a}: {a: NonNullable<Props["admin"]>}) {
  const p = a.pareja;
  if (a.busqueda && p) return <Buscando key={a.busqueda.id} b={a.busqueda} me={p.suena} pasoFinal={null} ganador={a.ganador} pct={p.pct}
    etiqueta={esAnon(p.suena) ? "Sueño anónimo" : "Sueño de " + nombre(p.suena)} listo="¡Listo! Encontramos un match."/>;
  if (!p) return (
    <div className="vacio-grande">
      <Duo chico/>
      <p>{a.buscado ? "Todavía no hay matches. Prueba de nuevo cuando llegue más gente." : "Toca el botón y la app busca un match."}</p>
      <button className="boton fuerte" type="button" onClick={a.onBuscar}>Buscar match</button>
    </div>
  );
  const ultimo = a.i >= a.n - 1;
  return (
    <>
      <div className="m-cabeza">
        <button className="boton chico" type="button" onClick={a.onBuscar}>{ultimo ? "Buscar de nuevo" : "Seguir buscando"}</button>
      </div>
      <div className="mejor" aria-label="Match">
        <Carta p={p.ayuda} me={p.suena} analisis={p.r} sinCabeza tercera/>
        <Porque me={p.suena} x={{o: p.ayuda, r: p.r}}/>
      </div>
    </>
  );
}
