// Plate XII · Who Fixes the Sidewalk · Day 12 Power
import { C, SERIF, esc, text, textWidth, legendBox, wrap, frame, svg } from '../lib/plate.js';
import { gridLines, formatAddress, toMiles } from '../lib/grid.js';

// variant 'plate': the full 1080 x 1350 plate (export, download).
// variant 'map': the map alone, with hover hooks, for the day page's left column.
// variant 'chart': the fifty wards' menu money, row by row, with hover hooks.
// variant 'inset': the two small maps (complaints, shared-cost applications), with hover hooks.
// The fifty wards of 2015-2023, each drawn a quarter farther from State & Madison than it lies, so
// the city reads as fifty pieces over one grid. Tone = the share of the ward's menu money spent on
// sidewalks and crossings, 2019-2022; marks = those projects (a dot per address, a line per street
// segment). The inset repeats the city twice, unexploded: 311 sidewalk inspection requests and
// Shared Cost Sidewalk Program applications per 1,000 residents, in quintiles. Wards stay gray in
// color mode; the chart's categories take hue.
export const W_COL = 300;
export const CHART_TITLE = 'Fifty wards, fifty choices';
export const CHART_NOTE = 'Each ward’s menu money, 2019–22, as one bar, sorted by the share on sidewalks and crossings · Right: per 1,000 residents, 311 sidewalk requests ● and shared-cost applications ○';
export const INSET_TITLE = 'The complaint and the wallet';
export const TONES = ['#E4E2DC', '#C9C7C0', '#A3A19A', '#6F6D67', '#3A3936'];
export const CLASS_LABELS = ['under 2½%', '2½–7½%', '7½–12½%', '12½–20%', '20% or more'];
const CATS = ['sidewalks', 'crossings', 'streets', 'lights', 'cameras', 'other'];
const CAT_LABEL = { sidewalks: 'Sidewalks', crossings: 'Crossings', streets: 'Streets, alleys', lights: 'Lights, signals', cameras: 'Cameras', other: 'Other' };
const CAT_GRAY = { sidewalks: C.ink, crossings: '#5F5D58', streets: C.fog, lights: '#9C9A93', cameras: 'hatch', other: C.ground };
const CAT_COLOR = { sidewalks: '#1D5B45', crossings: '#6FA287', streets: C.fog, lights: '#D5B66D', cameras: '#9B3D2E', other: C.ground };
const DOT_MAX = 32; // per 1,000 residents, the chart's dot scale (ticks at 0, 10, 20, 30)

const fmt = (n) => Math.round(n).toLocaleString('en-US');
const money = (v) => (v >= 1e6 ? `$${(v / 1e6).toFixed(1)} million` : `$${fmt(v / 1000)},000`);
const pct = (v) => `${Math.round(v * 100)}%`;

export function wardDetail(w, years) {
  const top = [...CATS].sort((a, b) => w[b] - w[a])[0];
  return [
    `Menu money ${years[0]}–${String(years[1]).slice(2)}: ${money(w.total)}; sidewalks and crossings ${pct(w.share)}${top !== 'sidewalks' ? `, ${CAT_LABEL[top].toLowerCase()} ${pct(w[top] / w.total)}` : ''}`,
    `311 sidewalk requests: ${fmt(w.filed)} filed (${w.filed1k.toFixed(1)} per 1,000 residents)`,
    `Open today: ${fmt(w.open)}, ${fmt(w.open3)} of them for three years or more`,
    `Half closed within ${fmt(w.closeDays)} days`,
    `Shared-cost applications: ${fmt(w.shared)} (${w.shared1k.toFixed(1)} per 1,000)`,
    `${fmt(w.pop)} residents, about ${fmt(w.amb)} with a difficulty walking`,
  ].join('|');
}

