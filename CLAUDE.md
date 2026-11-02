# Networkeando RD (Match Networkeando)

Plataforma para eventos: cada persona escanea un QR, crea su perfil con su **idea** y su **superpoder**, y la app le busca un "match" con alguien cuyo superpoder encaje con lo que su idea necesita. Tiene vistas `#inicio`, `#perfil`, `#clics`, `#proyectar` (pantalla grande con el QR) y un modo `#demo`.

Este proyecto viene de un artefacto publicado en claude.ai:
https://claude.ai/artifact/85pBENts7tmwDJfPwNKyry

## Estado actual

Todo está en un solo archivo, `index.html` (HTML + CSS + JS en línea, ~1.070 líneas). Las imágenes de los personajes están embebidas como data URI WebP (`DUO_L`, `DUO_R`): no las imprimas ni las reescribas, son muy largas.

Dependencias externas: fuente Manrope (Google Fonts) y `qrious@4.0.2` (cdnjs) para dibujar el QR.

## Lo que deja de funcionar fuera de claude.ai

El artefacto usaba capacidades del runtime de claude.ai a través de `window.claude.use(...)`. Fuera de claude.ai `window.claude` no existe, así que la app cae al estado `S.avail = "nodb"` (solo sirve el modo demo).

1. **`window.claude.use("db")`**: base de datos compartida entre todos los asistentes. Colección `perfiles`, un documento por usuario (id = uid). Se usa con una API estilo Firestore: `collection("perfiles").orderBy("createdAt","desc").limit(800).onSnapshot(...)`, `.doc(uid).set(body)`, `.doc(uid).delete()`.
2. **`window.claude.use("user")`**: identidad del visitante (`user.id()`) y permiso de escritura (`user.can("data.write")`).
3. **`window.claude.use("sample")`**: IA para elegir el mejor match (`S.ia.json(prompt, {modelTier:"quick"})`). Si falla, la app ya tiene un método básico de respaldo por palabras clave (`inferir`, `CLAVES`).
4. **`SHARE_URL`**: el QR apunta al enlace del artefacto en claude.ai. Hay que cambiarlo por la URL donde se publique la nueva versión.

`localStorage` (clave `clic-notificados`) sí funciona en local, no hay que tocarlo.

## Plan de migración sugerido

1. Correr en local tal cual: `npx serve .` o `python3 -m http.server` y abrir `http://localhost:3000` / `:8000`. Comprobar que el modo `#demo` funciona.
2. Base de datos: la API ya es casi idéntica a Firebase Firestore. Crear un pequeño adaptador que exponga `window.claude.use("db")` y `("user")` sobre Firestore + Firebase Auth anónima, para no reescribir la lógica de la app. Alternativa: Supabase. **Preguntar al usuario antes de elegir.**
3. IA: nunca poner una API key en el navegador. Usar una función serverless (Vercel/Netlify/Firebase Functions) que llame a la API de Anthropic y exponga `sample.json(prompt)`; si no hay backend, dejar que la app use su método básico.
4. Actualizar `SHARE_URL` a la URL de producción y publicar (Vercel, Netlify o Firebase Hosting).
5. Después, mejoras de diseño con las skills.

## Skills instaladas en `.claude/skills/`

- `impeccable`: auditoría y pulido de diseño (`/impeccable audit`, `/impeccable polish`, `/impeccable critique`).
- `taste-skill`: criterio visual anti-"AI slop" para frontend.
- `ui-ux-pro-max`: catálogo de estilos, paletas y tipografías.
- `animate`, `improve-animations`, `review-animations`, `emil-design-eng`: skills de Emil Kowalski para animaciones e interacción.
- `huashu-design`: prototipos HTML, decks y animaciones exportables.

## Reglas para trabajar aquí

- La interfaz y los textos son en español dominicano neutro; mantenerlos en español.
- Mantener la paleta y variables CSS de `:root` (`--idea`, `--poder`, `--clic`, etc.) salvo que el usuario pida un rediseño.
- Mantener la accesibilidad existente (`aria-*`, `prefers-reduced-motion`, safe-area insets).
- Hacer cambios pequeños y probarlos en el navegador antes de seguir.
