/* Cancionero — el juego de la previa
   Fragmentos de 30 s obtenidos de la API pública de búsqueda de iTunes. */

const DURACIONES = [1, 2, 4, 7, 11, 16];
const MAX_INTENTOS = DURACIONES.length;
const TOTAL = DURACIONES[DURACIONES.length - 1];

/* Tragos base (se multiplican por la intensidad) */
const CASTIGO = {
  error: 1,          // cada respuesta errada
  salto: 1,          // cada salto
  perder: 3,         // no la sacó en 6 intentos
  reparto: [3, 2, 1] // reparte según el intento en el que acertó (1º, 2º, 3º)
};

const INTENSIDADES = {
  1: { nombre: "Suave",   desc: "Sorbos cortos. Para arrancar tranqui.", mult: 1 },
  2: { nombre: "Picante", desc: "El doble de tragos y prendas más jugadas.", mult: 2 },
  3: { nombre: "Fatal",   desc: "Triple castigo y prendas sin filtro. Bajo tu responsabilidad.", mult: 3 }
};

/* ─────────── PODERES ───────────
   "activo"  = lo usa el jugador tocando la carta en su mano
   "pasivo"  = salta solo cuando corresponde (y se consume ahí) */
const PODERES = {
  robo:   { emoji: "🖐️", nombre: "Robo",          tipo: "activo",
            desc: "En cualquier momento de la ronda, otro se queda con la canción." },
  cambio: { emoji: "🔄", nombre: "Cambio",        tipo: "activo",
            desc: "Descartás esta canción y viene otra, sin castigo." },
  pista:  { emoji: "🔍", nombre: "Pista",         tipo: "activo",
            desc: "Te revela el año y el género del tema." },
  tiempo: { emoji: "⏱️", nombre: "+3 segundos",   tipo: "activo",
            desc: "Desbloqueás 3 segundos más de audio sin pagar el trago." },
  doble:  { emoji: "🎯", nombre: "Doble o nada",  tipo: "activo",
            desc: "Si acertás repartís el doble. Si no la sacás, tomás el doble." },
  dedo:   { emoji: "👉", nombre: "Dedo acusador", tipo: "activo",
            desc: "Otro contesta por vos: si acierta te salvás, si erra toma él." },
  espejo: { emoji: "🪞", nombre: "Espejo",        tipo: "pasivo",
            desc: "El trago que te repartan se lo devolvés AL DOBLE a quien te lo mandó." },
  escudo: { emoji: "🛡️", nombre: "Escudo",        tipo: "pasivo",
            desc: "Te salva del fondo blanco cuando no sacás la canción." }
};

const CLAVES_PODERES = Object.keys(PODERES);
const PODERES_INICIALES = 0;   // se arranca con la mano vacía: todo sale de la ruleta
const MANO_MAXIMA = 5;
const CHANCE_RULETA = 0.65;   // probabilidad de que la ruleta te dé algo

const poderAlAzar = () => CLAVES_PODERES[Math.floor(Math.random() * CLAVES_PODERES.length)];

const $ = (id) => document.getElementById(id);

/* ───────────────────── Estado ───────────────────── */
const estado = {
  modo: "previa",
  categoria: "previa",
  cancion: null,
  preview: null,
  cover: null,
  intentos: [],
  seleccion: null,
  terminado: false,
  gano: false,
  sonando: false,
  robo: false,
  ladron: null,
  online: null,
  // poderes activos en la ronda
  dobleONada: false,
  tiempoExtra: 0,
  dedoDe: null,       // jugador señalado con el dedo acusador
  online2: null
};

/* Estado de la previa (multijugador) */
const previa = {
  activa: false,
  jugadores: [],        // [{nombre, tragos, aciertos, rondas}]
  turno: 0,
  ronda: 1,
  intensidad: 1,
  sinAlcohol: false,
  reloj: false,
  repartoPendiente: 0,
  ruletaPara: null
};

const audio = new Audio();
audio.preload = "auto";
audio.crossOrigin = "anonymous";

let timerStop = null, rafId = null, indiceSel = -1;
let proximaCancion = null;   // precarga de la siguiente ronda

/* ───────────────────── Utilidades ───────────────────── */
const normalizar = (s) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " y ")
    .replace(/[^a-z0-9ñ ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const clave = (c) => `${c.t}|${c.a}`;

const hoy = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const mult = () => (previa.activa ? INTENSIDADES[previa.intensidad].mult : 1);
const unidad = (n) => (previa.sinAlcohol
  ? `${n} ${n === 1 ? "punto" : "puntos"} de castigo`
  : `${n} ${n === 1 ? "trago" : "tragos"}`);

function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => (t.hidden = true), 2400);
}

const barajar = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

const escapar = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* ───────────────────── Persistencia ───────────────────── */
const LS = {
  get(k, def) { try { const v = localStorage.getItem("cancionero:" + k); return v ? JSON.parse(v) : def; } catch { return def; } },
  set(k, v) { try { localStorage.setItem("cancionero:" + k, JSON.stringify(v)); } catch {} }
};

const statsPorDefecto = () => ({ jugadas: 0, ganadas: 0, racha: 0, mejorRacha: 0, dist: [0, 0, 0, 0, 0, 0] });
let stats = LS.get("stats", statsPorDefecto());

const opciones = Object.assign(
  { volumen: 80, estricto: false, sonido: true, vibrar: true },
  LS.get("opciones", {})
);
audio.volume = opciones.volumen / 100;

/* ───────────────────── Pool de canciones ─────────────────────
   CATALOGO viene de catalogo.js: temas verificados contra iTunes,
   con género real, preview y carátula ya resueltos. */
function pool(categoria) {
  if (categoria === "todas") return CATALOGO;
  if (categoria === "previa") return CATALOGO.filter((c) => c.p === 1);
  return CATALOGO.filter((c) => c.c === categoria);
}

/* Categorías del selector: la previa primero, después los géneros reales */
function categorias() {
  const cats = {
    previa: { nombre: "Previa (temas arriba)", emoji: "🍻" },
    todas:  { nombre: "Todas", emoji: "🎧" }
  };
  Object.entries(GENEROS).forEach(([k, v]) => {
    if (pool(k).length >= 8) cats[k] = v;   // solo géneros con material suficiente
  });
  return cats;
}

/* Temas ya jugados en esta sesión: no se repiten hasta agotar la lista */
let yaJugadas = new Set();

function candidatas() {
  const lista = pool(estado.categoria);
  if (estado.modo === "diaria") {
    const semilla = hash(hoy() + "|" + estado.categoria);
    return lista.map((_, i) => lista[(semilla + i * 7919) % lista.length]);
  }
  const frescas = lista.filter((c) => !yaJugadas.has(clave(c)));
  // si ya sonaron todas, se limpia y arranca otra vuelta
  if (frescas.length < 3) { yaJugadas = new Set(); return barajar(lista); }
  return barajar(frescas);
}

/* ═══════════════════ CONEXIÓN CON iTUNES ═══════════════════ */
const API = "https://itunes.apple.com/search";
const cacheMem = new Map();
const cacheDisco = LS.get("cachePreviews", {});

function guardarCacheDisco() {
  const claves = Object.keys(cacheDisco);
  if (claves.length > 400) claves.slice(0, claves.length - 400).forEach((k) => delete cacheDisco[k]);
  LS.set("cachePreviews", cacheDisco);
}

const urlBusqueda = (termino, limite = 15) =>
  `${API}?media=music&entity=song&limit=${limite}&country=AR&term=${encodeURIComponent(termino)}`;

function jsonp(url, ms = 9000) {
  return new Promise((resolve, reject) => {
    const cb = "__cb" + Math.random().toString(36).slice(2);
    const s = document.createElement("script");
    const limpiar = () => { try { delete window[cb]; } catch {} s.remove(); clearTimeout(to); };
    const to = setTimeout(() => { limpiar(); reject(new Error("timeout")); }, ms);
    window[cb] = (data) => { limpiar(); resolve(data); };
    s.onerror = () => { limpiar(); reject(new Error("script error")); };
    s.src = url + "&callback=" + cb;
    document.body.appendChild(s);
  });
}

async function fetchConTimeout(url, ms = 9000) {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctrl.signal, mode: "cors" });
    if (!r.ok) throw new Error("HTTP " + r.status);
    return await r.json();
  } finally { clearTimeout(to); }
}

/* Intenta fetch (CORS); si falla, cae a JSONP; y reintenta una vez más. */
async function buscarItunes(termino) {
  const url = urlBusqueda(termino);
  const estrategias = [
    () => fetchConTimeout(url),
    () => jsonp(url),
    () => fetchConTimeout(url, 12000)
  ];
  let ultimoError = null;
  for (const intentar of estrategias) {
    try {
      const data = await intentar();
      if (data && Array.isArray(data.results)) { marcarConexion(true); return data; }
      ultimoError = new Error("respuesta inesperada");
    } catch (e) { ultimoError = e; }
  }
  marcarConexion(false);
  throw ultimoError || new Error("sin respuesta");
}

function puntuar(r, cancion) {
  const rt = normalizar(r.trackName || "");
  const ra = normalizar(r.artistName || "");
  const tN = normalizar(cancion.t), aN = normalizar(cancion.a);
  let p = 0;
  if (rt === tN) p += 5;
  else if (rt.startsWith(tN) || tN.startsWith(rt)) p += 4;
  else if (rt.includes(tN) || tN.includes(rt)) p += 3;
  if (ra === aN) p += 4;
  else if (ra.includes(aN) || aN.includes(ra)) p += 2;
  if (/\b(live|en vivo|vivo|karaoke|tribute|homenaje|instrumental|cover|remaster|remastered)\b/.test(rt + " " + ra)) p -= 4;
  return p;
}

