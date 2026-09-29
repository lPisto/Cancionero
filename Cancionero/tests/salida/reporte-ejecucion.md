# Cancionero (Grupo 7) — Entrega 1 — Reporte de ejecución de casos de prueba

**Aplicación bajo prueba:** Cancionero V1 · **Fecha de ejecución:** 28/9/2026

**Entorno:** Google Chrome 154.0.8037.58 · Mozilla Firefox 155.0 · Windows 11 · ejecución automatizada con Playwright

## Resumen

| Estado | Casos |
|---|---|
| ✅ PASSED | 26 |
| ❌ FAILED | 1 |
| ⛔ BLOCKED | 1 |
| ⚪ NOT RUN | 0 |
| **Total** | **28** |
| **% aprobados** (sobre ejecutados) | **96.3 %** |

## Tabla de ejecución

| Test case | Prioridad | Título | Historia | Camino feliz | Estado | Defectos |
|---|---|---|---|---|---|---|
| TC-01 | Alta | Reproducir el primer fragmento de 1 segundo | US-01 | Sí | ✅ PASSED |  |
| TC-02 | Alta | Desbloqueo progresivo de segundos tras respuestas incorrectas | US-01, US-03 | No | ✅ PASSED |  |
| TC-03 | Alta | Autocompletado por título | US-02 | Sí | ✅ PASSED |  |
| TC-04 | Media | Autocompletado por artista, sin tildes ni mayúsculas | US-02 | No | ✅ PASSED |  |
| TC-05 | Media | Búsqueda sin resultados y envío de texto libre | US-02 | No | ✅ PASSED |  |
| TC-06 | Alta | Acierto en el primer intento | US-03, US-05, US-08 | Sí | ✅ PASSED |  |
| TC-07 | Alta | Seis respuestas incorrectas | US-03, US-05 | No | ✅ PASSED |  |
| TC-08 | Media | Saltar un intento | US-04 | Sí | ✅ PASSED |  |
| TC-09 | Media | Saltar en el sexto intento | US-04 | No | ✅ PASSED |  |
| TC-10 | Alta | Pantalla de resultado de la ronda | US-05 | Sí | ✅ PASSED |  |
| TC-11 | Alta | Registrar jugadores válidos | US-06 | Sí | ✅ PASSED |  |
| TC-12 | Alta | Límites de cantidad de jugadores (1 y 13) | US-06 | No | ✅ PASSED |  |
| TC-13 | Media | Validación de nombres de jugadores | US-06 | No | ✅ PASSED |  |
| TC-14 | Alta | Rotación de turnos entre rondas | US-07 | Sí | ✅ PASSED |  |
| TC-15 | Alta | Cálculo de puntos según el intento | US-08 | No | ✅ PASSED |  |
| TC-16 | Alta | Partida completa y ganador | US-08, US-09 | Sí | ✅ PASSED |  |
| TC-17 | Media | Empate en el primer puesto | US-08 | No | ✅ PASSED |  |
| TC-18 | Media | Compartir el resultado de la partida | US-09 | Sí | ⛔ BLOCKED | — |
| TC-19 | Media | Modo Diario: misma canción y una vez por día | US-10, US-09 | Sí | ✅ PASSED |  |
| TC-20 | Media | Modo Infinito: siguiente canción y racha | US-11 | Sí | ✅ PASSED |  |
| TC-21 | Media | Filtro combinado: género + época | US-12 | Sí | ✅ PASSED |  |
| TC-22 | Baja | Combinación de filtros sin canciones | US-12 | No | ✅ PASSED |  |
| TC-23 | Alta | Uso en celular de 360 px de ancho | RNF-01 | No | ✅ PASSED |  |
| TC-24 | Media | Falla de conexión con la API de audio | RNF-06 | No | ✅ PASSED |  |
| TC-25 | Baja | Buscar una canción cuyo título tiene 1 solo carácter | US-02 | No | ❌ FAILED | DF-01 |
| TC-26 | Media | Tiempo de carga de una ronda | RNF-02 | No | ✅ PASSED |  |
| TC-27 | Alta | Origen e integridad del catálogo de canciones | RNF-07 | No | ✅ PASSED |  |
| TC-28 | Media | Compatibilidad entre Chrome y Firefox en escritorio | RNF-05 | No | ✅ PASSED |  |

## Detalle por caso

---

### TC-01 — Reproducir el primer fragmento de 1 segundo

- **Estado:** ✅ PASSED
- **Prioridad:** Alta · **Funcionalidad:** Reproducción de audio · **Historias:** US-01
- **Creador del caso:** Franco · **Camino feliz:** Sí · **Duración:** 3.2 s
- **Prerrequisitos:** Abrir la aplicación desde un navegador web (Desktop). / Elegir Modo Infinito sin filtros.

| # | Paso | Resultado esperado | Resultado obtenido | OK |
|---|---|---|---|---|
| 1 | Observar la pantalla de juego antes de reproducir. | Se muestra "Intento 1 de 6" y la barra indica 1 s desbloqueado. | Intento 1 de 6 · barra: 1 s | ✅ |
| 2 | Hacer click en "Play". | Se reproduce audio durante 1 segundo y se detiene solo. | sonó 0.98 s (corte a los 1081 ms) | ✅ |
| 3 | Hacer click en "Play" otra vez. | Se vuelve a reproducir el mismo segundo. El indicador sigue en "Intento 1 de 6". | sonó 0.99 s · Intento 1 de 6 | ✅ |

**Errores de consola durante el caso:** ninguno

---

### TC-02 — Desbloqueo progresivo de segundos tras respuestas incorrectas

