/* Perfiles de ejemplo del modo #demo (copiados del original). */

export type DemoPerfil = Record<string, unknown> & { id: string };

export const DEMO: DemoPerfil[] = [
  {id:"d3", alias:"Carlos Méndez", que:"Contabilidad", color:"#FF8A00", contact:"@carlos.cuentas", idea:"Un taller gratis de finanzas personales para jóvenes", needs:[3,7], power:"Hago presupuestos y llevo las cuentas claras", quiere:false, devuelve:true},
  {id:"d4", alias:"Ana Lucía Gómez", que:"Comunicación social", color:"#00A884", contact:"analucia@correo.com", idea:"Un podcast sobre emprendedoras del Cibao", needs:[6,4], power:"Escribo guiones y hablo en público sin miedo", quiere:true},
  {id:"d2", anon:true, que:"Ingeniería de Sistemas", idea:"", power:"Programo apps en Flutter y conecto todo con bases de datos", quiere:true},
  {id:"d1", alias:"Laura Peña", que:"Arquitectura", color:"#1E88E5", contact:"@laura.planos", idea:"Un mapa de lugares accesibles para sillas de ruedas", needs:[6,1], power:"Dibujo planos y maquetas", quiere:true},
  {id:"d6", anon:true, que:"Psicología", idea:"Una línea de apoyo emocional para estudiantes en época de exámenes", needs:[1,4], power:"Escucho de verdad y doy talleres de manejo del estrés", quiere:true},
  {id:"d7", alias:"Valeria Cruz", que:"Mercadeo", color:"#B5179E", contact:"@vale.vende", idea:"", power:"Hago crecer cuentas de Instagram y vendo por redes", quiere:true},
  {id:"d5", alias:"Miguel Santos", que:"Ingeniería Eléctrica", color:"#2B9348", contact:"809-555-0147", idea:"Un kit de energía solar para colmados", needs:[5,4], power:"Arreglo cualquier cosa eléctrica y armo prototipos", quiere:false, devuelve:true},
  {id:"d8", alias:"José Almonte", que:"Derecho", color:"#E85D04", contact:"@jose.legal", idea:"Asesoría legal gratis para emprendedores que empiezan", needs:[4,1], power:"Reviso contratos y te ayudo con los trámites de registro", quiere:false}
];
export const DEMO_MATCHES: DemoPerfil[] = [
  {id:"m1", alias:"Sofía Taveras", que:"Psicología", color:"#B5179E", contact:"sofia.taveras@correo.com", idea:"Talleres de salud mental para liceos públicos", needs:[6,3], power:"Diseño dinámicas de grupo que rompen el hielo"},
  {id:"m2", alias:"Daniel Rosario", que:"Ingeniería de Software", color:"#1E88E5", contact:"@daniel.codea", idea:"Una app para reservar las canchas del barrio", needs:[4,6], power:"Programo páginas web y apps rápidas"},
  {id:"m3", anon:true, que:"Diseño Gráfico", idea:"", power:"Diseño logos e identidades que se recuerdan"},
  {id:"m4", alias:"Kevin Almánzar", que:"Administración de Empresas", color:"#2B9348", contact:"809-555-0182", idea:"Una feria de emprendedores en la universidad", needs:[3,2], power:"Consigo patrocinadores y cierro acuerdos"},
  {id:"m5", anon:true, que:"Comunicación", idea:"", power:"Edito videos cortos para TikTok y Reels"},
  {id:"m6", alias:"María Fernanda Ureña", que:"Educación", color:"#00A884", contact:"@mafe.ensena", idea:"Tutorías de matemáticas entre estudiantes", needs:[1,6], power:"Explico fácil lo que parece difícil"},
  {id:"m7", anon:true, que:"Mercadeo", idea:"Una marca de ropa con diseños dominicanos", needs:[2,5], power:"Vendo por redes sociales y hago crecer cuentas"},
  {id:"m8", alias:"Camila Núñez", que:"Medicina", color:"#5B2EFF", contact:"@camila.salud", idea:"Jornadas de salud gratis en comunidades", needs:[6,9], power:"Coordino voluntarios y logística"},
  {id:"m9", anon:true, que:"Derecho", idea:"", power:"Te ayudo a registrar tu negocio y tu marca"},
  {id:"m10", alias:"Gabriela Santos", que:"Contabilidad", color:"#F0306F", contact:"gaby.santos@correo.com", idea:"Un club de ahorro para jóvenes emprendedores", needs:[3,1], power:"Hago presupuestos y planes de negocio"}
];
export const DEMO_YO = {idea:"Un club de lectura en los parques de la ciudad", needs:[3], power:"Organizo eventos y la gente sí llega", anon:false, alias:"Invitado", que:"Perfil de prueba", contact:"@tu.usuario"};
