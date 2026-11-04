// Plate III · The Accessible City · Day 03 Polygons
import { C, LINES, SERIF, esc, text, textWidth, legendBox, wrap, frame, svg } from '../lib/plate.js';
import { gridLines, formatAddress, toMiles } from '../lib/grid.js';

// variant 'plate': the full 1080 x 1350 plate (export, download).
// variant 'map': the map alone, with hover hooks, for the day page's left column.
// variant 'chart': Residents near each line, with hover hooks, for the day page's middle column.
// variant 'inset': the inset alone, drawn tall around the largest non-accessible-only area so the page can crop it.
// Map and inset: the half-mile walksheds from the notebook (data.polygons, address units): solid where
// a step-free walk reaches a vertically accessible station (an elevator or ramp to every platform),
// hatched where the walk reaches non-accessible stations only (stairs to at least one platform).
// Stations as on Plate I; in color mode they take their line's color, and interchange stations stay ink. The walksheds stay gray in both modes: value and hatching tell them
// apart, and line colors are kept for the stations.
// data.catchments: each station's part of the walkshed, drawn as hover targets on the page.
// data.boundary: city boundary rings in address units (reference/city-boundary.json).

export const AREA = { accessible: '#BDBBB4', hatch: C.ink };

export function renderDay03(data, { mode = 'gray', variant = 'plate' } = {}) {
  const { stations, byLine, summary, polygons, catchments = {}, boundary = [] } = data;
  const out = [];
  const isPlate = variant === 'plate';
  const isMap = variant === 'map';
  const isChart = variant === 'chart';
  const isInset = variant === 'inset';
  const hooks = isMap || isChart || isInset; // hover hooks for the day page
  const uid = `d03-${variant}-${mode}`; // pattern and clip ids stay unique when both modes share a page
  // Label scale, as on Plates I and II: the day page shows the map at about 0.75x.
  const T = isMap || isChart ? 1.3 : 1.15;
  const TI = isInset ? 1.35 : 1.15;
  const soft = hooks && mode === 'gray'; // on the page, marks and line boxes step back as on Plate I
  const markInk = soft ? '#5A5853' : C.ink;
  const tint = (lines) => (mode === 'color' && lines.length === 1 ? LINES[lines[0]] : mode === 'color' ? C.ink : markInk);
  const keys = (s) => s.lines.join(' ');
  const fmt = (n) => Math.round(n).toLocaleString('en-US');
  const hundreds = (n) => fmt(Math.round(n / 100) * 100);
  const byId = new Map(stations.map((s) => [s.id, s]));

  // tooltip rows for a station: residents within its half-mile walk, and how many of them are near
  // non-accessible stations only
  const detail = (s) => {
    if (!s.onNetwork) return 'Off the walking network: no residents within a half mile';
    const rows = [`Nearest station for ${fmt(s.residents)} residents within a half-mile walk`];
    if (s.nearNonAccessible) rows.push(`${fmt(s.nearNonAccessible)} of them have no accessible station within a step-free half mile`);
    return rows.join('|');
  };
  const hover = (s, lines, inner, keyed) =>
    hooks ? `<g data-id="${s.id}" data-tip="${esc(s.name)}" data-name="${esc(s.short)}" data-lines="${lines.join(' ')}" data-ada="${s.ada ? 1 : 0}" data-detail="${esc(detail(s))}"${keyed ? ` data-keys="${keys(s)}"` : ''}>${inner}</g>` : inner;
  const station = (s, x, y, r) => {
    const mark = stationMark(x, y, s.ada, r, tint(s.lines));
    const hit = hooks ? `<circle cx="${x}" cy="${y}" r="${r + 5}" fill="transparent"/>` : '';
    return hover(s, s.lines, hit + mark, true);
  };
  const tag = (s, cls, str) => (hooks ? str.replace('<text ', `<text class="${cls}" data-id="${s.id}" data-keys="${keys(s)}" `) : str);
  const hlLabel = (s, x, y, size) => tag(s, 'hl-label', text(x + 6, y - 4, s.short, { size, fill: C.ink, halo: C.ground, rotate: -40 }));

  const ring = (r, fx, fy) => 'M' + r.map(([x, y]) => `${fx(x).toFixed(1)},${fy(y).toFixed(1)}`).join('L') + 'Z';
  const city = (fx, fy) => boundary.map((r) => ring(r, fx, fy)).join('');
  const area = (polys, fx, fy) => polys.map((p) => p.map((r) => ring(r, fx, fy)).join('')).join('');
  const miles = (b) => ({ west: toMiles(b.west, 'x'), east: toMiles(b.east, 'x'), south: toMiles(b.south, 'y'), north: toMiles(b.north, 'y') });
  // the inset: the largest non-accessible-only area (data.inset.box), widened to whole grid half-miles
  const ib = data.inset.box;
  const snap = (v, f) => f(v / 400) * 400;
  const insetBox = { west: snap(ib.west - 200, Math.floor), east: snap(ib.east + 200, Math.ceil), south: snap(ib.south - 200, Math.floor), north: snap(ib.north + 200, Math.ceil) };
  const inBox = (b) => (s) => s.x >= b.west && s.x <= b.east && s.y >= b.south && s.y <= b.north;
  const inInset = inBox(insetBox);

  // hatching for the non-accessible-only walkshed: ink lines at 45°, spaced in screen pixels
  const hatch = (id, gap, w) =>
    `<pattern id="${id}" width="${gap}" height="${gap}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="${gap}" stroke="${AREA.hatch}" stroke-width="${w}"/></pattern>`;
  // the walksheds, the station catchments (page only: hover targets, tinted on hover or
  // when their line is highlighted), drawn under the grid lines
  const drawAreas = (fx, fy, gap, w) => {
    out.push(`<defs>${hatch(`${uid}-hatch`, gap, w)}</defs>`);
    out.push(`<path d="${area(polygons.accessible, fx, fy)}" fill="${AREA.accessible}" fill-rule="evenodd"/>`);
    out.push(`<path d="${area(polygons.nonAccessible, fx, fy)}" fill="url(#${uid}-hatch)" fill-rule="evenodd"/>`);
  };
  const drawCatchments = (fx, fy) => {
    if (!hooks) return;
    out.push(`<style>.${uid}-a path{fill:${C.ink};fill-opacity:0}.${uid}-a:hover path,svg.hl .${uid}-a.on path{fill-opacity:0.14}svg.hl .${uid}-a.on{opacity:1}</style>`);
    for (const [id, polys] of Object.entries(catchments)) {
      const s = byId.get(id);
      if (!s) continue;
      out.push(`<g class="${uid}-a" data-kind="area" data-tip="${esc(s.name)}" data-name="${esc(s.short)}" data-lines="${s.lines.join(' ')}" data-ada="${s.ada ? 1 : 0}" data-keys="${keys(s)}" data-detail="${esc(detail(s))}"><path d="${area(polys, fx, fy)}" fill-rule="evenodd"/></g>`);
    }
  };
  const drawGrid = (xs, ys, X, Y, x0, x1, y0, y1) => {
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
    plate: 'III',
    chapter: 'THE GRID',
    day: 3,
    theme: 'Polygons',
    title: 'The Accessible City',
    subtitle: 'A half-mile walk to every ‘L’ station: solid to accessible stations (elevator or ramp to every platform), hatched to non-accessible only.',
  }));

  // ---------- main map: plotted in miles, top-left on the plate's text margin ----------
  // The extent is Plate II's: Evanston to 138th Street, the city from Cumberland to the lake.
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
  const colX = fx1 + 6 + labelLen; // right edge of the right-hand label column
  const labelTop = fy0 - 6 - labelLen; // top line of the rotated grid labels
  const hatchMap = isMap ? [4.2, 0.8] : [3.2, 0.6];

  if (isPlate || isMap) {
    out.push(`<defs><clipPath id="${uid}-map"><rect x="${fx0}" y="${fy0}" width="${fx1 - fx0}" height="${fy1 - fy0}"/></clipPath></defs>`);
    out.push(`<g clip-path="url(#${uid}-map)">`);
    if (boundary.length) out.push(`<path d="${city(X, Y)}" fill="${C.ground}" fill-rule="evenodd"/>`);
    drawAreas(X, Y, ...hatchMap);
    drawGrid(g.xs, g.ys, X, Y, fx0, fx1, fy0, fy1);
    drawCatchments(X, Y);
    out.push('</g>');
    // grid labels outside the map, as on Plate I. State and Madison are bold ink.
    const gridLabel = (v) => (v === 0 ? { fill: C.ink, weight: 600 } : { fill: C.pencil });
    for (const x of g.xs) out.push(text(X(x) + gl * 0.35, labelTop, formatAddress(x, 'x'), { size: gl, spacing: 0.4, rotate: -90, anchor: 'end', ...gridLabel(x) }));
    for (const y of g.ys) out.push(text(colX, Y(y) + gl * 0.35, formatAddress(y, 'y'), { size: gl, spacing: 0.4, anchor: 'end', ...gridLabel(y) }));

    // inset outline on the main map; on the page the inset is cropped, so the page moves this
    // outline to the cropped extent (data-inset-frame; y of Madison in data-y0)
    out.push(`<rect${hooks ? ` data-inset-frame data-y0="${+Y(0).toFixed(2)}"` : ''} x="${X(insetBox.west)}" y="${Y(insetBox.north)}" width="${X(insetBox.east) - X(insetBox.west)}" height="${Y(insetBox.south) - Y(insetBox.north)}" fill="none" stroke="${C.ink}" stroke-width="0.6" stroke-dasharray="2 2"/>`);

    // stations inside the extent
    const shown = stations.filter(inBox(ext));
    for (const s of shown) out.push(station(s, X(s.x), Y(s.y), 3.2));

    // labels for the non-accessible stations whose catchments hold the most residents near
    // non-accessible stations only,
    // outside the inset (it labels its own)
    const ls = 7.5 * T;
    const LEFT = new Set(['40650']); // North/Clybourn: the stations east of it are crowded
    for (const s of shown.filter((d) => !d.ada && d.nearNonAccessible >= 1500 && !inInset(d))) {
      const px = X(s.x), py = Y(s.y);
      // the Forest Park branch runs east-west, so its names run down at 55°, as on Plate I
      const fpBranch = s.lines.includes('Blue') && s.y < 0 && s.y > -1200;
      const t = fpBranch
        ? text(px + 3, py + 9, s.short, { size: ls, fill: C.ink, rotate: 55, halo: C.ground })
        : LEFT.has(s.id)
          ? text(px - 7, py + 2.6, s.short, { size: ls, fill: C.ink, anchor: 'end', halo: C.ground })
          : text(px + 7, py + 2.6, s.short, { size: ls, fill: C.ink, halo: C.ground });
      out.push(tag(s, 'perm-label', t));
    }
    if (hooks) for (const s of shown) out.push(hlLabel(s, X(s.x), Y(s.y), ls));

    // mile ruler: four grid cells, ticks on the grid lines, in the bottom row of cells
    const rx = X(ext.west + 800), ry = Y(ext.south) - k * 0.35;
    out.push(`<line x1="${rx}" x2="${rx + 4 * k}" y1="${ry}" y2="${ry}" stroke="${C.ink}" stroke-width="1.2"/>`);
    for (let i = 0; i <= 4; i++) out.push(`<line x1="${rx + i * k}" x2="${rx + i * k}" y1="${ry - (i % 4 === 0 ? 6 : 4)}" y2="${ry}" stroke="${C.ink}" stroke-width="1.2"/>`);
    out.push(text(rx, ry - 9, '0', { size: 7.5 * T, anchor: 'middle' }));
    out.push(text(rx + 4 * k, ry - 9, '4 MI', { size: 7.5 * T, anchor: 'middle' }));

    // legend: on the plate one line under the subtitle; on the page in a box over the mile ruler,
    // in the map's empty south-west corner
    const lgs = 9 * T;
    const swatch = (fill) => `<rect x="-6" y="-5" width="12" height="10" fill="${fill}"/>`;
    const legend = [
      ['head', 'Half-mile walk'],
      [`<defs>${hatch(`${uid}-lh`, hatchMap[0], hatchMap[1])}</defs>${swatch(C.ground)}${swatch(AREA.accessible)}`, 'to an accessible station'],
      [`${swatch(C.ground)}${swatch(`url(#${uid}-lh)`)}`, 'to non-accessible stations only'],
      [stationMark(0, 0, true, 3.4), 'Vertically accessible'],
      [stationMark(0, 0, false, 3.4), 'Non-accessible'],
      ...(boundary.length ? [[swatch(C.ground), 'City of Chicago']] : []),
    ];
    if (isPlate) {
      let lx = 60;
      const y = 203;
      legend.forEach(([mark, label]) => {
        if (mark === 'head') {
          out.push(text(lx, y, `${label}:`, { size: lgs, fill: C.pencil }));
          lx += textWidth(`${label}:`, lgs) + 6;
          return;
        }
        out.push(`<g transform="translate(${lx + 6} ${y - lgs * 0.35})">${mark}</g>`);
        out.push(text(lx + 17, y, label, { size: lgs, fill: C.pencil }));
        lx += 17 + textWidth(label, lgs) + 9;
      });
    } else {
      // the stations after the walksheds, a little apart
      out.push(legendBox([...legend.slice(0, 3), ['gap'], ...legend.slice(3)], { x: rx, bottom: Y(ext.south) - k, k, size: lgs }));
    }
  }

  if (isMap) {
    return svg(out.join(''), { label: mapLabel(summary), viewBox: `60 184 ${Math.ceil(colX + 4 - 60)} 1114`, align: 'xMinYMin meet' })
      .replace('<svg ', `<svg data-top="${labelTop - 184}" data-bottom="${fy1 - 184}" data-ftop="${+(fy0 - 184).toFixed(2)}" data-ppm="${+k.toFixed(3)}" `);
  }

  // ---------- margin column (plate), chart or inset (day page) ----------
  const mx = isPlate ? Math.round(colX + 38) : isChart ? 2 : 0;
  const cw = isChart ? 390 : W_COL; // column width
  const title = (y, str) => out.push(text(mx, y, str, { size: 10.5 * T, weight: 600, spacing: 1 }));
  const ns = 10.5, nh = 14;
  const note = (y, str) => out.push(text(mx, y, str, { size: ns, font: SERIF, italic: true, fill: C.pencil }));
  let uy = 0; // running y of the margin column

  if (isPlate || isChart) {
    // Residents near each line: a line-name box, then a bar as long as the residents within a
    // half-mile walk of its stations, hatched for those near non-accessible stations only (drawn first, from the
    // left, so lines compare on one baseline), solid for the rest; then both counts.
    const cs = isChart ? 8 * T : 8;
    const row = isChart ? 21 : 15;
    const bar = isChart ? { x: 74, w: 150, h: 10 } : { x: 62, w: 112, h: 7.5 };
    const numW = isChart ? 104 : 84; // the non-accessible-only column, right of the near column
    if (isChart) {
      uy = Math.round(cs + 2); // the page sets the title and notes in HTML above the rows
    } else {
      uy = Math.round(labelTop + 10.5 * T * 0.72); // the title's cap sits on the grid labels' top line
      title(uy, 'RESIDENTS NEAR EACH LINE');
      const noteLines = wrap(CHART_NOTE, Math.floor(cw / (ns * 0.45)));
      noteLines.forEach((l, i) => note(uy + (i + 1) * nh + 4, l));
      uy += noteLines.length * nh + 24;
    }
    const hs = cs * 0.8;
    out.push(text(mx + cw - numW, uy - row * 0.2, 'ALL', { size: hs, anchor: 'end', spacing: 0.4, fill: C.pencil }));
    out.push(text(mx + cw, uy - row * 0.2, 'NON-ACCESSIBLE ONLY', { size: hs, anchor: 'end', spacing: 0.4, fill: C.pencil }));
    uy += row * 0.8;
    const rows = [...byLine].sort((a, b) => b.nearNonAccessible - a.nearNonAccessible || b.near - a.near);
    const maxNear = Math.max(...rows.map((l) => l.near));
    const bx = (v) => mx + bar.x + (v / maxNear) * bar.w;
    out.push(`<defs>${hatch(`${uid}-ch`, isChart ? 3.4 : 2.8, isChart ? 0.8 : 0.6)}</defs>`);
    for (const l of rows) {
      const top = l === rows[0];
      if (hooks) out.push(`<g data-hl="${l.line}"><rect x="${mx - 4}" y="${uy - row + 4}" width="${cw + 8}" height="${row}" fill="transparent"/>`);
      const bw = textWidth(l.line.toUpperCase(), cs, { weight: 600, spacing: 0.6 }) + 10;
      out.push(`<rect x="${mx}" y="${uy - cs * 0.82 - 3}" width="${bw}" height="${cs + 5}" rx="1.5" fill="${mode === 'color' ? LINES[l.line] : soft ? C.rule : C.fog}"/>`);
      out.push(text(mx + 5, uy, l.line.toUpperCase(), { size: cs, weight: 600, spacing: 0.6, fill: mode === 'color' ? '#FFFFFF' : markInk }));
      const by = uy - cs * 0.36 - bar.h / 2;
      out.push(`<rect x="${mx + bar.x}" y="${by.toFixed(1)}" width="${(bx(l.near) - mx - bar.x).toFixed(1)}" height="${bar.h}" fill="${AREA.accessible}"/>`);
      if (l.nearNonAccessible) {
        out.push(`<rect x="${mx + bar.x}" y="${by.toFixed(1)}" width="${(bx(l.nearNonAccessible) - mx - bar.x).toFixed(1)}" height="${bar.h}" fill="${C.ground}"/>`);
        out.push(`<rect x="${mx + bar.x}" y="${by.toFixed(1)}" width="${(bx(l.nearNonAccessible) - mx - bar.x).toFixed(1)}" height="${bar.h}" fill="url(#${uid}-ch)" stroke="${C.ink}" stroke-width="0.6"/>`);
      }
      out.push(text(mx + cw - numW, uy, hundreds(l.near), { size: cs, anchor: 'end', fill: C.pencil }));
      out.push(text(mx + cw, uy, l.nearNonAccessible ? hundreds(l.nearNonAccessible) : '0', { size: cs, anchor: 'end', fill: top ? C.ink : C.pencil, weight: top ? 600 : 400 }));
      if (hooks) out.push('</g>');
      uy += row;
    }
    // all lines together: each resident once
    const ry = uy - row + 7;
    out.push(`<line x1="${mx}" x2="${mx + cw}" y1="${ry}" y2="${ry}" stroke="${C.ink}" stroke-width="0.6" stroke-dasharray="2 2"/>`);
    uy = ry + cs + 6;
    out.push(text(mx, uy, 'ALL LINES, EACH RESIDENT ONCE', { size: cs * 0.85, spacing: 0.3, fill: C.pencil }));
    out.push(text(mx + cw - numW, uy, hundreds(summary.near), { size: cs, anchor: 'end', fill: C.ink }));
    out.push(text(mx + cw, uy, hundreds(summary.nearNonAccessible), { size: cs, anchor: 'end', fill: C.ink, weight: 600 }));
    if (isChart) {
      return svg(out.join(''), { label: 'Residents within a half-mile walk of each ‘L’ line, and how many have no accessible station within a step-free half mile.', viewBox: `0 0 ${cw + 6} ${Math.ceil(uy + 6)}`, align: 'xMinYMin meet' });
    }
  }

  // Inset, in miles like the main map, with a grid line every half mile. The page's inset is drawn
  // tall, centred on the inset box, so the page can crop it to fit; data-north gives the miles at
  // the top edge.
  const cy = (insetBox.north + insetBox.south) / 2;
  const box = isInset ? { ...insetBox, north: cy + 5200, south: cy - 5200 } : insetBox;
  const lbm = miles(box);
  const iw = isInset ? 390 : W_COL;
  const ki = iw / (lbm.east - lbm.west); // px per mile
  const ty = uy + 30;
  if (isPlate) {
    title(ty, `INSET · ${INSET_TITLE}`);
    note(ty + nh + 4, `Shown at ×${(ki / k).toFixed(1)} the scale of the main map.`);
    note(ty + 2 * nh + 4, `Largest area near non-accessible stations only: ${fmt(Math.round(data.inset.residents / 1000) * 1000)} residents.`);
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
  drawAreas(IX, IY, isInset ? 4.6 : 3.6, isInset ? 0.9 : 0.7);
  const half = [];
  for (let m = Math.ceil(lbm.west * 2) / 2; m <= lbm.east; m += 0.5) half.push(m);
  const halfY = [];
  for (let m = Math.ceil(lbm.south * 2) / 2; m <= lbm.north; m += 0.5) halfY.push(m);
  drawGrid(half, halfY, IXm, IYm, inset.x, inset.x + inset.w, inset.y, inset.y + inset.h);
  drawCatchments(IX, IY);
  const insetStations = stations.filter(inBox(box));
  for (const s of insetStations) out.push(station(s, IX(s.x), IY(s.y), 4.2));
  // labels for the non-accessible stations, as on Plate I; the page names the rest on hover
  for (const s of insetStations.filter((d) => inInset(d) && !d.ada)) {
    const [dx, dy, anchor] = INSET_OFFSET[s.id] ?? [8, 3, 'start'];
    out.push(tag(s, 'perm-label', text(IX(s.x) + dx, IY(s.y) + dy, s.short, { size: 7.5 * TI, anchor, halo: C.ground })));
  }
  if (hooks) for (const s of insetStations) out.push(hlLabel(s, IX(s.x), IY(s.y), 7.5 * TI));
  out.push('</g>');
  if (isPlate) out.push(`<rect x="${inset.x}" y="${inset.y}" width="${inset.w}" height="${inset.h}" fill="none" stroke="${C.ink}" stroke-width="0.8"/>`);

  if (isInset) {
    return svg(out.join(''), { label: `${INSET_TITLE}: the largest area near non-accessible stations only, around the Blue Line's Division, Chicago and Damen stations.`, viewBox: `0 0 ${inset.w} ${inset.h}`, align: 'xMidYMid slice' })
      .replace('<svg ', `<svg data-ppm="${+ki.toFixed(3)}" data-north="${+lbm.north.toFixed(3)}" `);
  }

  // plate: Findings close the column, as on Plates I and II
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
    ['SOURCE', `CTA List of 'L' Stops · Chicago Data Portal · ${data.source.id} · pulled ${data.asOf}`],
    ['WALK', `OpenStreetMap walk network (OSMnx rules), Geofabrik extract of ${data.osm.extract}; half mile = ${Math.round(data.walkM)} m`],
    ['', `Step-free: ${fmt(data.network.stairs)} stair segments and ${data.network.wheelchairNo} ways tagged wheelchair=no removed; ${data.network.elevators} mapped elevators and ramps kept`],
    ['PEOPLE', `2020 Census blocks (P.L. 94-171), ${fmt(summary.residents)} residents, placed by the walk from each block's center`],
    ['METHOD', 'Walks run on the street network, not as circles; accessible as on Plate I: elevator or ramp to every platform'],
    ['CAVEAT', 'OSM does not record every missing curb ramp, so the step-free walk is an upper bound; the ADA'],
    ['', 'flag lags CTA (110 of 146 accessible, Aug 2026) and still marks Austin (Green) non-accessible'],
    ['LIMITS', 'City of Chicago, Boundaries – City · qqq8-j68g; walks clipped to the city limits'],
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
export const INSET_TITLE = 'WEST TOWN AND WICKER PARK';
export const CHART_NOTE = 'Residents within a half-mile walk of the line’s stations · Hatched: near non-accessible stations only, with no accessible station within a step-free half mile · A resident near two lines counts on both';
// inset labels: [dx, dy, anchor], hand-placed to avoid collisions
const INSET_OFFSET = {
  '40650': [-8, 3, 'end'], // North/Clybourn: Clybourn runs into the stations east of it
};

const mapLabel = (summary) =>
  `Plate III, The Accessible City: ${Math.round(summary.nearShare * 100)}% of Chicagoans live within a half-mile walk of an ‘L’ station, ${Math.round(summary.nearAccessibleShare * 100)}% within a step-free walk of an accessible one.`;

function stationMark(x, y, stepFree, r, color = C.ink) {
  return stepFree
    ? `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`
    : `<circle cx="${x}" cy="${y}" r="${r}" fill="${C.paper}" stroke="${color}" stroke-width="${Math.max(1.1, r * 0.36)}"/>`;
}