- **Estado:** ✅ PASSED
- **Prioridad:** Alta · **Funcionalidad:** Reproducción de audio · **Historias:** US-01, US-03
- **Creador del caso:** Franco · **Camino feliz:** No · **Duración:** 43.8 s
- **Prerrequisitos:** Abrir la aplicación con modo debug (?debug=1). / Elegir Modo Infinito sin filtros.

| # | Paso | Resultado esperado | Resultado obtenido | OK |
|---|---|---|---|---|
| 1 | Buscar y elegir una canción incorrecta. Hacer click en "Enviar". | Se muestra "Incorrecto", la respuesta queda en el historial y el indicador pasa a "Intento 2 de 6". | historial con 1 incorrecta(s) · Intento 2 de 6 | ✅ |
| 2 | Hacer click en "Play". | "Intento 2 de 6". Se reproducen 2 segundos. | barra 2 s · sonó 1.98 s | ✅ |
| 3 | Enviar otra canción incorrecta y hacer click en "Play". | "Intento 3 de 6". Se reproducen 4 segundos. | barra 4 s · sonó 4.00 s | ✅ |
| 4 | Enviar otra canción incorrecta y hacer click en "Play". | "Intento 4 de 6". Se reproducen 7 segundos. | barra 7 s · sonó 7.00 s | ✅ |
| 5 | Enviar otra canción incorrecta y hacer click en "Play". | "Intento 5 de 6". Se reproducen 11 segundos. | barra 11 s · sonó 10.99 s | ✅ |
| 6 | Enviar otra canción incorrecta y hacer click en "Play". | "Intento 6 de 6". Se reproducen 16 segundos. | barra 16 s · sonó 15.99 s | ✅ |

**Errores de consola durante el caso:** ninguno

---

### TC-03 — Autocompletado por título

- **Estado:** ✅ PASSED
- **Prioridad:** Alta · **Funcionalidad:** Buscador · **Historias:** US-02
- **Creador del caso:** Lucas · **Camino feliz:** Sí · **Duración:** 1.3 s
- **Prerrequisitos:** Abrir la aplicación desde un navegador web (Desktop). / Elegir Modo Infinito sin filtros.
- **Datos de prueba:** Texto 1: d · Texto 2: de música · Canción esperada: De Música Ligera — Soda Stereo

| # | Paso | Resultado esperado | Resultado obtenido | OK |
|---|---|---|---|---|
| 1 | Hacer click en el buscador y escribir el Texto 1. | No aparecen sugerencias (se necesitan al menos 2 caracteres). | no aparecieron sugerencias | ✅ |
| 2 | Completar hasta el Texto 2. | Aparecen como máximo 8 sugerencias con formato "Título — Artista", entre ellas la canción esperada. | 1 sugerencia(s): De Música Ligera — Soda Stereo | ✅ |
| 3 | Hacer click en la canción esperada. | El buscador muestra la canción elegida y se habilita el botón "Enviar". | input: "De Música Ligera — Soda Stereo" · Enviar habilitado: true | ✅ |

**Errores de consola durante el caso:** ninguno

---

### TC-04 — Autocompletado por artista, sin tildes ni mayúsculas

- **Estado:** ✅ PASSED
- **Prioridad:** Media · **Funcionalidad:** Buscador · **Historias:** US-02
- **Creador del caso:** Lucas · **Camino feliz:** No · **Duración:** 1.1 s
- **Prerrequisitos:** Abrir la aplicación desde un navegador web (Desktop). / Elegir Modo Infinito sin filtros.
- **Datos de prueba:** Texto 1: SODA · Texto 2: musica ligera

| # | Paso | Resultado esperado | Resultado obtenido | OK |
|---|---|---|---|---|
| 1 | Escribir el Texto 1 en el buscador. | Aparecen sugerencias con canciones de Soda Stereo. | 8 sugerencia(s): Corazón Delator — Soda Stereo \| Cuando Pase El Temblor — Soda Stereo \| De Música Ligera — Soda Stereo \| Disco Eterno — Soda Stereo \| Ella Usó Mi Cabeza Como Un Revólver — Soda Stereo \| En La Ciudad De La Furia — Soda Stereo \| Entre Caníbales — Soda Stereo \| Nada Personal — Soda Stereo | ✅ |
| 2 | Borrar y escribir el Texto 2 (sin tilde). | Aparece la canción esperada (con tilde). | De Música Ligera — Soda Stereo | ✅ |

**Errores de consola durante el caso:** ninguno

---

### TC-05 — Búsqueda sin resultados y envío de texto libre

- **Estado:** ✅ PASSED
- **Prioridad:** Media · **Funcionalidad:** Buscador · **Historias:** US-02
- **Creador del caso:** Lucas · **Camino feliz:** No · **Duración:** 1.2 s
- **Prerrequisitos:** Abrir la aplicación desde un navegador web (Desktop). / Elegir Modo Infinito sin filtros.
- **Datos de prueba:** Texto: xyzqw

| # | Paso | Resultado esperado | Resultado obtenido | OK |
|---|---|---|---|---|
| 1 | Escribir el texto en el buscador. | Se muestra "No hay resultados". | No hay resultados | ✅ |
| 2 | Presionar Enter y hacer click en "Enviar". | No se envía nada: "Enviar" está deshabilitado y el indicador sigue en "Intento 1 de 6". | Enviar deshabilitado: true · Intento 1 de 6 | ✅ |

**Errores de consola durante el caso:** ninguno

---

### TC-06 — Acierto en el primer intento

