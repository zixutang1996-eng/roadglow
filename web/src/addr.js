// City of Edmonton parcel address points (Open Government Licence - Edmonton), lazily loaded shards from public/addr/.
const base = import.meta.env?.BASE_URL || '/';
// v0.9.13: several cities, each its own lazily-loaded index in the same format (tools/gencoeaddr.py, tools/genlethaddr.py).
export const CITIES = [
  { id: 'yeg', dir: 'addr/', city: 'Edmonton, AB', box: [-113.75, 53.38, -113.2, 53.72], attr: 'Contains information licensed under the Open Government Licence – City of Edmonton' },
  { id: 'yql', dir: 'addr/yql/', city: 'Lethbridge, AB', box: [-113.0, 49.6, -112.7, 49.78], attr: 'Contains information licensed under the Open Government Licence – City of Lethbridge' },
];
const ST8 = new Map();
const cs = c => ST8.get(c.id) || (ST8.set(c.id, { IDX: null, idxP: null, SH: new Map(), GR: new Map() }), ST8.get(c.id));
export const cityAt = (lat, lng, pad = 0) => CITIES.find(c => lng > c.box[0] - pad && lng < c.box[2] + pad && lat > c.box[1] - pad && lat < c.box[3] + pad) || null;
const TY = { st: 'st', street: 'st', str: 'st', ave: 'ave', av: 'ave', avenue: 'ave', rd: 'rd', road: 'rd', dr: 'dr', drive: 'dr', blvd: 'blvd', boulevard: 'blvd', cres: 'cres', crescent: 'cres',
  cr: 'cres', crt: 'crt', court: 'crt', ct: 'crt', pl: 'pl', place: 'pl', way: 'way', trail: 'trail', tr: 'trail', lane: 'lane', ln: 'lane', close: 'close', cl: 'close', gate: 'gate', link: 'link',
  hts: 'hts', heights: 'hts', sq: 'sq', square: 'sq', terr: 'terr', terrace: 'terr', pt: 'pt', point: 'pt', bay: 'bay', loop: 'loop', green: 'green', cir: 'cir', circle: 'cir', wynd: 'wynd', bend: 'bend', common: 'common' };
