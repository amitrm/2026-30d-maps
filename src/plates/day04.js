// Plate IV · Where Walking Ends · Day 04 Clusters
import { C, SERIF, SANS, esc, text, textWidth, legendBox, wrap, frame, svg } from '../lib/plate.js';
import { gridLines, formatAddress, toMiles } from '../lib/grid.js';

// variant 'plate': the full 1080 x 1350 plate (export, download).
// variant 'map': the map alone, with hover hooks, for the day page's left column.
// variant 'chart': the largest clusters, with hover hooks, for the day page's middle column.
// variant 'inset': the inset alone, drawn tall around the largest cluster so the page can crop it.
// data.people: one record per person walking or biking killed or seriously injured, 2021-2025, in
// address units ({ x, y, m: 'w' | 'b', k: 1 if killed, c: cluster rank or 0 }).
// data.clusters: the clusters that hold up in resampling, largest first, each with the streets that
// join its people (polylines in address units).
// data.hin: CDOT's High Injury Network corridors as lines.
// Clusters are a band along those streets, a darker tint with a pencil edge (the edge tells them from
// the High Injury Network band, paler and without one). People are dots: killed large, seriously injured
// small; in color mode walking and biking take two hues, and clusters and the network stay gray.
// data.boundary: city boundary rings in address units (reference/city-boundary.json).

export const MARK = {
  tint: '#BDBBB4', // the High Injury Network band
  band: '#A9A7A0', // clusters: a band along their streets, a step darker, with a pencil edge
  walk: '#5D3A9B', // color mode: purple walking, orange biking (ColorBrewer PuOr ends)
  bike: '#E66100',
};

