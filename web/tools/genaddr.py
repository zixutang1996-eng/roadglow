# Compact Edmonton-area address-point index from the OSM Alberta extract (ODbL). Output public/addr_yeg.json
# Format: {"b":[lon0,lat0], "s":[[street, city, postcode-prefix?, [hn, dlon, dlat, ...]], ...]} coords in 1e-5 deg offsets from b.
import osmium, json, sys, gzip, os
from collections import defaultdict
W, S, E, N = -113.85, 53.35, -113.15, 53.72
ST = defaultdict(list)
class H(osmium.SimpleHandler):
    def add(s, t, lon, lat):
        hn, st = t.get('addr:housenumber'), t.get('addr:street')
        if not hn or not st or not (W < lon < E and S < lat < N): return
        ST[(st, t.get('addr:city', ''))].append((hn, lon, lat, t.get('addr:postcode', '')))
    def node(s, n):
        if 'addr:housenumber' in n.tags and n.location.valid(): s.add(n.tags, n.location.lon, n.location.lat)
    def way(s, w):
        if 'addr:housenumber' not in w.tags: return
        try: xs = [(nd.lon, nd.lat) for nd in w.nodes if nd.location.valid()]
        except Exception: return
        if xs: s.add(w.tags, sum(x for x, _ in xs) / len(xs), sum(y for _, y in xs) / len(xs))
H().apply_file(sys.argv[1], locations=True, idx='flex_mem')
out = []; n = 0
for (st, city), pts in sorted(ST.items()):
    flat = []; seen = set()
    for hn, lon, lat, pc in pts:
        if hn in seen: continue
        seen.add(hn); flat += [hn, round((lon - W) * 1e5), round((lat - S) * 1e5)]; n += 1
    pcs = sorted({p[3][:3] for p in pts if p[3]})
    out.append([st, city, pcs[0] if pcs else '', flat])
js = json.dumps({'b': [W, S], 's': out}, ensure_ascii=False, separators=(',', ':'))
open('public/addr_yeg.json', 'w').write(js)
print('streets', len(out), 'points', n, 'raw MB', round(len(js) / 1e6, 2), 'gzip MB', round(len(gzip.compress(js.encode())) / 1e6, 2))
