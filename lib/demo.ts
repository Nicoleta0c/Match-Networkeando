/* Perfiles de ejemplo del modo #demo: un evento de tecnología. */

export type DemoPerfil = Record<string, unknown> & { id: string };

/* Gente del salón. Lo que necesita cada idea lo calcula la app a partir del texto. */
export const DEMO: DemoPerfil[] = [
  {id:"d1", alias:"Paola Jiménez", que:"Ingeniería de Software", color:"#1E88E5", contact:"@paola.flutter", idea:"Una app para que los colmados lleven el fiado en el celular", power:"Programo apps en Flutter"},
  {id:"d2", alias:"Carlos Mejía", que:"Ciencia de Datos", color:"#FF8A00", contact:"@carlos.datos", idea:"Un mapa de los apagones por sector con datos de la gente", power:"Analizo datos y hago gráficos con Python"},
  {id:"d3", anon:true, que:"Diseño UX", idea:"", power:"Diseño interfaces fáciles de usar (UX/UI)"},
  {id:"d4", alias:"Raúl Batista", que:"Telemática", color:"#2B9348", contact:"@raul.cloud", idea:"Un bot de WhatsApp que avise cuándo pasa la guagua", power:"Programo el backend: servidores, bases de datos y APIs"},
  {id:"d5", alias:"Nicole Rosario", que:"Mercadeo digital", color:"#B5179E", contact:"@nicole.lanza", idea:"", power:"Lanzo productos en redes y consigo los primeros usuarios"},
  {id:"d6", alias:"Jonathan Pérez", que:"Electrónica", color:"#E85D04", contact:"@jona.arduino", idea:"Sensores baratos para medir la calidad del agua en los ríos", power:"Armo prototipos con Arduino y sensores"},
  {id:"d7", alias:"Melissa Castillo", que:"Administración de Empresas", color:"#00A884", contact:"melissa.castillo@correo.com", idea:"Una startup de tutorías de programación entre estudiantes", power:"Hago el modelo de negocio y consigo inversión"},
  {id:"d8", anon:true, que:"Derecho", idea:"", power:"Te ayudo con contratos, términos legales y protección de datos"}
];
export const DEMO_MATCHES: DemoPerfil[] = [
  {id:"m1", alias:"Gabriel Vargas", que:"Ciberseguridad", color:"#5B2EFF", contact:"@gabo.seguro", idea:"Talleres de seguridad digital para adultos mayores", power:"Encuentro fallas de seguridad en apps y páginas web"},
  {id:"m2", alias:"Andrea Féliz", que:"Comunicación", color:"#F0306F", contact:"@andrea.explica", idea:"Un canal de YouTube que explique tecnología en dominicano", power:"Hago videos y presento sin miedo a la cámara"},
  {id:"m3", alias:"Esteban Gil", que:"Inteligencia Artificial", color:"#18B5A6", contact:"@esteban.ia", idea:"Un asistente con inteligencia artificial que ayude a llenar formularios del gobierno", power:"Entreno modelos de inteligencia artificial"},
  {id:"m4", alias:"Yarisa Méndez", que:"Educación", color:"#1E88E5", contact:"@yari.ensena", idea:"Clases de programación para niños de barrio", power:"Enseño fácil y doy talleres para niños"},
  {id:"m5", anon:true, que:"Diseño Gráfico", idea:"", power:"Diseño logos e identidades para apps y startups"},
  {id:"m6", alias:"Luis Encarnación", que:"Ingeniería de Sistemas", color:"#2B9348", contact:"@luis.web", idea:"Una página para comparar precios de útiles escolares", power:"Programo páginas web rápidas con React"},
  {id:"m7", anon:true, que:"Mercadeo", idea:"Una tienda en línea de accesorios tech hechos en RD", power:"Vendo por redes sociales y hago crecer cuentas"},
  {id:"m8", alias:"Rosa Taveras", que:"Contabilidad", color:"#FF8A00", contact:"rosa.taveras@correo.com", idea:"", power:"Hago presupuestos y llevo las cuentas de startups"}
];
/* Tu perfil en la demo. */
export const DEMO_YO = {idea:"Una app que conecte a estudiantes con pasantías en empresas de tecnología", power:"Consigo patrocinadores y armo equipos", anon:false, alias:"Invitado", que:"Perfil de prueba", contact:"@tu.usuario"};
