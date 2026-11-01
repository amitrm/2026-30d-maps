// Export every published plate to public/exports/dayNN.png at 2160 x 2700.
// Usage: npm run build && npm run export   (re-run build afterwards to ship the PNGs)
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { chromium } from 'playwright';

const root = path.resolve('dist');
const outDir = path.resolve('public/exports');
const BASE = '/2026-30d-maps';
fs.mkdirSync(outDir, { recursive: true });

const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]).replace(BASE, '');
  if (p.endsWith('/')) p += 'index.html';
  const file = path.join(root, p);
  if (!file.startsWith(root) || !fs.existsSync(file)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': types[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}).listen(4329);

const slugs = fs.readdirSync(root).filter((d) => /^day\d{2}$/.test(d) && fs.existsSync(path.join(root, d, 'plate', 'index.html')));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 2 });
for (const slug of slugs) {
  await page.goto(`http://localhost:4329${BASE}/${slug}/plate/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(outDir, `${slug}.png`), clip: { x: 0, y: 0, width: 1080, height: 1350 } });
  console.log(`exported ${slug}.png`);
}
await browser.close();
server.close();
