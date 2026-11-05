/* Lógica del match, igual que en el index.html original (legacy/index.html).
   Se usa en el navegador y en el servidor (limpiar valida lo que llega a la API). */

export const AREAS = ["Tecnología","Diseño y arte","Comunicación","Ventas y marketing","Negocios y finanzas","Liderazgo y organización","Educación","Salud y bienestar","Impacto social","Hacer con las manos","Investigación","Legal y trámites"];
export const area = (v: number) => AREAS[v - 1] || "";
export const CLAVES: Record<number, string[]> = {
  1:["program","codig","software","app","aplicacion","web","desarroll","react","python","java","flutter","tecnolog","sistemas","base de datos","bases de datos","inteligencia artificial","automatiz","ciberseg","segurid","computad","plataforma"],
  2:["disen","logo","ilustr","dibuj","arte","artist","foto","ux","ui","interfa","pint","music","animac","moda","decor"],
  3:["escrib","redact","comunic","hablo","hablar","publico","present","video","podcast","contenido","edit","locu","period","tiktok","youtube","guion","guiones","cuento","historia"],
  4:["vend","venta","market","mercad","publicid","marca","cliente","redes","anunc","promo","crecer cuentas","influen","instagram"],
  5:["negoci","finanz","contab","dinero","invers","presupuest","empren","excel","administr","econom","ahorr","patrocin","costos","precios","fondos"],
  6:["organiz","lider","coordin","gestion","equipo","evento","planific","logist","proyecto","convenz","motiv"],
  7:["ensen","educ","tutor","clase","explic","profe","capacit","mentor","taller","aprend","dinamic"],
  8:["salud","psicol","nutri","deport","entren","medic","enferm","bienestar","yoga","fisio","emocional","estres","escucho"],
  9:["comunidad","social","volunt","ong","fundaci","ambient","recicl","inclus","barrio","accesib"],
  10:["constru","repar","arregl","maqueta","planos","electric","carpint","cocin","coser","costur","manualid","mecan","fabric","impresion 3d","hardware","solda","prototip","arduino","herramient"],
  11:["investig","datos","analiz","analisis","estadist","encuest","cienci","estudio"],
  12:["legal","ley","leyes","abogad","derecho","contrato","tramit","registr","permiso","impuest"]
};
export const norm = (t: string) => String(t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const CLAVES_RE = Object.entries(CLAVES).map(([v, arr]) => [+v, new RegExp("(^|[^a-z0-9])(" + arr.join("|") + ")")] as const);
/* Frases que engañan a las palabras clave: "redes sociales" no es impacto social, "estudio psicología" es
   psicología (no investigación) y
   "registrar tu marca" es un trámite, no mercadeo. */
const preparar = (t: string) => norm(t).replace(/^(yo\s+)?estudi[oa]\s+/, "").replace(/redes sociales/g, "redes").replace(/entren\w*\s+(?=modelos|redes neuronales|inteligencia|ia)/g, "")
  .replace(/(registr\w*)\s+((tu|su|el|la|mi)\s+)?(negocio|marca|empresa)(\s+y\s+((tu|su|el|la|mi)\s+)?(negocio|marca|empresa))?/g, "$1");
export function inferir(t: string) { const n = preparar(t); return CLAVES_RE.filter(([, re]) => re.test(n)).map(([v]) => v); }
/** El núcleo de un superpoder, sin el contexto que va después de "para" o "en"
    (si lo de antes ya dice qué sabe hacer). */
export function nucleo(t: string) {
  const n = preparar(t).replace(/disen\w*\s+(de\s+)?(?=dinamic|actividad|juego|taller|clase|curso)/g, "");
  const antes = n.split(/\s+(?:para|en)\s+/)[0];
  return antes !== n && CLAVES_RE.some(([, re]) => re.test(antes)) ? antes : n;
}
/* Áreas de un superpoder, de la principal a la secundaria (en el orden en que aparecen),
   mirando solo su núcleo. Lo que va después de "para" suele ser el contexto, no la habilidad:
   "Diseño flyers para eventos" es diseño, no organización de eventos.
   Lo mismo con "en": "Encuentro fallas en apps" no es programar apps. */
export function inferirPoder(t: string) {
  const n = nucleo(t);
  return CLAVES_RE.map(([v, re]) => [v, n.search(re)] as const).filter(([, i]) => i >= 0).sort((x, y) => x[1] - y[1]).map(([v]) => v);
}
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
  const powers = inferirPoder(power);
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
export function nombre(p: Perfil) { return esAnon(p) ? "Persona anónima" : p.alias; }
export function iniciales(p: Perfil) { const w = p.alias.split(/\s+/).filter(Boolean); if (!w.length) return "?"; return (w[0][0] + (w.length > 1 ? w[w.length - 1][0] : "")).toUpperCase(); }
export const colorDe = (p: Perfil) => p.color || COLORES[hash(p.id) % COLORES.length];

const STOP = new Set("para como esta este estos estas desde donde cuando sobre entre hacer tengo tiene quiero puedo nuestra nuestro todos todas pero porque mucho muchos mejor gente cosas algo".split(" "));
// Singular y plural cuentan igual: "apps" y "app" son la misma palabra.
const CORTAS = new Set(["app", "web", "bot", "api", "ia"]);
function palabras(t: string) { return new Set(norm(t).split(/[^a-z0-9ñ]+/).map(w => w.length > 4 ? w.replace(/(es|s)$/, "") : w.replace(/s$/, "")).filter(w => (w.length > 3 || CORTAS.has(w)) && !STOP.has(w))); }
const PAL_CACHE = new Map<string, Set<string>>();
function pal(p: Perfil, campo: "idea" | "power") { const k = p.id + "|" + campo + "|" + p[campo]; let w = PAL_CACHE.get(k); if (!w) { w = palabras(campo === "power" ? nucleo(p.power) : p.idea); PAL_CACHE.set(k, w); } return w; }
function comunes(a: Set<string>, b: Set<string>) { const out: string[] = []; a.forEach(w => { if (b.has(w)) out.push(w); }); return out; }

/* Qué puede hacer de verdad alguien de cada área por una idea, dicho como lo diría un joven.
   puede: "Ana puede ___ para tu idea". pedir: "¿Me ayudarías a ___?" */
const ACCIONES: Record<number, {puede: string; pedir: string}> = {
  1: {puede: "armarte la parte digital: la app, la página o el formulario que haga falta", pedir: "armar la parte digital (la app, la página o el formulario)"},
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
/* Acciones más precisas según lo que la persona escribió (ganan sobre las generales del área). */
const PRECISAS: [number, RegExp, {puede: string; pedir: string}][] = [
  [10, /planos|maqueta/, {puede: "dibujarte el plano del lugar para saber dónde va cada cosa", pedir: "dibujar el plano del lugar"}],
  [2, /foto/, {puede: "tomar las fotos del día para que se vea bien en redes", pedir: "tomar las fotos del día"}],
  [3, /guion|hablo|hablar|public|present/, {puede: "presentar el día y escribir lo que se va a decir", pedir: "presentar o escribir el guion"}],
  [5, /patrocin/, {puede: "conseguirte patrocinadores que cubran parte de los gastos", pedir: "conseguir patrocinadores"}],
  [7, /dinamic/, {puede: "prepararte dinámicas para que la gente se suelte y participe", pedir: "preparar unas dinámicas para que la gente participe"}],
  [12, /registr|marca|negocio/, {puede: "ayudarte a registrar el nombre y sacar los permisos que hagan falta", pedir: "registrar el nombre y sacar los permisos"}]
];
function accion(p: Perfil, v: number) { const n = norm(p.power); return PRECISAS.find(([a, re]) => a === v && re.test(n))?.[2] ?? ACCIONES[v]; }
/* Lo que a una idea le falta, según el área que la otra persona cubre. */
const FALTA: Record<number, string> = {
  1: "alguien que arme la parte digital", 2: "alguien que la haga verse bien", 3: "alguien que la cuente y la presente",
  4: "alguien que la mueva en redes", 5: "alguien que maneje el dinero", 6: "alguien que organice y coordine a la gente",
  7: "alguien que la enseñe fácil", 8: "alguien que cuide la salud de quienes participen", 9: "alguien que conecte con la comunidad",
  10: "alguien que construya lo que haga falta", 11: "alguien que investigue y saque datos", 12: "alguien que se encargue de los permisos"
};
/* "Un club de lectura en los parques" -> "un club de lectura en los parques" (sin punto final). */
const enFrase = (t: string) => (t.charAt(0).toLowerCase() + t.slice(1)).replace(/[.\s]+$/, "");

export const UMBRAL = 40;
const PESO_NECESIDAD = [50, 24, 14, 8];
/* Cómo se pueden ayudar dos personas (el formato que se acordó en la reunión del 5 de nov):
   qué hace la otra persona por tu sueño, qué haces tú por el suyo y un primer paso para hoy.
   Si en una dirección no hay ayuda, ese texto queda vacío y el tipo es "una" (una vía). */
export type Conexion = { teAyuda: string; leAyudas: string; paso: string; tipo: "doble" | "una" };
export type Analisis = { pct: number; a: number[]; b: number[]; razones: string[]; rompe?: string; conexion?: Conexion; ia?: boolean };
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
  // Las razones citan lo que cada uno escribió: su idea, su superpoder y lo que a tu idea le falta.
  const aT = [...a].sort((x, y) => o.powers.indexOf(x) - o.powers.indexOf(y));
  const dijo = esAnon(o) ? "Esta persona dijo" : quien + " dijo";
  if (aT.length && me.idea) {
    const falta = aT.slice(0, 2).map(v => FALTA[v]);
    razones.push(`Tu sueño es ${enFrase(me.idea)}. Para lograrlo te hace falta ${falta.join(" y ")}.`);
    razones.push(`${dijo} que su superpoder es «${o.power}». Eso es justo lo que te falta.`);
  } else if (kwA.length && me.idea) {
    razones.push(`${dijo} que su superpoder es «${o.power}», y habla de lo mismo que tu sueño: ${kwA.slice(0, 2).join(" y ")}.`);
  }
  if (b.length) razones.push(o.idea
    ? `Y tú también le sirves: su sueño es ${enFrase(o.idea)}, y tu superpoder («${me.power}») le ayuda con eso.`
    : `Y tú también le sirves: tu superpoder («${me.power}») le puede ayudar.`);
  if (!razones.length && me.idea && distinto.length) razones.push(`${dijo} que su superpoder es «${o.power}», algo que tú no cubres.`);
  if (mismoPoder && razones.length) razones.push("Ojo: los dos saben hacer lo mismo, así que entre ustedes no se completan tanto.");
  if (!razones.length) razones.push("Podrían complementarse si conversan.");
  // Una primera pregunta para empezar a hablar.
  const rompe = aT.length && me.idea
    ? `¿Me ayudarías a ${accion(o, aT[0]).pedir}? Mi sueño es ${enFrase(me.idea)}.`
    : (b.length && o.idea ? `Vi que tu sueño es ${enFrase(o.idea)}. ¿Qué te falta? Yo te puedo ${accion(me, b[0]).pedir.replace(/^(\S+)/, "ayudar a $1")}.` : undefined);
  return {pct, a, b, razones, rompe, conexion: conexionBasica(me, o, aT, b, kwA, kwB)};
}

/* El método básico (sin IA) también dice cómo se ayudan, no solo qué escribió cada uno. */
function conexionBasica(me: Perfil, o: Perfil, aT: number[], b: number[], kwA: string[], kwB: string[]): Conexion | undefined {
  const quien = esAnon(o) ? "Esta persona" : o.alias.split(/\s+/)[0];
  // "diseñarte el logo" -> "diseñarle el logo": la misma acción, pero para la otra persona.
  const paraEl = (t: string) => t.replace(/^(\S+?)te\b/, "$1le");
  let teAyuda = "", leAyudas = "";
  if (me.idea && aT.length) teAyuda = `${quien} puede ${accion(o, aT[0]).puede}.`;
  else if (me.idea && kwA.length) teAyuda = `${quien} sabe de lo mismo que necesita tu sueño: te puede orientar y decirte por dónde empezar.`;
  if (o.idea && b.length) leAyudas = `Tú puedes ${paraEl(accion(me, b[0]).puede)}.`;
  else if (o.idea && kwB.length) leAyudas = "Lo que tú sabes hacer tiene que ver con su sueño: le puedes dar tu opinión y tus consejos.";
  if (!teAyuda && !leAyudas) return undefined;
  const doble = !!(teAyuda && leAyudas);
  const paso = doble
    ? "Escríbele por el chat, búsquense y en 5 minutos cuéntense qué le falta a cada sueño."
    : teAyuda
      ? "Escríbele por el chat y pídele 5 minutos para contarle tu sueño y lo que te falta."
      : "Escríbele por el chat y ofrécele tu ayuda con su sueño: son 5 minutos.";
  return {teAyuda, leAyudas, paso, tipo: doble ? "doble" : "una"};
}

/* El match es "al revés" cuando tú le sirves a su idea pero su superpoder no le aporta a la tuya. */
export const alReves = (me: Perfil, r: Analisis) => !!me.idea && r.a.length === 0 && r.b.length > 0;

/* ---------- IA ---------- */
export type ResIA = { clave: string; enviados: Set<string>; mapa: Map<string, {pct: number; conexion: Conexion; rompe: string}>; consejo: string };
export function claveIA(me: Perfil) { return me.id + "|" + me.idea + "|" + me.power; }
export function aplicarIA(me: Perfil, lista: Item[], res: ResIA | null): Item[] {
  if (!res || res.clave !== claveIA(me)) return lista;
  const minIA = Math.min(...[...res.mapa.values()].map(v => v.pct));
  return lista.map(x => {
    const v = res.mapa.get(x.o.id);
    if (v) return {o: x.o, r: {...x.r, pct: v.pct, conexion: v.conexion, rompe: v.rompe || x.r.rompe, ia: true}};
    if (res.enviados.has(x.o.id)) return {o: x.o, r: {...x.r, pct: Math.min(x.r.pct, Math.max(5, Math.min(minIA - 1, UMBRAL - 1)))}};
    return x;
  }).sort((a, b) => (b.r.pct - a.r.pct) || (b.o.createdAt - a.o.createdAt));
}
export function ordenarMatches(me: Perfil, perfiles: Iterable<Perfil>): Item[] {
  return [...perfiles].filter(o => o.id !== me.id).map(o => ({o, r: analizar(me, o)}))
    .sort((x, y) => (y.r.pct - x.r.pct) || (y.o.createdAt - x.o.createdAt));
}

export const sinComillas = (t: string) => t.replace(/^[“"]|[”"]$/g, "");
