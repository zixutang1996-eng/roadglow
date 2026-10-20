// City of Edmonton parcel address points (Open Government Licence - Edmonton), lazily loaded shards from public/addr/.
const base = import.meta.env?.BASE_URL || '/';
let IDX = null, idxP = null; const SH = new Map(), GR = new Map();
const TY = { st: 'st', street: 'st', str: 'st', ave: 'ave', av: 'ave', avenue: 'ave', rd: 'rd', road: 'rd', dr: 'dr', drive: 'dr', blvd: 'blvd', boulevard: 'blvd', cres: 'cres', crescent: 'cres',
  cr: 'cres', crt: 'crt', court: 'crt', ct: 'crt', pl: 'pl', place: 'pl', way: 'way', trail: 'trail', tr: 'trail', lane: 'lane', ln: 'lane', close: 'close', cl: 'close', gate: 'gate', link: 'link',
  hts: 'hts', heights: 'hts', sq: 'sq', square: 'sq', terr: 'terr', terrace: 'terr', pt: 'pt', point: 'pt', bay: 'bay', loop: 'loop', green: 'green', cir: 'cir', circle: 'cir', wynd: 'wynd', bend: 'bend', common: 'common' };
const QD = new Set(['nw', 'sw', 'ne', 'se']);
const nrm = s => s.toLowerCase().replace(/(\d)(st|nd|rd|th)\b/g, '$1').replace(/(\d)([a-z]{2,})/g, '$1 $2').replace(/[.,#]/g, ' ').replace(/\b(edmonton|alberta|ab|canada)\b/g, ' ').replace(/\s+/g, ' ').trim();
const toks = s => nrm(s).split(' ').filter(Boolean).map(w => TY[w] || w);
export function loadIndex() { return idxP ||= fetch(`${base}addr/index.json`).then(r => r.json()).then(j => { IDX = j; IDX.keys = Object.keys(j.streets).map(s => [s, toks(s)]); return j; }).catch(() => null); }
const shard = k => SH.get(k) || (SH.set(k, fetch(`${base}addr/s_${k}.json`).then(r => r.json()).catch(() => ({}))), SH.get(k));
const pt = (x, y) => ({ lng: IDX.b[0] + x / 1e5, lat: IDX.b[1] + y / 1e5 });
export const ATTR = 'Contains information licensed under the Open Government Licence – City of Edmonton';
// Parse "12345 67 St NW", "12345-67 street", "12345 67st nw edmonton", "10220 104 ave", "123 jasper ave"
export function parse(q) {
  const m = nrm(q).match(/^(\d+[a-z]?)(?:\s*-\s*|\s+)(.+)$/); if (!m) return null;
  const st = m[2].split(' ').map(w => TY[w] || w); if (!st.length) return null; return { hn: m[1].toUpperCase(), st };
}
function streets(st) { // street tokens match: every query token is a prefix of the token at the same position (quadrant may be omitted)
  const out = [];
  for (const [name, t] of IDX.keys) {
    let ok = true, j = 0;
    for (const w of st) { if (j >= t.length) { ok = false; break; } if (QD.has(w) && !QD.has(t[j])) { const k = t.indexOf(w); if (k < 0) { ok = false; break; } j = k + 1; continue; }
      if (!(t[j] === w || (t[j].startsWith(w) && !/^\d+$/.test(w)) || (/^\d+$/.test(w) && t[j] === w))) { ok = false; break; } j++; }
    if (ok) out.push([name, t.length - j + (t.includes('nw') ? 0 : 0.5)]);
  }
  return out.sort((a, b) => a[1] - b[1]).slice(0, 6).map(a => a[0]);
}
export async function search(q, lim = 6) {
  const p = parse(q); if (!p) return []; if (!IDX) await loadIndex(); if (!IDX) return [];
  const res = [];
  for (const name of streets(p.st)) {
    const d = (await shard(IDX.streets[name]))[name] || [];
    for (let i = 0; i < d.length && res.length < lim * 2; i += 3) if (d[i] === p.hn || (d[i].startsWith(p.hn) && res.length < lim)) res.push({ name: `${d[i]} ${name}`, exact: d[i] === p.hn, ...pt(d[i + 1], d[i + 2]), _addr: 1, address: 'Edmonton, AB', category: 'address', src: 'coe' });
  }
  return res.sort((a, b) => b.exact - a.exact).slice(0, lim);
}
export async function reverse(lat, lng) {
  if (!IDX) await loadIndex(); if (!IDX) return null;
  const x = (lng - IDX.b[0]) * 1e5, y = (lat - IDX.b[1]) * 1e5, gx = Math.floor(x / IDX.g[0]), gy = Math.floor(y / IDX.g[1]); let best = null;
  for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
    const k = `${gx + dx}_${gy + dy}`; if (!GR.has(k)) GR.set(k, fetch(`${base}addr/g_${k}.json`).then(r => r.ok ? r.json() : null).catch(() => null));
    const g = await GR.get(k); if (!g) continue;
    for (let i = 0; i < g.p.length; i += 4) { const ddx = (g.p[i + 2] - x) * Math.cos(lat * Math.PI / 180), ddy = g.p[i + 3] - y, d = ddx * ddx + ddy * ddy; if (!best || d < best.d) best = { d, hn: g.p[i], st: g.s[g.p[i + 1]], x: g.p[i + 2], y: g.p[i + 3] }; }
  }
  if (!best) return null; const m = Math.sqrt(best.d) * 1.11; // 1e-5 deg ≈ 1.11 m
  return { name: `${best.hn} ${best.st}`, dist: m, ...pt(best.x, best.y) };
}
