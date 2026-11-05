# Simulación: 100 personas en el Mapa de Sueños

Evento de tecnología y networking en RD, dinámica de máximo 10 minutos.
Script: `scripts/simulacion.mjs` (se corre con `node --no-warnings scripts/simulacion.mjs`).

**Qué es real y qué es supuesto**

- **Real:** los matches, la doble vía y la una vía salen del **algoritmo de la app** (el método básico, sin IA) aplicado a 100 perfiles ficticios.
- **Supuesto:** cuánta gente escanea, termina el formulario o se acerca a alguien. Son estimaciones razonables, no datos. Después del evento se pueden cambiar en `SUPUESTOS` con los números reales.

> **Actualización (mejora 1 aplicada):** ya se arregló el match de los hacedores. Las secciones 2 a 4 muestran los números de **antes** del arreglo; esta tabla compara antes y después, con el mismo script.
>
> | | Antes | Después |
> |---|---|---|
> | Ven un match (de 100, todos completan) | 61 | **90** |
> | Hacedores sin match | 33 de 33 | **4 de 33** |
> | Con sueño sin match | 6 | 6 (sin cambio) |
> | Parejas mutuas | 3 | 5 |
> | Embudo: ven un match (de ~71 que completan) | 43 | **62** |
> | Embudo: se quedan sin match | 28 | **8** |
> | Embudo: se acercan a alguien (estimado) | ≈ 30 | **≈ 37** |
> | La persona más popular es el mejor match de… | 7 | 8 |
>
> Los 4 hacedores que siguen sin match tienen un superpoder que no le sirve a ningún sueño de esa sala. Las personas populares ahora reciben un poco más de gente, así que la mejora 5 importa más.

## 1. Los 100 perfiles

- 67 con sueño y 33 "hacedores" sin sueño propio (la proporción 2 a 1 del ejemplo de Piero).
- 55 entran anónimos.
- Superpoderes con la mezcla de un evento de tecnología: 25 de tecnología, 12 de diseño, 12 de marketing, 10 de comunicación, 10 de negocios y el resto repartido.
- Sueños con sabor local, por ejemplo:
  - una app para que los colmados lleven el fiado;
  - un mapa de los apagones por sector;
  - un bot que avise cuándo pasa la guagua;
  - café de Barahona para exportar.

## 2. Si las 100 personas llenan el perfil

| | Resultado |
|---|---|
| Personas que ven un match en su pantalla | **61 de 100** |
| …su mejor match es de doble vía | 36 (59 %) |
| …su mejor match es de una vía | 25 |
| Personas **sin match** | **39** |
| …de ellas, hacedores (sin sueño) | **33 de 33** |
| …de ellas, con sueño | 6 |
| Parejas que empalman en doble vía (en todo el salón) | 166 |
| Parejas que empalman en una vía | 658 |
| Parejas donde cada uno es el mejor match del otro | solo 3 |
| Compatibilidad promedio del mejor match | 80 % |

**Hallazgo principal:** **ningún hacedor ve un match**, aunque 29 de los 33 sí le sirven al sueño de alguien. El algoritmo puntúa "qué le sirve a *tu* sueño". Si no escribiste sueño, siempre te da bajo. Esto contradice lo que dice el formulario: "si no tienes uno, te sumas al de alguien".

**Personas populares:** a 2 personas (un fotógrafo de eventos y alguien que diseña presentaciones) les toca ser el mejor match de **7 personas cada una**. Van a tener fila.

## 3. El embudo (con abandono)

Repetido 200 veces, al azar, con los supuestos de abajo. Promedio y rango normal (del 10 % al 90 %).

| Paso | Supuesto | Quedan de 100 |
|---|---|---|
| Están en el salón | | 100 |
| Escanean el QR | 80 % escanea | **80** (76–85) |
| Terminan el formulario | 88 % de los que escanean | **71** (65–75) |
| Ven un match | algoritmo real | **43** (38–47) |
| …y es de doble vía | algoritmo real | 24 (20–28) |
| Se quedan sin match | algoritmo real | **28** (24–31) |
| Se acercan a alguien en persona | 70 % si es doble vía, 50 % si es una vía, 15 % si no tienen match | **≈ 30** (25–36) |

**Dónde se pierde la gente:** la caída más grande no es al escanear, es **después de llenar el perfil**: 28 de cada 71 se quedan sin match. Casi todos son hacedores.

## 4. Orden de llegada

Quien busca su match temprano lo hace con poca gente en el salón:

| Ya llegaron | Tenían match al buscar |
|---|---|
| 10 | 2 |
| 30 | 14 |
| 50 | 25 |
| 100 | 57 (al final serían 61) |

Sin IA, la lista se actualiza sola cada 5 segundos. **Con IA, el resultado se queda guardado** hasta que la persona toca "Buscar de nuevo".

## 5. Los 10 minutos y sus cuellos de botella

| Minuto | Qué pasa | Cuello de botella |
|---|---|---|
| 0–1 | Explicas la dinámica con el QR proyectado | |
| 1–2:30 | Escanean y abren la página | **Datos y Wi-Fi.** La app tiene que estar publicada en internet; con `localhost` el QR no abre. Unas 70 personas entran casi a la vez. |
| 2:30–5 | Escriben sueño y superpoder | **Escribir en el celular** (1–2 min). La persona más lenta marca el ritmo. |
| 5–5:30 | La app busca el match | Animación de 3 s. **Con IA puede tardar hasta 20 s** si llegan unos 70 pedidos a la vez (después usa el método básico). |
| 5:30–6:30 | Leen "Cómo se ayudan" | |
| 6:30–10 | Se escriben por el chat y se buscan | Solo 3 parejas son mutuas: casi todos buscan a alguien que tiene su mejor match en otra persona. **Las personas populares** reciben hasta 7 mensajes. |

## 6. Cinco mejoras, por impacto y facilidad para mañana

1. **Que los hacedores vean a quién le sirven.** *Impacto muy alto; código; unos 30 minutos.* Si no tienes sueño, tu match debe ser la persona a cuyo sueño le sirve tu superpoder. Estimado: de 61 a unas **90 de 100** personas con match. En el embudo, de 43 a unas 63, y unas 7 personas más se acercarían.
2. **Publicar la app y probar el QR con datos móviles.** *Impacto total; esfuerzo medio; hace falta sí o sí.* Sin esto nadie entra. Hacer un ensayo con 5–10 celulares, también con la clave de la IA puesta.
3. **"Todos toquen *Buscar de nuevo*" al minuto 5.** *Impacto medio; cero código: lo dices tú.* Quien llegó temprano ve el salón completo y la IA vuelve a elegir con todos.
4. **Cronómetro de 2 minutos para escribir.** *Impacto medio; cero código.* Dices "tienes 2 minutos" y das un ejemplo en voz alta de sueño y de superpoder. Baja el abandono del formulario y mantiene los 10 minutos.
5. **"Si tu match está ocupado, ve al siguiente".** *Impacto medio-bajo; cero código.* Para las personas populares: "También encajan contigo" ya tiene a los siguientes. Para más adelante: dejar escribir por chat también a esa lista.
