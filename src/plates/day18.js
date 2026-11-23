// Plate XVIII · Ghost Buses · Day 18 NULL
import { C, SERIF, esc, text, textWidth, legendBox, wrap, frame, svg } from '../lib/plate.js';
import { gridLines, formatAddress, toMiles } from '../lib/grid.js';

// variant 'plate': the full 1080 x 1350 plate (export, download).
// variant 'map': the map alone, with hover hooks, for the day page's left column.
// variant 'chart': the routes with the most missing buses, one ring per bus, with hover hooks.
// variant 'inset': the South Side inset alone, drawn tall so the page can crop it.
// A NULL is a row that should be there and is not. CTA's schedule (GTFS) lists every trip; Bus Tracker
// reports the buses actually out. Each scheduled trip with no bus behind it, on an average October
// weekday, is one hollow ring on its route (data.routes[].rings), spaced evenly along the route's main
// pattern. Routes are hairlines. Path vertices are address units.

// Color mode: one hue for the missing buses; routes stay gray.
const HUE = { gray: { ring: C.ink, route: C.frame, box: C.fog, boxText: C.ink }, color: { ring: '#2F62B0', route: '#C3CAD3', box: '#2F62B0', boxText: '#FFFFFF' } };

// The inset: Halsted to the lake, Garfield Boulevard (5500 S) to 95th Street, where the rings are densest.
export const INSET_BOX = { west: -800, east: 3200, south: -9500, north: -5500 };
export const INSET_TITLE = 'Inset · Halsted to the lake, Garfield to 95th';
export const CHART_TITLE = 'Buses never seen, by route';
export const chartNote = (n) => `The ${n} routes with the most missing buses on an average weekday · One ring per bus · Share of the route’s scheduled trips`;
// cross streets named in the inset (address units)
const EW = { '-3100': '31ST', '-3900': 'PERSHING', '-4700': '47TH', '-5500': 'GARFIELD', '-6300': '63RD', '-7100': '71ST', '-7900': '79TH', '-8700': '87TH', '-9500': '95TH', '-10300': '103RD', '-11100': '111TH', '-11900': '119TH', '-12700': '127TH' };
const NS = { '-800': 'HALSTED', '0': 'STATE', '800': 'COTTAGE GR.', '1600': 'STONY IS.', '2400': 'YATES' };

