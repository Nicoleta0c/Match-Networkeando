"use client";
/* La app completa. Funciona igual que el <script> del index.html original:
   un objeto S guarda el estado y forzar() vuelve a dibujar la pantalla. */
import { useEffect, useLayoutEffect, useMemo, useReducer, useRef, type ReactNode } from "react";
import { UMBRAL, aplicarIA, analizar, claveIA, limpiar, ordenarMatches, type Perfil, type ResIA } from "@/lib/match";
import type { Fase } from "@/lib/fase";
import { DEMO, DEMO_MATCHES, DEMO_YO } from "@/lib/demo";
import { Iconos } from "./ui";
import { Barra } from "./Barra";
import { VistaInicio } from "./VistaInicio";
import { VistaPerfil, type DatosForm } from "./VistaPerfil";
import { VistaClics } from "./VistaClics";
import { VistaProyectar } from "./VistaProyectar";
import { VistaPanel } from "./VistaPanel";
import { VistaMapa } from "./VistaMapa";
import type { Busqueda } from "./Buscando";

/* Enlace público de esta página: el QR apunta aquí + #perfil.
   Por defecto es la dirección donde está corriendo la app. Al publicarla en internet
   puedes fijarla con la variable NEXT_PUBLIC_SHARE_URL. */
const SHARE_URL_FIJA = (process.env.NEXT_PUBLIC_SHARE_URL || "").replace(/\/$/, "");
const ES_LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])$/;

/* Cada cuánto se piden los perfiles nuevos (reemplaza al onSnapshot del original). */
const CADA_MS = 5000;

class ErrorAPI extends Error {
  constructor(public status: number) { super("HTTP " + status); }
}

const VISTAS = ["inicio", "perfil", "clics", "proyectar", "mapa", "panel"] as const;
export type Vista = typeof VISTAS[number];
function vistaActual(): Vista {
  const h = location.hash.slice(1);
  if (h === "descubrir") return "clics";
  return (VISTAS as readonly string[]).includes(h) ? h as Vista : "inicio";
}

type Estado = {
  vista: Vista;
  demo: boolean; uid: string | null; realUid: string | null;
  avail: "pending" | "ok" | "error"; slow: boolean; loaded: boolean;
  perfiles: Map<string, Perfil>; real: Map<string, Perfil> | null; realLoaded: boolean;
  guardando: boolean; relleno: number; buscarAlLlegar: boolean;
  notificados: Set<string> | null; realNotif: Set<string> | null;
  busqueda: Busqueda | null; pasoFinal: string | null; ganador: string | null; ganadorPct: number | null; nBusquedas: number;
  iaDisponible: boolean; iaRes: ResIA | null; iaFallo: boolean;
  /** Fase del evento: en "registro" la gente espera; en "matches" ve su match (la presentadora la cambia). */
  fase: Fase; cambiandoFase: boolean;
  /** Cuánta gente hay en el evento (en registro, cada celular solo recibe su propio perfil). */
  total: number; presentadora: boolean;
  /** Ya tocó «Ver mi match» después de que empezaron los matches. */
  yaVio: boolean;
  toast: {texto: string; ver: boolean};
  shareUrl: string;
};
const estadoInicial = (): Estado => ({
  vista: "inicio",
  demo: false, uid: null, realUid: null,
  avail: "pending", slow: false, loaded: false,
  perfiles: new Map(), real: null, realLoaded: false,
  guardando: false, relleno: 0, buscarAlLlegar: false,
  notificados: null, realNotif: null,
  busqueda: null, pasoFinal: null, ganador: null, ganadorPct: null, nBusquedas: 0,
  iaDisponible: false, iaRes: null, iaFallo: false,
  fase: "registro", cambiandoFase: false, total: 0, presentadora: false, yaVio: false,
  toast: {texto: "", ver: false},
  shareUrl: SHARE_URL_FIJA || location.origin + location.pathname.replace(/\/$/, "")
});