/* Fallback: solo se usa si el preview guardado en el catálogo dejó de responder.
   El catálogo ya trae la URL verificada, así que normalmente no se llama. */
async function resolverPreview(cancion) {
  const k = clave(cancion);
  if (cacheMem.has(k)) return cacheMem.get(k);
  if (cacheDisco[k]) { cacheMem.set(k, cacheDisco[k]); return cacheDisco[k]; }

  const terminos = [`${cancion.a} ${cancion.t}`, cancion.t];
  let mejor = null, mejorPuntaje = -1;

  for (const term of terminos) {
    let data;
    try { data = await buscarItunes(term); } catch { continue; }
    for (const r of data.results || []) {
      if (!r.previewUrl) continue;
      const p = puntuar(r, cancion);
      if (p > mejorPuntaje) { mejorPuntaje = p; mejor = r; }
    }
    if (mejorPuntaje >= 7) break;   // match muy bueno: no hace falta seguir buscando
  }

  if (!mejor || mejorPuntaje < 5) { cacheMem.set(k, null); return null; }

  const info = {
    preview: mejor.previewUrl,
    cover: (mejor.artworkUrl100 || "").replace("100x100", "300x300")
  };
  cacheMem.set(k, info);
  cacheDisco[k] = info;
  guardarCacheDisco();
  return info;
}

/* Confirma que el mp3 se puede cargar de verdad antes de dar la ronda por buena */
function verificarAudio(url, ms = 8000) {
  return new Promise((resolve) => {
    const a = new Audio();
    a.preload = "auto";
    a.crossOrigin = "anonymous";
    const fin = (ok) => { clearTimeout(to); a.src = ""; resolve(ok); };
    const to = setTimeout(() => fin(false), ms);
    a.addEventListener("canplaythrough", () => fin(true), { once: true });
    a.addEventListener("loadeddata", () => fin(true), { once: true });
    a.addEventListener("error", () => fin(false), { once: true });
    a.src = url;
    a.load();
  });
}

function marcarConexion(ok) {
  estado.online = ok;
  const el = $("conexion");
  if (!el) return;
  el.classList.toggle("ok", ok);
  el.classList.toggle("mal", !ok);
  el.querySelector("b").textContent = ok ? "en línea" : "sin señal";
}

async function diagnostico() {
  $("diag-texto").textContent = "Probando…";
  const t0 = performance.now();
  try {
    const data = await buscarItunes("Los Palmeras Bombon Asesino");
    const ms = Math.round(performance.now() - t0);
    const conPreview = (data.results || []).filter((r) => r.previewUrl).length;
    $("diag-texto").textContent =
      `✅ iTunes responde en ${ms} ms · ${data.results.length} resultados (${conPreview} con audio) · ${Object.keys(cacheDisco).length} temas cacheados.`;
  } catch (e) {
    $("diag-texto").textContent =
      `❌ No se pudo conectar con iTunes (${e.message}). Revisá la conexión, o si hay un bloqueador/DNS filtrando itunes.apple.com.`;
  }
}

/* ═══════════════════ RONDA ═══════════════════ */
/* El catálogo ya trae preview y carátula verificados. Solo confirmamos que el
   audio siga vivo; si se cayó, se re-resuelve contra la API antes de descartarlo. */
async function buscarCancionJugable(lista, limite = 8) {
  for (let i = 0; i < Math.min(lista.length, limite); i++) {
    const c = lista[i];

    if (c.u && (await verificarAudio(c.u))) {
      return { cancion: c, preview: c.u, cover: c.k };
    }

    let info = null;
    try { info = await resolverPreview(c); } catch { info = null; }
    if (info && (await verificarAudio(info.preview))) {
      return { cancion: c, ...info };
    }
    cacheMem.set(clave(c), null);
  }
  return null;
}

async function precargarProxima() {
  if (estado.modo === "diaria") return;
  try {
    proximaCancion = await buscarCancionJugable(candidatas(), 4);
    if (proximaCancion) yaJugadas.add(clave(proximaCancion.cancion));
  } catch { proximaCancion = null; }
}

async function nuevaRonda(restaurar, sinRuleta) {
  detener();
  Object.assign(estado, {
    terminado: false, gano: false, intentos: [], cancion: null,
    preview: null, cover: null, robo: false, ladron: null, seleccion: null,
    dobleONada: false, tiempoExtra: 0, dedoDe: null
  });
  previa.repartoPendiente = 0;

  $("resultado").hidden = true;
  $("cartelon").textContent = "";
  $("cartelon").className = "cartelon";
  $("zona-respuesta").hidden = false;
  $("btn-reintentar").hidden = true;
  $("input").value = "";
  $("btn-clear").hidden = true;
  cerrarSugerencias();
  pintarIntentos();
  pintarBarra();
  pintarTurno();
  pintarMano();
  pintarHint();
  bloquear(true);
  actualizarBotonRobo();
  $("estado").textContent = "Buscando canción…";

  let elegida = null;
  if (proximaCancion && estado.modo !== "diaria") { elegida = proximaCancion; proximaCancion = null; }
  if (!elegida) elegida = await buscarCancionJugable(candidatas());

  if (!elegida) {
    $("estado").textContent = estado.online === false
      ? "No hay conexión con iTunes. Revisá internet y reintentá."
      : "No se pudo cargar el audio. Probá de nuevo.";
    $("btn-reintentar").hidden = false;
    return;
  }

  estado.cancion = elegida.cancion;
  estado.preview = elegida.preview;
  estado.cover = elegida.cover;
  yaJugadas.add(clave(elegida.cancion));
  audio.src = estado.preview;
  audio.load();

  bloquear(false);
  actualizarBotonRobo();
  arrancarReloj();
  $("estado").textContent = previa.activa
    ? `${jugadorActual().nombre}: dale play y escuchá 1 segundo`
    : "Tocá play para escuchar 1 segundo";
  actualizarSaltar();
  pintarMano();

  if (restaurar && restaurar.intentos) {
    estado.intentos = restaurar.intentos;
    pintarIntentos(); pintarBarra();
    if (restaurar.terminado) { estado.terminado = true; estado.gano = restaurar.gano; mostrarResultado(false); }
  }
  precargarProxima();
}

function bloquear(b) {
  $("btn-play").disabled = b;
  $("input").disabled = b;
  $("btn-saltar").disabled = b;
  $("btn-enviar").disabled = true;
}

function segundosDesbloqueados() {
  const i = Math.min(estado.intentos.length, MAX_INTENTOS - 1);
  if (estado.terminado) return TOTAL;
  return Math.min(TOTAL, DURACIONES[i] + estado.tiempoExtra);
}

