# City of Lethbridge parcel addresses -> sharded compact index (public/addr/yql/), same format as gencoeaddr.py.
# Source: gis.lethbridge.ca OpenData/odl_parcels (Address field, parcel centroid). Licence: Open Government Licence – City of Lethbridge.
# Fetch first with /workspace/osm/leth/dl.py (paged ArcGIS query, ~44k parcels).
import json, gzip, os, re
from collections import defaultdict
W, S = -113.0, 49.6
TYP = {'ST': 'St', 'AVE': 'Ave', 'RD': 'Rd', 'DR': 'Dr', 'BLVD': 'Blvd', 'CRES': 'Cres', 'CL': 'Close', 'CRT': 'Crt', 'CT': 'Crt', 'PL': 'Pl', 'WAY': 'Way', 'TR': 'Trail', 'TRL': 'Trail',
       'LANE': 'Lane', 'LN': 'Lane', 'LINK': 'Link', 'GATE': 'Gate', 'HTS': 'Hts', 'SQ': 'Sq', 'TERR': 'Terr', 'PT': 'Pt', 'BAY': 'Bay', 'LOOP': 'Loop', 'GRN': 'Green', 'CIR': 'Cir', 'PARK': 'Park', 'MANOR': 'Manor', 'GR': 'Grove', 'VIEW': 'View', 'LANDING': 'Landing', 'RISE': 'Rise', 'COMMON': 'Common', 'CMN': 'Common', 'HILL': 'Hill', 'HWY': 'Hwy', 'MEWS': 'Mews', 'RIDGE': 'Ridge', 'GDNS': 'Gdns', 'CRCL': 'Cir'}
def pretty(st):
    w = st.split(); out = []
    for i, x in enumerate(w):
        if x in ('N', 'S', 'E', 'W', 'NW', 'SW', 'NE', 'SE') and i == len(w) - 1: out.append(x)
        elif x in TYP and i > 0: out.append(TYP[x])
        elif x.isdigit() or re.match(r'^\d+[A-Z]$', x): out.append(x)
        else: out.append(x.capitalize())
    return ' '.join(out)
def shard(st):
    m = re.match(r'^(\d+)', st)
    return 'n%d' % (int(m.group(1)) // 10) if m else re.sub('[^a-z]', '', st.lower())[:2] or 'zz'
src = json.load(open('/workspace/osm/leth/addr.json')); ST = defaultdict(dict); G = defaultdict(list)
for a, (lon, lat) in src.items():
    m = re.match(r'^(?:[A-Z0-9]+-)?(\d+[A-Z]?)\s+(.+)$', a.strip())
    if not m: continue
    ST[pretty(m.group(2))].setdefault(m.group(1), (round((lon - W) * 1e5), round((lat - S) * 1e5)))
D = 'public/addr/yql'; os.makedirs(D, exist_ok=True)
for f in os.listdir(D): os.remove(D + '/' + f)
SH = defaultdict(dict); idx = {}; n = 0; raw = 0
def wr(name, obj):
    global raw; js = json.dumps(obj, separators=(',', ':')); open(D + '/' + name, 'w').write(js); raw += len(js)
for st, d in ST.items():
    k = shard(st); idx[st] = k; flat = []
    for hn, (x, y) in sorted(d.items(), key=lambda t: (len(t[0]), t[0])): flat += [hn, x, y]; n += 1; G['%d_%d' % (x // 2000, y // 1200)].append((hn, st, x, y))
    SH[k][st] = flat
for k, v in SH.items(): wr('s_%s.json' % k, v)
for k, v in G.items():
    sts = sorted({s for _, s, _, _ in v}); si = {s: i for i, s in enumerate(sts)}
    wr('g_%s.json' % k, {'s': sts, 'p': [a for hn, s, x, y in v for a in (hn, si[s], x, y)]})
wr('index.json', {'b': [W, S], 'g': [2000, 1200], 'src': 'City of Lethbridge Open Data — Parcels (OGL-Lethbridge)', 'fetched': open('/workspace/osm/leth/fetched.txt').read().strip(), 'streets': idx})
print('streets', len(ST), 'points', n, 'files', len(os.listdir(D)), 'raw MB', round(raw / 1e6, 2))
