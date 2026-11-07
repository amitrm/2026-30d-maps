// Plate VI · Surface Lines, 1929 · Day 06 Vintage
import { C, SERIF, esc, text, textWidth, legendBox, wrap, frame, svg } from '../lib/plate.js';
import { gridLines, formatAddress, toMiles } from '../lib/grid.js';

// variant 'plate': the full 1080 x 1350 plate (export, download).
// variant 'map': the map alone, with hover hooks, for the day page's left column.
// variant 'chart': the two charts, with hover hooks, for the day page's middle column.
// variant 'inset': Bronzeville to Washington Park, drawn tall so the page can crop it.
// data.segments: every street of the comparison, merged by street name and kind, in address units
// ({ name, kind, path }): kind 'both' = a Chicago Surface Lines (CSL) line on its 1929 system map and a
// CTA bus today, 'old' = a CSL line only, 'new' = a CTA bus only. The CSL network is a wide band, CTA buses a thin
// line over it: where the line runs in the band, the route stayed. In color mode the band takes the
// a gold band and today's line a deep green.
// data.summary: street-miles and shares (notebook section 6); data.rings: miles by 2-mile ring.
export function renderDay06(data, { mode = 'gray', variant = 'plate' } = {}) {
  const { segments, summary, rings, boundary = [] } = data;
  const out = [];
  const isPlate = variant === 'plate';
  const isMap = variant === 'map';
  const isChart = variant === 'chart';
  const isInset = variant === 'inset';
  const hooks = isMap || isChart || isInset; // hover hooks for the day page
  const uid = `d06-${variant}-${mode}`;
  const T = isMap || isChart ? 1.3 : 1.15;
  const TI = isInset ? 1.35 : 1.15;
  const color = mode === 'color';
  const soft = hooks && !color; // on the page, grayscale marks step back from full ink (as Plate I)
  const ink = soft ? '#5A5853' : C.ink;
  const band = color ? BAND_GOLD : C.frame;
  const bus = color ? BUS_GREEN : ink; // today's line: deep green in color mode

  const ring = (r, fx, fy) => 'M' + r.map(([x, y]) => `${fx(x).toFixed(1)},${fy(y).toFixed(1)}`).join('L') + 'Z';
  const city = (fx, fy) => boundary.map((r) => ring(r, fx, fy)).join('');
  const miles = (b) => ({ west: toMiles(b.west, 'x'), east: toMiles(b.east, 'x'), south: toMiles(b.south, 'y'), north: toMiles(b.north, 'y') });
  const inB = (b, pad) => ([x, y]) => x >= b.west - pad && x <= b.east + pad && y >= b.south - pad && y <= b.north + pad;
  const near = (b, pad) => (s) => (s.path ? s.path.some(inB(b, pad)) : inB(b, pad)(s));
  const line = (path, fx, fy) => 'M' + path.map(([x, y]) => `${fx(x).toFixed(1)},${fy(y).toFixed(1)}`).join('L');

  // Streets: bands for the CSL network under lines for today's CTA buses, each kind in its own group so a
  // chart row can light it; on the page a transparent stroke over each street carries its tooltip.
  const drawStreets = (fx, fy, keep, [bw, lw]) => {
    const segs = segments.filter(keep);
    const layer = (kind, stroke, w, dash = '') =>
      `<path${hooks ? ` data-keys="${kind}"` : ''} d="${segs.filter((s) => s.kind === kind).map((s) => line(s.path, fx, fy)).join('')}" fill="none" stroke="${stroke}" stroke-width="${w}"${dash} stroke-linejoin="round" stroke-linecap="round"/>`;
    out.push(layer('old', band, bw), layer('both', band, bw), layer('new', bus, lw), layer('both', bus, lw));
    if (!hooks) return;
    for (const s of segs) {
      const nm = s.name || 'Unnamed street'; // a few short OSM pieces under a bus route have no name
      out.push(`<g data-kind="route" data-tip="${esc(nm)}" data-name="${esc(nm)}" data-lines="" data-detail="${esc(DETAIL[s.kind])}" data-sep="${s.kind === 'new' ? 2 : 5}"${s.kind === 'old' ? ' data-dash="1"' : ''} data-gray="${s.kind === 'new' ? C.ink : C.frame}" data-color="${s.kind === 'new' ? BUS_GREEN : BAND_GOLD}"><path d="${line(s.path, fx, fy)}" fill="none" stroke="transparent" stroke-width="${bw + 4}" stroke-linecap="round"/></g>`);
    }
  };
  const drawGrid = (xs, ys, X, Y, x0, x1, y0, y1, minor = []) => {
    for (const [x, y, w, s] of minor) out.push(`<line x1="${x ?? x0}" x2="${x ?? x1}" y1="${y ?? y0}" y2="${y ?? y1}" stroke="${s}" stroke-width="${w}"/>`);
    for (const x of xs) out.push(`<line x1="${X(x)}" x2="${X(x)}" y1="${y0}" y2="${y1}" stroke="${x === 0 ? C.pencil : C.grid}" stroke-width="${x === 0 ? 0.8 : 0.6}"/>`);
    for (const y of ys) out.push(`<line x1="${x0}" x2="${x1}" y1="${Y(y)}" y2="${Y(y)}" stroke="${y === 0 ? C.pencil : C.grid}" stroke-width="${y === 0 ? 0.8 : 0.6}"/>`);
  };
  // legend marks drawn as the charts draw them: a square-ended band, a line, a line in a band
  const sw = (b, l) => `${b ? `<rect x="-9" y="-2.75" width="18" height="5.5" fill="${band}"/>` : ''}${l ? `<line x1="-9" x2="9" y1="0" y2="0" stroke="${bus}" stroke-width="1.2"/>` : ''}`;

  if (isPlate) out.push(frame({
    plate: 'VI',
    chapter: 'THE GRID',
    day: 6,
    theme: 'Vintage',
    title: 'Surface Lines, 1929',
    subtitle: 'The Chicago Surface Lines’ streetcar network, from its 1929 map, is the band; CTA buses today, the line. In the band, the route stayed.',
  }));

  // ---------- main map: plotted in miles, the extent of Plates II–V ----------
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
  const widths = isMap ? [4.2, 0.95] : [3.4, 0.75]; // band, line

  if (isPlate || isMap) {
    out.push(`<defs><clipPath id="${uid}-map"><rect x="${fx0}" y="${fy0}" width="${fx1 - fx0}" height="${fy1 - fy0}"/></clipPath></defs>`);
    out.push(`<g clip-path="url(#${uid}-map)">`);
    if (boundary.length) out.push(`<path d="${city(X, Y)}" fill="${C.ground}" fill-rule="evenodd"/>`);
    drawGrid(g.xs, g.ys, X, Y, fx0, fx1, fy0, fy1);
    drawStreets(X, Y, () => true, widths);
    out.push('</g>');
    const gridLabel = (v) => (v === 0 ? { fill: C.ink, weight: 600 } : { fill: C.pencil });
    for (const x of g.xs) out.push(text(X(x) + gl * 0.35, labelTop, formatAddress(x, 'x'), { size: gl, spacing: 0.4, rotate: -90, anchor: 'end', ...gridLabel(x) }));
    for (const y of g.ys) out.push(text(colX, Y(y) + gl * 0.35, formatAddress(y, 'y'), { size: gl, spacing: 0.4, anchor: 'end', ...gridLabel(y) }));

    // inset outline on the main map (the page moves it to the cropped extent)
    out.push(`<rect${hooks ? ` data-inset-frame data-y0="${+Y(0).toFixed(2)}"` : ''} x="${X(INSET.west)}" y="${Y(INSET.north)}" width="${X(INSET.east) - X(INSET.west)}" height="${Y(INSET.south) - Y(INSET.north)}" fill="none" stroke="${C.ink}" stroke-width="0.6" stroke-dasharray="2 2"/>`);

    // mile ruler: four grid cells, ticks on the grid lines, in the bottom row of cells
    const rx = X(ext.west + 800), ry = Y(ext.south) - k * 0.35;
    out.push(`<line x1="${rx}" x2="${rx + 4 * k}" y1="${ry}" y2="${ry}" stroke="${C.ink}" stroke-width="1.2"/>`);
    for (let i = 0; i <= 4; i++) out.push(`<line x1="${rx + i * k}" x2="${rx + i * k}" y1="${ry - (i % 4 === 0 ? 6 : 4)}" y2="${ry}" stroke="${C.ink}" stroke-width="1.2"/>`);
    out.push(text(rx, ry - 9, '0', { size: 7.5 * T, anchor: 'middle' }));
    out.push(text(rx + 4 * k, ry - 9, '4 MI', { size: 7.5 * T, anchor: 'middle' }));

    // legend: on the plate one line under the subtitle; on the page in a box over the mile ruler
    const lgs = 9 * T;
    const legend = [
      [sw(true, false), 'CSL line only'], // in the charts' order: band, line in band, line
      [sw(true, true), 'CSL line, CTA bus'],
      [sw(false, true), 'CTA bus only'],
      ...(boundary.length ? [[`<rect x="-9" y="-5" width="18" height="10" fill="${C.ground}"/>`, 'City of Chicago']] : []),
    ];
    if (isPlate) {
      let lx = 60;
      const y = 203;
      for (const [mark, lab] of legend) {
        out.push(`<g transform="translate(${lx + 8} ${y - lgs * 0.35})">${mark}</g>`);
        out.push(text(lx + 20, y, lab, { size: lgs, fill: C.pencil }));
        lx += 20 + textWidth(lab, lgs) + 9;
      }
    } else {
      out.push(legendBox([['head', 'Streets'], ...legend.slice(0, 3), ['gap'], ...legend.slice(3)], { x: rx, bottom: Y(ext.south) - k, k, size: lgs }));
    }
  }

  if (isMap) {
    return svg(out.join(''), { label: mapLabel(summary), viewBox: `60 184 ${Math.ceil(colX + 4 - 60)} 1114`, align: 'xMinYMin meet' })
      .replace('<svg ', `<svg data-top="${labelTop - 184}" data-bottom="${fy1 - 184}" data-ftop="${+(fy0 - 184).toFixed(2)}" data-ppm="${+k.toFixed(3)}" `);
  }

  // ---------- margin column (plate), charts or inset (day page) ----------
  const mx = isPlate ? Math.round(colX + 38) : isChart ? 2 : 0;
  const cw = isChart ? 390 : W_COL;
  const title = (y, str) => out.push(text(mx, y, str, { size: 10.5 * T, weight: 600, spacing: 1 }));
  const ns = isChart ? 12 : 10.5, nh = isChart ? 16.2 : 14; // on the page, as the column notes beside it
  const note = (y, str) => out.push(text(mx, y, str, { size: ns, font: SERIF, italic: true, fill: C.pencil }));
  const notes = (y, str) => {
    const ls = wrap(str, Math.floor(cw / (ns * 0.45)));
    ls.forEach((l, i) => note(y + i * nh, l));
    return y + (ls.length - 1) * nh;
  };
  let uy = 0;

  if (isPlate || isChart) {
    const cs = 9 * T;
    const row = (kind, inner) => (hooks ? `<g data-hl="${kind}">${inner}</g>` : inner);
    // Chart 1 · Then and now
    if (isChart) uy = Math.round(cs * 0.82 + 4);
    else {
      uy = Math.round(labelTop + 10.5 * T * 0.72);
      title(uy, CHART_TITLE.toUpperCase());
      uy = notes(uy + nh + 4, CHART_NOTE) + 26;
    }
    // Each network as a full-width bar drawn like the map legend: the CSL network a band, CTA
    // buses a line, the line in the band where both run; shares of each network's street-miles.
    const bh = isChart ? 12 : 10, lw = isChart ? 2.6 : 2.2;
    const p29 = Math.round(summary.stillServed * 100);
    // a break in paper between kinds of street, cut through band and line alike
    const gapAt = (x, y) => `<line x1="${x.toFixed(1)}" x2="${x.toFixed(1)}" y1="${y - 2}" y2="${y + bh + 2}" stroke="${C.paper}" stroke-width="1.5"/>`;
    const pOn = Math.round(summary.onA1929Line * 100), pFar = Math.round(summary.beyondShare * 100);
    const bar = (label, total, bandTo, lineFrom, lineTo, parts) => {
      out.push(text(mx, uy, label, { size: cs, weight: 600, spacing: 0.6, fill: ink }));
      out.push(text(mx + cw, uy, `${Math.round(total)} mi`, { size: cs, anchor: 'end', fill: C.pencil }));
      const y = uy + 8, cy = y + bh / 2, X = (p) => mx + (cw * p) / 100;
      out.push(`<rect x="${mx}" y="${y}" width="${(X(bandTo) - mx).toFixed(1)}" height="${bh}" fill="${band}"/>`);
      out.push(`<line x1="${X(lineFrom).toFixed(1)}" x2="${X(lineTo).toFixed(1)}" y1="${cy}" y2="${cy}" stroke="${bus}" stroke-width="${lw}"/>`);
      let p0 = 0;
      parts.forEach(([kind, p, cap], i) => {
        const last = i === parts.length - 1 && parts.length > 2;
        const tick = i ? gapAt(X(p0), y) : '';
        const capText = text(last ? X(100) : X(p0) + (i ? 3 : 0), y + bh + cs + 4, cap, { size: cs * 0.92, fill: C.pencil, anchor: last ? 'end' : 'start' });
        out.push(row(kind, `${tick}<rect x="${X(p0).toFixed(1)}" y="${y - 3}" width="${((cw * p) / 100).toFixed(1)}" height="${bh + 6}" fill="transparent"/>${capText}`));
        p0 += p;
      });
      uy += bh + 2 * cs + 24;
    };
    bar('CSL · 1929 MAP', summary.miles1929, 100, 0, p29, [['both', p29, `${p29}% CTA bus today`], ['old', 100 - p29, `${100 - p29}% no CTA bus`]]);
    bar('CTA BUS · TODAY', summary.milesToday, pOn, 0, 100, [['both', pOn, `${pOn}% on a CSL line`], ['new', 100 - pOn - pFar, `${100 - pOn - pFar}% between them`], ['new', pFar, `${pFar}% beyond`]]);

    // Chart 2 · By distance from the Loop: street-miles in each 2-mile ring from State & Madison
    uy += 6;
    title(uy, CHART2_TITLE.toUpperCase());
    uy = notes(uy + nh + 4, CHART2_NOTE) + 22;
    const rr = rings.filter((r) => r.both + r.new > 1);
    const rmax = Math.max(...rr.map((r) => r.both + r.old + r.new));
    const lw0 = textWidth('12–14 MI', cs) + 8, pw = textWidth('100%', cs) + 6;
    const rs = (cw - lw0 - pw - 10) / rmax, gap = isChart ? 22 : 18;
    const top = rr.reduce((a, r) => (r.onA1929Line > a.onA1929Line ? r : a)); // the ring with the most overlap leads in ink
    // each ring as chart 1's marks, left to right: band (CSL only), line in band (both), line (CTA only)
    for (const r of rr) {
      const cy = uy + bh / 2, x0 = mx + lw0, x1 = x0 + r.old * rs, x2 = x1 + r.both * rs, x3 = x2 + r.new * rs;
      out.push(text(x0 - 8, uy + bh - 1.5, `${r.from}–${r.to} MI`, { size: cs, anchor: 'end', fill: C.pencil }));
      out.push(`<rect x="${x0.toFixed(1)}" y="${uy}" width="${(x2 - x0).toFixed(1)}" height="${bh}" fill="${band}"/>`);
      out.push(`<line x1="${x1.toFixed(1)}" x2="${x3.toFixed(1)}" y1="${cy}" y2="${cy}" stroke="${bus}" stroke-width="${lw}"/>`);
      for (const [kind, a, b] of [['old', x0, x1], ['both', x1, x2], ['new', x2, x3]]) {
        if (b > a) out.push(row(kind, `<rect x="${a.toFixed(1)}" y="${uy - 3}" width="${(b - a).toFixed(1)}" height="${bh + 6}" fill="transparent"/>`));
      }
      if (r.old && r.both) out.push(gapAt(x1, uy));
      if (r.both + r.old && r.new) out.push(gapAt(x2, uy));
      out.push(text(mx + cw, uy + bh - 1.5, `${Math.round(r.onA1929Line * 100)}%`, { size: cs, anchor: 'end', fill: r === top ? ink : C.pencil, weight: r === top ? 600 : 400 }));
      uy += gap;
    }
    uy -= gap - bh;
    if (isChart) {
      return svg(out.join(''), { label: `${CHART_TITLE}; ${CHART2_TITLE.toLowerCase()}.`, viewBox: `0 0 ${cw + 6} ${Math.ceil(uy + 6)}`, align: 'xMinYMin meet' });
    }
  }

  // Inset: Bronzeville to Washington Park, a line every half mile. The page's inset is drawn tall so
  // the page can crop it.
  const cy0 = (INSET.north + INSET.south) / 2;
  const box = isInset ? { ...INSET, north: cy0 + 2800, south: cy0 - 2800 } : INSET;
  const lbm = miles(box);
  const iw = isInset ? 390 : W_COL;
  const ki = iw / (lbm.east - lbm.west);
  const ty = uy + 34;
  if (isPlate) {
    title(ty, `INSET · ${INSET_TITLE}`);
    note(ty + nh + 4, `Shown at ×${(ki / k).toFixed(1)} the scale of the main map.`);
    note(ty + 2 * nh + 4, 'King Drive and Garfield Boulevard: a CTA bus, no CSL line.');
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
  const half = [], halfY = [];
  for (let m = Math.ceil(lbm.west * 2) / 2; m <= lbm.east; m += 0.5) half.push(m);
  for (let m = Math.ceil(lbm.south * 2) / 2; m <= lbm.north; m += 0.5) halfY.push(m);
  drawGrid(half, halfY, IXm, IYm, inset.x, inset.x + inset.w, inset.y, inset.y + inset.h);
  const s = ki / k;
  drawStreets(IX, IY, near(box, 400), [widths[0] * Math.min(s, 2.6) * (isInset ? 1.15 : 1), widths[1] * Math.min(s, 2.2)]);
  const lab = (x, y, str, opts = {}) => out.push(text(x, y, str, { size: 7 * TI, fill: C.ink, weight: 600, halo: C.ground, ...opts }));
  // north-south names hang from the top edge on the plate; on the page, from 47th St, which every crop shows
  // labels sit on the street as drawn: the median position of its points in the box (the grid's nominal
  // numbers drift from the streets here by up to ~300 address units)
  const at = (name, i) => {
    const v = segments.filter((sg) => sg.name === name).flatMap((sg) => sg.path).filter(near(INSET, 0)).map((p) => p[i]).sort((a, b) => a - b);
    return v[v.length >> 1];
  };
  for (const [nm, street] of INSET_NS) lab(IX(at(street, 0)) + 3, isInset ? IY(at('47th St', 1)) + 8 : inset.y + 5, nm, { rotate: -90, anchor: 'end' });
  for (const [nm, street] of INSET_EW) lab(inset.x + 4, IY(at(street, 1)) - 3, nm);
  out.push('</g>');
  if (isPlate) out.push(`<rect x="${inset.x}" y="${inset.y}" width="${inset.w}" height="${inset.h}" fill="none" stroke="${C.ink}" stroke-width="0.8"/>`);

  if (isInset) {
    return svg(out.join(''), { label: `${INSET_TITLE}: Chicago Surface Lines (1929 map) and today’s CTA bus routes.`, viewBox: `0 0 ${inset.w} ${inset.h}`, align: 'xMidYMid slice' })
      .replace('<svg ', `<svg data-ppm="${+ki.toFixed(3)}" data-north="${+lbm.north.toFixed(3)}" `);
  }

  // plate: Findings close the column
  let fy = inset.y + inset.h + 36;
  title(fy, 'FINDINGS');
  for (const l of wrap(data.finding, Math.floor(W_COL / (ns * 0.45)))) note((fy += nh) + 4, l);
  fy += 10;
  const bs = 9.5, bhh = 12.6;
  for (const para of data.findings ?? []) {
    for (const l of wrap(para, Math.floor(W_COL / (bs * 0.48)))) out.push(text(mx, (fy += bhh), l, { size: bs, font: SERIF }));
    fy += 5;
  }

  // data ledger, under the map
  const lx = fx0;
  let dy = Math.round(fy1) + 34;
  out.push(text(lx, dy, 'DATA LEDGER', { size: 10.5 * T, weight: 600, spacing: 1 }));
  const ledger = [
    ['CSL', 'Chicago Surface Lines, the city’s streetcar company, 1914–1947; taken over by the CTA, 1 October 1947'],
    ['MAP', 'System of Chicago Surface Lines, the CSL’s system map of 1929; scan, University of Minnesota Borchert Map Library'],
    ['FIT', 'Georeferenced on its own margin street numbers, then OSM arterials snapped to its red lines'],
    ['TODAY', `CTA bus routes, GTFS ${data.gtfs.feedDate} (as Plate II), matched to OpenStreetMap streets, ${data.osmDate}`],
    ['MILES', 'Street-miles inside today’s city; both roadways of a divided street count once'],
    ['CHECK', `By eye, 80 random streets: ${data.qaRight}; shares likely ${RANGE(summary.range.stillServed)} and ${RANGE(summary.range.onA1929Line)}`],
    ['LIMITS', 'City of Chicago, Boundaries – City · qqq8-j68g; the O’Hare area is off the 1929 map'],
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
const RANGE = ([a, b]) => `${(a * 100).toFixed(0)}–${(b * 100).toFixed(0)}%`;
const BAND_GOLD = '#D5B66D'; // the CSL network's band in color mode
const BUS_GREEN = '#1D5B45'; // CTA buses' line in color mode
const DETAIL = {
  both: 'A CSL line on the 1929 map; a CTA bus today',
  old: 'A CSL line on the 1929 map; no CTA bus today',
  new: 'A CTA bus today; no CSL line on the 1929 map',
};
// Bronzeville to Washington Park on whole half miles: 1200 W to 2000 E, 3200 S to 6400 S
const INSET = { west: -1200, east: 2000, south: -6400, north: -3200 };
const INSET_NS = [['STATE', 'State St'], ['KING DR', 'King Dr'], ['COTTAGE GROVE', 'Cottage Grove Ave']];
const INSET_EW = [['PERSHING', 'Pershing Rd'], ['47TH', '47th St'], ['GARFIELD BLVD', 'Garfield Blvd']];
export const INSET_TITLE = 'BRONZEVILLE TO WASHINGTON PARK';
export const CHART_TITLE = 'Street-miles, CSL and CTA';
export const CHART_NOTE = 'Share of each network’s street-miles inside today’s city; the CSL as on its 1929 map · Between: within half a mile of a CSL line · Beyond: farther';
export const CHART2_TITLE = 'By distance from State & Madison';
export const CHART2_NOTE = 'Street-miles in each 2-mile ring: CSL line only, CSL line and CTA bus, CTA bus only · % of CTA bus miles on a CSL line';

const mapLabel = (summary) =>
  `Plate VI, Surface Lines, 1929: ${Math.round(summary.stillServed * 100)}% of the street-miles of the Chicago Surface Lines network on its 1929 map still carry a CTA bus; ${Math.round(summary.onA1929Line * 100)}% of today’s CTA bus street-miles run on a CSL line.`;
