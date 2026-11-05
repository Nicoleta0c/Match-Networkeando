"use client";
/* La app completa. Funciona igual que el <script> del index.html original:
   un objeto S guarda el estado y forzar() vuelve a dibujar la pantalla. */
import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, type ReactNode } from "react";
import { UMBRAL, aplicarIA, analizar, claveIA, esAnon, limpiar, nombre, ordenarMatches, type Perfil, type ResIA } from "@/lib/match";
import type { Mensaje } from "@/lib/chat";
import { respuestaDemo } from "@/lib/respuestasDemo";
import { DEMO, DEMO_MATCHES, DEMO_YO } from "@/lib/demo";
import { Iconos } from "./ui";
import { Barra } from "./Barra";
import { VistaInicio } from "./VistaInicio";
import { VistaPerfil, type DatosForm } from "./VistaPerfil";
import { VistaClics } from "./VistaClics";
import { VistaProyectar } from "./VistaProyectar";
import { Paletas } from "./Paletas";
import type { Busqueda } from "./Buscando";
import { BotonChat, Chat, ListaChats } from "./Chat";

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

const VISTAS = ["inicio", "perfil", "clics", "proyectar"] as const;
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
  toast: {texto: string; ver: boolean};
  shareUrl: string;
  chat: Charla; chatDemo: Charla; chatCon: string | null; chatLista: boolean; leido: Record<string, number> | null; escribiendo: string | null;
};
type Charla = {mensajes: Mensaje[]; bloqueados: Set<string>};
const charlaVacia = (): Charla => ({mensajes: [], bloqueados: new Set()});
export type Conv = {id: string; ultimo: Mensaje; sinLeer: number};
const estadoInicial = (): Estado => ({
  vista: "inicio",
  demo: false, uid: null, realUid: null,
  avail: "pending", slow: false, loaded: false,
  perfiles: new Map(), real: null, realLoaded: false,
  guardando: false, relleno: 0, buscarAlLlegar: false,
  notificados: null, realNotif: null,
  busqueda: null, pasoFinal: null, ganador: null, ganadorPct: null, nBusquedas: 0,
  iaDisponible: false, iaRes: null, iaFallo: false,
  toast: {texto: "", ver: false},
  shareUrl: SHARE_URL_FIJA || location.origin + location.pathname.replace(/\/$/, ""),
  chat: charlaVacia(), chatDemo: charlaVacia(), chatCon: null, chatLista: false, leido: null, escribiendo: null
});

