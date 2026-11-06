/* Motor del Mapa de Sueños, dibujado como una red neuronal en capas:
     SUEÑOS (izquierda)  →  ÁREAS (centro, la "capa oculta")  →  SUPERPODERES (derecha)
   - Cada sueño se conecta con las áreas que necesita; cada superpoder sale de sus áreas.
   - Un match es un camino: sueño → área → superpoder. Por esos caminos viajan señales de luz.
   - En pantallas altas (celular vertical) las capas van de arriba a abajo.
   - Un foco recorre los matches uno por uno (o el que elijas con un clic) y avisa (onFoco)
     para que la vista muestre ese sueño y el superpoder que hace match. */
import { AREAS } from "@/lib/match";
import type { Red, TipoEnlace } from "@/lib/red";

/** Filtro de la leyenda: solo las parejas que se ayudan los dos, solo las de una vía, o solo quien no conecta. */
export type Filtro = "doble" | "una" | "sola" | null;
/** Lo que muestra la tarjeta del foco: cada sueño con el superpoder que hace match (dos filas en doble vía).
    tipo "sola": alguien que todavía no tiene con quién conectar. */
export type Foco = {id: number; tipo: "doble" | "una" | "sola"; filas: {sueno: string; poder: string}[]};

type Punto = {x: number; y: number; tx: number; ty: number; r: number};
type Persona = {k: string; t: string; p: string; needs: number[]; powers: number[]; orden: number; nace: number; empalma: boolean; sueno: Punto | null; poder: Punto};
type Area = {id: number; nombre: string; pt: Punto; usada: boolean};
type Enlace = {a: Persona; b: Persona; t: TipoEnlace; i: number};
type Senal = {ruta: Punto[]; t0: number};

const DURA_FOCO = 6500, DURA_DESTELLO = 1400, DURA_SENAL = 1800, CADA_SENAL = 240, MAX_SENALES = 36;

const limitar = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const recortar = (t: string, n: number) => t.length > n ? t.slice(0, n - 1).trimEnd() + "…" : t;
const punto = (): Punto => ({x: NaN, y: NaN, tx: 0, ty: 0, r: 3});

/* Cada sueño con el superpoder que hace match. En una vía, a ayuda y b tiene el sueño. */
function filasDe(l: Enlace) {
  const f: {sueno: string; poder: string}[] = [];
  if (l.b.t && l.a.p) f.push({sueno: l.b.t, poder: l.a.p});
  if (l.t === 2 && l.a.t && l.b.p) f.push({sueno: l.a.t, poder: l.b.p});
  return f;
}

export class Motor {
  private ctx: CanvasRenderingContext2D;
  private personas = new Map<string, Persona>();
  private lista: Persona[] = [];
  private areas: Area[] = AREAS.map((nombre, i) => ({id: i + 1, nombre, pt: punto(), usada: false}));
  private enlaces: Enlace[] = [];
  private col = {bg: "#111", a: "#fc0", h: "#3fe", t: "#fff", m: "#999"};
  private fuente = "system-ui, sans-serif";
  private w = 0; private h = 0; private dpr = 1;
  private raf = 0; private vivo = true; private primera = true;
  private quieto: boolean;
  private ro: ResizeObserver; private mo: MutationObserver;
  /** "columnas": sueños a la izquierda y superpoderes a la derecha. "filas": arriba y abajo (pantallas altas). */
  private forma: "columnas" | "filas" = "columnas";
  private conTextos = false;
  private foco: Enlace | null = null; private focoDesde = 0; private focoI = -1; private focoN = 0; private ultimoNuevo = "";
  /** Lo que elegiste con un clic: el foco se queda ahí un rato antes de volver a rotar. */
  private elegido: Persona | null = null; private fijoHasta = 0;
  private filtro: Filtro = null;
  private visibles = new Set<Persona>();
  private senales: Senal[] = []; private ultimaSenal = 0;
  /** Espacio que ocupan los textos de la vista arriba y abajo, y la tarjeta del foco (lo mide VistaMapa). */
  private reserva = {arriba: 72, abajo: 0, tapa: null as [number, number, number, number] | null};
  /** Se llama cada vez que el foco cambia. */
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
  reservar(arriba: number, abajo: number, tapa: [number, number, number, number] | null = null) {
    this.reserva = {arriba, abajo, tapa};
    this.ubicar();
  }

