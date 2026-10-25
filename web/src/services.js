// Free, fair-use services. No API keys. See ROADMAP.md for limits.
import { lang } from './i18n.js';
import { BJ, bjWalk, bjReverse, inWalkArea, EDITION } from './bj.js';
const WALK_AREA = { beijing: '朝阳、东城、西城区', shandong: '济南市中心城区', shaanxi: '西安市中心城区' };

const withTimeout = (ms) => { const c = new AbortController(); setTimeout(() => c.abort(), ms); return c.signal; };

export async function photonBox(q, B, center, zoom, limit = 10, signal) { // results strictly inside (1.5x) the current view
  const dx = (B.getEast() - B.getWest()) * 0.25, dy = (B.getNorth() - B.getSouth()) * 0.25;
  const u = new URL('https://photon.komoot.io/api/');
  u.search = new URLSearchParams({ q, limit, lat: center.lat, lon: center.lng, zoom: Math.round(zoom), location_bias_scale: 0.1, bbox: [B.getWest() - dx, B.getSouth() - dy, B.getEast() + dx, B.getNorth() + dy].map(x => x.toFixed(5)).join(','), ...(lang === 'en' ? { lang: 'en' } : {}) });
  const r = await fetch(u, { signal: signal ? AbortSignal.any([signal, withTimeout(8000)]) : withTimeout(8000) }); if (!r.ok) throw new Error('Photon ' + r.status);
  return (await r.json()).features.map(fromPhoton);
}
export async function photon(q, center, limit = 8, zoom = 12, signal, bbox) {
  const u = new URL('https://photon.komoot.io/api/');
  u.search = new URLSearchParams({ q, limit, lat: center.lat, lon: center.lng, location_bias_scale: 0.2, zoom: Math.round(zoom), ...(bbox ? { bbox: bbox.join(',') } : {}), ...(lang === 'en' ? { lang: 'en' } : {}) });
  const r = await fetch(u, { signal: signal ? AbortSignal.any([signal, withTimeout(8000)]) : withTimeout(8000) });
  if (!r.ok) throw new Error('Photon ' + r.status);
  return (await r.json()).features.map(fromPhoton);
}
export async function photonReverse(ll) {
  if (BJ) { const r = await bjReverse(ll); return { name: r.street || '已选位置', address: [r.district, r.city, r.city === r.prov ? '' : r.prov].filter(Boolean).join('，'), lat: ll.lat, lng: ll.lng }; }
  const r = await fetch(`https://photon.komoot.io/reverse?lat=${ll.lat}&lon=${ll.lng}&limit=1`, { signal: withTimeout(8000) });
  const f = (await r.json()).features[0];
  return f ? fromPhoton(f) : null;
}
function fromPhoton(f) {
  const p = f.properties;
  const street = p.street && p.housenumber && String(p.street).startsWith(p.housenumber + ' ') ? p.street : [p.housenumber, p.street].filter(Boolean).join(' ');
  return {
    name: p.name || street || p.city || '?',
    address: [p.name ? street : null, p.district, p.city, p.state, p.postcode].filter(Boolean).join(', '),
    category: [p.osm_key, p.osm_value].filter(Boolean).join('='),
    lng: f.geometry.coordinates[0], lat: f.geometry.coordinates[1],
    osm: p.osm_type && p.osm_id ? { type: p.osm_type, id: p.osm_id } : null,
    city: p.city || p.town || p.village || p.county || '', state: p.state || '', cc: p.countrycode || '',
  };
}

// Nominatim: max 1 request/second (usage policy). Browser sends Referer automatically.
let lastNom = 0;
export async function nominatim(q, center, opt = {}) {
  // v0.9.14: reserve a slot (1 req/s policy) without stacking stale keystrokes; abortable while waiting
  const slot = Math.max(Date.now(), lastNom + 1100); lastNom = slot;
  await new Promise((r, rj) => { const t = setTimeout(r, slot - Date.now()); opt.signal?.addEventListener('abort', () => { clearTimeout(t); rj(new Error('aborted')); }, { once: true }); });
  const d = 0.6;
  const u = new URL('https://nominatim.openstreetmap.org/search');
  u.search = new URLSearchParams({ q, format: 'jsonv2', limit: 8, addressdetails: 1, 'accept-language': lang === 'zh' ? 'zh,en' : 'en',
    viewbox: opt.viewbox || `${center.lng - d},${center.lat + d},${center.lng + d},${center.lat - d}`, bounded: 0, ...(opt.countrycodes ? { countrycodes: opt.countrycodes } : {}) });
  const r = await fetch(u, { signal: opt.signal ? AbortSignal.any([opt.signal, withTimeout(10000)]) : withTimeout(10000) });
  if (!r.ok) throw new Error('Nominatim ' + r.status);
  return (await r.json()).map(x => ({
    name: x.name || x.display_name.split(',')[0], address: x.display_name, category: `${x.category}=${x.type}`,
    lat: +x.lat, lng: +x.lon, osm: { type: x.osm_type[0].toUpperCase(), id: x.osm_id },
    city: x.address?.city || x.address?.town || x.address?.village || x.address?.county || '', state: x.address?.state || '',
  }));
}

const OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter', 'https://overpass.private.coffee/api/interpreter'];
export async function overpass(query, totalMs = 20000) {
  let err; const t0 = Date.now();
  for (const ep of OVERPASS) {
    if (Date.now() - t0 > totalMs) break;
    try {
      const r = await fetch(ep, { method: 'POST', body: 'data=' + encodeURIComponent(query), headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, signal: withTimeout(8000) });
      if (r.ok) return (await r.json()).elements;
      err = new Error('Overpass ' + r.status);
    } catch (e) { err = e; }
  }
  throw err;
}
const T = { N: 'node', W: 'way', R: 'relation', node: 'node', way: 'way', relation: 'relation' };
async function nomQueue() { const wait = Math.max(0, lastNom + 1100 - Date.now()); await new Promise(r => setTimeout(r, wait)); lastNom = Date.now(); }
// Details: Nominatim lookup (extratags has opening_hours/phone/website); Overpass as fallback.
export async function osmElement(type, id) {
  const tl = { N: 'N', W: 'W', R: 'R', node: 'N', way: 'W', relation: 'R' }[type];
  try {
    await nomQueue();
    const r = await fetch(`https://nominatim.openstreetmap.org/lookup?osm_ids=${tl}${id}&extratags=1&addressdetails=1&namedetails=1&format=jsonv2&accept-language=${lang === 'zh' ? 'zh,en' : 'en'}`, { signal: withTimeout(8000) });
    const x = (await r.json())[0];
    if (x) {
      const a = x.address || {};
      return { tags: { ...(x.namedetails || {}), ...(x.extratags || {}), [x.category]: x.type, name: x.name,
        'addr:housenumber': a.house_number, 'addr:street': a.road, 'addr:city': a.city || a.town || a.village, '_n:postcode': a.postcode, '_n:state': a.state, '_n:cc': a.country_code, '_n:country': a.country, '_n:unit': a.unit, _display: x.display_name } };
    }
  } catch {}
  const els = await overpass(`[out:json][timeout:12];${T[type]}(${id});out tags center;`);
  return els[0] || null;
}
const NOMCAT = { restaurant: { amenity: 'restaurant' }, cafe: { amenity: 'cafe' }, fuel: { amenity: 'fuel' }, pharmacy: { amenity: 'pharmacy' }, atm: { amenity: 'atm' },
  charging: { amenity: 'charging_station' }, parking: { amenity: 'parking' }, supermarket: { q: 'supermarket' }, hotel: { q: 'hotel' }, park: { q: 'park' } };
export async function nearbyCategoryNominatim(key, bounds) {
  await nomQueue();
  const u = new URL('https://nominatim.openstreetmap.org/search');
  u.search = new URLSearchParams({ ...NOMCAT[key], viewbox: `${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()},${bounds.getSouth()}`, bounded: 1, limit: 40, extratags: 1, addressdetails: 1, format: 'jsonv2' });
  const r = await fetch(u, { signal: withTimeout(10000) });
  return (await r.json()).map(x => ({ type: x.osm_type, id: x.osm_id, lat: +x.lat, lon: +x.lon,
    tags: { name: x.name, ...(x.extratags || {}), 'addr:housenumber': x.address?.house_number, 'addr:street': x.address?.road } })).filter(x => x.tags.name);
}
export async function nearbyCategory(filter, bounds) {
  const b = `${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()}`;
  return overpass(`[out:json][timeout:10];nwr${filter}["name"](${b});out tags center 60;`, 9000);
}