/* ───────────────────── Audio ───────────────────── */
function reproducir() {
  if (!estado.preview) return;
  detener();
  const limite = segundosDesbloqueados();
  audio.currentTime = 0;
  const p = audio.play();
  if (p && p.catch) p.catch(() => { toast("No se pudo reproducir. Tocá play de nuevo."); detener(); });
  estado.sonando = true;
  $("btn-play").classList.add("sonando");
  timerStop = setTimeout(detener, limite * 1000 + 80);
  const tick = () => {
    if (!estado.sonando) return;
    $("barra-progreso").style.width = (Math.min(audio.currentTime, limite) / TOTAL) * 100 + "%";
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

/* ───────────────────── Pintado ───────────────────── */
function pintarIntentos() {
  const ul = $("intentos");
  ul.innerHTML = "";
  for (let i = 0; i < MAX_INTENTOS; i++) {
    const li = document.createElement("li");
    const it = estado.intentos[i];
    if (it) {
      li.className = it.tipo;
      const ic = it.tipo === "bien" ? "✅" : it.tipo === "salto" ? "⏭️" : "❌";
      li.innerHTML = `<span class="marca">${ic}</span><span class="txt"></span>`;
      li.querySelector(".txt").textContent = it.texto;
    } else if (i === estado.intentos.length && !estado.terminado) {
      li.className = "actual";
      li.innerHTML = `<span class="txt">Intento ${i + 1} · ${DURACIONES[i]}s</span>`;
    }
    ul.appendChild(li);
  }
}

function pintarBarra() {
  $("barra-desbloqueada").style.width = (segundosDesbloqueados() / TOTAL) * 100 + "%";
  $("tiempo-max").textContent = mmss(TOTAL);
  const marcas = $("marcas");
  marcas.innerHTML = "";
  DURACIONES.forEach((d) => {
    const i = document.createElement("i");
    i.style.left = (d / TOTAL) * 100 + "%";
    marcas.appendChild(i);
  });
}

function pintarTurno() {
  const t = $("turno");
  if (!previa.activa) { t.hidden = true; $("mano").hidden = true; $("tira").hidden = true; return; }
  t.hidden = false;
  const j = jugadorActual();
  $("turno-nombre").textContent = j.nombre;
  const av = $("turno-avatar");
  av.style.setProperty("--color", j.color || "#6de2a3");
  av.textContent = j.emoji || "🎵";
  t.style.setProperty("--color", j.color || "#6de2a3");
  pintarTira();
}

function pintarHint() {
  const h = $("castigo-hint");
  if (!previa.activa || estado.terminado) { h.hidden = true; return; }
  const i = estado.intentos.length;
  const premio = CASTIGO.reparto[i] ? ` · si acertás ahora repartís ${unidad(CASTIGO.reparto[i] * multRonda())}` : "";
  h.textContent = `${estado.dobleONada ? "🎯 " : ""}Errar o saltar cuesta ${unidad(CASTIGO.error * multRonda())}${premio}`;
  h.hidden = false;
}

function actualizarSaltar() {
  const i = estado.intentos.length;
  const btn = $("btn-saltar");
  const ultimo = i >= MAX_INTENTOS - 1;
  btn.disabled = ultimo || !estado.cancion || estado.terminado;
  if (ultimo) btn.textContent = "Sin saltos";
  else if (previa.activa) btn.textContent = `Saltar +${DURACIONES[i + 1] - DURACIONES[i]}s (${unidad(CASTIGO.salto * multRonda())})`;
  else btn.textContent = `Saltar (+${DURACIONES[i + 1] - DURACIONES[i]}s)`;

  // rendirse: disponible siempre, desde el primer segundo
  const r = $("btn-rendirse");
  if (r) r.hidden = estado.terminado || !estado.cancion;
}

/* Bajar los brazos: cuenta como ronda perdida, con castigo y prenda.
   El escudo, si lo tenés, te tapa igual. */
function rendirse() {
  if (estado.terminado || !estado.cancion) return;
  estado.intentos.push({ tipo: "salto", texto: "Se rindió 🏳️" });
  terminar(false);
}

/* ───────────────────── Autocompletado ───────────────────── */
function opcionesBusqueda(q) {
  const nq = normalizar(q);
  if (!nq) return [];
  const res = [];
  for (const c of pool(estado.categoria)) {
    const nt = normalizar(c.t), na = normalizar(c.a);
    let p = -1;
    if (nt.startsWith(nq)) p = 0;
    else if (na.startsWith(nq)) p = 1;
    else if (nt.includes(nq)) p = 2;
    else if (na.includes(nq)) p = 3;
    if (p >= 0) res.push({ c, p });
  }
  res.sort((a, b) => a.p - b.p || a.c.t.localeCompare(b.c.t));
  return res.slice(0, 40).map((x) => x.c);
}

function pintarSugerencias(q) {
  const ul = $("sugerencias");
  const items = opcionesBusqueda(q);
  indiceSel = -1;
  if (!items.length) { cerrarSugerencias(); return; }
  ul.innerHTML = "";
  items.forEach((c, i) => {
    const li = document.createElement("li");
    li.textContent = c.t;
    const s = document.createElement("small");
    s.textContent = c.a;
    li.appendChild(s);
    li.dataset.i = i;
    li.addEventListener("mousedown", (e) => { e.preventDefault(); elegir(c); });
    ul.appendChild(li);
  });
  ul._items = items;
  ul.hidden = false;
}

function cerrarSugerencias() {
  const ul = $("sugerencias");
  ul.hidden = true; ul.innerHTML = ""; ul._items = null; indiceSel = -1;
}

function elegir(c) {
  estado.seleccion = c;
  $("input").value = `${c.t} — ${c.a}`;
  $("btn-clear").hidden = false;
  cerrarSugerencias();
  $("btn-enviar").disabled = false;
}

function moverSel(delta) {
  const ul = $("sugerencias");
  if (ul.hidden || !ul._items) return;
  const n = ul.children.length;
  indiceSel = (indiceSel + delta + n) % n;
  [...ul.children].forEach((li, i) => li.classList.toggle("sel", i === indiceSel));
  ul.children[indiceSel].scrollIntoView({ block: "nearest" });
}

/* ───────────────────── Jugadores ───────────────────── */
const jugadorActual = () => previa.jugadores[previa.turno] || { nombre: "—", tragos: 0, aciertos: 0, rondas: 0, poderes: [] };

function agregarJugador(nombre) {
  nombre = (nombre || "").trim();
  if (!nombre) return;
  if (previa.jugadores.some((j) => j.nombre.toLowerCase() === nombre.toLowerCase())) { toast("Ese nombre ya está"); return; }
  if (previa.jugadores.length >= 12) { toast("Máximo 12 jugadores"); return; }
  const j = { nombre, tragos: 0, aciertos: 0, rondas: 0, poderes: [] };
  previa.jugadores.push(j);
  asignarIdentidad(j, previa.jugadores.length - 1);
  pintarListaJugadores();
  guardarPrevia();
}

function pintarListaJugadores() {
  const ul = $("lista-jugadores");
  ul.innerHTML = "";
  previa.jugadores.forEach((j, i) => {
    const li = document.createElement("li");
    const av = avatarDe(j);
    av.title = "Tocá para cambiar el emoji";
    av.addEventListener("click", () => {
      const usados = previa.jugadores.filter((x) => x !== j).map((x) => x.emoji);
      const libres = EMOJIS.filter((e) => !usados.includes(e));
      const pos = libres.indexOf(j.emoji);
      j.emoji = libres[(pos + 1) % libres.length];
      pintarListaJugadores();
      guardarPrevia();
    });
    const sp = document.createElement("span");
    sp.textContent = j.nombre;
    const b = document.createElement("button");
    b.textContent = "✕";
    b.setAttribute("aria-label", "Quitar " + j.nombre);
    b.addEventListener("click", () => { previa.jugadores.splice(i, 1); pintarListaJugadores(); guardarPrevia(); });
    li.append(av, sp, b);
    ul.appendChild(li);
  });
  $("aviso-jugadores").textContent = previa.jugadores.length < 2
    ? "Mínimo 2 jugadores."
    : `${previa.jugadores.length} jugadores listos.`;
  $("btn-empezar").disabled = previa.jugadores.length < 2;
}

function pintarMarcador() {
  const orden = previa.jugadores.slice().sort((a, b) => b.aciertos - a.aciertos || a.tragos - b.tragos);
  const cab = previa.sinAlcohol ? "Castigo" : "Tragos";
  $("tabla-marcador").innerHTML =
    `<div class="tr th"><span>#</span><span>Jugador</span><span>Aciertos</span><span>${cab}</span></div>` +
    orden.map((j, i) =>
      `<div class="tr"><span>${i + 1}</span><span>${j.emoji || "🎵"} ${escapar(j.nombre)}</span><span>${j.aciertos}/${j.rondas}</span><span>${j.tragos}</span></div>`
    ).join("");
}

function sumarTragos(jugador, n) { jugador.tragos += n; guardarPrevia(); pintarTira(); }

/* ───────────────────── Jugadas ───────────────────── */
function enviar() {
  if (estado.terminado || !estado.cancion) return;
  let elegida = estado.seleccion;
  const texto = $("input").value.trim();

  if (!elegida) {
    const nq = normalizar(texto);
    if (!nq) { toast("Escribí una canción"); return; }
    elegida = pool(estado.categoria).find((c) => normalizar(c.t) === nq) || null;
    if (!elegida && !opciones.estricto) {
      const cand = opcionesBusqueda(texto);
      if (cand.length === 1) elegida = cand[0];
    }
    if (!elegida) { toast("Elegí una opción de la lista"); return; }
  }

  const ok = normalizar(elegida.t) === normalizar(estado.cancion.t) &&
             normalizar(elegida.a) === normalizar(estado.cancion.a);

  if (ok) {
    estado.intentos.push({ tipo: "bien", texto: `${elegida.t} — ${elegida.a}` });
    terminar(true);
  } else {
    estado.intentos.push({ tipo: "mal", texto: `${elegida.t} — ${elegida.a}` });
    if (previa.activa) sumarTragos(jugadorActual(), CASTIGO.error * multRonda());
    siguienteIntento();
  }
}

function saltar() {
  if (estado.terminado || !estado.cancion) return;
  estado.intentos.push({ tipo: "salto", texto: "Salteado" });
  if (previa.activa) sumarTragos(jugadorActual(), CASTIGO.salto * multRonda());
  siguienteIntento();
}

function siguienteIntento() {
  detener();
  $("input").value = "";
  $("btn-clear").hidden = true;
  estado.seleccion = null;
  $("btn-enviar").disabled = true;
  cerrarSugerencias();

  if (estado.intentos.length >= MAX_INTENTOS) { terminar(false); return; }

  pintarIntentos(); pintarBarra(); pintarHint(); actualizarSaltar(); actualizarBotonRobo();
  const ultimo = estado.intentos[estado.intentos.length - 1];
  const castigo = previa.activa ? ` · ${jugadorActual().nombre} toma ${unidad(CASTIGO.error * mult())}` : "";
  $("estado").textContent = `${ultimo.tipo === "salto" ? "Salteada" : "Nop"}${castigo} · ahora escuchás ${segundosDesbloqueados()}s`;
  guardarDiaria();
  reproducir();
  arrancarReloj();
}

function terminar(gano) {
  pararReloj();
  estado.terminado = true;
  estado.gano = gano;
  detener();
  pintarIntentos(); pintarBarra(); pintarHint(); actualizarBotonRobo();
  mostrarResultado(true);
  guardarDiaria();
}

const emojisResultado = () =>
  estado.intentos.map((i) => (i.tipo === "bien" ? "🟩" : i.tipo === "salto" ? "⬜" : "🟥")).join("") +
  "⬛".repeat(Math.max(0, MAX_INTENTOS - estado.intentos.length));

/* ───────────────────── Resultado ───────────────────── */
function mostrarResultado(contar) {
  const c = estado.cancion;
  $("zona-respuesta").hidden = true;
  $("resultado").hidden = false;
  $("res-cover").src = estado.cover || "";
  $("res-titulo").textContent = c.t;
  $("res-artista").textContent = c.y ? `${c.a} · ${c.y}` : c.a;

  const v = $("res-veredicto");
  if (estado.robo) {
    v.textContent = `¡${estado.ladron.nombre} se la robó!`;
    v.className = "res-veredicto ok";
  } else if (estado.dedoDe) {
    v.textContent = `${estado.dedoDe.nombre} contestó por ${jugadorActual().nombre} y zafaron 👉`;
    v.className = "res-veredicto ok";
  } else if (estado.gano) {
    v.textContent = `¡La sacaste en ${estado.intentos.length} ${estado.intentos.length === 1 ? "intento" : "intentos"}!`;
    v.className = "res-veredicto ok";
  } else {
    v.textContent = "No salió. La canción era:";
    v.className = "res-veredicto no";
  }
  $("res-emojis").textContent = emojisResultado();

  $("castigo").hidden = true;
  $("prenda").hidden = true;
  $("reparto").hidden = true;
  $("btn-compartir").hidden = previa.activa;
  $("btn-siguiente").hidden = false;
  $("btn-siguiente").disabled = false;
  $("btn-siguiente").textContent = previa.activa ? "Siguiente jugador ▸" : "Otra canción ▸";
  $("btn-rendirse").hidden = true;
  $("res-nota").textContent = "";
  $("btn-play").disabled = false;
  $("estado").textContent = "Ahora podés escuchar el fragmento completo";

  if (previa.activa) { resolverPreviaRonda(); return; }

  if (estado.gano) {
    cartelon(`¡La sacaste en ${estado.intentos.length}!`, null, "ok");
    sonar("ok"); vibrar([28, 55, 28]); confeti();
  } else {
    cartelon("No salió", null, "mal");
    sonar("mal"); vibrar(200);
  }

  if (estado.modo === "diaria") {
    $("btn-siguiente").hidden = true;
    $("res-nota").textContent = "Volvé mañana por la canción del día 🎶";
    if (contar) registrarStats();
  }
}

function resolverPreviaRonda() {
  const j = jugadorActual();
  j.rondas++;

  const colorDe = (x) => [x.color || "#6de2a3"];

  if (estado.robo) {
    estado.ladron.aciertos++;
    cartelon(`${estado.ladron.emoji || ""} ${estado.ladron.nombre} se la robó`,
             `${j.nombre} toma ${unidad(CASTIGO.perder * multRonda())}`, "ok");
    sonar("ok"); vibrar([28, 55, 28]); confeti(colorDe(estado.ladron));
    sumarTragos(j, CASTIGO.perder * multRonda());
    $("castigo").hidden = false;
    $("castigo-titulo").textContent =
      `${j.nombre} toma ${unidad(CASTIGO.perder * multRonda())}. ${estado.ladron.nombre} reparte ${unidad(multRonda())}.`;
    previa.repartoPendiente = multRonda();
    pintarReparto();
    $("btn-siguiente").disabled = true;
  } else if (estado.gano) {
    const heroe = estado.dedoDe || j;
    if (estado.dedoDe) { estado.dedoDe.aciertos++; }
    else j.aciertos++;
    previa.ruletaPara = heroe;   // la sacó: se ganó un giro
    cartelon(
      estado.dedoDe ? `${heroe.emoji || ""} ${heroe.nombre} salvó a ${j.nombre}`
                    : `¡${j.emoji || ""} ${j.nombre} la sacó!`,
      estado.dedoDe ? "Nadie toma" : null, "ok");
    sonar("ok"); vibrar([28, 55, 28]); confeti(colorDe(heroe));
    const premio = CASTIGO.reparto[estado.intentos.length - 1];
    if (premio) {
      previa.repartoPendiente = premio * multRonda();
      pintarReparto();
      $("btn-siguiente").disabled = true;
    } else {
      $("castigo").hidden = false;
      $("castigo-titulo").textContent = "Zafaste sobre la hora. Nadie toma… esta vez.";
    }
  } else if (tienePoder(j, "escudo")) {
    quitarPoder(j, "escudo");
    cartelon(`🛡️ ${j.nombre} zafó`, "El escudo le tapó el fondo blanco", "ok");
    sonar("neutro"); vibrar(60);
    $("castigo").hidden = false;
    $("castigo-titulo").textContent = `🛡️ El escudo salvó a ${j.nombre}: no toma nada y se libra de la prenda.`;
  } else {
    const n = CASTIGO.perder * multRonda();
    sumarTragos(j, n);
    cartelon(`${j.emoji || ""} ${j.nombre} toma ${n}`, "Y le toca una prenda 🫡", "mal");
    sonar("mal"); vibrar([90, 60, 90, 60, 180]);
    $("castigo").hidden = false;
    $("castigo-titulo").textContent =
      `${j.nombre} toma ${unidad(n)}${estado.dobleONada ? " (doble o nada 🎯)" : ""} + prenda 🫡`;
    nuevaPrenda();
  }
  guardarPrevia();
}

function nuevaPrenda() {
  const nivel = previa.intensidad;
  const opts = PRENDAS.filter((p) => (nivel === 1 ? p.n === 1 : p.n <= nivel));
  const p = opts[Math.floor(Math.random() * opts.length)];
  $("prenda").hidden = false;
  $("prenda-texto").textContent = p.t;
}

function pintarReparto() {
  const cont = $("reparto");
  cont.hidden = false;
  const quien = estado.robo ? estado.ladron : jugadorActual();
  const n = previa.repartoPendiente;
  $("reparto-titulo").textContent = previa.sinAlcohol
    ? `${quien.nombre} reparte ${n} de castigo. Tocá a quién:`
    : `${quien.nombre} reparte ${n} ${n === 1 ? "trago" : "tragos"}. Tocá a quién:`;
  const chips = $("chips-reparto");
  chips.innerHTML = "";
  previa.jugadores.forEach((j) => {
    if (j === quien) return;
    const b = document.createElement("button");
    b.className = "chip";
    b.style.setProperty("--color", j.color || "#6de2a3");
    b.append(avatarDe(j, "chico"), document.createTextNode(j.nombre));
    b.addEventListener("click", () => {
      if (previa.repartoPendiente <= 0) return;

      if (tienePoder(j, "espejo")) {
        preguntarEspejo(j, quien, cont);
        return;
      }

      sumarTragos(j, 1);
      previa.repartoPendiente--;
      if (previa.repartoPendiente <= 0) {
        cont.hidden = true;
        $("btn-siguiente").disabled = false;
        toast("¡Salud! 🍻");
      } else pintarReparto();
    });
    chips.appendChild(b);
  });
}

/* ═══════════════════ IDENTIDAD DE JUGADOR ═══════════════════ */
const PALETA = ["#6de2a3","#f7c948","#ff8fa3","#7cc4ff","#c69cff",
                "#ffb26b","#5ee0d0","#ff7b6b","#a3e635","#f472b6","#60a5fa","#fbbf24"];
const EMOJIS = ["🦊","🐼","🐸","🦁","🐙","🦄","🐧","🐨","🦖","🐝","🦩","🐺",
                "🍺","🎸","👽","🤠","🥑","🌵","⚡","🔥","💀","🎩","🍕","🚀"];

function asignarIdentidad(j, i) {
  const usadosColor = previa.jugadores.filter((x) => x !== j).map((x) => x.color);
  const usadosEmoji = previa.jugadores.filter((x) => x !== j).map((x) => x.emoji);
  j.color = j.color || PALETA.find((c) => !usadosColor.includes(c)) || PALETA[i % PALETA.length];
  j.emoji = j.emoji || EMOJIS.find((e) => !usadosEmoji.includes(e)) || EMOJIS[i % EMOJIS.length];
}

/* Les pone identidad a los que vengan de una partida vieja sin color */
function normalizarJugadores() {
  previa.jugadores.forEach((j, i) => {
    j.poderes = j.poderes || [];
    asignarIdentidad(j, i);
  });
}

function avatarDe(j, clase) {
  const el = document.createElement("span");
  el.className = "avatar" + (clase ? " " + clase : "");
  el.style.setProperty("--color", j.color || "#6de2a3");
  el.textContent = j.emoji || "🎵";
  return el;
}

/* Tira de marcador siempre visible */
function pintarTira() {
  const t = $("tira");
  if (!previa.activa) { t.hidden = true; return; }
  t.hidden = false;
  t.innerHTML = "";
  previa.jugadores.forEach((j) => {
    const it = document.createElement("div");
    it.className = "tira-item" + (j === jugadorActual() ? " turno-actual" : "");
    it.style.setProperty("--color", j.color || "#6de2a3");
    const n = document.createElement("span");
    n.className = "tira-nombre";
    n.textContent = j.nombre;
    const g = document.createElement("span");
    g.className = "tira-tragos";
    g.textContent = j.tragos;
    it.append(avatarDe(j, "chico"), n, g);
    t.appendChild(it);
  });
  t.onclick = () => abrirModal("modal-marcador");
}

/* ═══════════════════ CONTRARRELOJ ═══════════════════ */
const SEGUNDOS_RONDA = 20;
let relojInt = null;

function pararReloj() {
  clearInterval(relojInt);
  relojInt = null;
  const r = $("reloj");
  r.hidden = true;
  r.className = "reloj";
}

function arrancarReloj() {
  pararReloj();
  if (!previa.activa || !previa.reloj || estado.terminado || !estado.cancion) return;
  let quedan = SEGUNDOS_RONDA;
  const r = $("reloj");
  r.hidden = false;
  r.className = "reloj corriendo";
  $("reloj-num").textContent = quedan;

  relojInt = setInterval(() => {
    quedan--;
    $("reloj-num").textContent = Math.max(0, quedan);
    if (quedan <= 5) r.className = "reloj urgente";
    if (quedan <= 0) {
      pararReloj();
      if (estado.terminado) return;
      toast("⏱️ Se acabó el tiempo");
      sonar("mal"); vibrar(160);
      saltar();
    }
  }, 1000);
}

/* ═══════════════════ MOMENTO FIESTA ═══════════════════ */
let audioCtx = null;

function sonar(tipo) {
  if (!opciones.sonido) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const notas = tipo === "ok" ? [523, 659, 784] : tipo === "mal" ? [330, 262, 196] : [440, 440];
    notas.forEach((f, i) => {
      const osc = audioCtx.createOscillator();
      const gan = audioCtx.createGain();
      osc.type = "triangle";
      osc.frequency.value = f;
      const t0 = audioCtx.currentTime + i * 0.11;
      gan.gain.setValueAtTime(0.0001, t0);
      gan.gain.exponentialRampToValueAtTime(0.16, t0 + 0.02);
      gan.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22);
      osc.connect(gan); gan.connect(audioCtx.destination);
      osc.start(t0); osc.stop(t0 + 0.24);
    });
  } catch {}
}

