// Plate XI · What You Hear While You Wait · Day 11 Senses: Sound
import { C, LINES, SERIF, esc, text, textWidth, legendBox, wrap, frame, svg } from '../lib/plate.js';
import { gridLines, formatAddress, toMiles } from '../lib/grid.js';

// variant 'plate': the full 1080 x 1350 plate (export, download).
// variant 'map': the map alone, with hover hooks, for the day page's left column.
// variant 'chart': every city station line by line, with hover hooks.
// variant 'inset': the inset alone, drawn tall so the page can crop it.
// Modelled transport noise (BTS National Transportation Noise Map, 2022: road, rail and aviation,
// a 24-hour average, LAeq) drawn as a speaker grille: one dot per city block (data.lattice, ⅛ mile),
// its area growing with the decibels above 45, the median within 90 m of the block. Stations carry
// sound rings, one for every 5 dB above 50 at their loudest platform; the centre is filled where the
// station is accessible. Diamonds are the Chicago Department of Aviation's Midway monitors, which
// measure what the model estimates. The grille stays gray in color mode; stations and the track
// take their line's color.
export const W_COL = 300;
export const CHART_TITLE = 'Every station, line by line';
export const CHART_NOTE = 'Stations inside the city in route order, a gap at each branch · Bar = the loudest platform, decibels above 45 · Dashed = 65 dB · Yellow: Howard, on the Red';
export const INSET_TITLE = 'The Dan Ryan and the Green Line';
export const LOUD = 65;
export const rings = (db) => Math.max(0, Math.floor((db - 50) / 5));

