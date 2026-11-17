// Plate XV · From the End of the Line · Day 15 Inside out
import { C, SERIF, esc, text, textWidth, legendBox, wrap, frame, svg } from '../lib/plate.js';
import { gridLines, formatAddress, toMiles } from '../lib/grid.js';

// variant 'plate': the full 1080 x 1350 plate (export, download).
// variant 'map': the city shaded by door-to-door minutes by bus and train from 130th Street, where the
//   Red Line Extension will end; hover squares every half mile.
// variant 'chart': the city turned inside out, twice, at one scale: from 130th Street (top) and from the
//   Loop (below). Each quarter-mile point keeps its true direction from the start and sits as far out as
//   its minutes, so the minutes become circles and the square-mile grid bends. It fills the page's middle
//   column (the page has no inset). Hovering a square on the map lights the same square in both drawings.
// Minutes come from the notebook: data.mapClass (main map classes, lightly smoothed), data.start and
// data.loop (smoothed minutes on the quarter-mile lattice for the two drawings), data.cells (half-mile
// hover squares with unsmoothed minutes from each start).

// Seven classes split at the hour: three within it, four beyond (as the notebook's data.classes).
export const BREAKS = [30, 45, 60, 75, 90, 120];
// near -> far, dark to light in both modes. Colour: the Magenta palette, deep plum to pale pink;
// grayscale: about 10 L* apart
export const RAMP = {
  color: ['#632664', '#863B7A', '#A5538B', '#BD6E9B', '#D18CAB', '#E0ACBD', '#EDCCD3'],
  gray: ['#45423F', '#5E5B57', '#78756F', '#939089', '#AFADA6', '#CBC9C2', '#E6E4DE'],
};
export const CLASS_LABELS = ['Under 30', '30–45', '45–60', '60–75', '75–90', '90–120', '120 or more'];
const SHORT = ['Under 30', '30–45', '45–60', '60–75', '75–90', '90–120', '120+'];
const clsOf = (v) => BREAKS.filter((b) => v >= b).length;

