// Perfiles de ejemplo para ver la app funcionando con gente "en el salón".
// Todos tienen un id que empieza con "ejemplo-", así se borran fácil antes del evento.
//
//   node scripts/ejemplos.mjs            agrega uno cada 3 segundos (en vivo)
//   node scripts/ejemplos.mjs rapido     agrega todos de una vez
//   node scripts/ejemplos.mjs borrar     borra todos los ejemplos
//   Agrega "tech" para usar la gente de un evento de tecnología: node scripts/ejemplos.mjs tech
import { PrismaClient } from "@prisma/client";

const EJEMPLOS = [
  {alias: "Camila Núñez", que: "Medicina", contact: "@camila.salud", idea: "Jornadas de salud gratis en comunidades", power: "Coordinador de voluntariados y logística de eventos"},
  {alias: "Gabriela Santos", que: "Contabilidad", contact: "gaby.santos@correo.com", idea: "Un club de ahorro para jóvenes", power: "Hago presupuestos y explico finanzas fácil"},
  {alias: "Ana Lucía Gómez", que: "Comunicación social", contact: "analucia@correo.com", idea: "Un podcast sobre emprendedoras del Cibao", power: "Escribo guiones y hablo en público sin miedo"},
  {alias: "Daniel Rosario", que: "Ingeniería de Software", contact: "@daniel.codea", idea: "Una app para reservar las canchas del barrio", power: "Programo páginas web y apps rápidas"},
  {anon: true, que: "Diseño Gráfico", idea: "", power: "Diseño flyers, logos y redes sociales para eventos"},
  {alias: "Kevin Almánzar", que: "Administración de Empresas", contact: "809-555-0182", idea: "Una feria de emprendedores en la universidad", power: "Consigo patrocinadores y cierro acuerdos"},
  {alias: "Sofía Taveras", que: "Psicología", contact: "sofia.taveras@correo.com", idea: "Talleres de salud mental para liceos públicos", power: "Diseño dinámicas de grupo que rompen el hielo"},
  {alias: "Miguel Santos", que: "Ingeniería Eléctrica", contact: "@miguel.solar", idea: "Un kit de energía solar para colmados", power: "Arreglo cualquier cosa eléctrica y armo prototipos"},
  {anon: true, que: "Derecho", idea: "", power: "Te ayudo a registrar tu negocio y tu marca"},
  {alias: "Laura Peña", que: "Arquitectura", contact: "@laura.planos", idea: "Un mapa de lugares accesibles para sillas de ruedas", power: "Dibujo planos y maquetas"},
  {alias: "Valeria Cruz", que: "Mercadeo", contact: "@vale.vende", idea: "", power: "Hago crecer cuentas de Instagram y vendo por redes"},
  {alias: "José Almonte", que: "Educación", contact: "@jose.ensena", idea: "Tutorías de matemáticas entre estudiantes", power: "Explico fácil lo que parece difícil y doy talleres"}
];

// Un evento de tecnología: ideas y superpoderes de jóvenes del mundo tech.
const TECH = [
  {alias: "Paola Jiménez", que: "Ingeniería de Software", contact: "@paola.flutter", idea: "Una app para que los colmados lleven el fiado en el celular", power: "Programo apps en Flutter"},
  {alias: "Carlos Mejía", que: "Ciencia de Datos", contact: "@carlos.datos", idea: "Un mapa de los apagones por sector con datos de la gente", power: "Analizo datos y hago gráficos con Python"},
  {anon: true, que: "Diseño UX", idea: "", power: "Diseño interfaces fáciles de usar (UX/UI)"},
  {alias: "Raúl Batista", que: "Telemática", contact: "@raul.cloud", idea: "Un bot de WhatsApp que avise cuándo pasa la guagua", power: "Programo el backend: servidores, bases de datos y APIs"},
  {alias: "Nicole Rosario", que: "Mercadeo digital", contact: "@nicole.lanza", idea: "", power: "Lanzo productos en redes y consigo los primeros usuarios"},
  {alias: "Jonathan Pérez", que: "Electrónica", contact: "@jona.arduino", idea: "Sensores baratos para medir la calidad del agua en los ríos", power: "Armo prototipos con Arduino y sensores"},
  {alias: "Melissa Castillo", que: "Administración de Empresas", contact: "melissa.castillo@correo.com", idea: "Una startup de tutorías de programación entre estudiantes", power: "Hago el modelo de negocio y consigo inversión"},
  {anon: true, que: "Derecho", idea: "", power: "Te ayudo con contratos, términos legales y protección de datos"},
  {alias: "Gabriel Vargas", que: "Ciberseguridad", contact: "@gabo.seguro", idea: "Talleres de seguridad digital para adultos mayores", power: "Encuentro fallas de seguridad en apps y páginas web"},
  {alias: "Andrea Féliz", que: "Comunicación", contact: "@andrea.explica", idea: "Un canal de YouTube que explique tecnología en dominicano", power: "Hago videos y presento sin miedo a la cámara"},
  {alias: "Esteban Gil", que: "Inteligencia Artificial", contact: "@esteban.ia", idea: "Un asistente con inteligencia artificial que ayude a llenar formularios del gobierno", power: "Entreno modelos de inteligencia artificial"},
  {alias: "Yarisa Méndez", que: "Educación", contact: "@yari.ensena", idea: "Clases de programación para niños de barrio", power: "Enseño fácil y doy talleres para niños"}
];

const db = new PrismaClient();
const args = process.argv.slice(2);
const tech = args.includes("tech");
const modo = args.find(a => a !== "tech") || "vivo";
const LISTA = tech ? TECH : EJEMPLOS;
const espera = ms => new Promise(r => setTimeout(r, ms));

try {
  if (modo === "borrar") {
    const r = await db.perfil.deleteMany({where: {id: {startsWith: "ejemplo-"}}});
    console.log(`Borrados ${r.count} perfiles de ejemplo.`);
  } else {
    for (const [i, e] of LISTA.entries()) {
      const id = "ejemplo-" + (tech ? "tech-" : "") + String(i + 1).padStart(2, "0");
      const datos = {
        idea: e.idea, needs: "[]", power: e.power, anon: !!e.anon,
        alias: e.anon ? "" : e.alias, que: e.anon ? "" : e.que, contact: e.anon ? "" : e.contact,
        likes: "[]", color: "", createdAt: Date.now()
      };
      await db.perfil.upsert({where: {id}, create: {id, ...datos}, update: datos});
      console.log(`Llegó ${e.anon ? "alguien anónimo" : e.alias} (${i + 1}/${LISTA.length})`);
      if (modo === "vivo" && i < LISTA.length - 1) await espera(3000);
    }
    console.log("Listo. Para quitarlos: npm run ejemplos:borrar");
  }
} finally {
  await db.$disconnect();
}
