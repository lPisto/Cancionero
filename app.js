/* ═══════════════════════════════════════════════════════════════════════
   Cancionero — Versión 1
   Alcance V1: US-01 a US-12 (juego base, Modo Previa, Diaria, Infinita,
   filtros, puntuación, podio y compartir).
   Fuera de V1: castigos, prendas y modo sin alcohol (V2); poderes, ruleta
   y rendirse (V3); conservar la partida en curso al recargar (V2).
   ══════════════════════════════════════════════════════════════════════ */

/* ═══════════════════ CONSTANTES DE REGLA ═══════════════════ */
const DURACIONES      = [1, 2, 4, 7, 11, 16];   // US-01: desbloqueo progresivo
const MAX_INTENTOS    = DURACIONES.length;      // US-01/US-03: 6 intentos
const TOTAL           = DURACIONES[MAX_INTENTOS - 1];
const PREVIEW_SEG     = 30;                     // US-05: fragmento completo
const PUNTOS          = [10, 8, 6, 4, 2, 1];    // US-08: puntos por intento
const RONDAS_PREVIA   = 5;                      // US-07/US-08: 5 rondas
const MIN_JUGADORES   = 2;                      // US-06
const MAX_JUGADORES   = 12;                     // US-06
const MAX_NOMBRE      = 15;                     // US-06
const MIN_BUSQUEDA    = 2;                      // US-02: desde 2 caracteres
const MAX_SUGERENCIAS = 8;                      // US-02: hasta 8 sugerencias
const TIMEOUT_AUDIO   = 6000;
const CANDIDATAS_MAX  = 6;

const DECADAS = [                               // US-12: épocas por década
  { id: "70",   nombre: "70s",    desde: 1970, hasta: 1979 },
  { id: "80",   nombre: "80s",    desde: 1980, hasta: 1989 },
  { id: "90",   nombre: "90s",    desde: 1990, hasta: 1999 },
  { id: "2000", nombre: "2000s",  desde: 2000, hasta: 2009 },
  { id: "2010", nombre: "2010s",  desde: 2010, hasta: 2019 },
  { id: "2020", nombre: "2020s",  desde: 2020, hasta: 2029 }
];

/* ═══════════════════ UTILIDADES ═══════════════════ */
const $ = (id) => document.getElementById(id);

/* US-02: la búsqueda no distingue mayúsculas ni tildes */
const normalizar = (s) => String(s)
  .toLowerCase()
  .normalize("NFD").replace(/[̀-ͯ]/g, "")
  .replace(/\s+/g, " ")
  .trim();

