# Generates the 分久必合 / Three Kingdoms skin-pack assets into out/ (run from web/packsrc/sanguo).
# Rough ink effects are baked into PNG/WebP so the app never runs live SVG filters.
from PIL import Image, ImageDraw, ImageFilter, ImageOps
import numpy as np, random, json, os, sys, shutil
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)),'src')); sys.path.insert(0,'.')
from tex2 import brush
OUT='../out'; os.makedirs(OUT,exist_ok=True)
def save(im,name,q=None):
    p=f'{OUT}/{name}'
    if name.endswith('.webp'): im.save(p,'WEBP',quality=q or 82,method=6)
    else: im.save(p,optimize=True)
# ---------------- scroll (nine-slice) ----------------
ref=Image.open('ref.png').convert('RGB'); R=np.asarray(ref,np.float32); Lm=R.mean(2)
X0,Y0,X1,Y1=200,64,792,1031
crop=R[Y0:Y1,X0:X1].copy(); L=Lm[Y0:Y1,X0:X1]; h,w=L.shape
A=np.zeros((h,w),np.float32)
def box(x0,y0,x1,y1,v=1): A[y0-Y0:y1-Y0,x0-X0:x1-X0]=np.maximum(A[y0-Y0:y1-Y0,x0-X0:x1-X0],v)
def dark(x0,y0,x1,y1,b=205,r=80):
    sl=(slice(y0-Y0,y1-Y0),slice(x0-X0,x1-X0)); A[sl]=np.maximum(A[sl],np.clip((b-L[sl])/r,0,1))
