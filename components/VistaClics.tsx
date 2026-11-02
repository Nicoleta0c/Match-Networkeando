"use client";
import type { ReactNode } from "react";
import { UMBRAL, type Item, type Perfil } from "@/lib/match";
import { Aviso, Carta, Duo, Pie, Porque } from "./ui";
import { Buscando, type Busqueda } from "./Buscando";

type Props = {
  activo: boolean; aviso: ReactNode;
  busqueda: Busqueda | null; pasoFinal: string | null;
  loaded: boolean; me: Perfil | null; todos: Item[];
  conIA: boolean; iaFallo: boolean;
  onBuscar: () => void;
};

export function VistaClics({activo, aviso, busqueda, pasoFinal, ...resto}: Props) {
  return (
    <section data-view-panel="clics" aria-labelledby="t-clics" hidden={!activo}>
      <h2 className="titulo" id="t-clics">Mis matches</h2>
      <Aviso>{aviso}</Aviso>
      <div className="buscando" id="buscando" hidden={!busqueda}>
        {busqueda && <Buscando key={busqueda.id} b={busqueda} pasoFinal={pasoFinal}/>}
      </div>
      <div id="clics-cuerpo" hidden={!!busqueda}>
        <Cuerpo {...resto}/>
      </div>
    </section>
  );
}

function Cuerpo({loaded, me, todos, conIA, iaFallo, onBuscar}: Omit<Props, "activo" | "aviso" | "busqueda" | "pasoFinal">) {
  if (!loaded) return null;
  if (!me) return (
    <div className="vacio-grande">
      <Duo chico/>
      <p>Crea tu perfil y la app buscará con quién encajas mejor.</p>
      <a className="boton fuerte" href="#perfil">Crear mi perfil</a> <a className="boton" href="#demo">Probar la demo</a>
    </div>
  );
  const buenos = todos.filter(x => x.r.pct >= UMBRAL);
  const lista = buenos.length ? buenos : todos.slice(0, 3);
  const mejor = lista[0];
  return (
    <>
      <div className="m-cabeza">
        <p className="intro">{todos.length ? (conIA ? "La IA revisó " : "La app revisó ") + todos.length + (todos.length === 1 ? " perfil" : " perfiles") + " y eligió quién encaja mejor contigo." : "Todavía no hay más gente en la mesa."}</p>
        {todos.length > 0 && <button className="boton chico" type="button" id="b-buscar" onClick={onBuscar}>Buscar de nuevo</button>}
      </div>
      {!conIA && todos.length > 0 && iaFallo && <p className="nota">La IA no respondió, así que la app eligió con su método básico. Toca Buscar de nuevo para intentarlo.</p>}
      {me.anon && buenos.length > 0 && <div className="aviso"><strong>Tu perfil es anónimo.</strong> Tus matches no pueden escribirte. <a href="#perfil">Agrega tu nombre y contacto</a>.</div>}
      {!todos.length ? (
        <div className="vacio-grande"><Duo chico/><p>Cuando llegue más gente, la app buscará tu match sola. Vuelve en un rato.</p></div>
      ) : <>
        <div className="mejor">
          <p className="kicker">{buenos.length ? "Tu mejor match" : "Lo más cercano por ahora"}</p>
          <div className="mejor-in">
            <Carta p={mejor.o} me={me} analisis={mejor.r} cls="clic-item" par pie={<Pie me={me} x={mejor}/>}/>
            <Porque x={mejor}/>
          </div>
        </div>
        {lista.length > 1 && <>
          <h3 className="sub-t">También encajan contigo</h3>
          <div className="clics">
            {lista.slice(1, 13).map(x => <Carta key={x.o.id} p={x.o} me={me} analisis={x.r} cls="clic-item" par pie={<Pie me={me} x={x} conRazones/>}/>)}
          </div>
        </>}
      </>}
    </>
  );
}