  private medir() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = this.lienzo.clientWidth; this.h = this.lienzo.clientHeight;
    this.lienzo.width = Math.round(this.w * this.dpr);
    this.lienzo.height = Math.round(this.h * this.dpr);
    this.ubicar();
  }

  /** Recibe la red nueva: conserva a quien ya estaba y hace entrar a los nuevos. */
  datos(red: Red | null) {
    if (!red) return;
    const ahora = performance.now();
    const nuevas = new Map<string, Persona>();
    const orden = red.nodos.map((d, i) => {
      let p = this.personas.get(d.k);
      if (!p) p = {k: d.k, t: "", p: "", needs: [], powers: [], orden: i, nace: this.primera ? -1e9 : ahora, empalma: false, sueno: null, poder: punto()};
      p.t = d.t ?? ""; p.p = d.p ?? ""; p.needs = d.n ?? []; p.powers = d.w ?? []; p.orden = i; p.empalma = false;
      if (d.s && !p.sueno) p.sueno = punto();
      if (!d.s) p.sueno = null;
      nuevas.set(d.k, p);
      return p;
    });
    this.personas = nuevas;
    this.lista = orden;
    this.enlaces = [];
    red.enlaces.forEach(([a, b, t], i) => {
      if (!t) return;
      orden[a].empalma = orden[b].empalma = true;
      this.enlaces.push({a: orden[a], b: orden[b], t, i});
    });
    // Si la pareja del foco ya no existe (alguien borró su perfil), el foco pasa a la siguiente.
    if (this.foco) {
      const f = this.foco;
      this.foco = this.enlaces.find(l => l.a === f.a && l.b === f.b) ?? null;
      if (!this.foco) this.focoDesde = 0;
    }
    if (this.elegido && !this.personas.has(this.elegido.k)) this.elegido = null;
    this.senales = [];
    this.primera = false;
    this.ubicar();
  }

  /** Cambia el filtro y el foco empieza de nuevo con lo que quedó a la vista. */
  filtrar(f: Filtro) {
    if (f === this.filtro) return;
    this.filtro = f; this.foco = null; this.elegido = null; this.focoDesde = 0; this.fijoHasta = 0; this.focoI = -1;
    this.senales = [];
    this.onFoco?.(null);
  }

  private pasa(l: Enlace) {
    return !this.filtro || (this.filtro === "doble" ? l.t === 2 : this.filtro === "una" ? l.t === 1 : false);
  }

  /* Margen que ocupan los textos de la vista, para que la red quede en el hueco libre. */
  private marco() {
    const abajo = this.reserva.abajo > 0 ? limitar(this.reserva.abajo, 0, this.h * .6) : limitar(this.h * .2, 100, 220);
    const arriba = limitar(this.reserva.arriba, 24, this.h * .6), lado = this.w > 700 ? 28 : 12;
    // En pantallas anchas la tarjeta del foco va a la izquierda: la red usa el espacio a su derecha.
    const t = this.reserva.tapa, izq = t && this.w > 700 && t[2] < this.w * .45 ? t[2] + 16 : lado;
    return {abajo, arriba, lado, izq, ancho: this.w - izq - lado, alto: this.h - arriba - abajo};
  }

  /* Dónde va cada punto: las tres capas, cada una repartida a lo largo del espacio libre.
     Dentro de cada capa se ordenan por área, para que las líneas vayan en haces y no se crucen tanto. */
  private ubicar() {
    if (!this.w) return;
    const m = this.marco();
    this.forma = m.ancho >= m.alto * .9 ? "columnas" : "filas";
    // Los sueños se escriben junto a su punto (los que quepan sin taparse).
    this.conTextos = this.forma === "columnas";
    const porArea = (arr: number[]) => arr[0] ?? 99;
    const suenos = this.lista.filter(p => p.sueno).sort((x, y) => (porArea(x.needs) - porArea(y.needs)) || (x.orden - y.orden));
    const poderes = [...this.lista].sort((x, y) => (porArea(x.powers) - porArea(y.powers)) || (x.orden - y.orden));
    const usadas = new Set<number>();
    for (const p of this.lista) { p.needs.forEach(a => usadas.add(a)); p.powers.forEach(a => usadas.add(a)); }
    this.areas.forEach(a => { a.usada = usadas.has(a.id); });
    const areas = this.areas.filter(a => a.usada);

    // Reparte los puntos a lo largo de una línea (de "desde" a "hasta"), con la otra coordenada fija.
    const repartir = (pts: Punto[], fija: number, desde: number, hasta: number, rMax: number) => {
      const paso = (hasta - desde) / Math.max(1, pts.length);
      const r = limitar(paso * .36, 2.2, rMax);
      pts.forEach((pt, i) => {
        const v = desde + (i + .5) * paso;
        if (this.forma === "columnas") { pt.tx = fija; pt.ty = v; } else { pt.tx = v; pt.ty = fija; }
        pt.r = r;
        if (isNaN(pt.x)) { pt.x = pt.tx; pt.y = pt.ty; }
      });
    };
    const titulo = 28;
    if (this.forma === "columnas") {
      // Si hay textos al lado de los puntos, las columnas de afuera dejan espacio para ellos.
      // Los textos de los sueños van a la izquierda de su columna: ahí se deja espacio.
      const margenTexto = this.conTextos ? Math.min(m.ancho * .28, 320) : m.ancho * .06;
      const xS = m.izq + margenTexto, xP = m.izq + m.ancho - m.ancho * .05, xA = (xS + xP) / 2;
      const y0 = m.arriba + titulo, y1 = m.arriba + m.alto;
      repartir(suenos.map(p => p.sueno!), xS, y0, y1, 9);
      repartir(poderes.map(p => p.poder), xP, y0, y1, 9);
      repartir(areas.map(a => a.pt), xA, y0, y1, 15);
    } else {
      const x0 = m.izq, x1 = m.izq + m.ancho;
      const yS = m.arriba + titulo, yP = m.arriba + m.alto - 8, yA = (yS + yP) / 2;
      repartir(suenos.map(p => p.sueno!), yS, x0, x1, 7);
      repartir(poderes.map(p => p.poder), yP, x0, x1, 7);
      repartir(areas.map(a => a.pt), yA, x0, x1, 12);
    }
  }

  /** El camino de un match: el sueño de d, el área en común, el superpoder de h. */
  private ruta(d: Persona, h: Persona): Punto[] | null {
    if (!d.sueno) return null;
    const id = d.needs.find(x => h.powers.includes(x)) ?? h.powers[0] ?? d.needs[0];
    const area = this.areas.find(a => a.id === id && a.usada);
    return area ? [d.sueno, area.pt, h.poder] : [d.sueno, h.poder];
  }
  private rutasDe(l: Enlace) {
    const r = [this.ruta(l.b, l.a)];
    if (l.t === 2) r.push(this.ruta(l.a, l.b));
    return r.filter((x): x is Punto[] => !!x);
  }

  /** La persona que está debajo del cursor o del dedo (con margen para que sea fácil atinarle). */
  private personaEn(x: number, y: number) {
    let mejor: Persona | null = null, dist = Infinity;
    for (const p of this.lista) for (const pt of [p.sueno, p.poder]) {
      if (!pt) continue;
      const d = Math.hypot(pt.x - x, pt.y - y);
      if (d < Math.max(pt.r + 8, 14) && d < dist) { mejor = p; dist = d; }
    }
    return mejor;
  }

  /* Clic en un punto: el foco muestra su sueño y su match (otro clic: su siguiente match).
     Clic en el vacío: el foco vuelve a rotar solo. */
  private clic = (e: MouseEvent) => {
    const caja = this.lienzo.getBoundingClientRect(), ahora = performance.now();
    const p = this.personaEn(e.clientX - caja.left, e.clientY - caja.top);
    if (!p) { this.fijoHasta = 0; this.elegido = null; this.focoDesde = 0; this.foco = null; return; }
    this.fijoHasta = ahora + 20000;
    const suyos = this.enlaces.filter(l => (l.a === p || l.b === p) && filasDe(l).length > 0).sort((x, y) => (y.t - x.t) || (x.i - y.i));
    if (suyos.length) {
      const i = this.elegido === p && this.foco ? suyos.indexOf(this.foco) : -1;
      this.elegido = p; this.foco = null;
      this.ponerFoco(suyos[(i + 1) % suyos.length], ahora);
      return;
    }
    // Todavía sin match: igual se ve su sueño (o su superpoder).
    this.elegido = p; this.foco = null; this.focoDesde = ahora;
    this.onFoco?.({id: ++this.focoN, tipo: "sola", filas: [{sueno: p.t, poder: p.p}]});
  };

  private señalar = (e: PointerEvent) => {
    const caja = this.lienzo.getBoundingClientRect();
    this.lienzo.style.cursor = this.personaEn(e.clientX - caja.left, e.clientY - caja.top) ? "pointer" : "";
  };

  /* El foco: cada 6,5 segundos pasa a otro match (primero los de doble vía).
     Cuando alguien nuevo llega con un match, el foco salta a esa persona. */
  private rotarFoco(ahora: number) {
    if (ahora < this.fijoHasta) return;
    if (this.filtro === "sola") {
      if (this.elegido && ahora - this.focoDesde < DURA_FOCO) return;
      const solos = this.lista.filter(p => !p.empalma && p.t);
      if (!solos.length) { if (this.elegido) { this.elegido = null; this.onFoco?.(null); } return; }
      this.focoI = (this.focoI + 1) % solos.length;
      const p = solos[this.focoI];
      this.elegido = p; this.foco = null; this.focoDesde = ahora;
      this.onFoco?.({id: ++this.focoN, tipo: "sola", filas: [{sueno: p.t, poder: p.p}]});
      return;
    }
    if (this.elegido) { this.elegido = null; this.focoDesde = 0; }
    const hoy = this.enlaces.filter(l => this.pasa(l) && filasDe(l).length > 0);
    const nuevo = this.lista.filter(p => ahora - p.nace < 2000 && p.k !== this.ultimoNuevo).sort((x, y) => y.nace - x.nace)[0];
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

  /* Señales: cada poco sale una luz por el camino de un match al azar (de los que deja ver el filtro). */
  private lanzarSenales(ahora: number) {
    this.senales = this.senales.filter(s => ahora - s.t0 < DURA_SENAL);
    if (this.quieto || ahora - this.ultimaSenal < CADA_SENAL || this.senales.length >= MAX_SENALES) return;
    const candidatos = this.enlaces.filter(l => this.pasa(l));
    if (!candidatos.length) return;
    const l = candidatos[Math.floor(Math.random() * candidatos.length)];
    // Las de doble vía salen más seguido que las de una vía.
    if (l.t === 1 && Math.random() < .4) return;
    this.ultimaSenal = ahora;
    for (const ruta of this.rutasDe(l)) this.senales.push({ruta, t0: ahora});
  }

  private bucle = (ahora: number) => {
    if (!this.vivo) return;
    // Si la pantalla cambió de tamaño (girar el celular, pantalla completa), se vuelve a medir.
    if (this.lienzo.clientWidth !== this.w || this.lienzo.clientHeight !== this.h) this.medir();
    if (!document.hidden && this.w > 0) {
      this.rotarFoco(ahora);
      this.lanzarSenales(ahora);
      this.mover();
      this.dibujar(ahora);
    }
    this.raf = requestAnimationFrame(this.bucle);
  };

  /* Cuando alguien llega, los puntos se reacomodan deslizándose a su nuevo lugar. */
  private mover() {
    const f = this.quieto ? 1 : .12;
    const paso = (pt: Punto) => { pt.x += (pt.tx - pt.x) * f; pt.y += (pt.ty - pt.y) * f; };
    for (const p of this.lista) { if (p.sueno) paso(p.sueno); paso(p.poder); }
    for (const a of this.areas) if (a.usada) paso(a.pt);
  }

  /** Un punto a lo largo de un camino (p de 0 a 1). */
  private enRuta(ruta: Punto[], p: number) {
    const tramos = ruta.length - 1, t = limitar(p, 0, 1) * tramos, i = Math.min(tramos - 1, Math.floor(t)), q = t - i;
    return {x: ruta[i].x + (ruta[i + 1].x - ruta[i].x) * q, y: ruta[i].y + (ruta[i + 1].y - ruta[i].y) * q};
  }

  /** Dibuja un camino desde el principio hasta "hasta" (de 0 a 1). */
  private trazar(ruta: Punto[], hasta = 1) {
    const {ctx} = this;
    ctx.beginPath(); ctx.moveTo(ruta[0].x, ruta[0].y);
    const tramos = ruta.length - 1, t = hasta * tramos;
    for (let i = 1; i <= tramos; i++) {
      if (i <= t) ctx.lineTo(ruta[i].x, ruta[i].y);
      else { const e = this.enRuta(ruta, hasta); ctx.lineTo(e.x, e.y); break; }
    }
    ctx.stroke();
  }

  private dibujar(ahora: number) {
    const {ctx, col} = this;
    const m = this.marco();
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.globalAlpha = 1;
    ctx.fillStyle = col.bg;
    ctx.fillRect(0, 0, this.w, this.h);
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    const escala = limitar(Math.min(this.w, this.h) / 800, .7, 1.6);

    // Quién queda a la vista con el filtro.
    this.visibles = new Set(this.filtro === "sola" ? this.lista.filter(p => !p.empalma)
      : this.filtro ? this.enlaces.filter(l => this.pasa(l)).flatMap(l => [l.a, l.b]) : this.lista);
    const vis = (p: Persona) => this.visibles.has(p) ? 1 : .2;
    const areaDe = (id: number) => this.areas[id - 1];

    // 1. Las conexiones de la red: cada sueño con sus áreas y cada área con sus superpoderes.
    ctx.lineWidth = Math.max(.6, .8 * escala);
    for (const p of this.lista) {
      const v = vis(p);
      if (p.sueno) {
        ctx.strokeStyle = col.a; ctx.globalAlpha = .14 * v;
        for (const id of p.needs) { const a = areaDe(id); if (!a?.usada) continue; ctx.beginPath(); ctx.moveTo(p.sueno.x, p.sueno.y); ctx.lineTo(a.pt.x, a.pt.y); ctx.stroke(); }
      }
      ctx.strokeStyle = col.h; ctx.globalAlpha = .14 * v;
      for (const id of p.powers) { const a = areaDe(id); if (!a?.usada) continue; ctx.beginPath(); ctx.moveTo(a.pt.x, a.pt.y); ctx.lineTo(p.poder.x, p.poder.y); ctx.stroke(); }
    }

    // 2. Con un filtro puesto, se marcan todos los caminos de ese tipo de match.
    if (this.filtro && this.filtro !== "sola") {
      ctx.strokeStyle = col.h; ctx.lineWidth = (this.filtro === "doble" ? 1.6 : 1) * escala; ctx.globalAlpha = this.filtro === "doble" ? .4 : .18;
      for (const l of this.enlaces) if (this.pasa(l)) for (const r of this.rutasDe(l)) this.trazar(r);
    }

    // 3. Las señales: una estela que se enciende y una luz que viaja del sueño al superpoder.
    for (const s of this.senales) {
      const q = (ahora - s.t0) / DURA_SENAL;
      ctx.strokeStyle = col.h; ctx.lineWidth = 1.6 * escala; ctx.globalAlpha = .55 * (1 - q);
      this.trazar(s.ruta, q);
      const e = this.enRuta(s.ruta, q);
      ctx.fillStyle = col.t; ctx.globalAlpha = .95 * Math.sin(q * Math.PI);
      ctx.beginPath(); ctx.arc(e.x, e.y, 2.4 * escala, 0, 6.283); ctx.fill();
    }

    // 4. El foco: su camino encendido, con una luz que lo recorre sin parar.
    const f = this.foco;
    const rutasFoco = f ? this.rutasDe(f) : [];
    for (const r of rutasFoco) {
      ctx.strokeStyle = col.h; ctx.globalAlpha = 1; ctx.lineWidth = 3.4 * escala;
      this.trazar(r);
      if (!this.quieto) {
        const e = this.enRuta(r, ((ahora - this.focoDesde) % 1600) / 1600);
        ctx.fillStyle = col.t; ctx.beginPath(); ctx.arc(e.x, e.y, 4 * escala, 0, 6.283); ctx.fill();
      }
    }
    const areasFoco = new Set(rutasFoco.filter(r => r.length === 3).map(r => r[1]));

    // 5. La capa del centro: las áreas, con su nombre.
    ctx.textBaseline = "middle";
    for (const a of this.areas) {
      if (!a.usada) continue;
      const on = areasFoco.has(a.pt), pt = a.pt;
      ctx.globalAlpha = 1; ctx.fillStyle = on ? col.h : col.bg; ctx.strokeStyle = on ? col.h : col.t; ctx.lineWidth = 1.6 * escala;
      ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.r, 0, 6.283); ctx.fill(); ctx.stroke();
      const tam = limitar(pt.r * .95, 10, 15 * escala);
      ctx.font = `800 ${tam}px ${this.fuente}`;
      ctx.lineWidth = 4; ctx.strokeStyle = col.bg; ctx.fillStyle = on ? col.h : col.t; ctx.globalAlpha = on ? 1 : .85;
      if (this.forma === "columnas") {
        ctx.textAlign = "center";
        ctx.strokeText(a.nombre, pt.x, pt.y + pt.r + tam * .9); ctx.fillText(a.nombre, pt.x, pt.y + pt.r + tam * .9);
      } else {
        ctx.save(); ctx.translate(pt.x + 2, pt.y - pt.r - 4); ctx.rotate(-Math.PI / 4); ctx.textAlign = "left";
        ctx.strokeText(a.nombre, 0, 0); ctx.fillText(a.nombre, 0, 0); ctx.restore();
      }
    }

    // 6. Las personas: sueños en amarillo, superpoderes en menta. Quien no conecta, como anillo hueco.
    const enFoco = (p: Persona) => (!!f && (p === f.a || p === f.b)) || p === this.elegido;
    for (const p of this.lista) {
      const v = vis(p);
      for (const [pt, color] of [[p.sueno, col.a], [p.poder, col.h]] as [Punto | null, string][]) {
        if (!pt) continue;
        ctx.globalAlpha = v;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.r, 0, 6.283);
        if (p.empalma) { ctx.fillStyle = color; ctx.fill(); }
        else { ctx.fillStyle = col.bg; ctx.fill(); ctx.strokeStyle = color; ctx.lineWidth = 1.4; ctx.stroke(); }
        if (enFoco(p)) { ctx.globalAlpha = 1; ctx.strokeStyle = col.t; ctx.lineWidth = 2 * escala; ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.r + 4 * escala, 0, 6.283); ctx.stroke(); }
        const q = (ahora - p.nace) / DURA_DESTELLO;
        if (!this.quieto && q >= 0 && q < 1) {
          ctx.globalAlpha = 1 - q; ctx.strokeStyle = col.t; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.r + 26 * escala * (1 - Math.pow(1 - q, 3)), 0, 6.283); ctx.stroke();
        }
      }
    }

    // 7. Los nombres de las capas y los textos al lado de los puntos.
    this.titulos(m, escala);
    this.etiquetas(f, escala);
    ctx.globalAlpha = 1;
  }

  private titulos(m: ReturnType<Motor["marco"]>, escala: number) {
    const {ctx, col} = this;
    const capas: [string, Punto | undefined, string][] = [
      ["SUEÑOS", this.lista.find(p => p.sueno)?.sueno ?? undefined, col.a],
      ["ÁREAS", this.areas.find(a => a.usada)?.pt, col.t],
      ["SUPERPODERES", this.lista[0]?.poder, col.h]
    ];
    ctx.font = `800 ${limitar(12 * escala, 11, 15)}px ${this.fuente}`; ctx.textBaseline = "alphabetic"; ctx.globalAlpha = .9;
    for (const [texto, pt, color] of capas) {
      if (!pt) continue;
      ctx.fillStyle = color;
      if (this.forma === "columnas") { ctx.textAlign = "center"; ctx.fillText(texto, pt.tx, m.arriba + 14); }
      else { ctx.textAlign = "left"; ctx.fillText(texto, m.izq, pt.ty - pt.r - 8); }
    }
  }

  /* Los sueños escritos junto a sus puntos, a la izquierda de su columna.
     Siempre los del foco; los demás, los que quepan sin taparse. */
  private etiquetas(f: Enlace | null, escala: number) {
    const {ctx, col} = this;
    const tam = limitar(12 * escala, 11, 16);
    const puestas: [number, number, number, number][] = this.reserva.tapa ? [this.reserva.tapa] : [];
    const libre = (x0: number, y0: number, x1: number, y1: number) =>
      x0 >= 4 && x1 <= this.w - 4 && y0 >= 0 && y1 <= this.h && !puestas.some(([a, b, c, d]) => x0 < c && x1 > a && y0 < d && y1 > b);
    const poner = (pt: Punto, texto: string, fuerte: boolean, color: string, lados: number[]) => {
      ctx.font = `${fuerte ? 800 : 600} ${fuerte ? tam * 1.15 : tam}px ${this.fuente}`;
      const ancho = ctx.measureText(texto).width, alto = (fuerte ? tam * 1.15 : tam) * 1.3, sep = pt.r + 6;
      for (const lado of lados) {
        const x0 = lado > 0 ? pt.x + sep : pt.x - sep - ancho, y0 = pt.y - alto / 2;
        if (!libre(x0, y0, x0 + ancho, y0 + alto)) continue;
        puestas.push([x0 - 3, y0, x0 + ancho + 3, y0 + alto]);
        ctx.textAlign = "left"; ctx.textBaseline = "middle";
        ctx.globalAlpha = fuerte ? 1 : (f ? .5 : .8);
        ctx.lineWidth = 4; ctx.strokeStyle = col.bg; ctx.strokeText(texto, x0, pt.y);
        ctx.fillStyle = color; ctx.fillText(texto, x0, pt.y);
        return;
      }
    };
    const filas = this.forma === "filas";
    // En el mapa solo se escriben los sueños: primero los del foco (o de quien elegiste), en grande.
    const fuertes: Punto[] = [];
    const conSueno = (p: Persona) => { if (p.sueno && p.t) fuertes.push(p.sueno); };
    if (f) { conSueno(f.b); if (f.t === 2) conSueno(f.a); }
    else if (this.elegido) conSueno(this.elegido);
    const textoDe = new Map(this.lista.filter(p => p.sueno).map(p => [p.sueno as Punto, p.t]));
    for (const pt of fuertes) poner(pt, recortar(textoDe.get(pt) || "", filas ? 26 : 40), true, col.t, filas ? [1, -1] : [-1, 1]);
    if (!this.conTextos) return;
    for (const p of this.lista) if (p.sueno && p.t && this.visibles.has(p) && !fuertes.includes(p.sueno)) poner(p.sueno, recortar(p.t, 36), false, col.m, [-1]);
  }
}
