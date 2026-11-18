// Plate XVII · The 3 a.m. City · Day 17 Light & dark
import { C, SERIF, esc, text, textWidth, legendBox, wrap, frame, svg } from '../lib/plate.js';
import { gridLines, formatAddress, toMiles } from '../lib/grid.js';

// variant 'plate': the full 1080 x 1350 plate (export, download), at 3 a.m.
// variant 'map': the map alone, with hover hooks, for the day page's left column. It carries 25 states:
//   <g data-state="all"> (3 a.m., as the plate) and <g data-state="h00">…<g data-state="h23"> (hidden).
// variant 'chart': buses leaving city stops each hour and the share of residents within a half mile of a
//   departure; each hour is a control, [data-state-key="hNN"], that shows that hour on the map and inset.
// variant 'inset': the Far Southwest Side, with the same 25 states.
// The map is made of light and shadow only. Each quarter-mile block of the address grid (centered on the
// quarter-mile lines, so the half-mile arterials run through the middle of a block) is lit by the buses
// leaving its stops in the hour: brighter = more. Each block also stands up in proportion to its light,
// toward a light in the northwest, and casts a mild shadow to the southeast (an SVG filter per class:
// the class's blocks, offset along the light, in black at SHADOW opacity). Classes are drawn from dim to
// bright, so a taller block covers the shadows that fall on it. Thin gutters mark the blocks.

// buses leaving a block in the hour: class c (1–10) from BREAKS[c - 1]
export const BREAKS = [1, 2, 4, 7, 12, 20, 35, 60, 100, 150];
const CAP = 150;
const ALT = 38; // the light's altitude, degrees
const HMAX = 1.3; // the brightest block's height, in blocks
const SHADOW = 0.34;
const U = 20; // path units per block
const GAP = '#1B1B1A'; // gutters

// a class's light, 0–1: log scale of its geometric middle, as the study
const mid = (c) => (c === 10 ? CAP : Math.sqrt(BREAKS[c - 1] * (BREAKS[c] - 1 || BREAKS[c - 1])));
const level = (c) => (c === 0 ? 0 : Math.min(1, Math.log1p(mid(c)) / Math.log1p(CAP)));
const hex = (rgb) => '#' + rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const ramp = (stops) => (t) => {
  const n = stops.length - 1, i = Math.min(n - 1, Math.floor(t * n)), f = t * n - i;
  const a = rgb(stops[i]), b = rgb(stops[i + 1]);
  return hex(a.map((v, j) => v + (b[j] - v) * f));
};
// grayscale: from a lit dark gray to paper; color: lamp light, from deep amber to warm white
const RAMPS = {
  gray: ramp(['#4C4B47', '#9A9890', '#F1F0EC']),
  color: ramp(['#5A3E22', '#B87A2C', '#F2C467', '#FFF4D6']),
};
export const NONE = { gray: '#363634', color: '#3A332C' }; // a city block with no bus in the hour
const FIELD = { gray: C.ink, color: '#211E1B' };
export const shade = (mode, c) => (c === 0 ? NONE[mode] ?? NONE.gray : (RAMPS[mode] ?? RAMPS.gray)(Math.pow((c - 1) / 9, 1.05)));
const clsOf = (n) => BREAKS.filter((b) => n >= b).length;

export const hourName = (h) => (h === 0 ? 'midnight' : h === 12 ? 'noon' : h < 12 ? `${h} a.m.` : `${h - 12} p.m.`);
const fmt = (n) => Math.round(n).toLocaleString('en-US');
const pct = (v) => `${Math.round(v * 100)}%`;
// near the ends, one decimal: 99.7%, not 100%; 0.3%, not 0%
const pctEnd = (v) => (v > 0.995 || v < 0.005 ? `${(v * 100).toFixed(1)}%` : pct(v));