const claveCancion = (c) => `${c.t}|${c.a}`;
const escapar = (s) => String(s).replace(/[&<>"]/g,
  (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}

function barajar(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* D-05: la canción del día se calcula con la fecha en hora de Argentina
   (UTC-3, sin horario de verano), así todos los dispositivos ven la misma. */
function fechaArgentina(d = new Date()) {
  return new Date(d.getTime() - 3 * 3600 * 1000).toISOString().slice(0, 10);
}

function faltaParaMañana() {
  const ahora = new Date();
  const arg = new Date(ahora.getTime() - 3 * 3600 * 1000);
  const finDia = Date.UTC(arg.getUTCFullYear(), arg.getUTCMonth(), arg.getUTCDate() + 1);
  const ms = finDia - arg.getTime();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h} h ${m} min`;
}

let toastTimer = null;
function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 2600);
}

/* D-08: en V1 solo se guardan estadísticas (racha del Infinito y resultado
   del Diario). La partida en curso no se conserva: eso es V2 (RF-21). */
const LS = {
  get(k, def) { try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch { return def; } },
  set(k, v)   { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
};
const K_INFINITA = "cancionero_v1_infinita";
const K_DIARIA   = "cancionero_v1_diaria";

/* D-09: con ?debug=1 se muestra la canción en juego (solo para pruebas) */
const DEBUG = new URLSearchParams(location.search).get("debug") === "1";

/* ═══════════════════ ESTADO ═══════════════════ */
const estado = {
  modo: "previa",
  cancion: null, preview: null, cover: null,
  intentos: [],            // { tipo: "mal" | "salto" | "bien", texto }
  terminado: false, gano: false, intentoAcierto: null, puntos: 0,
  sonando: false, cargando: false, seleccion: null
};

const previa = { jugadores: [], turno: 0, ronda: 1, activa: false, usadas: new Set() };

const infinita = { racha: 0, mejor: LS.get(K_INFINITA, { mejor: 0 }).mejor || 0, ultima: null };

const filtros = {
  previa:   { genero: "", artista: "", decada: "" },
  infinita: { genero: "", artista: "", decada: "" }
};

const audio = new Audio();
audio.preload = "auto";
let timerStop = null, rafId = null, indiceSel = -1;

/* ═══════════════════ CATÁLOGO Y FILTROS ═══════════════════ */
const ARTISTAS = [...new Set(CATALOGO.map((c) => c.a))]
  .sort((a, b) => a.localeCompare(b, "es"));

function enDecada(anio, idDecada) {
  const d = DECADAS.find((x) => x.id === idDecada);
  if (!d) return true;
  const y = parseInt(anio, 10);
  return y >= d.desde && y <= d.hasta;
}

/* En el catálogo el artista viene como el crédito completo del tema, así que las
   colaboraciones son entradas propias ("Duki" y "Duki & KHEA" son dos valores
   distintos). Comparar por igualdad dejaba afuera las colaboraciones: elegir
   "Duki" devolvía una sola canción. Se compara por participación. */
const SEPARADORES = /\s*(?:,|&| y | feat\.?| ft\.?| con | x )\s*/i;

function participa(credito, artista) {
  const c = normalizar(credito), a = normalizar(artista);
  if (c === a) return true;                       /* el crédito completo, tal cual */
  return c.split(SEPARADORES).includes(a);        /* el artista, dentro de una colaboración */
}

/* US-12: los filtros se combinan; sin filtros se juega con todo el catálogo */
function filtrar(f) {
  return CATALOGO.filter((c) =>
    (!f.genero  || c.c === f.genero) &&
    (!f.artista || participa(c.a, f.artista)) &&
    (!f.decada  || enDecada(c.y, f.decada))
  );
}

const filtrosDelModo = () => (estado.modo === "infinita" ? filtros.infinita : filtros.previa);

/* ═══════════════════ FILTROS: INTERFAZ ═══════════════════ */
function pintarFiltros(contenedorId, modo) {
  const f = filtros[modo];
  const cont = $(contenedorId);
  const gen = Object.entries(GENEROS)
    .map(([k, g]) => `<option value="${k}">${g.emoji} ${escapar(g.nombre)}</option>`).join("");
  const art = ARTISTAS.map((a) => `<option value="${escapar(a)}">${escapar(a)}</option>`).join("");
  const dec = DECADAS.map((d) => `<option value="${d.id}">${d.nombre}</option>`).join("");

  cont.innerHTML = `
    <label class="etiqueta">Filtros</label>
    <div class="filtros-grid">
      <div class="filtro-campo">
        <label for="${modo}-genero">Género</label>
        <select id="${modo}-genero"><option value="">Todos los géneros</option>${gen}</select>
      </div>
      <div class="filtro-campo">
        <label for="${modo}-artista">Artista</label>
        <select id="${modo}-artista"><option value="">Todos los artistas</option>${art}</select>
      </div>
      <div class="filtro-campo">
        <label for="${modo}-decada">Época</label>
        <select id="${modo}-decada"><option value="">Todas las épocas</option>${dec}</select>
      </div>
      <p class="conteo-filtros" id="${modo}-conteo"></p>
      <button class="btn fantasma chico" id="${modo}-limpiar">Limpiar filtros</button>
    </div>`;

  ["genero", "artista", "decada"].forEach((campo) => {
    const sel = $(`${modo}-${campo}`);
    sel.value = f[campo];
    sel.addEventListener("change", () => { f[campo] = sel.value; actualizarConteo(modo); });
  });
  $(`${modo}-limpiar`).addEventListener("click", () => {
    f.genero = f.artista = f.decada = "";
    ["genero", "artista", "decada"].forEach((c) => { $(`${modo}-${c}`).value = ""; });
    actualizarConteo(modo);
  });
  actualizarConteo(modo);
}

/* US-12 crit. 2 y 4: se muestra cuántas canciones cumplen la combinación y,
   si son 0, se avisa y no se puede empezar.
   Además se avisa cuando quedan menos canciones que turnos: en ese caso no se
   puede cumplir US-07 crit. 4 (una canción distinta por turno) y conviene que
   el jugador lo sepa antes de empezar, en vez de descubrirlo jugando. */
function actualizarConteo(modo) {
  const n = filtrar(filtros[modo]).length;
  const el = $(`${modo}-conteo`);
  if (!el) return;

  let texto, vacio = n === 0, aviso = false;
  if (n === 0) {
    texto = "0 canciones — no hay canciones con esos filtros";
  } else {
    texto = `${n} ${n === 1 ? "canción disponible" : "canciones disponibles"}`;
    if (modo === "previa") {
      const turnos = previa.jugadores.length * RONDAS_PREVIA;
      if (turnos > 0 && n < turnos) {
        aviso = true;
        texto += n === 1
          ? ` — la partida son ${turnos} turnos y hay una sola canción: va a sonar siempre la misma`
          : ` — la partida son ${turnos} turnos, así que algunas se van a repetir`;
      }
    } else if (n === 1) {
      aviso = true;
      texto += " — con una sola canción siempre va a sonar la misma";
    }
  }

  el.textContent = texto;
  el.classList.toggle("vacio", vacio);
  el.classList.toggle("aviso", aviso);
  if (modo === "infinita") $("btn-empezar-infinita").disabled = n === 0;
  else actualizarBotonEmpezarPrevia();
}

/* ═══════════════════ JUGADORES (US-06) ═══════════════════ */
const PALETA = ["#6de2a3", "#f7c948", "#ff8fa3", "#7cc4ff", "#c69cff", "#ffb072",
                "#5ad1d1", "#e8e06a", "#ff9ecb", "#8fd98f", "#b0a4ff", "#ffa6a6"];
const EMOJIS = ["🦊", "🐼", "🐸", "🦁", "🐙", "🦄", "🐧", "🐨", "🦖", "🐝", "🦩", "🐺"];

function agregarJugador(nombreCrudo) {
  const nombre = String(nombreCrudo).trim();

  if (!nombre) { toast("El nombre es obligatorio."); return false; }
  if (nombre.length > MAX_NOMBRE) { toast(`Máximo ${MAX_NOMBRE} caracteres.`); return false; }
  if (previa.jugadores.length >= MAX_JUGADORES) { toast(`Máximo ${MAX_JUGADORES} jugadores.`); return false; }
  if (previa.jugadores.some((j) => normalizar(j.nombre) === normalizar(nombre))) {
    toast("Ese nombre ya está en la lista."); return false;
  }

  const i = previa.jugadores.length;
  previa.jugadores.push({
    nombre,
    color: PALETA[i % PALETA.length],   // US-06 crit. 4: color y emoji distintos
    emoji: EMOJIS[i % EMOJIS.length],
    puntos: 0, aciertos: 0
  });
  pintarListaJugadores();
  return true;
}

function quitarJugador(i) {
  previa.jugadores.splice(i, 1);
  previa.jugadores.forEach((j, k) => { j.color = PALETA[k % PALETA.length]; j.emoji = EMOJIS[k % EMOJIS.length]; });
  pintarListaJugadores();
}

function pintarListaJugadores() {
  const ul = $("lista-jugadores");
  ul.innerHTML = previa.jugadores.map((j, i) => `
    <li style="border-left-color:${j.color}">
      <span class="avatar" style="background:${j.color}22">${j.emoji}</span>
      <span class="nombre">${escapar(j.nombre)}</span>
      <button class="btn-quitar" data-i="${i}" aria-label="Quitar a ${escapar(j.nombre)}">✕</button>
    </li>`).join("");
  ul.querySelectorAll(".btn-quitar").forEach((b) =>
    b.addEventListener("click", () => quitarJugador(+b.dataset.i)));

  $("contador-jugadores").textContent = `(${previa.jugadores.length} de ${MAX_JUGADORES})`;
  $("input-jugador").disabled = previa.jugadores.length >= MAX_JUGADORES;
  $("btn-agregar").disabled   = previa.jugadores.length >= MAX_JUGADORES;
  $("aviso-jugadores").textContent = previa.jugadores.length >= MAX_JUGADORES
    ? `Máximo ${MAX_JUGADORES} jugadores.`
    : `Mínimo ${MIN_JUGADORES} jugadores, máximo ${MAX_JUGADORES}.`;
  /* La cantidad de turnos depende de los jugadores, así que el aviso de
     "menos canciones que turnos" se recalcula cada vez que cambia la lista. */
  actualizarConteo("previa");
}

function actualizarBotonEmpezarPrevia() {
  const hayCanciones = filtrar(filtros.previa).length > 0;
  $("btn-empezar-previa").disabled =
    previa.jugadores.length < MIN_JUGADORES || !hayCanciones;
}

const jugadorActual = () => previa.jugadores[previa.turno] || null;

/* ═══════════════════ PANTALLAS ═══════════════════ */
const PANTALLAS = ["inicio", "turno", "juego", "resultado", "marcador", "final"];
function mostrar(p) {
  PANTALLAS.forEach((x) => { $("pantalla-" + x).hidden = (x !== p); });
  window.scrollTo(0, 0);
}

/* ═══════════════════ AUDIO ═══════════════════ */
/* Confirma que el preview se pueda cargar antes de dar la ronda por buena.
   Al limpiar se usa removeAttribute("src") en lugar de src = "": asignar una
   cadena vacía genera una URI inválida y ensucia la consola (defecto DF-03). */
function verificarAudio(url, ms = TIMEOUT_AUDIO) {
  return new Promise((resolve) => {
    if (navigator.onLine === false) { resolve(false); return; }
    const a = new Audio();
    a.preload = "auto";
    let listo = false;
    const fin = (ok) => {
      if (listo) return;
      listo = true;
      clearTimeout(to);
      a.removeAttribute("src");
      try { a.load(); } catch {}
      resolve(ok);
    };
    const to = setTimeout(() => fin(false), ms);
    a.addEventListener("canplaythrough", () => fin(true), { once: true });
    a.addEventListener("loadeddata",     () => fin(true), { once: true });
    a.addEventListener("error",          () => fin(false), { once: true });
    a.src = url;
    a.load();
  });
}

/* US-01 crit. 2: segundos disponibles según los intentos ya gastados */
function segundosDesbloqueados() {
  const i = Math.min(estado.intentos.length, MAX_INTENTOS - 1);
  return DURACIONES[i];
}

/* US-01 crit. 1 y 4: suena el fragmento disponible y se corta solo.
   Volver a reproducirlo no consume intentos. */
function reproducir(limiteSeg) {
  if (!estado.preview) return;
  detener();
  const limite = limiteSeg || segundosDesbloqueados();
  try { audio.currentTime = 0; } catch {}
  const p = audio.play();
  if (p && p.catch) p.catch(() => { toast("No se pudo reproducir. Tocá play de nuevo."); detener(); });
  estado.sonando = true;
  $("btn-play").classList.add("sonando");
  timerStop = setTimeout(detener, limite * 1000 + 60);

  const escala = limite > TOTAL ? PREVIEW_SEG : TOTAL;
  const tick = () => {
    if (!estado.sonando) return;
    $("barra-progreso").style.width = (Math.min(audio.currentTime, limite) / escala) * 100 + "%";
    if (audio.currentTime >= limite) { detener(); return; }
    rafId = requestAnimationFrame(tick);
  };
  rafId = requestAnimationFrame(tick);
}

function detener() {
  clearTimeout(timerStop);
  cancelAnimationFrame(rafId);
  if (!audio.paused) audio.pause();
  try { audio.currentTime = 0; } catch {}
  estado.sonando = false;
  $("btn-play").classList.remove("sonando");
  $("barra-progreso").style.width = "0%";
}

/* ═══════════════════ RONDA ═══════════════════ */
/* US-07 crit. 4 / US-11 crit. 1: cada turno trae una canción distinta */
function candidatas() {
  if (estado.modo === "diaria") return [cancionDelDia()];
  const pool = filtrar(filtrosDelModo());
  let libres = pool.filter((c) => !previa.usadas.has(claveCancion(c)));
  if (estado.modo === "infinita" && infinita.ultima) {
    const sinUltima = pool.filter((c) => claveCancion(c) !== infinita.ultima);
    libres = sinUltima.length ? sinUltima : pool;
  }
  if (!libres.length) { previa.usadas.clear(); libres = pool; }
  return barajar(libres);
}

/* US-10 crit. 1: la misma canción para todos en la misma fecha (hora ARG) */
function cancionDelDia(fecha = fechaArgentina()) {
  const orden = CATALOGO.slice().sort((a, b) => claveCancion(a).localeCompare(claveCancion(b), "es"));
  return orden[hash("cancionero-v1-" + fecha) % orden.length];
}

async function elegirJugable(lista) {
  for (let i = 0; i < Math.min(lista.length, CANDIDATAS_MAX); i++) {
    const c = lista[i];
    if (c && c.u && await verificarAudio(c.u)) return c;
  }
  return null;
}

async function nuevaRonda() {
  detener();
  Object.assign(estado, {
    cancion: null, preview: null, cover: null, intentos: [],
    terminado: false, gano: false, intentoAcierto: null, puntos: 0,
    seleccion: null, cargando: true
  });

  mostrar("juego");
  $("input").value = "";
  $("btn-clear").hidden = true;
  cerrarSugerencias();
  pintarCabeceraJuego();
  pintarIntentos();
  pintarBarra();
  $("debug-cancion").hidden = true;
  $("zona-respuesta").hidden = false;
  $("btn-reintentar").hidden = true;
  bloquear(true);
  $("estado").textContent = "Buscando canción…";

  const elegida = await elegirJugable(candidatas());

  estado.cargando = false;

  /* RNF-06: ante una falla de la fuente de audio se informa y se ofrece
     reintentar, sin que el juego quede bloqueado. */
  if (!elegida) {
    $("estado").textContent = navigator.onLine === false
      ? "No hay conexión con la fuente de audio. Revisá internet y reintentá."
      : "No se pudo cargar el audio de la canción. Probá de nuevo.";
    $("btn-reintentar").hidden = false;
    $("zona-respuesta").hidden = true;
    return;
  }

  estado.cancion = elegida;
  estado.preview = elegida.u;
  estado.cover = elegida.k;
  previa.usadas.add(claveCancion(elegida));
  if (estado.modo === "infinita") infinita.ultima = claveCancion(elegida);

  audio.src = estado.preview;
  audio.load();

  bloquear(false);
  $("estado").textContent = previa.activa
    ? `${jugadorActual().nombre}: dale play y escuchá 1 segundo`
    : "Tocá play para escuchar 1 segundo";
  actualizarSaltar();

  if (DEBUG) {
    $("debug-cancion").hidden = false;
    $("debug-cancion").textContent = `🐞 debug · ${elegida.t} — ${elegida.a} (${elegida.y})`;
  }
}

function bloquear(b) {
  $("btn-play").disabled  = b;
  $("input").disabled     = b;
  $("btn-saltar").disabled = b;
  $("btn-enviar").disabled = true;
}

/* ═══════════════════ PINTADO DEL JUEGO ═══════════════════ */
function pintarCabeceraJuego() {
  if (previa.activa) {
    const j = jugadorActual();
    $("juego-ronda").textContent = `Ronda ${previa.ronda} de ${RONDAS_PREVIA} · ${j.emoji} ${j.nombre}`;
  } else if (estado.modo === "diaria") {
    $("juego-ronda").textContent = `Diaria · ${fechaArgentina()}`;
  } else {
    $("juego-ronda").textContent = `Infinita · racha ${infinita.racha}`;
  }
  $("juego-intento").textContent =
    `Intento ${Math.min(estado.intentos.length + 1, MAX_INTENTOS)} de ${MAX_INTENTOS}`;
}

function pintarIntentos(destino = "intentos") {
  const ul = $(destino);
  let html = "";
  for (let i = 0; i < MAX_INTENTOS; i++) {
    const it = estado.intentos[i];
    if (it) {
      const marca = it.tipo === "bien" ? "✅" : it.tipo === "salto" ? "⏭️" : "❌";
      const txt = it.tipo === "salto" ? "Saltado" : escapar(it.texto);
      html += `<li class="${it.tipo}"><span class="marca">${marca}</span><span class="txt">${txt}</span></li>`;
    } else {
      const actual = i === estado.intentos.length && !estado.terminado;
      html += `<li${actual ? ' class="actual"' : ""}><span class="marca">${i + 1}</span>
               <span class="txt">${actual ? `${DURACIONES[i]} s disponibles` : "—"}</span></li>`;
    }
  }
  ul.innerHTML = html;
}

/* US-01 crit. 3: barra con los segundos desbloqueados */
function pintarBarra() {
  const seg = segundosDesbloqueados();
  $("barra-desbloqueado").textContent = `${seg} s`;
  $("barra-marcas").innerHTML = DURACIONES
    .map((d) => `<i class="${d <= seg ? "on" : ""}" style="left:${(d / TOTAL) * 100}%"></i>`).join("");
  $("barra-progreso").style.width = "0%";
}

/* US-04 crit. 1 y 3: el botón indica cuántos segundos se desbloquean */
function actualizarSaltar() {
  const i = estado.intentos.length;
  const btn = $("btn-saltar");
  if (i >= MAX_INTENTOS - 1) {
    btn.textContent = "Saltar (termina la ronda)";
  } else {
    btn.textContent = `Saltar (+${DURACIONES[i + 1] - DURACIONES[i]} s)`;
  }
}

/* ═══════════════════ BUSCADOR (US-02) ═══════════════════ */
function opcionesBusqueda(q) {
  const n = normalizar(q);
  if (n.length < MIN_BUSQUEDA) return [];

  const pool = estado.modo === "diaria" ? CATALOGO : filtrar(filtrosDelModo());
  const exactos = [], empiezan = [], contienen = [];

  for (const c of pool) {
    const t = normalizar(c.t), a = normalizar(c.a);
    if (t === n) exactos.push(c);
    else if (t.startsWith(n) || a.startsWith(n)) empiezan.push(c);
    else if (t.includes(n) || a.includes(n)) contienen.push(c);
    if (exactos.length + empiezan.length >= MAX_SUGERENCIAS * 3) break;
  }
  return [...exactos, ...empiezan, ...contienen].slice(0, MAX_SUGERENCIAS);
}

function pintarSugerencias(q) {
  const ul = $("sugerencias");
  const n = normalizar(q);

  if (n.length < MIN_BUSQUEDA) { cerrarSugerencias(); return; }

  const lista = opcionesBusqueda(q);
  indiceSel = -1;

  if (!lista.length) {
    /* US-02 crit. 4 */
    ul.innerHTML = `<li class="vacio">No hay resultados</li>`;
    ul.hidden = false;
    return;
  }
  /* US-02 crit. 1: hasta 8 sugerencias con formato "Título — Artista" */
  ul.innerHTML = lista.map((c, i) =>
    `<li role="option" data-i="${i}">${escapar(c.t)} — ${escapar(c.a)}</li>`).join("");
  ul.hidden = false;
  ul.querySelectorAll("li").forEach((li) =>
    li.addEventListener("mousedown", (e) => { e.preventDefault(); elegir(lista[+li.dataset.i]); }));
  ul._lista = lista;
}

function cerrarSugerencias() {
  const ul = $("sugerencias");
  ul.hidden = true;
  ul.innerHTML = "";
  ul._lista = null;
  indiceSel = -1;
}

/* US-02 crit. 5 / D-07: solo se puede enviar una canción elegida de la lista */
function elegir(c) {
  if (!c) return;
  estado.seleccion = c;
  $("input").value = `${c.t} — ${c.a}`;
  $("btn-clear").hidden = false;
  cerrarSugerencias();
  $("btn-enviar").disabled = false;
}

function moverSel(delta) {
  const ul = $("sugerencias");
  if (ul.hidden || !ul._lista) return;
  const items = ul.querySelectorAll("li[data-i]");
  if (!items.length) return;
  indiceSel = (indiceSel + delta + items.length) % items.length;
  items.forEach((li, i) => li.classList.toggle("sel", i === indiceSel));
  items[indiceSel].scrollIntoView({ block: "nearest" });
}

/* ═══════════════════ INTENTOS (US-03, US-04) ═══════════════════ */
function enviar() {
  if (estado.terminado || !estado.seleccion || !estado.cancion) return;

  const elegida = estado.seleccion;
  const acierto = claveCancion(elegida) === claveCancion(estado.cancion);
  const texto = `${elegida.t} — ${elegida.a}`;

  estado.intentos.push({ tipo: acierto ? "bien" : "mal", texto });
  estado.seleccion = null;
  $("input").value = "";
  $("btn-clear").hidden = true;
  $("btn-enviar").disabled = true;
  cerrarSugerencias();

  if (acierto) { terminarRonda(true); return; }

  if (estado.intentos.length >= MAX_INTENTOS) { terminarRonda(false); return; }
  siguienteIntento("Incorrecto. Se desbloquearon más segundos.");
}

function saltar() {
  if (estado.terminado || !estado.cancion) return;
  estado.intentos.push({ tipo: "salto", texto: "Saltado" });
  estado.seleccion = null;
  $("input").value = "";
  $("btn-clear").hidden = true;
  $("btn-enviar").disabled = true;
  cerrarSugerencias();

  if (estado.intentos.length >= MAX_INTENTOS) { terminarRonda(false); return; }
  siguienteIntento("Intento saltado. Se desbloquearon más segundos.");
}

function siguienteIntento(msg) {
  detener();
  pintarCabeceraJuego();
  pintarIntentos();
  pintarBarra();
  actualizarSaltar();
  $("estado").textContent = msg;
}

/* ═══════════════════ FIN DE RONDA ═══════════════════ */
function terminarRonda(gano) {
  detener();
  estado.terminado = true;
  estado.gano = gano;
  estado.intentoAcierto = gano ? estado.intentos.length : null;
  /* US-08 crit. 1: 10, 8, 6, 4, 2, 1 puntos según el intento; 0 si no acierta */
  estado.puntos = gano ? PUNTOS[estado.intentoAcierto - 1] : 0;

  if (previa.activa) {
    const j = jugadorActual();
    j.puntos += estado.puntos;
    if (gano) j.aciertos += 1;
  }

  if (estado.modo === "infinita") {
    /* US-11 crit. 2: racha actual y mejor racha guardada en el dispositivo */
    infinita.racha = gano ? infinita.racha + 1 : 0;
    if (infinita.racha > infinita.mejor) {
      infinita.mejor = infinita.racha;
      LS.set(K_INFINITA, { mejor: infinita.mejor });
    }
  }

  if (estado.modo === "diaria") {
    LS.set(K_DIARIA, {
      fecha: fechaArgentina(),
      gano,
      intentoAcierto: estado.intentoAcierto,
      intentos: estado.intentos.map((i) => i.tipo)
    });
  }

  mostrarResultado();
}

/* US-05: pantalla de resultado de la ronda */
function mostrarResultado() {
  const c = estado.cancion;

  $("veredicto").textContent = estado.gano ? "¡Correcto!" : "No acertada";
  $("veredicto").classList.toggle("mal", !estado.gano);
  $("veredicto-detalle").textContent = estado.gano
    ? `Acertaste en el intento ${estado.intentoAcierto} — +${estado.puntos} puntos`
    : "No acertada — 0 puntos";

  $("res-caratula").src = c.k || "";
  $("res-caratula").alt = `Carátula de ${c.t}`;
  $("res-titulo").textContent  = c.t;
  $("res-artista").textContent = c.a;
  $("res-anio").textContent    = c.y;

  pintarIntentos("res-intentos");

  const racha = $("res-racha");
  if (estado.modo === "infinita") {
    racha.hidden = false;
    racha.textContent = `Racha actual: ${infinita.racha} · Mejor racha: ${infinita.mejor}`;
  } else {
    racha.hidden = true;
  }

  const btn = $("btn-continuar");
  if (previa.activa) {
    const ultimoTurno = previa.turno >= previa.jugadores.length - 1;
    const ultimaRonda = previa.ronda >= RONDAS_PREVIA;
    btn.textContent = (ultimoTurno && ultimaRonda) ? "Ver resultado final" : "Continuar";
    $("btn-compartir-ronda").hidden = true;
  } else if (estado.modo === "infinita") {
    btn.textContent = "Siguiente";
    $("btn-compartir-ronda").hidden = true;
  } else {
    btn.textContent = "Volver al inicio";
    $("btn-compartir-ronda").hidden = false;   /* US-09 crit. 4 */
  }

  mostrar("resultado");
}

/* ═══════════════════ TURNOS (US-07) ═══════════════════ */
function mostrarTurno() {
  const j = jugadorActual();
  $("turno-ronda").textContent = `Ronda ${previa.ronda} de ${RONDAS_PREVIA}`;
  $("turno-nombre").textContent = j.nombre;
  $("turno-emoji").textContent = j.emoji;
  $("turno-avatar").textContent = j.emoji;
  $("turno-avatar").style.background = j.color + "22";
  $("turno-card").style.borderColor = j.color;
  mostrar("turno");
}

function avanzarTurno() {
  previa.turno += 1;
  if (previa.turno >= previa.jugadores.length) {
    previa.turno = 0;
    previa.ronda += 1;
  }
  if (previa.ronda > RONDAS_PREVIA) { mostrarFinal(); return; }
  mostrarTurno();
}

/* US-08 crit. 2: marcador con puntos y aciertos, de mayor a menor */
function ordenados() {
  return previa.jugadores.slice().sort((a, b) => b.puntos - a.puntos || b.aciertos - a.aciertos);
}

function filaJugador(j, pos, ganador) {
  return `<tr class="${ganador ? "ganador" : ""}">
    <td>${pos}</td>
    <td><span class="cel-jugador"><span class="avatar" style="background:${j.color}22">${j.emoji}</span>
        ${escapar(j.nombre)}</span></td>
    <td class="num">${j.puntos}</td>
    <td class="num">${j.aciertos}</td></tr>`;
}

function pintarMarcador() {
  $("marcador-ronda").textContent = `Ronda ${Math.min(previa.ronda, RONDAS_PREVIA)} de ${RONDAS_PREVIA}`;
  $("tabla-marcador").innerHTML =
    `<tr><th>#</th><th>Jugador</th><th>Puntos</th><th>Aciertos</th></tr>` +
    ordenados().map((j, i) => filaJugador(j, i + 1, false)).join("");
  mostrar("marcador");
}

/* ═══════════════════ FINAL Y PODIO (US-08, US-09) ═══════════════════ */
function mostrarFinal() {
  const tabla = ordenados();
  const maximo = tabla.length ? tabla[0].puntos : 0;
  const ganadores = tabla.filter((j) => j.puntos === maximo);

  /* US-08 crit. 4 / D-06: si hay empate se muestran todos los empatados */
  $("final-titulo").textContent = ganadores.length > 1
    ? `Empate: ganan ${ganadores.map((j) => j.nombre).join(" y ")} con ${maximo} puntos`
    : `Ganó ${ganadores[0].nombre} con ${maximo} puntos`;

  const medallas = ["🥇", "🥈", "🥉"];
  $("podio").innerHTML = tabla.slice(0, 3).map((j, i) => `
    <div class="podio-puesto p${i + 1}" style="border-top:3px solid ${j.color}">
      <span class="podio-medalla">${medallas[i]}</span>
      <span class="avatar" style="background:${j.color}22">${j.emoji}</span>
      <span class="podio-nombre">${escapar(j.nombre)}</span>
      <span class="podio-puntos">${j.puntos}</span>
    </div>`).join("");

  $("tabla-final").innerHTML =
    `<tr><th>#</th><th>Jugador</th><th>Puntos</th><th>Aciertos</th></tr>` +
    tabla.map((j, i) => filaJugador(j, i + 1, j.puntos === maximo)).join("");

  previa.activa = false;
  mostrar("final");
}

/* ═══════════════════ COMPARTIR (US-09) ═══════════════════ */
const URL_JUEGO = location.origin + location.pathname;

function textoPrevia() {
  const tabla = ordenados();
  const medallas = ["🥇", "🥈", "🥉"];
  const lineas = tabla.map((j, i) => `${medallas[i] || `${i + 1}.`} ${j.nombre} — ${j.puntos} pts`);
  return `Cancionero 🍻 Modo Previa — ${RONDAS_PREVIA} rondas\n${lineas.join("\n")}\n${URL_JUEGO}`;
}

/* US-09 crit. 4: en el Modo Diario el texto no revela la canción */
function textoDiaria() {
  const cuadros = [];
  for (let i = 0; i < MAX_INTENTOS; i++) {
    const it = estado.intentos[i];
    cuadros.push(!it ? "⬜" : it.tipo === "bien" ? "🟩" : "🟥");
  }
  const marcador = estado.gano ? `${estado.intentoAcierto}/${MAX_INTENTOS}` : `✖/${MAX_INTENTOS}`;
  return `Cancionero 🎵 Diaria ${fechaArgentina()}\n${cuadros.join("")} ${marcador}\n${URL_JUEGO}`;
}

async function compartir(texto) {
  if (navigator.share) {
    try { await navigator.share({ text: texto }); return; }
    catch (e) { if (e && e.name === "AbortError") return; }
  }
  /* US-09 crit. 3: si el navegador no permite compartir, se copia */
  try {
    await navigator.clipboard.writeText(texto);
    toast("¡Copiado!");
  } catch {
    const ta = document.createElement("textarea");
    ta.value = texto;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); toast("¡Copiado!"); }
    catch { toast("No se pudo compartir."); }
    document.body.removeChild(ta);
  }
}

