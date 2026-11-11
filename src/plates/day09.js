// Plate IX · Where the Grid Frays · Day 09 Urban-rural
import { C, LINES, SERIF, esc, text, textWidth, legendBox, wrap, frame, svg } from '../lib/plate.js';
import { formatAddress, toMiles } from '../lib/grid.js';

// variant 'plate': the full 1080 x 1350 plate (export, download).
// variant 'map': the map alone, with hover hooks, for the day page's left column.
// variant 'chart': the index from the Loop outward, with hover hooks (a 2-mile ring lights its squares).
// variant 'inset': the inset alone, drawn tall so the page can crop it.
// The six counties of the RTA region, one square per square mile of Chicago's address grid run on past
// the city limit (data.cells, x and y in miles from State & Madison), each shaded by two measures at
// once (PALETTES, below): its residents and its buses and trains an hour each way. The ink line is
// the edge of frequent service (data.edge, address units): four or more buses and trains an hour each
// way, one every 15 minutes, within reach. Grid lines every eight miles: at 9 px a mile, one line per
// mile would be texture. The inset's 'L' lines take their colors in color mode.
export const FULL_POP = 15000;
export const GRID_STEP = 8; // miles between labelled grid lines
const EXT = { west: -56, east: 6, south: -48, north: 44 }; // miles
const W_COL = 300;


// bivariate classes: residents in a square mile, and buses and trains an hour each way
export const POP_BREAKS = [1000, 5000, 10000];
export const SVC_BREAKS = [1, 4, 12];
export const popClass = (p) => POP_BREAKS.filter((b) => p >= b).length;
export const svcClass = (t) => SVC_BREAKS.filter((b) => (t ?? 0) >= b).length;
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const toHex = (a) => '#' + a.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();
// a 4 x 4 scale from four corners: [none, residents only, service only, both]; m[pop][svc]
export function bivariate([c00, c30, c03, c33]) {
  const [a, b, c, d] = [c00, c30, c03, c33].map(hex);
  return [0, 1, 2, 3].map((i) => [0, 1, 2, 3].map((j) => {
    const u = i / 3, v = j / 3;
    return toHex(a.map((_, k) => a[k] * (1 - u) * (1 - v) + b[k] * u * (1 - v) + c[k] * (1 - u) * v + d[k] * u * v));
  }));
}