export default function App() {
  const ref = useRef<Estado | null>(null);
  if (!ref.current) ref.current = estadoInicial();
  const S = ref.current;
  const [, forzar] = useReducer((n: number) => n + 1, 0);
  const formTocado = useRef(false);
  const timers = useRef({busqueda: [] as ReturnType<typeof setTimeout>[], toast: undefined as ReturnType<typeof setTimeout> | undefined});

  const yo = () => S.uid ? S.perfiles.get(S.uid) ?? null : null;
  /** ¿Ya se pueden ver los matches? En la demo, siempre. */
  const hayMatches = () => S.demo || S.fase === "matches";
  const misMatches = (me: Perfil) => aplicarIA(me, ordenarMatches(me, [...S.perfiles.values()]), S.iaRes);

  /* ---------- toast ---------- */
  function toast(t: string) {
    S.toast = {texto: t, ver: true}; forzar();
    clearTimeout(timers.current.toast);
    timers.current.toast = setTimeout(() => { S.toast = {...S.toast, ver: false}; forzar(); }, 2600);
  }

  /* ---------- matches ya avisados (localStorage) ---------- */
  function cargarNotificados() {
    if (S.notificados) return S.notificados;
    let arr: unknown = [];
    try { arr = JSON.parse(localStorage.getItem("clic-notificados") || "[]"); } catch {}
    S.notificados = new Set(Array.isArray(arr) ? arr : []);
    return S.notificados;
  }
  function marcarNotificado(id: string) {
    const vistos = cargarNotificados();
    if (vistos.has(id)) return;
    vistos.add(id);
    if (S.demo) return;
    try { localStorage.setItem("clic-notificados", JSON.stringify([...vistos].slice(-500))); } catch {}
  }

  /* ---------- rutas ---------- */
  function irA(v: Vista) { if (location.hash !== "#" + v) location.hash = v; else route(); }
  function route() {
    const v = vistaActual();
    S.vista = v;
    document.body.dataset.view = v;
    if (v === "perfil") { formTocado.current = false; S.relleno++; }
    if (v !== "clics") cancelarBusqueda();
    forzar();
    if (v === "clics" && S.buscarAlLlegar && yo() && hayMatches()) { S.buscarAlLlegar = false; buscarMatch(); }
  }

  /* ---------- guardar y borrar (real o demo) ---------- */
  async function escribirPerfil(body: Record<string, unknown>) {
    if (!S.uid) throw new Error("sin sesión");
    if (S.demo) { S.perfiles = new Map(S.perfiles).set(S.uid, limpiar(S.uid, body)); return; }
    const r = await fetch("/api/perfiles/" + encodeURIComponent(S.uid), {
      method: "PUT", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body)
    });
    if (!r.ok) throw new ErrorAPI(r.status);
    const p = limpiar(S.uid, await r.json());
    S.real = new Map(S.real ?? []).set(p.id, p);
    S.perfiles = S.real;
  }
  async function quitarPerfil() {
    if (!S.uid) throw new Error("sin sesión");
    if (S.demo) { const m = new Map(S.perfiles); m.delete(S.uid); S.perfiles = m; return; }
    const r = await fetch("/api/perfiles/" + encodeURIComponent(S.uid), {method: "DELETE"});
    if (!r.ok) throw new ErrorAPI(r.status);
    const m = new Map(S.real ?? []); m.delete(S.uid);
    S.real = m; S.perfiles = m;
  }
  function manejarError(err: unknown) {
    if (err instanceof ErrorAPI && err.status === 403) toast("Tu acceso no permite guardar");
    else toast("No se pudo guardar. Revisa tu conexión e inténtalo otra vez.");
  }
  async function guardar(d: DatosForm) {
    if (!puede()) return false;
    const prev = yo();
    const body = {
      idea: d.idea, needs: d.idea ? (prev?.tagsNeeds ?? []).slice(0, 3) : [], power: d.power,
      anon: d.anon, alias: d.anon ? "" : d.alias, que: d.anon ? "" : d.que, contact: d.anon ? "" : d.contact,
      createdAt: prev && prev.createdAt ? prev.createdAt : Date.now()
    };
    S.guardando = true; forzar();
    try {
      await escribirPerfil(body);
      toast(prev ? "Cambios guardados" : "Perfil listo");
      formTocado.current = false;
      // En registro todavía no se busca: el match aparece cuando la presentadora lo empieza.
      S.buscarAlLlegar = hayMatches();
      irA("clics");
      return true;
    } catch (err) {
      manejarError(err);
      return false;
    } finally { S.guardando = false; forzar(); }
  }
  async function borrar() {
    try {
      await quitarPerfil();
      toast("Perfil borrado");
      S.relleno++; forzar();
      return true;
    } catch (err) {
      manejarError(err);
      return false;
    }
  }

  /* ---------- la presentadora empieza los matches ---------- */
  async function cambiarFase(fase: Fase) {
    if (S.demo || S.cambiandoFase) return;
    S.cambiandoFase = true; forzar();
    const pedir = (clave?: string) => fetch("/api/fase", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({fase, clave})});
    try {
      let clave: string | undefined;
      try { clave = sessionStorage.getItem("clave-presentadora") || undefined; } catch {}
      let r = await pedir(clave);
      let d: {error?: string; pideClave?: boolean} = r.ok ? {} : await r.json().catch(() => ({}));
      // Si el evento tiene clave, se pide una vez y se recuerda mientras la pestaña esté abierta.
      if (r.status === 403 && d.pideClave) {
        const nueva = prompt("Clave de la presentadora");
        if (nueva) {
          r = await pedir(nueva);
          d = r.ok ? {} : await r.json().catch(() => ({}));
          if (r.ok) try { sessionStorage.setItem("clave-presentadora", nueva); } catch {}
        }
      }
      if (!r.ok) { toast(d.error || "No se pudo cambiar."); return; }
      S.fase = fase;
      toast(fase === "matches" ? "¡Empezaron los matches!" : "Volvimos a la fase de registro");
    } catch {
      toast("No se pudo cambiar. Revisa la conexión.");
    } finally { S.cambiandoFase = false; forzar(); }
  }

  /* ---------- demo ---------- */
  function entrarDemo() {
    if (S.demo) return;
    S.demo = true; S.realUid = S.uid; S.realNotif = S.notificados;
    S.uid = "demo-yo"; S.notificados = new Set();
    const m = new Map<string, Perfil>();
    const real = S.realUid && S.real ? S.real.get(S.realUid) : null;
    const base = real ? {idea: real.idea, needs: real.tagsNeeds, power: real.power, anon: real.anon, alias: real.alias, que: real.que, contact: real.contact} : DEMO_YO;
    m.set("demo-yo", limpiar("demo-yo", {...base, createdAt: Date.now()}));
    DEMO.concat(DEMO_MATCHES).forEach((d, i) => m.set(d.id, limpiar(d.id, {anon: false, ...d, createdAt: 1000 - i})));
    S.perfiles = m; S.loaded = true;
    S.buscarAlLlegar = true;
    irA("clics");
  }

  /* ---------- la app busca tu match ---------- */
  function cancelarBusqueda() {
    timers.current.busqueda.forEach(clearTimeout); timers.current.busqueda = [];
    if (S.busqueda) { S.busqueda = null; S.pasoFinal = null; S.ganador = null; S.ganadorPct = null; forzar(); }
  }
  async function pedirIA(me: Perfil, candidatos: Perfil[]): Promise<ResIA | null> {
    const cand = candidatos.slice(0, 30);
    if (!cand.length) return null;
    try {
      const resp = await fetch("/api/match", {
        method: "POST", headers: {"Content-Type": "application/json"},
        body: JSON.stringify({persona: me, candidatos: cand})
      });
      if (!resp.ok) return null;
      const data = await resp.json();
      const ids = new Set(cand.map(p => p.id));
      const mapa: ResIA["mapa"] = new Map();
      const txt = (v: unknown) => String(v || "").slice(0, 300).trim();
      type ConexionIA = {id?: unknown; pct?: unknown; tipo?: unknown; porque?: unknown};
      (data && Array.isArray(data.conexiones) ? data.conexiones : []).forEach((m: ConexionIA) => {
        if (!m || typeof m.id !== "string" || !ids.has(m.id) || mapa.has(m.id)) return;
        if (m.tipo !== "doble_via" && m.tipo !== "te_ayuda" && m.tipo !== "le_ayudas") return;
        const pct = Math.max(1, Math.min(99, Math.round(Number(m.pct) || 0)));
        // Quién ayuda a quién, y una frase general de por qué.
        const teAyuda = m.tipo !== "le_ayudas" ? "sí" : "", leAyudas = m.tipo !== "te_ayuda" ? "sí" : "";
        mapa.set(m.id, {pct, conexion: {teAyuda, leAyudas, paso: "", tipo: m.tipo === "doble_via" ? "doble" : "una", texto: txt(m.porque)}, rompe: ""});
      });
      const consejo = data && typeof data.consejo === "string" ? txt(data.consejo) : "";
      // Si la IA no encontró a nadie, igual guardamos su consejo (y nadie de la lista cuenta como match).
      if (!mapa.size && !consejo) return null;
      return {clave: claveIA(me), enviados: ids, mapa, consejo};
    } catch {
      return null;
    }
  }
  function buscarMatch() {
    const me = yo();
    cancelarBusqueda();
    if (!me || !S.loaded) { forzar(); return; }
    const otros = [...S.perfiles.values()].filter(o => o.id !== me.id);
    const pasos = ["Revisando " + otros.length + (otros.length === 1 ? " perfil…" : " perfiles…"), me.idea ? "Comparando tu sueño con sus superpoderes…" : "Buscando sueños a los que les sirve tu superpoder…","Viendo a quién le sirve lo que sabes hacer…", S.iaDisponible ? "La IA está eligiendo quién encaja mejor contigo…" : "Eligiendo quién encaja mejor contigo…"];
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // La primera búsqueda es un pequeño espectáculo; al repetirla no hacemos esperar tanto.
    const total = reduce ? 500 : (S.nBusquedas === 0 ? 2800 : 1400);
    const id = ++S.nBusquedas;
    S.yaVio = true;
    // Hasta 6 personas del salón para tirarles un hilo: las más cercanas a tu perfil, en orden mezclado.
    const muestra = ordenarMatches(me, otros).slice(0, 6).map(x => x.o).sort(() => Math.random() - .5);
    S.busqueda = {id, muestra, pasos, total, reduce}; S.pasoFinal = null; S.ganador = null;
    forzar();
    const usarIA = S.iaDisponible && otros.length > 0;
    let iaListo = !usarIA, animListo = false;
    const terminar = () => {
      if (!iaListo || !animListo || !S.busqueda || S.busqueda.id !== id) return;
      const ahora = yo();
      const lista = ahora ? misMatches(ahora) : [];
      if (!lista.length) { cancelarBusqueda(); return; }
      // El hilo final va hacia tu match; si no estaba entre los dibujados, toma el lugar del último.
      const g = lista[0];
      if (!S.busqueda.muestra.some(p => p.id === g.o.id)) {
        const m = S.busqueda.muestra.slice(); m[Math.max(0, m.length - 1)] = g.o;
        S.busqueda = {...S.busqueda, muestra: m};
      }
      S.ganador = g.o.id; S.ganadorPct = g.r.pct; forzar();
      timers.current.busqueda.push(setTimeout(() => { cancelarBusqueda(); marcarNotificado(g.o.id); }, reduce ? 0 : 1600));
    };
    if (usarIA) {
      const limite = new Promise<null>(res => timers.current.busqueda.push(setTimeout(() => res(null), 20000)));
      Promise.race([pedirIA(me, ordenarMatches(me, otros).map(x => x.o)), limite]).then(res => {
        if (res) S.iaRes = res; else S.iaFallo = true;
        iaListo = true; terminar();
      });
    }
    timers.current.busqueda.push(setTimeout(() => {
      animListo = true;
      if (!iaListo && S.busqueda?.id === id) { S.pasoFinal = "La IA está terminando de elegir…"; forzar(); }
      terminar();
    }, total + 150));
  }

  /* ---------- conexión con los datos ---------- */
  function conectar() {
    let parado = false, primera = true, fallos = 0, firma = "";
    let siguiente: ReturnType<typeof setTimeout> | undefined;
    const lento = setTimeout(() => { S.slow = true; forzar(); }, 10000);

    // ¿Hay IA en el servidor? Si no, la app usa su método básico por palabras clave.
    fetch("/api/match").then(r => r.json()).then((d: {ia?: boolean}) => {
      if (!parado) { S.iaDisponible = !!d.ia; forzar(); }
    }).catch(() => {});

    async function cargar() {
      // Con la app en segundo plano no gastamos datos ni Wi-Fi del evento.
      if (document.hidden && S.realLoaded) { siguiente = setTimeout(cargar, CADA_MS); return; }
      try {
        // "no-cache" deja que el navegador pregunte "¿cambió algo?" (ETag) y reciba un 304 vacío si no.
        const r = await fetch("/api/perfiles", {cache: "no-cache"});
        if (!r.ok) throw new ErrorAPI(r.status);
        const data: {yo: string; fase?: Fase; total?: number; presentadora?: boolean; perfiles: Record<string, unknown>[]} = await r.json();
        if (parado) return;
        clearTimeout(lento);
        S.slow = false; S.avail = "ok"; fallos = 0;
        if (S.demo) S.realUid = data.yo; else S.uid = data.yo;
        // Solo se rehace la lista si algo cambió, para no redibujar cada 5 segundos.
        const nueva = JSON.stringify(data.perfiles);
        if (nueva !== firma || !S.realLoaded) {
          firma = nueva;
          const m = new Map<string, Perfil>();
          data.perfiles.forEach(d => { const p = limpiar(String(d.id), d); if (p.power) m.set(p.id, p); });
          S.real = m; S.realLoaded = true;
          if (!S.demo) { S.perfiles = m; S.loaded = true; }
        }
        // La presentadora empezó los matches: en todos los celulares aparece el botón «Ver mi match».
        const fase: Fase = data.fase === "matches" ? "matches" : "registro";
        const empezo = !primera && S.fase === "registro" && fase === "matches";
        if (fase === "registro") S.yaVio = false;
        S.fase = fase;
        S.total = Number(data.total) || 0;
        S.presentadora = data.presentadora === true;
        if (primera) { primera = false; cargarNotificados(); }
        forzar();
        if (empezo && !S.demo && yo() && S.vista !== "proyectar" && S.vista !== "panel" && S.vista !== "mapa") {
          toast("¡Empezaron los matches!");
          irA("clics");
        }
        if (!S.demo && S.vista === "clics" && S.buscarAlLlegar && yo() && hayMatches()) { S.buscarAlLlegar = false; buscarMatch(); }
      } catch {
        if (parado) return;
        // Un fallo suelto no importa; si se repite, avisamos que se perdió la conexión.
        if (++fallos >= 2 || !S.realLoaded) { S.avail = "error"; S.loaded = true; forzar(); }
      } finally {
        if (!parado) siguiente = setTimeout(cargar, CADA_MS);
      }
    }
    cargar();
    return () => { parado = true; clearTimeout(siguiente); clearTimeout(lento); };
  }

  // Cada vista empieza arriba. Va después de pintar la vista nueva; si no, el navegador
  // mantiene la altura de la vista anterior y la deja a medio camino.
  useLayoutEffect(() => { window.scrollTo(0, 0); }, [S.vista]);

  /* ---------- arranque ---------- */
  useEffect(() => {
    history.scrollRestoration = "manual";
    const alCambiarHash = () => { if (location.hash === "#demo") { entrarDemo(); return; } route(); };
    window.addEventListener("hashchange", alCambiarHash);
    if (location.hash === "#demo") { location.hash = ""; route(); entrarDemo(); } else route();
    const desconectar = conectar();
    // Abierta como "localhost", el QR no les sirve a los celulares: usamos la IP de la laptop en el Wi-Fi.
    if (!SHARE_URL_FIJA && ES_LOCAL.test(location.hostname)) {
      fetch("/api/direccion").then(r => r.json()).then((d: {url?: string | null}) => {
        if (d.url) { S.shareUrl = d.url; forzar(); }
      }).catch(() => {});
    }
    return () => {
      window.removeEventListener("hashchange", alCambiarHash);
      desconectar();
      cancelarBusqueda();
      clearTimeout(timers.current.toast);
    };
    // Solo al montar: las funciones leen S en el momento en que se llaman.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- lo que se dibuja ---------- */
  const me = yo();
  const todos = me ? misMatches(me) : [];
  const conIA = !!(me && S.iaRes && S.iaRes.clave === claveIA(me));
  function puede() { return S.demo || (S.avail === "ok" && !!S.uid); }

  let burbuja = 0;
  if (me && S.vista !== "clics" && hayMatches()) {
    const vistos = cargarNotificados();
    burbuja += todos.filter(x => x.r.pct >= UMBRAL && !vistos.has(x.o.id)).length;
  }

  // En Mis matches, los matches que ya viste dejan de contar en la burbuja.
  useEffect(() => {
    if (S.vista === "clics" && !S.busqueda && S.loaded && me && hayMatches()) todos.filter(x => x.r.pct >= UMBRAL).forEach(x => marcarNotificado(x.o.id));
  });

  const enProyectar = S.vista === "proyectar";
  const perfilesMap = S.perfiles;
  const pares = useMemo(() => {
    if (!enProyectar) return 0;
    const muestra = [...perfilesMap.values()].slice(0, 300);
    let n = 0;
    for (let i = 0; i < muestra.length; i++) for (let j = i + 1; j < muestra.length; j++) {
      if (Math.max(analizar(muestra[i], muestra[j]).pct, analizar(muestra[j], muestra[i]).pct) >= UMBRAL) n++;
    }
    return n;
  }, [perfilesMap, enProyectar]);

  let aviso: ReactNode = null;
  if (!S.demo) {
    if (S.avail === "pending") aviso = "Conectando…";
    else if (S.avail === "error") aviso = <><strong>Se perdió la conexión.</strong> Recarga la página para volver a intentarlo.</>;
    else if (S.slow) aviso = "Está tardando en responder. Lo que ves puede no estar al día.";
    else if (!S.uid) aviso = <><strong>No pudimos identificar tu sesión.</strong> Recarga la página para volver a intentarlo.</>;
  }

  const qrUrl = S.shareUrl ? S.shareUrl + "/#perfil" : "";

  return (
    <>
      <Iconos/>
      <Barra vista={S.vista} burbuja={burbuja} verMatches={S.demo || S.fase === "matches"} presentadora={S.presentadora}/>
      <main>
        <VistaInicio activo={S.vista === "inicio"} qrUrl={qrUrl}/>
        <VistaPerfil activo={S.vista === "perfil"} aviso={aviso} me={me} puede={puede()} guardando={S.guardando} relleno={S.relleno} tocadoRef={formTocado} onGuardar={guardar} onBorrar={borrar}/>
        <VistaClics activo={S.vista === "clics"} aviso={aviso} busqueda={S.busqueda} pasoFinal={S.pasoFinal} ganador={S.ganador} ganadorPct={S.ganadorPct} loaded={S.loaded} me={me} todos={todos} conIA={conIA} consejo={conIA && S.iaRes ? S.iaRes.consejo : ""} iaFallo={S.iaFallo} onBuscar={buscarMatch}
          esperando={!hayMatches()} personas={S.demo ? S.perfiles.size : S.total}
          revelar={!S.demo && S.fase === "matches" && !S.yaVio && !!me} onRevelar={buscarMatch}/>
        <VistaProyectar activo={enProyectar} qrUrl={qrUrl} perfiles={S.demo ? S.perfiles.size : S.total} pares={pares}
          fase={S.demo ? null : S.fase} cambiando={S.cambiandoFase} onFase={cambiarFase}/>
        <VistaPanel activo={S.vista === "panel"} cambiando={S.cambiandoFase} onFase={cambiarFase}/>
        <VistaMapa activo={S.vista === "mapa"} demo={S.demo ? S.perfiles : null}/>
      </main>
      <div className={"toast" + (S.toast.ver ? " ver" : "")} id="toast" role="status" aria-live="polite">{S.toast.texto}</div>
    </>
  );
}
