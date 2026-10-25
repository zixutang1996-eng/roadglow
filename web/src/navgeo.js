// v0.9.13 navigation geometry helpers: route-progress projection (for trimming the driven part of the route)
// and Google-Maps-style road-marking turn arrows / lane pictograms. Pure functions (unit-tested in tools/navgeo.test.mjs).
const R = 6371008.8, rad = Math.PI / 180;
const xy = (lng, lat, lat0) => [lng * rad * R * Math.cos(lat0 * rad), lat * rad * R];
/** Project p onto the polyline coords ([lng,lat][]). hint = previous segment index (search window keeps it monotonic & O(1)).
 *  Returns { i: segment index, t: 0..1 along it, pt: [lng,lat], d: metres off-route }. */
export function project(p, coords, hint = 0, win = 60) {
  let best = { i: 0, t: 0, pt: coords[0], d: Infinity }; const lat0 = p.lat, P = xy(p.lng, p.lat, lat0);
  const lo = Math.max(0, hint - 5), hi = Math.min(coords.length - 1, hint + win);
  const scan = (a, b) => { for (let i = a; i < b; i++) {
    const A = xy(coords[i][0], coords[i][1], lat0), B = xy(coords[i + 1][0], coords[i + 1][1], lat0), dx = B[0] - A[0], dy = B[1] - A[1], L = dx * dx + dy * dy;
    const t = L ? Math.max(0, Math.min(1, ((P[0] - A[0]) * dx + (P[1] - A[1]) * dy) / L)) : 0, X = A[0] + dx * t, Y = A[1] + dy * t, d = Math.hypot(P[0] - X, P[1] - Y);
    if (d < best.d) best = { i, t, d, pt: [coords[i][0] + (coords[i + 1][0] - coords[i][0]) * t, coords[i][1] + (coords[i + 1][1] - coords[i][1]) * t] }; } };
  scan(lo, hi); if (best.d > 60) scan(0, coords.length - 1); // lost the window (reroute / tunnel) → full scan
  return best;
}
/** Remaining part of the route from the projected point to the end. */
export const ahead = (coords, pr) => [pr.pt, ...coords.slice(pr.i + 1)];

// Road-paint arrows (white pavement-marking shapes: long shaft, broad flat head), 24x40 viewBox, filled.
const SH = {
  straight: 'M10 40V14H5l7-14 7 14h-5v26z',
  left: 'M14 40V22c0-3-2-5-5-5H8v5L0 13l8-9v5h2c7 0 12 5 12 12v19z',
  right: 'M10 40V22c0-3 2-5 5-5h1v5l8-9-8-9v5h-2C7 9 2 14 2 21v19z',
  slight_left: 'M13 40V27c0-4-1-7-4-10l-3 3-2-14 13 4-4 3c3 4 4 8 4 13v14z',
  slight_right: 'M11 40V27c0-4 1-7 4-10l3 3 2-14-13 4 4 3c-3 4-4 8-4 13v14z',
  sharp_left: 'M14 40V20L6 28l-2 4-4-15 15 3-4 2 7-6c2 2 2 4 2 6v18z',
  sharp_right: 'M10 40V20l8 8 2 4 4-15-15 3 4 2-7-6c-2 2-2 4-2 6v18z',
  uturn: 'M20 40V12a6 6 0 0 0-12 0v14h4L6 36 0 26h4V12a10 10 0 0 1 20 0v28z',
  arrive: 'M12 2a8 8 0 0 0-8 8c0 6 8 16 8 16s8-10 8-16a8 8 0 0 0-8-8zm0 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6zM10 30h4v10h-4z',
};
export const kindOf = s => s.type === 'arrive' ? 'arrive' : s.modifier === 'uturn' ? 'uturn' : ({ left: 'left', right: 'right', 'slight left': 'slight_left', 'slight right': 'slight_right', 'sharp left': 'sharp_left', 'sharp right': 'sharp_right' })[s.modifier] || 'straight';
export const roadArrow = (k, cls = 'rda') => `<svg class="${cls}" viewBox="0 0 24 40" aria-hidden="true"><path d="${SH[k] || SH.straight}"/></svg>`;
const IND = { left: 'left', right: 'right', 'slight left': 'slight_left', 'slight right': 'slight_right', 'sharp left': 'sharp_left', 'sharp right': 'sharp_right', uturn: 'uturn', straight: 'straight', none: 'straight' };
/** OSRM lane string from services.js ("*left,straight|right,…"; '*' = valid for this manoeuvre) → lane pictograms. '' when no data. */
export function lanesHtml(str) {
  if (!str) return ''; const ls = str.split(','); if (ls.length < 2 || !ls.some(l => l[0] === '*')) return '';
  return `<div class="lanes">${ls.map(l => { const ok = l[0] === '*', ind = (ok ? l.slice(1) : l).split('|');
    return `<span class="ln${ok ? ' ok' : ''}">${ind.slice(0, 2).map(i => roadArrow(IND[i] || 'straight', 'lna')).join('')}</span>`; }).join('')}</div>`;
}
