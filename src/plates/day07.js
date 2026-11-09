// Plate VII · The Doors, Right Now · Day 07 10 minute map
import { C, LINES, SERIF, esc, text, textWidth, legendBox, wrap, frame, svg } from '../lib/plate.js';
import { gridLines, formatAddress, toMiles } from '../lib/grid.js';

// variant 'plate': the full 1080 x 1350 plate (export, download).
// variant 'map': the map alone, with hover hooks, for the day page's left column.
// variant 'chart': the elevators out, one row each, with hover hooks, for the day page's middle column.
// variant 'inset': the inset alone, drawn tall so the page can crop it.
// The plate shows one moment: CTA's elevator alerts at data.run.pulledAt (Chicago time).
// data.polygons (address units), Plate III's step-free half-mile walk, recomputed for the moment.
// Only the areas the outages touch are drawn (the rest of the walkshed is Plate III's):
//   lost: step-free before, not now (solid, Plate III's accessible gray)
//   oneDirection: step-free only to a station with one platform out (a lighter gray, fog)
//   now: the walkshed still step-free, in the data but not drawn
// data.stations: as Plate I (filled = accessible, hollow = non-accessible); data.outages: an
// accessible station with an elevator out gets a ring around its dot, full when no platform can be
// reached step-free, half when one platform is out. Rings stay ink in color mode (an alert, not a line).
// Everything that depends on the moment (which stations, the inset, the titles) comes from the data,
// so the plate can be rendered unchanged inside the ten minutes.
export const AREA = { lost: '#BDBBB4', oneDirection: C.fog };

