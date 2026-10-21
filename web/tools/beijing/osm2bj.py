# Builds the Beijing edition offline data from a Geofabrik extract (beijing-latest.osm.pbf):
#   pois_bj.geojson (search index), bj_imp.geojson (important labels), bj_rev.json (reverse geocoding),
#   bj_walk.json (pedestrian graph, central Beijing). Usage: python3 osm2bj.py beijing.osm.pbf outdir
import sys, json, math, osmium, re
from collections import defaultdict
from pypinyin import lazy_pinyin
from shapely import wkb as swkb
from shapely.geometry import Point
from shapely.strtree import STRtree
SRC, OUT = sys.argv[1], sys.argv[2]
WB = (116.25, 39.80, 116.66, 40.10)  # walking graph bbox: Chaoyang + Dongcheng/Xicheng
FOOT = {'footway','path','pedestrian','residential','living_street','service','tertiary','tertiary_link','secondary','secondary_link','primary','primary_link','unclassified','steps','track','cycleway','road'}
CJK = re.compile(r'[\u3400-\u9fff]')
def cls_of(t):
    a, s, l, r, pt, tr, hc = t.get('amenity'), t.get('shop'), t.get('leisure'), t.get('railway'), t.get('public_transport'), t.get('tourism'), t.get('healthcare')
    if r in ('station', 'halt') or (pt == 'station' and (t.get('subway') == 'yes' or t.get('train') == 'yes' or t.get('station') in ('subway', 'train', 'light_rail'))): return 'railway', 30
    if r == 'subway_entrance': return None, 0
    if a == 'hospital' or hc == 'hospital': return 'hospital', 25
    if a in ('bank', 'atm'): return a, 8 if a == 'bank' else 2
    if s in ('supermarket', 'convenience', 'greengrocer', 'department_store', 'mall'): return ('supermarket' if s in ('supermarket', 'greengrocer') else s), 10 if s in ('supermarket', 'mall', 'department_store') else 4
    if l in ('park', 'garden', 'nature_reserve'): return 'park', 22
    if pt == 'station' or a == 'bus_station': return 'bus', 6
    if a: return a, {'university': 25, 'college': 15, 'school': 8, 'clinic': 8, 'pharmacy': 6, 'post_office': 6, 'police': 6, 'restaurant': 3, 'cafe': 3, 'fast_food': 3, 'toilets': 2, 'parking': 1}.get(a, 3)
    if s: return s, 3
    if tr: return ('lodging' if tr in ('hotel', 'hostel', 'guest_house', 'motel') else tr), 12 if tr in ('attraction', 'museum', 'viewpoint') else 6
    if l: return l, 4
    if t.get('historic'): return 'historic', 12
    if t.get('place'): return 'place', 15
    if t.get('landuse') == 'residential' or t.get('building') in ('apartments', 'residential'): return 'residential', 5
    if t.get('building'): return t.get('building'), 3
    if t.get('office'): return 'office', 2
    if t.get('natural'): return t.get('natural'), 8
    return None, 0
FIX = {'朝阳': ['chao', 'yang'], '长安': ['chang', 'an'], '大栅栏': ['da', 'shi', 'lan'], '什刹海': ['shi', 'cha', 'hai']}
def py(s):
    p = lazy_pinyin(s)
    for w, r in FIX.items():
        i = s.find(w)
        if i >= 0 and len(p) == len(s): p[i:i + len(w)] = r
    return ' '.join(p), ''.join(p), ''.join(x[0] for x in p if x)
pois, streets, districts, wnodes, wways = [], [], [], {}, []
class H(osmium.SimpleHandler):
    def poi(self, o, ll, kind):
        t = {k.k: k.v for k in o.tags}; n = t.get('name:zh-Hans') or t.get('name:zh') or t.get('name')
        if not n or ll is None: return
        c, sc = cls_of(t)
        if not c: return
        en = t.get('name:en') or (t.get('name') if not CJK.search(t.get('name', '')) else None)
        f = {'name': n, 'class': c, 'osm': kind + str(o.id), 'sc': sc}
        if en and en != n: f['en'] = en
        if CJK.search(n): f['py'] = ' '.join(py(n))
        st = ' '.join(x for x in (t.get('addr:street'), t.get('addr:housenumber')) if x)
        if st: f['street'] = st
        for k in ('opening_hours', 'phone', 'website', 'cuisine', 'brand'):
            if t.get(k): f[k] = t[k]
        pois.append((f, ll))
    def node(self, n):
        if len(n.tags) and n.location.valid(): self.poi(n, (round(n.location.lon, 6), round(n.location.lat, 6)), 'N')
    def way(self, w):
        t = w.tags; hw = t.get('highway')
        try: pts = [(nd.lon, nd.lat) for nd in w.nodes]
        except Exception: return
        if not pts: return
        if hw and t.get('name'):
            for p in pts[::3] + [pts[-1]]: streets.append((t.get('name'), round(p[0], 5), round(p[1], 5)))
        if hw in FOOT and t.get('foot') not in ('no', 'private') and t.get('access') not in ('no', 'private') and t.get('area') != 'yes':
            if any(WB[0] <= x <= WB[2] and WB[1] <= y <= WB[3] for x, y in pts):
                ids = [nd.ref for nd in w.nodes]
                for r, p in zip(ids, pts): wnodes[r] = p
                wways.append((ids, t.get('name') or '', hw))
        if 'name' in t:
            xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
            self.poi(w, (round(sum(xs) / len(xs), 6), round(sum(ys) / len(ys), 6)), 'W')
    def area(self, a):
        t = a.tags
        if t.get('boundary') == 'administrative' and t.get('admin_level') in ('6',) and t.get('name'):
            try: districts.append((t.get('name'), swkb.loads(osmium.geom.WKBFactory().create_multipolygon(a), hex=True)))
            except Exception: pass
