# Cancionero (Grupo 7) — Historias de Usuario — Versión 1

**Materia:** Testing de Aplicaciones · **Entrega 01 — Parte A**
**Aplicación:** Cancionero — El juego de la previa

Las 12 historias de abajo son el alcance completo de la V1. Cada una está trazada al
requerimiento de la pre-entrega que le da origen y tiene criterios de aceptación
numerados, para que cada criterio pueda convertirse en uno o más casos de prueba.

---

## Historias

### US-01 — Escuchar el fragmento con desbloqueo progresivo
> Como jugador, quiero escuchar un fragmento corto de la canción que se alargue con cada
> intento fallido, para poder adivinarla escuchando la menor cantidad de segundos posible.

**Req. origen:** RF-01, RF-02 · **Prioridad:** Alta

1. Al iniciar la ronda, el botón "Play" reproduce solo el primer segundo de la canción y se detiene solo.
2. Tras cada intento fallido o saltado, el fragmento disponible pasa a 2, 4, 7, 11 y 16 segundos, en ese orden.
3. Se muestra el intento actual ("Intento X de 6") y una barra con los segundos desbloqueados.
4. El jugador puede volver a reproducir el fragmento disponible las veces que quiera sin consumir intentos.

### US-02 — Buscar la canción con autocompletado
> Como jugador, quiero escribir parte del título o del artista y ver sugerencias, para elegir
> mi respuesta rápido y sin errores de tipeo.

**Req. origen:** RF-03 · **Prioridad:** Alta

1. Al escribir 2 o más caracteres aparecen hasta 8 sugerencias con el formato "Título — Artista".
2. Se puede buscar por título o por artista.
3. La búsqueda no distingue mayúsculas ni tildes ("musica" encuentra "Música").
4. Si no hay coincidencias se muestra "No hay resultados".
5. Solo se puede enviar una canción elegida de la lista: con texto libre, el botón "Enviar" está deshabilitado y no se consume ningún intento.

### US-03 — Validar la respuesta
> Como jugador, quiero saber enseguida si acerté, para seguir jugando o pasar al siguiente intento.

**Req. origen:** RF-04, RN-01 · **Prioridad:** Alta

1. Si la respuesta es correcta se muestra "¡Correcto!" y termina la ronda.
2. Si es incorrecta se muestra "Incorrecto", la respuesta queda en el historial de intentos, se consume 1 intento y se desbloquea el siguiente fragmento.
3. Si se usan los 6 intentos sin acertar, la ronda termina como "No acertada".

### US-04 — Saltar un intento
> Como jugador, quiero saltar un intento cuando no tengo idea de qué canción es, para escuchar más segundos.

**Req. origen:** RF-05, RN-01 · **Prioridad:** Media

1. Hay un botón "Saltar" que indica cuántos segundos se desbloquean (ej. "Saltar (+1 s)").
2. Saltar consume 1 intento, queda en el historial como "Saltado" y desbloquea el siguiente fragmento.
3. Saltar en el 6.º intento termina la ronda como "No acertada".

### US-05 — Ver el resultado de la ronda
> Como jugador, quiero ver qué canción era al terminar la ronda, para conocer la respuesta y disfrutar la canción.

**Req. origen:** RF-07, RNF-03 · **Prioridad:** Alta

1. Al terminar la ronda se muestran título, artista, año y carátula de la canción.
2. Se indica en qué intento acertó el jugador y cuántos puntos sumó, o "No acertada — 0 puntos".
3. Se puede reproducir el fragmento completo (30 s).
4. El texto del veredicto mide 23 px o más, con alto contraste.
5. Un botón lleva al siguiente turno ("Continuar", Modo Previa) o a la siguiente canción ("Siguiente", Modo Infinito).

### US-06 — Registrar jugadores en el Modo Previa
> Como anfitrión de la juntada, quiero cargar los nombres de los jugadores, para empezar una
> partida grupal en un solo celular.

**Req. origen:** RF-11 · **Prioridad:** Alta

1. Se pueden registrar entre 2 y 12 jugadores.
2. Con menos de 2 jugadores el botón "Empezar" está deshabilitado. Con 12, no se pueden agregar más.
3. El nombre es obligatorio (no vacío ni solo espacios), tiene como máximo 15 caracteres y no se puede repetir (sin distinguir mayúsculas).
4. A cada jugador se le asigna automáticamente un color y un emoji distintos, que se ven en su turno y en el marcador.
5. Antes de empezar se puede eliminar un jugador.

