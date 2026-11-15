// Plate XII · Who Fixes the Sidewalk · Day 12 Power
import { C, SERIF, esc, text, textWidth, legendBox, wrap, frame, svg } from '../lib/plate.js';
import { gridLines, formatAddress, toMiles } from '../lib/grid.js';

// variant 'plate': the full 1080 x 1350 plate (export, download).
// variant 'map': the map alone, with hover hooks, for the day page's left column.
// variant 'chart': the fifty wards' menu money, row by row, with hover hooks.
// variant 'inset': the scatter of the fifty wards (requests against applications), with hover hooks.
// The fifty wards of 2015-2023, split by a thin paper gap. Tone = the share of the ward's menu money
// spent on sidewalks and crossings, 2019-2022, in seven classes; marks = those projects (a dot per
// address, a line per street segment). The inset plots each ward's 311 sidewalk inspection requests
// against its Shared Cost Sidewalk Program applications, per 1,000 residents. Colour mode: sand to
// teal on the map and on the chart's sidewalk bars, Stevens' purple-gold in the scatter.
export const W_COL = 300;
export const CHART_TITLE = 'Wards and Choices';
export const CHART_NOTE = 'Each ward’s menu money, 2019–22, as one bar, sorted by the share on sidewalks and crossings · Right: per 1,000 residents, 311 sidewalk requests ● and shared-cost applications ○';
export const INSET_TITLE = 'Complaint and Wallet';
// the map's seven classes of menu share (breaks in plate.json: 2, 5, 7, 10, 15, 20%), light to dark
export const MAP_TONES = ['#E4E2DC', '#CFCDC6', '#B6B4AD', '#9A9891', '#7C7A74', '#5A5954', '#3A3936'];
// color mode, chosen 2026-11-14 after a test of 16 palettes (.private/day12-palette-*.png):
// sand to teal, seven even OKLCH steps (lightness 0.945 to 0.34, hue 85 to 200, chroma at most 0.075),
// light for less, dark for more, like the grayscale steps. The chart's sidewalk and crossing bars take
// the ramp's teals, so one colour means sidewalk money across the plate.
export const PALETTES = {
  gray: { map: MAP_TONES },
  sandteal: {
    map: ['#F8ECD2', '#D1CEA4', '#A3B482', '#72996F', '#477C62', '#2A5D54', '#1F3E3F'],
    cat: { sidewalks: '#2A5D54', crossings: '#72996F' },
  },
};
export const COLOR_PALETTE = 'sandteal';
// colour mode, the scatter inset: Joshua Stevens' purple-gold 3 x 3, BIV[applications third][requests
// third]: requests run to purple (the complaint), applications to gold (the wallet), both to umber
export const BIV = [
  ['#E8E8E8', '#CBB8D7', '#9972AF'],
  ['#E4D9AC', '#C8ADA0', '#976B82'],
  ['#C8B35A', '#AF8E53', '#804D36'],
];
const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const isDark = (hex) => lum(hex) < 0.2;
export const CLASS_LABELS = ['under 2%', '2–5%', '5–7%', '7–10%', '10–15%', '15–20%', '20% or more'];
const CATS = ['sidewalks', 'crossings', 'streets', 'lights', 'cameras', 'other'];
const CAT_LABEL = { sidewalks: 'Sidewalks', crossings: 'Crossings', streets: 'Streets, alleys', lights: 'Lights, signals', cameras: 'Cameras', other: 'Other' };
const CAT_GRAY = { sidewalks: C.ink, crossings: '#5F5D58', streets: C.fog, lights: '#9C9A93', cameras: 'hatch', other: C.ground };
const CAT_COLOR = { sidewalks: '#1D5B45', crossings: '#6FA287', streets: C.fog, lights: '#D5B66D', cameras: '#9B3D2E', other: C.ground };
const DOT_MAX = 32; // per 1,000 residents, the chart's dot scale (ticks at 0, 10, 20, 30)

const fmt = (n) => Math.round(n).toLocaleString('en-US');
const pct = (v) => `${Math.round(v * 100)}%`;

