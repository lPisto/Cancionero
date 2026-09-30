# Cancionero (Grupo 7) — Entrega 1 — Especificación de casos de prueba

**Parte B de la Entrega 01.** 28 casos de prueba funcionales y no funcionales sobre la V1.

El detalle completo de cada caso (prerrequisitos, datos de prueba, pasos, resultado
esperado y resultado obtenido) está en **`tests/salida/reporte-ejecucion.md`**, que se
genera al correr la suite. La fuente de verdad de los casos es `tests/casos.js`: cada caso
declara ahí sus pasos y su resultado esperado, de modo que la especificación y la ejecución
no puedan desincronizarse.

## Cómo ejecutar los casos

```bash
npm install                 # instala playwright-core
npx playwright-core install firefox   # solo hace falta para TC-28
node tests/ejecutar.js                # los 28 casos
node tests/ejecutar.js TC-01 TC-07    # un subconjunto
node tests/inspeccion-rnf.js          # RNF-04, RNF-08 y RNF-09, por inspección
node tests/cobertura-criterios.js     # matriz de los 50 criterios de aceptación
```

Una corrida parcial escribe en `reporte-ejecucion-parcial.md` y `resultados-parcial.json`,
para no pisar el reporte de la corrida completa.

El runner levanta un servidor estático local con la app, ejecuta cada caso en un contexto
de navegador limpio y escribe `tests/salida/reporte-ejecucion.md` y `tests/salida/resultados.json`.

## Criterio de estado

| Estado | Cuándo se asigna |
|---|---|
| PASSED | Todos los pasos del caso dieron el resultado esperado |
| FAILED | Al menos un paso no dio el resultado esperado |
| BLOCKED | Algún paso no se pudo ejecutar por falta de un prerrequisito del entorno |
| NOT RUN | Ningún paso se ejecutó |

## Índice de casos

| TC | Prioridad | Título | Historia / RNF | Camino feliz | Diseñado por |
|---|---|---|---|---|---|
| TC-01 | Alta | Reproducir el primer fragmento de 1 segundo | US-01 | Sí | Franco |
| TC-02 | Alta | Desbloqueo progresivo de segundos tras respuestas incorrectas | US-01, US-03 | No | Franco |
| TC-03 | Alta | Autocompletado por título | US-02 | Sí | Lucas |
| TC-04 | Media | Autocompletado por artista, sin tildes ni mayúsculas | US-02 | No | Lucas |
| TC-05 | Media | Búsqueda sin resultados y envío de texto libre | US-02 | No | Lucas |
| TC-06 | Alta | Acierto en el primer intento | US-03, US-05, US-08 | Sí | Severiano |
| TC-07 | Alta | Seis respuestas incorrectas | US-03, US-05 | No | Severiano |
| TC-08 | Media | Saltar un intento | US-04 | Sí | Ramiro |
| TC-09 | Media | Saltar en el sexto intento | US-04 | No | Ramiro |
| TC-10 | Alta | Pantalla de resultado de la ronda | US-05 | Sí | Franco |
| TC-11 | Alta | Registrar jugadores válidos | US-06 | Sí | Lucas |
| TC-12 | Alta | Límites de cantidad de jugadores (1 y 13) | US-06 | No | Lucas |
| TC-13 | Media | Validación de nombres de jugadores | US-06 | No | Severiano |
| TC-14 | Alta | Rotación de turnos entre rondas | US-07 | Sí | Franco |
| TC-15 | Alta | Cálculo de puntos según el intento | US-08 | No | Severiano |
| TC-16 | Alta | Partida completa y ganador | US-08, US-09 | Sí | Ramiro |
| TC-17 | Media | Empate en el primer puesto | US-08 | No | Ramiro |
| TC-18 | Media | Compartir el resultado de la partida | US-09 | Sí | Ramiro |
| TC-19 | Media | Modo Diario: misma canción y una vez por día | US-10, US-09 | Sí | Severiano |
| TC-20 | Media | Modo Infinito: siguiente canción y racha | US-11 | Sí | Franco |
| TC-21 | Media | Filtro combinado: género + época | US-12 | Sí | Lucas |
| TC-22 | Baja | Combinación de filtros sin canciones | US-12 | No | Lucas |
| TC-23 | Alta | Uso en celular de 360 px de ancho | RNF-01 | No | Severiano |
| TC-24 | Media | Falla de conexión con la API de audio | RNF-06 | No | Franco |
| TC-25 | Baja | Buscar una canción cuyo título tiene 1 solo carácter | US-02 | No | Severiano |
| TC-26 | Media | Tiempo de carga de una ronda | RNF-02 | No | Ramiro |
| TC-27 | Alta | Origen e integridad del catálogo de canciones | RNF-07 | No | Lucas |
| TC-28 | Media | Compatibilidad entre Chrome y Firefox en escritorio | RNF-05 | No | Ramiro |

