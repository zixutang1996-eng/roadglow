# City of Edmonton parcel address points -> sharded compact index (public/addr/).
# Source: data.edmonton.ca "Parcel Addresses" (ut27-nrpn), object_type=PARCEL. Licence: Open Government Licence - Edmonton (attribution required).
import csv, json, gzip, os, re, math
from collections import defaultdict
W, S = -113.75, 53.38
TYP = {'STREET': 'St', 'AVENUE': 'Ave', 'ROAD': 'Rd', 'DRIVE': 'Dr', 'BOULEVARD': 'Blvd', 'CRESCENT': 'Cres', 'CLOSE': 'Close', 'COURT': 'Crt', 'PLACE': 'Pl', 'WAY': 'Way',
       'TRAIL': 'Trail', 'LANE': 'Lane', 'LINK': 'Link', 'GATE': 'Gate', 'HEIGHTS': 'Hts', 'SQUARE': 'Sq', 'TERRACE': 'Terr', 'POINT': 'Pt', 'BAY': 'Bay', 'LOOP': 'Loop',
       'GREEN': 'Green', 'WYND': 'Wynd', 'BEND': 'Bend', 'COMMON': 'Common', 'CIRCLE': 'Cir', 'PARK': 'Park', 'MANOR': 'Manor', 'GROVE': 'Grove', 'VIEW': 'View', 'LANDING': 'Landing'}
def pretty(st):
    w = st.split(); out = []
    for i, x in enumerate(w):
        if x in ('NW', 'SW', 'NE', 'SE'): out.append(x)
        elif x in TYP and i > 0: out.append(TYP[x])
        elif x.isdigit(): out.append(x)
        else: out.append(x.capitalize() if not re.match(r'^\d+[A-Z]$', x) else x)
    return ' '.join(out)
def shard(st):
    m = re.match(r'^(\d+)', st)
    return 'n%d' % (int(m.group(1)) // 10) if m else re.sub('[^a-z]', '', st.lower())[:2] or 'zz'
ST = defaultdict(dict); G = defaultdict(list)
for r in csv.DictReader(open('/workspace/osm/coe/addr.csv')):
    try: lat, lon = float(r['latitude']), float(r['longitude'])
    except ValueError: continue
    st = pretty(r['street_name'].strip()); hn = r['house_number'].strip()
    if not st or not hn: continue
    ST[st].setdefault(hn, (round((lon - W) * 1e5), round((lat - S) * 1e5)))
os.makedirs('public/addr', exist_ok=True)
for f in os.listdir('public/addr'): os.remove('public/addr/' + f)
SH = defaultdict(dict); idx = {}; npts = 0
for st, d in ST.items():
    k = shard(st); idx[st] = k; flat = []
    for hn, (x, y) in sorted(d.items(), key=lambda t: (len(t[0]), t[0])):
        flat += [hn, x, y]; npts += 1
        G['%d_%d' % (x // 2000, y // 1200)].append((hn, st, x, y))
    SH[k][st] = flat
raw = gz = 0
def wr(name, obj):
    global raw, gz
    js = json.dumps(obj, ensure_ascii=False, separators=(',', ':')); open('public/addr/' + name, 'w').write(js); raw += len(js); gz += len(gzip.compress(js.encode()))
for k, v in SH.items(): wr('s_%s.json' % k, v)
# reverse-geocode grid (0.02 deg lon x 0.012 deg lat cells): street list + [hn, streetIdx, x, y]
for k, v in G.items():
    sts = sorted({s for _, s, _, _ in v}); si = {s: i for i, s in enumerate(sts)}
    wr('g_%s.json' % k, {'s': sts, 'p': [a for hn, s, x, y in v for a in (hn, si[s], x, y)]})
wr('index.json', {'b': [W, S], 'g': [2000, 1200], 'src': 'City of Edmonton Open Data — Parcel Addresses (OGL-Edmonton)', 'fetched': open('/workspace/osm/coe/fetched.txt').read().strip(), 'streets': idx})
print('streets', len(ST), 'points', npts, 'files', len(os.listdir('public/addr')), 'raw MB', round(raw / 1e6, 2), 'gzip MB', round(gz / 1e6, 2),
      'index gz KB', round(len(gzip.compress(open('public/addr/index.json', 'rb').read())) / 1e3))
