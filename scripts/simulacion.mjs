// Simulación del Mapa de Sueños con 100 personas ficticias (evento de tecnología/networking en RD).
// Usa el algoritmo REAL de la app (lib/match.ts, el método básico sin IA).
//
//   node --no-warnings scripts/simulacion.mjs
//
// Lo que sale del algoritmo (matches, doble vía, una vía) es cálculo real sobre estos perfiles.
// Lo que depende de la gente (cuántos escanean, terminan el formulario o se acercan) son SUPUESTOS:
// están en SUPUESTOS, abajo, para ajustarlos con los datos reales después del evento.
const { analizar, limpiar, ordenarMatches, UMBRAL } = await import("../lib/match.ts");

const SUPUESTOS = {
  escanean: 0.80,      // de los que están en el salón, escanean el QR
  completan: 0.88,     // de los que escanean, terminan el formulario
  seAcercan: {doble: 0.70, una: 0.50, sin: 0.15},  // se acercan a alguien según lo que les salió
  iteraciones: 200
};

// Semilla fija: la simulación da siempre los mismos números.
let semilla = 20261106;
const azar = () => { semilla = (Math.imul(semilla, 1664525) + 1013904223) >>> 0; return semilla / 2 ** 32; };
const barajar = a => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(azar() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

const SUENOS = [
  "Una app para que los colmados lleven el fiado en el celular", "Un mapa de los apagones por sector con reportes de la gente",
  "Una plataforma de pasantías para estudiantes de universidades públicas", "Un bot de WhatsApp que avise cuándo pasa la guagua",
  "Una tienda en línea de artesanías de Higüey y Samaná", "Un podcast sobre emprendedores de los barrios",
  "Una academia de programación gratis para jóvenes de Los Alcarrizos", "Una feria de tecnología en Santiago para liceos",
  "Una marca de chocolate con cacao de San Francisco de Macorís", "Una app para buscar médicos que acepten mi seguro",
  "Un canal de YouTube que explique finanzas personales en dominicano", "Un hackatón de soluciones para el tránsito en Santo Domingo",
  "Una cooperativa digital para motoconchistas", "Un programa de reciclaje en las escuelas del barrio",
  "Talleres de ciberseguridad para adultos mayores", "Una agencia de diseño para pequeños negocios",
  "Una plataforma para vender comida casera por encargo", "Un festival de música urbana con artistas nuevos",
  "Un sistema de turnos para las clínicas rurales", "Una red de tutorías de matemáticas entre estudiantes",
  "Una app de remesas más baratas para la diáspora", "Un huerto comunitario con riego automático",
  "Una revista digital de turismo interno", "Un club de lectura en los parques de la Zona Colonial",
  "Un asistente con inteligencia artificial que ayude a llenar trámites del gobierno", "Una empresa de energía solar para colmados",
  "Un videojuego con historia dominicana", "Una fundación que dé becas de inglés",
  "Una liga de béisbol infantil organizada con una app", "Un mercado en línea para agricultores de Constanza",
  "Una escuela de oficios digitales para madres solteras", "Un documental sobre el carnaval de La Vega",
  "Una app para reportar baches y calles rotas", "Una marca de ropa con diseños taínos",
  "Un servicio de salud mental por chat para jóvenes", "Un coworking en San Pedro de Macorís",
  "Un programa de radio sobre tecnología", "Una plataforma para alquilar herramientas entre vecinos",
  "Un robot que clasifique basura reciclable", "Una campaña para limpiar las playas de Boca Chica",
  "Un curso en línea de Excel para pequeños negocios", "Una app para encontrar parqueo en el centro",
  "Una red de voluntarios para emergencias por huracanes", "Una cafetería que contrate a jóvenes con discapacidad",
  "Un torneo de e-sports universitario", "Un sistema para que los liceos lleven la asistencia por QR",
  "Una empresa de drones para fumigar cultivos", "Un blog de recetas dominicanas saludables",
  "Una tienda de reparación de celulares con garantía", "Una incubadora de startups en el Cibao",
  "Una plataforma de clases de bachata para turistas", "Una app para que los condominios cobren el mantenimiento",
  "Una guía digital de los ríos y montañas de Jarabacoa", "Un laboratorio de impresión 3D en la universidad",
  "Un programa de mentoría para mujeres en tecnología", "Una línea de cosméticos naturales con productos locales",
  "Una plataforma para encontrar trabajo por horas", "Un museo virtual de la historia de Santo Domingo",
  "Una app de nutrición con comida dominicana", "Un evento de networking mensual para freelancers",
  "Un sistema de alerta temprana de inundaciones por sector", "Una marca de café de Barahona para exportar",
  "Un taller de fotografía con celular para jóvenes", "Una plataforma de donaciones para hospitales públicos",
  "Un emprendimiento de delivery en bicicleta", "Un canal de TikTok que enseñe derechos laborales",
  "Una app para aprender inglés con música dominicana"
];

// 100 superpoderes con la mezcla típica de un evento de tecnología: mucha gente técnica.
const PODERES = [
  // Tecnología (25)
  "Programo apps en Flutter", "Desarrollo páginas web con React", "Sé Python y análisis de datos", "Hago bots de WhatsApp",
  "Trabajo en ciberseguridad", "Soy desarrolladora backend con Java", "Armo bases de datos", "Entreno modelos de inteligencia artificial",
  "Programo en JavaScript", "Hago automatizaciones con Zapier", "Soy ingeniero de sistemas", "Desarrollo videojuegos en Unity",
  "Monto tiendas en línea con Shopify", "Encuentro fallas en apps antes de que salgan", "Manejo servidores en la nube", "Programo Arduino y sensores",
  "Hago apps en Kotlin para Android", "Hago páginas web en WordPress", "Doy soporte técnico de computadoras", "Sé SQL y Power BI",
  "Hago chatbots con inteligencia artificial", "Desarrollo APIs", "Programo en Swift para iPhone", "Trabajo con blockchain", "Soy científica de datos",
  // Diseño y arte (12)
  "Diseño logos e identidad de marca", "Hago diseño UX/UI en Figma", "Ilustro y dibujo personajes", "Tomo fotos de producto",
  "Edito video para redes", "Diseño flyers y publicaciones para Instagram", "Hago animaciones 2D", "Diseño interiores",
  "Hago modelado 3D", "Diseño ropa", "Soy fotógrafo de eventos", "Diseño presentaciones que se ven profesionales",
  // Comunicación (10)
  "Escribo textos y guiones", "Hablo en público sin miedo", "Hago contenido para TikTok", "Soy periodista",
  "Hago locución y voz en off", "Redacto propuestas de proyectos", "Cuento historias en video", "Edito podcasts",
  "Traduzco inglés y español", "Presento eventos",
  // Ventas y marketing (12)
  "Vendo lo que sea", "Manejo redes sociales de marcas", "Hago publicidad en Facebook e Instagram", "Sé de marketing digital y SEO",
  "Consigo clientes por LinkedIn", "Creo estrategias de marca", "Trabajo en atención al cliente", "Negocio con proveedores",
  "Hago email marketing", "Soy influencer con 20 mil seguidores", "Organizo lanzamientos de productos", "Vendo por WhatsApp Business",
  // Negocios y finanzas (10)
  "Hago presupuestos y proyecciones", "Soy contadora", "Consigo patrocinadores", "Sé de inversiones",
  "Armo planes de negocio", "Manejo Excel avanzado", "Busco fondos y subvenciones", "Administro pequeños negocios",
  "Sé de costos y precios", "Soy economista",
  // Liderazgo y organización (8)
  "Organizo eventos", "Coordino equipos de voluntarios", "Gestiono proyectos con Scrum", "Motivo equipos y los lidero",
  "Planifico la logística", "Coordino agendas y reuniones", "Organizo comunidades en línea", "Lidero equipos de trabajo",
  // Educación (6)
  "Enseño matemáticas", "Doy talleres para jóvenes", "Soy profesora de inglés", "Explico cosas difíciles de forma fácil",
  "Diseño cursos en línea", "Soy mentor de emprendedores",
  // Salud y bienestar (4)
  "Soy psicóloga", "Soy nutricionista", "Soy entrenador personal", "Estudio enfermería",
  // Impacto social (4)
  "Trabajo con juntas de vecinos y la comunidad", "Soy voluntaria en una ONG", "Sé de medio ambiente y reciclaje", "Trabajo en inclusión de personas con discapacidad",
  // Hacer con las manos (4)
  "Reparo celulares y computadoras", "Construyo prototipos y maquetas", "Soy electricista", "Cocino para eventos",
  // Investigación (3)
  "Hago encuestas y estudios de mercado", "Investigo y analizo datos", "Soy biólogo",
  // Legal y trámites (2)
  "Soy abogada", "Sé de registro de marcas y permisos"
];

const NOMBRES = ["Paola Jiménez", "Luis Peña", "Camila Núñez", "José Almonte", "Yarisa Méndez", "Esteban Gil", "Mariela Rosario", "Kelvin Batista",
  "Scarlet Féliz", "Raúl Cabrera", "Nicole Tavárez", "Gabriel Ureña", "Wendy Polanco", "Jonathan Abreu", "Laura Vásquez", "Carlos De la Cruz",
  "Yomaira Santana", "Edward Rosa", "Pamela Guzmán", "Starlin Reyes", "Rosanna Mejía", "Brayan Castillo", "Massiel Encarnación", "Héctor Marte"];

if (PODERES.length !== 100) throw new Error("Tienen que ser 100 superpoderes y hay " + PODERES.length);

/* Las 100 personas, en el orden en que llegan. 67 tienen sueño y 33 son hacedores (la proporción 2 a 1
   del ejemplo de Piero: 5.000 sueños y 2.500 hacedores). Cerca de la mitad entra anónima. */
const suenos = barajar(SUENOS);
const GENTE = barajar(barajar(PODERES).map((power, i) => {
  const anon = azar() < .5;
  return {power, idea: suenos[i] ?? "", anon, alias: anon ? "" : NOMBRES[i % NOMBRES.length]};
})).map((d, i) => limpiar("p" + String(i + 1).padStart(3, "0"), {...d, createdAt: i + 1}));

/* node scripts/simulacion.mjs guardar  ->  mete estas 100 personas en el evento de hoy, para ver el
   Mapa de Sueños lleno. Son perfiles de ejemplo: se borran con npm run ejemplos:borrar. */
if (process.argv.includes("guardar")) {
  const { PrismaClient } = await import("@prisma/client");
  const db = new PrismaClient();
  const evento = (process.env.EVENTO || "").trim().slice(0, 60) ||
    new Intl.DateTimeFormat("en-CA", {timeZone: "America/Santo_Domingo", year: "numeric", month: "2-digit", day: "2-digit"}).format(new Date());
  for (const [i, p] of GENTE.entries()) {
    const id = "ejemplo-cien-" + String(i + 1).padStart(3, "0");
    const datos = {idea: p.idea, needs: "[]", power: p.power, anon: p.anon, alias: p.anon ? "" : p.alias, que: "", contact: "", likes: "[]", color: "", createdAt: Date.now() + i, evento};
    await db.perfil.upsert({where: {id}, create: {id, ...datos}, update: datos});
  }
  await db.$disconnect();
  console.log(`Listo: ${GENTE.length} personas en el evento ${evento}. Para quitarlas: npm run ejemplos:borrar`);
  process.exit(0);
}

/* Si dos personas empalman y cómo: igual que el Mapa de Sueños (lib/red.ts). */
function empalme(a, b) {
  const ab = analizar(a, b), ba = analizar(b, a);
  if (Math.max(ab.pct, ba.pct) < UMBRAL) return null;
  const bAyuda = !!(ab.conexion?.teAyuda || ba.conexion?.leAyudas), aAyuda = !!(ba.conexion?.teAyuda || ab.conexion?.leAyudas);
  return bAyuda && aAyuda ? "doble" : "una";
}

/* Lo que ve cada persona en la app: su mejor match (el primero de la lista, como en Mis matches). */
function mejorDe(me, gente) {
  const x = ordenarMatches(me, gente)[0];
  if (!x || x.r.pct < UMBRAL) return null;
  return {id: x.o.id, tipo: x.r.conexion?.tipo ?? "una", pct: x.r.pct};
}

function medir(gente) {
  let doble = 0, una = 0;
  for (let i = 0; i < gente.length; i++) for (let j = i + 1; j < gente.length; j++) {
    const t = empalme(gente[i], gente[j]);
    if (t === "doble") doble++; else if (t === "una") una++;
  }
  const mejores = new Map(gente.map(p => [p.id, mejorDe(p, gente)]));
  const conMatch = [...mejores.values()].filter(Boolean);
  const mutuos = gente.filter(p => { const m = mejores.get(p.id); return m && mejores.get(m.id)?.id === p.id; }).length / 2;
  // ¿A cuántas personas les salió la misma persona como mejor match?
  const popular = new Map();
  conMatch.forEach(m => popular.set(m.id, (popular.get(m.id) ?? 0) + 1));
  const masPopular = [...popular.entries()].sort((x, y) => y[1] - x[1]);
  return {
    personas: gente.length, paresDoble: doble, paresUna: una,
    conMatch: conMatch.length, sinMatch: gente.length - conMatch.length,
    sinMatchHacedores: gente.filter(p => !p.idea && !mejores.get(p.id)).length,
    sinMatchConSueno: gente.filter(p => p.idea && !mejores.get(p.id)).length,
    // Hacedores que SÍ le sirven al sueño de alguien (la otra dirección), aunque su pantalla no lo muestre.
    hacedoresQueSirvenAAlguien: gente.filter(p => !p.idea && gente.some(o => o !== p && o.idea && analizar(o, p).pct >= UMBRAL)).length,
    mejorDoble: conMatch.filter(m => m.tipo === "doble").length, mejorUna: conMatch.filter(m => m.tipo !== "doble").length,
    mutuos, masPopular: masPopular.slice(0, 5).map(([id, n]) => ({id, n, poder: gente.find(p => p.id === id).power})),
    popularesDe5oMas: masPopular.filter(([, n]) => n >= 5).length,
    pctPromedio: Math.round(conMatch.reduce((s, m) => s + m.pct, 0) / Math.max(1, conMatch.length))
  };
}

const pct = (n, d) => Math.round(n / d * 100) + "%";
const rango = arr => { const s = [...arr].sort((a, b) => a - b); const q = p => s[Math.min(s.length - 1, Math.floor(p * s.length))]; return {promedio: Math.round(s.reduce((a, b) => a + b, 0) / s.length), p10: q(.1), p90: q(.9)}; };

/* 1. Todos los 100 completan el perfil (el mejor caso). */
const total = medir(GENTE);

/* 2. Orden de llegada: quien llega temprano busca su match cuando todavía hay poca gente. */
let conMatchAlLlegar = 0;
const llegada = [];
GENTE.forEach((p, i) => {
  const m = mejorDe(p, GENTE.slice(0, i + 1));
  if (m) conMatchAlLlegar++;
  if ((i + 1) % 10 === 0) llegada.push({llegaron: i + 1, conMatchHastaAhora: conMatchAlLlegar});
});

/* 3. Embudo con abandono (supuestos), repetido muchas veces para ver el rango. */
const S = SUPUESTOS, it = {escanean: [], completan: [], conMatch: [], mejorDoble: [], seAcercan: [], sinMatch: []};
for (let k = 0; k < S.iteraciones; k++) {
  const escanean = GENTE.filter(() => azar() < S.escanean);
  const completan = escanean.filter(() => azar() < S.completan);
  const mejores = completan.map(p => mejorDe(p, completan));
  const acercan = mejores.filter(m => azar() < (m ? S.seAcercan[m.tipo === "doble" ? "doble" : "una"] : S.seAcercan.sin)).length;
  it.escanean.push(escanean.length); it.completan.push(completan.length);
  it.conMatch.push(mejores.filter(Boolean).length); it.sinMatch.push(mejores.filter(m => !m).length);
  it.mejorDoble.push(mejores.filter(m => m?.tipo === "doble").length); it.seAcercan.push(acercan);
}

const res = {
  supuestos: SUPUESTOS,
  perfiles: {total: GENTE.length, conSueno: GENTE.filter(p => p.idea).length, hacedores: GENTE.filter(p => !p.idea).length, anonimos: GENTE.filter(p => p.anon).length},
  todosCompletan: total,
  ordenDeLlegada: {conMatchAlLlegar, alFinal: total.conMatch, porTramos: llegada},
  embudo: Object.fromEntries(Object.entries(it).map(([k, v]) => [k, rango(v)])),
  muestra: GENTE.slice(0, 8).map(p => ({sueno: p.idea || "(hacedor: sin sueño propio)", superpoder: p.power, anonimo: p.anon}))
};

console.log(JSON.stringify(res, null, 2));
console.error(`\nResumen: ${total.conMatch}/100 con match (${pct(total.mejorDoble, total.conMatch)} de doble vía), ${total.mutuos} parejas mutuas, ` +
  `${total.paresDoble} pares doble vía y ${total.paresUna} de una vía. Al llegar, solo ${conMatchAlLlegar} tenían match.`);
