# Lift the rider + ground wash from the drawer target (strict source of truth) as an alpha image (light ink / dark pale).
import cv2,numpy as np
T='src/targets/'
import glob; f=[p for p in glob.glob(T+'*') if 'drawer_zh' in p or 'PZQ7VS' in p][0]
im=cv2.imread(f).astype(np.float32)
c=im[1458:1946,74:592]
paper=np.array([212,226,234.],np.float32)  # BGR approx paper
pm=np.median(c[:40].reshape(-1,3),0)
lum=c.mean(2); a=np.clip((pm.mean()-lum-7)/(pm.mean()-37),0,1)
# feather crop edges so the wash fades into the scroll
h,w=a.shape; yy=np.linspace(0,1,h)[:,None]; xx=np.linspace(0,1,w)[None,:]
fade=np.clip(yy/0.015,0,1)*np.clip((1-yy)/0.03,0,1)*np.clip(xx/0.05,0,1)*np.clip((1-xx)/0.06,0,1)
a=(a*fade); a[:110,470:]=0
for mode,col in (('light',(34,37,40)),('dark',(190,205,214))):
  o=np.zeros((h,w,4),np.uint8); o[...,:3]=col; o[...,3]=(a*255).astype(np.uint8)
  cv2.imwrite(f'out/rider_{mode}.webp',o,[cv2.IMWRITE_WEBP_QUALITY,90])
print(f,a.shape)