### US-07 — Turnos rotativos
> Como grupo de amigos, quiero que la app indique a quién le toca, para no tener que llevar la cuenta nosotros.

**Req. origen:** RF-12 · **Prioridad:** Alta

1. Antes de cada turno se muestra "Le toca a [nombre] [emoji]" con su color, y un botón "¡Listo!".
2. Los turnos siguen el orden de carga. Después del último jugador vuelve al primero y avanza la ronda.
3. Se muestra "Ronda X de 5".
4. Cada turno tiene una canción distinta dentro de la partida.

### US-08 — Puntuación, marcador y ganador
> Como jugador, quiero sumar puntos según qué tan rápido acierto y ver el marcador, para saber quién va ganando.

**Req. origen:** RF-25, RF-16 · **Prioridad:** Alta

1. Puntos por acierto: 1.er intento 10, 2.º 8, 3.º 6, 4.º 4, 5.º 2 y 6.º 1. Si no acierta, suma 0.
2. Entre turnos se puede ver el marcador con puntos y aciertos de cada jugador, ordenado de mayor a menor.
3. La partida dura 5 rondas.
4. Al terminar la 5.ª ronda se declara ganador al jugador con más puntos. Si hay empate, se muestran todos los empatados como ganadores.

### US-09 — Podio y compartir resultado
> Como jugador, quiero ver el podio final y compartir el resultado, para mostrarlo en redes o en el grupo de WhatsApp.

**Req. origen:** RF-22 · **Prioridad:** Media

1. Al terminar la partida se muestra un podio (1.º, 2.º y 3.º) y la tabla completa.
2. El botón "Compartir" abre el menú de compartir del celular con un texto del resultado (ganador, puntos y link al juego).
3. Si el navegador no permite compartir, el texto se copia al portapapeles y se muestra "¡Copiado!".
4. En el Modo Diario el texto compartido no revela la canción (usa cuadraditos).
5. Hay botones "Jugar de nuevo" (mismos jugadores) y "Volver al inicio".

### US-10 — Modo Diario
> Como jugador solitario, quiero adivinar una canción del día igual para todos, para comparar mi resultado con mis amigos.

**Req. origen:** RF-08 · **Prioridad:** Media

1. Todos los dispositivos tienen la misma canción en la misma fecha (hora Argentina). La canción cambia a las 00:00.
2. Se puede jugar una sola vez por día en el dispositivo. Si ya se jugó, se muestra el resultado y cuánto falta para la próxima canción.
3. Aplican las mismas reglas de 6 intentos y saltos.

### US-11 — Modo Infinito
> Como jugador solitario, quiero jugar canciones al azar sin límite, para practicar.

**Req. origen:** RF-09 · **Prioridad:** Media

1. Al terminar cada canción se ofrece "Siguiente" con otra canción al azar, distinta de la anterior.
2. Se muestran la racha actual de aciertos seguidos y la mejor racha, que queda guardada en el dispositivo.
3. Se puede salir al inicio en cualquier momento.

### US-12 — Filtrar el repertorio
> Como anfitrión de la juntada, quiero elegir género, artista y/o época, para que las canciones sean conocidas por el grupo.

**Req. origen:** RF-10 · **Prioridad:** Media

1. Hay filtros por género, por artista y por época (décadas: 70s, 80s, 90s, 2000s, 2010s y 2020s).
2. Los filtros se pueden combinar y se muestra cuántas canciones cumplen la combinación.
3. Sin filtros se juega con todo el catálogo.
4. Si la combinación da 0 canciones se avisa y no se puede empezar.
5. Todas las canciones que suenan cumplen los filtros elegidos.
6. Los filtros están en el Modo Previa y el Modo Infinito. El Modo Diario no tiene filtros.

---

## Fuera del alcance de la V1

| Funcionalidad | Versión |
|---|---|
| Castigos, prendas, intensidad (Suave/Picante/Fatal) y modo sin alcohol | V2 |
| Contrarreloj de 20 segundos | V2 |
| Conservar la partida en curso al recargar (RF-21) | V2 |
| Diagnóstico de la conexión con la API (RF-24) | V2 |
| Poderes, ruleta y rendirse | V3 |
| No repetir una canción ya jugada en toda la sesión (RF-23) | V3 |