export function renderDay17(data, { mode = 'gray', variant = 'plate' } = {}) {
  const { grid: G, cells, dark, hours, summary: s, boundary = [] } = data;
  const out = [];
  const isPlate = variant === 'plate';
  const isMap = variant === 'map';
  const isChart = variant === 'chart';
  const isInset = variant === 'inset';
  const hooks = isMap || isChart || isInset;
  const uid = `d17-${variant}-${mode}`;
  const T = isMap || isChart ? 1.3 : 1.15;
  const field = FIELD[mode] ?? FIELD.gray;
  const night = data.night;
  const states = hooks ? ['all', ...hours.departures.map((_, h) => `h${String(h).padStart(2, '0')}`)] : ['all'];
  const hourOf = (st) => (st === 'all' ? night : Number(st.slice(1)));
  const r1 = (v) => (+v.toFixed(1)).toString();
  const miles = (b) => ({ west: toMiles(b.west, 'x'), east: toMiles(b.east, 'x'), south: toMiles(b.south, 'y'), north: toMiles(b.north, 'y') });
  const addrY = (y) => (y >= 0 ? y * 800 : y >= -1 ? y * 1200 : -1200 + (y + 1) * 800);
  const place = (x, y) => `${formatAddress(Math.round(addrY(y)), 'y')} · ${formatAddress(Math.round(x * 800), 'x')}`;
  // block rows: [center, south edge, north edge] in miles, south to north (one seam row is taller; see
  // the notebook); columns every quarter mile from x0
  const rows = G.rows;
  const NTOP = rows.at(-1)[2];
  const cx = (i) => G.x0 + i * G.step;
  const cy = (j) => rows[j][0];
  const yU = (m) => +(((NTOP - m) / G.step) * U).toFixed(2); // miles north -> path units down

  // shadow filters, one per class, in the blocks' own units (the group is scaled to U units a block)
  const tan = Math.tan((ALT * Math.PI) / 180);
  const filters = () => {
    const f = [];
    for (let c = 1; c <= 10; c++) {
      const L = ((HMAX * level(c)) / tan) * U / Math.SQRT2; // along x and y, toward the southeast
      const offs = [1 / 3, 2 / 3, 1].map((p, i) => `<feOffset in="SourceAlpha" dx="${r1(L * p)}" dy="${r1(L * p)}" result="o${i}"/>`).join('');
      f.push(`<filter id="${uid}-s${c}" filterUnits="userSpaceOnUse" x="${-2 * U}" y="${-2 * U}" width="${(G.nx + 4) * U}" height="${(rows.length + 4) * U}" color-interpolation-filters="sRGB">${offs}<feMerge result="m"><feMergeNode in="o0"/><feMergeNode in="o1"/><feMergeNode in="o2"/></feMerge><feFlood flood-color="#000" flood-opacity="${SHADOW}"/><feComposite in2="m" operator="in" result="sh"/><feMerge><feMergeNode in="sh"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`);
    }
    return `<defs>${f.join('')}</defs>`;
  };
  // one row run of blocks, in path units
  const run = (i0, i1, j) => `M${i0 * U} ${yU(rows[j][2])}h${(i1 - i0 + 1) * U}v${+(yU(rows[j][1]) - yU(rows[j][2])).toFixed(2)}h${-(i1 - i0 + 1) * U}z`;
  const runs = (list) => {
    // list: [i, j] of one class; merge horizontal neighbours
    const rows = new Map();
    for (const [i, j] of list) (rows.get(j) ?? rows.set(j, []).get(j)).push(i);
    let d = '';
    for (const [j, is] of rows) {
      is.sort((a, b) => a - b);
      let a = is[0], b = is[0];
      for (const i of [...is.slice(1), null]) {
        if (i === b + 1) { b = i; continue; }
        d += run(a, b, j);
        if (i != null) a = b = i;
      }
    }
    return d;
  };
  const inBox = (box) => (c) => !box || (cx(c[0]) >= box.west - 0.2 && cx(c[0]) <= box.east + 0.2 && cy(c[1]) >= box.south - 0.2 && cy(c[1]) <= box.north + 0.2);
  // the lit blocks of one hour, dim to bright, each class with its shadow
  const hourLayer = (h, box) => {
    const by = Array.from({ length: 11 }, () => []);
    for (const c of cells) if (inBox(box)(c)) by[clsOf(c[2][h])].push(c);
    return by.map((list, c) => (c && list.length ? `<path d="${runs(list)}" fill="${shade(mode, c)}" filter="url(#${uid}-s${c})"/>` : '')).join('');
  };
  // all city blocks, unlit, and the gutters over everything
  const baseLayer = (box) => `<path d="${runs([...dark, ...cells].filter(inBox(box)))}" fill="${NONE[mode] ?? NONE.gray}"/>`;
  const gutters = (box, w) => {
    const i0 = Math.max(0, Math.floor((box.west - G.x0) / G.step)), i1 = Math.min(G.nx, Math.ceil((box.east - G.x0) / G.step) + 1);
    const ys = [...new Set(rows.flatMap((r) => [r[1], r[2]]))].filter((y) => y >= box.south - 0.3 && y <= box.north + 0.3);
    const top = yU(Math.max(...ys)), bot = yU(Math.min(...ys));
    let d = '';
    for (let i = i0; i <= i1; i++) d += `M${i * U} ${top}V${bot}`;
    for (const y of ys) d += `M${i0 * U} ${yU(y)}H${(i1 + 1) * U}`;
    return `<path d="${d}" fill="none" stroke="${GAP}" stroke-width="${w}" opacity="0.8"/>`;
  };
  // block i's west edge and row j's north edge in plate px: the group's transform
  const blockGroup = (Xm, Ym, kk) => `translate(${+Xm(G.x0 - G.step / 2).toFixed(2)} ${+Ym(NTOP).toFixed(2)}) scale(${+((kk * G.step) / U).toFixed(5)})`;
  const ring = (r, fx, fy) => 'M' + r.map(([x, y]) => `${fx(x).toFixed(1)},${fy(y).toFixed(1)}`).join('L') + 'Z';
  const cityPath = (X, Y) => boundary.map((r) => ring(r, X, Y)).join('');

  // tooltips: every block with a bus in any hour; a day of buses as 24 bars (page kind=hours)
  const hoverCss = `<style>.d17c rect{fill:transparent;stroke:none}.d17c:hover rect,.d17c.pick rect{stroke:${C.paper};stroke-width:${isInset ? 1.6 : 1.2};filter:drop-shadow(0 0 1px #000)}</style>`;
  const hits = (Xm, Ym, kk, box) => {
    const q = kk * G.step;
    const o = [hoverCss];
    for (const c of cells.filter(inBox(box))) {
      const [i, j, n, routes] = c;
      const x = Xm(cx(i)), y = Ym(cy(j)), hq = (rows[j][2] - rows[j][1]) * kk;
      const busiest = n.indexOf(Math.max(...n));
      const detail = [
        `Busiest: ${hourName(busiest)}, ${n[busiest]} ${n[busiest] === 1 ? 'bus' : 'buses'}`,
        routes.length ? `Routes at 3 a.m.: ${routes.join(', ')}` : 'No bus at 3 a.m.',
      ].join('|');
      o.push(`<g class="d17c" data-kind="hours" data-id="b${i}_${j}" data-tip="${esc(place(cx(i), cy(j)))}" data-vals="${n.join(' ')}" data-at="${night}" data-detail="${esc(detail)}"><rect x="${r1(x - q / 2)}" y="${r1(Ym(rows[j][2]))}" width="${r1(q)}" height="${r1(hq)}"/></g>`);
    }
    return o.join('');
  };

  // the state's name and numbers, in the lake
  const stateLabel = (st, x, y, size = 1) => {
    const h = hourOf(st);
    return text(x, y, hourName(h).toUpperCase(), { size: 17 * size, weight: 600, spacing: 1.2, anchor: 'end', fill: C.paper }) +
      text(x, y + 19 * size, `${fmt(hours.departures[h])} buses leave ${fmt(hours.lit[h])} blocks`, { size: 12.5 * size, font: SERIF, italic: true, fill: C.fog, anchor: 'end' }) +
      text(x, y + 35 * size, `${pctEnd(1 - hours.within[h])} of residents beyond a half mile`, { size: 12.5 * size, font: SERIF, italic: true, fill: '#A4A29B', anchor: 'end' });
  };

  if (isPlate) out.push(frame({
    plate: 'XVII',
    chapter: 'THE GAPS',
    day: 17,
    theme: 'Light & dark',
    title: 'The 3 a.m. City',
    subtitle: 'Each quarter-mile block lit by the buses that leave it at 3 a.m. on a weekday; the brighter, the more.',
  }));

  // ---------- main map: the extent of Plates II–XV ----------
  const ext = { west: -11200, east: 4800, south: -14000, north: 10400 };
  const mi = miles(ext);
  const fieldBox = isMap ? { x: 60, y: 250, w: 760, h: 1040 } : { x: 60, y: 262, w: 575, h: 830 };
  const k = Math.min(fieldBox.w / (mi.east - mi.west), fieldBox.h / (mi.north - mi.south));
  const Xm = (x) => fieldBox.x + (x - mi.west) * k;
  const Ym = (y) => fieldBox.y + (mi.north - y) * k;
  const X = (x) => Xm(toMiles(x, 'x'));
  const Y = (y) => Ym(toMiles(y, 'y'));
  const fx0 = X(ext.west), fx1 = X(ext.east), fy0 = Y(ext.north), fy1 = Y(ext.south);
  const g = gridLines(ext);
  const gl = 8 * T;
  const labelLen = 7 * (gl * 0.6 + 0.4);
  const colX = fx1 + 6 + labelLen;
  const labelTop = fy0 - 6 - labelLen;
  const IB = data.inset.box; // miles
  const all = { west: mi.west - 1, east: mi.east + 1, south: mi.south - 1, north: mi.north + 1 };

  if (isPlate || isMap) {
    const city = cityPath(X, Y);
    out.push(filters());
    out.push(`<defs><clipPath id="${uid}-map"><rect x="${fx0}" y="${fy0}" width="${fx1 - fx0}" height="${fy1 - fy0}"/></clipPath><clipPath id="${uid}-city"><path d="${city}" clip-rule="evenodd"/></clipPath></defs>`);
    out.push(`<g clip-path="url(#${uid}-map)">`);
    out.push(`<rect x="${fx0}" y="${fy0}" width="${fx1 - fx0}" height="${fy1 - fy0}" fill="${field}"/>`);
    for (const x of g.xs) out.push(`<line x1="${X(x)}" x2="${X(x)}" y1="${fy0}" y2="${fy1}" stroke="#3B3A37" stroke-width="${x === 0 ? 0.9 : 0.6}"/>`);
    for (const y of g.ys) out.push(`<line x1="${fx0}" x2="${fx1}" y1="${Y(y)}" y2="${Y(y)}" stroke="#3B3A37" stroke-width="${y === 0 ? 0.9 : 0.6}"/>`);
    out.push(`<g clip-path="url(#${uid}-city)"><g transform="${blockGroup(Xm, Ym, k)}">`);
    out.push(baseLayer(all));
    for (const st of states) out.push(`<g data-state="${st}"${st === 'all' ? '' : ' display="none"'}>${hourLayer(hourOf(st), all)}</g>`);
    out.push(gutters(all, U * 0.07));
    out.push('</g></g>');
    if (isMap) out.push(hits(Xm, Ym, k, all));
    // state label in the lake
    const lx = fx1 - 14, ly = fy0 + 36;
    if (isMap) for (const st of states) out.push(`<g data-state="${st}"${st === 'all' ? '' : ' display="none"'} pointer-events="none">${stateLabel(st, lx, ly)}</g>`);
    else out.push(stateLabel('all', lx, ly, 0.95));
    out.push('</g>');
    const gridLabel = (v) => (v === 0 ? { fill: C.ink, weight: 600 } : { fill: C.pencil });
    for (const x of g.xs) out.push(text(X(x) + gl * 0.35, labelTop, formatAddress(x, 'x'), { size: gl, spacing: 0.4, rotate: -90, anchor: 'end', ...gridLabel(x) }));
    for (const y of g.ys) out.push(text(colX, Y(y) + gl * 0.35, formatAddress(y, 'y'), { size: gl, spacing: 0.4, anchor: 'end', ...gridLabel(y) }));

    // the inset's box
    out.push(`<rect${hooks ? ` data-inset-frame data-y0="${+Ym(0).toFixed(2)}"` : ''} x="${r1(Xm(IB.west))}" y="${r1(Ym(IB.north))}" width="${r1((IB.east - IB.west) * k)}" height="${r1((IB.north - IB.south) * k)}" fill="none" stroke="${C.paper}" stroke-width="0.7" stroke-dasharray="2 2"/>`);

    // mile ruler, in fog on the dark field
    const rx = X(ext.west + 800), ry = Y(ext.south) - k * 0.35;
    out.push(`<line x1="${rx}" x2="${rx + 4 * k}" y1="${ry}" y2="${ry}" stroke="${C.fog}" stroke-width="1.2"/>`);
    for (let i = 0; i <= 4; i++) out.push(`<line x1="${rx + i * k}" x2="${rx + i * k}" y1="${ry - (i % 4 === 0 ? 6 : 4)}" y2="${ry}" stroke="${C.fog}" stroke-width="1.2"/>`);
    out.push(text(rx, ry - 9, '0', { size: 7.5 * T, anchor: 'middle', fill: C.fog }));
    out.push(text(rx + 4 * k, ry - 9, '4 MI', { size: 7.5 * T, anchor: 'middle', fill: C.fog }));

    // legend
    const lgs = 9 * T;
    const sq = (c, w = 18) => `<rect x="${-w / 2}" y="-6" width="${w}" height="12" fill="${shade(mode, c)}"/>`;
    const pair = (a, b) => `<rect x="-11" y="-6" width="11" height="12" fill="${shade(mode, a)}"/><rect x="0" y="-6" width="11" height="12" fill="${shade(mode, b)}"/>`;
    if (isPlate) {
      const y = 203;
      let lx2 = 60;
      const head = 'Buses leaving each quarter-mile block at 3 a.m.:';
      out.push(text(lx2, y, head, { size: lgs, fill: C.pencil }));
      lx2 += textWidth(head, lgs) + 8;
      out.push(`<rect x="${lx2}" y="${r1(y - lgs * 0.35 - 6)}" width="14" height="12" fill="${shade(mode, 0)}"/>`);
      out.push(text(lx2 + 19, y, 'none', { size: lgs, fill: C.pencil }));
      lx2 += 19 + textWidth('none', lgs) + 14;
      out.push(text(lx2, y, '1', { size: lgs, fill: C.pencil }));
      lx2 += textWidth('1', lgs) + 5;
      for (let c = 1; c <= 10; c++) out.push(`<rect x="${lx2 + (c - 1) * 11}" y="${r1(y - lgs * 0.35 - 6)}" width="11" height="12" fill="${shade(mode, c)}"/>`);
      lx2 += 110 + 5;
      const tail = '150 or more · lit from the northwest: the brighter, the longer its shadow';
      out.push(text(lx2, y, tail, { size: lgs, fill: C.pencil }));
    } else {
      const items = [
        ['head', 'Buses leaving each ¼-mile block in the hour'],
        [pair(1, 2), '1–3'],
        [pair(3, 4), '4–11'],
        [pair(5, 6), '12–34'],
        [pair(7, 8), '35–99'],
        [pair(9, 10), '100 or more'],
        [sq(0), 'none'],
        ['gap'],
        [`<rect x="-4" y="-3" width="10" height="10" fill="#000" opacity="0.5"/><rect x="-8" y="-7" width="10" height="10" fill="${shade(mode, 9)}"/>`, 'Lit from the northwest: the brighter the block, the longer its shadow'],
      ];
      out.push(legendBox(items, { x: rx, bottom: Y(ext.south) - k, k, size: lgs }));
    }
  }

  if (isMap) {
    return svg(out.join(''), { label: mapLabel(data), viewBox: `60 184 ${Math.ceil(colX + 4 - 60)} 1114`, align: 'xMinYMin meet' })
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
    // 24 columns: fog bar = buses leaving city stops that hour; ink line and dots = residents within a
    // half mile of a bus or train leaving that hour
    const cs = isChart ? 8 * T : 8;
    if (isChart) uy = 6;
    else {
      uy = Math.round(labelTop + 10.5 * T * 0.72);
      title(uy, CHART_TITLE.toUpperCase());
      const noteLines = wrap(CHART_NOTE, Math.floor(cw / (ns * 0.45)));
      noteLines.forEach((l, i) => note(uy + (i + 1) * nh + 4, l));
      uy += noteLines.length * nh + 22;
    }
    const ch = isChart ? 200 : 132;
    const top = uy + (isChart ? 22 : 16), base = top + ch;
    const left = isChart ? 34 : 30, right = mx + cw;
    const colW = (right - (mx + left)) / 24;
    const xc = (h) => mx + left + (h + 0.5) * colW;
    const dMax = Math.max(...hours.departures);
    const by = (v) => base - (v / dMax) * ch * 0.5;
    const sy = (v) => base - v * ch;
    for (const v of [0, 0.25, 0.5, 0.75, 1]) {
      out.push(`<line x1="${mx + left}" x2="${right}" y1="${r1(sy(v))}" y2="${r1(sy(v))}" stroke="${v === 0 ? C.pencil : C.rule}" stroke-width="${v === 0 ? 0.7 : 0.6}"/>`);
      out.push(text(mx + left - 5, sy(v) + cs * 0.35, `${v * 100}%`, { size: cs * 0.9, anchor: 'end', fill: C.pencil }));
    }
    if (hooks) out.push(`<style>.${uid}-col .bg{transition:fill .12s}.${uid}-col:hover .bg,.${uid}-col.on .bg{fill:${C.rule}}</style>`);
    for (let h = 0; h < 24; h++) {
      const key = `h${String(h).padStart(2, '0')}`;
      if (hooks) {
        const tip = `${fmt(hours.departures[h])} buses leave city stops|${fmt(hours.lit[h])} blocks lit|${pctEnd(hours.within[h])} of residents within a half mile of a bus or train leaving`;
        out.push(`<g class="${uid}-col" data-state-key="${key}" data-tip="${hourName(h)}" data-name="${hourName(h)}" data-shape="none" data-detail="${esc(tip)}"><rect class="bg" x="${r1(xc(h) - colW / 2)}" y="${top - 12}" width="${r1(colW)}" height="${ch + 12}" fill="transparent"/>`);
      }
      const v = hours.departures[h];
      out.push(`<rect x="${r1(xc(h) - colW * 0.36)}" y="${r1(by(v))}" width="${r1(colW * 0.72)}" height="${r1(base - by(v))}" fill="${h === night ? C.pencil : C.fog}"/>`);
      if (hooks) out.push('</g>');
    }
    out.push(`<path d="M${hours.within.map((v, h) => `${r1(xc(h))},${r1(sy(v))}`).join('L')}" fill="none" stroke="${C.ink}" stroke-width="${isChart ? 1.6 : 1.3}" stroke-linejoin="round" pointer-events="none"/>`);
    for (let h = 0; h < 24; h++) out.push(`<circle cx="${r1(xc(h))}" cy="${r1(sy(hours.within[h]))}" r="${isChart ? 2.4 : 2}" fill="${C.ink}" pointer-events="none"/>`);
    // notes: the morning peak's buses, the night's buses and its share
    const pk = data.peak;
    out.push(text(xc(pk), by(dMax) - 5, `${fmt(Math.round(dMax / 1000) * 1000)} buses`, { size: cs * 0.9, anchor: 'middle', fill: C.pencil, halo: C.paper }));
    out.push(text(xc(night) + 6, by(hours.departures[night]) - 4, `${fmt(hours.departures[night])}`, { size: cs * 0.9, fill: C.pencil, halo: C.paper }));
    const lo = hours.within.indexOf(Math.min(...hours.within));
    out.push(text(xc(lo) + 6, sy(hours.within[lo]) + cs * 1.25, `${pct(hours.within[lo])} at ${hourName(lo)}`, { size: cs, weight: 600, fill: C.ink, halo: C.paper }));
    for (const [h, lab] of [[0, 'MIDNIGHT'], [6, '6 A.M.'], [12, 'NOON'], [18, '6 P.M.']]) {
      out.push(`<line x1="${xc(h)}" x2="${xc(h)}" y1="${base}" y2="${base + 3}" stroke="${C.pencil}" stroke-width="0.7"/>`);
      out.push(text(xc(h), base + 4 + cs, lab, { size: cs * 0.85, spacing: 0.3, anchor: 'middle', fill: C.pencil }));
    }
    uy = base + 4 + cs;
    if (isChart) {
      out.push(text(mx + left, uy + cs * 2, 'Hover or tap an hour to show it on the map.', { size: cs * 0.95, font: SERIF, italic: true, fill: C.pencil }));
      uy += cs * 2;
      return svg(out.join(''), { label: `${CHART_TITLE}: ${fmt(dMax)} buses leave city stops at ${hourName(pk)}, ${fmt(hours.departures[night])} at 3 a.m.`, viewBox: `0 0 ${cw + 6} ${Math.ceil(uy + 8)}`, align: 'xMinYMin meet' })
        .replace('<svg ', '<svg data-state-host tabindex="0" ');
    }
  }

  // ---------- inset: the Far Southwest Side ----------
  // the page's inset is drawn tall (1.6 times its width, around the plate's box) and cropped to the
  // column's height (data-north); the street names along the bottom stay pinned to the crop's edge
  const iw = isInset ? 390 : W_COL;
  const ki = iw / (IB.east - IB.west);
  const IBp = isInset ? (() => { const m = (IB.north + IB.south) / 2, h = 0.8 * (IB.east - IB.west); return { ...IB, north: m + h, south: m - h }; })() : IB;
  const ty = uy + 34;
  if (isPlate) {
    title(ty, `INSET · ${INSET_TITLE.toUpperCase()} AT 3 A.M.`);
    note(ty + nh + 4, `×${(ki / k).toFixed(1)} the main map.`);
  }
  const ibox = isInset ? { x: 0, y: 0, w: iw, h: Math.round((IBp.north - IBp.south) * ki) } : { x: mx, y: ty + nh + 14, w: iw, h: Math.round((IB.north - IB.south) * ki) };
  const IXm = (m) => ibox.x + (m - IBp.west) * ki;
  const IYm = (m) => ibox.y + (IBp.north - m) * ki;
  out.push(filters());
  out.push(`<defs><clipPath id="${uid}-inset"><rect x="${ibox.x}" y="${ibox.y}" width="${ibox.w}" height="${ibox.h}"/></clipPath><clipPath id="${uid}-icity"><path d="${cityPath((x) => IXm(toMiles(x, 'x')), (y) => IYm(toMiles(y, 'y')))}" clip-rule="evenodd"/></clipPath></defs>`);
  out.push(`<g clip-path="url(#${uid}-inset)"><rect x="${ibox.x}" y="${ibox.y}" width="${ibox.w}" height="${ibox.h}" fill="${field}"/>`);
  out.push(`<g clip-path="url(#${uid}-icity)"><g transform="${blockGroup(IXm, IYm, ki)}">`);
  out.push(baseLayer(IBp));
  for (const st of states) out.push(`<g data-state="${st}"${st === 'all' ? '' : ' display="none"'}>${hourLayer(hourOf(st), IBp)}</g>`);
  out.push(gutters(IBp, U * 0.05));
  out.push('</g></g>');
  // the half-mile arterials named along the edges
  const ts = 7 * (isInset ? 1.35 : 1.15);
  // beside their block (west of a north-south street, south of an east-west one), clear of its light
  const hb = (ki * G.step) / 2 + 2;
  const xs = data.inset.streets.x.map(([m, name]) => text(r1(IXm(m) - hb), isInset ? -5 : ibox.y + ibox.h - 5, name, { size: ts, fill: C.fog, weight: 500, rotate: -90 }));
  out.push(isInset ? `<g data-pin-bottom transform="translate(0 ${ibox.h})">${xs.join('')}</g>` : xs.join(''));
  for (const [m, name] of data.inset.streets.y) out.push(text(ibox.x + 4, r1(IYm(m) + hb + ts * 0.75), name, { size: ts, fill: C.fog, weight: 500 }));
  if (isInset) out.push(hits(IXm, IYm, ki, IBp));
  out.push('</g>');
  if (isPlate) out.push(`<rect x="${ibox.x}" y="${ibox.y}" width="${ibox.w}" height="${ibox.h}" fill="none" stroke="${C.ink}" stroke-width="0.8"/>`);

  if (isInset) {
    return svg(out.join(''), { label: `${INSET_TITLE}: quarter-mile blocks lit by their buses, hour by hour; at 3 a.m. ${pct(sideShare(s))} of its residents live more than a half mile from a bus or train leaving.`, viewBox: `0 0 ${ibox.w} ${ibox.h}`, align: 'xMidYMid slice' })
      .replace('<svg ', `<svg data-ppm="${+ki.toFixed(3)}" data-north="${+IBp.north.toFixed(4)}" `);
  }

  // plate: Findings close the column
  let fy = ibox.y + ibox.h + 34;
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
    ['BUSES', `CTA GTFS, feed of ${data.gtfsDate}: every bus leaving every stop on Tuesday ${dayLong(data.serviceDay)}; times past midnight fold onto the morning`],
    ['BLOCKS', 'Quarter-mile squares of the address grid, set so the arterials run through their middles; city stops only'],
    ['LIGHT', `Brightness: buses in the hour, log scale, 1 to ${CAP}+. Height and shadow follow brightness; light from the northwest`],
    ['PEOPLE', '2020 Census blocks; half mile in a straight line to a bus stop or ‘L’ platform with a departure in the hour'],
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
export const CHART_TITLE = 'Buses by the hour';
export const CHART_NOTE = 'Bars: buses leaving city stops each hour of a weekday · Line: residents within a half mile of a bus or train leaving that hour';
export const INSET_TITLE = 'The Far Southwest Side';
const sideShare = (s) => s.sides.find(([n]) => n === 'Far Southwest Side')?.[1] ?? 0;

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const dayLong = (iso) => `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;

const mapLabel = (d) =>
  `Plate XVII, The 3 a.m. City: Chicago's quarter-mile blocks lit by the buses that leave them at 3 a.m.; ${fmt(d.hours.lit[d.night])} of ${fmt(d.hours.lit[d.peak])} blocks lit at the morning peak still have a bus, and ${pct(d.summary.dark.share)} of residents live more than a half mile from a bus or train leaving.`;