export default function App() {
  const ref = useRef<Estado | null>(null);
  if (!ref.current) ref.current = estadoInicial();
  const S = ref.current;
  const [, forzar] = useReducer((n: number) => n + 1, 0);
  const formTocado = useRef(false);
  const timers = useRef({busqueda: [] as ReturnType<typeof setTimeout>[], toast: undefined as ReturnType<typeof setTimeout> | undefined});

  const yo = () => S.uid ? S.perfiles.get(S.uid) ?? null : null;
  // Las personas que bloqueaste ya no aparecen entre tus matches.
  const misMatches = (me: Perfil) => aplicarIA(me, ordenarMatches(me, [...S.perfiles.values()].filter(p => !charla().bloqueados.has(p.id))), S.iaRes);

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

  /* ---------- chat temporal con los matches ---------- */
  const charla = () => S.demo ? S.chatDemo : S.chat;
  function cargarLeido() {
    if (S.leido) return S.leido;
    let o: unknown = {};
    try { o = JSON.parse(localStorage.getItem("chat-leido") || "{}"); } catch {}
    S.leido = o && typeof o === "object" && !Array.isArray(o) ? o as Record<string, number> : {};
    return S.leido;
  }
  /** Marca como leído lo que te escribió esta persona. */
  function marcarLeido(id: string) {
    const l = cargarLeido();
    const ult = charla().mensajes.filter(m => m.de === id).at(-1);
    if (!ult || (l[id] ?? 0) >= ult.creado) return;
    l[id] = ult.creado;
    if (!S.demo) try { localStorage.setItem("chat-leido", JSON.stringify(l)); } catch {}
  }
  /** Una conversación por persona, la más reciente primero. */
  function conversaciones(): Conv[] {
    const yoId = S.uid, l = cargarLeido(), c = charla(), m = new Map<string, Conv>();
    for (const x of c.mensajes) {
      const otro = x.de === yoId ? x.para : x.de;
      if (c.bloqueados.has(otro)) continue;
      const v = m.get(otro) ?? {id: otro, ultimo: x, sinLeer: 0};
      v.ultimo = x;
      if (x.de === otro && x.creado > (l[otro] ?? 0)) v.sinLeer++;
      m.set(otro, v);
    }
    return [...m.values()].sort((a, b) => b.ultimo.creado - a.ultimo.creado);
  }
  /* En la demo, la persona de ejemplo contesta cada mensaje: con la IA si hay clave; si no, con respuestas de la app. */
  async function contestarDemo(para: string) {
    const inicio = Date.now();
    const historial = S.chatDemo.mensajes.filter(m => m.de === para || m.para === para).map(m => ({mio: m.de !== para, texto: m.texto}));
    let texto: string | null = null;
    if (S.iaDisponible) try {
      const me = yo();
      const r = await fetch("/api/chat/demo", {method: "POST", headers: {"Content-Type": "application/json"},
        body: JSON.stringify({otro: para, yo: me && {idea: me.idea, power: me.power, anon: esAnon(me)}, historial})});
      if (r.ok) texto = ((await r.json()) as {texto?: string}).texto || null;
    } catch {}
    if (!texto) {
      const otro = S.perfiles.get(para);
      const yaContesto = historial.filter(m => !m.mio).length;
      const ultimo = historial[historial.length - 1]?.texto || "";
      if (otro) texto = respuestaDemo(otro, ultimo, yaContesto);
    }
    // Una pausa corta para que se sienta como alguien escribiendo.
    await new Promise(res => setTimeout(res, Math.max(0, 1200 - (Date.now() - inicio))));
    if (!S.demo || !S.uid) return;
    if (S.escribiendo === para) S.escribiendo = null;
    if (texto) {
      const t = Date.now();
      S.chatDemo = {...S.chatDemo, mensajes: [...S.chatDemo.mensajes, {id: -t, de: para, para: S.uid, texto, creado: t}]};
      if (S.chatCon === para) marcarLeido(para);
    }
    forzar();
  }
  function abrirChat(id: string) { S.chatCon = id; S.chatLista = false; marcarLeido(id); forzar(); }
  const cerrarChat = useCallback(() => { S.chatCon = null; S.chatLista = false; forzar(); }, [S]);
  const volverALista = useCallback(() => { S.chatCon = null; S.chatLista = true; forzar(); }, [S]);
  async function enviarMensaje(texto: string) {
    const para = S.chatCon;
    if (!para || !S.uid) return false;
    if (S.demo) {
      const ahora = Date.now();
      S.chatDemo = {...S.chatDemo, mensajes: [...S.chatDemo.mensajes, {id: -ahora, de: S.uid, para, texto, creado: ahora}]};
      S.escribiendo = para;
      forzar();
      contestarDemo(para);
      return true;
    }
    try {
      const r = await fetch("/api/chat", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({para, texto})});
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { toast(d.error || "No se pudo enviar."); return false; }
      S.chat = {...S.chat, mensajes: [...S.chat.mensajes, d as Mensaje]};
      forzar();
      return true;
    } catch {
      toast("No se pudo enviar. Revisa tu conexión.");
      return false;
    }
  }
  async function bloquearChat() {
    const id = S.chatCon; if (!id) return;
    const p = S.perfiles.get(id);
    if (!confirm(`¿Bloquear a ${p ? nombre(p) : "esta persona"}? Ya no podrá escribirte y se borra esta conversación.`)) return;
    if (!S.demo) {
      try {
        const r = await fetch("/api/chat/bloquear", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({id})});
        if (!r.ok) throw new Error();
      } catch { toast("No se pudo bloquear. Inténtalo otra vez."); return; }
    }
    const c = charla();
    const nueva = {mensajes: c.mensajes.filter(m => m.de !== id && m.para !== id), bloqueados: new Set(c.bloqueados).add(id)};
    if (S.demo) S.chatDemo = nueva; else S.chat = nueva;
    S.chatCon = null; forzar();
    toast("Persona bloqueada");
  }

  /* ---------- rutas ---------- */
  function irA(v: Vista) { if (location.hash !== "#" + v) location.hash = v; else route(); }
  function route() {
    const v = vistaActual();
    S.vista = v;
    document.body.dataset.view = v;
    if (v === "perfil") { formTocado.current = false; S.relleno++; }
    if (v !== "clics") cancelarBusqueda();
    S.chatCon = null; S.chatLista = false;
    forzar();
    if (v === "clics" && S.buscarAlLlegar && yo()) { S.buscarAlLlegar = false; buscarMatch(); }
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
      S.buscarAlLlegar = true;
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

  /* ---------- demo ---------- */
  function entrarDemo() {
    if (S.demo) return;
    S.demo = true; S.realUid = S.uid; S.realNotif = S.notificados;
    S.uid = "demo-yo"; S.notificados = new Set(); S.chatDemo = charlaVacia(); S.chatCon = null;
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
      type ConexionIA = {id?: unknown; pct?: unknown; tipo?: unknown; te_ayuda?: unknown; le_ayudas?: unknown; primer_paso?: unknown; rompehielo?: unknown};
      (data && Array.isArray(data.conexiones) ? data.conexiones : []).forEach((m: ConexionIA) => {
        if (!m || typeof m.id !== "string" || !ids.has(m.id) || mapa.has(m.id)) return;
        const teAyuda = txt(m.te_ayuda), leAyudas = txt(m.le_ayudas);
        if (!teAyuda && !leAyudas) return;
        const pct = Math.max(1, Math.min(99, Math.round(Number(m.pct) || 0)));
        const tipo = m.tipo === "doble_via" && teAyuda && leAyudas ? "doble" : "una";
        mapa.set(m.id, {pct, conexion: {teAyuda, leAyudas, paso: txt(m.primer_paso), tipo}, rompe: txt(m.rompehielo)});
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
    const pasos = ["Revisando " + otros.length + (otros.length === 1 ? " perfil…" : " perfiles…"), "Comparando tu sueño con sus superpoderes…", "Viendo a quién le sirve lo que sabes hacer…", S.iaDisponible ? "La IA está eligiendo quién encaja mejor contigo…" : "Eligiendo quién encaja mejor contigo…"];
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // La primera búsqueda es un pequeño espectáculo; al repetirla no hacemos esperar tanto.
    const total = reduce ? 500 : (S.nBusquedas === 0 ? 2800 : 1400);
    const id = ++S.nBusquedas;
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
        const data: {yo: string; perfiles: Record<string, unknown>[]} = await r.json();
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
        if (primera) { primera = false; cargarNotificados(); }
        forzar();
        if (!S.demo && S.vista === "clics" && S.buscarAlLlegar && yo()) { S.buscarAlLlegar = false; buscarMatch(); }
      } catch {
        if (parado) return;
        // Un fallo suelto no importa; si se repite, avisamos que se perdió la conexión.
        if (++fallos >= 2 || !S.realLoaded) { S.avail = "error"; S.loaded = true; forzar(); }
      } finally {
        if (!parado) siguiente = setTimeout(cargar, CADA_MS);
      }
    }
    // El chat se revisa aparte: más seguido mientras tienes una conversación abierta.
    let firmaChat = "", sigChat: ReturnType<typeof setTimeout> | undefined;
    async function cargarChat() {
      try {
        if (!S.demo && !document.hidden && S.uid) {
          const r = await fetch("/api/chat", {cache: "no-cache"});
          const txt = r.ok ? await r.text() : "";
          if (txt && !parado && txt !== firmaChat) {
            const primeraVez = !firmaChat;
            firmaChat = txt;
            const d: {mensajes: Mensaje[]; bloqueados: string[]} = JSON.parse(txt);
            const antes = new Set(S.chat.mensajes.map(m => m.id));
            S.chat = {mensajes: d.mensajes, bloqueados: new Set(d.bloqueados)};
            if (S.chatCon) marcarLeido(S.chatCon);
            // Aviso de mensajes nuevos que llegan mientras no tienes ese chat abierto.
            const nuevo = primeraVez ? null : d.mensajes.findLast(m => !antes.has(m.id) && m.de !== S.uid && m.de !== S.chatCon);
            if (nuevo) { const p = S.perfiles.get(nuevo.de); toast("Nuevo mensaje de " + (p ? nombre(p) : "un match")); }
            forzar();
          }
        }
      } catch {} finally {
        if (!parado) sigChat = setTimeout(cargarChat, S.chatCon ? 2500 : CADA_MS);
      }
    }
    cargar();
    cargarChat();
    return () => { parado = true; clearTimeout(siguiente); clearTimeout(lento); clearTimeout(sigChat); };
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

  if (S.chatCon) marcarLeido(S.chatCon);
  const convs = me ? conversaciones() : [];
  let burbuja = convs.reduce((n, c) => n + c.sinLeer, 0);
  if (me && S.vista !== "clics") {
    const vistos = cargarNotificados();
    burbuja += todos.filter(x => x.r.pct >= UMBRAL && !vistos.has(x.o.id)).length;
  }

  // En Mis matches, los matches que ya viste dejan de contar en la burbuja.
  useEffect(() => {
    if (S.vista === "clics" && !S.busqueda && S.loaded && me) todos.filter(x => x.r.pct >= UMBRAL).forEach(x => marcarNotificado(x.o.id));
  });

  const enProyectar = S.vista === "proyectar";
  // El chat es solo entre tú y tu mejor match. Si alguien te tiene a ti como su mejor match y te escribe,
  // también puedes contestarle.
  const mejorMatch = todos.find(x => x.r.pct >= UMBRAL)?.o;
  const genteChat = mejorMatch ? [mejorMatch] : [];
  for (const c of convs) {
    const p = S.perfiles.get(c.id);
    if (p && c.ultimo && charla().mensajes.some(m => m.de === p.id) && !genteChat.some(g => g.id === p.id)) genteChat.push(p);
  }
  const abrirChats = () => { if (genteChat.length === 1) abrirChat(genteChat[0].id); else { S.chatLista = true; forzar(); } };
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
      <Barra vista={S.vista} burbuja={burbuja}/>
      <main>
        <VistaInicio activo={S.vista === "inicio"} qrUrl={qrUrl}/>
        <VistaPerfil activo={S.vista === "perfil"} aviso={aviso} me={me} puede={puede()} guardando={S.guardando} relleno={S.relleno} tocadoRef={formTocado} onGuardar={guardar} onBorrar={borrar}/>
        <VistaClics activo={S.vista === "clics"} aviso={aviso} busqueda={S.busqueda} pasoFinal={S.pasoFinal} ganador={S.ganador} ganadorPct={S.ganadorPct} loaded={S.loaded} me={me} todos={todos} conIA={conIA} consejo={conIA && S.iaRes ? S.iaRes.consejo : ""} iaFallo={S.iaFallo} onBuscar={buscarMatch}/>
        <VistaProyectar activo={enProyectar} qrUrl={qrUrl} perfiles={S.perfiles.size} pares={pares}/>
      </main>
      {me && S.chatCon && <Chat key={S.chatCon} me={me} otroId={S.chatCon} otro={S.perfiles.get(S.chatCon) ?? null}
        mensajes={charla().mensajes.filter(m => m.de === S.chatCon || m.para === S.chatCon)}
        escribiendo={S.escribiendo === S.chatCon} onEnviar={enviarMensaje} onBloquear={bloquearChat} onCerrar={cerrarChat} onVolver={genteChat.length > 1 ? volverALista : undefined}/>}
      {me && S.chatLista && !S.chatCon && <ListaChats me={me} gente={genteChat} convs={convs} onAbrir={abrirChat} onCerrar={cerrarChat}/>}
      {me && S.vista === "clics" && !S.chatCon && !S.chatLista && !S.busqueda && genteChat.length > 0 &&
        <BotonChat sinLeer={convs.reduce((n, c) => n + c.sinLeer, 0)} onAbrir={abrirChats}/>}
      <Paletas/>
      <div className={"toast" + (S.toast.ver ? " ver" : "")} id="toast" role="status" aria-live="polite">{S.toast.texto}</div>
    </>
  );
}