export function renderDay07(data, { mode = 'gray', variant = 'plate' } = {}) {
  const { stations, outages, summary, polygons, run, boundary = [] } = data;
  const out = [];
  const isPlate = variant === 'plate';
  const isMap = variant === 'map';
  const isChart = variant === 'chart';
  const isInset = variant === 'inset';
  const hooks = isMap || isChart || isInset;
  const uid = `d07-${variant}-${mode}`;
  const T = isMap || isChart ? 1.3 : 1.15;
  const TI = isInset ? 1.35 : 1.15;
  const color = mode === 'color';
  const soft = hooks && !color;
  const markInk = soft ? '#5A5853' : C.ink;
  const tint = (lines) => (color && lines.length === 1 ? LINES[lines[0]] : color ? C.ink : markInk);
  const outById = new Map(outages.map((o) => [o.id, o]));
  const when = clock(run.pulledAt);

  // ---------- marks and hover hooks ----------
  const dot = (x, y, r, ada, fill) =>
    ada
      ? `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${fill}"/>`
      : `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${C.paper}" stroke="${fill}" stroke-width="${Math.max(1.1, r * 0.36).toFixed(2)}"/>`;
  // the outage ring: a paper disc under it keeps it clear of the walksheds and the next station
  const ringMark = (x, y, r, scope, fill) => {
    const R = r * 2, w = (r * 0.45).toFixed(2);
    const disc = `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(R + r * 0.45).toFixed(2)}" fill="${C.paper}"/>`;
    const ring = scope === 'station'
      ? `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${R.toFixed(2)}" fill="none" stroke="${C.ink}" stroke-width="${w}"/>`
      : `<path d="M${x.toFixed(2)},${(y - R).toFixed(2)}A${R.toFixed(2)},${R.toFixed(2)} 0 0 1 ${x.toFixed(2)},${(y + R).toFixed(2)}" fill="none" stroke="${C.ink}" stroke-width="${w}"/>`;
    return disc + ring + dot(x, y, r, true, fill);
  };
  const detail = (s) => {
    const o = outById.get(s.id);
    if (!o) return s.ada ? `Accessible: no elevator alert at ${when}` : 'Non-accessible: stairs to at least one platform';
    return outageRows(o).join('|');
  };
  const station = (s, x, y, r) => {
    const o = outById.get(s.id);
    const fill = tint(s.lines);
    const mark = o ? ringMark(x, y, r, o.scope, fill) : dot(x, y, r, s.ada, fill);
    if (!hooks) return mark;
    const hit = `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(o ? r * 2.4 : r + 5).toFixed(1)}" fill="transparent"/>`;
    return `<g data-id="${s.id}" data-tip="${esc(s.short)}" data-name="${esc(s.short)}" data-lines="${s.lines.join(' ')}" data-ada="${s.ada ? 1 : 0}"${o ? ` data-shape="${o.scope === 'station' ? 'ring' : 'half-ring'}"` : ''} data-keys="${s.lines.join(' ')} ${s.id}" data-detail="${esc(detail(s))}">${hit}${mark}</g>`;
  };
  const tag = (s, cls, str) => (hooks ? str.replace('<text ', `<text class="${cls}" data-id="${s.id}" data-keys="${s.lines.join(' ')} ${s.id}" `) : str);

  const ring = (r, fx, fy) => 'M' + r.map(([x, y]) => `${fx(x).toFixed(1)},${fy(y).toFixed(1)}`).join('L') + 'Z';
  const city = (fx, fy) => boundary.map((r) => ring(r, fx, fy)).join('');
  const area = (polys, fx, fy) => polys.map((p) => p.map((r) => ring(r, fx, fy)).join('')).join('');
  const miles = (b) => ({ west: toMiles(b.west, 'x'), east: toMiles(b.east, 'x'), south: toMiles(b.south, 'y'), north: toMiles(b.north, 'y') });

  const drawAreas = (fx, fy) => {
    out.push(`<path d="${area(polygons.oneDirection, fx, fy)}" fill="${AREA.oneDirection}" fill-rule="evenodd"/>`);
    out.push(`<path d="${area(polygons.lost, fx, fy)}" fill="${AREA.lost}" fill-rule="evenodd"/>`);
  };
  // the 'L' track (data.rail, CTA's GTFS rail shapes, as Plates II and V): thin, under the stations;
  // fog in grayscale, the line's color, faded, in color mode
  const drawLines = (fx, fy, w) => {
    for (const { line, path } of data.rail ?? []) {
      const d = 'M' + path.map(([x, y]) => `${fx(x).toFixed(1)},${fy(y).toFixed(1)}`).join('L');
      out.push(`<path${hooks ? ` data-keys="${line}"` : ''} d="${d}" fill="none" stroke="${color ? LINES[line] : C.fog}" stroke-opacity="${color ? 0.45 : 1}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`);
    }
  };
  const drawGrid = (xs, ys, X, Y, x0, x1, y0, y1) => {
    for (const x of xs) out.push(`<line x1="${X(x)}" x2="${X(x)}" y1="${y0}" y2="${y1}" stroke="${x === 0 ? C.pencil : C.grid}" stroke-width="${x === 0 ? 0.8 : 0.6}"/>`);
    for (const y of ys) out.push(`<line x1="${x0}" x2="${x1}" y1="${Y(y)}" y2="${Y(y)}" stroke="${y === 0 ? C.pencil : C.grid}" stroke-width="${y === 0 ? 0.8 : 0.6}"/>`);
  };
  // stations drawn in order: others first, then the rings, so a ring is never covered
  const drawStations = (list, fx, fy, r) => {
    for (const s of list.filter((d) => !outById.has(d.id))) out.push(station(s, fx(s.x), fy(s.y), r));
    for (const s of list.filter((d) => outById.has(d.id))) out.push(station(s, fx(s.x), fy(s.y), r));
  };

  if (isPlate) out.push(frame({
    plate: 'VII',
    chapter: 'THE SYSTEMS',
    day: 7,
    theme: '10 minute map',
    title: 'The Doors, Right Now',
    subtitle: `Every ‘L’ station at ${when} on ${dayLong(run.pulledAt)}. A ring marks an accessible station with an elevator out of service.`,
  }));

  const insetMi = LOOP_MI;
  const inInsetMi = (s) => { const mx = toMiles(s.x, 'x'), my = toMiles(s.y, 'y'); return mx >= insetMi.west && mx <= insetMi.east && my >= insetMi.south && my <= insetMi.north; };

  // ---------- main map: plotted in miles, the extent of Plates II–V ----------
  const ext = { west: -11200, east: 4800, south: -14000, north: 10400 };
  const mi = miles(ext);
  const field = isMap ? { x: 60, y: 250, w: 760, h: 1040 } : { x: 60, y: 262, w: 575, h: 830 };
  const k = Math.min(field.w / (mi.east - mi.west), field.h / (mi.north - mi.south));
  const X = (x) => field.x + (toMiles(x, 'x') - mi.west) * k;
  const Y = (y) => field.y + (mi.north - toMiles(y, 'y')) * k;
  const Xm = (m) => field.x + (m - mi.west) * k;
  const Ym = (m) => field.y + (mi.north - m) * k;
  const fx0 = X(ext.west), fx1 = X(ext.east), fy0 = Y(ext.north), fy1 = Y(ext.south);
  const g = gridLines(ext);
  const gl = 8 * T;
  const labelLen = 7 * (gl * 0.6 + 0.4);
  const colX = fx1 + 6 + labelLen;
  const labelTop = fy0 - 6 - labelLen;
  const rMap = 3.2;

  if (isPlate || isMap) {
    out.push(`<defs><clipPath id="${uid}-map"><rect x="${fx0}" y="${fy0}" width="${fx1 - fx0}" height="${fy1 - fy0}"/></clipPath></defs>`);
    out.push(`<g clip-path="url(#${uid}-map)">`);
    if (boundary.length) out.push(`<path d="${city(X, Y)}" fill="${C.ground}" fill-rule="evenodd"/>`);
    drawAreas(X, Y);
    drawGrid(g.xs, g.ys, X, Y, fx0, fx1, fy0, fy1);
    drawLines(X, Y, isMap ? 1.3 : 1);
    out.push('</g>');
    const gridLabel = (v) => (v === 0 ? { fill: C.ink, weight: 600 } : { fill: C.pencil });
    for (const x of g.xs) out.push(text(X(x) + gl * 0.35, labelTop, formatAddress(x, 'x'), { size: gl, spacing: 0.4, rotate: -90, anchor: 'end', ...gridLabel(x) }));
    for (const y of g.ys) out.push(text(colX, Y(y) + gl * 0.35, formatAddress(y, 'y'), { size: gl, spacing: 0.4, anchor: 'end', ...gridLabel(y) }));

    // inset outline (the page moves it to the cropped extent)
    out.push(`<rect${hooks ? ` data-inset-frame data-y0="${+Y(0).toFixed(2)}"` : ''} x="${Xm(insetMi.west)}" y="${Ym(insetMi.north)}" width="${(insetMi.east - insetMi.west) * k}" height="${(insetMi.north - insetMi.south) * k}" fill="none" stroke="${C.ink}" stroke-width="0.6" stroke-dasharray="2 2"/>`);

    const inExt = (s) => s.x >= ext.west && s.x <= ext.east && s.y >= ext.south && s.y <= ext.north;
    drawStations(stations.filter(inExt), X, Y, rMap);

    // names of the stations with an elevator out, outside the inset (it names its own)
    const ls = 7.5 * T;
    out.push(...placeLabels(stations.filter((d) => outById.has(d.id) && inExt(d) && !inInsetMi(d)), X, Y, rMap, ls,
      { x0: fx0, x1: fx1 }).map(([s, t]) => tag(s, 'perm-label', t)));

    // mile ruler
    const rx = X(ext.west + 800), ry = Y(ext.south) - k * 0.35;
    out.push(`<line x1="${rx}" x2="${rx + 4 * k}" y1="${ry}" y2="${ry}" stroke="${C.ink}" stroke-width="1.2"/>`);
    for (let i = 0; i <= 4; i++) out.push(`<line x1="${rx + i * k}" x2="${rx + i * k}" y1="${ry - (i % 4 === 0 ? 6 : 4)}" y2="${ry}" stroke="${C.ink}" stroke-width="1.2"/>`);
    out.push(text(rx, ry - 9, '0', { size: 7.5 * T, anchor: 'middle' }));
    out.push(text(rx + 4 * k, ry - 9, '4 MI', { size: 7.5 * T, anchor: 'middle' }));

    // legend
    const lgs = 9 * T;
    const swatch = (fill) => `<rect x="-6" y="-5" width="12" height="10" fill="${fill}"/>`;
    const r = 3.2;
    const items = [
      ['head', 'Step-free half-mile walk'],
      [swatch(AREA.lost), 'lost: no step-free way in'],
      [swatch(AREA.oneDirection), 'one direction only'],
      ['gap'],
      [dot(0, 0, r, true, markInk), 'Accessible'],
      [dot(0, 0, r, false, markInk), 'Non-accessible'],
      [ringMark(0, 0, r * 0.8, 'station', markInk), 'Elevator out: no step-free way to a train'],
      [ringMark(0, 0, r * 0.8, 'platform', markInk), 'Elevator out at one platform'],
    ];
    if (isPlate) {
      const short = [
        ['head', 'Step-free half mile'],
        [items[1][0], 'lost'],
        [items[2][0], 'one direction only'],
        [items[4][0], 'accessible'],
        [items[5][0], 'non-accessible'],
        [items[6][0], 'no step-free way in'],
        [items[7][0], 'one platform out'],
      ];
      let lx = 60;
      const y = 203;
      for (const [mark, label] of short) {
        if (mark === 'head') {
          out.push(text(lx, y, `${label}:`, { size: lgs, fill: C.pencil }));
          lx += textWidth(`${label}:`, lgs) + 6;
          continue;
        }
        out.push(`<g transform="translate(${lx + 6} ${y - lgs * 0.35})">${mark}</g>`);
        out.push(text(lx + 17, y, label, { size: lgs, fill: C.pencil }));
        lx += 17 + textWidth(label, lgs) + 9;
      }
    } else {
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
    // one row per elevator: the mark, the station, when it went out and CTA's estimate, and the
    // residents it affects; cut-off stations first, then by residents, then by age
    const cs = isChart ? 8.5 * T : 8.5;
    const ss = cs * 0.9;
    const row = isChart ? 40 : 30;
    if (isChart) uy = Math.round(cs + 4);
    else {
      uy = Math.round(labelTop + 10.5 * T * 0.72);
      title(uy, chartTitle().toUpperCase());
      const noteLines = wrap(CHART_NOTE, Math.floor(cw / (ns * 0.45)));
      noteLines.forEach((l, i) => note(uy + (i + 1) * nh + 4, l));
      uy += noteLines.length * nh + 26;
    }
    if (hooks) out.push(`<style>.${uid}-row .bg{transition:fill .12s}.${uid}-row:hover .bg,svg.hl .${uid}-row.on .bg{fill:${C.rule}}</style>`);
    for (const o of sortOutages(outages)) {
      const s = stations.find((d) => d.id === o.id);
      // the row's hover target; hovered (or lit from the map), it turns gray. No data-id: rows do not grow.
      if (hooks) out.push(`<g class="${uid}-row" data-hl="${o.id}" data-tip="${esc(o.short)}" data-name="${esc(o.short)}" data-lines="${o.lines.join(' ')}" data-ada="1" data-shape="${o.scope === 'station' ? 'ring' : 'half-ring'}" data-detail="${esc(outageRows(o).join('|'))}"><rect class="bg" x="${mx - 4}" y="${uy - cs - 6}" width="${cw + 8}" height="${row - 1}" fill="transparent"/>`);
      // the mark as large as on the map: on the plate the same units; on the page the chart draws at
      // about 1/0.7 the map's scale, so its radius is scaled down to match (checked at 1440 and 1920)
      const r = isChart ? rMap * 0.7 : rMap;
      out.push(ringMark(mx + r * 2.5, uy - cs * 0.36, r, o.scope, tint(s.lines)));
      const nx = mx + r * 5.6 + 2;
      out.push(text(nx, uy, o.short.toUpperCase(), { size: cs, weight: 600, spacing: 0.5, fill: C.ink }));
      out.push(text(nx, uy + ss + 4, sinceText(o), { size: ss, fill: C.pencil }));
      const [n, lab, strong] = impact(o);
      out.push(text(mx + cw, uy, n, { size: cs, anchor: 'end', fill: strong ? C.ink : C.pencil, weight: strong ? 600 : 400 }));
      out.push(text(mx + cw, uy + ss + 4, lab, { size: ss, anchor: 'end', fill: C.pencil }));
      if (hooks) out.push('</g>');
      out.push(`<line x1="${mx}" x2="${mx + cw}" y1="${uy + ss + 11}" y2="${uy + ss + 11}" stroke="${C.rule}" stroke-width="0.8"/>`);
      uy += row;
    }
    // the total, each resident once
    const ty0 = uy - row + ss + 11;
    uy = ty0 + cs + 8;
    out.push(text(mx, uy, 'LOSE THE STEP-FREE HALF MILE, IN ALL', { size: cs * 0.85, spacing: 0.3, fill: C.pencil }));
    out.push(text(mx + cw, uy, hundreds(summary.lost), { size: cs, anchor: 'end', fill: C.ink, weight: 600 }));
    if (isChart) {
      return svg(out.join(''), { label: `${chartTitle()} at ${when}: ${outages.length} elevators, how long each has been out, and the residents affected.`, viewBox: `0 0 ${cw + 6} ${Math.ceil(uy + 6)}`, align: 'xMinYMin meet' });
    }
  }

  // ---------- inset ----------
  const cyMi = (insetMi.north + insetMi.south) / 2;
  const lbm = isInset ? { ...insetMi, north: cyMi + 6, south: cyMi - 6 } : insetMi;
  const iw = isInset ? 390 : W_COL;
  const ki = iw / (lbm.east - lbm.west);
  const ty = uy + 30;
  if (isPlate) {
    title(ty, `INSET · ${insetTitle(data).toUpperCase()}`);
    note(ty + nh + 4, `Shown at ×${(ki / k).toFixed(1)} the scale of the main map; a line every half mile.`);
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
  drawAreas(IX, IY);
  const half = [], halfY = [];
  for (let m = Math.ceil(lbm.west * 2) / 2; m <= lbm.east; m += 0.5) half.push(m);
  for (let m = Math.ceil(lbm.south * 2) / 2; m <= lbm.north; m += 0.5) halfY.push(m);
  drawGrid(half, halfY, IXm, IYm, inset.x, inset.x + inset.w, inset.y, inset.y + inset.h);
  drawLines(IX, IY, isInset ? 2.4 : 2);
  const inBoxMi = (b) => (s) => { const mx_ = toMiles(s.x, 'x'), my = toMiles(s.y, 'y'); return mx_ >= b.west - 0.2 && mx_ <= b.east + 0.2 && my >= b.south - 0.2 && my <= b.north + 0.2; };
  const ri = isInset ? 4.2 : 3.6;
  drawStations(stations.filter(inBoxMi(lbm)), IX, IY, ri);
  out.push(...placeLabels(stations.filter((d) => outById.has(d.id) && inBoxMi(lbm)(d)), IX, IY, ri, 7.5 * TI,
    { x0: inset.x, x1: inset.x + inset.w,
      // keep clear of the MADISON and STATE labels
      avoid: [[inset.x, IYm(0) - 7 * TI - 4, inset.x + 4 + textWidth('MADISON', 7 * TI, { weight: 600 }) + 2, IYm(0) + 1],
              [IXm(0), inset.y + inset.h - 7 * TI - 7, IXm(0) + 5 + textWidth('STATE', 7 * TI, { weight: 600 }), inset.y + inset.h]] }).map(([s, t]) => tag(s, 'perm-label', t)));
  if (lbm.west < 0 && lbm.east > 0) out.push(text(IXm(0) + 3, inset.y + inset.h - 5, 'STATE', { size: 7 * TI, fill: C.ink, weight: 600, halo: C.ground }));
  if (lbm.south < 0 && lbm.north > 0) out.push(text(inset.x + 4, IYm(0) - 3, 'MADISON', { size: 7 * TI, fill: C.ink, weight: 600, halo: C.ground }));
  out.push('</g>');
  if (isPlate) out.push(`<rect x="${inset.x}" y="${inset.y}" width="${inset.w}" height="${inset.h}" fill="none" stroke="${C.ink}" stroke-width="0.8"/>`);

  if (isInset) {
    return svg(out.join(''), { label: `${insetTitle(data)}: elevator outages and the step-free walk lost around them.`, viewBox: `0 0 ${inset.w} ${inset.h}`, align: 'xMidYMid slice' })
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
    ['SOURCE', `CTA Customer Alerts API, active alerts at ${clock24(run.pulledAt)} CT on ${dayShort(run.pulledAt)}: ${summary.elevatorAlerts} with impact “Elevator Status” (${summary.elevators} elevators)`],
    ['PLATFORMS', `CTA List of 'L' Stops · ${data.stops.id} · pulled ${data.stops.pulled}: each stop is one platform direction, matched to the alert’s words`],
    ['RUN', runLine(run)],
    ['WALK', `As Plate III: step-free half mile (${Math.round(data.walkM)} m) on the OSM walk network, Geofabrik extract of ${data.osm.extract}`],
    ['TRACK', `CTA GTFS rail shapes, feed of ${data.gtfs.feedDate}, every shape carrying at least a tenth of its line’s trips`],
    ['PEOPLE', `2020 Census blocks, ${fmt(summary.residents)} residents; ambulatory difficulty: ACS 2020–2024, B18105, by tract`],
    ['CAVEAT', 'An elevator with no platform named is taken to serve every platform; Chicago residents only'],
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
// inset labels: [dx, dy, anchor], hand-placed to avoid collisions
export const CHART_NOTE = 'Ring: no step-free way to a train · Half ring: one platform out · Out since, and CTA’s estimated return · Residents within a step-free half mile affected';

// Names of the stations with an elevator out: each tries right-up, right-down, left-up, left-down of
// its ring and takes the first spot that overlaps no ring and no name already placed, inside x0..x1.
function placeLabels(list, fx, fy, r, size, { x0, x1, avoid = [] }) {
  const boxes = [...avoid, ...list.map((s) => { const x = fx(s.x), y = fy(s.y); return [x - r * 2.3, y - r * 2.3, x + r * 2.3, y + r * 2.3]; })];
  const hit = (a, b) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
  const placed = [], labels = new Map();
  for (const s of [...list].sort((a, b) => fy(a.y) - fy(b.y))) {
    const x = fx(s.x), y = fy(s.y), w = textWidth(s.short, size, { weight: 500 });
    const spots = [[r * 2.7, -r * 1.4, 'start'], [r * 2.7, r * 1.4 + size * 0.75, 'start'], [-r * 2.7, -r * 1.4, 'end'], [-r * 2.7, r * 1.4 + size * 0.75, 'end']];
    const box = ([dx, dy, a]) => (a === 'start' ? [x + dx, y + dy - size * 0.75, x + dx + w, y + dy + 1] : [x + dx - w, y + dy - size * 0.75, x + dx, y + dy + 1]);
    const free = (b) => b[0] >= x0 + 2 && b[2] <= x1 - 2 && !placed.some((p) => hit(p, b)) && !boxes.some((o) => hit(o, b));
    const spot = spots.find((sp) => free(box(sp))) ?? spots[0];
    placed.push(box(spot));
    boxes.push(box(spot));
    labels.set(s.id, text(x + spot[0], y + spot[1], s.short, { size, fill: C.ink, weight: 500, anchor: spot[2], halo: C.ground }));
  }
  return list.map((s) => [s, labels.get(s.id)]);
}

// ---------- text helpers (times are read from the ISO string, in Chicago time, never re-zoned) ----------
const fmt = (n) => Math.round(n).toLocaleString('en-US');
export const hundreds = (n) => fmt(Math.round(n / 100) * 100);
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const parts = (iso) => {
  const [d, t] = iso.split('T');
  const [y, m, day] = d.split('-').map(Number);
  const [hh, mm] = t.slice(0, 5).split(':').map(Number);
  return { y, m, day, hh, mm };
};
export const clock = (iso) => {
  const { hh, mm } = parts(iso);
  return `${((hh + 11) % 12) + 1}:${String(mm).padStart(2, '0')} ${hh < 12 ? 'a.m.' : 'p.m.'}`;
};
const clock24 = (iso) => iso.split('T')[1].slice(0, 5);
export const dayLong = (iso) => { const { y, m, day } = parts(iso); return `${day} ${MONTHS[m - 1]} ${y}`; };
const dayShort = (iso) => { const { m, day } = parts(iso); return `${day} ${MONTHS[m - 1].slice(0, 3)}`; };
export const chartTitle = () => 'Elevators out';
// The inset: the Loop and the stations around it, fixed, in miles from State & Madison: Damen
// (2000 W) to the lake (800 E), Division (1200 N) to Roosevelt (1200 S, the first mile south).
// Wider than tall, as the page's inset column crops to about 4:3.
export const insetTitle = () => 'Loop';
const LOOP_MI = { west: -2.5, east: 1, north: 1.5, south: -1 };

const runLine = (run) =>
  run.live
    ? `Timed: alerts pulled to plate data in ${run.minutes.toFixed(1)} min (limit ${run.limitMinutes}); map template, walk network and base walksheds prepared beforehand`
    : `Rebuilt from the saved pull of ${clock24(run.pulledAt)}; map template, walk network and base walksheds prepared beforehand`;

export function sortOutages(outages) {
  return [...outages].sort((a, b) => (a.scope !== b.scope ? (a.scope === 'station' ? -1 : 1) : b.lost + b.oneDirection - (a.lost + a.oneDirection) || b.ageHours - a.ageHours));
}
export function sinceText(o) {
  const since = o.ageHours >= 24 ? `out since ${dayShort(o.start)}` : `out since ${clock(o.start)}`;
  return o.estimatedReturn ? `${since} · back ${dayShort(o.estimatedReturn + 'T12:00')} (est.)` : since;
}
// [number, label, strong] for the chart's right column
function impact(o) {
  if (!o.inCity) return ['—', 'outside Chicago', false];
  if (o.scope === 'station') return [hundreds(o.lost), 'lose the step-free walk', true];
  if (o.oneDirection) return [hundreds(o.oneDirection), 'one direction only', false];
  return ['0', 'another accessible station near', false];
}
export function outageRows(o) {
  const what = o.description.replace(/^The /, '');
  const rows = [`${what[0].toUpperCase()}${what.slice(1)} out of service`];
  rows.push(o.scope === 'station' ? 'No step-free way to any train' : 'One platform out: step-free in one direction');
  rows.push(sinceText(o).replace(/^out/, 'Out'));
  if (o.scope === 'station' && o.inCity) rows.push(`${hundreds(o.lost)} residents lose their step-free half-mile walk`);
  if (o.scope === 'platform' && o.oneDirection) rows.push(`${hundreds(o.oneDirection)} residents keep one direction only`);
  return rows;
}
const mapLabel = (data) =>
  `Plate VII, The Doors, Right Now: at ${clock(data.run.pulledAt)} on ${dayLong(data.run.pulledAt)}, ${data.summary.stationsCut} accessible ‘L’ stations had no working elevator to any train and ${data.summary.stationsOneDirection} had one platform out; about ${hundreds(data.summary.lost)} Chicagoans lost their step-free half-mile walk.`;