// Each square mile is one full square in a bivariate class: residents (POP_BREAKS) and buses and
// trains an hour (SVC_BREAKS). Color: a 4 x 4 scale, red for residents, blue for service, purple for
// both. Grayscale: four tones for residents and an ink square inside for service (one tone cannot
// carry two measures). Both read from the same diamond key. A palette can be passed for studies.
export const PALETTES = {
  gray: { tones: ['#E4E2DC', '#CFCDC7', '#B0AEA7', '#8E8C86'], sizes: [0, 0.3, 0.55, 0.8], edge: C.ink },
  color: { bivar: bivariate(['#E8E6EF', '#C8524B', '#5B9BD5', '#4A1D6E']), edge: C.ink },
};
export function renderDay09(data, { mode = 'gray', variant = 'plate', palette } = {}) {
  const { cells, rings, summary, edge = [], boundary = [], fullTph = 12, freqTph = 4 } = data;
  const out = [];
  const isPlate = variant === 'plate';
  const isMap = variant === 'map';
  const isChart = variant === 'chart';
  const isInset = variant === 'inset';
  const hooks = isMap || isChart || isInset;
  const uid = `d09-${variant}-${mode}`;
  const T = isMap || isChart ? 1.3 : 1.15;
  const TI = isInset ? 1.35 : 1.15;
  const color = mode === 'color';
  const pal = palette ?? PALETTES[color && PALETTES.color ? 'color' : 'gray'];

  const ring = (r, fx, fy) => 'M' + r.map(([x, y]) => `${fx(x).toFixed(1)},${fy(y).toFixed(1)}`).join('L') + 'Z';
  const line = (p, fx, fy) => 'M' + p.map(([x, y]) => `${fx(x).toFixed(1)},${fy(y).toFixed(1)}`).join('L');
  const city = (fx, fy) => boundary.map((r) => ring(r, fx, fy)).join('');
  const addrY = (m) => (m >= 0 ? m * 800 : m >= -1 ? m * 1200 : -1200 + (m + 1) * 800); // miles north -> address

  // ---------- squares ----------
  const outer = (c) => 0.92 * Math.min(1, Math.sqrt(c.pop / FULL_POP));
  const inner = (c) => Math.sqrt(Math.min(1, (c.tph ?? 0) / fullTph));
  const drawCells = (list, Xm, Ym, kk) => {
    for (const c of list) {
      const bv = pal.bivar || pal.tones;
      const s = (bv ? 0.92 : outer(c)) * kk;
      const f = pal.bivar ? 0 : pal.tones ? pal.sizes[svcClass(c.tph)] : inner(c);
      const x = Xm(c.x + 0.5) - s / 2, y = Ym(c.y + 0.5) - s / 2;
      const fill = pal.bivar ? pal.bivar[popClass(c.pop)][svcClass(c.tph)] : pal.tones ? pal.tones[popClass(c.pop)] : pal.pop;
      let m = `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${s.toFixed(2)}" height="${s.toFixed(2)}" fill="${fill}"/>`;
      if (f * s > 0.25) {
        const i = f * s, o = (s - i) / 2;
        m += `<rect x="${(x + o).toFixed(2)}" y="${(y + o).toFixed(2)}" width="${i.toFixed(2)}" height="${i.toFixed(2)}" fill="${C.ink}"/>`;
      }
      if (hooks) {
        const hit = s < 6 ? `<rect x="${(Xm(c.x + 0.5) - 3).toFixed(2)}" y="${(Ym(c.y + 0.5) - 3).toFixed(2)}" width="6" height="6" fill="transparent"/>` : '';
        m = `<g data-kind="tile" data-tip="${esc(c.where)}" data-name="${esc(c.where)}" data-shape="tile" data-size="${bv ? 0.92 : outer(c).toFixed(2)}" data-frac="${f.toFixed(2)}" data-fill="${fill}" data-keys="r${c.ring}" data-detail="${esc(cellDetail(c))}">${hit}${m}</g>`;
      }
      out.push(m);
    }
  };
  const drawEdge = (fx, fy, s) => {
    out.push(`<path d="${edge.map((r) => ring(r, fx, fy)).join('')}" fill="none" stroke="${pal.edge}" stroke-width="${1 * s}" stroke-linejoin="round"/>`);
  };

  if (isPlate) out.push(frame({
    plate: 'IX',
    chapter: 'THE SYSTEMS',
    day: 9,
    theme: 'Urban-rural',
    title: 'Where the Grid Frays',
    subtitle: 'Chicago’s grid runs on past the city limit, a road every mile. Square by square, does the bus?',
  }));

  // ---------- main map: the six counties ----------
  const field = isMap ? { x: 60, y: 250, w: 760, h: 1040 } : { x: 60, y: 262, w: 575, h: 830 };
  const k = Math.min(field.w / (EXT.east - EXT.west), field.h / (EXT.north - EXT.south));
  const Xm = (m) => field.x + (m - EXT.west) * k;
  const Ym = (m) => field.y + (EXT.north - m) * k;
  const X = (x) => Xm(toMiles(x, 'x'));
  const Y = (y) => Ym(toMiles(y, 'y'));
  const fx0 = Xm(EXT.west), fx1 = Xm(EXT.east), fy0 = Ym(EXT.north), fy1 = Ym(EXT.south);
  const gl = 8 * T;
  const labelLen = 7 * (gl * 0.6 + 0.4);
  const colX = fx1 + 6 + labelLen;
  const labelTop = fy0 - 6 - labelLen;
  const ib = data.inset.box;

  if (isPlate || isMap) {
    out.push(`<defs><clipPath id="${uid}-map"><rect x="${fx0}" y="${fy0}" width="${fx1 - fx0}" height="${fy1 - fy0}"/></clipPath></defs>`);
    out.push(`<g clip-path="url(#${uid}-map)">`);
    if (boundary.length) out.push(`<path d="${city(X, Y)}" fill="${C.ground}" fill-rule="evenodd"/>`);
    const xs = [], ys = [];
    for (let m = EXT.west; m <= EXT.east; m += GRID_STEP) xs.push(m);
    for (let m = EXT.south; m <= EXT.north; m += GRID_STEP) ys.push(m);
    for (const m of xs) out.push(`<line x1="${Xm(m)}" x2="${Xm(m)}" y1="${fy0}" y2="${fy1}" stroke="${m === 0 ? C.pencil : C.grid}" stroke-width="${m === 0 ? 0.8 : 0.6}"/>`);
    for (const m of ys) out.push(`<line x1="${fx0}" x2="${fx1}" y1="${Ym(m)}" y2="${Ym(m)}" stroke="${m === 0 ? C.pencil : C.grid}" stroke-width="${m === 0 ? 0.8 : 0.6}"/>`);
    drawCells(cells, Xm, Ym, k);
    drawEdge(X, Y, isMap ? 1.2 : 1);
    out.push(`<rect${hooks ? ` data-inset-frame data-y0="${+Ym(0).toFixed(2)}"` : ''} x="${Xm(ib.west)}" y="${Ym(ib.north)}" width="${(ib.east - ib.west) * k}" height="${(ib.north - ib.south) * k}" fill="none" stroke="${C.ink}" stroke-width="0.6" stroke-dasharray="2 2"/>`);
    // the largest towns, named at their squares' centre
    const ls = 7.5 * T;
    for (const p of towns(cells.filter((c) => Math.hypot(c.x + 0.5, c.y + 0.5) > 12), 7)) {
      out.push(text(Xm(p.x), Ym(p.y) - outer({ pop: FULL_POP }) * k * 0.5 - 3, p.name.toUpperCase(), { size: ls, fill: C.ink, weight: 500, anchor: 'middle', spacing: 0.4, halo: C.paper }));
    }
    out.push('</g>');
    const gridLabel = (m) => (m === 0 ? { fill: C.ink, weight: 600 } : { fill: C.pencil });
    for (const m of xs) out.push(text(Xm(m) + gl * 0.35, labelTop, formatAddress(m * 800, 'x'), { size: gl, spacing: 0.4, rotate: -90, anchor: 'end', ...gridLabel(m) }));
    for (const m of ys) out.push(text(colX, Ym(m) + gl * 0.35, formatAddress(addrY(m), 'y'), { size: gl, spacing: 0.4, anchor: 'end', ...gridLabel(m) }));

    // ruler: three grid cells (24 miles) along the bottom row, where the six counties leave paper
    const rx = Xm(EXT.west), ry = fy1 - k * 0.6, rl = 3 * GRID_STEP * k;
    out.push(`<line x1="${rx}" x2="${rx + rl}" y1="${ry}" y2="${ry}" stroke="${C.ink}" stroke-width="1.2"/>`);
    for (let i = 0; i <= 3; i++) out.push(`<line x1="${rx + i * GRID_STEP * k}" x2="${rx + i * GRID_STEP * k}" y1="${ry - (i % 3 === 0 ? 6 : 4)}" y2="${ry}" stroke="${C.ink}" stroke-width="1.2"/>`);
    out.push(text(rx + 1, ry - 9, '0', { size: 7.5 * T, anchor: 'start' }));
    out.push(text(rx + GRID_STEP * k, ry - 9, '8', { size: 7.5 * T, anchor: 'middle' }));
    out.push(text(rx + 2 * GRID_STEP * k, ry - 9, '16', { size: 7.5 * T, anchor: 'middle' }));
    out.push(text(rx + rl, ry - 9, '24 MI', { size: 7.5 * T, anchor: 'middle' }));

    // legend: the diamond key on the map, where the six counties leave paper; the line in the legend
    const lgs = 9 * T;
    const edgeMark = () => `<line x1="-8" x2="8" y1="0" y2="0" stroke="${pal.edge}" stroke-width="1.1"/>`;
    const sw = (fill, f = 0) => `<rect x="-6" y="-6" width="12" height="12" fill="${fill}"/>${f ? `<rect x="${-6 * f}" y="${-6 * f}" width="${12 * f}" height="${12 * f}" fill="${C.ink}"/>` : ''}`;
    if (isPlate) {
      out.push(squareKey(pal, rx, Ym(EXT.south + 9), 18, T));
      const short = [
        [null, 'Each square mile is colored by its residents and its buses and trains an hour (key at lower left);'],
        [edgeMark(), 'edge of a bus or train every 15 minutes'],
      ];
      let lx = 60;
      const y = 203;
      for (const [m, lab] of short) {
        if (m) { out.push(`<g transform="translate(${lx + 6} ${y - lgs * 0.35})">${m}</g>`); lx += 17; }
        out.push(text(lx, y, lab, { size: lgs, fill: C.pencil }));
        lx += textWidth(lab, lgs) + 9;
      }
    } else {
      const b = pal.bivar;
      const items = [
        ['head', 'Each square mile'],
        ...(b
          ? [[sw(b[3][0]), 'Red: many residents, little service'], [sw(b[0][3]), 'Blue: service, few residents'], [sw(b[3][3]), 'Purple: both']]
          : [[sw(pal.tones[3]), 'Darker gray: more residents'], [sw(pal.tones[0], pal.sizes[2]), 'Ink square: more buses and trains an hour'], [sw(pal.tones[3], pal.sizes[3]), 'Dark with a large square: both']]),
        ['gap'],
        [edgeMark(), `Edge of frequent service: ${freqTph} or more buses and trains an hour each way, one every 15 minutes`],
      ];
      out.push(legendBox(items, { x: rx, bottom: Ym(EXT.south + GRID_STEP), k: GRID_STEP * k, size: lgs, span: 3 }));
      out.push(squareKey(pal, rx, Ym(EXT.south + 3 * GRID_STEP + 4), 21, T));
    }
  }

  if (isMap) {
    return svg(out.join(''), { label: mapLabel(summary), viewBox: `60 184 ${Math.ceil(colX + 4 - 60)} 1114`, align: 'xMinYMin meet' })
      .replace('<svg ', `<svg data-top="${labelTop - 184}" data-bottom="${fy1 - 184}" data-ftop="${+(fy0 - 184).toFixed(2)}" data-ppm="${+k.toFixed(3)}" `);
  }

  // ---------- margin column (plate), chart (page) ----------
  const mx = isPlate ? Math.round(colX + 38) : isChart ? 2 : 0;
  const cw = isChart ? 390 : W_COL;
  const title = (y, str) => out.push(text(mx, y, str, { size: 10.5 * T, weight: 600, spacing: 1 }));
  const ns = 10.5, nh = 14;
  const note = (y, str) => out.push(text(mx, y, str, { size: ns, font: SERIF, italic: true, fill: C.pencil }));
  let uy = 0;

  if (isPlate || isChart) {
    // residents per square mile and buses and trains an hour, by 2-mile ring from State & Madison,
    // both as an index (the first ring = 100) on a log scale
    const cs = isChart ? 8 * T : 8;
    if (isPlate) {
      uy = Math.round(labelTop + 10.5 * T * 0.72);
      title(uy, CHART_TITLE.toUpperCase());
      const noteLines = wrap(CHART_NOTE, Math.floor(cw / (ns * 0.45)));
      noteLines.forEach((l, i) => note(uy + (i + 1) * nh + 4, l));
      uy += noteLines.length * nh + 22;
    } else uy = 6;
    const ch = isChart ? 250 : 190;
    const x0 = mx + cs * 2.6, x1 = mx + cw - 4, y0 = uy + ch - 22, y1 = uy + 6;
    const maxMi = Math.ceil((rings.at(-1).ring + 2) / 10) * 10;
    const CX = (m) => x0 + (m / maxMi) * (x1 - x0);
    const lo = Math.log10(0.5), hi = Math.log10(150);
    const CY = (v) => y0 - ((Math.log10(Math.max(v, 0.5)) - lo) / (hi - lo)) * (y0 - y1);
    for (const v of [1, 10, 100]) {
      out.push(`<line x1="${x0}" x2="${x1}" y1="${CY(v).toFixed(1)}" y2="${CY(v).toFixed(1)}" stroke="${C.rule}" stroke-width="0.6"/>`);
      out.push(text(x0 - 4, CY(v) + cs * 0.35, String(v), { size: cs, anchor: 'end', fill: C.pencil }));
    }
    for (let m = 0; m <= maxMi; m += 10) out.push(text(CX(m), y0 + cs + 4, String(m), { size: cs, anchor: 'middle', fill: C.pencil }));
    out.push(text(x1, y0 + 2 * cs + 8, 'MILES FROM STATE & MADISON', { size: cs * 0.85, anchor: 'end', spacing: 0.3, fill: C.pencil }));
    // hover bands: a ring lights its squares on the map
    if (hooks) {
      out.push(`<style>.${uid}-band rect{fill:transparent}.${uid}-band:hover rect,svg.hl .${uid}-band.on rect{fill:${C.rule}}</style>`);
      for (const r of rings) {
        out.push(`<g class="${uid}-band" data-hl="r${r.ring}" data-tip="${r.ring}–${r.ring + 2} miles out" data-name="${r.ring}–${r.ring + 2} miles out" data-shape="none" data-detail="${esc(ringDetail(r))}"><rect x="${CX(r.ring).toFixed(1)}" y="${y1}" width="${(CX(2) - CX(0)).toFixed(1)}" height="${(y0 - y1).toFixed(1)}"/></g>`);
      }
    }
    const half = summary.halfChicagoMile;
    out.push(`<line x1="${CX(half - 1).toFixed(1)}" x2="${CX(half - 1).toFixed(1)}" y1="${y1}" y2="${y0}" stroke="${C.pencil}" stroke-width="0.6" stroke-dasharray="2 2"/>`);
    out.push(text(CX(half - 1) + 4, y1 + cs, 'most residents', { size: cs, fill: C.pencil, italic: true }));
    out.push(text(CX(half - 1) + 4, y1 + 2 * cs + 1, 'outside Chicago', { size: cs, fill: C.pencil, italic: true }));
    const path = (key) => 'M' + rings.map((r) => `${CX(r.ring + 1).toFixed(1)},${CY(r[key]).toFixed(1)}`).join('L');
    out.push(`<path d="${path('dIdx')}" fill="none" stroke="${C.pencil}" stroke-width="1.3" stroke-dasharray="4 2.5"/>`);
    out.push(`<path d="${path('sIdx')}" fill="none" stroke="${C.ink}" stroke-width="1.6"/>`);
    const r24 = rings.find((r) => r.ring === 24);
    out.push(text(CX(25) + 4, CY(r24.dIdx) - 5, 'residents per square mile', { size: cs, fill: C.ink }));
    out.push(text(CX(13) + 5, CY(rings.find((r) => r.ring === 12).sIdx) + 3, 'buses and trains an hour', { size: cs, fill: C.ink }));
    // the far towns: service rises again where an old town centre has its own buses
    const bump = rings.filter((r) => r.ring >= 26).reduce((a, b) => (b.sIdx > a.sIdx ? b : a));
    out.push(`<circle cx="${CX(bump.ring + 1).toFixed(1)}" cy="${CY(bump.sIdx).toFixed(1)}" r="2.2" fill="${C.ink}"/>`);
    out.push(text(CX(bump.ring + 1), CY(bump.sIdx) - 6, bumpTowns(cells, bump.ring), { size: cs, fill: C.ink, anchor: 'middle', halo: C.paper }));
    uy = y0 + 2 * cs + 8;
    if (isChart) {
      return svg(out.join(''), { label: `${CHART_TITLE}: at 25 miles out a square mile has ${Math.round(summary.density25)}% of the core's residents and ${Math.round(summary.service25)}% of its buses and trains.`, viewBox: `0 0 ${cw + 6} ${Math.ceil(uy + 6)}`, align: 'xMinYMin meet' });
    }
  }

  // ---------- inset: the near west ----------
  const midY = (ib.north + ib.south) / 2;
  const lbm = isInset ? { ...ib, north: midY + 7, south: midY - 7 } : ib;
  const iw = isInset ? 390 : W_COL;
  const ki = iw / (lbm.east - lbm.west);
  const ty = uy + 30;
  if (isPlate) {
    title(ty, `INSET · ${INSET_TITLE.toUpperCase()}`);
    note(ty + nh + 4, `Shown at ×${(ki / k).toFixed(1)} the scale of the main map; a line every mile.`);
  }
  const noteLines = isPlate ? wrap(insetNote(data.inset.places), Math.floor(W_COL / (ns * 0.45))) : [];
  noteLines.forEach((l, i) => note(ty + (i + 2) * nh + 4, l));
  const inset = isInset ? { x: 0, y: 0, w: iw, h: Math.round((lbm.north - lbm.south) * ki) } : { x: mx, y: ty + (1 + noteLines.length) * nh + 16, w: iw, h: Math.round((lbm.north - lbm.south) * ki) };
  out.push(`<defs><clipPath id="${uid}-inset"><rect x="${inset.x}" y="${inset.y}" width="${inset.w}" height="${inset.h}"/></clipPath></defs>`);
  out.push(`<rect x="${inset.x}" y="${inset.y}" width="${inset.w}" height="${inset.h}" fill="${C.paper}"/>`);
  const IXm = (m) => inset.x + (m - lbm.west) * ki;
  const IYm = (m) => inset.y + (lbm.north - m) * ki;
  const IX = (x) => IXm(toMiles(x, 'x'));
  const IY = (y) => IYm(toMiles(y, 'y'));
  out.push(`<g clip-path="url(#${uid}-inset)">`);
  if (boundary.length) out.push(`<path d="${city(IX, IY)}" fill="${C.ground}" fill-rule="evenodd"/>`);
  for (let m = Math.ceil(lbm.west); m <= lbm.east; m++) out.push(`<line x1="${IXm(m)}" x2="${IXm(m)}" y1="${inset.y}" y2="${inset.y + inset.h}" stroke="${C.grid}" stroke-width="0.6"/>`);
  for (let m = Math.ceil(lbm.south); m <= lbm.north; m++) out.push(`<line x1="${inset.x}" x2="${inset.x + inset.w}" y1="${IYm(m)}" y2="${IYm(m)}" stroke="${m === 0 ? C.pencil : C.grid}" stroke-width="${m === 0 ? 0.8 : 0.6}"/>`);
  drawCells(cells.filter((c) => c.x >= lbm.west - 1 && c.x <= lbm.east && c.y >= lbm.south - 1 && c.y <= lbm.north), IXm, IYm, ki);
  const sI = isInset ? 1.6 : 1.35;
  const wR = isInset ? 1.8 : 1.4;
  for (const t of data.metra ?? []) out.push(`<path d="${line(t.path, IX, IY)}" fill="none" stroke="${C.pencil}" stroke-width="${wR * 0.7}" stroke-dasharray="${wR * 2.5} ${wR * 1.5}"/>`);
  for (const t of data.rail ?? []) out.push(`<path d="${line(t.path, IX, IY)}" fill="none" stroke="${C.paper}" stroke-width="${wR + 1.6}" stroke-linejoin="round"/><path d="${line(t.path, IX, IY)}" fill="none" stroke="${color ? LINES[t.line] ?? C.ink : C.pencil}" stroke-width="${wR}" stroke-linejoin="round"/>`);
  drawEdge(IX, IY, sI);
  // each place: its name, its people to the square mile and its buses and trains an hour
  const ps = 7.5 * TI;
  // names only, alternately above and below their centre (Cicero and Berwyn are a mile apart);
  // the numbers are in the note (plate) and the tooltips (page)
  data.inset.places.forEach((p, i) => {
    const dy = i % 2 ? ps * 1.6 : -ps * 0.6;
    out.push(text(IXm(p.x), IYm(p.y) + dy, p.name.toUpperCase(), { size: ps * 1.1, weight: 600, anchor: 'middle', spacing: 0.6, halo: C.paper }));
  });
  if (lbm.south < 0 && lbm.north > 0) out.push(text(inset.x + 4, IYm(0) - 3, 'MADISON', { size: 7 * TI, fill: C.ink, weight: 600, halo: C.paper }));
  out.push('</g>');
  if (isPlate) out.push(`<rect x="${inset.x}" y="${inset.y}" width="${inset.w}" height="${inset.h}" fill="none" stroke="${C.ink}" stroke-width="0.8"/>`);

  if (isInset) {
    return svg(out.join(''), { label: `${INSET_TITLE}: ${data.inset.places.map((p) => `${p.name}, ${hundreds(p.density)} residents a square mile, ${p.tph} buses and trains an hour`).join('; ')}.`, viewBox: `0 0 ${inset.w} ${inset.h}`, align: 'xMidYMid slice' })
      .replace('<svg ', `<svg data-ppm="${+ki.toFixed(3)}" data-north="${+lbm.north.toFixed(3)}" `);
  }

  // plate: Findings close the column
  let fy = inset.y + inset.h + 36;
  title(fy, 'FINDINGS');
  for (const l of wrap(data.finding, Math.floor(W_COL / (ns * 0.45)))) note((fy += nh) + 4, l);
  fy += 10;
  const bs = 9.5, bh = 12.6;
  for (const para of data.findings ?? []) {
    for (const l of wrap(para, Math.floor(W_COL / (bs * 0.48)))) out.push(text(mx, (fy += bh), l, { size: bs, font: SERIF }));
    fy += 5;
  }

  // data ledger, under the map
  const lx = fx0;
  let dy = Math.round(fy1) + 34;
  out.push(text(lx, dy, 'DATA LEDGER', { size: 10.5 * T, weight: 600, spacing: 1 }));
  const f = data.feeds;
  const ledger = [
    ['SERVICE', `Schedules from CTA (${f.cta.snapshot}), Metra (${f.metra.snapshot}) and Pace (${f.pace.snapshot}) for ${dayLong(data.serviceDay)}, ${data.window[0]} a.m. to ${data.window[1] - 12} p.m.`],
    ['', 'Each route is counted once, at its busiest stop within ¼ mile of a home (½ mile for trains), in one direction.'],
    ['LINE', `The line surrounds places with ${freqTph} or more buses and trains an hour; areas under ½ square mile are not drawn.`],
    ['', 'Pace On Demand and Dial-a-Ride are booked in advance, so they are not counted.'],
    ['PEOPLE', `The 2020 Census counts ${fmt(summary.residents)} residents in Cook, DuPage, Kane, Lake, McHenry and Will counties.`],
    ['GRID', 'Squares are measured from State & Madison and continue past the city limit; distances are straight lines.'],
    ['LIMITS', 'City of Chicago, Boundaries – City · qqq8-j68g'],
  ];
  dy += 18;
  for (const [kk, v] of ledger) {
    out.push(text(lx, dy, kk, { size: 8.5, fill: C.pencil, spacing: 0.6 }));
    out.push(text(lx + 64, dy, v, { size: 9.5, font: SERIF }));
    dy += 13.5;
  }

  return svg(out.join(''), { label: mapLabel(summary) });
}