// The ward's tooltip as a sheet (the day page's data-kind=sheet): a header shaded in the ward's map
// colour with its number box, then the three kinds of power as sections of label / value rows, the
// menu mix drawn as the chart's bar. `fill` is the ward's colour in this SVG's mode; `cat` the chart's
// category colours ('hatch' for the gray cameras); `rk` the ward's ranks among the 50.
export function wardSheet(w, years, fill, cat, rk) {
  const ord = (n) => `${n}${n % 100 > 10 && n % 100 < 14 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] ?? 'th')}`;
  const yy = `${years[0]}–${String(years[1]).slice(2)}`;
  return JSON.stringify({
    num: String(w.ward), name: `Ward ${w.ward}`, sub: `${pct(w.share)} on sidewalks`, fill, on: isDark(fill) ? '#FFFFFF' : C.ink,
    blocks: [
      { sec: `The alderman · menu money ${yy}` },
      { bar: [[+w.share.toFixed(4), cat.sidewalks], [+(1 - w.share).toFixed(4), cat.streets]] }, // sidewalks + crossings, others
      { row: ['Total', `$${(w.total / 1e6).toFixed(1)}M`] },
      { row: ['Sidewalks and crossings', pct(w.share), `${ord(rk.share)} of 50`] },
      { sec: 'The complaint · 311 sidewalk requests' },
      { row: ['Filed, per 1,000 residents', w.filed1k.toFixed(1), `${ord(rk.filed1k)} of 50`] },
      { row: ['Open today · 3 years or more', `${fmt(w.open)} · ${fmt(w.open3)}`] },
      { row: ['Closed requests: half within', `${fmt(w.closeDays)} days`] },
      { sec: 'The wallet · shared-cost applications' },
      { row: ['Per 1,000 residents', w.shared1k.toFixed(1), `${ord(rk.shared1k)} of 50`] },
      { foot: `${fmt(w.pop)} residents · about ${Math.round((100 * w.amb) / w.pop)}% with a difficulty walking` },
    ],
  });
}
const attr = (s) => esc(s).replace(/"/g, '&quot;');

export function renderDay12(data, { mode = 'gray', variant = 'plate', palette, chartOpts = {}, insetOpts = {} } = {}) {
  const { wards, summary } = data;
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
  const PAL = color ? (typeof palette === 'object' ? palette : PALETTES[palette ?? COLOR_PALETTE]) : PALETTES.gray;
  const CAT = color ? { ...CAT_COLOR, ...(PAL.cat ?? {}) } : CAT_GRAY; // a palette may recolour the chart's sidewalks and crossings
  const BV = PAL.biv ?? BIV; // the scatter's 3 x 3 scheme: the palette's own, else the default
  // ranks among the 50 wards (1 = highest), for the tooltip sheet
  const rankOf = (key, w) => 1 + wards.filter((x) => x[key] > w[key]).length;
  // the hover hooks every view of a ward shares: the sheet tooltip, and data-keys to light it up everywhere
  const hook = (w, id) => `data-id="${id}" data-kind="sheet" data-tip="Ward ${w.ward}" data-name="Ward ${w.ward}" data-lines="" data-keys="w${w.ward}" data-sheet="${attr(wardSheet(w, years, PAL.map[w.cls], CAT, { share: rankOf('share', w), filed1k: rankOf('filed1k', w), shared1k: rankOf('shared1k', w) }))}"`;

  const hatch = `<defs><pattern id="${uid}-h" width="2.4" height="2.4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="2.4" height="2.4" fill="${C.paper}"/><line x1="0" y1="0" x2="0" y2="2.4" stroke="${C.ink}" stroke-width="0.7"/></pattern></defs>`;
  out.push(hatch);
  const catFill = (c) => (CAT[c] === 'hatch' ? `url(#${uid}-h)` : CAT[c]);
  if (hooks) out.push(`<style>.${uid}-w .tint{fill-opacity:0;transition:fill-opacity .12s}.${uid}-w:hover .tint,svg.hl .${uid}-w.on .tint{fill-opacity:.14}.${uid}-row .bg{transition:fill .12s}.${uid}-row:hover .bg,svg.hl .${uid}-row.on .bg{fill:${C.rule}}</style>`);

  // a ward piece: its tone, a tint for hover, and the hover hooks
  const ring = (r, fx, fy) => 'M' + r.map(([x, y]) => `${fx(x).toFixed(1)},${fy(y).toFixed(1)}`).join('L') + 'Z';
  const piece = (w, fx, fy, fill, gap = 0, edge = C.paper) => {
    const d = w.rings.map((r) => ring(r, fx, fy)).join('');
    const st = gap ? ` stroke="${edge}" stroke-width="${gap}" stroke-linejoin="round"` : '';
    const body = `<path d="${d}" fill="${fill}" fill-rule="evenodd"${st}/>`;
    if (!hooks) return body;
    return `<g class="${uid}-w" ${hook(w, `w${w.ward}`)}>${body}<path class="tint" d="${d}" fill="${C.ink}" fill-rule="evenodd"/></g>`;
  };

  if (isPlate) out.push(frame({
    plate: 'XII',
    chapter: 'THE SYSTEMS',
    day: 12,
    theme: 'Power',
    title: 'Who Fixes the Sidewalk',
    subtitle: 'Fifty aldermen, the same money each. How much went to the sidewalks, and who asks the city instead?',
  }));

  // ---------- main map: the whole city, O'Hare included ----------
  const ext = { west: -13600, east: 4800, south: -14000, north: 8000 };
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
    // wards in place, split by a thin paper gap
    // ward outlines in light gray (frame), at the user's request: the series' one other exception to
    // "no outlines" after Plate VIII's coastline
    for (const w of wards) out.push(piece(w, X, Y, PAL.map[w.cls], isMap ? 0.8 : 0.6, C.frame));
    // (the sidewalk and crossing projects are no longer drawn: user, 2026-11-14)
    // ward numbers in white boxes, each at the spot the notebook found inside its ward (lx, ly), where a
    // box of the plate's size clears the ward's boundary by 1.2 px or more; narrow wards (ls < 1) take a
    // smaller box. Wards do not overlap, so neither do the boxes. The page's map is larger, so its
    // slightly bigger boxes still fit.
    for (const w of wards) {
      const ns = (isMap ? 7.5 : 6.5) * (w.ls ?? 1);
      const bw = textWidth(String(w.ward), ns, { weight: 600 }) + 4 * (w.ls ?? 1), bh = 9 * (w.ls ?? 1) * (isMap ? 7.5 / 6.5 : 1);
      const x = X(w.lx), y = Y(w.ly);
      out.push(`<rect x="${(x - bw / 2).toFixed(2)}" y="${(y - bh / 2).toFixed(2)}" width="${bw.toFixed(2)}" height="${bh.toFixed(2)}" rx="1.5" fill="#FFFFFF" stroke="${C.frame}" stroke-width="0.4" pointer-events="none"/>`);
      out.push(text(x, y + ns * 0.36, String(w.ward), { size: ns, anchor: 'middle', weight: 600, fill: C.ink }));
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
    const numMark = (fs) => `<rect x="-6.5" y="-5" width="13" height="10" rx="1.5" fill="#FFFFFF" stroke="${C.frame}" stroke-width="0.5"/><text y="${(fs * 0.36).toFixed(1)}" font-size="${fs}" font-weight="600" text-anchor="middle" fill="${C.ink}" font-family="Roboto, sans-serif">19</text>`;
    if (isPlate) {
      const short = [['head', 'Menu money on sidewalks and crossings']];
      CLASS_LABELS.forEach((l, i) => short.push([sw(PAL.map[i]), i === 0 ? 'under 2%' : i === CLASS_LABELS.length - 1 ? '20%+' : l.replace('%', '')]));
      short.push([numMark(7), 'ward']);
      let lx = 60;
      const y = 203;
      for (const [m, lab] of short) {
        if (m === 'head') {
          out.push(text(lx, y, `${lab}:`, { size: lgs, fill: C.pencil }));
          lx += textWidth(`${lab}:`, lgs) + 6;
          continue;
        }
        const mw = m.includes('<text') ? 13 : 10;
        out.push(`<g transform="translate(${lx + mw / 2} ${y - lgs * 0.35})">${m}</g>`);
        out.push(text(lx + mw + 4, y, lab, { size: lgs, fill: C.pencil }));
        lx += mw + 4 + textWidth(lab, lgs) + 9;
      }
    } else {
      const items = [['head', `Menu money on sidewalks, ${years[0]}–${String(years[1]).slice(2)}`], ...CLASS_LABELS.map((l, i) => [sw(PAL.map[i]), l]), ['gap'],
        [numMark(8), 'Ward number (2015–2023 wards)']];
      out.push(legendBox(items, { x: rx, bottom: Y(ext.south) - k, k, size: lgs }));
    }
  }

  if (isMap) {
    return svg(out.join(''), { label: mapLabel(data), viewBox: `60 184 ${Math.ceil(colX + 4 - 60)} ${Math.ceil(fy1 + 10 - 184)}`, align: 'xMinYMin meet' })
      .replace('<svg ', `<svg data-top="${labelTop - 184}" data-bottom="${fy1 - 184}" data-ftop="${+(fy0 - 184).toFixed(2)}" data-ppm="${+k.toFixed(3)}" `);
  }

  // ---------- margin column (plate), chart (page) ----------
  const mx = isPlate ? Math.round(colX + 38) : isChart ? 2 : 0;
  const title = (y, str) => out.push(text(mx, y, str, { size: 10.5 * T, weight: 600, spacing: 1 }));
  const ns = 10.5, nh = 14;
  const note = (y, str, x = mx) => out.push(text(x, y, str, { size: ns, font: SERIF, italic: true, fill: C.pencil }));
  let uy = 0;

  if (isPlate || isChart) {
    // page chart options: width, row, font, cats ('two' | 'three' | 'all'), dots, top (N wards each end)
    // the page chart (chosen 2026-11-14, option B of .private/day12-middle-study): drawn 1:1 in the 259 px
    // column at 10 px, the 10 wards that spent most and the 10 that spent least (user), two spending groups with the
    // sidewalk share printed, the dots kept. The plate keeps all 50 rows, also in the two groups.
    const co = isChart ? { width: 253, row: 14, font: 10, cats: 'two', dots: true, top: 10, ...chartOpts } : { cats: 'two', dots: true, top: 0 };
    const cw = isChart ? co.width : W_COL;
    const row = isChart ? co.row : 6.8;
    const cs = isChart ? co.font : 6;
    const numW = isChart ? Math.round(cs * 1.9) : 12;
    const barX = mx + numW + 4;
    const barW = isChart ? (co.dots ? Math.round((cw - numW) * 0.52) : cw - numW - 6) : 160;
    const dotX0 = barX + barW + 12, dotX1 = mx + cw - 2;
    // spending groups (user, 2026-11-14: two, 'Sidewalks + crossings' and 'Others' in the streets' gray);
    // 'three' and 'all' kept for studies
    const CATS_USED = co.cats === 'two' ? ['walk', 'others'] : co.cats === 'three' ? ['walk', 'streets', 'rest'] : CATS;
    const catVal = (w, c) => (c === 'walk' ? w.sidewalks + w.crossings : c === 'others' ? w.total - w.sidewalks - w.crossings : c === 'rest' ? w.lights + w.cameras + w.other : w[c]);
    const fill3 = { walk: catFill('sidewalks'), others: catFill('streets'), streets: catFill('streets'), rest: color ? '#B9B29A' : '#9C9A93' };
    const lab3 = { walk: 'Sidewalks + crossings', others: 'Others', streets: 'Streets, alleys', rest: 'Lights, cameras, other' };
    const dx = (v) => dotX0 + Math.min(v, DOT_MAX) / DOT_MAX * (dotX1 - dotX0);
    if (isChart) uy = co.dots ? Math.ceil(cs + 4) : 4; // room for the dot scale above the rows
    else {
      uy = Math.round(labelTop + 10.5 * T * 0.72);
      title(uy, CHART_TITLE.toUpperCase());
      const noteLines = wrap(CHART_NOTE + (color ? ', each row shaded in the ward’s colour from the scatter' : ''), Math.floor(cw / (ns * 0.45)));
      noteLines.forEach((l, i) => note(uy + (i + 1) * nh + 4, l));
      uy += noteLines.length * nh + 14;
    }
    // dot axis
    const ay = uy;
    if (co.dots) for (const v of [0, 10, 20, 30]) {
      out.push(text(dx(v), ay, String(v), { size: cs, anchor: 'middle', fill: C.pencil }));
    }
    uy += 4;
    const rows0 = uy;
    const sorted = [...wards].sort((a, b) => b.share - a.share || a.ward - b.ward);
    // top: N wards at each end with a gap row between (page study); else all 50
    const order = co.top ? [...sorted.slice(0, co.top), null, ...sorted.slice(-co.top)] : sorted;
    if (co.dots) for (const v of [0, 10, 20, 30]) out.push(`<line x1="${dx(v)}" x2="${dx(v)}" y1="${rows0}" y2="${rows0 + order.length * row}" stroke="${C.rule}" stroke-width="0.6"/>`);
    for (const w of order) {
      const cy = uy + row / 2;
      if (!w) { // the gap: how many wards it stands for
        out.push(text(barX, cy + cs * 0.36, `· · · ${50 - 2 * co.top} wards between · · ·`, { size: cs, fill: C.pencil, italic: true, font: SERIF }));
        uy += row;
        continue;
      }
      if (hooks) out.push(`<g class="${uid}-row" data-hl="w${w.ward}" ${hook(w, `r${w.ward}`)}><rect class="bg" x="${mx - 2}" y="${uy}" width="${cw + 4}" height="${row}" fill="transparent"/>`);
      // the ward number in an outlined box (no fill in the chart, at the user's request); the wards under 1% in bold
      const bh = row * 0.88;
      out.push(`<rect x="${mx}" y="${(cy - bh / 2).toFixed(2)}" width="${numW}" height="${bh.toFixed(2)}" rx="1.5" fill="none" stroke="${C.frame}" stroke-width="0.5"/>`);
      out.push(text(mx + numW / 2, cy + cs * 0.36, String(w.ward), { size: cs, anchor: 'middle', fill: C.ink, weight: w.share < 0.01 ? 600 : 400 }));
      let x = barX;
      for (const c of CATS_USED) {
        const ww = barW * (catVal(w, c) / w.total);
        if (ww > 0.05) out.push(`<rect x="${x.toFixed(2)}" y="${(uy + row * 0.14).toFixed(2)}" width="${ww.toFixed(2)}" height="${(row * 0.72).toFixed(2)}" fill="${co.cats !== 'all' ? fill3[c] : catFill(c)}"/>`);
        x += ww;
      }
      if (co.cats !== 'all' && isChart) out.push(text(barX + barW * (catVal(w, 'walk') / w.total) + 3, cy + cs * 0.34, pct(w.share), { size: cs * 0.92, fill: C.ink, weight: 500 }));
      if (!co.dots) { if (hooks) out.push('</g>'); uy += row; continue; }
      const a = dx(w.filed1k), b = dx(w.shared1k), r = row * 0.3;
      // colour mode: the row behind the dots takes the ward's colour in the scatter (its bivariate
      // cell, at the scatter's background strength)
      if (color) out.push(`<rect x="${(dotX0 - 4).toFixed(1)}" y="${uy.toFixed(2)}" width="${(dotX1 - dotX0 + 8).toFixed(1)}" height="${row}" fill="${BV[w.tMoney][w.tVoice]}" fill-opacity="0.35"/>`);
      out.push(`<line x1="${Math.min(a, b).toFixed(1)}" x2="${Math.max(a, b).toFixed(1)}" y1="${cy}" y2="${cy}" stroke="${color ? C.pencil : C.fog}" stroke-width="0.8"/>`);
      out.push(`<circle cx="${b.toFixed(1)}" cy="${cy}" r="${r.toFixed(2)}" fill="${C.paper}" stroke="${C.ink}" stroke-width="${(r * 0.45).toFixed(2)}"/>`);
      out.push(`<circle cx="${a.toFixed(1)}" cy="${cy}" r="${r.toFixed(2)}" fill="${C.ink}"/>`);
      if (hooks) out.push('</g>');
      uy += row;
    }
    // key for the bar
    uy += 6;
    let kx = mx;
    const ks = isChart ? cs : 7;
    CATS_USED.forEach((c, i) => {
      const lab = co.cats !== 'all' ? lab3[c] : CAT_LABEL[c];
      const kw = 11 + textWidth(lab, ks) + (isChart ? 10 : 6);
      if (isChart && kx > mx && kx + kw > mx + cw) { kx = mx; uy += ks + 5; } // wrap the key to the width
      out.push(`<rect x="${kx}" y="${uy}" width="8" height="6" fill="${co.cats !== 'all' ? fill3[c] : catFill(c)}"${c === 'other' ? ` stroke="${C.frame}" stroke-width="0.5"` : ''}/>`);
      out.push(text(kx + 11, uy + 6, lab, { size: ks, fill: C.pencil }));
      kx += kw;
    });
    uy += 8;
    if (isChart) {
      return svg(out.join(''), { label: `${CHART_TITLE}: Ward ${summary.top.ward} put ${pct(summary.top.share)} of its menu money into sidewalks and crossings, Ward ${summary.bottom.ward} none.`, viewBox: `0 0 ${cw + 6} ${Math.ceil(uy + 6)}`, align: 'xMinYMin meet' });
    }
  }

  // ---------- inset: the complaint and the wallet ----------
  // a scatter: each ward a dot, 311 sidewalk requests (across) against shared-cost applications (up),
  // per 1,000 residents, 2019-22. Dashed lines cut each axis into thirds of the wards; in colour mode
  // the nine cells take a bivariate scheme (BIV) and each dot its cell's colour.
  const ty = uy + 30;
  let noteH = 0;
  if (isPlate) {
    title(ty, INSET_TITLE.toUpperCase());
    const str = 'Each ward a dot, per 1,000 residents, 2019–22; marked by thirds of the wards on each axis.';
    const ls = wrap(str, Math.floor(W_COL / (ns * 0.45)));
    ls.forEach((l, i) => note(ty + (i + 1) * nh + 4, l));
    noteH = ls.length * nh;
  }
  const io = { width: 259, height: 250, font: 11, ...insetOpts }; // the page scatter: 1:1 in the 259 px column
  const iw = isInset ? io.width : W_COL;
  const fs = isInset ? io.font : 7.5;
  const padL = isInset ? Math.round(io.font * 3.3) : 24, padB = isInset ? 34 : 28;
  const top0 = isInset ? 8 : ty + noteH + 18;
  const x0 = (isInset ? 0 : mx) + padL, x1 = (isInset ? 0 : mx) + iw - 4;
  const ph = isInset ? io.height : 190;
  const y1 = top0, y0 = top0 + ph; // y0 = the axis at the bottom
  const XMAX = 32, YMAX = 14;
  const sq = isInset && io.scale === 'sqrt'; // page option: square-root axes spread the crowded low corner
  const tf = (v) => (sq ? Math.sqrt(Math.max(0, v)) : v);
  const SX = (v) => x0 + (tf(v) / tf(XMAX)) * (x1 - x0);
  const SY = (v) => y0 - (tf(v) / tf(YMAX)) * (y0 - y1);
  const bv = data.breaks.voice, bm = data.breaks.money;
  const xs = [0, ...bv, XMAX], ys = [0, ...bm, YMAX];
  if (color) {
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
      out.push(`<rect x="${SX(xs[i]).toFixed(1)}" y="${SY(ys[j + 1]).toFixed(1)}" width="${(SX(xs[i + 1]) - SX(xs[i])).toFixed(1)}" height="${(SY(ys[j]) - SY(ys[j + 1])).toFixed(1)}" fill="${BV[j][i]}" fill-opacity="0.35"/>`);
    }
  }
  for (const v of bv) out.push(`<line x1="${SX(v).toFixed(1)}" x2="${SX(v).toFixed(1)}" y1="${y1}" y2="${y0}" stroke="${C.frame}" stroke-width="0.6" stroke-dasharray="2 2"/>`);
  for (const v of bm) out.push(`<line x1="${x0}" x2="${x1}" y1="${SY(v).toFixed(1)}" y2="${SY(v).toFixed(1)}" stroke="${C.frame}" stroke-width="0.6" stroke-dasharray="2 2"/>`);
  out.push(`<line x1="${x0}" x2="${x1}" y1="${y0}" y2="${y0}" stroke="${C.ink}" stroke-width="0.6"/><line x1="${x0}" x2="${x0}" y1="${y1}" y2="${y0}" stroke="${C.ink}" stroke-width="0.6"/>`);
  for (const v of sq ? [0, 2, 5, 10, 20, 30] : [0, 10, 20, 30]) out.push(text(SX(v), y0 + fs + 3, String(v), { size: fs, anchor: 'middle', fill: C.pencil }));
  for (const v of sq ? [0, 1, 2, 5, 10] : [0, 5, 10]) out.push(text(x0 - 4, SY(v) + fs * 0.36, String(v), { size: fs, anchor: 'end', fill: C.pencil }));
  out.push(text(x1, y0 + 2 * fs + 7, '311 SIDEWALK REQUESTS PER 1,000', { size: fs * 0.9, anchor: 'end', spacing: 0.3, weight: 600 }));
  const yt = x0 - padL + fs * 0.8;
  out.push(text(yt, y1, 'SHARED-COST APPLICATIONS PER 1,000', { size: fs * 0.9, anchor: 'end', spacing: 0.3, weight: 600, rotate: -90 }));
  const r = isInset ? io.font * 0.47 : 3;
  const named = new Set([...summary.low, summary.top.ward, [...wards].sort((a, b) => b.filed1k - a.filed1k)[0].ward]);
  for (const w of [...wards].sort((a, b) => a.filed1k - b.filed1k)) {
    const cx = SX(Math.min(w.filed1k, XMAX)), cy = SY(Math.min(w.shared1k, YMAX));
    const fill = color ? BV[w.tMoney][w.tVoice] : C.ink;
    const dot = `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r}" fill="${fill}" stroke="${color ? C.ink : C.paper}" stroke-width="${color ? 0.5 : 0.7}"/>`;
    out.push(hooks
      ? `<g ${hook(w, `s${w.ward}`)}><circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r + 3}" fill="transparent"/>${dot}</g>`
      : dot);
    if (named.has(w.ward)) {
      const left = cx + r + 2.5 + textWidth(String(w.ward), fs, { weight: 600 }) > x1; // near the right edge: label on the left
      out.push(text(left ? cx - r - 2.5 : cx + r + 2.5, cy + fs * 0.36, String(w.ward), { size: fs, weight: 600, fill: C.ink, halo: color ? undefined : C.paper, anchor: left ? 'end' : 'start' }));
    }
  }
  const ky = y0 + 2 * fs + 10;
  if (isInset) {
    return svg(out.join(''), { label: `${INSET_TITLE}: each ward's 311 sidewalk requests against its shared-cost applications, per 1,000 residents, 2019 to 2022. The same wards lead both.`, viewBox: `0 0 ${iw} ${Math.ceil(ky + 4)}`, align: 'xMidYMid meet' });
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
    ['WARDS', 'The 2015–2023 wards, in force for all four years, from Ward Precincts 2013–2022 (nvke-umup)'],
    ['PEOPLE', `2020 Census blocks, ${fmt(summary.residents)} residents; difficulty walking from ACS 2020–2024 (B18105), an estimate`],
    ['SHARED', 'Shared Cost Sidewalk Program, 2026 overview: the owner pays part; applications on one day each January, first come, first served'],
    ['AUDIT', 'Office of Inspector General, audit of the Aldermanic Menu Program (April 2017) and advisory (June 2019)'],
    ['LAWSUIT', 'Lane v. City of Chicago, filed September 2025 (Disability Rights Advocates); the city has moved to dismiss; still open'],
    ['GRID', 'Each square one mile from State & Madison; the first mile south of Madison runs to Roosevelt Road (1200 S)'],
    ...(color && PAL === PALETTES.sandteal ? [['COLOUR', 'Sand to teal, light for less, dark for more; scatter in Joshua Stevens’ purple–gold bivariate scheme']] : []),
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