export function renderDay12(data, { mode = 'gray', variant = 'plate' } = {}) {
  const { wards, lines = [], ticks = [], summary } = data;
  const years = summary.years;
  const out = [];
  const isPlate = variant === 'plate';
  const isMap = variant === 'map';
  const isChart = variant === 'chart';
  const isInset = variant === 'inset';
  const hooks = isMap || isChart || isInset;
  const uid = `d12-${variant}-${mode}`;
  const T = isMap || isChart ? 1.3 : 1.15;
  const color = mode === 'color';
  const CAT = color ? CAT_COLOR : CAT_GRAY;
  const byWard = new Map(wards.map((w) => [w.ward, w]));

  const hatch = `<defs><pattern id="${uid}-h" width="2.4" height="2.4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="2.4" height="2.4" fill="${C.paper}"/><line x1="0" y1="0" x2="0" y2="2.4" stroke="${C.ink}" stroke-width="0.7"/></pattern></defs>`;
  out.push(hatch);
  const catFill = (c) => (CAT[c] === 'hatch' ? `url(#${uid}-h)` : CAT[c]);
  if (hooks) out.push(`<style>.${uid}-w .tint{fill-opacity:0;transition:fill-opacity .12s}.${uid}-w:hover .tint,svg.hl .${uid}-w.on .tint{fill-opacity:.14}.${uid}-row .bg{transition:fill .12s}.${uid}-row:hover .bg,svg.hl .${uid}-row.on .bg{fill:${C.rule}}</style>`);

  // a ward piece: its tone, a tint for hover, and the hover hooks
  const ring = (r, fx, fy) => 'M' + r.map(([x, y]) => `${fx(x).toFixed(1)},${fy(y).toFixed(1)}`).join('L') + 'Z';
  const piece = (w, fx, fy, fill, gap = 0) => {
    const d = w.rings.map((r) => ring(r, fx, fy)).join('');
    const st = gap ? ` stroke="${C.paper}" stroke-width="${gap}" stroke-linejoin="round"` : '';
    const body = `<path d="${d}" fill="${fill}" fill-rule="evenodd"${st}/>`;
    if (!hooks) return body;
    return `<g class="${uid}-w" data-id="w${w.ward}" data-kind="area" data-tip="Ward ${w.ward}" data-name="Ward ${w.ward}" data-lines="" data-shape="tile" data-fill="${fill}" data-size="1" data-frac="0" data-keys="w${w.ward}" data-detail="${esc(wardDetail(w, years))}">${body}<path class="tint" d="${d}" fill="${C.ink}" fill-rule="evenodd"/></g>`;
  };

  if (isPlate) out.push(frame({
    plate: 'XII',
    chapter: 'THE SYSTEMS',
    day: 12,
    theme: 'Power',
    title: 'Who Fixes the Sidewalk',
    subtitle: 'Fifty aldermen, the same money each. How much went to the sidewalks, and who asks the city instead?',
  }));

  // ---------- main map: the exploded city ----------
  const ext = { west: -16000, east: 5600, south: -16400, north: 9600 };
  const mi = { west: toMiles(ext.west, 'x'), east: toMiles(ext.east, 'x'), south: toMiles(ext.south, 'y'), north: toMiles(ext.north, 'y') };
  const field = isMap ? { x: 60, y: 250, w: 860, h: 1040 } : { x: 60, y: 262, w: 575, h: 830 };
  const k = Math.min(field.w / (mi.east - mi.west), field.h / (mi.north - mi.south));
  const Xm = (m) => field.x + (m - mi.west) * k;
  const Ym = (m) => field.y + (mi.north - m) * k;
  const X = (x) => Xm(toMiles(x, 'x'));
  const Y = (y) => Ym(toMiles(y, 'y'));
  const fx0 = X(ext.west), fx1 = X(ext.east), fy0 = Y(ext.north), fy1 = Y(ext.south);
  const g = gridLines(ext);
  const gl = 8 * T;
  const labelLen = 7 * (gl * 0.6 + 0.4);
  const colX = fx1 + 6 + labelLen;
  const labelTop = fy0 - 6 - labelLen;

  if (isPlate || isMap) {
    for (const x of g.xs) out.push(`<line x1="${X(x)}" x2="${X(x)}" y1="${fy0}" y2="${fy1}" stroke="${x === 0 ? C.pencil : C.grid}" stroke-width="${x === 0 ? 0.8 : 0.6}"/>`);
    for (const y of g.ys) out.push(`<line x1="${fx0}" x2="${fx1}" y1="${Y(y)}" y2="${Y(y)}" stroke="${y === 0 ? C.pencil : C.grid}" stroke-width="${y === 0 ? 0.8 : 0.6}"/>`);
    // each ward moved by its own offset (grid miles)
    const WX = (w) => (x) => Xm(toMiles(x, 'x') + w.dx);
    const WY = (w) => (y) => Ym(toMiles(y, 'y') + w.dy);
    for (const w of wards) out.push(piece(w, WX(w), WY(w), TONES[w.cls]));
    // projects: ink on the lighter tones, paper on the two darkest
    const rDot = isMap ? 0.95 : 0.75;
    const marks = { ink: [], paper: [] };
    for (const [wn, p] of lines) {
      const w = byWard.get(wn); if (!w) continue;
      const fx = WX(w), fy = WY(w);
      marks[w.cls >= 3 ? 'paper' : 'ink'].push('M' + p.map(([x, y]) => `${fx(x).toFixed(1)},${fy(y).toFixed(1)}`).join('L'));
    }
    for (const [wn, x, y] of ticks) {
      const w = byWard.get(wn); if (!w) continue;
      marks[w.cls >= 3 ? 'paper' : 'ink'].push(`M${WX(w)(x).toFixed(1)} ${WY(w)(y).toFixed(1)}h0.01`);
    }
    for (const [key, col] of [['ink', C.ink], ['paper', C.paper]]) {
      out.push(`<path d="${marks[key].join('')}" fill="none" stroke="${col}" stroke-width="${(2 * rDot).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round" pointer-events="none"/>`);
    }
    // ward numbers
    const ns = (isMap ? 7.5 : 6.5) * (isMap ? 1 : 1);
    for (const w of wards) {
      const x = Xm(toMiles(w.cx, 'x') + w.dx), y = Ym(toMiles(w.cy, 'y') + w.dy);
      const dark = w.cls >= 3;
      out.push(text(x, y + ns * 0.36, String(w.ward), { size: ns, anchor: 'middle', weight: 600, fill: dark ? C.paper : C.ink, halo: dark ? TONES[w.cls] : TONES[w.cls] }));
    }
    const gridLabel = (v) => (v === 0 ? { fill: C.ink, weight: 600 } : { fill: C.pencil });
    for (const x of g.xs) out.push(text(X(x) + gl * 0.35, labelTop, formatAddress(x, 'x'), { size: gl, spacing: 0.4, rotate: -90, anchor: 'end', ...gridLabel(x) }));
    for (const y of g.ys) out.push(text(colX, Y(y) + gl * 0.35, formatAddress(y, 'y'), { size: gl, spacing: 0.4, anchor: 'end', ...gridLabel(y) }));

    // mile ruler
    const rx = X(ext.west + 800), ry = Y(ext.south) - k * 0.35;
    out.push(`<line x1="${rx}" x2="${rx + 4 * k}" y1="${ry}" y2="${ry}" stroke="${C.ink}" stroke-width="1.2"/>`);
    for (let i = 0; i <= 4; i++) out.push(`<line x1="${rx + i * k}" x2="${rx + i * k}" y1="${ry - (i % 4 === 0 ? 6 : 4)}" y2="${ry}" stroke="${C.ink}" stroke-width="1.2"/>`);
    out.push(text(rx, ry - 9, '0', { size: 7.5 * T, anchor: 'middle' }));
    out.push(text(rx + 4 * k, ry - 9, '4 MI', { size: 7.5 * T, anchor: 'middle' }));

    // legend
    const lgs = 9 * T;
    const sw = (fill) => `<rect x="-5" y="-4" width="10" height="8" fill="${fill}"/>`;
    const dotMark = `<circle r="1.4" fill="${C.ink}"/><circle cx="6" r="1.4" fill="${C.ink}"/><circle cx="-6" r="1.4" fill="${C.ink}"/>`;
    if (isPlate) {
      const short = [['head', 'Menu money on sidewalks and crossings']];
      CLASS_LABELS.forEach((l, i) => short.push([sw(TONES[i]), i === 0 ? 'under 2½%' : i === 4 ? '20%+' : l.replace('%', '')]));
      short.push([dotMark, 'a project']);
      let lx = 60;
      const y = 203;
      for (const [m, lab] of short) {
        if (m === 'head') {
          out.push(text(lx, y, `${lab}:`, { size: lgs, fill: C.pencil }));
          lx += textWidth(`${lab}:`, lgs) + 6;
          continue;
        }
        const mw = m.includes('cx="6"') ? 16 : 10;
        out.push(`<g transform="translate(${lx + mw / 2} ${y - lgs * 0.35})">${m}</g>`);
        out.push(text(lx + mw + 4, y, lab, { size: lgs, fill: C.pencil }));
        lx += mw + 4 + textWidth(lab, lgs) + 9;
      }
    } else {
      const items = [['head', `Menu money on sidewalks, ${years[0]}–${String(years[1]).slice(2)}`], ...CLASS_LABELS.map((l, i) => [sw(TONES[i]), l]), ['gap'],
        [dotMark, 'A sidewalk or crossing project'], [`<text y="3" font-size="9" font-weight="600" text-anchor="middle" fill="${C.ink}">19</text>`, 'Ward, drawn a quarter farther from State & Madison than it lies']];
      out.push(legendBox(items, { x: rx, bottom: Y(ext.south) - k, k, size: lgs }));
    }
  }

  if (isMap) {
    return svg(out.join(''), { label: mapLabel(data), viewBox: `60 184 ${Math.ceil(colX + 4 - 60)} ${Math.ceil(fy1 + 10 - 184)}`, align: 'xMinYMin meet' })
      .replace('<svg ', `<svg data-top="${labelTop - 184}" data-bottom="${fy1 - 184}" data-ftop="${+(fy0 - 184).toFixed(2)}" data-ppm="${+k.toFixed(3)}" `);
  }

  // ---------- margin column (plate), chart (page) ----------
  const mx = isPlate ? Math.round(colX + 38) : isChart ? 2 : 0;
  const cw = isChart ? 390 : W_COL;
  const title = (y, str) => out.push(text(mx, y, str, { size: 10.5 * T, weight: 600, spacing: 1 }));
  const ns = 10.5, nh = 14;
  const note = (y, str, x = mx) => out.push(text(x, y, str, { size: ns, font: SERIF, italic: true, fill: C.pencil }));
  let uy = 0;

  if (isPlate || isChart) {
    const row = isChart ? 11 : 6.8;
    const cs = isChart ? 9 : 6;
    const numW = isChart ? 17 : 12;
    const barX = mx + numW + 4;
    const barW = isChart ? 200 : 160;
    const dotX0 = barX + barW + 12, dotX1 = mx + cw - 2;
    const dx = (v) => dotX0 + Math.min(v, DOT_MAX) / DOT_MAX * (dotX1 - dotX0);
    if (isChart) uy = 4;
    else {
      uy = Math.round(labelTop + 10.5 * T * 0.72);
      title(uy, CHART_TITLE.toUpperCase());
      const noteLines = wrap(CHART_NOTE, Math.floor(cw / (ns * 0.45)));
      noteLines.forEach((l, i) => note(uy + (i + 1) * nh + 4, l));
      uy += noteLines.length * nh + 14;
    }
    // dot axis
    const ay = uy;
    for (const v of [0, 10, 20, 30]) {
      out.push(text(dx(v), ay, String(v), { size: cs, anchor: 'middle', fill: C.pencil }));
    }
    uy += 4;
    const rows0 = uy;
    const order = [...wards].sort((a, b) => b.share - a.share || a.ward - b.ward);
    for (const v of [0, 10, 20, 30]) out.push(`<line x1="${dx(v)}" x2="${dx(v)}" y1="${rows0}" y2="${rows0 + order.length * row}" stroke="${C.rule}" stroke-width="0.6"/>`);
    for (const w of order) {
      const cy = uy + row / 2;
      if (hooks) out.push(`<g class="${uid}-row" data-hl="w${w.ward}" data-keys="w${w.ward}" data-tip="Ward ${w.ward}" data-name="Ward ${w.ward}" data-lines="" data-kind="area" data-shape="tile" data-fill="${TONES[w.cls]}" data-size="1" data-frac="0" data-detail="${esc(wardDetail(w, years))}"><rect class="bg" x="${mx - 2}" y="${uy}" width="${cw + 4}" height="${row}" fill="transparent"/>`);
      out.push(text(mx + numW, cy + cs * 0.36, String(w.ward), { size: cs, anchor: 'end', fill: w.share < 0.01 ? C.ink : C.pencil, weight: w.share < 0.01 ? 600 : 400 }));
      let x = barX;
      for (const c of CATS) {
        const ww = barW * (w[c] / w.total);
        if (ww > 0.05) out.push(`<rect x="${x.toFixed(2)}" y="${(uy + row * 0.12).toFixed(2)}" width="${ww.toFixed(2)}" height="${(row * 0.76).toFixed(2)}" fill="${catFill(c)}"/>`);
        x += ww;
      }
      const a = dx(w.filed1k), b = dx(w.shared1k), r = row * 0.3;
      out.push(`<line x1="${Math.min(a, b).toFixed(1)}" x2="${Math.max(a, b).toFixed(1)}" y1="${cy}" y2="${cy}" stroke="${C.fog}" stroke-width="0.8"/>`);
      out.push(`<circle cx="${b.toFixed(1)}" cy="${cy}" r="${r.toFixed(2)}" fill="${C.paper}" stroke="${C.ink}" stroke-width="${(r * 0.45).toFixed(2)}"/>`);
      out.push(`<circle cx="${a.toFixed(1)}" cy="${cy}" r="${r.toFixed(2)}" fill="${C.ink}"/>`);
      if (hooks) out.push('</g>');
      uy += row;
    }
    // key for the bar
    uy += 6;
    let kx = mx;
    const ks = isChart ? 9 : 7;
    CATS.forEach((c, i) => {
      const lab = CAT_LABEL[c];
      if (isChart && i === 3) { kx = mx; uy += 13; } // two lines of key on the page
      out.push(`<rect x="${kx}" y="${uy}" width="8" height="6" fill="${catFill(c)}"${c === 'other' ? ` stroke="${C.frame}" stroke-width="0.5"` : ''}/>`);
      out.push(text(kx + 11, uy + 6, lab, { size: ks, fill: C.pencil }));
      kx += 11 + textWidth(lab, ks) + (isChart ? 10 : 6);
    });
    uy += 8;
    if (isChart) {
      return svg(out.join(''), { label: `${CHART_TITLE}: Ward ${summary.top.ward} put ${pct(summary.top.share)} of its menu money into sidewalks and crossings, Ward ${summary.bottom.ward} none.`, viewBox: `0 0 ${cw + 6} ${Math.ceil(uy + 6)}`, align: 'xMinYMin meet' });
    }
  }

  // ---------- inset: the complaint and the wallet ----------
  const iext = { west: -13600, east: 4800, south: -14000, north: 8000 };
  const im = { west: toMiles(iext.west, 'x'), east: toMiles(iext.east, 'x'), south: toMiles(iext.south, 'y'), north: toMiles(iext.north, 'y') };
  const gapX = isInset ? 18 : 12;
  const iw = isInset ? 390 : W_COL;
  const each = (iw - gapX) / 2;
  const ki = each / (im.east - im.west);
  const ih = Math.round((im.north - im.south) * ki);
  const ty = uy + 30;
  if (isPlate) {
    title(ty, `INSET · ${INSET_TITLE.toUpperCase()}`);
    note(ty + nh + 4, 'Per 1,000 residents, 2019–22, in fifths of the wards.');
  }
  const top0 = isInset ? 18 : ty + nh + 26;
  const panels = [['qVoice', '311 SIDEWALK REQUESTS'], ['qMoney', 'SHARED-COST APPLICATIONS']];
  panels.forEach(([key, lab], i) => {
    const x0 = (isInset ? 0 : mx) + i * (each + gapX);
    const IX = (x) => x0 + (toMiles(x, 'x') - im.west) * ki;
    const IY = (y) => top0 + (im.north - toMiles(y, 'y')) * ki;
    out.push(text(x0, top0 - 6, lab, { size: isInset ? 9 : 7.5, spacing: 0.4, weight: 600 }));
    for (const w of wards) out.push(piece(w, IX, IY, TONES[w[key]], 0.5));
  });
  // shared key: fewest → most
  const ky = top0 + ih + 12;
  const kxs = isInset ? 0 : mx;
  const kfs = isInset ? 9 : 7.5;
  out.push(text(kxs, ky + 6.5, 'fewest', { size: kfs, fill: C.pencil }));
  let kx2 = kxs + textWidth('fewest', kfs) + 5;
  for (const t of TONES) { out.push(`<rect x="${kx2}" y="${ky}" width="12" height="7" fill="${t}"/>`); kx2 += 13; }
  out.push(text(kx2 + 4, ky + 6.5, 'most', { size: kfs, fill: C.pencil }));
  if (isInset) {
    return svg(out.join(''), { label: `${INSET_TITLE}: 311 sidewalk requests and shared-cost applications per 1,000 residents by ward, 2019 to 2022. The same wards lead both.`, viewBox: `0 0 ${iw} ${ky + 12}`, align: 'xMidYMid meet' });
  }

  // plate: Findings close the column
  let fy = ky + 34;
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
    ['MENU', `City of Chicago menu program reports, ${years[0]}–${years[1]}, as compiled and categorized by Ward Wise (Chi Hack Night); costs as listed`],
    ['311', `Sidewalk inspection requests and Shared Cost Sidewalk Program applications, Chicago Data Portal v6vf-nfxy, pulled ${data.pulled311}`],
    ['WARDS', 'The 2015–2023 wards, from Ward Precincts 2013–2022 (nvke-umup); each ward drawn a quarter farther from State & Madison'],
    ['PEOPLE', `2020 Census blocks, ${fmt(summary.residents)} residents; difficulty walking from ACS 2020–2024 (B18105), an estimate`],
    ['MARKS', 'Sidewalk and crossing projects as placed by Ward Wise: a dot per address, a line per street segment; a few could not be placed'],
    ['SHARED', 'Shared Cost Sidewalk Program, 2026 overview: the owner pays part; applications on one day in January, first come, first served'],
    ['AUDIT', 'Office of Inspector General, audit of the Aldermanic Menu Program, April 2017'],
    ['LAWSUIT', 'Lane v. City of Chicago, filed September 2025 (Disability Rights Advocates); the city has moved to dismiss'],
    ['GRID', 'Each square one mile from State & Madison; the first mile south of Madison runs to Roosevelt Road (1200 S)'],
  ];
  dy += 18;
  for (const [kk, v] of ledger) {
    out.push(text(lx, dy, kk, { size: 8.5, fill: C.pencil, spacing: 0.6 }));
    out.push(text(lx + 64, dy, v, { size: 9.5, font: SERIF }));
    dy += 13.5;
  }

  return svg(out.join(''), { label: mapLabel(data) });
}

const mapLabel = (d) =>
  `Plate XII, Who Fixes the Sidewalk: Chicago's fifty wards pulled apart, shaded by the share of menu money each alderman spent on sidewalks and crossings, ${d.summary.years[0]} to ${d.summary.years[1]}; from none in Ward ${d.summary.bottom.ward} to ${pct(d.summary.top.share)} in Ward ${d.summary.top.ward}.`;
