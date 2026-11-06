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
export type Conexion = { teAyuda: string; leAyudas: string; paso: string; tipo: "doble" | "una"; texto?: string };
export type Analisis = { pct: number; a: number[]; b: number[]; razones: string[]; rompe?: string; conexion?: Conexion; ia?: boolean };
export type Item = { o: Perfil; r: Analisis };

/** sal: otra forma de decir lo mismo (la usa ordenarMatches para no repetir frases en tu lista). */
export function analizar(me: Perfil | null, o: Perfil | null, sal = 0): Analisis {
  if (!me || !o || me.id === o.id) return {pct: 0, a: [], b: [], razones: []};
  const a = me.needs.filter(x => o.powers.includes(x));
  const b = o.needs.filter(x => me.powers.includes(x));
  // kwA: su superpoder habla de lo mismo que tu idea. kwB: tu superpoder, de lo mismo que su idea.
  const kwA = comunes(pal(me, "idea"), pal(o, "power")), kwB = comunes(pal(o, "idea"), pal(me, "power"));
  const kw = [...new Set(kwA.concat(kwB))];
  const distinto = o.powers.filter(x => !me.powers.includes(x));
  const mismoPoder = o.powers.length > 0 && !distinto.length;
  // Un poquito al azar (fijo para cada pareja) para que no haya tantos empates.
  let pts = hash([me.id, o.id].sort().join("|")) % 6;
  if (me.idea) {
    // Lo más importante es que su superpoder le sirva a TU idea; que tú le sirvas a la suya suma menos.
    // Las necesidades de tu idea van en orden de importancia: cubrir la primera vale más.
    a.forEach(x => { pts += PESO_NECESIDAD[me.needs.indexOf(x)] ?? 10; });
    if (b.length) pts += 10 + 3 * (b.length - 1);
    if (a.length && b.length) pts += 6;
    pts += Math.min(kwA.length, 3) * 8 + Math.min(kwB.length, 2) * 3;
    if (distinto.length) pts += 8;
    if (mismoPoder) pts -= 15;
    // Si su superpoder no le aporta nada a tu idea, no puede ser un gran match.
    if (!a.length && !kwA.length) pts = Math.min(pts, UMBRAL - 2);
  } else {
    // Sin sueño propio ("te sumas al de alguien"): tu match es la persona a cuyo sueño le sirve tu
    // superpoder. Se mide igual que desde su lado: cuánto cubres de lo que a su sueño le falta.
    b.forEach(x => { pts += PESO_NECESIDAD[o.needs.indexOf(x)] ?? 10; });
    pts += Math.min(kwB.length, 3) * 8;
    if (me.powers.some(x => !o.powers.includes(x))) pts += 8;
    if (me.powers.length > 0 && me.powers.every(x => o.powers.includes(x))) pts -= 15;
    // Si no tiene sueño, o tu superpoder no le sirve, no hay a qué sumarse.
    if (!o.idea || (!b.length && !kwB.length)) pts = Math.min(pts, UMBRAL - 2);
  }
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
  return {pct, a, b, razones, rompe, conexion: conexionBasica(me, o, aT, b, kwA, kwB, sal)};
}

/* En qué se pueden ayudar, dicho de forma general (por área). Los detalles los hablan ellos en persona. */
const AYUDA_GENERAL: Record<number, string> = {
  1: "la parte de tecnología", 2: "el diseño", 3: "la comunicación y el contenido", 4: "las ventas y el marketing",
  5: "los números y el dinero", 6: "la organización", 7: "la parte de enseñar y explicar", 8: "la salud y el bienestar",
  9: "la comunidad", 10: "la parte de construir y armar", 11: "la investigación y los datos", 12: "lo legal y los trámites"
};

/* Qué tipo de ayuda da cada área, dicho en general (va después de "te puede ayudar a").
   Varias formas por área, para que dos matches de la misma área no digan lo mismo. */
