/* Lógica del match, igual que en el index.html original (legacy/index.html).
   Se usa en el navegador y en el servidor (limpiar valida lo que llega a la API). */

export const AREAS = ["Tecnología","Diseño y arte","Comunicación","Ventas y marketing","Negocios y finanzas","Liderazgo y organización","Educación","Salud y bienestar","Impacto social","Hacer con las manos","Investigación","Legal y trámites"];
export const area = (v: number) => AREAS[v - 1] || "";
export const CLAVES: Record<number, string[]> = {
  1:["program","codig","software","app","aplicacion","web","desarroll","react","python","java","flutter","tecnolog","sistemas","base de datos","bases de datos","inteligencia artificial","automatiz","ciberseg","computad","plataforma"],
  2:["disen","logo","ilustr","dibuj","arte","artist","foto","ux","ui","interfa","grafic","pint","music","animac","maqueta","planos","moda","decor"],
  3:["escrib","redact","comunic","hablo","hablar","publico","present","video","podcast","contenido","edit","locu","period","tiktok","youtube","guion","guiones","cuento","historia"],
  4:["vend","venta","market","mercad","publicid","marca","cliente","redes","anunc","promo","crecer cuentas","influen","instagram"],
  5:["negoci","finanz","contab","dinero","invers","presupuest","empren","excel","administr","econom","patrocin","cuentas","costos","precios","fondos"],
  6:["organiz","lider","coordin","gestion","equipo","evento","planific","logist","proyecto","convenz","motiv"],
  7:["ensen","educ","tutor","clase","explic","profe","capacit","mentor","taller","aprend"],
  8:["salud","psicol","nutri","deport","entren","medic","enferm","bienestar","yoga","fisio","emocional","estres","escucho"],
  9:["comunidad","social","volunt","ong","fundaci","ambient","recicl","inclus","barrio","accesib"],
  10:["constru","repar","arregl","electric","carpint","cocin","coser","costur","manualid","mecan","fabric","impresion 3d","hardware","solda","prototip","arduino","herramient"],
  11:["investig","datos","analiz","analisis","estadist","encuest","cienci","estudio"],
  12:["legal","ley","leyes","abogad","derecho","contrato","tramit","registr","permiso","impuest"]
};
export const norm = (t: string) => String(t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const CLAVES_RE = Object.entries(CLAVES).map(([v, arr]) => [+v, new RegExp("(^|[^a-z0-9])(" + arr.join("|") + ")")] as const);
export function inferir(t: string) { const n = norm(t); return CLAVES_RE.filter(([, re]) => re.test(n)).map(([v]) => v); }
/* Qué suele necesitar cada tipo de idea, además de su tema.
   Ej.: una charla necesita quien organice y consiga voluntarios, quien la difunda y quien diseñe. */
const NECESIDADES: [RegExp, number[]][] = [
  [/charla|conferencia|ponencia|taller|evento|feria|festival|jornada|encuentro|concierto|torneo|competencia|hackat|congreso/, [6, 4, 2]],
  [/(^|[^a-z])(app|aplicacion|plataforma|pagina web|sitio web|sistema|software|bot)/, [1, 2]],
  [/podcast|video|canal|documental|revista|blog|contenido|libro|cuento|programa de radio/, [3, 2, 4]],
  [/negocio|empresa|emprend|tienda|marca|vender|producto|cafeteria|restaurante|colmado|feria/, [5, 4, 12]],
  [/comunidad|barrio|voluntari|fundacion|campana|donacion|social|reciclaje/, [6, 9, 4]],
  [/salud|medic|bienestar|deporte|nutric|mental|terapia/, [8, 6]],
  [/clase|tutoria|curso|escuela|liceo|estudiante|ensen|educa|aprend/, [7, 6]],
  [/investig|estudio|encuesta|datos|mapa/, [11, 1]],
  [/kit|prototipo|construir|fabricar|energia|solar|robot|maquina/, [10, 5]],
  [/(^|[^a-z])(ley|legal|registro|tramite|permiso)/, [12]]
];
function necesita(idea: string) { const n = norm(idea); return NECESIDADES.filter(([re]) => re.test(n)).flatMap(([, v]) => v); }

export const COLORES = ["#5B2EFF","#F0306F","#00A884","#FF8A00","#1E88E5","#B5179E","#2B9348","#E85D04"];

export type Perfil = {
  id: string; idea: string; tagsNeeds: number[]; needs: number[];
  power: string; powers: number[];
  anon: boolean; alias: string; que: string; contact: string;
  likes: string[]; color: string; createdAt: number;
};

/* Límites de cada campo: los mismos de limpiar() en el original. */
export const LIMITES = { idea: 280, power: 140, alias: 40, que: 50, contact: 80 } as const;

export function limpiar(id: string, d: Record<string, unknown>): Perfil {
  const ints = (a: unknown, max: number) => Array.isArray(a) ? [...new Set(a.filter((x): x is number => Number.isInteger(x) && x >= 1 && x <= AREAS.length))].slice(0, max) : [];
  const str = (s: unknown, n: number) => typeof s === "string" ? s.slice(0, n).trim() : "";
  const idea = str(d.idea, LIMITES.idea), power = str(d.power, LIMITES.power);
  const elegidas = idea ? ints(d.needs, 3) : [];
  const powers = inferir(power);
  // Lo que tu idea necesita y tú no sabes hacer: lo que ya cubres con tu superpoder no cuenta.
  const base = elegidas.length ? elegidas : (idea ? [...new Set([...necesita(idea), ...inferir(idea)])] : []);
  const faltan = base.filter(x => !powers.includes(x));
  return {
    id, idea, tagsNeeds: elegidas, needs: (faltan.length ? faltan : base).slice(0, 4),
    power, powers,
    anon: d.anon !== false, alias: str(d.alias, LIMITES.alias), que: str(d.que, LIMITES.que), contact: str(d.contact, LIMITES.contact),
    likes: Array.isArray(d.likes) ? d.likes.filter((x): x is string => typeof x === "string").slice(-500) : [],
    color: typeof d.color === "string" && /^#[0-9a-f]{6}$/i.test(d.color) ? d.color : "",
    createdAt: Number(d.createdAt) || 0
  };
}
export function hash(s: string) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
export const esAnon = (p: Perfil) => p.anon || !p.alias;
export function nombre(p: Perfil) { return esAnon(p) ? "Anónimo " + hash(p.id).toString(36).toUpperCase().slice(-3) : p.alias; }
export function iniciales(p: Perfil) { const w = p.alias.split(/\s+/).filter(Boolean); if (!w.length) return "?"; return (w[0][0] + (w.length > 1 ? w[w.length - 1][0] : "")).toUpperCase(); }
export const colorDe = (p: Perfil) => p.color || COLORES[hash(p.id) % COLORES.length];

const STOP = new Set("para como esta este estos estas desde donde cuando sobre entre hacer tengo tiene quiero puedo nuestra nuestro todos todas pero porque mucho muchos mejor gente cosas algo".split(" "));
function palabras(t: string) { return new Set(norm(t).split(/[^a-z0-9ñ]+/).filter(w => w.length > 3 && !STOP.has(w))); }
const PAL_CACHE = new Map<string, Set<string>>();
function pal(p: Perfil, campo: "idea" | "power") { const k = p.id + "|" + campo + "|" + p[campo]; let w = PAL_CACHE.get(k); if (!w) { w = palabras(p[campo]); PAL_CACHE.set(k, w); } return w; }
function comunes(a: Set<string>, b: Set<string>) { const out: string[] = []; a.forEach(w => { if (b.has(w)) out.push(w); }); return out; }
function listaAreas(arr: number[]) { const n = arr.map(v => area(v).toLowerCase()); return n.length > 1 ? n.slice(0, -1).join(", ") + " y " + n[n.length - 1] : (n[0] || ""); }

/* Qué puede hacer de verdad alguien de cada área por una idea, dicho como lo diría un joven.
   puede: "Ana puede ___ para tu idea". pedir: "¿Me ayudarías a ___?" */
const ACCIONES: Record<number, {puede: string; pedir: string}> = {
  1: {puede: "armarte una página o un formulario para que la gente se inscriba", pedir: "armar una página o un formulario para que la gente se inscriba"},
  2: {puede: "diseñarte el logo, los flyers y las publicaciones para que se vea profesional", pedir: "diseñar el logo y los flyers"},
  3: {puede: "escribir los textos, presentar o grabar un video corto que invite a más gente", pedir: "escribir los textos o grabar un video corto que invite a más gente"},
  4: {puede: "moverlo en Instagram y TikTok para que llegue a más jóvenes", pedir: "moverlo en Instagram y TikTok"},
  5: {puede: "hacer el presupuesto y buscar cómo financiarlo sin perder dinero", pedir: "hacer el presupuesto y buscar cómo financiarlo"},
  6: {puede: "organizar el día, conseguir el lugar y coordinar a los voluntarios", pedir: "organizar el día y conseguir voluntarios"},
  7: {puede: "convertirlo en un taller fácil de entender", pedir: "convertirlo en un taller fácil de entender"},
  8: {puede: "cuidar la parte de salud y bienestar de quienes participen", pedir: "cuidar la parte de salud y bienestar"},
  9: {puede: "conectarte con juntas de vecinos, fundaciones y la comunidad", pedir: "conectar con juntas de vecinos y fundaciones"},
  10: {puede: "construir el prototipo o montar lo que haga falta", pedir: "construir el prototipo"},
  11: {puede: "hacer una encuesta rápida para saber qué quiere la gente", pedir: "hacer una encuesta rápida para saber qué quiere la gente"},
  12: {puede: "ayudarte con los permisos y a registrar el proyecto", pedir: "sacar los permisos y registrar el proyecto"}
};
/* "Un club de lectura en los parques" -> "un club de lectura en los parques" (sin punto final). */
const enFrase = (t: string) => (t.charAt(0).toLowerCase() + t.slice(1)).replace(/[.\s]+$/, "");

export const UMBRAL = 40;
const PESO_NECESIDAD = [46, 32, 22, 14];
export type Analisis = { pct: number; a: number[]; b: number[]; razones: string[]; rompe?: string; ia?: boolean };
export type Item = { o: Perfil; r: Analisis };

export function analizar(me: Perfil | null, o: Perfil | null): Analisis {
  if (!me || !o || me.id === o.id) return {pct: 0, a: [], b: [], razones: []};
  const a = me.needs.filter(x => o.powers.includes(x));
  const b = o.needs.filter(x => me.powers.includes(x));
  // kwA: su superpoder habla de lo mismo que tu idea. kwB: tu superpoder, de lo mismo que su idea.
  const kwA = comunes(pal(me, "idea"), pal(o, "power")), kwB = comunes(pal(o, "idea"), pal(me, "power"));
  const kw = [...new Set(kwA.concat(kwB))];
  const distinto = o.powers.filter(x => !me.powers.includes(x));
  const mismoPoder = o.powers.length > 0 && !distinto.length;
  // Lo más importante es que su superpoder le sirva a TU idea; que tú le sirvas a la suya suma menos.
  let pts = 0;
  // Las necesidades de tu idea van en orden de importancia: cubrir la primera vale más.
  a.forEach(x => { pts += PESO_NECESIDAD[me.needs.indexOf(x)] ?? 10; });
  if (b.length) pts += 10 + 3 * (b.length - 1);
  if (a.length && b.length) pts += 6;
  pts += Math.min(kwA.length, 3) * 8 + Math.min(kwB.length, 2) * 3;
  if (me.idea && distinto.length) pts += 8;
  if (mismoPoder) pts -= 15;
  if (!me.idea && !o.idea) pts -= 10;
  pts += hash([me.id, o.id].sort().join("|")) % 6;
  // Si su superpoder no le aporta nada a tu idea, no puede ser un gran match.
  if (me.idea && !a.length && !kwA.length) pts = Math.min(pts, UMBRAL - 2);
  const pct = Math.max(8, Math.min(98, Math.round(pts)));
  // Razones concretas: qué puede hacer esa persona por tu idea y qué puedes hacer tú por la suya.
  const quien = esAnon(o) ? "Esta persona" : o.alias.split(/\s+/)[0];
  const razones: string[] = [];
  if (a.length) {
    razones.push(`${quien} sabe de ${listaAreas(a.slice(0, 1))}: puede ${ACCIONES[a[0]].puede} para tu idea.`);
    if (a.length > 1) razones.push(`También puede ${ACCIONES[a[1]].puede}.`);
  }
  if (b.length) razones.push(`Y tú también le sirves: puedes ${ACCIONES[b[0]].puede}${o.idea ? " para " + enFrase(o.idea) : ""}.`);
  if (kwA.length) razones.push(`Los dos hablan de lo mismo: ${kwA.slice(0, 2).join(" y ")}.`);
  if (!razones.length && me.idea && distinto.length) razones.push(`${quien} sabe de ${listaAreas(distinto.slice(0, 1))}, algo que tú no cubres.`);
  if (mismoPoder && razones.length) razones.push("Ojo: los dos saben hacer lo mismo, así que entre ustedes no se completan tanto.");
  if (!razones.length) razones.push("Podrían complementarse si conversan.");
  // Una primera pregunta para empezar a hablar.
  const rompe = a.length && me.idea
    ? `¿Me ayudarías a ${ACCIONES[a[0]].pedir}? Mi idea es ${enFrase(me.idea)}.`
    : (b.length && o.idea ? `Vi tu idea de ${enFrase(o.idea)}. ¿Qué te falta? Yo te puedo ${ACCIONES[b[0]].pedir.replace(/^(\S+)/, "ayudar a $1")}.` : undefined);
  return {pct, a, b, razones, rompe};
}

/* El match es "al revés" cuando tú le sirves a su idea pero su superpoder no le aporta a la tuya. */
export const alReves = (me: Perfil, r: Analisis) => !!me.idea && r.a.length === 0 && r.b.length > 0;

/* ---------- IA ---------- */
export type ResIA = { clave: string; enviados: Set<string>; mapa: Map<string, {pct: number; razon: string; rompe: string}> };
export function claveIA(me: Perfil) { return me.id + "|" + me.idea + "|" + me.power; }
export function perfilIA(p: Perfil) { return {id: p.id, idea: p.idea || "(sin idea propia, quiere sumarse a la de alguien)", superpoder: p.power, carrera: p.que || ""}; }
export function aplicarIA(me: Perfil, lista: Item[], res: ResIA | null): Item[] {
  if (!res || res.clave !== claveIA(me)) return lista;
  const minIA = Math.min(...[...res.mapa.values()].map(v => v.pct));
  return lista.map(x => {
    const v = res.mapa.get(x.o.id);
    if (v) {
      const razones = (v.razon ? [v.razon] : []).concat(x.r.razones.filter(t => !t.startsWith("Podrían"))).slice(0, 3);
      return {o: x.o, r: {...x.r, pct: v.pct, razones, rompe: v.rompe, ia: true}};
    }
    if (res.enviados.has(x.o.id)) return {o: x.o, r: {...x.r, pct: Math.min(x.r.pct, Math.max(5, Math.min(minIA - 1, UMBRAL - 1)))}};
    return x;
  }).sort((a, b) => (b.r.pct - a.r.pct) || (b.o.createdAt - a.o.createdAt));
}
export function ordenarMatches(me: Perfil, perfiles: Iterable<Perfil>): Item[] {
  return [...perfiles].filter(o => o.id !== me.id).map(o => ({o, r: analizar(me, o)}))
    .sort((x, y) => (y.r.pct - x.r.pct) || (y.o.createdAt - x.o.createdAt));
}

/* ---------- clave para encontrarse ---------- */
const CLAVES_ENC = ["MANGO","COCO","PALMA","CIBAO","CARIBE","BACHATA","MERENGUE","GUAYABA","CAFÉ","LAMBÍ","SOL","LUNA","YUCA","CACAO","GÜIRA","TAMBORA"];
export function claveMatch(a: string, b: string) { const k = [a, b].sort().join("|"); const h = hash(k); return CLAVES_ENC[h % CLAVES_ENC.length] + "-" + (10 + (Math.floor(h / 7) % 90)); }
export const sinComillas = (t: string) => t.replace(/^[“"]|[”"]$/g, "");
