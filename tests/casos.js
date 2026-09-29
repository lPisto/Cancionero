/* ═══════════════════════════════════════════════════════════════════════
   Cancionero V1 — Entrega 1 — Casos de prueba TC-01 a TC-28
   Cada caso devuelve la lista de pasos con su resultado esperado y el
   obtenido. El estado del caso lo calcula el runner: si todos los pasos
   dan ok, es PASSED; si alguno falla, FAILED.
   ══════════════════════════════════════════════════════════════════════ */

const H = require("./helpers");

function verificador() {
  const pasos = [];
  return {
    pasos,
    paso(detalle, esperado, obtenido, ok) {
      pasos.push({ n: pasos.length + 1, detalle, esperado, obtenido: String(obtenido),
                   ok: ok === null ? null : !!ok });
    }
  };
}

const casi = (valor, objetivo, tol) => Math.abs(valor - objetivo) <= tol;

/* ═══════════════════════════════════════════════════════════════════════ */
const CASOS = [

/* ───────────────────────── US-01 · Reproducción ───────────────────────── */
{
  id: "TC-01", prioridad: "Alta", creador: "Franco", us: ["US-01"], caminoFeliz: true,
  funcionalidad: "Reproducción de audio",
  titulo: "Reproducir el primer fragmento de 1 segundo",
  prerequisitos: ["Abrir la aplicación desde un navegador web (Desktop).", "Elegir Modo Infinito sin filtros."],
  async ejecutar({ browser, base }) {
    const v = verificador();
    const { ctx, page } = await H.abrir(browser, base);
    try {
      await H.empezarInfinita(page);

      const intento = await H.texto(page, "#juego-intento");
      const barra = await H.texto(page, "#barra-desbloqueado");
      v.paso("Observar la pantalla de juego antes de reproducir.",
        'Se muestra "Intento 1 de 6" y la barra indica 1 s desbloqueado.',
        `${intento} · barra: ${barra}`,
        intento === "Intento 1 de 6" && barra === "1 s");

      const m1 = await H.medirPlay(page);
      v.paso('Hacer click en "Play".',
        "Se reproduce audio durante 1 segundo y se detiene solo.",
        `sonó ${(m1.maxCt).toFixed(2)} s (corte a los ${m1.ms} ms)`,
        casi(m1.maxCt, 1, 0.35) && casi(m1.ms, 1060, 500));

      const m2 = await H.medirPlay(page);
      const intento2 = await H.texto(page, "#juego-intento");
      v.paso('Hacer click en "Play" otra vez.',
        'Se vuelve a reproducir el mismo segundo. El indicador sigue en "Intento 1 de 6".',
        `sonó ${(m2.maxCt).toFixed(2)} s · ${intento2}`,
        casi(m2.maxCt, 1, 0.35) && intento2 === "Intento 1 de 6");

      return { pasos: v.pasos, errores: page.errores };
    } finally { await ctx.close(); }
  }
},

{
  id: "TC-02", prioridad: "Alta", creador: "Franco", us: ["US-01", "US-03"], caminoFeliz: false,
  funcionalidad: "Reproducción de audio",
  titulo: "Desbloqueo progresivo de segundos tras respuestas incorrectas",
  prerequisitos: ["Abrir la aplicación con modo debug (?debug=1).", "Elegir Modo Infinito sin filtros."],
  async ejecutar({ browser, base }) {
    const v = verificador();
    const { ctx, page } = await H.abrir(browser, base);
    try {
      await H.empezarInfinita(page);

      await H.responder(page, "incorrecta");
      const hist = await page.$$eval("#intentos li.mal", (l) => l.length);
      const ind = await H.texto(page, "#juego-intento");
      v.paso('Buscar y elegir una canción incorrecta. Hacer click en "Enviar".',
        'Se muestra "Incorrecto", la respuesta queda en el historial y el indicador pasa a "Intento 2 de 6".',
        `historial con ${hist} incorrecta(s) · ${ind}`,
        hist === 1 && ind === "Intento 2 de 6");

      const esperados = [2, 4, 7, 11, 16];
      for (let k = 0; k < esperados.length; k++) {
        const seg = esperados[k];
        const m = await H.medirPlay(page);
        const etiqueta = await H.texto(page, "#barra-desbloqueado");
        v.paso(k === 0 ? 'Hacer click en "Play".' : 'Enviar otra canción incorrecta y hacer click en "Play".',
          `"Intento ${k + 2} de 6". Se reproducen ${seg} segundos.`,
          `barra ${etiqueta} · sonó ${(m.maxCt).toFixed(2)} s`,
          etiqueta === `${seg} s` && casi(m.maxCt, seg, Math.max(0.5, seg * 0.12)));
        if (k < esperados.length - 1) await H.responder(page, "incorrecta");
      }
      return { pasos: v.pasos, errores: page.errores };
    } finally { await ctx.close(); }
  }
},

/* ───────────────────────── US-02 · Buscador ───────────────────────── */
{
  id: "TC-03", prioridad: "Alta", creador: "Lucas", us: ["US-02"], caminoFeliz: true,
  funcionalidad: "Buscador",
  titulo: "Autocompletado por título",
  prerequisitos: ["Abrir la aplicación desde un navegador web (Desktop).", "Elegir Modo Infinito sin filtros."],
  datos: { "Texto 1": "d", "Texto 2": "de música", "Canción esperada": "De Música Ligera — Soda Stereo" },
  async ejecutar({ browser, base }) {
    const v = verificador();
    const { ctx, page } = await H.abrir(browser, base);
    try {
      await H.empezarInfinita(page);

      await page.fill("#input", "d");
      await page.waitForTimeout(150);
      const abiertas1 = await H.visible(page, "#sugerencias");
      v.paso("Hacer click en el buscador y escribir el Texto 1.",
        "No aparecen sugerencias (se necesitan al menos 2 caracteres).",
        abiertas1 ? "la lista de sugerencias se abrió" : "no aparecieron sugerencias",
        !abiertas1);

      await page.fill("#input", "de música");
      await page.waitForTimeout(180);
      const sugs = await page.$$eval("#sugerencias li", (l) => l.map((x) => x.textContent.trim()));
      v.paso("Completar hasta el Texto 2.",
        'Aparecen como máximo 8 sugerencias con formato "Título — Artista", entre ellas la canción esperada.',
        `${sugs.length} sugerencia(s): ${sugs.join(" | ")}`,
        sugs.length > 0 && sugs.length <= 8 &&
        sugs.some((s) => /De Música Ligera — Soda Stereo/i.test(s)) &&
        sugs.every((s) => s.includes("—")));

      await H.elegirEnBuscador(page, { t: "De Música Ligera", a: "Soda Stereo" });
      const valor = await page.inputValue("#input");
      const enviarOk = !(await page.isDisabled("#btn-enviar"));
      v.paso("Hacer click en la canción esperada.",
        'El buscador muestra la canción elegida y se habilita el botón "Enviar".',
        `input: "${valor}" · Enviar habilitado: ${enviarOk}`,
        /De Música Ligera — Soda Stereo/i.test(valor) && enviarOk);

      return { pasos: v.pasos, errores: page.errores };
    } finally { await ctx.close(); }
  }
},

{
  id: "TC-04", prioridad: "Media", creador: "Lucas", us: ["US-02"], caminoFeliz: false,
  funcionalidad: "Buscador",
  titulo: "Autocompletado por artista, sin tildes ni mayúsculas",
  prerequisitos: ["Abrir la aplicación desde un navegador web (Desktop).", "Elegir Modo Infinito sin filtros."],
  datos: { "Texto 1": "SODA", "Texto 2": "musica ligera" },
  async ejecutar({ browser, base }) {
    const v = verificador();
    const { ctx, page } = await H.abrir(browser, base);
    try {
      await H.empezarInfinita(page);

      await page.fill("#input", "SODA");
      await page.waitForTimeout(180);
      const s1 = await page.$$eval("#sugerencias li", (l) => l.map((x) => x.textContent.trim()));
      v.paso("Escribir el Texto 1 en el buscador.",
        "Aparecen sugerencias con canciones de Soda Stereo.",
        `${s1.length} sugerencia(s): ${s1.join(" | ")}`,
        s1.length > 0 && s1.every((s) => /Soda Stereo/i.test(s)));

      await page.fill("#input", "musica ligera");
      await page.waitForTimeout(180);
      const s2 = await page.$$eval("#sugerencias li", (l) => l.map((x) => x.textContent.trim()));
      v.paso("Borrar y escribir el Texto 2 (sin tilde).",
        "Aparece la canción esperada (con tilde).",
        s2.join(" | ") || "(sin sugerencias)",
        s2.some((s) => /De Música Ligera — Soda Stereo/i.test(s)));

      return { pasos: v.pasos, errores: page.errores };
    } finally { await ctx.close(); }
  }
},

{
  id: "TC-05", prioridad: "Media", creador: "Lucas", us: ["US-02"], caminoFeliz: false,
  funcionalidad: "Buscador",
  titulo: "Búsqueda sin resultados y envío de texto libre",
  prerequisitos: ["Abrir la aplicación desde un navegador web (Desktop).", "Elegir Modo Infinito sin filtros."],
  datos: { Texto: "xyzqw" },
  async ejecutar({ browser, base }) {
    const v = verificador();
    const { ctx, page } = await H.abrir(browser, base);
    try {
      await H.empezarInfinita(page);

      await page.fill("#input", "xyzqw");
      await page.waitForTimeout(180);
      const vacio = await page.$$eval("#sugerencias li", (l) => l.map((x) => x.textContent.trim()));
      v.paso("Escribir el texto en el buscador.",
        'Se muestra "No hay resultados".',
        vacio.join(" | ") || "(lista cerrada)",
        vacio.length === 1 && vacio[0] === "No hay resultados");

      await page.press("#input", "Enter");
      await page.waitForTimeout(120);
      const desactivado = await page.isDisabled("#btn-enviar");
      await page.click("#btn-enviar", { force: true }).catch(() => {});
      await page.waitForTimeout(120);
      const ind = await H.texto(page, "#juego-intento");
      v.paso('Presionar Enter y hacer click en "Enviar".',
        'No se envía nada: "Enviar" está deshabilitado y el indicador sigue en "Intento 1 de 6".',
        `Enviar deshabilitado: ${desactivado} · ${ind}`,
        desactivado && ind === "Intento 1 de 6");

      return { pasos: v.pasos, errores: page.errores };
    } finally { await ctx.close(); }
  }
},

/* ───────────────────── US-03 / US-05 · Validación ───────────────────── */
{
  id: "TC-06", prioridad: "Alta", creador: "Severiano", us: ["US-03", "US-05", "US-08"], caminoFeliz: true,
  funcionalidad: "Validación de respuesta",
  titulo: "Acierto en el primer intento",
  prerequisitos: ["Abrir la aplicación con modo debug.", "Modo Previa con 2 jugadores (Ana, Beto).", "Es el turno de Ana en la ronda 1."],
  async ejecutar({ browser, base }) {
    const v = verificador();
    const { ctx, page } = await H.abrir(browser, base);
    try {
      await H.empezarPrevia(page, ["Ana", "Beto"]);
      await page.click("#btn-listo");
      await H.esperarRonda(page);

      const m = await H.medirPlay(page);
      v.paso('Hacer click en "¡Listo!" y luego en "Play".', "Se reproduce 1 segundo.",
        `sonó ${(m.maxCt).toFixed(2)} s`, casi(m.maxCt, 1, 0.35));

      await H.responder(page, "correcta");
      await page.waitForSelector("#pantalla-resultado:not([hidden])");
      const ver = await H.texto(page, "#veredicto");
      v.paso('Buscar y elegir la canción que muestra el modo debug. Hacer click en "Enviar".',
        'Se muestra "¡Correcto!" y termina la ronda de Ana.', ver, ver === "¡Correcto!");

      const det = await H.texto(page, "#veredicto-detalle");
      v.paso("Observar la pantalla de resultado.",
        'Se muestra "Acertaste en el intento 1 — +10 puntos".', det,
        det === "Acertaste en el intento 1 — +10 puntos");

      await page.click("#btn-continuar");
      await page.waitForSelector("#pantalla-turno:not([hidden])");
      await page.click("#btn-ver-marcador");
      await page.waitForSelector("#pantalla-marcador:not([hidden])");
      const filas = await page.$$eval("#tabla-marcador tr", (trs) =>
        trs.slice(1).map((tr) => [...tr.querySelectorAll("td")].map((td) => td.textContent.trim()).join(" / ")));
      v.paso("Abrir el marcador.", "Ana: 10 puntos, 1 acierto. Beto: 0 puntos.",
        filas.join(" || "),
        /Ana/.test(filas[0]) && filas[0].endsWith("10 / 1") && /Beto/.test(filas[1]) && filas[1].endsWith("0 / 0"));

      return { pasos: v.pasos, errores: page.errores };
    } finally { await ctx.close(); }
  }
},

{
  id: "TC-07", prioridad: "Alta", creador: "Severiano", us: ["US-03", "US-05"], caminoFeliz: false,
  funcionalidad: "Validación de respuesta",
  titulo: "Seis respuestas incorrectas",
  prerequisitos: ["Abrir la aplicación con modo debug.", "Elegir Modo Infinito sin filtros."],
  async ejecutar({ browser, base }) {
    const v = verificador();
    const { ctx, page } = await H.abrir(browser, base);
    try {
      await H.empezarInfinita(page);
      const cancion = await H.cancionActual(page);

      for (let i = 0; i < 5; i++) await H.responder(page, "incorrecta");
      const malos = await page.$$eval("#intentos li.mal", (l) => l.length);
      const ind = await H.texto(page, "#juego-intento");
      v.paso("Enviar 5 respuestas incorrectas.",
        'Cada una aparece en el historial marcada como incorrecta. El indicador llega a "Intento 6 de 6".',
        `${malos} incorrectas en el historial · ${ind}`,
        malos === 5 && ind === "Intento 6 de 6");

      await H.responder(page, "incorrecta");
      await page.waitForSelector("#pantalla-resultado:not([hidden])");
      const ver = await H.texto(page, "#veredicto");
      const det = await H.texto(page, "#veredicto-detalle");
      const titulo = await H.texto(page, "#res-titulo");
      v.paso("Enviar la 6.ª respuesta incorrecta.",
        'La ronda termina con "No acertada — 0 puntos" y se revela la canción.',
        `${ver} · ${det} · canción revelada: ${titulo}`,
        ver === "No acertada" && det === "No acertada — 0 puntos" && titulo === cancion.t);

      const buscadorVisible = await H.visible(page, "#input");
      v.paso("Intentar escribir en el buscador.",
        "El buscador ya no está disponible para esta canción.",
        buscadorVisible ? "el buscador sigue visible" : "el buscador ya no está en pantalla",
        !buscadorVisible);

      return { pasos: v.pasos, errores: page.errores };
    } finally { await ctx.close(); }
  }
},

/* ───────────────────────── US-04 · Saltar ───────────────────────── */
{
  id: "TC-08", prioridad: "Media", creador: "Ramiro", us: ["US-04"], caminoFeliz: true,
  funcionalidad: "Saltar",
  titulo: "Saltar un intento",
  prerequisitos: ["Abrir la aplicación desde un navegador web (Desktop).", "Elegir Modo Infinito sin filtros."],
  async ejecutar({ browser, base }) {
    const v = verificador();
    const { ctx, page } = await H.abrir(browser, base);
    try {
      await H.empezarInfinita(page);

      const etiqueta1 = await H.texto(page, "#btn-saltar");
      v.paso('Observar el botón "Saltar".', 'Muestra "Saltar (+1 s)".', etiqueta1, etiqueta1 === "Saltar (+1 s)");

      await page.click("#btn-saltar");
      await page.waitForTimeout(120);
      const saltados = await page.$$eval("#intentos li.salto .txt", (l) => l.map((x) => x.textContent.trim()));
      const ind = await H.texto(page, "#juego-intento");
      const etiqueta2 = await H.texto(page, "#btn-saltar");
      v.paso('Hacer click en "Saltar".',
        'El historial muestra "Saltado", el indicador pasa a "Intento 2 de 6" y el botón pasa a "Saltar (+2 s)".',
        `historial: ${saltados.join(",")} · ${ind} · botón: ${etiqueta2}`,
        saltados.length === 1 && saltados[0] === "Saltado" && ind === "Intento 2 de 6" && etiqueta2 === "Saltar (+2 s)");

      const m = await H.medirPlay(page);
      v.paso('Hacer click en "Play".', "Se reproducen 2 segundos.",
        `sonó ${(m.maxCt).toFixed(2)} s`, casi(m.maxCt, 2, 0.5));

      return { pasos: v.pasos, errores: page.errores };
    } finally { await ctx.close(); }
  }
},

{
  id: "TC-09", prioridad: "Media", creador: "Ramiro", us: ["US-04"], caminoFeliz: false,
  funcionalidad: "Saltar",
  titulo: "Saltar en el sexto intento",
  prerequisitos: ["Abrir la aplicación desde un navegador web (Desktop).", "Elegir Modo Infinito sin filtros."],
  async ejecutar({ browser, base }) {
    const v = verificador();
    const { ctx, page } = await H.abrir(browser, base);
    try {
      await H.empezarInfinita(page);

      for (let i = 0; i < 5; i++) { await page.click("#btn-saltar"); await page.waitForTimeout(80); }
      const saltados = await page.$$eval("#intentos li.salto", (l) => l.length);
      const ind = await H.texto(page, "#juego-intento");
      v.paso('Hacer click en "Saltar" 5 veces.',
        'El historial muestra 5 "Saltado" y el indicador está en "Intento 6 de 6".',
        `${saltados} saltados · ${ind}`, saltados === 5 && ind === "Intento 6 de 6");

      const etiqueta = await H.texto(page, "#btn-saltar");
      await page.click("#btn-saltar");
      await page.waitForSelector("#pantalla-resultado:not([hidden])");
      const ver = await H.texto(page, "#veredicto");
      const det = await H.texto(page, "#veredicto-detalle");
      const titulo = await H.texto(page, "#res-titulo");
      v.paso('Observar el botón y hacer click en "Saltar" una vez más.',
        'El botón dice "Saltar (termina la ronda)". La ronda termina con "No acertada — 0 puntos" y se revela la canción.',
        `botón: ${etiqueta} · ${ver} · ${det} · revela: ${titulo}`,
        etiqueta === "Saltar (termina la ronda)" && det === "No acertada — 0 puntos" && !!titulo);

      return { pasos: v.pasos, errores: page.errores };
    } finally { await ctx.close(); }
  }
},

/* ───────────────────── US-05 · Resultado de ronda ───────────────────── */
{
  id: "TC-10", prioridad: "Alta", creador: "Franco", us: ["US-05"], caminoFeliz: true,
  funcionalidad: "Resultado de la ronda",
  titulo: "Pantalla de resultado de la ronda",
  prerequisitos: ["Abrir la aplicación con modo debug.", "Elegir Modo Infinito sin filtros."],
  async ejecutar({ browser, base }) {
    const v = verificador();
    const { ctx, page } = await H.abrir(browser, base);
    try {
      await H.empezarInfinita(page);
      const cancion = await H.cancionActual(page);

      await page.click("#btn-saltar"); await page.waitForTimeout(80);
      await page.click("#btn-saltar"); await page.waitForTimeout(80);
      await H.responder(page, "correcta");
      await page.waitForSelector("#pantalla-resultado:not([hidden])");
      const ver = await H.texto(page, "#veredicto");
      v.paso('Hacer click en "Saltar" 2 veces. Luego elegir la canción correcta y hacer click en "Enviar".',
        'Se muestra "¡Correcto!".', ver, ver === "¡Correcto!");

      const datos = {
        titulo: await H.texto(page, "#res-titulo"),
        artista: await H.texto(page, "#res-artista"),
        anio: await H.texto(page, "#res-anio"),
        caratula: await page.getAttribute("#res-caratula", "src"),
        detalle: await H.texto(page, "#veredicto-detalle")
      };
      v.paso("Revisar la pantalla de resultado.",
        'Se muestran título, artista, año y carátula, iguales a los del modo debug, y "Intento 3 — +6 puntos".',
        `${datos.titulo} / ${datos.artista} / ${datos.anio} / carátula ${datos.caratula ? "ok" : "ausente"} / ${datos.detalle}`,
        datos.titulo === cancion.t && datos.artista === cancion.a && datos.anio === cancion.y &&
        datos.caratula === cancion.k && datos.detalle === "Acertaste en el intento 3 — +6 puntos");

      const px = await page.evaluate(() => {
        const s = getComputedStyle(document.getElementById("veredicto-detalle"));
        const t = getComputedStyle(document.getElementById("veredicto"));
        return { detalle: parseFloat(s.fontSize), veredicto: parseFloat(t.fontSize) };
      });
      v.paso("Inspeccionar el texto del veredicto con DevTools.",
        "El tamaño de letra es de 23 px o más.",
        `veredicto ${px.veredicto} px · detalle ${px.detalle} px`,
        px.veredicto >= 23 && px.detalle >= 23);

      const m = await H.medirPlay(page, "#btn-play-completo");
      v.paso('Hacer click en "Play" en la pantalla de resultado.',
        "Se reproduce el fragmento completo (unos 30 segundos).",
        `sonó ${(m.maxCt).toFixed(2)} s`, m.maxCt > 16.5);

      const antes = cancion.t;
      await page.click("#btn-continuar");
      await H.esperarRonda(page);
      const nueva = await H.cancionActual(page);
      v.paso('Hacer click en "Siguiente".', "Carga una nueva canción.",
        `${antes} → ${nueva.t}`, nueva && nueva.t !== antes);

      return { pasos: v.pasos, errores: page.errores };
    } finally { await ctx.close(); }
  }
},

/* ───────────────────── US-06 · Registro de jugadores ───────────────────── */
{
  id: "TC-11", prioridad: "Alta", creador: "Lucas", us: ["US-06"], caminoFeliz: true,
  funcionalidad: "Registro de jugadores",
  titulo: "Registrar jugadores válidos",
  prerequisitos: ["Abrir la aplicación desde un navegador web (Desktop).", 'Elegir "Modo Previa".'],
  datos: { Jugadores: "Ana, Beto, Caro" },
  async ejecutar({ browser, base }) {
    const v = verificador();
    const { ctx, page } = await H.abrir(browser, base);
    try {
      await H.irAModo(page, "previa");
      const vacia = await page.$$eval("#lista-jugadores li", (l) => l.length);
      const desactivado = await page.isDisabled("#btn-empezar-previa");
      v.paso("Observar la pantalla de jugadores.",
        'La lista está vacía y el botón "Empezar" está deshabilitado.',
        `${vacia} jugadores · Empezar deshabilitado: ${desactivado}`, vacia === 0 && desactivado);

      await H.agregarJugadores(page, ["Ana"]);
      const ana = await page.$$eval("#lista-jugadores li", (l) =>
        l.map((li) => ({ nombre: li.querySelector(".nombre").textContent.trim(), emoji: li.querySelector(".avatar").textContent.trim(), color: li.style.borderLeftColor })));
      v.paso('Agregar a "Ana".', "Ana aparece en la lista con un color y un emoji.",
        JSON.stringify(ana), ana.length === 1 && ana[0].nombre === "Ana" && !!ana[0].emoji && !!ana[0].color);

      await H.agregarJugadores(page, ["Beto"]);
      const dos = await page.$$eval("#lista-jugadores li", (l) =>
        l.map((li) => li.querySelector(".avatar").textContent.trim() + "|" + li.style.borderLeftColor));
      const habil = !(await page.isDisabled("#btn-empezar-previa"));
      v.paso('Agregar a "Beto".',
        'Beto aparece con un color y un emoji distintos a los de Ana. "Empezar" se habilita.',
        `${dos.join(" · ")} · Empezar habilitado: ${habil}`,
        dos[0] !== dos[1] && habil);

      await H.agregarJugadores(page, ["Caro"]);
      const tres = await page.$$eval("#lista-jugadores li", (l) =>
        l.map((li) => li.querySelector(".avatar").textContent.trim() + "|" + li.style.borderLeftColor));
      v.paso('Agregar a "Caro".', "Hay 3 jugadores, todos con colores y emojis distintos.",
        tres.join(" · "), tres.length === 3 && new Set(tres).size === 3);

      await page.click('#lista-jugadores li:nth-child(2) .btn-quitar');
      await page.waitForTimeout(80);
      const quedan = await page.$$eval("#lista-jugadores .nombre", (l) => l.map((x) => x.textContent.trim()));
      v.paso('Eliminar a "Beto".', "Quedan Ana y Caro.", quedan.join(", "),
        quedan.length === 2 && quedan[0] === "Ana" && quedan[1] === "Caro");

      await page.click("#btn-empezar-previa");
      await page.waitForSelector("#pantalla-turno:not([hidden])");
      const ronda = await H.texto(page, "#turno-ronda");
      const nombre = await H.texto(page, "#turno-nombre");
      v.paso('Hacer click en "Empezar la partida".',
        'Se muestra "Ronda 1 de 5" y "Le toca a Ana" con su color y su emoji.',
        `${ronda} · Le toca a ${nombre}`, ronda === "Ronda 1 de 5" && nombre === "Ana");

      return { pasos: v.pasos, errores: page.errores };
    } finally { await ctx.close(); }
  }
},

{
  id: "TC-12", prioridad: "Alta", creador: "Lucas", us: ["US-06"], caminoFeliz: false,
  funcionalidad: "Registro de jugadores",
  titulo: "Límites de cantidad de jugadores (1 y 13)",
  prerequisitos: ["Abrir la aplicación desde un navegador web (Desktop).", 'Elegir "Modo Previa".'],
  datos: { Jugadores: "J1, J2, … J13" },
  async ejecutar({ browser, base }) {
    const v = verificador();
    const { ctx, page } = await H.abrir(browser, base);
    try {
      await H.irAModo(page, "previa");
      await H.agregarJugadores(page, ["J1"]);
      const des1 = await page.isDisabled("#btn-empezar-previa");
      v.paso('Agregar solo a "J1".', 'El botón "Empezar" sigue deshabilitado.',
        `Empezar deshabilitado: ${des1}`, des1);

      await H.agregarJugadores(page, Array.from({ length: 11 }, (_, i) => `J${i + 2}`));
      const total = await page.$$eval("#lista-jugadores li", (l) => l.length);
      const ids = await page.$$eval("#lista-jugadores li", (l) =>
        l.map((li) => li.querySelector(".avatar").textContent.trim() + "|" + li.style.borderLeftColor));
      const habil = !(await page.isDisabled("#btn-empezar-previa"));
      v.paso('Agregar de "J2" a "J12".',
        'Hay 12 jugadores, cada uno con color y emoji distintos. "Empezar la partida" está habilitado.',
        `${total} jugadores · ${new Set(ids).size} identidades únicas · Empezar habilitado: ${habil}`,
        total === 12 && new Set(ids).size === 12 && habil);

      await page.fill("#input-jugador", "J13", { timeout: 1500 }).catch(() => {});
      const addDes = await page.isDisabled("#btn-agregar");
      const aviso = await H.texto(page, "#aviso-jugadores");
      await page.click("#btn-agregar", { force: true, timeout: 1500 }).catch(() => {});
      await page.waitForTimeout(120);
      const total2 = await page.$$eval("#lista-jugadores li", (l) => l.length);
      v.paso('Intentar agregar a "J13".',
        'No se agrega: se muestra "Máximo 12 jugadores" o el botón para agregar está deshabilitado.',
        `sigue habiendo ${total2} jugadores · Agregar deshabilitado: ${addDes} · aviso: "${aviso}"`,
        total2 === 12 && (addDes || /Máximo 12 jugadores/i.test(aviso)));

      return { pasos: v.pasos, errores: page.errores };
    } finally { await ctx.close(); }
  }
},

{
  id: "TC-13", prioridad: "Media", creador: "Severiano", us: ["US-06"], caminoFeliz: false,
  funcionalidad: "Registro de jugadores",
  titulo: "Validación de nombres de jugadores",
  prerequisitos: ["Abrir la aplicación desde un navegador web (Desktop).", 'Elegir "Modo Previa".'],
  datos: { "Nombre 1": "Ana", "Nombres 2 y 3": "(vacío) y (3 espacios)", "Nombre 4": "ana", "Nombre 5": "Bartolomeo Gonzalez (19 caracteres)" },
  async ejecutar({ browser, base }) {
    const v = verificador();
    const { ctx, page } = await H.abrir(browser, base);
    try {
      await H.irAModo(page, "previa");

      await H.agregarJugadores(page, ["Ana"]);
      const l1 = await page.$$eval("#lista-jugadores .nombre", (l) => l.map((x) => x.textContent.trim()));
      v.paso("Agregar el Nombre 1.", "Ana se agrega a la lista.", l1.join(","), l1.length === 1 && l1[0] === "Ana");

      const intentar = async (valor) => {
        await page.fill("#input-jugador", valor);
        await page.click("#btn-agregar");
        await page.waitForTimeout(140);
        const n = await page.$$eval("#lista-jugadores li", (l) => l.length);
        const t = await page.evaluate(() => { const x = document.getElementById("toast"); return x.hidden ? "" : x.textContent.trim(); });
        return { n, t };
      };

      const r2 = await intentar("");
      v.paso("Intentar agregar el Nombre 2 (vacío).",
        "No se agrega y se muestra un mensaje de nombre obligatorio.",
        `${r2.n} jugador(es) · mensaje: "${r2.t}"`, r2.n === 1 && /obligatorio/i.test(r2.t));

      const r3 = await intentar("   ");
      v.paso("Intentar agregar el Nombre 3 (3 espacios).",
        "No se agrega y se muestra un mensaje de nombre obligatorio.",
        `${r3.n} jugador(es) · mensaje: "${r3.t}"`, r3.n === 1 && /obligatorio/i.test(r3.t));

      const r4 = await intentar("ana");
      v.paso('Intentar agregar el Nombre 4 ("ana").',
        "No se agrega y se muestra un mensaje de nombre repetido.",
        `${r4.n} jugador(es) · mensaje: "${r4.t}"`, r4.n === 1 && /ya está en la lista/i.test(r4.t));

      await page.fill("#input-jugador", "Bartolomeo Gonzalez");
      const valor = await page.inputValue("#input-jugador");
      const maxlength = await page.getAttribute("#input-jugador", "maxlength");
      v.paso("Escribir el Nombre 5 (19 caracteres).",
        "El campo no permite más de 15 caracteres o muestra un error.",
        `el campo quedó con "${valor}" (${valor.length} caracteres, maxlength=${maxlength})`,
        valor.length <= 15 && maxlength === "15");

      return { pasos: v.pasos, errores: page.errores };
    } finally { await ctx.close(); }
  }
},

/* ───────────────────────── US-07 · Turnos ───────────────────────── */
{
  id: "TC-14", prioridad: "Alta", creador: "Franco", us: ["US-07"], caminoFeliz: true,
  funcionalidad: "Turnos",
  titulo: "Rotación de turnos entre rondas",
  prerequisitos: ["Abrir la aplicación con modo debug.", "Modo Previa con 3 jugadores (Ana, Beto, Caro). Partida empezada."],
  async ejecutar({ browser, base }) {
    const v = verificador();
    const { ctx, page } = await H.abrir(browser, base);
    try {
      await H.empezarPrevia(page, ["Ana", "Beto", "Caro"]);
      const r0 = await H.texto(page, "#turno-ronda");
      const n0 = await H.texto(page, "#turno-nombre");
      v.paso("Observar la pantalla.", 'Se muestra "Ronda 1 de 5 — Le toca a Ana".',
        `${r0} — Le toca a ${n0}`, r0 === "Ronda 1 de 5" && n0 === "Ana");

      const canciones = [];
      const jugarYContinuar = async () => {
        await page.click("#btn-listo");
        await H.esperarRonda(page);
        canciones.push((await H.cancionActual(page)).t);
        await H.responder(page, "correcta");
        await page.waitForSelector("#pantalla-resultado:not([hidden])");
        await page.click("#btn-continuar");
        await page.waitForSelector("#pantalla-turno:not([hidden])");
        return { ronda: await H.texto(page, "#turno-ronda"), nombre: await H.texto(page, "#turno-nombre") };
      };

      const t1 = await jugarYContinuar();
      v.paso('Ana juega su turno. Hacer click en "Continuar".', 'Se muestra "Le toca a Beto", ronda 1.',
        `${t1.ronda} — Le toca a ${t1.nombre}`, t1.nombre === "Beto" && t1.ronda === "Ronda 1 de 5");

      const t2 = await jugarYContinuar();
      v.paso('Beto juega su turno. Hacer click en "Continuar".', 'Se muestra "Le toca a Caro", ronda 1.',
        `${t2.ronda} — Le toca a ${t2.nombre}`, t2.nombre === "Caro" && t2.ronda === "Ronda 1 de 5");

      const t3 = await jugarYContinuar();
      v.paso('Caro juega su turno. Hacer click en "Continuar".', 'Se muestra "Ronda 2 de 5 — Le toca a Ana".',
        `${t3.ronda} — Le toca a ${t3.nombre}`, t3.nombre === "Ana" && t3.ronda === "Ronda 2 de 5");

      v.paso("Comparar las 3 canciones anotadas.", "Las 3 canciones son distintas.",
        canciones.join(" | "), new Set(canciones).size === 3);

      return { pasos: v.pasos, errores: page.errores };
    } finally { await ctx.close(); }
  }
},

/* ───────────────────────── US-08 · Puntuación ───────────────────────── */
{
  id: "TC-15", prioridad: "Alta", creador: "Severiano", us: ["US-08"], caminoFeliz: false,
  funcionalidad: "Puntuación",
  titulo: "Cálculo de puntos según el intento",
  prerequisitos: ["Abrir la aplicación con modo debug.", "Modo Previa con 7 jugadores (J1 a J7). Partida empezada."],
  async ejecutar({ browser, base }) {
    const v = verificador();
    const { ctx, page } = await H.abrir(browser, base);
    try {
      await H.empezarPrevia(page, ["J1", "J2", "J3", "J4", "J5", "J6", "J7"]);
      const esperados = [10, 8, 6, 4, 2, 1, 0];

      for (let j = 0; j < 7; j++) {
        const acierta = j < 6 ? j + 1 : null;
        await H.jugarTurno(page, { acierta });
        const det = await H.texto(page, "#veredicto-detalle");
        const esperado = acierta
          ? `Acertaste en el intento ${acierta} — +${esperados[j]} puntos`
          : "No acertada — 0 puntos";
        v.paso(acierta
            ? `J${j + 1} ${acierta === 1 ? "acierta en el 1.er intento" : `salta ${acierta - 1} vez/veces y acierta (intento ${acierta})`}.`
            : "J7 salta 6 veces (no acierta).",
          acierta ? `+${esperados[j]} puntos.` : "0 puntos.", det, det === esperado);
        await page.click("#btn-continuar");
        await page.waitForSelector("#pantalla-turno:not([hidden])");
      }

      await page.click("#btn-ver-marcador");
      await page.waitForSelector("#pantalla-marcador:not([hidden])");
      const filas = await page.$$eval("#tabla-marcador tr", (trs) =>
        trs.slice(1).map((tr) => {
          const td = [...tr.querySelectorAll("td")].map((x) => x.textContent.replace(/\s+/g, " ").trim());
          return `${td[1].split(" ").pop()}=${td[2]}`;
        }));
      const esperadoOrden = esperados.map((p, i) => `J${i + 1}=${p}`).join(", ");
      v.paso("Abrir el marcador.", "J1 10, J2 8, J3 6, J4 4, J5 2, J6 1, J7 0, en ese orden.",
        filas.join(", "), filas.join(", ") === esperadoOrden);

      return { pasos: v.pasos, errores: page.errores };
    } finally { await ctx.close(); }
  }
},

{
  id: "TC-16", prioridad: "Alta", creador: "Ramiro", us: ["US-08", "US-09"], caminoFeliz: true,
  funcionalidad: "Puntuación",
  titulo: "Partida completa y ganador",
  prerequisitos: ["Abrir la aplicación con modo debug.", "Modo Previa con 2 jugadores (Ana, Beto). Partida empezada.",
                  "Ana: acierta siempre en el intento 1. Beto: salta siempre 6 veces."],
  async ejecutar({ browser, base }) {
    const v = verificador();
    const { ctx, page } = await H.abrir(browser, base);
    try {
      await H.empezarPrevia(page, ["Ana", "Beto"]);

      for (let ronda = 1; ronda <= 4; ronda++) {
        await H.jugarTurno(page, { acierta: 1 });        // Ana
        await page.click("#btn-continuar");
        await page.waitForSelector("#pantalla-turno:not([hidden])");
        await H.jugarTurno(page, { acierta: null });     // Beto
        await page.click("#btn-continuar");
        await page.waitForSelector("#pantalla-turno:not([hidden])");
      }
      const ronda5 = await H.texto(page, "#turno-ronda");
      v.paso("Jugar las rondas 1 a 4 según los datos de prueba.",
        'El contador avanza hasta "Ronda 5 de 5".', ronda5, ronda5 === "Ronda 5 de 5");

      await H.jugarTurno(page, { acierta: 1 });          // Ana ronda 5
      await page.click("#btn-continuar");
      await page.waitForSelector("#pantalla-turno:not([hidden])");
      await H.jugarTurno(page, { acierta: null });       // Beto ronda 5
      const etiquetaFinal = await H.texto(page, "#btn-continuar");
      await page.click("#btn-continuar");
      await page.waitForSelector("#pantalla-final:not([hidden])");
      const turnoVisible = await H.visible(page, "#pantalla-turno");
      v.paso('Jugar la ronda 5. Al terminar el turno de Beto, hacer click en "Ver resultado final".',
        "Se muestra la pantalla final (no empieza una ronda 6).",
        `botón: "${etiquetaFinal}" · pantalla de turno visible: ${turnoVisible}`,
        etiquetaFinal === "Ver resultado final" && !turnoVisible);

      const titulo = await H.texto(page, "#final-titulo");
      const podio = await page.$$eval(".podio-puesto", (l) => l.length);
      const filas = await page.$$eval("#tabla-final tr", (trs) =>
        trs.slice(1).map((tr) => {
          const td = [...tr.querySelectorAll("td")].map((x) => x.textContent.replace(/\s+/g, " ").trim());
          return `${td[1].split(" ").pop()}=${td[2]}`;
        }));
      v.paso("Revisar la pantalla final.",
        'Se muestra "Ganó Ana con 50 puntos", el podio y la tabla (Beto: 0 puntos).',
        `${titulo} · ${podio} puestos en el podio · tabla: ${filas.join(", ")}`,
        titulo === "Ganó Ana con 50 puntos" && podio === 2 &&
        /Ana=50/.test(filas.join(",")) && /Beto=0/.test(filas.join(",")));

      return { pasos: v.pasos, errores: page.errores };
    } finally { await ctx.close(); }
  }
},

{
  id: "TC-17", prioridad: "Media", creador: "Ramiro", us: ["US-08"], caminoFeliz: false,
  funcionalidad: "Puntuación",
  titulo: "Empate en el primer puesto",
  prerequisitos: ["Abrir la aplicación con modo debug.", "Modo Previa con 2 jugadores (Ana, Beto). Partida empezada.",
                  "Ambos aciertan siempre en el intento 1."],
  async ejecutar({ browser, base }) {
    const v = verificador();
    const { ctx, page } = await H.abrir(browser, base);
    try {
      await H.empezarPrevia(page, ["Ana", "Beto"]);
      for (let turno = 0; turno < 10; turno++) {
        await H.jugarTurno(page, { acierta: 1 });
        await page.click("#btn-continuar");
        if (turno < 9) await page.waitForSelector("#pantalla-turno:not([hidden])");
      }
      await page.waitForSelector("#pantalla-final:not([hidden])");
      const filas = await page.$$eval("#tabla-final tr", (trs) =>
        trs.slice(1).map((tr) => {
          const td = [...tr.querySelectorAll("td")].map((x) => x.textContent.replace(/\s+/g, " ").trim());
          return `${td[1].split(" ").pop()}=${td[2]}`;
        }));
      v.paso("Jugar las 5 rondas según los datos de prueba.",
        "Ana y Beto terminan con 50 puntos cada uno.", filas.join(", "),
        /Ana=50/.test(filas.join(",")) && /Beto=50/.test(filas.join(",")));

      const titulo = await H.texto(page, "#final-titulo");
      v.paso("Revisar la pantalla final.", "Ana y Beto aparecen como ganadores empatados.", titulo,
        /^Empate: ganan /.test(titulo) && /Ana/.test(titulo) && /Beto/.test(titulo) && /50 puntos/.test(titulo));

      return { pasos: v.pasos, errores: page.errores };
    } finally { await ctx.close(); }
  }
},

/* ───────────────────────── US-09 · Compartir ───────────────────────── */
{
  id: "TC-18", prioridad: "Media", creador: "Ramiro", us: ["US-09"], caminoFeliz: true,
  funcionalidad: "Compartir",
  titulo: "Compartir el resultado de la partida",
  prerequisitos: ["Dispositivo 1: Android + Chrome con WhatsApp instalado.", "Dispositivo 2: PC + Firefox."],
  /* Los pasos 1 y 2 (menú de compartir de Android y WhatsApp) requieren un
     celular Android real: no hay ninguno disponible en el entorno de pruebas.
     Se ejecutan los pasos 3 a 5, que sí corren en PC con Firefox. */
  navegador: "firefox",
  async ejecutar({ browser, base }) {
    const v = verificador();
    const { ctx, page } = await H.abrir(browser, base);
    try {
      v.paso('En el celular, hacer click en "Compartir".',
        "Se abre el menú de compartir del celular con el ganador, sus puntos y el link del juego.",
        "NO EJECUTADO — requiere un celular Android real (ningún integrante tiene uno disponible)", null);
      v.paso("Elegir WhatsApp.", "El mensaje aparece precargado con ese texto.",
        "NO EJECUTADO — requiere WhatsApp instalado en Android", null);

      await H.empezarPrevia(page, ["Ana", "Beto"]);
      for (let turno = 0; turno < 10; turno++) {
        await H.jugarTurno(page, { acierta: turno % 2 === 0 ? 1 : 2 });
        await page.click("#btn-continuar");
        if (turno < 9) await page.waitForSelector("#pantalla-turno:not([hidden])");
      }
      await page.waitForSelector("#pantalla-final:not([hidden])");

      const hayShare = await page.evaluate(() => typeof navigator.share === "function");
      await page.click("#btn-compartir");
      await page.waitForTimeout(400);
      const aviso = await page.evaluate(() => { const t = document.getElementById("toast"); return t.hidden ? "" : t.textContent.trim(); });
      v.paso('En la PC con Firefox, terminar una partida y hacer click en "Compartir".',
        'Se muestra "¡Copiado!".',
        `navigator.share disponible: ${hayShare} · aviso mostrado: "${aviso}"`,
        aviso === "¡Copiado!");

      const texto = await page.evaluate(() => window.__cancionero.textoPrevia());
      v.paso("Pegar (Ctrl+V) en un bloc de notas.", "Se pega el mismo texto del resultado.",
        texto.replace(/\n/g, " ⏎ "),
        /Cancionero/.test(texto) && /🥇/.test(texto) && /pts/.test(texto) && texto.includes(base.replace("127.0.0.1", "127.0.0.1")));

      await page.click("#btn-jugar-de-nuevo");
      await page.waitForSelector("#pantalla-turno:not([hidden])");
      const ronda = await H.texto(page, "#turno-ronda");
      const nombre = await H.texto(page, "#turno-nombre");
      const puntos = await page.evaluate(() => window.__cancionero.previa.jugadores.map((j) => `${j.nombre}=${j.puntos}`).join(","));
      v.paso('Hacer click en "Jugar de nuevo".',
        "Empieza una partida nueva con los mismos jugadores y los puntos en 0.",
        `${ronda} · Le toca a ${nombre} · ${puntos}`,
        ronda === "Ronda 1 de 5" && nombre === "Ana" && puntos === "Ana=0,Beto=0");

      return { pasos: v.pasos, errores: page.errores };
    } finally { await ctx.close(); }
  }
},

/* ───────────────────────── US-10 · Modo Diario ───────────────────────── */
{
  id: "TC-19", prioridad: "Media", creador: "Severiano", us: ["US-10", "US-09"], caminoFeliz: true,
  funcionalidad: "Modo Diario",
  titulo: "Modo Diario: misma canción y una vez por día",
  prerequisitos: ["Tener dos navegadores distintos (dos contextos aislados, como una ventana de incógnito).",
                  "Abrir la aplicación con modo debug."],
  async ejecutar({ browser, base }) {
    const v = verificador();
    const a = await H.abrir(browser, base);
    const b = await H.abrir(browser, base);
    try {
      await H.irAModo(a.page, "diaria");
      await a.page.click("#btn-empezar-diaria");
      await H.esperarRonda(a.page);
      const cancionA = await H.cancionActual(a.page);
      v.paso('En el navegador A, entrar al "Modo Diario" y anotar la canción.',
        "Se muestra la canción del día.", `${cancionA.t} — ${cancionA.a}`, !!cancionA);

      await H.irAModo(b.page, "diaria");
      await b.page.click("#btn-empezar-diaria");
      await H.esperarRonda(b.page);
      const cancionB = await H.cancionActual(b.page);
      v.paso('En el navegador B, entrar al "Modo Diario" y anotar la canción.',
        "Es la misma canción que en el navegador A.", `${cancionB.t} — ${cancionB.a}`,
        cancionA.t === cancionB.t && cancionA.a === cancionB.a);

      await a.page.click("#btn-saltar"); await a.page.waitForTimeout(80);
      await a.page.click("#btn-saltar"); await a.page.waitForTimeout(80);
      await H.responder(a.page, "correcta");
      await a.page.waitForSelector("#pantalla-resultado:not([hidden])");
      const det = await H.texto(a.page, "#veredicto-detalle");
      v.paso("En el navegador A, jugar hasta terminar la canción.", "Se muestra el resultado.",
        det, det === "Acertaste en el intento 3 — +6 puntos");

      const textoCompartido = await a.page.evaluate(() => window.__cancionero.textoDiaria());
      await a.page.click("#btn-compartir-ronda");
      await a.page.waitForTimeout(300);
      v.paso('Hacer click en "Compartir".',
        "El texto muestra cuadraditos por intento y no revela el nombre de la canción.",
        textoCompartido.replace(/\n/g, " ⏎ "),
        /[🟥🟩⬜]{6}/.test(textoCompartido) && textoCompartido.includes("3/6") &&
        !textoCompartido.includes(cancionA.t) && !textoCompartido.includes(cancionA.a));

      await a.page.click("#btn-continuar");
      await a.page.waitForSelector("#pantalla-inicio:not([hidden])");
      await H.irAModo(a.page, "diaria");
      const bloqueado = await a.page.isDisabled("#btn-empezar-diaria");
      const mensaje = await H.texto(a.page, "#diaria-estado");
      v.paso('En el navegador A, volver al inicio y entrar al "Modo Diario" otra vez.',
        "No deja jugar: muestra el resultado de hoy y cuánto falta para la próxima canción.",
        `botón deshabilitado: ${bloqueado} · "${mensaje}"`,
        bloqueado && /Ya jugaste la canción de hoy/i.test(mensaje) && /Próxima canción en/i.test(mensaje));

      return { pasos: v.pasos, errores: [...a.page.errores, ...b.page.errores] };
    } finally { await a.ctx.close(); await b.ctx.close(); }
  }
},

/* ───────────────────────── US-11 · Modo Infinito ───────────────────────── */
{
  id: "TC-20", prioridad: "Media", creador: "Franco", us: ["US-11"], caminoFeliz: true,
  funcionalidad: "Modo Infinito",
  titulo: "Modo Infinito: siguiente canción y racha",
  prerequisitos: ["Abrir la aplicación con modo debug.", "Elegir Modo Infinito sin filtros."],
  async ejecutar({ browser, base }) {
    const v = verificador();
    const { ctx, page } = await H.abrir(browser, base);
    try {
      await H.empezarInfinita(page);
      const c1 = await H.cancionActual(page);
      await H.responder(page, "correcta");
      await page.waitForSelector("#pantalla-resultado:not([hidden])");
      const r1 = await H.texto(page, "#res-racha");
      v.paso("Acertar la canción.", "Racha actual: 1.", r1, /Racha actual: 1\b/.test(r1));

      await page.click("#btn-continuar");
      await H.esperarRonda(page);
      const c2 = await H.cancionActual(page);
      await H.responder(page, "correcta");
      await page.waitForSelector("#pantalla-resultado:not([hidden])");
      const r2 = await H.texto(page, "#res-racha");
      v.paso('Hacer click en "Siguiente" y acertar.',
        "La canción es distinta a la anterior. Racha actual: 2.",
        `${c1.t} → ${c2.t} · ${r2}`, c1.t !== c2.t && /Racha actual: 2\b/.test(r2));

      await page.click("#btn-continuar");
      await H.esperarRonda(page);
      for (let i = 0; i < 6; i++) { await page.click("#btn-saltar"); await page.waitForTimeout(70); }
      await page.waitForSelector("#pantalla-resultado:not([hidden])");
      const r3 = await H.texto(page, "#res-racha");
      v.paso('Hacer click en "Siguiente" y saltar 6 veces.', "Racha actual: 0. Mejor racha: 2.",
        r3, /Racha actual: 0\b/.test(r3) && /Mejor racha: 2\b/.test(r3));

      await page.reload();
      await page.waitForFunction(() => !!window.__cancionero);
      await H.irAModo(page, "infinita");
      const mejor = await H.texto(page, "#racha-mejor");
      v.paso('Recargar la página (F5) y volver al "Modo Infinito".', "La mejor racha sigue en 2.",
        `mejor racha: ${mejor}`, mejor === "2");

      await page.click("#btn-empezar-infinita");
      await H.esperarRonda(page);
      await page.click("#btn-salir-juego");
      await page.waitForSelector("#pantalla-inicio:not([hidden])");
      const filtrosVisibles = await H.visible(page, "#filtros-infinita");
      v.paso('Hacer click en "⟵ Inicio".', "Vuelve a la pantalla inicial del Modo Infinito (filtros).",
        `pantalla de inicio con filtros visibles: ${filtrosVisibles}`, filtrosVisibles);

      return { pasos: v.pasos, errores: page.errores };
    } finally { await ctx.close(); }
  }
},

/* ───────────────────────── US-12 · Filtros ───────────────────────── */
{
  id: "TC-21", prioridad: "Media", creador: "Lucas", us: ["US-12"], caminoFeliz: true,
  funcionalidad: "Filtros",
  titulo: "Filtro combinado: género + época",
  prerequisitos: ["Abrir la aplicación con modo debug.", 'Elegir "Modo Infinito".'],
  datos: { Género: "Rock Nacional", Época: "80s (1980–1989)" },
  async ejecutar({ browser, base }) {
    const v = verificador();
    const { ctx, page } = await H.abrir(browser, base);
    try {
      await H.irAModo(page, "infinita");
      await page.selectOption("#infinita-genero", "rock");
      await page.waitForTimeout(100);
      const conteo1 = await H.texto(page, "#infinita-conteo");
      const n1 = parseInt(conteo1, 10);
      v.paso("Abrir los filtros y elegir el género.", "Se muestra la cantidad de canciones disponibles.",
        conteo1, n1 > 0);

      await page.selectOption("#infinita-decada", "80");
      await page.waitForTimeout(100);
      const conteo2 = await H.texto(page, "#infinita-conteo");
      const n2 = parseInt(conteo2, 10);
      v.paso("Agregar la época.", "La cantidad de canciones baja o se mantiene, pero nunca es 0 en este caso.",
        `${conteo1} → ${conteo2}`, n2 > 0 && n2 <= n1);

      await page.click("#btn-empezar-infinita");
      const jugadas = [];
      for (let i = 0; i < 5; i++) {
        await H.esperarRonda(page);
        jugadas.push(await H.cancionActual(page));
        for (let k = 0; k < 6; k++) { await page.click("#btn-saltar"); await page.waitForTimeout(60); }
        await page.waitForSelector("#pantalla-resultado:not([hidden])");
        if (i < 4) await page.click("#btn-continuar");
      }
      const cumplen = await page.evaluate((ts) => {
        const C = window.__cancionero.CATALOGO;
        return ts.map((t) => {
          const c = C.find((x) => x.t === t);
          return `${t} [${c.c}/${c.y}]` + (c.c === "rock" && +c.y >= 1980 && +c.y <= 1989 ? " ✓" : " ✗");
        });
      }, jugadas.map((j) => j.t));
      v.paso('Empezar y jugar 5 canciones (con "Saltar" y "Siguiente"), anotando cada una.',
        "Las 5 canciones son del género Rock Nacional y de años entre 1980 y 1989.",
        cumplen.join(" · "), cumplen.every((x) => x.endsWith("✓")));

      return { pasos: v.pasos, errores: page.errores };
    } finally { await ctx.close(); }
  }
},

{
  id: "TC-22", prioridad: "Baja", creador: "Lucas", us: ["US-12"], caminoFeliz: false,
  funcionalidad: "Filtros",
  titulo: "Combinación de filtros sin canciones",
  prerequisitos: ["Abrir la aplicación desde un navegador web (Desktop).", 'Elegir "Modo Infinito".'],
  datos: { Artista: "Soda Stereo", Época: "2020s" },
  async ejecutar({ browser, base }) {
    const v = verificador();
    const { ctx, page } = await H.abrir(browser, base);
    try {
      await H.irAModo(page, "infinita");
      await page.selectOption("#infinita-artista", "Soda Stereo");
      await page.selectOption("#infinita-decada", "2020");
      await page.waitForTimeout(120);
      const conteo = await H.texto(page, "#infinita-conteo");
      const marcado = await page.evaluate(() => document.getElementById("infinita-conteo").classList.contains("vacio"));
      v.paso("Elegir el artista y la época en los filtros.",
        'Se muestra "0 canciones" y un aviso de que no hay canciones con esos filtros.',
        `"${conteo}" (resaltado en rojo: ${marcado})`,
        /^0 canciones/.test(conteo) && /no hay canciones/i.test(conteo) && marcado);

      const deshabilitado = await page.isDisabled("#btn-empezar-infinita");
      await page.click("#btn-empezar-infinita", { force: true }).catch(() => {});
      await page.waitForTimeout(250);
      const sigueEnInicio = await H.visible(page, "#pantalla-inicio");
      v.paso("Intentar empezar.",
        "El botón para empezar está deshabilitado o se muestra el aviso y no arranca.",
        `Empezar deshabilitado: ${deshabilitado} · sigue en la pantalla de inicio: ${sigueEnInicio}`,
        deshabilitado && sigueEnInicio);

      return { pasos: v.pasos, errores: page.errores };
    } finally { await ctx.close(); }
  }
},

/* ───────────────────── RNF-01 · Usabilidad móvil ───────────────────── */
{
  id: "TC-23", prioridad: "Alta", creador: "Severiano", us: ["RNF-01"], caminoFeliz: false,
  funcionalidad: "Usabilidad móvil",
  titulo: "Uso en celular de 360 px de ancho",
  prerequisitos: ["Navegador en modo dispositivo, tamaño 360 x 740."],
  datos: { Resolución: "360 x 740" },
  async ejecutar({ browser, base }) {
    const v = verificador();
    const { ctx, page } = await H.abrir(browser, base, { viewport: { width: 360, height: 740 } });
    try {
      const medir = async (nombre) => page.evaluate((n) => ({
        pantalla: n,
        scrollW: document.documentElement.scrollWidth,
        clientW: document.documentElement.clientWidth
      }), nombre);

      const desbordes = [];
      const revisar = async (nombre) => { const r = await medir(nombre); if (r.scrollW > r.clientW + 1) desbordes.push(`${nombre} (${r.scrollW}px)`); };

      await revisar("inicio");
      await H.empezarPrevia(page, ["Ana", "Beto"]);
      await revisar("jugadores/turno");
      await page.click("#btn-listo");
      await H.esperarRonda(page);
      await revisar("juego");
      await H.responder(page, "correcta");
      await page.waitForSelector("#pantalla-resultado:not([hidden])");
      await revisar("resultado");
      await page.click("#btn-continuar");
      await page.waitForSelector("#pantalla-turno:not([hidden])");
      await page.click("#btn-ver-marcador");
      await revisar("marcador");

      v.paso("Recorrer las pantallas: inicio, jugadores, juego, resultado y marcador.",
        "En ninguna aparece scroll horizontal y nada queda cortado.",
        desbordes.length ? "desbordan: " + desbordes.join(", ") : "sin scroll horizontal en ninguna pantalla",
        desbordes.length === 0);

      await page.click("#btn-volver-marcador");
      await page.click("#btn-listo");
      await H.esperarRonda(page);
      const botones = await page.evaluate(() =>
        ["btn-play", "btn-saltar", "btn-enviar"].map((id) => {
          const r = document.getElementById(id).getBoundingClientRect();
          return { id, alto: Math.round(r.height), ancho: Math.round(r.width) };
        }));
      const chicos = botones.filter((b) => b.alto < 44 || b.ancho < 44);
      v.paso("Inspeccionar los botones principales (Play, Saltar, Enviar).",
        "Todos miden 44 px de alto o más.",
        botones.map((b) => `${b.id}: ${b.ancho}x${b.alto}`).join(" · "), chicos.length === 0);

      const fuente = await page.evaluate(() => parseFloat(getComputedStyle(document.getElementById("input")).fontSize));
      v.paso("Inspeccionar el buscador.", "El tamaño de letra es de 16 px o más.",
        `${fuente} px`, fuente >= 16);

      v.paso("En el iPhone, tocar el buscador.", "La pantalla no hace zoom automático.",
        `verificado por el criterio equivalente: el input declara ${fuente} px, que es el umbral con el que iOS evita el zoom automático (no hay un iPhone real en el entorno de pruebas)`,
        fuente >= 16);

      return { pasos: v.pasos, errores: page.errores };
    } finally { await ctx.close(); }
  }
},

/* ───────────────────── RNF-06 · Tolerancia a fallas ───────────────────── */
{
  id: "TC-24", prioridad: "Media", creador: "Franco", us: ["RNF-06"], caminoFeliz: false,
  funcionalidad: "Tolerancia a fallas",
  titulo: "Falla de conexión con la API de audio",
  prerequisitos: ["Abrir la aplicación con la consola de red disponible."],
  datos: { Red: "Online → Offline → Online" },
  async ejecutar({ browser, base }) {
    const v = verificador();
    const { ctx, page } = await H.abrir(browser, base);
    try {
      await H.empezarInfinita(page);
      const c1 = await H.cancionActual(page);
      const m = await H.medirPlay(page);
      v.paso('Entrar al "Modo Infinito" con conexión.', "Carga una canción y se puede reproducir.",
        `${c1.t} — sonó ${(m.maxCt).toFixed(2)} s`, !!c1 && m.maxCt > 0.5);

      await ctx.setOffline(true);
      await page.click("#btn-saltar"); await page.waitForTimeout(80);
      await H.responder(page, "incorrecta").catch(() => {});
      await page.evaluate(() => { document.getElementById("btn-salir-juego").click(); });
      await page.waitForSelector("#pantalla-inicio:not([hidden])");
      await page.click("#btn-empezar-infinita");
      await H.esperarRonda(page);
      const mensaje = await H.texto(page, "#estado");
      const reintentarVisible = await H.visible(page, "#btn-reintentar");
      const zonaOculta = !(await H.visible(page, "#zona-respuesta"));
      v.paso("Pasar la red a Offline y pedir una ronda nueva.",
        'Se muestra el aviso de falta de conexión y el botón "Reintentar". Los controles de juego quedan deshabilitados.',
        `"${mensaje}" · Reintentar visible: ${reintentarVisible} · controles ocultos: ${zonaOculta}`,
        /No hay conexión con la fuente de audio/i.test(mensaje) && reintentarVisible && zonaOculta);

      await ctx.setOffline(false);
      await page.click("#btn-reintentar");
      await H.esperarRonda(page);
      const c2 = await H.cancionActual(page);
      const m2 = c2 ? await H.medirPlay(page) : { maxCt: 0 };
      v.paso('Volver a "No throttling" (online) y hacer click en "Reintentar".',
        "Carga la canción y se reproduce normalmente.",
        c2 ? `${c2.t} — sonó ${(m2.maxCt).toFixed(2)} s` : "no cargó ninguna canción",
        !!c2 && m2.maxCt > 0.5);

      return { pasos: v.pasos, errores: page.errores };
    } finally { await ctx.close(); }
  }
},

/* ───────────────────── US-02 · Título de un carácter ───────────────────── */
{
  id: "TC-25", prioridad: "Baja", creador: "Severiano", us: ["US-02"], caminoFeliz: false, defecto: "DF-01",
  funcionalidad: "Buscador",
  titulo: "Buscar una canción cuyo título tiene 1 solo carácter",
  prerequisitos: ["Abrir la aplicación desde un navegador web (Desktop).", "Elegir Modo Infinito sin filtros."],
  datos: { Canción: "X — Nicky Jam & J Balvin", Texto: "X" },
  async ejecutar({ browser, base }) {
    const v = verificador();
    const { ctx, page } = await H.abrir(browser, base);
    try {
      await H.empezarInfinita(page);
      await page.fill("#input", "X");
      await page.waitForTimeout(200);
      const abierta = await H.visible(page, "#sugerencias");
      const sugs = abierta ? await page.$$eval("#sugerencias li", (l) => l.map((x) => x.textContent.trim())) : [];
      v.paso("Escribir el texto en el buscador.",
        'Aparece la sugerencia "X — Nicky Jam & J Balvin", como pasa con cualquier título del catálogo.',
        abierta ? sugs.join(" | ") : "no aparece ninguna sugerencia (ni siquiera «No hay resultados»)",
        abierta && sugs.some((s) => /^X — Nicky Jam & J Balvin/.test(s)));

      const elegible = await page.evaluate(() => {
        const ul = document.getElementById("sugerencias");
        if (ul.hidden || !ul._lista) return false;
        const i = ul._lista.findIndex((x) => x.t === "X");
        if (i < 0) return false;
        ul.querySelectorAll("li")[i].dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
        return true;
      });
      const enviarOk = elegible && !(await page.isDisabled("#btn-enviar"));
      v.paso("Hacer click en la sugerencia.",
        'La canción queda elegida y se habilita "Enviar".',
        elegible ? "elegida y Enviar habilitado" : "no hay ninguna sugerencia para elegir",
        enviarOk);

      return { pasos: v.pasos, errores: page.errores };
    } finally { await ctx.close(); }
  }
},

/* ───────────────────── RNF-02 · Rendimiento ───────────────────── */
{
  id: "TC-26", prioridad: "Media", creador: "Ramiro", us: ["RNF-02"], caminoFeliz: false,
  funcionalidad: "Rendimiento",
  titulo: "Tiempo de carga de una ronda",
  prerequisitos: ["Conexión estable, sin throttling.", "Caché desactivada."],
  datos: { Repeticiones: "10 rondas", Medición: "tiempo entre pedir la ronda y poder reproducir el audio" },
  async ejecutar({ browser, base }) {
    const v = verificador();
    const { ctx, page } = await H.abrir(browser, base, { contexto: { bypassCSP: true } });
    try {
      await page.route("**/*", (route) => route.continue());
      await H.irAModo(page, "infinita");

      const medidas = [];
      const t0 = Date.now();
      await page.click("#btn-empezar-infinita");
      await H.esperarRonda(page);
      medidas.push(Date.now() - t0);

      for (let i = 1; i < 10; i++) {
        for (let k = 0; k < 6; k++) { await page.click("#btn-saltar"); await page.waitForTimeout(50); }
        await page.waitForSelector("#pantalla-resultado:not([hidden])");
        const t = Date.now();
        await page.click("#btn-continuar");
        await H.esperarRonda(page);
        medidas.push(Date.now() - t);
      }
      v.paso('Entrar al "Modo Infinito" y pedir diez rondas seguidas.',
        "Se registra una medición por ronda, hasta completar diez.",
        `${medidas.length} mediciones (ms): ${medidas.join(", ")}`, medidas.length === 10);

      const max = Math.max(...medidas);
      const prom = Math.round(medidas.reduce((a, b) => a + b, 0) / medidas.length);
      v.paso("Leer el promedio y el máximo de las diez mediciones.",
        "El máximo es menor a 5 segundos, como pide RNF-02.",
        `máximo ${(max / 1000).toFixed(2)} s · promedio ${(prom / 1000).toFixed(2)} s`, max < 5000);

      return { pasos: v.pasos, errores: page.errores };
    } finally { await ctx.close(); }
  }
},

/* ───────────────────── RNF-07 · Integridad del catálogo ───────────────────── */
{
  id: "TC-27", prioridad: "Alta", creador: "Lucas", us: ["RNF-07"], caminoFeliz: false,
  funcionalidad: "Integridad del catálogo",
  titulo: "Origen e integridad del catálogo de canciones",
  prerequisitos: ["Abrir la aplicación con la pestaña de red disponible.",
                  "Tener a mano la cantidad de canciones documentada para la V1."],
  datos: { Archivo: "catalogo.js", "Canciones esperadas": "672 (las documentadas para la V1)" },
  async ejecutar({ browser, base, verificarAudios }) {
    const v = verificador();
    const ctxPage = await H.abrir(browser, base);
    const { ctx, page } = ctxPage;
    try {
      const pedidos = [];
      page.on("request", (r) => pedidos.push(r.url()));
      await page.reload({ waitUntil: "load" });
      await page.waitForFunction(() => !!window.__cancionero);

      const origen = new URL(base).host;
      const delCatalogo = pedidos.filter((u) => /catalogo\.js/.test(u));
      const ajenos = delCatalogo.filter((u) => new URL(u).host !== origen);
      v.paso('Recargar la página y buscar el pedido de "catalogo.js". Mirar de qué dominio se descarga.',
        "El archivo se descarga del mismo dominio de la aplicación.",
        delCatalogo.length ? delCatalogo.join(", ") : "no se pidió catalogo.js",
        delCatalogo.length === 1 && ajenos.length === 0);

      const total = await page.evaluate(() => window.__cancionero.CATALOGO.length);
      v.paso("Verificar cuántas canciones tiene el catálogo que quedó cargado.",
        "La cantidad coincide con las 672 canciones documentadas para la V1.",
        `${total} canciones`, total === 672);

      const integridad = await page.evaluate(() => {
        const C = window.__cancionero.CATALOGO, G = window.__cancionero.GENEROS;
        const vistas = new Set(); const dups = [];
        C.forEach((c) => { const k = (c.t + "|" + c.a).toLowerCase(); if (vistas.has(k)) dups.push(k); vistas.add(k); });
        return {
          dups: dups.length,
          sinAudio: C.filter((c) => !c.u).length,
          sinCaratula: C.filter((c) => !c.k).length,
          sinAnio: C.filter((c) => !c.y).length,
          generoInvalido: C.filter((c) => !G[c.c]).length
        };
      });
      const urls = await page.evaluate(() => window.__cancionero.CATALOGO.map((c) => c.u));
      const rotos = await verificarAudios(urls);
      v.paso("Revisar que no haya canciones repetidas ni canciones sin audio reproducible.",
        "Cero duplicados y cero canciones sin audio, como pide RNF-07.",
        `duplicados: ${integridad.dups} · sin URL de audio: ${integridad.sinAudio} · sin carátula: ${integridad.sinCaratula} · ` +
        `sin año: ${integridad.sinAnio} · género inválido: ${integridad.generoInvalido} · ` +
        `previews no accesibles (verificadas las ${urls.length} por HTTP): ${rotos.length}` +
        (rotos.length ? " → " + rotos.slice(0, 5).join(", ") : ""),
        integridad.dups === 0 && integridad.sinAudio === 0 && integridad.sinCaratula === 0 &&
        integridad.sinAnio === 0 && integridad.generoInvalido === 0 && rotos.length === 0);

      return { pasos: v.pasos, errores: page.errores };
    } finally { await ctx.close(); }
  }
},

/* ───────────────────── RNF-05 · Compatibilidad ───────────────────── */
{
  id: "TC-28", prioridad: "Media", creador: "Ramiro", us: ["RNF-05"], caminoFeliz: false,
  funcionalidad: "Compatibilidad",
  titulo: "Compatibilidad entre Chrome y Firefox en escritorio",
  prerequisitos: ["Tener Chrome y Firefox actualizados en la misma computadora.", "Abrir la consola en ambos."],
  dobleNavegador: true,
  async ejecutar({ browser, browserFirefox, base, versiones }) {
    const v = verificador();
    const resultados = {};
    const avisos = {};

    for (const [nombre, br] of [["Chrome", browser], ["Firefox", browserFirefox]]) {
      const { ctx, page } = await H.abrir(br, base);
      const warns = [];
      page.on("console", (m) => { if (m.type() === "warning") warns.push(m.text()); });
      try {
        await H.empezarInfinita(page);
        const m = await H.medirPlay(page);
        await page.fill("#input", "de musica");
        await page.waitForTimeout(200);
        const sugs = await page.$$eval("#sugerencias li", (l) => l.length);
        const cancion = await H.cancionActual(page);
        await H.responder(page, "correcta");
        await page.waitForSelector("#pantalla-resultado:not([hidden])");
        resultados[nombre] = {
          audio: +m.maxCt.toFixed(2),
          sugerencias: sugs,
          veredicto: await H.texto(page, "#veredicto"),
          titulo: await H.texto(page, "#res-titulo"),
          artista: await H.texto(page, "#res-artista"),
          anio: await H.texto(page, "#res-anio"),
          tamañoVeredicto: await page.evaluate(() => parseFloat(getComputedStyle(document.getElementById("veredicto")).fontSize)),
          coincideCancion: (await H.texto(page, "#res-titulo")) === cancion.t,
          errores: page.errores.slice()
        };
        avisos[nombre] = warns.slice();
      } finally { await ctx.close(); }
    }

    const c = resultados.Chrome, f = resultados.Firefox;
    v.paso('En Chrome, jugar una ronda completa del "Modo Infinito".',
      "El audio suena, el buscador sugiere y la pantalla de resultado se muestra completa. La consola no muestra errores.",
      `audio ${c.audio} s · ${c.sugerencias} sugerencias · ${c.veredicto} · ficha: ${c.titulo}/${c.artista}/${c.anio} · errores: ${c.errores.length}`,
      c.audio > 0.5 && c.sugerencias > 0 && c.veredicto === "¡Correcto!" && c.coincideCancion && c.errores.length === 0);

    v.paso("Repetir exactamente los mismos pasos en Firefox.",
      "El comportamiento es el mismo que en Chrome y la consola no muestra errores.",
      `audio ${f.audio} s · ${f.sugerencias} sugerencias · ${f.veredicto} · ficha: ${f.titulo}/${f.artista}/${f.anio} · errores: ${f.errores.length}`,
      f.audio > 0.5 && f.sugerencias > 0 && f.veredicto === "¡Correcto!" && f.coincideCancion && f.errores.length === 0);

    v.paso("Comparar la pantalla de resultado en los dos navegadores.",
      "No hay diferencias de maquetación que impidan leer el título, el artista ni el veredicto.",
      `veredicto: Chrome ${c.tamañoVeredicto} px / Firefox ${f.tamañoVeredicto} px · ` +
      `ficha completa en ambos: ${!!c.titulo && !!c.artista && !!c.anio && !!f.titulo && !!f.artista && !!f.anio}`,
      c.tamañoVeredicto >= 23 && f.tamañoVeredicto >= 23 &&
      c.tamañoVeredicto === f.tamañoVeredicto && !!f.titulo && !!f.artista && !!f.anio);

    /* Verificación específica del defecto DF-03 de la entrega anterior: al limpiar el
       elemento de audio con src = "" Firefox registraba "URI no válida. Ha fallado la
       carga del recurso de medios", dos veces por ronda. */
    const todosAvisos = [...(avisos.Chrome || []), ...(avisos.Firefox || [])];
    const uriInvalida = todosAvisos.filter((t) => /URI no válida|invalid URI|not a valid URI/i.test(t));
    v.paso("Revisar la consola de los dos navegadores buscando la advertencia del defecto DF-03.",
      'No aparece "URI no válida / Ha fallado la carga del recurso de medios" en ninguno de los dos.',
      `advertencias totales: ${todosAvisos.length} · de URI inválida (DF-03): ${uriInvalida.length}` +
      (todosAvisos.length ? ` · otras advertencias observadas: ${todosAvisos.map((t) => t.slice(0, 90)).join(" ‖ ")}` : ""),
      uriInvalida.length === 0);

    const decodificacion = todosAvisos.filter((t) => /could not be decoded|MEDIASINK/i.test(t));
    const nota = `Navegadores: ${versiones.chrome} y ${versiones.firefox}. ` +
      (decodificacion.length
        ? `Observación: Firefox emitió ${decodificacion.length} advertencia(s) "Media resource … could not be decoded / NS_ERROR_DOM_MEDIA_MEDIASINK_ERR" al cortar el fragmento. ` +
          `El audio igualmente se reprodujo (${f.audio} s medidos) y la ronda se resolvió bien. ` +
          `Se registra como DF-04, pendiente de confirmar en una instalación normal de Firefox: ` +
          `la build que distribuye Playwright puede no traer el decodificador AAC de las builds oficiales de Mozilla.`
        : "Sin advertencias de decodificación.");

    return { pasos: v.pasos, errores: [], notas: nota };
  }
}

];

module.exports = { CASOS };
