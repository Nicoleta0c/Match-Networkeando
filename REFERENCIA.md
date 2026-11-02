# Referencia del original (Paso 1)

Probado el 2026-11-02 con `python -m http.server 8000` en `http://127.0.0.1:8000/index.html`, en escritorio (800×600) y móvil (375×812). Sin errores en la consola.

## Sin base de datos (estado "nodb")

- **#inicio**: barra superior "Networkeando RD" con pestañas Inicio / Mi perfil / Mis matches. Ilustración de los dos personajes (DUO_L y DUO_R). Título "Haz match con quien puede hacer realidad tu idea." Botones "Crear mi perfil" (oscuro) y "Probar la demo" (con borde). Debajo: QR "Escanea con la cámara", Paso 1, 2 y 3, y el enlace "Proyectar el código en el evento".
- **#perfil**: aviso "Los perfiles no cargan en esta vista…". Dos tarjetas: "Mi idea" (título morado) y "Mi superpoder" (título rosado), cada una con su textarea y un ejemplo. Selector Anónimo / Con mi nombre y el botón "Guardar y buscar mi match" (desactivado, gris).
- **#clics**: título "Mis matches" y el mismo aviso. Nada más.
- **#proyectar**: pantalla sin barra de pestañas. QR grande a la izquierda, "Escanea y la app te busca tu match." a la derecha, contadores "0 perfiles" y "0 matches encontrados". Botones "Pantalla completa" y "Salir" arriba a la derecha.

## Modo #demo

1. Al entrar, el hash cambia a `#clics` y aparece una franja amarilla: "Estás en la demo con perfiles de ejemplo. Nada de esto se guarda." con "Probar como: Con nombre / Anónimo" y "Salir".
2. Animación de búsqueda: "Revisando 18 perfiles…", barra de progreso y nombres que van pasando.
3. Modal "¡Hicieron match!": círculos "Tú" + "AG", etiqueta amarilla "98% compatible", texto explicando el porqué, "Escríbele: analucia@correo.com" y botón "Ver todos mis matches". Al pulsarlo, el modal se cierra con animación.
4. **#clics** con datos: "La app revisó 18 perfiles…", botón "Buscar de nuevo". Tarjeta "Tu mejor match" (Ana Lucía Gómez, 98%) con Tu idea + Su superpoder, y a la derecha un anillo con "98%" y "Por qué encajan" (dos razones). Debajo, "También encajan contigo": 6 tarjetas más (Anónimo 2NC 50% con "Clave para encontrarse: CARIBE-26", Daniel Rosario 47%, Camila Núñez 47%, Sofía Taveras 46%, Laura Peña 45%, María Fernanda Ureña 45%).
5. **Probar como Anónimo**: aparece el aviso "Tu perfil es anónimo. Tus matches no pueden escribirte. Agrega tu nombre y contacto." Los matches no cambian.
6. **#perfil** en demo: los campos vienen llenos (idea: "Un club de lectura en los parques de la ciudad"; superpoder: "Organizo eventos y la gente si llega"), botón "Guardar y buscar de nuevo" activo y enlace "Borrar mi perfil".
7. **Salir**: quita la franja amarilla y vuelve al estado sin base de datos.

## Móvil (375 px)

- La barra de pestañas pasa abajo como barra fija con íconos (Inicio, Mi perfil, Mis matches); la pestaña activa se resalta.
- En la demo, la franja amarilla se reduce a los botones Con nombre / Anónimo / Salir.
- Las tarjetas van en una sola columna.
