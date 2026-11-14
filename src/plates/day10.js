// Plate X · The Line Printer · Day 10 Prompting only
import { C, LINES, SERIF, SANS, esc, text, textWidth, legendBox, wrap, frame, svg } from '../lib/plate.js';
import { formatAddress, gridLines, toMiles } from '../lib/grid.js';

// variant 'plate': the full 1080 x 1350 plate (export, download).
// variant 'map': the map alone, with hover hooks on the stations, for the day page's left column.
// variant 'chart': the nine sides as printed bars, with hover hooks.
// variant 'inset': the inset alone, drawn tall so the page can crop it, a hover hook on every block.
// The city printed as a line printer would print it (after SYMAP, 1963–66): one character per block,
// an eighth of a mile on the address grid (data.rows: per row of blocks, a string of classes '0'–'6',
// ' ' = blank). The class is the minutes until a rider is moving at 9 p.m.: a step-free walk at
// 3 ft/s to the best bus or accessible-station train within four blocks, plus half its headway.
// Tone comes from overprinting: the darker classes strike two or four characters on one cell.
export const RAMP = [['.'], [':'], ['='], ['O'], ['O', '-'], ['O', 'X'], ['O', 'X', 'A', 'V']];
export const SHORT = ['under 7½', '7½–10', '10–12½', '12½–15', '15–20', 'over 20', 'none within 4 blocks'];
const W_COL = 300;
const CELL = 1 / 8; // miles

