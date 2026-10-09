// Sirve la app exportada como SPA: cualquier ruta que no sea un archivo devuelve index.html.
// Uso: node serve.mjs <carpeta> <puerto>
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const [dir = '../apps/app/dist', port = '4173'] = process.argv.slice(2);
const root = path.resolve(dir);
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.webmanifest': 'application/manifest+json',
};

if (!fs.existsSync(path.join(root, 'index.html'))) {
  console.error(`No encuentro ${root}/index.html. Primero hacé el build web de la app.`);
  process.exit(1);
}

http
  .createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
    let file = path.join(root, pathname);
    if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      file = path.join(root, 'index.html');
    }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  })
  .listen(Number(port), () => console.log(`App en http://localhost:${port}`));
