# Cancionero (Grupo 7) — Entrega 1 — Cómo se implementó la V1 con IA

Este documento cubre el entregable *"Deben mostrar detalles de cómo se realizó la
implementación de la aplicación: agente/s (LLM) utilizado/s, prompts utilizados,
comentarios, detalles y problemas encontrados durante la implementación"*.

## 1. Agente utilizado

| Ítem | Detalle |
|---|---|
| Agente | **Claude Code** (CLI de Anthropic integrado en VS Code) |
| Modelo | **Claude Opus 5** (contexto de 1M tokens) |
| Modo de trabajo | Agéntico: el modelo lee y escribe archivos, corre comandos y ejecuta un navegador headless por su cuenta |
| Herramientas que usó el agente | Lectura/escritura de archivos, Bash, `curl` para bajar la app de referencia, Node.js, Playwright para manejar Chrome y Firefox |

## 2. Prompts utilizados

La implementación salió de **un solo prompt del equipo**, más el contexto de los tres PDFs
de la materia (consigna de la Entrega 01, pre-entrega del Grupo 7 y planilla de casos y
defectos de la entrega anterior).

**Prompt inicial (Ramiro, Prompt engineer):**

> *implementa segun la entrega 1*
>
> *Desarrolla segun las indicaciones de la entrega 1 y ejecuta los tests. Esto es lo que
> habia desarrollado uno de los chicos: https://harmonious-semifreddo-6794a9.netlify.app/,
> revisalo para tomar cosas como base del desarrollo.*

A partir de ahí el agente trabajó solo. Los pasos que ejecutó, en orden:

1. Bajó la app de referencia (`index.html`, `styles.css`, `app.js`, `catalogo.js`) con `curl`.
2. Analizó el `app.js` de referencia (1.966 líneas, V2/V3 con castigos, poderes y ruleta)
   para quedarse con las mecánicas que sí son de V1.
3. Validó el catálogo con un script de Node: 672 temas, 0 duplicados, 0 sin audio.
4. Escribió la V1 desde cero (`index.html`, `styles.css`, `app.js`: ~1.100 líneas en total),
   acotada a las 12 historias de usuario.
5. Montó un servidor estático y una suite de Playwright con los 28 casos de prueba.
6. Ejecutó la suite, encontró defectos y corrigió lo que correspondía.

### Comentario sobre la técnica de prompting

El prompt fue corto pero el contexto era grande: los tres documentos de la cátedra ya
definían el alcance, las historias y los casos de prueba. En la práctica, **el prompt
efectivo fueron las historias de usuario con criterios de aceptación numerados**. Esa es la
conclusión más útil del ejercicio: el vibe-coding rinde en proporción a cuán específico es
el requerimiento, no a cuán largo es el pedido. Los criterios que estaban redactados de
forma verificable ("el texto del veredicto mide 23 px o más") se implementaron bien de
entrada; los que estaban sueltos ("interfaz responsive") hubo que cerrarlos con decisiones.

## 3. Decisiones de implementación

| Tema | Decisión | Por qué |
|---|---|---|
| Reescribir en lugar de podar | La V1 se escribió de cero tomando la referencia como guía de mecánicas, en vez de borrar código de la V2/V3. | La referencia mezcla V1, V2 y V3 en el mismo archivo. Podar habría dejado restos de castigos y poderes, que están fuera del alcance de la V1 y habrían ensuciado las pruebas. |
| Catálogo propio | `catalogo.js` es una copia congelada dentro del proyecto. | Corrige el defecto **DF-02** de la entrega anterior: la V1 cargaba el catálogo desde el dominio del deploy de V2/V3, así que el contenido podía cambiar sin tocar la V1 y las pruebas no eran reproducibles. |
| Sin llamadas a la API durante la partida | Las URLs de preview ya vienen en el catálogo; en la ronda solo se verifica que el audio cargue. | La referencia consultaba iTunes por JSONP en cada ronda. Sacarlo bajó el tiempo de carga de una ronda a ~0,1 s (RNF-02 pide menos de 5 s). |
| `window.__cancionero` | Se expone el estado interno del juego para la suite de pruebas. | Permite afirmar sobre la canción en juego, la racha o los puntos sin depender solo de leer el DOM, y medir cuántos segundos sonó el audio de verdad. |
| Fragmento completo en el resultado | El botón de la pantalla de resultado reproduce los 30 s del preview, no los 16 s del último intento. | Criterio 3 de US-05. |

## 4. Problemas encontrados durante la implementación

### 4.1 Contradicción entre criterios de aceptación (US-02) — **no se resolvió a propósito**

El criterio 1 de US-02 dice "al escribir **2 o más** caracteres aparecen sugerencias" y el
criterio 2 dice "se puede buscar **por título**". El catálogo tiene una canción cuyo título
es de un solo carácter: **"X" de Nicky Jam & J Balvin**. Los dos criterios no se pueden
cumplir a la vez para esa canción.

