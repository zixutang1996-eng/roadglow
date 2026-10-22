# v1.1: procedural thick dry-brush ink rings (irregular edge, streaky dry brush, tonal variation) sized to the target windows.
# Overrides the ring windows written by gentarget.py (whose map-contaminated extractions were unreliable).
import cv2, numpy as np, json
from PIL import Image
OUT='out'; meta=json.load(open(OUT+'/target_meta.json'))
def noise(h,w,s,seed):
    r=np.random.default_rng(seed); n=cv2.GaussianBlur(r.normal(0,1,(h,w)).astype(np.float32),(0,0),s); return n/(n.std()+1e-6)
def rrect_sdf(h,w,rad,pad):
    y,x=np.mgrid[0:h,0:w].astype(np.float32); cx,cy=w/2,h/2; hx,hy=w/2-pad-rad,h/2-pad-rad
    qx=np.abs(x-cx)-hx; qy=np.abs(y-cy)-hy
    return np.hypot(np.maximum(qx,0),np.maximum(qy,0))+np.minimum(np.maximum(qx,qy),0)-rad, x-cx, y-cy
def make(w,h,rad,t,seed,pad=6,wob=2.6):
    d,X,Y=rrect_sdf(h,w,rad,pad)
    d=d+noise(h,w,max(w,h)/14,seed)*wob+noise(h,w,6,seed+1)*0.7
    # contour coordinate: angle * mean radius -> streaks along the stroke
    ang=np.arctan2(Y/(h/2),X/(w/2)); s=(ang+np.pi)*(w+h)/4
    r_=np.random.default_rng(seed+2); big=cv2.GaussianBlur(r_.normal(0,1,(64,2048)).astype(np.float32),(0,0),sigmaX=9,sigmaY=1.1); big/=big.std()+1e-6
    tv=t*(1+0.32*noise(h,w,max(w,h)/9,seed+3))          # thickness varies along the stroke
    u=np.clip((-d)/np.maximum(tv,2),0,1.2)                 # 0 at outer edge -> 1 at inner edge
    si=(s*2.2).astype(int)%2048; ui=np.clip((u*63),0,63).astype(int)
    streak=big[ui,si]                                      # varies across the stroke, slow along it
    inring=(d<0)&(u<1)
    dry=(streak<-1.25+1.9*np.clip((u-0.6)*2.5,0,1))   # gaps mostly toward inner edge
    tone=np.clip(0.5+0.18*noise(h,w,18,seed+4)+0.08*noise(h,w,2,seed+5),0,1)
    inkA=inring&~dry
    a_out=np.clip(-d+0.8,0,1)                              # antialiased outer edge
    paper=(d<0)
    return d,u,inkA,tone,a_out,paper
def render(name,w,h,rad,t,seed,dark=False,paperc=(236,229,212),inkc=(40,37,34),wob=2.6):
    d,u,inkA,tone,a,paper=make(w,h,rad,t,seed,wob=wob)
    mott=noise(h,w,7,seed+7)*3.0+noise(h,w,1.2,seed+8)*1.6
    if dark: paperc=(31,29,27); inkc=(214,205,190)
    P=np.clip(np.array(paperc,np.float32)[None,None]+mott[...,None],0,255)
    I=np.array(inkc,np.float32)[None,None]*(0.75+0.5*tone[...,None]) if not dark else np.array(inkc,np.float32)[None,None]*(0.82+0.3*tone[...,None])
    k=cv2.GaussianBlur(inkA.astype(np.float32),(0,0),0.7)[...,None]
    rgb=np.clip(P*(1-k)+I*k,0,255)
    A=np.clip(a,0,1)*255
    Image.fromarray(np.dstack([rgb,A]).astype(np.uint8),'RGBA').save(f'{OUT}/{name}.webp',quality=90,method=6)
# (name, w, h, corner radius, ring thickness, slice) in 2x px, sizes from the targets
SPEC=[('search',904,156,70,13,(40,72,40,72)),('banner',918,286,64,15,(52,72,52,72)),('then',374,108,46,10,(30,48,30,48)),
      ('navcard',912,276,70,15,(56,80,56,80)),('chip',184,98,44,9,(26,46,26,46)),('chips',162,88,40,9,(26,42,26,42)),
      ('fab',134,140,58,10,None),('fab2',134,140,58,10,None),('speed',154,155,62,11,None),('xbtn',130,146,56,10,None)]
for i,(n,w,h,r,t,sl) in enumerate(SPEC):
    for dk in (0,1):
        if n=='search' and dk: continue   # real dark target kept
        render(n+('_dark' if dk else '_light'),w,h,r,t,11+i*7,dark=bool(dk),wob=2.6 if w>300 else 2.0)
    meta[n+'_light']=meta.get(n+'_light',{}); meta[n+'_light'].update(w=w,h=h,slice=sl); meta[n+'_dark']=dict(meta[n+'_light'])
json.dump(meta,open(OUT+'/target_meta.json','w'),indent=0); print('rings',len(SPEC))