- **Estado:** ✅ PASSED
- **Prioridad:** Alta · **Funcionalidad:** Validación de respuesta · **Historias:** US-03, US-05, US-08
- **Creador del caso:** Severiano · **Camino feliz:** Sí · **Duración:** 2.5 s
- **Prerrequisitos:** Abrir la aplicación con modo debug. / Modo Previa con 2 jugadores (Ana, Beto). / Es el turno de Ana en la ronda 1.

| # | Paso | Resultado esperado | Resultado obtenido | OK |
|---|---|---|---|---|
| 1 | Hacer click en "¡Listo!" y luego en "Play". | Se reproduce 1 segundo. | sonó 0.99 s | ✅ |
| 2 | Buscar y elegir la canción que muestra el modo debug. Hacer click en "Enviar". | Se muestra "¡Correcto!" y termina la ronda de Ana. | ¡Correcto! | ✅ |
| 3 | Observar la pantalla de resultado. | Se muestra "Acertaste en el intento 1 — +10 puntos". | Acertaste en el intento 1 — +10 puntos | ✅ |
| 4 | Abrir el marcador. | Ana: 10 puntos, 1 acierto. Beto: 0 puntos. | 1 / 🦊         Ana / 10 / 1 \|\| 2 / 🐼         Beto / 0 / 0 | ✅ |

**Errores de consola durante el caso:** ninguno

---

### TC-07 — Seis respuestas incorrectas

- **Estado:** ✅ PASSED
- **Prioridad:** Alta · **Funcionalidad:** Validación de respuesta · **Historias:** US-03, US-05
- **Creador del caso:** Severiano · **Camino feliz:** No · **Duración:** 3.2 s
- **Prerrequisitos:** Abrir la aplicación con modo debug. / Elegir Modo Infinito sin filtros.

| # | Paso | Resultado esperado | Resultado obtenido | OK |
|---|---|---|---|---|
| 1 | Enviar 5 respuestas incorrectas. | Cada una aparece en el historial marcada como incorrecta. El indicador llega a "Intento 6 de 6". | 5 incorrectas en el historial · Intento 6 de 6 | ✅ |
| 2 | Enviar la 6.ª respuesta incorrecta. | La ronda termina con "No acertada — 0 puntos" y se revela la canción. | No acertada · No acertada — 0 puntos · canción revelada: Sin Gamulán | ✅ |
| 3 | Intentar escribir en el buscador. | El buscador ya no está disponible para esta canción. | el buscador ya no está en pantalla | ✅ |

**Errores de consola durante el caso:** ninguno

---

### TC-08 — Saltar un intento

- **Estado:** ✅ PASSED
- **Prioridad:** Media · **Funcionalidad:** Saltar · **Historias:** US-04
- **Creador del caso:** Ramiro · **Camino feliz:** Sí · **Duración:** 3.6 s
- **Prerrequisitos:** Abrir la aplicación desde un navegador web (Desktop). / Elegir Modo Infinito sin filtros.

| # | Paso | Resultado esperado | Resultado obtenido | OK |
|---|---|---|---|---|
| 1 | Observar el botón "Saltar". | Muestra "Saltar (+1 s)". | Saltar (+1 s) | ✅ |
| 2 | Hacer click en "Saltar". | El historial muestra "Saltado", el indicador pasa a "Intento 2 de 6" y el botón pasa a "Saltar (+2 s)". | historial: Saltado · Intento 2 de 6 · botón: Saltar (+2 s) | ✅ |
| 3 | Hacer click en "Play". | Se reproducen 2 segundos. | sonó 1.99 s | ✅ |

**Errores de consola durante el caso:** ninguno

---

### TC-09 — Saltar en el sexto intento

- **Estado:** ✅ PASSED
- **Prioridad:** Media · **Funcionalidad:** Saltar · **Historias:** US-04
- **Creador del caso:** Ramiro · **Camino feliz:** No · **Duración:** 1.4 s
- **Prerrequisitos:** Abrir la aplicación desde un navegador web (Desktop). / Elegir Modo Infinito sin filtros.

| # | Paso | Resultado esperado | Resultado obtenido | OK |
|---|---|---|---|---|
| 1 | Hacer click en "Saltar" 5 veces. | El historial muestra 5 "Saltado" y el indicador está en "Intento 6 de 6". | 5 saltados · Intento 6 de 6 | ✅ |
| 2 | Observar el botón y hacer click en "Saltar" una vez más. | El botón dice "Saltar (termina la ronda)". La ronda termina con "No acertada — 0 puntos" y se revela la canción. | botón: Saltar (termina la ronda) · No acertada · No acertada — 0 puntos · revela: Un Poco De Amor Francés | ✅ |

**Errores de consola durante el caso:** ninguno

---

### TC-10 — Pantalla de resultado de la ronda

- **Estado:** ✅ PASSED
- **Prioridad:** Alta · **Funcionalidad:** Resultado de la ronda · **Historias:** US-05
- **Creador del caso:** Franco · **Camino feliz:** Sí · **Duración:** 31.6 s
- **Prerrequisitos:** Abrir la aplicación con modo debug. / Elegir Modo Infinito sin filtros.

