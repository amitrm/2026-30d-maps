// Plate VIII · Chicago, 2038 · Day 08 Utopia
import { C, LINES, SERIF, esc, text, textWidth, legendBox, wrap, frame, svg } from '../lib/plate.js';
import { gridLines, formatAddress, toMiles } from '../lib/grid.js';

// variant 'plate': the full 1080 x 1350 plate (export, download).
// variant 'map': the map alone, with hover hooks, for the day page's left column.
// variant 'chart': the residents each step adds, one row per step, with hover hooks.
// variant 'inset': the inset alone, drawn tall so the page can crop it.
// The city CTA promises for 2038 (every station accessible, the Red Line at 130th), drawn as an
// island map. Land is the step-free half-mile walk to an accessible station once the promise is kept
// (data.polygons, address units), laid down in three strata: today (solid), funded with a date
// (stipple), promised with no date or no money (hatched; Plate III's hatch). A coastline closes the
// land: the one outline in the series, because here the edge of the walkshed is the subject. The
// rest of the city is sea, with a waterline for every eighth of a mile farther to walk (data.water),
// ink every half mile. Stations: dot = accessible today; ring with a dot = due, with its year;
// dashed ring = no date. The strata stay gray in color mode; stations take their line's color.
export const AREA = { today: '#BDBBB4' };
export const STEP_KEYS = ['P1', 'P2f', 'RLE', 'P2u', 'P3', 'P4', 'RPM'];

