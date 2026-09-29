/* Servidor estático mínimo para ejecutar los casos de prueba en local. */
const http = require("http");
const fs = require("fs");
const path = require("path");

const RAIZ = path.join(__dirname, "..");
const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml"
};

function crearServidor() {
  return http.createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");
    let rel = decodeURIComponent(url.pathname);
    if (rel === "/" || rel === "") rel = "/index.html";
    const archivo = path.join(RAIZ, rel);
    if (!archivo.startsWith(RAIZ)) { res.writeHead(403).end("403"); return; }
    fs.readFile(archivo, (err, data) => {
      if (err) { res.writeHead(404, { "Content-Type": "text/plain" }).end("404"); return; }
      res.writeHead(200, {
        "Content-Type": TIPOS[path.extname(archivo)] || "application/octet-stream",
        "Cache-Control": "no-store"
      });
      res.end(data);
    });
  });
}

function escuchar(puerto = 0) {
  return new Promise((ok) => {
    const s = crearServidor();
    s.listen(puerto, "127.0.0.1", () => ok({ servidor: s, puerto: s.address().port }));
  });
}

module.exports = { escuchar };

if (require.main === module) {
  escuchar(4173).then(({ puerto }) => console.log("http://127.0.0.1:" + puerto));
}
