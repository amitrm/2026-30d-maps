// Plate V · The Signal You Must See · Day 05 Senses: Sight
import { C, LINES, SERIF, esc, text, textWidth, legendBox, wrap, frame, svg } from '../lib/plate.js';
import { gridLines, formatAddress, toMiles } from '../lib/grid.js';

// variant 'plate': the full 1080 x 1350 plate (export, download).
// variant 'map': the map alone, with hover hooks, for the day page's left column.
// variant 'chart': stations by line, with hover hooks, for the day page's middle column.
// variant 'inset': the Loop inset alone, drawn tall so the page can crop it.
// data.signals: every signalized intersection with pedestrian signals, in address units
// ({ x, y, aps, name?, year? }). A crossing you must see is a small pencil dot, so the field of them
// recedes; one with an accessible pedestrian signal (APS) is a larger ink dot. Signals stay ink in
// color mode: they are the City's, not CTA's.
// data.stations: the 'L' stations, muted squares under the signals (filled = vertically accessible,
// as Plate I); in color mode they take their line's color, faded.
// data.rail: the 'L' track, CTA's GTFS rail shapes in address units (as Plate II).
// data.boundary: city boundary rings; data.sequences: station order per line (as Plate I).
export function renderDay05(data, { mode = 'gray', variant = 'plate' } = {}) {
  const { signals, stations, byLine, summary, boundary = [], sequences = {} } = data;
  const out = [];
  const isPlate = variant === 'plate';
  const isMap = variant === 'map';
  const isChart = variant === 'chart';
  const isInset = variant === 'inset';
  const hooks = isMap || isChart || isInset; // hover hooks for the day page
  const uid = `d05-${variant}-${mode}`;
  const T = isMap || isChart ? 1.3 : 1.15;
  const TI = isInset ? 1.35 : 1.15;
  const color = mode === 'color';
  const fmt = (n) => Math.round(n).toLocaleString('en-US');
  const soft = hooks && !color; // on the page, grayscale marks step back from full ink (as Plate I)
  const markInk = soft ? '#5A5853' : C.ink;
  const keys = (s) => s.lines.join(' ');

  const ring = (r, fx, fy) => 'M' + r.map(([x, y]) => `${fx(x).toFixed(1)},${fy(y).toFixed(1)}`).join('L') + 'Z';
  const city = (fx, fy) => boundary.map((r) => ring(r, fx, fy)).join('');
  const miles = (b) => ({ west: toMiles(b.west, 'x'), east: toMiles(b.east, 'x'), south: toMiles(b.south, 'y'), north: toMiles(b.north, 'y') });
  const inBox = (b, pad = 0) => (p) => p.x >= b.west - pad && p.x <= b.east + pad && p.y >= b.south - pad && p.y <= b.north + pad;
  const byId = new Map(stations.map((s) => [s.id, s]));

  // marks
  const seen = (x, y, r) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${C.pencil}"/>`;
  const apsMark = (x, y, r) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${C.ink}"/>`;
  const square = (x, y, r, ada, fill, opacity = 1) =>
    `<rect x="${(x - r).toFixed(1)}" y="${(y - r).toFixed(1)}" width="${(2 * r).toFixed(1)}" height="${(2 * r).toFixed(1)}" fill="${ada ? fill : C.paper}" stroke="${fill}" stroke-width="${(r * 0.4).toFixed(2)}"${opacity < 1 ? ` opacity="${opacity}"` : ''}/>`;
  // stations step back: frame gray in grayscale, their line's color faded in color mode
  const stationInk = (lines) => (color ? (lines.length === 1 ? LINES[lines[0]] : C.pencil) : C.frame);
  const stationOpacity = color ? 0.5 : 1;

  // tooltips: an APS signal (name, year installed), a station (lines, its one-block count)
  const apsTip = (p) => `data-tip="${esc(p.name)}" data-name="${esc(p.name)}" data-ada="1" data-detail="${esc(`Accessible pedestrian signal${p.year ? ` · installed ${p.year}` : ' · installed since June 2026'}`)}"`;
  const stationDetail = (s) => {
    if (!s.inCity) return 'Outside the city: not in Chicago’s APS program';
    if (!s.signals) return 'No signalized crossing within one block';
    const n = `${s.signals} signalized crossing${s.signals > 1 ? 's' : ''} within one block`;
    return s.apsSignals ? `${n}|${s.apsSignals} with an accessible pedestrian signal` : `${n}|Every one must be seen`;
  };
  const station = (s, x, y, r) => {
    const mark = square(x, y, r, s.ada, stationInk(s.lines), stationOpacity);
    if (!hooks) return mark;
    return `<g data-id="${s.id}" data-tip="${esc(s.name)}" data-name="${esc(s.short)}" data-lines="${s.lines.join(' ')}" data-ada="${s.ada ? 1 : 0}" data-shape="square" data-keys="${keys(s)}" data-detail="${esc(stationDetail(s))}"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r + 4}" fill="transparent"/>${mark}</g>`;
  };
  const drawSignals = (fx, fy, keep, [rs, ra]) => {
    const pts = signals.filter(keep);
    out.push(pts.filter((p) => !p.aps).map((p) => seen(fx(p.x), fy(p.y), rs)).join(''));
    for (const p of pts.filter((p) => p.aps)) {
      const m = apsMark(fx(p.x), fy(p.y), ra);
      out.push(hooks ? `<g ${apsTip(p)}><circle cx="${fx(p.x).toFixed(1)}" cy="${fy(p.y).toFixed(1)}" r="${ra * 2.2}" fill="transparent"/>${m}</g>` : m);
    }
  };
  // the 'L' track from CTA's rail shapes (data.rail, as Plate II), thin, under everything
  const drawLines = (fx, fy, w) => {
    for (const { line, path } of data.rail ?? []) {
      const d = 'M' + path.map(([x, y]) => `${fx(x).toFixed(1)},${fy(y).toFixed(1)}`).join('L');
      out.push(`<path${hooks ? ` data-keys="${line}"` : ''} d="${d}" fill="none" stroke="${color ? LINES[line] : C.fog}" stroke-opacity="${color ? 0.45 : 1}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`);
    }
  };
  const drawGrid = (xs, ys, X, Y, x0, x1, y0, y1, minor = []) => {
    for (const [x, y, w, s] of minor) out.push(`<line x1="${x ?? x0}" x2="${x ?? x1}" y1="${y ?? y0}" y2="${y ?? y1}" stroke="${s}" stroke-width="${w}"/>`);
    for (const x of xs) out.push(`<line x1="${X(x)}" x2="${X(x)}" y1="${y0}" y2="${y1}" stroke="${x === 0 ? C.pencil : C.grid}" stroke-width="${x === 0 ? 0.8 : 0.6}"/>`);
    for (const y of ys) out.push(`<line x1="${x0}" x2="${x1}" y1="${Y(y)}" y2="${Y(y)}" stroke="${y === 0 ? C.pencil : C.grid}" stroke-width="${y === 0 ? 0.8 : 0.6}"/>`);
  };

  if (isPlate) out.push(frame({
    plate: 'V',
    chapter: 'THE GRID',
    day: 5,
    theme: 'Senses: Sight',
    title: 'The Signal You Must See',
    subtitle: 'Every signalized crossing in Chicago. At a small dot you must see the walk sign to know when to cross; a large dot also speaks and vibrates.',
  }));

  // ---------- main map: plotted in miles, the extent of Plates II–IV ----------
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
  const sizes = isMap ? [0.95, 2.2] : [0.75, 1.8]; // seen-only dot, APS dot

  if (isPlate || isMap) {
    out.push(`<defs><clipPath id="${uid}-map"><rect x="${fx0}" y="${fy0}" width="${fx1 - fx0}" height="${fy1 - fy0}"/></clipPath></defs>`);
    out.push(`<g clip-path="url(#${uid}-map)">`);
    if (boundary.length) out.push(`<path d="${city(X, Y)}" fill="${C.ground}" fill-rule="evenodd"/>`);
    drawGrid(g.xs, g.ys, X, Y, fx0, fx1, fy0, fy1);
    drawLines(X, Y, isMap ? 1.3 : 1);
    for (const s of stations) out.push(station(s, X(s.x), Y(s.y), isMap ? 2.3 : 1.9));
    drawSignals(X, Y, () => true, sizes);
    out.push('</g>');
    const gridLabel = (v) => (v === 0 ? { fill: C.ink, weight: 600 } : { fill: C.pencil });
    for (const x of g.xs) out.push(text(X(x) + gl * 0.35, labelTop, formatAddress(x, 'x'), { size: gl, spacing: 0.4, rotate: -90, anchor: 'end', ...gridLabel(x) }));
    for (const y of g.ys) out.push(text(colX, Y(y) + gl * 0.35, formatAddress(y, 'y'), { size: gl, spacing: 0.4, anchor: 'end', ...gridLabel(y) }));

    // inset outline on the main map (the page moves it to the cropped extent)
    out.push(`<rect${hooks ? ` data-inset-frame data-y0="${+Y(0).toFixed(2)}"` : ''} x="${X(LOOP.west)}" y="${Y(LOOP.north)}" width="${X(LOOP.east) - X(LOOP.west)}" height="${Y(LOOP.south) - Y(LOOP.north)}" fill="none" stroke="${C.ink}" stroke-width="0.6" stroke-dasharray="2 2"/>`);

    // mile ruler: four grid cells, ticks on the grid lines, in the bottom row of cells
    const rx = X(ext.west + 800), ry = Y(ext.south) - k * 0.35;
    out.push(`<line x1="${rx}" x2="${rx + 4 * k}" y1="${ry}" y2="${ry}" stroke="${C.ink}" stroke-width="1.2"/>`);
    for (let i = 0; i <= 4; i++) out.push(`<line x1="${rx + i * k}" x2="${rx + i * k}" y1="${ry - (i % 4 === 0 ? 6 : 4)}" y2="${ry}" stroke="${C.ink}" stroke-width="1.2"/>`);
    out.push(text(rx, ry - 9, '0', { size: 7.5 * T, anchor: 'middle' }));
    out.push(text(rx + 4 * k, ry - 9, '4 MI', { size: 7.5 * T, anchor: 'middle' }));

    // legend: on the plate one line under the subtitle; on the page in a box over the mile ruler
    const lgs = 9 * T;
    const legend = [
      [seen(0, 0, 1.3), 'Seen only'],
      [apsMark(0, 0, 2.4), 'Seen, heard and felt (APS)'],
      [square(0, 0, 2.8, true, color ? C.pencil : C.frame, stationOpacity) + `<g transform="translate(9 0)">${square(0, 0, 2.8, false, color ? C.pencil : C.frame, stationOpacity)}</g>`, '‘L’ station, accessible / not'],
      ...(boundary.length ? [[`<rect x="-6" y="-5" width="12" height="10" fill="${C.ground}"/>`, 'City of Chicago']] : []),
    ];
    if (isPlate) {
      let lx = 60;
      const y = 203;
      for (const [mark, lab] of legend) {
        out.push(`<g transform="translate(${lx + 6} ${y - lgs * 0.35})">${mark}</g>`);
        const w = lab.startsWith('‘L’') ? 26 : 17;
        out.push(text(lx + w, y, lab, { size: lgs, fill: C.pencil }));
        lx += w + textWidth(lab, lgs) + 9;
      }
    } else {
      out.push(legendBox([['head', 'Signalized crossings'], legend[0], legend[1], ['gap'], ...legend.slice(2)], { x: rx, bottom: Y(ext.south) - k, k, size: lgs }));
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
    // Plate I's chart: one row per line, stations in route order from the outer terminal (gap = a
    // branch), each a square as on the map; a dot above it marks an APS crossing within one block.
    const routeOrder = (line) =>
      (sequences[line] ?? []).map((seg) => seg.map((id) => byId.get(id)).filter((s) => s?.lines.includes(line))).filter((seg) => seg.length);
    const cs = 9 * T;
    const dot = isChart ? { r: 4.4, gap: 11.85, row: 60, drop: 20 } : { r: 3.2, gap: 9, row: 48, drop: 16 };
    if (isChart) {
      uy = Math.round(cs * 0.82 + 4);
    } else {
      uy = Math.round(labelTop + 10.5 * T * 0.72);
      title(uy, CHART_TITLE.toUpperCase());
      const noteLines = wrap(CHART_NOTE, Math.floor(cw / (ns * 0.45)));
      noteLines.forEach((l, i) => note(uy + (i + 1) * nh + 4, l));
      uy += noteLines.length * nh + 30;
    }
    const sorted = [...byLine].sort((a, b) => b.inCity - b.aps - (a.inCity - a.aps));
    const rowEnd = mx + 32 * dot.gap + 2 * dot.r;
    for (const l of sorted) {
      const segs = routeOrder(l.line);
      if (!segs.length) continue;
      const first = segs[0][0], last = segs[0].at(-1);
      if (hooks) out.push(`<g data-hl="${l.line}"><rect x="${mx - 4}" y="${uy - 15}" width="${rowEnd - mx + 8}" height="${dot.row - 6}" fill="transparent"/>`);
      const ls = isChart ? 8 * T : cs;
      const bw = textWidth(l.line.toUpperCase(), ls, { weight: 600, spacing: 0.6 }) + 10;
      out.push(`<rect x="${mx}" y="${uy - ls * 0.82 - 3}" width="${bw}" height="${ls + 5}" rx="1.5" fill="${color ? LINES[l.line] : soft ? C.rule : C.fog}"/>`);
      out.push(text(mx + 5, uy, l.line.toUpperCase(), { size: ls, weight: 600, spacing: 0.6, fill: color ? '#FFFFFF' : markInk }));
      const top = l === sorted[0]; // as Plate I, the line with the most stations without one leads in ink
      out.push(text(mx + bw + 8, uy, `${l.aps}/${l.inCity}`, { size: ls, weight: top ? 600 : 400, fill: top ? markInk : C.pencil }));
      const rs = 8 * T, to = last.short;
      const ax1 = rowEnd - textWidth(to, rs) - rs * 0.35, ax0 = ax1 - rs * 0.9, ay = uy - rs * 0.33;
      out.push(text(rowEnd, uy, to, { size: rs, anchor: 'end', fill: C.pencil }));
      out.push(arrow(ax0, ax1, ay, rs, C.pencil));
      out.push(text(ax0 - rs * 0.35, uy, first.short, { size: rs, anchor: 'end', fill: C.pencil }));
      // stations in route order; a branch starts after a gap
      const placed = [];
      let px = mx + dot.r;
      segs.forEach((seg, si) => {
        if (si) px += dot.gap * 0.9;
        for (const s of seg) { placed.push([s, px]); px += dot.gap; }
      });
      for (const [s, cx] of placed) {
        const cy = uy + dot.drop;
        const ink = color ? (s.lines.length === 1 ? LINES[s.lines[0]] : C.ink) : markInk;
        // the station as on the map: a square, filled where vertically accessible (pale outside
        // the city), and a dot above it where a crossing within one block has an APS
        const dr = dot.r * 0.9; // half side: about the area of Plate I's circle
        let m = square(cx, cy, dr, s.ada, s.inCity ? ink : C.fog).replace(/stroke-width="[^"]*"/, `stroke-width="${s.ada ? 0 : Math.max(1.1, dot.r * 0.3).toFixed(2)}"`);
        if (s.class === 'aps') m += `<circle cx="${cx}" cy="${(cy - dr - dot.r * 0.8).toFixed(1)}" r="${(dot.r * 0.42).toFixed(2)}" fill="${C.ink}"/>`;
        out.push(hooks ? `<g data-id="${s.id}" data-tip="${esc(s.name)}" data-name="${esc(s.short)}" data-lines="${l.line}" data-ada="${s.ada ? 1 : 0}" data-shape="square" data-detail="${esc(stationDetail(s))}"><circle cx="${cx}" cy="${cy - dot.r * 0.6}" r="${dot.r + 3}" fill="transparent"/>${m}</g>` : m);
      }
      if (hooks) out.push('</g>');
      uy += dot.row;
    }
    if (isChart) {
      const end = Math.ceil(uy - dot.row + dot.drop + dot.r + 4);
      return svg(out.join(''), { label: `${CHART_TITLE}, by line, in route order from the outer terminal.`, viewBox: `0 0 ${cw + 6} ${end}`, align: 'xMinYMin meet' });
    }
  }

  // Inset: the Loop, with a grid line every block (100 address numbers, the order's 1/8 mile). The
  // page's inset is drawn tall so the page can crop it.
  const cy0 = (LOOP.north + LOOP.south) / 2;
  const box = isInset ? { ...LOOP, north: cy0 + 2800, south: cy0 - 2800 } : LOOP;
  const lbm = miles(box);
  const iw = isInset ? 390 : W_COL;
  const ki = iw / (lbm.east - lbm.west);
  const ty = uy + 14;
  const inLoop = signals.filter(inBox(LOOP));
  if (isPlate) {
    title(ty, `INSET · ${INSET_TITLE}`);
    note(ty + nh + 4, `Shown at ×${(ki / k).toFixed(1)} the scale of the main map; a line every block.`);
    note(ty + 2 * nh + 4, `${inLoop.filter((p) => p.aps).length} of its ${inLoop.length} signalized crossings have an APS.`);
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
  // blocks: every 100 address numbers (an eighth of a mile; the first mile south has 150 per eighth)
  const minor = [];
  for (let x = Math.ceil(box.west / 100) * 100; x <= box.east; x += 100) if (x % 400) minor.push([IX(x), null, 0.4, C.grid]);
  for (let m = Math.ceil(lbm.south * 8) / 8; m <= lbm.north; m += 0.125) if (Math.round(m * 8) % 4) minor.push([null, IYm(m), 0.4, C.grid]);
  const half = [], halfY = [];
  for (let m = Math.ceil(lbm.west * 2) / 2; m <= lbm.east; m += 0.5) half.push(m);
  for (let m = Math.ceil(lbm.south * 2) / 2; m <= lbm.north; m += 0.5) halfY.push(m);
  drawGrid(half, halfY, IXm, IYm, inset.x, inset.x + inset.w, inset.y, inset.y + inset.h, minor);
  drawLines(IX, IY, isInset ? 2.4 : 2);
  for (const s of stations.filter(inBox(box, 200))) out.push(station(s, IX(s.x), IY(s.y), isInset ? 3.4 : 3));
  drawSignals(IX, IY, inBox(box, 200), isInset ? [1.5, 3] : [1.3, 2.6]);
  out.push(text(IX(0) + 3, isInset ? IY(LOOP.south) - 5 : inset.y + inset.h - 5, 'STATE', { size: 7 * TI, fill: C.ink, weight: 600, halo: C.ground }));
  out.push(text(inset.x + 4, IY(0) - 3, 'MADISON', { size: 7 * TI, fill: C.ink, weight: 600, halo: C.ground }));
  out.push('</g>');
  if (isPlate) out.push(`<rect x="${inset.x}" y="${inset.y}" width="${inset.w}" height="${inset.h}" fill="none" stroke="${C.ink}" stroke-width="0.8"/>`);

  if (isInset) {
    return svg(out.join(''), { label: `${INSET_TITLE}: signalized crossings and accessible pedestrian signals.`, viewBox: `0 0 ${inset.w} ${inset.h}`, align: 'xMidYMid slice' })
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
  const cd = summary.cdot;
  const ledger = [
    ['APS', `CDOT, Chicago APS Semi-Annual Report, June 2026 (App. A, ${cd.aps} with install dates); ChicagoAPS.org list, ${summary.listedAsOf} (${summary.listedNow})`],
    ['SIGNALS', `OpenStreetMap, ${data.osmDate}: signal and signalized-crosswalk nodes within 80 m; ${fmt(summary.signals)} mapped (CDOT counts ${fmt(cd.signals)})`],
    ['BLOCK', 'The court order’s 1/8 mile, 201 m, measured as a walk on the OSM walk network'],
    ['PEOPLE', 'Vision difficulty: ACS 2020–2024 5-year, B18103, by tract, spread over 2020 blocks by population'],
    ['ORDER', `ACB of Metropolitan Chicago v. City of Chicago, Remedial Plan Order, ${summary.order.entered}`],
    ['CAVEAT', `Installed is not compliant: the court monitor found none of ${summary.monitor.inspected} inspected APS fully compliant`],
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
// The Loop and its edges on whole blocks: Halsted (800 W) to the lake, Kinzie (400 N) to Polk (800 S)
const LOOP = { west: -800, east: 400, south: -800, north: 400 };
export const INSET_TITLE = 'THE LOOP';
export const CHART_TITLE = 'Stations with an APS nearby';
export const CHART_NOTE = 'Dot: an APS within a block · Filled: accessible · Pale: outside the city · Route order from the outer terminal · Gap: a branch';

const mapLabel = (summary) =>
  `Plate V, The Signal You Must See: at ${summary.seenOnly.toLocaleString('en-US')} of ${summary.signals.toLocaleString('en-US')} signalized crossings in Chicago the walk signal must be seen; ${summary.aps} have an accessible pedestrian signal.`;

// a right-pointing arrow from x0 to x1 at y, sized to text of size s
function arrow(x0, x1, y, s, color) {
  const h = s * 0.22;
  return `<path d="M${x0.toFixed(1)},${y.toFixed(1)}H${x1.toFixed(1)}M${(x1 - h).toFixed(1)},${(y - h).toFixed(1)}L${x1.toFixed(1)},${y.toFixed(1)}L${(x1 - h).toFixed(1)},${(y + h).toFixed(1)}" fill="none" stroke="${color}" stroke-width="${(s * 0.08).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round"/>`;
}
