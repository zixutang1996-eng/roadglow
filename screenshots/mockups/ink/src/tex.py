from PIL import Image, ImageFilter, ImageDraw
import random, numpy as np
def paper(name, base, dark=False, seed=1):
    random.seed(seed); np.random.seed(seed); S=256
    a=np.random.normal(0,1,(S,S)); 
    img=Image.fromarray(((a*30)+128).clip(0,255).astype('uint8')).filter(ImageFilter.GaussianBlur(1.2))
    n=(np.array(img).astype(float)-128)/128
    big=Image.fromarray(((np.random.normal(0,1,(32,32))*40)+128).clip(0,255).astype('uint8')).resize((S,S),Image.BICUBIC)
    # make tileable-ish by wrapping blur
    n2=(np.array(big).astype(float)-128)/128
    arr=np.zeros((S,S,3))
    for i in range(3): arr[:,:,i]=base[i]+n*6+n2*7
    im=Image.fromarray(arr.clip(0,255).astype('uint8'))
    d=ImageDraw.Draw(im,'RGBA')
    for _ in range(70): # fibers
        x,y=random.random()*S,random.random()*S; L=random.uniform(4,18); ang=random.uniform(0,6.28)
        c=(255,255,255,random.randint(10,28)) if dark else (110,90,60,random.randint(10,26))
        d.line([(x,y),(x+L*np.cos(ang),y+L*np.sin(ang))],fill=c,width=1)
    im.save(f'paper_{name}.png',optimize=True)
def mountains(name, ink, seed=3, w=920, h=420):
    random.seed(seed)
    im=Image.new('RGBA',(w,h),(0,0,0,0))
    for layer,(alpha,base,amp,bl) in enumerate([(110,0.45,0.35,10),(160,0.62,0.28,5),(210,0.78,0.18,2.5)]):
        L=Image.new('L',(w,h),0); d=ImageDraw.Draw(L)
        pts=[(0,h)]; x=0; y=h*base
        peaks=[(random.uniform(0,w),random.uniform(60,220),random.uniform(0.35,0.9)) for _ in range(5)]
        for x in range(0,w+1,4):
            yy=h*base
            for px,pw,ph in peaks:
                yy-=h*amp*ph*max(0,1-abs(x-px)/pw)**1.6
            yy+=random.uniform(-2,2)
            pts.append((x,yy))
        pts.append((w,h)); d.polygon(pts,fill=255)
        # vertical gradient fade (ink wash fades downward)
        g=Image.linear_gradient('L').resize((w,h)); g=Image.eval(g,lambda v:255-int(v*0.6))
        L=Image.composite(L,Image.new('L',(w,h),0),g).filter(ImageFilter.GaussianBlur(bl))
        L=L.point(lambda v:int(v*alpha/255))
        col=Image.new('RGBA',(w,h),ink+(0,)); col.putalpha(L)
        im=Image.alpha_composite(im,col)
    im.save(f'mtn_{name}.png',optimize=True)
paper('A',(239,231,212)); paper('B',(232,220,192),seed=2); paper('C',(33,31,28),dark=True,seed=4)
mountains('A',(60,58,55)); mountains('B',(30,28,26),seed=5); mountains('C',(200,192,175),seed=7)
