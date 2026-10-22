from PIL import Image, ImageDraw, ImageFilter
import numpy as np, random, sys
sys.path.insert(0,'.')
from tex2 import brush
ref=Image.open('ref.png').convert('RGB'); R=np.asarray(ref,np.float32); Lm=R.mean(2)
X0,Y0,X1,Y1=200,64,792,1031
crop=R[Y0:Y1,X0:X1].copy(); L=Lm[Y0:Y1,X0:X1]; h,w=L.shape
A=np.zeros((h,w),np.float32)
def box(x0,y0,x1,y1,v=1): A[y0-Y0:y1-Y0,x0-X0:x1-X0]=np.maximum(A[y0-Y0:y1-Y0,x0-X0:x1-X0],v)
box(230,112,765,990)
box(211,86,776,122)
box(211,988,776,1012)
# fringes/shadow/ropes by darkness
def dark(x0,y0,x1,y1,b=205,r=80):
    sl=(slice(y0-Y0,y1-Y0),slice(x0-X0,x1-X0)); A[sl]=np.maximum(A[sl],np.clip((b-L[sl])/r,0,1))
dark(208,82,780,88); dark(208,1010,780,1028,b=200,r=70); dark(232,66,286,88,b=195,r=60)
dark(225,1012,280,1031,b=195,r=60); dark(712,1012,755,1031,b=195,r=60)
# top-right: mirror the top-left cap (seal-free)
tl=crop[:,0:95].copy(); Atl=A[:,0:95].copy()
crop[:122-Y0,w-95:]=tl[:122-Y0,::-1]; A[:122-Y0,w-95:]=Atl[:122-Y0,::-1]
A=np.asarray(Image.fromarray((A*255).astype('uint8')).filter(ImageFilter.GaussianBlur(.6)),np.float32)/255
# body rect in crop coords
BX0,BY0,BX1,BY1=230-X0,118-Y0,764-X0,990-Y0
PX0,PY0,PX1,PY1=243-X0,129-Y0,742-X0,979-Y0   # paper (inside mounting band)
# clean paper stats from a clean patch
patch=R[140:255,690:735]; pm=patch.reshape(-1,3).mean(0); ps=patch.mean(2).std()
def nz(hh,ww,cell,seed,blur=0):
    r=np.random.default_rng(seed); im=Image.fromarray((r.random((hh//cell+2,ww//cell+2))*255).astype('uint8')).resize((ww,hh),Image.BICUBIC)
    if blur: im=im.filter(ImageFilter.GaussianBlur(blur))
    return np.asarray(im,np.float32)/255-.5
def slice9(img,tw,th,xs,ys):
    # img HxWxC float; xs=(a,b) stretch columns a..b ; ys likewise
    a,b=xs; c,d=ys; H,W=img.shape[:2]
    cols=[img[:,:a],img[:,a:b],img[:,b:]]; tw_mid=tw-a-(W-b)
    def rs(x,nw,nh): 
        im=Image.fromarray(np.clip(x,0,255).astype('uint8')); return np.asarray(im.resize((max(1,nw),max(1,nh)),Image.BICUBIC),np.float32)
    rows=[]
    for (y0,y1),nh in (((0,c),c),((c,d),th-c-(H-d)),((d,H),H-d)):
        r=[rs(col[y0:y1],cw,nh) for col,cw in zip(cols,(a,tw_mid,W-b))]
        rows.append(np.concatenate(r,1))
    return np.concatenate(rows,0)
def make(name,wcss,hcss,V,S=.6,K=2):
    f=K*S  # ref px -> device px
    bw,bh=BX1-BX0,BY1-BY0
    tw=int(round(wcss/S*1.0))+ (w-bw); th=int(round(hcss/S))+(h-bh)   # target in ref px units
    rgba=np.dstack([crop,A*255])
    xs=(BX0+60,BX1-60); ys=(BY0+80,BY1-80)
    big=slice9(rgba,tw,th,xs,ys)
    out=Image.fromarray(np.clip(big,0,255).astype('uint8'),'RGBA')
    W2,H2=int(tw*f),int(th*f); out=out.resize((W2,H2),Image.LANCZOS)
    arr=np.asarray(out,np.float32).copy()
    # paper region in target coords
    px0=int(PX0*f); py0=int(PY0*f); px1=int((tw-(w-PX1))*f); py1=int((th-(h-PY1))*f)
    pw,ph=px1-px0,py1-py0
    yy,xx=np.mgrid[0:ph,0:pw]; e=np.minimum.reduce([xx,yy,pw-xx,ph-yy])/(22*K)
    base=pm.copy()
    pap=base+(nz(ph,pw,2,7,1)*ps*1.6+nz(ph,pw,40,8,10)*5)[...,None]
    st=np.clip(nz(ph,pw,120,5,40)*2,0,1); edge=np.clip(1-e,0,1)**2
    k=(st*.05+edge*.16)[...,None]; pap=pap*(1-k)+np.array([150,130,100])*k
    if V=='C':
        lum=pap.mean(2,keepdims=True); pap=np.array([24,23,22])+ (lum-pm.mean())*.35
        # darken mounting band, keep rods
        reg=arr[int(BY0*f)+int(6*f):int((th-(h-BY1))*f)-int(6*f), int(BX0*f):int((tw-(w-BX1))*f)]
        reg[...,:3]*=.38
    arr[py0:py1,px0:px1,:3]=pap
    out=Image.fromarray(np.clip(arr,0,255).astype('uint8'),'RGBA')
    shm=Image.new('L',(W2,H2),0); ImageDraw.Draw(shm).rectangle([int(BX0*f)+8*K,int(BY0*f)+10*K,int((tw-(w-BX1))*f)+5*K,int((th-(h-BY1))*f)+8*K],fill=150 if V=='A' else 230)
    sh=Image.new('RGBA',(W2,H2),(20,12,6,0)); sh.putalpha(shm.filter(ImageFilter.GaussianBlur(8*K))); sh.alpha_composite(out); out=sh
    # irregular brush inner border
    m=Image.new('L',(W2*2,H2*2),0)  # brush SS=4 assumes css*4; we pass coordinates in units of device/2
    ins=10*K
    x0,y0,x1,y1=(px0+ins)/2,(py0+ins)/2,(px1-ins)/2,(py1-ins)/2
    r=random.Random(len(name))
    def wob(p,q,n=60):
        return [(p[0]+(q[0]-p[0])*i/(n-1)+r.uniform(-.4,.4),p[1]+(q[1]-p[1])*i/(n-1)+r.uniform(-.4,.4)) for i in range(n)]
    sides=[((x0-4,y0),(x1+3,y0+1)),((x1,y0-3),(x1-1,y1+4)),((x1+4,y1),(x0-3,y1-1)),((x0,y1+3),(x0+1,y0-4))]
    for i,(p,q) in enumerate(sides): brush(m,wob(p,q),6,i+len(name)*7,dry=1.2,taper=(.03,.25),nb=40,core=.35,mod=.45)
    m=m.resize((W2,H2),Image.LANCZOS).filter(ImageFilter.GaussianBlur(.4))
    col=(40,34,28) if V=='A' else (165,155,135)
    lay=Image.new('RGBA',(W2,H2),col+(0,)); lay.putalpha(m.point(lambda v:int(v*.85))); out.alpha_composite(lay)
    out.save(f'a/scroll_{name}_{V}.png',optimize=True)
    return dict(l=BX0*S,t=BY0*S,r=(w-BX1)*S,b=(h-BY1)*S)
import json
J={'drawer':(318,925)}
for V in 'AC':
    for n,(ww,hh) in J.items(): off=make(n,ww,hh,V)
json.dump(off,open('a/scroll4.json','w')); print(off)
