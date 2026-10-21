// RoadGlow 北京 (Beijing edition): fully offline map, search, reverse geocoding and walking routes.
// Built with VITE_EDITION=beijing (see tools/beijing/build.sh). In the normal edition BJ is false and nothing here runs.
export const BJ = import.meta.env.VITE_EDITION === 'beijing';
export const BJ_CENTER = [116.4864, 39.9215], BJ_ZOOM = 13.5; // 朝阳区
export const BJ_BOUNDS = [115.42, 39.44, 117.51, 41.06];
const base = new URL(import.meta.env.BASE_URL, location.href).href;

// ---- network policy: foreign services are assumed unreachable from mainland China.
// Known-blocked hosts fail instantly; any other non-local request is aborted after 4 s so nothing hangs.
const BLOCKED = /(^|\.)(github\.com|github\.io|githubusercontent\.com|wikimedia\.org|wikipedia\.org|wikidata\.org|google\.com|googleapis\.com|gstatic\.com|komoot\.io|openstreetmap\.org|openstreetmap\.de|open-meteo\.com|panoramax\.xyz|transitous\.org|openfreemap\.org)$/i;
if (BJ) {
  const of = window.fetch.bind(window);
  window.fetch = (input, init = {}) => {
    let u; try { u = new URL(typeof input === 'string' ? input : input.url, location.href); } catch { return of(input, init); }
    if (u.origin === location.origin || u.protocol === 'data:' || u.protocol === 'blob:') return of(input, init);
    if (BLOCKED.test(u.hostname)) return Promise.reject(new TypeError('offline edition: ' + u.hostname));
    const t = AbortSignal.timeout(4000), sig = init.signal && AbortSignal.any ? AbortSignal.any([init.signal, t]) : t;
    return of(input, { ...init, signal: sig });
  };
}

// ---- reverse geocoding: nearest named street (≤ 400 m) + district polygon
let REV = null; const rev = () => REV ||= fetch(`${base}bj_rev.json`).then(r => r.json());
const m = (a, b) => { const dx = (b[0] - a[0]) * Math.cos(a[1] * Math.PI / 180) * 111320, dy = (b[1] - a[1]) * 110540; return Math.hypot(dx, dy); };
const inRing = (p, r) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) if ((r[i][1] > p[1]) !== (r[j][1] > p[1]) && p[0] < (r[j][0] - r[i][0]) * (p[1] - r[i][1]) / (r[j][1] - r[i][1]) + r[i][0]) c = !c; return c; };
export async function bjReverse(ll) {
  const R = await rev(), p = [ll.lng, ll.lat], cx = Math.floor(p[0] / R.cell), cy = Math.floor(p[1] / R.cell);
  let best = null, bd = 400;
  for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (const s of R.streets[`${cx + dx}_${cy + dy}`] || []) for (let i = 1; i < s.length; i += 2) { const d = m(p, [s[i], s[i + 1]]); if (d < bd) { bd = d; best = s[0]; } }
  let dist = ''; for (const [n, polys] of R.districts) if (polys.some(r => inRing(p, r))) { dist = n; break; }
  if (!dist && p[0] > 116.33 && p[0] < 116.40 && p[1] > 39.86 && p[1] < 39.97) dist = '西城区';
  return { street: best || '', district: dist, city: '北京市' };
}