function vibrar(patron) {
  if (!opciones.vibrar) return;
  try { navigator.vibrate && navigator.vibrate(patron); } catch {}
}

/* Confeti sin librerías */
function confeti(colores) {
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const cv = $("confeti");
  const ctx = cv.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
  ctx.scale(dpr, dpr);
  cv.classList.add("activo");

  const cols = colores && colores.length ? colores : PALETA;
  const trozos = Array.from({ length: 90 }, () => ({
    x: Math.random() * innerWidth,
    y: -20 - Math.random() * innerHeight * 0.4,
    an: 5 + Math.random() * 7,
    al: 8 + Math.random() * 10,
    vy: 2.2 + Math.random() * 3.4,
    vx: -1.4 + Math.random() * 2.8,
    rot: Math.random() * Math.PI,
    vr: -0.16 + Math.random() * 0.32,
    color: cols[Math.floor(Math.random() * cols.length)]
  }));

  const t0 = performance.now();
  (function frame(t) {
    const pasado = t - t0;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    trozos.forEach((p) => {
      p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.vy += 0.035;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = Math.max(0, 1 - pasado / 2600);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.an / 2, -p.al / 2, p.an, p.al);
      ctx.restore();
    });
    if (pasado < 2600) requestAnimationFrame(frame);
    else { ctx.clearRect(0, 0, innerWidth, innerHeight); cv.classList.remove("activo"); }
  })(t0);
}

