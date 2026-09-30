/* ═══════════════════════════════════════════════════════════════════════
   Cobertura de criterios de aceptación — Entrega 1

   Los 28 casos de prueba declarados en el PDF no cubren de a uno todos los
   criterios de aceptación de las 12 historias. Este script arma la matriz
   completa: para cada criterio dice qué caso lo cubre y, cuando ningún caso
   lo cubre, lo verifica acá mismo contra la aplicación real.

   Uso: node tests/cobertura-criterios.js
   ══════════════════════════════════════════════════════════════════════ */

const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright-core");
const { escuchar } = require("./server");
const H = require("./helpers");

const DECADAS_ESPERADAS = ["70s", "80s", "90s", "2000s", "2010s", "2020s"];

/* Criterios de aceptación tal como están en el PDF de historias de usuario.
   `tc`: casos declarados que lo verifican. `verificar`: comprobación propia
   para los criterios que ningún caso declarado alcanza. */
const CRITERIOS = [
  /* ── US-01 ── */
  { us: "US-01", n: 1, texto: 'Play reproduce solo el primer segundo y se detiene solo', tc: ["TC-01"] },
  { us: "US-01", n: 2, texto: 'Tras cada fallo o salto el fragmento pasa a 2, 4, 7, 11 y 16 s', tc: ["TC-02"] },
  { us: "US-01", n: 3, texto: 'Muestra "Intento X de 6" y una barra con los segundos desbloqueados', tc: ["TC-01", "TC-02"] },
  { us: "US-01", n: 4, texto: 'Repetir el fragmento no consume intentos', tc: ["TC-01"] },

  /* ── US-02 ── */
  { us: "US-02", n: 1, texto: 'Con 2+ caracteres, hasta 8 sugerencias con formato "Título — Artista"', tc: ["TC-03"] },
  { us: "US-02", n: 2, texto: 'Se puede buscar por título o por artista', tc: ["TC-03", "TC-04"] },
  { us: "US-02", n: 3, texto: 'La búsqueda no distingue mayúsculas ni tildes', tc: ["TC-04"] },
  { us: "US-02", n: 4, texto: 'Sin coincidencias se muestra "No hay resultados"', tc: ["TC-05"] },
  { us: "US-02", n: 5, texto: 'Solo se envía una canción elegida de la lista; texto libre no consume intento', tc: ["TC-05"] },

  /* ── US-03 ── */
  { us: "US-03", n: 1, texto: 'Respuesta correcta: "¡Correcto!" y termina la ronda', tc: ["TC-06"] },
  { us: "US-03", n: 2, texto: 'Incorrecta: queda en el historial, consume 1 intento y desbloquea el siguiente fragmento', tc: ["TC-02"] },
  { us: "US-03", n: 3, texto: 'Seis intentos sin acertar: la ronda termina como "No acertada"', tc: ["TC-07"] },

  /* ── US-04 ── */
  { us: "US-04", n: 1, texto: 'El botón "Saltar" indica cuántos segundos se desbloquean', tc: ["TC-08"] },
  { us: "US-04", n: 2, texto: 'Saltar consume 1 intento, queda como "Saltado" y desbloquea el siguiente fragmento', tc: ["TC-08"] },
  { us: "US-04", n: 3, texto: 'Saltar en el 6.º intento termina la ronda como "No acertada"', tc: ["TC-09"] },

  /* ── US-05 ── */
  { us: "US-05", n: 1, texto: 'Al terminar se muestran título, artista, año y carátula', tc: ["TC-10"] },
  { us: "US-05", n: 2, texto: 'Indica en qué intento acertó y cuántos puntos, o "No acertada — 0 puntos"', tc: ["TC-10", "TC-07"] },
  { us: "US-05", n: 3, texto: 'Se puede reproducir el fragmento completo (30 s)', tc: ["TC-10"] },
  { us: "US-05", n: 4, texto: 'El texto del veredicto mide 23 px o más, con alto contraste', tc: ["TC-10"],
    nota: "TC-10 mide el tamaño; el contraste se verifica acá",
    async verificar(page) {
      await H.empezarInfinita(page);
      await H.responder(page, "correcta");
      await page.waitForSelector("#pantalla-resultado:not([hidden])");
      const c = await page.evaluate(() => {
        const lum = (rgb) => {
          const [r, g, b] = rgb.match(/\d+/g).slice(0, 3).map(Number).map((v) => {
            const s = v / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
          });
          return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        };
        const el = document.getElementById("veredicto");
        const L1 = lum(getComputedStyle(el).color);
        const L2 = lum(getComputedStyle(document.body).backgroundColor.match(/\d/) ? getComputedStyle(document.body).backgroundColor : "rgb(13,15,20)");
        const hi = Math.max(L1, L2), lo = Math.min(L1, L2);
        return { ratio: +((hi + 0.05) / (lo + 0.05)).toFixed(2), px: parseFloat(getComputedStyle(el).fontSize) };
      });
      return { ok: c.ratio >= 4.5 && c.px >= 23, detalle: `contraste ${c.ratio}:1 (WCAG AA pide 4.5:1) · ${c.px} px` };
    } },
  { us: "US-05", n: 5, texto: 'Un botón lleva al siguiente turno ("Continuar") o a la siguiente canción ("Siguiente")', tc: ["TC-10", "TC-14"] },

  /* ── US-06 ── */
  { us: "US-06", n: 1, texto: 'Se pueden registrar entre 2 y 12 jugadores', tc: ["TC-12"] },
  { us: "US-06", n: 2, texto: 'Con menos de 2 "Empezar" está deshabilitado; con 12 no se agregan más', tc: ["TC-12"] },
  { us: "US-06", n: 3, texto: 'Nombre obligatorio, máximo 15 caracteres, sin repetir (sin distinguir mayúsculas)', tc: ["TC-13"] },
  { us: "US-06", n: 4, texto: 'Color y emoji distintos, que se ven en su turno y en el marcador', tc: ["TC-11", "TC-06"],
    nota: "Ningún caso declarado verifica que se vean en la pantalla de turno",
    async verificar(page) {
      await H.empezarPrevia(page, ["Ana", "Beto", "Caro"]);
      const t = await page.evaluate(() => {
        const j = window.__cancionero.previa.jugadores[0];
        return {
          esperado: { emoji: j.emoji, color: j.color },
          turnoEmoji: document.getElementById("turno-emoji").textContent.trim(),
          avatarEmoji: document.getElementById("turno-avatar").textContent.trim(),
          bordeTarjeta: document.getElementById("turno-card").style.borderColor
        };
      });
      const hex = (c) => c.replace(/\s/g, "").toLowerCase();
      const colorOk = !!t.bordeTarjeta && (hex(t.bordeTarjeta) === hex(t.esperado.color) ||
        (() => { const m = t.bordeTarjeta.match(/\d+/g); if (!m) return false;
                 const h = "#" + m.slice(0, 3).map((x) => (+x).toString(16).padStart(2, "0")).join("");
                 return h.toLowerCase() === hex(t.esperado.color); })());
      return { ok: t.turnoEmoji === t.esperado.emoji && t.avatarEmoji === t.esperado.emoji && colorOk,
               detalle: `turno muestra emoji ${t.turnoEmoji} y color ${t.bordeTarjeta} (jugador: ${t.esperado.emoji} / ${t.esperado.color})` };
    } },
  { us: "US-06", n: 5, texto: 'Antes de empezar se puede eliminar un jugador', tc: ["TC-11"] },

  /* ── US-07 ── */
  { us: "US-07", n: 1, texto: 'Antes de cada turno: "Le toca a [nombre] [emoji]" con su color y botón "¡Listo!"', tc: ["TC-14"],
    nota: "TC-14 verifica el nombre; acá se verifica el texto completo y el botón",
    async verificar(page) {
      await H.empezarPrevia(page, ["Ana", "Beto"]);
      const t = await page.evaluate(() => ({
        texto: document.querySelector(".turno-texto").textContent.replace(/\s+/g, " ").trim(),
        boton: document.getElementById("btn-listo").textContent.trim(),
        emoji: window.__cancionero.previa.jugadores[0].emoji
      }));
      return { ok: t.texto === `Le toca a Ana ${t.emoji}` && t.boton === "¡Listo!",
               detalle: `"${t.texto}" · botón "${t.boton}"` };
    } },
  { us: "US-07", n: 2, texto: 'Orden de carga; después del último vuelve al primero y avanza la ronda', tc: ["TC-14"] },
  { us: "US-07", n: 3, texto: 'Se muestra "Ronda X de 5"', tc: ["TC-14"] },
  { us: "US-07", n: 4, texto: 'Cada turno tiene una canción distinta dentro de la partida', tc: ["TC-14"],
    nota: "TC-14 juega sin filtros. Acá se verifica el caso del defecto DF-08: con un filtro " +
          "que deja menos canciones que turnos, que no se repita ninguna hasta agotar el pool y que la app avise antes",
    async verificar(page) {
      await H.irAModo(page, "previa");
      await H.agregarJugadores(page, ["Ana", "Beto"]);
      await page.selectOption("#previa-artista", "Duki");
      await page.waitForTimeout(150);
      const aviso = await H.texto(page, "#previa-conteo");
      const marcado = await page.evaluate(() => document.getElementById("previa-conteo").classList.contains("aviso"));

      await page.click("#btn-empezar-previa");
      await page.waitForSelector("#pantalla-turno:not([hidden])");
      const canciones = [];
      for (let t = 0; t < 4; t++) {
        await page.click("#btn-listo");
        await H.esperarRonda(page);
        canciones.push((await H.cancionActual(page)).t);
        await H.responder(page, "correcta");
        await page.waitForSelector("#pantalla-resultado:not([hidden])");
        await page.click("#btn-continuar");
        await page.waitForSelector("#pantalla-turno:not([hidden])");
      }
      /* El pool de Duki son 2 canciones: los turnos 1-2 y 3-4 no deben repetir dentro de cada par */
      const sinRepetirEnElPar = canciones[0] !== canciones[1] && canciones[2] !== canciones[3];
      return { ok: sinRepetirEnElPar && marcado && /se van a repetir|siempre la misma/.test(aviso),
               detalle: `aviso: "${aviso}" · turnos: ${canciones.join(" → ")}` };
    } },

  /* ── US-08 ── */
  { us: "US-08", n: 1, texto: 'Puntos: 10, 8, 6, 4, 2, 1 según el intento; 0 si no acierta', tc: ["TC-15"] },
  { us: "US-08", n: 2, texto: 'Marcador entre turnos con puntos y aciertos, de mayor a menor', tc: ["TC-15", "TC-06"] },
  { us: "US-08", n: 3, texto: 'La partida dura 5 rondas', tc: ["TC-16"] },
  { us: "US-08", n: 4, texto: 'Gana el de más puntos; si hay empate se muestran todos los empatados', tc: ["TC-16", "TC-17"] },

  /* ── US-09 ── */
  { us: "US-09", n: 1, texto: 'Al terminar se muestra un podio (1.º, 2.º y 3.º) y la tabla completa', tc: ["TC-16"],
    nota: "TC-16 juega con 2 jugadores, así que nunca llega a ver un podio de 3",
    async verificar(page) {
      await H.empezarPrevia(page, ["Ana", "Beto", "Caro", "Dani"]);
      for (let turno = 0; turno < 20; turno++) {
        await H.jugarTurno(page, { acierta: (turno % 4) + 1 });
        await page.click("#btn-continuar");
        if (turno < 19) await page.waitForSelector("#pantalla-turno:not([hidden])");
      }
      await page.waitForSelector("#pantalla-final:not([hidden])");
      const r = await page.evaluate(() => ({
        puestos: [...document.querySelectorAll(".podio-puesto")].map((p) =>
          p.querySelector(".podio-medalla").textContent.trim() + " " + p.querySelector(".podio-nombre").textContent.trim()),
        filas: document.querySelectorAll("#tabla-final tr").length - 1
      }));
      return { ok: r.puestos.length === 3 && r.filas === 4,
               detalle: `podio: ${r.puestos.join(" | ")} · tabla completa con ${r.filas} jugadores` };
    } },
  { us: "US-09", n: 2, texto: 'El botón "Compartir" abre el menú del celular con ganador, puntos y link', tc: ["TC-18"],
    nota: "TC-18 quedó BLOCKED: los pasos del menú nativo necesitan un Android real" },
  { us: "US-09", n: 3, texto: 'Si el navegador no permite compartir, se copia y se muestra "¡Copiado!"', tc: ["TC-18"],
    nota: "TC-18 lo verifica en su paso 3, pero el caso entero quedó BLOCKED por los pasos del " +
          "menú nativo de Android, así que el criterio se comprueba también acá",
    async verificar(page) {
      await H.empezarPrevia(page, ["Ana", "Beto"]);
      for (let turno = 0; turno < 10; turno++) {
        await H.jugarTurno(page, { acierta: 1 });
        await page.click("#btn-continuar");
        if (turno < 9) await page.waitForSelector("#pantalla-turno:not([hidden])");
      }
      await page.waitForSelector("#pantalla-final:not([hidden])");
      /* El criterio es condicional ("si el navegador no permite compartir"). En este Chrome
         navigator.share existe y resuelve, así que para probar la rama del respaldo hay que
         simular un navegador que no la soporta, como Firefox de escritorio. */
      const habia = await page.evaluate(() => {
        const existia = typeof navigator.share === "function";
        Object.defineProperty(navigator, "share", { value: undefined, configurable: true });
        return existia;
      });
      await page.click("#btn-compartir");
      await page.waitForTimeout(500);
      const aviso = await page.evaluate(() => {
        const t = document.getElementById("toast"); return t.hidden ? "" : t.textContent.trim();
      });
      const texto = await page.evaluate(() => window.__cancionero.textoPrevia());
      return { ok: aviso === "¡Copiado!" && /🥇/.test(texto) && /pts/.test(texto),
               detalle: `navigator.share ${habia ? "existía y se anuló para forzar el respaldo" : "no estaba"} · ` +
                        `aviso "${aviso}" · texto copiado: "${texto.split("\n")[0]} …"` };
    } },
  { us: "US-09", n: 4, texto: 'En Modo Diario el texto compartido no revela la canción', tc: ["TC-19"] },
  { us: "US-09", n: 5, texto: 'Hay botones "Jugar de nuevo" (mismos jugadores) y "Volver al inicio"', tc: ["TC-18"],
    nota: 'TC-18 verifica "Jugar de nuevo"; ningún caso verifica "Volver al inicio"',
    async verificar(page) {
      await H.empezarPrevia(page, ["Ana", "Beto"]);
      for (let turno = 0; turno < 10; turno++) {
        await H.jugarTurno(page, { acierta: 1 });
        await page.click("#btn-continuar");
        if (turno < 9) await page.waitForSelector("#pantalla-turno:not([hidden])");
      }
      await page.waitForSelector("#pantalla-final:not([hidden])");
      const etiquetas = await page.evaluate(() => ({
        deNuevo: document.getElementById("btn-jugar-de-nuevo").textContent.trim(),
        alInicio: document.getElementById("btn-volver-inicio").textContent.trim()
      }));
      await page.click("#btn-volver-inicio");
      await page.waitForSelector("#pantalla-inicio:not([hidden])");
      const enInicio = await H.visible(page, "#setup-previa");
      return { ok: etiquetas.deNuevo === "Jugar de nuevo" && etiquetas.alInicio === "Volver al inicio" && enInicio,
               detalle: `botones "${etiquetas.deNuevo}" y "${etiquetas.alInicio}"; "Volver al inicio" lleva a la pantalla de armado` };
    } },

  /* ── US-10 ── */
  { us: "US-10", n: 1, texto: 'Misma canción en la misma fecha (hora Argentina); cambia a las 00:00', tc: ["TC-19"],
    nota: "TC-19 verifica que dos dispositivos coincidan; acá se verifica el cambio de día",
    async verificar(page) {
      const r = await page.evaluate(() => {
        const C = window.__cancionero;
        const dia = (f) => { const c = C.cancionDelDia(f); return c.t + " — " + c.a; };
        const hoy = C.fechaArgentina();
        const manana = new Date(new Date(hoy + "T00:00:00Z").getTime() + 86400000).toISOString().slice(0, 10);
        const ayer = new Date(new Date(hoy + "T00:00:00Z").getTime() - 86400000).toISOString().slice(0, 10);
        /* La fecha ARG se calcula restando 3 h al UTC: a las 02:00 UTC todavía es el día anterior */
        const dosAM = C.fechaArgentina(new Date(hoy + "T02:00:00Z"));
        const seis = [0, 1, 2, 3, 4, 5].map((d) =>
          dia(new Date(new Date(hoy + "T00:00:00Z").getTime() + d * 86400000).toISOString().slice(0, 10)));
        return { hoy, ayer, manana, dosAM, dHoy: dia(hoy), dAyer: dia(ayer), dManana: dia(manana),
                 distintasEn6Dias: new Set(seis).size };
      });
      const cambia = r.dHoy !== r.dManana && r.dHoy !== r.dAyer;
      const husoOk = r.dosAM !== r.hoy;   /* 02:00 UTC = 23:00 del día anterior en Argentina */
      return { ok: cambia && husoOk && r.distintasEn6Dias >= 5,
               detalle: `${r.ayer}≠${r.hoy}≠${r.manana} · 6 días dan ${r.distintasEn6Dias} canciones distintas · ` +
                        `02:00 UTC se resuelve como ${r.dosAM} (día anterior, por UTC−3)` };
    } },
  { us: "US-10", n: 2, texto: 'Se juega una sola vez por día; si ya se jugó muestra el resultado y cuánto falta', tc: ["TC-19"] },
  { us: "US-10", n: 3, texto: 'Aplican las mismas reglas de 6 intentos y saltos', tc: ["TC-19"],
    nota: "TC-19 usa 2 saltos y acierta; acá se agotan los 6 intentos en el Modo Diario",
    async verificar(page) {
      await H.irAModo(page, "diaria");
      await page.click("#btn-empezar-diaria");
      await H.esperarRonda(page);
      const etiqueta1 = await H.texto(page, "#btn-saltar");
      for (let i = 0; i < 5; i++) { await page.click("#btn-saltar"); await page.waitForTimeout(70); }
      const ind = await H.texto(page, "#juego-intento");
      await page.click("#btn-saltar");
      await page.waitForSelector("#pantalla-resultado:not([hidden])");
      const det = await H.texto(page, "#veredicto-detalle");
      return { ok: etiqueta1 === "Saltar (+1 s)" && ind === "Intento 6 de 6" && det === "No acertada — 0 puntos",
               detalle: `botón "${etiqueta1}" · llega a "${ind}" · termina con "${det}"` };
    } },

  /* ── US-11 ── */
  { us: "US-11", n: 1, texto: 'Al terminar se ofrece "Siguiente" con otra canción distinta de la anterior', tc: ["TC-20"] },
  { us: "US-11", n: 2, texto: 'Racha actual y mejor racha, guardada en el dispositivo', tc: ["TC-20"] },
  { us: "US-11", n: 3, texto: 'Se puede salir al inicio en cualquier momento', tc: ["TC-20"] },

  /* ── US-12 ── */
  { us: "US-12", n: 1, texto: 'Filtros por género, por artista y por época (70s, 80s, 90s, 2000s, 2010s y 2020s)', tc: ["TC-21", "TC-22"],
    nota: "Ningún caso declarado verifica que estén las seis décadas ni que el filtro por artista " +
          "alcance las colaboraciones (defecto DF-07)",
    async verificar(page) {
      await H.irAModo(page, "infinita");
      const r = await page.evaluate(() => ({
        generos: [...document.querySelectorAll("#infinita-genero option")].length - 1,
        artistas: [...document.querySelectorAll("#infinita-artista option")].length - 1,
        decadas: [...document.querySelectorAll("#infinita-decada option")].slice(1).map((o) => o.textContent.trim())
      }));
      const faltan = DECADAS_ESPERADAS.filter((d) => !r.decadas.includes(d));

      /* DF-07: elegir un artista debe traer también las canciones donde colabora */
      const colab = await page.evaluate(() => {
        const C = window.__cancionero;
        const cuenta = (a) => C.CATALOGO.filter((c) => c.a === a).length;
        C.filtros.infinita.artista = "Duki";
        const conFiltro = C.CATALOGO.filter((c) => {
          const n = C.normalizar;
          return n(c.a) === n("Duki") || n(c.a).split(/\s*(?:,|&| y | feat\.?| ft\.?| con | x )\s*/i).includes(n("Duki"));
        }).map((c) => c.t + " — " + c.a);
        C.filtros.infinita.artista = "";
        return { soloExacto: cuenta("Duki"), conColaboraciones: conFiltro };
      });
      await page.selectOption("#infinita-artista", "Duki");
      await page.waitForTimeout(120);
      const conteo = await H.texto(page, "#infinita-conteo");
      const nApp = parseInt(conteo, 10);

      return { ok: faltan.length === 0 && r.generos > 0 && r.artistas > 0 &&
                   nApp === colab.conColaboraciones.length && nApp > colab.soloExacto,
               detalle: `${r.generos} géneros · ${r.artistas} artistas · épocas: ${r.decadas.join(", ")} · ` +
                        `artista "Duki": ${nApp} canciones (${colab.soloExacto} con crédito exacto + colaboraciones) → ${colab.conColaboraciones.join(", ")}` };
    } },
  { us: "US-12", n: 2, texto: 'Los filtros se combinan y se muestra cuántas canciones cumplen', tc: ["TC-21", "TC-22"] },
  { us: "US-12", n: 3, texto: 'Sin filtros se juega con todo el catálogo', tc: [],
    nota: "Ningún caso declarado lo verifica",
    async verificar(page) {
      await H.irAModo(page, "infinita");
      const r = await page.evaluate(() => ({
        conteo: document.getElementById("infinita-conteo").textContent.trim(),
        total: window.__cancionero.CATALOGO.length,
        filtros: JSON.stringify(window.__cancionero.filtros.infinita)
      }));
      return { ok: r.conteo.startsWith(String(r.total)) && r.filtros === '{"genero":"","artista":"","decada":""}',
               detalle: `sin filtros ${r.filtros} el conteo dice "${r.conteo}" sobre ${r.total} del catálogo` };
    } },
  { us: "US-12", n: 4, texto: 'Si la combinación da 0 canciones se avisa y no se puede empezar', tc: ["TC-22"] },
  { us: "US-12", n: 5, texto: 'Todas las canciones que suenan cumplen los filtros elegidos', tc: ["TC-21"] },
  { us: "US-12", n: 6, texto: 'Los filtros están en Modo Previa y Modo Infinito; el Modo Diario no tiene', tc: [],
    nota: "Ningún caso declarado lo verifica",
    async verificar(page) {
      const ver = async (modo, sel) => { await H.irAModo(page, modo); return H.visible(page, sel); };
      const previa = await ver("previa", "#filtros-previa");
      const infinita = await ver("infinita", "#filtros-infinita");
      await H.irAModo(page, "diaria");
      const diariaTieneFiltros = await page.evaluate(() =>
        !!document.querySelector("#setup-diaria select, #setup-diaria .filtros-grid"));
      return { ok: previa && infinita && !diariaTieneFiltros,
               detalle: `Previa: ${previa ? "tiene filtros" : "SIN filtros"} · Infinita: ${infinita ? "tiene filtros" : "SIN filtros"} · ` +
                        `Diaria: ${diariaTieneFiltros ? "TIENE filtros (no debería)" : "sin filtros, como pide el criterio"}` };
    } }
];

