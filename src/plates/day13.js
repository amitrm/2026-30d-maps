// Plate XIII · Car or Train · Day 13 Interactions
import { C, LINES, SERIF, esc, text, textWidth, legendBox, wrap, frame, svg } from '../lib/plate.js';
import { gridLines, formatAddress, toMiles } from '../lib/grid.js';

// variant 'plate': the full 1080 x 1350 plate (export, download), all day.
// variant 'map': the map alone, with hover hooks, for the day page's left column. It carries 25 states,
//   <g data-state="all"> and <g data-state="h00">…<g data-state="h23"> (hidden), one per hour.
// variant 'chart': the 24 hours, with hover hooks; each hour is a control, [data-state-key="hNN"], that
//   shows that hour's state on the map (the page's state hook; leaving the chart returns to "all").
// variant 'inset': the Blue Line from the Loop to Logan Square, all day, drawn tall for the page's crop.
// A ride-hail trip copies the 'L' when both of its census tracts have residents within half a mile of
// stations on one line (data.edges, from the notebook). Each stretch of track between two stations is
// drawn as a band as wide as the trips that copied it, per 1,000 ride-hail trips in the city that day or
// hour, so the hours compare. The band's ink part is the copies whose train ride is step-free; its
// hatched part (Plate III's hatch) the copies whose train ride needs stairs. Lines sharing a stretch sit
// side by side. Stations: dot = accessible, ring = non-accessible (Plate I).
export const ORDER = ['Red', 'Blue', 'Brown', 'Green', 'Orange', 'Purple', 'Pink', 'Yellow'];
const MAXW = 16; // plate px for the widest band of the whole day (North Side Red); night hours draw wider
export const INSET_BANDS = 2.5; // the inset's bands (Blue Line only), against the main map's

