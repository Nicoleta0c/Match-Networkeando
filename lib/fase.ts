/* La fase de cada evento:
   - "registro": la gente llena su perfil y espera. Todavía no ve su match.
   - "matches": la presentadora tocó «Empezar los matches» y aparece el botón «Ver mi match».
   Se guarda en lib/almacen.ts. Cada evento empieza en "registro". */
export { leerFase, ponerFase, type Fase } from "./almacen";
