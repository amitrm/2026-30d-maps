// Plate II · The Half-Mile Promise · Day 02 Lines
import { C, SERIF, esc, text, wrap, frame, svg } from '../lib/plate.js';
import { gridLines, formatAddress, toMiles } from '../lib/grid.js';

// variant 'plate': the full 1080 x 1350 plate (export, download).
// variant 'map': the map alone, with hover hooks, for the day page's left column.
// variant 'chart': Average weekday riders by route, with hover hooks, for the day page's middle column.
// variant 'inset': the Loop inset alone, drawn tall around the Loop so the page can crop it.
// Map and inset: each route on its streets (both streets of a one-way pair, from path and alt),
// weighted and shaded by its midday interval, with the 'L' (data.rail) for context. Routes sharing a
// street overlap, most frequent on top. Path vertices are [x, y, bundle]; the bundle is not drawn.
// data.boundary: city boundary rings in address units (reference/city-boundary.json).

// Midday interval tiers, from the notebook. Grayscale steps by value; color by one blue ramp. The
// three steps sit evenly from ink to light so they stay apart on the city shading.
// 'none' (no midday service: rush-hour, night or event routes) is dashed.
export const TIER = {
  gray: { frequent: C.ink, regular: '#76746E', basic: '#B9B7B0', none: '#B9B7B0' },
  color: { frequent: '#0B2E5C', regular: '#3F80C8', basic: '#A8C9EC', none: '#A8C9EC' },
};
const DASH = '3 2';

