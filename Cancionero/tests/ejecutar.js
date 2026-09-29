/* ═══════════════════════════════════════════════════════════════════════
   Runner de los casos de prueba de la Entrega 1.
   Uso:  node tests/ejecutar.js [TC-01 TC-02 ...]
   Salida: tests/salida/reporte-ejecucion.md y tests/salida/resultados.json
   (una corrida parcial escribe en ...-parcial.md / ...-parcial.json para no pisarlos)
   ══════════════════════════════════════════════════════════════════════ */

const fs = require("fs");
const path = require("path");
const https = require("https");
const { chromium, firefox } = require("playwright-core");
const { escuchar } = require("./server");
const { CASOS } = require("./casos");

const SALIDA = path.join(__dirname, "salida");

/* Comprueba por HTTP que cada preview del catálogo siga accesible (RNF-07). */
function verificarAudios(urls, concurrencia = 24) {
  return new Promise((resolve) => {
    const rotos = [];
    let i = 0, activos = 0;
    const siguiente = () => {
      if (i >= urls.length && activos === 0) { resolve(rotos); return; }
      while (activos < concurrencia && i < urls.length) {
        const url = urls[i++];
        activos++;
        const req = https.request(url, { method: "HEAD", timeout: 12000 }, (res) => {
          if (res.statusCode >= 400) rotos.push(`${res.statusCode} ${url.slice(-40)}`);
          res.resume();
          activos--; siguiente();
        });
        req.on("timeout", () => { req.destroy(); });
        req.on("error", () => { rotos.push(`error ${url.slice(-40)}`); activos--; siguiente(); });
        req.end();
      }
    };
    siguiente();
  });
}

function estadoDe(pasos) {
  if (!pasos.length) return "NOT RUN";
  const noEjecutados = pasos.filter((p) => p.ok === null).length;
  const fallados = pasos.filter((p) => p.ok === false).length;
  if (fallados > 0) return "FAILED";
  if (noEjecutados === pasos.length) return "NOT RUN";
  if (noEjecutados > 0) return "BLOCKED";
  return "PASSED";
}