export const insetNote = (places) => {
  const p = Object.fromEntries(places.map((d) => [d.name, d]));
  const dens = places.map((d) => d.density);
  const n = (v) => (v >= 10 ? Math.round(v) : v);
  return `All three places have ${hundreds(Math.min(...dens))} to ${hundreds(Math.max(...dens))} people per square mile, but the Chicago side gets ${n(p.Chicago.tph)} buses and trains an hour, Cicero ${n(p.Cicero.tph)} and Berwyn ${n(p.Berwyn.tph)}.`;
};

export const CHART_TITLE = 'From the Loop outward';
export const CHART_NOTE = 'Both lines start at 100 near the Loop, and each step up the scale is ten times the one below. The dashed line shows residents per square mile, and the solid line shows buses and trains an hour.';
export const INSET_TITLE = 'The near west';

const fmt = (n) => Math.round(n).toLocaleString('en-US');
export const hundreds = (n) => fmt(Math.round(n / 100) * 100);
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const dayLong = (iso) => { const d = new Date(`${iso}T12:00:00`); return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; };

// a departure hour (GTFS, may run past 24) as a clock time
export const clock = (h) => {
  const t = Math.round((h % 24) * 60), hh = Math.floor(t / 60) % 24, mm = t % 60;
  const ap = hh < 12 ? 'a.m.' : 'p.m.', h12 = hh % 12 || 12;
  return mm ? `${h12}:${String(mm).padStart(2, '0')} ${ap}` : `${h12} ${ap}`;
};

