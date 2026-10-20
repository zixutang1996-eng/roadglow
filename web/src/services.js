// Free, fair-use services. No API keys. See ROADMAP.md for limits.
import { lang } from './i18n.js';

const withTimeout = (ms) => { const c = new AbortController(); setTimeout(() => c.abort(), ms); return c.signal; };

export async function photon(q, center, limit = 8) {
  const u = new URL('https://photon.komoot.io/api/');
  u.search = new URLSearchParams({ q, limit, lat: center.lat, lon: center.lng, location_bias_scale: 0.3, zoom: 12, ...(lang === 'en' ? { lang: 'en' } : {}) });
  const r = await fetch(u, { signal: withTimeout(8000) });
  if (!r.ok) throw new Error('Photon ' + r.status);
  return (await r.json()).features.map(fromPhoton);
}
export async function photonReverse(ll) {
  const r = await fetch(`https://photon.komoot.io/reverse?lat=${ll.lat}&lon=${ll.lng}&limit=1`, { signal: withTimeout(8000) });
  const f = (await r.json()).features[0];
  return f ? fromPhoton(f) : null;
}
function fromPhoton(f) {
  const p = f.properties;
  const street = [p.housenumber, p.street].filter(Boolean).join(' ');
  return {
    name: p.name || street || p.city || '?',
    address: [p.name ? street : null, p.district, p.city, p.state, p.postcode].filter(Boolean).join(', '),
    category: [p.osm_key, p.osm_value].filter(Boolean).join('='),
    lng: f.geometry.coordinates[0], lat: f.geometry.coordinates[1],
    osm: p.osm_type && p.osm_id ? { type: p.osm_type, id: p.osm_id } : null,
  };
}

// Nominatim: max 1 request/second (usage policy). Browser sends Referer automatically.
let lastNom = 0;
export async function nominatim(q, center) {
  const wait = Math.max(0, lastNom + 1100 - Date.now());
  await new Promise(r => setTimeout(r, wait)); lastNom = Date.now();
  const d = 0.6;
  const u = new URL('https://nominatim.openstreetmap.org/search');
  u.search = new URLSearchParams({ q, format: 'jsonv2', limit: 8, addressdetails: 1, 'accept-language': lang === 'zh' ? 'zh,en' : 'en',
    viewbox: `${center.lng - d},${center.lat + d},${center.lng + d},${center.lat - d}`, bounded: 0 });
  const r = await fetch(u, { signal: withTimeout(10000) });
  if (!r.ok) throw new Error('Nominatim ' + r.status);
  return (await r.json()).map(x => ({
    name: x.name || x.display_name.split(',')[0], address: x.display_name, category: `${x.category}=${x.type}`,
    lat: +x.lat, lng: +x.lon, osm: { type: x.osm_type[0].toUpperCase(), id: x.osm_id },
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
        'addr:housenumber': a.house_number, 'addr:street': a.road, 'addr:city': a.city || a.town, _display: x.display_name } };
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
  const prof = mode === 'walk' ? 'routed-foot' : 'routed-car';
  const u = `https://routing.openstreetmap.de/${prof}/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson&steps=true&alternatives=true`;
  const r = await fetch(u, { signal: withTimeout(15000) });
  const j = await r.json();
  if (j.code !== 'Ok') throw new Error('OSRM ' + j.code);
  return j.routes.map(rt => ({
    geometry: rt.geometry, distance: rt.distance, duration: rt.duration,
    steps: rt.legs.flatMap(l => l.steps.map(s => ({ type: s.maneuver.type, modifier: s.maneuver.modifier || '', name: s.name, distance: s.distance,
      exit: s.maneuver.exit, loc: { lng: s.maneuver.location[0], lat: s.maneuver.location[1] } }))),
  }));
}

/** Photo from wikimedia_commons / wikidata / image tags. */
export async function photoFor(tags) {
  if (tags.wikimedia_commons?.startsWith('File:')) return commons(tags.wikimedia_commons.slice(5));
  if (tags.image?.includes('commons.wikimedia.org') && tags.image.includes('File:')) return commons(decodeURIComponent(tags.image.split('File:')[1]));
  if (tags.wikidata) {
    try {
      const r = await fetch(`https://www.wikidata.org/wiki/Special:EntityData/${tags.wikidata}.json`, { signal: withTimeout(8000) });
      const e = (await r.json()).entities[tags.wikidata];
      const f = e?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
      if (f) return commons(f);
    } catch {}
  }
  return null;
}
const commons = f => ({ src: `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(f.replace(/ /g, '_'))}?width=480`,
  page: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(f.replace(/ /g, '_'))}` });

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