export function renderDay08(data, { mode = 'gray', variant = 'plate' } = {}) {
  const { stations, steps, summary, polygons, water, boundary = [] } = data;
  const out = [];
  const isPlate = variant === 'plate';
  const isMap = variant === 'map';
  const isChart = variant === 'chart';
  const isInset = variant === 'inset';
  const hooks = isMap || isChart || isInset;
  const uid = `d08-${variant}-${mode}`;
  const T = isMap || isChart ? 1.3 : 1.15;
  const TI = isInset ? 1.35 : 1.15;
  const color = mode === 'color';
  const soft = hooks && !color;
  const markInk = soft ? '#5A5853' : C.ink;
  const tint = (lines) => (color && lines.length === 1 ? LINES[lines[0]] : color ? C.ink : markInk);
  const keys = (s) => `${s.lines.join(' ')} ${s.phase} ${s.id}`;

  // ---------- marks and hover hooks ----------
  const mark = (s, x, y, r, fill) => {
    const cx = x.toFixed(1), cy = y.toFixed(1);
    if (s.phase === 'today') return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`;
    const w = Math.max(1, r * 0.34).toFixed(2);
    if (s.year) return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.paper}" stroke="${fill}" stroke-width="${w}"/><circle cx="${cx}" cy="${cy}" r="${(r * 0.38).toFixed(2)}" fill="${fill}"/>`;
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.paper}" stroke="${fill}" stroke-width="${w}" stroke-dasharray="${(r * 0.62).toFixed(2)} ${(r * 0.5).toFixed(2)}"/>`;
  };
  const shape = (s) => (s.phase === 'today' ? '' : s.year ? ' data-shape="due"' : ' data-shape="nodate"');
  const station = (s, x, y, r) => {
    const m = mark(s, x, y, r, tint(s.lines));
    if (!hooks) return m;
    const hit = `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(r + 5).toFixed(1)}" fill="transparent"/>`;
    return `<g data-id="${s.id}" data-tip="${esc(s.short)}" data-name="${esc(s.short)}" data-lines="${s.lines.join(' ')}" data-ada="${s.phase === 'today' ? 1 : 0}"${shape(s)} data-keys="${keys(s)}" data-detail="${esc(detail(s))}">${hit}${m}</g>`;
  };
  const tag = (s, cls, str) => (hooks ? str.replace('<text ', `<text class="${cls}" data-id="${s.id}" data-keys="${keys(s)}" `) : str);

  const ring = (r, fx, fy) => 'M' + r.map(([x, y]) => `${fx(x).toFixed(1)},${fy(y).toFixed(1)}`).join('L') + 'Z';
  const line = (p, fx, fy) => 'M' + p.map(([x, y]) => `${fx(x).toFixed(1)},${fy(y).toFixed(1)}`).join('L');
  const city = (fx, fy) => boundary.map((r) => ring(r, fx, fy)).join('');
  const area = (polys, fx, fy) => polys.map((p) => p.map((r) => ring(r, fx, fy)).join('')).join('');
  const miles = (b) => ({ west: toMiles(b.west, 'x'), east: toMiles(b.east, 'x'), south: toMiles(b.south, 'y'), north: toMiles(b.north, 'y') });

  // patterns, in screen px: hatch (Plate III) and stipple
  const patterns = (s) =>
    `<defs><pattern id="${uid}-h${s}" width="${3.2 * s}" height="${3.2 * s}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="${3.2 * s}" stroke="${C.ink}" stroke-width="${0.6 * s}"/></pattern>` +
    `<pattern id="${uid}-d${s}" width="${2.8 * s}" height="${2.8 * s}" patternUnits="userSpaceOnUse"><circle cx="${1.4 * s}" cy="${1.4 * s}" r="${0.5 * s}" fill="${C.ink}"/></pattern></defs>`;

  // the sea: the city as paper, its limit a dotted shoal line, and the waterlines clipped to it;
  // the land: the three strata over a ground fill, closed by the coastline
  const drawSea = (fx, fy, s) => {
    const levels = Object.keys(water).sort((a, b) => a - b);
    const thin = [], strong = [];
    for (const lv of levels) {
      const half = Math.abs(lv * 2 - Math.round(lv * 2)) < 1e-6;
      (half ? strong : thin).push(water[lv].map((p) => line(p, fx, fy)).join(''));
    }
    out.push(`<path d="${thin.join('')}" fill="none" stroke="${C.pencil}" stroke-width="${0.3 * s}" stroke-linejoin="round"/>`);
    out.push(`<path d="${strong.join('')}" fill="none" stroke="${C.ink}" stroke-width="${0.42 * s}" stroke-linejoin="round" stroke-opacity="0.75"/>`);
    if (boundary.length) out.push(`<path d="${city(fx, fy)}" fill="none" stroke="${C.frame}" stroke-width="${0.6 * s}" stroke-dasharray="${1.5 * s} ${1.5 * s}"/>`);
  };
  const drawLand = (fx, fy, s) => {
    out.push(patterns(s));
    out.push(`<path d="${area(polygons.full, fx, fy)}" fill="${C.ground}" fill-rule="evenodd"/>`);
    out.push(`<path d="${area(polygons.full, fx, fy)}" fill="url(#${uid}-h${s})" fill-rule="evenodd"/>`);
    out.push(`<path d="${area(polygons.dated, fx, fy)}" fill="${C.ground}" fill-rule="evenodd"/>`);
    out.push(`<path d="${area(polygons.dated, fx, fy)}" fill="url(#${uid}-d${s})" fill-rule="evenodd"/>`);
    out.push(`<path d="${area(polygons.today, fx, fy)}" fill="${AREA.today}" fill-rule="evenodd"/>`);
    out.push(`<path d="${area(polygons.full, fx, fy)}" fill="none" stroke="${C.ink}" stroke-width="${0.55 * s}" stroke-linejoin="round"/>`);
  };
  // the 'L' track under the stations (GTFS, as Plate VII), and the Red Line Extension, dashed
  const drawTrack = (fx, fy, w) => {
    for (const { line: l, path } of data.rail ?? []) {
      out.push(`<path${hooks ? ` data-keys="${l}"` : ''} d="${line(path, fx, fy)}" fill="none" stroke="${color ? LINES[l] : C.pencil}" stroke-opacity="${color ? 0.5 : 0.55}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`);
    }
    const rc = color ? LINES.Red : C.ink;
    out.push(`<path${hooks ? ' data-keys="Red RLE"' : ''} d="${data.rle.map((p) => line(p, fx, fy)).join('')}" fill="none" stroke="${rc}" stroke-width="${w * 1.3}" stroke-dasharray="${w * 3.5} ${w * 2.2}"/>`);
  };
  const drawGrid = (xs, ys, X, Y, x0, x1, y0, y1) => {
    for (const x of xs) out.push(`<line x1="${X(x)}" x2="${X(x)}" y1="${y0}" y2="${y1}" stroke="${x === 0 ? C.pencil : C.grid}" stroke-width="${x === 0 ? 0.8 : 0.6}"/>`);
    for (const y of ys) out.push(`<line x1="${x0}" x2="${x1}" y1="${Y(y)}" y2="${Y(y)}" stroke="${y === 0 ? C.pencil : C.grid}" stroke-width="${y === 0 ? 0.8 : 0.6}"/>`);
  };
  // accessible stations first, then the ones still to do, so a ring is never covered
  const drawStations = (list, fx, fy, r) => {
    for (const s of list.filter((d) => d.phase === 'today')) out.push(station(s, fx(s.x), fy(s.y), r));
    for (const s of list.filter((d) => d.phase !== 'today')) out.push(station(s, fx(s.x), fy(s.y), r * 1.1));
  };
  const due = (s) => s.phase !== 'today' && s.year; // a year on a station still to do (the data also dates the two done since 2024)
  const label = (s) => (due(s) ? `${s.short} ’${String(s.year).slice(2)}` : s.short);

  if (isPlate) out.push(frame({
    plate: 'VIII',
    chapter: 'THE SYSTEMS',
    day: 8,
    theme: 'Utopia',
    title: 'Chicago, 2038',
    subtitle: 'The city CTA promises: every ‘L’ station accessible. Land is a step-free half-mile walk to one; the rest is sea.',
  }));

  // the inset: the largest piece of the no-date stratum (data.inset.box), widened to half-miles
  const ib = data.inset.box;
  const snap = (v, f) => f(v / 400) * 400;
  const insetBox = { west: snap(ib.west - 400, Math.floor), east: snap(ib.east + 400, Math.ceil), south: snap(ib.south - 400, Math.floor), north: snap(ib.north + 400, Math.ceil) };
  const inBox = (b) => (s) => s.x >= b.west && s.x <= b.east && s.y >= b.south && s.y <= b.north;
  const inInset = inBox(insetBox);

  // ---------- main map: the extent of Plates II–VII ----------
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
  const rMap = 3;
  const sMap = isMap ? 1.3 : 1;

  if (isPlate || isMap) {
    out.push(`<defs><clipPath id="${uid}-map"><rect x="${fx0}" y="${fy0}" width="${fx1 - fx0}" height="${fy1 - fy0}"/></clipPath></defs>`);
    out.push(`<g clip-path="url(#${uid}-map)">`);
    drawGrid(g.xs, g.ys, X, Y, fx0, fx1, fy0, fy1);
    drawSea(X, Y, sMap);
    drawLand(X, Y, sMap);
    drawTrack(X, Y, isMap ? 1.1 : 0.9);
    out.push('</g>');
    const gridLabel = (v) => (v === 0 ? { fill: C.ink, weight: 600 } : { fill: C.pencil });
    for (const x of g.xs) out.push(text(X(x) + gl * 0.35, labelTop, formatAddress(x, 'x'), { size: gl, spacing: 0.4, rotate: -90, anchor: 'end', ...gridLabel(x) }));
    for (const y of g.ys) out.push(text(colX, Y(y) + gl * 0.35, formatAddress(y, 'y'), { size: gl, spacing: 0.4, anchor: 'end', ...gridLabel(y) }));

    out.push(`<rect${hooks ? ` data-inset-frame data-y0="${+Y(0).toFixed(2)}"` : ''} x="${X(insetBox.west)}" y="${Y(insetBox.north)}" width="${X(insetBox.east) - X(insetBox.west)}" height="${Y(insetBox.south) - Y(insetBox.north)}" fill="none" stroke="${C.ink}" stroke-width="0.6" stroke-dasharray="2 2"/>`);

    const inExt = (s) => s.x >= ext.west && s.x <= ext.east && s.y >= ext.south && s.y <= ext.north;
    drawStations(stations.filter(inExt), X, Y, rMap);

    // names, with the year, of the stations due by a date, outside the inset (it names its own)
    const ls = 7.5 * T;
    out.push(...placeLabels(stations.filter((d) => due(d) && inExt(d) && !inInset(d)), X, Y, rMap * 1.1, ls,
      { x0: fx0, x1: fx1, text: label }).map(([s, t]) => tag(s, 'perm-label', t)));

    // mile ruler
    const rx = X(ext.west + 800), ry = Y(ext.south) - k * 0.35;
    out.push(`<line x1="${rx}" x2="${rx + 4 * k}" y1="${ry}" y2="${ry}" stroke="${C.ink}" stroke-width="1.2"/>`);
    for (let i = 0; i <= 4; i++) out.push(`<line x1="${rx + i * k}" x2="${rx + i * k}" y1="${ry - (i % 4 === 0 ? 6 : 4)}" y2="${ry}" stroke="${C.ink}" stroke-width="1.2"/>`);
    out.push(text(rx, ry - 9, '0', { size: 7.5 * T, anchor: 'middle' }));
    out.push(text(rx + 4 * k, ry - 9, '4 MI', { size: 7.5 * T, anchor: 'middle' }));

    // legend
    const lgs = 9 * T;
    const sw = (fill, under = C.ground) => `<rect x="-6" y="-5" width="12" height="10" fill="${under}"/><rect x="-6" y="-5" width="12" height="10" fill="${fill}"/>`;
    const lsw = `<defs><pattern id="${uid}-lh" width="3.2" height="3.2" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="3.2" stroke="${C.ink}" stroke-width="0.6"/></pattern><pattern id="${uid}-ld" width="2.8" height="2.8" patternUnits="userSpaceOnUse"><circle cx="1.4" cy="1.4" r="0.5" fill="${C.ink}"/></pattern></defs>`;
    const waves = `<path d="M-7,-3.2q1.75,-1.6 3.5,0t3.5,0t3.5,0t3.5,0M-7,0.8q1.75,-1.6 3.5,0t3.5,0t3.5,0t3.5,0M-7,4.8q1.75,-1.6 3.5,0t3.5,0t3.5,0t3.5,0" fill="none" stroke="${C.pencil}" stroke-width="0.5"/>`;
    const st = (phase, year) => mark({ phase, year }, 0, 0, 3.2, markInk);
    const items = [
      ['head', 'Step-free half-mile walk'],
      [lsw + sw(AREA.today, AREA.today), 'today'],
      [sw(`url(#${uid}-ld)`), 'funded, with a date'],
      [sw(`url(#${uid}-lh)`), 'promised, no date or no money'],
      [waves, 'sea: a line every ⅛ mile farther'],
      ['gap'],
      [st('today'), 'Accessible today'],
      [st('P1', 2027), 'Due, with its year'],
      [st('P3'), 'No date'],
    ];
    if (isPlate) {
      const short = [
        ['head', 'Step-free half mile'],
        [items[1][0], 'today'],
        [items[2][0], 'funded, dated'],
        [items[3][0], 'no date or money'],
        [waves, 'each ⅛ mile farther'],
        [items[6][0], 'accessible'],
        [items[7][0], 'due'],
        [items[8][0], 'no date'],
      ];
      let lx = 60;
      const y = 203;
      for (const [m, lab] of short) {
        if (m === 'head') {
          out.push(text(lx, y, `${lab}:`, { size: lgs, fill: C.pencil }));
          lx += textWidth(`${lab}:`, lgs) + 6;
          continue;
        }
        out.push(`<g transform="translate(${lx + 6} ${y - lgs * 0.35})">${m}</g>`);
        out.push(text(lx + 17, y, lab, { size: lgs, fill: C.pencil }));
        lx += 17 + textWidth(lab, lgs) + 9;
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
    // one row per step toward 2038, in CTA's order: the step, its year (or none), a bar as long as
    // the residents it adds (stipple: funded, with a date; hatch: no date or no money) and the count
    const cs = isChart ? 8 * T : 8;
    const row = isChart ? 22 : 16;
    const bar = isChart ? { x: 200, w: 112, h: 10 } : { x: 150, w: 92, h: 7.5 };
    const s = isChart ? 1.25 : 1;
    if (isChart) uy = Math.round(cs + 2);
    else {
      uy = Math.round(labelTop + 10.5 * T * 0.72);
      title(uy, chartTitle().toUpperCase());
      const noteLines = wrap(CHART_NOTE, Math.floor(cw / (ns * 0.45)));
      noteLines.forEach((l, i) => note(uy + (i + 1) * nh + 4, l));
      uy += noteLines.length * nh + 24;
    }
    out.push(patterns(s));
    const hs = cs * 0.8;
    out.push(text(mx, uy - row * 0.2, 'TODAY', { size: hs, spacing: 0.4, fill: C.pencil }));
    out.push(text(mx + cw, uy - row * 0.2, hundreds(summary.today), { size: cs, anchor: 'end', fill: C.ink }));
    uy += row;
    const max = Math.max(...steps.map((d) => d.gain));
    if (hooks) out.push(`<style>.${uid}-row .bg{transition:fill .12s}.${uid}-row:hover .bg,svg.hl .${uid}-row.on .bg{fill:${C.rule}}</style>`);
    for (const st of steps) {
      if (hooks) out.push(`<g class="${uid}-row" data-hl="${st.key}"><rect class="bg" x="${mx - 4}" y="${uy - row + 5}" width="${cw + 8}" height="${row}" fill="transparent"/>`);
      out.push(text(mx, uy, st.label, { size: cs, fill: C.ink, weight: st.funded ? 500 : 400 }));
      out.push(text(mx + bar.x - 8, uy, st.year ? String(st.year) : 'no date', { size: cs, anchor: 'end', fill: st.year ? C.ink : C.pencil, italic: !st.year }));
      const by = uy - cs * 0.36 - bar.h / 2;
      const bw = (st.gain / max) * bar.w;
      out.push(`<rect x="${mx + bar.x}" y="${by.toFixed(1)}" width="${bw.toFixed(1)}" height="${bar.h}" fill="${C.ground}"/>`);
      out.push(`<rect x="${mx + bar.x}" y="${by.toFixed(1)}" width="${bw.toFixed(1)}" height="${bar.h}" fill="url(#${uid}-${st.funded ? 'd' : 'h'}${s})" stroke="${C.ink}" stroke-width="0.5"/>`);
      out.push(text(mx + cw, uy, `+${hundreds(st.gain)}`, { size: cs, anchor: 'end', fill: C.pencil }));
      if (hooks) out.push('</g>');
      uy += row;
    }
    const ry = uy - row + 7;
    out.push(`<line x1="${mx}" x2="${mx + cw}" y1="${ry}" y2="${ry}" stroke="${C.ink}" stroke-width="0.6" stroke-dasharray="2 2"/>`);
    uy = ry + cs + 6;
    out.push(text(mx, uy, 'EVERY STATION ACCESSIBLE', { size: cs * 0.85, spacing: 0.3, fill: C.pencil }));
    out.push(text(mx + cw, uy, hundreds(summary.full), { size: cs, anchor: 'end', fill: C.ink, weight: 600 }));
    uy += row;
    out.push(text(mx, uy, 'STILL FARTHER THAN A HALF MILE', { size: cs * 0.85, spacing: 0.3, fill: C.pencil }));
    out.push(text(mx + cw, uy, `${hundreds(summary.beyond)} · ${Math.round(summary.beyondShare * 100)}%`, { size: cs, anchor: 'end', fill: C.ink, weight: 600 }));
    if (isChart) {
      return svg(out.join(''), { label: `${chartTitle()}: today ${hundreds(summary.today)} residents; every station accessible ${hundreds(summary.full)}; ${Math.round(summary.noDateShare * 100)}% of the gain has no date or no money.`, viewBox: `0 0 ${cw + 6} ${Math.ceil(uy + 6)}`, align: 'xMinYMin meet' });
    }
  }

  // ---------- inset ----------
  const cyI = (insetBox.north + insetBox.south) / 2;
  const box = isInset ? { ...insetBox, north: cyI + 5200, south: cyI - 5200 } : insetBox;
  const lbm = miles(box);
  const iw = isInset ? 390 : W_COL;
  const ki = iw / (lbm.east - lbm.west);
  const ty = uy + 30;
  if (isPlate) {
    title(ty, `INSET · ${insetTitle().toUpperCase()}`);
    note(ty + nh + 4, `Shown at ×${(ki / k).toFixed(1)} the scale of the main map; a line every half mile.`);
    note(ty + 2 * nh + 4, `The largest area with no date: about ${hundreds(data.inset.residents)} residents.`);
  }
  const inset = isInset ? { x: 0, y: 0, w: iw, h: Math.round((lbm.north - lbm.south) * ki) } : { x: mx, y: ty + 2 * nh + 16, w: iw, h: Math.round((lbm.north - lbm.south) * ki) };
  out.push(`<defs><clipPath id="${uid}-inset"><rect x="${inset.x}" y="${inset.y}" width="${inset.w}" height="${inset.h}"/></clipPath></defs>`);
  out.push(`<rect x="${inset.x}" y="${inset.y}" width="${inset.w}" height="${inset.h}" fill="${C.paper}"/>`);
  const IXm = (m) => inset.x + (m - lbm.west) * ki;
  const IYm = (m) => inset.y + (lbm.north - m) * ki;
  const IX = (x) => IXm(toMiles(x, 'x'));
  const IY = (y) => IYm(toMiles(y, 'y'));
  out.push(`<g clip-path="url(#${uid}-inset)">`);
  const half = [], halfY = [];
  for (let m = Math.ceil(lbm.west * 2) / 2; m <= lbm.east; m += 0.5) half.push(m);
  for (let m = Math.ceil(lbm.south * 2) / 2; m <= lbm.north; m += 0.5) halfY.push(m);
  drawGrid(half, halfY, IXm, IYm, inset.x, inset.x + inset.w, inset.y, inset.y + inset.h);
  const sI = isInset ? 1.6 : 1.35;
  drawSea(IX, IY, sI);
  drawLand(IX, IY, sI);
  drawTrack(IX, IY, isInset ? 2 : 1.7);
  const inBoxMi = (b) => (s) => { const x = toMiles(s.x, 'x'), y = toMiles(s.y, 'y'); return x >= b.west - 0.2 && x <= b.east + 0.2 && y >= b.south - 0.2 && y <= b.north + 0.2; };
  const ri = isInset ? 4 : 3.4;
  drawStations(stations.filter(inBoxMi(lbm)), IX, IY, ri);
  out.push(...placeLabels(stations.filter((d) => d.phase !== 'today' && inBoxMi(lbm)(d)), IX, IY, ri * 1.1, 7.5 * TI,
    { x0: inset.x, x1: inset.x + inset.w, text: label }).map(([s, t]) => tag(s, 'perm-label', t)));
  if (lbm.west < 0 && lbm.east > 0) out.push(text(IXm(0) + 3, inset.y + inset.h - 5, 'STATE', { size: 7 * TI, fill: C.ink, weight: 600, halo: C.paper }));
  if (lbm.south < 0 && lbm.north > 0) out.push(text(inset.x + 4, IYm(0) - 3, 'MADISON', { size: 7 * TI, fill: C.ink, weight: 600, halo: C.paper }));
  out.push('</g>');
  if (isPlate) out.push(`<rect x="${inset.x}" y="${inset.y}" width="${inset.w}" height="${inset.h}" fill="none" stroke="${C.ink}" stroke-width="0.8"/>`);

  if (isInset) {
    return svg(out.join(''), { label: `${insetTitle()}: stations with no date to become accessible, and the land they would add.`, viewBox: `0 0 ${inset.w} ${inset.h}`, align: 'xMidYMid slice' })
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
  const ledger = [
    ['PROMISE', 'CTA, All Stations Accessibility Program, Strategic Plan (2024), Table 5; CTA releases on Racine (Blue) and Austin (Green)'],
    ['', 'Red Line Extension: four stations (CTA RLE FAQ) where the OpenStreetMap construction alignment crosses their streets'],
    ['STATIONS', `CTA List of 'L' Stops · Chicago Data Portal · ${data.source.id} · pulled ${data.source.pulled}`],
    ['WALK', `As Plate III: step-free half mile (${Math.round(data.walkM)} m) on the OSM walk network, Geofabrik extract of ${data.osm.extract}`],
    ['SEA', 'Step-free walk to the nearest station once every station is accessible: a line every ⅛ mile, ink every ½ mile'],
    ['PEOPLE', `2020 Census blocks, ${fmt(summary.residents)} residents; the city of 2038 drawn with today’s people and sidewalks`],
    ['TRACK', `CTA GTFS rail shapes, feed of ${data.gtfs.feedDate}; Red Line Extension dashed (OpenStreetMap, ODbL)`],
    ['LIMITS', 'City of Chicago, Boundaries – City · qqq8-j68g; land and sea clipped to the city limits'],
  ];
  dy += 18;
  for (const [kk, v] of ledger) {
    out.push(text(lx, dy, kk, { size: 8.5, fill: C.pencil, spacing: 0.6 }));
    out.push(text(lx + 64, dy, v, { size: 9.5, font: SERIF }));
    dy += 13.5;
  }

  return svg(out.join(''), { label: mapLabel(summary) });
}

const W_COL = 300;
export const CHART_NOTE = 'Residents who gain a step-free half-mile walk to an accessible station, step by step in CTA’s order · Stipple: funded, with a date · Hatched: no date or no money';
export const chartTitle = () => 'The promise, step by step';
export const insetTitle = () => 'The Blue Line subway';

const fmt = (n) => Math.round(n).toLocaleString('en-US');
export const hundreds = (n) => fmt(Math.round(n / 100) * 100);

export function detail(s) {
  if (s.phase === 'today') return [`Accessible today`, s.inCity ? `Nearest station in 2038 for ${hundreds(s.residents)} residents within a step-free half mile` : 'Outside Chicago'].join('|');
  const when = s.year ? `${s.phaseLabel}: due ${s.year}` : `${s.phaseLabel}: no date${s.phase === 'P2u' || s.phase === 'P3' || s.phase === 'P4' || s.phase === 'RPM' ? ', not funded' : ''}`;
  const rows = [s.phase === 'RLE' ? `Red Line Extension: opens ${s.year}` : when];
  rows.push(s.inCity ? (s.gain ? `${hundreds(s.gain)} residents gain a step-free half-mile walk` : 'Adds no residents: another accessible station is near') : 'Outside Chicago: residents not counted');
  return rows.join('|');
}

// Names next to their marks: each tries right-up, right-down, left-up, left-down and takes the first
// spot that overlaps no mark and no name already placed, inside x0..x1 (as Plate VII).
function placeLabels(list, fx, fy, r, size, { x0, x1, avoid = [], text: str = (s) => s.short }) {
  const boxes = [...avoid, ...list.map((s) => { const x = fx(s.x), y = fy(s.y); return [x - r * 1.4, y - r * 1.4, x + r * 1.4, y + r * 1.4]; })];
  const hit = (a, b) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
  const placed = [], labels = new Map();
  for (const s of [...list].sort((a, b) => fy(a.y) - fy(b.y))) {
    const x = fx(s.x), y = fy(s.y), t = str(s), w = textWidth(t, size, { weight: 500 });
    const spots = [[r * 1.8, -r * 0.8, 'start'], [r * 1.8, r * 0.8 + size * 0.75, 'start'], [-r * 1.8, -r * 0.8, 'end'], [-r * 1.8, r * 0.8 + size * 0.75, 'end']];
    const box = ([dx, dy, a]) => (a === 'start' ? [x + dx, y + dy - size * 0.75, x + dx + w, y + dy + 1] : [x + dx - w, y + dy - size * 0.75, x + dx, y + dy + 1]);
    const free = (b) => b[0] >= x0 + 2 && b[2] <= x1 - 2 && !placed.some((p) => hit(p, b)) && !boxes.some((o) => hit(o, b));
    const spot = spots.find((sp) => free(box(sp))) ?? spots[0];
    placed.push(box(spot));
    boxes.push(box(spot));
    labels.set(s.id, text(x + spot[0], y + spot[1], t, { size, fill: C.ink, weight: 500, anchor: spot[2], halo: C.paper }));
  }
  return list.map((s) => [s, labels.get(s.id)]);
}

const mapLabel = (summary) =>
  `Plate VIII, Chicago, 2038: if every ‘L’ station were accessible, ${Math.round(summary.fullShare * 100)}% of Chicagoans would live within a step-free half-mile walk of one, up from ${Math.round(summary.todayShare * 100)}% today; ${Math.round(summary.noDateShare * 100)}% of that gain has no date or no money.`;
