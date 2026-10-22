from PIL import Image, ImageDraw, ImageFilter
import numpy as np, json, random
K=2; OX,OY=18,13
PAL={'A':dict(silk=(176,184,172),pat=(150,160,148),line=(120,96,70),paper='paper_A.png',pshade=(120,95,60)),
     'C':dict(silk=(52,58,64),pat=(70,78,84),line=(150,130,100),paper='paper_C.png',pshade=(0,0,0))}
def brocade(w,h,P,seed=1):
    im=Image.new('RGB',(w,h),P['silk']); d=ImageDraw.Draw(im)
    s=14*K
    for y in range(-s,h+s,s):
        for x in range(-s,w+s,s):
            ox=(s//2 if (y//s)%2 else 0)
            cx,cy=x+ox,y
            d.polygon([(cx,cy-5*K),(cx+5*K,cy),(cx,cy+5*K),(cx-5*K,cy)],outline=P['pat'])
            d.ellipse([cx-1.3*K,cy-1.3*K,cx+1.3*K,cy+1.3*K],fill=P['pat'])
    a=np.asarray(im,np.float32)
    # silk sheen: fine horizontal weave + soft vertical gradient
    rng=np.random.default_rng(seed); weave=rng.normal(0,1,(h,1))*3+rng.normal(0,1,(1,w))*2
    a+=weave[...,None]
    return Image.fromarray(np.clip(a,0,255).astype('uint8'))
def tile(path,w,h):
    t=Image.open(path).convert('RGB'); t=t.resize((t.width*K//2*2,t.height*K//2*2))
    im=Image.new('RGB',(w,h))
    for x in range(0,w,t.width):
        for y in range(0,h,t.height): im.paste(t,(x,y))
    return im
def rod(L):
    # rod length L px (2x), height 18*K, turned end caps
    H=26*K; im=Image.new('RGBA',(L,H),(0,0,0,0)); a=np.zeros((H,L,4),np.float32)
    def prof(x):  # half height of silhouette at x
        cap=16*K
        d=min(x,L-1-x)
        if d<cap:
            u=d/cap  # 0 at tip
            return (6+7*np.sin(min(1,u*1.3)*np.pi/1.0)**.6 + (3 if .55<u<.7 else 0))*K if u<.92 else 7.5*K
        return 8.5*K
    base=np.array([92,44,26]); 
    for x in range(L):
        hh=prof(x); cy=H/2
        for y in range(max(0,int(cy-hh)),min(H,int(cy+hh)+1)):
            v=(y-cy)/max(hh,1)
            shade=1-0.55*v*v
            spec=np.exp(-((v+.45)/.12)**2)*0.9
            c=base*shade*(0.9+0.1*np.sin(x*.05))+spec*np.array([255,220,180])
            d=min(x,L-1-x)
            if d<16*K: c=c*0.75+np.array([20,10,5])
            a[y,x,:3]=np.clip(c,0,255); a[y,x,3]=255
    # carved rings
    for d in (int(16*K*.92),int(16*K*.55),int(16*K*.7)):
        for x in (d,L-1-d):
            a[:,max(0,x-1):x+1,:3]*=.45
    im=Image.fromarray(a.astype('uint8'),'RGBA').filter(ImageFilter.SMOOTH)
    return im
def scroll(name,w,h,V):
    P=PAL[V]; W,H=(w+2*OX)*K,(h+2*OY)*K
    out=Image.new('RGBA',(W,H),(0,0,0,0))
    # drop shadow
    sh=Image.new('L',(W,H),0); ImageDraw.Draw(sh).rectangle([OX*K+6*K,OY*K+8*K,(OX+w)*K+2*K,(OY+h)*K+10*K],fill=150 if V=='A' else 220)
    sh=sh.filter(ImageFilter.GaussianBlur(9*K)); s=Image.new('RGBA',(W,H),(30,20,10,0)); s.putalpha(sh); out.alpha_composite(s)
    # silk mounting
    bx,by=OX*K,OY*K; silk=brocade(w*K,h*K,P).convert('RGBA'); out.alpha_composite(silk,(bx,by))
    # paper inset (天地 wider top/bottom)
    ml,mt=14*K,28*K; pw,ph=w*K-2*ml,h*K-2*mt
    rng=np.random.default_rng(3)
    base=np.array((240,232,213) if V=='A' else (36,33,30),np.float32)
    lo=np.asarray(Image.fromarray((rng.random((ph//40+2,pw//40+2))*255).astype('uint8')).resize((pw,ph),Image.BICUBIC),np.float32)/255-.5
    fi=np.asarray(Image.fromarray((rng.random((ph,pw))*255).astype('uint8')).filter(ImageFilter.GaussianBlur(1.2)),np.float32)/255-.5
    pap=base+(lo*10+fi*14)[...,None]*(1 if V=='A' else .6)
    yy,xx=np.mgrid[0:ph,0:pw]; e=np.minimum.reduce([xx,yy,pw-xx,ph-yy])/(18*K)
    shade=np.clip(1-e,0,1)**2*(.16 if V=='A' else .35)
    pap=pap*(1-shade[...,None])+np.array(P['pshade'])*shade[...,None]
    pi=Image.fromarray(np.clip(pap,0,255).astype('uint8')).convert('RGBA'); d=ImageDraw.Draw(pi,'RGBA')
    r=random.Random(5)
    for _ in range(int(pw*ph/(2200*K*K))):  # fibres
        x,y=r.random()*pw,r.random()*ph; L=r.uniform(6,22)*K; a=r.uniform(0,6.28)
        d.line([(x,y),(x+L*np.cos(a),y+L*np.sin(a))],fill=((140,115,80,r.randint(8,20)) if V=='A' else (255,250,235,r.randint(6,16))),width=1)
    pi=pi.filter(ImageFilter.GaussianBlur(.5)); out.alpha_composite(pi,(bx+ml,by+mt))
    d=ImageDraw.Draw(out,'RGBA')
    # thin inner border lines (on silk, around paper) + paper bevel line
    d.rectangle([bx+ml-3*K,by+mt-3*K,bx+ml+pw+3*K,by+mt+ph+3*K],outline=P['line']+(200,),width=max(1,int(.8*K)))
    d.rectangle([bx+ml,by+mt,bx+ml+pw,by+mt+ph],outline=(0,0,0,60),width=1)
    # rods
    R=rod((w+2*OX)*K)
    out.alpha_composite(R,(0,by-R.height//2+4*K)); out.alpha_composite(R,(0,by+h*K-R.height//2-4*K))
    # hanging cord on top rod
    out.save(f'a/scroll_{name}_{V}.png',optimize=True)
J={'drawer':(318,950),'search':(425,856),'place':(413,440),'skin':(300,520)}
for V in 'AC':
    for n,(w,h) in J.items(): scroll(n,w,h,V)
json.dump({'ox':OX,'oy':OY},open('a/scroll.json','w')); print('ok')