## Organización del equipo de testing

| Integrante | Rol | Casos diseñados |
|---|---|---|
| Franco Cabanillas | Test Lead — diseño de casos de prueba | TC-01, TC-02, TC-10, TC-14, TC-20, TC-24 |
| Lucas Pistolesi | Analista de requerimientos / Historias de usuario | TC-03, TC-04, TC-05, TC-11, TC-12, TC-21, TC-22, TC-27 |
| Severiano Prada | QA — ejecución y reporte de defectos | TC-06, TC-07, TC-13, TC-15, TC-19, TC-23, TC-25 |
| Ramiro Salvucci | Product Owner / Prompt engineer | TC-08, TC-09, TC-16, TC-17, TC-18, TC-26, TC-28 |

## Cobertura

- **Historias de usuario:** las 12 historias de la V1 tienen al menos un caso de camino
  feliz y, salvo US-07 y US-09, al menos un caso de camino alternativo o de borde.
- **Requerimientos no funcionales:** RNF-01, RNF-02, RNF-05, RNF-06 y RNF-07 tienen caso
  propio (TC-23, TC-26, TC-28, TC-24 y TC-27). RNF-03 se verifica dentro de TC-10 (tamaño
  del veredicto). RNF-04, RNF-08 y RNF-09 se verifican por inspección: la app no pide
  credenciales, no registra service worker y los assets van versionados (`?v=1.0.0`), y el
  aviso de consumo responsable está en la pantalla de ayuda. Esa inspección está
  automatizada en `tests/inspeccion-rnf.js`, así que tampoco depende de mirar a ojo.

## Cobertura de criterios de aceptación

Los 28 casos declarados **no cubren de a uno los 50 criterios** de las 12 historias: 12
quedaban sin alcanzar o alcanzados solo en parte (por ejemplo, ningún caso verificaba que el
Modo Diario no tuviera filtros, ni que el podio mostrara tres puestos, ni que sin filtros se
jugara con todo el catálogo). `tests/cobertura-criterios.js` arma la matriz completa y
verifica esos criterios contra la aplicación: **49 de 50 en OK**, y el único parcial
(US-09.2) es el menú de compartir de Android.

De esa verificación salieron dos defectos que ningún caso declarado habría encontrado:
**DF-07** (el filtro por artista ignoraba las colaboraciones) y **DF-08** (se podía empezar
una partida con menos canciones que turnos, sin aviso).

## Resultado de la última ejecución

**26 PASSED · 1 FAILED · 1 BLOCKED · 0 NOT RUN · 96,3 % de aprobación** sobre los casos
ejecutados. En total se verificaron **99 de 103 pasos**; los 4 restantes son los 2 pasos de
TC-18 que necesitan un Android y los 2 de TC-25 que reproducen DF-01. Ningún caso registró
errores de consola.
- **Técnicas aplicadas:** partición de equivalencias y valores límite en la cantidad de
  jugadores (TC-12: 1, 12, 13) y en la longitud del nombre (TC-13: 0, 15, 19); tabla de
  decisión implícita en la puntuación por intento (TC-15: los 7 resultados posibles);
  prueba de borde en el buscador (TC-05 y TC-25: 1 carácter, sin coincidencias).
