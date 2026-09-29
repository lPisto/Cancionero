# Cancionero (Grupo 7) — Entrega 1 — Reportes de defectos

Estado de los defectos sobre la **V1**. Los defectos DF-01, DF-02 y DF-03 venían de la
ejecución de la entrega anterior sobre el deploy `zesty-mousse-8fc901.netlify.app`; acá se
indica qué pasó con cada uno en esta versión.

## Resumen

| ID | Título | Severidad | Prioridad | Estado en la V1 | Caso de prueba |
|---|---|---|---|---|---|
| DF-01 | La canción "X" no se puede encontrar escribiendo su título | Low | Low | **Open** — se reproduce | TC-25 |
| DF-02 | La app V1 carga el catálogo desde el dominio de otro deploy | High | High | **Closed / Fixed** | TC-27 |
| DF-03 | Advertencia de recurso de medios inválido en cada ronda | Low | Low | **Closed / Fixed** | TC-28 |
| DF-04 | Firefox informa que no puede decodificar el fragmento al cortarlo | Low | Low | **Open** — a confirmar | TC-28 |
| DF-05 | El autocompletado se cierra solo si se vuelve a escribir enseguida | Medium | Medium | **Closed / Fixed** | TC-07 |
| DF-06 | Al fallar la carga del audio, el buscador sigue a la vista | Low | Medium | **Closed / Fixed** | TC-24 |

---

## DF-01 — La canción "X" no se puede encontrar escribiendo su título

| Campo | Valor |
|---|---|
| **Defect ID** | DF-01 |
| **Status** | Open |
| **Project** | Cancionero |
| **Reporter** | Severiano Prada |
| **Type** | Bug |
| **Priority** | Low |
| **Severity** | Low |
| **Assignee** | Unassigned |
| **Test case** | TC-25 — Buscar una canción cuyo título tiene 1 solo carácter |
| **User story** | US-02 — Buscar la canción con autocompletado |

**Description / Overview**
El buscador solo muestra sugerencias a partir de 2 caracteres, pero el catálogo tiene una
canción cuyo título es de 1 solo carácter: **"X" de Nicky Jam & J Balvin**. Esa canción no
se puede encontrar por su título, solo escribiendo el nombre del artista. Verificado sobre
las 672 canciones del catálogo de la V1: es la única en esta situación.

**Reproduction Steps**
1. Abrir la aplicación y entrar al Modo Infinito.
2. Tocar "Empezar".
3. Escribir "X" en el buscador.

**Expected Behavior**
Según US-02 criterio 2 ("se puede buscar por título"), debería aparecer la sugerencia
"X — Nicky Jam & J Balvin".

**Actual Behavior**
No aparece ninguna sugerencia, ni siquiera el mensaje "No hay resultados", porque la lista
no llega a abrirse con menos de 2 caracteres.

**Incidence / Severity / Probability of reproduction**
Severidad Low: afecta a 1 de 672 canciones (0,15 %) y la canción igual se puede encontrar
escribiendo el artista. Reproducción: 100 %.

**Story and Acceptance Criteria affected**
US-02, criterios 1 y 2. **Los dos criterios se contradicen para este caso**: el 1 exige un
mínimo de 2 caracteres y el 2 promete buscar por título. No es un error de implementación
sino un conflicto en el requerimiento.

**Browsers tested** · Google Chrome 154 y Mozilla Firefox 155, Windows 11.

**Notes**
Se implementó el criterio 1 tal como está escrito, por eso el defecto sigue abierto.
**Solución propuesta para la V2:** bajar el umbral a 1 carácter solo cuando hay una
coincidencia exacta de título, o reescribir el criterio 1 como "al escribir 2 o más
caracteres, o 1 carácter si coincide exactamente con un título del catálogo". La decisión
es del equipo, no de quien implementa.

---

## DF-02 — La app V1 carga el catálogo de canciones desde el dominio de otro deploy

| Campo | Valor |
|---|---|
| **Defect ID** | DF-02 |
| **Status** | **Closed / Fixed en la V1** |
| **Severity** | High |
| **Test case** | TC-27 — Origen e integridad del catálogo de canciones |
| **Requerimiento** | RNF-07 — Integridad del catálogo |

**Description / Overview**
En la versión anterior, la V1 no incluía su propio catálogo: lo cargaba con un `<script>`
apuntando a `harmonious-semifreddo-6794a9.netlify.app/catalogo.js`, que es el deploy de las
versiones V2/V3. El entorno de prueba no era autocontenido: el contenido del juego podía
cambiar sin que nadie tocara la V1, y si ese otro sitio se borraba, la V1 quedaba sin
canciones. De hecho, el catálogo creció de 672 a 886 canciones sin que se modificara la V1.

**Fix aplicado**
`catalogo.js` es ahora una copia congelada dentro del proyecto de la V1 y se sirve desde el
mismo dominio que la aplicación. La cantidad de canciones sobre la que se ejecutaron las
pruebas queda documentada: **672**.

