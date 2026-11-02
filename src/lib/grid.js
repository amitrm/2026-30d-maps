// Address-grid helpers for drawing. Station coordinates arrive already projected to
// Chicago address units by the Python pipeline (atlas/grid.py).
// Rule: 800 address numbers per mile from State & Madison; 1,200 for the first mile south.

// Grid lines every mile under the rule, as address values.
export function gridLines({ west, east, south, north }) {
  const xs = [];
  for (let x = Math.ceil(west / 800) * 800; x <= east; x += 800) xs.push(x);
  const ys = [];
  for (let y = 0; y <= north; y += 800) ys.push(y);
  for (let y = -1200; y >= south; y -= 800) ys.push(y);
  return { xs, ys: ys.sort((a, b) => a - b) };
}

// Address-style labels: '3200 W', '800 N'; the zero lines are named.
export function formatAddress(v, axis) {
  if (v === 0) return axis === 'x' ? 'STATE' : 'MADISON';
  const dir = axis === 'x' ? (v < 0 ? 'W' : 'E') : v < 0 ? 'S' : 'N';
  return `${Math.abs(Math.round(v))} ${dir}`;
}

// Address units to miles from State & Madison. Plates plot in miles, so every grid cell is one
// square mile, and label the lines with addresses (the first mile south carries 1,200 numbers).
export function toMiles(v, axis) {
  if (axis === 'x' || v >= 0) return v / 800;
  return v >= -1200 ? v / 1200 : -1 + (v + 1200) / 800;
}
