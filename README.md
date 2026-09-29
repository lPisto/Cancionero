# Cancionero — El juego de la previa · Versión 1

Juego web para adivinar canciones escuchando la menor cantidad de segundos posible,
pensado para previas y juntadas. Proyecto Integrador de **Testing de Aplicaciones** —
Grupo 7 — **Entrega 01**.

## Qué hay en este repositorio

| Ruta | Contenido |
|---|---|
| `index.html`, `styles.css`, `app.js` | La aplicación V1. HTML/CSS/JS sin framework ni build step. |
| `catalogo.js` | Catálogo propio y congelado de la V1: 672 temas verificados contra iTunes. |
| `docs/` | Historias de usuario, decisiones de diseño, especificación de casos, notas de implementación y defectos. |
| `tests/` | Suite automatizada que ejecuta los 28 casos de prueba y genera el reporte. |
| `tests/salida/` | Reporte de ejecución generado (`reporte-ejecucion.md`, `resultados.json`) y capturas de pantalla. |
| `_ref/` | Copia de la app de referencia (deploy V2/V3) usada como base. No forma parte de la V1. |

## Cómo correr la aplicación

No hay build. Alcanza con servir la carpeta por HTTP:

```bash
node tests/server.js          # http://127.0.0.1:4173
```

Abrir `http://127.0.0.1:4173`. Agregando `?debug=1` a la URL se muestra la canción en
juego: es el modo de testeo acordado en la decisión **D-09** y es lo que permite ejecutar
los casos de acierto.

> La aplicación necesita conexión a internet: los fragmentos de audio y las carátulas se
> sirven desde el CDN de iTunes. Las URLs ya están en el catálogo, así que no se consulta
> ninguna API en tiempo de juego.

## Cómo correr los casos de prueba

```bash
npm install                           # playwright-core
npx playwright-core install firefox   # solo para TC-28 (compatibilidad)

npm test                              # los 28 casos
node tests/ejecutar.js TC-01 TC-07    # un subconjunto
npm run test:rnf                      # RNF-04, RNF-08 y RNF-09, por inspección
npm run reporte                       # regenera docs/05-estado-de-la-entrega.md
npm run capturas                      # capturas de pantalla para la presentación
```

Genera `tests/salida/reporte-ejecucion.md` con el detalle paso a paso de cada caso
(esperado vs. obtenido) y `tests/salida/resultados.json` con los mismos datos en crudo.

### Última ejecución

**26 PASSED · 1 FAILED · 1 BLOCKED · 96,3 % de aprobación** sobre Chrome 154 y Firefox 155.

- El único FAILED es **TC-25 → DF-01**, y está abierto a propósito: los criterios 1 y 2 de
  US-02 se contradicen para la canción cuyo título tiene un solo carácter. Cambiar un
  requerimiento escrito es decisión del equipo, no de quien implementa.
- El BLOCKED es **TC-18**: los dos primeros pasos necesitan un celular Android con WhatsApp.
  Los otros tres pasos se ejecutaron en Firefox y pasaron.

## Alcance de la V1

**Incluido:** juego de 6 intentos con desbloqueo progresivo (1, 2, 4, 7, 11, 16 s),
buscador con autocompletado, tres modos (Previa, Diaria, Infinita), filtros combinables por
género / artista / época, puntuación 10-8-6-4-2-1, marcador, podio, compartir resultado.

**Fuera de la V1:** castigos, prendas, intensidad y modo sin alcohol (V2); contrarreloj
(V2); conservar la partida al recargar (V2); poderes, ruleta y rendirse (V3).

El detalle está en [`docs/01-historias-de-usuario-v1.md`](docs/01-historias-de-usuario-v1.md).

## Decisiones técnicas

| Tema | Decisión |
|---|---|
| Stack | HTML5 + CSS3 + JavaScript ES6 sin framework: sin build step, menos variables ajenas al testing. |
| Audio | Previews de 30 s de iTunes, con la URL ya resuelta en el catálogo. No se consulta la API durante la partida: la ronda carga en menos de 1 segundo. |
| Catálogo | Copia propia y congelada dentro del proyecto (`catalogo.js`), servida desde el mismo dominio que la app. Es la corrección del defecto DF-02 de la entrega anterior. |
| Persistencia | `localStorage`, y solo para estadísticas: mejor racha del Modo Infinito y resultado del día en el Modo Diario (decisión D-08). |
| Caché | Sin service worker y con los assets versionados (`?v=1.0.0`), para que un despliegue nuevo se vea en la siguiente visita (RNF-08). |
| Testeabilidad | `?debug=1` revela la canción en juego; `window.__cancionero` expone el estado para que la suite pueda afirmar sobre él sin depender solo del DOM. |
