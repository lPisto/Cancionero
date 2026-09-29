/* Verificación por inspección de los RNF que no tienen caso de prueba propio:
   RNF-04 (sin instalación ni registro), RNF-08 (el despliegue nuevo se ve sin borrar
   caché) y RNF-09 (aviso de consumo responsable). */
const { chromium } = require("playwright-core");
const { escuchar } = require("./server");
(async () => {
  const { servidor, puerto } = await escuchar();
  const base = `http://127.0.0.1:${puerto}`;
  const br = await chromium.launch({ channel: "chrome", headless: true });
  const page = await br.newPage();
  await page.goto(base + "/");
  await page.waitForFunction(() => !!window.__cancionero);

  const r = await page.evaluate(() => ({
    // RNF-04: sin instalación ni registro
    camposSensibles: [...document.querySelectorAll('input')].map(i=>i.type).filter(t=>["password","email","tel"].includes(t)).length,
    formularios: document.forms.length,
    // RNF-08: sin service worker y assets versionados
    serviceWorkers: navigator.serviceWorker ? "API presente (no se registra ninguno)" : "sin API",
    assetsVersionados: [...document.querySelectorAll('link[rel=stylesheet],script[src]')]
        .map(e => e.getAttribute('href')||e.getAttribute('src')).filter(u=>!/^https?:/.test(u)),
    // RNF-09: aviso de consumo responsable
    avisoResponsable: (document.querySelector('.aviso-responsable')||{}).textContent || null,
    // RNF-01 extra
    viewport: (document.querySelector('meta[name=viewport]')||{}).content
  }));
  const swRegistrados = await page.evaluate(async () =>
    navigator.serviceWorker ? (await navigator.serviceWorker.getRegistrations()).length : 0);

  console.log("RNF-04 · inputs de credenciales:", r.camposSensibles, "· formularios:", r.formularios);
  console.log("RNF-08 · service workers registrados:", swRegistrados, "· assets:", r.assetsVersionados.join(", "));
  console.log("RNF-09 · aviso de consumo responsable:", r.avisoResponsable ? "«"+r.avisoResponsable.trim().slice(0,110)+"…»" : "AUSENTE");
  console.log("RNF-01 · viewport:", r.viewport);
  await br.close(); servidor.close();
})();