export function renderDay18(data, { mode = 'gray', variant = 'plate' } = {}) {
  const { routes, summary: s, boundary = [] } = data;
  const out = [];
  const isPlate = variant === 'plate';
  const isMap = variant === 'map';
  const isChart = variant === 'chart';
  const isInset = variant === 'inset';
  const hooks = isMap || isChart || isInset;
  const uid = `d18-${variant}-${mode}`;
  const T = isMap || isChart ? 1.3 : 1.15;
  const TI = isInset ? 1.35 : 1.15;
  const hue = HUE[mode === 'color' ? 'color' : 'gray'];

  // ---------- geometry: each route's path in miles, and its rings spaced evenly along it ----------
  const inMiles = (p) => p.map(([x, y]) => [toMiles(x, 'x'), toMiles(y, 'y')]);
  const ringsOf = (pm, n) => {
    if (!n) return [];
    const cum = [0];
    for (let i = 1; i < pm.length; i++) cum.push(cum[i - 1] + Math.hypot(pm[i][0] - pm[i - 1][0], pm[i][1] - pm[i - 1][1]));
    const L = cum.at(-1), pts = [];
    let j = 1;
    for (let i = 0; i < n; i++) {
      const t = ((i + 0.5) / n) * L;
      while (j < cum.length - 1 && cum[j] < t) j++;
      const f = (t - cum[j - 1]) / (cum[j] - cum[j - 1] || 1);
      pts.push([pm[j - 1][0] + (pm[j][0] - pm[j - 1][0]) * f, pm[j - 1][1] + (pm[j][1] - pm[j - 1][1]) * f]);
    }
    return pts;
  };
  const geo = new Map(routes.map((r) => { const pm = inMiles(r.path); return [r.id, { pm, rings: ringsOf(pm, r.rings) }]; }));

  // ---------- hover cards ----------
  const pctS = (v) => `${(v * 100).toFixed(v < 0.1 ? 1 : 0)}%`;
  const card = (r) => ({
    name: r.name,
    num: { text: r.id, fill: hue.box, on: hue.boxText }, // the chart's route box
    aside: r.express ? 'Express' : 'Local',
    big: [fmt(r.miss), `bus${Math.round(r.miss) === 1 ? '' : 'es'} a weekday never seen`],
    bar: { frac: r.share, segs: [[0, 1, hue.ring]], left: `${pctS(r.share)} of ${fmt(r.sched)} scheduled trips`, right: '', tick: mode !== 'color' },
    foot: r.blank ? [`Record blank on ${r.blank} of ${r.days + r.blank} weekdays`, 'left out'] : [`${r.days} weekdays`, `${fmt(r.seen)} seen`],
  });
  const hoverRoute = (r, inner) =>
    hooks ? `<g data-kind="card" data-tip="${esc(`${r.id} ${r.name}`)}" data-name="${esc(r.name)}" data-lines="${esc(r.id)}" data-keys="${esc(r.id)}" data-card="${attr(JSON.stringify(card(r)))}">${inner}</g>` : inner;

  const line = (pts) => 'M' + pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join('L');
  const ring = (rg, fx, fy) => 'M' + rg.map(([x, y]) => `${fx(x).toFixed(1)},${fy(y).toFixed(1)}`).join('L') + 'Z';
  const circle = (x, y, r, w) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="${C.paper}" stroke="${hue.ring}" stroke-width="${w}"/>`;
  // routes (hairlines) then their rings, quietest routes first so the ghosts of the worst sit on top
  const order = [...routes].sort((a, b) => a.miss - b.miss);
  const drawRoutes = (P, { lw, rr, rw }) => {
    // on the page, a highlighted route's hairline darkens so its rings read as one line
    if (hooks) out.push(`<style>svg.hl .on > .d18-route{stroke:${mode === 'color' ? hue.ring : C.pencil};stroke-width:${(lw * 2).toFixed(2)}px}</style>`);
    for (const r of order) {
      const { pm, rings } = geo.get(r.id);
      const d = line(pm.map(([x, y]) => P(x, y)));
      const hit = hooks ? `<path d="${d}" fill="none" stroke="transparent" stroke-width="7"/>` : '';
      out.push(hoverRoute(r, `${hit}<path class="d18-route" d="${d}" fill="none" stroke="${hue.route}" stroke-width="${lw}" stroke-linejoin="round" stroke-linecap="round"/>`));
    }
    for (const r of order) {
      const { rings } = geo.get(r.id);
      if (!rings.length) continue;
      out.push(hoverRoute(r, rings.map(([x, y]) => { const [px, py] = P(x, y); return circle(px, py, rr, rw); }).join('')));
    }
  };
  const routeBox = (x, y, id, size, anchor = 'middle') => {
    const bw = textWidth(String(id), size, { weight: 600, spacing: 0.4 }) + 8;
    const bx = anchor === 'middle' ? x - bw / 2 : x;
    return { w: bw, svg: `<rect x="${bx.toFixed(1)}" y="${(y - size * 0.82 - 2.5).toFixed(1)}" width="${bw.toFixed(1)}" height="${(size + 4).toFixed(1)}" rx="1.5" fill="${hue.box}"/>` + text(+(bx + bw / 2).toFixed(1), +y.toFixed(1), String(id), { size, weight: 600, spacing: 0.4, anchor: 'middle', fill: hue.boxText }) };
  };
  const miles = (b) => ({ west: toMiles(b.west, 'x'), east: toMiles(b.east, 'x'), south: toMiles(b.south, 'y'), north: toMiles(b.north, 'y') });

  if (isPlate) out.push(frame({
    plate: 'XVIII',
    chapter: 'THE GAPS',
    day: 18,
    theme: 'NULL',
    title: 'Ghost Buses',
    subtitle: 'Every CTA bus route, with a hollow ring for each bus the timetable promised on an October weekday that Bus Tracker never saw.',
  }));

  // ---------- main map: the extent of Plates II–XVII ----------
  const ext = { west: -11200, east: 4800, south: -14000, north: 10400 };
  const mi = miles(ext);
  const field = isMap ? { x: 60, y: 250, w: 760, h: 1040 } : { x: 60, y: 262, w: 575, h: 830 };
  const k = Math.min(field.w / (mi.east - mi.west), field.h / (mi.north - mi.south));
  const XM = (m) => field.x + (m - mi.west) * k;
  const YM = (m) => field.y + (mi.north - m) * k;
  const X = (x) => XM(toMiles(x, 'x'));
  const Y = (y) => YM(toMiles(y, 'y'));
  const fx0 = X(ext.west), fx1 = X(ext.east), fy0 = Y(ext.north), fy1 = Y(ext.south);
  const g = gridLines(ext);
  const gl = 8 * T;
  const labelLen = 7 * (gl * 0.6 + 0.4);
  const colX = fx1 + 6 + labelLen;
  const labelTop = fy0 - 6 - labelLen;
  const mapStyle = { lw: isMap ? 0.75 : 0.6, rr: 1.9 * (k / 28.75), rw: isMap ? 0.85 : 0.7 };

  if (isPlate || isMap) {
    out.push(`<defs><clipPath id="${uid}-map"><rect x="${fx0}" y="${fy0}" width="${fx1 - fx0}" height="${fy1 - fy0}"/></clipPath></defs>`);
    out.push(`<g clip-path="url(#${uid}-map)">`);
    if (boundary.length) out.push(`<path d="${boundary.map((r) => ring(r, X, Y)).join('')}" fill="${C.ground}" fill-rule="evenodd"/>`);
    for (const x of g.xs) out.push(`<line x1="${X(x)}" x2="${X(x)}" y1="${fy0}" y2="${fy1}" stroke="${x === 0 ? C.pencil : C.grid}" stroke-width="${x === 0 ? 0.8 : 0.6}"/>`);
    for (const y of g.ys) out.push(`<line x1="${fx0}" x2="${fx1}" y1="${Y(y)}" y2="${Y(y)}" stroke="${y === 0 ? C.pencil : C.grid}" stroke-width="${y === 0 ? 0.8 : 0.6}"/>`);
    drawRoutes((x, y) => [XM(x), YM(y)], mapStyle);
    out.push('</g>');
    const gridLabel = (v) => (v === 0 ? { fill: C.ink, weight: 600 } : { fill: C.pencil });
    for (const x of g.xs) out.push(text(X(x) + gl * 0.35, labelTop, formatAddress(x, 'x'), { size: gl, spacing: 0.4, rotate: -90, anchor: 'end', ...gridLabel(x) }));
    for (const y of g.ys) out.push(text(colX, Y(y) + gl * 0.35, formatAddress(y, 'y'), { size: gl, spacing: 0.4, anchor: 'end', ...gridLabel(y) }));

    // Roosevelt Road: the south / north split of the findings, a dashed pencil rule with its name
    const ry0 = Y(-1200);
    out.push(`<line x1="${fx0}" x2="${fx1}" y1="${ry0}" y2="${ry0}" stroke="${C.pencil}" stroke-width="0.7" stroke-dasharray="4 3"/>`);
    out.push(text(fx0 + 4, ry0 - 4, 'ROOSEVELT', { size: 7 * T, weight: 600, spacing: 0.5, fill: C.pencil, halo: C.paper }));

    // inset outline; the page moves it to the cropped extent (data-inset-frame, Madison's y in data-y0)
    out.push(`<rect${hooks ? ` data-inset-frame data-y0="${+YM(0).toFixed(2)}"` : ''} x="${X(INSET_BOX.west)}" y="${Y(INSET_BOX.north)}" width="${X(INSET_BOX.east) - X(INSET_BOX.west)}" height="${Y(INSET_BOX.south) - Y(INSET_BOX.north)}" fill="none" stroke="${C.ink}" stroke-width="0.6" stroke-dasharray="2 2"/>`);

    // route numbers: the routes with the most missing buses always; every route on highlight
    const ls = 7 * T;
    const ib = { x0: X(INSET_BOX.west) - 6, x1: X(INSET_BOX.east) + 6, y0: Y(INSET_BOX.north) - 6, y1: Y(INSET_BOX.south) + 6 };
    const placed = [];
    const spot = (pm) => {
      let best = null;
      const pts = pm.map(([x, y]) => [XM(x), YM(y)]);
      for (let i = 1; i < pts.length; i++) {
        for (const f of [0.25, 0.5, 0.75]) {
          const x = pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, y = pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f;
          if (x < fx0 + 14 || x > fx1 - 14 || y < fy0 + 10 || y > fy1 - 10) continue;
          if (x > ib.x0 && x < ib.x1 && y > ib.y0 && y < ib.y1) continue;
          const near = placed.reduce((m, [px, py]) => Math.min(m, Math.hypot(px - x, py - y)), Infinity);
          if (!best || near > best.near) best = { x, y, near };
        }
      }
      return best;
    };
    const tagged = (r, cls, inner) => (hooks ? `<g class="${cls}" data-keys="${esc(r.id)}">${inner}</g>` : inner);
    for (const r of routes.slice(0, LABELED)) {
      const p = spot(geo.get(r.id).pm);
      if (!p) continue;
      placed.push([p.x, p.y]);
      out.push(tagged(r, 'perm-label', routeBox(p.x, p.y + ls * 0.36, r.id, ls).svg));
    }
    if (hooks) for (const r of routes) {
      const pm = geo.get(r.id).pm, m = pm[Math.floor(pm.length / 2)];
      out.push(tagged(r, 'hl-label', routeBox(XM(m[0]), YM(m[1]) + ls * 0.36, r.id, ls).svg));
    }

    // mile ruler
    const rx = X(ext.west + 800), ry = Y(ext.south) - k * 0.35;
    out.push(`<line x1="${rx}" x2="${rx + 4 * k}" y1="${ry}" y2="${ry}" stroke="${C.ink}" stroke-width="1.2"/>`);
    for (let i = 0; i <= 4; i++) out.push(`<line x1="${rx + i * k}" x2="${rx + i * k}" y1="${ry - (i % 4 === 0 ? 6 : 4)}" y2="${ry}" stroke="${C.ink}" stroke-width="1.2"/>`);
    out.push(text(rx, ry - 9, '0', { size: 7.5 * T, anchor: 'middle' }));
    out.push(text(rx + 4 * k, ry - 9, '4 MI', { size: 7.5 * T, anchor: 'middle' }));

    // legend
    const lgs = 9 * T;
    const routeSw = `<line x1="-9" x2="9" y1="0" y2="0" stroke="${hue.route}" stroke-width="${mapStyle.lw * 1.4}"/>`;
    const ringSw = `<line x1="-9" x2="9" y1="0" y2="0" stroke="${hue.route}" stroke-width="${mapStyle.lw * 1.4}"/>${circle(0, 0, mapStyle.rr * 1.15, mapStyle.rw)}`;
    const citySw = `<rect x="-5" y="-5" width="10" height="10" fill="${C.ground}"/>`;
    const split = `<line x1="-9" x2="9" y1="0" y2="0" stroke="${C.pencil}" stroke-width="0.8" stroke-dasharray="4 3"/>`;
    if (isPlate) {
      const items = [[ringSw, 'one bus a weekday scheduled, never seen'], [routeSw, 'CTA bus route'], [split, 'Roosevelt Road'], [citySw, 'City of Chicago']];
      let lx = 60;
      const y = 203;
      for (const [m, lab] of items) {
        out.push(`<g transform="translate(${lx + 9} ${y - lgs * 0.35})">${m}</g>`);
        out.push(text(lx + 22, y, lab, { size: lgs, fill: C.pencil }));
        lx += 22 + textWidth(lab, lgs) + 10;
      }
    } else {
      out.push(legendBox([
        ['head', `Weekdays, ${monthRange(data.window)}`],
        [ringSw, 'One bus a weekday in the timetable that Bus Tracker never saw'],
        [routeSw, 'CTA bus route'],
        ['gap'],
        [split, 'Roosevelt Road (1200 S)'],
        [citySw, 'City of Chicago'],
      ], { x: rx, bottom: Y(ext.south) - k, k, size: lgs }));
    }
  }

  if (isMap) {
    return svg(out.join(''), { label: mapLabel(s), viewBox: `60 184 ${Math.ceil(colX + 4 - 60)} 1114`, align: 'xMinYMin meet' })
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
    // one row per route: route box, name, a ring per missing bus a weekday, the share of its trips
    const n = isChart ? CHART_ROWS : PLATE_ROWS;
    const cs = isChart ? 8 * T : 8;
    const row = isChart ? 17 : 12.4;
    const rx0 = isChart ? 132 : 104; // first ring
    const pctW = isChart ? 40 : 30;
    const maxRings = Math.max(...routes.slice(0, n).map((r) => r.rings));
    const step = Math.min(isChart ? 6.4 : 4.6, (cw - pctW - rx0 - 6) / maxRings);
    const rr = step * 0.36, rw = isChart ? 0.85 : 0.65;
    if (isChart) uy = Math.round(cs + 2);
    else {
      uy = Math.round(labelTop + 10.5 * T * 0.72);
      title(uy, CHART_TITLE.toUpperCase());
      const noteLines = wrap(chartNote(n), Math.floor(cw / (ns * 0.45)));
      noteLines.forEach((l, i) => note(uy + (i + 1) * nh + 4, l));
      uy += noteLines.length * nh + 24;
    }
    const hs = cs * 0.8;
    out.push(text(mx + rx0, uy - row * 0.15, 'BUSES A WEEKDAY', { size: hs, spacing: 0.4, fill: C.pencil }));
    out.push(text(mx + cw, uy - row * 0.15, 'SHARE', { size: hs, anchor: 'end', spacing: 0.4, fill: C.pencil }));
    uy += row * 0.85;
    for (const r of routes.slice(0, n)) {
      if (hooks) out.push(`<g data-hl="${esc(r.id)}" data-kind="card" data-tip="${esc(`${r.id} ${r.name}`)}" data-name="${esc(r.name)}" data-card="${attr(JSON.stringify(card(r)))}"><rect x="${mx - 4}" y="${uy - row + 3}" width="${cw + 8}" height="${row}" fill="transparent"/>`);
      out.push(routeBox(mx, uy, r.id, cs, 'start').svg);
      const nm = isChart ? 13 : 11;
      out.push(text(mx + (isChart ? 40 : 32), uy, r.name.length > nm ? r.name.slice(0, nm - 1) + '…' : r.name, { size: cs, fill: C.pencil }));
      const cy = uy - cs * 0.36;
      let rings = '';
      for (let i = 0; i < r.rings; i++) rings += circle(mx + rx0 + rr + i * step, cy, rr, rw);
      out.push(rings);
      out.push(text(mx + cw, uy, pctS(r.share), { size: cs, anchor: 'end', fill: r.share >= 0.1 ? C.ink : C.pencil, weight: r.share >= 0.1 ? 600 : 400 }));
      if (hooks) out.push('</g>');
      uy += row;
    }
    // totals
    const ry = uy - row + 6;
    out.push(`<line x1="${mx}" x2="${mx + cw}" y1="${ry}" y2="${ry}" stroke="${C.ink}" stroke-width="0.6" stroke-dasharray="2 2"/>`);
    const ts = cs * 0.85;
    const rows2 = [
      [`ALL ${s.routes} ROUTES`, `${fmt(s.rings)} A WEEKDAY · ${pctS(s.share)}`],
      ['SOUTH OF ROOSEVELT · NORTH', `${pctS(s.southRate)} · ${pctS(s.northRate)}`],
      [`EXPRESS (${s.expressRoutes}) · LOCAL`, `${pctS(s.expressShare)} · ${pctS(s.localShare)}`],
    ];
    rows2.forEach(([a, b], i) => {
      const y = ry + (i + 1) * (ts + 5) + 1;
      out.push(text(mx, y, a, { size: ts, spacing: 0.3, fill: C.pencil }));
      out.push(text(mx + cw, y, b, { size: ts, spacing: 0.3, anchor: 'end', fill: i === 0 ? C.ink : C.pencil, weight: i === 0 ? 600 : 400 }));
    });
    uy = ry + rows2.length * (ts + 5) + 1;
    if (isChart) {
      return svg(out.join(''), { label: `The ${n} bus routes with the most missing buses: ${routes[0].name} (${routes[0].id}) leads with about ${fmt(routes[0].miss)} a weekday.`, viewBox: `0 0 ${cw + 6} ${Math.ceil(uy + 4)}`, align: 'xMinYMin meet' });
    }
  }

  // ---------- inset: in miles like the main map, a grid line every half mile ----------
  const tall = isInset ? { ...INSET_BOX, north: -1900, south: -13100 } : INSET_BOX; // the page crops the tall one
  const lbm = miles(tall);
  const iw = isInset ? 390 : W_COL;
  const ki = iw / (lbm.east - lbm.west);
  const ty = uy + 30;
  if (isPlate) {
    title(ty, INSET_TITLE.toUpperCase());
    note(ty + nh + 4, `Shown at ×${(ki / k).toFixed(1)} the scale of the main map.`);
  }
  const inset = isInset ? { x: 0, y: 0, w: iw, h: Math.round((lbm.north - lbm.south) * ki) } : { x: mx, y: ty + nh + 16, w: iw, h: Math.round((lbm.north - lbm.south) * ki) };
  out.push(`<defs><clipPath id="${uid}-inset"><rect x="${inset.x}" y="${inset.y}" width="${inset.w}" height="${inset.h}"/></clipPath></defs>`);
  out.push(`<rect x="${inset.x}" y="${inset.y}" width="${inset.w}" height="${inset.h}" fill="${C.paper}"/>`);
  const IXm = (m) => inset.x + (m - lbm.west) * ki;
  const IYm = (m) => inset.y + (lbm.north - m) * ki;
  const IX = (x) => IXm(toMiles(x, 'x'));
  const IY = (y) => IYm(toMiles(y, 'y'));
  out.push(`<g clip-path="url(#${uid}-inset)">`);
  if (boundary.length) out.push(`<path d="${boundary.map((r) => ring(r, IX, IY)).join('')}" fill="${C.ground}" fill-rule="evenodd"/>`);
  for (let m = Math.ceil(lbm.west * 2) / 2; m <= lbm.east; m += 0.5) out.push(`<line x1="${IXm(m)}" x2="${IXm(m)}" y1="${inset.y}" y2="${inset.y + inset.h}" stroke="${m === 0 ? C.pencil : C.grid}" stroke-width="${m === 0 ? 0.8 : 0.6}"/>`);
  for (let m = Math.ceil(lbm.south * 2) / 2; m <= lbm.north; m += 0.5) out.push(`<line x1="${inset.x}" x2="${inset.x + inset.w}" y1="${IYm(m)}" y2="${IYm(m)}" stroke="${C.grid}" stroke-width="0.6"/>`);
  drawRoutes((x, y) => [IXm(x), IYm(y)], { lw: isInset ? 1 : 0.8, rr: isInset ? 3.2 : 2.5, rw: isInset ? 1 : 0.8 });
  // cross streets on the left edge; north-south streets on the bottom edge (on the page, the crop's)
  const ss = 6.5 * TI;
  for (const [y, nm] of Object.entries(EW)) {
    const v = Number(y);
    if (v > tall.north || v < tall.south) continue;
    out.push(text(inset.x + 3, IY(v) - 2.5, nm, { size: ss, weight: 600, spacing: 0.4, fill: C.pencil, halo: C.paper }));
  }
  const nsLabels = Object.entries(NS).map(([x, nm]) => text(IX(Number(x)) + 3, isInset ? -4 : inset.y + inset.h - 4, nm, { size: ss, weight: 600, spacing: 0.4, fill: Number(x) === 0 ? C.ink : C.pencil, halo: C.paper })).join('');
  out.push(isInset ? `<g data-pin-bottom transform="translate(0 ${IY(INSET_BOX.south)})">${nsLabels}</g>` : nsLabels);
  out.push('</g>');
  if (isPlate) out.push(`<rect x="${inset.x}" y="${inset.y}" width="${inset.w}" height="${inset.h}" fill="none" stroke="${C.ink}" stroke-width="0.8"/>`);

  if (isInset) {
    return svg(out.join(''), { label: 'Halsted to the lake, Garfield Boulevard to 95th Street: missing buses on their routes.', viewBox: `0 0 ${inset.w} ${inset.h}`, align: 'xMidYMid slice' })
      .replace('<svg ', `<svg data-ppm="${+ki.toFixed(3)}" data-north="${+lbm.north.toFixed(3)}" `);
  }

  // plate: Findings close the column
  let fy = inset.y + inset.h + 34;
  title(fy, 'FINDINGS');
  for (const l of wrap(data.finding, Math.floor(W_COL / (ns * 0.45)))) note((fy += nh) + 4, l);
  fy += 10;
  const bs = 9.5, bh = 12.6;
  for (const para of data.findings ?? []) {
    for (const l of wrap(para, Math.floor(W_COL / (bs * 0.46)))) out.push(text(mx, (fy += bh), l, { size: bs, font: SERIF }));
    fy += 5;
  }

  // data ledger, under the map
  const lx = fx0;
  let dy = Math.round(fy1) + 34;
  out.push(text(lx, dy, 'DATA LEDGER', { size: 10.5 * T, weight: 600, spacing: 1 }));
  const ledger = [
    ['SEEN', `CTA Bus Tracker positions, saved every 5 min by the Ghost Buses archive (Chi Hack Night; Mansueto Inst.)`],
    ['', `${s.days} weekdays, ${monthRange(data.window)}; ${data.missingDays.map(dayShort).join(' and ')} not in the archive`],
    ['SCHEDULED', `CTA GTFS, downloaded ${data.gtfs.snapshot}, calendars to 30 Nov 2026: trips per route each weekday`],
    ['METHOD', 'Trips counted per route and day, not matched (the two records’ trip ids differ); seen ≤ scheduled'],
    ['BLANK', `${s.blankDays} of ${fmt(s.routeDays)} route-days under ${Math.round(data.blankRule * 100)}% seen left out as gaps in the record; routes ${data.never.map((r) => r.id).join(' and ')} never seen, left out`],
    ['CAVEAT', 'A bus with its tracker off counts as missing; rings spread evenly along each route’s main pattern'],
    ['LIMITS', 'City of Chicago, Boundaries – City · qqq8-j68g'],
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
const LABELED = 10; // route numbers always shown on the map
const PLATE_ROWS = 16, CHART_ROWS = 20;
export { CHART_ROWS };

const fmt = (n) => Math.round(n).toLocaleString('en-US');
const attr = (s) => esc(s).replace(/"/g, '&quot;');
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const dayShort = (d) => `${Number(d.slice(8, 10))} ${MONTHS[Number(d.slice(5, 7)) - 1].slice(0, 3)}`;
export const monthRange = ([a, b]) => `${Number(a.slice(8, 10))}–${Number(b.slice(8, 10))} ${MONTHS[Number(b.slice(5, 7)) - 1]} ${b.slice(0, 4)}`;

const mapLabel = (s) =>
  `Plate XVIII, Ghost Buses: on an average October 2026 weekday, ${fmt(s.rings)} of ${fmt(s.sched)} scheduled CTA bus trips never appeared on Bus Tracker, one hollow ring each on its route.`;