/* ═══════════════════ MODO DIARIO (US-10) ═══════════════════ */
function pintarEstadoDiaria() {
  const guardado = LS.get(K_DIARIA, null);
  const cont = $("diaria-estado");
  const yaJugo = guardado && guardado.fecha === fechaArgentina();

  if (yaJugo) {
    /* US-10 crit. 2: una sola vez por día en el dispositivo */
    const cuadros = [];
    for (let i = 0; i < MAX_INTENTOS; i++) {
      const t = guardado.intentos[i];
      cuadros.push(!t ? "⬜" : t === "bien" ? "🟩" : "🟥");
    }
    const detalle = guardado.gano
      ? `La acertaste en el intento ${guardado.intentoAcierto}.`
      : "Esta vez no la acertaste.";
    cont.innerHTML = `
      <div class="turno-card">
        <p class="veredicto-detalle">${cuadros.join("")}</p>
        <p class="mini">${detalle}<br>Ya jugaste la canción de hoy (${escapar(guardado.fecha)}).<br>
        Próxima canción en <b>${faltaParaMañana()}</b>.</p>
      </div>`;
    $("btn-empezar-diaria").disabled = true;
    $("btn-empezar-diaria").textContent = "Ya jugaste la de hoy";
  } else {
    cont.innerHTML = "";
    $("btn-empezar-diaria").disabled = false;
    $("btn-empezar-diaria").textContent = "Jugar la del día";
  }
}

