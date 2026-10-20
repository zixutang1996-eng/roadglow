# v0.7b: ALL named Edmonton-area POIs with an importance score and a continuous reveal zoom (rz).
# Source: Geofabrik Alberta extract (ODbL, (c) OpenStreetMap contributors). Output: public/pois_yeg.geojson
import osmium, json, sys, math
from collections import defaultdict, Counter
W, S, E, N = -113.85, 53.35, -113.15, 53.72
AM = {'restaurant': 'restaurant', 'fast_food': 'fast_food', 'cafe': 'cafe', 'ice_cream': 'ice_cream', 'bar': 'bar', 'pub': 'pub', 'biergarten': 'bar', 'library': 'library',
      'fuel': 'fuel', 'hospital': 'hospital', 'clinic': 'doctors', 'doctors': 'doctors', 'dentist': 'dentist', 'pharmacy': 'pharmacy', 'school': 'school', 'college': 'college',
      'university': 'university', 'kindergarten': 'kindergarten', 'bank': 'bank', 'bus_station': 'bus', 'ferry_terminal': 'ferry_terminal', 'theatre': 'theatre', 'cinema': 'cinema',
      'arts_centre': 'theatre', 'townhall': 'attraction', 'post_office': 'generic', 'police': 'generic', 'fire_station': 'generic', 'community_centre': 'generic', 'place_of_worship': 'generic',
      'marketplace': 'shop', 'veterinary': 'generic', 'car_rental': 'car', 'parking': 'parking'}
TOUR = {'hotel': 'lodging', 'motel': 'lodging', 'hostel': 'lodging', 'guest_house': 'lodging', 'museum': 'museum', 'gallery': 'art_gallery', 'attraction': 'attraction', 'zoo': 'attraction',
        'theme_park': 'attraction', 'viewpoint': 'attraction', 'camp_site': 'campsite', 'artwork': 'attraction'}
W8 = {'hospital': 100, 'airport': 100, 'railway': 92, 'bus': 80, 'mall': 85, 'university': 82, 'attraction': 70, 'museum': 72, 'stadium': 75, 'supermarket': 62, 'college': 64,
      'department': 66, 'theatre': 55, 'cinema': 52, 'library': 54, 'park': 45, 'lodging': 48, 'school': 42, 'doctors': 40, 'pharmacy': 42, 'fuel': 36, 'bank': 34, 'restaurant': 32,
      'fast_food': 26, 'cafe': 30, 'bar': 28, 'pub': 28, 'ice_cream': 22, 'shop': 24, 'grocery': 30, 'dentist': 24, 'kindergarten': 18, 'generic': 20, 'parking': 10, 'car': 18,
      'art_gallery': 45, 'campsite': 30, 'ferry_terminal': 40, 'playground': 12, 'garden': 30}
DENY_K = {'barrier', 'power', 'man_made', 'emergency', 'entrance', 'highway', 'street_lamp'}
DENY_A = {'bench', 'waste_basket', 'bicycle_parking', 'vending_machine', 'parking_entrance', 'shelter', 'waste_disposal', 'recycling', 'drinking_water', 'post_box', 'telephone',
          'hunting_stand', 'grit_bin', 'loading_dock', 'motorcycle_parking', 'parking_space', 'charging_station', 'fire_hydrant', 'clock', 'bbq', 'water_point'}
UNNAMED_OK = {'toilets': 'generic', 'atm': 'atm', 'parking': 'parking'}   # shown only from z17
def denied(t):
    if t.get('access') in ('private', 'no', 'customers') and t.get('leisure') in ('swimming_pool', 'pitch', 'sports_centre', 'fitness_centre', None): return True
    if t.get('amenity') in DENY_A: return True
    if t.get('leisure') == 'swimming_pool' and t.get('access') not in (None, 'yes', 'public', 'permissive'): return True
    if t.get('leisure') in ('picnic_table', 'firepit', 'outdoor_seating', 'pitch', 'track'): return True
    return not any(k in t for k in ('amenity', 'shop', 'tourism', 'leisure', 'railway', 'aeroway', 'historic', 'public_transport', 'landuse', 'office', 'healthcare', 'craft', 'building', 'club')) or any(k in t and k not in ('highway',) for k in DENY_K if k != 'highway') and not t.get('amenity') and not t.get('shop')