export function renderDay10(data, { mode = 'gray', variant = 'plate' } = {}) {
  const { rows, sides, summary, stations, boundary = [] } = data;
  const out = [];
  const isPlate = variant === 'plate';
  const isMap = variant === 'map';
  const isChart = variant === 'chart';
  const isInset = variant === 'inset';
  const hooks = isMap || isChart || isInset;
  const uid = `d10-${variant}-${mode}`;
  const T = isMap || isChart ? 1.3 : 1.15;
  const TI = isInset ? 1.35 : 1.15;
  const color = mode === 'color';
  const ring = (r, fx, fy) => 'M' + r.map(([x, y]) => `${fx(x).toFixed(1)},${fy(y).toFixed(1)}`).join('L') + 'Z';
  const city = (fx, fy) => boundary.map((r) => ring(r, fx, fy)).join('');

  // ---------- the printer: rows of characters, one <text> per row and layer ----------
  // Xm, Ym: miles to px; px: px per mile; box: miles to draw (with a cell's margin)
  const print = (Xm, Ym, px, box) => {
    const cell = px * CELL, fs = cell * 1.3;
    const g = [`<g font-family="${SANS}" font-size="${fs.toFixed(2)}" fill="${C.ink}" text-anchor="middle" aria-hidden="true">`];
    for (const r of rows) {
      const n = (r.row + 0.5) * CELL;
      if (n < box.south - CELL || n > box.north + CELL) continue;
      const y = (Ym(n) + fs * 0.36).toFixed(1);
      const layers = [[], [], [], []];
      for (let i = 0; i < r.s.length; i++) {
        const ch = r.s[i];
        if (ch === ' ') continue;
        const e = (r.col + i + 0.5) * CELL;
        if (e < box.west - CELL || e > box.east + CELL) continue;
        RAMP[+ch].forEach((glyph, l) => layers[l].push([Xm(e).toFixed(1), glyph]));
      }
      for (const l of layers) if (l.length) g.push(`<text x="${l.map((d) => d[0]).join(' ')}" y="${y}">${esc(l.map((d) => d[1]).join(''))}</text>`);
    }
    g.push('</g>');
    out.push(g.join(''));
  };

  // a station: a cased dot, ink (or its line's color) when accessible, hollow when not
  const station = (s, x, y, r) => {
    const c = color && s.lines.length === 1 ? LINES[s.lines[0]] ?? C.ink : C.ink;
    const m = s.ada
      ? `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${c}" stroke="${C.paper}" stroke-width="${(r * 0.6).toFixed(2)}" paint-order="stroke"/>`
      : `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${C.paper}" stroke="${c}" stroke-width="${(r * 0.4).toFixed(2)}"/>`;
    if (!hooks) return m;
    const hit = `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${Math.max(r * 1.8, 5)}" fill="transparent"/>`;
    return `<g data-id="${s.id}" data-tip="${esc(s.short)}" data-name="${esc(s.short)}" data-lines="${s.lines.join(' ')}" data-ada="${s.ada ? 1 : 0}" data-keys="${s.lines.join(' ')} ${s.id}" data-detail="${esc(s.ada ? 'Accessible: counted, if its trains are the quickest ride' : 'Not accessible: not counted')}">${hit}${m}</g>`;
  };

  if (isPlate) out.push(frame({
    plate: 'X',
    chapter: 'THE SYSTEMS',
    day: 10,
    theme: 'Prompting only',
    title: 'The Line Printer',
    subtitle: 'At nine at night, how long until a rider who cannot take the stairs is moving? One character per block.',
  }));

  // ---------- main map: the whole city ----------
  const ext = data.extent; // miles, on grid lines
  const extA = { west: ext.west * 800, east: ext.east * 800, south: addrY(ext.south), north: addrY(ext.north) };
  const field = isMap ? { x: 60, y: 250, w: 760, h: 1040 } : { x: 60, y: 262, w: 575, h: 830 };
  const k = Math.min(field.w / (ext.east - ext.west), field.h / (ext.north - ext.south));
  const Xm = (m) => field.x + (m - ext.west) * k;
  const Ym = (m) => field.y + (ext.north - m) * k;
  const X = (x) => Xm(toMiles(x, 'x'));
  const Y = (y) => Ym(toMiles(y, 'y'));
  const fx0 = Xm(ext.west), fx1 = Xm(ext.east), fy0 = Ym(ext.north), fy1 = Ym(ext.south);
  const gl = 8 * T;
  const labelLen = 7 * (gl * 0.6 + 0.4);
  const colX = fx1 + 6 + labelLen;
  const labelTop = fy0 - 6 - labelLen;
  const ib = data.inset.box;
  const rMap = isMap ? 2.3 : 1.9;

  if (isPlate || isMap) {
    const g = gridLines(extA);
    out.push(`<defs><clipPath id="${uid}-map"><rect x="${fx0}" y="${fy0}" width="${fx1 - fx0}" height="${fy1 - fy0}"/></clipPath></defs>`);
    out.push(`<g clip-path="url(#${uid}-map)">`);
    if (boundary.length) out.push(`<path d="${city(X, Y)}" fill="${C.ground}" fill-rule="evenodd"/>`);
    for (const x of g.xs) out.push(`<line x1="${X(x)}" x2="${X(x)}" y1="${fy0}" y2="${fy1}" stroke="${x === 0 ? C.pencil : C.grid}" stroke-width="${x === 0 ? 0.8 : 0.5}"/>`);
    for (const y of g.ys) out.push(`<line x1="${fx0}" x2="${fx1}" y1="${Y(y)}" y2="${Y(y)}" stroke="${y === 0 ? C.pencil : C.grid}" stroke-width="${y === 0 ? 0.8 : 0.5}"/>`);
    print(Xm, Ym, k, ext);
    for (const s of [...stations].sort((a, b) => a.ada - b.ada)) out.push(station(s, X(s.x), Y(s.y), rMap));
    out.push(`<rect${hooks ? ` data-inset-frame data-y0="${+Ym(0).toFixed(2)}"` : ''} x="${Xm(ib.west)}" y="${Ym(ib.north)}" width="${(ib.east - ib.west) * k}" height="${(ib.north - ib.south) * k}" fill="none" stroke="${C.ink}" stroke-width="0.7" stroke-dasharray="2 2"/>`);
    out.push('</g>');
    const gridLabel = (v) => (v === 0 ? { fill: C.ink, weight: 600 } : { fill: C.pencil });
    for (const x of g.xs) out.push(text(X(x) + gl * 0.35, labelTop, formatAddress(x, 'x'), { size: gl, spacing: 0.4, rotate: -90, anchor: 'end', ...gridLabel(x) }));
    for (const y of g.ys) out.push(text(colX, Y(y) + gl * 0.35, formatAddress(y, 'y'), { size: gl, spacing: 0.4, anchor: 'end', ...gridLabel(y) }));

    // mile ruler: four cells from the second grid line, in the bottom row
    const rx = Xm(ext.west + 1), ry = fy1 - k * 0.35;
    out.push(`<line x1="${rx}" x2="${rx + 4 * k}" y1="${ry}" y2="${ry}" stroke="${C.ink}" stroke-width="1.2"/>`);
    for (let i = 0; i <= 4; i++) out.push(`<line x1="${rx + i * k}" x2="${rx + i * k}" y1="${ry - (i % 4 === 0 ? 6 : 4)}" y2="${ry}" stroke="${C.ink}" stroke-width="1.2"/>`);
    out.push(text(rx, ry - 9, '0', { size: 7.5 * T, anchor: 'middle' }));
    out.push(text(rx + 4 * k, ry - 9, '4 MI', { size: 7.5 * T, anchor: 'middle' }));

    // legend: the ramp, struck as on the map
    const lgs = 9 * T;
    const dot = (ada) => station({ ada, lines: [] , id: '', short: '' }, 0, 0, 3.2).replace(/<g[^>]*>|<\/g>|<circle[^>]*fill="transparent"\/>/g, '');
    if (isPlate) {
      let lx = 60;
      const y = 203;
      const lead = 'Minutes until moving:';
      out.push(text(lx, y, lead, { size: lgs, fill: C.pencil }));
      lx += textWidth(lead, lgs) + 8;
      SHORT.forEach((lab, i) => {
        out.push(glyphs(RAMP[i], lx + 5, y, lgs * 1.15));
        out.push(text(lx + 13, y, i === 6 ? 'none near' : lab, { size: lgs, fill: C.pencil }));
        lx += 13 + textWidth(i === 6 ? 'none near' : lab, lgs) + 9;
      });
      out.push(`<g transform="translate(${lx + 4} ${y - lgs * 0.35})">${dot(true)}</g>`);
      out.push(text(lx + 12, y, 'accessible', { size: lgs, fill: C.pencil }));
      lx += 12 + textWidth('accessible', lgs) + 9;
      out.push(`<g transform="translate(${lx + 4} ${y - lgs * 0.35})">${dot(false)}</g>`);
      out.push(text(lx + 12, y, 'not', { size: lgs, fill: C.pencil }));
    } else {
      const items = [
        ['head', 'Minutes until moving at 9 p.m.'],
        ...SHORT.map((lab, i) => [glyphs(RAMP[i], 0, lgs * 0.4, lgs * 1.25), i === 6 ? 'Nothing within four blocks' : `${lab} minutes`]),
        ['gap'],
        [dot(true), 'Accessible ‘L’ station'],
        [dot(false), 'Not accessible: not counted'],
      ];
      out.push(legendBox(items, { x: rx, bottom: fy1 - k, k, size: lgs }));
    }
  }

  if (isMap) {
    return svg(out.join(''), { label: mapLabel(summary), viewBox: `60 184 ${Math.ceil(colX + 4 - 60)} 1114`, align: 'xMinYMin meet' })
      .replace('<svg ', `<svg data-top="${labelTop - 184}" data-bottom="${fy1 - 184}" data-ftop="${+(fy0 - 184).toFixed(2)}" data-ppm="${+k.toFixed(3)}" `);
  }

  // ---------- margin column (plate), chart (page) ----------
  const mx = isPlate ? Math.round(colX + 38) : 0;
  const cw = isChart ? 390 : W_COL;
  const title = (y, str) => out.push(text(mx, y, str, { size: 10.5 * T, weight: 600, spacing: 1 }));
  const ns = 10.5, nh = 14;
  const note = (y, str) => out.push(text(mx, y, str, { size: ns, font: SERIF, italic: true, fill: C.pencil }));
  let uy = 0;

  if (isPlate || isChart) {
    // each side's residents as a bar of 50 characters, 2% each, light to dark
    const cs = isChart ? 8 * T : 8;
    if (isPlate) {
      uy = Math.round(labelTop + 10.5 * T * 0.72);
      title(uy, CHART_TITLE.toUpperCase());
      const noteLines = wrap(CHART_NOTE, Math.floor(cw / (ns * 0.45)));
      noteLines.forEach((l, i) => note(uy + (i + 1) * nh + 4, l));
      uy += noteLines.length * nh + 20;
    } else uy = 4;
    const N = 50, cellW = cw / N, rowH = cs * 3.2;
    for (const s of sides) {
      const counts = shares(s.mix, N);
      const y0 = uy + cs;
      const gs = [];
      if (hooks) gs.push(`<g data-tip="${esc(s.side)}" data-name="${esc(s.side)}" data-shape="none" data-detail="${esc(sideDetail(s))}"><rect x="${mx}" y="${uy - 2}" width="${cw}" height="${rowH}" fill="transparent"/>`);
      gs.push(text(mx, y0, s.side.toUpperCase(), { size: cs, weight: 500, spacing: 0.4 }));
      gs.push(text(mx + cw, y0, `${Math.round(s.over15 * 100)}% over 15 min`, { size: cs, anchor: 'end', fill: C.pencil }));
      const by = y0 + cs * 1.5;
      const layers = [[], [], [], []];
      let i = 0;
      counts.forEach((n, kk) => { for (let j = 0; j < n; j++, i++) RAMP[kk].forEach((g, l) => layers[l].push([(mx + (i + 0.5) * cellW).toFixed(1), g])); });
      for (const l of layers) if (l.length) gs.push(`<text x="${l.map((d) => d[0]).join(' ')}" y="${by.toFixed(1)}" font-family="${SANS}" font-size="${(cellW * 1.25).toFixed(2)}" fill="${C.ink}" text-anchor="middle">${esc(l.map((d) => d[1]).join(''))}</text>`);
      if (hooks) gs.push('</g>');
      out.push(gs.join(''));
      uy += rowH;
    }
    if (isChart) {
      return svg(out.join(''), { label: `${CHART_TITLE}: the share of residents more than 15 minutes from moving runs from ${pctOf(sides, 'min')} on the ${sideMin(sides)} to ${pctOf(sides, 'max')} on the ${sideMax(sides)}.`, viewBox: `0 0 ${cw + 2} ${Math.ceil(uy + 2)}`, align: 'xMinYMin meet' });
    }
  }

  // ---------- inset: Beverly to Roseland ----------
  const midY = (ib.north + ib.south) / 2;
  const lbm = isInset ? { ...ib, north: midY + 7, south: midY - 7 } : ib;
  const iw = isInset ? 390 : W_COL;
  const ki = iw / (lbm.east - lbm.west);
  const ty = uy + 26;
  if (isPlate) {
    title(ty, `INSET · ${data.inset.title.toUpperCase()}`);
    note(ty + nh + 4, `Shown at ×${(ki / k).toFixed(1)} the scale of the main map; a line every mile.`);
  }
  const inset = isInset ? { x: 0, y: 0, w: iw, h: Math.round((lbm.north - lbm.south) * ki) } : { x: mx, y: ty + nh + 14, w: iw, h: Math.round((lbm.north - lbm.south) * ki) };
  out.push(`<defs><clipPath id="${uid}-inset"><rect x="${inset.x}" y="${inset.y}" width="${inset.w}" height="${inset.h}"/></clipPath></defs>`);
  out.push(`<rect x="${inset.x}" y="${inset.y}" width="${inset.w}" height="${inset.h}" fill="${C.paper}"/>`);
  const IXm = (m) => inset.x + (m - lbm.west) * ki;
  const IYm = (m) => inset.y + (lbm.north - m) * ki;
  const IX = (x) => IXm(toMiles(x, 'x'));
  const IY = (y) => IYm(toMiles(y, 'y'));
  out.push(`<g clip-path="url(#${uid}-inset)">`);
  if (boundary.length) out.push(`<path d="${city(IX, IY)}" fill="${C.ground}" fill-rule="evenodd"/>`);
  for (let m = Math.ceil(lbm.west); m <= lbm.east; m++) out.push(`<line x1="${IXm(m)}" x2="${IXm(m)}" y1="${inset.y}" y2="${inset.y + inset.h}" stroke="${m === 0 ? C.pencil : C.grid}" stroke-width="${m === 0 ? 0.8 : 0.6}"/>`);
  for (let m = Math.ceil(lbm.south); m <= lbm.north; m++) out.push(`<line x1="${inset.x}" x2="${inset.x + inset.w}" y1="${IYm(m)}" y2="${IYm(m)}" stroke="${C.grid}" stroke-width="0.6"/>`);
  print(IXm, IYm, ki, lbm);
  const inI = (s) => toMiles(s.x, 'x') >= lbm.west && toMiles(s.x, 'x') <= lbm.east && toMiles(s.y, 'y') >= lbm.south && toMiles(s.y, 'y') <= lbm.north;
  for (const s of stations.filter(inI)) out.push(station(s, IX(s.x), IY(s.y), isInset ? 5 : 4.2));
  if (hooks) out.push(blockHooks(data.inset, IXm, IYm, ki, lbm));
  out.push('</g>');
  // the bus streets that print pale, named beside their rows: in the margin on the plate, inside on the page
  const ss = 7 * TI;
  for (const [addr, name] of INSET_STREETS) {
    const m = toMiles(addr, 'y');
    if (m < lbm.south + 0.1 || m > lbm.north - 0.1) continue;
    if (isPlate) out.push(text(inset.x + inset.w + 3, IYm(m) + 2.3, name, { size: 6.5, fill: C.pencil, spacing: 0.2 }));
    else out.push(text(inset.x + 4, IYm(m) + ss * 0.35, name, { size: ss, weight: 600, spacing: 0.5, halo: C.paper }));
  }
  if (isPlate) out.push(`<rect x="${inset.x}" y="${inset.y}" width="${inset.w}" height="${inset.h}" fill="none" stroke="${C.ink}" stroke-width="0.8"/>`);

  if (isInset) {
    return svg(out.join(''), { label: `${data.inset.title}: block by block, the minutes until moving at 9 p.m.; the bus streets print pale, the blocks between them darker.`, viewBox: `0 0 ${inset.w} ${inset.h}`, align: 'xMidYMid slice' })
      .replace('<svg ', `<svg data-ppm="${+ki.toFixed(3)}" data-north="${+lbm.north.toFixed(3)}" `);
  }

  // plate: Findings close the column
  let fy = inset.y + inset.h + 34;
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
  const ledger = [
    ['SERVICE', `CTA schedule (GTFS) of ${data.gtfs.snapshot}, ${dayLong(data.serviceDay)}, departures 8:30–9:30 p.m.; trains only at accessible stations.`],
    ['WALK', 'Step-free (no stairs) on OpenStreetMap, from each block’s centre to each route’s nearest stop within four blocks (½ mi),'],
    ['', 'at 3 ft/s, the MUTCD speed for timing a whole signal crossing. Plus half the time between buses or trains at that stop.'],
    ['PRINT', 'One character per block of ⅛ mile from State & Madison; tone by overprinting, after SYMAP (Fisher and Benson; Northwestern 1963, Harvard 1966).'],
    ['PEOPLE', `2020 Census: ${fmt(summary.residents)} residents, by their block’s internal point. Blank: no walkway within 100 m.`],
    ['MADE', 'From start to finish in a command-line session with an AI assistant; the prompts are published with the notebook.'],
  ];
  dy += 18;
  for (const [kk, v] of ledger) {
    out.push(text(lx, dy, kk, { size: 8.5, fill: C.pencil, spacing: 0.6 }));
    out.push(text(lx + 64, dy, v, { size: 9.5, font: SERIF }));
    dy += 13.5;
  }

  return svg(out.join(''), { label: mapLabel(summary) });
}

