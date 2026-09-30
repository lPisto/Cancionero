# Cancionero (Grupo 7) — Entrega 1 — Cobertura de criterios de aceptación

Generado el 30/9/2026. Cruza los **50 criterios de aceptación** de las 12 historias de usuario del PDF contra los **28 casos de prueba** declarados.

Los criterios que ningún caso declarado alcanza se verifican directamente contra la aplicación en `tests/cobertura-criterios.js`, para que ninguno quede sin comprobar.

## Resumen

| | |
|---|---|
| Criterios de aceptación | 50 |
| ✅ Verificados OK | 49 |
| ⚠️ Parciales | 1 |
| ❌ Con falla | 0 |
| Cubiertos por un caso declarado | 48 |
| Verificados acá (ningún caso los alcanzaba) | 2 |

## Matriz

| Criterio | Qué pide | Caso que lo cubre | Estado | Evidencia |
|---|---|---|---|---|
| **US-01.1** | Play reproduce solo el primer segundo y se detiene solo | TC-01 | ✅ OK | TC-01: PASSED |
| **US-01.2** | Tras cada fallo o salto el fragmento pasa a 2, 4, 7, 11 y 16 s | TC-02 | ✅ OK | TC-02: PASSED |
| **US-01.3** | Muestra "Intento X de 6" y una barra con los segundos desbloqueados | TC-01, TC-02 | ✅ OK | TC-01: PASSED · TC-02: PASSED |
| **US-01.4** | Repetir el fragmento no consume intentos | TC-01 | ✅ OK | TC-01: PASSED |
| **US-02.1** | Con 2+ caracteres, hasta 8 sugerencias con formato "Título — Artista" | TC-03 | ✅ OK | TC-03: PASSED |
| **US-02.2** | Se puede buscar por título o por artista | TC-03, TC-04 | ✅ OK | TC-03: PASSED · TC-04: PASSED |
| **US-02.3** | La búsqueda no distingue mayúsculas ni tildes | TC-04 | ✅ OK | TC-04: PASSED |
| **US-02.4** | Sin coincidencias se muestra "No hay resultados" | TC-05 | ✅ OK | TC-05: PASSED |
| **US-02.5** | Solo se envía una canción elegida de la lista; texto libre no consume intento | TC-05 | ✅ OK | TC-05: PASSED |
| **US-03.1** | Respuesta correcta: "¡Correcto!" y termina la ronda | TC-06 | ✅ OK | TC-06: PASSED |
| **US-03.2** | Incorrecta: queda en el historial, consume 1 intento y desbloquea el siguiente fragmento | TC-02 | ✅ OK | TC-02: PASSED |
| **US-03.3** | Seis intentos sin acertar: la ronda termina como "No acertada" | TC-07 | ✅ OK | TC-07: PASSED |
| **US-04.1** | El botón "Saltar" indica cuántos segundos se desbloquean | TC-08 | ✅ OK | TC-08: PASSED |
| **US-04.2** | Saltar consume 1 intento, queda como "Saltado" y desbloquea el siguiente fragmento | TC-08 | ✅ OK | TC-08: PASSED |
| **US-04.3** | Saltar en el 6.º intento termina la ronda como "No acertada" | TC-09 | ✅ OK | TC-09: PASSED |
| **US-05.1** | Al terminar se muestran título, artista, año y carátula | TC-10 | ✅ OK | TC-10: PASSED |
| **US-05.2** | Indica en qué intento acertó y cuántos puntos, o "No acertada — 0 puntos" | TC-10, TC-07 | ✅ OK | TC-10: PASSED · TC-07: PASSED |
| **US-05.3** | Se puede reproducir el fragmento completo (30 s) | TC-10 | ✅ OK | TC-10: PASSED |
| **US-05.4** | El texto del veredicto mide 23 px o más, con alto contraste | TC-10 | ✅ OK | contraste 11.92:1 (WCAG AA pide 4.5:1) · 30 px |
| **US-05.5** | Un botón lleva al siguiente turno ("Continuar") o a la siguiente canción ("Siguiente") | TC-10, TC-14 | ✅ OK | TC-10: PASSED · TC-14: PASSED |
| **US-06.1** | Se pueden registrar entre 2 y 12 jugadores | TC-12 | ✅ OK | TC-12: PASSED |
| **US-06.2** | Con menos de 2 "Empezar" está deshabilitado; con 12 no se agregan más | TC-12 | ✅ OK | TC-12: PASSED |
| **US-06.3** | Nombre obligatorio, máximo 15 caracteres, sin repetir (sin distinguir mayúsculas) | TC-13 | ✅ OK | TC-13: PASSED |
| **US-06.4** | Color y emoji distintos, que se ven en su turno y en el marcador | TC-11, TC-06 | ✅ OK | turno muestra emoji 🦊 y color rgb(109, 226, 163) (jugador: 🦊 / #6de2a3) |
| **US-06.5** | Antes de empezar se puede eliminar un jugador | TC-11 | ✅ OK | TC-11: PASSED |
| **US-07.1** | Antes de cada turno: "Le toca a [nombre] [emoji]" con su color y botón "¡Listo!" | TC-14 | ✅ OK | "Le toca a Ana 🦊" · botón "¡Listo!" |
| **US-07.2** | Orden de carga; después del último vuelve al primero y avanza la ronda | TC-14 | ✅ OK | TC-14: PASSED |
| **US-07.3** | Se muestra "Ronda X de 5" | TC-14 | ✅ OK | TC-14: PASSED |
| **US-07.4** | Cada turno tiene una canción distinta dentro de la partida | TC-14 | ✅ OK | aviso: "2 canciones disponibles — la partida son 10 turnos, así que algunas se van a repetir" · turnos: Goteo → She Don't Give A Fo → She Don't Give A Fo → Goteo |
| **US-08.1** | Puntos: 10, 8, 6, 4, 2, 1 según el intento; 0 si no acierta | TC-15 | ✅ OK | TC-15: PASSED |
| **US-08.2** | Marcador entre turnos con puntos y aciertos, de mayor a menor | TC-15, TC-06 | ✅ OK | TC-15: PASSED · TC-06: PASSED |
| **US-08.3** | La partida dura 5 rondas | TC-16 | ✅ OK | TC-16: PASSED |
| **US-08.4** | Gana el de más puntos; si hay empate se muestran todos los empatados | TC-16, TC-17 | ✅ OK | TC-16: PASSED · TC-17: PASSED |
| **US-09.1** | Al terminar se muestra un podio (1.º, 2.º y 3.º) y la tabla completa | TC-16 | ✅ OK | podio: 🥇 Ana \| 🥈 Beto \| 🥉 Caro · tabla completa con 4 jugadores |
| **US-09.2** | El botón "Compartir" abre el menú del celular con ganador, puntos y link | TC-18 | ⚠️ PARCIAL | TC-18: BLOCKED |
| **US-09.3** | Si el navegador no permite compartir, se copia y se muestra "¡Copiado!" | TC-18 | ✅ OK | navigator.share existía y se anuló para forzar el respaldo · aviso "¡Copiado!" · texto copiado: "Cancionero 🍻 Modo Previa — 5 rondas …" |
| **US-09.4** | En Modo Diario el texto compartido no revela la canción | TC-19 | ✅ OK | TC-19: PASSED |
| **US-09.5** | Hay botones "Jugar de nuevo" (mismos jugadores) y "Volver al inicio" | TC-18 | ✅ OK | botones "Jugar de nuevo" y "Volver al inicio"; "Volver al inicio" lleva a la pantalla de armado |
| **US-10.1** | Misma canción en la misma fecha (hora Argentina); cambia a las 00:00 | TC-19 | ✅ OK | 2026-09-29≠2026-09-30≠2026-10-01 · 6 días dan 6 canciones distintas · 02:00 UTC se resuelve como 2026-09-29 (día anterior, por UTC−3) |
| **US-10.2** | Se juega una sola vez por día; si ya se jugó muestra el resultado y cuánto falta | TC-19 | ✅ OK | TC-19: PASSED |
| **US-10.3** | Aplican las mismas reglas de 6 intentos y saltos | TC-19 | ✅ OK | botón "Saltar (+1 s)" · llega a "Intento 6 de 6" · termina con "No acertada — 0 puntos" |
| **US-11.1** | Al terminar se ofrece "Siguiente" con otra canción distinta de la anterior | TC-20 | ✅ OK | TC-20: PASSED |
| **US-11.2** | Racha actual y mejor racha, guardada en el dispositivo | TC-20 | ✅ OK | TC-20: PASSED |
| **US-11.3** | Se puede salir al inicio en cualquier momento | TC-20 | ✅ OK | TC-20: PASSED |
| **US-12.1** | Filtros por género, por artista y por época (70s, 80s, 90s, 2000s, 2010s y 2020s) | TC-21, TC-22 | ✅ OK | 12 géneros · 284 artistas · épocas: 70s, 80s, 90s, 2000s, 2010s, 2020s · artista "Duki": 2 canciones (1 con crédito exacto + colaboraciones) → Goteo — Duki, She Don't Give A Fo — Duki & KHEA |
| **US-12.2** | Los filtros se combinan y se muestra cuántas canciones cumplen | TC-21, TC-22 | ✅ OK | TC-21: PASSED · TC-22: PASSED |
| **US-12.3** | Sin filtros se juega con todo el catálogo | _ninguno_ | ✅ OK | sin filtros {"genero":"","artista":"","decada":""} el conteo dice "672 canciones disponibles" sobre 672 del catálogo |
| **US-12.4** | Si la combinación da 0 canciones se avisa y no se puede empezar | TC-22 | ✅ OK | TC-22: PASSED |
| **US-12.5** | Todas las canciones que suenan cumplen los filtros elegidos | TC-21 | ✅ OK | TC-21: PASSED |
| **US-12.6** | Los filtros están en Modo Previa y Modo Infinito; el Modo Diario no tiene | _ninguno_ | ✅ OK | Previa: tiene filtros · Infinita: tiene filtros · Diaria: sin filtros, como pide el criterio |

## Criterios que necesitaron verificación propia

Son los que los 28 casos declarados no alcanzaban, o alcanzaban solo en parte.

- **US-05.4** — El texto del veredicto mide 23 px o más, con alto contraste
  - TC-10 mide el tamaño; el contraste se verifica acá
  - Resultado: OK — contraste 11.92:1 (WCAG AA pide 4.5:1) · 30 px
- **US-06.4** — Color y emoji distintos, que se ven en su turno y en el marcador
  - Ningún caso declarado verifica que se vean en la pantalla de turno
  - Resultado: OK — turno muestra emoji 🦊 y color rgb(109, 226, 163) (jugador: 🦊 / #6de2a3)
- **US-07.1** — Antes de cada turno: "Le toca a [nombre] [emoji]" con su color y botón "¡Listo!"
  - TC-14 verifica el nombre; acá se verifica el texto completo y el botón
  - Resultado: OK — "Le toca a Ana 🦊" · botón "¡Listo!"
- **US-07.4** — Cada turno tiene una canción distinta dentro de la partida
  - TC-14 juega sin filtros. Acá se verifica el caso del defecto DF-08: con un filtro que deja menos canciones que turnos, que no se repita ninguna hasta agotar el pool y que la app avise antes
  - Resultado: OK — aviso: "2 canciones disponibles — la partida son 10 turnos, así que algunas se van a repetir" · turnos: Goteo → She Don't Give A Fo → She Don't Give A Fo → Goteo
- **US-09.1** — Al terminar se muestra un podio (1.º, 2.º y 3.º) y la tabla completa
  - TC-16 juega con 2 jugadores, así que nunca llega a ver un podio de 3
  - Resultado: OK — podio: 🥇 Ana | 🥈 Beto | 🥉 Caro · tabla completa con 4 jugadores
- **US-09.2** — El botón "Compartir" abre el menú del celular con ganador, puntos y link
  - TC-18 quedó BLOCKED: los pasos del menú nativo necesitan un Android real
  - Resultado: PARCIAL — TC-18: BLOCKED
- **US-09.3** — Si el navegador no permite compartir, se copia y se muestra "¡Copiado!"
  - TC-18 lo verifica en su paso 3, pero el caso entero quedó BLOCKED por los pasos del menú nativo de Android, así que el criterio se comprueba también acá
  - Resultado: OK — navigator.share existía y se anuló para forzar el respaldo · aviso "¡Copiado!" · texto copiado: "Cancionero 🍻 Modo Previa — 5 rondas …"
- **US-09.5** — Hay botones "Jugar de nuevo" (mismos jugadores) y "Volver al inicio"
  - TC-18 verifica "Jugar de nuevo"; ningún caso verifica "Volver al inicio"
  - Resultado: OK — botones "Jugar de nuevo" y "Volver al inicio"; "Volver al inicio" lleva a la pantalla de armado
- **US-10.1** — Misma canción en la misma fecha (hora Argentina); cambia a las 00:00
  - TC-19 verifica que dos dispositivos coincidan; acá se verifica el cambio de día
  - Resultado: OK — 2026-09-29≠2026-09-30≠2026-10-01 · 6 días dan 6 canciones distintas · 02:00 UTC se resuelve como 2026-09-29 (día anterior, por UTC−3)
- **US-10.3** — Aplican las mismas reglas de 6 intentos y saltos
  - TC-19 usa 2 saltos y acierta; acá se agotan los 6 intentos en el Modo Diario
  - Resultado: OK — botón "Saltar (+1 s)" · llega a "Intento 6 de 6" · termina con "No acertada — 0 puntos"
- **US-12.1** — Filtros por género, por artista y por época (70s, 80s, 90s, 2000s, 2010s y 2020s)
  - Ningún caso declarado verifica que estén las seis décadas ni que el filtro por artista alcance las colaboraciones (defecto DF-07)
  - Resultado: OK — 12 géneros · 284 artistas · épocas: 70s, 80s, 90s, 2000s, 2010s, 2020s · artista "Duki": 2 canciones (1 con crédito exacto + colaboraciones) → Goteo — Duki, She Don't Give A Fo — Duki & KHEA
- **US-12.3** — Sin filtros se juega con todo el catálogo
  - Ningún caso declarado lo verifica
  - Resultado: OK — sin filtros {"genero":"","artista":"","decada":""} el conteo dice "672 canciones disponibles" sobre 672 del catálogo
- **US-12.6** — Los filtros están en Modo Previa y Modo Infinito; el Modo Diario no tiene
  - Ningún caso declarado lo verifica
  - Resultado: OK — Previa: tiene filtros · Infinita: tiene filtros · Diaria: sin filtros, como pide el criterio