const QD = new Set(['nw', 'sw', 'ne', 'se', 'n', 's', 'e', 'w']);
const DIRW = { north: 'n', south: 's', east: 'e', west: 'w', northwest: 'nw', southwest: 'sw', northeast: 'ne', southeast: 'se' };
const nrm = s => s.toLowerCase().replace(/(\d)(st|nd|rd|th)\b/g, '$1').replace(/(\d)([a-z]{2,})/g, '$1 $2').replace(/[.,#]/g, ' ').replace(/\b(edmonton|lethbridge|alberta|ab|canada|t\d[a-z]\s?\d[a-z]\d)\b/g, ' ').replace(/\s+/g, ' ').trim();
const toks = s => nrm(s).split(' ').filter(Boolean).map(w => DIRW[w] || TY[w] || w);
export function loadIndex(c = CITIES[0]) { const z = cs(c); return z.idxP ||= fetch(`${base}${c.dir}index.json`).then(r => r.json()).then(j => { z.IDX = j; j.keys = Object.keys(j.streets).map(s => [s, toks(s)]); return j; }).catch(() => null); }
const shard = (c, k) => { const z = cs(c); return z.SH.get(k) || (z.SH.set(k, fetch(`${base}${c.dir}s_${k}.json`).then(r => r.json()).catch(() => ({}))), z.SH.get(k)); };
const pt = (I, x, y) => ({ lng: I.b[0] + x / 1e5, lat: I.b[1] + y / 1e5 });
export const ATTR = CITIES[0].attr;
// Parse "12345 67 St NW", "12345-67 street", "12345 67st nw edmonton", "10220 104 ave", "123 jasper ave"
export function parse(q) {
  const m = nrm(q).match(/^(\d+[a-z]?)(?:\s*-\s*|\s+)(.+)$/); if (!m) return null;
  const st = m[2].split(' ').map(w => DIRW[w] || TY[w] || w); if (!st.length) return null; return { hn: m[1].toUpperCase(), st };
}
function streets(IDX, st) { // street tokens match: every query token is a prefix of the token at the same position (quadrant may be omitted)
  const out = [];
  for (const [name, t] of IDX.keys) {
    let ok = true, j = 0;
    for (const w of st) { if (j >= t.length) { ok = false; break; } if (QD.has(w) && !QD.has(t[j])) { const k = t.indexOf(w); if (k < 0) { ok = false; break; } j = k + 1; continue; }
      if (!(t[j] === w || (t[j].startsWith(w) && !/^\d+$/.test(w)) || (/^\d+$/.test(w) && t[j] === w))) { ok = false; break; } j++; }
    if (ok) out.push([name, t.length - j + (t.includes('nw') || !t.some(w => QD.has(w)) ? 0 : 0.5)]);
  }
  return out.sort((a, b) => a[1] - b[1]).slice(0, 6).map(a => a[0]);
}
/** Search every city index (the one around `near` first; others too, so "1581 coalbanks blvd w lethbridge" works from anywhere). */
export async function search(q, lim = 6, near) {
  const p = parse(q); if (!p) return []; const qn = q.toLowerCase();
  const order = [...CITIES].sort((a, b) => (qn.includes(b.city.split(',')[0].toLowerCase()) - qn.includes(a.city.split(',')[0].toLowerCase())) || ((near?.lat != null && cityAt(near.lat, near.lng, 0.5) === b) - (near && cityAt(near.lat, near.lng, 0.5) === a)));
  const res = [];
  for (const c of order) { const I = await loadIndex(c); if (!I) continue;
    for (const name of streets(I, p.st)) {
      const d = (await shard(c, I.streets[name]))[name] || [];
      for (let i = 0; i < d.length && res.length < lim * 2; i += 3) if (d[i] === p.hn || (d[i].startsWith(p.hn) && res.length < lim)) res.push({ name: `${d[i]} ${name}`, exact: d[i] === p.hn, ...pt(I, d[i + 1], d[i + 2]), _addr: 1, address: c.city, category: 'address', src: c.id === 'yeg' ? 'coe' : c.id });
    }
    if (res.some(r => r.exact)) break;
  }
  if (!res.some(r => r.exact) && !near?._u) { const u = nrm(q).match(/^([0-9a-z]+)\s*-\s*(\d+[a-z]?)\s+(.+)$/); // "36-3950 23 ave s" = unit 36 at 3950 (Edmonton "12345-67 st" handled above)
    if (u) { const r2 = await search(`${u[2]} ${u[3]}`, lim, { ...(near || {}), _u: 1 }); if (r2.some(r => r.exact)) return r2.map(r => ({ ...r, unit: u[1].toUpperCase() })); } }
  return res.sort((a, b) => b.exact - a.exact).slice(0, lim);
}
export async function reverse(lat, lng) {
  const c = cityAt(lat, lng); if (!c) return null; const IDX = await loadIndex(c), GR = cs(c).GR; if (!IDX) return null;
  const x = (lng - IDX.b[0]) * 1e5, y = (lat - IDX.b[1]) * 1e5, gx = Math.floor(x / IDX.g[0]), gy = Math.floor(y / IDX.g[1]); let best = null;
  for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
    const k = `${gx + dx}_${gy + dy}`; if (!GR.has(k)) GR.set(k, fetch(`${base}${c.dir}g_${k}.json`).then(r => r.ok ? r.json() : null).catch(() => null));
    const g = await GR.get(k); if (!g) continue;
    for (let i = 0; i < g.p.length; i += 4) { const ddx = (g.p[i + 2] - x) * Math.cos(lat * Math.PI / 180), ddy = g.p[i + 3] - y, d = ddx * ddx + ddy * ddy; if (!best || d < best.d) best = { d, hn: g.p[i], st: g.s[g.p[i + 1]], x: g.p[i + 2], y: g.p[i + 3] }; }
  }
  if (!best) return null; const m = Math.sqrt(best.d) * 1.11; // 1e-5 deg ≈ 1.11 m
  return { name: `${best.hn} ${best.st}`, dist: m, city: c.city, attr: c.attr, ...pt(IDX, best.x, best.y) };
}
