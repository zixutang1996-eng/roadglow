// v0.9.13 general street-address geocoder (all users, not one city). Pipeline for "<number> <street> [dir] [, city] [, prov] [postcode]":
//  1) offline municipal address points (addr.js: Edmonton, Lethbridge)  2) Photon with the raw AND expanded query, accepted only if house number + street match
//  3) Nominatim structured search (street/city/state) in parallel  4) geocoder.ca (free, throttled) only when nothing exact  5) honest street-level fallback.
const TYX = { st: 'street', str: 'street', ave: 'avenue', av: 'avenue', rd: 'road', dr: 'drive', blvd: 'boulevard', blv: 'boulevard', cres: 'crescent', cr: 'crescent', crt: 'court', ct: 'court',
  pl: 'place', ln: 'lane', hwy: 'highway', pkwy: 'parkway', cir: 'circle', terr: 'terrace', tr: 'trail', trl: 'trail', hts: 'heights', sq: 'square', pt: 'point', cl: 'close', gdns: 'gardens', mt: 'mount', ste: 'suite' };
const DIRX = { n: 'north', s: 'south', e: 'east', w: 'west', o: 'ouest', nw: 'northwest', ne: 'northeast', sw: 'southwest', se: 'southeast' };
const DIRS = { north: 'n', south: 's', east: 'e', west: 'w', ouest: 'w', est: 'e', nord: 'n', sud: 's', northwest: 'nw', northeast: 'ne', southwest: 'sw', southeast: 'se', n: 'n', s: 's', e: 'e', w: 'w', o: 'w', nw: 'nw', ne: 'ne', sw: 'sw', se: 'se' };
const PROV = { ab: 'Alberta', alberta: 'Alberta', bc: 'British Columbia', 'british columbia': 'British Columbia', sk: 'Saskatchewan', saskatchewan: 'Saskatchewan', mb: 'Manitoba', manitoba: 'Manitoba',
  on: 'Ontario', ont: 'Ontario', ontario: 'Ontario', qc: 'Quebec', que: 'Quebec', quebec: 'Quebec', 'québec': 'Quebec', nb: 'New Brunswick', ns: 'Nova Scotia', pe: 'Prince Edward Island', pei: 'Prince Edward Island', nl: 'Newfoundland and Labrador', yt: 'Yukon', nt: 'Northwest Territories', nu: 'Nunavut' };