box(230,112,765,990); box(246,86,750,122); box(246,988,745,1012)
# rod ends: alpha from darkness only (end-caps are dark lacquer) -> no pale box of background around the caps
dark(206,84,250,124,b=196,r=40); dark(206,984,250,1016,b=196,r=40); dark(740,984,782,1016,b=196,r=40)
dark(208,1010,780,1028,b=150,r=60); dark(232,66,286,88,b=195,r=60)
dark(225,1012,280,1031,b=195,r=60); dark(712,1012,755,1031,b=195,r=60)
tl=crop[:,0:95].copy(); Atl=A[:,0:95].copy()
crop[:122-Y0,w-95:]=tl[:122-Y0,::-1]; A[:122-Y0,w-95:]=Atl[:122-Y0,::-1]
A=np.asarray(Image.fromarray((A*255).astype('uint8')).filter(ImageFilter.GaussianBlur(.6)),np.float32)/255
BX0,BY0,BX1,BY1=230-X0,118-Y0,764-X0,990-Y0
PX0,PY0,PX1,PY1=243-X0,129-Y0,742-X0,979-Y0
patch=R[140:255,690:735]; pm=patch.reshape(-1,3).mean(0); ps=patch.mean(2).std()
def nz(hh,ww,cell,seed,blur=0):
    r=np.random.default_rng(seed); im=Image.fromarray((r.random((hh//cell+2,ww//cell+2))*255).astype('uint8')).resize((ww,hh),Image.BICUBIC)
    if blur: im=im.filter(ImageFilter.GaussianBlur(blur))
    return np.asarray(im,np.float32)/255-.5
def slice9(img,tw,th,xs,ys):
    a,b=xs; c,d=ys; H,W=img.shape[:2]; cols=[img[:,:a],img[:,a:b],img[:,b:]]; tw_mid=tw-a-(W-b)
    rs=lambda x,nw,nh: np.asarray(Image.fromarray(np.clip(x,0,255).astype('uint8')).resize((max(1,nw),max(1,nh)),Image.BICUBIC),np.float32)
    rows=[]
    for (y0,y1),nh in (((0,c),c),((c,d),th-c-(H-d)),((d,H),H-d)):
        rows.append(np.concatenate([rs(col[y0:y1],cw,nh) for col,cw in zip(cols,(a,tw_mid,W-b))],1))
    return np.concatenate(rows,0)
def scroll(wcss,hcss,V,S=.6,K=2):
    f=K*S; bw,bh=BX1-BX0,BY1-BY0
    tw=int(round(wcss/S))+(w-bw); th=int(round(hcss/S))+(h-bh)
    big=slice9(np.dstack([crop,A*255]),tw,th,(BX0+60,BX1-60),(BY0+80,BY1-80))
    W2,H2=int(tw*f),int(th*f); out=Image.fromarray(np.clip(big,0,255).astype('uint8'),'RGBA').resize((W2,H2),Image.LANCZOS)
    arr=np.asarray(out,np.float32).copy()
    # mounting band must be fully opaque along both sides (no pale seams)
    bx0,by0,bx1,by1=int(BX0*f),int(BY0*f),int((tw-(w-BX1))*f),int((th-(h-BY1))*f)
    arr[by0:by1,bx0:bx1,3]=255
    px0=int(PX0*f); py0=int(PY0*f); px1=int((tw-(w-PX1))*f); py1=int((th-(h-PY1))*f); pw,ph=px1-px0,py1-py0
    yy,xx=np.mgrid[0:ph,0:pw]; e=np.minimum.reduce([xx,yy,pw-xx,ph-yy])/(22*K)
    pap=pm+(nz(ph,pw,2,7,1)*ps*1.2+nz(ph,pw,40,8,10)*4)[...,None]
    st=np.clip(nz(ph,pw,120,5,40)*2,0,1); edge=np.clip(1-e,0,1)**2
    k=(st*.04+edge*.14)[...,None]; pap=pap*(1-k)+np.array([150,130,100])*k
    if V=='C':
        lum=pap.mean(2,keepdims=True); pap=np.array([24,23,22])+(lum-pm.mean())*.35
        reg=arr[by0+int(6*f):by1-int(6*f),bx0:bx1]; reg[...,:3]*=.38
        for (y0,y1) in ((0,by0+int(6*f)),(by1-int(6*f),H2)):   # black lacquer rods in dark mode
            rr=arr[y0:y1]; rr[...,:3]=rr[...,:3]*.42
    arr[py0:py1,px0:px1,:3]=pap
    out=Image.fromarray(np.clip(arr,0,255).astype('uint8'),'RGBA')
    m=Image.new('L',(W2*2,H2*2),0); ins=10*K
    x0,y0,x1,y1=(px0+ins)/2,(py0+ins)/2,(px1-ins)/2,(py1-ins)/2
    r=random.Random(7)
    wob=lambda p,q,n=60:[(p[0]+(q[0]-p[0])*i/(n-1)+r.uniform(-.4,.4),p[1]+(q[1]-p[1])*i/(n-1)+r.uniform(-.4,.4)) for i in range(n)]
    for i,(p,q) in enumerate([((x0-4,y0),(x1+3,y0+1)),((x1,y0-3),(x1-1,y1+4)),((x1+4,y1),(x0-3,y1-1)),((x0,y1+3),(x0+1,y0-4))]):
        brush(m,wob(p,q),7,i+31,dry=1.1,taper=(.03,.25),nb=40,core=.4,mod=.4)
    m=m.resize((W2,H2),Image.LANCZOS).filter(ImageFilter.GaussianBlur(.4))
    col=(40,34,28) if V=='A' else (165,155,135)
    lay=Image.new('RGBA',(W2,H2),col+(0,)); lay.putalpha(m.point(lambda v:int(v*.85))); out.alpha_composite(lay)
    return out, dict(l=BX0*S,t=BY0*S,r=(w-BX1)*S,b=(h-BY1)*S,W=W2/K,H=H2/K)
geo={}
for V,mode in (('A','light'),('C','dark')):
    im,g=scroll(300,420,V); save(im,f'scroll_{mode}.webp',90); geo=g
    # bottom rod alone (for the unroll animation): rows below the paper
    K=2; yb=int((g['H']-g['b']-4)*K); rod=im.crop((0,yb,im.width,im.height)); save(rod,f'rod_{mode}.webp',90)
    # thin divider strokes (thick tapered dry brush)
    for i,n in enumerate(['div0','div1'] if V=='A' else ['divC0','divC1']):
        shutil.copy(f'mock/{n}.png',f'{OUT}/div{i}_{mode}.png')
json.dump(geo,open(f'{OUT}/scroll_geo.json','w'))
print('scroll geo',geo)
# ---------------- ink blobs (copied from the approved v4 mockup set) ----------------
pads=json.load(open('mock/pads.json'))
for k,v in pads.items():
    n,V=k.rsplit('_',1)[0],k[-1] if not k.endswith(('_s','_m')) else k.split('_')[1]
for f in os.listdir('mock'):
    if f.endswith('.png') and not f.startswith(('scroll_','general','div')):
        im=Image.open('mock/'+f).convert('RGBA'); save(im,f.replace('_A','_light').replace('_C','_dark').replace('.png','.webp'),88)
json.dump({k.replace('_A','_light').replace('_C','_dark'):v for k,v in pads.items()},open(f'{OUT}/pads.json','w'))
# ---------------- rider (luminance -> alpha) + mountains ----------------
rd=Image.open('rider_hd.jpg').convert('L'); rd=rd.resize((720,int(720*rd.height/rd.width)),Image.LANCZOS)
a=np.asarray(rd,np.float32); al=np.clip((235-a)/150,0,1)**1.1
def tint(c,op):
    o=np.zeros(a.shape+(4,),np.uint8); o[...,:3]=c; o[...,3]=(al*255*op).astype('uint8'); return Image.fromarray(o,'RGBA')
save(tint((24,21,18),1),'rider_light.webp',85); save(tint((0xa8,0x9e,0x8a),.75),'rider_dark.webp',85)
for V,mode in (('A','light'),('C','dark')):
    m=Image.open(f'mtn_{V}.png').convert('RGBA'); m=m.resize((640,292),Image.LANCZOS)
    arr=np.asarray(m).copy(); arr[...,3]=(arr[...,3]*.55).astype('uint8'); save(Image.fromarray(arr),f'mtn_{mode}.webp',80)
# ---------------- horse puck (top-down ink horse with a pale halo) ----------------
hs=Image.open('horse_topdown.jpg').convert('L'); bb=ImageOps.invert(hs).point(lambda v:255 if v>40 else 0).getbbox(); hs=hs.crop(bb)
S=168; sc=S*.86/max(hs.size); hs=hs.resize((max(1,int(hs.width*sc)),max(1,int(hs.height*sc))),Image.LANCZOS)
ha=np.clip((240-np.asarray(hs,np.float32))/170,0,1)
for mode,ink,halo in (('light',(22,19,16),(246,238,218)),('dark',(232,224,206),(20,18,16))):
    can=Image.new('RGBA',(S,S),(0,0,0,0))
    g=Image.new('L',(S,S),0); ImageDraw.Draw(g).ellipse((S*.12,S*.04,S*.88,S*.96),fill=200 if mode=='light' else 170); g=g.filter(ImageFilter.GaussianBlur(S*.08))
    hl=Image.new('RGBA',(S,S),halo+(0,)); hl.putalpha(g); can.alpha_composite(hl)
    o=np.zeros(ha.shape+(4,),np.uint8); o[...,:3]=ink; o[...,3]=(ha*255).astype('uint8'); ho=Image.fromarray(o,'RGBA')
    # a soft outline in halo colour keeps the silhouette readable on roads
    ol=ho.filter(ImageFilter.MaxFilter(5)); ol2=Image.new('RGBA',ol.size,halo+(0,)); ol2.putalpha(ol.getchannel('A').point(lambda v:int(v*.9)))
    x=(S-ho.width)//2; y=(S-ho.height)//2; can.alpha_composite(ol2,(x,y)); can.alpha_composite(ho,(x,y))
    save(can,f'horse_{mode}.png')
# map sprite moved to genicons.py (v1.1: target ink dots + white glyphs)
print('ok')