const AYUDA_DETALLE: Record<number, string[]> = {
  1: ["convertirlo en algo que la gente pueda usar, como una app, una página o un sistema", "llevarlo a la tecnología para que funcione solo y llegue a más gente", "resolver la parte técnica que hoy le falta"],
  2: ["que tu sueño se vea bien y se entienda a primera vista", "darle una imagen clara y atractiva", "que la gente lo vea y lo entienda sin explicaciones"],
  3: ["contar tu sueño de una forma que la gente entienda y se entusiasme", "comunicar bien lo que quieres lograr", "encontrar las palabras para que más gente se sume"],
  4: ["darlo a conocer y conseguir a las primeras personas que lo usen", "llegar a la gente correcta y que lo prueben", "venderlo y hacer que se hable de él"],
  5: ["poner los números en orden: cuánto cuesta, cómo se paga y cómo se sostiene", "que salgan las cuentas y no pierda dinero", "pensar cómo financiarlo y hacerlo sostenible"],
  6: ["organizar el plan, los pasos y a la gente para que avance", "ordenar las tareas para que no se quede a medias", "convertir la idea en un plan con pasos claros"],
  7: ["explicar y enseñar lo que hace falta para que más gente se sume", "que otros lo entiendan y puedan aprenderlo", "formar a las personas que lo van a llevar adelante"],
  8: ["cuidar la salud y el bienestar de quienes participen", "que lo que haga sea bueno para la salud de la gente", "cuidar a las personas en cada paso"],
  9: ["conectarlo con la comunidad y con la gente que lo necesita", "que la comunidad lo sienta suyo y lo apoye", "llegar a las personas que más lo necesitan"],
  10: ["construir y armar lo que haga falta para hacerlo realidad", "pasar del papel a algo que se pueda tocar", "armar lo físico que tu sueño necesita"],
  11: ["entender mejor a la gente y decidir con datos", "medir lo que funciona y lo que no", "conocer bien a quién va dirigido antes de invertir"],
  12: ["ponerlo en regla: permisos, registros y la parte legal", "evitar problemas legales desde el principio", "tener los papeles y permisos en orden"]
};
/* La misma ayuda, pero para el sueño de la otra persona ("tu idea" -> "su idea"). */
const paraSu = (t: string) => t.replace(/(^|[^a-záéíóúñ])tu(?=[^a-záéíóúñ]|$)/gi, "$1su");

/* Matices: dentro de un área, la ayuda cambia según lo que la persona sabe hacer de verdad.
   Así cada match dice algo distinto (sin repetir su superpoder). Se busca en su superpoder sin tildes. */
