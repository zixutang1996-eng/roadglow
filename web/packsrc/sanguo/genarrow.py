# v1.1 "me" marker: ink-wash bow arrow (broadhead + hint of shaft + fletching), points up (= heading), pale halo.
import cv2, numpy as np
from PIL import Image
src=cv2.imread('src/arrow_ink.jpg',0).astype(np.float32)
head=src[40:400]; shaft=src[400:450]; flet=cv2.resize(src[720:990],(1024,170),interpolation=cv2.INTER_AREA)
a=np.vstack([head,shaft,flet]); a=np.clip((235-a)/170,0,1)
ys,xs=np.where(a>0.15); a=a[ys.min():ys.max()+1, xs.min():xs.max()+1]
a=cv2.resize(a,(int(a.shape[1]*1.75),int(a.shape[0]*0.8))); a=np.clip(a*1.15,0,1)
h,w=a.shape; S=max(h,w)+40; can=np.zeros((S,S),np.float32); can[(S-h)//2:(S-h)//2+h,(S-w)//2:(S-w)//2+w]=a
for name,px,ink,halo in [('puck_light',80,(30,27,25),(250,245,232)),('puck_dark',80,(236,228,212),(20,19,18))]:
    big=can; hal=cv2.GaussianBlur((cv2.dilate((big>0.2).astype(np.uint8),np.ones((31,31),np.uint8))).astype(np.float32),(0,0),10)*0.95
    A=np.maximum(big,hal*0.0)  # composite below
    rgb=np.zeros((S,S,3),np.float32); al=np.zeros((S,S),np.float32)
    rgb[:]=halo; al=hal
    rgb=rgb*(1-big[...,None])+np.array(ink)[None,None]*big[...,None]; al=np.clip(al*(1-big)+big,0,1)
    im=Image.fromarray(np.dstack([rgb,al*255]).astype(np.uint8),'RGBA').resize((px*2,px*2),Image.LANCZOS)
    im.save(f'out/{name}.png',optimize=True)
print('ok')