**Verificación (TC-27)**
- `catalogo.js` se descarga del mismo dominio de la app: **1 pedido, 0 a dominios ajenos**.
- Cantidad de canciones: **672**, la documentada para la V1.
- Duplicados: **0** · sin URL de audio: **0** · sin carátula: **0** · sin año: **0** · género inválido: **0**.
- Las **672** URLs de preview se verificaron por HTTP: **0 inaccesibles**.

---

## DF-03 — La aplicación genera una advertencia de recurso de medios inválido en cada ronda

| Campo | Valor |
|---|---|
| **Defect ID** | DF-03 |
| **Status** | **Closed / Fixed en la V1** |
| **Severity** | Low |
| **Test case** | TC-28 — Compatibilidad entre Chrome y Firefox en escritorio |
| **Requerimiento** | RNF-05 — Compatibilidad |

**Description / Overview**
Antes de usar una canción, la aplicación comprueba que el audio se pueda reproducir con un
elemento `<audio>` descartable y al terminar lo limpiaba asignándole una cadena vacía como
`src`. Firefox interpretaba esa cadena vacía como URI inválida y registraba una advertencia
por cada comprobación, dos por ronda.

**Fix aplicado** — en `app.js`, función `verificarAudio`:

```js
// Antes:  a.src = "";
// Ahora:
a.removeAttribute("src");
try { a.load(); } catch {}
```

`removeAttribute` seguido de `load()` libera el recurso sin generar una URI inválida.

**Verificación (TC-28)**
Se ejecuta una ronda completa en Chrome y en Firefox capturando la consola de los dos:
**0 advertencias de "URI no válida / Ha fallado la carga del recurso de medios"**.

---

## DF-04 — Firefox informa que no puede decodificar el fragmento al cortarlo

| Campo | Valor |
|---|---|
| **Defect ID** | DF-04 |
| **Status** | Open — **a confirmar en una instalación normal de Firefox** |
| **Project** | Cancionero |
| **Reporter** | Ramiro Salvucci |
| **Type** | Bug |
| **Priority** | Low |
| **Severity** | Low |
| **Test case** | TC-28 — Compatibilidad entre Chrome y Firefox en escritorio |
| **Requerimiento** | RNF-05 — Compatibilidad |

**Description / Overview**
Al reproducir el fragmento en Firefox, la consola registra dos advertencias por ronda:
`Media resource … could not be decoded` y `NS_ERROR_DOM_MEDIA_MEDIASINK_ERR (0x806e000b) —
OnMediaSinkAudioError`. Se detectó al comparar Chrome con Firefox en TC-28.

**Reproduction Steps**
1. Abrir la aplicación en Firefox con la consola abierta (F12).
2. Entrar al Modo Infinito y tocar "Empezar".
3. Tocar "Play" y esperar a que el fragmento se corte solo.

**Expected Behavior** — Durante el funcionamiento normal la consola no registra advertencias.

**Actual Behavior** — Aparecen dos advertencias de decodificación por ronda. **El audio se
reproduce igual**: en TC-28 se midieron 0,96 s de reproducción real en Firefox y la ronda
se resolvió correctamente.

**Incidence / Severity / Probability of reproduction**
Severidad Low: no afecta la funcionalidad ni incumple ningún criterio de aceptación. El
impacto es de diagnóstico, igual que DF-03: ensucia la consola y puede tapar errores reales
en pruebas futuras. Reproducción: 100 % en el Firefox probado.

**Browsers tested** · Mozilla Firefox 155.0 (build de Playwright), headless y con ventana,
Windows 11. Chrome 154 no lo reproduce.

**Notes — atribución pendiente**
No se pudo distinguir entre dos causas posibles, porque en la máquina de pruebas no hay una
instalación normal de Firefox:

1. **Es de la aplicación**: el corte del fragmento (`pause()` + `currentTime = 0` a mitad de
   la decodificación) deja el media sink en un estado que Firefox reporta como error.
2. **Es del entorno**: la build de Firefox que distribuye Playwright puede no traer el
   decodificador AAC de las builds oficiales de Mozilla, y el fragmento de iTunes es AAC.

**Antes de asignarlo hay que reproducirlo en un Firefox instalado desde mozilla.org.** Si se
confirma como (1), la solución a evaluar es no cortar con `pause()` sino bajar el volumen a
0 y dejar que el preview termine, o usar la Web Audio API para recortar el fragmento.

---

## DF-05 — El autocompletado se cierra solo si se vuelve a escribir enseguida

| Campo | Valor |
|---|---|
| **Defect ID** | DF-05 |
| **Status** | **Closed / Fixed en la V1** |
| **Project** | Cancionero |
| **Reporter** | Suite automatizada (detectado al ejecutar TC-07) |
| **Type** | Bug |
| **Priority** | Medium |
| **Severity** | Medium |
| **Test case** | TC-07 — Seis respuestas incorrectas |
| **User story** | US-02 — Buscar la canción con autocompletado |

