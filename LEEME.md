# Networkeando RD

App para eventos: cada persona escanea un QR, crea su perfil con su idea y su superpoder, y la app le busca un match. Hecha con Next.js (App Router, TypeScript) y SQLite (con Prisma). El original de un solo archivo está en `legacy/index.html`.

## Primera vez

Necesitas Node.js 20 o más nuevo (nodejs.org, versión LTS). En una terminal, dentro de esta carpeta:

```bash
npm install
```

Copia `.env.example` como `.env` (la base de datos) y, si tienes clave de Anthropic, crea `.env.local` con `ANTHROPIC_API_KEY=...`. Luego crea la base de datos:

```bash
npx prisma migrate dev
```

## Para trabajar en la app

```bash
npm run dev
```

Abre http://localhost:3000. Prueba `http://localhost:3000/#demo` para ver la demo con perfiles de ejemplo.

## Para el evento (en tu laptop, mismo Wi-Fi)

```bash
npm run evento
```

1. Abre http://localhost:3000/#proyectar en la laptop y ponlo en pantalla completa. El QR apunta solo a la IP de tu laptop en el Wi-Fi.
2. La primera vez, Windows pregunta si Node.js puede usar la red: marca **Redes privadas** y acepta.
3. Los celulares deben estar en el mismo Wi-Fi. Las redes de invitados con "aislamiento de clientes" no dejan que los celulares vean la laptop: usa un Wi-Fi normal o el hotspot de un celular.
4. No cierres la terminal ni dejes que la laptop se duerma durante el evento.

Los perfiles quedan en `prisma/dev.db`. Para empezar un evento desde cero, borra ese archivo y corre `npx prisma migrate dev` otra vez.

## Archivos principales

- `components/App.tsx`: estado, rutas por hash (#inicio, #perfil, #clics, #proyectar, #demo) y búsqueda del match.
- `components/*.tsx`: las vistas y piezas de la interfaz.
- `lib/match.ts`: cómo se calcula la compatibilidad (método básico por palabras clave).
- `app/api/perfiles`: leer, guardar y borrar perfiles.
- `app/api/match`: elegir el match con IA (Claude) en el servidor.
- `app/api/direccion`: la IP de la laptop para el QR.
- `prisma/schema.prisma`: la tabla de perfiles.
