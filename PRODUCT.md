# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Asistentes de eventos en República Dominicana** (eventos de tecnología y networking, mayoría jóvenes). Escanean un QR al entrar, desde su celular y de pie, con poco tiempo y atención repartida.
- **La presentadora**, que proyecta la app en la pantalla grande del evento, cierra la charla con la dinámica y da paso al networking. La dinámica no pasa de 10 minutos.

## Product Purpose

La gente escribe su **sueño** (lo que quiere lograr) y su **superpoder** (lo que sabe hacer). La app los empareja en vivo y muestra **el sueño de alguien y quién lo puede ayudar** (su superpoder). Los detalles los hablan ellos en persona. El éxito es que la gente se levante y hable con su match en el mismo evento.

## Positioning

No es un directorio de contactos: empareja sueños con superpoderes, en una o en las dos direcciones. Los registros forman el **Mapa de Sueños**, que crece de evento en evento.

## Operating Context

- Flujo: QR en pantalla → formulario de dos preguntas (nombre y contacto opcionales; se puede ser anónimo) → fase de registro (esperan) → la presentadora empieza los matches → cada quien ve su match. No hay chat: se encuentran en persona.
- La vista para proyectar se ve en pantalla grande, desde lejos, en un salón.
- Primer evento (lanzamiento): 6 de noviembre de 2026.

## Capabilities and Constraints

- Next.js + Prisma/SQLite en un solo servidor. La clave de Anthropic solo vive en el servidor (`.env.local`), nunca en el navegador.
- Con IA (Claude) el emparejamiento usa el prompt acordado en la reunión del 5 de nov; sin IA, un método básico por palabras clave con el mismo formato.
- En el código el sueño se guarda en el campo `idea`; en la interfaz siempre se dice "sueño".
- Abierto: pasar la base de datos a Supabase (plan gratuito) para guardar varios eventos.

## Brand Commitments

- La app se llama **Networkeando RD**. La vista del mapa se llama **Mapa de Sueños**.
- Todos los textos en español dominicano neutro, de tú.
- Personajes de la marca: el dúo de caricaturas (`public/duo-l.webp`, `public/duo-r.webp`). Hay un logo y un color alterno pendientes para después.

## Evidence on Hand

- Datos reales: solo los perfiles registrados en el evento. **No inventar eventos, cifras ni personas**: el nivel global del mapa muestra solo eventos reales.
- Modo demo (`#demo`) con perfiles de ejemplo de un evento de tecnología, solo para practicar.

## Product Principles

1. Mostrar el sueño y quién lo puede ayudar; los detalles se hablan en persona.
2. Simple y rápido: todo cabe en 10 minutos y se entiende en un celular de pie.
3. La privacidad primero: se puede participar anónimo, y a los anónimos no se les inventa nombre ni se les pide contacto.
4. Lo que se proyecta es real y en vivo.

## Accessibility & Inclusion

Mantener lo que ya existe: `aria-*`, `prefers-reduced-motion` y safe-area en celulares.