/* ═══════════════════ NAVEGACIÓN ═══════════════════ */
function irAlInicio() {
  detener();
  previa.activa = false;
  previa.usadas.clear();
  $("racha-actual").textContent = infinita.racha;
  $("racha-mejor").textContent = infinita.mejor;
  pintarEstadoDiaria();
  mostrar("inicio");
}

function cambiarModo(modo) {
  estado.modo = modo;
  document.querySelectorAll("#seg-modo .seg-btn")
    .forEach((b) => b.classList.toggle("activo", b.dataset.modo === modo));
  $("setup-previa").hidden   = modo !== "previa";
  $("setup-diaria").hidden   = modo !== "diaria";
  $("setup-infinita").hidden = modo !== "infinita";
  if (modo === "diaria") pintarEstadoDiaria();
  if (modo === "infinita") {
    $("racha-actual").textContent = infinita.racha;
    $("racha-mejor").textContent = infinita.mejor;
  }
}

function empezarPrevia(mismosJugadores) {
  if (previa.jugadores.length < MIN_JUGADORES) return;
  if (!filtrar(filtros.previa).length) { toast("No hay canciones con esos filtros."); return; }
  previa.jugadores.forEach((j) => { j.puntos = 0; j.aciertos = 0; });
  previa.turno = 0;
  previa.ronda = 1;
  previa.activa = true;
  previa.usadas.clear();
  infinita.ultima = null;
  estado.modo = "previa";
  if (!mismosJugadores) { /* mismo comportamiento: los jugadores ya están cargados */ }
  mostrarTurno();
}

