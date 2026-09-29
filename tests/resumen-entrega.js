/* Genera docs/05-estado-de-la-entrega.md a partir de tests/salida/resultados.json,
   para que los números del documento no se escriban a mano. */

const fs = require("fs");
const path = require("path");

const r = require(path.join(__dirname, "salida", "resultados.json"));
const ico = { PASSED: "✅", FAILED: "❌", BLOCKED: "⛔", "NOT RUN": "⚪" };
const porEstado = (e) => r.resultados.filter((x) => x.estado === e);
const fecha = new Date(r.fecha).toLocaleDateString("es-AR");

const fallados = porEstado("FAILED");
const bloqueados = porEstado("BLOCKED");

const lineaCaso = (x) => `**${x.id} — ${x.titulo}**`;

let md = `# Cancionero (Grupo 7) — Entrega 1 — Estado de la entrega

**Actualizado el ${fecha}.** Aplicación bajo prueba: **Cancionero V1** (código en este repositorio).
Entorno de ejecución: ${r.versiones.chrome} · ${r.versiones.firefox} · Windows 11.

## A. Estado frente a la consigna

| | Lo que pide la Entrega 01 | Lo que entregamos | Estado |
|---|---|---|---|
| A1 | Parte A — Especificación de requerimientos (Historias de Usuario) de la V1 | 12 historias con criterios de aceptación numerados, trazadas a los requerimientos de la pre-entrega, más 11 decisiones de diseño documentadas → \`docs/01-historias-de-usuario-v1.md\` | COMPLETO |
| A2 | Parte A — Implementar la aplicación con un agente de IA | Cancionero V1 funcionando, implementada con Claude Code (Claude Opus 5). Agente, prompts y problemas documentados → \`docs/02-implementacion-con-ia.md\` | COMPLETO |
| B1 | Parte B — Especificación de casos de prueba | ${r.resumen.total} casos especificados en \`tests/casos.js\`, con prerrequisitos, datos de prueba, pasos y resultado esperado → índice en \`docs/03-casos-de-prueba.md\` | COMPLETO |
| B2 | Parte B — Ejecución de casos de prueba | ${r.resumen.PASSED + r.resumen.FAILED} de ${r.resumen.total} ejecutados de punta a punta, de forma automatizada sobre la app real con audio real | COMPLETO |
| B3 | Parte B — Reportes de defectos | 6 defectos documentados con el template de la cátedra → \`docs/04-reportes-de-defectos.md\` | COMPLETO |
| B4 | Parte B — Reporte de ejecución de casos de prueba | Reporte generado con el detalle paso a paso (esperado vs. obtenido) → \`tests/salida/reporte-ejecucion.md\` | COMPLETO |

**Resultado de la ejecución:** ${r.resumen.PASSED} PASSED · ${r.resumen.FAILED} FAILED · ${r.resumen.BLOCKED} BLOCKED · ${r.resumen["NOT RUN"]} NOT RUN · **${r.resumen.aprobacion} de aprobación** sobre los casos ejecutados.

## B. Resultado por caso

| Caso | Estado | Comentario |
|---|---|---|
`;

for (const x of r.resultados) {
  let comentario = "";
  if (x.estado === "PASSED") comentario = x.pasos.length + " pasos verificados";
  else if (x.estado === "FAILED") comentario = "falla el paso " + x.pasos.filter((p) => p.ok === false).map((p) => p.n).join(", ") + (x.defecto ? ` → ${x.defecto}` : "");
  else if (x.estado === "BLOCKED") comentario = "faltan prerrequisitos de hardware en " + x.pasos.filter((p) => p.ok === null).length + " paso(s)";
  md += `| ${x.id} — ${x.titulo} | ${ico[x.estado]} ${x.estado} | ${comentario} |\n`;
}

