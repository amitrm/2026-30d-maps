// Shared plate primitives. Every plate is a 1080 x 1350 SVG (exported at 2x = 2160 x 2700).
import { CHARS, WIDTHS } from './roboto-widths.js';

export const W = 1080;
export const H = 1350;

export const C = {
  paper: '#F1F0EC',
  ink: '#232323',
  pencil: '#77756F',
  fog: '#CFCDC7',
  rule: '#E1DFD9',
  ground: '#E4E2DC', // land inside the city limits: fill only, no outline
  grid: '#D3D1CA', // mile grid lines: dark enough to read over ground and over paper
  frame: '#BDBBB4', // legend box outline on the day page: a step darker than the grid
};

// Color mode only: hue distinguishes elements, never decorates. CTA line colors;
// Yellow is darkened from #F9E300 so rings stay legible on paper.
export const LINES = {
  Red: '#C60C30',
  Blue: '#00A1DE',
  Brown: '#62361B',
  Green: '#009B3A',
  Orange: '#F9461C',
  Purple: '#522398',
  Pink: '#E27EA6',
  Yellow: '#D4BC00',
};

export const SERIF ="'Source Serif 4', 'Source Serif Pro', Georgia, serif";
export const SANS = "'Roboto', system-ui, sans-serif";

// Width of a line of Roboto, in px, from its advance widths (roboto-widths.js); letter-spacing is
// added after every character, as SVG does. Characters outside the table count as 0.6 em.
const AT = new Map([...CHARS].map((c, i) => [c, i]));
export function textWidth(str, size, { weight = 400, spacing = 0 } = {}) {
  const widths = WIDTHS[weight] ?? WIDTHS[400];
  const chars = [...String(str)];
  const em = chars.reduce((n, c) => n + (widths[AT.get(c)] ?? 600), 0) / 1000;
  return em * size + spacing * chars.length;
}

export const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&#39;');

export function text(x, y, str, o = {}) {
  const {
    size = 12, font = SANS, fill = C.ink, anchor = 'start', weight = 400,
    italic = false, spacing = 0, rotate = 0, opacity = 1, halo,
  } = o;
  const tr = rotate ? ` transform="rotate(${rotate} ${x} ${y})"` : '';
  // halo: a knock-out stroke in the background color, so a label stays legible over marks
  const hl = halo ? ` stroke="${halo}" stroke-width="3" stroke-linejoin="round" paint-order="stroke"` : '';
  return `<text x="${x}" y="${y}" font-family="${font}" font-size="${size}" fill="${fill}" text-anchor="${anchor}" font-weight="${weight}"${italic ? ' font-style="italic"' : ''}${spacing ? ` letter-spacing="${spacing}"` : ''}${opacity < 1 ? ` opacity="${opacity}"` : ''}${hl}${tr}>${esc(str)}</text>`;
}

// Greedy word wrap by an approximate character budget.
export function wrap(str, maxChars) {
  const words = str.split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > maxChars) {
      lines.push(line.trim());
      line = w;
    } else line += ' ' + w;
  }
  if (line.trim()) lines.push(line.trim());
  return lines;
}

export function paragraph(x, y, str, { maxChars = 40, lineHeight = 1.3, ...o } = {}) {
  const size = o.size ?? 12;
  return wrap(str, maxChars)
    .map((l, i) => text(x, y + i * size * lineHeight, l, o))
    .join('');
}

