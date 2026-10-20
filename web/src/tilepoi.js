// v0.9.2 world-wide gradual POI reveal. OpenFreeMap only ships the full POI layer in z14 tiles (z11-13 tiles carry rail stations only),
// so from map zoom 12 the z14 tiles covering the view are fetched (browser-cached, same URLs the map itself uses at z14),
// decoded here and given a reveal zoom rz = class tier + per-tile importance rank (OpenMapTiles rank) -> evenly spread, no bursts.
import { PbfReader as Pbf } from 'pbf';
import { VectorTile } from '@mapbox/vector-tile';
export const DENY = new Set(['gate', 'bollard', 'lift_gate', 'kerb', 'cycle_barrier', 'bench', 'waste_basket', 'bicycle_parking', 'vending_machine', 'parking_entrance', 'street_lamp', 'fire_hydrant', 'manhole', 'pole', 'shelter', 'entrance', 'recycling', 'drinking_water', 'post_box', 'telephone', 'swimming_pool', 'pitch', 'bus_stop', 'toilets', 'atm', 'parking_space', 'charging_station']);
const T0 = new Set(['mall', 'department_store', 'station', 'aerodrome', 'university', 'stadium', 'zoo', 'theme_park', 'ferry_terminal']);
const C0 = new Set(['hospital', 'railway', 'college', 'stadium', 'museum', 'zoo', 'town_hall', 'ferry_terminal', 'attraction', 'castle']);
const C1 = new Set(['grocery', 'supermarket', 'fuel', 'pharmacy', 'library', 'lodging', 'cinema', 'theatre', 'school', 'police', 'fire_station', 'monument', 'campsite']);
const C2 = new Set(['restaurant', 'fast_food', 'cafe', 'bank', 'bar', 'pub', 'park', 'shop', 'place_of_worship', 'post']);
export const rzOf = p => (p.class === 'hospital' && p.subclass !== 'hospital') || p.subclass === 'kindergarten' || p.subclass === 'childcare' ? 13.75 + 0.05 * (Math.min(p.rank ?? 40, 40) - 1) : (T0.has(p.subclass) || C0.has(p.class) ? 12 : C1.has(p.class) ? 12.5 : C2.has(p.class) ? 13 : p.class === 'bus' ? 14.75 : 13.75) + 0.05 * (Math.min(p.rank ?? 40, 40) - 1);
const cache = new Map(), pend = new Map();
async function tile(tpl, x, y) {
  const k = x + '/' + y; if (cache.has(k)) return cache.get(k); if (pend.has(k)) return pend.get(k);
  const pr = fetch(tpl.replace('{z}', 14).replace('{x}', x).replace('{y}', y)).then(r => r.ok ? r.arrayBuffer() : null).then(buf => {
    const out = []; if (buf) { const L = new VectorTile(new Pbf(buf)).layers.poi;
      if (L) for (let i = 0; i < L.length; i++) { const f = L.feature(i), p = f.properties; if (!p.name || DENY.has(p.subclass) || DENY.has(p.class)) continue;
        const g = f.toGeoJSON(x, y, 14); if (g.geometry.type !== 'Point') continue; const rz = +rzOf(p).toFixed(2); 
        out.push({ type: 'Feature', id: f.id, properties: { name: p.name, 'name:en': p['name:en'], 'name:zh': p['name:zh'], 'name:zh-Hans': p['name:zh-Hans'], 'name:latin': p['name:latin'], class: p.class, subclass: p.subclass, rank: p.rank, rz, sc: 100 - rz * 5 }, geometry: g.geometry }); } }
    cache.set(k, out); pend.delete(k); if (cache.size > 500) cache.delete(cache.keys().next().value); return out; }).catch(() => { pend.delete(k); return []; });
  pend.set(k, pr); return pr;
}
const lx = (lng) => Math.floor((lng + 180) / 360 * 16384), ly = lat => Math.floor((1 - Math.asinh(Math.tan(lat * Math.PI / 180)) / Math.PI) / 2 * 16384);
// returns a FeatureCollection for the view (or null when the view needs more than maxTiles tiles)
export async function poisFor(bounds, tpl, keep, maxTiles = 48) {
  const x0 = lx(bounds.getWest()), x1 = lx(bounds.getEast()), y0 = ly(bounds.getNorth()), y1 = ly(bounds.getSouth());
  if ((x1 - x0 + 1) * (y1 - y0 + 1) > maxTiles) return null;
  const jobs = []; for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) jobs.push(tile(tpl, x, y));
  const feats = (await Promise.all(jobs)).flat().filter(f => keep(f.geometry.coordinates));
  return { type: 'FeatureCollection', features: quota(feats) };
}
// screen-density quota (same idea as the prebuilt Alberta set): walking zoom up in 0.25 steps, each empty world-aligned grid cell
// admits its most important eligible POI. Cells shrink with zoom, so the count grows smoothly and stays evenly spread.
const mx = l => (l + 180) / 360, my = la => (1 - Math.asinh(Math.tan(la * Math.PI / 180)) / Math.PI) / 2;
function quota(F) {
  const out = F.map(f => ({ ...f, properties: { ...f.properties } })); out.sort((a, b) => a.properties.rz - b.properties.rz);
  const done = new Set();
  for (let z = 12; z <= 16.25; z += 0.25) {
    const cpx = Math.max(46, 230 * 2 ** (-(z - 12) / 1.6)), W = 512 * 2 ** z, occ = new Set();
    const cell = f => Math.floor(mx(f.geometry.coordinates[0]) * W / cpx) + ',' + Math.floor(my(f.geometry.coordinates[1]) * W / cpx);
    for (const f of out) if (done.has(f)) occ.add(cell(f));
    for (const f of out) { if (done.has(f) || f.properties.rz > z + 1.25) continue; const c = cell(f); if (occ.has(c)) continue; occ.add(c); done.add(f); f.properties.rq = +z.toFixed(2); }
  }
  for (const f of out) { if (!done.has(f)) f.properties.rq = 16.5; f.properties.rz = f.properties.rq; delete f.properties.rq; }
  return out;
}
export const cached = () => [...cache.values()].flat();