const span = (m, axis) => {
  const a = axis === 'x' ? [m * 800, (m + 1) * 800] : [m, m + 1].map((v) => (v >= 0 ? v * 800 : v >= -1 ? v * 1200 : -1200 + (v + 1) * 800));
  const f = (v) => formatAddress(v, axis);
  return `${f(Math.min(...a))}–${f(Math.max(...a))}`.replace('STATE', '0').replace('MADISON', '0');
};

export function cellDetail(c) {
  const rows = [`${span(c.x, 'x')} · ${span(c.y, 'y')}`, `About ${hundreds(c.pop)} residents`];
  rows.push(c.tph > 0 ? `${c.tph >= 10 ? Math.round(c.tph) : c.tph.toFixed(1)} buses and trains an hour each way` : 'No bus or train stops within reach');
  if (c.last != null && c.tph > 0) rows.push(`Last departure nearby, on average: ${clock(c.last)}`);
  if (c.tph > 0) rows.push(c.freq >= 0.995 ? 'All its residents have a bus or train every 15 minutes' : c.freq > 0.005 ? `${Math.round(c.freq * 100)}% of its residents have a bus or train every 15 minutes` : 'No resident has a bus or train every 15 minutes');
  return rows.join('|');
}

export function ringDetail(r) {
  return [`About ${hundreds(r.density)} residents a square mile`, `${r.tph >= 10 ? Math.round(r.tph) : r.tph.toFixed(1)} buses and trains an hour each way`, `${Math.round(r.chicagoShare * 100)}% of its residents in Chicago`].join('|');
}