const MATICES: [number, RegExp, string][] = [
  [1, /flutter|movil|android|iphone|swift|kotlin|apps? movil/, "crear una app para que la gente lo use desde el celular"],
  [1, /videojuego|unity|juego/, "hacerlo interactivo y divertido, como un juego que engancha"],
  [1, /arduino|sensor|iot|hardware/, "armar aparatos o sensores que lo hagan funcionar en la vida real"],
  [1, /soporte|computadora|tecnico/, "tener los equipos y la tecnología funcionando sin dolores de cabeza"],
  [1, /blockchain|cripto/, "explorar pagos y registros digitales seguros"],
  [1, /segur|fallas|vulnerab/, "que lo que construyas sea seguro y la gente confíe en usarlo"],
  [1, /inteligencia artificial|chatbot|modelos?|\bbots?\b/, "sumarle inteligencia artificial o un asistente que trabaje solo"],
  [1, /backend|apis?\b|bases? de datos|servidor|nube|devops|desplieg/, "armar lo que no se ve: los datos, los servidores y que todo funcione sin caerse"],
  [1, /react|frontend|pagina|web|wordpress|shopify|tienda/, "tener una página o tienda en línea donde la gente lo encuentre y lo use"],
  [1, /prueb|errores|qa\b|tester/, "que todo funcione bien antes de mostrárselo al mundo"],
  [1, /automatiz|zapier|make\b/, "automatizar las tareas repetitivas para que avance más rápido"],
  [11, /datos|python|sql|power bi|analiz|estadist/, "entender lo que pasa con datos y decidir con evidencia, no a ojo"],
  [11, /encuesta|estudio de mercado|investig/, "saber qué quiere de verdad la gente antes de invertir tiempo y dinero"],
  [10, /arduino|sensor|iot|hardware|prototipo|maqueta/, "construir un prototipo que funcione en el mundo real"],
  [10, /electric|instalac/, "resolver la parte eléctrica y las instalaciones"],
  [10, /repar|manten/, "reparar y mantener los equipos para que nada se detenga"],
  [10, /construy|cocin|cos[eu]|manual/, "construir con sus manos lo que tu sueño necesite"],
  [2, /ux|ui\b|interfa|figma|usabil/, "que sea fácil y agradable de usar desde el primer día"],
  [2, /presentac/, "presentarlo con materiales que se vean profesionales y convenzan"],
  [2, /flyer|publicacion|redes/, "tener publicaciones que se vean profesionales en redes"],
  [2, /interior|espacio|3d|modelado/, "imaginar y diseñar el espacio o el producto antes de construirlo"],
  [2, /ropa|moda/, "darle un estilo propio que la gente quiera llevar"],
  [2, /logo|marca|identidad|branding/, "darle una marca e imagen que la gente recuerde"],
  [2, /foto|video|anim|ilustr/, "mostrarlo con imágenes que llamen la atención"],
  [3, /video|tiktok|contenido|youtube|grab/, "crear contenido que haga que la gente hable de tu sueño"],
  [3, /habl|present|publico|locu/, "presentarlo con seguridad frente a cualquier público"],
  [3, /escrib|guion|redact|propuesta|periodis/, "ponerlo en palabras claras: textos, guiones o propuestas que convenzan"],
  [4, /b2b|empresas|cierr|acuerdo|vend|venta|clientes/, "conseguir los primeros clientes y cerrar las primeras ventas"],
  [4, /redes|instagram|community|comunidad|seguidores|influen/, "construir una comunidad en redes alrededor de tu sueño"],
  [4, /anuncio|publicidad|marketing digital|growth|usuarios|seo|lanz/, "llegar a mucha gente y conseguir a los primeros usuarios"],
  [5, /patrocin|inversion|inversionistas|fondos|subvenc/, "conseguir el dinero para arrancar: patrocinadores, inversión o fondos"],
  [5, /proveedor/, "conseguir buenos proveedores y mejores precios"],
  [5, /excel|contab|cuentas/, "llevar las cuentas claras y los números en orden"],
  [5, /modelo de negocio|plan de negocio|negocio/, "convertirlo en un negocio que se sostenga solo"],
  [5, /presupuest|proyecc|costos|precios|finanz|econom/, "saber cuánto cuesta y ponerle precio sin perder dinero"],
  [5, /administr/, "administrarlo bien desde el día uno"],
  [6, /scrum|producto|prioridad|gestion|proyecto/, "ordenar las prioridades y avanzar paso a paso sin perderse"],
  [6, /evento|logist|entreg/, "organizar la logística para que todo llegue a tiempo"],
  [6, /voluntari|equipo|lider|motiv|operacion/, "armar y coordinar un equipo que empuje en la misma dirección"],
  [7, /mentor/, "tomar mejores decisiones con la guía de alguien que ya pasó por ahí"],
  [7, /curso|taller|clase|ensen|explic|profe/, "convertirlo en algo que otros puedan aprender fácil"],
  [12, /contrato|termino|proteccion de datos/, "cuidar los contratos y la protección de datos desde el principio"],
  [12, /registr|marca|permiso|tramit/, "registrar la marca y tener los permisos en regla"]
];
/* Varias formas de empezar la frase, para que los matches no suenen todos iguales. */
const ENTRADAS = [
  (g: string) => `Su superpoder encaja con ${g} de tu sueño.`,
  (g: string) => `Es una buena conexión para ${g} de tu sueño.`,
  (g: string) => `Puede aportar mucho en ${g} de tu sueño.`,
  (g: string) => `Tu sueño necesita ${g}, y esta persona sabe de eso.`,
  (g: string) => `Lo que sabe hacer sirve justo para ${g} de tu sueño.`,
  (g: string) => `En ${g} de tu sueño, esta persona tiene mucho que aportar.`
];
/* Cómo sigue la segunda frase. */
const PUENTES = ["Te puede ayudar a", "Puede ayudarte a", "Con su experiencia, te puede ayudar a"];
/* Cuando quien mira es el que ayuda: las mismas ideas, hablando del sueño de la otra persona. */
const ENTRADAS_SU = [
  (g: string) => `Tu superpoder encaja con ${g} de su sueño.`,
  (g: string) => `Su sueño necesita ${g}, y tú sabes de eso.`,
  (g: string) => `Puedes aportar mucho en ${g} de su sueño.`,
  (g: string) => `Lo que sabes hacer sirve justo para ${g} de su sueño.`,
  (g: string) => `Es una buena conexión para ${g} de su sueño.`
];
const PUENTES_SU = ["Le puedes ayudar a", "Puedes ayudarle a", "Con tu experiencia, le puedes ayudar a"];
const elegir = <T,>(lista: T[], semilla: string, parte: string) => lista[hash(parte + "|" + semilla) % lista.length];

/** La ayuda de alguien, según su superpoder: primero en el área que tu sueño necesita, si no en cualquiera. */
function matiz(p: Perfil, areas: number[], h: string): [number, string] {
  const n = norm(p.power);
  for (const a of areas) { const m = MATICES.find(([ar, re]) => ar === a && re.test(n)); if (m) return [a, m[2]]; }
  return [areas[0], elegir(AYUDA_DETALLE[areas[0]], h, "detalle")];
}