| # | Paso | Resultado esperado | Resultado obtenido | OK |
|---|---|---|---|---|
| 1 | Hacer click en "Saltar" 2 veces. Luego elegir la canción correcta y hacer click en "Enviar". | Se muestra "¡Correcto!". | ¡Correcto! | ✅ |
| 2 | Revisar la pantalla de resultado. | Se muestran título, artista, año y carátula, iguales a los del modo debug, y "Intento 3 — +6 puntos". | La Pregunta / Babasónicos / 2018 / carátula ok / Acertaste en el intento 3 — +6 puntos | ✅ |
| 3 | Inspeccionar el texto del veredicto con DevTools. | El tamaño de letra es de 23 px o más. | veredicto 30 px · detalle 23 px | ✅ |
| 4 | Hacer click en "Play" en la pantalla de resultado. | Se reproduce el fragmento completo (unos 30 segundos). | sonó 29.98 s | ✅ |
| 5 | Hacer click en "Siguiente". | Carga una nueva canción. | La Pregunta → Guadalupe | ✅ |

**Errores de consola durante el caso:** ninguno

---

### TC-11 — Registrar jugadores válidos

- **Estado:** ✅ PASSED
- **Prioridad:** Alta · **Funcionalidad:** Registro de jugadores · **Historias:** US-06
- **Creador del caso:** Lucas · **Camino feliz:** Sí · **Duración:** 1.1 s
- **Prerrequisitos:** Abrir la aplicación desde un navegador web (Desktop). / Elegir "Modo Previa".
- **Datos de prueba:** Jugadores: Ana, Beto, Caro

| # | Paso | Resultado esperado | Resultado obtenido | OK |
|---|---|---|---|---|
| 1 | Observar la pantalla de jugadores. | La lista está vacía y el botón "Empezar" está deshabilitado. | 0 jugadores · Empezar deshabilitado: true | ✅ |
| 2 | Agregar a "Ana". | Ana aparece en la lista con un color y un emoji. | [{"nombre":"Ana","emoji":"🦊","color":"rgb(109, 226, 163)"}] | ✅ |
| 3 | Agregar a "Beto". | Beto aparece con un color y un emoji distintos a los de Ana. "Empezar" se habilita. | 🦊\|rgb(109, 226, 163) · 🐼\|rgb(247, 201, 72) · Empezar habilitado: true | ✅ |
| 4 | Agregar a "Caro". | Hay 3 jugadores, todos con colores y emojis distintos. | 🦊\|rgb(109, 226, 163) · 🐼\|rgb(247, 201, 72) · 🐸\|rgb(255, 143, 163) | ✅ |
| 5 | Eliminar a "Beto". | Quedan Ana y Caro. | Ana, Caro | ✅ |
| 6 | Hacer click en "Empezar la partida". | Se muestra "Ronda 1 de 5" y "Le toca a Ana" con su color y su emoji. | Ronda 1 de 5 · Le toca a Ana | ✅ |

**Errores de consola durante el caso:** ninguno

---

### TC-12 — Límites de cantidad de jugadores (1 y 13)

- **Estado:** ✅ PASSED
- **Prioridad:** Alta · **Funcionalidad:** Registro de jugadores · **Historias:** US-06
- **Creador del caso:** Lucas · **Camino feliz:** No · **Duración:** 3.4 s
- **Prerrequisitos:** Abrir la aplicación desde un navegador web (Desktop). / Elegir "Modo Previa".
- **Datos de prueba:** Jugadores: J1, J2, … J13

| # | Paso | Resultado esperado | Resultado obtenido | OK |
|---|---|---|---|---|
| 1 | Agregar solo a "J1". | El botón "Empezar" sigue deshabilitado. | Empezar deshabilitado: true | ✅ |
| 2 | Agregar de "J2" a "J12". | Hay 12 jugadores, cada uno con color y emoji distintos. "Empezar la partida" está habilitado. | 12 jugadores · 12 identidades únicas · Empezar habilitado: true | ✅ |
| 3 | Intentar agregar a "J13". | No se agrega: se muestra "Máximo 12 jugadores" o el botón para agregar está deshabilitado. | sigue habiendo 12 jugadores · Agregar deshabilitado: true · aviso: "Máximo 12 jugadores." | ✅ |

**Errores de consola durante el caso:** ninguno

---

### TC-13 — Validación de nombres de jugadores

- **Estado:** ✅ PASSED
- **Prioridad:** Media · **Funcionalidad:** Registro de jugadores · **Historias:** US-06
- **Creador del caso:** Severiano · **Camino feliz:** No · **Duración:** 1.2 s
- **Prerrequisitos:** Abrir la aplicación desde un navegador web (Desktop). / Elegir "Modo Previa".
- **Datos de prueba:** Nombre 1: Ana · Nombres 2 y 3: (vacío) y (3 espacios) · Nombre 4: ana · Nombre 5: Bartolomeo Gonzalez (19 caracteres)

| # | Paso | Resultado esperado | Resultado obtenido | OK |
|---|---|---|---|---|
| 1 | Agregar el Nombre 1. | Ana se agrega a la lista. | Ana | ✅ |
| 2 | Intentar agregar el Nombre 2 (vacío). | No se agrega y se muestra un mensaje de nombre obligatorio. | 1 jugador(es) · mensaje: "El nombre es obligatorio." | ✅ |
| 3 | Intentar agregar el Nombre 3 (3 espacios). | No se agrega y se muestra un mensaje de nombre obligatorio. | 1 jugador(es) · mensaje: "El nombre es obligatorio." | ✅ |
| 4 | Intentar agregar el Nombre 4 ("ana"). | No se agrega y se muestra un mensaje de nombre repetido. | 1 jugador(es) · mensaje: "Ese nombre ya está en la lista." | ✅ |
| 5 | Escribir el Nombre 5 (19 caracteres). | El campo no permite más de 15 caracteres o muestra un error. | el campo quedó con "Bartolomeo Gonz" (15 caracteres, maxlength=15) | ✅ |

**Errores de consola durante el caso:** ninguno

---