h = H(); h.apply_file(SRC, locations=True)
print('pois', len(pois), 'streets', len(streets), 'districts', [d[0] for d in districts], 'walk ways', len(wways))
tree = STRtree([d[1] for d in districts])
def dist_of(ll):
    for i in tree.query(Point(ll)):
        if districts[i][1].contains(Point(ll)): return districts[i][0]
    return ''
# de-duplicate (same name within ~150 m)
seen, feats = {}, []
for f, ll in sorted(pois, key=lambda x: -x[0]['sc']):
    k = (f['name'], round(ll[0] * 300), round(ll[1] * 300))
    if k in seen: continue
    seen[k] = 1; d = dist_of(ll)
    if d: f['district'] = d
    feats.append({'type': 'Feature', 'properties': f, 'geometry': {'type': 'Point', 'coordinates': list(ll)}})
json.dump({'type': 'FeatureCollection', 'features': feats}, open(f'{OUT}/pois_bj.geojson', 'w'), ensure_ascii=False, separators=(',', ':'))
imp = [dict(x, properties={**x['properties'], 'rz': 9.5 if x['properties']['sc'] >= 25 else 11.5}) for x in feats if x['properties']['sc'] >= 22]
json.dump({'type': 'FeatureCollection', 'features': imp}, open(f'{OUT}/bj_imp.geojson', 'w'), ensure_ascii=False, separators=(',', ':'))
# reverse geocoding: street samples on a 0.005° grid + district polygons (simplified)
grid = defaultdict(list)
for n, x, y in streets: grid[f'{int(x / 0.005)}_{int(y / 0.005)}'].append([n, x, y])
def thin(v):
    by = defaultdict(list)
    for n, x, y in v: by[n].append([x, y])
    return [[n] + [c for p in pts[::max(1, len(pts) // 3)][:3] for c in p] for n, pts in by.items()]
grid = {k: thin(v) for k, v in grid.items()}
dpoly = [[n, [[[round(c[0], 4), round(c[1], 4)] for c in p.exterior.simplify(0.0008).coords] for p in (g.geoms if hasattr(g, 'geoms') else [g])]] for n, g in districts]
json.dump({'cell': 0.005, 'streets': grid, 'districts': dpoly}, open(f'{OUT}/bj_rev.json', 'w'), ensure_ascii=False, separators=(',', ':'))
# pedestrian graph: keep junction + end nodes, edges carry their full geometry
use = defaultdict(int)
for ids, _, _ in wways:
    for i, r in enumerate(ids): use[r] += 2 if i in (0, len(ids) - 1) else 1
idx, N, E, names = {}, [], [], {}
def nid(r):
    if r not in idx: idx[r] = len(N); N.append(wnodes[r])
    return idx[r]
def hav(a, b):
    dx = (b[0] - a[0]) * math.cos(math.radians(a[1])) * 111320; dy = (b[1] - a[1]) * 110540; return math.hypot(dx, dy)
for ids, name, hw in wways:
    ni = names.setdefault(name, len(names)); start = 0
    for i in range(1, len(ids)):
        if use[ids[i]] >= 2 or i == len(ids) - 1:
            seg = ids[start:i + 1]; geo = [wnodes[r] for r in seg]
            L = sum(hav(geo[j], geo[j + 1]) for j in range(len(geo) - 1))
            if L > 0: E.append([nid(seg[0]), nid(seg[-1]), round(L * (1.15 if hw == 'steps' else 1), 1), ni, [[round((p[0] - geo[0][0]) * 1e6), round((p[1] - geo[0][1]) * 1e6)] for p in geo[1:-1]]])
            start = i
json.dump({'nodes': [[round(p[0], 6), round(p[1], 6)] for p in N], 'edges': E, 'names': list(names)}, open(f'{OUT}/bj_walk.json', 'w'), ensure_ascii=False, separators=(',', ':'))
print('features', len(feats), 'imp', len(imp), 'graph nodes', len(N), 'edges', len(E))