/* Cartelón grande: lo que hay que leer desde el otro lado de la mesa */
function cartelon(texto, sub, tipo) {
  const el = $("cartelon");
  el.className = "cartelon " + (tipo || "ok");
  el.textContent = texto;
  if (sub) {
    const s = document.createElement("small");
    s.textContent = sub;
    el.appendChild(s);
  }
}

/* ═══════════════════ PODERES ═══════════════════ */

function tienePoder(j, k) { return (j.poderes || []).includes(k); }

function quitarPoder(j, k) {
  const i = (j.poderes || []).indexOf(k);
  if (i >= 0) j.poderes.splice(i, 1);
  guardarPrevia();
  pintarMano();
}

function darPoder(j, k) {
  j.poderes = j.poderes || [];
  if (j.poderes.length >= MANO_MAXIMA) return false;
  j.poderes.push(k);
  guardarPrevia();
  return true;
}

function repartirPoderesIniciales() {
  previa.jugadores.forEach((j) => {
    j.poderes = [];
    for (let i = 0; i < PODERES_INICIALES; i++) j.poderes.push(poderAlAzar());
  });
}

/* ─── Mano ─── */
function pintarMano() {
  const cont = $("mano");
  if (!previa.activa) { cont.hidden = true; return; }
  cont.hidden = false;

  const j = jugadorActual();
  const cartas = $("mano-cartas");
  cartas.innerHTML = "";

  if (!j.poderes || !j.poderes.length) {
    const vacia = document.createElement("span");
    vacia.className = "mano-vacia";
    vacia.textContent = "Mano vacía. Acertá una y la ruleta te da poderes.";
    cartas.appendChild(vacia);
    return;
  }

  j.poderes.forEach((k) => {
    const p = PODERES[k];
    const b = document.createElement("button");
    b.className = "carta" + (p.tipo === "pasivo" ? " pasiva" : "");
    b.textContent = `${p.emoji} ${p.nombre}`;
    b.title = p.desc;
    if (p.tipo === "pasivo") {
      b.addEventListener("click", () => toast(`${p.nombre}: ${p.desc}`));
    } else {
      b.addEventListener("click", () => usarPoder(k));
    }
    cartas.appendChild(b);
  });
}

/* ─── Ruleta de inicio de turno ─── */
const SECTORES = [...CLAVES_PODERES, "nada", "nada"];   // 10 sectores de 36°
const COLOR_SECTOR = {
  robo:"#ff8fa3", cambio:"#7cc4ff", pista:"#c69cff", tiempo:"#5ee0d0",
  doble:"#ffb26b", dedo:"#ff7b6b", espejo:"#a3e635", escudo:"#6de2a3", nada:"#3a465c"
};

let ruletaAlCerrar = null;
let ruletaGiro = 0;

function dibujarRuleta() {
  const svg = $("ruleta");
  const bulbos = $("ruleta-bulbos");

  if (!bulbos.dataset.lista) {
    let b = "";
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * 360;
      b += `<i style="transform:rotate(${a}deg) translateY(-${132}px);animation-delay:${(i % 6) * 0.11}s"></i>`;
    }
    bulbos.innerHTML = b;
    bulbos.dataset.lista = "1";
  }

  if (svg.dataset.lista) return;
  const n = SECTORES.length, paso = 360 / n, R = 100;
  const rad = (g) => (g - 90) * Math.PI / 180;

  let defs = `<defs>
    <radialGradient id="hondo" cx="50%" cy="42%" r="62%">
      <stop offset="55%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity=".55"/>
    </radialGradient>
    <filter id="brilloSector" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="3.4" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>`;

  let html = "";
  SECTORES.forEach((k, i) => {
    const a0 = i * paso, a1 = a0 + paso;
    const x0 = R + R * Math.cos(rad(a0)), y0 = R + R * Math.sin(rad(a0));
    const x1 = R + R * Math.cos(rad(a1)), y1 = R + R * Math.sin(rad(a1));
    const d = `M${R},${R} L${x0},${y0} A${R},${R} 0 0,1 ${x1},${y1} Z`;
    html += `<path class="sector" data-i="${i}" d="${d}" fill="${COLOR_SECTOR[k]}"
             fill-opacity="${k === "nada" ? .30 : .80}" stroke="#0d0f14" stroke-width="1.4"/>`;
  });

  // sombreado que da volumen, encima de los sectores
  html += `<circle cx="${R}" cy="${R}" r="${R}" fill="url(#hondo)"/>`;

  // emojis, siempre derechos
  SECTORES.forEach((k, i) => {
    const am = i * paso + paso / 2;
    const tx = R + 70 * Math.cos(rad(am)), ty = R + 70 * Math.sin(rad(am));
    const emoji = k === "nada" ? "🫠" : PODERES[k].emoji;
    html += `<text class="ruleta-sector-txt" data-i="${i}" x="${tx}" y="${ty}"
             text-anchor="middle" dominant-baseline="central"
             transform="rotate(${am} ${tx} ${ty})">${emoji}</text>`;
  });

  // separadores finos desde el centro
  SECTORES.forEach((_, i) => {
    const a = i * paso;
    const x = R + R * Math.cos(rad(a)), y = R + R * Math.sin(rad(a));
    html += `<line x1="${R}" y1="${R}" x2="${x}" y2="${y}" stroke="#0d0f14" stroke-width="1.2" opacity=".55"/>`;
  });

  svg.innerHTML = defs + html;
  svg.dataset.lista = "1";
}

function resaltarSector(idx) {
  const svg = $("ruleta");
  svg.querySelectorAll(".sector").forEach((p) => {
    const suyo = +p.dataset.i === idx;
    p.setAttribute("fill-opacity", suyo ? 1 : .18);
    p.setAttribute("stroke", suyo ? "#fff" : "#0d0f14");
    p.setAttribute("stroke-width", suyo ? 2.4 : 1.4);
    if (suyo) p.setAttribute("filter", "url(#brilloSector)");
    else p.removeAttribute("filter");
  });
  svg.querySelectorAll(".ruleta-sector-txt").forEach((t) => {
    t.setAttribute("opacity", +t.dataset.i === idx ? 1 : .3);
  });
}

/* Mientras gira, marca el ícono que va pasando por la aguja.
   Es lo que hace que se vea "pasar" por cada poder en vez de girar a ciegas. */
let seguimientoRaf = null;

function seguirAguja(svg, hastaMs) {
  cancelAnimationFrame(seguimientoRaf);
  const paso = 360 / SECTORES.length;
  let ultimo = -1;
  const t0 = performance.now();

  const tick = (t) => {
    const m = new DOMMatrixReadOnly(getComputedStyle(svg).transform);
    let giro = Math.atan2(m.b, m.a) * 180 / Math.PI;   // rotación actual real
    if (giro < 0) giro += 360;

    // qué sector quedó arriba, bajo la aguja
    const idx = Math.floor((((360 - giro) % 360) + 360) % 360 / paso) % SECTORES.length;

    if (idx !== ultimo) {
      ultimo = idx;
      marcarPaso(idx);
      $("ruleta-cara").textContent =
        SECTORES[idx] === "nada" ? "🫠" : PODERES[SECTORES[idx]].emoji;
    }
    if (t - t0 < hastaMs) seguimientoRaf = requestAnimationFrame(tick);
  };
  seguimientoRaf = requestAnimationFrame(tick);
}

/* Resalte suave del sector que pasa (distinto del resalte final del ganador) */
function marcarPaso(idx) {
  const svg = $("ruleta");
  svg.querySelectorAll(".sector").forEach((pth) => {
    const k = SECTORES[+pth.dataset.i];
    const base = k === "nada" ? .30 : .80;
    pth.setAttribute("fill-opacity", +pth.dataset.i === idx ? .98 : base);
  });
  svg.querySelectorAll(".ruleta-sector-txt").forEach((t) => {
    t.setAttribute("opacity", +t.dataset.i === idx ? 1 : .55);
  });
}