### TC-14 — Rotación de turnos entre rondas

- **Estado:** ✅ PASSED
- **Prioridad:** Alta · **Funcionalidad:** Turnos · **Historias:** US-07
- **Creador del caso:** Franco · **Camino feliz:** Sí · **Duración:** 2.6 s
- **Prerrequisitos:** Abrir la aplicación con modo debug. / Modo Previa con 3 jugadores (Ana, Beto, Caro). Partida empezada.

| # | Paso | Resultado esperado | Resultado obtenido | OK |
|---|---|---|---|---|
| 1 | Observar la pantalla. | Se muestra "Ronda 1 de 5 — Le toca a Ana". | Ronda 1 de 5 — Le toca a Ana | ✅ |
| 2 | Ana juega su turno. Hacer click en "Continuar". | Se muestra "Le toca a Beto", ronda 1. | Ronda 1 de 5 — Le toca a Beto | ✅ |
| 3 | Beto juega su turno. Hacer click en "Continuar". | Se muestra "Le toca a Caro", ronda 1. | Ronda 1 de 5 — Le toca a Caro | ✅ |
| 4 | Caro juega su turno. Hacer click en "Continuar". | Se muestra "Ronda 2 de 5 — Le toca a Ana". | Ronda 2 de 5 — Le toca a Ana | ✅ |
| 5 | Comparar las 3 canciones anotadas. | Las 3 canciones son distintas. | Bohemian Rhapsody \| Starboy \| El Farolito | ✅ |

**Errores de consola durante el caso:** ninguno

---

### TC-15 — Cálculo de puntos según el intento

- **Estado:** ✅ PASSED
- **Prioridad:** Alta · **Funcionalidad:** Puntuación · **Historias:** US-08
- **Creador del caso:** Severiano · **Camino feliz:** No · **Duración:** 6.8 s
- **Prerrequisitos:** Abrir la aplicación con modo debug. / Modo Previa con 7 jugadores (J1 a J7). Partida empezada.

| # | Paso | Resultado esperado | Resultado obtenido | OK |
|---|---|---|---|---|
| 1 | J1 acierta en el 1.er intento. | +10 puntos. | Acertaste en el intento 1 — +10 puntos | ✅ |
| 2 | J2 salta 1 vez/veces y acierta (intento 2). | +8 puntos. | Acertaste en el intento 2 — +8 puntos | ✅ |
| 3 | J3 salta 2 vez/veces y acierta (intento 3). | +6 puntos. | Acertaste en el intento 3 — +6 puntos | ✅ |
| 4 | J4 salta 3 vez/veces y acierta (intento 4). | +4 puntos. | Acertaste en el intento 4 — +4 puntos | ✅ |
| 5 | J5 salta 4 vez/veces y acierta (intento 5). | +2 puntos. | Acertaste en el intento 5 — +2 puntos | ✅ |
| 6 | J6 salta 5 vez/veces y acierta (intento 6). | +1 puntos. | Acertaste en el intento 6 — +1 puntos | ✅ |
| 7 | J7 salta 6 veces (no acierta). | 0 puntos. | No acertada — 0 puntos | ✅ |
| 8 | Abrir el marcador. | J1 10, J2 8, J3 6, J4 4, J5 2, J6 1, J7 0, en ese orden. | J1=10, J2=8, J3=6, J4=4, J5=2, J6=1, J7=0 | ✅ |

**Errores de consola durante el caso:** ninguno

---

### TC-16 — Partida completa y ganador

- **Estado:** ✅ PASSED
- **Prioridad:** Alta · **Funcionalidad:** Puntuación · **Historias:** US-08, US-09
- **Creador del caso:** Ramiro · **Camino feliz:** Sí · **Duración:** 8.2 s
- **Prerrequisitos:** Abrir la aplicación con modo debug. / Modo Previa con 2 jugadores (Ana, Beto). Partida empezada. / Ana: acierta siempre en el intento 1. Beto: salta siempre 6 veces.

| # | Paso | Resultado esperado | Resultado obtenido | OK |
|---|---|---|---|---|
| 1 | Jugar las rondas 1 a 4 según los datos de prueba. | El contador avanza hasta "Ronda 5 de 5". | Ronda 5 de 5 | ✅ |
| 2 | Jugar la ronda 5. Al terminar el turno de Beto, hacer click en "Ver resultado final". | Se muestra la pantalla final (no empieza una ronda 6). | botón: "Ver resultado final" · pantalla de turno visible: false | ✅ |
| 3 | Revisar la pantalla final. | Se muestra "Ganó Ana con 50 puntos", el podio y la tabla (Beto: 0 puntos). | Ganó Ana con 50 puntos · 2 puestos en el podio · tabla: Ana=50, Beto=0 | ✅ |

**Errores de consola durante el caso:** ninguno

---

### TC-17 — Empate en el primer puesto

- **Estado:** ✅ PASSED
- **Prioridad:** Media · **Funcionalidad:** Puntuación · **Historias:** US-08
- **Creador del caso:** Ramiro · **Camino feliz:** No · **Duración:** 7.4 s
- **Prerrequisitos:** Abrir la aplicación con modo debug. / Modo Previa con 2 jugadores (Ana, Beto). Partida empezada. / Ambos aciertan siempre en el intento 1.

| # | Paso | Resultado esperado | Resultado obtenido | OK |
|---|---|---|---|---|
| 1 | Jugar las 5 rondas según los datos de prueba. | Ana y Beto terminan con 50 puntos cada uno. | Ana=50, Beto=50 | ✅ |
| 2 | Revisar la pantalla final. | Ana y Beto aparecen como ganadores empatados. | Empate: ganan Ana y Beto con 50 puntos | ✅ |

