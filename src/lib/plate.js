// Shared plate primitives. Every plate is a 1080 x 1350 SVG (exported at 2x = 2160 x 2700).
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
export const MONO = "'IBM Plex Mono', ui-monospace, Menlo, monospace";

export const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&#39;');

export function text(x, y, str, o = {}) {
  const {
    size = 12, font = MONO, fill = C.ink, anchor = 'start', weight = 400,
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