export function renderDay15(data, { mode = 'gray', variant = 'plate' } = {}) {
  const { summary: s, boundary = [], lattice: L, points: P } = data;
  const out = [];
  const isPlate = variant === 'plate';
  const isMap = variant === 'map';
  const isChart = variant === 'chart';
  const hooks = isMap || isChart;
  const uid = `d15-${variant}-${mode}`;
  const T = hooks ? 1.3 : 1.15;
  const ramp = RAMP[mode] ?? RAMP.gray;
  const xs = Array.from({ length: L.nx }, (_, i) => +(L.x0 + i * L.step).toFixed(2));
  const ys = Array.from({ length: L.ny }, (_, j) => +(L.y0 + j * L.step).toFixed(2));
  const col = (x) => Math.round((x - L.x0) / L.step);
  const row = (y) => Math.round((y - L.y0) / L.step);

  const ring = (r, fx, fy) => 'M' + r.map(([x, y]) => `${fx(x).toFixed(1)},${fy(y).toFixed(1)}`).join('L') + 'Z';
  const miles = (b) => ({ west: toMiles(b.west, 'x'), east: toMiles(b.east, 'x'), south: toMiles(b.south, 'y'), north: toMiles(b.north, 'y') });
  const addrY = (y) => (y >= 0 ? y * 800 : y >= -1 ? y * 1200 : -1200 + (y + 1) * 800);
  const place = (x, y) => `${formatAddress(Math.round(addrY(y)), 'y')} · ${formatAddress(Math.round(x * 800), 'x')}`;
  const r1 = (v) => v.toFixed(1);

  // marks: start = ink dot, the Loop (State & Madison) = square, the hospital = ring
  const mk = {
    start: (x, y, z = 1) => `<circle cx="${r1(x)}" cy="${r1(y)}" r="${4.4 * z}" fill="${C.ink}" stroke="${C.paper}" stroke-width="${1.2 * z}"/>`,
    loop: (x, y, z = 1) => `<rect x="${r1(x - 3.8 * z)}" y="${r1(y - 3.8 * z)}" width="${7.6 * z}" height="${7.6 * z}" fill="${C.paper}" stroke="${C.ink}" stroke-width="${1.5 * z}"/>`,
    hosp: (x, y, z = 1) => `<circle cx="${r1(x)}" cy="${r1(y)}" r="${3.6 * z}" fill="${C.paper}" stroke="${C.ink}" stroke-width="${1.5 * z}"/>`,
  };
  const label = (x, y, str, size, anchor = 'start') => text(r1(x), r1(y + size * 0.35), str, { size, weight: 600, spacing: 0.5, anchor, halo: C.paper });

  // (one class for every drawing: the rules are the same, so the page's copies agree)
  // the hovered (picked) square is outlined in ink with a paper glow, wherever it appears (asked by the user)
  const hoverCss = `<style>.d15c path{fill:transparent;stroke:none}.d15c:hover path,.d15c.pick path{stroke:${C.ink};stroke-width:1.5;stroke-linejoin:miter;filter:drop-shadow(0 0 1px ${C.paper}) drop-shadow(0 0 1px ${C.paper})}</style>`;
  // tooltip: the page's minutes ruler (data-kind=ruler): this square's two minutes; the ruler itself
  // (the classes from 0 to 150 minutes, in this mode's shades) is set once on the drawing's svg
  const cellAttrs = (c) => {
    const [x, y, a, b] = c;
    const crow = Math.hypot(x - P.start[0], y - P.start[1]);
    return `class="d15c" data-kind="ruler" data-id="q${x}_${y}" data-tip="${esc(place(x, y))}" data-aside="${Math.round(crow)} mi" data-vals="${a} ${b}"`;
  };
  const edges = [0, ...BREAKS, RULER_MAX];
  const rulerAttr = `data-ruler='${JSON.stringify({ max: RULER_MAX, segs: ramp.map((c, i) => [edges[i], edges[i + 1], c]), ticks: [60, 120], foot: ['from 130th St', 'from the Loop', 'minutes'] })}' `;

  if (isPlate) out.push(frame({
    plate: 'XV',
    chapter: 'THE GAPS',
    day: 15,
    theme: 'Inside out',
    title: 'From the End of the Line',
    subtitle: `From 130th Street, the Loop is ${Math.round(s.startToLoop)} minutes away by bus and train. Turned inside out, the grid bends.`,
  }));

  // ---------- main map: the extent of Plates II–XIV ----------
  const ext = { west: -11200, east: 4800, south: -14000, north: 10400 };
  const mi = miles(ext);
  const field = isMap ? { x: 60, y: 250, w: 760, h: 1040 } : { x: 60, y: 262, w: 575, h: 830 };
  const k = Math.min(field.w / (mi.east - mi.west), field.h / (mi.north - mi.south));
  const Xm = (x) => field.x + (x - mi.west) * k;
  const Ym = (y) => field.y + (mi.north - y) * k;
  const X = (x) => Xm(toMiles(x, 'x'));
  const Y = (y) => Ym(toMiles(y, 'y'));
  const fx0 = X(ext.west), fx1 = X(ext.east), fy0 = Y(ext.north), fy1 = Y(ext.south);
  const g = gridLines(ext);
  const gl = 8 * T;
  const labelLen = 7 * (gl * 0.6 + 0.4);
  const colX = fx1 + 6 + labelLen;
  const labelTop = fy0 - 6 - labelLen;

  if (isPlate || isMap) {
    const city = boundary.map((r) => ring(r, X, Y)).join('');
    out.push(`<defs><clipPath id="${uid}-map"><rect x="${fx0}" y="${fy0}" width="${fx1 - fx0}" height="${fy1 - fy0}"/></clipPath><clipPath id="${uid}-city"><path d="${city}" clip-rule="evenodd"/></clipPath></defs>`);
    out.push(`<g clip-path="url(#${uid}-map)">`);
    out.push(`<path d="${city}" fill="${C.ground}" fill-rule="evenodd"/>`);
    // quarter-mile squares, merged along each row into runs of one class
    const d = ramp.map(() => []);
    const h = L.step / 2;
    data.mapClass.forEach((str, j) => {
      const y = ys[j];
      let i = 0;
      while (i < str.length) {
        const c = str[i];
        let e = i;
        while (e + 1 < str.length && str[e + 1] === c) e++;
        if (c !== '.') {
          const xa = Xm(xs[i] - h), xb = Xm(xs[e] + h), ya = Ym(y + h), yb = Ym(y - h);
          d[+c].push(`M${r1(xa)},${r1(ya)}H${r1(xb)}V${r1(yb)}H${r1(xa)}Z`);
        }
        i = e + 1;
      }
    });
    out.push(`<g clip-path="url(#${uid}-city)">${d.map((p, c) => (p.length ? `<path d="${p.join('')}" fill="${ramp[c]}" stroke="${ramp[c]}" stroke-width="0.3"/>` : '')).join('')}</g>`);
    for (const x of g.xs) out.push(`<line x1="${X(x)}" x2="${X(x)}" y1="${fy0}" y2="${fy1}" stroke="${x === 0 ? C.pencil : C.grid}" stroke-width="${x === 0 ? 0.8 : 0.6}"/>`);
    for (const y of g.ys) out.push(`<line x1="${fx0}" x2="${fx1}" y1="${Y(y)}" y2="${Y(y)}" stroke="${y === 0 ? C.pencil : C.grid}" stroke-width="${y === 0 ? 0.8 : 0.6}"/>`);
    if (isMap) {
      out.push(hoverCss);
      const q = k * 0.5;
      for (const c of data.cells) {
        const cx = Xm(c[0]), cy = Ym(c[1]);
        out.push(`<g ${cellAttrs(c)}><path d="M${r1(cx - q / 2)},${r1(cy - q / 2)}h${r1(q)}v${r1(q)}h${r1(-q)}Z"/></g>`);
      }
    }
    out.push('</g>');
    const gridLabel = (v) => (v === 0 ? { fill: C.ink, weight: 600 } : { fill: C.pencil });
    for (const x of g.xs) out.push(text(X(x) + gl * 0.35, labelTop, formatAddress(x, 'x'), { size: gl, spacing: 0.4, rotate: -90, anchor: 'end', ...gridLabel(x) }));
    for (const y of g.ys) out.push(text(colX, Y(y) + gl * 0.35, formatAddress(y, 'y'), { size: gl, spacing: 0.4, anchor: 'end', ...gridLabel(y) }));

    // the three places
    const ls = 7.5 * T;
    out.push(mk.loop(Xm(0), Ym(0)), mk.hosp(Xm(P.hosp[0]), Ym(P.hosp[1])), mk.start(Xm(P.start[0]), Ym(P.start[1])));
    out.push(label(Xm(0) - 8, Ym(0), 'THE LOOP', ls, 'end'));
    out.push(label(Xm(P.hosp[0]) + 7, Ym(P.hosp[1]), 'HOSPITAL', ls));
    out.push(label(Xm(P.start[0]) + 8, Ym(P.start[1]), '130TH ST', ls));

    // mile ruler
    const rx = X(ext.west + 800), ry = Y(ext.south) - k * 0.35;
    out.push(`<line x1="${rx}" x2="${rx + 4 * k}" y1="${ry}" y2="${ry}" stroke="${C.ink}" stroke-width="1.2"/>`);
    for (let i = 0; i <= 4; i++) out.push(`<line x1="${rx + i * k}" x2="${rx + i * k}" y1="${ry - (i % 4 === 0 ? 6 : 4)}" y2="${ry}" stroke="${C.ink}" stroke-width="1.2"/>`);
    out.push(text(rx, ry - 9, '0', { size: 7.5 * T, anchor: 'middle' }));
    out.push(text(rx + 4 * k, ry - 9, '4 MI', { size: 7.5 * T, anchor: 'middle' }));

    // legend
    const lgs = 9 * T;
    const sq = (c) => `<rect x="-9" y="-6" width="18" height="12" fill="${c}"/>`;
    if (isPlate) {
      const items = [['head', 'Minutes by bus and train from 130th St'], ...ramp.map((c, i) => [sq(c), SHORT[i]]),
        ['head', ''], [mk.start(0, 0, 0.9), '130th St'], [mk.loop(0, 0, 0.9), 'The Loop'], [mk.hosp(0, 0, 0.9), 'Hospital']];
      let lx = 60;
      const y = 203;
      for (const [m, lab] of items) {
        if (m === 'head') {
          if (lab) out.push(text(lx, y, `${lab}:`, { size: lgs, fill: C.pencil }));
          lx += (lab ? textWidth(`${lab}:`, lgs) : 6) + 8;
          continue;
        }
        out.push(`<g transform="translate(${lx + 9} ${y - lgs * 0.35})">${m}</g>`);
        out.push(text(lx + 22, y, lab, { size: lgs, fill: C.pencil }));
        lx += 22 + textWidth(lab, lgs) + 8;
      }
    } else {
      const items = [
        ['head', 'Minutes by bus and train from 130th St'],
        ...ramp.map((c, i) => [sq(c), CLASS_LABELS[i]]),
        ['gap'],
        [mk.start(0, 0), '130th St, where the Red Line Extension will end'],
        [mk.loop(0, 0), 'The Loop: State & Madison'],
        [mk.hosp(0, 0), 'Northwestern Memorial Hospital'],
      ];
      out.push(legendBox(items, { x: rx, bottom: Y(ext.south) - k, k, size: lgs }));
    }
  }

  if (isMap) {
    return svg(out.join(''), { label: mapLabel(s), viewBox: `60 184 ${Math.ceil(colX + 4 - 60)} 1114`, align: 'xMinYMin meet' })
      .replace('<svg ', `<svg ${rulerAttr}data-top="${labelTop - 184}" data-bottom="${fy1 - 184}" data-ftop="${+(fy0 - 184).toFixed(2)}" data-ppm="${+k.toFixed(3)}" `);
  }

  // ---------- the city inside out: two drawings at one scale ----------
  const DR = {
    start: { grid: data.start, o: P.start, rings: [30, 60, 90, 120], head: 'FROM 130TH ST', marks: { start: 0, loop: s.startToLoop, hosp: s.startToHosp } },
    loop: { grid: data.loop, o: P.loop, rings: [30, 60, 90], head: 'FROM THE LOOP', marks: { start: s.loopToStart, loop: 0, hosp: s.loopToHosp } },
  };
  // positions in minutes, relative to the start: true bearing, minutes as distance
  const polar = (o, x, y, m) => { const a = Math.atan2(y - o[1], x - o[0]); return [m * Math.cos(a), m * Math.sin(a)]; };
  for (const dr of Object.values(DR)) {
    dr.at = (j, i) => {
      const v = dr.grid[j]?.[i];
      return v == null ? null : polar(dr.o, xs[i], ys[j], v);
    };
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (let j = 0; j < L.ny; j++) for (let i = 0; i < L.nx; i++) {
      const p = dr.at(j, i);
      if (!p) continue;
      x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]);
    }
    dr.box = { x0, x1, y0, y1 };
  }
  const drawing = (dr, kk, cx, cy, clip, size) => {
    const Xp = (x) => cx + x * kk, Yp = (y) => cy - y * kk;
    const o = [`<g clip-path="url(#${clip})">`];
    // quarter-mile cells, each in the class of its corners' mean
    const d = ramp.map(() => []);
    for (let j = 0; j < L.ny - 1; j++) for (let i = 0; i < L.nx - 1; i++) {
      const q = [[j, i], [j, i + 1], [j + 1, i + 1], [j + 1, i]];
      const v = q.map(([a, b]) => dr.grid[a][b]);
      if (v.some((x) => x == null)) continue;
      const c = clsOf(v.reduce((a, b) => a + b, 0) / 4);
      d[c].push('M' + q.map(([a, b]) => { const p = dr.at(a, b); return `${r1(Xp(p[0]))},${r1(Yp(p[1]))}`; }).join('L') + 'Z');
    }
    o.push(d.map((p, c) => (p.length ? `<path d="${p.join('')}" fill="${ramp[c]}" stroke="${ramp[c]}" stroke-width="0.5" stroke-linejoin="round"/>` : '')).join(''));
    // the mile lines, bent: State and Madison in ink, the rest in paper
    const poly = (pts) => {
      let path = '', run = [];
      for (const p of [...pts, null]) {
        if (p) run.push(`${r1(Xp(p[0]))},${r1(Yp(p[1]))}`);
        else { if (run.length > 1) path += 'M' + run.join('L'); run = []; }
      }
      return path;
    };
    const lines = { paper: '', ink: '' };
    for (let gx = Math.ceil(xs[0]); gx <= xs.at(-1); gx++) lines[gx === 0 ? 'ink' : 'paper'] += poly(ys.map((_, j) => dr.at(j, col(gx))));
    for (let gy = Math.ceil(ys[0]); gy <= ys.at(-1); gy++) lines[gy === 0 ? 'ink' : 'paper'] += poly(xs.map((_, i) => dr.at(row(gy), i)));
    o.push(`<path d="${lines.paper}" fill="none" stroke="${C.paper}" stroke-width="0.45" opacity="0.65"/>`);
    o.push(`<path d="${lines.ink}" fill="none" stroke="${C.ink}" stroke-width="0.8" opacity="0.85"/>`);
    // State's far (north) end and Madison's far (west) end, named
    const stateEnd = ys.map((_, j) => dr.at(j, col(0))).filter(Boolean).at(-1);
    const madEnd = xs.map((_, i) => dr.at(row(0), i)).find(Boolean);
    o.push(text(r1(Xp(stateEnd[0])), r1(Yp(stateEnd[1]) - 5), 'STATE', { size: size * 0.8, weight: 600, spacing: 0.4, anchor: 'middle', halo: C.paper }));
    o.push(text(r1(Xp(madEnd[0]) - 4), r1(Yp(madEnd[1]) + size * 0.28), 'MADISON', { size: size * 0.8, weight: 600, spacing: 0.4, anchor: 'end', halo: C.paper }));
    // minutes as circles
    for (const m of dr.rings) {
      o.push(`<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(m * kk)}" fill="none" stroke="${C.ink}" stroke-width="0.6" stroke-dasharray="2 2.5"/>`);
      const a = (58 * Math.PI) / 180;
      o.push(text(r1(cx + m * kk * Math.cos(a) + 3), r1(cy - m * kk * Math.sin(a) - 2), `${m} MIN`, { size: size * 0.8, weight: 500, fill: C.pencil, halo: C.paper }));
    }
    if (hooks) {
      o.push(hoverCss);
      const h = 0.25;
      for (const c of data.cells) {
        const corners = [[c[0] - h, c[1] - h], [c[0] + h, c[1] - h], [c[0] + h, c[1] + h], [c[0] - h, c[1] + h]].map(([x, y]) => dr.at(row(y), col(x)));
        if (corners.some((p) => !p)) continue;
        o.push(`<g ${cellAttrs(c)}><path d="M${corners.map((p) => `${r1(Xp(p[0]))},${r1(Yp(p[1]))}`).join('L')}Z"/></g>`);
      }
    }
    o.push('</g>');
    // the three places, where their minutes put them
    const at = (pt, m) => polar(dr.o, pt[0], pt[1], m);
    const [lp, hp, sp] = [at(P.loop, dr.marks.loop), at(P.hosp, dr.marks.hosp), at(P.start, dr.marks.start)];
    o.push(mk.loop(Xp(lp[0]), Yp(lp[1]), 0.9), mk.hosp(Xp(hp[0]), Yp(hp[1]), 0.9), mk.start(Xp(sp[0]), Yp(sp[1]), 0.9));
    o.push(label(Xp(lp[0]) - 7, Yp(lp[1]), 'THE LOOP', size * 0.85, 'end'));
    o.push(label(Xp(hp[0]) + 6, Yp(hp[1]) - 2, 'HOSPITAL', size * 0.85));
    o.push(label(Xp(sp[0]) + 7, Yp(sp[1]), '130TH ST', size * 0.85));
    return o.join('');
  };
  // both drawings stacked in a box: 130th St above, the Loop below, one scale (the minutes per px)
  const middle = (x0, top, w, hMax, size) => {
    const head = size * 2.1, gap = size * 1.6;
    const A = DR.start.box, B = DR.loop.box;
    // 130th St's drawing is centred on its own extent; the Loop's on the Loop, so its rings sit in the
    // middle of the column
    const kw = (w - 4) / Math.max(A.x1 - A.x0, 2 * Math.max(-B.x0, B.x1));
    const kh = (hMax - 2 * head - gap) / (A.y1 - A.y0 + B.y1 - B.y0);
    const kk = Math.min(kw, kh);
    const parts = [];
    let y = top;
    for (const [name, b] of [['start', A], ['loop', B]]) {
      const dr = DR[name];
      parts.push(text(x0, y + size * 0.85, dr.head, { size: size * 0.95, weight: 600, spacing: 0.8 }));
      y += head;
      const hgt = (b.y1 - b.y0) * kk;
      const clip = `${uid}-${name}`;
      parts.push(`<defs><clipPath id="${clip}"><rect x="${x0}" y="${r1(y - 4)}" width="${w}" height="${r1(hgt + 8)}"/></clipPath></defs>`);
      const cx = name === 'loop' ? x0 + w / 2 : x0 + w / 2 - ((b.x0 + b.x1) / 2) * kk;
      parts.push(drawing(dr, kk, cx, y + b.y1 * kk, clip, size));
      y += hgt + gap;
    }
    return { svg: parts.join(''), height: y - gap - top, k: kk };
  };

  if (isChart) {
    const cw = 390, size = 8 * T;
    const m = middle(0, 6, cw, 1400, size);
    return svg(m.svg, { label: chartLabel(s), viewBox: `0 0 ${cw} ${Math.ceil(m.height + 12)}`, align: 'xMidYMin meet' }).replace('<svg ', `<svg ${rulerAttr}`);
  }

  // ---------- plate: margin column with both drawings, then Findings ----------
  const mx = Math.round(colX + 38);
  const ns = 10.5, nh = 14;
  const title = (y, str) => out.push(text(mx, y, str, { size: 10.5 * T, weight: 600, spacing: 1 }));
  const note = (y, str) => out.push(text(mx, y, str, { size: ns, font: SERIF, italic: true, fill: C.pencil }));
  let uy = Math.round(labelTop + 10.5 * T * 0.72);
  title(uy, CHART_TITLE.toUpperCase());
  const noteLines = wrap(CHART_NOTE, Math.floor(W_COL / (ns * 0.45)));
  noteLines.forEach((l, i) => note(uy + (i + 1) * nh + 4, l));
  uy += noteLines.length * nh + 22;
  const findingsH = 214;
  out.push(middle(mx, uy, W_COL, Math.round(fy1 - findingsH - uy - 10), 8).svg);

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
  const f = data.feeds;
  const ledger = [
    ['TRANSIT', `${f.cta.name}, ${f.metra.name} and ${f.pace.name} schedules (GTFS) for Tuesday ${dayLong(data.serviceDay)}, leaving 8–9 a.m.; fares not counted`],
    ['MINUTES', 'Door to door: the median of 12 departures, five minutes apart; walking a straight line × 1.3 at 1.2 m/s'],
    ['START', '130th St on the Red Line Extension’s alignment (OpenStreetMap); the Loop = State & Madison'],
    ['LIMITS', 'City of Chicago, Boundaries – City · qqq8-j68g; residents: 2020 Census blocks'],
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
const RULER_MAX = 150; // minutes: the tooltip ruler's length (longer trips sit at its end)
export const CHART_TITLE = 'The city, inside out';
export const CHART_NOTE = 'Each point in its true direction, as far out as its minutes. One scale for both; rings every 30 min.';

const pct = (v) => `${Math.round(v * 100)}%`;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const dayLong = (iso) => `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;

const mapLabel = (s) =>
  `Plate XV, From the End of the Line: from 130th Street, ${pct(s.within60.start)} of Chicagoans live within an hour by bus and train; from the Loop, ${pct(s.within60.loop)} do.`;
const chartLabel = (s) =>
  `${CHART_TITLE}: the city drawn by minutes from 130th Street and from the Loop at one scale. From 130th Street the Loop sits ${Math.round(s.startToLoop)} minutes out.`;
