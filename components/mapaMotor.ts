/* Motor del Mapa de Sueños: acomoda la red con fuerzas suaves y la dibuja en un <canvas>.
   - Cada evento es un racimo; el evento de hoy va en el centro y los anteriores alrededor.
   - "todos": la cámara se aleja y las líneas finas pulsan.
   - "evento": la cámara entra al racimo de hoy; los empalmes se encienden y un punto de luz
     viaja por cada línea (en doble vía, en las dos direcciones).
   - Cada persona nueva entra con un destello y sus líneas se dibujan poco a poco.
   - Los sueños se ven como etiquetas junto a cada punto, y un foco recorre los empalmes uno por uno:
     resalta la pareja y avisa (onFoco) para que la vista muestre su sueño y el superpoder que lo ayuda. */
import type { Red, TipoEnlace } from "@/lib/red";

/** Lo que muestra la tarjeta del foco: cada sueño con el superpoder que lo ayuda (dos filas en doble vía). */
/** tipo "sola": alguien que elegiste con un clic y todavía no tiene con quién impulsarse. */
export type Foco = {id: number; tipo: "doble" | "una" | "sola"; filas: {sueno: string; poder: string}[]};
type Nodo = {k: string; e: number; s: 0 | 1; t: string; p: string; x: number; y: number; vx: number; vy: number; nace: number; fase: number; grado: number; empalma: boolean; px: number; py: number; r: number};
type Enlace = {a: Nodo; b: Nodo; t: TipoEnlace; i: number};
type Cam = {x: number; y: number; k: number};

const RADIO_REPULSION = 46;
const LARGO: Record<TipoEnlace, number> = {2: 46, 1: 62, 0: 96};
const RESORTE: Record<TipoEnlace, number> = {2: .06, 1: .04, 0: .012};
const DURA_ZOOM = 1600, DURA_DESTELLO = 1400, DURA_LINEA = 900, DURA_FOCO = 6500;
/** Con más gente que esto, las etiquetas no caben: solo se rotula la pareja del foco. */
const MAX_ETIQUETAS = 40;
const recortar = (t: string, n: number) => t.length > n ? t.slice(0, n - 1).trimEnd() + "…" : t;

/* Cada sueño con el superpoder que lo ayuda. En una vía, a ayuda y b tiene el sueño. */
function filasDe(l: Enlace) {
  const f: {sueno: string; poder: string}[] = [];
  if (l.b.t && l.a.p) f.push({sueno: l.b.t, poder: l.a.p});
  if (l.t === 2 && l.a.t && l.b.p) f.push({sueno: l.a.t, poder: l.b.p});
  return f;
}

const limitar = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const suave = (t: number) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const salida = (t: number) => 1 - Math.pow(1 - t, 3);
function hash(s: string) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; }
const radioRacimo = (n: number) => 18 * Math.sqrt(n) + 24;

export class Motor {
  private ctx: CanvasRenderingContext2D;
  private nodos = new Map<string, Nodo>();
  private lista: Nodo[] = [];
  private enlaces: Enlace[] = [];
  private centros: {x: number; y: number}[] = [];
  private actual = -1;
  private cam: Cam = {x: 0, y: 0, k: 1};
  private tween: {desde: Cam; t0: number} | null = null;
  private alpha = 0;
  private col = {bg: "#111", a: "#fc0", h: "#3fe", t: "#fff", m: "#999"};
  private w = 0; private h = 0; private dpr = 1;
  private raf = 0; private vivo = true; private primera = true;
  private quieto: boolean;
  private ro: ResizeObserver; private mo: MutationObserver;
  private fuente = "system-ui, sans-serif";
  private foco: Enlace | null = null;
  /** Lo que elegiste con un clic: el foco se queda ahí un rato antes de volver a rotar. */
  private elegido: Nodo | null = null; private fijoHasta = 0; private focoDesde = 0; private focoI = -1; private focoN = 0; private ultimoNuevo = "";
  /** Espacio que ocupan los textos de la vista arriba y abajo (lo mide VistaMapa). */
  private reserva = {arriba: 72, abajo: 0, tapa: null as [number, number, number, number] | null};
  /** Se llama cada vez que el foco cambia de pareja. */
  onFoco: ((f: Foco | null) => void) | null = null;

