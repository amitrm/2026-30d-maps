// Plate I · The Doors · Day 01 Points
import { W, H, C, LINES, SERIF, MONO, esc, text, paragraph, wrap, frame, svg } from '../lib/plate.js';
import { gridLines, formatAddress, toMiles } from '../lib/grid.js';

// variant 'plate': the full 1080 x 1350 plate (export, download).
// variant 'map': the map alone, with hover hooks, for the day page's left column.
// variant 'chart': Stations by Line, with hover hooks, for the day page's middle column.
// variant 'inset': the Loop inset alone, drawn tall around the Loop so the page can crop it.
// mode 'color' tints each station by its line; interchange stations stay ink (map, inset and chart).
// data.boundary: city boundary rings in address units (reference/city-boundary.json).
// data.sequences: station order per line from CTA GTFS (reference/cta-line-sequences.json).
export function renderDay01(data, { mode = 'gray', variant = 'plate' } = {}) {
  const { stations, byLine, summary, boundary = [], sequences = {} } = data;
  const out = [];
  const isPlate = variant === 'plate';
  const isMap = variant === 'map';
  const isChart = variant === 'chart';
  const isInset = variant === 'inset';
  const hooks = isMap || isChart || isInset; // hover hooks for the day page
  const uid = `d01-${variant}-${mode}`; // clip ids stay unique when both modes share a page
  // Label scale: the day page shows the map at about 0.75x, so its labels run larger; the chart
  // fills its own width, so its type is set larger again. Inset labels scale less: the Loop is dense.
  const T = isMap ? 1.3 : isChart ? 1.3 : 1.15;
  const TI = isInset ? 1.35 : 1.15;
  // On the day page in grayscale, marks and line-name boxes step back from full ink so they don't
  // overpower the reading; the printed plate keeps full ink.
  const soft = hooks && mode === 'gray';
  const markInk = soft ? '#5A5853' : C.ink;
  const tint = (lines) => (mode === 'color' && lines.length === 1 ? LINES[lines[0]] : mode === 'color' ? C.ink : markInk);
  const keys = (s) => s.lines.join(' ');
  // hover group: data-keys (the station's lines) only on map and inset marks
  const hover = (s, lines, inner, keyed) =>
    hooks ? `<g data-id="${s.id}" data-tip="${esc(s.name)}" data-name="${esc(s.short)}" data-lines="${lines.join(' ')}" data-ada="${s.ada ? 1 : 0}"${keyed ? ` data-keys="${keys(s)}"` : ''}>${inner}</g>` : inner;
  const station = (s, x, y, r) => {
    const mark = stationMark(x, y, s.ada, r, tint(s.lines));
    const hit = hooks ? `<circle cx="${x}" cy="${y}" r="${r + 5}" fill="transparent"/>` : '';
    return hover(s, s.lines, hit + mark, true);
  };
  // class + data-keys on a label, for the page's line highlight
  const tag = (s, cls, str) => (hooks ? str.replace('<text ', `<text class="${cls}" data-id="${s.id}" data-keys="${keys(s)}" `) : str);
  // hidden label for every station, shown by the page when one of its lines is highlighted
  // hover labels run up and to the right at 40°, so names along east-west stretches don't collide
  const hlLabel = (s, x, y, size) => tag(s, 'hl-label', text(x + 6, y - 4, s.short, { size, fill: C.ink, halo: C.ground, rotate: -40 }));
  const ring = (r, fx, fy) => 'M' + r.map(([x, y]) => `${fx(x).toFixed(1)},${fy(y).toFixed(1)}`).join('L') + 'Z';
  const city = (fx, fy) => boundary.map((r) => ring(r, fx, fy)).join('');
  const miles = (b) => ({ west: toMiles(b.west, 'x'), east: toMiles(b.east, 'x'), south: toMiles(b.south, 'y'), north: toMiles(b.north, 'y') });
  const loopBox = { west: -1900, east: 900, south: -1500, north: 1050 };
  const inBox = (b) => (s) => s.x >= b.west && s.x <= b.east && s.y >= b.south && s.y <= b.north;
  const inLoop = inBox(loopBox);

  if (isPlate) out.push(frame({
    plate: 'I',
    chapter: 'THE GRID',
    day: 1,
    theme: 'Points',
    title: 'The Doors',
    subtitle: 'Every ‘L’ station as an entrance. A dot is vertically accessible; a ring is not. Shading marks the City of Chicago.',
  }));

  // ---------- main map: plotted in miles, top-left on the plate's text margin ----------
  // The extent (address units) sits on grid lines around every station; the city fill is cut at its edges.
  const ext = { west: -13600, east: 1600, south: -10800, north: 11200 };
  const mi = miles(ext);
  const field = isMap ? { x: 60, y: 250, w: 760, h: 1040 } : { x: 60, y: 262, w: 575, h: 1000 };
  const k = Math.min(field.w / (mi.east - mi.west), field.h / (mi.north - mi.south)); // px per mile
  const X = (x) => field.x + (toMiles(x, 'x') - mi.west) * k;
  const Y = (y) => field.y + (mi.north - toMiles(y, 'y')) * k;
  const fx0 = X(ext.west), fx1 = X(ext.east), fy0 = Y(ext.north), fy1 = Y(ext.south);
  const g = gridLines(ext);
  const gl = 8 * T;
  const labelLen = 7 * (gl * 0.6 + 0.4); // longest grid label, seven characters
  const colX = fx1 + 6 + labelLen; // right edge of the right-hand label column
  const labelTop = fy0 - 6 - labelLen; // top line of the rotated grid labels

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
    out.push('</g>');
    // grid labels outside the map, one per line, each centered on its line: rotated along the top,
    // top-aligned, and a right-aligned column down the right. State and Madison are bold ink.
    const gridLabel = (v) => (v === 0 ? { fill: C.ink, weight: 600 } : { fill: C.pencil });
    for (const x of g.xs) {
      // rotated -90 with anchor 'end': each label ends on a common top line and runs down toward the map
      out.push(text(X(x) + gl * 0.35, labelTop, formatAddress(x, 'x'), { size: gl, spacing: 0.4, rotate: -90, anchor: 'end', ...gridLabel(x) }));
    }
    for (const y of g.ys) {
      out.push(text(colX, Y(y) + gl * 0.35, formatAddress(y, 'y'), { size: gl, spacing: 0.4, anchor: 'end', ...gridLabel(y) }));
    }

    // Loop inset outline on the main map
    out.push(`<rect x="${X(loopBox.west)}" y="${Y(loopBox.north)}" width="${X(loopBox.east) - X(loopBox.west)}" height="${Y(loopBox.south) - Y(loopBox.north)}" fill="none" stroke="${C.ink}" stroke-width="0.6" stroke-dasharray="2 2"/>`);

    // stations
    for (const s of stations) out.push(station(s, X(s.x), Y(s.y), 3.6));

    // labels for non-accessible stations outside the inset
    const ls = 7.5 * T;
    for (const s of stations.filter((d) => !d.ada && !inLoop(d))) {
      const px = X(s.x), py = Y(s.y);
      const fpBranch = s.lines.includes('Blue') && s.y < 0 && s.y > -1200;
      const lakeBranch = s.lines.includes('Green') && s.y > 0 && s.y < 800;
      let t;
      if (fpBranch) t = text(px + 3, py + 9, s.short, { size: ls, fill: C.ink, rotate: 55 });
      else if (lakeBranch) t = text(px + 3, py - 8, s.short, { size: ls, fill: C.ink, rotate: -55 });
      else if (s.id === '40650') t = text(px + 5, py - 7, s.short, { size: ls, fill: C.ink, rotate: -55 }); // North/Clybourn
      else if (['40590', '40570', '40320'].includes(s.id)) t = text(px - 8, py + 2.6, s.short, { size: ls, fill: C.ink, anchor: 'end' }); // Damen, California, Division (Blue)
      else t = text(px + 8, py + 2.6, s.short, { size: ls, fill: C.ink });
      out.push(tag(s, 'perm-label', t));
    }
    if (hooks) for (const s of stations) out.push(hlLabel(s, X(s.x), Y(s.y), ls));

    // mile ruler: four grid cells, ticks on the grid lines, in the bottom row of cells
    const rx = X(ext.west + 800), ry = Y(ext.south) - k * 0.35;
    out.push(`<line x1="${rx}" x2="${rx + 4 * k}" y1="${ry}" y2="${ry}" stroke="${C.ink}" stroke-width="1.2"/>`);
    for (let i = 0; i <= 4; i++) out.push(`<line x1="${rx + i * k}" x2="${rx + i * k}" y1="${ry - (i % 4 === 0 ? 6 : 4)}" y2="${ry}" stroke="${C.ink}" stroke-width="1.2"/>`);
    out.push(text(rx, ry - 9, '0', { size: 7.5 * T, anchor: 'middle' }));
    out.push(text(rx + 4 * k, ry - 9, '4 MI', { size: 7.5 * T, anchor: 'middle' }));

    // legend: on the page, stacked in the map's empty north-west corner with a paper knock-out;
    // on the plate, one line under the subtitle, left-aligned with it
    const lgs = 9 * T, llh = 22;
    const legend = [
      [stationMark(0, 0, true, 3.6), 'Vertically accessible'],
      [stationMark(0, 0, false, 3.6), 'Non-accessible'],
      ...(boundary.length ? [[`<rect x="-5" y="-5" width="10" height="10" fill="${C.ground}"/>`, 'City of Chicago']] : []),
    ];
    let lx = 65;
    legend.forEach(([mark, label], i) => {
      if (isPlate) {
        const y = 203;
        out.push(`<g transform="translate(${lx} ${y - lgs * 0.35})">${mark}</g>`);
        out.push(text(lx + 10, y, label, { size: lgs, fill: C.pencil }));
        lx += 10 + label.length * lgs * 0.6 + 22;
        return;
      }
      const y = fy0 + 10 + llh * (i + 0.5);
      out.push(`<g transform="translate(${fx0 + 12} ${y})">${mark}</g>`);
      out.push(text(fx0 + 24, y + lgs * 0.35, label, { size: lgs, halo: C.paper }));
    });
  }

  if (isMap) {
    return svg(out.join(''), { label: mapLabel(summary), viewBox: `60 184 ${Math.ceil(colX + 4 - 60)} 1114`, align: 'xMinYMin meet' })
      .replace('<svg ', `<svg data-top="${labelTop - 184}" data-bottom="${fy1 - 184}" data-ppm="${+k.toFixed(3)}" `);
  }

  // ---------- margin column (plate), chart or inset (day page) ----------
  const mx = isPlate ? Math.round(colX + 38) : isChart ? 2 : 0;
  const nl = isChart ? 17 : 14;
  const gs = 9 * T;
  // section titles in bold ink, with their notes underneath in pencil
  const title = (y, str) => out.push(text(mx, y, str, { size: 10.5 * T, weight: 600, spacing: 1 }));
  // notes under section titles: serif italic in pencil, like the page's key line above the map
  const ns = isChart ? 15.5 : 10.5, nh = isChart ? 20 : 14;
  const note = (y, str) => out.push(text(mx, y, str, { size: ns, font: SERIF, italic: true, fill: C.pencil }));
  let uy = 0; // running y of the margin column

  if (isPlate || isChart) {
    // unit chart by line: name, count and terminals, then one circle per station in route order
    const byId = new Map(stations.map((d) => [d.id, d]));
    const gap2 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    // The schedule's segments (main pattern, then branches), keeping this line's stations. A station
    // the schedule skips (State/Lake in the current feed) goes where it adds the least distance.
    const routeOrder = (line) => {
      const segs = (sequences[line] ?? []).map((seg) => seg.filter((id) => byId.get(id)?.lines.includes(line)));
      if (!segs.length) segs.push([]);
      const placed = new Set(segs.flat());
      for (const st of stations.filter((d) => d.lines.includes(line) && !placed.has(d.id))) {
        let best = { seg: 0, at: segs[0].length, cost: Infinity };
        segs.forEach((seg, si) => {
          for (let i = 0; i <= seg.length; i++) {
            const a = byId.get(seg[i - 1]), b = byId.get(seg[i]);
            const cost = (a ? gap2(a, st) : 0) + (b ? gap2(st, b) : 0) - (a && b ? gap2(a, b) : 0);
            if (cost < best.cost) best = { seg: si, at: i, cost };
          }
        });
        segs[best.seg].splice(best.at, 0, st.id);
      }
      return segs.filter((seg) => seg.length).map((seg) => seg.map((id) => byId.get(id)));
    };
    const cs = 9 * T;
    const dot = isChart ? { r: 4.4, gap: 11.85, row: 60, drop: 20 } : { r: 3.2, gap: 9, row: 48, drop: 16 };
    const cw = isChart ? 390 : 300; // column width
    if (isChart) {
      uy = Math.round(cs * 0.82 + 4); // the page sets the title and notes in HTML above the rows
    } else {
      uy = Math.round(labelTop + 10.5 * T * 0.72); // the title's cap sits on the grid labels' top line
      title(uy, 'NON-ACCESSIBLE STATIONS BY LINE');
      // notes: one running text, word-wrapped to the column (serif italic, about 0.45 em a character)
      const budget = Math.floor(cw / (ns * 0.45));
      const noteLines = wrap('Route order from the outer terminal · Gap indicates a branch · Interchange stations count once per line' + (mode === 'color' ? ', marked in black' : ''), budget);
      noteLines.forEach((l, i) => note(uy + (i + 1) * nh + 4, l));
      uy += noteLines.length * nh + 30; // 4 below the last note, 26 to the first row
    }
    const sorted = [...byLine].sort((a, b) => b.noStepFree - a.noStepFree);
    const rowEnd = mx + 32 * dot.gap + 2 * dot.r;
    for (const l of sorted) {
      const isBlue = l.line === 'Blue';
      const segs = routeOrder(l.line);
      const first = segs[0][0], last = segs[0].at(-1);
      if (hooks) out.push(`<g data-hl="${l.line}"><rect x="${mx - 4}" y="${uy - 15}" width="${rowEnd - mx + 8}" height="${dot.row - 6}" fill="transparent"/>`);
      // line name in a box: fog with ink text, or the line's color with white text in color mode. On the
      // day page the name and count are set at the route label's size, a step below the chart's title.
      const ns = isChart ? 8 * T : cs;
      const bw = l.line.length * (ns * 0.6 + 0.6) + 10;
      out.push(`<rect x="${mx}" y="${uy - ns * 0.82 - 3}" width="${bw}" height="${ns + 5}" rx="1.5" fill="${mode === 'color' ? LINES[l.line] : soft ? C.rule : C.fog}"/>`);
      out.push(text(mx + 5, uy, l.line.toUpperCase(), { size: ns, weight: 600, spacing: 0.6, fill: mode === 'color' ? '#FFFFFF' : markInk }));
      out.push(text(mx + bw + 8, uy, `${l.noStepFree}/${l.total}`, { size: ns, weight: isBlue ? 600 : 400, fill: isBlue ? markInk : C.pencil }));
      out.push(text(rowEnd, uy, `${first.short} → ${inLoop(last) ? 'Loop' : last.short}`, { size: 8 * T, anchor: 'end', fill: C.pencil }));
      let cx = mx + dot.r;
      segs.forEach((seg, si) => {
        if (si) cx += dot.gap * 0.9;
        for (const d of seg) {
          out.push(hover(d, [l.line], stationMark(cx, uy + dot.drop, d.ada, dot.r, tint(d.lines)), false));
          cx += dot.gap;
        }
      });
      if (hooks) out.push('</g>');
      uy += dot.row;
    }
    if (isChart) {
      const end = Math.ceil(uy - dot.row + dot.drop + dot.r + 4);
      return svg(out.join(''), { label: 'Non-accessible stations by line, in route order from the outer terminal.', viewBox: `0 0 ${cw + 6} ${end}`, align: 'xMinYMin meet' });
    }
  }

  // Loop inset, in miles like the main map, with a grid line every half mile. The page's inset is
  // drawn tall around the Loop (north and south of the core box) so the page can crop it to fit.
  const box = isInset ? { ...loopBox, north: 5600, south: -6000 } : loopBox;
  const lb = miles(box);
  const iw = isInset ? 390 : 300;
  const ki = iw / (lb.east - lb.west); // px per mile
  const ty = uy + 14;
  if (isPlate) {
    title(ty, 'INSET · THE LOOP AND RIVER NORTH');
    note(ty + nl + 4, `Shown at ×${(ki / k).toFixed(1)} the scale of the main map.`);
  }
  const inset = isInset ? { x: 0, y: 0, w: iw, h: Math.round((lb.north - lb.south) * ki) } : { x: mx, y: ty + nl + 16, w: iw, h: Math.round((lb.north - lb.south) * ki) };
  out.push(`<defs><clipPath id="${uid}-inset"><rect x="${inset.x}" y="${inset.y}" width="${inset.w}" height="${inset.h}"/></clipPath></defs>`);
  out.push(`<rect x="${inset.x}" y="${inset.y}" width="${inset.w}" height="${inset.h}" fill="${C.paper}"/>`);
  const IXm = (m) => inset.x + (m - lb.west) * ki;
  const IYm = (m) => inset.y + (lb.north - m) * ki;
  const IX = (x) => IXm(toMiles(x, 'x'));
  const IY = (y) => IYm(toMiles(y, 'y'));
  out.push(`<g clip-path="url(#${uid}-inset)">`);
  if (boundary.length) out.push(`<path d="${city(IX, IY)}" fill="${C.ground}" fill-rule="evenodd"/>`);
  for (let m = Math.ceil(lb.west * 2) / 2; m <= lb.east; m += 0.5) {
    const major = m === 0;
    out.push(`<line x1="${IXm(m)}" x2="${IXm(m)}" y1="${inset.y}" y2="${inset.y + inset.h}" stroke="${major ? C.pencil : C.grid}" stroke-width="${major ? 0.8 : 0.6}"/>`);
  }
  for (let m = Math.ceil(lb.south * 2) / 2; m <= lb.north; m += 0.5) {
    const major = m === 0;
    out.push(`<line x1="${inset.x}" x2="${inset.x + inset.w}" y1="${IYm(m)}" y2="${IYm(m)}" stroke="${major ? C.pencil : C.grid}" stroke-width="${major ? 0.8 : 0.6}"/>`);
  }
  out.push('</g>');
  // plate: stations and labels stay inside the inset's frame (clipped), and the frame is drawn last
  if (isPlate) out.push(`<g clip-path="url(#${uid}-inset)">`);
  // State and Madison: the page crops the tall inset, so State is labeled at the core box's south edge
  out.push(text(IX(0) + 3, isInset ? IY(loopBox.south) - 5 : inset.y + inset.h - 5, 'STATE', { size: 7 * TI, fill: C.ink, weight: 600 }));
  out.push(text(inset.x + 4, IY(0) - 3, 'MADISON', { size: 7 * TI, fill: C.ink, weight: 600 }));
  const insetStations = stations.filter(inBox(box));
  for (const s of insetStations) out.push(station(s, IX(s.x), IY(s.y), 4.2));
  // labels for non-accessible stations in the inset (hand-placed offsets to avoid collisions)
  const OFFSET = {
    '40260': [8, -6], // State/Lake
    '40370': [-10, -9, 'end'], // Washington (Blue)
    '40790': [-8, 3, 'end', 'Monroe (Blue)'], // Monroe (Blue)
    '41090': [8, 3, 'start', 'Monroe (Red)'], // Monroe (Red)
    '40680': [8, 3], // Adams/Wabash
    '40160': [-8, 2, 'end'], // LaSalle/Van Buren
    '41340': [8, 4], // LaSalle (Blue)
    '41490': [8, 4], // Harrison
    '40430': [0, 13, 'middle'], // Clinton (Blue)
    '40490': [8, 3], // Grand (Blue)
    '41410': [8, 3], // Chicago (Blue)
    '40470': [0, 13, 'middle'], // Racine
  };
  for (const s of insetStations.filter((d) => !d.ada)) {
    const [dx, dy, anchor, label] = OFFSET[s.id] ?? [8, 3];
    out.push(tag(s, 'perm-label', text(IX(s.x) + dx, IY(s.y) + dy, label ?? s.short, { size: 7.5 * TI, anchor: anchor ?? 'start', halo: C.ground })));
  }
  if (hooks) for (const s of insetStations) out.push(hlLabel(s, IX(s.x), IY(s.y), 7.5 * TI));
  if (isPlate) out.push('</g>', `<rect x="${inset.x}" y="${inset.y}" width="${inset.w}" height="${inset.h}" fill="none" stroke="${C.ink}" stroke-width="0.8"/>`);

  if (isInset) {
    return svg(out.join(''), { label: 'The Loop and River North: vertically accessible and non-accessible ‘L’ stations.', viewBox: `0 0 ${inset.w} ${inset.h}`, align: 'xMidYMid slice' })
      .replace('<svg ', `<svg data-ppm="${+ki.toFixed(3)}" `);
  }

  // plate: the page's Findings close the column, set like the other sections: the title, the
  // headline finding as its note, then the findings paragraphs (data.findings) in serif
  let fy = inset.y + inset.h + 40;
  title(fy, 'FINDINGS');
  for (const l of wrap(data.finding, Math.floor(300 / (ns * 0.45)))) note((fy += nh) + 4, l);
  fy += 10;
  const bs = 9.5, bh = 12.6;
  for (const para of data.findings ?? []) {
    for (const l of wrap(para, Math.floor(300 / (bs * 0.46)))) out.push(text(mx, (fy += bh), l, { size: bs, font: SERIF }));
    fy += 5;
  }

  // data ledger, under the map
  const lx = fx0;
  let dy = Math.round(fy1) + 36;
  out.push(text(lx, dy, 'DATA LEDGER', { size: 10.5 * T, weight: 600, spacing: 1 })); // as the section titles
  const ledger = [
    ['SOURCE', `CTA List of 'L' Stops · Chicago Data Portal · 8pix-ypme · pulled ${data.asOf}`],
    ['UNITS', `${summary.total} stations (map_id); ADA flag as published`],
    ['METHOD', 'Vertically accessible only if every platform is flagged accessible'],
    ['', 'Plotted in miles from State & Madison; grid lines labeled with address'],
    ['', 'numbers (800 per mile; 1,200 for the first mile south of Madison)'],
    ['CAVEAT', 'Flag lags CTA: 110 of 146 accessible (Aug 2026)'],
    ['', 'Austin (Green) reopened accessible Aug 2026; still flagged non-accessible'],
    ['LIMITS', 'City of Chicago, Boundaries – City · qqq8-j68g'],
    ['ORDER', `CTA GTFS${data.feedDate ? `, feed of ${data.feedDate}` : ''}; State/Lake (not scheduled) by position`],
    ['CTA', 'ASAP page; releases of 31 Jul 2024 and 7 Aug 2026'],
  ];
  dy += 20;
  for (const [kk, v] of ledger) {
    out.push(text(lx, dy, kk, { size: 8.5, fill: C.pencil, spacing: 0.6 }));
    out.push(text(lx + 64, dy, v, { size: 9.5, font: SERIF })); // as the findings paragraphs
    dy += 14;
  }

  return svg(out.join(''), { label: mapLabel(summary) });
}

const mapLabel = (summary) =>
  `Plate I, The Doors: ${summary.noStepFree} of ${summary.total} Chicago ‘L’ stations are not vertically accessible; ${summary.blueNoStepFree} are on the Blue Line.`;

function stationMark(x, y, stepFree, r, color = C.ink) {
  return stepFree
    ? `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`
    : `<circle cx="${x}" cy="${y}" r="${r}" fill="${C.paper}" stroke="${color}" stroke-width="${Math.max(1.1, r * 0.36)}"/>`;
}

