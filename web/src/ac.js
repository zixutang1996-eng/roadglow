// v0.7 Google-Maps-style autocomplete engine shared by every search input.
// Instant local hits (<100 ms): important-POI dataset, offline index, saved, recents. Then remote: Photon (centre bias + province bbox),
// Nominatim fallback (countrycodes=ca + province viewbox, 1 req/s). Ranking tiers: in viewport < nearby (15 km) < same province < elsewhere.
import { photon, nominatim, haversine } from './services.js';
import * as ADDR from './addr.js';
import { parseAddress, geocodeAddress } from './geoaddr.js';
export { parseAddress, geocodeAddress };
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
// pinyin typed with or without spaces ("chaoyang gongyuan", "chaoyanggongyuan", initials "cygy")
const pyScore = (qn, alt) => { const q = qn.replace(/ /g, ''); if (q.length < 2 || /[^a-z0-9]/.test(q)) return -1; const w = alt.split(' '); return w.some(t => t === q) ? 3.5 : w.some(t => t.length > 4 && t.startsWith(q)) ? 2.5 : -1; };
export function textScore(qn, name, addr = '') {
  if (!qn) return 0; const nn = norm(name), an = norm(addr);
  if (/[\u3400-\u9fff]/.test(qn)) return nn.includes(qn) ? (nn === qn ? 4.5 : nn.startsWith(qn) ? 3 : 2) : -1;
  const qt = qn.split(' '), nt = nn.split(' '), at = an.split(' ').filter(Boolean); let s = 0;
  for (const [k, t] of qt.entries()) {
    let best = 9; for (const w of nt) best = Math.min(best, near1(t, w)); let inName = best < 9;
    if (!inName) { for (const w of at) best = Math.min(best, near1(t, w) + 0.5); if (best >= 9) return -1; }
    s += (best === 0 ? 2 : 1) + (inName ? 0.5 : 0) + (k === 0 && nt[0]?.startsWith(t) ? 1 : 0) + (nt.includes(t) ? 1 : 0);
  }
  return s + (nn.startsWith(qn) ? 2 : 0);
}
// v0.9.2 intent layer: category words (en + zh, prefix-typed) -> classes in the local dataset / OpenMapTiles + Photon osm_tag + common brand names
export const INTENTS = [
  { id: 'airport', k: ['airport', 'airports', 'aerodrome', 'airfield', 'yeg', 'yyc', 'yvr', 'yyz', '机场', '飞机场', '航站楼'], cls: ['aerodrome'], tag: ['aeroway:aerodrome'], q: ['airport', 'international airport'] },
  { id: 'gas', k: ['gas', 'gas station', 'fuel', 'petrol', 'gas bar', '加油站', '加油', '油站'], cls: ['fuel'], tag: ['amenity:fuel'], q: ['Shell', 'Petro-Canada', 'Esso', 'Chevron', 'Co-op Gas', 'Mobil', '76', 'gas station'] },
  { id: 'hospital', k: ['hospital', 'hospitals', 'emergency', 'er', '医院', '急诊'], cls: ['hospital'], sub: ['hospital'], tag: ['amenity:hospital'], q: ['hospital', 'medical centre'] },
  { id: 'coffee', k: ['coffee', 'cafe', 'café', 'coffee shop', '咖啡', '咖啡店', '咖啡馆'], cls: ['cafe'], tag: ['amenity:cafe'], q: ['Tim Hortons', 'Starbucks', 'coffee', 'cafe'] },
  { id: 'pharmacy', k: ['pharmacy', 'drugstore', 'drug store', 'chemist', '药店', '药房'], cls: ['pharmacy', 'chemist'], tag: ['amenity:pharmacy', 'shop:chemist'], q: ['pharmacy', 'Shoppers Drug Mart', 'Rexall', 'London Drugs', 'CVS', 'Walgreens'] },
  { id: 'grocery', k: ['grocery', 'groceries', 'supermarket', 'grocery store', '超市', '杂货', '杂货店', '菜市场'], cls: ['supermarket', 'grocery'], sub: ['supermarket', 'greengrocer', 'grocery', 'wholesale'], tag: ['shop:supermarket'], q: ['supermarket', 'Safeway', 'Sobeys', 'Superstore', 'No Frills', 'Save-On-Foods', 'Walmart Supercentre', 'Kroger'] },
  { id: 'train', k: ['train station', 'train', 'railway station', 'station', 'lrt', 'skytrain', 'subway', 'metro', '火车站', '车站', '轻轨', '地铁', '地铁站'], cls: ['railway'], tag: ['railway:station', 'railway:halt'], q: ['station'] },
  { id: 'bus', k: ['bus station', 'bus terminal', 'bus depot', 'transit centre', 'transit center', '汽车站', '巴士站', '公交站', '客运站'], cls: ['bus'], tag: ['amenity:bus_station'], q: ['bus station', 'bus terminal', 'transit centre'] },
  { id: 'ferry', k: ['ferry', 'ferry terminal', '渡口', '码头', '轮渡'], cls: ['ferry_terminal'], tag: ['amenity:ferry_terminal'], q: ['ferry terminal', 'ferry'] },
  { id: 'uni', k: ['university', 'college', 'campus', '大学', '学院'], cls: ['college', 'university'], sub: ['university', 'college'], tag: ['amenity:university', 'amenity:college'], q: ['university', 'college'] },
  { id: 'park', k: ['park', 'parks', '公园'], cls: ['park'], sub: ['park', 'garden', 'nature_reserve'], tag: ['leisure:park'], q: ['park'] },
  { id: 'hotel', k: ['hotel', 'hotels', 'motel', 'inn', 'lodging', '酒店', '宾馆', '旅馆', '住宿'], cls: ['lodging', 'hotel'], tag: ['tourism:hotel', 'tourism:motel'], q: ['hotel', 'inn', 'motel'] },
  { id: 'bank', k: ['bank', 'banks', 'atm', '银行', '取款机', '自动取款机'], cls: ['bank', 'atm'], tag: ['amenity:bank'], q: ['bank'] },
  { id: 'parking', k: ['parking', 'parking lot', 'car park', '停车场', '停车'], cls: ['parking'], tag: ['amenity:parking'], q: ['parking'] },
];
// v0.9.13 brand / nickname aliases (Canada first): what people type → the name actually mapped in OSM. Queried in parallel, local bbox.
export const ALIAS = { superstore: 'Real Canadian Superstore', 'super store': 'Real Canadian Superstore', rcss: 'Real Canadian Superstore', 'real canadian': 'Real Canadian Superstore',
  timmies: 'Tim Hortons', timmys: 'Tim Hortons', tims: 'Tim Hortons', 'tim hortons': 'Tim Hortons', 'tim horton': 'Tim Hortons', shoppers: 'Shoppers Drug Mart', sdm: 'Shoppers Drug Mart',
  'canadian tire': 'Canadian Tire', 'cdn tire': 'Canadian Tire', ct: 'Canadian Tire', mcd: "McDonald's", mcdonalds: "McDonald's", mickeyds: "McDonald's", 'a and w': 'A&W', aw: 'A&W',
  petro: 'Petro-Canada', 'petro canada': 'Petro-Canada', nofrills: 'No Frills', 'no frills': 'No Frills', 'save on': 'Save-On-Foods', saveon: 'Save-On-Foods', 'save on foods': 'Save-On-Foods',
  coop: 'Co-op', 'co op': 'Co-op', bestbuy: 'Best Buy', walmart: 'Walmart', 'wal mart': 'Walmart', costco: 'Costco', sbux: 'Starbucks', starbuck: 'Starbucks', dt: 'Dollar Tree', dollarama: 'Dollarama',
  'home depot': 'The Home Depot', homedepot: 'The Home Depot', 'london drug': 'London Drugs', 'winners': 'Winners', 'sport chek': 'Sport Chek', sportchek: 'Sport Chek', 'mec': 'MEC',
  'u of l': 'University of Lethbridge', uofl: 'University of Lethbridge', 'u of a': 'University of Alberta', uofa: 'University of Alberta', 'u of c': 'University of Calgary', nait: 'NAIT', sait: 'SAIT',
  'chinook hospital': 'Chinook Regional Hospital', 'park n fly': 'Park\'N Fly', wem: 'West Edmonton Mall' };
