import math, os, gzip, urllib.request, concurrent.futures as cf, sys, time
T='https://tiles.openfreemap.org/planet/20261018_080001_pt/{z}/{x}/{y}.pbf'
W,S,E_,N=115.42,39.44,117.51,41.06
def tx(lon,z): return int((lon+180)/360*2**z)
def ty(lat,z): r=math.radians(lat); return int((1-math.log(math.tan(r)+1/math.cos(r))/math.pi)/2*2**z)
jobs=[(z,x,y) for z in range(0,15) for x in range(tx(W,z),tx(E_,z)+1) for y in range(ty(N,z),ty(S,z)+1)]
print(len(jobs),flush=True)
def get(j):
    z,x,y=j; p=f'tiles/{z}/{x}/{y}.pbf'
    if os.path.exists(p): return 0
    for a in range(4):
        try:
            req=urllib.request.Request(T.format(z=z,x=x,y=y),headers={'User-Agent':'RoadGlow-offline-build/0.9.2 (personal)','Accept-Encoding':'gzip'})
            with urllib.request.urlopen(req,timeout=30) as r: d=r.read()
            if d[:2]==b'\x1f\x8b': d=gzip.decompress(d)
            os.makedirs(os.path.dirname(p),exist_ok=True); open(p,'wb').write(d); return len(d)
        except urllib.error.HTTPError as e:
            if e.code in (204,404): return 0
            time.sleep(2)
        except Exception: time.sleep(2)
    print('fail',p,flush=True); return 0
tot=0
with cf.ThreadPoolExecutor(12) as ex:
    for i,n in enumerate(ex.map(get,jobs)):
        tot+=n
        if i%2000==0: print(i,tot//1048576,'MB',flush=True)
print('done',tot//1048576,'MB')
