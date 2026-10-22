from PIL import Image, ImageDraw, ImageFilter
import numpy as np, random
K=2; OX,OY=20,16
PAL={'A':dict(mount=(66,64,60),paper=(232,220,194),stain=(150,120,80),line=(58,52,46),edge=(120,90,55)),
     'C':dict(mount=(24,23,22),paper=(22,21,20),stain=(0,0,0),line=(170,160,140),edge=(0,0,0))}
def noise(h,w,cell,seed,blur=0):
    r=np.random.default_rng(seed); im=Image.fromarray((r.random((h//cell+2,w//cell+2))*255).astype('uint8')).resize((w,h),Image.BICUBIC)
    if blur: im=im.filter(ImageFilter.GaussianBlur(blur))
    return np.asarray(im,np.float32)/255-.5
def rod(L,dark):
    H=30*K; a=np.zeros((H,L,4),np.float32); cy=H/2
    cap=18*K
    for x in range(L):
        d=min(x,L-1-x)
        if d<cap:  # metal cap: turned profile
            u=d/cap; hh=(9.5+1.5*np.sin(u*np.pi*3)**2)*K if u>.15 else (7+20*u)*K
            base=np.array([150,140,118]) ; spec=1.0
        else:
            hh=10*K; base=np.array([46,45,44]); spec=.45
        for y in range(max(0,int(cy-hh)),min(H,int(cy+hh)+1)):
            v=(y-cy)/hh; sh=1-.6*v*v
            c=base*sh+spec*np.exp(-((v+.42)/.13)**2)*np.array([235,230,215])
            a[y,x,:3]=np.clip(c,0,255); a[y,x,3]=255
    for d in (int(cap*.33),int(cap*.66),cap):
        for x in (d,L-1-d): a[:,max(0,x-1):x+1,:3]*=.5
    im=Image.fromarray(a.astype('uint8'),'RGBA')
    # rope ties wrapped around the rod just inside the caps
    dr=ImageDraw.Draw(im)
    for x0 in (cap+6*K, L-cap-14*K):
        for i in range(4):
            x=x0+i*2.2*K
            dr.line([(x,cy-10*K),(x+4*K,cy+10*K)],fill=(168,140,96,255),width=int(1.8*K))
            dr.line([(x+.6*K,cy-10*K),(x+4.6*K,cy+10*K)],fill=(110,88,58,255),width=1)
    return im.filter(ImageFilter.SMOOTH)
def rope_tail(d,x,y,dirn):
    for i in range(3):
        d.line([(x+i*1.5*K,y),(x+dirn*6*K+i*K,y+14*K+i*2*K)],fill=(150,124,84,255),width=int(1.6*K))
def scroll(name,w,h,V):
    P=PAL[V]; W,H=(w+2*OX)*K,(h+2*OY)*K
    out=Image.new('RGBA',(W,H),(0,0,0,0))
    sh=Image.new('L',(W,H),0); ImageDraw.Draw(sh).rectangle([OX*K+5*K,OY*K+8*K,(OX+w)*K+3*K,(OY+h)*K+10*K],fill=170 if V=='A' else 230)
    s=Image.new('RGBA',(W,H),(15,10,5,0)); s.putalpha(sh.filter(ImageFilter.GaussianBlur(9*K))); out.alpha_composite(s)
    bx,by=OX*K,OY*K; ww,hh=w*K,h*K
    m=np.asarray(Image.new('RGB',(ww,hh),P['mount']),np.float32)+noise(hh,ww,3,1)[...,None]*14+noise(hh,ww,60,2)[...,None]*10
    out.alpha_composite(Image.fromarray(np.clip(m,0,255).astype('uint8')).convert('RGBA'),(bx,by))
    mb,mt=9*K,20*K; pw,ph=ww-2*mb,hh-2*mt
    yy,xx=np.mgrid[0:ph,0:pw]; e=np.minimum.reduce([xx,yy,pw-xx,ph-yy])/(26*K)
    st=np.clip(noise(ph,pw,90,5,30)*2.2,0,1)  # aging stains
    edge=np.clip(1-e,0,1)**1.8
    base=np.array(P['paper'],np.float32)
    pap=base+(noise(ph,pw,2,7,1)*16+noise(ph,pw,30,8,8)*10)[...,None]*(1 if V=='A' else .5)
    k=(st*.18+edge*.32)[...,None]*(1 if V=='A' else 1.4)
    pap=pap*(1-k)+np.array(P['stain' if V=='A' else 'edge'])*k
    pi=Image.fromarray(np.clip(pap,0,255).astype('uint8')); d=ImageDraw.Draw(pi,'RGBA'); r=random.Random(4)
    for _ in range(int(pw*ph/(2600*K*K))):
        x,y=r.random()*pw,r.random()*ph; L=r.uniform(5,16)*K; a=r.uniform(0,6.28)
        d.line([(x,y),(x+L*np.cos(a),y+L*np.sin(a))],fill=((130,100,60,r.randint(8,18)) if V=='A' else (255,250,235,r.randint(5,10))),width=1)
    out.alpha_composite(pi.filter(ImageFilter.GaussianBlur(.5)).convert('RGBA'),(bx+mb,by+mt))
    d=ImageDraw.Draw(out,'RGBA'); L=P['line']
    o1,o2=7*K,11*K
    d.rectangle([bx+mb+o1,by+mt+o1,bx+mb+pw-o1,by+mt+ph-o1],outline=L+(230,),width=int(1.6*K))
    d.rectangle([bx+mb+o2,by+mt+o2,bx+mb+pw-o2,by+mt+ph-o2],outline=L+(170,),width=max(1,int(.7*K)))
    R=rod(W,V=='C')
    for yv in (by-R.height//2+3*K, by+hh-R.height//2-3*K): out.alpha_composite(R,(0,yv))
    rope_tail(d,22*K,by+R.height//2,-1); rope_tail(d,W-26*K,by+R.height//2,1)
    out.save(f'a/scroll_{name}_{V}.png',optimize=True)
J={'drawer':(318,950),'search':(425,856),'place':(413,560),'skin':(300,540)}
for V in 'AC':
    for n,(w,h) in J.items(): scroll(n,w,h,V)
print('ok')
