// Plate XXII · The Chicago Projection · Day 22 Projections
import { C, SERIF, esc, text, textWidth, legendBox, wrap, frame, svg } from '../lib/plate.js';

// variant 'plate': the full 1080 x 1350 plate (export, download).
// variant 'map': the map alone, with hover hooks, for the day page's left column.
// variant 'chart': the numbers in each mile, Howard to 135th, with hover hooks.
// variant 'inset': Madison to 31st in true miles: the real streets against 800 a mile.
// The map is drawn in Chicago's own projection: every point placed by its address numbers ÷ 800
// ("address miles"), through a rubber sheet fitted to the corners where two grid streets meet. The
// city limit where it really is (true miles) is the dotted line. A circle of 0.3 mile at every mile
// crossing (Tissot's indicatrix) shows the scale: round where a mile holds 800 numbers, tall where
// it holds more.

export const STRETCH = 880;
const TISSOT_R = 0.3; // numbers a mile, north to south, above which a circle counts as stretched
const ACCENT = { gray: C.ink, color: '#B8432F' };
const ACCENT_FILL = { gray: 'hatch', color: '#EFC9BE' };

export const CHART_TITLE = 'Numbers in each mile';
export const CHART_NOTE = 'Howard to 135th: the address numbers between two mile streets, per true mile; 800 dashed';
export const INSET_TITLE = 'Inset · Madison to 31st, true miles';
export const INSET_NOTE = 'The real Roosevelt, Cermak and 31st against where 800 numbers a mile would put their numbers (dashed).';

const fmt = (v) => Math.round(v).toLocaleString('en-US');
const mi = (v) => `${Math.abs(v).toFixed(1)} mi`;
const lab = (v, axis) => {
  if (Math.abs(v) < 1e-9) return axis === 'x' ? 'STATE' : 'MADISON';
  const dir = axis === 'x' ? (v < 0 ? 'W' : 'E') : v < 0 ? 'S' : 'N';
  return `${Math.round(Math.abs(v) * 800)} ${dir}`;
};
const place = (ax, ay) => {
  const r = (v) => Math.round((v * 800) / 100) * 100;
  const y = r(ay), x = r(ax);
  return `${y === 0 ? 'Madison' : `${Math.abs(y)} ${y < 0 ? 'S' : 'N'}`} · ${x === 0 ? 'State' : `${Math.abs(x)} ${x < 0 ? 'W' : 'E'}`}`;
};