Se implementó **el criterio tal como está escrito** (2 caracteres mínimo), de modo que
TC-25 vuelve a fallar y **DF-01 sigue abierto y reproducible**. La alternativa —bajar el
umbral a 1 carácter cuando hay coincidencia exacta de título— cambia un requerimiento
escrito, y eso lo decide el equipo, no quien implementa. Queda propuesto para la V2.

### 4.2 La app de referencia ensuciaba la consola en cada ronda (DF-03)

En `app.js` de la referencia, `verificarAudio` limpiaba el elemento de audio con
`a.src = ""`. Firefox interpreta la cadena vacía como URI inválida y registraba dos
advertencias por ronda. **Corregido en la V1**: se usa `a.removeAttribute("src")` seguido
de `a.load()`, que libera el recurso sin generar una URI inválida. TC-28 verifica que no
aparezca ninguna advertencia de recurso de medios en Chrome ni en Firefox.

### 4.3 Ambigüedad en la etiqueta del botón "Saltar"

TC-08 espera "Saltar (+1 s)" en el primer intento y "Saltar (+2 s)" en el segundo. El
número es **el incremento** respecto del fragmento actual (1→2 = +1, 2→4 = +2, 4→7 = +3),
no los segundos totales. Se implementó como incremento, que es lo que hacen los casos de
prueba ya escritos.

### 4.4 Condición de carrera al cerrar el autocompletado

La lista de sugerencias se cierra 120 ms después de que el buscador pierde el foco, para
dar tiempo a que el click en una sugerencia se registre. El problema: si el usuario vuelve
al buscador y escribe antes de esos 120 ms, el cierre pendiente borraba la lista recién
abierta. **Lo detectó la propia suite** (TC-07 falló al encadenar dos respuestas rápidas).
Corregido: el cierre diferido ahora verifica que el buscador no haya recuperado el foco.

### 4.5 Un `hidden` que no ocultaba nada (DF-06)

La zona de respuesta se oculta con `zona-respuesta.hidden = true` cuando falla la carga del
audio, pero el elemento seguía a la vista: la regla propia `.zona-respuesta { display: flex }`
le gana por cascada a la regla `[hidden] { display: none }` del navegador, porque tienen la
misma especificidad y la propia va después en la hoja. Las otras tres clases que se ocultan
con `hidden` (`.pantalla`, `.modal`, `.toast`) sí tenían su regla explícita; faltaba justo
esta. **Corregido** con una sola regla al inicio de la hoja: `[hidden]{display:none !important}`.

Lo interesante es cómo apareció: la primera versión del helper de visibilidad de la suite
miraba el atributo `hidden` en lugar de mirar si el elemento ocupaba lugar en la página, así
que daba el caso por aprobado. Al corregir el helper para que mirara el resultado visible,
el defecto saltó. **Una aserción que mira el estado interno en vez del resultado visible
puede tapar justamente el defecto que debería encontrar.**

### 4.6 Las décadas de los filtros no cubren todo el catálogo

US-12 define las épocas como 70s, 80s, 90s, 2000s, 2010s y 2020s, pero el catálogo tiene
**5 temas anteriores a 1970** (el más viejo es de 1958). Esos temas se juegan cuando no hay
filtro de época, pero ningún filtro los alcanza. Se respetó la historia tal como está
escrita. Queda como observación para la V2: agregar "60s y antes" o recortar el catálogo.

### 4.7 Limitaciones del entorno de pruebas

| Limitación | Impacto |
|---|---|
| No hay ningún celular Android con WhatsApp disponible | TC-18 queda **BLOCKED**: los pasos 1 y 2 (menú de compartir nativo) no se pueden ejecutar. Los pasos 3 a 5 sí se corrieron en Firefox. |
| No hay iPhone con Safari real | El paso 4 de TC-23 (zoom automático de iOS) se verificó por el criterio equivalente: el buscador declara 16 px, que es el umbral con el que iOS no hace zoom. |
| Firefox no estaba instalado en la máquina | Se instaló la build de Firefox 155 que distribuye Playwright, para poder ejecutar TC-28 de verdad y no darlo por bueno. |

## 5. Qué aportó y qué no aportó la IA

**Aportó:** velocidad para escribir la aplicación completa y la suite de 28 casos
automatizados en una sola sesión; consistencia entre los criterios de aceptación y el
código (cada criterio quedó comentado en el `app.js` con su ID de historia); y detección de
dos defectos propios a través de las pruebas que ella misma escribió (4.4 y 4.5).

**No aportó:** criterio para resolver las contradicciones del requerimiento. Los conflictos
de US-02 (4.1) y de las décadas (4.6) son decisiones de producto: el agente los señaló y
los dejó documentados, pero resolverlos sin consultar habría escondido el problema en vez
de mostrarlo. Tampoco reemplaza la prueba en dispositivo real: lo que no se pudo ejecutar
quedó marcado como no ejecutado, no como aprobado.
