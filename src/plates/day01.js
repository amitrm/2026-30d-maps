// Plate I · The Doors · Day 01 Points
import { W, H, C, SERIF, MONO, text, paragraph, frame, svg } from '../lib/plate.js';
import { gridLines, formatAddress } from '../lib/grid.js';

// Reference journey endpoints (address units). A is approximate: the 130th St
// Red Line Extension terminal is under construction (opening planned 2030).
const JOURNEY = {
  A: { x: 500, y: -13000, label: '130th St terminal (planned 2030)' },
  B: { x: 250, y: 700, label: 'Northwestern Memorial Hospital' },
};

export function renderDay01(data) {
  const { stations, byLine, summary } = data;
  const out = [];

  out.push(frame({
    plate: 'I',
    chapter: 'THE GRID',
    day: 1,
    theme: 'Points',
    title: 'The Doors',
    subtitle: 'Every ‘L’ station as an entrance. A filled dot has an elevator or ramp; a ring has stairs only.',
  }));

  // ---------- main map: address space ----------
  const ext = { west: -11600, east: 1500, south: -13400, north: 10900 };
  const field = { x: 64, y: 214, w: 580, h: 1040 };
  const k = Math.min(field.w / (ext.east - ext.west), field.h / (ext.north - ext.south));
  const ox = field.x + (field.w - (ext.east - ext.west) * k) / 2;
  const oy = field.y + (field.h - (ext.north - ext.south) * k) / 2;
  const X = (x) => ox + (x - ext.west) * k;
  const Y = (y) => oy + (ext.north - y) * k;

  const g = gridLines(ext);
  const x0 = X(ext.west), x1 = X(ext.east), y0 = Y(ext.north), y1 = Y(ext.south);
  out.push('<g>');
  for (const x of g.xs) {
    const major = x === 0;
    out.push(`<line x1="${X(x)}" x2="${X(x)}" y1="${y0}" y2="${y1}" stroke="${major ? C.pencil : C.rule}" stroke-width="${major ? 0.8 : 0.6}"/>`);
  }
  for (const y of g.ys) {
    const major = y === 0;
    out.push(`<line x1="${x0}" x2="${x1}" y1="${Y(y)}" y2="${Y(y)}" stroke="${major ? C.pencil : C.rule}" stroke-width="${major ? 0.8 : 0.6}"/>`);
  }
  // graticule labels: every 4 miles on x, every 2 grid lines on y
  for (const x of g.xs.filter((v) => v % 3200 === 0)) {
    out.push(text(X(x), y0 - 8, formatAddress(x, 'x'), { size: 8, anchor: 'middle', fill: C.pencil, spacing: 0.5 }));
  }
  g.ys.filter((_, i) => i % 2 === 0 || _ === 0).forEach((y) => {
    out.push(text(x1 + 6, Y(y) + 3, formatAddress(y, 'y'), { size: 8, fill: C.pencil, spacing: 0.5 }));
  });
  out.push('</g>');

  // Loop inset outline on the main map
  const loopBox = { west: -1900, east: 900, south: -1500, north: 1050 };
  out.push(`<rect x="${X(loopBox.west)}" y="${Y(loopBox.north)}" width="${(loopBox.east - loopBox.west) * k}" height="${(loopBox.north - loopBox.south) * k}" fill="none" stroke="${C.ink}" stroke-width="0.6" stroke-dasharray="2 2"/>`);
  out.push(text(X(loopBox.west) - 4, Y(loopBox.north) - 4, 'INSET', { size: 7, anchor: 'end', fill: C.pencil, spacing: 0.8 }));

  // journey endpoints on main map
  out.push(journeyMark(X(JOURNEY.A.x), Y(JOURNEY.A.y), 'A'));
  out.push(text(X(JOURNEY.A.x) + 12, Y(JOURNEY.A.y) + 3, JOURNEY.A.label, { size: 8, fill: C.pencil }));

  // stations
  const inLoop = (s) => s.x >= loopBox.west && s.x <= loopBox.east && s.y >= loopBox.south && s.y <= loopBox.north;
  for (const s of stations) out.push(stationMark(X(s.x), Y(s.y), s.ada, 3.6));

  // labels for stair-only stations outside the inset
  for (const s of stations.filter((d) => !d.ada && !inLoop(d))) {
    const px = X(s.x), py = Y(s.y);
    const fpBranch = s.lines.includes('Blue') && s.y < 0 && s.y > -1200;
    const lakeBranch = s.lines.includes('Green') && s.y > 0 && s.y < 800;
    if (fpBranch) out.push(text(px + 3, py + 9, s.short, { size: 7.5, fill: C.ink, rotate: 55 }));
    else if (lakeBranch) out.push(text(px + 3, py - 8, s.short, { size: 7.5, fill: C.ink, rotate: -55 }));
    else if (s.short === 'North/Clybourn') out.push(text(px - 8, py + 2.6, s.short, { size: 7.5, fill: C.ink, anchor: 'end' }));
    else out.push(text(px + 8, py + 2.6, s.short, { size: 7.5, fill: C.ink }));
  }

  // mile ruler
  const rx = field.x + 6, ry = field.y + field.h - 8;
  out.push(`<line x1="${rx}" x2="${rx + 800 * 4 * k}" y1="${ry}" y2="${ry}" stroke="${C.ink}" stroke-width="1"/>`);
  for (let i = 0; i <= 4; i++) out.push(`<line x1="${rx + 800 * i * k}" x2="${rx + 800 * i * k}" y1="${ry - (i % 4 === 0 ? 5 : 3)}" y2="${ry}" stroke="${C.ink}" stroke-width="1"/>`);
  out.push(text(rx, ry - 9, '0', { size: 7.5 }));
  out.push(text(rx + 3200 * k, ry - 9, '4 MI · 3,200', { size: 7.5, anchor: 'middle' }));

  // ---------- margin column ----------
  const mx = 690;
  out.push(text(mx, 236, 'FINDING', { size: 9, spacing: 2, fill: C.pencil }));
  const finding = data.finding;
  out.push(paragraph(mx, 266, finding, { size: 21, font: SERIF, italic: true, maxChars: 30, lineHeight: 1.28 }));

  // unit chart by line
  let uy = 410;
  out.push(text(mx, uy, 'STATIONS BY LINE  ·  RING = STAIRS ONLY', { size: 9, spacing: 1.5, fill: C.pencil }));
  uy += 22;
  const sorted = [...byLine].sort((a, b) => b.noStepFree - a.noStepFree);
  for (const l of sorted) {
    const isBlue = l.line === 'Blue';
    out.push(text(mx, uy + 3, l.line.toUpperCase(), { size: 9, weight: isBlue ? 600 : 400, spacing: 0.8 }));
    out.push(text(mx + 92, uy + 3, `${l.noStepFree}/${l.total}`, { size: 9, anchor: 'end', weight: isBlue ? 600 : 400, fill: isBlue ? C.ink : C.pencil }));
    for (let i = 0; i < l.total; i++) {
      const cx = mx + 104 + i * 6.6;
      out.push(stationMark(cx, uy, i >= l.noStepFree, 2.3));
    }
    uy += 19;
  }
  out.push(text(mx, uy + 6, 'Interchange stations count once per line.', { size: 8, fill: C.pencil }));

  // Loop inset
  const inset = { x: mx, y: 640, w: 350, h: 300 };
  out.push(text(mx, inset.y - 12, 'INSET  ·  THE LOOP AND RIVER NORTH  ·  ×4.5', { size: 9, spacing: 1.5, fill: C.pencil }));
  out.push(`<rect x="${inset.x}" y="${inset.y}" width="${inset.w}" height="${inset.h}" fill="${C.paper}" stroke="${C.ink}" stroke-width="0.8"/>`);
  const ki = Math.min(inset.w / (loopBox.east - loopBox.west), inset.h / (loopBox.north - loopBox.south));
  const IX = (x) => inset.x + (inset.w - (loopBox.east - loopBox.west) * ki) / 2 + (x - loopBox.west) * ki;
  const IY = (y) => inset.y + (inset.h - (loopBox.north - loopBox.south) * ki) / 2 + (loopBox.north - y) * ki;
  for (let x = -1600; x <= 800; x += 400) {
    const major = x === 0;
    out.push(`<line x1="${IX(x)}" x2="${IX(x)}" y1="${inset.y}" y2="${inset.y + inset.h}" stroke="${major ? C.pencil : C.rule}" stroke-width="${major ? 0.8 : 0.6}"/>`);
  }
  for (let y = -1200; y <= 800; y += 400) {
    const major = y === 0;
    out.push(`<line x1="${inset.x}" x2="${inset.x + inset.w}" y1="${IY(y)}" y2="${IY(y)}" stroke="${major ? C.pencil : C.rule}" stroke-width="${major ? 0.8 : 0.6}"/>`);
  }
  out.push(text(IX(0) + 3, inset.y + inset.h - 5, 'STATE', { size: 7, fill: C.pencil }));
  out.push(text(inset.x + 4, IY(0) - 3, 'MADISON', { size: 7, fill: C.pencil }));
  const loopStations = stations.filter(inLoop);
  for (const s of loopStations) out.push(stationMark(IX(s.x), IY(s.y), s.ada, 4.2));
  out.push(journeyMark(IX(JOURNEY.B.x), IY(JOURNEY.B.y), 'B'));
  out.push(text(IX(JOURNEY.B.x) - 11, IY(JOURNEY.B.y) + 3, 'Northwestern Memorial', { size: 7.5, fill: C.pencil, anchor: 'end' }));
  // labels for stair-only stations in the inset (hand-placed offsets to avoid collisions)
  const OFFSET = {
    '40260': [8, -6], // State/Lake
    '40370': [-6, -8, 'end'], // Washington (Blue)
    '40790': [-8, 3, 'end', 'Monroe (Blue)'], // Monroe (Blue)
    '41090': [8, 3, 'start', 'Monroe (Red)'], // Monroe (Red)
    '40680': [8, 3], // Adams/Wabash
    '40160': [-8, -4, 'end'], // LaSalle/Van Buren
    '41340': [-5, 14, 'middle'], // LaSalle (Blue)
    '41490': [8, 4], // Harrison
    '40430': [0, 13, 'middle'], // Clinton (Blue)
    '40490': [8, 3], // Grand (Blue)
    '41410': [8, 3], // Chicago (Blue)
    '40470': [0, 13, 'middle'], // Racine
  };
  for (const s of loopStations.filter((d) => !d.ada)) {
    const [dx, dy, anchor, label] = OFFSET[s.id] ?? [8, 3];
    out.push(text(IX(s.x) + dx, IY(s.y) + dy, label ?? s.short, { size: 7.5, anchor: anchor ?? 'start' }));
  }
  const loopNo = loopStations.filter((d) => !d.ada).length;
  out.push(text(inset.x + inset.w - 6, inset.y + 14, `${loopNo} of ${loopStations.length} stair-only`, { size: 8, anchor: 'end', fill: C.pencil }));

  // legend
  let ly = 978;
  out.push(stationMark(mx + 5, ly - 3, true, 3.6));
  out.push(text(mx + 16, ly, 'Step-free: elevator or ramp', { size: 9 }));
  out.push(stationMark(mx + 185, ly - 3, false, 3.6));
  out.push(text(mx + 196, ly, 'Stairs only', { size: 9 }));
  ly += 20;
  out.push(journeyMark(mx + 5, ly - 3, 'A'));
  out.push(text(mx + 16, ly, 'Reference journey, A to B, followed through all 30 plates', { size: 9 }));

  // data ledger
  let dy = 1046;
  out.push(`<line x1="${mx}" x2="${W - 60}" y1="${dy - 16}" y2="${dy - 16}" stroke="${C.ink}" stroke-width="0.5"/>`);
  out.push(text(mx, dy, 'DATA LEDGER', { size: 9, spacing: 2, fill: C.pencil }));
  const ledger = [
    ['SOURCE', "CTA List of 'L' Stops"],
    ['', 'Chicago Data Portal · 8pix-ypme'],
    ['PULLED', data.asOf],
    ['UNITS', `${summary.total} stations (map_id); ADA flag as published`],
    ['METHOD', 'Plotted in Chicago address units:'],
    ['', '800 per mile; 1,200 for first mile south'],
    ['', 'Origin: State & Madison'],
    ['CAVEAT', 'Flag can lag reopened ASAP stations'],
  ];
  dy += 20;
  for (const [kk, v] of ledger) {
    out.push(text(mx, dy, kk, { size: 8.5, fill: C.pencil, spacing: 0.6 }));
    out.push(text(mx + 64, dy, v, { size: 8.5 }));
    dy += 15;
  }

  return svg(out.join(''), {
    label: `Plate I, The Doors: ${summary.noStepFree} of ${summary.total} Chicago L stations lack step-free access; ${summary.blueNoStepFree} are on the Blue Line.`,
  });
}

function stationMark(x, y, stepFree, r) {
  return stepFree
    ? `<circle cx="${x}" cy="${y}" r="${r}" fill="${C.ink}"/>`
    : `<circle cx="${x}" cy="${y}" r="${r}" fill="${C.paper}" stroke="${C.ink}" stroke-width="${Math.max(1.1, r * 0.36)}"/>`;
}

function journeyMark(x, y, letter) {
  return `<rect x="${x - 5.5}" y="${y - 5.5}" width="11" height="11" fill="${C.paper}" stroke="${C.ink}" stroke-width="0.9" stroke-dasharray="2 1.4"/>` +
    text(x, y + 3, letter, { size: 7.5, anchor: 'middle', weight: 600 });
}
