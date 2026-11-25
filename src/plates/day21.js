// Plate XXI · Does the Map Know the Curb? · Day 21 OpenStreetMap
import { C, SERIF, esc, text, textWidth, legendBox, wrap, frame, svg } from '../lib/plate.js';
import { gridLines, formatAddress, toMiles } from '../lib/grid.js';

// variant 'plate': the full 1080 x 1350 plate (export, download).
// variant 'map': the map alone, with hover hooks, for the day page's left column.
// variant 'chart': crosswalks by curb heights given, one bar per side of the city, with hover hooks.
// variant 'inset': two accessible stations' quarter miles at large scale, with hover hooks.
// Every crosswalk OpenStreetMap draws in the city (a footway=crossing way) is a dot at its midpoint,
// shaded by how many of its two ends give the curb's height (kerb=lowered, flush, raised or no):
// both, one or neither. Crosswalks arrive as [x, y, ends given] in miles from State & Madison.

// Gray: neither in the frame tone, one end pencil, both ink. Color: the blue of the access symbol.
const SHADES = {
  gray: ['#BDBBB4', C.pencil, C.ink],
  color: ['#BDBBB4', '#86A3D3', '#1F4E9C'],
};
const RAISED = { gray: C.ink, color: '#B8432F' };
export const CLASS_TEXT = ['Neither end', 'One end', 'Both ends'];

export const CHART_TITLE = 'Crosswalks by curb heights given';
export const CHART_NOTE = 'Each side of the city: its crosswalks by how many ends give the curb’s height; the share giving both at right';
export const INSET_TITLE = 'Inset · Two stations, a quarter mile around';
export const insetNote = (d) => {
  const [a, b] = d.inset.map((w) => station(d, w.id));
  return `${a.short} and ${b.short}, both accessible: crosswalks within a quarter mile and the curb at each end.`;
};

const fmt = (v) => Math.round(v).toLocaleString('en-US');
const pct = (v) => `${Math.round(v * 100)}%`;
const station = (d, id) => {
  const r = d.stations.find((s) => s[0] === String(id));
  return Object.fromEntries(d.stationCols.map((c, i) => [c, r[i]]));
};
// the curb at one end of a crosswalk: given and passable, given and raised, or not given
const endKind = (v) => (v === 'raised' ? 'raised' : ['lowered', 'flush', 'no'].includes(v) ? 'given' : 'none');