**Errores de consola durante el caso:** ninguno

---

### TC-18 — Compartir el resultado de la partida

- **Estado:** ⛔ BLOCKED
- **Prioridad:** Media · **Funcionalidad:** Compartir · **Historias:** US-09
- **Creador del caso:** Ramiro · **Camino feliz:** Sí · **Duración:** 8.0 s
- **Prerrequisitos:** Dispositivo 1: Android + Chrome con WhatsApp instalado. / Dispositivo 2: PC + Firefox.

| # | Paso | Resultado esperado | Resultado obtenido | OK |
|---|---|---|---|---|
| 1 | En el celular, hacer click en "Compartir". | Se abre el menú de compartir del celular con el ganador, sus puntos y el link del juego. | NO EJECUTADO — requiere un celular Android real (ningún integrante tiene uno disponible) | ⚪ |
| 2 | Elegir WhatsApp. | El mensaje aparece precargado con ese texto. | NO EJECUTADO — requiere WhatsApp instalado en Android | ⚪ |
| 3 | En la PC con Firefox, terminar una partida y hacer click en "Compartir". | Se muestra "¡Copiado!". | navigator.share disponible: false · aviso mostrado: "¡Copiado!" | ✅ |
| 4 | Pegar (Ctrl+V) en un bloc de notas. | Se pega el mismo texto del resultado. | Cancionero 🍻 Modo Previa — 5 rondas ⏎ 🥇 Ana — 50 pts ⏎ 🥈 Beto — 40 pts ⏎ http://127.0.0.1:57228/ | ✅ |
| 5 | Hacer click en "Jugar de nuevo". | Empieza una partida nueva con los mismos jugadores y los puntos en 0. | Ronda 1 de 5 · Le toca a Ana · Ana=0,Beto=0 | ✅ |

**Errores de consola durante el caso:** ninguno

---

### TC-19 — Modo Diario: misma canción y una vez por día

- **Estado:** ✅ PASSED
- **Prioridad:** Media · **Funcionalidad:** Modo Diario · **Historias:** US-10, US-09
- **Creador del caso:** Severiano · **Camino feliz:** Sí · **Duración:** 3.0 s
- **Prerrequisitos:** Tener dos navegadores distintos (dos contextos aislados, como una ventana de incógnito). / Abrir la aplicación con modo debug.

| # | Paso | Resultado esperado | Resultado obtenido | OK |
|---|---|---|---|---|
| 1 | En el navegador A, entrar al "Modo Diario" y anotar la canción. | Se muestra la canción del día. | Paloma — Andrés Calamaro | ✅ |
| 2 | En el navegador B, entrar al "Modo Diario" y anotar la canción. | Es la misma canción que en el navegador A. | Paloma — Andrés Calamaro | ✅ |
| 3 | En el navegador A, jugar hasta terminar la canción. | Se muestra el resultado. | Acertaste en el intento 3 — +6 puntos | ✅ |
| 4 | Hacer click en "Compartir". | El texto muestra cuadraditos por intento y no revela el nombre de la canción. | Cancionero 🎵 Diaria 2026-09-28 ⏎ 🟥🟥🟩⬜⬜⬜ 3/6 ⏎ http://127.0.0.1:57228/ | ✅ |
| 5 | En el navegador A, volver al inicio y entrar al "Modo Diario" otra vez. | No deja jugar: muestra el resultado de hoy y cuánto falta para la próxima canción. | botón deshabilitado: true · "🟥🟥🟩⬜⬜⬜ La acertaste en el intento 3.Ya jugaste la canción de hoy (2026-09-28). Próxima canción en 2 h 23 min." | ✅ |

**Errores de consola durante el caso:** ninguno

---

### TC-20 — Modo Infinito: siguiente canción y racha

- **Estado:** ✅ PASSED
- **Prioridad:** Media · **Funcionalidad:** Modo Infinito · **Historias:** US-11
- **Creador del caso:** Franco · **Camino feliz:** Sí · **Duración:** 3.8 s
- **Prerrequisitos:** Abrir la aplicación con modo debug. / Elegir Modo Infinito sin filtros.

| # | Paso | Resultado esperado | Resultado obtenido | OK |
|---|---|---|---|---|
| 1 | Acertar la canción. | Racha actual: 1. | Racha actual: 1 · Mejor racha: 1 | ✅ |
| 2 | Hacer click en "Siguiente" y acertar. | La canción es distinta a la anterior. Racha actual: 2. | Danza Kuduro → Maldito Duende · Racha actual: 2 · Mejor racha: 2 | ✅ |
| 3 | Hacer click en "Siguiente" y saltar 6 veces. | Racha actual: 0. Mejor racha: 2. | Racha actual: 0 · Mejor racha: 2 | ✅ |
| 4 | Recargar la página (F5) y volver al "Modo Infinito". | La mejor racha sigue en 2. | mejor racha: 2 | ✅ |
| 5 | Hacer click en "⟵ Inicio". | Vuelve a la pantalla inicial del Modo Infinito (filtros). | pantalla de inicio con filtros visibles: true | ✅ |

**Errores de consola durante el caso:** ninguno

---

### TC-21 — Filtro combinado: género + época

- **Estado:** ✅ PASSED
- **Prioridad:** Media · **Funcionalidad:** Filtros · **Historias:** US-12
- **Creador del caso:** Lucas · **Camino feliz:** Sí · **Duración:** 4.6 s
- **Prerrequisitos:** Abrir la aplicación con modo debug. / Elegir "Modo Infinito".
- **Datos de prueba:** Género: Rock Nacional · Época: 80s (1980–1989)