export function renderDay22(data, { mode = 'gray', variant = 'plate' } = {}) {
  const { summary: s, ladder, tissot } = data;
  const out = [];
  const isPlate = variant === 'plate';
  const isMap = variant === 'map';
  const isChart = variant === 'chart';
  const isInset = variant === 'inset';
  const hooks = isMap || isChart || isInset;
  const T = isMap || isChart ? 1.3 : 1.15;
  const color = mode === 'color';
  const accent = ACCENT[color ? 'color' : 'gray'];
  const uid = `d22-${variant}-${mode}`;
  const hatchW = isMap ? 3.2 : 2.6;
  const stretchFill = color ? ACCENT_FILL.color : `url(#${uid}-hatch)`;
  out.push(`<defs><pattern id="${uid}-hatch" width="${hatchW}" height="${hatchW}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="${hatchW}" stroke="${C.ink}" stroke-width="${isMap ? 0.75 : 0.6}"/></pattern></defs>`);
  const attr = (o) => esc(JSON.stringify(o)).replace(/"/g, '&quot;');
  // which ladder row a true northing falls in (for linked highlight)
  const rowOf = (n) => {
    const i = ladder.findIndex((r) => n <= r.top + 1e-6 && n > r.top - r.miles - 1e-6);
    return i;
  };
  const ringCard = (t) => ({
    name: place(t.ax, t.ay),
    aside: `${mi(t.n)} ${t.n < 0 ? 'south' : 'north'} of Madison${t.n === 0 ? '' : ''}`,
    big: [fmt(t.ns), 'numbers a mile, north to south'],
    bar: { frac: Math.min(1, t.ns / 1200), segs: [[0, 800 / 1200, C.frame], [800 / 1200, 1, accent]], left: '800 is the grid’s promise', right: `east to west: ${fmt(t.ew)}` },
    foot: t.n === 0 ? ['On Madison Street', ''] : [`Its number says ${mi(t.ay)} from Madison`, `it is ${mi(t.n)}`],
  });
  const ladderCard = (r) => ({
    name: `${r.from} – ${r.to}`,
    aside: `${fmt(r.numbers)} numbers`,
    big: [fmt(r.perMile), 'numbers a mile'],
    bar: { frac: Math.min(1, r.perMile / 1200), segs: [[0, 800 / 1200, C.frame], [800 / 1200, 1, accent]], left: '800 is the grid’s promise', right: '1,200' },
    foot: [`${fmt(r.numbers)} numbers in ${r.miles.toFixed(2)} mi`, ''],
  });

  if (isPlate) out.push(frame({
    plate: 'XXII',
    chapter: 'THE BODY',
    day: 22,
    theme: 'PROJECTIONS',
    title: 'The Chicago Projection',
    subtitle: 'Chicago drawn where its address numbers put it, 800 to the mile, with a circle at every mile crossing.',
  }));

  // ---------- main map, in address miles ----------
  const ext = { west: -14, east: 6, south: -18, north: 11 };
  const field = isMap ? { x: 60, y: 250, w: 760, h: 1040 } : { x: 60, y: 262, w: 575, h: 830 };
  const k = Math.min(field.w / (ext.east - ext.west), field.h / (ext.north - ext.south));
  const X = (m) => field.x + (m - ext.west) * k;
  const Y = (m) => field.y + (ext.north - m) * k;
  const fx0 = X(ext.west), fx1 = X(ext.east), fy0 = Y(ext.north), fy1 = Y(ext.south);
  const gl = 8 * T;
  const labelLen = 7 * (gl * 0.6 + 0.4);
  const colX = fx1 + 6 + labelLen;
  const labelTop = fy0 - 6 - labelLen;
  const pathOf = (lines, fx, fy, close = false) => lines.map((l) => 'M' + l.map(([x, y]) => `${fx(x).toFixed(1)},${fy(y).toFixed(1)}`).join('L') + (close ? 'Z' : '')).join('');
  const ringMark = (stretched, r = 4.6) =>
    `<ellipse rx="${r}" ry="${stretched ? r * 1.4 : r}" fill="${stretched ? stretchFill : 'none'}" stroke="${stretched ? accent : C.ink}" stroke-width="${stretched ? 0.9 : 0.7}"/>`;
  const dotted = (w = 18) => `<line x1="${-w / 2}" x2="${w / 2}" y1="0" y2="0" stroke="${C.pencil}" stroke-width="1" stroke-linecap="round" stroke-dasharray="0.1 2.6"/>`;
  const groundMark = `<rect x="-7" y="-5" width="14" height="10" fill="${C.ground}"/>`;

  if (isPlate || isMap) {
    out.push(`<defs><clipPath id="${uid}-map"><rect x="${fx0}" y="${fy0}" width="${fx1 - fx0}" height="${fy1 - fy0}"/></clipPath></defs>`);
    out.push(`<g clip-path="url(#${uid}-map)" pointer-events="none">`);
    out.push(`<path d="${pathOf(data.boundaryAddr, X, Y, true)}" fill="${C.ground}" fill-rule="evenodd"/>`);
    const gg = [];
    for (let x = ext.west; x <= ext.east; x++) gg.push(`<line x1="${X(x)}" x2="${X(x)}" y1="${fy0}" y2="${fy1}" stroke="${x === 0 ? C.pencil : C.grid}" stroke-width="${x === 0 ? 0.8 : 0.6}" opacity="${x === 0 ? 0.8 : 0.55}"/>`);
    for (let y = ext.south; y <= ext.north; y++) gg.push(`<line x1="${fx0}" x2="${fx1}" y1="${Y(y)}" y2="${Y(y)}" stroke="${y === 0 ? C.pencil : C.grid}" stroke-width="${y === 0 ? 0.8 : 0.6}" opacity="${y === 0 ? 0.8 : 0.55}"/>`);
    out.push(gg.join(''));
    out.push(`<path d="${pathOf(data.streets, X, Y)}" fill="none" stroke="${C.fog}" stroke-width="${isMap ? 0.4 : 0.32}" stroke-linejoin="round"/>`);
    // the city limit where it really is
    out.push(`<path d="${pathOf(data.boundaryTrue, X, Y, true)}" fill="none" stroke="${C.pencil}" stroke-width="${isMap ? 1.1 : 0.9}" stroke-linecap="round" stroke-dasharray="0.1 ${isMap ? 3 : 2.5}"/>`);
    out.push('</g>');
    // indicatrices
    const sw = isMap ? 0.85 : 0.7;
    for (const t of tissot) {
      if (t.ax - TISSOT_R < ext.west || t.ax + TISSOT_R > ext.east) continue; // O'Hare runs off the field
      const st = t.ns > STRETCH;
      const d = pathOf([t.ring], X, Y, true);
      const p = `<path d="${d}" fill="${st ? stretchFill : 'none'}" stroke="${st ? accent : C.ink}" stroke-width="${st ? sw * 1.3 : sw}"/>`;
      if (!hooks) { out.push(p); continue; }
      const row = rowOf(t.n);
      out.push(`<g data-kind="card" data-id="t${t.e}_${t.n}" data-tip="${esc(place(t.ax, t.ay))}" data-name="${esc(place(t.ax, t.ay))}"${row >= 0 ? ` data-keys="r${row}"` : ''} data-card="${attr(ringCard(t))}"><path d="${d}" fill="transparent" stroke="none"/>${p}</g>`);
    }
    // the three stretched miles, named in the lake
    {
      const ls = 7.6 * T;
      const bx = X(2.1);
      const marks = [[0, -1.5, '1,200 numbers', 'first mile south'], [-1.5, -2.75, '1,000', 'second mile'], [-2.75, -3.875, '900', 'third mile']];
      for (const [a, b, l1, l2] of marks) {
        out.push(`<path d="M${bx - 3},${Y(a) + 1}h3V${Y(b) - 1}h-3" fill="none" stroke="${accent}" stroke-width="0.8" pointer-events="none"/>`);
        const ym = (Y(a) + Y(b)) / 2;
        out.push(text(bx + 5, ym - 1, l1, { size: ls, weight: 600, fill: accent, halo: C.paper }));
        out.push(text(bx + 5, ym + ls * 0.95, l2, { size: ls * 0.92, fill: C.pencil, halo: C.paper }));
      }
    }
    const gridLabel = (v) => (v === 0 ? { fill: C.ink, weight: 600 } : { fill: C.pencil });
    for (let x = ext.west; x <= ext.east; x++) out.push(text(X(x) + gl * 0.35, labelTop, lab(x, 'x'), { size: gl, spacing: 0.4, rotate: -90, anchor: 'end', ...gridLabel(x) }));
    for (let y = ext.south; y <= ext.north; y++) out.push(text(colX, Y(y) + gl * 0.35, lab(y, 'y'), { size: gl, spacing: 0.4, anchor: 'end', ...gridLabel(y) }));

    // ruler: four cells, in address numbers
    const rx = X(ext.west + 1), ry = Y(ext.south) - k * 0.35;
    out.push(`<line x1="${rx}" x2="${rx + 4 * k}" y1="${ry}" y2="${ry}" stroke="${C.ink}" stroke-width="1.2"/>`);
    for (let i = 0; i <= 4; i++) out.push(`<line x1="${rx + i * k}" x2="${rx + i * k}" y1="${ry - (i % 4 === 0 ? 6 : 4)}" y2="${ry}" stroke="${C.ink}" stroke-width="1.2"/>`);
    out.push(text(rx, ry - 9, '0', { size: 7.5 * T, anchor: 'middle' }));
    out.push(text(rx + 4 * k, ry - 9, '3,200 NUMBERS', { size: 7.5 * T, anchor: 'middle' }));

    const lgs = 9 * T;
    if (isPlate) {
      let lx = 60;
      const y = 203;
      const item = (mark, l, w = 13) => {
        out.push(`<g transform="translate(${lx + w / 2 - 1} ${y - lgs * 0.35})">${mark}</g>`);
        out.push(text(lx + w + 3, y, l, { size: lgs, fill: C.pencil }));
        lx += w + 3 + textWidth(l, lgs) + 20;
      };
      item(groundMark, 'the city where its numbers put it', 14);
      item(dotted(14), 'the city limit where it is', 16);
      item(ringMark(false, 4.2), 'a 0.3 mi circle at each mile crossing', 10);
      item(ringMark(true, 3.6), `stretched: over ${fmt(STRETCH)} numbers a mile`, 10);
    } else {
      out.push(legendBox([
        ['head', 'Chicago placed by its numbers'],
        [groundMark, 'The city where its address numbers put it'],
        [dotted(18), 'The city limit where it really is'],
        ['gap'],
        [ringMark(false, 5), 'A circle of 0.3 mile at each mile crossing'],
        [ringMark(true, 4.4), `Stretched: over ${fmt(STRETCH)} numbers a mile, north to south`],
      ], { x: rx, bottom: Y(ext.south) - k, k, size: lgs }));
    }
  }

  if (isMap) {
    return svg(out.join(''), { label: mapLabel(data), viewBox: `60 184 ${Math.ceil(colX + 4 - 60)} 1114`, align: 'xMinYMin meet' })
      .replace('<svg ', `<svg data-top="${labelTop - 184}" data-bottom="${fy1 - 184}" data-ftop="${+(fy0 - 184).toFixed(2)}" data-ppm="${+k.toFixed(3)}" `);
  }

  // ---------- margin column (plate), chart or inset (day page) ----------
  const mx = isPlate ? Math.round(colX + 38) : isChart ? 2 : 0;
  const cw = isChart ? 390 : W_COL;
  const title = (y, str) => out.push(text(mx, y, str, { size: 10.5 * T, weight: 600, spacing: 1 }));
  const ns = 10.5, nh = 14;
  const note = (y, str) => out.push(text(mx, y, str, { size: ns, font: SERIF, italic: true, fill: C.pencil }));
  let uy = 0;

  if (isPlate || isChart) {
    const cs = isChart ? 8 * T : 7.6;
    if (isPlate) {
      uy = Math.round(labelTop + 10.5 * T * 0.72);
      title(uy, CHART_TITLE.toUpperCase());
      const noteLines = wrap(CHART_NOTE, Math.floor(cw / (ns * 0.45)));
      noteLines.forEach((l, i) => note(uy + (i + 1) * nh + 4, l));
      uy += noteLines.length * nh + 18;
    } else uy = 4;
    const labW = Math.max(...ladder.map((r) => textWidth(`${r.from}–${r.to}`, cs))) + 8;
    const valW = textWidth('1,200', cs, { weight: 600 }) + 6;
    const bx = mx + labW, bw = cw - labW - valW - 2;
    const rh = isChart ? 17 : 10.6, bh = isChart ? 11 : 7.4;
    const sc = (v) => (v / 1200) * bw;
    ladder.forEach((r, i) => {
      const y = uy + i * rh;
      const st = r.perMile > STRETCH;
      out.push(text(mx, y + bh * 0.85, `${r.from}–${r.to}`, { size: cs, fill: st ? C.ink : C.pencil, weight: st ? 600 : 400 }));
      const rect = `<rect x="${bx}" y="${y}" width="${sc(r.perMile).toFixed(1)}" height="${bh}" fill="${st ? stretchFill : C.fog}"${st ? ` stroke="${accent}" stroke-width="0.6"` : ''}/>`;
      if (hooks) out.push(`<g data-kind="card" data-tip="${esc(`${r.from} – ${r.to}`)}" data-name="${esc(`${r.from} – ${r.to}`)}" data-hl="r${i}" data-card="${attr(ladderCard(r))}">${rect}<rect x="${mx}" y="${y - (rh - bh) / 2}" width="${cw}" height="${rh}" fill="transparent"/></g>`);
      else out.push(rect);
      out.push(text(bx + bw + valW, y + bh * 0.85, fmt(r.perMile), { size: cs * 0.95, weight: st ? 600 : 400, fill: st ? C.ink : C.pencil, anchor: 'end' }));
    });
    const y1 = uy + ladder.length * rh;
    out.push(`<line x1="${bx + sc(800)}" x2="${bx + sc(800)}" y1="${uy - 3}" y2="${y1}" stroke="${C.ink}" stroke-width="0.8" stroke-dasharray="2 2" pointer-events="none"/>`);
    out.push(text(bx + sc(800), y1 + cs * 1.3, '800', { size: cs * 0.9, anchor: 'middle', fill: C.ink }));
    uy = y1 + cs * 1.6;
    if (isChart) {
      return svg(out.join(''), { label: `Numbers in each mile, Howard to 135th: 800 give or take 10%, except Madison to Roosevelt ${fmt(ladder[9].perMile)}, Roosevelt to Cermak ${fmt(ladder[10].perMile)}, Cermak to 31st ${fmt(ladder[11].perMile)}.`, viewBox: `0 0 ${cw + 6} ${Math.ceil(uy + 4)}`, align: 'xMinYMin meet' });
    }
  }

  // ---------- inset: Madison to 31st, true miles ----------
  const ib = data.inset.box;
  const iw = isInset ? 390 : W_COL;
  const mw = Math.round(iw * 0.6);
  const ki = mw / (ib.east - ib.west);
  const ph = (ib.north - ib.south) * ki;
  const ty = uy + 26;
  let noteH = 0;
  if (isPlate) {
    title(ty, INSET_TITLE.toUpperCase());
    const nl = wrap(INSET_NOTE, Math.floor(cw / (ns * 0.45)));
    nl.forEach((l, i) => note(ty + (i + 1) * nh + 4, l));
    noteH = nl.length * nh;
  }
  const inset = isInset ? { x: 0, y: 4, w: iw, h: ph + 8 } : { x: mx, y: ty + noteH + 14, w: iw, h: ph };
  {
    const IX = (m) => inset.x + (m - ib.west) * ki, IY = (m) => inset.y + (ib.north - m) * ki;
    out.push(`<defs><clipPath id="${uid}-inset"><rect x="${inset.x}" y="${inset.y}" width="${mw}" height="${ph}"/></clipPath></defs>`);
    out.push(`<rect x="${inset.x}" y="${inset.y}" width="${mw}" height="${ph}" fill="${C.ground}"/>`);
    out.push(`<g clip-path="url(#${uid}-inset)" pointer-events="none">`);
    out.push(`<path d="${pathOf(data.inset.lines, IX, IY)}" fill="none" stroke="${C.frame}" stroke-width="${isInset ? 0.5 : 0.4}"/>`);
    out.push(`<line x1="${inset.x}" x2="${inset.x + mw}" y1="${IY(0)}" y2="${IY(0)}" stroke="${C.ink}" stroke-width="1.1"/>`);
    for (const key of ['-1200', '-2200', '-3100']) out.push(`<path d="${pathOf(data.inset.hi[key], IX, IY)}" fill="none" stroke="${accent}" stroke-width="${isInset ? 2 : 1.6}" stroke-linecap="round"/>`);
    for (const key of [-1200, -2200, -3100]) out.push(`<line x1="${inset.x}" x2="${inset.x + mw}" y1="${IY(key / 800)}" y2="${IY(key / 800)}" stroke="${C.ink}" stroke-width="0.8" stroke-dasharray="3 2"/>`);
    out.push('</g>');
    // labels to the right: the real street (ink) and where 800 a mile puts its number (pencil)
    const ls = isInset ? 8.6 : 7.4;
    const lx = inset.x + mw + 6;
    const names = { '-1200': 'Roosevelt', '-2200': 'Cermak', '-3100': '31st St' };
    out.push(text(lx, IY(0) + ls * 0.35, 'MADISON', { size: ls, weight: 600 }));
    for (const key of ['-1200', '-2200', '-3100']) {
      const real = data.inset.real[key];
      out.push(text(lx, IY(real) + ls * 0.35, `${names[key]} ${Math.abs(+key)} S`, { size: ls, weight: 600, fill: accent }));
      out.push(text(lx, IY(+key / 800) + ls * 0.35, `${Math.abs(+key)} S at 800 a mile`, { size: ls, fill: C.pencil }));
      out.push(`<line x1="${inset.x + mw - 4}" x2="${inset.x + mw - 4}" y1="${IY(real)}" y2="${IY(+key / 800)}" stroke="${C.pencil}" stroke-width="0.7"/>`);
    }
    // a mile ruler under the window
    const rr = inset.y + ph + (isInset ? 4 : 0);
    if (isInset) {
      out.push(`<line x1="${inset.x}" x2="${inset.x + ki}" y1="${rr + 1}" y2="${rr + 1}" stroke="${C.ink}" stroke-width="1"/>`);
    }
  }
  if (isInset) {
    return svg(out.join(''), { label: `Madison to 31st Street in true miles: Roosevelt (1200 S) is ${data.inset.real['-1200'].toFixed(2).replace('-', '')} miles south of Madison, Cermak (2200 S) ${(-data.inset.real['-2200']).toFixed(2)}, 31st (3100 S) ${(-data.inset.real['-3100']).toFixed(2)}; at 800 a mile their numbers would say 1.5, 2.75 and 3.88.`, viewBox: `0 0 ${inset.w} ${Math.ceil(inset.h + 8)}`, align: 'xMidYMid meet' })
      .replace('<svg ', `<svg data-ppm="${+ki.toFixed(3)}" `);
  }

  // plate: Findings close the column
  let fy = inset.y + inset.h + 30;
  title(fy, 'FINDINGS');
  for (const l of wrap(data.finding, Math.floor(W_COL / (ns * 0.45)))) note((fy += nh) + 4, l);
  fy += 10;
  const bs = 9.5, bh2 = 12.6;
  for (const para of data.findings ?? []) {
    for (const l of wrap(para, Math.floor(W_COL / (bs * 0.46)))) out.push(text(mx, (fy += bh2), l, { size: bs, font: SERIF }));
    fy += 5;
  }

  // data ledger, under the map
  const lx = fx0;
  let dy = Math.round(fy1) + 34;
  out.push(text(lx, dy, 'DATA LEDGER', { size: 10.5 * T, weight: 600, spacing: 1 }));
  const ledger = [
    ['STREETS', `Street Center Lines, Chicago Data Portal · pr57-gg9e (last updated ${longDate(data.datasetUpdated)}) · pulled ${longDate(data.asOf)}`],
    ['METHOD', `${fmt(s.controlPoints)} corners where two grid streets meet, true position against address position; a rubber sheet through them`],
    ['', 'Address miles: the address number ÷ 800, with the South Side’s real numbers (63rd Street = 6300 S)'],
    ['CAVEAT', `Grid streets lean about ${s.lean}° from true north; the sheet carries the lean`],
    ['LIMITS', 'City of Chicago, Boundaries – City · qqq8-j68g'],
  ];
  dy += 18;
  for (const [kk, v] of ledger) {
    out.push(text(lx, dy, kk, { size: 8.5, fill: C.pencil, spacing: 0.6 }));
    out.push(text(lx + 64, dy, v, { size: 9.5, font: SERIF }));
    dy += 13.5;
  }
  return svg(out.join(''), { label: mapLabel(data) });
}

const W_COL = 300;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const longDate = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};

const mapLabel = (d) =>
  `Plate XXII, The Chicago Projection: Chicago drawn where its address numbers put it, 800 to the mile. The first three miles south of Madison hold ${d.summary.first3.numbers.toLocaleString('en-US')} numbers in ${d.summary.first3.miles} miles, so the South Side sits about ${d.summary.first3.extra.toFixed(1)} mile farther south than the real city limit.`;