export function renderDay21(data, { mode = 'gray', variant = 'plate' } = {}) {
  const { summary: s, sides, boundary = [] } = data;
  const out = [];
  const isPlate = variant === 'plate';
  const isMap = variant === 'map';
  const isChart = variant === 'chart';
  const isInset = variant === 'inset';
  const hooks = isMap || isChart || isInset;
  const T = isMap || isChart ? 1.3 : 1.15;
  const color = mode === 'color';
  const shade = SHADES[color ? 'color' : 'gray'];
  const raisedFill = RAISED[color ? 'color' : 'gray'];
  const stations = data.stations.map((r) => Object.fromEntries(data.stationCols.map((c, i) => [c, r[i]])));
  const attr = (o) => esc(JSON.stringify(o)).replace(/"/g, '&quot;');
  const segsOf = (both, one, n) => [[0, both / n, shade[2]], [both / n, (both + one) / n, shade[1]]];
  const lineText = (st) => (st.lines.length > 2 ? `${st.lines.length} lines` : st.lines.join(' & ') + (st.lines.length > 1 ? ' lines' : ' Line'));
  const stationCard = (st) => ({
    name: st.short,
    aside: `${lineText(st)} · ${st.ada ? 'accessible' : 'non-accessible'}`,
    big: [pct(st.both / Math.max(1, st.n)), `of ${fmt(st.n)} crosswalks within ¼ mile give the curb’s height at both ends`],
    bar: { frac: (st.both + st.one) / Math.max(1, st.n), segs: segsOf(st.both, st.one, Math.max(1, st.n)), left: `${fmt(st.both)} both ends`, right: `${fmt(st.none)} neither`, tick: false },
    foot: [`${fmt(st.ends)} curb ends without a height`, ''],
  });
  const stationMark = (st, x, y, r, hit = 7) => {
    const m = st.ada
      ? `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${C.paper}" stroke="${C.ink}" stroke-width="${(r * 0.42).toFixed(2)}"/>`
      : `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(r * 0.8).toFixed(2)}" fill="${C.paper}" stroke="${C.pencil}" stroke-width="${(r * 0.3).toFixed(2)}"/>`;
    if (!hooks) return m;
    return `<g data-kind="card" data-id="s${st.id}" data-tip="${esc(st.short)}" data-name="${esc(st.short)}" data-card="${attr(stationCard(st))}"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${hit}" fill="transparent"/>${m}</g>`;
  };
  const ring = (rg, fx, fy) => 'M' + rg.map(([x, y]) => `${fx(x).toFixed(1)},${fy(y).toFixed(1)}`).join('L') + 'Z';

  if (isPlate) out.push(frame({
    plate: 'XXI',
    chapter: 'THE BODY',
    day: 21,
    theme: 'OPENSTREETMAP',
    title: 'Does the Map Know the Curb?',
    subtitle: 'Every crosswalk OpenStreetMap draws in Chicago, shaded by whether it says how high the curb is at each end.',
  }));

  // ---------- main map: the extent of Plates II–XX ----------
  const ext = { west: -11200, east: 4800, south: -14000, north: 10400 };
  const mi = { west: toMiles(ext.west, 'x'), east: toMiles(ext.east, 'x'), south: toMiles(ext.south, 'y'), north: toMiles(ext.north, 'y') };
  const field = isMap ? { x: 60, y: 250, w: 760, h: 1040 } : { x: 60, y: 262, w: 575, h: 830 };
  const k = Math.min(field.w / (mi.east - mi.west), field.h / (mi.north - mi.south));
  const XM = (m) => field.x + (m - mi.west) * k;
  const YM = (m) => field.y + (mi.north - m) * k;
  const X = (x) => XM(toMiles(x, 'x'));
  const Y = (y) => YM(toMiles(y, 'y'));
  const fx0 = X(ext.west), fx1 = X(ext.east), fy0 = Y(ext.north), fy1 = Y(ext.south);
  const g = gridLines(ext);
  const gl = 8 * T;
  const labelLen = 7 * (gl * 0.6 + 0.4);
  const colX = fx1 + 6 + labelLen;
  const labelTop = fy0 - 6 - labelLen;
  const dot = (c, r = 2.2) => `<circle r="${r}" fill="${c}"/>`;
  const sMark = (ada) => (ada ? `<circle r="3.2" fill="${C.paper}" stroke="${C.ink}" stroke-width="1.3"/>` : `<circle r="2.6" fill="${C.paper}" stroke="${C.pencil}" stroke-width="0.8"/>`);

  if (isPlate || isMap) {
    const uid = `d21-${variant}-${mode}`;
    out.push(`<defs><clipPath id="${uid}-map"><rect x="${fx0}" y="${fy0}" width="${fx1 - fx0}" height="${fy1 - fy0}"/></clipPath></defs>`);
    out.push(`<g clip-path="url(#${uid}-map)">`);
    if (boundary.length) out.push(`<path d="${boundary.map((r) => ring(r, X, Y)).join('')}" fill="${C.ground}" fill-rule="evenodd"/>`);
    const gg = [];
    for (const x of g.xs) gg.push(`<line x1="${X(x)}" x2="${X(x)}" y1="${fy0}" y2="${fy1}" stroke="${x === 0 ? C.pencil : C.grid}" stroke-width="${x === 0 ? 0.8 : 0.6}" opacity="${x === 0 ? 0.8 : 0.55}"/>`);
    for (const y of g.ys) gg.push(`<line x1="${fx0}" x2="${fx1}" y1="${Y(y)}" y2="${Y(y)}" stroke="${y === 0 ? C.pencil : C.grid}" stroke-width="${y === 0 ? 0.8 : 0.6}" opacity="${y === 0 ? 0.8 : 0.55}"/>`);
    out.push(`<g pointer-events="none">${gg.join('')}</g>`);
    // crosswalks: one path per class, a round dot per crosswalk (a zero-length stroke), neither first
    const ds = [[], [], []];
    for (const [x, y, kk] of data.cross) ds[kk].push(`M${XM(x).toFixed(1)},${YM(y).toFixed(1)}h0`);
    const sw = (k / 28.75) * 1.15;
    ds.forEach((d, i) => out.push(`<path${hooks ? ` data-keys="k${i}"` : ''} pointer-events="none" d="${d.join('')}" stroke="${shade[i]}" stroke-width="${(sw * (i ? 1.25 : 1)).toFixed(2)}" stroke-linecap="round" fill="none"/>`));
    out.push('</g>');
    // the inset's two windows
    for (const w of data.inset) {
      const st = station(data, w.id);
      const x0 = XM(st.x - w.r), y0 = YM(st.y + w.ry), side = 2 * w.r * k;
      out.push(`<rect x="${x0.toFixed(1)}" y="${y0.toFixed(1)}" width="${side.toFixed(1)}" height="${(2 * w.ry * k).toFixed(1)}" fill="none" stroke="${C.ink}" stroke-width="0.8" pointer-events="none"/>`);
      out.push(text(+(x0 + side + 3).toFixed(1), +(y0 + 7 * T * 0.8).toFixed(1), st.short, { size: 7.5 * T, weight: 600, halo: C.paper }));
    }
    // 'L' stations in the city, accessible ones in ink
    const sr = isMap ? 2.9 : 2.4;
    for (const st of [...stations].sort((a, b) => a.ada - b.ada)) out.push(stationMark(st, XM(st.x), YM(st.y), sr));
    const gridLabel = (v) => (v === 0 ? { fill: C.ink, weight: 600 } : { fill: C.pencil });
    for (const x of g.xs) out.push(text(X(x) + gl * 0.35, labelTop, formatAddress(x, 'x'), { size: gl, spacing: 0.4, rotate: -90, anchor: 'end', ...gridLabel(x) }));
    for (const y of g.ys) out.push(text(colX, Y(y) + gl * 0.35, formatAddress(y, 'y'), { size: gl, spacing: 0.4, anchor: 'end', ...gridLabel(y) }));

    // mile ruler
    const rx = X(ext.west + 800), ry = Y(ext.south) - k * 0.35;
    out.push(`<line x1="${rx}" x2="${rx + 4 * k}" y1="${ry}" y2="${ry}" stroke="${C.ink}" stroke-width="1.2"/>`);
    for (let i = 0; i <= 4; i++) out.push(`<line x1="${rx + i * k}" x2="${rx + i * k}" y1="${ry - (i % 4 === 0 ? 6 : 4)}" y2="${ry}" stroke="${C.ink}" stroke-width="1.2"/>`);
    out.push(text(rx, ry - 9, '0', { size: 7.5 * T, anchor: 'middle' }));
    out.push(text(rx + 4 * k, ry - 9, '4 MI', { size: 7.5 * T, anchor: 'middle' }));

    const lgs = 9 * T;
    if (isPlate) {
      // one line: the three classes, then the stations
      let lx = 60;
      const y = 203;
      const item = (mark, lab) => {
        out.push(`<g transform="translate(${lx + 5} ${y - lgs * 0.35})">${mark}</g>`);
        out.push(text(lx + 13, y, lab, { size: lgs, fill: C.pencil }));
        lx += 13 + textWidth(lab, lgs) + 12;
      };
      const lead = 'Crosswalks giving the curb’s height at:';
      out.push(text(lx, y, lead, { size: lgs, fill: C.pencil }));
      lx += textWidth(lead, lgs) + 8;
      [2, 1, 0].forEach((i) => item(dot(shade[i]), CLASS_TEXT[i].toLowerCase()));
      lx += 6;
      item(sMark(true), 'accessible ‘L’ station');
      item(sMark(false), 'non-accessible');
    } else {
      out.push(legendBox([
        ['head', 'Crosswalks: the curb’s height given at'],
        ...[2, 1, 0].map((i) => [dot(shade[i], 2.6), CLASS_TEXT[i].toLowerCase()]),
        ['gap'],
        [sMark(true), 'Accessible ‘L’ station'],
        [sMark(false), 'Non-accessible ‘L’ station'],
      ], { x: rx, bottom: Y(ext.south) - k, k, size: lgs }));
    }
  }

  if (isMap) {
    return svg(out.join(''), { label: mapLabel(data), viewBox: `60 184 ${Math.ceil(colX + 4 - 60)} 1114`, align: 'xMinYMin meet' })
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
    const cs = isChart ? 8 * T : 8;
    if (isPlate) {
      uy = Math.round(labelTop + 10.5 * T * 0.72);
      title(uy, CHART_TITLE.toUpperCase());
      const noteLines = wrap(CHART_NOTE, Math.floor(cw / (ns * 0.45)));
      noteLines.forEach((l, i) => note(uy + (i + 1) * nh + 4, l));
      uy += noteLines.length * nh + 20;
    } else uy = 4;
    // the city, the accessible stations' quarter miles, then the nine sides; a 100% bar each
    const rows = [
      { side: 'Chicago', n: s.n, both: s.both, one: s.one, none: s.none, bold: true },
      { side: 'Near accessible ‘L’', aside: `within ¼ mile of the ${s.accStations} accessible stations`, n: s.accN, both: s.accBoth, one: s.accOne, none: s.accNone },
      ...sides,
    ];
    const labW = textWidth('Far Southwest Side', cs, { weight: 500 }) + 8;
    const medW = textWidth('100%', cs * 0.95, { weight: 600 }) + 6;
    const bx = mx + labW, bw = cw - labW - medW - 2;
    const rh = isChart ? 21 : 16, bh = isChart ? 12 : 9;
    rows.forEach((r, i) => {
      const y = uy + i * rh + (i > 1 ? 12 : i ? 4 : 0);
      out.push(text(mx, y + bh * 0.8, r.side, { size: cs, weight: r.bold ? 600 : 400, fill: C.ink }));
      let x = bx;
      [2, 1, 0].forEach((c) => {
        const v = [r.none, r.one, r.both][c];
        const w = (v / r.n) * bw;
        if (w <= 0) return;
        const rect = `<rect x="${x.toFixed(1)}" y="${y}" width="${Math.max(0, w - 0.6).toFixed(1)}" height="${bh}" fill="${shade[c]}"/>`;
        if (hooks) {
          const cd = {
            name: r.side,
            aside: r.aside ?? CLASS_TEXT[c].toLowerCase(),
            big: [pct(v / r.n), `of ${fmt(r.n)} crosswalks give the curb’s height at ${CLASS_TEXT[c].toLowerCase()}`],
            bar: { frac: (r.both + r.one) / r.n, segs: segsOf(r.both, r.one, r.n), left: `${pct(r.both / r.n)} both ends`, right: `${pct(r.none / r.n)} neither`, tick: false },
            foot: [`${fmt(v)} crosswalks`, ''],
          };
          out.push(`<g data-kind="card" data-tip="${esc(r.side)}" data-name="${esc(r.side)}" data-hl="k${c}" data-card="${attr(cd)}">${rect}<rect x="${x.toFixed(1)}" y="${y - (rh - bh) / 2}" width="${w.toFixed(1)}" height="${rh}" fill="transparent"/></g>`);
        } else out.push(rect);
        x += w;
      });
      out.push(text(bx + bw + medW, y + bh * 0.8, pct(r.both / r.n), { size: cs * 0.95, weight: 600, anchor: 'end' }));
    });
    const by = uy + rows.length * rh + 12 + 6;
    let kx = bx;
    const ks = cs * 0.85;
    [2, 1, 0].forEach((i) => {
      out.push(`<rect x="${kx}" y="${by + 2}" width="7" height="7" fill="${shade[i]}"/>`);
      const lab = CLASS_TEXT[i].toLowerCase();
      out.push(text(kx + 9, by + 8.5, lab, { size: ks, fill: C.pencil }));
      kx += 9 + textWidth(lab, ks) + 9;
    });
    uy = by + 12;
    if (isChart) {
      return svg(out.join(''), { label: `Crosswalks by curb heights given: ${pct(s.both / s.n)} of Chicago’s give both, ${pct(s.none / s.n)} neither; by side from ${pct(sides[0].both / sides[0].n)} (${sides[0].side}) to ${pct(sides.at(-1).both / sides.at(-1).n)} (${sides.at(-1).side}).`, viewBox: `0 0 ${cw + 6} ${Math.ceil(uy + 4)}`, align: 'xMinYMin meet' });
    }
  }

  // ---------- inset: two stations' quarter miles side by side ----------
  const iw = isInset ? 390 : W_COL;
  const gap = isInset ? 14 : 10;
  const pw = (iw - gap) / 2;
  const head = isInset ? 34 : 28;
  const ty = uy + 30;
  if (isPlate) {
    title(ty, INSET_TITLE.toUpperCase());
    wrap(insetNote(data), Math.floor(cw / (ns * 0.45))).forEach((l, i) => note(ty + (i + 1) * nh + 4, l));
  }
  const noteH = isPlate ? wrap(insetNote(data), Math.floor(cw / (ns * 0.45))).length * nh : 0;
  const keyH = isInset ? 22 : 18;
  const ki = pw / (2 * data.inset[0].r);
  const ph = 2 * data.inset[0].ry * ki; // each window: a quarter mile east and west, ry north and south
  const ih = head + ph + keyH;
  const inset = isInset ? { x: 0, y: 0, w: iw, h: ih } : { x: mx, y: ty + noteH + 14, w: iw, h: ih };
  const hs = isInset ? 9.5 : 8;
  data.inset.forEach((w, j) => {
    const st = station(data, w.id);
    const px = inset.x + j * (pw + gap), py = inset.y + head;
    const IX = (m) => px + (m + w.r) * ki, IY = (m) => py + (w.ry - m) * ki;
    out.push(text(px, py - hs * 1.55 - 2, st.short.toUpperCase(), { size: hs, weight: 600, spacing: 0.5 }));
    out.push(text(px, py - 5, `${pct(st.both / st.n)} of ${st.n} crosswalks give both`, { size: hs * 0.9, fill: C.pencil }));
    const cid = `d21-${variant}-${mode}-i${j}`;
    out.push(`<defs><clipPath id="${cid}"><rect x="${px}" y="${py}" width="${pw}" height="${ph}"/></clipPath></defs>`);
    out.push(`<rect x="${px}" y="${py}" width="${pw}" height="${ph}" fill="${C.ground}"/>`);
    out.push(`<g clip-path="url(#${cid})" pointer-events="none">`);
    out.push(`<path d="${w.sidewalks.map((l) => 'M' + l.map(([x, y]) => `${IX(x).toFixed(1)},${IY(y).toFixed(1)}`).join('L')).join('')}" fill="none" stroke="${C.frame}" stroke-width="${isInset ? 0.9 : 0.6}"/>`);
    out.push(`<path d="${w.crosswalks.map(([x0, y0, x1, y1]) => `M${IX(x0).toFixed(1)},${IY(y0).toFixed(1)}L${IX(x1).toFixed(1)},${IY(y1).toFixed(1)}`).join('')}" fill="none" stroke="${C.pencil}" stroke-width="${isInset ? 1.3 : 0.9}"/>`);
    const er = isInset ? 2.1 : 1.5;
    const marks = { given: [], raised: [], none: [] };
    for (const [x0, y0, x1, y1, e0, e1] of w.crosswalks) {
      marks[endKind(e0)].push([IX(x0), IY(y0)]);
      marks[endKind(e1)].push([IX(x1), IY(y1)]);
    }
    out.push(`<path d="${marks.none.map(([x, y]) => `M${(x - er).toFixed(1)},${y.toFixed(1)}a${er},${er} 0 1,0 ${2 * er},0a${er},${er} 0 1,0 ${-2 * er},0`).join('')}" fill="${C.paper}" stroke="${C.pencil}" stroke-width="${isInset ? 0.8 : 0.6}"/>`);
    out.push(`<path d="${marks.given.map(([x, y]) => `M${x.toFixed(1)},${y.toFixed(1)}h0`).join('')}" stroke="${shade[2]}" stroke-width="${2 * er + 0.6}" stroke-linecap="round" fill="none"/>`);
    if (marks.raised.length) out.push(`<path d="${marks.raised.map(([x, y]) => `M${(x - er - 0.5).toFixed(1)},${y.toFixed(1)}h${2 * er + 1}`).join('')}" stroke="${raisedFill}" stroke-width="${er}" fill="none"/>`);
    // the quarter mile the counts use
    out.push(`<circle cx="${IX(0).toFixed(1)}" cy="${IY(0).toFixed(1)}" r="${(w.r * ki).toFixed(1)}" fill="none" stroke="${C.ink}" stroke-width="0.7" stroke-dasharray="3 2.5"/>`);
    out.push('</g>');
    for (const [id, ox, oy] of w.others) {
      const o = stations.find((t) => t.id === id);
      if (o) out.push(stationMark(o, IX(ox), IY(oy), isInset ? 3.6 : 2.8));
    }
    out.push(stationMark(st, IX(0), IY(0), isInset ? 4.4 : 3.4, 9));
    out.push(`<rect x="${px}" y="${py}" width="${pw}" height="${ph}" fill="none" stroke="${C.ink}" stroke-width="0.8" pointer-events="none"/>`);
  });
  // key under the two windows
  {
    const ks = isInset ? 8.5 : 7.4;
    let kx = inset.x;
    const ky = inset.y + head + ph + keyH - 5;
    const er = isInset ? 2.1 : 1.5;
    const item = (m, lab) => {
      out.push(`<g transform="translate(${kx + 4} ${ky - ks * 0.35})">${m}</g>`);
      out.push(text(kx + 11, ky, lab, { size: ks, fill: C.pencil }));
      kx += 11 + textWidth(lab, ks) + 10;
    };
    out.push(`<g transform="translate(${kx} ${ky - ks * 0.35})"><line x1="0" x2="12" y1="0" y2="0" stroke="${C.pencil}" stroke-width="1.2"/></g>`);
    out.push(text(kx + 15, ky, 'crosswalk', { size: ks, fill: C.pencil }));
    kx += 15 + textWidth('crosswalk', ks) + 10;
    item(`<circle r="${er + 0.3}" fill="${shade[2]}"/>`, 'curb lowered or flush');
    if (data.inset.some((w) => w.crosswalks.some((c) => c[4] === 'raised' || c[5] === 'raised'))) item(`<line x1="-3" x2="3" stroke="${raisedFill}" stroke-width="${er}"/>`, 'raised');
    item(`<circle r="${er}" fill="${C.paper}" stroke="${C.pencil}" stroke-width="0.8"/>`, 'no height given');
    item(`<circle r="4" fill="none" stroke="${C.ink}" stroke-width="0.7" stroke-dasharray="2 1.6"/>`, '¼ mile');
  }

  if (isInset) {
    const [a, b] = data.inset.map((w) => station(data, w.id));
    return svg(out.join(''), { label: `Two accessible stations, a quarter mile around: at ${a.short}, ${pct(a.both / a.n)} of ${a.n} crosswalks give the curb’s height at both ends; at ${b.short}, ${pct(b.both / b.n)} of ${b.n}.`, viewBox: `0 0 ${inset.w} ${Math.ceil(inset.h)}`, align: 'xMidYMid meet' })
      .replace('<svg ', `<svg data-ppm="${+ki.toFixed(3)}" `);
  }

  // plate: Findings close the column
  let fy = inset.y + inset.h + 34;
  title(fy, 'FINDINGS');
  for (const l of wrap(data.finding, Math.floor(W_COL / (ns * 0.45)))) note((fy += nh) + 4, l);
  fy += 10;
  const bs = 9.5, bh2 = 12.6;
  for (const para of data.findings ?? []) {
    for (const l of wrap(para, Math.floor(W_COL / (bs * 0.46)))) out.push(text(mx, (fy += bh2), l, { size: bs, font: SERIF }));
    fy += 5;
  }

  // data ledger, under the map
  const lx = fx0;
  let dy = Math.round(fy1) + 34;
  out.push(text(lx, dy, 'DATA LEDGER', { size: 10.5 * T, weight: 600, spacing: 1 }));
  const ledger = [
    ['OSM', `© OpenStreetMap contributors (ODbL), Geofabrik extract of Illinois, ${longDate(data.extract.date)}: ${fmt(s.n)} crosswalk ways (footway=crossing) in the city`],
    ['CURBS', 'An end gives the height if its curb node has kerb=lowered, flush, raised or no; kerb=yes or a bare barrier=kerb does not'],
    ['STATIONS', `${s.stations} ‘L’ stations in the city, ${s.accStations} accessible (CTA, flags as Plate VIII); a straight-line quarter mile`],
    ['SIDES', 'Community areas (Chicago Data Portal) grouped into sides as on Plate X'],
    ['CAVEAT', 'The map, not the street: a curb without a height may well be lowered; alley and driveway crossings not counted'],
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
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const longDate = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};

const mapLabel = (d) =>
  `Plate XXI, Does the Map Know the Curb?: every crosswalk OpenStreetMap draws in Chicago, ${d.summary.n.toLocaleString('en-US')} in all, as a dot; ${Math.round((d.summary.both / d.summary.n) * 100)}% give the curb’s height at both ends, ${Math.round((d.summary.none / d.summary.n) * 100)}% at neither.`;