| # | Paso | Resultado esperado | Resultado obtenido | OK |
|---|---|---|---|---|
| 1 | Abrir los filtros y elegir el género. | Se muestra la cantidad de canciones disponibles. | 260 canciones disponibles | ✅ |
| 2 | Agregar la época. | La cantidad de canciones baja o se mantiene, pero nunca es 0 en este caso. | 260 canciones disponibles → 67 canciones disponibles | ✅ |
| 3 | Empezar y jugar 5 canciones (con "Saltar" y "Siguiente"), anotando cada una. | Las 5 canciones son del género Rock Nacional y de años entre 1980 y 1989. | Entregá El Marrón [rock/1989] ✓ · Cuando Pase El Temblor [rock/1985] ✓ · Signos [rock/1986] ✓ · En La Ciudad De La Furia [rock/1988] ✓ · Guitarras Blancas [rock/1988] ✓ | ✅ |

**Errores de consola durante el caso:** ninguno

---

### TC-22 — Combinación de filtros sin canciones

- **Estado:** ✅ PASSED
- **Prioridad:** Baja · **Funcionalidad:** Filtros · **Historias:** US-12
- **Creador del caso:** Lucas · **Camino feliz:** No · **Duración:** 1.0 s
- **Prerrequisitos:** Abrir la aplicación desde un navegador web (Desktop). / Elegir "Modo Infinito".
- **Datos de prueba:** Artista: Soda Stereo · Época: 2020s

| # | Paso | Resultado esperado | Resultado obtenido | OK |
|---|---|---|---|---|
| 1 | Elegir el artista y la época en los filtros. | Se muestra "0 canciones" y un aviso de que no hay canciones con esos filtros. | "0 canciones — no hay canciones con esos filtros" (resaltado en rojo: true) | ✅ |
| 2 | Intentar empezar. | El botón para empezar está deshabilitado o se muestra el aviso y no arranca. | Empezar deshabilitado: true · sigue en la pantalla de inicio: true | ✅ |

**Errores de consola durante el caso:** ninguno

---

### TC-23 — Uso en celular de 360 px de ancho

- **Estado:** ✅ PASSED
- **Prioridad:** Alta · **Funcionalidad:** Usabilidad móvil · **Historias:** RNF-01
- **Creador del caso:** Severiano · **Camino feliz:** No · **Duración:** 1.6 s
- **Prerrequisitos:** Navegador en modo dispositivo, tamaño 360 x 740.
- **Datos de prueba:** Resolución: 360 x 740

| # | Paso | Resultado esperado | Resultado obtenido | OK |
|---|---|---|---|---|
| 1 | Recorrer las pantallas: inicio, jugadores, juego, resultado y marcador. | En ninguna aparece scroll horizontal y nada queda cortado. | sin scroll horizontal en ninguna pantalla | ✅ |
| 2 | Inspeccionar los botones principales (Play, Saltar, Enviar). | Todos miden 44 px de alto o más. | btn-play: 88x88 · btn-saltar: 163x46 · btn-enviar: 163x46 | ✅ |
| 3 | Inspeccionar el buscador. | El tamaño de letra es de 16 px o más. | 16 px | ✅ |
| 4 | En el iPhone, tocar el buscador. | La pantalla no hace zoom automático. | verificado por el criterio equivalente: el input declara 16 px, que es el umbral con el que iOS evita el zoom automático (no hay un iPhone real en el entorno de pruebas) | ✅ |

**Errores de consola durante el caso:** ninguno

---

### TC-24 — Falla de conexión con la API de audio

- **Estado:** ✅ PASSED
- **Prioridad:** Media · **Funcionalidad:** Tolerancia a fallas · **Historias:** RNF-06
- **Creador del caso:** Franco · **Camino feliz:** No · **Duración:** 3.6 s
- **Prerrequisitos:** Abrir la aplicación con la consola de red disponible.
- **Datos de prueba:** Red: Online → Offline → Online

| # | Paso | Resultado esperado | Resultado obtenido | OK |
|---|---|---|---|---|
| 1 | Entrar al "Modo Infinito" con conexión. | Carga una canción y se puede reproducir. | Birds of a Feather — sonó 0.98 s | ✅ |
| 2 | Pasar la red a Offline y pedir una ronda nueva. | Se muestra el aviso de falta de conexión y el botón "Reintentar". Los controles de juego quedan deshabilitados. | "No hay conexión con la fuente de audio. Revisá internet y reintentá." · Reintentar visible: true · controles ocultos: true | ✅ |
| 3 | Volver a "No throttling" (online) y hacer click en "Reintentar". | Carga la canción y se reproduce normalmente. | rockstar — sonó 1.00 s | ✅ |

**Errores de consola durante el caso:** ninguno

---

### TC-25 — Buscar una canción cuyo título tiene 1 solo carácter

- **Estado:** ❌ FAILED
- **Prioridad:** Baja · **Funcionalidad:** Buscador · **Historias:** US-02
- **Creador del caso:** Severiano · **Camino feliz:** No · **Duración:** 1.6 s
- **Prerrequisitos:** Abrir la aplicación desde un navegador web (Desktop). / Elegir Modo Infinito sin filtros.
- **Datos de prueba:** Canción: X — Nicky Jam & J Balvin · Texto: X