export async function osrm(from, to, mode) {
  if (BJ) { // offline walking graph; online engines only as a quick (≤4 s) try for driving/cycling
    const walk = () => bjWalk(from, to).catch(e => { throw new Error(e.message === 'outside' ? `离线步行路线只覆盖${WALK_AREA[EDITION] || ''}（起点或终点超出范围）` : '离线地图中找不到可步行的路线'); });
    if (mode === 'walk') return walk();
    try { return await osrmOnline(from, to, mode); } catch {}
    if (inWalkArea(from) && inWalkArea(to)) { const r = await walk(); r[0].note = '在线路线服务无法连接，已显示离线步行路线'; return r; }
    throw new Error('在线路线服务无法连接（网络受限）。离线时请使用“步行”。');
  }
  return osrmOnline(from, to, mode);
}
async function osrmOnline(from, to, mode) {
  const prof = mode === 'walk' ? 'routed-foot' : mode === 'bike' ? 'routed-bike' : 'routed-car';
  const u = `https://routing.openstreetmap.de/${prof}/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson&steps=true&alternatives=true`;
  const r = await fetch(u, { signal: withTimeout(15000) });
  const j = await r.json();
  if (j.code !== 'Ok') throw new Error('OSRM ' + j.code);
  const laneStr = ls => Array.isArray(ls) && ls.length > 1 && ls.length <= 12 ? ls.map(l => (l.valid ? '*' : '') + (l.indications || ['none']).join('|')).join(',') : ''; // v0.9.11 lane hint for the car panel
  return j.routes.map(rt => ({
    geometry: rt.geometry, distance: rt.distance, duration: rt.duration,
    steps: rt.legs.flatMap(l => l.steps.map(s => ({ type: s.maneuver.type, mode: s.mode, modifier: s.maneuver.modifier || '', name: s.name, distance: s.distance,
      exit: s.maneuver.exit, lanes: laneStr(s.intersections?.[0]?.lanes), loc: { lng: s.maneuver.location[0], lat: s.maneuver.location[1] } }))),
  }));
}

/** Public photo: Wikimedia Commons (via tags/Wikidata P18) with author+licence; Panoramax street-level fallback. */
export async function photoFor(tags, ll) {
  let file = null;
  if (tags.wikimedia_commons?.startsWith('File:')) file = tags.wikimedia_commons.slice(5);
  else if (tags.image?.includes('commons.wikimedia.org') && tags.image.includes('File:')) file = decodeURIComponent(tags.image.split('File:')[1]);
  else if (tags.wikidata) {
    try {
      const r = await fetch(`https://www.wikidata.org/wiki/Special:EntityData/${tags.wikidata}.json`, { signal: withTimeout(8000) });
      file = (await r.json()).entities?.[tags.wikidata]?.claims?.P18?.[0]?.mainsnak?.datavalue?.value || null;
    } catch {}
  }
  if (file) { try { return await commons(file); } catch {} }
  if (ll) { try { return await panoramax(ll); } catch {} }
  return null;
}
const strip = h => (h || '').replace(/<[^>]+>/g, '').trim();
async function commons(f) {
  const u = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(f)}&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=640&format=json&origin=*`;
  const p = Object.values((await (await fetch(u, { signal: withTimeout(8000) })).json()).query.pages)[0];
  const i = p.imageinfo[0], m = i.extmetadata || {};
  return { src: i.thumburl || i.url, page: i.descriptionurl, credit: `${strip(m.Artist?.value) || 'Wikimedia Commons'} · ${m.LicenseShortName?.value || ''} · Wikimedia Commons` };
}
async function panoramax(ll) {
  const d = 0.0009;
  const r = await fetch(`https://api.panoramax.xyz/api/search?bbox=${ll.lng - d * 1.7},${ll.lat - d},${ll.lng + d * 1.7},${ll.lat + d}&limit=1`, { signal: withTimeout(8000) });
  const f = (await r.json()).features?.[0];
  if (!f) return null;
  const prov = (f.providers || []).map(p => p.name).filter(Boolean).join(', ');
  return { src: f.assets?.sd?.href || f.assets?.thumb?.href, page: `https://api.panoramax.xyz/#focus=pic&pic=${f.id}`, credit: `${prov || 'Panoramax'} · ${f.properties?.license || 'CC-BY-SA-4.0'} · Panoramax (street-level, nearby)` };
}