/** alias expansion for q (exact key, or a ≥4-letter prefix of a single alias key). Returns the brand name or null. */
export function aliasOf(q) { const x = norm(q).replace(/\s+/g, ' ').replace(/(\s+(in|near|at))?(\s+(lethbridge|edmonton|calgary|red deer|medicine hat|regina|saskatoon|winnipeg|vancouver|toronto|ottawa|montreal|ab|alberta|bc|sk|mb|on|qc|canada))+$/, '').trim(); if (!x) return null; if (ALIAS[x]) return norm(ALIAS[x]) === x ? null : ALIAS[x];
  if (x.length < 4) return null; const ks = Object.keys(ALIAS).filter(k => k.startsWith(x)); const v = [...new Set(ks.map(k => ALIAS[k]))]; return v.length === 1 && !norm(v[0]).startsWith(x) ? v[0] : null; }
// brand alias hits (e.g. "superstore" → Real Canadian Superstore) go first, nearest first — like typing a chain nickname in Google Maps
function boostAlias(all) { const a = all.filter(x => x._alias && x.ts >= 9).sort((p, q) => p.dist - q.dist); if (!a.length) return; const rest = all.filter(x => !a.includes(x)); all.length = 0; all.push(...a.slice(0, 3), ...rest, ...a.slice(3)); }
export function intentOf(q) {
  const x = norm(q); if (!x) return null; const cjk = /[\u3400-\u9fff]/.test(x);
  return INTENTS.find(e => e.k.includes(x)) || (cjk ? INTENTS.find(e => e.k.some(k => /[\u3400-\u9fff]/.test(k) && (k.includes(x) || (x.includes(k) && /^(附近|附近的|最近|最近的|周边|周边的|找|去|去最近的)?$/.test(x.replace(k, '').replace(/(在哪里?|在哪儿|附近)$/, '')))))) : null)
    || (x.length >= 3 ? INTENTS.find(e => e.k.some(k => k.length > 3 && (k.startsWith(x) || x === k + 's' || x.startsWith(k + ' ') || x.endsWith(' ' + k)))) : null) || null;
}
export const apSc = (n, it) => it?.id === 'uni' ? (/career|training|academy|language|beauty|test centre/i.test(n || '') ? -50 : /universit|universit[ée]|polytechni|institute of technology/i.test(n || '') ? 70 : 0) : it?.id === 'hospital' ? (/hospital|h[ôo]pital|medical cent(re|er)/i.test(n || '') ? 30 : 0) : it?.id !== 'airport' ? 0 : /international|intl/i.test(n || '') ? 150 : /seaplane|heli|water (aerodrome|airport)|harbou?r|air park|airpark/i.test(n || '') ? -60 : 20;
async function photonTag(q, ctx, it, signal) {
  const c = ctx.c, B = ctx.B, r = Math.max(0.6, B ? (B.getEast() - B.getWest()) * 0.75 : 0.6), ry = r * 0.6;
  const u = new URL('https://photon.komoot.io/api/'); const sp = new URLSearchParams({ q, limit: 10, lat: c.lat, lon: c.lng, location_bias_scale: 0.1, zoom: 12, bbox: [c.lng - r, c.lat - ry, c.lng + r, c.lat + ry].map(v => v.toFixed(4)).join(',') });
  for (const t of it.tag) sp.append('osm_tag', t); u.search = sp;
  const rr = await fetch(u, { signal }); if (!rr.ok) return [];
  return (await rr.json()).features.map(f => { const p = f.properties; return { name: p.name || q, address: [p.street && [p.housenumber, p.street].filter(Boolean).join(' '), p.city, p.state].filter(Boolean).join(', '), category: p.osm_key + '=' + p.osm_value, cls: it.cls[0],
    lng: f.geometry.coordinates[0], lat: f.geometry.coordinates[1], osm: p.osm_type ? { type: p.osm_type, id: p.osm_id } : null, _cat: 1, sc: apSc(p.name, it) }; }).filter(x => x.name);
}
let IDX = null, idxP = null;
const PC = new Map(); // Photon cache by area (0.1 deg) + normalised prefix
let PFX = null; // 2-char token-prefix -> entries (v0.9 prebuilt in-memory prefix index)
function buildPfx() { PFX = new Map(); for (const x of IDX) { const ks = new Set(norm(x.name + ' ' + (x.alt || '')).split(' ').filter(w => w.length >= 2).map(w => w.slice(0, 2))); for (const k of ks) { let a = PFX.get(k); if (!a) PFX.set(k, a = []); a.push(x); } } }
export function loadIndex(url) { return idxP ||= fetch(url).then(r => r.json()).then(j => { IDX = j.features.filter(f => f.properties.name).map(f => ({ name: f.properties.name, zh: f.properties['name:zh'], cls: f.properties.class, sc: f.properties.sc || 0, lng: f.geometry.coordinates[0], lat: f.geometry.coordinates[1], osm: f.properties.osm ? { type: f.properties.osm[0], id: +f.properties.osm.slice(1) } : null, toks: norm(f.properties.name), alt: [f.properties.en, f.properties.py].filter(Boolean).join(' ') || undefined, address: [f.properties.district, f.properties.street].filter(Boolean).join(' ') || '' })); buildPfx(); return IDX; }).catch(() => (IDX = [])); }
const tier = (x, ctx) => ctx.B && ctx.B.contains([x.lng, x.lat]) ? 0 : x.dist < 15000 ? 1 : x.dist < 60000 || ctx.prov && x.lng >= ctx.prov[0] && x.lng <= ctx.prov[2] && x.lat >= ctx.prov[1] && x.lat <= ctx.prov[3] ? 2 : 3;
const rank = (x, ctx) => ctx.it ? -x.ts * 40 - (x.ts >= 8 ? x.sc || 0 : 0) * 2 + Math.log10(1 + x.dist) * 60 + (x.dist > 60000 ? Math.min(220, (x.dist - 60000) / 1200) : 0) : tier(x, ctx) * (x.ts >= 4.5 ? 40 : 300) - x.ts * 40 - (x.sc || 0) * 2 + Math.log10(1 + x.dist) * 15 + (x.dist > 60000 ? Math.min(220, (x.dist - 60000) / 1200) : 0);
const key = x => norm(x.name) + '|' + (+x.lat).toFixed(3) + ',' + (+x.lng).toFixed(3);
// local instant results
export function localSuggest(q, ctx, extra = []) {
  const qn = norm(q); if (!qn) return []; const out = [], seen = new Set();
  const it = intentOf(q), icls = new Set(it?.cls || []); ctx.it = it;
  const push = (x, src) => { let ts = Math.max(textScore(qn, x.name, x.address), x.zh ? textScore(qn, x.zh) : -1, x.alt ? Math.max(textScore(qn, x.alt) - 0.5, pyScore(qn, x.alt)) : -1); if (it && (icls.has(x.cls) || icls.has(x.category) || x._cat)) { if (ts < 0 && haversine(ctx.c, x) > 150000) return; ts = Math.max(ts, 8); } else if (it) ts = Math.min(ts, 4); if (ts < 0) return; const k = key(x); if (seen.has(k)) return; seen.add(k);
    out.push({ ...x, name: ctx.zh && x.zh ? x.zh : x.name, ts: ts + (src === 'saved' ? 2 : src === 'recent' ? 1 : 0), dist: haversine(ctx.c, x), src }); };
  for (const [src, list] of extra) for (const x of list) if (x && x.lat != null) push(x, src);
  const pool = IDX ? (PFX && qn.length >= 2 && !/[\u3400-\u9fff]/.test(qn) ? (PFX.get(qn.slice(0, 2)) || []) : IDX) : [];
  for (const x of pool) { push({ name: x.name, zh: x.zh, alt: x.alt, address: x.address || '', category: x.cls, cls: x.cls, lat: x.lat, lng: x.lng, osm: x.osm, sc: x.sc }, 'idx'); }
  if (it && IDX && pool !== IDX) for (const x of IDX) if (icls.has(x.cls)) push({ name: x.name, zh: x.zh, alt: x.alt, address: x.address || '', category: x.cls, cls: x.cls, lat: x.lat, lng: x.lng, osm: x.osm, sc: x.sc }, 'idx');
  if (IDX && pool !== IDX && out.filter(o => o.src === 'idx').length < 3) for (const x of IDX) push({ name: x.name, zh: x.zh, alt: x.alt, address: x.address || '', category: x.cls, cls: x.cls, lat: x.lat, lng: x.lng, osm: x.osm, sc: x.sc }, 'idx');
  out.sort((a, b) => rank(a, ctx) - rank(b, ctx)); const dd = [];
  for (const x of out.slice(0, 40)) if (!dd.some(y => norm(y.name) === norm(x.name) && haversine(x, y) < (/airport|aerodrome/i.test(x.name) ? 9000 : 350))) dd.push(x);   // same place mapped twice (node + area)
  return farCut(dd).slice(0, 8);
}
// drop far-away rows (e.g. the Alberta dataset while viewing Seattle) whenever something nearby matched
const farCut = L => L.some(x => x.dist < 80000) ? L.filter(x => x.dist < 200000 || x.src === 'saved' || x.exact) : L;
// full pipeline: calls render(list, phase) with 'local' first (sync), then 'remote' merged with stable ordering
export async function suggest(q, ctx, extra, render, signal) {
  const t0 = performance.now(); const local = localSuggest(q, ctx, extra); render(local, 'local', performance.now() - t0);
  const qn = norm(q); if (qn.length < 2) return;
  const [code, prov] = provinceOf(ctx.c); ctx.prov = prov;
  const addrP = ADDR.parse(q) ? ADDR.search(q, 5, ctx.me || ctx.c).catch(() => []) : Promise.resolve([]); // city open-data address points (Edmonton, Lethbridge)
  // v0.9.13 general address pipeline (any Canadian address; offline city points first, then Photon/Nominatim structured/geocoder.ca, honest street fallback)
  const geoP = parseAddress(q) ? addrP.then(a => a.some(x => x.exact) ? [] : geocodeAddress(q, ctx.me || ctx.c, signal)).then(g => g.map(x => ({ ...x, _addr: 1, ts: x.exact ? 9 : 3, address: x.approx ? `${x.address} · ${ctx.zh ? '门牌号未收录，仅定位到街道' : 'house number not in open data — street only'}` : x.address }))).catch(() => []) : Promise.resolve([]);
  geoP.then(g => { if (g.length && !signal?.aborted) render([...g, ...local], 'addr', performance.now() - t0, code); });
  addrP.then(a => { if (a.length && !signal?.aborted) render([...a, ...local], 'addr', performance.now() - t0, code); });
  const ck = `${ctx.c.lat.toFixed(1)},${ctx.c.lng.toFixed(1)}|${qn}`;
  const ph = (...a) => { const ts = AbortSignal.timeout(7000), sg = signal && AbortSignal.any ? AbortSignal.any([signal, ts]) : ts; return photon(...a.slice(0, 4), sg, a[4]).catch(() => []); };
  const reqs = PC.has(ck) ? [Promise.resolve(PC.get(ck))] : [Promise.all([ph(q, ctx.c, 8, ctx.z), ph(q, ctx.c, 8, ctx.z, [ctx.c.lng - 0.7, ctx.c.lat - 0.45, ctx.c.lng + 0.7, ctx.c.lat + 0.45]), prov ? ph(q, ctx.c, 8, Math.min(ctx.z, 9), prov) : []]).then(r => { const f = r.flat(); if (f.length) { PC.set(ck, f); if (PC.size > 300) PC.delete(PC.keys().next().value); } return f; })];
  const alias = aliasOf(q); if (alias) { const ak = 'a|' + ck; reqs.push(PC.has(ak) ? Promise.resolve(PC.get(ak)) : ph(alias, ctx.c, 8, ctx.z, [ctx.c.lng - 0.7, ctx.c.lat - 0.45, ctx.c.lng + 0.7, ctx.c.lat + 0.45]).then(f => { f.forEach(x => x._alias = 1); if (f.length) PC.set(ak, f); return f; })); }
  const it = intentOf(q); ctx.it = it;
  if (it) { const ts = AbortSignal.timeout(7000), sg = signal && AbortSignal.any ? AbortSignal.any([signal, ts]) : ts; const ik = 'i|' + ck.split('|')[0] + '|' + it.id;
    reqs.push(PC.has(ik) ? Promise.resolve(PC.get(ik)) : Promise.all(it.q.slice(0, 3).map(w => photonTag(w, ctx, it, sg).catch(() => []))).then(r => { const f = r.flat(); if (f.length) PC.set(ik, f); return f; })); }
  const icl = new Set(it?.cls || []); const score = x => { x.dist = haversine(ctx.c, x); if (it && x.sc == null && (it.id !== 'airport' || /aerodrome/.test(x.category || ''))) x.sc = apSc(x.name, it); const cat = x._cat || (it && icl.has(String(x.category || '').split('=').pop())); x.ts = cat ? 8 : Math.max(Math.min(textScore(qn, x.name, x.address), it ? 4 : 99), x._alias ? (norm(x.name).startsWith(norm(aliasOf(q) || '')) ? 9 : 6) : 0.5); return x; };
  const addr = await addrP;
  // v0.9.13 progressive: render as soon as the fastest request lands instead of waiting for the slowest (7 s timeout)
  const got = []; let done = 0; const ib = [];
  await new Promise(res => { reqs.forEach((p, i) => p.then(f => { got[i] = f; }).catch(() => {}).finally(() => { done++; if (done < reqs.length && !signal?.aborted) { const part = got.flat().filter(Boolean); if (part.length) ib.push(part.length); try { mergeOut(part.map(x => ({ ...x })), false); } catch {} } if (done === reqs.length) res(); })); if (!reqs.length) res(); });
  let remote = got.flat().filter(Boolean).map(x => ({ ...x })); if (signal?.aborted) return;
  addr.push(...(await geoP)); if (signal?.aborted) return;
  function mergeOut(rm, fin) { const L = local.slice(); const loc = [...addr, ...L];
    rm = rm.map(score).filter(x => x.ts >= 0.5 && !(it && x.dist > 250000)); const sn = new Set(loc.map(key)); const nr = (a, b) => norm(a.name) === norm(b.name) && haversine(a, b) < 350;
    const all = []; for (const x of [...loc, ...rm.filter(x => !sn.has(key(x)))]) if (!all.some(y => nr(x, y))) all.push(x); for (const x of all) { if (x.dist == null) x.dist = haversine(ctx.c, x); if (x.ts == null) x.ts = 1; }
    all.sort((a, b) => rank(a, ctx) - rank(b, ctx)); boostAlias(all); render(farCut(all).slice(0, 8), fin ? 'remote' : 'partial', performance.now() - t0, code); }
  remote = remote.map(score).filter(x => x.ts >= 0.5 && !(it && x.dist > 250000));
  const addrLike = false; // v0.9.13: address-shaped queries go through geoaddr (Nominatim structured) instead
  if (addrLike || remote.length + local.length + addr.length < 3) { try { remote.push(...(await nominatim(q, ctx.c, { countrycodes: 'ca', viewbox: prov ? `${prov[0]},${prov[3]},${prov[2]},${prov[1]}` : undefined, signal })).map(score)); } catch {} if (signal?.aborted) return; }
  // stable merge: keep the local rows (and their order) on top; add new remote rows below, sorted by rank; fill to 8
  local.unshift(...addr); const seen = new Set(local.map(key)); const near = (a, b) => norm(a.name) === norm(b.name) && haversine(a, b) < (/airport|aerodrome/i.test(a.name) ? 9000 : 350);
  const add = remote.filter(x => !seen.has(key(x)) && !local.some(l => near(l, x))).sort((a, b) => rank(a, ctx) - rank(b, ctx));
  const dd = []; for (const x of add) if (!dd.some(y => near(x, y))) dd.push(x);
  const all = []; for (const x of [...local, ...dd]) if (!all.some(y => near(x, y))) all.push(x); for (const x of all) { if (x.dist == null) x.dist = haversine(ctx.c, x); if (x.ts == null) x.ts = 1; } all.sort((a, b) => rank(a, ctx) - rank(b, ctx)); boostAlias(all);
  render(farCut(all).slice(0, 8), 'remote', performance.now() - t0, code);
}