// ---- walking router: A* on a pedestrian graph of central Beijing (Chaoyang, Dongcheng, Xicheng)
let G = null;
async function graph() {
  if (G) return G;
  const j = await (await fetch(`${base}bj_walk.json`)).json(), n = j.nodes.length, adj = Array.from({ length: n }, () => []);
  j.edges.forEach((e, i) => { adj[e[0]].push(i); adj[e[1]].push(i); });
  const cell = 0.004, grid = new Map(); j.nodes.forEach((p, i) => { if (!adj[i].length) return; const k = `${Math.floor(p[0] / cell)}_${Math.floor(p[1] / cell)}`; (grid.get(k) || grid.set(k, []).get(k)).push(i); });
  return G = { ...j, adj, grid, cell };
}
function nearest(g, p) {
  const cx = Math.floor(p[0] / g.cell), cy = Math.floor(p[1] / g.cell); let best = -1, bd = Infinity;
  for (let r = 0; r <= 3 && best < 0; r++) for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++) for (const i of g.grid.get(`${cx + dx}_${cy + dy}`) || []) { const d = m(p, g.nodes[i]); if (d < bd) { bd = d; best = i; } }
  return [best, bd];
}
const edgeGeo = (g, ei, from) => { const e = g.edges[ei], a = g.nodes[e[0]], pts = [a, ...e[4].map(d => [a[0] + d[0] / 1e6, a[1] + d[1] / 1e6]), g.nodes[e[1]]]; return from === e[0] ? pts : pts.reverse(); };
const brg = (a, b) => { const y = Math.sin((b[0] - a[0]) * Math.PI / 180) * Math.cos(b[1] * Math.PI / 180), x = Math.cos(a[1] * Math.PI / 180) * Math.sin(b[1] * Math.PI / 180) - Math.sin(a[1] * Math.PI / 180) * Math.cos(b[1] * Math.PI / 180) * Math.cos((b[0] - a[0]) * Math.PI / 180); return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360; };
export const inWalkArea = ll => ll.lng >= 116.25 && ll.lng <= 116.66 && ll.lat >= 39.80 && ll.lat <= 40.10;
/** returns routes in the same shape as services.osrm() */
export async function bjWalk(from, to) {
  const g = await graph(), [s, ds] = nearest(g, [from.lng, from.lat]), [t, dt] = nearest(g, [to.lng, to.lat]);
  if (s < 0 || t < 0 || ds > 600 || dt > 600) throw new Error('outside');
  const n = g.nodes.length, dist = new Float64Array(n).fill(Infinity), prev = new Int32Array(n).fill(-1), done = new Uint8Array(n), T = g.nodes[t];
  const heap = [[m(g.nodes[s], T), s]]; dist[s] = 0;
  const push = x => { heap.push(x); let i = heap.length - 1; while (i) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let k = i; if (l < heap.length && heap[l][0] < heap[k][0]) k = l; if (r < heap.length && heap[r][0] < heap[k][0]) k = r; if (k === i) break; [heap[k], heap[i]] = [heap[i], heap[k]]; i = k; } } return top; };
  let it = 0;
  while (heap.length && it++ < 2e6) { const [, u] = pop(); if (done[u]) continue; done[u] = 1; if (u === t) break;
    for (const ei of g.adj[u]) { const e = g.edges[ei], v = e[0] === u ? e[1] : e[0], nd = dist[u] + e[2]; if (nd < dist[v]) { dist[v] = nd; prev[v] = ei; push([nd + m(g.nodes[v], T), v]); } } }
  if (!done[t]) throw new Error('noroute');
  const path = []; for (let v = t; v !== s;) { const ei = prev[v], e = g.edges[ei], u = e[0] === v ? e[1] : e[0]; path.push([ei, u]); v = u; } path.reverse();
  const coords = [[from.lng, from.lat]], steps = []; let total = ds;
  const nm = ei => g.names[g.edges[ei][3]] || '';
  steps.push({ type: 'depart', mode: 'walking', modifier: '', name: path.length ? nm(path[0][0]) : '', distance: 0, loc: { lng: from.lng, lat: from.lat } });
  path.forEach(([ei, u], k) => {
    const geo = edgeGeo(g, ei, u);
    if (k > 0) { const pe = edgeGeo(g, path[k - 1][0], path[k - 1][1]), a = brg(pe[pe.length - 2], pe[pe.length - 1]), b = brg(geo[0], geo[1]); let d = ((b - a + 540) % 360) - 180;
      const turn = Math.abs(d) > 30 || (nm(ei) !== nm(path[k - 1][0]) && Math.abs(d) > 15);
      if (turn) steps.push({ type: 'turn', mode: 'walking', modifier: Math.abs(d) > 150 ? 'uturn' : Math.abs(d) < 50 ? (d > 0 ? 'slight right' : 'slight left') : d > 0 ? 'right' : 'left', name: nm(ei), distance: 0, loc: { lng: geo[0][0], lat: geo[0][1] } }); }
    coords.push(...geo); total += g.edges[ei][2]; steps[steps.length - 1].distance += g.edges[ei][2];
  });
  coords.push([to.lng, to.lat]); total += dt;
  steps.push({ type: 'arrive', mode: 'walking', modifier: '', name: '', distance: 0, loc: { lng: to.lng, lat: to.lat } });
  return [{ geometry: { type: 'LineString', coordinates: coords }, distance: total, duration: total / 1.25, steps, offline: true }];
}