def classify(t):
    if denied(t): return None
    a, sh, tour, le, rw = t.get('amenity'), t.get('shop'), t.get('tourism'), t.get('leisure'), t.get('railway')
    if t.get('aeroway') == 'aerodrome': return 'railway', 'airport' if (t.get('iata') or t.get('icao')) else 'attraction'
    if rw in ('station', 'halt') or t.get('station') in ('light_rail', 'subway') or (t.get('public_transport') == 'station' and (t.get('train') or t.get('light_rail'))): return 'railway', 'railway'
    if a == 'hospital': return 'hospital', 'hospital'
    if a in ('university',): return 'university', 'university'
    if a in AM:
        c = AM[a]; return c, {'bus': 'bus', 'college': 'college'}.get(c, c)
    if sh == 'mall' or (t.get('landuse') == 'retail' and t.get('wikidata')): return 'shop', 'mall'
    if sh == 'department_store': return 'shop', 'department'
    if sh in ('supermarket', 'wholesale'): return 'supermarket', 'supermarket'
    if sh in ('convenience', 'greengrocer', 'butcher', 'bakery', 'deli'): return ('cafe' if sh == 'bakery' else 'grocery'), 'grocery'
    if sh in ('clothes', 'shoes', 'furniture', 'florist', 'mobile_phone', 'jewelry', 'optician', 'alcohol', 'hardware', 'doityourself', 'books', 'gift', 'car', 'electronics', 'sports', 'variety_store', 'beauty', 'hairdresser', 'pet', 'toys', 'bicycle', 'cosmetics', 'second_hand', 'chemist') or sh:
        return {'clothes': 'clothing_store', 'shoes': 'shoe', 'alcohol': 'alcohol_shop', 'doityourself': 'hardware'}.get(sh, 'shop' if sh not in ('furniture', 'florist', 'mobile_phone', 'jewelry', 'optician', 'hardware', 'books', 'gift', 'car') else sh), 'shop'
    if tour in TOUR: c = TOUR[tour]; return c, c if c in W8 else 'attraction'
    if le == 'stadium': return 'attraction', 'stadium'
    if le in ('park', 'nature_reserve'): return 'park', 'park'
    if le in ('garden',): return 'garden', 'garden'
    if le in ('playground', 'dog_park'): return 'playground', 'playground'
    if le in ('sports_centre', 'ice_rink', 'swimming_pool', 'water_park', 'golf_course', 'fitness_centre'): return 'generic', 'generic'
    if t.get('historic') in ('monument', 'memorial', 'castle', 'building', 'heritage'): return 'monument', 'attraction'
    # v0.9 catch-all so street-level zooms are not empty: any other named shop/amenity/office/healthcare/craft/landmark building (low weight)
    if t.get('healthcare') in ('clinic', 'doctor', 'dentist', 'physiotherapist', 'optometrist', 'centre'): return 'doctors', 'generic'
    if sh and sh not in ('vacant', 'no', 'yes'): return 'shop', 'generic'
    if a and a not in ('parking_space', 'loading_dock', 'grit_bin', 'fountain', 'clock', 'hunting_stand', 'smoking_area'): return 'generic', 'generic'
    if t.get('office') or t.get('craft') or t.get('club'): return 'generic', 'generic'
    if t.get('building') and len(t) >= 4 and not t.get('addr:housenumber') or t.get('building') and (t.get('wikidata') or t.get('building:levels', '0').isdigit() and int(t.get('building:levels', '0')) >= 12): return 'generic', 'generic'
    return None
class H(osmium.SimpleHandler):
    def __init__(s): super().__init__(); s.out = []; s.unnamed = []
    def add(s, typ, oid, t, xs):
        if 'name' not in t: return
        c = classify(t)
        if not c: return
        lon = sum(x for x, _ in xs) / len(xs); lat = sum(y for _, y in xs) / len(xs)
        if not (W < lon < E and S < lat < N): return
        area = (max(x for x, _ in xs) - min(x for x, _ in xs)) * 66 * (max(y for _, y in xs) - min(y for _, y in xs)) * 111 if len(xs) > 2 else 0  # km^2 bbox
        sc = W8.get(c[1], 20) + (30 if t.get('wikidata') else 0) + (15 if t.get('wikipedia') else 0) + (8 if t.get('brand') else 0) + 5 * math.log1p(len(t)) \
             + min(25, 10 * math.log10(1 + area * 1000)) + (4 if t.get('website') else 0) + (3 if t.get('opening_hours') else 0)
        if c[1] == 'park' and area < 0.02: sc -= 20   # pocket parks
        p = {'name': t['name'], 'class': c[0], 'osm': typ + str(oid), 'sc': round(sc, 1)}
        for k in ('name:zh', 'name:en'):
            if k in t: p[k] = t[k]
        s.out.append({'type': 'Feature', 'properties': p, 'geometry': {'type': 'Point', 'coordinates': [round(lon, 6), round(lat, 6)]}})
    def node(s, n):
        if n.tags and 'name' not in n.tags and n.location.valid() and n.tags.get('amenity') in UNNAMED_OK and n.tags.get('access') not in ('private', 'no') and W < n.location.lon < E and S < n.location.lat < N:
            s.unnamed.append({'type': 'Feature', 'properties': {'name': '', 'class': UNNAMED_OK[n.tags['amenity']], 'osm': 'N' + str(n.id), 'sc': 0, 'rz': 17.0}, 'geometry': {'type': 'Point', 'coordinates': [round(n.location.lon, 6), round(n.location.lat, 6)]}}); return
        if n.tags and 'name' in n.tags and n.location.valid(): s.add('N', n.id, dict(n.tags), [(n.location.lon, n.location.lat)])
    def way(s, w):
        if 'name' not in w.tags: return
        t = dict(w.tags)
        if 'highway' in t or 'building' in t and len(t) < 4 or not classify(t): return
        try: xs = [(nd.lon, nd.lat) for nd in w.nodes if nd.location.valid()]
        except Exception: return
        if xs: s.add('W', w.id, t, xs)
    def area(s, a):
        if a.from_way() or 'name' not in a.tags: return
        t = dict(a.tags)
        if not classify(t): return
        xs = [(n.lon, n.lat) for r in a.outer_rings() for n in r if n.location.valid()]
        if xs: s.add('R', a.orig_id(), t, xs)