/* ═══════════════════ EJECUCIÓN ═══════════════════ */
(async () => {
  const salida = path.join(__dirname, "salida");
  const jsonSuite = path.join(salida, "resultados.json");
  const suite = fs.existsSync(jsonSuite) ? require(jsonSuite) : null;
  const estadoTC = {};
  if (suite) suite.resultados.forEach((r) => { estadoTC[r.id] = r.estado; });

  const { servidor, puerto } = await escuchar();
  const base = `http://127.0.0.1:${puerto}`;
  const browser = await chromium.launch({ channel: "chrome", headless: true });

  console.log(`Cobertura de criterios de aceptación — ${CRITERIOS.length} criterios de 12 historias`);
  console.log(`App: ${base}\n`);

  const filas = [];
  for (const c of CRITERIOS) {
    const id = `${c.us}.${c.n}`;
    let estado, detalle = "", fuente;

    if (c.verificar) {
      const { ctx, page } = await H.abrir(browser, base);
      try {
        const r = await c.verificar(page);
        estado = r.ok ? "OK" : "FALLA";
        detalle = r.detalle;
        fuente = c.tc.length ? `${c.tc.join(", ")} + verificación propia` : "verificación propia";
      } catch (e) {
        estado = "ERROR"; detalle = e.message; fuente = "verificación propia";
      } finally { await ctx.close(); }
    } else {
      const estados = c.tc.map((t) => estadoTC[t] || "SIN DATO");
      estado = estados.every((e) => e === "PASSED") ? "OK"
             : estados.includes("FAILED") ? "FALLA"
             : estados.includes("BLOCKED") ? "PARCIAL" : "SIN DATO";
      detalle = c.tc.map((t, i) => `${t}: ${estados[i]}`).join(" · ");
      fuente = c.tc.join(", ");
    }

    filas.push({ id, us: c.us, n: c.n, texto: c.texto, tc: c.tc, fuente, estado, detalle, nota: c.nota || null });
    const marca = { OK: "✅", FALLA: "❌", PARCIAL: "⚠️", ERROR: "💥", "SIN DATO": "⚪" }[estado];
    console.log(`${marca} ${id.padEnd(8)} ${c.texto.slice(0, 68).padEnd(70)} ${fuente}`);
    if (estado !== "OK") console.log(`   └─ ${detalle}`);
  }

  await browser.close();
  servidor.close();

  const cuenta = (e) => filas.filter((f) => f.estado === e).length;
  console.log(`\n═══ RESUMEN ═══`);
  console.log(`Criterios: ${filas.length} · OK ${cuenta("OK")} · PARCIAL ${cuenta("PARCIAL")} · FALLA ${cuenta("FALLA")} · ERROR ${cuenta("ERROR")}`);
  const propias = filas.filter((f) => f.fuente.includes("propia")).length;
  console.log(`Cubiertos por los 28 casos declarados: ${filas.length - filas.filter((f) => !f.tc.length).length}`);
  console.log(`Verificados acá porque ningún caso los alcanzaba: ${propias}`);

  /* ── Matriz en Markdown ── */
  let md = `# Cancionero (Grupo 7) — Entrega 1 — Cobertura de criterios de aceptación\n\n`;
  md += `Generado el ${new Date().toLocaleDateString("es-AR")}. `;
  md += `Cruza los **${filas.length} criterios de aceptación** de las 12 historias de usuario del PDF `;
  md += `contra los **28 casos de prueba** declarados.\n\n`;
  md += `Los criterios que ningún caso declarado alcanza se verifican directamente contra la aplicación `;
  md += `en \`tests/cobertura-criterios.js\`, para que ninguno quede sin comprobar.\n\n`;
  md += `## Resumen\n\n| | |\n|---|---|\n`;
  md += `| Criterios de aceptación | ${filas.length} |\n`;
  md += `| ✅ Verificados OK | ${cuenta("OK")} |\n`;
  md += `| ⚠️ Parciales | ${cuenta("PARCIAL")} |\n`;
  md += `| ❌ Con falla | ${cuenta("FALLA")} |\n`;
  md += `| Cubiertos por un caso declarado | ${filas.filter((f) => f.tc.length).length} |\n`;
  md += `| Verificados acá (ningún caso los alcanzaba) | ${filas.filter((f) => !f.tc.length).length} |\n\n`;
  md += `## Matriz\n\n| Criterio | Qué pide | Caso que lo cubre | Estado | Evidencia |\n|---|---|---|---|---|\n`;
  for (const f of filas) {
    const marca = { OK: "✅", FALLA: "❌", PARCIAL: "⚠️", ERROR: "💥", "SIN DATO": "⚪" }[f.estado];
    const limpiar = (s) => String(s).replace(/\|/g, "\\|").replace(/\n/g, " ");
    md += `| **${f.id}** | ${limpiar(f.texto)} | ${f.tc.length ? f.tc.join(", ") : "_ninguno_"} | ${marca} ${f.estado} | ${limpiar(f.detalle)} |\n`;
  }
  const conNota = filas.filter((f) => f.nota);
  if (conNota.length) {
    md += `\n## Criterios que necesitaron verificación propia\n\n`;
    md += `Son los que los 28 casos declarados no alcanzaban, o alcanzaban solo en parte.\n\n`;
    for (const f of conNota) md += `- **${f.id}** — ${f.texto}\n  - ${f.nota}\n  - Resultado: ${f.estado} — ${f.detalle}\n`;
  }
  fs.writeFileSync(path.join(salida, "cobertura-criterios.md"), md, "utf8");
  console.log(`\nMatriz: tests/salida/cobertura-criterios.md`);
  process.exit(cuenta("FALLA") + cuenta("ERROR") > 0 ? 1 : 0);
})();