// the largest towns outside Chicago, by residents in the squares they hold most of
export function towns(cells, n) {
  const by = new Map();
  for (const c of cells) {
    if (c.chicago || c.where.startsWith('Unincorporated')) continue;
    const t = by.get(c.where) ?? { name: c.where, pop: 0, x: 0, y: 0 };
    t.pop += c.pop; t.x += (c.x + 0.5) * c.pop; t.y += (c.y + 0.5) * c.pop;
    by.set(c.where, t);
  }
  return [...by.values()].sort((a, b) => b.pop - a.pop).slice(0, n).map((t) => ({ ...t, x: t.x / t.pop, y: t.y / t.pop }));
}

function bumpTowns(cells, ring) {
  const ts = towns(cells.filter((c) => c.ring === ring), 3).map((t) => t.name);
  return ts.length < 2 ? ts.join('') : `${ts.slice(0, -1).join(', ')} and ${ts.at(-1)}`;
}

const mapLabel = (s) =>
  `Plate IX, Where the Grid Frays: every square mile of the six-county Chicago region, its residents and its buses and trains an hour. Among square miles of 5,000 to 10,000 residents, half of Chicago's have ${s.chicagoMedian} or more an hour; half of the suburbs' have ${s.suburbMedian} or fewer.`;

// the bivariate key, square: the diamond of the study turned 45 degrees anticlockwise. Residents rise
// upward, service to the left, so few residents and little service is the bottom-right cell.
// (x, y): the key's left edge and bottom edge.
export function squareKey(pal, x, y, s, T = 1.15) {
  const out = [];
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
    const cx = x + (3 - j) * s, cy = y - (i + 1) * s;
    out.push(`<rect x="${cx.toFixed(1)}" y="${cy.toFixed(1)}" width="${s}" height="${s}" fill="${pal.bivar ? pal.bivar[i][j] : pal.tones[i]}" stroke="${C.paper}" stroke-width="0.6"/>`);
    if (pal.tones && pal.sizes[j] > 0) {
      const f = pal.sizes[j] * s * 0.8;
      out.push(`<rect x="${(cx + (s - f) / 2).toFixed(1)}" y="${(cy + (s - f) / 2).toFixed(1)}" width="${f.toFixed(1)}" height="${f.toFixed(1)}" fill="${C.ink}"/>`);
    }
  }
  const ts = 7.5 * T, o = 4, r = x + 4 * s;
  // residents: breaks up the right edge, title turned up beside them
  POP_BREAKS.forEach((v, k) => out.push(text(r + o, y - (k + 1) * s + ts * 0.35, `${v / 1000}k`, { size: ts, fill: C.pencil, anchor: 'start' })));
  out.push(text(r + o + ts * 2.9, y - 2 * s, 'RESIDENTS / SQ MI', { size: ts, weight: 600, spacing: 0.3, rotate: -90, anchor: 'middle' }));
  // service: breaks under the bottom edge (rising to the left), title below them
  SVC_BREAKS.forEach((v, k) => out.push(text(x + (3 - k) * s, y + o + ts, String(v), { size: ts, fill: C.pencil, anchor: 'middle' })));
  out.push(text(x, y + o + 2.3 * ts, 'BUSES + TRAINS / HR', { size: ts, weight: 600, spacing: 0.3, anchor: 'start' }));
  return out.join('');
}