h = H(); h.apply_file(sys.argv[1], locations=True, idx='flex_mem')
# dedupe same name+class within ~100 m (keep highest score)
best = {}
for f in h.out:
    p = f['properties']; x, y = f['geometry']['coordinates']; k = (p['name'], p['class'], round(x / .0015), round(y / .001))
    if k not in best or best[k]['properties']['sc'] < p['sc']: best[k] = f
F = sorted(best.values(), key=lambda f: -f['properties']['sc'])
# reveal zoom: (1) global score quantile floor spread continuously over Z0..Z1, (2) density thinning: per ~CELLpx grid cell at zoom z
# only the top NCELL(z) by score may be visible; rz = max(floor, first z at which the feature makes its cell's cut).
# v0.9 reveal: screen-density quota. Target on-screen count N(z) = 25 * 6^((z - Z0) / (Z1 - Z0)) on a 390x844 viewport (geometric growth,
# ~7.4% per 0.25 zoom). Grid cell size c(z) = K * sqrt(A / N(z)); each cell may hold one revealed feature. Inside a cell the pick maximises
# score minus a penalty for categories already visible in the 3x3 neighbourhood, so variety (hospital, transit, mall, food, park, school,
# hotel, fuel...) is present from the first zoom. A mild score floor keeps trivial places from appearing at city scale.
Z0, Z1, STEP, K, A = 10.75, 17.0, 0.05, 0.62, 390 * 844
GRP = {'restaurant': 'food', 'fast_food': 'food', 'cafe': 'cafe', 'ice_cream': 'cafe', 'bar': 'food', 'pub': 'food', 'supermarket': 'grocery', 'grocery': 'grocery',
       'hospital': 'health', 'doctors': 'health', 'dentist': 'health', 'pharmacy': 'health', 'railway': 'transit', 'bus': 'transit', 'school': 'edu', 'college': 'edu',
       'university': 'edu', 'kindergarten': 'edu', 'library': 'edu', 'park': 'park', 'garden': 'park', 'playground': 'park', 'lodging': 'lodge', 'fuel': 'fuel',
       'museum': 'culture', 'attraction': 'culture', 'theatre': 'culture', 'cinema': 'culture', 'art_gallery': 'culture', 'monument': 'culture', 'bank': 'service', 'parking': 'parking'}
n = len(F)
for i, f in enumerate(F): f['properties']['_fl'] = Z0 - 0.3 + 2.6 * (i / n) ** 1.6
G = [GRP.get(f['properties']['class'], 'shop' if f['properties']['class'] in ('shop', 'clothing_store', 'shoe', 'furniture', 'florist', 'mobile_phone', 'jewelry', 'optician', 'alcohol_shop', 'hardware', 'books', 'gift', 'car') else 'other') for f in F]
def mercx(lon, z): return (lon + 180) / 360 * 256 * 2 ** z
def mercy(lat, z): r = math.radians(lat); return (1 - math.log(math.tan(r) + 1 / math.cos(r)) / math.pi) / 2 * 256 * 2 ** z
rz = {}; z = Z0 - 0.3
while z <= Z1 + 1e-9:
    Nz = 25 * 6 ** ((z - Z0) / (Z1 - Z0)); cpx = (K - 0.2 * max(0, z - 13) / 4) * math.sqrt(A / Nz)
    occ = defaultdict(list); cand = defaultdict(list)
    for i, f in enumerate(F):
        x, y = f['geometry']['coordinates']; cell = (int(mercx(x, z) // cpx), int(mercy(y, z) // cpx))
        if i in rz: occ[cell].append(G[i])
        elif f['properties']['_fl'] <= z: cand[cell].append(i)
    for cell, lst in cand.items():
        if occ.get(cell): continue
        cx, cy = cell; seen = Counter(g for dx in (-1, 0, 1) for dy in (-1, 0, 1) for g in occ.get((cx + dx, cy + dy), ()))
        best = max(lst[:40], key=lambda i: F[i]['properties']['sc'] - 28 * seen[G[i]])
        rz[best] = round(max(z, Z0), 2); occ[cell].append(G[best])
    z += STEP
for i, f in enumerate(F):
    p = f['properties']; p['rz'] = rz.get(i, 16.75 if p['name'] else 17.0); del p['_fl']
out = [f for f in F if f['properties']['rz'] <= 17.5] + h.unnamed
json.dump({'type': 'FeatureCollection', 'features': out}, open('public/pois_yeg.geojson', 'w'), ensure_ascii=False, separators=(',', ':'))
hist = Counter(min(17.5, math.floor(f['properties']['rz'] * 4) / 4) for f in out)
print(len(out), sorted(hist.items()))
