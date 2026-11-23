// Plate XX · Jobs in 45 Minutes · Day 20 Hexagons
import { C, SERIF, esc, text, textWidth, legendBox, wrap, frame, svg } from '../lib/plate.js';
import { gridLines, formatAddress, toMiles } from '../lib/grid.js';

// variant 'plate': the full 1080 x 1350 plate (export, download).
// variant 'map': the map alone, with hover hooks, for the day page's left column.
// variant 'chart': residents by jobs in reach, one bar per side of the city, with hover hooks.
// variant 'inset': the six counties' jobs on a coarser comb, with hover hooks.
// The city in hexagons laid on the address grid: pointy side up, a column of centers on every
// half-mile line (so every arterial runs through one), rows sqrt(3)/4 mile apart from Madison, every
// other row shifted a quarter mile. Each hexagon where people live is shaded by the jobs its center
// reaches within 45 minutes by bus and train (median of the departures 7:30-8:30 a.m.). Hexagons
// arrive as [row, col, residents, jobs, community area]; centers in miles from State & Madison.

// Gray mode: five steps from just above the city's ground to near ink; color mode: honey, for the comb.
const RAMPS = {
  gray: ['#D3D1CA', '#B2AFA9', '#8F8C86', '#68655F', '#3D3B38'],
  color: ['#F3E2B0', '#E8C46A', '#C9922E', '#94601A', '#5A3810'],
};
const GAP = 0.06; // share of a hexagon left as the comb's gap

export const CHART_TITLE = 'Residents by jobs in reach';
export const CHART_NOTE = 'Each side of the city: its residents by the jobs their hexagon reaches in 45 minutes; half of them reach the number at right or fewer';
export const INSET_TITLE = 'Inset · Where the jobs are';
export const insetNote = (d) => `The ${fmt(Math.round(d.summary.jobsTotal / 1e5) * 1e5)} jobs of the six counties, on hexagons a mile apart; the city limit in ink.`;

const fmt = (v) => Math.round(v).toLocaleString('en-US');
// jobs in text: to the nearest 10,000 from 100,000 up, else to the nearest 1,000
export const jobsText = (v) => (v >= 950_000 ? `${(Math.round(v / 1e5) / 10).toFixed(1)} million` : fmt(v >= 100_000 ? Math.round(v / 1e4) * 1e4 : Math.round(v / 1e3) * 1e3));
// the chart's medians, rounded as in the text (jobsText)
const medShort = (v) => (v >= 950_000 ? `${(Math.round(v / 1e5) / 10).toFixed(1)}M` : `${v >= 100_000 ? Math.round(v / 1e4) * 10 : Math.round(v / 1e3)}k`);
const short = (v) => (v >= 1e6 ? `${+(v / 1e6).toFixed(2)}M` : `${Math.round(v / 1e3)}k`);
export const classLabel = (cl, k) => {
  const lo = [0, ...cl][k], hi = [...cl, null][k];
  const f = (v) => (v >= 1e6 ? `${v / 1e6} million` : fmt(v));
  if (k === 0) return `Under ${f(hi)}`;
  if (hi == null) return `${f(lo)} or more`;
  return `${f(lo)}–${f(hi)}`;
};
const classShort = (cl, k) => {
  const lo = [0, ...cl][k], hi = [...cl, null][k];
  if (k === 0) return `under ${short(hi)}`;
  if (hi == null) return `${short(lo)}+`;
  return `${short(lo)}–${short(hi)}`;
};
// miles back to address numbers, to the nearest hundred (inverse of toMiles)
const addr = (m, axis) => {
  const v = axis === 'x' || m >= 0 ? m * 800 : m >= -1 ? m * 1200 : -1200 + (m + 1) * 800;
  const r = Math.round(v / 100) * 100;
  return r === 0 ? (axis === 'x' ? 'State' : 'Madison') : `${Math.abs(r)} ${axis === 'x' ? (r < 0 ? 'W' : 'E') : r < 0 ? 'S' : 'N'}`;
};