**Description / Overview**
La lista de sugerencias se cierra 120 ms después de que el buscador pierde el foco, para
que un click sobre una sugerencia alcance a registrarse. El cierre estaba programado sin
condición: si el usuario volvía al buscador y escribía dentro de esos 120 ms, el cierre
pendiente borraba la lista recién abierta y el usuario se quedaba sin sugerencias hasta
volver a tipear.

**Reproduction Steps**
1. Entrar al Modo Infinito y empezar una ronda.
2. Elegir una canción de la lista y tocar "Enviar" (el click en el botón saca el foco del buscador).
3. Volver al buscador inmediatamente y escribir un título.

**Expected Behavior** — Aparecen las sugerencias del texto recién escrito.

**Actual Behavior** — La lista se abría y se cerraba sola a los pocos milisegundos.

**Incidence / Severity / Probability of reproduction**
Severidad Medium: afecta a US-02 criterio 1 y se da justo en el flujo más frecuente del
juego (responder varias veces seguidas en la misma ronda). Reproducción: solo si se escribe
dentro de la ventana de 120 ms, por eso pasó desapercibido en la prueba manual y lo
encontró la ejecución automatizada.

**Fix aplicado** — en `app.js`, el cierre diferido ahora verifica el foco:

```js
input.addEventListener("blur", () => setTimeout(() => {
  if (document.activeElement !== input) cerrarSugerencias();
}, 120));
```

**Notes**
Es el hallazgo más interesante de la ejecución: un defecto de temporización que la prueba
manual no encuentra porque una persona no escribe tan rápido, pero que la automatización
reproduce todas las veces.

---

## DF-06 — Al fallar la carga del audio, el buscador sigue a la vista

| Campo | Valor |
|---|---|
| **Defect ID** | DF-06 |
| **Status** | **Closed / Fixed en la V1** |
| **Project** | Cancionero |
| **Reporter** | Suite automatizada (detectado al ejecutar TC-24) |
| **Type** | Bug |
| **Priority** | Medium |
| **Severity** | Low |
| **Test case** | TC-24 — Falla de conexión con la API de audio |
| **Requerimiento** | RNF-06 — Tolerancia a fallas de la API |

**Description / Overview**
Cuando no se puede cargar el audio de la ronda, la aplicación oculta la zona de respuesta
(buscador, "Saltar" y "Enviar") y deja solo el aviso y el botón "Reintentar". El código sí
pedía ocultarla (`zona-respuesta.hidden = true`), pero **el atributo no tenía efecto**: la
regla propia `.zona-respuesta { display: flex }` le gana por cascada a la regla
`[hidden] { display: none }` de la hoja de estilos del navegador, porque tienen la misma
especificidad y la propia va después.

**Reproduction Steps**
1. Abrir la aplicación y entrar al Modo Infinito.
2. Poner la red en modo Offline (DevTools > Network > Offline).
3. Volver al inicio y tocar "Empezar" para pedir una ronda nueva.
4. Mirar si el buscador sigue en pantalla debajo del aviso de falta de conexión.

**Expected Behavior**
Se muestra el aviso "No hay conexión con la fuente de audio" y el botón "Reintentar", y los
controles de respuesta no quedan a la vista.

**Actual Behavior**
El aviso y "Reintentar" aparecían correctamente, pero el buscador y los botones "Saltar" y
"Enviar" seguían visibles. Estaban deshabilitados, así que no se podía interactuar con
ellos, pero la pantalla quedaba confusa: parecía que se podía responder una canción que no
había cargado.

**Incidence / Severity / Probability of reproduction**
Severidad Low: los controles estaban deshabilitados, así que no se podía romper nada ni
consumir intentos. Prioridad Medium porque el mismo error de cascada podía repetirse en
cualquier otro elemento que se ocultara con `hidden`. Reproducción: 100 % en el camino de
error de carga de audio.

**Story and Acceptance Criteria affected**
RNF-06. No incumple ningún criterio de aceptación funcional de las historias de usuario.

**Browsers tested** · Google Chrome 154 y Mozilla Firefox 155, Windows 11.

**Fix aplicado** — en `styles.css`, una regla única al inicio de la hoja en lugar de ir
parcheando clase por clase:

```css
[hidden]{display:none !important}
```

**Notes**
Lo encontró la suite después de corregir el helper de visibilidad de los tests: la versión
anterior del helper miraba el atributo `hidden` en vez de mirar si el elemento realmente
ocupaba lugar en la página, así que daba por bueno algo que en pantalla se seguía viendo.
Es un recordatorio útil: **una aserción que mira el estado interno en vez del resultado
visible puede tapar el defecto que debería encontrar.** El resto de los elementos que se
ocultan con `hidden` (`.pantalla`, `.modal`, `.toast`) sí tenían su regla propia; faltaba
justo `.zona-respuesta`.
