#!/usr/bin/env python3
"""Build the RoadGlow 'Alberta Hunters' offline overlay pack from Government of Alberta ArcGIS REST services.
Licence: Open Government Licence - Alberta (https://open.alberta.ca/licence). No third-party hunting app data is used.
Output: web/hunt/alberta-hunters-<ver>.json.gz  (gzip JSON: {format, version, layers:{id: FeatureCollection}})"""
import json, gzip, sys, time, urllib.request, urllib.parse, hashlib, os
B = 'https://geospatial.alberta.ca'
LM = B + '/titan/rest/services/base/land_use_management_10tm_nad83_aep/MapServer/'
RA = B + '/titan/rest/services/recaccess/'
LAYERS = [  # id, url, label field(s), simplify tolerance (deg)
 ('wmu', B + '/mimas/rest/services/boundaries/fishwild_wildlife_mgmt_unit_public/FeatureServer/0', ['WMUNIT_CODE', 'WMUNIT_NAME'], 0.0008),
 ('gwa', B + '/mimas/rest/services/boundaries/land_green_white_area_public/FeatureServer/0', ['GWA_NAME', 'GWA_CODE'], 0.0015),
 ('pluz', LM + '1', None, 0.0004),
 ('rmfr', LM + '3', None, 0.0008),
 ('plra', LM + '22', None, 0.0002),
 ('eslu', LM + '33', None, 0.0004),
 ('parks', B + '/titan/rest/services/boundary/parks_protected_areas_alberta/FeatureServer/0', ['NAME', 'TYPE', 'SUBTYPE'], 0.0002),
 ('ir', RA + 'recaccess_firstnations/MapServer/1', ['IRES_NAME', 'NTN_NAME'], 0.0004),
 ('metis', RA + 'recaccess_firstnations/MapServer/3', None, 0.0004),
 ('dnd', RA + 'recaccess_military/MapServer/1', None, 0.0006),
 ('dndb', RA + 'recaccess_military/MapServer/3', None, 0.0004),
 ('graze', RA + 'recaccess_grazing/MapServer/1', ['ACTIVITY_TYPE', 'COMMON_NAME', 'PGR_TYPE'], 0.0003),
]
def get(u, **q):
    for i in range(4):
        try:
            r = urllib.request.urlopen(u + ('?' + urllib.parse.urlencode(q) if q else ''), timeout=120); return json.load(r)
        except Exception as e: print('retry', u, e, file=sys.stderr); time.sleep(3)
    raise SystemExit('failed ' + u)
def rnd(c, p=5):
    return [rnd(x, p) for x in c] if isinstance(c[0], list) else [round(c[0], p), round(c[1], p)]
def fetch(id_, url, keep, tol):
    meta = get(url, f='json'); flds = [f['name'] for f in meta['fields'] if f['type'] not in ('esriFieldTypeGeometry', 'esriFieldTypeGlobalID', 'esriFieldTypeOID') and not f['name'].lower().startswith(('shape', 'globalid', 'objectid', 'st_', 'created', 'last_edit'))]
    if keep: flds = keep
    ids = get(url + '/query', where='1=1', returnIdsOnly='true', f='json')['objectIds'] or []
    ids.sort(); feats = []
    for i in range(0, len(ids), 100):
        g = get(url + '/query', objectIds=','.join(map(str, ids[i:i+100])), outFields=','.join(flds) or '*', outSR=4326, f='geojson', maxAllowableOffset=tol, geometryPrecision=5)
        for f in g['features']:
            if not f.get('geometry'): continue
            f['geometry']['coordinates'] = rnd(f['geometry']['coordinates'])
            f['properties'] = {k: v for k, v in (f.get('properties') or {}).items() if v not in (None, '', ' ')}
            f.pop('id', None); feats.append(f)
    print(id_, len(feats), meta['name'], 'fields', flds, file=sys.stderr)
    return {'type': 'FeatureCollection', 'name': meta['name'], 'source': url, 'features': feats}
if __name__ == '__main__':
    ver = sys.argv[1] if len(sys.argv) > 1 else '1.0.0'
    out = {'format': 'roadglow-overlay/1', 'id': 'alberta-hunters', 'version': ver, 'built': time.strftime('%Y-%m-%d'), 'licence': 'Contains information licensed under the Open Government Licence – Alberta', 'licenceUrl': 'https://open.alberta.ca/licence', 'layers': {}}
    for L in LAYERS: out['layers'][L[0]] = fetch(*L)
    raw = json.dumps(out, separators=(',', ':'), ensure_ascii=False).encode()
    os.makedirs('web/public/hunt', exist_ok=True); p = f'web/public/hunt/alberta-hunters-{ver}.json.gz'
    gz = gzip.compress(raw, 9); open(p, 'wb').write(gz)
    print(p, 'raw', len(raw), 'gz', len(gz), 'sha256', hashlib.sha256(gz).hexdigest())