export function renderDay11(data, { mode = 'gray', variant = 'plate' } = {}) {
  const { stations, summary, lattice, monitors, sequences = {}, boundary = [] } = data;
  const out = [];
  const isPlate = variant === 'plate';
  const isMap = variant === 'map';
  const isChart = variant === 'chart';
  const isInset = variant === 'inset';
  const hooks = isMap || isChart || isInset;
  const uid = `d11-${variant}-${mode}`;
  const T = isMap || isChart ? 1.3 : 1.15;
  const TI = isInset ? 1.35 : 1.15;
  const color = mode === 'color';
  const soft = hooks && !color;
  const markInk = soft ? '#5A5853' : C.ink;
  const tint = (lines) => (color && lines.length === 1 ? LINES[lines[0]] : color ? C.ink : markInk);
  const keys = (s) => `${s.lines.join(' ')} ${s.id}`;
  const byId = new Map(stations.map((s) => [s.id, s]));

  // ---------- marks and hover hooks ----------
  // the station: centre dot (accessible) or ring (not), and a sound ring per 5 dB above 50, each
  // knocked out of the grille with a paper halo so it reads over the dots
  const mark = (s, x, y, r, gap) => {
    const cx = x.toFixed(1), cy = y.toFixed(1), ink = tint(s.lines);
    const o = [];
    for (let k = rings(s.db); k >= 1; k--) {
      const rr = (r + gap * k).toFixed(2);
      o.push(`<circle cx="${cx}" cy="${cy}" r="${rr}" fill="none" stroke="${C.paper}" stroke-width="${(gap * 0.75).toFixed(2)}"/>`);
      o.push(`<circle cx="${cx}" cy="${cy}" r="${rr}" fill="none" stroke="${ink}" stroke-width="${(gap * 0.32).toFixed(2)}"/>`);
    }
    o.push(`<circle cx="${cx}" cy="${cy}" r="${(r + gap * 0.4).toFixed(2)}" fill="${C.paper}"/>`);
    o.push(s.ada
      ? `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${ink}"/>`
      : `<circle cx="${cx}" cy="${cy}" r="${(r * 0.85).toFixed(2)}" fill="${C.paper}" stroke="${ink}" stroke-width="${(r * 0.4).toFixed(2)}"/>`);
    return o.join('');
  };
  const station = (s, x, y, r, gap) => {
    const m = mark(s, x, y, r, gap);
    if (!hooks) return m;
    const hit = `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(r + 4).toFixed(1)}" fill="transparent"/>`;
    return `<g data-id="${s.id}" data-tip="${esc(s.short)}" data-name="${esc(s.short)}" data-lines="${s.lines.join(' ')}" data-ada="${s.ada ? 1 : 0}" data-shape="rings" data-n="${rings(s.db)}" data-keys="${keys(s)}" data-detail="${esc(detail(s))}">${hit}${m}</g>`;
  };
  const tag = (s, cls, str) => (hooks ? str.replace('<text ', `<text class="${cls}" data-id="${s.id}" data-keys="${keys(s)}" `) : str);
  const diamond = (x, y, a, sw) => `<rect x="${(x - a).toFixed(1)}" y="${(y - a).toFixed(1)}" width="${(2 * a).toFixed(1)}" height="${(2 * a).toFixed(1)}" fill="${C.paper}" stroke="${C.ink}" stroke-width="${sw}" transform="rotate(45 ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
  const monitor = (m, x, y, a) => {
    const d = diamond(x, y, a, Math.max(0.7, a * 0.3).toFixed(2));
    if (!hooks) return d;
    const rows = [m.address.replace(' 1/2', ''), m.measured != null ? `Measured: ${m.measured.toFixed(1)} dB, aircraft only, day-night average (DNL), 12 months to December 2025` : 'Measured: no data in 2025', `Model: ${m.modelled.toFixed(1)} dB, aircraft only, 24-hour average`];
    return `<g data-id="m${m.id}" data-tip="Monitor ${m.id}" data-name="Midway noise monitor ${m.id}" data-lines="" data-shape="none" data-detail="${esc(rows.join('|'))}"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(a + 4).toFixed(1)}" fill="transparent"/>${d}</g>`;
  };

  const ring = (r, fx, fy) => 'M' + r.map(([x, y]) => `${fx(x).toFixed(1)},${fy(y).toFixed(1)}`).join('L') + 'Z';
  const line = (p, fx, fy) => 'M' + p.map(([x, y]) => `${fx(x).toFixed(1)},${fy(y).toFixed(1)}`).join('L');
  const city = (fx, fy) => boundary.map((r) => ring(r, fx, fy)).join('');
  const miles = (b) => ({ west: toMiles(b.west, 'x'), east: toMiles(b.east, 'x'), south: toMiles(b.south, 'y'), north: toMiles(b.north, 'y') });

  // the grille: dots grouped by radius (to 0.05 px) into one path each, drawn as round-capped strokes
  const grille = (pts, fx, fy, rmax) => {
    const groups = new Map();
    for (const [x, y, db] of pts) {
      const r = Math.round(rmax * Math.sqrt(Math.min(1, Math.max(0, (db - 45) / 35))) * 20) / 20;
      if (r < 0.2) continue;
      if (!groups.has(r)) groups.set(r, []);
      groups.get(r).push(`M${fx(x).toFixed(1)} ${fy(y).toFixed(1)}h0.01`);
    }
    for (const [r, d] of [...groups].sort((a, b) => a[0] - b[0])) {
      out.push(`<path d="${d.join('')}" stroke="${C.ink}" stroke-width="${(2 * r).toFixed(2)}" stroke-linecap="round" fill="none"/>`);
    }
  };
  // the 'L' track: a paper channel through the grille with the line drawn in it
  const drawTrack = (fx, fy, w) => {
    const paths = (data.rail ?? []).map(({ line: l, path }) => [l, line(path, fx, fy)]);
    out.push(`<path d="${paths.map((p) => p[1]).join('')}" fill="none" stroke="${C.paper}" stroke-width="${w * 3}" stroke-linejoin="round" stroke-linecap="round"/>`);
    for (const [l, d] of paths) {
      out.push(`<path${hooks ? ` data-keys="${l}"` : ''} d="${d}" fill="none" stroke="${color ? LINES[l] : C.pencil}" stroke-opacity="${color ? 0.7 : 0.8}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`);
    }
  };
  const drawGrid = (xs, ys, X, Y, x0, x1, y0, y1) => {
    for (const x of xs) out.push(`<line x1="${X(x)}" x2="${X(x)}" y1="${y0}" y2="${y1}" stroke="${x === 0 ? C.pencil : C.grid}" stroke-width="${x === 0 ? 0.8 : 0.6}"/>`);
    for (const y of ys) out.push(`<line x1="${x0}" x2="${x1}" y1="${Y(y)}" y2="${Y(y)}" stroke="${y === 0 ? C.pencil : C.grid}" stroke-width="${y === 0 ? 0.8 : 0.6}"/>`);
  };
  // quietest first, so the loudest rings draw on top
  const drawStations = (list, fx, fy, r, gap) => {
    for (const s of [...list].sort((a, b) => a.db - b.db)) out.push(station(s, fx(s.x), fy(s.y), r, gap));
  };
  const label = (s) => `${s.short} ${Math.round(s.db)}`;

  if (isPlate) out.push(frame({
    plate: 'XI',
    chapter: 'THE SYSTEMS',
    day: 11,
    theme: 'Senses: Sound',
    title: 'What You Hear While You Wait',
    subtitle: 'Roads, rails and runways, as a day’s average sound. A dot per block, a ring per 5 dB at each ‘L’ station.',
  }));

  // the inset: the Dan Ryan and the Green Line (data.inset, address units)
  const insetBox = { west: data.inset.west, east: data.inset.east, south: data.inset.south, north: data.inset.north };
  const inBox = (b) => (s) => s.x >= b.west && s.x <= b.east && s.y >= b.south && s.y <= b.north;
  const inInset = inBox(insetBox);

  // ---------- main map: the extent of Plates II–X ----------
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
  const rMain = 0.47 * (k / 8); // the largest dot: just short of touching its neighbours
  const rSt = isMap ? 2.4 : 2;
  const gapSt = isMap ? 1.9 : 1.6;

  if (isPlate || isMap) {
    out.push(`<defs><clipPath id="${uid}-map"><rect x="${fx0}" y="${fy0}" width="${fx1 - fx0}" height="${fy1 - fy0}"/></clipPath></defs>`);
    out.push(`<g clip-path="url(#${uid}-map)">`);
    if (boundary.length) out.push(`<path d="${city(X, Y)}" fill="${C.ground}" fill-rule="evenodd"/>`);
    drawGrid(g.xs, g.ys, X, Y, fx0, fx1, fy0, fy1);
    grille(lattice, X, Y, rMain);
    drawTrack(X, Y, isMap ? 0.75 : 0.6);
    out.push('</g>');
    const gridLabel = (v) => (v === 0 ? { fill: C.ink, weight: 600 } : { fill: C.pencil });
    for (const x of g.xs) out.push(text(X(x) + gl * 0.35, labelTop, formatAddress(x, 'x'), { size: gl, spacing: 0.4, rotate: -90, anchor: 'end', ...gridLabel(x) }));
    for (const y of g.ys) out.push(text(colX, Y(y) + gl * 0.35, formatAddress(y, 'y'), { size: gl, spacing: 0.4, anchor: 'end', ...gridLabel(y) }));

    out.push(`<rect${hooks ? ` data-inset-frame data-y0="${+Y(0).toFixed(2)}"` : ''} x="${X(insetBox.west)}" y="${Y(insetBox.north)}" width="${X(insetBox.east) - X(insetBox.west)}" height="${Y(insetBox.south) - Y(insetBox.north)}" fill="none" stroke="${C.ink}" stroke-width="0.6" stroke-dasharray="2 2"/>`);

    for (const m of monitors) out.push(monitor(m, X(m.x), Y(m.y), isMap ? 3 : 2.5));
    const inExt = (s) => s.x >= ext.west && s.x <= ext.east && s.y >= ext.south && s.y <= ext.north;
    drawStations(stations.filter(inExt), X, Y, rSt, gapSt);

    // names, with their decibels, of the stations at 70 dB or more outside the inset (it names its own)
    const ls = 7.5 * T;
    const loudest = stations.filter((d) => d.db >= 70 && inExt(d) && !inInset(d));
    out.push(...placeLabels(loudest, X, Y, rSt + gapSt * rings(77), ls, { x0: fx0, x1: fx1, text: label }).map(([s, t]) => tag(s, 'perm-label', t)));

    // mile ruler
    const rx = X(ext.west + 800), ry = Y(ext.south) - k * 0.35;
    out.push(`<line x1="${rx}" x2="${rx + 4 * k}" y1="${ry}" y2="${ry}" stroke="${C.ink}" stroke-width="1.2"/>`);
    for (let i = 0; i <= 4; i++) out.push(`<line x1="${rx + i * k}" x2="${rx + i * k}" y1="${ry - (i % 4 === 0 ? 6 : 4)}" y2="${ry}" stroke="${C.ink}" stroke-width="1.2"/>`);
    out.push(text(rx, ry - 9, '0', { size: 7.5 * T, anchor: 'middle' }));
    out.push(text(rx + 4 * k, ry - 9, '4 MI', { size: 7.5 * T, anchor: 'middle' }));

    // legend
    const lgs = 9 * T;
    const dot = (db, rm = 4.2) => { const r = rm * Math.sqrt((db - 45) / 35); return `<circle r="${r.toFixed(2)}" fill="${C.ink}"/>`; };
    const dots = (list, rm) => list.map((db, i) => `<g transform="translate(${(i - (list.length - 1) / 2) * 9} 0)">${dot(db, rm)}</g>`).join('');
    const st = (ada, n) => mark({ ada, db: 50 + 5 * n, lines: [] }, 0, 0, 2.2, 1.7);
    const items = [
      ['head', 'Transport noise, 24-hour average'],
      [dot(50), '50 dB'],
      [dot(60), '60 dB'],
      [dot(70), '70 dB'],
      [dot(80), '80 dB'],
      ['gap'],
      [st(true, 0), 'Accessible station'],
      [st(false, 0), 'Not accessible'],
      [st(true, 3), 'A ring for every 5 dB above 50'],
      [diamond(0, 0, 3, 0.8), 'Midway noise monitor'],
    ];
    if (isPlate) {
      const short = [
        ['head', 'Noise, 24-hour average'],
        [dots([50, 60, 70], 3.6), '50 · 60 · 70 dB'],
        [st(true, 0), 'accessible'],
        [st(false, 0), 'not'],
        [st(true, 2), 'a ring per 5 dB above 50'],
        [diamond(0, 0, 2.6, 0.8), 'Midway monitor'],
      ];
      let lx = 60;
      const y = 203;
      for (const [m, lab] of short) {
        if (m === 'head') {
          out.push(text(lx, y, `${lab}:`, { size: lgs, fill: C.pencil }));
          lx += textWidth(`${lab}:`, lgs) + 6;
          continue;
        }
        const mw = m.startsWith('<g') ? 26 : 12;
        out.push(`<g transform="translate(${lx + mw / 2} ${y - lgs * 0.35})">${m}</g>`);
        out.push(text(lx + mw + 5, y, lab, { size: lgs, fill: C.pencil }));
        lx += mw + 5 + textWidth(lab, lgs) + 10;
      }
    } else {
      out.push(legendBox(items, { x: rx, bottom: Y(ext.south) - k, k, size: lgs }));
    }
  }

  if (isMap) {
    return svg(out.join(''), { label: mapLabel(summary), viewBox: `60 184 ${Math.ceil(colX + 4 - 60)} 1114`, align: 'xMinYMin meet' })
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
    // one row per line: its name, then a bar per city station in route order (a gap at each branch),
    // mirrored like a waveform, as tall as the decibels above 45; dashed guides at 65 dB
    const cs = isChart ? 8 * T : 8;
    const row = isChart ? 40 : 30;
    const hs = isChart ? 0.48 : 0.36; // px per dB, each side
    const box = { w: isChart ? 64 : 52, h: isChart ? 14 : 12 };
    const bx0 = mx + box.w + 10, bx1 = mx + cw - (isChart ? 40 : 32);
    if (isChart) uy = 4;
    else {
      uy = Math.round(labelTop + 10.5 * T * 0.72);
      title(uy, CHART_TITLE.toUpperCase());
      const noteLines = wrap(CHART_NOTE, Math.floor(cw / (ns * 0.45)));
      noteLines.forEach((l, i) => note(uy + (i + 1) * nh + 4, l));
      uy += noteLines.length * nh + 12;
    }
    const lines = Object.keys(summary.lines).filter((l) => l !== 'Yellow')
      .sort((a, b) => summary.lines[b].loud - summary.lines[a].loud || summary.lines[b].median - summary.lines[a].median);
    if (hooks) out.push(`<style>.${uid}-row .bg{transition:fill .12s}.${uid}-row:hover .bg,svg.hl .${uid}-row.on .bg{fill:${C.rule}}</style>`);
    for (const l of lines) {
      const segs = (sequences[l] ?? []).map((seg) => seg.filter((id) => byId.has(id))).filter((seg) => seg.length);
      const seen = new Set();
      const items = [];
      segs.forEach((seg, i) => {
        if (i) items.push(null);
        for (const id of seg) if (!seen.has(id)) { seen.add(id); items.push(byId.get(id)); }
      });
      const step = Math.min(isChart ? 9 : 7, (bx1 - bx0) / items.length);
      const cy = uy + row / 2;
      if (hooks) out.push(`<g class="${uid}-row" data-hl="${l}"><rect class="bg" x="${mx - 4}" y="${uy}" width="${cw + 8}" height="${row}" fill="transparent"/>`);
      out.push(`<rect x="${mx}" y="${(cy - box.h / 2).toFixed(1)}" width="${box.w}" height="${box.h}" fill="${color ? LINES[l] : C.fog}"/>`);
      out.push(text(mx + box.w / 2, cy + cs * 0.36, l.toUpperCase(), { size: cs * 0.9, anchor: 'middle', weight: 600, spacing: 0.5, fill: color ? '#FFFFFF' : C.ink }));
      const guide = (LOUD - 45) * hs;
      const gx1 = bx0 + items.length * step;
      out.push(`<line x1="${bx0}" x2="${gx1.toFixed(1)}" y1="${cy}" y2="${cy}" stroke="${C.rule}" stroke-width="0.6"/>`);
      for (const sgn of [-1, 1]) out.push(`<line x1="${bx0}" x2="${gx1.toFixed(1)}" y1="${(cy + sgn * guide).toFixed(1)}" y2="${(cy + sgn * guide).toFixed(1)}" stroke="${C.frame}" stroke-width="0.6" stroke-dasharray="2 2"/>`);
      items.forEach((s, j) => {
        if (!s) return;
        const h = Math.max(0.6, (s.db - 45) * hs);
        const x = bx0 + j * step + step * 0.2;
        const loud = s.db >= LOUD;
        const fill = color ? (s.lines.length > 1 ? C.ink : LINES[l]) : loud ? C.ink : C.pencil;
        const op = color && !loud ? 0.4 : 1;
        const bar = `<rect x="${x.toFixed(1)}" y="${(cy - h).toFixed(1)}" width="${(step * 0.6).toFixed(2)}" height="${(2 * h).toFixed(1)}" fill="${fill}"${op < 1 ? ` opacity="${op}"` : ''}/>`;
        if (!hooks) { out.push(bar); return; }
        out.push(`<g data-id="${s.id}" data-tip="${esc(s.short)}" data-name="${esc(s.short)}" data-lines="${s.lines.join(' ')}" data-ada="${s.ada ? 1 : 0}" data-shape="rings" data-n="${rings(s.db)}" data-keys="${keys(s)}" data-detail="${esc(detail(s))}"><rect x="${(bx0 + j * step).toFixed(1)}" y="${uy}" width="${step.toFixed(2)}" height="${row}" fill="transparent"/>${bar}</g>`);
      });
      const sl = summary.lines[l];
      out.push(text(mx + cw, cy + cs * 0.36, `${sl.loud}/${sl.stations}`, { size: cs, anchor: 'end', fill: sl.loud ? C.ink : C.pencil }));
      if (hooks) out.push('</g>');
      uy += row;
    }
    uy += 4;
    out.push(`<line x1="${mx}" x2="${mx + cw}" y1="${uy}" y2="${uy}" stroke="${C.ink}" stroke-width="0.6" stroke-dasharray="2 2"/>`);
    uy += cs + 8;
    out.push(text(mx, uy, `STATIONS AT ${LOUD} DB OR MORE`, { size: cs * 0.85, spacing: 0.3, fill: C.pencil }));
    out.push(text(mx + cw, uy, `${summary.stationsLoud} of ${summary.stations}`, { size: cs, anchor: 'end', fill: C.ink, weight: 600 }));
    uy += cs + 8;
    out.push(text(mx, uy, 'OF THEM ACCESSIBLE', { size: cs * 0.85, spacing: 0.3, fill: C.pencil }));
    out.push(text(mx + cw, uy, `${summary.stationsLoudAccessible}`, { size: cs, anchor: 'end', fill: C.ink, weight: 600 }));
    if (isChart) {
      return svg(out.join(''), { label: `${CHART_TITLE}: ${summary.stationsLoud} of ${summary.stations} city stations at ${LOUD} dB or more; the Blue Line has ${summary.lines.Blue.loud}, the Red ${summary.lines.Red.loud}.`, viewBox: `0 0 ${cw + 6} ${Math.ceil(uy + 6)}`, align: 'xMinYMin meet' });
    }
  }

  // ---------- inset ----------
  const cyI = (insetBox.north + insetBox.south) / 2;
  const box = isInset ? { ...insetBox, north: cyI + 3400, south: cyI - 3400 } : insetBox;
  const lbm = miles(box);
  const iw = isInset ? 390 : W_COL;
  const ki = iw / (lbm.east - lbm.west);
  const ty = uy + 30;
  if (isPlate) {
    title(ty, `INSET · ${INSET_TITLE.toUpperCase()}`);
    note(ty + nh + 4, `Shown at ×${(ki / k).toFixed(1)} the scale of the main map; two dots per block.`);
  }
  const inset = isInset ? { x: 0, y: 0, w: iw, h: Math.round((lbm.north - lbm.south) * ki) } : { x: mx, y: ty + nh + 16, w: iw, h: Math.round((lbm.north - lbm.south) * ki) };
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
  grille(data.inset.lattice, IX, IY, 0.47 * (ki / 16));
  drawTrack(IX, IY, isInset ? 1.2 : 1);
  const inBoxMi = (b) => (s) => { const x = toMiles(s.x, 'x'), y = toMiles(s.y, 'y'); return x >= b.west - 0.2 && x <= b.east + 0.2 && y >= b.south - 0.2 && y <= b.north + 0.2; };
  const ri = isInset ? 3.4 : 2.8, gi = isInset ? 2.6 : 2.2;
  const here = stations.filter(inBoxMi(lbm));
  drawStations(here, IX, IY, ri, gi);
  out.push(...placeLabels(here, IX, IY, ri + gi * 3, 7.5 * TI, { x0: inset.x, x1: inset.x + inset.w, text: label }).map(([s, t]) => tag(s, 'perm-label', t)));
  if (lbm.west < 0 && lbm.east > 0) out.push(text(IXm(0) + 3, inset.y + inset.h - 5, 'STATE', { size: 7 * TI, fill: C.ink, weight: 600, halo: C.paper }));
  out.push('</g>');
  if (isPlate) out.push(`<rect x="${inset.x}" y="${inset.y}" width="${inset.w}" height="${inset.h}" fill="none" stroke="${C.ink}" stroke-width="0.8"/>`);

  if (isInset) {
    return svg(out.join(''), { label: `${INSET_TITLE}: the Red Line stations in the Dan Ryan Expressway's median and the Green Line to the east, with the noise around them.`, viewBox: `0 0 ${inset.w} ${inset.h}`, align: 'xMidYMid slice' })
      .replace('<svg ', `<svg data-ppm="${+ki.toFixed(3)}" data-north="${+lbm.north.toFixed(3)}" `);
  }

  // plate: Findings close the column
  let fy = inset.y + inset.h + 34;
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
    ['NOISE', 'Bureau of Transportation Statistics, National Transportation Noise Map, 2022 release: road (2023), rail and aviation (2022)'],
    ['', `A model, 24-hour average (LAeq) on 30 m cells, modes summed; each point the median within ${data.thresholds.radiusM} m, each dot its block’s average`],
    ['CHECK', `Midway monitors, CDA, 12 months to Dec 2025: the model reads ${Math.abs(summary.monitorDiffRange[0])} dB below to ${summary.monitorDiffRange[1]} dB above the measured DNL`],
    ['STATIONS', `CTA GTFS platforms, feed of ${data.gtfsDate}; each station its loudest platform; accessible as on Plate VIII`],
    ['PEOPLE', `2020 Census blocks, ${fmt(summary.residents)} residents, read at each block’s internal point`],
    ['LIMITS', 'City of Chicago, Boundaries – City · qqq8-j68g; no shielding by buildings; the tunnels are not modelled'],
  ];
  dy += 18;
  for (const [kk, v] of ledger) {
    out.push(text(lx, dy, kk, { size: 8.5, fill: C.pencil, spacing: 0.6 }));
    out.push(text(lx + 64, dy, v, { size: 9.5, font: SERIF }));
    dy += 13.5;
  }

  return svg(out.join(''), { label: mapLabel(summary) });
}

