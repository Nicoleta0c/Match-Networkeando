/* El evento de hoy. Cada perfil se guarda con su evento: así el Mapa de Sueños tiene dos niveles
   (todos los eventos juntos y este evento) y en el match solo sale la gente que está en el salón.

   Para fijarlo a mano, pon en .env.local:  EVENTO="Lanzamiento Mapa de Sueños"
   Si no lo pones, el evento es la fecha de hoy en República Dominicana (ej. "2026-11-06"). */

export function eventoActual() {
  const fijo = (process.env.EVENTO || "").trim().slice(0, 60);
  if (fijo) return fijo;
  // en-CA escribe la fecha como 2026-11-06.
  return new Intl.DateTimeFormat("en-CA", {timeZone: "America/Santo_Domingo", year: "numeric", month: "2-digit", day: "2-digit"}).format(new Date());
}