function limpiarResaltado() {
  cancelAnimationFrame(seguimientoRaf);
  const svg = $("ruleta");
  svg.querySelectorAll(".sector").forEach((p) => {
    const k = SECTORES[+p.dataset.i];
    p.setAttribute("fill-opacity", k === "nada" ? .30 : .80);
    p.setAttribute("stroke", "#0d0f14");
    p.setAttribute("stroke-width", 1.4);
    p.removeAttribute("filter");
  });
  svg.querySelectorAll(".ruleta-sector-txt").forEach((t) => t.setAttribute("opacity", 1));
}

function abrirRuleta(jugador, alCerrar) {
  if (!previa.activa) { if (alCerrar) alCerrar(); return; }
  ruletaAlCerrar = alCerrar || null;
  const j = jugador || jugadorActual();

  dibujarRuleta();

  const lleno = (j.poderes || []).length >= MANO_MAXIMA;
  // elegimos el sector: si la mano está llena, cae sí o sí en un "nada"
  let idx;
  if (lleno) idx = SECTORES.indexOf("nada", CLAVES_PODERES.length);
  else idx = Math.floor(Math.random() * SECTORES.length);
  const salio = SECTORES[idx];

  $("ruleta-titulo").textContent = `¡${j.nombre} la sacó! 🎡`;
  $("ruleta-sub").textContent = "Premio por acertar. Girando…";
  $("ruleta-nombre").textContent = "";
  $("ruleta-desc").textContent = "";
  $("ruleta-cara").textContent = "🎡";
  $("premio-carta").className = "premio-carta";
  $("premio-carta").style.setProperty("--color", "var(--linea)");
  $("ruleta-caja").classList.add("activa");
  $("ruleta-caja").classList.remove("frenando", "premiado");
  limpiarResaltado();
  $("ruleta-ok").disabled = true;
  $("ruleta-ok").textContent = "Girando…";
  abrirModal("modal-ruleta");

  // el sector idx queda bajo la aguja (arriba) al girar
  const paso = 360 / SECTORES.length;
  const destino = 360 * 4 + (360 - (idx * paso + paso / 2));
  const svg = $("ruleta");
  svg.classList.remove("girando");
  svg.style.transform = `rotate(${ruletaGiro % 360}deg)`;
  void svg.offsetWidth;                        // fuerza reflow para reiniciar la transición
  svg.classList.add("girando");
  ruletaGiro = destino;
  svg.style.transform = `rotate(${destino}deg)`;
  seguirAguja(svg, 4050);

  setTimeout(() => {
    $("ruleta-ok").disabled = false;
    $("ruleta-ok").textContent = "Dale ▸";
    cancelAnimationFrame(seguimientoRaf);
    $("ruleta-caja").classList.remove("activa");
    $("ruleta-caja").classList.add("frenando");
    resaltarSector(idx);
    $("premio-carta").classList.add("revelada");
    $("premio-carta").style.setProperty("--color", COLOR_SECTOR[salio]);
    if (salio === "nada") {
      $("ruleta-cara").textContent = "🫠";
      $("ruleta-sub").textContent = "";
      $("ruleta-nombre").textContent = lleno ? "Mano llena" : "Nada";
      $("ruleta-desc").textContent = lleno
        ? "Ya llevás todos los poderes que podés. Usá alguno."
        : "Le pegaste, pero la ruleta no soltó nada. Suerte la próxima.";
      sonar("neutro");
    } else {
      const pd = PODERES[salio];
      darPoder(j, salio);
      $("ruleta-cara").textContent = pd.emoji;
      $("ruleta-sub").textContent = "¡Te tocó!";
      $("ruleta-nombre").textContent = pd.nombre;
      $("ruleta-desc").textContent = pd.desc;
      sonar("ok"); vibrar([25, 45, 25]);
      $("ruleta-caja").classList.add("premiado");
      confeti([COLOR_SECTOR[salio]]);
      pintarMano();
    }
  }, 4050);
}

/* ─── Uso de los poderes activos ─── */
function usarPoder(k) {
  if (!previa.activa || estado.terminado || !estado.cancion) return;
  const j = jugadorActual();
  if (!tienePoder(j, k)) return;

  if (k === "robo") {
    abrirRobo("robo");
    return;   // se consume recién si el robo se concreta
  }

  if (k === "dedo") {
    abrirRobo("dedo");
    return;
  }

  if (k === "cambio") {
    quitarPoder(j, k);
    toast("🔄 Cambio: viene otra canción");
    nuevaRonda(null, true);   // mismo turno, sin ruleta
    return;
  }

  if (k === "pista") {
    quitarPoder(j, k);
    const c = estado.cancion;
    const g = GENEROS[c.c] ? GENEROS[c.c].nombre : c.c;
    $("estado").textContent = `🔍 Pista: ${g}${c.y ? " · " + c.y : ""}`;
    return;
  }

  if (k === "tiempo") {
    quitarPoder(j, k);
    estado.tiempoExtra += 3;
    pintarBarra();
    $("estado").textContent = `⏱️ Ahora escuchás ${segundosDesbloqueados()}s`;
    reproducir();
    return;
  }

  if (k === "doble") {
    quitarPoder(j, k);
    estado.dobleONada = true;
    toast("🎯 Doble o nada: va el doble para los dos lados");
    pintarHint();
    return;
  }
}

/* multiplicador de la ronda, contando el doble o nada */
const multRonda = () => mult() * (estado.dobleONada ? 2 : 1);

/* ─────────── Espejo ───────────
   Cuando te reparten un trago y tenés espejo, decidís vos: lo devolvés
   al doble o te lo bancás y te guardás la carta para algo más grande. */
function preguntarEspejo(defensor, atacante, contReparto) {
  const devuelve = 2;
  $("espejo-quien").textContent = `${defensor.emoji || ""} ${defensor.nombre}, decidís vos`;
  $("espejo-detalle").textContent =
    `${atacante.nombre} te mandó ${unidad(1)}. Tenés el espejo en la mano.`;
  $("espejo-usar").textContent = `Usar el espejo 🪞 (${atacante.nombre} toma ${devuelve})`;
  $("espejo-pasar").textContent = `Me lo banco (tomás ${unidad(1)})`;
  $("espejo-nota").textContent = "Si lo usás, la carta se gasta.";

  const cerrar = () => {
    previa.repartoPendiente--;
    cerrarModales();
    if (previa.repartoPendiente <= 0) {
      contReparto.hidden = true;
      $("btn-siguiente").disabled = false;
      toast("¡Salud! 🍻");
    } else pintarReparto();
  };

  $("espejo-usar").onclick = () => {
    quitarPoder(defensor, "espejo");
    sumarTragos(atacante, devuelve);
    toast(`🪞 ${defensor.nombre} lo espejó: ${atacante.nombre} toma ${devuelve}`);
    sonar("ok"); vibrar([40, 45, 40]);
    cerrar();
  };

  $("espejo-pasar").onclick = () => {
    sumarTragos(defensor, 1);
    sonar("neutro");
    cerrar();
  };

  abrirModal("modal-espejo");
}

/* ─────────── Robo ───────────
   Si el del turno ya erró, otro jugador puede quedarse con la ronda.
   Se resuelve en un modal de dos pasos: quién roba → qué canción es. */
let roboLadron = null;
let roboSeleccion = null;
let roboIndiceSel = -1;

function puedeRobar() {
  return previa.activa && !estado.terminado && !!estado.cancion &&
         previa.jugadores.length >= 2;
}

function actualizarBotonRobo() {
  // el robo ahora es un poder de la mano; el botón solo aparece si el del turno lo tiene
  $("btn-robar").hidden = !(puedeRobar() && tienePoder(jugadorActual(), "robo"));
}

let roboModo = "robo";   // "robo" | "dedo"

function abrirRobo(modo) {
  if (!previa.activa || estado.terminado || !estado.cancion) return;
  if (typeof modo === "string") roboModo = modo;

  const esDedo = roboModo === "dedo";
  $("robo-titulo").textContent = esDedo ? "Dedo acusador 👉" : "Robo 🖐️";
  $("robo-intro").textContent = esDedo
    ? `${jugadorActual().nombre} señala a alguien para que conteste por él. ¿A quién?`
    : `La canción de ${jugadorActual().nombre} está en juego. ¿Quién se la roba?`;

  roboLadron = null;
  roboSeleccion = null;
  $("robo-input").value = "";
  $("robo-enviar").disabled = true;
  cerrarSugerenciasRobo();
  $("robo-paso1").hidden = false;
  $("robo-paso2").hidden = true;

  const cont = $("robo-jugadores");
  cont.innerHTML = "";
  previa.jugadores.forEach((j) => {
    if (j === jugadorActual()) return;
    const b = document.createElement("button");
    b.className = "chip";
    b.style.setProperty("--color", j.color || "#6de2a3");
    b.append(avatarDe(j, "chico"), document.createTextNode(j.nombre));
    b.addEventListener("click", () => elegirLadron(j));
    cont.appendChild(b);
  });

  abrirModal("modal-robo");
}

function elegirLadron(j) {
  roboLadron = j;
  $("robo-paso1").hidden = true;
  $("robo-paso2").hidden = false;
  if (roboModo === "dedo") {
    $("robo-quien").textContent = `Contesta ${j.nombre}`;
    $("robo-riesgo").textContent = `Si acierta, ${jugadorActual().nombre} se salva y nadie toma. Si erra, ${j.nombre} toma ${unidad(CASTIGO.error * multRonda())}.`;
    $("robo-enviar").textContent = "Contestar";
  } else {
    $("robo-quien").textContent = `Roba ${j.nombre}`;
    $("robo-riesgo").textContent = `Si acierta, ${jugadorActual().nombre} toma ${unidad(CASTIGO.perder * multRonda())} y ${j.nombre} reparte ${unidad(multRonda())}. Si erra, ${j.nombre} toma ${unidad(CASTIGO.error * multRonda())}.`;
    $("robo-enviar").textContent = "Robar";
  }
  setTimeout(() => $("robo-input").focus(), 60);
}

