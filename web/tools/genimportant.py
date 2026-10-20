# Build public/important_yeg.geojson: important POIs (Edmonton region) from the Geofabrik Alberta extract (ODbL, (c) OSM contributors).
# Used to show important places at z11.5-14, where the vector tiles carry few POIs.
import osmium, json, sys
W, S, E, N = -114.25, 53.25, -112.85, 53.85
BIGBRANDS = ('Real Canadian Superstore', 'Walmart', 'Costco', 'Save-On-Foods', 'Safeway', 'Sobeys', 'No Frills', 'T&T Supermarket', 'IKEA', 'Home Depot', 'The Home Depot', 'Canadian Tire', 'Best Buy', 'Rona', 'Lowe\'s', 'Superstore', 'Hudson\'s Bay', 'Winners', 'London Drugs', 'Co-op')
SIZE = [0]
def classify(t):
    """-> (class, tier). Tier 0 shows from the 2 km scale (z11.3), 1 from ~z11.9, 2 from ~z12.5, 3 from ~z13.2."""
    a, sh, tour, rw, pt = t.get('amenity'), t.get('shop'), t.get('tourism'), t.get('railway'), t.get('public_transport')
    wd = bool(t.get('wikidata')); brand = t.get('brand') or t.get('name', '')
    if t.get('aeroway') == 'aerodrome' and (t.get('iata') or t.get('icao')): return 'railway', 0
    if a == 'hospital': return 'hospital', 0
    if rw in ('station', 'halt') or t.get('station') in ('light_rail', 'subway') or (pt == 'station' and t.get('train') == 'yes'): return 'railway', 0
    if pt == 'station' and t.get('light_rail') == 'yes': return 'railway', 0
    if a == 'bus_station' or (pt == 'station' and t.get('bus') == 'yes'): return 'bus', 0 if wd else 1
    if t.get('landuse') == 'retail' and (wd or SIZE[0] > 0.25): return 'shop', 0 if wd else 1   # e.g. West Edmonton Mall is mapped as landuse=retail
    if sh == 'mall': return 'shop', 0 if (wd or SIZE[0] > 0.06) else 1
    if tour in ('museum', 'attraction', 'zoo', 'theme_park') or t.get('historic') in ('monument', 'castle') or a in ('townhall', 'theatre', 'arts_centre') or t.get('leisure') == 'stadium':
        return ('museum' if tour == 'museum' else 'attraction'), 0 if wd else 1
    if a in ('university', 'college'): return 'college', 1 if wd else 2
    if sh == 'department_store': return 'shop', 1
    if sh in ('supermarket', 'wholesale') : return 'supermarket', 1 if any(brand.startswith(x) for x in BIGBRANDS[:9]) else 2
    if sh in ('doityourself', 'hardware', 'electronics', 'furniture', 'variety_store', 'sports') and any(brand.startswith(x) for x in BIGBRANDS): return 'shop', 2
    if a == 'clinic': return 'hospital', 2
    if a in ('restaurant', 'fast_food', 'cafe') and (wd or t.get('michelin') or (t.get('website') and t.get('opening_hours') and t.get('cuisine'))): return ('cafe' if a == 'cafe' else 'restaurant'), 3
    if a == 'school': return 'school', 3
    if a == 'library': return 'library', 3
    if sh in ('convenience', 'greengrocer') and t.get('brand'): return 'supermarket', 3
    return None
class H(osmium.SimpleHandler):
    def __init__(s): super().__init__(); s.out = []
    def add(s, typ, oid, t, lon, lat):
        if not (W < lon < E and S < lat < N) or 'name' not in t: return
        c = classify(t)
        if not c: return
        p = {'name': t['name'], 'class': c[0], 'tier': c[1], 'osm': typ + str(oid), 'rank': round(c[1] * 100 - min(60, s._size * 4000) - (20 if t.get('wikidata') else 0), 1)}
        for k in ('name:zh', 'name:en'):
            if k in t: p[k] = t[k]
        s.out.append({'type': 'Feature', 'properties': p, 'geometry': {'type': 'Point', 'coordinates': [round(lon, 6), round(lat, 6)]}})
    _size = 0
    def node(s, n):
        s._size = 0; SIZE[0] = 0
        if n.tags and n.location.valid(): s.add('N', n.id, dict(n.tags), n.location.lon, n.location.lat)
    def way(s, w):
        t = dict(w.tags)
        if 'name' not in t: return
        try:
            xs = [(nd.lon, nd.lat) for nd in w.nodes if nd.location.valid()]
        except Exception: return
        s._size = 0
        if xs: SIZE[0] = (max(x for x, _ in xs) - min(x for x, _ in xs)) * 66 * (max(y for _, y in xs) - min(y for _, y in xs)) * 111
        if xs: s._size = (max(x for x, _ in xs) - min(x for x, _ in xs)) * (max(y for _, y in xs) - min(y for _, y in xs)) ** .5
        if xs: s.add('W', w.id, t, sum(x for x, _ in xs) / len(xs), sum(y for _, y in xs) / len(xs))
    def area(s, a):
        if a.from_way(): return
        t = dict(a.tags)
        if 'name' not in t: return
        xs = [(n.lon, n.lat) for r in a.outer_rings() for n in r if n.location.valid()]
        if not xs: return
        SIZE[0] = (max(x for x, _ in xs) - min(x for x, _ in xs)) * 66 * (max(y for _, y in xs) - min(y for _, y in xs)) * 111
        s._size = SIZE[0] / 500
        s.add('R', a.orig_id(), t, sum(x for x, _ in xs) / len(xs), sum(y for _, y in xs) / len(xs))
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
