/* Utilidades compartidas por los casos de prueba de la Entrega 1. */

const TIMEOUT_RONDA = 30000;

async function abrir(browser, base, opts = {}) {
  const ctx = await browser.newContext({
    viewport: opts.viewport || { width: 412, height: 915 },
    ...(opts.contexto || {})
  });
  const page = await ctx.newPage();
  const errores = [];
  page.on("pageerror", (e) => errores.push("pageerror: " + e.message));
  page.on("console", (m) => { if (m.type() === "error") errores.push("console: " + m.text()); });
  page.errores = errores;
  page.avisos = [];
  page.on("console", (m) => { if (m.type() === "warning") page.avisos.push(m.text()); });
  await page.goto(base + (opts.debug === false ? "/" : "/?debug=1"), { waitUntil: "load" });
  await page.waitForFunction(() => !!window.__cancionero, null, { timeout: 15000 });
  return { ctx, page };
}

const esperarRonda = (page) => page.waitForFunction(
  () => { const e = window.__cancionero.estado; return !e.cargando && (!!e.cancion || !document.getElementById("btn-reintentar").hidden); },
  null, { timeout: TIMEOUT_RONDA });

const cancionActual = (page) => page.evaluate(() => {
  const c = window.__cancionero.estado.cancion;
  return c ? { t: c.t, a: c.a, y: c.y, k: c.k } : null;
});

/* Elige una canción en el buscador usando la lista de sugerencias real. */
async function elegirEnBuscador(page, objetivo) {
  await page.fill("#input", objetivo.t);
  await page.waitForTimeout(140);
  const ok = await page.evaluate((obj) => {
    const ul = document.getElementById("sugerencias");
    if (ul.hidden || !ul._lista) return false;
    const i = ul._lista.findIndex((x) => x.t === obj.t && x.a === obj.a);
    if (i < 0) return false;
    ul.querySelectorAll("li")[i].dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    return true;
  }, objetivo);
  if (!ok) throw new Error(`No apareció la sugerencia "${objetivo.t} — ${objetivo.a}"`);
  return true;
}

/* Responde la ronda actual: tipo "correcta" o "incorrecta". */
async function responder(page, tipo) {
  const objetivo = await page.evaluate((tipo) => {
    const C = window.__cancionero;
    const act = C.estado.cancion;
    if (tipo === "correcta") return { t: act.t, a: act.a };
    window.__yaUsadasTest = window.__yaUsadasTest || [];
    const otra = C.CATALOGO.find((c) =>
      (c.t !== act.t || c.a !== act.a) &&
      c.t.length >= 5 &&
      !window.__yaUsadasTest.includes(c.t + "|" + c.a) &&
      C.CATALOGO.filter((x) => C.normalizar(x.t) === C.normalizar(c.t)).length === 1);
    window.__yaUsadasTest.push(otra.t + "|" + otra.a);
    return { t: otra.t, a: otra.a };
  }, tipo);
  await elegirEnBuscador(page, objetivo);
  await page.click("#btn-enviar");
  await page.waitForTimeout(180);   /* deja pasar el cierre diferido del autocompletado */
  return objetivo;
}

/* Reproduce el fragmento y devuelve cuánto sonó realmente. */
async function medirPlay(page, boton = "#btn-play") {
  return page.evaluate((sel) => new Promise((res) => {
    const C = window.__cancionero;
    let maxCt = 0;
    const t0 = performance.now();
    document.querySelector(sel).click();
    const iv = setInterval(() => {
      maxCt = Math.max(maxCt, C.audio.currentTime || 0);
      const transcurrido = performance.now() - t0;
      if (!C.estado.sonando) { clearInterval(iv); res({ ms: Math.round(transcurrido), maxCt: +maxCt.toFixed(2) }); }
      else if (transcurrido > 40000) { clearInterval(iv); res({ ms: -1, maxCt: +maxCt.toFixed(2) }); }
    }, 20);
  }), boton);
}

async function agregarJugadores(page, nombres) {
  for (const n of nombres) {
    await page.fill("#input-jugador", n);
    await page.click("#btn-agregar");
    await page.waitForTimeout(40);
  }
}

async function irAModo(page, modo) {
  await page.click(`#seg-modo .seg-btn[data-modo="${modo}"]`);
  await page.waitForTimeout(60);
}

async function empezarInfinita(page) {
  await irAModo(page, "infinita");
  await page.click("#btn-empezar-infinita");
  await esperarRonda(page);
}

async function empezarPrevia(page, nombres) {
  await irAModo(page, "previa");
  await agregarJugadores(page, nombres);
  await page.click("#btn-empezar-previa");
  await page.waitForSelector("#pantalla-turno:not([hidden])");
}

/* Juega el turno actual de la Previa: "acierta" en el intento n, o "falla". */
async function jugarTurno(page, plan) {
  await page.click("#btn-listo");
  await esperarRonda(page);
  if (plan.acierta) {
    for (let i = 1; i < plan.acierta; i++) { await page.click("#btn-saltar"); await page.waitForTimeout(60); }
    await responder(page, "correcta");
  } else {
    for (let i = 0; i < 6; i++) { await page.click("#btn-saltar"); await page.waitForTimeout(60); }
  }
  await page.waitForSelector("#pantalla-resultado:not([hidden])");
}

const texto = (page, sel) => page.textContent(sel).then((t) => (t || "").trim().replace(/\s+/g, " "));
/* Visibilidad real: getComputedStyle sobre un descendiente de un contenedor con
   display:none devuelve el display propio del elemento, no "none". Hay que mirar si
   el elemento ocupa lugar en la página. */
const visible = (page, sel) => page.evaluate((s) => {
  const el = document.querySelector(s);
  if (!el) return false;
  if (typeof el.checkVisibility === "function") return el.checkVisibility();
  const r = el.getBoundingClientRect();
  return el.offsetParent !== null && r.width > 0 && r.height > 0;
}, sel);

module.exports = {
  abrir, esperarRonda, cancionActual, elegirEnBuscador, responder, medirPlay,
  agregarJugadores, irAModo, empezarInfinita, empezarPrevia, jugarTurno, texto, visible
};
