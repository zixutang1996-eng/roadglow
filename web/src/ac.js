// v0.7 Google-Maps-style autocomplete engine shared by every search input.
// Instant local hits (<100 ms): important-POI dataset, offline index, saved, recents. Then remote: Photon (centre bias + province bbox),
// Nominatim fallback (countrycodes=ca + province viewbox, 1 req/s). Ranking tiers: in viewport < nearby (15 km) < same province < elsewhere.
import { photon, nominatim, haversine } from './services.js';
import * as ADDR from './addr.js';
export { ADDR };
// Canadian provinces/territories: rough bboxes [W,S,E,N] (checked in order; small ones first)
const PROV = [['PE', [-64.5, 45.9, -61.9, 47.1]], ['NS', [-66.4, 43.3, -59.6, 47.1]], ['NB', [-69.1, 44.5, -63.7, 48.1]], ['AB', [-120.0, 49.0, -110.0, 60.0]],
  ['SK', [-110.0, 49.0, -101.4, 60.0]], ['MB', [-102.1, 49.0, -88.9, 60.0]], ['BC', [-139.1, 48.2, -114.0, 60.0]], ['ON', [-95.2, 41.6, -74.3, 56.9]], ['QC', [-79.8, 44.9, -57.1, 62.6]],
  ['NL', [-67.9, 46.6, -52.6, 60.4]], ['YT', [-141.0, 60.0, -123.8, 69.7]], ['NT', [-136.5, 60.0, -102.0, 78.8]], ['NU', [-120.7, 51.6, -61.2, 83.2]]];