export function renderDay02(data, { mode = 'gray', variant = 'plate' } = {}) {
  const { routes, summary, boundary = [] } = data;
  const out = [];
  const isPlate = variant === 'plate';
  const isMap = variant === 'map';
  const isChart = variant === 'chart';
  const isInset = variant === 'inset';
  const hooks = isMap || isChart || isInset; // hover hooks for the day page
  const uid = `d02-${variant}-${mode}`; // clip ids stay unique when both modes share a page
  // Label scale, as on Plate I: the day page shows the map at about 0.75x, so its labels run larger.
  const T = isMap || isChart ? 1.3 : 1.15;
  const TI = isInset ? 1.35 : 1.15;
  const tiers = TIER[mode === 'color' ? 'color' : 'gray'];
  const soft = hooks && mode === 'gray'; // on the page, route boxes step back as on Plate I
  const ink = (tier) => tiers[tier]; // routes keep full ink: softening it blurs the first two steps
  const maxRiders = Math.max(...routes.map((r) => r.riders));
  const fmt = (n) => Math.round(n).toLocaleString('en-US');

  // hover group for a route: tooltip data and its own id as the highlight key. The tooltip draws a
  // rule as thick as the route's riders (data-sep, px) in its tier's shade, then one sentence.
  const detail = (r) =>
    `${r.interval != null ? `A bus every ${Math.round(r.interval)} min at midday, carrying` : 'No bus at midday; carries'} ${fmt(r.riders)} riders on an average weekday and ${r.perHour} riders per bus-hour.`;
  const sep = (r) => (1.5 + 6.5 * (r.riders / maxRiders)).toFixed(1);
  const light = (tier) => tier === 'basic' || tier === 'none'; // light blue boxes take ink text
  const hover = (r, inner) =>
    hooks
      ? `<g data-id="r${esc(r.id)}" data-kind="route" data-tip="${esc(`${r.id} ${r.name}`)}" data-name="${esc(r.name)}" data-lines="${esc(r.id)}" data-keys="${esc(r.id)}" data-detail="${esc(detail(r))}" data-sep="${sep(r)}"${r.tier === 'none' ? ' data-dash="1"' : ''} data-gray="${TIER.gray[r.tier]}" data-color="${TIER.color[r.tier]}" data-on-color="${light(r.tier) ? C.ink : '#FFFFFF'}">${inner}</g>`
      : inner;
  const ring = (r, fx, fy) => 'M' + r.map(([x, y]) => `${fx(x).toFixed(1)},${fy(y).toFixed(1)}`).join('L') + 'Z';
  const city = (fx, fy) => boundary.map((r) => ring(r, fx, fy)).join('');
  const miles = (b) => ({ west: toMiles(b.west, 'x'), east: toMiles(b.east, 'x'), south: toMiles(b.south, 'y'), north: toMiles(b.north, 'y') });
  const loopBox = { west: -1200, east: 800, south: -1200, north: 1200 }; // Racine to the lake, Roosevelt to Division

  const d = (line) => 'M' + line.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join('L');
  const stroke = (r, w) => `stroke="${ink(r.tier)}" stroke-width="${w.toFixed(2)}"${r.tier === 'none' ? ` stroke-dasharray="${DASH}"` : ''}`;

  // No offsets: each route is drawn on its own streets, the other direction too where it uses
  // another street (r.alt). Routes that share a street overlap, most frequent on top, so a
  // street reads as the best service on it.
  const TIER_W = { frequent: 2.1, regular: 1.35, basic: 0.85, none: 0.85 };
  const TIER_RANK = { none: 0, basic: 1, regular: 2, frequent: 3 };
  const mapOrder = [...routes].sort((a, b) => TIER_RANK[a.tier] - TIER_RANK[b.tier] || a.riders - b.riders);
  const drawMapRoutes = (P, width) => {
    const lines = new Map();
    for (const r of mapOrder) {
      const line = r.path.map(([x, y]) => P(x, y));
      lines.set(r.id, line);
      const all = [line, ...(r.alt ?? []).map((run) => run.map(([x, y]) => P(x, y)))].map(d).join('');
      const w = width(r);
      const hit = hooks ? `<path d="${all}" fill="none" stroke="transparent" stroke-width="${(w + 6).toFixed(1)}"/>` : '';
      out.push(hover(r, `${hit}<path d="${all}" fill="none" ${stroke(r, w)} stroke-linejoin="round" stroke-linecap="round"/>`));
    }
    return lines;
  };
  // 'L' lines as hollow tubes, under the buses: a thin pencil casing with a paper core, so they
  // read as rail and never as a bus tier
  const tube = (dd, w) =>
    `<path d="${dd}" fill="none" stroke="${C.pencil}" stroke-width="${(w * 1.8).toFixed(2)}" stroke-opacity="0.55" stroke-linejoin="round" stroke-linecap="round"/>` +
    `<path d="${dd}" fill="none" stroke="${C.paper}" stroke-width="${w.toFixed(2)}" stroke-linejoin="round" stroke-linecap="round"/>`;
  const drawRail = (P, w) => {
    const dd = (data.rail ?? []).map(({ path }) => d(path.map(([x, y]) => P(x, y)))).join('');
    if (dd) out.push(tube(dd, w));
  };

  // route number in a box, as Plate I's line-name boxes: fog with ink text, or the tier's color
  // with white text in color mode
  const routeBox = (x, y, id, size, { tier = 'frequent', anchor = 'middle' } = {}) => {
    const bw = String(id).length * (size * 0.6 + 0.4) + 8;
    const bx = anchor === 'middle' ? x - bw / 2 : x;
    const fill = mode === 'color' ? TIER.color[tier] : soft ? C.rule : C.fog;
    const fg = mode === 'color' ? (tier === 'basic' || tier === 'none' ? C.ink : '#FFFFFF') : soft ? '#5A5853' : C.ink;
    return { w: bw, svg: `<rect x="${bx.toFixed(1)}" y="${(y - size * 0.82 - 2.5).toFixed(1)}" width="${bw.toFixed(1)}" height="${(size + 4).toFixed(1)}" rx="1.5" fill="${fill}"/>` + text(+(bx + bw / 2).toFixed(1), +y.toFixed(1), String(id), { size, weight: 600, spacing: 0.4, anchor: 'middle', fill: fg }) };
  };

  if (isPlate) out.push(frame({
    plate: 'II',
    chapter: 'THE GRID',
    day: 2,
    theme: 'Lines',
    title: 'The Half-Mile Promise',
    subtitle: 'Every CTA bus route, heavier and darker where the bus comes more often at midday, with the ’L’ for context. Shading marks the City of Chicago.',
  }));

  // ---------- main map: plotted in miles, top-left on the plate's text margin ----------
  // The extent sits on grid lines around every route, Evanston to 138th Street.
  const ext = { west: -11200, east: 4800, south: -14000, north: 10400 };
  const mi = miles(ext);
  const field = isMap ? { x: 60, y: 250, w: 760, h: 1040 } : { x: 60, y: 262, w: 575, h: 830 };
  const k = Math.min(field.w / (mi.east - mi.west), field.h / (mi.north - mi.south)); // px per mile
  const X = (x) => field.x + (toMiles(x, 'x') - mi.west) * k;
  const Y = (y) => field.y + (mi.north - toMiles(y, 'y')) * k;
  const fx0 = X(ext.west), fx1 = X(ext.east), fy0 = Y(ext.north), fy1 = Y(ext.south);
  const g = gridLines(ext);
  const gl = 8 * T;
  const labelLen = 7 * (gl * 0.6 + 0.4); // longest grid label, seven characters
  const colX = fx1 + 6 + labelLen; // right edge of the right-hand label column
  const labelTop = fy0 - 6 - labelLen; // top line of the rotated grid labels
  // line width by midday tier, scaled with the map
  const mapWidth = (r) => TIER_W[r.tier] * (k / 30);

  if (isPlate || isMap) {
    out.push(`<defs><clipPath id="${uid}-map"><rect x="${fx0}" y="${fy0}" width="${fx1 - fx0}" height="${fy1 - fy0}"/></clipPath></defs>`);
    out.push(`<g clip-path="url(#${uid}-map)">`);
    if (boundary.length) out.push(`<path d="${city(X, Y)}" fill="${C.ground}" fill-rule="evenodd"/>`);
    for (const x of g.xs) {
      const major = x === 0;
      out.push(`<line x1="${X(x)}" x2="${X(x)}" y1="${fy0}" y2="${fy1}" stroke="${major ? C.pencil : C.grid}" stroke-width="${major ? 0.8 : 0.6}"/>`);
    }
    for (const y of g.ys) {
      const major = y === 0;
      out.push(`<line x1="${fx0}" x2="${fx1}" y1="${Y(y)}" y2="${Y(y)}" stroke="${major ? C.pencil : C.grid}" stroke-width="${major ? 0.8 : 0.6}"/>`);
    }
    // routes
    drawRail((x, y) => [X(x), Y(y)], 1.5 * (k / 30));
    const lines = drawMapRoutes((x, y) => [X(x), Y(y)], mapWidth);
    out.push('</g>');
    // grid labels outside the map, as on Plate I. State and Madison are bold ink.
    const gridLabel = (v) => (v === 0 ? { fill: C.ink, weight: 600 } : { fill: C.pencil });
    for (const x of g.xs) out.push(text(X(x) + gl * 0.35, labelTop, formatAddress(x, 'x'), { size: gl, spacing: 0.4, rotate: -90, anchor: 'end', ...gridLabel(x) }));
    for (const y of g.ys) out.push(text(colX, Y(y) + gl * 0.35, formatAddress(y, 'y'), { size: gl, spacing: 0.4, anchor: 'end', ...gridLabel(y) }));

    // Loop inset outline on the main map. On the page the inset is cropped to fit its column, so the
    // page moves this outline to the cropped extent (data-inset-frame; y of Madison in data-y0).
    out.push(`<rect${hooks ? ` data-inset-frame data-y0="${+Y(0).toFixed(2)}"` : ''} x="${X(loopBox.west)}" y="${Y(loopBox.north)}" width="${X(loopBox.east) - X(loopBox.west)}" height="${Y(loopBox.south) - Y(loopBox.north)}" fill="none" stroke="${C.ink}" stroke-width="0.6" stroke-dasharray="2 2"/>`);

    // route numbers: the busiest routes that together carry half the riders are always labeled;
    // every route gets a hidden label the page shows when that route is highlighted. Each label
    // sits on its own line, as far as possible from labels already placed and outside the inset box.
    const ls = 7 * T;
    const placed = [];
    const lb = { x0: X(loopBox.west) - 6, x1: X(loopBox.east) + 6, y0: Y(loopBox.north) - 6, y1: Y(loopBox.south) + 6 };
    const along = (line, f) => {
      const cum = [0];
      for (let i = 1; i < line.length; i++) cum.push(cum[i - 1] + Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]));
      const s = f * cum.at(-1);
      const i = Math.max(1, cum.findIndex((c) => c >= s));
      const t = (s - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
      return [line[i - 1][0] + (line[i][0] - line[i - 1][0]) * t, line[i - 1][1] + (line[i][1] - line[i - 1][1]) * t];
    };
    const spot = (line) => {
      let best = null;
      for (let f = 0.12; f <= 0.88; f += 0.04) {
        const [x, y] = along(line, f);
        if (x < fx0 + 14 || x > fx1 - 14 || y < fy0 + 10 || y > fy1 - 10) continue;
        if (x > lb.x0 && x < lb.x1 && y > lb.y0 && y < lb.y1) continue;
        const near = placed.reduce((m, [px, py]) => Math.min(m, Math.hypot(px - x, py - y)), Infinity);
        if (!best || near > best.near) best = { x, y, near };
      }
      return best;
    };
    const tagged = (r, cls, inner) => (hooks ? `<g class="${cls}" data-keys="${esc(r.id)}">${inner}</g>` : inner);
    const labelOf = (r, p) => routeBox(p.x, p.y + ls * 0.36, r.id, ls, { tier: r.tier }).svg;
    for (const r of routes.slice(0, summary.halfRoutes)) {
      const p = spot(lines.get(r.id));
      if (!p) continue;
      placed.push([p.x, p.y]);
      out.push(tagged(r, 'perm-label', labelOf(r, p)));
    }
    if (hooks) for (const r of routes) {
      const p = along(lines.get(r.id), 0.5);
      out.push(tagged(r, 'hl-label', labelOf(r, { x: p[0], y: p[1] })));
    }

    // mile ruler: four grid cells, ticks on the grid lines, in the bottom row of cells
    const rx = X(ext.west + 800), ry = Y(ext.south) - k * 0.35;
    out.push(`<line x1="${rx}" x2="${rx + 4 * k}" y1="${ry}" y2="${ry}" stroke="${C.ink}" stroke-width="1.2"/>`);
    for (let i = 0; i <= 4; i++) out.push(`<line x1="${rx + i * k}" x2="${rx + i * k}" y1="${ry - (i % 4 === 0 ? 6 : 4)}" y2="${ry}" stroke="${C.ink}" stroke-width="1.2"/>`);
    out.push(text(rx, ry - 9, '0', { size: 7.5 * T, anchor: 'middle' }));
    out.push(text(rx + 4 * k, ry - 9, '4 MI', { size: 7.5 * T, anchor: 'middle' }));

    // legend: on the plate one line under the subtitle; on the page stacked in the map's empty
    // south-west corner, just above the mile ruler, with a paper knock-out
    const lgs = 9 * T;
    const sample = (w, tier, len = 18) => `<line x1="${-len / 2}" x2="${len / 2}" y1="0" y2="0" stroke="${ink(tier)}" stroke-width="${w}"${tier === 'none' ? ` stroke-dasharray="${DASH}"` : ''}/>`;
    const legend = [
      ['head', 'Midday, a bus every'],
      [sample(mapWidth({ tier: 'frequent' }), 'frequent'), '10 min or less'],
      [sample(mapWidth({ tier: 'regular' }), 'regular'), '11–15 min'],
      [sample(mapWidth({ tier: 'basic' }), 'basic'), 'over 15 min'],
      [sample(mapWidth({ tier: 'none' }), 'none'), 'no midday bus'],
      ...(data.rail?.length ? [[tube('M-9,0L9,0', 1.5 * (k / 30)), '’L’ line']] : []),
      ...(boundary.length ? [[`<rect x="-5" y="-5" width="10" height="10" fill="${C.ground}"/>`, 'City of Chicago']] : []),
    ];
    if (isPlate) {
      let lx = 60;
      const y = 203;
      legend.forEach(([mark, label]) => {
        if (mark === 'head') {
          if (lx > 60) lx += 6;
          out.push(text(lx, y, `${label}:`, { size: lgs, fill: C.pencil }));
          lx += (label.length + 1) * lgs * 0.6 + 8;
          return;
        }
        out.push(`<g transform="translate(${lx + 8} ${y - lgs * 0.35})">${mark}</g>`);
        out.push(text(lx + 20, y, label, { size: lgs, fill: C.pencil }));
        lx += 20 + label.length * lgs * 0.6 + 9;
      });
    } else {
      // stack height first, so the legend ends just above the ruler's labels
      const height = legend.reduce((h, [mark], i) => h + (mark === 'head' ? (i ? 32 : 22) : 20), 0);
      let y = ry - 9 - 7.5 * T - 14 - height;
      legend.forEach(([mark, label], i) => {
        if (mark === 'head') {
          y += i ? 10 : 0;
          out.push(text(fx0 + 6, y + 17, label.toUpperCase(), { size: lgs * 0.85, weight: 600, spacing: 0.6, halo: C.paper }));
          y += 22;
          return;
        }
        out.push(`<g transform="translate(${fx0 + 16} ${y + 11})">${mark}</g>`);
        out.push(text(fx0 + 32, y + 11 + lgs * 0.35, label, { size: lgs, halo: C.paper }));
        y += 20;
      });
    }
  }

  if (isMap) {
    return svg(out.join(''), { label: mapLabel(summary), viewBox: `60 184 ${Math.ceil(colX + 4 - 60)} 1114`, align: 'xMinYMin meet' })
      .replace('<svg ', `<svg data-top="${labelTop - 184}" data-bottom="${fy1 - 184}" data-ppm="${+k.toFixed(3)}" `);
  }

  // ---------- margin column (plate), chart or inset (day page) ----------
  const mx = isPlate ? Math.round(colX + 38) : isChart ? 2 : 0;
  const cw = isChart ? 390 : W_COL; // column width
  const title = (y, str) => out.push(text(mx, y, str, { size: 10.5 * T, weight: 600, spacing: 1 }));
  const ns = 10.5, nh = 14;
  const note = (y, str) => out.push(text(mx, y, str, { size: ns, font: SERIF, italic: true, fill: C.pencil }));
  let uy = 0; // running y of the margin column

  if (isPlate || isChart) {
    // Riders by route: the busiest routes that together carry half the riders, busiest first. A box
    // with the route number, its name, a bar as long as its weekday riders (value = midday tier),
    // an empty outline on to its 2019 average (riders lost) or a paper notch at 2019 (riders
    // gained), the count, and the change from 2019.
    const cs = isChart ? 8 * T : 8;
    const row = isChart ? 17 : 12.4;
    const bar = isChart ? { x: 150, w: 149, h: 9 } : { x: 116, w: 112, h: 6.5 };
    const pctW = isChart ? 48 : 36; // the change column, right of the count
    if (isChart) {
      uy = Math.round(cs + 2); // the page sets the title and notes in HTML above the rows
    } else {
      uy = Math.round(labelTop + 10.5 * T * 0.72); // the title's cap sits on the grid labels' top line
      title(uy, 'AVERAGE WEEKDAY RIDERS BY ROUTE');
      const noteLines = wrap(`Ridership for the ${summary.halfRoutes} busiest routes, which carry half the riders · Outline shows ${data.benchmarkYear} ridership · Shade shows midday frequency`, Math.floor(cw / (ns * 0.45)));
      noteLines.forEach((l, i) => note(uy + (i + 1) * nh + 4, l));
      uy += noteLines.length * nh + 24;
    }
    // column heads over the count and the change
    const hs = cs * 0.8;
    out.push(text(mx + cw - pctW, uy - row * 0.15, 'RIDERS', { size: hs, anchor: 'end', spacing: 0.4, fill: C.pencil }));
    out.push(text(mx + cw, uy - row * 0.15, `VS ${data.benchmarkYear}`, { size: hs, anchor: 'end', spacing: 0.4, fill: C.pencil }));
    uy += row * 0.85;
    const top = routes.slice(0, summary.halfRoutes);
    // the scale reaches the larger of today's top route and the 2019 outlines
    const benchMax = Math.max(...top.map((r) => r.ridersBench ?? 0));
    const bx = (v) => mx + bar.x + (v / Math.max(maxRiders, benchMax)) * bar.w;
    for (const r of top) {
      if (hooks) out.push(`<g data-hl="${esc(r.id)}"><rect x="${mx - 4}" y="${uy - row + 3}" width="${cw + 8}" height="${row}" fill="transparent"/>`);
      out.push(routeBox(mx, uy, r.id, cs, { tier: r.tier, anchor: 'start' }).svg);
      out.push(text(mx + (isChart ? 42 : 34), uy, r.name.length > (isChart ? 15 : 13) ? r.name.slice(0, isChart ? 14 : 12) + '…' : r.name, { size: cs, fill: C.pencil }));
      const by = uy - cs * 0.36 - bar.h / 2;
      out.push(`<rect x="${mx + bar.x}" y="${by.toFixed(1)}" width="${(bx(r.riders) - mx - bar.x).toFixed(1)}" height="${bar.h}" fill="${ink(r.tier)}"${r.tier === 'none' ? ' fill-opacity="0.5"' : ''}/>`);
      if (r.ridersBench > r.riders) {
        // riders lost since 2019: an empty box the bar's height, stroked in the bar's shade inside its edges
        out.push(`<rect x="${(bx(r.riders) + 0.35).toFixed(1)}" y="${(by + 0.35).toFixed(1)}" width="${(bx(r.ridersBench) - bx(r.riders) - 0.7).toFixed(1)}" height="${(bar.h - 0.7).toFixed(1)}" fill="none" stroke="${ink(r.tier)}" stroke-width="0.7"/>`);
      } else if (r.ridersBench) {
        // riders gained: a paper notch where 2019 falls inside the bar
        out.push(`<line x1="${bx(r.ridersBench).toFixed(1)}" x2="${bx(r.ridersBench).toFixed(1)}" y1="${(by - 1).toFixed(1)}" y2="${(by + bar.h + 1).toFixed(1)}" stroke="${C.paper}" stroke-width="1.4"/>`);
      }
      out.push(text(mx + cw - pctW, uy, fmt(r.riders), { size: cs, anchor: 'end', fill: r.rank <= 1 ? C.ink : C.pencil, weight: r.rank <= 1 ? 600 : 400 }));
      if (r.ridersBench) {
        const ch = Math.round((r.riders / r.ridersBench - 1) * 100);
        const up = ch > 0;
        out.push(text(mx + cw, uy, `${up ? '+' : ch < 0 ? '−' : ''}${Math.abs(ch)}%`, { size: cs, anchor: 'end', fill: up ? C.ink : C.pencil, weight: up ? 600 : 400 }));
      }
      if (hooks) out.push('</g>');
      uy += row;
    }
    // the half-way rule
    const ry = uy - row + 6;
    out.push(`<line x1="${mx}" x2="${mx + cw}" y1="${ry}" y2="${ry}" stroke="${C.ink}" stroke-width="0.6" stroke-dasharray="2 2"/>`);
    const rest = summary.routesInData - summary.halfRoutes;
    out.push(text(mx + cw, ry + cs + 5, `HALF OF ${fmt(summary.riders)} RIDERS · THE OTHER ${rest} ROUTES CARRY THE REST`, { size: cs * 0.85, anchor: 'end', spacing: 0.3, fill: C.pencil }));
    uy = ry + cs + 5;
    if (isChart) {
      return svg(out.join(''), { label: `The ${summary.halfRoutes} busiest bus routes, which carry half of Chicago’s weekday bus riders.`, viewBox: `0 0 ${cw + 6} ${Math.ceil(uy + 4)}`, align: 'xMinYMin meet' });
    }
  }

  // Loop inset, in miles like the main map, with a grid line every half mile. The page's inset is
  // drawn tall, centred on the Loop box (7 miles either side of 0.25 mi north), so the page can crop
  // it to fit; data-north gives the miles at the top edge.
  const box = isInset ? { ...loopBox, north: 6000, south: -6000 } : loopBox;
  const lbm = miles(box);
  const iw = isInset ? 390 : W_COL;
  const ki = iw / (lbm.east - lbm.west); // px per mile
  const ty = uy + 30;
  if (isPlate) {
    title(ty, 'INSET · THE LOOP AND MICHIGAN AVENUE');
    note(ty + nh + 4, `Shown at ×${(ki / k).toFixed(1)} the scale of the main map.`);
    note(ty + 2 * nh + 4, 'Routes that share a street overlap, most frequent on top.');
  }
  const inset = isInset ? { x: 0, y: 0, w: iw, h: Math.round((lbm.north - lbm.south) * ki) } : { x: mx, y: ty + 2 * nh + 16, w: iw, h: Math.round((lbm.north - lbm.south) * ki) };
  out.push(`<defs><clipPath id="${uid}-inset"><rect x="${inset.x}" y="${inset.y}" width="${inset.w}" height="${inset.h}"/></clipPath></defs>`);
  out.push(`<rect x="${inset.x}" y="${inset.y}" width="${inset.w}" height="${inset.h}" fill="${C.paper}"/>`);
  const IXm = (m) => inset.x + (m - lbm.west) * ki;
  const IYm = (m) => inset.y + (lbm.north - m) * ki;
  const IX = (x) => IXm(toMiles(x, 'x'));
  const IY = (y) => IYm(toMiles(y, 'y'));
  out.push(`<g clip-path="url(#${uid}-inset)">`);
  if (boundary.length) out.push(`<path d="${city(IX, IY)}" fill="${C.ground}" fill-rule="evenodd"/>`);
  for (let m = Math.ceil(lbm.west * 2) / 2; m <= lbm.east; m += 0.5) {
    const major = m === 0;
    out.push(`<line x1="${IXm(m)}" x2="${IXm(m)}" y1="${inset.y}" y2="${inset.y + inset.h}" stroke="${major ? C.pencil : C.grid}" stroke-width="${major ? 0.8 : 0.6}"/>`);
  }
  for (let m = Math.ceil(lbm.south * 2) / 2; m <= lbm.north; m += 0.5) {
    const major = m === 0;
    out.push(`<line x1="${inset.x}" x2="${inset.x + inset.w}" y1="${IYm(m)}" y2="${IYm(m)}" stroke="${major ? C.pencil : C.grid}" stroke-width="${major ? 0.8 : 0.6}"/>`);
  }
  // routes at the inset's scale, drawn as on the map
  drawRail((x, y) => [IX(x), IY(y)], 2.4);
  drawMapRoutes((x, y) => [IX(x), IY(y)], (r) => TIER_W[r.tier] * 1.4);
  // STATE sits on the inset's bottom edge; on the page, the bottom of the crop (data-pin-bottom)
  const stateLabel = text(IX(0) + 3, isInset ? -5 : inset.y + inset.h - 5, 'STATE', { size: 7 * TI, fill: C.ink, weight: 600, halo: C.paper });
  out.push(isInset ? `<g data-pin-bottom transform="translate(0 ${IY(loopBox.south)})">${stateLabel}</g>` : stateLabel);
  out.push(text(inset.x + 4, IY(0) - 4, 'MADISON', { size: 7 * TI, fill: C.ink, weight: 600, halo: C.paper }));
  out.push('</g>');
  if (isPlate) out.push(`<rect x="${inset.x}" y="${inset.y}" width="${inset.w}" height="${inset.h}" fill="none" stroke="${C.ink}" stroke-width="0.8"/>`);

  if (isInset) {
    return svg(out.join(''), { label: 'The Loop and Michigan Avenue: bus routes by midday frequency.', viewBox: `0 0 ${inset.w} ${inset.h}`, align: 'xMidYMid slice' })
      .replace('<svg ', `<svg data-ppm="${+ki.toFixed(3)}" data-north="${+lbm.north.toFixed(3)}" `);
  }

  // plate: Findings close the column, as on Plate I
  let fy = inset.y + inset.h + 36;
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
  const nsched = (data.notScheduled ?? []).length;
  const ledger = [
    ['SOURCE', `CTA Bus Routes, Daily Totals by Route · Chicago Data Portal · ${data.source.id} · pulled ${data.asOf}`],
    ['UNITS', `Average weekday riders per route, ${monthSpan(data.window)} (weekday rides ÷ weekdays)`],
    ['SERVICE', `CTA GTFS, feed of ${data.gtfs.feedDate}; schedule of Wed ${data.gtfs.refDay}; midday = 10:00–15:00`],
    ['METHOD', 'One shape per route, both streets of one-way pairs; shared streets overlap, most frequent on top'],
    ['', 'Plotted in miles from State & Madison; grid lines labeled with address numbers'],
    ['CAVEAT', `Riders are boardings on the whole route, not the load on any one street; ${nsched} event`],
    ['', `and seasonal routes (${pct(data.notScheduled.reduce((s, r) => s + r.riders, 0) / summary.riders, 2)} of riders) count in totals but are not drawn`],
    ['LIMITS', 'City of Chicago, Boundaries – City · qqq8-j68g'],
    ['CTA', 'Frequent Network and Better Streets for Buses pages; releases of 2 Mar 2025 to 30 Sep 2026'],
  ];
  dy += 18;
  for (const [kk, v] of ledger) {
    out.push(text(lx, dy, kk, { size: 8.5, fill: C.pencil, spacing: 0.6 }));
    out.push(text(lx + 64, dy, v, { size: 9.5, font: SERIF }));
    dy += 13.5;
  }

  return svg(out.join(''), { label: mapLabel(summary) });
}

const W_COL = 300; // plate margin column width, as on Plate I

const mapLabel = (summary) =>
  `Plate II, The Half-Mile Promise: ${summary.halfRoutes} of ${summary.routesInData} Chicago bus routes carry half of the city’s weekday bus riders.`;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const monthSpan = ([a, b]) => {
  const [ya, ma] = a.split('-').map(Number), [yb, mb] = b.split('-').map(Number);
  return `${MONTHS[ma - 1]} ${ya} – ${MONTHS[mb - 1]} ${yb}`;
};
export const pct = (v, digits = 0) => `${(v * 100).toFixed(digits)}%`;