export function renderDay04(data, { mode = 'gray', variant = 'plate' } = {}) {
  const { people, clusters, hin, summary, boundary = [] } = data;
  const out = [];
  const isPlate = variant === 'plate';
  const isMap = variant === 'map';
  const isChart = variant === 'chart';
  const isInset = variant === 'inset';
  const hooks = isMap || isChart || isInset; // hover hooks for the day page
  const uid = `d04-${variant}-${mode}`;
  const T = isMap || isChart ? 1.3 : 1.15;
  const TI = isInset ? 1.35 : 1.15;
  const color = mode === 'color';
  const fmt = (n) => Math.round(n).toLocaleString('en-US');
  const pct = (v) => `${Math.round(v * 100)}%`;
  const hue = (m) => (m === 'w' ? MARK.walk : MARK.bike);
  const byRank = new Map(clusters.map((c) => [c.rank, c]));
  const TOP = 10; // clusters numbered on the map and in the inset

  const ring = (r, fx, fy) => 'M' + r.map(([x, y]) => `${fx(x).toFixed(1)},${fy(y).toFixed(1)}`).join('L') + 'Z';
  const city = (fx, fy) => boundary.map((r) => ring(r, fx, fy)).join('');
  const line = (pts, fx, fy) => 'M' + pts.map(([x, y]) => `${fx(x).toFixed(1)},${fy(y).toFixed(1)}`).join('L');
  const miles = (b) => ({ west: toMiles(b.west, 'x'), east: toMiles(b.east, 'x'), south: toMiles(b.south, 'y'), north: toMiles(b.north, 'y') });
  // the inset: the largest cluster (data.inset.box), widened to whole half-miles
  const ib = data.inset.box;
  const snap = (v, f) => f(v / 400) * 400;
  const insetBox = { west: snap(ib.west - 200, Math.floor), east: snap(ib.east + 200, Math.ceil), south: snap(ib.south - 200, Math.floor), north: snap(ib.north + 200, Math.ceil) };

  // tooltip rows for a cluster
  // the cluster tooltip (the page draws it from these: data-kind=cluster): number box, name and
  // community area, the total, a walking / biking bar with the deaths as dots under their part of
  // it, the counts, then the rows of data-detail
  const killedBy = new Map(clusters.map((c) => [c.rank, { w: 0, b: 0 }]));
  for (const p of people) if (p.k && p.c) killedBy.get(p.c)[p.m]++;
  const detail = (c) => [
    `${pct(c.night)} after dark · driver left the scene for ${pct(c.hitRun)}`,
    c.onHin ? `On CDOT’s High Injury Network (${pct(c.hinShare)} of its people)` : c.hinShare ? `Mostly off CDOT’s High Injury Network (${pct(c.hinShare)} on it)` : 'Off CDOT’s High Injury Network',
  ].join('|');
  // bar walking, bar biking, dot walking, dot biking
  const tipColors = `${[C.pencil, C.fog, C.ink, C.ink].join(' ')}|${[MARK.walk, MARK.bike, MARK.walk, MARK.bike].join(' ')}`; // grayscale | color
  const tipData = (c) => {
    const k = killedBy.get(c.rank);
    return `data-kind="cluster" data-tip="${esc(c.name)}" data-name="${esc(c.name)}" data-rank="${c.rank}" data-ca="${esc(c.community)}" data-total="${fmt(c.people)} people killed or seriously hurt, 2021–2025" data-walk="${c.walk}" data-bike="${c.bike}" data-kw="${k.w}" data-kb="${k.b}" data-colors="${tipColors}" data-detail="${esc(detail(c))}"`;
  };

  // the network band, under everything but the city
  const drawHin = (fx, fy, w) =>
    out.push(`<path d="${hin.map((h) => line(h.line, fx, fy)).join('')}" fill="none" stroke="${MARK.tint}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`);
  // clusters: a band along the streets that join their people, a pencil edge round a darker tint; on
  // the page each is a hover target (a wider invisible stroke), darkened on hover or when its chart
  // row is highlighted
  const drawClusters = (fx, fy, [outer, inner]) => {
    const stroke = (d, color, w, extra = '') => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${extra}/>`;
    if (hooks) out.push(`<style>.${uid}-c .t{stroke:${C.ink};stroke-opacity:0}.${uid}-c:hover .t,svg.hl .${uid}-c.on .t{stroke-opacity:0.2}svg.hl .${uid}-c.on{opacity:1}</style>`);
    for (const c of clusters) {
      const d = c.streets.map((l) => line(l, fx, fy)).join('');
      const band = stroke(d, C.pencil, outer) + stroke(d, MARK.band, inner);
      out.push(hooks
        ? `<g class="${uid}-c" data-hl="c${c.rank}" ${tipData(c)}>${band}${stroke(d, 'transparent', outer + 6)}${stroke(d, C.ink, inner, ' class="t"')}</g>`
        : band);
    }
  };
  // people, grouped by cluster so a highlighted cluster keeps its own; seriously injured first,
  // killed on top
  const drawPeople = (fx, fy, inBox, [rs, rk]) => {
    const groups = new Map();
    for (const p of people) {
      if (inBox && !inBox(p)) continue;
      if (!groups.has(p.c)) groups.set(p.c, []);
      groups.get(p.c).push(p);
    }
    for (const killed of [0, 1]) {
      for (const [c, ps] of groups) {
        const dots = ps.filter((p) => p.k === killed).map((p) => {
          const fill = color ? hue(p.m) : killed ? C.ink : C.pencil;
          return `<circle cx="${fx(p.x).toFixed(1)}" cy="${fy(p.y).toFixed(1)}" r="${killed ? rk : rs}" fill="${fill}"/>`;
        });
        if (dots.length) out.push(hooks ? `<g data-keys="c${c}">${dots.join('')}</g>` : dots.join(''));
      }
    }
  };
  // Cluster numbers in a box, as in the chart, for the largest clusters. Each box goes at the free
  // spot nearest its cluster's band: it may not touch a dot (with a 1 px margin), another box, or
  // leave the field, and one that covers a cluster band (its own or another) costs extra.
  const rect = (x, y, w, h) => ({ x0: x - w / 2, x1: x + w / 2, y0: y - h / 2, y1: y + h / 2 });
  // distance from a box to a segment [[ax, ay], [bx, by]]: the segment's point nearest the box centre
  const boxGap = (b, [[ax, ay], [bx, by]]) => {
    const px = (b.x0 + b.x1) / 2, py = (b.y0 + b.y1) / 2;
    const L = (bx - ax) ** 2 + (by - ay) ** 2 || 1;
    const t = Math.max(0, Math.min(1, ((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / L));
    const qx = ax + t * (bx - ax), qy = ay + t * (by - ay);
    return Math.hypot(Math.max(b.x0 - qx, 0, qx - b.x1), Math.max(b.y0 - qy, 0, qy - b.y1));
  };
  const drawNumbers = (fx, fy, size, field, [rs, rk], half, only) => {
    const ranks = clusters.filter((c) => c.rank <= TOP && (!only || only.includes(c.rank)));
    const segs = new Map(clusters.map((c) => [c.rank, c.streets.flatMap((l) => l.slice(1).map((pt, i) => [[fx(l[i][0]), fy(l[i][1])], [fx(pt[0]), fy(pt[1])]]))]));
    const dots = people.map((p) => [fx(p.x), fy(p.y), (p.k ? rk : rs) + 1]).filter(([x, y]) => x > field.x0 - 10 && x < field.x1 + 10 && y > field.y0 - 10 && y < field.y1 + 10);
    const placed = [];
    const clear = (b) =>
      b.x0 >= field.x0 + 1 && b.x1 <= field.x1 - 1 && b.y0 >= field.y0 + 1 && b.y1 <= field.y1 - 1 &&
      !placed.some((o) => b.x0 < o.x1 + 1 && b.x1 > o.x0 - 1 && b.y0 < o.y1 + 1 && b.y1 > o.y0 - 1) &&
      !dots.some(([x, y, r]) => x + r > b.x0 && x - r < b.x1 && y + r > b.y0 && y - r < b.y1 &&
        Math.hypot(x - Math.max(b.x0, Math.min(x, b.x1)), y - Math.max(b.y0, Math.min(y, b.y1))) < r);
    // how many cluster bands the box would sit on
    const near = [...segs.values()].flat().filter(([[ax, ay], [bx, by]]) => Math.max(ax, bx) > field.x0 - 80 && Math.min(ax, bx) < field.x1 + 80);
    const covers = (b) => near.filter((sg) => boxGap(b, sg) < half).length;
    for (const c of ranks) {
      const edges = segs.get(c.rank);
      if (!edges.length) continue;
      const label = String(c.rank);
      const w = textWidth(label, size, { weight: 600 }) + 8, h = size + 5;
      // candidates: a 1.5 px grid around the band; cost is the gap from the box to the band's middle
      // line, plus a charge for sitting on a band
      const gap = (b) => edges.reduce((m, sg) => Math.min(m, boxGap(b, sg)), Infinity);
      const own = edges.flat();
      const xs = own.map(([x]) => x), ys = own.map(([, y]) => y);
      const R = 70;
      let best = null;
      for (let bx = Math.min(...xs) - R; bx <= Math.max(...xs) + R; bx += 1.5) {
        for (let by = Math.min(...ys) - R; by <= Math.max(...ys) + R; by += 1.5) {
          const b = rect(bx, by, w, h);
          const g = gap(b);
          if (best && g >= best.cost) continue;
          if (!clear(b)) continue;
          const cost = g + 6 * Math.min(covers(b), 3);
          if (!best || cost < best.cost) best = { cost, b, x: bx, y: by };
        }
      }
      if (!best) continue;
      placed.push(best.b);
      const tag = hooks ? ` data-keys="c${c.rank}"` : '';
      out.push(`<g${tag}><rect x="${best.b.x0.toFixed(1)}" y="${best.b.y0.toFixed(1)}" width="${w.toFixed(1)}" height="${h}" rx="1.5" fill="${C.fog}"/>${text(+best.x.toFixed(1), +(best.y + size * 0.36).toFixed(1), label, { size, weight: 600, anchor: 'middle' })}</g>`);
    }
  };
  const drawGrid = (xs, ys, X, Y, x0, x1, y0, y1, minor = []) => {
    for (const [x, y, w, s] of minor) out.push(`<line x1="${x ?? x0}" x2="${x ?? x1}" y1="${y ?? y0}" y2="${y ?? y1}" stroke="${s}" stroke-width="${w}"/>`);
    for (const x of xs) {
      const major = x === 0;
      out.push(`<line x1="${X(x)}" x2="${X(x)}" y1="${y0}" y2="${y1}" stroke="${major ? C.pencil : C.grid}" stroke-width="${major ? 0.8 : 0.6}"/>`);
    }
    for (const y of ys) {
      const major = y === 0;
      out.push(`<line x1="${x0}" x2="${x1}" y1="${Y(y)}" y2="${Y(y)}" stroke="${major ? C.pencil : C.grid}" stroke-width="${major ? 0.8 : 0.6}"/>`);
    }
  };

  if (isPlate) out.push(frame({
    plate: 'IV',
    chapter: 'THE GRID',
    day: 4,
    theme: 'Clusters',
    title: 'Where Walking Ends',
    subtitle: 'Every person walking or biking killed or seriously hurt on Chicago streets, 2021–2025, and where they cluster.',
  }));

  // ---------- main map: plotted in miles, top-left on the plate's text margin ----------
  // The extent is Plates II and III's: Evanston to 138th Street, Cumberland to the lake.
  const ext = { west: -11200, east: 4800, south: -14000, north: 10400 };
  const mi = miles(ext);
  const field = isMap ? { x: 60, y: 250, w: 760, h: 1040 } : { x: 60, y: 262, w: 575, h: 830 };
  const k = Math.min(field.w / (mi.east - mi.west), field.h / (mi.north - mi.south)); // px per mile
  const X = (x) => field.x + (toMiles(x, 'x') - mi.west) * k;
  const Y = (y) => field.y + (mi.north - toMiles(y, 'y')) * k;
  const fx0 = X(ext.west), fx1 = X(ext.east), fy0 = Y(ext.north), fy1 = Y(ext.south);
  const g = gridLines(ext);
  const gl = 8 * T;
  const labelLen = 7 * (gl * 0.6 + 0.4); // room kept for the grid labels, as on Plate I
  const colX = fx1 + 6 + labelLen;
  const labelTop = fy0 - 6 - labelLen;
  const dots = isMap ? [0.95, 2.1] : [0.75, 1.7]; // seriously injured, killed

  if (isPlate || isMap) {
    out.push(`<defs><clipPath id="${uid}-map"><rect x="${fx0}" y="${fy0}" width="${fx1 - fx0}" height="${fy1 - fy0}"/></clipPath></defs>`);
    out.push(`<g clip-path="url(#${uid}-map)">`);
    if (boundary.length) out.push(`<path d="${city(X, Y)}" fill="${C.ground}" fill-rule="evenodd"/>`);
    drawGrid(g.xs, g.ys, X, Y, fx0, fx1, fy0, fy1);
    drawHin(X, Y, isMap ? 4.2 : 3.2);
    drawClusters(X, Y, isMap ? [6, 4.4] : [5, 3.6]);
    drawPeople(X, Y, null, dots);
    drawNumbers(X, Y, 8 * T, { x0: fx0, x1: fx1, y0: fy0, y1: fy1 }, dots, isMap ? 3 : 2.5);
    out.push('</g>');
    const gridLabel = (v) => (v === 0 ? { fill: C.ink, weight: 600 } : { fill: C.pencil });
    for (const x of g.xs) out.push(text(X(x) + gl * 0.35, labelTop, formatAddress(x, 'x'), { size: gl, spacing: 0.4, rotate: -90, anchor: 'end', ...gridLabel(x) }));
    for (const y of g.ys) out.push(text(colX, Y(y) + gl * 0.35, formatAddress(y, 'y'), { size: gl, spacing: 0.4, anchor: 'end', ...gridLabel(y) }));

    // inset outline on the main map (the page moves it to the cropped extent)
    out.push(`<rect${hooks ? ` data-inset-frame data-y0="${+Y(0).toFixed(2)}"` : ''} x="${X(insetBox.west)}" y="${Y(insetBox.north)}" width="${X(insetBox.east) - X(insetBox.west)}" height="${Y(insetBox.south) - Y(insetBox.north)}" fill="none" stroke="${C.ink}" stroke-width="0.6" stroke-dasharray="2 2"/>`);

    // mile ruler: four grid cells, ticks on the grid lines, in the bottom row of cells
    const rx = X(ext.west + 800), ry = Y(ext.south) - k * 0.35;
    out.push(`<line x1="${rx}" x2="${rx + 4 * k}" y1="${ry}" y2="${ry}" stroke="${C.ink}" stroke-width="1.2"/>`);
    for (let i = 0; i <= 4; i++) out.push(`<line x1="${rx + i * k}" x2="${rx + i * k}" y1="${ry - (i % 4 === 0 ? 6 : 4)}" y2="${ry}" stroke="${C.ink}" stroke-width="1.2"/>`);
    out.push(text(rx, ry - 9, '0', { size: 7.5 * T, anchor: 'middle' }));
    out.push(text(rx + 4 * k, ry - 9, '4 MI', { size: 7.5 * T, anchor: 'middle' }));

    // legend: on the plate one line under the subtitle; on the page in a box over the mile ruler
    const lgs = 9 * T;
    const swatch = (fill, stroke) => `<rect x="-6" y="-5" width="12" height="10" fill="${fill}"${stroke ? ` stroke="${stroke}" stroke-width="0.7"` : ''}/>`;
    const pair = (fk, fs) => `<circle cx="-3" cy="0" r="2.6" fill="${fk}"/><circle cx="4" cy="0" r="1.3" fill="${fs}"/>`;
    const legend = [
      ...(color
        ? [[pair(MARK.walk, MARK.walk), 'Walking'], [pair(MARK.bike, MARK.bike), 'Biking'], ['', 'Large dot: killed; small: seriously injured']]
        : [[`<circle r="2.6" fill="${C.ink}"/>`, 'Killed'], [`<circle r="1.3" fill="${C.pencil}"/>`, 'Seriously injured']]),
      [`<line x1="-6" x2="6" y1="0" y2="0" stroke="${C.pencil}" stroke-width="5" stroke-linecap="round"/><line x1="-6" x2="6" y1="0" y2="0" stroke="${MARK.band}" stroke-width="3.6" stroke-linecap="round"/>`, 'Cluster, along its streets'],
      [`<line x1="-7" x2="7" y1="0" y2="0" stroke="${MARK.tint}" stroke-width="4" stroke-linecap="round"/>`, 'High Injury Network (CDOT, 2025)'],
      ...(boundary.length ? [[swatch(C.ground), 'City of Chicago']] : []),
    ];
    if (isPlate) {
      let lx = 60;
      const y = 203;
      for (const [mark, lab] of legend) {
        if (!mark) {
          out.push(text(lx, y, `(${lab})`, { size: lgs, fill: C.pencil }));
          lx += textWidth(`(${lab})`, lgs) + 9;
          continue;
        }
        out.push(`<g transform="translate(${lx + 6} ${y - lgs * 0.35})">${mark}</g>`);
        out.push(text(lx + 17, y, lab, { size: lgs, fill: C.pencil }));
        lx += 17 + textWidth(lab, lgs) + 9;
      }
    } else {
      const rows = legend.filter(([m]) => m);
      const n = 2;
      out.push(legendBox([['head', 'People, 2021–2025'], ...rows.slice(0, n), ...(color ? [['gap'], [`<circle r="2.6" fill="${C.pencil}"/>`, 'Killed'], [`<circle r="1.3" fill="${C.pencil}"/>`, 'Seriously injured']] : []), ['gap'], ...rows.slice(n)], { x: rx, bottom: Y(ext.south) - k, k, size: lgs }));
    }
  }

  if (isMap) {
    return svg(out.join(''), { label: mapLabel(summary), viewBox: `60 184 ${Math.ceil(colX + 4 - 60)} 1114`, align: 'xMinYMin meet' })
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
    // The largest clusters: a number box, the name and community area, a bar split walking /
    // biking, the people and the killed; a band mark where the cluster is on the High Injury Network.
    const cs = isChart ? 8 * T : 8;
    const row = isChart ? 21 : 15;
    const n = isChart ? CHART_ROWS : PLATE_ROWS;
    const nameW = isChart ? 196 : 150;
    const bar = { x: nameW + 22, w: isChart ? 84 : 60, h: isChart ? 9 : 7 };
    const numW = isChart ? 30 : 24; // killed column, right of the people column
    if (isChart) {
      uy = Math.round(cs + 2);
    } else {
      uy = Math.round(labelTop + 10.5 * T * 0.72);
      title(uy, 'THE LARGEST CLUSTERS');
      const noteLines = wrap(CHART_NOTE, Math.floor(cw / (ns * 0.45)));
      noteLines.forEach((l, i) => note(uy + (i + 1) * nh + 4, l));
      uy += noteLines.length * nh + 24;
    }
    const hs = cs * 0.8;
    out.push(text(mx + cw - numW - 6, uy - row * 0.2, 'PEOPLE', { size: hs, anchor: 'end', spacing: 0.4, fill: C.pencil }));
    out.push(text(mx + cw, uy - row * 0.2, 'KILLED', { size: hs, anchor: 'end', spacing: 0.4, fill: C.pencil }));
    uy += row * 0.8;
    const rows = clusters.slice(0, n);
    const max = Math.max(...rows.map((c) => c.people));
    const bw = (v) => (v / max) * bar.w;
    const walkFill = color ? MARK.walk : C.pencil, bikeFill = color ? MARK.bike : C.fog;
    for (const c of rows) {
      if (hooks) out.push(`<g data-hl="c${c.rank}"><rect x="${mx - 4}" y="${uy - row + 4}" width="${cw + 8}" height="${row}" fill="transparent"/>`);
      const nb = textWidth('10', cs, { weight: 600 }) + 8;
      out.push(`<rect x="${mx}" y="${uy - cs * 0.82 - 3}" width="${nb}" height="${cs + 5}" rx="1.5" fill="${C.fog}"/>`);
      out.push(text(mx + nb / 2, uy, String(c.rank), { size: cs, weight: 600, anchor: 'middle' }));
      // name, then the community area in pencil, cut to the column
      const nm = c.name, ca = ` · ${c.community}`;
      const room = nameW - nb - 6 - textWidth(nm, cs, { weight: 500 });
      let tail = ca;
      while (tail.length > 3 && textWidth(tail, cs) > room) tail = tail.slice(0, -2).trimEnd() + '…';
      out.push(`<text x="${mx + nb + 6}" y="${uy}" font-family="${SANS}" font-size="${cs}"><tspan font-weight="500" fill="${C.ink}">${esc(nm)}</tspan><tspan fill="${C.pencil}">${esc(textWidth(ca, cs) <= room ? ca : tail)}</tspan></text>`);
      // the High Injury Network mark, before the bar
      const by = uy - cs * 0.36 - bar.h / 2;
      if (c.onHin) out.push(`<line x1="${mx + nameW + 6}" x2="${mx + nameW + 14}" y1="${(by + bar.h / 2).toFixed(1)}" y2="${(by + bar.h / 2).toFixed(1)}" stroke="${MARK.tint}" stroke-width="4" stroke-linecap="round"/>`);
      out.push(`<rect x="${mx + bar.x}" y="${by.toFixed(1)}" width="${bw(c.walk).toFixed(1)}" height="${bar.h}" fill="${walkFill}"/>`);
      out.push(`<rect x="${(mx + bar.x + bw(c.walk)).toFixed(1)}" y="${by.toFixed(1)}" width="${bw(c.bike).toFixed(1)}" height="${bar.h}" fill="${bikeFill}"/>`);
      const first = c === rows[0];
      out.push(text(mx + cw - numW - 6, uy, fmt(c.people), { size: cs, anchor: 'end', fill: first ? C.ink : C.pencil, weight: first ? 600 : 400 }));
      out.push(text(mx + cw, uy, c.killed ? fmt(c.killed) : '–', { size: cs, anchor: 'end', fill: C.pencil }));
      if (hooks) out.push('</g>');
      uy += row;
    }
    // all clusters together
    const ry = uy - row + 7;
    out.push(`<line x1="${mx}" x2="${mx + cw}" y1="${ry}" y2="${ry}" stroke="${C.ink}" stroke-width="0.6" stroke-dasharray="2 2"/>`);
    uy = ry + cs + 6;
    out.push(text(mx, uy, `ALL ${summary.clusters} CLUSTERS`, { size: cs * 0.85, spacing: 0.3, fill: C.pencil }));
    out.push(text(mx + cw - numW - 6, uy, fmt(summary.inClusters), { size: cs, anchor: 'end', fill: C.ink }));
    out.push(text(mx + cw, uy, fmt(clusters.reduce((s, c) => s + c.killed, 0)), { size: cs, anchor: 'end', fill: C.ink }));
    uy += row;
    out.push(text(mx, uy, 'EVERYONE', { size: cs * 0.85, spacing: 0.3, fill: C.pencil }));
    out.push(text(mx + cw - numW - 6, uy, fmt(summary.people), { size: cs, anchor: 'end', fill: C.ink, weight: 600 }));
    out.push(text(mx + cw, uy, fmt(summary.killed), { size: cs, anchor: 'end', fill: C.ink, weight: 600 }));
    // key to the bar
    uy += row * 0.9;
    const kx = mx + bar.x;
    out.push(`<rect x="${kx}" y="${uy - cs * 0.75}" width="10" height="${bar.h}" fill="${walkFill}"/>`);
    out.push(text(kx + 14, uy, 'walking', { size: hs, fill: C.pencil }));
    const kx2 = kx + 18 + textWidth('walking', hs) + 8;
    out.push(`<rect x="${kx2}" y="${uy - cs * 0.75}" width="10" height="${bar.h}" fill="${bikeFill}"/>`);
    out.push(text(kx2 + 14, uy, 'biking', { size: hs, fill: C.pencil }));
    const kx3 = kx2 + 18 + textWidth('biking', hs) + 12;
    out.push(`<line x1="${kx3}" x2="${kx3 + 8}" y1="${uy - cs * 0.36}" y2="${uy - cs * 0.36}" stroke="${MARK.tint}" stroke-width="4" stroke-linecap="round"/>`);
    out.push(text(kx3 + 14, uy, 'on the network', { size: hs, fill: C.pencil }));
    if (isChart) {
      return svg(out.join(''), { label: 'The largest clusters of people walking or biking killed or seriously hurt, 2021–2025.', viewBox: `0 0 ${cw + 6} ${Math.ceil(uy + 6)}`, align: 'xMinYMin meet' });
    }
  }

  // Inset: the largest cluster, with a grid line every block (100 address numbers, an eighth of a
  // mile) and the half-mile streets named. The page's inset is drawn tall so the page can crop it.
  const cy = (insetBox.north + insetBox.south) / 2;
  const box = isInset ? { ...insetBox, north: cy + 3600, south: cy - 3600 } : insetBox;
  const lbm = miles(box);
  const iw = isInset ? 390 : W_COL;
  const ki = iw / (lbm.east - lbm.west);
  const ty = uy + 30;
  const c1 = byRank.get(data.inset.cluster);
  if (isPlate) {
    title(ty, `INSET · ${INSET_TITLE}`);
    note(ty + nh + 4, `Shown at ×${(ki / k).toFixed(1)} the scale of the main map; a line every block.`);
    note(ty + 2 * nh + 4, `The largest cluster: ${fmt(c1.people)} people, ${fmt(c1.killed)} killed.`);
  }
  const inset = isInset ? { x: 0, y: 0, w: iw, h: Math.round((lbm.north - lbm.south) * ki) } : { x: mx, y: ty + 2 * nh + 16, w: iw, h: Math.round((lbm.north - lbm.south) * ki) };
  out.push(`<defs><clipPath id="${uid}-inset"><rect x="${inset.x}" y="${inset.y}" width="${inset.w}" height="${inset.h}"/></clipPath></defs>`);
  out.push(`<rect x="${inset.x}" y="${inset.y}" width="${inset.w}" height="${inset.h}" fill="${C.paper}"/>`);
  const IXm = (m) => inset.x + (m - lbm.west) * ki;
  const IYm = (m) => inset.y + (lbm.north - m) * ki;
  const IX = (x) => IXm(toMiles(x, 'x'));
  const IY = (y) => IYm(toMiles(y, 'y'));
  const inView = (p) => p.x >= box.west - 400 && p.x <= box.east + 400 && p.y >= box.south - 400 && p.y <= box.north + 400;
  out.push(`<g clip-path="url(#${uid}-inset)">`);
  if (boundary.length) out.push(`<path d="${city(IX, IY)}" fill="${C.ground}" fill-rule="evenodd"/>`);
  // blocks: every 100 address numbers (an eighth of a mile; the first mile south has 150 per eighth)
  const minor = [];
  for (let x = Math.ceil(box.west / 100) * 100; x <= box.east; x += 100) if (x % 400) minor.push([IX(x), null, 0.4, C.rule]);
  for (let m = Math.ceil(lbm.south * 8) / 8; m <= lbm.north; m += 0.125) if (Math.round(m * 8) % 4) minor.push([null, IYm(m), 0.4, C.rule]);
  const half = [];
  for (let m = Math.ceil(lbm.west * 2) / 2; m <= lbm.east; m += 0.5) half.push(m);
  const halfY = [];
  for (let m = Math.ceil(lbm.south * 2) / 2; m <= lbm.north; m += 0.5) halfY.push(m);
  drawGrid(half, halfY, IXm, IYm, inset.x, inset.x + inset.w, inset.y, inset.y + inset.h, minor);
  drawHin(IX, IY, isInset ? 7 : 6);
  drawClusters(IX, IY, isInset ? [12, 9.5] : [10, 8]);
  drawPeople(IX, IY, inView, isInset ? [1.7, 3.4] : [1.4, 2.8]);
  drawNumbers(IX, IY, 8 * TI, { x0: inset.x, x1: inset.x + inset.w, y0: IY(insetBox.north), y1: IY(insetBox.south) }, isInset ? [1.7, 3.4] : [1.4, 2.8], isInset ? 6 : 5, [data.inset.cluster]);
  // the half-mile streets, named: across the top of the inset box, and down its left side
  const ls = 7 * TI;
  const yTop = IY(insetBox.north) + 4;
  for (const [x, nm] of Object.entries(STREETS_X)) {
    const px = IX(+x);
    if (px < inset.x + 4 || px > inset.x + inset.w - 4) continue;
    out.push(text(px + ls * 0.35, yTop, `${nm.toUpperCase()} ${formatAddress(+x, 'x')}`, { size: ls, rotate: -90, anchor: 'end', fill: C.pencil, halo: C.ground, spacing: 0.3 }));
  }
  for (const [y, nm] of Object.entries(STREETS_Y)) {
    const py = IY(+y);
    if (py < inset.y + 8 || py > inset.y + inset.h - 4) continue;
    out.push(text(IX(insetBox.west) + 4, py - 3, +y === 0 ? 'MADISON' : `${nm.toUpperCase()} ${formatAddress(+y, 'y')}`, { size: ls, fill: C.pencil, halo: C.ground, spacing: 0.3 }));
  }
  out.push('</g>');
  if (isPlate) out.push(`<rect x="${inset.x}" y="${inset.y}" width="${inset.w}" height="${inset.h}" fill="none" stroke="${C.ink}" stroke-width="0.8"/>`);

  if (isInset) {
    return svg(out.join(''), { label: `${INSET_TITLE}: the largest cluster, ${fmt(c1.people)} people killed or seriously hurt walking or biking.`, viewBox: `0 0 ${inset.w} ${inset.h}`, align: 'xMidYMid slice' })
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
  const s = data.sources;
  const ledger = [
    ['SOURCE', `Traffic Crashes – People and Crashes · Chicago Data Portal · ${s.people.id}, ${s.crashes.id} · pulled ${data.asOf}`],
    ['PEOPLE', `Walking or biking, killed or seriously injured (police: fatal or incapacitating), ${data.window.join('–')}; ${fmt(summary.people)} people`],
    ['DEATHS', `CDOT Vision Zero fatality list (${s.visionZero.id}), 30-day rule; ${summary.deathsCodedSerious} of its deaths are still serious injuries in the police data`],
    ['METHOD', `HDBSCAN on positions; ${summary.clusters} of ${summary.clustersFound} clusters hold in resampling (stability ≥ ${data.params.stable}); drawn along the streets that join their people`],
    ['NETWORK', `CDOT High Injury Network, 2025 (34 corridors, annual report p. 13), drawn on OpenStreetMap streets: ${summary.hinMiles.toFixed(1)} mi`],
    ['CAVEAT', 'Counts, not rates: there are no citywide counts of people walking or biking. CPD streets only;'],
    ['', 'expressways excluded. Serious injuries as police recorded them at the scene'],
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

const W_COL = 300; // plate margin column width, as on Plate I
const PLATE_ROWS = 12;
const CHART_ROWS = 12;
export const INSET_TITLE = 'CICERO AVENUE, AUSTIN';
export const CHART_NOTE = 'People walking or biking killed or seriously hurt in each cluster, 2021–2025 · Band: a quarter or more of them on CDOT’s High Injury Network';
// The half-mile streets in the inset, by address
const STREETS_X = { '-6000': 'Austin', '-5600': 'Central', '-5200': 'Laramie', '-4800': 'Cicero', '-4400': 'Kostner', '-4000': 'Pulaski' };
const STREETS_Y = { 1600: 'North', 1200: 'Division', 800: 'Chicago', 400: 'Kinzie', 0: 'Madison', '-600': 'Harrison', '-1200': 'Roosevelt' };

const mapLabel = (summary) =>
  `Plate IV, Where Walking Ends: ${summary.people.toLocaleString('en-US')} people walking or biking killed or seriously hurt in Chicago, 2021–2025, ${summary.killed} of them killed; ${summary.clusters} clusters.`;
