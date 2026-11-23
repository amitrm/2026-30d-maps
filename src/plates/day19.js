// Plate XIX · What You Breathe While You Wait · Day 19 Senses: Smell
import { C, SERIF, esc, text, textWidth, legendBox, wrap, frame, svg } from '../lib/plate.js';
import { gridLines, formatAddress, toMiles } from '../lib/grid.js';

// variant 'plate': the full 1080 x 1350 plate (export, download).
// variant 'map': the map alone, with hover hooks, for the day page's left column.
// variant 'chart': NO2 by hour of the day, with hover hooks.
// variant 'inset': the Southwest Side inset alone, drawn tall so the page can crop it.
// Nitrogen dioxide on weekday mornings (7-9 a.m.), from the Open Air Chicago sensors, spread into a smooth
// surface in the notebook and drawn here as illuminated contours (Tanaka): bands between whole ppb,
// darker where the air holds more NO2; each contour lit white where its slope faces the light in the
// northwest and shaded ink where it faces away, its width following the angle to the light.
// Band rings and lines arrive in thousandths of a mile; each line carries one light step per segment
// (data.lines[].lit, '0'-'8', 4 = side-on).

// Gray mode: light to dark gray; color mode: oxide red, pale clay to dark red. Sensors: paper dots
// in gray, ink dots in color.
const RAMPS = {
  gray: ['#EAE8E2', '#E2E0D9', '#D9D7D0', '#CFCDC6', '#C5C3BC', '#BAB8B1', '#AFADA6', '#A3A19A', '#97958E', '#8A8882', '#7D7B75', '#6F6D68'],
  // oxide red (decided 2026-11-22, palette study D)
  color: ['#F1EBE3', '#ECDDD2', '#E6D0C1', '#E0BFAE', '#D9AF9B', '#D19C88', '#C88975', '#BC7564', '#AE6255', '#9E5048', '#88413C', '#733330'],
};
const LIT = '#FFFFFF';

// The inset: Pulaski to Halsted, Cermak (2200 S) to Garfield (5500 S), the high ground of the map.
export const INSET_BOX = { west: -4000, east: -800, south: -5500, north: -2200 };
export const INSET_TITLE = 'Inset · Pulaski to Halsted, Cermak to Garfield';
export const CHART_TITLE = 'NO₂ by hour of the day';
export const CHART_NOTE = 'Middle sensor, line; middle half of the sensors, band · Weekdays in ink, weekends dashed · ppb';
const EW = { '-2200': 'CERMAK', '-2600': '26TH', '-3100': '31ST', '-3500': '35TH', '-3900': 'PERSHING', '-4300': '43RD', '-4700': '47TH', '-5100': '51ST', '-5500': 'GARFIELD', '-5900': '59TH', '-6300': '63RD', '-1600': '16TH', '-1200': 'ROOSEVELT' };
const NS = { '-4000': 'PULASKI', '-3200': 'KEDZIE', '-2400': 'WESTERN', '-1600': 'ASHLAND', '-800': 'HALSTED' };

export const hourName = (h) => `${h % 12 || 12} ${h < 12 ? 'a.m.' : 'p.m.'}`;
const one = (v) => Number(v).toFixed(1);

export function bandLabel(bands, i) {
  const lo = bands[i].lo;
  if (i === 0) return `Under ${lo + 1} ppb`;
  if (i === bands.length - 1) return `${lo} ppb and more`;
  return `${lo}–${lo + 1} ppb`;
}

