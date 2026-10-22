import numpy as np, random, math, sys
from PIL import Image, ImageDraw, ImageFilter, ImageChops
S=2; W,H=1200,900
def bez(*segs,n=40):
    # segs: list of (p0,c1,c2,p1) cubic
    out=[]
    for p0,c1,c2,p1 in segs:
        for i in range(n):
            t=i/n; a=(1-t)**3;b=3*t*(1-t)**2;c=3*t*t*(1-t);d=t**3
            out.append((a*p0[0]+b*c1[0]+c*c2[0]+d*p1[0],a*p0[1]+b*c1[1]+c*c2[1]+d*p1[1]))
    out.append(segs[-1][3]); return out
def spline(pts,n=30):
    # catmull-rom through points
    P=[pts[0]]+list(pts)+[pts[-1]]; out=[]
    for i in range(1,len(P)-2):
        p0,p1,p2,p3=map(np.array,(P[i-1],P[i],P[i+1],P[i+2]))
        for k in range(n):
            t=k/n; out.append(tuple(.5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t*t+(-p0+3*p1-3*p2+p3)*t**3)))
    out.append(pts[-1]); return out
class Canvas:
    def __init__(s): s.D=np.zeros((H*S,W*S),np.float32)
    def add(s,m,tone):  # m: L image 0..255 coverage
        a=np.asarray(m,np.float32)/255*tone; s.D=1-(1-s.D)*(1-a)
def wash(cv,poly,tone,blur=6,wet=.5,seed=0):
    m=Image.new('L',(W*S,H*S),0); ImageDraw.Draw(m).polygon([(x*S,y*S) for x,y in poly],fill=255)
    rnd=np.random.default_rng(seed)
    nz=Image.fromarray((rnd.random((H//6,W//6))*255).astype('uint8')).resize((W*S,H*S),Image.BICUBIC).filter(ImageFilter.GaussianBlur(6*S))
    nz=Image.fromarray(np.clip((np.asarray(nz,np.float32)-128)*3+128,0,255).astype('uint8'))
    m=m.filter(ImageFilter.GaussianBlur(blur*S))
    a=np.asarray(m,np.float32)/255; n=np.asarray(nz,np.float32)/255
    # wet edge: pigment pools at boundary
    edge=np.clip(1-np.abs(a-.5)*2,0,1)
    val=a*(.7+.3*n)+edge*wet
    cv.add(Image.fromarray((np.clip(val,0,1)*255).astype('uint8')),tone)
def stroke(cv,pts,w,tone,seed=0,taper=(.1,.3),dry=.4,nb=60,core=.55,mod=.2,pw=(.6,.8),start_blob=0):
    rnd=random.Random(seed); m=Image.new('L',(W*S,H*S),0); d=ImageDraw.Draw(m)
    pts=np.array(pts,float); n=len(pts)
    seg=np.r_[0,np.cumsum(np.hypot(*np.diff(pts,axis=0).T))]; t=seg/max(seg[-1],1e-6)
    tan=np.gradient(pts,axis=0); tan/=np.hypot(*tan.T)[:,None]+1e-9; nor=np.c_[-tan[:,1],tan[:,0]]
    a,b=taper
    if isinstance(w,(list,tuple)): ww=np.interp(np.linspace(0,1,n),np.linspace(0,1,len(w)),w); wf=None
    else: wf=w if callable(w) else (lambda tt:w)
    prof=np.minimum(np.clip(t/a,0,1)**pw[0],np.clip((1-t)/b,0,1)**pw[1])*(1-mod+mod*np.sin(t*6+seed))
    Wd=(ww if wf is None else np.array([wf(tt) for tt in t]))*S*prof
    if core>0:
        l=pts*S+nor*(Wd*core/2)[:,None]; r=pts*S-nor*(Wd*core/2)[:,None]
        d.polygon([tuple(p) for p in np.r_[l,r[::-1]]],fill=255)
    if start_blob: d.ellipse([pts[0][0]*S-Wd.max()*.35,pts[0][1]*S-Wd.max()*.35,pts[0][0]*S+Wd.max()*.35,pts[0][1]*S+Wd.max()*.35],fill=255)
    for k in range(nb):
        o=rnd.uniform(-1,1); bw=max(1,int(rnd.uniform(.03,.08)*Wd.max())); inten=rnd.randint(150,255)
        gap=False; st=rnd.uniform(0,.05)
        for i in range(n-1):
            if t[i]<st: continue
            pd=dry*(abs(o)**1.5*.8+max(0,t[i]-.4)*1.5)
            if rnd.random()<.18: gap=rnd.random()<pd
            if gap: continue
            d.line([tuple(pts[i]*S+nor[i]*o*Wd[i]/2),tuple(pts[i+1]*S+nor[i+1]*o*Wd[i+1]/2)],fill=inten,width=bw)
    cv.add(m.filter(ImageFilter.GaussianBlur(.6*S)),tone)
def out(cv,path,col=(24,21,18),bg=None,scale=1):
    a=(np.clip(cv.D,0,1)*255).astype('uint8'); A=Image.fromarray(a)
    im=Image.new('RGBA',A.size,col+(0,)); im.putalpha(A)
    im=im.resize((int(W*scale),int(H*scale)),Image.LANCZOS)
    if bg: b=Image.new('RGBA',im.size,bg+(255,)); im=Image.alpha_composite(b,im)
    im.save(path)
