// Plate XVI · Something in the Way · Day 16 Collaborative map
import { C, SERIF, esc, text, textWidth, legendBox, wrap, frame, svg } from '../lib/plate.js';
import { gridLines, formatAddress, toMiles } from '../lib/grid.js';

// A map made with Chicago residents: every block's color comes from the 311 reports they sent about
// something in the way on the sidewalk: scooters or Divvy bikes parked across it (wheels), or snow
// nobody cleared (snow), January 2022 to October 2026.
// variant 'plate': the full 1080 x 1350 plate (export, download).
// variant 'map': half-mile blocks in a 3 x 3 bivariate scale: reports (up) x share of them in December
//   to February (across). Hover a block for its counts (data-kind=sheet).
// variant 'chart': two charts, reports a month, one line per year: wheels, then snow. It fills the
//   page's middle column (no inset). Hover a month for every year's count.

// Color: brick for the warm months (wheels), blue for winter (snow), plum between; darker = more reports.
// Grayscale: tone for reports, an ink square for the share in winter (Plate IX's way).
export const PAL = {
  color: {
    bivar: [['#F2D3C9', '#E2D6DE', '#D3E1EE'], ['#D98A73', '#A994A9', '#7FA9CF'], ['#A63A26', '#5E3F63', '#285E92']],
    wheels: '#A63A26', snow: '#285E92',
    years: { wheels: ['#E7A897', '#D27E68', '#B9553E', '#93341F', '#5E1D10'], snow: ['#A9C8E3', '#7BAAD3', '#4F88BD', '#2D6299', '#163F69'] },
  },
  gray: {
    tones: ['#DAD8D2', '#AEACA6', '#7E7C76'], sizes: [0, 0.34, 0.62],
    wheels: '#5A5853', snow: '#BDBBB4',
    years: { wheels: ['#C2C0B9', '#A09E97', '#7E7C76', '#545250', '#232323'], snow: ['#C2C0B9', '#A09E97', '#7E7C76', '#545250', '#232323'] },
  },
};
export const MONTH_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTH_1 = 'JFMAMJJASOND';
const COLS = ['Mostly March–November', 'Mixed', 'Mostly December–February'];

const fmt = (n) => Math.round(n).toLocaleString('en-US');
const pct = (v) => `${Math.round(v * 100)}%`;
const r1 = (v) => v.toFixed(1);
const attr = (s) => esc(s).replace(/"/g, '&quot;');
const isDark = (hex) => { const n = parseInt(hex.slice(1), 16); return 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) < 140; };
const addrY = (y) => (y >= 0 ? y * 800 : y >= -1 ? y * 1200 : -1200 + (y + 1) * 800);
// a block's middle as an address pair, e.g. '1800 N · 1000 W'
export const blockPlace = (x, y, step = 0.5) => `${formatAddress(Math.round(addrY(y + step / 2)), 'y')} · ${formatAddress(Math.round((x + step / 2) * 800), 'x')}`;
const monthShort = (iso) => `${MONTH_LONG[Number(iso.slice(5, 7)) - 1].slice(0, 3)} ${iso.slice(0, 4)}`;
const lastMonth = (iso) => { const y = Number(iso.slice(0, 4)), m = Number(iso.slice(5, 7)); return m === 1 ? `Dec ${y - 1}` : `${MONTH_LONG[m - 2].slice(0, 3)} ${y}`; };
export const windowText = (w) => `${monthShort(w[0])} – ${lastMonth(w[1])}`;
export const reportClasses = (br) => [`Under ${br[0]}`, `${br[0]}–${br[1] - 1}`, `${br[1]} or more`];

// block row: [x, y, scooter, divvy, snow, winter share, busiest month, area index, report class, winter class]
const B = (b) => ({ x: b[0], y: b[1], scooter: b[2], divvy: b[3], snow: b[4], winter: b[5], peak: b[6], area: b[7], tc: b[8], wc: b[9] });