export function renderDay19(data, { mode = 'gray', variant = 'plate' } = {}) {
  const { bands, lines, summary: s, curve, boundary = [] } = data;
  const out = [];
  const isPlate = variant === 'plate';
  const isMap = variant === 'map';
  const isChart = variant === 'chart';
  const isInset = variant === 'inset';
  const hooks = isMap || isChart || isInset;
  const uid = `d19-${variant}-${mode}`;
  const T = isMap || isChart ? 1.3 : 1.15;
  const TI = isInset ? 1.35 : 1.15;
  const color = mode === 'color';
  const base = RAMPS[color ? 'color' : 'gray'];
  // one shade per band, spread over the twelve-step ramp
  const shade = bands.map((_, i) => base[Math.round((i / Math.max(1, bands.length - 1)) * (base.length - 1))]);
  const dot = color ? { fill: C.ink, stroke: C.paper } : { fill: C.paper, stroke: C.ink };
  const sensors = data.sensors.map((r) => Object.fromEntries(data.sensorCols.map((c, i) => [c, r[i]])));

  // ---------- hover cards ----------
  // tooltip meter: the map's own bands, lowest to highest; the end bands are open, so ticks mark inner edges only
  const mLo = bands[0].lo, mHi = bands[bands.length - 1].lo + 1;
  const ticks = []; for (let t = mLo + 1; t < mHi; t += 2) ticks.push(t);
  const meter = (o) => ({ ramp: shade, lo: mLo, hi: mHi, ticks, ...o });
  const sensorCard = (r) => ({
    name: r.sensor_name,
    aside: r.side ?? '',
    big: [one(r.no2_rush), 'ppb NO₂, weekday mornings 7–9 a.m.'],
    meter: meter({ value: r.no2_rush, cap: 'ppb, weekday mornings' }),
    foot: [`All hours ${one(r.no2_median)} ppb`, `PM2.5 ${one(r.pm_rush)} µg/m³`],
  });
  const bandCard = (i) => ({
    name: bandLabel(bands, i),
    big: [bands[i].stops.toLocaleString('en-US'), `CTA bus stop${bands[i].stops === 1 ? '' : 's'} in this band`],
    meter: meter({ band: [bands[i].lo, bands[i].lo + 1], cap: 'ppb, weekday mornings' }),
    foot: [`${Math.round(bands[i].area * 1000) / 10}% of the city drawn`, '7–9 a.m.'],
  });
  const attr = (o) => esc(JSON.stringify(o)).replace(/"/g, '&quot;');
  const hover = (kind, tip, card, inner, extra = '') =>
    hooks ? `<g data-kind="card" data-tip="${esc(tip)}" data-name="${esc(tip)}"${extra} data-card="${attr(card)}">${inner}</g>` : inner;

  // ---------- drawing: bands, then lit lines, at any scale ----------
  const ringD = (rg, P) => 'M' + rg.map(([x, y]) => P(x / 1000, y / 1000).map((v) => v.toFixed(1)).join(',')).join('L') + 'Z';
  const drawSurface = (P, w, { labels = false, clipBox = null } = {}) => {
    bands.forEach((b, i) => {
      if (!b.rings.length) return;
      out.push(hover('band', bandLabel(bands, i), bandCard(i), `<path d="${b.rings.map((r) => ringD(r, P)).join('')}" fill="${shade[i]}" fill-rule="evenodd"/>`, ` data-keys="band${i}"`));
    });
    // grid over the tints, under the contours
    if (clipBox) out.push(clipBox());
    // nine light steps: 0-3 shaded (ink), 4 side-on (skipped), 5-8 lit (white); width by the angle
    const buckets = Array.from({ length: 9 }, () => []);
    for (const l of lines) {
      const pts = l.pts.map(([x, y]) => P(x / 1000, y / 1000));
      for (let i = 1; i < pts.length; i++) buckets[+l.lit[i - 1]].push(`M${pts[i - 1][0].toFixed(1)},${pts[i - 1][1].toFixed(1)}L${pts[i][0].toFixed(1)},${pts[i][1].toFixed(1)}`);
    }
    const g = [];
    buckets.forEach((segs, k) => {
      if (k === 4 || !segs.length) return;
      const a = Math.abs(k - 4) / 4;
      g.push(`<path d="${segs.join('')}" fill="none" stroke="${k > 4 ? LIT : C.ink}" stroke-width="${(w[0] + (w[1] - w[0]) * a).toFixed(2)}" stroke-linecap="round"/>`);
    });
    out.push(`<g pointer-events="none">${g.join('')}</g>`);
    if (labels) {
      // a whole-ppb label on the longest stretch of each even contour, kept apart from each other
      const placed = [];
      const ls = 6.6 * (isMap ? 1.25 : 1);
      for (const l of [...lines].sort((a, b) => b.pts.length - a.pts.length)) {
        if (l.lev % 2) continue;
        if (l.pts.length < 14) continue;
        const m = Math.floor(l.pts.length / 2);
        const [ax, ay] = P(l.pts[m - 2][0] / 1000, l.pts[m - 2][1] / 1000);
        const [bx, by] = P(l.pts[m + 2][0] / 1000, l.pts[m + 2][1] / 1000);
        const [cx, cy] = P(l.pts[m][0] / 1000, l.pts[m][1] / 1000);
        if (placed.some(([px, py]) => Math.hypot(px - cx, py - cy) < 70 * (isMap ? 1.3 : 1))) continue;
        let ang = (Math.atan2(by - ay, bx - ax) * 180) / Math.PI;
        if (ang > 90) ang -= 180;
        if (ang < -90) ang += 180;
        placed.push([cx, cy]);
        const i = bands.findIndex((b) => b.lo === l.lev);
        out.push(`<g pointer-events="none" transform="translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${ang.toFixed(0)})">${text(0, ls * 0.35, String(l.lev), { size: ls, weight: 600, anchor: 'middle', fill: C.ink, halo: shade[Math.max(0, i)] })}</g>`);
      }
    }
  };
  const sensorDots = (P, r, sw, { values = false, box = null } = {}) => {
    for (const sn of sensors) {
      const [x, y] = P(sn.x, sn.y);
      if (box && (x < box.x0 || x > box.x1 || y < box.y0 || y > box.y1)) continue;
      let inner = `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${dot.fill}" stroke="${dot.stroke}" stroke-width="${sw}"/>`;
      if (hooks) inner = `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(r * 3).toFixed(1)}" fill="transparent"/>` + inner;
      if (values) inner += text(+(x + r + 2).toFixed(1), +(y + 3).toFixed(1), one(sn.no2_rush), { size: 7.2 * TI, fill: C.ink, halo: C.paper });
      out.push(hover('sensor', sn.sensor_name, sensorCard(sn), inner));
    }
  };
  const ring = (rg, fx, fy) => 'M' + rg.map(([x, y]) => `${fx(x).toFixed(1)},${fy(y).toFixed(1)}`).join('L') + 'Z';
  const miles = (b) => ({ west: toMiles(b.west, 'x'), east: toMiles(b.east, 'x'), south: toMiles(b.south, 'y'), north: toMiles(b.north, 'y') });

  if (isPlate) out.push(frame({
    plate: 'XIX',
    chapter: 'THE BODY',
    day: 19,
    theme: 'SENSES: SMELL',
    title: 'What You Breathe While You Wait',
    subtitle: 'Nitrogen dioxide, the trace of traffic exhaust, on weekday mornings, drawn as land lit from the northwest: the higher the ground, the dirtier the air.',
  }));

  // ---------- main map: the extent of Plates II–XVIII ----------
  const ext = { west: -11200, east: 4800, south: -14000, north: 10400 };
  const mi = miles(ext);
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
  const ws = k / 28.75; // stroke scale against the plate
  const W_LINE = [0.25 * ws, 1.6 * ws];

  if (isPlate || isMap) {
    out.push(`<defs><clipPath id="${uid}-map"><rect x="${fx0}" y="${fy0}" width="${fx1 - fx0}" height="${fy1 - fy0}"/></clipPath></defs>`);
    out.push(`<g clip-path="url(#${uid}-map)">`);
    if (boundary.length) out.push(`<path d="${boundary.map((r) => ring(r, X, Y)).join('')}" fill="${C.ground}" fill-rule="evenodd"/>`);
    const grid = () => {
      const gg = [];
      for (const x of g.xs) gg.push(`<line x1="${X(x)}" x2="${X(x)}" y1="${fy0}" y2="${fy1}" stroke="${x === 0 ? C.pencil : C.grid}" stroke-width="${x === 0 ? 0.8 : 0.6}" opacity="${x === 0 ? 0.8 : 0.55}"/>`);
      for (const y of g.ys) gg.push(`<line x1="${fx0}" x2="${fx1}" y1="${Y(y)}" y2="${Y(y)}" stroke="${y === 0 ? C.pencil : C.grid}" stroke-width="${y === 0 ? 0.8 : 0.6}" opacity="${y === 0 ? 0.8 : 0.55}"/>`);
      return `<g pointer-events="none">${gg.join('')}</g>`;
    };
    drawSurface((x, y) => [XM(x), YM(y)], W_LINE, { labels: true, clipBox: grid });
    sensorDots((x, y) => [XM(x), YM(y)], 1.35 * ws + 0.15, 0.55);
    out.push('</g>');
    const gridLabel = (v) => (v === 0 ? { fill: C.ink, weight: 600 } : { fill: C.pencil });
    for (const x of g.xs) out.push(text(X(x) + gl * 0.35, labelTop, formatAddress(x, 'x'), { size: gl, spacing: 0.4, rotate: -90, anchor: 'end', ...gridLabel(x) }));
    for (const y of g.ys) out.push(text(colX, Y(y) + gl * 0.35, formatAddress(y, 'y'), { size: gl, spacing: 0.4, anchor: 'end', ...gridLabel(y) }));

    // inset outline; the page moves it to the cropped extent (data-inset-frame, Madison's y in data-y0)
    out.push(`<rect${hooks ? ` data-inset-frame data-y0="${+YM(0).toFixed(2)}"` : ''} x="${X(INSET_BOX.west)}" y="${Y(INSET_BOX.north)}" width="${X(INSET_BOX.east) - X(INSET_BOX.west)}" height="${Y(INSET_BOX.south) - Y(INSET_BOX.north)}" fill="none" stroke="${C.ink}" stroke-width="0.7" stroke-dasharray="2 2" pointer-events="none"/>`);

    // mile ruler
    const rx = X(ext.west + 800), ry = Y(ext.south) - k * 0.35;
    out.push(`<line x1="${rx}" x2="${rx + 4 * k}" y1="${ry}" y2="${ry}" stroke="${C.ink}" stroke-width="1.2"/>`);
    for (let i = 0; i <= 4; i++) out.push(`<line x1="${rx + i * k}" x2="${rx + i * k}" y1="${ry - (i % 4 === 0 ? 6 : 4)}" y2="${ry}" stroke="${C.ink}" stroke-width="1.2"/>`);
    out.push(text(rx, ry - 9, '0', { size: 7.5 * T, anchor: 'middle' }));
    out.push(text(rx + 4 * k, ry - 9, '4 MI', { size: 7.5 * T, anchor: 'middle' }));

    // legend: a ramp of the bands with their ppb, the lit contour, the sensor
    const lgs = 9 * T;
    const rampSw = (n, cw, ch) => shade.slice(0, n).map((c, i) => `<rect x="${-cw * n / 2 + i * cw}" y="${-ch / 2}" width="${cw}" height="${ch}" fill="${c}"/>`).join('');
    const litSw = `<rect x="-9" y="-5" width="18" height="10" fill="${shade[Math.floor(bands.length / 2)]}"/><path d="M-9,-1.5C-4,-5 4,-5 9,-1.5" fill="none" stroke="${LIT}" stroke-width="1.4"/><path d="M-9,3C-4,6.5 4,6.5 9,3" fill="none" stroke="${C.ink}" stroke-width="1.4"/>`;
    const sensorSw = `<circle cx="0" cy="0" r="2.4" fill="${dot.fill}" stroke="${dot.stroke}" stroke-width="0.7"/>`;
    const citySw = `<rect x="-5" y="-5" width="10" height="10" fill="${C.ground}"/>`;
    if (isPlate) {
      // one line: the full ramp with its end values, then the marks
      let lx = 60;
      const y = 203, cw = 11;
      out.push(text(lx, y, `${bands[0].lo + 1}`, { size: lgs, fill: C.pencil }));
      lx += textWidth(`${bands[0].lo + 1}`, lgs) + 4;
      shade.forEach((c, i) => out.push(`<rect x="${lx + i * cw}" y="${y - lgs * 0.78}" width="${cw}" height="${lgs * 0.9}" fill="${c}"/>`));
      lx += shade.length * cw + 4;
      const rampLab = `${bands.at(-1).lo} ppb NO₂, weekdays 7–9 a.m.`;
      out.push(text(lx, y, rampLab, { size: lgs, fill: C.pencil }));
      lx += textWidth(rampLab, lgs) + 14;
      for (const [m, lab] of [[litSw, 'contour every 1 ppb, lit from the NW'], [sensorSw, 'sensor']]) {
        out.push(`<g transform="translate(${lx + 9} ${y - lgs * 0.35})">${m}</g>`);
        out.push(text(lx + 22, y, lab, { size: lgs, fill: C.pencil }));
        lx += 22 + textWidth(lab, lgs) + 12;
      }
    } else {
      out.push(legendBox([
        ['head', 'Weekday mornings, 7–9 a.m.'],
        [rampSw(5, 4.4, 9), `NO₂ in ppb, ${bands[0].lo + 1} or less (light) to ${bands.at(-1).lo} or more (dark)`],
        [litSw, 'Contour every 1 ppb, lit from the northwest'],
        [sensorSw, 'Open Air Chicago sensor'],
        ['gap'],
        [citySw, 'City of Chicago'],
      ], { x: rx, bottom: Y(ext.south) - k, k, size: lgs }));
    }
  }

  if (isMap) {
    return svg(out.join(''), { label: mapLabel(s), viewBox: `60 184 ${Math.ceil(colX + 4 - 60)} 1114`, align: 'xMinYMin meet' })
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
      uy += noteLines.length * nh + 22;
    } else uy = 10;
    // axes: hours 0-23 across, ppb up
    const ch = isChart ? 230 : 160;
    const left = mx + (isChart ? 26 : 22), right = mx + cw - 4, top = uy, bottom = uy + ch;
    const all = [...curve.weekday.p25, ...curve.weekday.p75, ...curve.weekend.p25, ...curve.weekend.p75];
    const y0 = Math.floor(Math.min(...all) / 2) * 2, y1 = Math.ceil(Math.max(...all) / 2) * 2;
    const HX = (h) => left + (h / 23) * (right - left);
    const VY = (v) => bottom - ((v - y0) / (y1 - y0)) * (bottom - top);
    const [r0, r1] = data.rush;
    out.push(`<rect x="${HX(r0 - 0.5)}" y="${top}" width="${HX(r1 + 0.5) - HX(r0 - 0.5)}" height="${ch}" fill="${shade[Math.round(bands.length * 0.35)]}" opacity="0.55"/>`);
    out.push(text((HX(r0 - 0.5) + HX(r1 + 0.5)) / 2, bottom - 4, '7–9', { size: cs * 0.8, anchor: 'middle', spacing: 0.3, fill: C.pencil }));
    for (let v = y0; v <= y1; v += 2) {
      out.push(`<line x1="${left}" x2="${right}" y1="${VY(v)}" y2="${VY(v)}" stroke="${C.rule}" stroke-width="0.7"/>`);
      out.push(text(left - 4, VY(v) + cs * 0.35, String(v), { size: cs * 0.9, anchor: 'end', fill: C.pencil }));
    }
    for (const h of [0, 6, 12, 18, 23]) out.push(text(HX(h), bottom + cs * 1.4, h === 0 ? 'MIDNIGHT' : h === 12 ? 'NOON' : hourName(h).toUpperCase(), { size: cs * 0.85, anchor: h === 0 ? 'start' : h === 23 ? 'end' : 'middle', spacing: 0.3, fill: C.pencil }));
    // monotone cubic through the hourly values (as d3.curveMonotoneX): smooth, never overshoots an hour
    const mono = (pts) => {
      const n = pts.length, sl = (a, b) => (b[1] - a[1]) / (b[0] - a[0]);
      const t = pts.map((p, i) => {
        if (i === 0 || i === n - 1) return null;
        const s0 = sl(pts[i - 1], p), s1 = sl(p, pts[i + 1]);
        const h0 = p[0] - pts[i - 1][0], h1 = pts[i + 1][0] - p[0], q = (s0 * h1 + s1 * h0) / (h0 + h1);
        return (Math.sign(s0) + Math.sign(s1)) * Math.min(Math.abs(s0), Math.abs(s1), 0.5 * Math.abs(q)) || 0;
      });
      t[0] = n > 2 ? (3 * sl(pts[0], pts[1]) - t[1]) / 2 : sl(pts[0], pts[1]);
      t[n - 1] = n > 2 ? (3 * sl(pts[n - 2], pts[n - 1]) - t[n - 2]) / 2 : t[0];
      const f = (x, y) => `${x.toFixed(1)},${y.toFixed(1)}`;
      let d = 'M' + f(...pts[0]);
      for (let i = 0; i < n - 1; i++) {
        const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], dx = (x1 - x0) / 3;
        d += 'C' + f(x0 + dx, y0 + dx * t[i]) + ' ' + f(x1 - dx, y1 - dx * t[i + 1]) + ' ' + f(x1, y1);
      }
      return d;
    };
    const pts = (arr) => arr.map((v, h) => [HX(h), VY(v)]);
    const path = (arr) => mono(pts(arr));
    const area = (lo, hi) => path(hi) + 'L' + mono(pts(lo).reverse()).slice(1) + 'Z';
    out.push(`<path d="${area(curve.weekend.p25, curve.weekend.p75)}" fill="${C.fog}" opacity="0.35"/>`);
    out.push(`<path d="${area(curve.weekday.p25, curve.weekday.p75)}" fill="${color ? shade[Math.round(bands.length * 0.6)] : C.fog}" opacity="${color ? 0.55 : 0.8}"/>`);
    out.push(`<path d="${path(curve.weekend.p50)}" fill="none" stroke="${C.pencil}" stroke-width="1.1" stroke-dasharray="3 2"/>`);
    out.push(`<path d="${path(curve.weekday.p50)}" fill="none" stroke="${C.ink}" stroke-width="1.6"/>`);
    // peak and low of the weekday line
    const wd = curve.weekday.p50;
    for (const [h, lab, dy] of [[s.peakHour, `${hourName(s.peakHour).toUpperCase()} · ${one(s.peak)}`, -7], [s.lowHour, `${hourName(s.lowHour).toUpperCase()} · ${one(s.low)}`, 13]]) {
      out.push(`<circle cx="${HX(h)}" cy="${VY(wd[h])}" r="2.4" fill="${C.ink}"/>`);
      out.push(text(HX(h), VY(wd[h]) + dy, lab, { size: cs * 0.9, weight: 600, anchor: 'middle', halo: C.paper }));
    }
    out.push(text(right, VY(curve.weekend.p50[s.peakHour]) + 12, 'WEEKENDS', { size: cs * 0.8, anchor: 'end', spacing: 0.3, fill: C.pencil, halo: C.paper }));
    if (hooks) {
      const bw = (right - left) / 23;
      for (let h = 0; h < 24; h++) {
        const cd = {
          name: `${hourName(h)} to ${hourName((h + 1) % 24)}`,
          big: [one(wd[h]), 'ppb NO₂ on a weekday, middle sensor'],
          meter: meter({ value: wd[h], cap: 'ppb, on the map’s scale' }),
          foot: [`Middle half ${one(curve.weekday.p25[h])}–${one(curve.weekday.p75[h])}`, `Weekends ${one(curve.weekend.p50[h])}`],
        };
        out.push(`<g data-kind="card" data-tip="${esc(cd.name)}" data-name="${esc(cd.name)}" data-card="${attr(cd)}"><rect x="${(HX(h) - bw / 2).toFixed(1)}" y="${top}" width="${bw.toFixed(1)}" height="${ch}" fill="transparent"/></g>`);
      }
    }
    uy = bottom + cs * 1.4;
    if (isChart) {
      return svg(out.join(''), { label: `NO₂ by hour of the day: on weekdays it peaks at ${hourName(s.peakHour)} (${one(s.peak)} ppb, middle sensor) and is lowest at ${hourName(s.lowHour)} (${one(s.low)} ppb).`, viewBox: `0 0 ${cw + 6} ${Math.ceil(uy + 6)}`, align: 'xMinYMin meet' });
    }
  }

  // ---------- inset: in miles like the main map, a grid line every half mile ----------
  const lbx = miles(INSET_BOX);
  const tall = isInset ? { ...lbx, north: lbx.north + 2.2, south: lbx.south - 2.2 } : lbx; // the page crops the tall one
  const iw = isInset ? 390 : W_COL;
  const ki = iw / (tall.east - tall.west);
  const ty = uy + 30;
  if (isPlate) {
    title(ty, INSET_TITLE.toUpperCase());
    note(ty + nh + 4, `Shown at ×${(ki / k).toFixed(1)} the scale of the main map; each sensor’s reading in ppb.`);
  }
  const inset = isInset ? { x: 0, y: 0, w: iw, h: Math.round((tall.north - tall.south) * ki) } : { x: mx, y: ty + nh + 16, w: iw, h: Math.round((tall.north - tall.south) * ki) };
  out.push(`<defs><clipPath id="${uid}-inset"><rect x="${inset.x}" y="${inset.y}" width="${inset.w}" height="${inset.h}"/></clipPath></defs>`);
  out.push(`<rect x="${inset.x}" y="${inset.y}" width="${inset.w}" height="${inset.h}" fill="${C.paper}"/>`);
  const IXm = (m) => inset.x + (m - tall.west) * ki;
  const IYm = (m) => inset.y + (tall.north - m) * ki;
  const IX = (x) => IXm(toMiles(x, 'x'));
  const IY = (y) => IYm(toMiles(y, 'y'));
  out.push(`<g clip-path="url(#${uid}-inset)">`);
  if (boundary.length) out.push(`<path d="${boundary.map((r) => ring(r, IX, IY)).join('')}" fill="${C.ground}" fill-rule="evenodd"/>`);
  const igrid = () => {
    const gg = [];
    for (let m = Math.ceil(tall.west * 2) / 2; m <= tall.east; m += 0.5) gg.push(`<line x1="${IXm(m)}" x2="${IXm(m)}" y1="${inset.y}" y2="${inset.y + inset.h}" stroke="${C.grid}" stroke-width="0.6" opacity="0.55"/>`);
    for (let m = Math.ceil(tall.south * 2) / 2; m <= tall.north; m += 0.5) gg.push(`<line x1="${inset.x}" x2="${inset.x + inset.w}" y1="${IYm(m)}" y2="${IYm(m)}" stroke="${C.grid}" stroke-width="0.6" opacity="0.55"/>`);
    return `<g pointer-events="none">${gg.join('')}</g>`;
  };
  drawSurface((x, y) => [IXm(x), IYm(y)], [0.35, isInset ? 2.4 : 2.0], { clipBox: igrid });
  sensorDots((x, y) => [IXm(x), IYm(y)], isInset ? 2.6 : 2.2, 0.8, { values: true, box: { x0: inset.x - 5, x1: inset.x + inset.w + 5, y0: inset.y - 5, y1: inset.y + inset.h + 5 } });
  // cross streets on the left edge; north-south streets on the bottom edge (on the page, the crop's)
  const ss = 6.5 * TI;
  for (const [y, nm] of Object.entries(EW)) {
    const v = toMiles(Number(y), 'y');
    if (v > tall.north || v < tall.south) continue;
    out.push(text(inset.x + 3, IY(Number(y)) - 2.5, nm, { size: ss, weight: 600, spacing: 0.4, fill: C.pencil, halo: C.paper }));
  }
  const nsLabels = Object.entries(NS).map(([x, nm]) => text(IX(Number(x)) + 3, isInset ? -4 : inset.y + inset.h - 4, nm, { size: ss, weight: 600, spacing: 0.4, fill: C.pencil, halo: C.paper })).join('');
  out.push(isInset ? `<g data-pin-bottom transform="translate(0 ${IY(INSET_BOX.south)})">${nsLabels}</g>` : nsLabels);
  out.push('</g>');
  if (isPlate) out.push(`<rect x="${inset.x}" y="${inset.y}" width="${inset.w}" height="${inset.h}" fill="none" stroke="${C.ink}" stroke-width="0.8"/>`);

  if (isInset) {
    return svg(out.join(''), { label: 'Pulaski to Halsted, Cermak Road to Garfield Boulevard: NO₂ on weekday mornings, with each sensor’s reading.', viewBox: `0 0 ${inset.w} ${inset.h}`, align: 'xMidYMid slice' })
      .replace('<svg ', `<svg data-ppm="${+ki.toFixed(3)}" data-north="${+tall.north.toFixed(3)}" `);
  }

  // plate: Findings close the column
  let fy = inset.y + inset.h + 34;
  title(fy, 'FINDINGS');
  for (const l of wrap(data.finding, Math.floor(W_COL / (ns * 0.45)))) note((fy += nh) + 4, l);
  fy += 10;
  const bs = 9.5, bh = 12.6;
  for (const para of data.findings ?? []) {
    for (const l of wrap(para, Math.floor(W_COL / (bs * 0.46)))) out.push(text(mx, (fy += bh), l, { size: bs, font: SERIF }));
    fy += 5;
  }

  // data ledger, under the map
  const lx = fx0;
  let dy = Math.round(fy1) + 34;
  out.push(text(lx, dy, 'DATA LEDGER', { size: 10.5 * T, weight: 600, spacing: 1 }));
  const ledger = [
    ['AIR', `Open Air Chicago (CDPH; UIC School of Public Health), hourly NO₂, Chicago Data Portal · di9s-96ws`],
    ['', `${s.sensors} sensors, ${monthName(data.window[0])} – ${monthName(data.window[1])}; median of weekday hours 7–9 a.m. at each sensor`],
    ['SURFACE', `Gaussian kernel, σ ${data.sigma} mi; drawn where it weighs one sensor ${data.reach} mi away (${Math.round(s.drawnShare * 100)}% of the city)`],
    ['STOPS', `CTA GTFS ${data.gtfs.snapshot}: ${s.stops.toLocaleString('en-US')} bus stops in the city served on a weekday, read on the surface`],
    ['CAVEAT', `Non-regulatory sensors (Clarity, global calibration); collocated sensors differ by up to ${one(data.qa.collocSpreadMax)} ppb`],
    ['LIMITS', 'City of Chicago, Boundaries – City · qqq8-j68g'],
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
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const monthName = (ym) => `${MONTHS[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`;

const mapLabel = (s) =>
  `Plate XIX, What You Breathe While You Wait: nitrogen dioxide on weekday mornings from ${s.sensors} Open Air Chicago sensors, drawn as illuminated contours; highest over the Loop and the Southwest and West Sides.`;