/* ═══════════════════ EVENTOS ═══════════════════ */
function conectarEventos() {
  /* Modo */
  document.querySelectorAll("#seg-modo .seg-btn").forEach((b) =>
    b.addEventListener("click", () => cambiarModo(b.dataset.modo)));

  /* Jugadores */
  const altaJugador = () => {
    if (agregarJugador($("input-jugador").value)) $("input-jugador").value = "";
    $("input-jugador").focus();
  };
  $("btn-agregar").addEventListener("click", altaJugador);
  $("input-jugador").addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); altaJugador(); }
  });

  /* Empezar */
  $("btn-empezar-previa").addEventListener("click", () => empezarPrevia());
  $("btn-empezar-infinita").addEventListener("click", () => {
    estado.modo = "infinita";
    previa.activa = false;
    previa.usadas.clear();
    infinita.racha = 0;
    infinita.ultima = null;
    nuevaRonda();
  });
  $("btn-empezar-diaria").addEventListener("click", () => {
    estado.modo = "diaria";
    previa.activa = false;
    nuevaRonda();
  });

  /* Turno */
  $("btn-listo").addEventListener("click", () => nuevaRonda());
  $("btn-ver-marcador").addEventListener("click", pintarMarcador);
  $("btn-volver-marcador").addEventListener("click", mostrarTurno);
  $("btn-salir-previa").addEventListener("click", irAlInicio);
  $("btn-salir-juego").addEventListener("click", irAlInicio);

  /* Juego */
  $("btn-play").addEventListener("click", () => reproducir());
  $("btn-reintentar").addEventListener("click", () => nuevaRonda());
  $("btn-saltar").addEventListener("click", saltar);
  $("btn-enviar").addEventListener("click", enviar);

  const input = $("input");
  input.addEventListener("input", () => {
    estado.seleccion = null;
    $("btn-enviar").disabled = true;              /* US-02 crit. 5 */
    $("btn-clear").hidden = !input.value;
    pintarSugerencias(input.value);
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); moverSel(1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); moverSel(-1); }
    else if (e.key === "Escape") { cerrarSugerencias(); }
    else if (e.key === "Enter") {
      e.preventDefault();
      const ul = $("sugerencias");
      if (!ul.hidden && ul._lista && indiceSel >= 0) elegir(ul._lista[indiceSel]);
      else if (estado.seleccion) enviar();
      /* con texto libre no pasa nada: no se consume ningún intento */
    }
  });
  /* El cierre se difiere para que un click sobre una sugerencia llegue a registrarse,
     pero no debe cerrar la lista si mientras tanto el buscador recuperó el foco. */
  input.addEventListener("blur", () => setTimeout(() => {
    if (document.activeElement !== input) cerrarSugerencias();
  }, 120));
  $("btn-clear").addEventListener("click", () => {
    input.value = "";
    estado.seleccion = null;
    $("btn-enviar").disabled = true;
    $("btn-clear").hidden = true;
    cerrarSugerencias();
    input.focus();
  });

  /* Resultado */
  $("btn-play-completo").addEventListener("click", () => reproducir(PREVIEW_SEG));
  $("btn-compartir-ronda").addEventListener("click", () => compartir(textoDiaria()));
  $("btn-continuar").addEventListener("click", () => {
    detener();
    if (previa.activa) avanzarTurno();
    else if (estado.modo === "infinita") nuevaRonda();
    else irAlInicio();
  });

  /* Final */
  $("btn-compartir").addEventListener("click", () => compartir(textoPrevia()));
  $("btn-jugar-de-nuevo").addEventListener("click", () => empezarPrevia(true));
  $("btn-volver-inicio").addEventListener("click", irAlInicio);

  /* Ayuda */
  $("btn-ayuda").addEventListener("click", () => { $("modal-ayuda").hidden = false; });
  $("btn-cerrar-ayuda").addEventListener("click", () => { $("modal-ayuda").hidden = true; });
  $("modal-ayuda").addEventListener("click", (e) => {
    if (e.target === $("modal-ayuda")) $("modal-ayuda").hidden = true;
  });

  /* RNF-06: reaccionar a la caída y vuelta de la conexión */
  window.addEventListener("offline", () => toast("Te quedaste sin conexión."));
}

/* ═══════════════════ ARRANQUE ═══════════════════ */
function iniciar() {
  pintarFiltros("filtros-previa", "previa");
  pintarFiltros("filtros-infinita", "infinita");
  pintarListaJugadores();
  conectarEventos();
  cambiarModo("previa");
  irAlInicio();

  $("pie-catalogo").textContent =
    `${CATALOGO.length} canciones · ${Object.keys(GENEROS).length} géneros · Cancionero V1`;
  if (DEBUG) $("version").textContent = "V1 · debug";

  /* Expuesto solo para la ejecución automatizada de casos de prueba */
  window.__cancionero = { estado, previa, infinita, filtros, audio, DURACIONES, PUNTOS, CATALOGO, GENEROS,
                          cancionDelDia, fechaArgentina, opcionesBusqueda, normalizar,
                          textoPrevia, textoDiaria };
}

document.addEventListener("DOMContentLoaded", iniciar);
