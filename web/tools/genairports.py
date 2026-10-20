# Alberta airports (aeroway=aerodrome) from the Geofabrik Alberta extract (ODbL) -> appended to public/pois_yeg.geojson
import osmium, json
class H(osmium.SimpleHandler):
    def __init__(s): super().__init__(); s.o = {}
    def add(s, key, t, lon, lat):
        if t.get('aeroway') != 'aerodrome' or 'name' not in t: return
        if __import__('re').search(r'hospital|residence|heli', t['name'], 2) or t.get('aerodrome') == 'private' or t.get('access') == 'private' or 'heliport' in t.get('name','').lower(): return
        iata, icao = t.get('iata'), t.get('icao')
        rz = 9.75 if iata else (10.75 if icao else 12.5)
        sc = 199 if iata else (175 if icao else 120)
        s.o[key] = {'type': 'Feature', 'properties': {'name': t.get('name:en', t['name']), 'class': 'aerodrome', 'osm': key, 'sc': sc, 'rz': rz, **({'iata': iata} if iata else {}), **({'icao': icao} if icao else {})},
                    'geometry': {'type': 'Point', 'coordinates': [round(lon, 6), round(lat, 6)]}}
    def node(s, n): s.add('N%d' % n.id, n.tags, n.location.lon, n.location.lat)
    def area(s, a):
        try:
            pts = [(n.lon, n.lat) for r in a.outer_rings() for n in r]
        except Exception: return
        if pts: s.add(('W%d' if a.from_way() else 'R%d') % a.orig_id(), a.tags, sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts))
h = H(); h.apply_file('/workspace/osm/alberta.osm.pbf', locations=True)
p = 'public/pois_yeg.geojson'; d = json.load(open(p))
d['features'] = [f for f in d['features'] if f['properties'].get('class') != 'aerodrome'] + list(h.o.values())
json.dump(d, open(p, 'w'), ensure_ascii=False, separators=(',', ':'))
print(len(h.o), [f['properties']['name'] for f in h.o.values() if f['properties'].get('iata')])
