// Plate XIV · The Tattered Map · Day 14 Borgesian map
import { C, SERIF, esc, text, textWidth, legendBox, wrap, frame, svg } from '../lib/plate.js';
import { gridLines, formatAddress, toMiles } from '../lib/grid.js';

// variant 'plate': the full 1080 x 1350 plate (export, download).
// variant 'map': the city, with hover hooks on its community areas (share of street length mapped).
// variant 'chart': the Cicero mile as a vertical strip, Madison at the bottom and Chicago at the top,
//   every label at its address number; it fills the page's middle column (the page has no inset).
// Borges' map of the Empire, the size of the Empire, survives in tatters. Project Sidewalk's volunteers
// walk Chicago's streets in street-level imagery and label what a wheelchair user meets: curb ramps,
// obstacles, broken surfaces, missing ramps. Each street a volunteer has walked is a thin ink line on the
// city (data.lines); the city not yet mapped is bare ground.
// Labels: ring = curb ramp, dot = obstacle, diamond = surface problem, × = missing curb ramp, bar = no
// sidewalk. Confirmed in validation: full; not yet checked: faint; rejected: not drawn.
export const TYPES = {
  CurbRamp: { name: 'curb ramp', plural: 'curb ramps', color: '#4E8A2E' },
  Obstacle: { name: 'obstacle', plural: 'obstacles', color: '#2F5D9E' },
  SurfaceProblem: { name: 'surface problem', plural: 'surface problems', color: '#C8691C' },
  NoCurbRamp: { name: 'missing curb ramp', plural: 'missing curb ramps', short: 'missing ramps', color: '#B8336A' },
  NoSidewalk: { name: 'no sidewalk', plural: 'no sidewalk', color: '#7A5AA6' },
};

// Community areas shaded by the share of their street length mapped: a subtle step, darker = more mapped,
// so the ink street lines stay on top. No outlines.
export const SHARE_BREAKS = [0.1, 0.25, 0.5, 0.75];
// color: the five lightest steps of CARTO's Mint (#e4f1e1 … #0d585f), so the ink streets stay legible
const SHADES = { gray: ['#EBE9E4', '#E0DED8', '#D4D2CB', '#C7C5BE', '#B9B7B0'], color: ['#e4f1e1', '#b4d9cc', '#89c0b6', '#63a6a0', '#448c8a'] };
const SHARE_LABELS = ['Under 10%', '10–25%', '25–50%', '50–75%', '75% or more'];
const shareClass = (v) => SHARE_BREAKS.filter((b) => v >= b).length;

