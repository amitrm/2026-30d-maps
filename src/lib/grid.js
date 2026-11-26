// Address-grid helpers for drawing. Station coordinates arrive already projected to
// Chicago address units by the Python pipeline (atlas/grid.py).
// Internal unit: 800 per mile from State & Madison; 1,200 for the first mile south. It is a position
// code, exact both ways with miles. South of Roosevelt it is not the street address: the real
// numbers run 1,200 to Roosevelt, 1,000 to Cermak (2200 S), 900 to 31st, then 800 a mile (street
// centerlines, Plate XXII). Labels go through formatAddress, which gives the real number.

// Grid lines every mile, as internal address units.
export function gridLines({ west, east, south, north }) {
  const xs = [];
  for (let x = Math.ceil(west / 800) * 800; x <= east; x += 800) xs.push(x);
  const ys = [];
  for (let y = 0; y <= north; y += 800) ys.push(y);
  for (let y = -1200; y >= south; y -= 800) ys.push(y);
  return { xs, ys: ys.sort((a, b) => a - b) };
}

// The real address number at a true distance south of Madison, in miles (Roosevelt, Cermak and
// 31st taken as one, two and three miles south).
const SOUTH = [[0, 0], [1, 1200], [2, 2200], [3, 3100]];
export function addressSouth(miles) {
  if (miles >= 3) return 3100 + (miles - 3) * 800;
  const i = Math.min(Math.floor(Math.max(miles, 0)), 2);
  const [m0, a0] = SOUTH[i], [m1, a1] = SOUTH[i + 1];
  return a0 + ((miles - m0) * (a1 - a0)) / (m1 - m0);
}

// Internal y unit -> real address number (+ north, − south).
export function realY(v) {
  return v >= -1200 ? v : -addressSouth(-toMiles(v, 'y'));
}

// Address-style labels: '3200 W', '800 N', '3100 S'; the zero lines are named. Takes internal units.
export function formatAddress(v, axis) {
  if (v === 0) return axis === 'x' ? 'STATE' : 'MADISON';
  const n = axis === 'y' ? realY(v) : v;
  const dir = axis === 'x' ? (v < 0 ? 'W' : 'E') : v < 0 ? 'S' : 'N';
  return `${Math.abs(Math.round(n))} ${dir}`;
}

// Address units to miles from State & Madison. Plates plot in miles, so every grid cell is one
// square mile.
export function toMiles(v, axis) {
  if (axis === 'x' || v >= 0) return v / 800;
  return v >= -1200 ? v / 1200 : -1 + (v + 1200) / 800;
}