/* El método básico (sin IA) dice en qué se pueden ayudar, sin entrar en detalles. */
function conexionBasica(me: Perfil, o: Perfil, aT: number[], b: number[], kwA: string[], kwB: string[], sal = 0): Conexion | undefined {
  let teAyuda = "", leAyudas = "";
  if (me.idea && aT.length) teAyuda = `Su superpoder te puede ayudar con ${AYUDA_GENERAL[aT[0]]} de tu sueño.`;
  else if (me.idea && kwA.length) teAyuda = "Su superpoder tiene que ver con lo que necesita tu sueño.";
  if (o.idea && b.length) leAyudas = `Tu superpoder le puede ayudar con ${AYUDA_GENERAL[b[0]]} de su sueño.`;
  else if (o.idea && kwB.length) leAyudas = "Tu superpoder tiene que ver con lo que necesita su sueño.";
  if (!teAyuda && !leAyudas) return undefined;
  // La respuesta que se muestra: cómo te ayuda a ti. Solo si esa persona no te aporta (o no tienes sueño), cómo ayudas tú.
  let texto: string;
  if (me.idea && aT.length) {
    // Las palabras dependen de su superpoder y de tu sueño: así varían de un match a otro,
    // pero la misma pareja siempre lee lo mismo (en su celular y en la pantalla de la presentadora).
    const h = norm(o.power) + "|" + norm(me.idea) + "|" + sal;
    const [area, ayuda] = matiz(o, aT, h);
    texto = `${elegir(ENTRADAS, h, "entrada")(AYUDA_GENERAL[area])} ${elegir(PUENTES, h, "puente")} ${ayuda}.`;
  } else if (teAyuda) {
    texto = "Sabe de lo mismo que necesita tu sueño. Es una buena persona para pedirle consejo y dar el primer paso.";
  } else if (o.idea && b.length) {
    const h = norm(me.power) + "|" + norm(o.idea) + "|" + sal;
    const [area, ayuda] = matiz(me, b, h);
    texto = `${elegir(ENTRADAS_SU, h, "entrada")(AYUDA_GENERAL[area])} ${elegir(PUENTES_SU, h, "puente")} ${paraSu(ayuda)}.`;
  } else {
    texto = "Tu superpoder tiene que ver con su sueño. Le puedes dar tu mirada y tus consejos para arrancar.";
  }
  return {teAyuda, leAyudas, paso: "", tipo: teAyuda && leAyudas ? "doble" : "una", texto};
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
  const lista = [...perfiles].filter(o => o.id !== me.id).map(o => ({o, r: analizar(me, o)}))
    .sort((x, y) => (y.r.pct - x.r.pct) || (y.o.createdAt - x.o.createdAt));
  // En tu lista no se repite ninguna frase: si una ya salió más arriba, se dice de otra forma.
  const vistas = new Set<string>();
  for (const x of lista) {
    if (x.r.pct < UMBRAL) continue;
    for (let sal = 1; sal <= 8 && x.r.conexion?.texto && vistas.has(x.r.conexion.texto); sal++) x.r = analizar(me, x.o, sal);
    if (x.r.conexion?.texto) vistas.add(x.r.conexion.texto);
  }
  return lista;
}

/** Una pareja: «suena» es la persona cuyo sueño recibe ayuda; «ayuda», la del superpoder. */
export type Pareja = { suena: Perfil; ayuda: Perfil; pct: number; doble: boolean; r: Analisis };

/** Todas las parejas con match (ordenadas de mejor a peor) y las n mejores sin repetir personas. */
export function mejoresParejas(perfiles: Perfil[], n: number): { total: number; top: Pareja[] } {
  const lista: Pareja[] = [];
  for (let i = 0; i < perfiles.length; i++) for (let j = i + 1; j < perfiles.length; j++) {
    const a = perfiles[i], b = perfiles[j];
    const rab = analizar(a, b), rba = analizar(b, a), ab = rab.pct, ba = rba.pct;
    if (Math.max(ab, ba) < UMBRAL) continue;
    lista.push(ab >= ba ? {suena: a, ayuda: b, pct: ab, doble: ba >= UMBRAL, r: rab} : {suena: b, ayuda: a, pct: ba, doble: ab >= UMBRAL, r: rba});
  }
  lista.sort((x, y) => y.pct - x.pct);
  const usados = new Set<string>(), frases = new Set<string>(), top: Pareja[] = [];
  for (const x of lista) {
    if (top.length >= n) break;
    if (usados.has(x.suena.id) || usados.has(x.ayuda.id)) continue;
    // El texto de la pareja es el mismo que esa persona ve en su lista.
    const mio = ordenarMatches(x.suena, perfiles).find(y => y.o.id === x.ayuda.id);
    if (mio) x.r = mio.r;
    // Tampoco repite la frase: si ya salió, pasa a la siguiente mejor pareja.
    const t = x.r.conexion?.texto;
    if (t && frases.has(t)) continue;
    if (t) frases.add(t);
    usados.add(x.suena.id); usados.add(x.ayuda.id); top.push(x);
  }
  return {total: lista.length, top};
}

export const sinComillas = (t: string) => t.replace(/^[“"]|[”"]$/g, "");