export function renderDay14(data, { mode = 'gray', variant = 'plate' } = {}) {
  const { summary: s, boundary = [], lines, areas, mile } = data;
  const out = [];
  const isPlate = variant === 'plate';
  const isMap = variant === 'map';
  const isChart = variant === 'chart';
  const hooks = isMap || isChart;
  const uid = `d14-${variant}-${mode}`;
  const T = isMap || isChart ? 1.3 : 1.15;
  const color = mode === 'color';

  // ---------- drawing helpers ----------
  const ring = (r, fx, fy) => 'M' + r.map(([x, y]) => `${fx(x).toFixed(1)},${fy(y).toFixed(1)}`).join('L') + 'Z';
  const line = (r, fx, fy) => 'M' + r.map(([x, y]) => `${fx(x).toFixed(1)},${fy(y).toFixed(1)}`).join('L');
  const miles = (b) => ({ west: toMiles(b.west, 'x'), east: toMiles(b.east, 'x'), south: toMiles(b.south, 'y'), north: toMiles(b.north, 'y') });
  const tint = (t) => (color ? TYPES[t].color : t === 'CurbRamp' ? C.pencil : C.ink);
  const glyph = (t, x, y, k = 1, faint = false) => {
    const c = tint(t), o = faint ? ' opacity="0.4"' : '';
    const X = x.toFixed(1), Y = y.toFixed(1);
    if (t === 'CurbRamp') return `<circle cx="${X}" cy="${Y}" r="${(1.9 * k).toFixed(2)}" fill="none" stroke="${c}" stroke-width="${(0.75 * k).toFixed(2)}"${o}/>`;
    if (t === 'Obstacle') return `<circle cx="${X}" cy="${Y}" r="${(1.7 * k).toFixed(2)}" fill="${c}"${o}/>`;
    if (t === 'NoCurbRamp') { const d = 2 * k; return `<path d="M${x - d},${y - d}L${x + d},${y + d}M${x - d},${y + d}L${x + d},${y - d}" stroke="${c}" stroke-width="${(1.1 * k).toFixed(2)}"${o}/>`; }
    if (t === 'SurfaceProblem') { const d = 2.2 * k; return `<path d="M${x},${y - d}L${x + d},${y}L${x},${y + d}L${x - d},${y}Z" fill="${C.paper}" stroke="${c}" stroke-width="${(0.85 * k).toFixed(2)}"${o}/>`; }
    if (t === 'NoSidewalk') return `<rect x="${(x - 2.3 * k).toFixed(1)}" y="${(y - 0.8 * k).toFixed(1)}" width="${(4.6 * k).toFixed(1)}" height="${(1.6 * k).toFixed(1)}" fill="${c}"${o}/>`;
    return '';
  };
  // a label with its hover target and tooltip (chart)
  const labelMark = (l, x, y, k) => {
    const m = glyph(l.t, x, y, k, l.ok == null);
    if (!hooks) return m;
    const name = TYPES[l.t].name.replace(/^./, (c) => c.toUpperCase());
    const card = {
      name, mark: { type: l.t, fill: tint(l.t) }, aside: `${Math.round(l.n)} N · ${l.side === 'W' ? 'west' : 'east'} side`,
      ...(l.sev ? { sev: [l.sev, 3] } : {}), chips: l.tags,
      foot: [l.ok ? '✓ Confirmed' : '○ Not yet checked', monthShort(l.d)],
    };
    return `<g data-kind="card" data-tip="${esc(name)}" data-name="${esc(name)}" data-card="${attr(JSON.stringify(card))}"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(3.2 * k).toFixed(1)}" fill="transparent"/>${m}</g>`;
  };
  // a community area's card: the share mapped as a bar filled in the map's own class shades
  const areaCard = (a) => {
    const shades = SHADES[mode] ?? SHADES.gray;
    const edges = [0, ...SHARE_BREAKS, 1];
    return {
      name: a.name, big: [pct(a.share), 'of its street length mapped'],
      bar: { frac: a.share, segs: shades.map((c, i) => [edges[i], edges[i + 1], c]), left: `${fmt(a.mappedKm)} of ${fmt(a.km)} km walked`, right: '100%' },
      sec: 'Confirmed labels',
      counts: [['CurbRamp', a.ramps, 'ramps'], ['Obstacle', a.obstacles, 'obstacles'], ['SurfaceProblem', a.surfaces, 'surfaces'], ['NoCurbRamp', a.noRamp, 'no ramp']]
        .map(([t, n, label]) => ({ type: t, fill: tint(t), n: fmt(n), label })),
    };
  };
  const drawGrid = (xs, ys, X, Y, x0, x1, y0, y1) => {
    for (const x of xs) out.push(`<line x1="${X(x)}" x2="${X(x)}" y1="${y0}" y2="${y1}" stroke="${x === 0 ? C.pencil : C.grid}" stroke-width="${x === 0 ? 0.8 : 0.6}"/>`);
    for (const y of ys) out.push(`<line x1="${x0}" x2="${x1}" y1="${Y(y)}" y2="${Y(y)}" stroke="${y === 0 ? C.pencil : C.grid}" stroke-width="${y === 0 ? 0.8 : 0.6}"/>`);
  };

  if (isPlate) out.push(frame({
    plate: 'XIV',
    chapter: 'THE GAPS',
    day: 14,
    theme: 'Borgesian map',
    title: 'The Tattered Map',
    subtitle: 'The sidewalk map a wheelchair user needs, drawn street by street by volunteers: a fifth of the city so far.',
  }));

  // ---------- main map: the extent of Plates II–XIII ----------
  const ext = { west: -11200, east: 4800, south: -14000, north: 10400 };
  const mi = miles(ext);
  const field = isMap ? { x: 60, y: 250, w: 760, h: 1040 } : { x: 60, y: 262, w: 575, h: 830 };
  const k = Math.min(field.w / (mi.east - mi.west), field.h / (mi.north - mi.south));
  const X = (x) => field.x + (toMiles(x, 'x') - mi.west) * k;
  const Y = (y) => field.y + (mi.north - toMiles(y, 'y')) * k;
  const fx0 = X(ext.west), fx1 = X(ext.east), fy0 = Y(ext.north), fy1 = Y(ext.south);
  const g = gridLines(ext);
  const gl = 8 * T;
  const labelLen = 7 * (gl * 0.6 + 0.4);
  const colX = fx1 + 6 + labelLen;
  const labelTop = fy0 - 6 - labelLen;
  const streetW = isMap ? 0.45 : 0.38;

  if (isPlate || isMap) {
    out.push(`<defs><clipPath id="${uid}-map"><rect x="${fx0}" y="${fy0}" width="${fx1 - fx0}" height="${fy1 - fy0}"/></clipPath></defs>`);
    out.push(`<g clip-path="url(#${uid}-map)">`);
    if (boundary.length) out.push(`<path d="${boundary.map((r) => ring(r, X, Y)).join('')}" fill="${C.ground}" fill-rule="evenodd"/>`);
    const shades = SHADES[mode] ?? SHADES.gray;
    for (let c = 0; c < shades.length; c++) {
      const d = areas.filter((a) => shareClass(a.share) === c).map((a) => a.rings.map((r) => ring(r, X, Y)).join('')).join('');
      if (d) out.push(`<path d="${d}" fill="${shades[c]}" fill-rule="evenodd" stroke="${shades[c]}" stroke-width="0.6" stroke-linejoin="round"/>`);
    }
    drawGrid(g.xs, g.ys, X, Y, fx0, fx1, fy0, fy1);
    out.push(`<path d="${lines.map((l) => line(l, X, Y)).join('')}" fill="none" stroke="${C.ink}" stroke-width="${streetW}" stroke-linecap="round" stroke-linejoin="round"/>`);
    if (isMap) {
      out.push(`<style>.${uid}-a path{fill:${C.ink};fill-opacity:0;transition:fill-opacity .12s}.${uid}-a:hover path{fill-opacity:.14}</style>`);
      for (const a of areas) {
        out.push(`<g class="${uid}-a" data-kind="card" data-tip="${esc(a.name)}" data-name="${esc(a.name)}" data-card="${attr(JSON.stringify(areaCard(a)))}"><path d="${a.rings.map((r) => ring(r, X, Y)).join('')}" fill-rule="evenodd"/></g>`);
      }
    }
    out.push('</g>');
    const gridLabel = (v) => (v === 0 ? { fill: C.ink, weight: 600 } : { fill: C.pencil });
    for (const x of g.xs) out.push(text(X(x) + gl * 0.35, labelTop, formatAddress(x, 'x'), { size: gl, spacing: 0.4, rotate: -90, anchor: 'end', ...gridLabel(x) }));
    for (const y of g.ys) out.push(text(colX, Y(y) + gl * 0.35, formatAddress(y, 'y'), { size: gl, spacing: 0.4, anchor: 'end', ...gridLabel(y) }));

    // the Cicero mile (chart): a paper-cased ink bar with end ticks
    const [m0, m1] = mile.ends;
    const seg = `M${X(m0[0]).toFixed(1)},${Y(m0[1]).toFixed(1)}L${X(m1[0]).toFixed(1)},${Y(m1[1]).toFixed(1)}`;
    out.push(`<path d="${seg}" stroke="${C.paper}" stroke-width="${isMap ? 6 : 5}"/><path d="${seg}" stroke="${C.ink}" stroke-width="${isMap ? 2.4 : 2}"/>`);
    for (const [x, y] of [m0, m1]) out.push(`<line x1="${(X(x) - 4.5).toFixed(1)}" x2="${(X(x) + 4.5).toFixed(1)}" y1="${Y(y).toFixed(1)}" y2="${Y(y).toFixed(1)}" stroke="${C.ink}" stroke-width="1.2"/>`);
    out.push(text(X(m1[0]), Y(m1[1]) - 7, 'CICERO AVE', { size: 7.5 * T, weight: 600, spacing: 0.6, anchor: 'middle', halo: C.paper }));

    // mile ruler
    const rx = X(ext.west + 800), ry = Y(ext.south) - k * 0.35;
    out.push(`<line x1="${rx}" x2="${rx + 4 * k}" y1="${ry}" y2="${ry}" stroke="${C.ink}" stroke-width="1.2"/>`);
    for (let i = 0; i <= 4; i++) out.push(`<line x1="${rx + i * k}" x2="${rx + i * k}" y1="${ry - (i % 4 === 0 ? 6 : 4)}" y2="${ry}" stroke="${C.ink}" stroke-width="1.2"/>`);
    out.push(text(rx, ry - 9, '0', { size: 7.5 * T, anchor: 'middle' }));
    out.push(text(rx + 4 * k, ry - 9, '4 MI', { size: 7.5 * T, anchor: 'middle' }));

    // legend
    const lgs = 9 * T;
    const mesh = `<rect x="-9" y="-6" width="18" height="12" fill="${C.ground}"/><path d="M-9,-2.5H9M-9,2.5H9M-4.5,-6V6M0.5,-6V6M5.5,-6V6" stroke="${C.ink}" stroke-width="0.5"/>`;
    const sq = (c) => `<rect x="-9" y="-6" width="18" height="12" fill="${c}"/>`;
    const mileSw = `<line x1="-9" x2="9" y1="0" y2="0" stroke="${C.ink}" stroke-width="2.2"/>`;
    if (isPlate) {
      const items = [
        ['head', 'Project Sidewalk, Chicago'],
        [mesh, 'street walked by a volunteer'],
        ['head', 'Share mapped'],
        ...shades.map((c, i) => [sq(c), ['<10%', '10–25', '25–50', '50–75', '75%+'][i]]),
        [mileSw, 'Cicero mile (right)'],
      ];
      let lx2 = 60;
      const y = 203;
      for (const [m, lab] of items) {
        if (m === 'head') {
          out.push(text(lx2, y, `${lab}:`, { size: lgs, fill: C.pencil }));
          lx2 += textWidth(`${lab}:`, lgs) + 8;
          continue;
        }
        out.push(`<g transform="translate(${lx2 + 9} ${y - lgs * 0.35})">${m}</g>`);
        out.push(text(lx2 + 22, y, lab, { size: lgs, fill: C.pencil }));
        lx2 += 22 + textWidth(lab, lgs) + 8;
      }
    } else {
      const items = [
        ['head', 'Project Sidewalk, Chicago'],
        [mesh, 'Street a volunteer has walked in street-level imagery'],
        ['gap'],
        ['head', 'Community area: share of street length mapped'],
        ...shades.map((c, i) => [sq(c), SHARE_LABELS[i]]).reverse(),
        ['gap'],
        [mileSw, 'The Cicero mile (chart)'],
      ];
      out.push(legendBox(items, { x: rx, bottom: Y(ext.south) - k, k, size: lgs }));
    }
  }

  if (isMap) {
    return svg(out.join(''), { label: mapLabel(s), viewBox: `60 184 ${Math.ceil(colX + 4 - 60)} 1114`, align: 'xMinYMin meet' })
      .replace('<svg ', `<svg data-top="${labelTop - 184}" data-bottom="${fy1 - 184}" data-ftop="${+(fy0 - 184).toFixed(2)}" data-ppm="${+k.toFixed(3)}" `);
  }

  // ---------- the Cicero mile: a vertical strip, Madison (0) at the bottom, Chicago (800 N) at the top ----------
  // Two sidewalk bands either side of the roadway, west on the left, as wide as the column allows so
  // labels at the same number sit side by side; cross streets as rules, named on the left; address ticks on
  // the right (every 8 numbers, longer every 40, numbered every 100). Under it, the confirmed labels by side.
  const cols = ['CurbRamp', 'Obstacle', 'SurfaceProblem', 'NoCurbRamp'];
  const cnt = (t, sd) => s.mile.counts[t]?.[sd] ?? 0;
  const tableH = (cs) => cs * 1.75 * 3 + cs * 2.6;
  const strip = (x0, top, w, h, z) => {
    const { cs, nameW, gk } = z;
    const nameR = x0 + nameW;
    const tickW = cs * 4.6; // ticks and their numbers
    const xL = nameR + 8, xR = x0 + w - tickW - 6; // the street, curb to curb across both sidewalks
    const rd = (xR - xL) * 0.09; // half the roadway
    const sw = (xR - xL) / 2 - rd; // a sidewalk band
    const xc = (xL + xR) / 2;
    const xW = xL + sw / 2, xE = xR - sw / 2;
    const ny = (n) => top + h - (n / 800) * h;
    for (const xb of [xW, xE]) out.push(`<rect x="${(xb - sw / 2).toFixed(1)}" y="${top}" width="${sw.toFixed(1)}" height="${h}" fill="${C.rule}"/>`);
    out.push(`<line x1="${xc}" x2="${xc}" y1="${top}" y2="${top + h}" stroke="${C.fog}" stroke-width="0.6" stroke-dasharray="3 3"/>`);
    // every named crossing (OpenStreetMap): the mile's ends in ink, arterials in pencil, minor streets lighter
    for (const c of mile.cross) {
      const y = ny(c.n), end = c.n === 0 || c.n === 800;
      const rule = end ? [C.ink, 0.9] : c.major ? [C.fog, 3] : [C.fog, 1.3];
      out.push(`<line x1="${(xL - 3).toFixed(1)}" x2="${(xR + 3).toFixed(1)}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${rule[0]}" stroke-width="${rule[1]}"/>`);
      const name = c.name === 'Lake' ? ['LAKE', 'GREEN LINE'] : [c.name.toUpperCase()];
      const look = end ? { size: cs * 0.9, weight: 600, fill: C.ink } : c.major ? { size: cs * 0.9, weight: 500, fill: C.ink } : { size: cs * 0.78, weight: 400, fill: C.pencil };
      name.forEach((nm, i) => out.push(text(nameR, y + cs * 0.33 + i * cs * 1.0, nm, { ...look, ...(i ? { size: cs * 0.72, weight: 400, fill: C.pencil } : {}), spacing: 0.4, anchor: 'end' })));
    }
    const xt = xR + 5;
    out.push(`<line x1="${xt}" x2="${xt}" y1="${top}" y2="${top + h}" stroke="${C.pencil}" stroke-width="0.45"/>`);
    // address ticks: every 8 numbers, longer every 40; the blocks (every 100) in ink, across the curb too
    for (let n = 0; n <= 800; n += 8) {
      const block = n % 100 === 0;
      const len = block ? 7 : n % 40 === 0 ? 4 : 2;
      out.push(`<line x1="${xt}" x2="${xt + len}" y1="${ny(n).toFixed(1)}" y2="${ny(n).toFixed(1)}" stroke="${block ? C.ink : C.pencil}" stroke-width="${block ? 1 : 0.45}"/>`);
      if (block) out.push(`<line x1="${xt - 7}" x2="${xt}" y1="${ny(n).toFixed(1)}" y2="${ny(n).toFixed(1)}" stroke="${C.ink}" stroke-width="1"/>`);
    }
    for (let n = 0; n <= 800; n += 100) out.push(text(xt + 10, ny(n) + cs * 0.33, n === 0 ? '0' : `${n} N`, { size: cs * 0.9, weight: 500, fill: C.ink }));
    out.push(text(xW, top - 6, 'WEST SIDEWALK', { size: cs * 0.8, weight: 600, spacing: 0.4, fill: C.pencil, anchor: 'middle' }));
    out.push(text(xE, top - 6, 'EAST SIDEWALK', { size: cs * 0.8, weight: 600, spacing: 0.4, fill: C.pencil, anchor: 'middle' }));
    // labels: each takes the slot nearest its band's centre that is free at its height
    const step = 4.6 * gk;
    const half = Math.floor((sw / 2 - 3 * gk) / step);
    const slots = [0];
    for (let i = 1; i <= half; i++) slots.push(-i * step, i * step);
    for (const sd of ['W', 'E']) {
      const placed = [];
      const xb = sd === 'W' ? xW : xE;
      for (const l of mile.labels.filter((d) => cols.includes(d.t) && d.side === sd)) { // the four types in the table
        const y = ny(l.n);
        const slot = slots.find((o) => !placed.some(([py, po]) => po === o && Math.abs(py - y) < step)) ?? slots[0];
        placed.push([y, slot]);
        out.push(labelMark(l, xb + slot, y, gk));
      }
    }
    // the table: confirmed labels by side
    let ty = top + h + cs * 2.6;
    const c0 = x0, cx = (i) => x0 + nameW + 8 + (i + 0.5) * ((w - nameW - 8) / cols.length);
    out.push(text(c0, ty, 'CONFIRMED', { size: cs * 0.85, weight: 600, spacing: 0.5, fill: C.ink }));
    cols.forEach((t, i) => {
      const lab = TYPES[t].short ?? TYPES[t].plural;
      const lw = textWidth(lab, cs * 0.85) + 8;
      out.push(glyph(t, cx(i) - lw / 2 + 2, ty - cs * 0.3, gk));
      out.push(text(cx(i) - lw / 2 + 8, ty, lab, { size: cs * 0.85, fill: C.pencil }));
    });
    for (const sd of ['W', 'E']) {
      ty += cs * 1.75;
      out.push(`<line x1="${c0}" x2="${x0 + w}" y1="${(ty - cs * 1.2).toFixed(1)}" y2="${(ty - cs * 1.2).toFixed(1)}" stroke="${C.rule}" stroke-width="0.6"/>`);
      out.push(text(c0, ty, sd === 'W' ? 'West sidewalk' : 'East sidewalk', { size: cs * 0.95, fill: C.ink }));
      cols.forEach((t, i) => out.push(text(cx(i), ty, fmt(cnt(t, sd)), { size: cs * 0.95, weight: 500, fill: C.ink, anchor: 'middle' })));
    }
    ty += cs * 1.75;
    out.push(text(c0, ty, `Faint: not yet checked by another user. Rejected labels are left out.${hooks ? ' Hover a mark for its label.' : ''}`, { size: cs * 0.9, font: SERIF, italic: true, fill: C.pencil }));
    return ty;
  };

  if (isChart) {
    const cw = 390, ch = 760, cs = 8 * T;
    strip(0, 14, cw, ch - 14 - tableH(cs) - 4, { cs, nameW: 70, gk: 1.15 });
    return svg(out.join(''), { label: `${CHART_TITLE}: one mile of Cicero Avenue, ${fmt(s.mile.confirmed)} confirmed labels, ${cnt('Obstacle', 'W')} obstacles on the west sidewalk and ${cnt('Obstacle', 'E')} on the east.`, viewBox: `0 0 ${cw} ${ch}`, align: 'xMidYMin meet' });
  }

  // ---------- plate: margin column with the strip, then Findings ----------
  const mx = Math.round(colX + 38);
  const ns = 10.5, nh = 14;
  const title = (y, str) => out.push(text(mx, y, str, { size: 10.5 * T, weight: 600, spacing: 1 }));
  const note = (y, str) => out.push(text(mx, y, str, { size: ns, font: SERIF, italic: true, fill: C.pencil }));
  let uy = Math.round(labelTop + 10.5 * T * 0.72);
  title(uy, CHART_TITLE.toUpperCase());
  const noteLines = wrap(CHART_NOTE, Math.floor(W_COL / (ns * 0.45)));
  noteLines.forEach((l, i) => note(uy + (i + 1) * nh + 4, l));
  uy += noteLines.length * nh + 30;
  const findingsH = 236;
  const stripH = Math.round(fy1 - findingsH - uy - 16);
  strip(mx, uy, W_COL, stripH - tableH(7.5), { cs: 7.5, nameW: 54, gk: 0.95 });

  let fy = Math.round(fy1 - findingsH + 30);
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
    ['LABELS', `Project Sidewalk Chicago (UW Makeability Lab), pulled ${data.asOf}: ${fmt(s.labels)} labels in the city; ${fmt(s.rejected)} rejected in validation, left out`],
    ['MAPPED', 'A street once a volunteer has completed a virtual walk of it in street-level imagery'],
    ['MILE', 'Cicero Ave, Madison to Chicago, between the CTA bus stops at each end, scaled to 800 numbers; cross streets: © OpenStreetMap'],
    ['LIMITS', 'City of Chicago, Boundaries – City · qqq8-j68g; Community Areas · igwz-8jzy'],
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
export const CHART_TITLE = 'One mile, every number';
export const CHART_NOTE = 'Cicero Avenue from Madison (bottom) to Chicago (top): 800 address numbers, every label at its number.';

const fmt = (n) => Math.round(n).toLocaleString('en-US');
const pct = (v) => `${Math.round(v * 100)}%`;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const monthShort = (d) => (d && d.length >= 7 ? `${MONTHS[Number(d.slice(5, 7)) - 1].slice(0, 3)} ${d.slice(0, 4)}` : '');
const attr = (s) => esc(s).replace(/"/g, '&quot;');

const mapLabel = (s) =>
  `Plate XIV, The Tattered Map: volunteers have mapped the sidewalks along ${pct(s.share)} of Chicago’s streets (${fmt(s.mappedKm)} of ${fmt(s.openKm)} km) since ${s.firstYear}.`;