(async () => {
  fs.mkdirSync(SALIDA, { recursive: true });
  const filtro = process.argv.slice(2).filter((a) => /^TC-\d+$/i.test(a)).map((a) => a.toUpperCase());
  const aCorrer = filtro.length ? CASOS.filter((c) => filtro.includes(c.id)) : CASOS;

  const { servidor, puerto } = await escuchar();
  const base = `http://127.0.0.1:${puerto}`;

  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const necesitaFirefox = aCorrer.some((c) => c.navegador === "firefox" || c.dobleNavegador);
  const browserFirefox = necesitaFirefox ? await firefox.launch({ headless: true }) : null;

  const versiones = {
    chrome: "Google Chrome " + browser.version(),
    firefox: browserFirefox ? "Mozilla Firefox " + browserFirefox.version() : "no ejecutado"
  };
  console.log("Entorno:", versiones.chrome, "|", versiones.firefox);
  console.log("App bajo prueba:", base, "\n");

  const resultados = [];
  const inicio = Date.now();

  for (const caso of aCorrer) {
    const t0 = Date.now();
    process.stdout.write(`${caso.id}  ${caso.titulo.padEnd(58, ".")} `);
    let salida, error = null;
    try {
      const br = caso.navegador === "firefox" ? browserFirefox : browser;
      salida = await caso.ejecutar({ browser: br, browserFirefox, base, verificarAudios, versiones });
    } catch (e) {
      error = e.message;
      salida = { pasos: [{ n: 1, detalle: "Ejecución del caso", esperado: "El caso se ejecuta hasta el final", obtenido: "Error: " + e.message, ok: false }], errores: [] };
    }
    const estado = estadoDe(salida.pasos);
    const ms = Date.now() - t0;
    resultados.push({ ...caso, ejecutar: undefined, estado, pasos: salida.pasos, erroresConsola: salida.errores || [], notas: salida.notas || null, error, ms });
    console.log(`${estado}  (${(ms / 1000).toFixed(1)} s)`);
    if (estado !== "PASSED") {
      salida.pasos.filter((p) => p.ok !== true).forEach((p) =>
        console.log(`        paso ${p.n}: esperado «${p.esperado}» → obtenido «${p.obtenido}»`));
    }
  }

  await browser.close();
  if (browserFirefox) await browserFirefox.close();
  servidor.close();

  /* ── Resumen ── */
  const cuenta = (e) => resultados.filter((r) => r.estado === e).length;
  const resumen = {
    PASSED: cuenta("PASSED"), FAILED: cuenta("FAILED"),
    BLOCKED: cuenta("BLOCKED"), "NOT RUN": cuenta("NOT RUN"), total: resultados.length
  };
  const ejecutados = resumen.PASSED + resumen.FAILED;
  resumen.aprobacion = ejecutados ? ((resumen.PASSED / ejecutados) * 100).toFixed(1) + " %" : "—";

  console.log("\n═══ RESUMEN ═══");
  console.log(`PASSED ${resumen.PASSED} · FAILED ${resumen.FAILED} · BLOCKED ${resumen.BLOCKED} · NOT RUN ${resumen["NOT RUN"]} · total ${resumen.total}`);
  console.log(`% aprobados sobre ejecutados: ${resumen.aprobacion}`);
  console.log(`Duración total: ${((Date.now() - inicio) / 1000 / 60).toFixed(1)} min`);

  /* Una corrida parcial no debe pisar el reporte de la corrida completa. */
  const sufijo = filtro.length ? "-parcial" : "";
  if (filtro.length) console.log(`\n(Corrida parcial: se escribe en resultados${sufijo}.json / reporte-ejecucion${sufijo}.md)`);

  fs.writeFileSync(path.join(SALIDA, `resultados${sufijo}.json`),
    JSON.stringify({ fecha: new Date().toISOString(), versiones, base, resumen, resultados }, null, 2), "utf8");

  /* ── Reporte en Markdown ── */
  const hoy = new Date().toLocaleDateString("es-AR");
  const ico = { PASSED: "✅", FAILED: "❌", BLOCKED: "⛔", "NOT RUN": "⚪" };
  let md = `# Cancionero (Grupo 7) — Entrega 1 — Reporte de ejecución de casos de prueba\n\n`;
  md += `**Aplicación bajo prueba:** Cancionero V1 · **Fecha de ejecución:** ${hoy}\n\n`;
  md += `**Entorno:** ${versiones.chrome} · ${versiones.firefox} · Windows 11 · ejecución automatizada con Playwright\n\n`;
  md += `## Resumen\n\n| Estado | Casos |\n|---|---|\n`;
  md += `| ✅ PASSED | ${resumen.PASSED} |\n| ❌ FAILED | ${resumen.FAILED} |\n`;
  md += `| ⛔ BLOCKED | ${resumen.BLOCKED} |\n| ⚪ NOT RUN | ${resumen["NOT RUN"]} |\n| **Total** | **${resumen.total}** |\n`;
  md += `| **% aprobados** (sobre ejecutados) | **${resumen.aprobacion}** |\n\n`;

  md += `## Tabla de ejecución\n\n`;
  md += `| Test case | Prioridad | Título | Historia | Camino feliz | Estado | Defectos |\n|---|---|---|---|---|---|---|\n`;
  for (const r of resultados) {
    const defectos = r.defecto || (r.estado === "FAILED" ? "(nuevo, ver detalle)" : r.estado === "BLOCKED" ? "—" : "");
    md += `| ${r.id} | ${r.prioridad} | ${r.titulo} | ${r.us.join(", ")} | ${r.caminoFeliz ? "Sí" : "No"} | ${ico[r.estado]} ${r.estado} | ${defectos} |\n`;
  }

  md += `\n## Detalle por caso\n`;
  for (const r of resultados) {
    md += `\n---\n\n### ${r.id} — ${r.titulo}\n\n`;
    md += `- **Estado:** ${ico[r.estado]} ${r.estado}\n`;
    md += `- **Prioridad:** ${r.prioridad} · **Funcionalidad:** ${r.funcionalidad} · **Historias:** ${r.us.join(", ")}\n`;
    md += `- **Creador del caso:** ${r.creador} · **Camino feliz:** ${r.caminoFeliz ? "Sí" : "No"} · **Duración:** ${(r.ms / 1000).toFixed(1)} s\n`;
    if (r.prerequisitos) md += `- **Prerrequisitos:** ${r.prerequisitos.join(" / ")}\n`;
    if (r.datos) md += `- **Datos de prueba:** ${Object.entries(r.datos).map(([k, v]) => `${k}: ${v}`).join(" · ")}\n`;
    md += `\n| # | Paso | Resultado esperado | Resultado obtenido | OK |\n|---|---|---|---|---|\n`;
    for (const p of r.pasos) {
      const marca = p.ok === true ? "✅" : p.ok === false ? "❌" : "⚪";
      const limpiar = (s) => String(s).replace(/\|/g, "\\|").replace(/\n/g, " ");
      md += `| ${p.n} | ${limpiar(p.detalle)} | ${limpiar(p.esperado)} | ${limpiar(p.obtenido)} | ${marca} |\n`;
    }
    if (r.notas) md += `\n**Notas:** ${r.notas}\n`;
    if (r.erroresConsola && r.erroresConsola.length)
      md += `\n**Errores de consola durante el caso:** ${r.erroresConsola.join(" · ")}\n`;
    else md += `\n**Errores de consola durante el caso:** ninguno\n`;
  }

  fs.writeFileSync(path.join(SALIDA, `reporte-ejecucion${sufijo}.md`), md, "utf8");
  console.log(`\nReporte: tests/salida/reporte-ejecucion${sufijo}.md`);
  process.exit(resumen.FAILED > 0 ? 1 : 0);
})();
