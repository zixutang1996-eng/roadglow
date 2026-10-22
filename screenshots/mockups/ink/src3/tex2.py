from PIL import Image, ImageDraw, ImageFilter
import numpy as np, math, random, sys
SS=4  # supersample relative to css px; output at 2x
PAL={'A':dict(ink=(40,36,32),fill=(241,233,214),red=(172,48,36),paper='paper_A.png'),
     'C':dict(ink=(222,212,192),fill=(36,33,30),red=(196,74,52),paper='paper_C.png')}
def tile(path,w,h):
    t=Image.open(path).convert('RGB'); t=t.resize((t.width*SS//2,t.height*SS//2))
    im=Image.new('RGB',(w,h))
    for x in range(0,w,t.width):
        for y in range(0,h,t.height): im.paste(t,(x,y))
    return im
def brush(mask,pts,wmax,seed,dry=.5,taper=(0.15,0.25),nb=46,core=.62,mod=.15):
    rnd=random.Random(seed); d=ImageDraw.Draw(mask)
    pts=np.array(pts,float); n=len(pts)
    seg=np.r_[0,np.cumsum(np.hypot(*np.diff(pts,axis=0).T))]; L=seg[-1]; t=seg/L
    tan=np.gradient(pts,axis=0); tan/=np.hypot(*tan.T)[:,None]+1e-9; nor=np.c_[-tan[:,1],tan[:,0]]
    a,b=taper
    prof=np.minimum(np.clip(t/a,0,1)**.6,np.clip((1-t)/b,0,1)**.8)*(1-mod+mod*np.sin(t*7+seed)*np.sin(t*2.3+seed*.7))
    W=wmax*SS*prof
    # solid core polygon
    left=pts*SS+nor*(W*core/2)[:,None]; right=pts*SS-nor*(W*core/2)[:,None]
    d.polygon([tuple(p) for p in np.r_[left,right[::-1]]],fill=235)
    for k in range(nb):
        o=rnd.uniform(-1.12,1.12); bw=max(1,int(rnd.uniform(.03,.09)*wmax*SS))
        start=rnd.uniform(0,.08); 
        gap=False
        for i in range(n-1):
            if t[i]<start: continue
            pdrop=dry*(abs(o)**1.5*0.7+max(0,t[i]-.45)*1.6)
            if rnd.random()<0.15: gap = rnd.random()<pdrop
            if gap: continue
            p1=pts[i]*SS+nor[i]*o*W[i]/2; p2=pts[i+1]*SS+nor[i+1]*o*W[i+1]/2
            d.line([tuple(p1),tuple(p2)],fill=rnd.randint(170,255),width=bw)
def path_line(x0,x1,y,n=120,amp=2,seed=0):
    r=random.Random(seed); ph=r.uniform(0,6)
    return [(x0+(x1-x0)*i/(n-1), y+amp*math.sin(i/n*3.1+ph)+amp*.5*math.sin(i/n*9+ph*2)) for i in range(n)]
def divider(name,w,h,seed,col=(30,27,24)):
    m=Image.new('L',(w*SS,h*SS),0)
    brush(m,path_line(10,w-4,h/2,amp=1.6,seed=seed),h*.7,seed,dry=1.0,taper=(.012,.6),nb=110,core=.5,mod=.3)
    out(m,col,name)
def out(m,col,name,fill=None):
    m=m.filter(ImageFilter.GaussianBlur(SS*.35))
    im=Image.new('RGBA',m.size,col+(0,)); im.putalpha(m)
    if fill is not None: im=Image.alpha_composite(fill,im)
    im=im.resize((m.width*2//SS,m.height*2//SS),Image.LANCZOS); im.save(f'a/{name}.png',optimize=True)
def blobpts(x,y,w,h,r,seed,amp=3,n=260):
    rnd=random.Random(seed); ph=[rnd.uniform(0,6.3) for _ in range(4)]
    pts=[]
    per=2*(w+h-4*r)+2*math.pi*r
    for i in range(n):
        s=per*i/n; # walk rounded rect
        segs=[(w-2*r,'t'),(math.pi*r/2,'c1'),(h-2*r,'r'),(math.pi*r/2,'c2'),(w-2*r,'b'),(math.pi*r/2,'c3'),(h-2*r,'l'),(math.pi*r/2,'c4')]
        for L,k in segs:
            if s<=L: break
            s-=L
        if k=='t': px,py,nx,ny=x+r+s,y,0,-1
        elif k=='r': px,py,nx,ny=x+w,y+r+s,1,0
        elif k=='b': px,py,nx,ny=x+w-r-s,y+h,0,1
        elif k=='l': px,py,nx,ny=x,y+h-r-s,-1,0
        else:
            a=s/r; c={'c1':(x+w-r,y+r,-math.pi/2),'c2':(x+w-r,y+h-r,0),'c3':(x+r,y+h-r,math.pi/2),'c4':(x+r,y+r,math.pi)}[k]
            nx,ny=math.cos(c[2]+a),math.sin(c[2]+a); px,py=c[0]+r*nx,c[1]+r*ny
        u=i/n*2*math.pi
        hf=.2 if w>120 else .05
        o=amp*(math.sin(u*3+ph[0])*.6+math.sin(u*5+ph[1])*.3+math.sin(u*11+ph[2])*hf)
        pts.append((px+nx*o,py+ny*o))
    return pts
def blob(name,w,h,pal,seed,r=None,bw=7,fill='paper',amp=3,strokes=2,wash=True,dry=.85,core=.45,nb=70):
    P=PAL[pal]; pad=int(bw+amp+4); W,H=w+2*pad,h+2*pad
    r=r if r is not None else min(h/2,22)
    pts=blobpts(pad,pad,w,h,r,seed,amp)
    # fill
    fm=Image.new('L',(W*SS,H*SS),0); ImageDraw.Draw(fm).polygon([(px*SS,py*SS) for px,py in pts],fill=255)
    fm=fm.filter(ImageFilter.GaussianBlur(SS*.6))
    if fill=='paper': base=tile(P['paper'],W*SS,H*SS).convert('RGBA')
    else:
        c=P['red'] if fill=='red' else P['ink']
        base=Image.new('RGBA',(W*SS,H*SS),c+(255,))
        # mottled ink
        nz=Image.effect_noise((W*SS//8,H*SS//8),40).resize((W*SS,H*SS),Image.BICUBIC)
        dark=Image.new('RGBA',base.size,(0,0,0,255)); base=Image.composite(dark,base,nz.point(lambda v:int(max(0,v-128)*.5)))
    base.putalpha(fm)
    if wash:  # inner ink wash near edges
        e=fm.filter(ImageFilter.GaussianBlur(SS*bw*1.3)); ed=Image.eval(Image.composite(Image.new('L',fm.size,0),Image.eval(e,lambda v:255-v),Image.eval(fm,lambda v:255-v)),lambda v:v)
        ed=Image.composite(ed,Image.new('L',fm.size,0),fm).point(lambda v:int(v*.28))
        lay=Image.new('RGBA',fm.size,P['ink']+(0,)); lay.putalpha(ed); base=Image.alpha_composite(base,lay)
    m=Image.new('L',(W*SS,H*SS),0); rnd=random.Random(seed)
    n=len(pts)
    if bw>0:
        st=rnd.randint(0,n-1); cover=1.0/strokes
        for s in range(strokes):
            a=int(st+s*n*cover - n*.04); b=int(st+(s+1)*n*cover + n*.06)
            seg=[pts[i%n] for i in range(a,b)]
            brush(m,seg,bw,seed*10+s,dry=dry,taper=(.04,.22),nb=nb,core=core,mod=.5)
    out(m,P['ink'] if fill!='ink' else tuple(min(255,int(c*.5)) for c in P['ink']),name,fill=base)
    PADS[name]=pad
    return pad
PADS={}
if __name__=='__main__':
    for i in range(4): divider(f'div{i}',420,24,i+1)
    for i in range(2): divider(f'divC{i}',420,24,i+11,col=(214,204,184))
    for pal in 'AC':
        s=pal
        blob(f'search_{s}',433,60,pal,3,r=30,bw=9,amp=3)
        blob(f'chip_{s}_s',64,38,pal,5,r=19,bw=4,amp=2)
        blob(f'chip_{s}_m',86,38,pal,6,r=19,bw=4,amp=2)
        blob(f'fab_{s}',58,58,pal,7,r=29,bw=5,amp=3)
        blob(f'fabr_{s}',58,58,pal,8,r=29,bw=0,amp=3.5,fill='red',wash=False)
        blob(f'dot_{s}',38,38,pal,9,r=19,bw=0,amp=2.5,fill='ink',wash=False)
        blob(f'dots_{s}',26,26,pal,10,r=13,bw=0,amp=2,fill='ink',wash=False)
        blob(f'dotr_{s}',38,38,pal,11,r=19,bw=0,amp=2.5,fill='red',wash=False)
        blob(f'banner_{s}',437,124,pal,12,r=26,bw=15,amp=6,strokes=2,dry=1.5,core=.22,nb=110)
        blob(f'then_{s}',176,44,pal,13,r=20,bw=6,amp=3,dry=1.5,core=.22,nb=110)
        blob(f'navcard_{s}',437,116,pal,14,r=26,bw=15,amp=6,strokes=2,dry=1.5,core=.22,nb=110)
        blob(f'stop_{s}',104,52,pal,15,r=8,bw=0,amp=3.5,fill='red',wash=False)
        blob(f'btn_{s}',84,40,pal,16,r=10,bw=4,amp=2)
        blob(f'btnr_{s}',96,40,pal,17,r=10,bw=0,amp=2.5,fill='red',wash=False)
        blob(f'speed_{s}',64,64,pal,18,r=22,bw=5,amp=3)
        blob(f'tag_{s}',70,34,pal,19,r=10,bw=3,amp=2)
    import json; json.dump(PADS,open('a/pads.json','w')); print('ok')