export const provinceOf = c => (PROV.find(([, b]) => c.lng >= b[0] && c.lng <= b[2] && c.lat >= b[1] && c.lat <= b[3]) || [null, null]);
export const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[’'`.]/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
// one-edit tolerance (substitution/insertion/deletion/transposition) between q and the same-length prefix of w
function near1(q, w) {
  if (w.startsWith(q)) return 0; if (q.length < 4) return 9;
  for (const L of [q.length - 1, q.length, q.length + 1]) { const p = w.slice(0, L); if (Math.abs(p.length - q.length) > 1) continue; let i = 0, j = 0, e = 0;
    while (i < q.length && j < p.length) { if (q[i] === p[j]) { i++; j++; continue; } if (++e > 1) break;
      if (q[i + 1] === p[j] && q[i] === p[j + 1]) { i += 2; j += 2; continue; } if (q.length > p.length) i++; else if (p.length > q.length) j++; else { i++; j++; } }
    e += (q.length - i) + (p.length - j); if (e <= 1) return 1; }
  return 9;
}
// text score: every query token must prefix-match (or 1-typo match) a distinct-ish token of name/address; CJK uses substring
export function textScore(qn, name, addr = '') {
  if (!qn) return 0; const nn = norm(name), an = norm(addr);
  if (/[\u3400-\u9fff]/.test(qn)) return nn.includes(qn) ? (nn.startsWith(qn) ? 3 : 2) : -1;
  const qt = qn.split(' '), nt = nn.split(' '), at = an.split(' ').filter(Boolean); let s = 0;
  for (const [k, t] of qt.entries()) {
    let best = 9; for (const w of nt) best = Math.min(best, near1(t, w)); let inName = best < 9;
    if (!inName) { for (const w of at) best = Math.min(best, near1(t, w) + 0.5); if (best >= 9) return -1; }
    s += (best === 0 ? 2 : 1) + (inName ? 0.5 : 0) + (k === 0 && nt[0]?.startsWith(t) ? 1 : 0) + (nt.includes(t) ? 1 : 0);
  }
  return s + (nn.startsWith(qn) ? 2 : 0);
}
let IDX = null, idxP = null;
const PC = new Map(); // Photon cache by area (0.1 deg) + normalised prefix
let PFX = null; // 2-char token-prefix -> entries (v0.9 prebuilt in-memory prefix index)
function buildPfx() { PFX = new Map(); for (const x of IDX) { const ks = new Set(norm(x.name).split(' ').filter(w => w.length >= 2).map(w => w.slice(0, 2))); for (const k of ks) { let a = PFX.get(k); if (!a) PFX.set(k, a = []); a.push(x); } } }
export function loadIndex(url) { return idxP ||= fetch(url).then(r => r.json()).then(j => { IDX = j.features.filter(f => f.properties.name).map(f => ({ name: f.properties.name, zh: f.properties['name:zh'], cls: f.properties.class, sc: f.properties.sc || 0, lng: f.geometry.coordinates[0], lat: f.geometry.coordinates[1], osm: f.properties.osm ? { type: f.properties.osm[0], id: +f.properties.osm.slice(1) } : null, toks: norm(f.properties.name) })); buildPfx(); return IDX; }).catch(() => (IDX = [])); }
const tier = (x, ctx) => ctx.B && ctx.B.contains([x.lng, x.lat]) ? 0 : x.dist < 15000 ? 1 : ctx.prov && x.lng >= ctx.prov[0] && x.lng <= ctx.prov[2] && x.lat >= ctx.prov[1] && x.lat <= ctx.prov[3] ? 2 : 3;
const rank = (x, ctx) => tier(x, ctx) * 300 - x.ts * 40 - (x.sc || 0) * 2 + Math.log10(1 + x.dist) * 15;
const key = x => norm(x.name) + '|' + (+x.lat).toFixed(3) + ',' + (+x.lng).toFixed(3);
// local instant results
export function localSuggest(q, ctx, extra = []) {
  const qn = norm(q); if (!qn) return []; const out = [], seen = new Set();
  const push = (x, src) => { const ts = Math.max(textScore(qn, x.name, x.address), x.zh ? textScore(qn, x.zh) : -1); if (ts < 0) return; const k = key(x); if (seen.has(k)) return; seen.add(k);
    out.push({ ...x, name: ctx.zh && x.zh ? x.zh : x.name, ts: ts + (src === 'saved' ? 2 : src === 'recent' ? 1 : 0), dist: haversine(ctx.c, x), src }); };
  for (const [src, list] of extra) for (const x of list) if (x && x.lat != null) push(x, src);
  const pool = IDX ? (PFX && qn.length >= 2 && !/[\u3400-\u9fff]/.test(qn) ? (PFX.get(qn.slice(0, 2)) || []) : IDX) : [];
  for (const x of pool) { push({ name: x.name, zh: x.zh, address: '', category: x.cls, cls: x.cls, lat: x.lat, lng: x.lng, osm: x.osm, sc: x.sc }, 'idx'); }
  if (IDX && pool !== IDX && out.filter(o => o.src === 'idx').length < 3) for (const x of IDX) push({ name: x.name, zh: x.zh, address: '', category: x.cls, cls: x.cls, lat: x.lat, lng: x.lng, osm: x.osm, sc: x.sc }, 'idx');
  out.sort((a, b) => rank(a, ctx) - rank(b, ctx)); const dd = [];
  for (const x of out.slice(0, 40)) if (!dd.some(y => norm(y.name) === norm(x.name) && haversine(x, y) < 350)) dd.push(x);   // same place mapped twice (node + area)
  return dd.slice(0, 8);
}
// full pipeline: calls render(list, phase) with 'local' first (sync), then 'remote' merged with stable ordering
export async function suggest(q, ctx, extra, render, signal) {
  const t0 = performance.now(); const local = localSuggest(q, ctx, extra); render(local, 'local', performance.now() - t0);
  const qn = norm(q); if (qn.length < 2) return;
  const [code, prov] = provinceOf(ctx.c); ctx.prov = prov;
  const addrP = ADDR.parse(q) && ctx.c.lng > -114 && ctx.c.lng < -113 && ctx.c.lat > 53.2 && ctx.c.lat < 53.8 ? ADDR.search(q, 5).catch(() => []) : Promise.resolve([]);
  addrP.then(a => { if (a.length && !signal?.aborted) render([...a, ...local], 'addr', performance.now() - t0, code); });
  const ck = `${ctx.c.lat.toFixed(1)},${ctx.c.lng.toFixed(1)}|${qn}`;
  const ph = (...a) => { const ts = AbortSignal.timeout(4000), sg = signal && AbortSignal.any ? AbortSignal.any([signal, ts]) : ts; return photon(...a.slice(0, 4), sg, a[4]).catch(() => []); };
  const reqs = PC.has(ck) ? [Promise.resolve(PC.get(ck))] : [Promise.all([ph(q, ctx.c, 8, ctx.z), prov ? ph(q, ctx.c, 8, Math.min(ctx.z, 9), prov) : []]).then(r => { const f = r.flat(); if (f.length) { PC.set(ck, f); if (PC.size > 300) PC.delete(PC.keys().next().value); } return f; })];
  const addr = await addrP;
  let remote = (await Promise.all(reqs)).flat().map(x => ({ ...x })); if (signal?.aborted) return;
  const score = x => { x.dist = haversine(ctx.c, x); x.ts = Math.max(textScore(qn, x.name, x.address), 0.5); return x; };
  remote = remote.map(score).filter(x => x.ts >= 0.5);
  if (remote.length + local.length + addr.length < 3) { try { remote.push(...(await nominatim(q, ctx.c, { countrycodes: 'ca', viewbox: prov ? `${prov[0]},${prov[3]},${prov[2]},${prov[1]}` : undefined, signal })).map(score)); } catch {} if (signal?.aborted) return; }
  // stable merge: keep the local rows (and their order) on top; add new remote rows below, sorted by rank; fill to 8
  local.unshift(...addr); const seen = new Set(local.map(key)); const near = (a, b) => norm(a.name) === norm(b.name) && haversine(a, b) < 350;
  const add = remote.filter(x => !seen.has(key(x)) && !local.some(l => near(l, x))).sort((a, b) => rank(a, ctx) - rank(b, ctx));
  const dd = []; for (const x of add) if (!dd.some(y => near(x, y))) dd.push(x);
  render([...local, ...dd].slice(0, Math.max(8, local.length)), 'remote', performance.now() - t0, code);
}