// Common frame: paper, border, header, footer.
export function frame({ plate, chapter, day, theme, title, subtitle }) {
  const out = [];
  out.push(`<rect width="${W}" height="${H}" fill="${C.paper}"/>`);
  out.push(`<rect x="28" y="28" width="${W - 56}" height="${H - 56}" fill="none" stroke="${C.ink}" stroke-width="1"/>`);
  out.push(`<rect x="34" y="34" width="${W - 68}" height="${H - 68}" fill="none" stroke="${C.ink}" stroke-width="0.4"/>`);
  // header
  out.push(text(60, 78, `PLATE ${plate}`, { size: 11, spacing: 2.5, weight: 500 }));
  out.push(text(W - 60, 78, `${chapter}  ·  DAY ${String(day).padStart(2, '0')}  ·  ${theme.toUpperCase()}`, { size: 11, spacing: 2, anchor: 'end', fill: C.pencil }));
  out.push(`<line x1="60" x2="${W - 60}" y1="92" y2="92" stroke="${C.ink}" stroke-width="0.6"/>`);
  out.push(text(58, 150, title, { size: 54, font: SERIF, weight: 500 }));
  out.push(text(60, 180, subtitle, { size: 15, font: SERIF, italic: true, fill: C.pencil }));
  // footer
  out.push(`<line x1="60" x2="${W - 60}" y1="${H - 74}" y2="${H - 74}" stroke="${C.ink}" stroke-width="0.6"/>`);
  out.push(text(60, H - 52, '800 TO THE MILE  ·  A CHICAGO ACCESS ATLAS IN 30 PLATES', { size: 10, spacing: 1.8 }));
  out.push(text(W - 60, H - 52, '#30DAYMAPCHALLENGE 2026  ·  AMITRM.GITHUB.IO/2026-30D-MAPS', { size: 10, spacing: 1.2, anchor: 'end', fill: C.pencil }));
  return out.join('');
}

export function svg(body, { label, viewBox = `0 0 ${W} ${H}`, align }) {
  const par = align ? ` preserveAspectRatio="${align}"` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}"${par} role="img" aria-label="${esc(label)}">${body}</svg>`;
}

// The day page's map legend: a paper box four grid cells wide, its sides on the mile ruler's ends
// (x, x + 4k) and its bottom on the grid line above the ruler's row; it rises by whole cells to fit.
// items: [mark, label] rows (mark: SVG drawn around 0,0), ['head', text] for a caps heading, or
// ['gap'] for extra space. Labels wrap to the box.
export function legendBox(items, { x, bottom, k, size }) {
  const pad = 8, markW = 24, lh = size * 1.3;
  const w = 4 * k;
  const room = w - 2 * pad - markW;
  const lines = (str, s, o) => {
    const out = [];
    for (const word of str.split(' ')) {
      const last = out.at(-1);
      if (last && textWidth(`${last} ${word}`, s, o) <= (o.full ? w - 2 * pad : room)) out[out.length - 1] = `${last} ${word}`;
      else out.push(word);
    }
    return out;
  };
  const head = { size: size * 0.85, weight: 600, spacing: 0.6 };
  const rows = items.map(([mark, label]) =>
    mark === 'gap' ? { gap: 6 } : mark === 'head' ? { head: lines(label.toUpperCase(), head.size, { ...head, full: true }) } : { mark, text: lines(label, size, {}) });
  const height = rows.reduce((h, r) => h + (r.gap ?? (r.head ? r.head.length * lh + 4 : r.text.length * lh + 3)), 0) - 3;
  const cells = Math.max(1, Math.ceil((height + 2 * pad) / k));
  const top = bottom - cells * k;
  const out = [`<rect x="${x}" y="${top}" width="${w}" height="${cells * k}" fill="${C.paper}" stroke="${C.frame}" stroke-width="0.8"/>`];
  let y = top + pad + (cells * k - 2 * pad - height) / 2; // centred in its cells
  for (const r of rows) {
    if (r.gap) { y += r.gap; continue; }
    if (r.head) {
      r.head.forEach((l, i) => out.push(text(x + pad, y + lh * i + size * 0.8, l, { size: head.size, weight: 600, spacing: head.spacing })));
      y += r.head.length * lh + 4;
      continue;
    }
    out.push(`<g transform="translate(${x + pad + markW / 2 - 2} ${y + lh / 2})">${r.mark}</g>`);
    r.text.forEach((l, i) => out.push(text(x + pad + markW, y + lh * i + size * 0.8, l, { size })));
    y += r.text.length * lh + 3;
  }
  return out.join('');
}