function pintarSugerenciasRobo(q) {
  const ul = $("robo-sugerencias");
  const items = opcionesBusqueda(q);
  roboIndiceSel = -1;
  if (!items.length) { cerrarSugerenciasRobo(); return; }
  ul.innerHTML = "";
  items.forEach((c) => {
    const li = document.createElement("li");
    li.textContent = c.t;
    const s = document.createElement("small");
    s.textContent = c.a;
    li.appendChild(s);
    li.addEventListener("mousedown", (e) => { e.preventDefault(); elegirRobo(c); });
    ul.appendChild(li);
  });
  ul._items = items;
  ul.hidden = false;
}

function cerrarSugerenciasRobo() {
  const ul = $("robo-sugerencias");
  ul.hidden = true; ul.innerHTML = ""; ul._items = null; roboIndiceSel = -1;
}

function elegirRobo(c) {
  roboSeleccion = c;
  $("robo-input").value = `${c.t} — ${c.a}`;
  cerrarSugerenciasRobo();
  $("robo-enviar").disabled = false;
}

function confirmarRobo() {
  if (!roboLadron || !estado.cancion) return;

  let elegida = roboSeleccion;
  if (!elegida) {
    const nq = normalizar($("robo-input").value);
    if (!nq) return;
    elegida = pool(estado.categoria).find((c) => normalizar(c.t) === nq) || null;
    if (!elegida) { toast("Elegí una opción de la lista"); return; }
  }

  const acierta = normalizar(elegida.t) === normalizar(estado.cancion.t) &&
                  normalizar(elegida.a) === normalizar(estado.cancion.a);
  const ladron = roboLadron;
  cerrarModales();

  const turno = jugadorActual();

  if (roboModo === "dedo") {
    quitarPoder(turno, "dedo");
    if (acierta) {
      estado.intentos.push({ tipo: "bien", texto: `Contestó ${ladron.nombre} 👉` });
      estado.dedoDe = ladron;
      terminar(true);
    } else {
      sumarTragos(ladron, CASTIGO.error * multRonda());
      toast(`${ladron.nombre} erró: toma ${unidad(CASTIGO.error * multRonda())}`);
      pintarIntentos();
    }
    return;
  }

  if (acierta) {
    quitarPoder(turno, "robo");
    estado.robo = true;
    estado.ladron = ladron;
    estado.intentos.push({ tipo: "bien", texto: `Robada por ${ladron.nombre}` });
    terminar(true);
  } else {
    sumarTragos(ladron, CASTIGO.error * multRonda());
    toast(`${ladron.nombre} erró el robo: toma ${unidad(CASTIGO.error * multRonda())}`);
    pintarIntentos();
  }
}

function siguienteTurno() {
  previa.turno = (previa.turno + 1) % previa.jugadores.length;
  if (previa.turno === 0) previa.ronda++;
  guardarPrevia();
}

/* ═══════════════════ CIERRE DE LA PREVIA ═══════════════════ */
function resumenPrevia() {
  const js = previa.jugadores;
  const orden = js.slice().sort((a, b) => b.aciertos - a.aciertos || a.tragos - b.tragos);
  const masTomo = js.slice().sort((a, b) => b.tragos - a.tragos)[0];
  const menosTomo = js.slice().sort((a, b) => a.tragos - b.tragos)[0];
  const totalTragos = js.reduce((n, j) => n + j.tragos, 0);
  const rondas = js.reduce((n, j) => n + j.rondas, 0);
  return { orden, masTomo, menosTomo, totalTragos, rondas };
}

function abrirFinal() {
  const { orden, masTomo, menosTomo, totalTragos, rondas } = resumenPrevia();
  const medallas = ["🥇", "🥈", "🥉"];

  const podio = $("podio");
  podio.innerHTML = "";
  orden.forEach((j, i) => {
    const f = document.createElement("div");
    f.className = "podio-fila" + (i === 0 ? " oro" : "");
    const p = document.createElement("span");
    p.className = "podio-puesto";
    p.textContent = medallas[i] || (i + 1);
    const n = document.createElement("span");
    n.className = "podio-nombre";
    n.textContent = j.nombre;
    const d = document.createElement("span");
    d.className = "podio-datos";
    d.innerHTML = `<b>${j.aciertos}</b>${j.aciertos === 1 ? "acierto" : "aciertos"}`;
    f.append(p, avatarDe(j), n, d);
    podio.appendChild(f);
  });

  const u = previa.sinAlcohol ? "puntos" : "tragos";
  $("premios").innerHTML = [
    `🏆 <b>${escapar(orden[0].nombre)}</b> se lleva la previa con ${orden[0].aciertos} de ${orden[0].rondas}.`,
    `🍺 El que más tomó: <b>${escapar(masTomo.nombre)}</b>, ${masTomo.tragos} ${u}.`,
    `😇 El más seco: <b>${escapar(menosTomo.nombre)}</b>, ${menosTomo.tragos} ${u}.`,
    `📊 ${rondas} rondas y ${totalTragos} ${u} en total.`
  ].map((t) => `<div class="premio">${t}</div>`).join("");

  abrirModal("modal-final");
  confeti(orden[0].color ? [orden[0].color] : null);
  sonar("ok"); vibrar([30, 60, 30, 60, 120]);
}

function textoFinal() {
  const { orden, masTomo, totalTragos, rondas } = resumenPrevia();
  const u = previa.sinAlcohol ? "puntos" : "tragos";
  const medallas = ["🥇", "🥈", "🥉"];
  const lineas = orden.map((j, i) =>
    `${medallas[i] || (i + 1) + "."} ${j.emoji || ""} ${j.nombre} — ${j.aciertos}/${j.rondas} · ${j.tragos} ${u}`);
  return [
    "🍻 Cancionero — resultado de la previa",
    "",
    ...lineas,
    "",
    `🍺 El que más tomó: ${masTomo.nombre} (${masTomo.tragos})`,
    `📊 ${rondas} rondas · ${totalTragos} ${u} en total`
  ].join("\n");
}

/* ───────────────────── Estadísticas (modo diario) ───────────────────── */
function registrarStats() {
  stats.jugadas++;
  if (estado.gano) {
    stats.ganadas++;
    stats.dist[estado.intentos.length - 1]++;
    stats.racha++;
    stats.mejorRacha = Math.max(stats.mejorRacha, stats.racha);
  } else stats.racha = 0;
  LS.set("stats", stats);
}

function pintarStats() {
  const pct = stats.jugadas ? Math.round((stats.ganadas / stats.jugadas) * 100) : 0;
  $("stats-grid").innerHTML = `
    <div><b>${stats.jugadas}</b><span>Jugadas</span></div>
    <div><b>${pct}%</b><span>Aciertos</span></div>
    <div><b>${stats.racha}</b><span>Racha</span></div>
    <div><b>${stats.mejorRacha}</b><span>Mejor</span></div>`;
  const max = Math.max(1, ...stats.dist);
  $("dist").innerHTML = stats.dist.map((n, i) =>
    `<div class="fila-d"><i>${i + 1}</i><div class="bar" style="width:${Math.max(8, (n / max) * 100)}%">${n}</div></div>`
  ).join("");
}

/* ───────────────────── Guardado ───────────────────── */
const claveDiaria = () => `diaria:${hoy()}:${estado.categoria}`;
function guardarDiaria() {
  if (estado.modo !== "diaria") return;
  LS.set(claveDiaria(), { intentos: estado.intentos, terminado: estado.terminado, gano: estado.gano });
}
const cargarDiaria = () => (estado.modo === "diaria" ? LS.get(claveDiaria(), null) : null);

function guardarPrevia() {
  LS.set("previa", {
    jugadores: previa.jugadores, turno: previa.turno, ronda: previa.ronda,
    intensidad: previa.intensidad, sinAlcohol: previa.sinAlcohol, reloj: previa.reloj, categoria: estado.categoria
  });
}

function cargarPrevia() {
  const p = LS.get("previa", null);
  if (!p) return;
  Object.assign(previa, {
    jugadores: p.jugadores || [], turno: p.turno || 0, ronda: p.ronda || 1,
    intensidad: p.intensidad || 1, sinAlcohol: !!p.sinAlcohol, reloj: !!p.reloj, activa: false
  });
  if (p.categoria) estado.categoria = p.categoria;
  normalizarJugadores();
}

/* ───────────────────── Pantallas / modales ───────────────────── */
function volverAlSetup() {
  cerrarModales();
  previa.activa = false;
  detener(); pararReloj();
  guardarPrevia();
  mostrarPantalla("setup");
  pintarListaJugadores();
}

function mostrarPantalla(cual) {
  $("setup").hidden = cual !== "setup";
  $("juego").hidden = cual !== "juego";
}

function abrirModal(id) {
  $("overlay").hidden = false;
  $(id).hidden = false;
  if (id === "modal-stats") pintarStats();
  if (id === "modal-marcador") pintarMarcador();
}

function cerrarModales() {
  $("overlay").hidden = true;
  document.querySelectorAll(".modal").forEach((m) => (m.hidden = true));
}