  constructor(private lienzo: HTMLCanvasElement) {
    this.ctx = lienzo.getContext("2d")!;
    this.quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.leerColores();
    // Si cambian la paleta, el mapa cambia de colores al instante.
    this.mo = new MutationObserver(() => this.leerColores());
    this.mo.observe(document.documentElement, {attributes: true, attributeFilter: ["data-paleta", "style", "class"]});
    lienzo.addEventListener("click", this.clic);
    lienzo.addEventListener("pointermove", this.señalar);
    this.ro = new ResizeObserver(() => this.medir());
    this.ro.observe(lienzo);
    this.medir();
    this.raf = requestAnimationFrame(this.bucle);
  }

  destruir() {
    this.vivo = false;
    cancelAnimationFrame(this.raf);
    this.ro.disconnect(); this.mo.disconnect();
    this.lienzo.removeEventListener("click", this.clic);
    this.lienzo.removeEventListener("pointermove", this.señalar);
  }

  private leerColores() {
    const cs = getComputedStyle(document.documentElement);
    const v = (n: string, def: string) => cs.getPropertyValue(n).trim() || def;
    this.col = {bg: v("--bg", "#111"), a: v("--a", "#fc0"), h: v("--h", "#3fe"), t: v("--t", "#fff"), m: v("--m", "#999")};
    this.fuente = getComputedStyle(document.body).fontFamily || this.fuente;
  }

  /** La vista avisa cuánto ocupan sus textos, para que la red no quede detrás. */
  reservar(arriba: number, abajo: number, tapa: [number, number, number, number] | null = null) { this.reserva = {arriba, abajo, tapa}; }