// the block's tooltip (the day page's data-kind=sheet), its header in the block's own shade
export function blockSheet(b, pal, mode, areas, win) {
  const fill = mode === 'color' ? pal.bivar[b.tc][b.wc] : pal.tones[b.tc];
  const tot = b.scooter + b.divvy + b.snow;
  return JSON.stringify({
    num: fmt(tot), name: areas[b.area] || 'Chicago', sub: `Around ${blockPlace(b.x, b.y)}`, fill, on: isDark(fill) ? '#FFFFFF' : C.ink,
    blocks: [
      { sec: `Reports to 311 · ${win}` },
      { bar: [[+((b.scooter + b.divvy) / tot).toFixed(4), pal.wheels], [+(b.snow / tot).toFixed(4), pal.snow]] },
      { row: ['Scooters parked in the way', fmt(b.scooter)] },
      { row: ['Divvy bikes parked in the way', fmt(b.divvy)] },
      { row: ['Sidewalks not cleared of snow', fmt(b.snow)] },
      { row: ['Sent in December–February', pct(b.winter)] },
      { foot: `Busiest month: ${MONTH_LONG[b.peak - 1]}` },
    ],
  });
}

// the bivariate key: reports rise upward, the share in winter grows to the right. (x, y): left and bottom edges.
export function squareKey(pal, x, y, s, T, br) {
  const out = [];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
    const cx = x + j * s, cy = y - (i + 1) * s;
    out.push(`<rect x="${r1(cx)}" y="${r1(cy)}" width="${s}" height="${s}" fill="${pal.bivar ? pal.bivar[i][j] : pal.tones[i]}" stroke="${C.paper}" stroke-width="0.6"/>`);
    if (pal.sizes && pal.sizes[j] > 0) {
      const f = pal.sizes[j] * s * 0.8;
      out.push(`<rect x="${r1(cx + (s - f) / 2)}" y="${r1(cy + (s - f) / 2)}" width="${r1(f)}" height="${r1(f)}" fill="${C.ink}"/>`);
    }
  }
  const ts = 7.5 * T, o = 4, r = x + 3 * s;
  reportClasses(br).forEach((v, i) => out.push(text(r1(r + o), r1(y - (i + 0.5) * s + ts * 0.35), v, { size: ts, fill: C.pencil })));
  out.push(text(r1(x), r1(y - 3 * s - o - 2), 'REPORTS PER BLOCK', { size: ts, weight: 600, spacing: 0.3 }));
  ['0', '33', '67', '100%'].forEach((v, j) => out.push(text(r1(x + j * s), r1(y + o + ts), v, { size: ts * 0.9, fill: C.pencil, anchor: 'middle' })));
  out.push(text(r1(x), r1(y + o + 2.3 * ts), '% SENT IN DEC–FEB', { size: ts, weight: 600, spacing: 0.3 }));
  return out.join('');
}