/* ───────────────────── Init ───────────────────── */
function init() {
  cargarPrevia();

  const sel = $("sel-categoria");
  Object.entries(categorias()).forEach(([k, v]) => {
    const o = document.createElement("option");
    o.value = k;
    o.textContent = `${v.emoji} ${v.nombre}`;
    sel.appendChild(o);
  });
  sel.value = estado.categoria;
  sel.addEventListener("change", () => {
    estado.categoria = sel.value;
    guardarPrevia();
    proximaCancion = null;
    yaJugadas = new Set();
    if (!$("juego").hidden) nuevaRonda(cargarDiaria());
  });

  document.querySelectorAll("#seg-modo .seg-btn").forEach((b) => {
    b.addEventListener("click", () => {
      if (b.dataset.modo === estado.modo) return;
      document.querySelectorAll("#seg-modo .seg-btn").forEach((x) => x.classList.remove("activo"));
      b.classList.add("activo");
      estado.modo = b.dataset.modo;
      previa.activa = false;
      proximaCancion = null;
      detener();
      if (estado.modo === "previa") {
        estado.categoria = "previa";
        sel.value = "previa";
        mostrarPantalla("setup");
        pintarListaJugadores();
      } else {
        mostrarPantalla("juego");
        pintarTurno();
        nuevaRonda(cargarDiaria());
      }
    });
  });

  const pintarDesc = () => { $("desc-intensidad").textContent = INTENSIDADES[previa.intensidad].desc; };
  document.querySelectorAll("#seg-intensidad .seg-btn").forEach((b) => {
    b.classList.toggle("activo", +b.dataset.nivel === previa.intensidad);
    b.addEventListener("click", () => {
      document.querySelectorAll("#seg-intensidad .seg-btn").forEach((x) => x.classList.remove("activo"));
      b.classList.add("activo");
      previa.intensidad = +b.dataset.nivel;
      pintarDesc();
      guardarPrevia();
    });
  });
  pintarDesc();

  $("chk-reloj").checked = previa.reloj;
  $("chk-reloj").addEventListener("change", (e) => { previa.reloj = e.target.checked; guardarPrevia(); });

  $("chk-sinalcohol").checked = previa.sinAlcohol;
  $("chk-sinalcohol").addEventListener("change", (e) => { previa.sinAlcohol = e.target.checked; guardarPrevia(); });

  $("btn-agregar").addEventListener("click", () => {
    agregarJugador($("input-jugador").value);
    $("input-jugador").value = "";
    $("input-jugador").focus();
  });
  $("input-jugador").addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); $("btn-agregar").click(); }
  });
  pintarListaJugadores();

  $("btn-empezar").addEventListener("click", () => {
    if (previa.jugadores.length < 2) { toast("Agregá al menos 2 jugadores"); return; }
    previa.activa = true;
    previa.turno = 0;
    previa.ronda = 1;
    previa.jugadores.forEach((j) => Object.assign(j, { tragos: 0, aciertos: 0, rondas: 0 }));
    repartirPoderesIniciales();
    yaJugadas = new Set();
    proximaCancion = null;
    normalizarJugadores();
    guardarPrevia();
    mostrarPantalla("juego");
    nuevaRonda(null);
  });

  $("ruleta-ok").addEventListener("click", () => {
    cerrarModales();
    pintarMano();
    const cb = ruletaAlCerrar;
    ruletaAlCerrar = null;
    if (cb) cb();
  });
  $("btn-robar").addEventListener("click", () => abrirRobo("robo"));
  $("robo-volver").addEventListener("click", () => abrirRobo());
  $("robo-enviar").addEventListener("click", confirmarRobo);

  const roboInput = $("robo-input");
  roboInput.addEventListener("input", () => {
    roboSeleccion = null;
    $("robo-enviar").disabled = !roboInput.value.trim();
    pintarSugerenciasRobo(roboInput.value);
  });
  roboInput.addEventListener("keydown", (e) => {
    const ul = $("robo-sugerencias");
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (ul.hidden || !ul._items) return;
      const n = ul.children.length;
      roboIndiceSel = (roboIndiceSel + (e.key === "ArrowDown" ? 1 : -1) + n) % n;
      [...ul.children].forEach((li, i) => li.classList.toggle("sel", i === roboIndiceSel));
      ul.children[roboIndiceSel].scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (!ul.hidden && roboIndiceSel >= 0 && ul._items) elegirRobo(ul._items[roboIndiceSel]);
      else confirmarRobo();
    } else if (e.key === "Escape") cerrarSugerenciasRobo();
  });

  $("btn-play").addEventListener("click", () => (estado.sonando ? detener() : reproducir()));
  $("btn-enviar").addEventListener("click", enviar);
  $("btn-saltar").addEventListener("click", saltar);
  $("btn-rendirse").addEventListener("click", rendirse);
  $("btn-reintentar").addEventListener("click", () => nuevaRonda(cargarDiaria()));
  $("btn-otra-prenda").addEventListener("click", nuevaPrenda);
  $("btn-marcador").addEventListener("click", () => abrirModal("modal-marcador"));
  $("btn-terminar").addEventListener("click", () => {
    cerrarModales();
    detener(); pararReloj();
    if (previa.jugadores.some((j) => j.rondas > 0)) abrirFinal();
    else volverAlSetup();
  });

  $("final-cerrar").addEventListener("click", volverAlSetup);
  $("final-revancha").addEventListener("click", () => {
    cerrarModales();
    previa.turno = 0; previa.ronda = 1; previa.ruletaPara = null;
    previa.jugadores.forEach((j) => Object.assign(j, { tragos: 0, aciertos: 0, rondas: 0 }));
    repartirPoderesIniciales();
    yaJugadas = new Set();
    proximaCancion = null;
    guardarPrevia();
    mostrarPantalla("juego");
    nuevaRonda(null);
  });
  $("final-compartir").addEventListener("click", async () => {
    const txt = textoFinal();
    try {
      if (navigator.share) await navigator.share({ text: txt });
      else { await navigator.clipboard.writeText(txt); toast("¡Copiado! Pegalo en el grupo 📋"); }
    } catch { toast("No se pudo compartir"); }
  });

  $("btn-siguiente").addEventListener("click", () => {
    if (previa.activa && previa.ruletaPara) {
      const ganador = previa.ruletaPara;
      previa.ruletaPara = null;
      abrirRuleta(ganador, () => { siguienteTurno(); nuevaRonda(null); });
      return;
    }
    if (previa.activa) siguienteTurno();
    nuevaRonda(null);
  });

  $("btn-clear").addEventListener("click", () => {
    $("input").value = "";
    estado.seleccion = null;
    $("btn-enviar").disabled = true;
    $("btn-clear").hidden = true;
    cerrarSugerencias();
    $("input").focus();
  });

  const input = $("input");
  input.addEventListener("input", () => {
    estado.seleccion = null;
    $("btn-clear").hidden = !input.value;
    $("btn-enviar").disabled = !input.value.trim();
    pintarSugerencias(input.value);
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); moverSel(1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); moverSel(-1); }
    else if (e.key === "Enter") {
      e.preventDefault();
      const ul = $("sugerencias");
      if (!ul.hidden && indiceSel >= 0 && ul._items) elegir(ul._items[indiceSel]);
      else enviar();
    } else if (e.key === "Escape") cerrarSugerencias();
  });
  input.addEventListener("blur", () => setTimeout(cerrarSugerencias, 120));

  document.addEventListener("keydown", (e) => {
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
    if (e.code === "Space") { e.preventDefault(); estado.sonando ? detener() : reproducir(); }
    if (e.key && e.key.toLowerCase() === "r") abrirRobo();
    if (e.key === "Escape") cerrarModales();
  });

  $("btn-ayuda").addEventListener("click", () => abrirModal("modal-ayuda"));
  $("btn-stats").addEventListener("click", () => abrirModal("modal-stats"));
  $("btn-config").addEventListener("click", () => abrirModal("modal-config"));
  $("btn-diagnostico").addEventListener("click", diagnostico);
  $("overlay").addEventListener("click", () => {
    if (!$("modal-espejo").hidden || !$("modal-ruleta").hidden) return;  // hay que decidir / esperar
    cerrarModales();
  });
  document.querySelectorAll("[data-cerrar]").forEach((b) => b.addEventListener("click", cerrarModales));

  $("rng-volumen").value = opciones.volumen;
  $("rng-volumen").addEventListener("input", (e) => {
    opciones.volumen = +e.target.value;
    audio.volume = opciones.volumen / 100;
    LS.set("opciones", opciones);
  });
  $("chk-sonido").checked = opciones.sonido;
  $("chk-sonido").addEventListener("change", (e) => {
    opciones.sonido = e.target.checked; LS.set("opciones", opciones);
    if (opciones.sonido) sonar("neutro");
  });
  $("chk-vibrar").checked = opciones.vibrar;
  $("chk-vibrar").addEventListener("change", (e) => {
    opciones.vibrar = e.target.checked; LS.set("opciones", opciones);
    if (opciones.vibrar) vibrar(60);
  });

  $("chk-estricto").checked = opciones.estricto;
  $("chk-estricto").addEventListener("change", (e) => { opciones.estricto = e.target.checked; LS.set("opciones", opciones); });

  $("btn-reset").addEventListener("click", () => {
    stats = statsPorDefecto(); LS.set("stats", stats); pintarStats(); toast("Estadísticas borradas");
  });

  $("btn-compartir").addEventListener("click", async () => {
    const cab = estado.modo === "diaria" ? `Cancionero ${hoy()}` : "Cancionero";
    const cat = categorias()[estado.categoria] || { emoji: "🎧", nombre: "Todas" };
    const txt = `${cab} ${cat.emoji} ${cat.nombre}\n${emojisResultado()}\n${estado.gano ? estado.intentos.length + "/6" : "X/6"}`;
    try {
      if (navigator.share) await navigator.share({ text: txt });
      else { await navigator.clipboard.writeText(txt); toast("¡Copiado!"); }
    } catch { toast("No se pudo compartir"); }
  });

  audio.addEventListener("ended", detener);
  window.addEventListener("online", () => marcarConexion(true));
  window.addEventListener("offline", () => marcarConexion(false));

  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }

  // Arranca en la pantalla de previa y verifica la API de entrada
  mostrarPantalla("setup");
  buscarItunes("Los Palmeras").then(precargarProxima).catch(() => {});
}

document.addEventListener("DOMContentLoaded", init);