// a ramp entry's characters struck on one spot (legend swatches)
export function glyphs(chars, x, y, size) {
  return chars.map((g) => `<text x="${x}" y="${y}" font-family="${SANS}" font-size="${size}" fill="${C.ink}" text-anchor="middle">${esc(g)}</text>`).join('');
}

// every inset block a hover target: its address, its minutes, the walk and the wait
function blockHooks(inset, IXm, IYm, ki, box) {
  const s = ki * CELL;
  const g = [];
  for (const [col, row, t, walkMin, every, ri] of inset.cells) {
    const e = (col + 0.5) * CELL, n = (row + 0.5) * CELL;
    if (e < box.west || e > box.east || n < box.south || n > box.north) continue;
    const k = t == null ? 6 : classOf(t);
    const rows = t == null
      ? ['No bus or accessible train within four blocks at 9 p.m.']
      : [`${minutes(t)} until moving`, `${minutes(walkMin)} step-free walk to ${inset.routes[ri]}`, `then a ${ri != null && inset.routes[ri].endsWith('Line') ? 'train' : 'bus'} every ${minutes(every)}`];
    g.push(`<rect x="${(IXm(e) - s / 2).toFixed(1)}" y="${(IYm(n) - s / 2).toFixed(1)}" width="${s.toFixed(1)}" height="${s.toFixed(1)}" fill="transparent" data-tip="${esc(blockName(col, row))}" data-name="${esc(blockName(col, row))}" data-shape="glyph" data-glyph="${RAMP[k].join('')}" data-detail="${esc(rows.join('|'))}"/>`);
  }
  return g.join('');
}