export function renderDay13(data, { mode = 'gray', variant = 'plate' } = {}) {
  const { stations, edges, hours, summary, boundary = [] } = data;
  const out = [];
  const isPlate = variant === 'plate';
  const isMap = variant === 'map';
  const isChart = variant === 'chart';
  const isInset = variant === 'inset';
  const hooks = isMap || isChart || isInset;
  const uid = `d13-${variant}-${mode}`;
  const T = isMap || isChart ? 1.3 : 1.15;
  const TI = isInset ? 1.35 : 1.15;
  const color = mode === 'color';
  const soft = hooks && !color;
  const markInk = soft ? '#5A5853' : C.ink;
  const byId = new Map(stations.map((s) => [s.id, s]));
  const stTint = (s) => (color && s.lines.length === 1 ? LINES[s.lines[0]] : markInk);

  // per 1,000 ride-hail trips: the whole day, or one hour
  const states = ['all', ...hours.trips.map((_, h) => `h${String(h).padStart(2, '0')}`)];
  const denom = (st) => (st === 'all' ? summary.tripsDay : hours.trips[Number(st.slice(1))]);
  const val = (e, st) => (st === 'all' ? [sum(e.h), sum(e.s)] : [e.h[Number(st.slice(1))], e.s[Number(st.slice(1))]]);
  const per = (e, st) => val(e, st).map((v) => (1000 * v) / denom(st));
  const maxPer = Math.max(...edges.map((e) => per(e, 'all')[0]));

  // ---------- drawing helpers ----------
  const ring = (r, fx, fy) => 'M' + r.map(([x, y]) => `${fx(x).toFixed(1)},${fy(y).toFixed(1)}`).join('L') + 'Z';
  const city = (fx, fy) => boundary.map((r) => ring(r, fx, fy)).join('');
  const miles = (b) => ({ west: toMiles(b.west, 'x'), east: toMiles(b.east, 'x'), south: toMiles(b.south, 'y'), north: toMiles(b.north, 'y') });
  const hatch = (s, ink) =>
    `<pattern id="${uid}-h${s}${ink === C.ink || ink === markInk ? '' : ink.slice(1)}" width="${2.6 * s}" height="${2.6 * s}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="${2.6 * s}" height="${2.6 * s}" fill="${C.paper}"/><line x1="0" y1="0" x2="0" y2="${2.6 * s}" stroke="${ink}" stroke-width="${0.85 * s}"/></pattern>`;
  const hatchId = (s, ink) => `url(#${uid}-h${s}${ink === C.ink || ink === markInk ? '' : ink.slice(1)})`;
  const bandInk = (line) => (color ? LINES[line] : C.ink);
  const patterns = (s) => `<defs>${hatch(s, C.ink)}${color ? ORDER.map((l) => hatch(s, LINES[l])).join('') : ''}</defs>`;

  // a ribbon from offset o0 to o1 (px, left of travel) along a screen polyline, mitred at the bends
  const nrm = (A, B) => { const dx = B[0] - A[0], dy = B[1] - A[1], n = Math.hypot(dx, dy) || 1; return [-dy / n, dx / n]; };
  const offset = (P, o) => P.map((p, i) => {
    const n1 = nrm(P[Math.max(0, i - 1)], P[Math.max(1, i)]);
    const n2 = nrm(P[Math.min(i, P.length - 2)], P[Math.min(i + 1, P.length - 1)]);
    const mx = n1[0] + n2[0], my = n1[1] + n2[1], ml = Math.hypot(mx, my) || 1;
    const k = o / Math.max(0.5, (mx * n1[0] + my * n1[1]) / ml) / ml;
    return [p[0] + mx * k, p[1] + my * k];
  });
  const pts = (P) => P.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join('L');
  const ribbon = (P, o0, o1) => `M${pts(offset(P, o0))}L${pts(offset(P, o1).reverse())}Z`;
  // an edge's rail path on screen, from a to b, without repeated points
  const screen = (e, fx, fy) => {
    const P = [];
    for (const [x, y] of e.path ?? [e.pa, e.pb]) {
      const q = [fx(x), fy(y)];
      if (!P.length || Math.hypot(q[0] - P.at(-1)[0], q[1] - P.at(-1)[1]) > 0.6) P.push(q);
    }
    if (P.length < 2) P.push([fx(e.pb[0]), fy(e.pb[1])]);
    return P;
  };
  // bands for one state: lines sharing a pair of stations sit side by side, centred on the track
  const bands = (st, fx, fy, bw, s, { tips = false, only = null } = {}) => {
    const key = (e) => [e.a, e.b].sort().join('-');
    const groups = new Map();
    for (const e of edges) {
      if (only && e.line !== only) continue;
      const [n, ns] = per(e, st);
      const w = n * bw;
      if (w < 0.3) continue;
      const k = key(e);
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push({ e, w, ws: n > 0 ? (w * ns) / n : 0 });
    }
    const solid = new Map(), hatched = new Map(), tipsOut = [];
    for (const list of groups.values()) {
      list.sort((p, q) => ORDER.indexOf(p.e.line) - ORDER.indexOf(q.e.line));
      const gap = 0.35;
      const total = list.reduce((t, b) => t + b.w, 0) + gap * (list.length - 1);
      let o = -total / 2;
      // the stack is laid out on one path for the pair (the first line's), in one direction
      const lo = key(list[0].e).split('-')[0];
      const base = screen(list[0].e, fx, fy);
      const P = list[0].e.a === lo ? base : [...base].reverse();
      for (const { e, w, ws } of list) {
        const inkPart = w - ws;
        const tone = bandInk(e.line);
        if (inkPart > 0.05) solid.set(tone, (solid.get(tone) ?? '') + ribbon(P, o, o + inkPart));
        if (ws > 0.05) hatched.set(tone, (hatched.get(tone) ?? '') + ribbon(P, o + inkPart, o + w));
        if (tips) tipsOut.push(edgeTip(e, st, P, o, w));
        o += w + gap;
      }
    }
    const paths = [];
    for (const [tone, d] of solid) paths.push(`<path d="${d}" fill="${tone}"/>`);
    for (const [tone, d] of hatched) paths.push(`<path d="${d}" fill="${hatchId(s, color ? tone : C.ink)}"/>`);
    return paths.join('') + tipsOut.join('');
  };
  // the hover target of a stretch (map, all day): a wide transparent ribbon with a route tooltip
  const edgeTip = (e, st, P, o, w) => {
    const [v, vs] = val(e, st);
    const a = byId.get(e.a), b = byId.get(e.b);
    const pad = Math.max(0, (6 - w) / 2);
    const sent = `About ${fmt(v)} ride-hail trips a day copy this stretch of the ${e.line} Line${vs >= 0.5 ? `; for ${fmt(vs)} of them the train ride needs stairs` : ''}.`;
    return `<g data-id="${e.line}-${e.a}-${e.b}" data-kind="route" data-tip="${esc(`${a.short} – ${b.short}`)}" data-name="${esc(`${a.short} – ${b.short}`)}" data-lines="${e.line}" data-keys="${e.line}" data-detail="${esc(sent)}" data-sep="${Math.max(1, Math.min(8, w)).toFixed(1)}" data-gray="${C.ink}" data-color="${LINES[e.line]}"><path d="${ribbon(P, o - pad, o + w + pad)}" fill="transparent"/></g>`;
  };
  // the 'L' track (data.rail, CTA's GTFS rail shapes, as Plate VII): pencil, under the bands
  const track = (fx, fy, w) =>
    (data.rail ?? []).map(({ line, path }) => `<path${hooks ? ` data-keys="${line}"` : ''} d="M${pts(path.map(([x, y]) => [fx(x), fy(y)]))}" fill="none" stroke="${color ? LINES[line] : C.pencil}" stroke-opacity="${color ? 0.55 : 0.6}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`).join('');
  const mark = (s, x, y, r) => {
    const c = stTint(s);
    return s.ada
      ? `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${c}"/>`
      : `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(r * 0.92).toFixed(2)}" fill="${C.paper}" stroke="${c}" stroke-width="${Math.max(0.9, r * 0.36).toFixed(2)}"/>`;
  };
  const station = (s, x, y, r) => {
    const m = mark(s, x, y, r);
    if (!hooks) return m;
    const hit = `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(r + 4).toFixed(1)}" fill="transparent"/>`;
    return `<g data-id="${s.id}" data-tip="${esc(s.short)}" data-name="${esc(s.short)}" data-lines="${s.lines.join(' ')}" data-ada="${s.ada ? 1 : 0}" data-keys="${s.lines.join(' ')} ${s.id}" data-detail="${esc(detail(s))}">${hit}${m}</g>`;
  };
  const drawStations = (list, fx, fy, r) => {
    for (const s of list.filter((d) => d.ada)) out.push(station(s, fx(s.x), fy(s.y), r));
    for (const s of list.filter((d) => !d.ada)) out.push(station(s, fx(s.x), fy(s.y), r));
  };
  const drawGrid = (xs, ys, X, Y, x0, x1, y0, y1) => {
    for (const x of xs) out.push(`<line x1="${X(x)}" x2="${X(x)}" y1="${y0}" y2="${y1}" stroke="${x === 0 ? C.pencil : C.grid}" stroke-width="${x === 0 ? 0.8 : 0.6}"/>`);
    for (const y of ys) out.push(`<line x1="${x0}" x2="${x1}" y1="${Y(y)}" y2="${Y(y)}" stroke="${y === 0 ? C.pencil : C.grid}" stroke-width="${y === 0 ? 0.8 : 0.6}"/>`);
  };

  if (isPlate) out.push(frame({
    plate: 'XIII',
    chapter: 'THE GAPS',
    day: 13,
    theme: 'Interactions',
    title: 'Car or Train',
    subtitle: 'Ride-hail trips that one ‘L’ ride could have made, drawn on the track they copy.',
  }));

  // the inset box: the Blue Line, Loop to Logan Square (data.inset.box), widened to half-miles
  const ib = data.inset.box;
  const snap = (v, f) => f(v / 400) * 400;
  const insetBox = { west: snap(ib.west - 300, Math.floor), east: snap(ib.east + 300, Math.ceil), south: snap(ib.south - 300, Math.floor), north: snap(ib.north + 300, Math.ceil) };
  const inBox = (b) => (s) => s.x >= b.west && s.x <= b.east && s.y >= b.south && s.y <= b.north;
  const inInset = inBox(insetBox);

  // ---------- main map: the extent of Plates II–XII ----------
  const ext = { west: -11200, east: 4800, south: -14000, north: 10400 };
  const mi = miles(ext);
  const field = isMap ? { x: 60, y: 250, w: 760, h: 1040 } : { x: 60, y: 262, w: 575, h: 830 };
  const k = Math.min(field.w / (mi.east - mi.west), field.h / (mi.north - mi.south));
  const kPlate = Math.min(575 / (mi.east - mi.west), 830 / (mi.north - mi.south));
  const bwAt = (kk) => (MAXW / maxPer) * (kk / kPlate); // band px per (trip per 1,000), at a scale of kk px per mile
  const X = (x) => field.x + (toMiles(x, 'x') - mi.west) * k;
  const Y = (y) => field.y + (mi.north - toMiles(y, 'y')) * k;
  const fx0 = X(ext.west), fx1 = X(ext.east), fy0 = Y(ext.north), fy1 = Y(ext.south);
  const g = gridLines(ext);
  const gl = 8 * T;
  const labelLen = 7 * (gl * 0.6 + 0.4);
  const colX = fx1 + 6 + labelLen;
  const labelTop = fy0 - 6 - labelLen;
  const rMap = isMap ? 2.6 : 2.2;
  const sMap = isMap ? 1.25 : 1;

  if (isPlate || isMap) {
    out.push(patterns(sMap));
    out.push(`<defs><clipPath id="${uid}-map"><rect x="${fx0}" y="${fy0}" width="${fx1 - fx0}" height="${fy1 - fy0}"/></clipPath></defs>`);
    out.push(`<g clip-path="url(#${uid}-map)">`);
    if (boundary.length) out.push(`<path d="${city(X, Y)}" fill="${C.ground}" fill-rule="evenodd"/>`);
    drawGrid(g.xs, g.ys, X, Y, fx0, fx1, fy0, fy1);
    out.push(track(X, Y, isMap ? 0.9 : 0.7));
    const bw = bwAt(k);
    if (isMap) {
      for (const st of states) {
        out.push(`<g data-state="${st}"${st === 'all' ? '' : ' display="none"'}>${bands(st, X, Y, bw, sMap, { tips: st === 'all' })}${stateLabel(st)}</g>`);
      }
    } else out.push(bands('all', X, Y, bw, sMap));
    out.push('</g>');
    const gridLabel = (v) => (v === 0 ? { fill: C.ink, weight: 600 } : { fill: C.pencil });
    for (const x of g.xs) out.push(text(X(x) + gl * 0.35, labelTop, formatAddress(x, 'x'), { size: gl, spacing: 0.4, rotate: -90, anchor: 'end', ...gridLabel(x) }));
    for (const y of g.ys) out.push(text(colX, Y(y) + gl * 0.35, formatAddress(y, 'y'), { size: gl, spacing: 0.4, anchor: 'end', ...gridLabel(y) }));

    out.push(`<rect${hooks ? ` data-inset-frame data-y0="${+Y(0).toFixed(2)}"` : ''} x="${X(insetBox.west)}" y="${Y(insetBox.north)}" width="${X(insetBox.east) - X(insetBox.west)}" height="${Y(insetBox.south) - Y(insetBox.north)}" fill="none" stroke="${C.ink}" stroke-width="0.6" stroke-dasharray="2 2"/>`);
    const inExt = (s) => s.x >= ext.west && s.x <= ext.east && s.y >= ext.south && s.y <= ext.north;
    drawStations(stations.filter(inExt), X, Y, rMap);

    // names of the stations most copied outside the Loop and the inset (the inset names its own)
    const far = (s) => Math.hypot(toMiles(s.x, 'x'), toMiles(s.y, 'y')) > 1.4;
    const named = [];
    for (const s of stations.filter((d) => inExt(d) && far(d) && !inInset(d)).sort((a, b) => b.copies - a.copies)) {
      if (named.length < 6 && named.every((n) => Math.hypot(toMiles(n.x, 'x') - toMiles(s.x, 'x'), toMiles(n.y, 'y') - toMiles(s.y, 'y')) > 2)) named.push(s);
    }
    out.push(...placeLabels(named, X, Y, rMap, 7.5 * T, { x0: fx0, x1: fx1 }).map(([, t]) => t));

    // mile ruler
    const rx = X(ext.west + 800), ry = Y(ext.south) - k * 0.35;
    out.push(`<line x1="${rx}" x2="${rx + 4 * k}" y1="${ry}" y2="${ry}" stroke="${C.ink}" stroke-width="1.2"/>`);
    for (let i = 0; i <= 4; i++) out.push(`<line x1="${rx + i * k}" x2="${rx + i * k}" y1="${ry - (i % 4 === 0 ? 6 : 4)}" y2="${ry}" stroke="${C.ink}" stroke-width="1.2"/>`);
    out.push(text(rx, ry - 9, '0', { size: 7.5 * T, anchor: 'middle' }));
    out.push(text(rx + 4 * k, ry - 9, '4 MI', { size: 7.5 * T, anchor: 'middle' }));

    // legend
    const lgs = 9 * T;
    const tone = color ? LINES.Red : C.ink;
    const bandSw = (h, fill) => `<rect x="-9" y="${-h / 2}" width="18" height="${h}" fill="${fill}"/>`;
    const lpat = `<defs><pattern id="${uid}-lh" width="2.6" height="2.6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="2.6" height="2.6" fill="${C.paper}"/><line x1="0" y1="0" x2="0" y2="2.6" stroke="${tone}" stroke-width="0.85"/></pattern></defs>`;
    const wKey = (n) => bandSw(n * bwAt(k), tone);
    const dot = mark({ ada: true, lines: [] }, 0, 0, 3);
    const hollow = mark({ ada: false, lines: [] }, 0, 0, 3);
    if (isPlate) {
      const items = [
        ['head', 'Ride-hail trips that copy a one-seat ‘L’ ride'],
        [lpat + bandSw(7, tone), 'train ride step-free'],
        [bandSw(7, `url(#${uid}-lh)`), 'needs stairs'],
        [dot, 'accessible'],
        [hollow, 'non-accessible'],
      ];
      let lx = 60;
      const y = 203;
      for (const [m, lab] of items) {
        if (m === 'head') {
          out.push(text(lx, y, `${lab}:`, { size: lgs, fill: C.pencil }));
          lx += textWidth(`${lab}:`, lgs) + 8;
          continue;
        }
        out.push(`<g transform="translate(${lx + 9} ${y - lgs * 0.35})">${m}</g>`);
        out.push(text(lx + 22, y, lab, { size: lgs, fill: C.pencil }));
        lx += 22 + textWidth(lab, lgs) + 10;
      }
    } else {
      const items = [
        ['head', 'Ride-hail trips that copy a one-seat ‘L’ ride'],
        [lpat + bandSw(8, tone), 'the train ride is step-free'],
        [bandSw(8, `url(#${uid}-lh)`), 'the train ride needs stairs'],
        ['gap'],
        [wKey(10), '10 per 1,000 ride-hail trips'],
        [wKey(40), '40 per 1,000'],
        ['gap'],
        [dot, 'Accessible station'],
        [hollow, 'Non-accessible'],
      ];
      out.push(legendBox(items, { x: rx, bottom: Y(ext.south) - k, k, size: lgs }));
    }
  }

  if (isMap) {
    return svg(out.join(''), { label: mapLabel(summary), viewBox: `60 184 ${Math.ceil(colX + 4 - 60)} 1114`, align: 'xMinYMin meet' })
      .replace('<svg ', `<svg data-top="${labelTop - 184}" data-bottom="${fy1 - 184}" data-ftop="${+(fy0 - 184).toFixed(2)}" data-ppm="${+k.toFixed(3)}" `);
  }

  // the state's name and numbers, in the lake (page map only)
  function stateLabel(st) {
    const x = fx1 - 14, y = Y(ext.north) + 40;
    const h = st === 'all' ? null : Number(st.slice(1));
    const head = h == null ? 'ALL DAY' : hourName(h).toUpperCase();
    const share = h == null ? summary.copyShare : hours.copies[h] / hours.trips[h];
    const trains = h == null ? `${fmt(sum(hours.trains))} trains a day` : `${Math.round(hours.trains[h])} trains leave this hour`;
    return text(x, y, head, { size: 15, weight: 600, spacing: 1, anchor: 'end', halo: C.paper }) +
      text(x, y + 19, `${Math.round(share * 100)}% of ride-hail trips copy the ‘L’`, { size: 12.5, font: SERIF, italic: true, fill: C.ink, anchor: 'end', halo: C.paper }) +
      text(x, y + 36, trains, { size: 12.5, font: SERIF, italic: true, fill: C.pencil, anchor: 'end', halo: C.paper });
  }

  // ---------- margin column (plate), chart (page) ----------
  const mx = isPlate ? Math.round(colX + 38) : isChart ? 2 : 0;
  const cw = isChart ? 390 : W_COL;
  const title = (y, str) => out.push(text(mx, y, str, { size: 10.5 * T, weight: 600, spacing: 1 }));
  const ns = 10.5, nh = 14;
  const note = (y, str) => out.push(text(mx, y, str, { size: ns, font: SERIF, italic: true, fill: C.pencil }));
  let uy = 0;

  if (isPlate || isChart) {
    // 24 columns: fog bar = 'L' trains leaving their first stop that hour (the week's average day); ink
    // line and dots = the share of ride-hail trips that copy the 'L'
    const cs = isChart ? 8 * T : 8;
    if (isChart) uy = 6;
    else {
      uy = Math.round(labelTop + 10.5 * T * 0.72);
      title(uy, CHART_TITLE.toUpperCase());
      const noteLines = wrap(CHART_NOTE, Math.floor(cw / (ns * 0.45)));
      noteLines.forEach((l, i) => note(uy + (i + 1) * nh + 4, l));
      uy += noteLines.length * nh + 22;
    }
    const ch = isChart ? 200 : 150;
    const top = uy + (isChart ? 22 : 18), base = top + ch;
    const left = isChart ? 34 : 30, right = mx + cw;
    const colW = (right - (mx + left)) / 24;
    const cx = (h) => mx + left + (h + 0.5) * colW;
    const tMax = Math.max(...hours.trains);
    const sMax = 0.4;
    const ty = (v) => base - (v / tMax) * ch * 0.62;
    const sy = (v) => base - (v / sMax) * ch;
    const shares = hours.copies.map((c, h) => c / hours.trips[h]);
    // share axis: 0, 10, 20, 30, 40%
    for (const v of [0, 0.1, 0.2, 0.3, 0.4]) {
      out.push(`<line x1="${mx + left}" x2="${right}" y1="${sy(v).toFixed(1)}" y2="${sy(v).toFixed(1)}" stroke="${v === 0 ? C.pencil : C.rule}" stroke-width="${v === 0 ? 0.7 : 0.6}"/>`);
      out.push(text(mx + left - 5, sy(v) + cs * 0.35, `${v * 100}%`, { size: cs * 0.9, anchor: 'end', fill: C.pencil }));
    }
    if (hooks) out.push(`<style>.${uid}-col .bg{transition:fill .12s}.${uid}-col:hover .bg,.${uid}-col.on .bg{fill:${C.rule}}</style>`);
    for (let h = 0; h < 24; h++) {
      const key = `h${String(h).padStart(2, '0')}`;
      if (hooks) {
        const tip = `${Math.round(shares[h] * 100)}% of ride-hail trips copy a one-seat ‘L’ ride|About ${hundreds(hours.copies[h])} such trips in this hour, on an average day|${Math.round(hours.trains[h])} trains leave their first stop`;
        out.push(`<g class="${uid}-col" data-state-key="${key}" data-tip="${hourName(h)}" data-name="${hourName(h)}" data-shape="none" data-detail="${esc(tip)}"><rect class="bg" x="${(cx(h) - colW / 2).toFixed(1)}" y="${top - 12}" width="${colW.toFixed(1)}" height="${ch + 12}" fill="transparent"/>`);
      }
      out.push(`<rect x="${(cx(h) - colW * 0.36).toFixed(1)}" y="${ty(hours.trains[h]).toFixed(1)}" width="${(colW * 0.72).toFixed(1)}" height="${(base - ty(hours.trains[h])).toFixed(1)}" fill="${C.fog}"/>`);
      if (hooks) out.push('</g>');
    }
    out.push(`<path d="M${shares.map((v, h) => `${cx(h).toFixed(1)},${sy(v).toFixed(1)}`).join('L')}" fill="none" stroke="${C.ink}" stroke-width="${isChart ? 1.6 : 1.3}" stroke-linejoin="round" pointer-events="none"/>`);
    for (let h = 0; h < 24; h++) out.push(`<circle cx="${cx(h).toFixed(1)}" cy="${sy(shares[h]).toFixed(1)}" r="${isChart ? 2.4 : 2}" fill="${C.ink}" pointer-events="none"/>`);
    // notes on the two ends of the story: the night peak and the morning trains
    const pk = shares.indexOf(Math.max(...shares));
    out.push(text(cx(pk) + 5, sy(shares[pk]) - 6, `${Math.round(shares[pk] * 100)}% at ${hourName(pk)}`, { size: cs, weight: 600, fill: C.ink, halo: C.paper }));
    const tp = hours.trains.indexOf(tMax);
    out.push(text(cx(tp), ty(tMax) - 5, `${Math.round(tMax)} trains`, { size: cs * 0.9, anchor: 'middle', fill: C.pencil, halo: C.paper }));
    for (const [h, lab] of [[0, 'MIDNIGHT'], [6, '6 A.M.'], [12, 'NOON'], [18, '6 P.M.']]) {
      out.push(`<line x1="${cx(h)}" x2="${cx(h)}" y1="${base}" y2="${base + 3}" stroke="${C.pencil}" stroke-width="0.7"/>`);
      out.push(text(cx(h), base + 4 + cs, lab, { size: cs * 0.85, spacing: 0.3, anchor: 'middle', fill: C.pencil }));
    }
    uy = base + 4 + cs;
    if (isChart) {
      out.push(text(mx + left, uy + cs * 2, 'Hover or tap an hour to show it on the map.', { size: cs * 0.95, font: SERIF, italic: true, fill: C.pencil }));
      uy += cs * 2;
      return svg(out.join(''), { label: `${CHART_TITLE}: ${Math.round(summary.midShare * 100)}% of ride-hail trips copy the ‘L’ at midday, ${Math.round(summary.nightShare * 100)}% between 1 and 3 a.m.`, viewBox: `0 0 ${cw + 6} ${Math.ceil(uy + 8)}`, align: 'xMinYMin meet' })
        .replace('<svg ', '<svg data-state-host tabindex="0" ');
    }
  }

  // ---------- inset ----------
  const cyI = (insetBox.north + insetBox.south) / 2;
  const box = isInset ? { ...insetBox, north: cyI + 4200, south: cyI - 4200 } : insetBox;
  const lbm = miles(box);
  const iw = isInset ? 390 : W_COL;
  const ki = iw / (lbm.east - lbm.west);
  const ty = uy + 34;
  if (isPlate) {
    title(ty, `INSET · ${INSET_TITLE.toUpperCase()}`);
    note(ty + nh + 4, `×${(ki / k).toFixed(1)} the main map; Blue Line bands only, ×${INSET_BANDS}.`);
  }
  const inset = isInset ? { x: 0, y: 0, w: iw, h: Math.round((lbm.north - lbm.south) * ki) } : { x: mx, y: ty + nh + 14, w: iw, h: Math.round((lbm.north - lbm.south) * ki) };
  if (isInset) out.push(patterns(1.6));
  else out.push(patterns(1.35));
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
  out.push(track(IX, IY, isInset ? 1.4 : 1.1));
  out.push(bands('all', IX, IY, bwAt(k) * INSET_BANDS, isInset ? 1.6 : 1.35, { tips: isInset, only: 'Blue' }));
  const inBoxMi = (b) => (s) => { const x = toMiles(s.x, 'x'), y = toMiles(s.y, 'y'); return x >= b.west - 0.2 && x <= b.east + 0.2 && y >= b.south - 0.2 && y <= b.north + 0.2; };
  const ri = isInset ? 3.6 : 3;
  const inI = stations.filter(inBoxMi(lbm));
  drawStations(inI, IX, IY, ri);
  // names along the Blue Line's O'Hare branch, outside the Loop's crowd
  out.push(...placeLabels(inI.filter((s) => s.lines.includes('Blue') && s.y > 300 && s.x < -500 && IY(s.y) > inset.y + 14), IX, IY, ri, 7.5 * TI, { x0: inset.x, x1: inset.x + inset.w }).map(([, t]) => t));
  if (lbm.west < 0 && lbm.east > 0) out.push(text(IXm(0) + 3, inset.y + inset.h - 5, 'STATE', { size: 7 * TI, fill: C.ink, weight: 600, halo: C.paper }));
  if (lbm.south < 0 && lbm.north > 0) out.push(text(inset.x + 4, IYm(0) - 3, 'MADISON', { size: 7 * TI, fill: C.ink, weight: 600, halo: C.paper }));
  out.push('</g>');
  if (isPlate) out.push(`<rect x="${inset.x}" y="${inset.y}" width="${inset.w}" height="${inset.h}" fill="none" stroke="${C.ink}" stroke-width="0.8"/>`);

  if (isInset) {
    return svg(out.join(''), { label: `${INSET_TITLE}: ride-hail trips that copy the Blue Line, and how many of their train rides need stairs.`, viewBox: `0 0 ${inset.w} ${inset.h}`, align: 'xMidYMid slice' })
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
    ['TRIPS', `City of Chicago, Transportation Network Providers – Trips · ${data.ledger.dataset_id} · September 2026, ${fmt(summary.tripsKnown)} trips with both census tracts (${Math.round(summary.knownShare * 100)}%)`],
    ['COPY', `Both tracts have residents within ${summary.reachMi} mi (straight line) of stations on one line; counted by that expected share (2020 blocks)`],
    ['STAIRS', 'The same test with accessible stations only; the rest of the copy needs stairs. Accessible: portal flag, Racine and Austin per CTA'],
    ['TRAINS', `CTA GTFS, feed of ${data.gtfsDate}: trains leaving their first stop each hour, the week’s average day; bands on its rail shapes`],
    ['FARE', `Ride-hail fare as reported (rounded to the nearest $2.50, no tips or charges) against the CTA fare of $${summary.fare.toFixed(2)}`],
    ['LIMITS', 'City of Chicago, Boundaries – City · qqq8-j68g; stations: CTA List of ‘L’ Stops · 8pix-ypme'],
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
export const CHART_TITLE = 'When the train thins';
export const CHART_NOTE = 'Line: share of ride-hail trips that copy a one-seat ‘L’ ride, by the hour they start · Bars: ‘L’ trains leaving their first stop';
export const INSET_TITLE = 'The Blue Line, Loop to Logan Square';

const sum = (a) => a.reduce((t, v) => t + v, 0);
const fmt = (n) => Math.round(n).toLocaleString('en-US');
export const hourName = (h) => (h === 0 ? 'midnight' : h === 12 ? 'noon' : h < 12 ? `${h} a.m.` : `${h - 12} p.m.`);
export const hundreds = (n) => fmt(Math.round(n / 100) * 100);

export function detail(s) {
  return [s.ada ? 'Accessible' : 'Non-accessible', s.copies >= 50 ? `About ${hundreds(s.copies)} ride-hail trips a day that copy its line start or end within half a mile` : 'Few ride-hail trips copy its line from here'].join('|');
}

// Names next to their marks: each tries right-up, right-down, left-up, left-down and takes the first
// spot that overlaps no mark and no name already placed, inside x0..x1 (as Plates VII–VIII).
function placeLabels(list, fx, fy, r, size, { x0, x1, avoid = [] }) {
  const boxes = [...avoid, ...list.map((s) => { const x = fx(s.x), y = fy(s.y); return [x - r * 1.4, y - r * 1.4, x + r * 1.4, y + r * 1.4]; })];
  const hit = (a, b) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
  const placed = [], labels = new Map();
  for (const s of [...list].sort((a, b) => fy(a.y) - fy(b.y))) {
    const x = fx(s.x), y = fy(s.y), t = s.short, w = textWidth(t, size, { weight: 500 });
    const spots = [[r * 2.2, -r * 0.8, 'start'], [r * 2.2, r * 0.8 + size * 0.75, 'start'], [-r * 2.2, -r * 0.8, 'end'], [-r * 2.2, r * 0.8 + size * 0.75, 'end']];
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
  `Plate XIII, Car or Train: about ${fmt(Math.round(summary.copyDay / 1000) * 1000)} ride-hail trips a day copy a one-seat ‘L’ ride, ${Math.round(summary.copyShare * 100)}% of trips with known tracts; between 1 and 3 a.m., ${Math.round(summary.nightShare * 100)}%.`;
