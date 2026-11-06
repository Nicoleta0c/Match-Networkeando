// Perfiles de ejemplo para ver la app funcionando con gente "en el salón".
// Todos tienen un id que empieza con "ejemplo-", así se borran fácil antes del evento.
//
//   node scripts/ejemplos.mjs            agrega uno cada 3 segundos (en vivo)
//   node scripts/ejemplos.mjs rapido     agrega todos de una vez
//   node scripts/ejemplos.mjs borrar     borra todos los ejemplos
//   Sin "tech": emprendimiento y marketing. Con "tech": roles de tecnología (node scripts/ejemplos.mjs tech)
import { PrismaClient } from "@prisma/client";

// Emprendimiento, marketing y negocios: fundadores, growth, ventas, finanzas, legal y contenido.
const EJEMPLOS = [
  {alias: "Melissa Castillo", que: "Fundadora · Fintech", contact: "@melissa.funda", idea: "Una billetera digital para pagar en los colmados con QR", power: "Hago el modelo de negocio y hablo con inversionistas"},
  {alias: "Kevin Almánzar", que: "Ventas B2B", contact: "809-555-0182", idea: "Un software de facturación electrónica para pymes", power: "Vendo a empresas y cierro acuerdos B2B"},
  {alias: "Nicole Rosario", que: "Growth Marketing", contact: "@nicole.growth", idea: "", power: "Consigo los primeros mil usuarios con anuncios y marketing digital"},
  {alias: "Valeria Cruz", que: "Community Manager", contact: "@vale.comunidad", idea: "Una comunidad de mujeres en tecnología con mentorías", power: "Manejo redes sociales y hago crecer comunidades en línea"},
  {alias: "Andrés Polanco", que: "Finanzas · CFO", contact: "andres.polanco@correo.com", idea: "", power: "Hago proyecciones financieras, precios y presupuestos"},
  {anon: true, que: "Abogada de startups", idea: "", power: "Te ayudo con contratos, términos legales y registro de marca"},
  {alias: "Ana Lucía Gómez", que: "Creadora de contenido", contact: "@analu.cuenta", idea: "Un podcast de startups dominicanas", power: "Escribo guiones y grabo videos cortos para TikTok e Instagram"},
  {alias: "Rafael Mena", que: "Fundador · Agritech", contact: "@rafa.campo", idea: "Una app que conecte a agricultores de Constanza con restaurantes", power: "Conozco el campo y organizo la logística de entregas"},
  {alias: "Laura Peña", que: "Branding", contact: "@laura.marca", idea: "Una agencia de marketing digital para restaurantes", power: "Diseño la marca, el logo y la identidad visual"},
  {alias: "Daniela Ureña", que: "Operaciones", contact: "daniela.urena@correo.com", idea: "Un sistema de delivery para negocios pequeños de Santiago", power: "Organizo procesos y coordino equipos de operaciones"},
  {alias: "José Almonte", que: "Fundador · Edtech", contact: "@jose.aprende", idea: "Una plataforma de cursos cortos de tecnología con certificado", power: "Diseño cursos y explico fácil lo que parece difícil"},
  {anon: true, que: "Ventas en redes", idea: "", power: "Vendo por WhatsApp Business e Instagram"}
];

// Un evento de tecnología: los roles de un equipo de producto digital.
const TECH = [
  {alias: "Paola Jiménez", que: "Desarrolladora móvil", contact: "@paola.flutter", idea: "Una app de citas médicas con recordatorio por WhatsApp", power: "Hago apps móviles en Flutter"},
  {alias: "Daniel Rosario", que: "Frontend", contact: "@daniel.front", idea: "", power: "Programo el frontend de páginas web en React"},
  {alias: "Raúl Batista", que: "Backend", contact: "@raul.api", idea: "Un marketplace de freelancers dominicanos para empresas de afuera", power: "Programo el backend: APIs y bases de datos"},
  {anon: true, que: "Diseño UX/UI", idea: "", power: "Diseño interfaces fáciles de usar y hago pruebas con usuarios (UX/UI)"},
  {alias: "Carlos Mejía", que: "Analista de datos", contact: "@carlos.datos", idea: "Un tablero con datos de los apagones por sector", power: "Analizo datos con SQL y Power BI"},
  {alias: "Mariela Tavárez", que: "Product Manager", contact: "@mariela.pm", idea: "Una plataforma para alquilar apartamentos sin intermediarios", power: "Gestiono el producto, prioridades y el equipo del proyecto"},
  {alias: "Héctor Marte", que: "DevOps", contact: "@hector.nube", idea: "", power: "Monto servidores en la nube y automatizo despliegues"},
  {alias: "Gabriel Vargas", que: "Ciberseguridad", contact: "@gabo.seguro", idea: "Talleres de seguridad digital para pymes", power: "Encuentro fallas de seguridad en apps y páginas web"},
  {alias: "Esteban Gil", que: "Ingeniero de IA", contact: "@esteban.ia", idea: "Un asistente con inteligencia artificial que ayude a llenar trámites del gobierno", power: "Entreno modelos de inteligencia artificial y hago chatbots"},
  {alias: "Yarisa Méndez", que: "QA Tester", contact: "@yari.qa", idea: "", power: "Pruebo apps y encuentro errores antes de que salgan"},
  {alias: "Scarlet Féliz", que: "Scrum Master", contact: "@scarlet.agil", idea: "Un hackatón de fintech en Santo Domingo", power: "Organizo equipos con Scrum y cuido que se cumplan los tiempos"},
  {alias: "Jonathan Pérez", que: "Hardware · IoT", contact: "@jona.iot", idea: "Sensores baratos para medir la calidad del agua en los ríos", power: "Armo prototipos con Arduino y sensores"}
];

const db = new PrismaClient();
const args = process.argv.slice(2);
const tech = args.includes("tech");
const modo = args.find(a => a !== "tech") || "vivo";
const LISTA = tech ? TECH : EJEMPLOS;
const espera = ms => new Promise(r => setTimeout(r, ms));
// El mismo evento que usa la app (lib/evento.ts): EVENTO si lo fijaste, o la fecha de hoy en RD.
const EVENTO = (process.env.EVENTO || "").trim().slice(0, 60) ||
  new Intl.DateTimeFormat("en-CA", {timeZone: "America/Santo_Domingo", year: "numeric", month: "2-digit", day: "2-digit"}).format(new Date());

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
        likes: "[]", color: "", createdAt: Date.now(), evento: EVENTO
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