export function haversine(a, b) {
  const R = 6371000, r = Math.PI / 180, dLat = (b.lat - a.lat) * r, dLon = (b.lng - a.lng) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
export function distToLine(p, coords) {
  const k = Math.cos(p.lat * Math.PI / 180) * 111320, kk = 110540; let best = Infinity;
  for (let i = 0; i + 1 < coords.length; i++) {
    const ax = (coords[i][0] - p.lng) * k, ay = (coords[i][1] - p.lat) * kk, bx = (coords[i + 1][0] - p.lng) * k, by = (coords[i + 1][1] - p.lat) * kk;
    const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy; let tt = l2 ? -(ax * dx + ay * dy) / l2 : 0; tt = Math.max(0, Math.min(1, tt));
    best = Math.min(best, Math.hypot(ax + tt * dx, ay + tt * dy));
  }
  return best;
}

/** Gallery: all public photos we can legally show (Commons files from tags, Wikidata P18 + P373 category), each with credit. */
export async function photosFor(tags, ll) {
  const files = [], cats = [];
  const add = f => { f = f.replace(/^File:/, '').replace(/_/g, ' '); if (!files.includes(f)) files.push(f); };
  const wc = tags.wikimedia_commons;
  if (wc?.startsWith('File:')) add(wc); else if (wc?.startsWith('Category:')) cats.push(wc.slice(9));
  if (tags.image?.includes('commons.wikimedia.org') && tags.image.includes('File:')) add(decodeURIComponent(tags.image.split('File:')[1]));
  if (tags.wikidata) {
    try {
      const c = (await (await fetch(`https://www.wikidata.org/wiki/Special:EntityData/${tags.wikidata}.json`, { signal: withTimeout(8000) })).json()).entities?.[tags.wikidata]?.claims || {};
      (c.P18 || []).forEach(x => x.mainsnak?.datavalue && add(x.mainsnak.datavalue.value));
      (c.P373 || []).forEach(x => x.mainsnak?.datavalue && cats.push(x.mainsnak.datavalue.value));
    } catch {}
  }
  for (const cat of cats.slice(0, 1)) {
    try {
      const j = await (await fetch(`https://commons.wikimedia.org/w/api.php?action=query&list=categorymembers&cmtitle=Category:${encodeURIComponent(cat)}&cmtype=file&cmlimit=12&format=json&origin=*`, { signal: withTimeout(8000) })).json();
      (j.query?.categorymembers || []).forEach(m => /\.(jpe?g|png|webp)$/i.test(m.title) && add(m.title));
    } catch {}
  }
  const out = [];
  for (let i = 0; i < Math.min(files.length, 12); i += 6) {
    try {
      const chunk = files.slice(i, i + 6).map(f => 'File:' + f).join('|');
      const j = await (await fetch(`https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(chunk)}&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=900&format=json&origin=*`, { signal: withTimeout(9000) })).json();
      for (const p of Object.values(j.query?.pages || {})) { const ii = p.imageinfo?.[0]; if (!ii) continue; const m = ii.extmetadata || {};
        out.push({ src: ii.thumburl || ii.url, page: ii.descriptionurl, credit: `${strip(m.Artist?.value) || 'Wikimedia Commons'} · ${m.LicenseShortName?.value || ''} · Wikimedia Commons` }); }
    } catch {}
  }
  if (!out.length && ll) { try { const p = await panoramax(ll); if (p) out.push(p); } catch {} }
  return out;
}

// Reverse geocode (Nominatim, queued 1 req/s, cached in memory + localStorage)
const revCache = new Map(Object.entries(JSON.parse(localStorage.getItem('revCache') || '{}')));
export async function reverseAddr(ll) {
  if (BJ) { const r = await bjReverse(ll); return { 'addr:street': r.street, 'addr:city': r.city || r.district || r.prov, '_n:state': r.prov, '_n:cc': 'cn', '_n:country': '中国' }; }
  const k = ll.lat.toFixed(5) + ',' + ll.lng.toFixed(5); if (revCache.has(k)) return revCache.get(k);
  await nomQueue();
  const x = await (await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${ll.lat}&lon=${ll.lng}&format=jsonv2&addressdetails=1&zoom=18&accept-language=${lang === 'zh' ? 'zh,en' : 'en'}`, { signal: withTimeout(8000) })).json();
  const a = x.address || {}; const r = { 'addr:housenumber': a.house_number, 'addr:street': a.road, 'addr:city': a.city || a.town || a.village || a.municipality, '_n:postcode': a.postcode, '_n:state': a.state, '_n:cc': a.country_code, '_n:country': a.country };
  revCache.set(k, r); try { localStorage.setItem('revCache', JSON.stringify(Object.fromEntries([...revCache].slice(-300)))); } catch {}
  return r;
}