  private medir() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = this.lienzo.clientWidth; this.h = this.lienzo.clientHeight;
    const r = {width: this.w, height: this.h};
    this.lienzo.width = Math.round(r.width * this.dpr);
    this.lienzo.height = Math.round(r.height * this.dpr);
  }

  /** Recibe la red nueva: conserva la posición de quien ya estaba y hace entrar a los nuevos. */
  datos(red: Red | null) {
    if (!red) return;
    const ahora = performance.now();
    this.actual = red.eventos.findIndex(e => e.nombre === red.evento);
    this.ubicarEventos(red);
    const nuevos = new Map<string, Nodo>();
    const habia = this.nodos.size;
    let llegaron = false;
    const orden = red.nodos.map(d => {
      let n = this.nodos.get(d.k);
      if (!n) {
        const c = this.centros[d.e] ?? {x: 0, y: 0}, ang = hash(d.k) * Math.PI * 2, rad = Math.sqrt(hash(d.k + "r")) * radioRacimo(red.eventos[d.e]?.n ?? 1);
        n = {k: d.k, e: d.e, s: d.s, t: "", p: "", x: c.x + Math.cos(ang) * rad, y: c.y + Math.sin(ang) * rad, vx: 0, vy: 0, nace: this.primera ? -1e9 : ahora, fase: hash(d.k + "f") * 6.283, grado: 0, empalma: false, px: 0, py: 0, r: 0};
        llegaron = true;
      }
      n.e = d.e; n.s = d.s; n.t = d.t ?? ""; n.p = d.p ?? ""; n.grado = 0; n.empalma = false;
      nuevos.set(d.k, n);
      return n;
    });
    this.nodos = nuevos;
    this.lista = orden;
    this.enlaces = red.enlaces.map(([a, b, t], i) => {
      const A = orden[a], B = orden[b];
      if (t) { A.grado++; B.grado++; A.empalma = B.empalma = true; }
      return {a: A, b: B, t, i};
    });
    // Si la pareja del foco ya no existe (alguien borró su perfil), el foco pasa a la siguiente.
    if (this.foco) {
      const f = this.foco;
      this.foco = this.enlaces.find(l => l.a === f.a && l.b === f.b && l.t > 0) ?? null;
      if (!this.foco) this.focoDesde = 0;
    }
    if (this.primera) {
      this.primera = false;
      this.alpha = 1;
      // Se acomoda casi todo antes de mostrarse; con movimiento reducido, del todo.
      for (let i = 0; i < (this.quieto ? 400 : 160); i++) this.paso();
      this.cam = this.objetivo();
    } else if (llegaron || orden.length < habia) this.alpha = Math.max(this.alpha, .4);
    else this.alpha = Math.max(this.alpha, .15);
    if (this.quieto) for (let i = 0; i < 200; i++) this.paso();
  }

  /* El evento de hoy en el centro; los demás en espiral alrededor, del más nuevo al más viejo. */
  private ubicarEventos(red: Red) {
    const idx = red.eventos.map((_, i) => i).reverse();
    if (this.actual >= 0) { idx.splice(idx.indexOf(this.actual), 1); idx.unshift(this.actual); }
    const mayor = Math.max(60, ...red.eventos.map(e => radioRacimo(e.n)));
    const paso = mayor * 2.4 + 60;
    this.centros = [];
    idx.forEach((e, r) => {
      const ang = r * 2.39996, rad = r ? paso * Math.sqrt(r) : 0;
      this.centros[e] = {x: Math.cos(ang) * rad, y: Math.sin(ang) * rad};
    });
  }

  /* Un paso de la simulación: atracción al centro del evento, repulsión entre vecinos y resortes. */
  private paso() {
    const a = this.alpha;
    if (a < .004) return;
    const L = this.lista;
    // El racimo toma la forma de la pantalla: ancho en un proyector, alto en un celular.
    const m = this.marco(), forma = limitar((this.w - m.lado * 2) / Math.max(1, this.h - m.arriba - m.abajo), .6, 2.4);
    const jx = .012 / Math.sqrt(forma), jy = .012 * Math.sqrt(forma);
    for (const n of L) {
      const c = this.centros[n.e] ?? {x: 0, y: 0};
      n.vx += (c.x - n.x) * jx * a; n.vy += (c.y - n.y) * jy * a;
    }
    // Repulsión solo entre vecinos cercanos (con una grilla): rápido aunque haya miles.
    const R = RADIO_REPULSION, celdas = new Map<string, Nodo[]>();
    for (const n of L) {
      const key = n.e + ":" + Math.floor(n.x / R) + ":" + Math.floor(n.y / R);
      const c = celdas.get(key); if (c) c.push(n); else celdas.set(key, [n]);
    }
    for (const n of L) {
      const cx = Math.floor(n.x / R), cy = Math.floor(n.y / R);
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
        const c = celdas.get(n.e + ":" + (cx + dx) + ":" + (cy + dy));
        if (!c) continue;
        for (const m of c) {
          if (m === n) continue;
          let ddx = n.x - m.x, ddy = n.y - m.y, d = Math.hypot(ddx, ddy);
          if (d >= R) continue;
          if (d < .01) { ddx = hash(n.k) - .5; ddy = hash(m.k) - .5; d = Math.hypot(ddx, ddy) || 1; }
          const f = (1 - d / R) * 1.1 * a;
          n.vx += ddx / d * f; n.vy += ddy / d * f;
        }
      }
    }
    for (const l of this.enlaces) {
      const dx = l.b.x - l.a.x, dy = l.b.y - l.a.y, d = Math.hypot(dx, dy) || 1;
      const f = (d - LARGO[l.t]) / d * RESORTE[l.t] * a;
      l.a.vx += dx * f; l.a.vy += dy * f; l.b.vx -= dx * f; l.b.vy -= dy * f;
    }
    for (const n of L) { n.vx *= .8; n.vy *= .8; n.x += n.vx; n.y += n.vy; }
    this.alpha *= .985;
  }

  /* Margen que ocupan los textos de la vista, para que la red no quede detrás. */
  private marco() {
    const abajo = this.reserva.abajo > 0 ? limitar(this.reserva.abajo, 0, this.h * .6) : limitar(this.h * .3, 150, 300);
    const arriba = limitar(this.reserva.arriba, 56, this.h * .4), lado = this.w > 700 ? 56 : 20;
    return {abajo, arriba, lado, cx: this.w / 2, cy: arriba + (this.h - abajo - arriba) / 2};
  }

  /* El foco: cada 6,5 segundos pasa a otra pareja (primero las de doble vía).
     Cuando alguien nuevo llega con un empalme, el foco salta a esa persona. */
  /** El punto que está debajo del cursor o del dedo (con un margen para que sea fácil atinarle). */
  private nodoEn(x: number, y: number) {
    let mejor: Nodo | null = null, dist = Infinity;
    for (const n of this.lista) {
      const d = Math.hypot(n.px - x, n.py - y);
      if (d < Math.max(n.r + 10, 20) && d < dist) { mejor = n; dist = d; }
    }
    return mejor;
  }

  /* Clic en un punto: el foco muestra su sueño y con quién se impulsa (otro clic: su siguiente conexión).
     Clic en el vacío: el foco vuelve a rotar solo. */
  private clic = (e: MouseEvent) => {
    const caja = this.lienzo.getBoundingClientRect(), ahora = performance.now();
    const n = this.nodoEn(e.clientX - caja.left, e.clientY - caja.top);
    if (!n) { this.fijoHasta = 0; this.elegido = null; this.focoDesde = 0; this.foco = null; return; }
    this.fijoHasta = ahora + 20000;
    const suyos = this.enlaces.filter(l => l.t > 0 && (l.a === n || l.b === n) && filasDe(l).length > 0).sort((x, y) => (y.t - x.t) || (x.i - y.i));
    if (suyos.length) {
      const i = this.elegido === n && this.foco ? suyos.indexOf(this.foco) : -1;
      this.elegido = n;
      this.foco = null;
      this.ponerFoco(suyos[(i + 1) % suyos.length], ahora);
      return;
    }
    // Todavía sin conexión: igual se ve su sueño (o su superpoder).
    this.elegido = n; this.foco = null; this.focoDesde = ahora;
    this.onFoco?.({id: ++this.focoN, tipo: "sola", filas: [{sueno: n.t, poder: n.p}]});
  };

  private señalar = (e: PointerEvent) => {
    const caja = this.lienzo.getBoundingClientRect();
    this.lienzo.style.cursor = this.nodoEn(e.clientX - caja.left, e.clientY - caja.top) ? "pointer" : "";
  };

  private rotarFoco(ahora: number) {
    if (ahora < this.fijoHasta) return;
    if (this.elegido) { this.elegido = null; this.focoDesde = 0; }
    const hoy = this.enlaces.filter(l => l.t > 0 && filasDe(l).length > 0);
    const nuevo = this.lista.filter(n => ahora - n.nace < 2000 && n.k !== this.ultimoNuevo).sort((x, y) => y.nace - x.nace)[0];
    if (nuevo) {
      const suyo = hoy.filter(l => l.a === nuevo || l.b === nuevo).sort((x, y) => y.t - x.t)[0];
      if (suyo) { this.ultimoNuevo = nuevo.k; this.ponerFoco(suyo, ahora); return; }
    }
    if (this.foco && ahora - this.focoDesde < DURA_FOCO) return;
    if (!hoy.length) { this.ponerFoco(null, ahora); return; }
    hoy.sort((x, y) => (y.t - x.t) || (x.i - y.i));
    this.focoI = (this.focoI + 1) % hoy.length;
    this.ponerFoco(hoy[this.focoI], ahora);
  }

  private ponerFoco(l: Enlace | null, ahora: number) {
    if (l === this.foco && (l || !this.focoDesde)) return;
    this.foco = l; this.focoDesde = l ? ahora : 0;
    this.onFoco?.(l ? {id: ++this.focoN, tipo: l.t === 2 ? "doble" : "una", filas: filasDe(l)} : null);
  }

  private objetivo(): Cam {
    // El mapa es general: la cámara encuadra a todo el mundo, de todos los eventos.
    const sel = this.lista;
    if (!sel.length) return {x: 0, y: 0, k: 1};
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const n of sel) { x0 = Math.min(x0, n.x); y0 = Math.min(y0, n.y); x1 = Math.max(x1, n.x); y1 = Math.max(y1, n.y); }
    const m = this.marco(), pad = 18;
    const bw = Math.max(x1 - x0 + pad * 2, 160), bh = Math.max(y1 - y0 + pad * 2, 160);
    const escala = Math.min(this.w, this.h) / 800;
    let k = Math.min((this.w - m.lado * 2) / bw, (this.h - m.arriba - m.abajo) / bh);
    k = limitar(k, .08, 3.6 * Math.max(escala, .6));
    return {x: (x0 + x1) / 2, y: (y0 + y1) / 2, k};
  }

  private moverCamara(ahora: number) {
    const o = this.objetivo();
    if (this.tween) {
      const t = Math.min(1, (ahora - this.tween.t0) / DURA_ZOOM), e = suave(t), d = this.tween.desde;
      this.cam = {x: d.x + (o.x - d.x) * e, y: d.y + (o.y - d.y) * e, k: Math.exp(Math.log(d.k) + (Math.log(o.k) - Math.log(d.k)) * e)};
      if (t >= 1) this.tween = null;
    } else if (this.quieto) this.cam = o;
    else {
      const f = .06;
      this.cam = {x: this.cam.x + (o.x - this.cam.x) * f, y: this.cam.y + (o.y - this.cam.y) * f, k: Math.exp(Math.log(this.cam.k) + (Math.log(o.k) - Math.log(this.cam.k)) * f)};
    }
  }

  private bucle = (ahora: number) => {
    if (!this.vivo) return;
    // Si la pantalla cambió de tamaño (girar el celular, pantalla completa), se vuelve a medir.
    if (this.lienzo.clientWidth !== this.w || this.lienzo.clientHeight !== this.h) this.medir();
    if (!document.hidden && this.w > 0) {
      this.paso();
      this.moverCamara(ahora);
      this.rotarFoco(ahora);
      this.dibujar(ahora);
    }
    this.raf = requestAnimationFrame(this.bucle);
  };

  private dibujar(ahora: number) {
    const {ctx, col, cam} = this;
    const m = this.marco();
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.globalAlpha = 1;
    ctx.fillStyle = col.bg;
    ctx.fillRect(0, 0, this.w, this.h);
    const enfoque = true;
    const z = limitar(cam.k, .35, 3);
    const grosor = .55 + z * .45;
    // La red respira: cada nodo se mece un poco alrededor de su lugar.
    for (const n of this.lista) {
      const b = this.quieto ? 0 : 2.2;
      n.px = (n.x + Math.sin(ahora / 1700 + n.fase) * b - cam.x) * cam.k + m.cx;
      n.py = (n.y + Math.cos(ahora / 1900 + n.fase) * b - cam.y) * cam.k + m.cy;
    }

    ctx.lineCap = "round";
    for (const l of this.enlaces) {
      const aparece = this.quieto ? 1 : limitar((ahora - Math.max(l.a.nace, l.b.nace)) / DURA_LINEA, 0, 1);
      if (aparece <= 0) continue;
      const dentro = true;
      let alfa: number, ancho: number, color: string;
      if (!enfoque) {
        // Todos los eventos: líneas finas que pulsan.
        const pulso = this.quieto ? 1 : .6 + .4 * Math.sin(ahora / 1100 + l.i * .7);
        color = l.t ? col.h : col.m; ancho = (l.t === 2 ? 1.5 : 1) * grosor; alfa = (l.t ? .42 : .12) * pulso;
      } else if (!dentro) { color = col.m; ancho = grosor; alfa = .06; }
      else if (l.t === 2) { color = col.h; ancho = 3.4 * grosor; alfa = .92; }
      else if (l.t === 1) { color = col.h; ancho = 1.6 * grosor; alfa = .5; }
      else { color = col.m; ancho = grosor; alfa = .16; }
      // Mientras el foco resalta una pareja, las demás líneas se apagan un poco.
      if (enfoque && this.foco) { if (l === this.foco) continue; alfa *= .4; }
      ctx.globalAlpha = alfa; ctx.strokeStyle = color; ctx.lineWidth = ancho;
      ctx.beginPath(); ctx.moveTo(l.a.px, l.a.py);
      ctx.lineTo(l.a.px + (l.b.px - l.a.px) * aparece, l.a.py + (l.b.py - l.a.py) * aparece);
      ctx.stroke();
    }

    // La línea del foco, encima de todas.
    const f = enfoque ? this.foco : null;
    if (f) {
      ctx.globalAlpha = 1; ctx.strokeStyle = col.h; ctx.lineWidth = (f.t === 2 ? 5 : 3.6) * grosor;
      ctx.beginPath(); ctx.moveTo(f.a.px, f.a.py); ctx.lineTo(f.b.px, f.b.py); ctx.stroke();
    }

    // Puntos de luz que viajan por los empalmes del evento: de quien ayuda hacia el sueño.
    if (enfoque && !this.quieto) {
      ctx.fillStyle = col.t;
      for (const l of this.enlaces) {
        if (!l.t) continue;
        const periodo = l.t === 2 ? 2600 : 3400, p = ((ahora + l.i * 397) % periodo) / periodo;
        const r = (l.t === 2 ? 2.8 : 2.1) * grosor;
        ctx.globalAlpha = .9 * Math.sin(p * Math.PI);
        ctx.beginPath(); ctx.arc(l.a.px + (l.b.px - l.a.px) * p, l.a.py + (l.b.py - l.a.py) * p, r, 0, 6.283); ctx.fill();
        if (l.t === 2) { ctx.beginPath(); ctx.arc(l.b.px + (l.a.px - l.b.px) * p, l.b.py + (l.a.py - l.b.py) * p, r, 0, 6.283); ctx.fill(); }
      }
    }

    // Nodos: sueño en el color del sueño, hacedores en el del superpoder.
    // Quien todavía no empalma con nadie queda como un anillo hueco.
    for (const n of this.lista) {
      const dentro = true;
      const r = (n.s ? 4.4 : 3.6) * z * (1 + Math.min(n.grado, 5) * .1) * (enfoque ? 1 : .8);
      n.r = r;
      const color = n.s ? col.a : col.h;
      if ((f && (n === f.a || n === f.b)) || n === this.elegido) {
        ctx.globalAlpha = 1; ctx.strokeStyle = col.t; ctx.lineWidth = 2.4 * grosor;
        ctx.beginPath(); ctx.arc(n.px, n.py, r + 6 * grosor, 0, 6.283); ctx.stroke();
      }
      ctx.globalAlpha = dentro ? 1 : .18;
      ctx.beginPath(); ctx.arc(n.px, n.py, r, 0, 6.283);
      if (n.empalma) { ctx.fillStyle = color; ctx.fill(); }
      else { ctx.fillStyle = col.bg; ctx.fill(); ctx.globalAlpha = dentro ? .75 : .15; ctx.strokeStyle = color; ctx.lineWidth = 1.6 * grosor; ctx.stroke(); }
      const q = (ahora - n.nace) / DURA_DESTELLO;
      if (!this.quieto && q >= 0 && q < 1) {
        ctx.globalAlpha = 1 - q; ctx.strokeStyle = col.t; ctx.lineWidth = 2 * grosor;
        ctx.beginPath(); ctx.arc(n.px, n.py, r + 34 * grosor * salida(q), 0, 6.283); ctx.stroke();
      }
    }
    if (enfoque) this.etiquetas(f, m);
    ctx.globalAlpha = 1;
  }

  /* Los sueños escritos junto a cada punto. Primero los de la pareja del foco, en grande;
     después los demás, sin taparse entre ellos ni con los textos de la vista. */
  private etiquetas(f: Enlace | null, m: {arriba: number; abajo: number; lado: number}) {
    const {ctx, col} = this;
    const hoy = this.lista.filter(n => n.t || n.p);
    const tam = limitar(Math.min(this.w, this.h) / 64, 11, 18);
    // La tarjeta del foco cuenta como ocupada: ninguna etiqueta queda debajo.
    const puestas: [number, number, number, number][] = this.reserva.tapa ? [this.reserva.tapa] : [];
    const libre = (x0: number, y0: number, x1: number, y1: number) =>
      x0 >= 8 && x1 <= this.w - 8 && y0 >= m.arriba - 8 && y1 <= this.h - m.abajo + 8 &&
      !puestas.some(([a, b, c, d]) => x0 < c && x1 > a && y0 < d && y1 > b);
    // Los sueños en gris claro; los superpoderes (de quien se suma a un sueño) en el color del superpoder.
    const poner = (n: Nodo, texto: string, fuerte: boolean, color = fuerte ? col.t : col.m) => {
      ctx.font = `${fuerte ? 800 : 600} ${fuerte ? tam * 1.15 : tam}px ${this.fuente}`;
      const ancho = ctx.measureText(texto).width, alto = (fuerte ? tam * 1.15 : tam) * 1.3, sep = n.r + 8;
      // A la derecha del punto; si no cabe, a la izquierda.
      for (const lado of [1, -1]) {
        const x0 = lado > 0 ? n.px + sep : n.px - sep - ancho, y0 = n.py - alto / 2;
        if (!libre(x0, y0, x0 + ancho, y0 + alto)) continue;
        puestas.push([x0 - 4, y0, x0 + ancho + 4, y0 + alto]);
        ctx.textAlign = "left"; ctx.textBaseline = "middle";
        ctx.globalAlpha = fuerte ? 1 : (f ? .45 : .82);
        ctx.lineJoin = "round"; ctx.lineWidth = 4; ctx.strokeStyle = col.bg;
        ctx.strokeText(texto, x0, n.py);
        ctx.fillStyle = color;
        ctx.fillText(texto, x0, n.py);
        return;
      }
    };
    // La pareja del foco: el sueño (o el superpoder de quien ayuda, si no tiene sueño).
    if (f) for (const n of [f.b, f.a]) poner(n, recortar(n.t || n.p, 34), true, n.t ? col.t : col.h);
    const el = this.elegido;
    if (el && !(f && (el === f.a || el === f.b))) poner(el, recortar(el.t || el.p, 34), true, el.t ? col.t : col.h);
    if (hoy.length > MAX_ETIQUETAS) return;
    // Primero los sueños; después los superpoderes de quienes se suman, en el espacio que quede.
    for (const n of hoy) {
      if (!n.t || n === el || (f && (n === f.a || n === f.b))) continue;
      poner(n, recortar(n.t, 30), false);
    }
    for (const n of hoy) {
      if (n.t || !n.p || n === el || (f && (n === f.a || n === f.b))) continue;
      poner(n, recortar(n.p, 26), false, col.h);
    }
  }
}
