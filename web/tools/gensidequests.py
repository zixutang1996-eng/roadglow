# Build public/sidequests_ca.json from Wikidata (CC0). Images are Wikimedia Commons file names (credit fetched at view time).
import json, subprocess, urllib.parse, urllib.request, time
CLS = {'Q74047':'ghost','Q350895':'ghost','Q109607':'ruin','Q180174':'odd','Q14915208':'odd','Q548879':'odd','Q854550':'nature','Q2572947':'view','Q6017969':'view','Q42412840':'ruin'}
Q = '''SELECT ?i ?c ?coord ?img ?en ?zh ?den ?dzh WHERE { BIND(wd:%s AS ?c) ?i wdt:P31 ?c; wdt:P17 wd:Q16; wdt:P625 ?coord.
 OPTIONAL{?i wdt:P18 ?img} OPTIONAL{?i rdfs:label ?en FILTER(lang(?en)="en")} OPTIONAL{?i rdfs:label ?zh FILTER(lang(?zh)="zh")}
 OPTIONAL{?i schema:description ?den FILTER(lang(?den)="en")} OPTIONAL{?i schema:description ?dzh FILTER(lang(?dzh)="zh")} }'''
rows = []
for c in CLS:
    req = urllib.request.Request('https://query.wikidata.org/sparql?format=json&query=' + urllib.parse.quote(Q.replace('%s', c)), headers={'User-Agent': 'RoadGlow/0.4 (personal; github.com/zixutang1996-eng/roadglow)'})
    try: rows += json.load(urllib.request.urlopen(req, timeout=90))['results']['bindings']
    except Exception as e: print('fail', c, e)
    time.sleep(1)
out = {}
for r in rows:
    qid = r['i']['value'].rsplit('/', 1)[1]; g = lambda k: r.get(k, {}).get('value')
    lng, lat = map(float, g('coord')[6:-1].split())
    o = out.setdefault(qid, {'id': qid, 'lat': round(lat, 5), 'lng': round(lng, 5), 'k': CLS[g('c').rsplit('/', 1)[1]]})
    for k, v in [('en', g('en')), ('zh', g('zh')), ('d', g('den')), ('dz', g('dzh'))]:
        if v and k not in o: o[k] = v
    if g('img') and 'img' not in o: o['img'] = urllib.parse.unquote(g('img').rsplit('/', 1)[1])
L = [o for o in out.values() if o.get('en') or o.get('zh')]
json.dump(L, open('public/sidequests_ca.json', 'w'), ensure_ascii=False, separators=(',', ':'))
print(len(L), sum('img' in o for o in L), {k: sum(o['k'] == k for o in L) for k in set(CLS.values())})