const fmt = (n) => Math.round(n).toLocaleString('en-US');

const SOURCE_WORDS = { road: 'road traffic', rail: 'trains', aviation: 'aircraft' };
export function detail(s) {
  return [
    `${Math.round(s.db)} dB on an average day (24-hour average, loudest platform)`,
    s.source === 'none' ? 'Every source under 45 dB' : `Loudest source: ${SOURCE_WORDS[s.source]}`,
    s.ada ? 'Accessible' : 'Not accessible',
  ].join('|');
}

// Names next to their marks: each tries right-up, right-down, left-up, left-down and takes the first
// spot that overlaps no mark and no name already placed, inside x0..x1 (as Plate VII).
function placeLabels(list, fx, fy, r, size, { x0, x1, avoid = [], text: str = (s) => s.short }) {
  const boxes = [...avoid, ...list.map((s) => { const x = fx(s.x), y = fy(s.y); return [x - r, y - r, x + r, y + r]; })];
  const hit = (a, b) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
  const placed = [], labels = new Map();
  for (const s of [...list].sort((a, b) => fy(a.y) - fy(b.y))) {
    const x = fx(s.x), y = fy(s.y), t = str(s), w = textWidth(t, size, { weight: 500 });
    const spots = [[r * 0.9, -r * 0.4, 'start'], [r * 0.9, r * 0.4 + size * 0.75, 'start'], [-r * 0.9, -r * 0.4, 'end'], [-r * 0.9, r * 0.4 + size * 0.75, 'end'],
      [0, -r - 2, 'middle'], [0, r + size * 0.75 + 2, 'middle']];
    const box = ([dx, dy, a]) => (a === 'start' ? [x + dx, y + dy - size * 0.75, x + dx + w, y + dy + 1]
      : a === 'end' ? [x + dx - w, y + dy - size * 0.75, x + dx, y + dy + 1] : [x - w / 2, y + dy - size * 0.75, x + w / 2, y + dy + 1]);
    const own = (b) => boxes.filter((o) => !(o[0] === x - r && o[1] === y - r));
    const free = (b) => b[0] >= x0 + 2 && b[2] <= x1 - 2 && !placed.some((p) => hit(p, b)) && !own(b).some((o) => hit(o, b));
    const spot = spots.find((sp) => free(box(sp))) ?? spots[0];
    placed.push(box(spot));
    labels.set(s.id, text(x + spot[0], y + spot[1], t, { size, fill: C.ink, weight: 500, anchor: spot[2], halo: C.paper }));
  }
  return list.map((s) => [s, labels.get(s.id)]);
}

const mapLabel = (summary) =>
  `Plate XI, What You Hear While You Wait: modelled transport noise across Chicago, one dot per block; ${summary.stationsLoud} of ${summary.stations} city ‘L’ stations average ${LOUD} dB or more over a day.`;