export const BREAKS = [7.5, 10, 12.5, 15, 20];
export const classOf = (t) => BREAKS.filter((b) => t > b).length;
const minutes = (v) => (v < 10 ? `${(Math.round(v * 2) / 2).toString().replace('.5', '½')} min` : `${Math.round(v)} min`);
// miles north -> address
export const addrY = (m) => (m >= 0 ? m * 800 : m >= -1 ? m * 1200 : -1200 + (m + 1) * 800);
// the block's address range, as a resident would say it: '9500 S block, 3100–3200 W'
export function blockName(col, row) {
  const x0 = col * 100, x1 = (col + 1) * 100;
  const y0 = addrY(row * CELL), y1 = addrY((row + 1) * CELL);
  const ax = `${Math.abs(Math.min(Math.abs(x0), Math.abs(x1)))}–${Math.max(Math.abs(x0), Math.abs(x1))} ${x1 <= 0 ? 'W' : 'E'}`;
  const ay = `${Math.round(Math.min(Math.abs(y0), Math.abs(y1)))}–${Math.round(Math.max(Math.abs(y0), Math.abs(y1)))} ${y1 <= 0 ? 'S' : 'N'}`;
  return `${ay} · ${ax}`;
}

// largest-remainder shares of n characters
export function shares(mix, n) {
  const raw = mix.map((v) => v * n);
  const base = raw.map(Math.floor);
  let left = n - base.reduce((a, b) => a + b, 0);
  const order = raw.map((v, i) => [v - Math.floor(v), i]).sort((a, b) => b[0] - a[0]);
  for (const [, i] of order) { if (left <= 0) break; base[i]++; left--; }
  return base;
}