const PC = /\b([abceghj-nprstvxy]\d[abceghj-nprstv-z])\s?(\d[abceghj-nprstv-z]\d)\b/i;
const fold = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
/** Parse a free-text street address. Returns null if it doesn't start with a house number. Pure (unit-tested in tools/geoaddr.test.mjs). */
export function parseAddress(q) {
  let s = fold(q).replace(/^\s*(?:(?:unit|apt|suite|ste|#)\s*\w+\s*[,-]?\s*)/, '').trim(); let unit = null;
  const um = s.match(/^(\w+)\s*-\s*(\d+[a-z]?)\s+(.*)$/); if (um && /\D/.test(um[3][0] || '')) { /* "12-345 main st" = unit 12, #345 */ unit = um[1]; s = um[2] + ' ' + um[3]; }
  let post = null; const pm = s.match(PC); if (pm) { post = (pm[1] + ' ' + pm[2]).toUpperCase(); s = s.replace(PC, ' '); }
  const parts = s.split(',').map(x => x.trim()).filter(Boolean); let head = parts.shift() || ''; let city = null, prov = null;
  for (const p of parts) { if (PROV[p]) prov = PROV[p]; else if (p !== 'canada' && !city) { const w = p.split(' '); if (PROV[w.at(-1)] && w.length > 1) { prov = PROV[w.pop()]; } city = w.join(' ') || null; } }
  const m = head.match(/^(\d+[a-z]?|\d+\s?1\/2)(?:\s*-\s*|\s+)(.+)$/); if (!m) return null;
  let w = m[2].replace(/(\d)(st|nd|rd|th)\b/g, '$1').replace(/\./g, '').split(/\s+/).filter(Boolean);
  if (!parts.length) { // "1581 coalbanks blvd w lethbridge ab": peel trailing province / city after the street type or direction
    if (w.length > 2 && PROV[w.at(-1)]) prov = PROV[w.pop()]; if (w.length > 1 && w.at(-1) === 'canada') w.pop();
    const ti = w.findLastIndex((x, i) => i > 0 && (TYX[x] || Object.values(TYX).includes(x) || DIRS[x]));
    if (ti > 0 && ti < w.length - 1) { city = w.slice(ti + 1).join(' '); w = w.slice(0, ti + 1); } }
  let dir = null; if (w.length > 1 && DIRS[w.at(-1)]) dir = DIRS[w.pop()]; else if (w.length > 2 && DIRS[w[0]] && !TYX[w[1]]) dir = DIRS[w.shift()];
  if (!w.length) return null; const type = w.length > 1 ? (TYX[w.at(-1)] || (Object.values(TYX).includes(w.at(-1)) ? w.at(-1) : null)) : null; if (type) w.pop();
  const name = w.join(' '); const cap = x => x.replace(/\b\w/g, c => c.toUpperCase());
  const street = cap([name, type, dir && (dir.length === 2 ? dir.toUpperCase() : DIRX[dir])].filter(Boolean).join(' '));
  return { hn: m[1].toUpperCase().replace(/\s/g, ''), unit, name, type, dir, street, city: city && cap(city), prov, post };
}
const TYPES = new Set([...Object.values(TYX), 'way', 'link', 'gate', 'bay', 'loop', 'green', 'bend', 'common', 'wynd', 'row', 'run', 'rise', 'view', 'park', 'mews', 'grove', 'landing', 'path', 'walk', 'manor', 'route', 'rue', 'chemin']);
const norm = s => fold(s).replace(/(\d)(st|nd|rd|th)\b/g, '$1').replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean).map(x => TYX[x] || x).map(x => DIRS[x] && x.length > 2 ? DIRS[x] : x);
/** true if a result street matches the parsed one: same name tokens, compatible type & direction (5 Street S ≠ 7 St S). */
export function streetMatch(p, st) {
  const t = norm(st), n = norm(p.name); if (!n.length || !n.every(x => t.includes(x))) return false;
  if (p.type && t.some(x => TYPES.has(x) && !n.includes(x)) && !t.includes(p.type)) return false;
  if (p.dir) { const d = t.filter(x => DIRS[x]).map(x => DIRS[x]); if (d.length && !d.includes(p.dir)) return false; }
  return true;
}
const tmo = (signal, ms) => signal && AbortSignal.any ? AbortSignal.any([signal, AbortSignal.timeout(ms)]) : AbortSignal.timeout(ms);
let gcBusy = null;
/** Remote pipeline. Returns [{name, address, lat, lng, exact, src, approx?}] (exact = this house number on this street). */
export async function geocodeAddress(q, near, signal) {
  const p = parseAddress(q); if (!p) return [];
  const where = [p.city, p.prov].filter(Boolean).join(', '); const full = `${p.hn} ${p.street}${where ? ', ' + where : ''}`;
  const ph = text => fetch('https://photon.komoot.io/api/?' + new URLSearchParams({ q: text, limit: 6, ...(near ? { lat: near.lat, lon: near.lng, location_bias_scale: 0.3 } : {}) }), { signal: tmo(signal, 6000) }).then(r => r.json()).then(j => j.features.map(f => ({ ...f.properties, lng: f.geometry.coordinates[0], lat: f.geometry.coordinates[1] }))).catch(() => []);
  const nm = () => fetch('https://nominatim.openstreetmap.org/search?' + new URLSearchParams({ street: `${p.hn} ${p.street}`, ...(p.city ? { city: p.city } : {}), ...(p.prov ? { state: p.prov } : {}), ...(p.post ? { postalcode: p.post } : {}), format: 'jsonv2', addressdetails: 1, limit: 3,
    ...(!p.city && near ? { viewbox: `${near.lng - 1},${near.lat + 1},${near.lng + 1},${near.lat - 1}` } : {}) }), { signal: tmo(signal, 8000) }).then(r => r.json()).catch(() => []);
  // v0.9.14: Nominatim starts in parallel but is only awaited if Photon has no exact house-number hit (Photon answers in ~0.5 s)
  const nmP = nm(); const [a, b] = await Promise.all([ph(q), q.toLowerCase() === full.toLowerCase() ? [] : ph(full)]); if (signal?.aborted) return [];
  const out = [], street = [];
  for (const x of [...a, ...b]) { const st = x.street || (x.housenumber ? null : x.name); if (!st || !streetMatch(p, st)) continue; if (p.city && x.city && !fold(x.city).includes(fold(p.city)) && !fold(p.city).includes(fold(x.city))) continue;
    if (fold(x.housenumber) === fold(p.hn)) out.push({ name: `${x.housenumber} ${st}`, address: [x.city, x.state].filter(Boolean).join(', '), lat: x.lat, lng: x.lng, exact: true, src: 'photon', category: 'address' });
    else if (!x.housenumber) street.push({ name: st, address: [x.city, x.state].filter(Boolean).join(', '), lat: x.lat, lng: x.lng }); }
  const n = out.length ? [] : await nmP; if (signal?.aborted) return [];
  for (const x of n) { const ad = x.address || {}; const st = ad.road || x.name; if (!st || !streetMatch(p, st)) continue; const c = ad.city || ad.town || ad.village || '';
    if (fold(ad.house_number) === fold(p.hn)) out.push({ name: `${ad.house_number} ${st}`, address: [c, ad.state].filter(Boolean).join(', '), lat: +x.lat, lng: +x.lon, exact: true, src: 'nominatim', category: 'address' });
    else street.push({ name: st, address: [c, ad.state].filter(Boolean).join(', '), lat: +x.lat, lng: +x.lon }); }
  if (!out.length && (p.city || near)) { // OSM has no house number here: geocoder.ca (free, ~2 req/s throttle; one at a time)
    try { if (signal?.aborted) return []; await Promise.race([gcBusy, new Promise(r => setTimeout(r, 700))]); const r = fetch('https://geocoder.ca/?' + new URLSearchParams({ locate: full + (p.post ? ' ' + p.post : ''), json: 1 }), { signal: tmo(signal, 4000) }).then(r => r.json()); gcBusy = r.catch(() => {}); const j = await r;
      const sd = j?.standard; if (j && +j.latt && sd && +sd.confidence >= 0.7 && fold(sd.stnumber) === fold(p.hn) && typeof sd.staddress === 'string' && streetMatch(p, sd.staddress))
        out.push({ name: `${sd.stnumber} ${sd.staddress}`, address: [sd.city, sd.prov].filter(Boolean).join(', '), lat: +j.latt, lng: +j.longt, exact: true, src: 'geocoder.ca', category: 'address' }); } catch { } }
  const seen = new Set(), res = out.filter(x => { const k = x.lat.toFixed(4) + x.lng.toFixed(4); return !seen.has(k) && seen.add(k); });
  if (!res.length && street.length) { const s = street[0]; res.push({ ...s, name: `${s.name}`, approx: true, src: 'street', category: 'highway', note: `${p.hn}: house number not in open map data — street only` }); }
  return res;
}
