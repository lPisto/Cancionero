/* Genera capturas de pantalla de la app para la presentación de la entrega. */
const fs = require("fs"); const path = require("path");
const { chromium } = require("playwright-core");
const { escuchar } = require("./server");
const H = require("./helpers");

const DIR = path.join(__dirname, "salida", "capturas");

(async () => {
  fs.mkdirSync(DIR, { recursive: true });
  const { servidor, puerto } = await escuchar();
  const base = `http://127.0.0.1:${puerto}`;
  const br = await chromium.launch({ channel: "chrome", headless: true });
  const { ctx, page } = await H.abrir(br, base, { viewport: { width: 390, height: 844 } });
  const shot = async (n) => { await page.screenshot({ path: path.join(DIR, n + ".png") }); console.log("  " + n + ".png"); };

  console.log("Capturas:");
  await H.irAModo(page, "previa");
  await H.agregarJugadores(page, ["Ana", "Beto", "Caro"]);
  await shot("01-inicio-previa");

  await page.selectOption("#previa-genero", "rock");
  await page.selectOption("#previa-decada", "80");
  await page.waitForTimeout(150);
  await shot("02-filtros");

  await page.selectOption("#previa-genero", ""); await page.selectOption("#previa-decada", "");
  await page.click("#btn-empezar-previa");
  await page.waitForSelector("#pantalla-turno:not([hidden])");
  await shot("03-turno");

  await page.click("#btn-listo"); await H.esperarRonda(page);
  await page.click("#btn-saltar"); await page.waitForTimeout(100);
  await page.fill("#input", "de m"); await page.waitForTimeout(250);
  await shot("04-juego-autocompletado");

  await page.fill("#input", ""); await page.waitForTimeout(100);
  await H.responder(page, "correcta");
  await page.waitForSelector("#pantalla-resultado:not([hidden])");
  await shot("05-resultado-ronda");

  await page.click("#btn-continuar"); await page.waitForSelector("#pantalla-turno:not([hidden])");
  await page.click("#btn-ver-marcador"); await page.waitForTimeout(150);
  await shot("06-marcador");

  await page.click("#btn-volver-marcador");
  for (let t = 0; t < 14; t++) {
    await H.jugarTurno(page, { acierta: (t % 3) + 1 });
    await page.click("#btn-continuar");
    if (t < 13) await page.waitForSelector("#pantalla-turno:not([hidden])");
  }
  await page.waitForSelector("#pantalla-final:not([hidden])");
  await shot("07-podio-final");

  await page.click("#btn-volver-inicio");
  await H.irAModo(page, "infinita");
  await shot("08-inicio-infinita");
  await page.click("#btn-ayuda"); await page.waitForTimeout(200);
  await shot("09-ayuda");

  await br.close(); servidor.close();
  console.log("Guardadas en tests/salida/capturas/");
})();
