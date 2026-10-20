# Build public/important_yeg.geojson: important POIs (Edmonton region) from the Geofabrik Alberta extract (ODbL, (c) OSM contributors).
# Used to show important places at z11.5-14, where the vector tiles carry few POIs.
import osmium, json, sys
W, S, E, N = -114.25, 53.25, -112.85, 53.85
def classify(t):
    a, sh, tour, rw = t.get('amenity'), t.get('shop'), t.get('tourism'), t.get('railway')
    if a == 'hospital': return 'hospital', 0
    if t.get('public_transport') == 'station' or rw in ('station', 'halt') or t.get('station') == 'light_rail': return 'railway', 1
    if a == 'bus_station': return 'bus', 1
    if tour in ('museum', 'attraction', 'zoo', 'theme_park') or t.get('historic') in ('monument', 'castle') or a in ('townhall', 'theatre', 'arts_centre') or t.get('leisure') == 'stadium':
        return ('museum' if tour == 'museum' else 'attraction'), 1
    if a == 'clinic': return 'hospital', 2
    if sh == 'mall' or (sh == 'department_store' and t.get('wikidata')): return 'shop', 2
    if a in ('university', 'college'): return 'college', 2
    if a in ('restaurant', 'fast_food', 'cafe') and (t.get('wikidata') or t.get('michelin') or (t.get('website') and t.get('opening_hours') and t.get('cuisine'))): return ('cafe' if a == 'cafe' else 'restaurant'), 3
    if a == 'school': return 'school', 3
    if a == 'library': return 'library', 3
    return None
class H(osmium.SimpleHandler):
    def __init__(s): super().__init__(); s.out = []
    def add(s, typ, oid, t, lon, lat):
        if not (W < lon < E and S < lat < N) or 'name' not in t: return
        c = classify(t)
        if not c: return
        p = {'name': t['name'], 'class': c[0], 'tier': c[1], 'osm': typ + str(oid)}
        for k in ('name:zh', 'name:en'):
            if k in t: p[k] = t[k]
        s.out.append({'type': 'Feature', 'properties': p, 'geometry': {'type': 'Point', 'coordinates': [round(lon, 6), round(lat, 6)]}})
    def node(s, n):
        if n.tags and n.location.valid(): s.add('N', n.id, dict(n.tags), n.location.lon, n.location.lat)
    def way(s, w):
        t = dict(w.tags)
        if 'name' not in t or not classify(t): return
        try:
            xs = [(nd.lon, nd.lat) for nd in w.nodes if nd.location.valid()]
        except Exception: return
        if xs: s.add('W', w.id, t, sum(x for x, _ in xs) / len(xs), sum(y for _, y in xs) / len(xs))
h = H(); h.apply_file(sys.argv[1], locations=True, idx='flex_mem')
# dedupe same name+class within ~150 m (e.g. station node + platform way)
seen, out = {}, []
for f in sorted(h.out, key=lambda f: f['properties']['tier']):
    k = (f['properties']['name'], f['properties']['class'], round(f['geometry']['coordinates'][0], 3), round(f['geometry']['coordinates'][1], 3))
    if k in seen: continue
    seen[k] = 1; out.append(f)
json.dump({'type': 'FeatureCollection', 'features': out}, open('public/important_yeg.geojson', 'w'), ensure_ascii=False, separators=(',', ':'))
from collections import Counter
print(len(out), Counter((f['properties']['class'], f['properties']['tier']) for f in out).most_common())
