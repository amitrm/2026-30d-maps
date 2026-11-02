// Build-time only: turns a plate SVG into a standalone file with its fonts embedded,
// so the download renders the same in any viewer or editor.
import fs from 'node:fs';
import path from 'node:path';
import { W, H } from './plate.js';

// Faces the plates use (latin subset). Paths resolve from the project root, where Astro builds.
const FACES = [
  ['Source Serif 4', 'source-serif-4', 400, 'normal'],
  ['Source Serif 4', 'source-serif-4', 400, 'italic'],
  ['Source Serif 4', 'source-serif-4', 500, 'normal'],
  ['IBM Plex Mono', 'ibm-plex-mono', 400, 'normal'],
  ['IBM Plex Mono', 'ibm-plex-mono', 500, 'normal'],
  ['IBM Plex Mono', 'ibm-plex-mono', 600, 'normal'],
];

let fontCss;
function fonts() {
  fontCss ??= FACES.map(([family, pkg, weight, style]) => {
    const file = path.resolve('node_modules/@fontsource', pkg, 'files', `${pkg}-latin-${weight}-${style}.woff2`);
    const data = fs.readFileSync(file).toString('base64');
    return `@font-face{font-family:'${family}';font-style:${style};font-weight:${weight};src:url(data:font/woff2;base64,${data}) format('woff2')}`;
  }).join('');
  return fontCss;
}

export function standalone(svg) {
  const head = svg.replace(/^<svg /, `<svg width="${W}" height="${H}" `).replace(/^(<svg[^>]*>)/, `$1<defs><style>${fonts()}</style></defs>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n${head}`;
}
