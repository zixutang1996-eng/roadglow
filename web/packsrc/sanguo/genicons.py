# v1.1 POI sprite: black ink-blob base lifted from the targets + WHITE category glyph (pale rim in dark).
# Generates the 分久必合 / Three Kingdoms skin-pack assets into out/ (run from web/packsrc/sanguo).
# Rough ink effects are baked into PNG/WebP so the app never runs live SVG filters.
from PIL import Image, ImageDraw, ImageFilter, ImageOps
import numpy as np, random, json, os, sys, shutil
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)),'src')); sys.path.insert(0,'.')
from tex2 import brush
OUT='../out'; os.makedirs(OUT,exist_ok=True)
from PIL import Image, ImageFilter
# ---------------- map sprite: ink-blob POI icons + paper pattern ----------------
src=json.load(open('../../../public/sprites/west_light@2x.json')); sp=Image.open('../../../public/sprites/west_light@2x.png').convert('RGBA')
for mode in ('light','dark'):
    glyph=(255,255,255)
    blob=Image.open(f'{OUT}/dot0_light.webp').convert('RGBA').resize((56,56),Image.LANCZOS)
    red=Image.open(f'{OUT}/dotr.webp').convert('RGBA').resize((56,56),Image.LANCZOS)
    def rim(b):  # dark map: a pale rim keeps the black blob readable on black land
        c=Image.new('RGBA',(60,60),(0,0,0,0)); a=b.getchannel('A').filter(ImageFilter.MaxFilter(5))
        r=Image.new('RGBA',b.size,(214,205,190,0)); r.putalpha(a.point(lambda v:int(v*.9))); c.alpha_composite(r,(2,2)); c.alpha_composite(b,(2,2)); return c
    def pad(b): c=Image.new('RGBA',(60,60),(0,0,0,0)); c.alpha_composite(b,(2,2)); return c
    blob=rim(blob) if mode=='dark' else pad(blob); red=rim(red) if mode=='dark' else pad(red)
    names=list(src); cells=[]; J={}
    for i,n in enumerate(names):
        r=src[n]; ic=sp.crop((r['x'],r['y'],r['x']+r['width'],r['y']+r['height']))
        a2=np.asarray(ic,np.float32); lum=a2[...,:3].mean(2); al2=a2[...,3]/255
        # the Frontier icons are dark glyphs on a light disc: keep only the dark glyph strokes
        gm=np.clip((lum-120)/70,0,1)*al2
        g=Image.fromarray((np.clip(gm*1.4,0,1)*255).astype('uint8')).resize((32,32),Image.LANCZOS)
        cell=(red if n in ('hospital','quest') else blob).copy()
        gl=Image.new('RGBA',(32,32),glyph+(0,)); gl.putalpha(g); cell.alpha_composite(gl,(14,14)); cells.append((n,cell))
    pap=Image.open(f'paper_{"A" if mode=="light" else "C"}.png').convert('RGB').resize((256,256))
    if mode=='light': pap=Image.fromarray(np.clip(np.asarray(pap,np.float32)*np.array([1.0,.975,.92])+np.array([4,2,0]),0,255).astype('uint8'))  # a touch warmer than mockup A
    Wd=10*64; Hd=64*((len(cells)+9)//10)+256
    sheet=Image.new('RGBA',(Wd,Hd),(0,0,0,0))
    for i,(n,c) in enumerate(cells):
        x,y=(i%10)*64,(i//10)*64; sheet.alpha_composite(c,(x+2,y+2)); J[n]=dict(x=x+2,y=y+2,width=60,height=60,pixelRatio=2)
    py=64*((len(cells)+9)//10); sheet.paste(pap.convert('RGBA'),(0,py)); J['paper']=dict(x=0,y=py,width=256,height=256,pixelRatio=2)
    sheet.save(f'{OUT}/icons_{mode}.png',optimize=True); json.dump(J,open(f'{OUT}/icons_{mode}.json','w'))
print('ok')