export function renderDay20(data, { mode = 'gray', variant = 'plate' } = {}) {
  const { summary: s, classes: cl, sides, boundary = [] } = data;
  const out = [];
  const isPlate = variant === 'plate';
  const isMap = variant === 'map';
  const isChart = variant === 'chart';
  const isInset = variant === 'inset';
  const hooks = isMap || isChart || isInset;
  const uid = `d20-${variant}-${mode}`;
  const T = isMap || isChart ? 1.3 : 1.15;
  const color = mode === 'color';
  const ramp = RAMPS[color ? 'color' : 'gray'];
  const S = data.S, RH = (S * Math.sqrt(3)) / 2;
  const hexes = data.hexes.map((r) => Object.fromEntries(data.hexCols.map((c, i) => [c, r[i]])));
  const cls = (v) => cl.filter((b) => v >= b).length;
  const caName = (ca) => data.caNames[String(ca)] ?? 'Chicago';

  // ---------- hexagons ----------
  const center = (r, c, s) => [c * s + (((r % 2) + 2) % 2) * s / 2, r * s * Math.sqrt(3) / 2];
  const hexD = (cx, cy, rad) => {
    let d = '';
    for (let i = 0; i < 6; i++) {
      const a = ((90 + 60 * i) * Math.PI) / 180;
      d += `${i ? 'L' : 'M'}${(cx + rad * Math.cos(a)).toFixed(1)},${(cy - rad * Math.sin(a)).toFixed(1)}`;
    }
    return d + 'Z';
  };
  // the hover card's bar: the five classes in equal parts, each filled linearly between its edges
  const top = Math.max(s.max, cl.at(-1) * 1.25);
  const frac = (v) => {
    const k = cls(v), lo = [0, ...cl][k], hi = [...cl, top][k];
    return (k + Math.min(1, (v - lo) / (hi - lo))) / ramp.length;
  };
  const segs = ramp.map((c, k) => [k / ramp.length, (k + 1) / ramp.length, c]);
  const attr = (o) => esc(JSON.stringify(o)).replace(/"/g, '&quot;');
  const card = (h) => {
    const [mx, my] = center(h.r, h.c, S);
    return {
      name: caName(h.ca),
      aside: `${addr(my, 'y')} · ${addr(mx, 'x')}`,
      big: [jobsText(h.jobs), 'jobs within 45 minutes by bus and train'],
      bar: { frac: frac(h.jobs), segs, left: '0', right: `${short(cl.at(-1))} and more` },
      foot: [`${fmt(h.pop)} resident${h.pop === 1 ? '' : 's'}`, `${Math.round((h.jobs / s.jobsTotal) * 1000) / 10}% of the region’s jobs`],
    };
  };
  const drawHexes = (P, k) => {
    const rad = (S / Math.sqrt(3)) * k * (1 - GAP);
    if (!hooks) {
      // one path per class
      const d = ramp.map(() => []);
      for (const h of hexes) d[cls(h.jobs)].push(hexD(...P(...center(h.r, h.c, S)), rad));
      d.forEach((ds, i) => ds.length && out.push(`<path d="${ds.join('')}" fill="${ramp[i]}"/>`));
      return;
    }
    for (const h of hexes) {
      const [x, y] = P(...center(h.r, h.c, S));
      const nm = caName(h.ca);
      out.push(`<g data-kind="card" data-tip="${esc(nm)}" data-name="${esc(nm)}" data-keys="c${cls(h.jobs)}" data-card="${attr(card(h))}"><path d="${hexD(x, y, rad)}" fill="${ramp[cls(h.jobs)]}"/></g>`);
    }
  };
  const ring = (rg, fx, fy) => 'M' + rg.map(([x, y]) => `${fx(x).toFixed(1)},${fy(y).toFixed(1)}`).join('L') + 'Z';

  if (isPlate) out.push(frame({
    plate: 'XX',
    chapter: 'THE BODY',
    day: 20,
    theme: 'HEXAGONS',
    title: 'Jobs in 45 Minutes',
    subtitle: 'Every hexagon where people live, shaded by the jobs its center reaches within 45 minutes by bus and train at 8 a.m.',
  }));

  // ---------- main map: the extent of Plates II–XIX ----------
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
  const hexSw = (c, r = 6) => `<path d="${hexD(0, 0, r)}" fill="${c}"/>`;

  if (isPlate || isMap) {
    out.push(`<defs><clipPath id="${uid}-map"><rect x="${fx0}" y="${fy0}" width="${fx1 - fx0}" height="${fy1 - fy0}"/></clipPath></defs>`);
    out.push(`<g clip-path="url(#${uid}-map)">`);
    if (boundary.length) out.push(`<path d="${boundary.map((r) => ring(r, X, Y)).join('')}" fill="${C.ground}" fill-rule="evenodd"/>`);
    const gg = [];
    for (const x of g.xs) gg.push(`<line x1="${X(x)}" x2="${X(x)}" y1="${fy0}" y2="${fy1}" stroke="${x === 0 ? C.pencil : C.grid}" stroke-width="${x === 0 ? 0.8 : 0.6}" opacity="${x === 0 ? 0.8 : 0.55}"/>`);
    for (const y of g.ys) gg.push(`<line x1="${fx0}" x2="${fx1}" y1="${Y(y)}" y2="${Y(y)}" stroke="${y === 0 ? C.pencil : C.grid}" stroke-width="${y === 0 ? 0.8 : 0.6}" opacity="${y === 0 ? 0.8 : 0.55}"/>`);
    out.push(`<g pointer-events="none">${gg.join('')}</g>`);
    drawHexes((x, y) => [XM(x), YM(y)], k);
    // State and Madison over the comb, faintly, so the origin reads
    out.push(`<g pointer-events="none" opacity="0.5"><line x1="${X(0)}" x2="${X(0)}" y1="${fy0}" y2="${fy1}" stroke="${C.paper}" stroke-width="0.8"/><line x1="${fx0}" x2="${fx1}" y1="${Y(0)}" y2="${Y(0)}" stroke="${C.paper}" stroke-width="0.8"/></g>`);
    out.push('</g>');
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
      // one line: the five classes as hexagons, then the city without residents
      let lx = 60;
      const y = 203;
      const lead = 'Jobs within 45 min by bus and train:';
      out.push(text(lx, y, lead, { size: lgs, fill: C.pencil }));
      lx += textWidth(lead, lgs) + 10;
      ramp.forEach((c, i) => {
        out.push(`<g transform="translate(${lx + 6} ${y - lgs * 0.35})">${hexSw(c)}</g>`);
        const lab = classShort(cl, i);
        out.push(text(lx + 15, y, lab, { size: lgs, fill: C.pencil }));
        lx += 15 + textWidth(lab, lgs) + 11;
      });
      out.push(`<g transform="translate(${lx + 6} ${y - lgs * 0.35})"><rect x="-5" y="-5" width="10" height="10" fill="${C.ground}"/></g>`);
      out.push(text(lx + 15, y, 'no residents', { size: lgs, fill: C.pencil }));
    } else {
      out.push(legendBox([
        ['head', 'Jobs within 45 minutes by bus and train, 8 a.m.'],
        ...ramp.map((c, i) => [hexSw(c), classLabel(cl, i)]),
        ['gap'],
        [`<rect x="-5" y="-5" width="10" height="10" fill="${C.ground}"/>`, 'City of Chicago, no residents'],
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
      uy += noteLines.length * nh + 20;
    } else uy = 4;
    // one row per side, the city first; a 100% bar of residents by class; the median at right
    const rows = [{ side: 'Chicago', pop: s.pop, median: s.median, byClass: data.classTable.map((c) => c.pop) }, ...sides];
    const labW = textWidth('Far Southwest Side', cs, { weight: 500 }) + 8;
    const medW = textWidth('1.25M', cs * 0.95, { weight: 600 }) + 6;
    const bx = mx + labW, bw = cw - labW - medW - 2;
    const rh = isChart ? 21 : 16, bh = isChart ? 12 : 9;
    // class labels over the first bar's segments
    rows.forEach((r, i) => {
      const y = uy + i * rh + (i ? 6 : 0);
      out.push(text(mx, y + bh * 0.8, r.side, { size: cs, weight: i ? 400 : 600, fill: C.ink }));
      let x = bx;
      r.byClass.forEach((p, c) => {
        const w = (p / r.pop) * bw;
        if (w <= 0) return;
        const rect = `<rect x="${x.toFixed(1)}" y="${y}" width="${Math.max(0, w - 0.6).toFixed(1)}" height="${bh}" fill="${ramp[c]}"/>`;
        if (hooks) {
          const cd = {
            name: r.side,
            aside: classLabel(cl, c).toLowerCase(),
            big: [`${Math.round((p / r.pop) * 100)}%`, `of residents reach ${classLabel(cl, c).toLowerCase()} jobs`],
            bar: { frac: frac(Math.min(r.median, top)), segs, left: `${fmt(Math.round(p / 100) * 100)} residents`, right: `half reach ${jobsText(r.median)} or fewer` },
          };
          out.push(`<g data-kind="card" data-tip="${esc(r.side)}" data-name="${esc(r.side)}" data-hl="c${c}" data-card="${attr(cd)}">${rect}<rect x="${x.toFixed(1)}" y="${y - (rh - bh) / 2}" width="${w.toFixed(1)}" height="${rh}" fill="transparent"/></g>`);
        } else out.push(rect);
        x += w;
      });
      out.push(text(bx + bw + medW, y + bh * 0.8, medShort(r.median), { size: cs * 0.95, weight: 600, anchor: 'end' }));
    });
    const by = uy + rows.length * rh + 6;
    // class key under the bars: the five shades with their short labels
    let kx = bx;
    const ks = cs * 0.85;
    ramp.forEach((c, i) => {
      out.push(`<rect x="${kx}" y="${by + 2}" width="7" height="7" fill="${c}"/>`);
      const lab = classShort(cl, i);
      out.push(text(kx + 9, by + 8.5, lab, { size: ks, fill: C.pencil }));
      kx += 9 + textWidth(lab, ks) + 7;
    });
    uy = by + 12;
    if (isChart) {
      return svg(out.join(''), { label: `Residents by jobs within 45 minutes by bus and train: half of Chicagoans reach ${jobsText(s.median)} or fewer; by side, from ${jobsText(sides[0].median)} (${sides[0].side}) to ${jobsText(sides.at(-1).median)} (${sides.at(-1).side}).`, viewBox: `0 0 ${cw + 6} ${Math.ceil(uy + 4)}`, align: 'xMinYMin meet' });
    }
  }

  // ---------- inset: the six counties' jobs, hexagons a mile apart ----------
  const SR = data.S_region;
  const region = data.region.map((r) => Object.fromEntries(data.regionCols.map((c, i) => [c, r[i]])));
  const rc = region.map((h) => center(h.r, h.c, SR));
  const pad = 1;
  const rb = {
    west: Math.min(...rc.map((p) => p[0])) - pad, east: Math.max(...rc.map((p) => p[0])) + pad,
    south: Math.min(...rc.map((p) => p[1])) - pad, north: Math.max(...rc.map((p) => p[1])) + pad,
  };
  const iw = isInset ? 390 : W_COL;
  const ihMax = isInset ? 560 : 300;
  const ki = Math.min(iw / (rb.east - rb.west), ihMax / (rb.north - rb.south));
  const ih = Math.round((rb.north - rb.south) * ki);
  const ty = uy + 30;
  if (isPlate) {
    title(ty, INSET_TITLE.toUpperCase());
    wrap(insetNote(data), Math.floor(cw / (ns * 0.45))).forEach((l, i) => note(ty + (i + 1) * nh + 4, l));
  }
  const noteH = isPlate ? wrap(insetNote(data), Math.floor(cw / (ns * 0.45))).length * nh : 0;
  const inset = isInset ? { x: 0, y: 0, w: iw, h: ih } : { x: mx, y: ty + noteH + 14, w: iw, h: ih };
  const ox = inset.x + (inset.w - (rb.east - rb.west) * ki) / 2;
  const IXm = (m) => ox + (m - rb.west) * ki;
  const IYm = (m) => inset.y + (rb.north - m) * ki;
  const rcls = (v) => data.regionClasses.filter((b) => v >= b).length;
  const rrad = (SR / Math.sqrt(3)) * ki * (1 - GAP);
  const rramp = [C.rule, ...ramp.slice(1)]; // the fewest jobs nearly paper, so the centers of work stand out
  {
    const d = ramp.map(() => []);
    region.forEach((h, i) => d[rcls(h.jobs)].push(hexD(IXm(rc[i][0]), IYm(rc[i][1]), rrad)));
    d.forEach((ds, i) => ds.length && out.push(`<path d="${ds.join('')}" fill="${rramp[i]}"/>`));
  }
  // the city limit over the comb
  if (boundary.length) out.push(`<path d="${boundary.map((r) => ring(r, (x) => IXm(toMiles(x, 'x')), (y) => IYm(toMiles(y, 'y')))).join('')}" fill="none" stroke="${C.ink}" stroke-width="0.7" pointer-events="none"/>`);
  // inset key: the five classes, jobs per hexagon
  {
    const ks = isInset ? 9 : 7.6;
    const keyLabs = data.regionClasses.map((v, i) => (i === 0 ? `under ${fmt(v)}` : `${fmt(data.regionClasses[i - 1])}–${fmt(v)}`)).concat(`${fmt(data.regionClasses.at(-1))}+`);
    let yk = inset.y + inset.h - 6 - (keyLabs.length - 1) * (ks + 3.5);
    const kx = inset.x + 4;
    const kw = Math.max(textWidth('JOBS PER HEXAGON', ks * 0.9, { weight: 600, spacing: 0.4 }), ...keyLabs.map((l) => 11 + textWidth(l, ks))) + 8;
    out.push(`<rect x="${kx - 4}" y="${yk - 2 * ks - 8}" width="${kw}" height="${inset.y + inset.h - (yk - 2 * ks - 8)}" fill="${C.paper}" opacity="0.92" pointer-events="none"/>`);
    out.push(text(kx, yk - ks - 4, 'JOBS PER HEXAGON', { size: ks * 0.9, weight: 600, spacing: 0.4, fill: C.ink }));
    keyLabs.forEach((lab, i) => {
      out.push(`<g transform="translate(${kx + 4} ${yk - ks * 0.35})">${hexSw(rramp[i], ks * 0.5)}</g>`);
      out.push(text(kx + 11, yk, lab, { size: ks, fill: C.pencil }));
      yk += ks + 3.5;
    });
  }
  if (isPlate) out.push(`<rect x="${inset.x}" y="${inset.y}" width="${inset.w}" height="${inset.h}" fill="none" stroke="${C.ink}" stroke-width="0.8"/>`);

  if (isInset) {
    return svg(out.join(''), { label: `Where the jobs are: the ${fmt(s.jobsTotal)} jobs of the six counties on hexagons a mile apart, densest in the Loop.`, viewBox: `0 0 ${inset.w} ${inset.h}`, align: 'xMidYMid meet' })
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
    ['JOBS', `US Census Bureau, LEHD LODES 8, workplace file ${data.lodesYear}: all ${fmt(s.jobsTotal)} jobs in the six counties, by block`],
    ['TRANSIT', `CTA, Metra, Pace and South Shore Line schedules (GTFS), Tue 17 Nov 2026; median of departures ${data.starts[0]}–${data.starts[1]} a.m.`],
    ['TRIP', 'Door to door within 45 min; walking a straight line ×1.3 at 1.2 m/s, up to ¾ mi to or from a stop'],
    ['HEXAGONS', `On the address grid: centers every ½ mi along rows √3⁄4 mi apart; ${fmt(s.hexes)} with residents (2020 Census)`],
    ['CAVEAT', 'Schedules as published: no delays, fares or crowding; jobs in Indiana and Wisconsin not counted'],
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

const mapLabel = (s) =>
  `Plate XX, Jobs in 45 Minutes: Chicago in hexagons, each shaded by the jobs reachable within 45 minutes by bus and train at 8 a.m.; half of Chicagoans reach ${jobsText(s.median)} or fewer; the most from ${s.highCas.slice(0, 3).map((c) => c.name).join(', ')}.`;