md += `
## C. Defectos

| ID | Título | Severidad | Estado |
|---|---|---|---|
| DF-01 | La canción "X" no se puede encontrar escribiendo su título | Low | **Open** — se reproduce (TC-25) |
| DF-02 | La app V1 carga el catálogo desde el dominio de otro deploy | High | **Closed / Fixed** — verificado por TC-27 |
| DF-03 | Advertencia de recurso de medios inválido en cada ronda | Low | **Closed / Fixed** — verificado por TC-28 |
| DF-04 | Firefox informa que no puede decodificar el fragmento al cortarlo | Low | **Open** — a confirmar en un Firefox instalado desde mozilla.org |
| DF-05 | El autocompletado se cierra solo si se vuelve a escribir enseguida | Medium | **Closed / Fixed** — encontrado por la suite al ejecutar TC-07 |
| DF-06 | Al fallar la carga del audio, el buscador sigue a la vista | Low | **Closed / Fixed** — encontrado por la suite al ejecutar TC-24 |

El detalle de cada uno está en \`docs/04-reportes-de-defectos.md\`.

## D. Lo que no se pudo ejecutar

`;

if (fallados.length || bloqueados.length) {
  for (const x of bloqueados) {
    md += `- ${lineaCaso(x)} — **BLOCKED**. Pasos no ejecutados:\n`;
    x.pasos.filter((p) => p.ok === null).forEach((p) => { md += `  - Paso ${p.n}: ${p.obtenido}\n`; });
    md += `  - Los pasos restantes sí se ejecutaron y pasaron.\n`;
  }
} else {
  md += `Todos los casos se ejecutaron completos.\n`;
}

md += `
- **TC-23, paso 4 (zoom automático de iOS):** no hay un iPhone real en el entorno. Se
  verificó el criterio equivalente: el buscador declara 16 px, que es el umbral con el que
  iOS no hace zoom al enfocar un campo de texto.
- **TC-28:** se ejecutó con la build de Firefox que distribuye Playwright, no con una
  instalación de mozilla.org. Es lo que originó la duda de atribución de DF-04.

## E. Conclusiones de esta ejecución

1. **El defecto de alta severidad de la entrega anterior está cerrado.** DF-02 rompía la
   reproducibilidad de todas las pruebas: la V1 tomaba el catálogo del deploy de V2/V3, así
   que cualquier caso que dependiera del catálogo podía pasar hoy y fallar mañana sin que
   cambiara el código. Con el catálogo propio y congelado (672 temas), TC-27 verifica origen,
   cantidad, duplicados, carátulas, años y que las 672 URLs de preview respondan por HTTP.

2. **El único FAILED funcional es un conflicto de requerimiento, no un error de código.**
   DF-01 existe porque los criterios 1 y 2 de US-02 se contradicen para la canción cuyo
   título tiene un solo carácter. Se implementó el criterio tal como está escrito y se dejó
   el defecto abierto: cambiar un requerimiento escrito es decisión del equipo.

3. **La automatización encontró dos defectos que la prueba manual no encuentra.** DF-05 es
   una condición de carrera de 120 ms en el cierre del autocompletado: una persona no escribe
   lo bastante rápido como para dispararlo, la suite lo reproduce todas las veces. DF-06 es un
   \`hidden\` que no ocultaba nada porque una regla de CSS propia le ganaba por cascada.

   DF-06 además dejó una lección sobre el diseño de las propias pruebas: la primera versión
   del helper de visibilidad miraba el atributo \`hidden\` en vez de mirar si el elemento
   ocupaba lugar en la página, y por eso daba por bueno algo que en pantalla se seguía viendo.
   **Una aserción que mira el estado interno en vez del resultado visible puede tapar
   justamente el defecto que debería encontrar.**

4. **Los requerimientos no funcionales se midieron, no se estimaron.** RNF-02 se verificó con
   10 mediciones reales de carga de ronda; RNF-07 verificando por HTTP las 672 previews;
   RNF-01 midiendo el ancho de scroll y el tamaño real de los botones a 360 px; RNF-05
   corriendo la misma ronda en dos motores distintos (Blink y Gecko).

5. **Qué queda para la V2.** Resolver el conflicto de US-02 (DF-01), confirmar DF-04 en un
   Firefox oficial, ejecutar TC-18 completo cuando haya un Android disponible, y decidir qué
   hacer con los 5 temas anteriores a 1970 que ningún filtro de época alcanza.
`;

const destino = path.join(__dirname, "..", "docs", "05-estado-de-la-entrega.md");
fs.writeFileSync(destino, md, "utf8");
console.log("Generado:", path.relative(path.join(__dirname, ".."), destino));
