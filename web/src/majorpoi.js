// v0.9.2c major landmarks for the 5 km -> 1 km range (z9.75-12) outside the prebuilt Edmonton set.
// OpenFreeMap tiles carry no POIs below z14 (rail stations from z12), so a few Photon (komoot, free fair use) queries with an
// osm_tag filter are made per 0.6-degree grid cell, at most once per cell per session, max 3 in flight. Results get a reveal zoom from a
// screen-density quota so they fade in evenly.
const Q = [['hospital', 'amenity:hospital', 'hospital', 'hospital', 0], ['university', 'amenity:university', 'college', 'university', 0], ['station', 'railway:station', 'railway', 'station', 1],
  ['mall', 'shop:mall', 'shop', 'mall', 1], ['centre', 'shop:mall', 'shop', 'mall', 2]];
const CELL = 0.6, cells = new Map(); let inflight = 0; const queue = [];
const run = () => { while (inflight < 3 && queue.length) { const j = queue.shift(); inflight++; j().finally(() => { inflight--; run(); }); } };
const lim = f => new Promise(r => { queue.push(() => f().then(r, () => r([]))); run(); });
async function q1(word, tag, x0, y0) {
  const u = new URL('https://photon.komoot.io/api/'); u.search = new URLSearchParams({ q: word, limit: 15, osm_tag: tag, bbox: [x0, y0, x0 + CELL, y0 + CELL].join(','), lat: y0 + CELL / 2, lon: x0 + CELL / 2 });
  const r = await fetch(u, { signal: AbortSignal.timeout(8000) }); if (!r.ok) return []; return (await r.json()).features;
}
function cell(x0, y0) {
  const k = x0 + ',' + y0; if (cells.has(k)) return cells.get(k);
  const p = Promise.all(Q.map(([w, tag, cls, sub, pri]) => lim(() => q1(w, tag, x0, y0)).then(fs => fs.map(f => ({ f, cls, sub, pri })))))
    .then(r => r.flat().filter(({ f }) => f.properties.name && !/parking|entrance|emergency entrance/i.test(f.properties.name)).map(({ f, cls, sub, pri }) => ({ type: 'Feature', id: f.properties.osm_id,
      properties: { name: f.properties.name, class: cls, subclass: sub, pri: pri - (/international|general|universit|regional/i.test(f.properties.name) ? 0.5 : 0), osm: (f.properties.osm_type || 'N') + f.properties.osm_id }, geometry: f.geometry })))
    .catch(() => { cells.delete(k); return []; });
  cells.set(k, p); return p;
}
const mx = l => (l + 180) / 360, my = la => (1 - Math.asinh(Math.tan(la * Math.PI / 180)) / Math.PI) / 2;
export async function majorFor(B, keep) {
  const ks = []; for (let x = Math.floor(B.getWest() / CELL) * CELL; x < B.getEast(); x += CELL) for (let y = Math.floor(B.getSouth() / CELL) * CELL; y < B.getNorth(); y += CELL) ks.push([+x.toFixed(2), +y.toFixed(2)]);
  if (ks.length > 9) return null;
  const seen = new Set(), F = (await Promise.all(ks.map(([x, y]) => cell(x, y)))).flat().filter(f => { const k = f.properties.name + Math.round(f.geometry.coordinates[0] * 200) + Math.round(f.geometry.coordinates[1] * 200); if (seen.has(k) || !keep(f.geometry.coordinates)) return false; seen.add(k); return true; });
  F.sort((a, b) => a.properties.pri - b.properties.pri); const done = new Map();
  for (let z = 9.75; z <= 11.75; z += 0.25) { const cpx = 230 * 2 ** (-(z - 9.75) / 1.4), W = 512 * 2 ** z, occ = new Set(), c = f => Math.floor(mx(f.geometry.coordinates[0]) * W / cpx) + ',' + Math.floor(my(f.geometry.coordinates[1]) * W / cpx);
    for (const f of F) if (done.has(f)) occ.add(c(f));
    for (const f of F) { if (done.has(f)) continue; const k = c(f); if (occ.has(k)) continue; occ.add(k); done.set(f, +z.toFixed(2)); } }
  return { type: 'FeatureCollection', features: F.filter(f => done.has(f)).map(f => ({ ...f, properties: { ...f.properties, rz: done.get(f) } })) };
}