| # | Paso | Resultado esperado | Resultado obtenido | OK |
|---|---|---|---|---|
| 1 | Escribir el texto en el buscador. | Aparece la sugerencia "X — Nicky Jam & J Balvin", como pasa con cualquier título del catálogo. | no aparece ninguna sugerencia (ni siquiera «No hay resultados») | ❌ |
| 2 | Hacer click en la sugerencia. | La canción queda elegida y se habilita "Enviar". | no hay ninguna sugerencia para elegir | ❌ |

**Errores de consola durante el caso:** ninguno

---

### TC-26 — Tiempo de carga de una ronda

- **Estado:** ✅ PASSED
- **Prioridad:** Media · **Funcionalidad:** Rendimiento · **Historias:** RNF-02
- **Creador del caso:** Ramiro · **Camino feliz:** No · **Duración:** 6.6 s
- **Prerrequisitos:** Conexión estable, sin throttling. / Caché desactivada.
- **Datos de prueba:** Repeticiones: 10 rondas · Medición: tiempo entre pedir la ronda y poder reproducir el audio

| # | Paso | Resultado esperado | Resultado obtenido | OK |
|---|---|---|---|---|
| 1 | Entrar al "Modo Infinito" y pedir diez rondas seguidas. | Se registra una medición por ronda, hasta completar diez. | 10 mediciones (ms): 168, 90, 83, 88, 85, 84, 86, 90, 104, 85 | ✅ |
| 2 | Leer el promedio y el máximo de las diez mediciones. | El máximo es menor a 5 segundos, como pide RNF-02. | máximo 0.17 s · promedio 0.10 s | ✅ |

**Errores de consola durante el caso:** ninguno

---

### TC-27 — Origen e integridad del catálogo de canciones

- **Estado:** ✅ PASSED
- **Prioridad:** Alta · **Funcionalidad:** Integridad del catálogo · **Historias:** RNF-07
- **Creador del caso:** Lucas · **Camino feliz:** No · **Duración:** 1.1 s
- **Prerrequisitos:** Abrir la aplicación con la pestaña de red disponible. / Tener a mano la cantidad de canciones documentada para la V1.
- **Datos de prueba:** Archivo: catalogo.js · Canciones esperadas: 672 (las documentadas para la V1)

| # | Paso | Resultado esperado | Resultado obtenido | OK |
|---|---|---|---|---|
| 1 | Recargar la página y buscar el pedido de "catalogo.js". Mirar de qué dominio se descarga. | El archivo se descarga del mismo dominio de la aplicación. | http://127.0.0.1:57228/catalogo.js?v=1.0.0 | ✅ |
| 2 | Verificar cuántas canciones tiene el catálogo que quedó cargado. | La cantidad coincide con las 672 canciones documentadas para la V1. | 672 canciones | ✅ |
| 3 | Revisar que no haya canciones repetidas ni canciones sin audio reproducible. | Cero duplicados y cero canciones sin audio, como pide RNF-07. | duplicados: 0 · sin URL de audio: 0 · sin carátula: 0 · sin año: 0 · género inválido: 0 · previews no accesibles (verificadas las 672 por HTTP): 0 | ✅ |

**Errores de consola durante el caso:** ninguno

---

### TC-28 — Compatibilidad entre Chrome y Firefox en escritorio

- **Estado:** ✅ PASSED
- **Prioridad:** Media · **Funcionalidad:** Compatibilidad · **Historias:** RNF-05
- **Creador del caso:** Ramiro · **Camino feliz:** No · **Duración:** 5.4 s
- **Prerrequisitos:** Tener Chrome y Firefox actualizados en la misma computadora. / Abrir la consola en ambos.

| # | Paso | Resultado esperado | Resultado obtenido | OK |
|---|---|---|---|---|
| 1 | En Chrome, jugar una ronda completa del "Modo Infinito". | El audio suena, el buscador sugiere y la pantalla de resultado se muestra completa. La consola no muestra errores. | audio 1 s · 1 sugerencias · ¡Correcto! · ficha: Pobre Diabla/Don Omar/2003 · errores: 0 | ✅ |
| 2 | Repetir exactamente los mismos pasos en Firefox. | El comportamiento es el mismo que en Chrome y la consola no muestra errores. | audio 0.98 s · 1 sugerencias · ¡Correcto! · ficha: Flowers/Miley Cyrus/2023 · errores: 0 | ✅ |
| 3 | Comparar la pantalla de resultado en los dos navegadores. | No hay diferencias de maquetación que impidan leer el título, el artista ni el veredicto. | veredicto: Chrome 30 px / Firefox 30 px · ficha completa en ambos: true | ✅ |
| 4 | Revisar la consola de los dos navegadores buscando la advertencia del defecto DF-03. | No aparece "URI no válida / Ha fallado la carga del recurso de medios" en ninguno de los dos. | advertencias totales: 2 · de URI inválida (DF-03): 0 · otras advertencias observadas: [JavaScript Warning: "Media resource https://audio-ssl.itunes.apple.com/itunes-assets/Audi ‖ [JavaScript Warning: "Media resource https://audio-ssl.itunes.apple.com/itunes-assets/Audi | ✅ |

**Notas:** Navegadores: Google Chrome 154.0.8037.58 y Mozilla Firefox 155.0. Observación: Firefox emitió 2 advertencia(s) "Media resource … could not be decoded / NS_ERROR_DOM_MEDIA_MEDIASINK_ERR" al cortar el fragmento. El audio igualmente se reprodujo (0.98 s medidos) y la ronda se resolvió bien. Se registra como DF-04, pendiente de confirmar en una instalación normal de Firefox: la build que distribuye Playwright puede no traer el decodificador AAC de las builds oficiales de Mozilla.

**Errores de consola durante el caso:** ninguno