export function renderDay16(data, { mode = 'gray', variant = 'plate' } = {}) {
  const { summary: s, boundary = [], areas, monthly } = data;
  const blocks = data.blocks.map(B);
  const out = [];
  const isPlate = variant === 'plate';
  const isMap = variant === 'map';
  const isChart = variant === 'chart';
  const hooks = isMap || isChart;
  const uid = `d16-${variant}-${mode}`;
  const T = hooks ? 1.3 : 1.15;
  const pal = PAL[mode] ?? PAL.gray;
  const win = windowText(s.window);
  const step = data.step;
  const ring = (r, fx, fy) => 'M' + r.map(([x, y]) => `${fx(x).toFixed(1)},${fy(y).toFixed(1)}`).join('L') + 'Z';
  const miles = (b) => ({ west: toMiles(b.west, 'x'), east: toMiles(b.east, 'x'), south: toMiles(b.south, 'y'), north: toMiles(b.north, 'y') });

  if (isPlate) out.push(frame({
    plate: 'XVI',
    chapter: 'THE GAPS',
    day: 16,
    theme: 'Collaborative map',
    title: 'Something in the Way',
    subtitle: 'Mapped from what Chicago residents told 311: scooters and bikes in the warm months, snow in winter.',
  }));

  // ---------- main map: the extent of Plates II–XV ----------
  const ext = { west: -11200, east: 4800, south: -14000, north: 10400 };
  const mi = miles(ext);
  const field = isMap ? { x: 60, y: 250, w: 760, h: 1040 } : { x: 60, y: 262, w: 575, h: 830 };
  const k = Math.min(field.w / (mi.east - mi.west), field.h / (mi.north - mi.south));
  const Xm = (x) => field.x + (x - mi.west) * k;
  const Ym = (y) => field.y + (mi.north - y) * k;
  const X = (x) => Xm(toMiles(x, 'x'));
  const Y = (y) => Ym(toMiles(y, 'y'));
  const fx0 = X(ext.west), fx1 = X(ext.east), fy0 = Y(ext.north), fy1 = Y(ext.south);
  const g = gridLines(ext);
  const gl = 8 * T;
  const labelLen = 7 * (gl * 0.6 + 0.4);
  const colX = fx1 + 6 + labelLen;
  const labelTop = fy0 - 6 - labelLen;

  if (isPlate || isMap) {
    const cityPath = boundary.map((r) => ring(r, X, Y)).join('');
    out.push(`<defs><clipPath id="${uid}-map"><rect x="${fx0}" y="${fy0}" width="${fx1 - fx0}" height="${fy1 - fy0}"/></clipPath></defs>`);
    out.push(`<g clip-path="url(#${uid}-map)">`);
    out.push(`<path d="${cityPath}" fill="${C.ground}" fill-rule="evenodd"/>`);
    // blocks, one path per class (and the gray mode's ink squares)
    const q = step * k;
    const paths = {};
    const marks = [];
    for (const b of blocks) {
      const fill = pal.bivar ? pal.bivar[b.tc][b.wc] : pal.tones[b.tc];
      const x0 = Xm(b.x), y0 = Ym(b.y + step);
      (paths[fill] ??= []).push(`M${r1(x0)},${r1(y0)}h${r1(q + 0.3)}v${r1(q + 0.3)}h${r1(-q - 0.3)}Z`);
      if (pal.sizes && pal.sizes[b.wc] > 0) {
        const f = pal.sizes[b.wc] * q * 0.8;
        marks.push(`M${r1(x0 + (q - f) / 2)},${r1(y0 + (q - f) / 2)}h${r1(f)}v${r1(f)}h${r1(-f)}Z`);
      }
    }
    for (const [fill, p] of Object.entries(paths)) out.push(`<path d="${p.join('')}" fill="${fill}"/>`);
    if (marks.length) out.push(`<path d="${marks.join('')}" fill="${C.ink}"/>`);
    for (const x of g.xs) out.push(`<line x1="${X(x)}" x2="${X(x)}" y1="${fy0}" y2="${fy1}" stroke="${x === 0 ? C.pencil : C.grid}" stroke-width="${x === 0 ? 0.8 : 0.6}" opacity="${x === 0 ? 1 : 0.8}"/>`);
    for (const y of g.ys) out.push(`<line x1="${fx0}" x2="${fx1}" y1="${Y(y)}" y2="${Y(y)}" stroke="${y === 0 ? C.pencil : C.grid}" stroke-width="${y === 0 ? 0.8 : 0.6}" opacity="${y === 0 ? 1 : 0.8}"/>`);
    // the two darkest corners of the key, named where they gather most
    for (const [wc, area] of [[0, s.warm.areas[0]], [2, s.cold.areas[0]]]) {
      const ai = areas.indexOf(area);
      const pick = blocks.filter((b) => b.tc === 2 && b.wc === wc && b.area === ai);
      if (!pick.length) continue;
      const yMid = pick.reduce((a, b) => a + b.y, 0) / pick.length + step / 2;
      const lab = area.toUpperCase();
      // the lakefront corner is named to the east (over the lake), the other to the west of its blocks
      const east = wc === 0;
      const lx = east ? Xm(Math.max(...pick.map((b) => b.x)) + step) + 6 : Xm(Math.min(...pick.map((b) => b.x))) - 6;
      out.push(text(r1(lx), r1(Ym(yMid) + 7.5 * T * 0.35), lab, { size: 7.5 * T, weight: 600, spacing: 0.5, anchor: east ? 'start' : 'end', halo: C.paper }));
    }
    if (isMap) {
      for (const b of blocks) {
        out.push(`<g data-kind="sheet" data-id="b${b.x}_${b.y}" data-tip="${attr(areas[b.area] || 'Chicago')}" data-name="${attr(areas[b.area] || '')}" data-sheet="${attr(blockSheet(b, pal, mode, areas, win))}"><rect x="${r1(Xm(b.x))}" y="${r1(Ym(b.y + step))}" width="${r1(q)}" height="${r1(q)}" fill="transparent"/></g>`);
      }
    }
    out.push('</g>');
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
    const sw = (fill, f = 0) => `<rect x="-6" y="-6" width="12" height="12" fill="${fill}"/>${f ? `<rect x="${-6 * f}" y="${-6 * f}" width="${12 * f}" height="${12 * f}" fill="${C.ink}"/>` : ''}`;
    if (isPlate) {
      out.push(squareKey(pal, rx, Ym(-12.9), 24, T, data.reportBreaks));
      const line = `Each half-mile block is shaded by its reports to 311, ${win}, and the share sent in December–February (key at lower left)`;
      out.push(text(60, 203, line, { size: lgs, fill: C.pencil }));
    } else {
      const b = pal.bivar;
      const items = [
        ['head', `Each half-mile block, ${win}`],
        ...(b
          ? [[sw(b[2][0]), 'Brick: many reports, mostly Mar–Nov (scooters, bikes)'], [sw(b[2][2]), 'Blue: many reports, mostly Dec–Feb (snow)'], [sw(b[2][1]), 'Plum: both'], [sw(b[0][1]), 'Pale: few reports']]
          : [[sw(pal.tones[2]), 'Darker gray: more reports'], [sw(pal.tones[1], pal.sizes[2]), 'Ink square: more of them in Dec–Feb (snow)']]),
      ];
      const box = legendBox(items, { x: rx, bottom: Y(ext.south) - k, k, size: lgs });
      // the key sits in its own paper box on top of the legend box, the same four cells wide and a whole
      // number of cells tall (the legend box's top read from its rect)
      const boxTop = Number(box.match(/y="([\d.]+)"/)[1]);
      const ks = 22, ts = 7.5 * T, pad = 8;
      const need = 2 * pad + ts * 1.6 + 3 * ks + ts * 2.6;
      const keyTop = boxTop - Math.ceil(need / k) * k;
      out.push(`<rect x="${rx}" y="${r1(keyTop)}" width="${r1(4 * k)}" height="${r1(boxTop - keyTop)}" fill="${C.paper}" stroke="${C.frame}" stroke-width="0.8"/>`);
      out.push(box);
      const extra = (boxTop - keyTop - need) / 2;
      out.push(squareKey(pal, rx + pad, keyTop + extra + pad + ts * 1.6 + 3 * ks, ks, T, data.reportBreaks));
    }
  }

  if (isMap) {
    return svg(out.join(''), { label: mapLabel(s), viewBox: `60 184 ${Math.ceil(colX + 4 - 60)} 1114`, align: 'xMinYMin meet' })
      .replace('<svg ', `<svg data-top="${labelTop - 184}" data-bottom="${fy1 - 184}" data-ftop="${+(fy0 - 184).toFixed(2)}" data-ppm="${+k.toFixed(3)}" `);
  }

  // ---------- the two charts: reports a month, one line per year ----------
  const years = s.years.map(String);
  const charts = (x0, top, w, size) => {
    const o = [];
    let y = top;
    const lastYear = years.at(-1), lastM = Number(s.window[1].slice(5, 7)) - 1; // the window ends before this month's first day
    for (const [grp, head] of [['wheels', 'SCOOTERS AND DIVVY BIKES PARKED IN THE WAY'], ['snow', 'SIDEWALKS NOT CLEARED OF SNOW']]) {
      const ramp = pal.years[grp];
      o.push(text(x0, y + size * 0.85, head, { size: size * 0.95, weight: 600, spacing: 0.6 }));
      y += size * 1.6;
      const h = size * (isPlate ? 25 : 26), L = size * 3.6, R = size * 7.6;
      const cx0 = x0 + L, cx1 = x0 + w - R;
      const max = Math.max(...years.flatMap((yr) => monthly[grp][yr]));
      const stepV = max > 3000 ? 1000 : max > 1200 ? 500 : 250;
      const top2 = Math.ceil(max / stepV) * stepV;
      const Xc = (m) => cx0 + ((m - 1) / 11) * (cx1 - cx0);
      const Yc = (v) => y + h - (v / top2) * h;
      for (let v = 0; v <= top2; v += stepV) {
        o.push(`<line x1="${r1(cx0)}" x2="${r1(cx1)}" y1="${r1(Yc(v))}" y2="${r1(Yc(v))}" stroke="${v ? C.rule : C.fog}" stroke-width="0.7"/>`);
        o.push(text(r1(cx0 - 4), r1(Yc(v) + size * 0.3), fmt(v), { size: size * 0.78, fill: C.pencil, anchor: 'end' }));
      }
      for (let m = 1; m <= 12; m++) o.push(text(r1(Xc(m)), r1(y + h + size * 1.15), MONTH_1[m - 1], { size: size * 0.8, fill: C.pencil, anchor: 'middle' }));
      years.forEach((yr, i) => {
        const vals = monthly[grp][yr].slice(0, yr === lastYear ? lastM : 12);
        const pts = vals.map((v, m) => `${r1(Xc(m + 1))},${r1(Yc(v))}`).join(' ');
        o.push(`<polyline points="${pts}" fill="none" stroke="${ramp[i]}" stroke-width="${i === years.length - 1 ? 2 : 1.3}" stroke-linejoin="round" stroke-linecap="round"/>`);
        const ly = y + size * 0.4 + i * size * 1.35;
        o.push(`<line x1="${r1(cx1 + size * 0.9)}" x2="${r1(cx1 + size * 2.1)}" y1="${r1(ly)}" y2="${r1(ly)}" stroke="${ramp[i]}" stroke-width="2.2"/>`);
        o.push(text(r1(cx1 + size * 2.5), r1(ly + size * 0.3), yr, { size: size * 0.8, fill: C.pencil }));
        o.push(text(r1(x0 + w), r1(ly + size * 0.3), fmt(s.yearTotals[grp][yr]), { size: size * 0.8, weight: 600, anchor: 'end' }));
      });
      o.push(text(r1(x0 + w), r1(y + size * 0.4 + years.length * size * 1.35 + size * 0.3), `${lastYear} to ${lastMonth(s.window[1]).slice(0, 3)}`, { size: size * 0.7, fill: C.pencil, anchor: 'end', italic: true, font: SERIF }));
      if (hooks) {
        for (let m = 1; m <= 12; m++) {
          const sh = JSON.stringify({
            num: MONTH_1[m - 1], name: MONTH_LONG[m - 1], sub: grp === 'wheels' ? 'Scooters and Divvy bikes' : 'Snow on the sidewalk', fill: ramp.at(-1), on: '#FFFFFF',
            blocks: [{ sec: 'Reports to 311, citywide' }, ...years.filter((yr) => yr !== lastYear || m <= lastM).map((yr) => ({ row: [yr, fmt(monthly[grp][yr][m - 1])] }))],
          });
          const hw = (cx1 - cx0) / 11;
          o.push(`<g data-kind="sheet" data-id="${grp}${m}" data-tip="${MONTH_LONG[m - 1]}" data-name="${MONTH_LONG[m - 1]}" data-sheet="${attr(sh)}"><rect x="${r1(Xc(m) - hw / 2)}" y="${r1(y)}" width="${r1(hw)}" height="${r1(h)}" fill="transparent"/></g>`);
        }
      }
      y += h + size * 3.4;
    }
    return { svg: o.join(''), height: y - size * 1.6 - top };
  };

  if (isChart) {
    const cw = 390, size = 8 * T;
    const c = charts(0, 4, cw, size);
    return svg(c.svg, { label: chartLabel(s), viewBox: `0 0 ${cw} ${Math.ceil(c.height + 8)}`, align: 'xMidYMin meet' });
  }

  // ---------- plate: margin column with the charts, then Findings ----------
  const mx = Math.round(colX + 38);
  const ns = 10.5, nh = 14;
  const title = (y, str) => out.push(text(mx, y, str, { size: 10.5 * T, weight: 600, spacing: 1 }));
  const note = (y, str) => out.push(text(mx, y, str, { size: ns, font: SERIF, italic: true, fill: C.pencil }));
  let uy = Math.round(labelTop + 10.5 * T * 0.72);
  title(uy, CHART_TITLE.toUpperCase());
  const noteLines = wrap(CHART_NOTE, Math.floor(W_COL / (ns * 0.45)));
  noteLines.forEach((l, i) => note(uy + (i + 1) * nh + 4, l));
  uy += noteLines.length * nh + 16;
  out.push(charts(mx, uy, W_COL, 8).svg);

  const findingsH = 330;
  let fy = Math.round(fy1 - findingsH + 30);
  title(fy, 'FINDINGS');
  for (const l of wrap(data.finding, Math.floor(W_COL / (ns * 0.45)))) note((fy += nh) + 4, l);
  fy += 10;
  const bs = 9.5, bh2 = 12.6;
  for (const para of data.findings ?? []) {
    for (const l of wrap(para, Math.floor(W_COL / (bs * 0.48)))) out.push(text(mx, (fy += bh2), l, { size: bs, font: SERIF }));
    fy += 5;
  }

  // data ledger, under the map
  const lx = fx0;
  let dy = Math.round(fy1) + 34;
  out.push(text(lx, dy, 'DATA LEDGER', { size: 10.5 * T, weight: 600, spacing: 1 }));
  const ledger = [
    ['REPORTS', `City of Chicago, 311 Service Requests · ${data.dataset} · pulled ${data.ledger.pulled}; ${win}; duplicates flagged by the city left out`],
    ['TYPES', 'E-Scooter Parking Complaint and Divvy Bike Parking Complaint (wheels); Snow – Uncleared Sidewalk Complaint (snow)'],
    ['BLOCKS', `Half-mile squares of the grid; reports: ${reportClasses(data.reportBreaks).join(', ').toLowerCase()}; share sent in Dec–Feb: thirds`],
    ['LIMITS', 'Reports show where residents report, not every obstacle; City of Chicago, Boundaries – City · qqq8-j68g'],
  ];
  dy += 18;
  for (const [kk, v] of ledger) {
    out.push(text(lx, dy, kk, { size: 8.5, fill: C.pencil, spacing: 0.6 }));
    out.push(text(lx + 64, dy, v, { size: 9.5, font: SERIF }));
    dy += 13.5;
  }

  return svg(out.join(''), { label: mapLabel(s) });
}

const W_COL = 300;
export const CHART_TITLE = 'Month by month, year by year';
export const CHART_NOTE = 'Reports a month, citywide, one line for each year (darker is later). Scooter reports begin in April 2022.';

const mapLabel = (s) =>
  `Plate XVI, Something in the Way: half-mile blocks of Chicago shaded by the 311 reports residents sent about scooters, Divvy bikes and uncleared snow on the sidewalk, and by the share sent in winter. In the last 12 months: ${fmt(s.wheels12)} reports of wheels, ${fmt(s.snow12)} of snow.`;
const chartLabel = (s) =>
  `${CHART_TITLE}: reports a month to 311, one line per year from ${s.years[0]} to ${s.years.at(-1)}, for scooters and Divvy bikes parked in the way and for sidewalks not cleared of snow.`;
