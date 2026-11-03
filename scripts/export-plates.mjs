// Export every published plate to public/exports/dayNN.png at 2160 x 2700 (landing thumbnails), and
// each downloadable SVG plate (both modes, fonts embedded) to public/downloads/<file>[-color].png at
// 3240 x 4050, marked 300 DPI: 10.8 x 13.5 in.
// Usage: npm run build && npm run export   (re-run build afterwards to ship the PNGs)
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import zlib from 'node:zlib';
import { chromium } from 'playwright';

const DPI = 300;
const PRINT_SCALE = 3;

// Write a pHYs chunk (pixels per metre) after IHDR, so print and layout apps read the PNG at 300 DPI.
function setDpi(png, dpi) {
  const ppm = Math.round(dpi / 0.0254);
  const data = Buffer.alloc(9);
  data.writeUInt32BE(ppm, 0);
  data.writeUInt32BE(ppm, 4);
  data.writeUInt8(1, 8); // unit: metre
  const type = Buffer.from('pHYs');
  const chunk = Buffer.alloc(21);
  chunk.writeUInt32BE(9, 0);
  type.copy(chunk, 4);
  data.copy(chunk, 8);
  chunk.writeUInt32BE(zlib.crc32(Buffer.concat([type, data])), 17);
  const ihdrEnd = 8 + 8 + png.readUInt32BE(8) + 4; // signature, then IHDR length, type, data, CRC
  return Buffer.concat([png.subarray(0, ihdrEnd), chunk, png.subarray(ihdrEnd)]);
}

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

const dlIn = path.join(root, 'downloads');
const dlOut = path.resolve('public/downloads');
fs.mkdirSync(dlOut, { recursive: true });
const print = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: PRINT_SCALE });
for (const file of fs.readdirSync(dlIn).filter((f) => f.endsWith('.svg'))) {
  await print.goto(`http://localhost:4329${BASE}/downloads/${file}`, { waitUntil: 'networkidle' });
  const png = await print.screenshot({ clip: { x: 0, y: 0, width: 1080, height: 1350 } });
  const name = file.replace(/\.svg$/, '.png');
  fs.writeFileSync(path.join(dlOut, name), setDpi(png, DPI));
  console.log(`exported downloads/${name} (${1080 * PRINT_SCALE} x ${1350 * PRINT_SCALE}, ${DPI} DPI)`);
}
await browser.close();
server.close();