export function sideDetail(s) {
  return [`${fmt(s.pop)} residents`, `Half are ${s.median.toFixed(1)} minutes or more from moving`, `${Math.round(s.over15 * 100)}% more than 15 minutes`].join('|');
}
const sideMin = (sides) => sides.reduce((a, b) => (b.over15 < a.over15 ? b : a)).side;
const sideMax = (sides) => sides.reduce((a, b) => (b.over15 > a.over15 ? b : a)).side;
const pctOf = (sides, f) => `${Math.round(Math[f](...sides.map((s) => s.over15)) * 100)}%`;

export const CHART_TITLE = 'The nine sides';
export const CHART_NOTE = 'Each side’s residents as fifty characters, 2% each, printed light to dark by their minutes until moving.';
export const INSET_STREETS = [[-8700, '87TH'], [-9500, '95TH'], [-10300, '103RD'], [-11100, '111TH'], [-11500, '115TH']];

const fmt = (n) => Math.round(n).toLocaleString('en-US');
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const dayLong = (iso) => { const d = new Date(`${iso}T12:00:00`); return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; };

const mapLabel = (s) =>
  `Plate X, The Line Printer: Chicago printed one character per block, darker where a rider who cannot take the stairs waits longer to be moving at 9 p.m. Half of residents are ${s.median.toFixed(1)} minutes or more from moving.`;