---

## Decisiones tomadas para cerrar ambigüedades de la pre-entrega

| ID | Tema | Problema detectado | Decisión | Impacta en |
|---|---|---|---|---|
| D-01 | Cantidad de rondas | El roadmap dice "5 rondas totales" y en la línea siguiente "al finalizar las 10 rondas". | Una partida del Modo Previa tiene 5 rondas. En cada ronda juega cada jugador una vez (una canción por turno). Gana quien suma más puntos al terminar la 5.ª ronda. | US-07, US-08 |
| D-02 | Marcador sin castigos | RF-16 pide mostrar "castigos acumulados", pero los castigos son de la V2. | En V1 el marcador muestra solo puntos y aciertos. | US-08 |
| D-03 | Filtros | El roadmap de V1 promete filtros por artista, género y años combinables; RF-10 solo menciona género. | V1 incluye los tres filtros y se pueden combinar. Si la combinación no tiene canciones, se avisa y no se puede empezar. | US-12 |
| D-04 | Saltar vs. rendirse | Saltar (RF-05) es V1 y rendirse (RF-06) es V3. | En V1 solo existe "Saltar". | US-04 |
| D-05 | Modo Diario sin backend | No hay servidor, pero la canción diaria debe ser la misma para todos. | La canción del día se calcula a partir de la fecha en hora Argentina (UTC−3, sin horario de verano), así todos los dispositivos obtienen la misma sin coordinarse. Se puede jugar una vez por día en cada dispositivo. | US-10 |
| D-06 | Empate | No estaba definido qué pasa si dos jugadores terminan con los mismos puntos. | Si hay empate en el primer puesto, se muestran todos los empatados como ganadores. | US-08 |
| D-07 | Respuesta válida | No estaba definido si se puede escribir cualquier texto como respuesta. | Solo se puede enviar una canción elegida de la lista de sugerencias. | US-02, US-03 |
| D-08 | Persistencia | El alcance menciona persistencia local de la partida, pero RF-21 es V2. | En V1 se guardan solo las estadísticas (mejor racha del Infinito y resultado del Diario). Conservar una partida en curso queda para V2. | US-10, US-11 |
| D-09 | Testabilidad (modo debug) | Para probar un acierto, el tester necesita saber qué canción está sonando. | Abriendo la app con `?debug=1` se muestra la canción en juego. Es solo para pruebas. | Todos los TC de acierto |
| D-10 | Alcance: compartir y modos extra | El alcance de V1 es grande (3 modos, filtros, compartir). | Se mantienen en V1 porque están en el roadmap, pero con funcionalidad mínima. Las mejoras quedan para V2. | US-09, US-10, US-11 |
| **D-11** | **Catálogo propio** | **La V1 anterior cargaba `catalogo.js` desde el dominio del deploy de V2/V3 (defecto DF-02): el entorno de prueba no era reproducible.** | **La V1 incluye su propia copia congelada del catálogo (672 temas) y la sirve desde su propio dominio.** | **RNF-07, US-12** |

---

## Trazabilidad requerimiento → historia → caso de prueba

| Req. | Historia | Casos de prueba |
|---|---|---|
| RF-01, RF-02 | US-01 | TC-01, TC-02 |
| RF-03 | US-02 | TC-03, TC-04, TC-05, TC-25 |
| RF-04, RN-01 | US-03 | TC-02, TC-06, TC-07 |
| RF-05, RN-01 | US-04 | TC-08, TC-09 |
| RF-07, RNF-03 | US-05 | TC-06, TC-07, TC-10 |
| RF-11 | US-06 | TC-11, TC-12, TC-13 |
| RF-12 | US-07 | TC-14 |
| RF-25, RF-16 | US-08 | TC-06, TC-15, TC-16, TC-17 |
| RF-22 | US-09 | TC-16, TC-18, TC-19 |
| RF-08 | US-10 | TC-19 |
| RF-09 | US-11 | TC-20 |
| RF-10 | US-12 | TC-21, TC-22 |
| RNF-01 | — | TC-23 |
| RNF-02 | — | TC-26 |
| RNF-05 | — | TC-28 |
| RNF-06 | — | TC-24 |
| RNF-07 | — | TC-27 |
