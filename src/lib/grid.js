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

export function formatAddress(v, axis) {
  if (v === 0) return axis === 'x' ? 'STATE 0' : 'MADISON 0';
  const dir = axis === 'x' ? (v < 0 ? 'W' : 'E') : v < 0 ? 'S' : 'N';
  return `${dir} ${Math.abs(Math.round(v)).toLocaleString('en-US')}`;
}
