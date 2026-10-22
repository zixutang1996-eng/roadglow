# v1.1: ink windows, blobs, seals and ornaments lifted straight from the user's 7 target images (src/targets, 2x px).
# Text/glyphs inside each element are inpainted away; outside the ink edge becomes transparent. Run after genink.py.
import cv2, numpy as np, json, os
from PIL import Image
T='src/targets/'; OUT='out'; os.makedirs(OUT,exist_ok=True)
IM={k:cv2.imread(T+k+'.png') for k in ('drawer_zh','place_light','place_dark','search','skinswitch','nav')}
def comp_largest(m,by='area'):
    n,lab,st,_=cv2.connectedComponentsWithStats(m.astype(np.uint8),8)
    if n<2: return m
    v=st[1:,cv2.CC_STAT_AREA] if by=='area' else st[1:,cv2.CC_STAT_WIDTH]*st[1:,cv2.CC_STAT_HEIGHT]
    i=1+np.argmax(v); return lab==i
def fill(m):
    inv2=np.pad((~m).astype(np.uint8)*255,1,constant_values=255); h,w=inv2.shape; f=np.zeros((h+2,w+2),np.uint8)
    cv2.floodFill(inv2,f,(0,0),0); return m|(inv2[1:-1,1:-1]>0)
def K(r): return cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(2*r+1,2*r+1))
def save(rgb,alpha,name):
    a=np.dstack([cv2.cvtColor(rgb,cv2.COLOR_BGR2RGB),alpha]).astype(np.uint8)
    Image.fromarray(a,'RGBA').save(f'{OUT}/{name}',**({'quality':90,'method':6} if name.endswith('.webp') else {'optimize':True}))
def soft(m,r=1.2): return np.clip(cv2.GaussianBlur(m.astype(np.float32)*255,(0,0),r),0,255)
def ring(src,rect,thr=118,spike=6,dark_bg=False,cl=3,bw=None):
    x0,y0,x1,y1=rect; c=IM[src][y0:y1,x0:x1].copy(); g=cv2.cvtColor(c,cv2.COLOR_BGR2GRAY).astype(np.int16)
    ink=(g>255-thr) if dark_bg else (g<thr)
    inkc=cv2.morphologyEx(ink.astype(np.uint8),cv2.MORPH_CLOSE,K(cl))>0
    blob=fill(comp_largest(inkc,'bbox'))
    blob=cv2.morphologyEx(blob.astype(np.uint8),cv2.MORPH_OPEN,K(spike))>0; blob=fill(comp_largest(blob))
    cs,_=cv2.findContours(blob.astype(np.uint8),cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_NONE); hm=np.zeros(blob.shape,np.uint8)
    cv2.fillPoly(hm,[cv2.convexHull(max(cs,key=cv2.contourArea))],1); blob=hm>0
    h,w=blob.shape; bw=bw or max(6,int(min(h,w)*.11))
    core=cv2.erode(blob.astype(np.uint8),K(bw))>0; band=blob&~core
    r=band.copy(); hasink=band&cv2.dilate(ink.astype(np.uint8),K(1)).astype(bool)
    inkcol=np.median(c[hasink].reshape(-1,3),axis=0) if hasink.any() else np.array([50,50,50])
    c=c.copy(); c[band&~hasink]=inkcol
    # interior: clean paper (median colour + faint low-freq mottling from the source paper itself)
    med=np.median(c[core].reshape(-1,3),axis=0) if core.any() else np.array([215,228,236])
    rng=np.random.default_rng(len(src)+x0); n=cv2.GaussianBlur(rng.normal(0,1,(h,w)).astype(np.float32),(0,0),6); n=n/ (n.std()+1e-6)*3.5
    paper=np.clip(med[None,None,:]+n[...,None],0,255).astype(np.uint8)
    wpaper=soft(~r&blob,1.5)[...,None]/255.
    keep=r[...,None]*1.0; out=c*keep+paper*(1-keep)
    # soften transition inside the band
    m=soft(r,1.0)[...,None]/255.; out=c*m+paper*(1-m)
    return out.astype(np.uint8),blob,r
def recolor_dark(c,blob,r):
    # light element -> dark: paper -> lacquer black, ink ring -> pale ink (matches the dark target search bar)
    f=c.astype(np.float32); l=f.mean(2,keepdims=True)
    out=np.where(r[...,None], (190,205,214)+(l-60)*.25, (27,29,31)+(l-215)*.55)  # BGR
    return np.clip(out,0,255).astype(np.uint8)
def red(src,rect):
    x0,y0,x1,y1=rect; c=IM[src][y0:y1,x0:x1].copy(); b,g_,rr=[c[...,i].astype(np.int16) for i in range(3)]
    m=(rr-g_>55)&(rr>110); m=cv2.morphologyEx(m.astype(np.uint8),cv2.MORPH_CLOSE,K(2))>0; m=fill(comp_largest(m))
    glyph=m&~((rr-g_>55)&(rr>110)); glyph=cv2.dilate(glyph.astype(np.uint8),K(2))>0
    c=cv2.inpaint(c,(glyph&m).astype(np.uint8)*255,6,cv2.INPAINT_TELEA); return c,m
def dot(src,rect,thr=95):
    x0,y0,x1,y1=rect; c=IM[src][y0:y1,x0:x1].copy(); g=cv2.cvtColor(c,cv2.COLOR_BGR2GRAY)
    m=fill(comp_largest(g<thr)); m=cv2.morphologyEx(m.astype(np.uint8),cv2.MORPH_OPEN,K(2))>0; m=fill(comp_largest(m))
    gl=m&(g>=thr); gl=cv2.dilate(gl.astype(np.uint8),K(2))>0
    c=cv2.inpaint(c,(gl&m).astype(np.uint8)*255,6,cv2.INPAINT_TELEA); return c,m
def raw(src,rect,mode='dark',thr=150):
    x0,y0,x1,y1=rect; c=IM[src][y0:y1,x0:x1].copy(); g=cv2.cvtColor(c,cv2.COLOR_BGR2GRAY).astype(np.float32)
    a=np.clip((thr+40-g)/80,0,1) if mode=='dark' else np.ones_like(g); return c,(a*255)
meta={}
def put(name,c,m,slices=None):
    save(c,soft(m),name+'.webp'); meta[name]=dict(w=c.shape[1],h=c.shape[0],slice=slices)
    return c,m
# ---- ring windows (light), dark recolour; the dark search bar is the real dark target
for name,src,rect,sl in [('search','place_light',(8,72,912,228),(40,70,40,70)),('banner','nav',(0,66,918,352),(52,70,52,70)),
    ('then','nav',(14,362,388,470),(30,40,30,40)),('navcard','nav',(8,1742,920,2018),(56,80,56,80)),
    ('fab','nav',(768,1258,902,1398),None),('fab2','nav',(768,1408,902,1548),None),('speed','nav',(18,1545,172,1700),None),
    ('chip','skinswitch',(176,224,360,322),(22,40,22,40)),('chip2','skinswitch',(374,224,560,322),(22,40,22,40)),
    ('chips','search',(118,1336,280,1424),(22,36,22,36)),('xbtn','skinswitch',(696,518,826,664),None)]:
    thin=sl is None or name in('then','chips'); c,blob,r=ring(src,rect,spike=9 if name in('banner','navcard','then') else 5,thr=150 if thin else 118,cl=7 if thin else 3); put(name+'_light',c,blob,sl); put(name+'_dark',recolor_dark(c,blob,r),blob,sl)
c,blob,r=ring('place_dark',(8,72,912,228),dark_bg=True); put('search_dark',c,blob,(40,70,40,70))
# ---- red blobs / seals
for name,src,rect in [('fabr','nav',(762,1106,902,1244)),('stop','nav',(628,1816,872,1948)),('dotr','search',(112,456,206,552)),('dotr2','skinswitch',(338,716,432,808))]:
    c,m=red(src,rect); put(name,c,m)
for name,src,rect in [('seal_dq','drawer_zh',(476,208,552,284)),('seal_xl','place_light',(788,116,860,188)),('seal_cat','place_light',(110,934,184,1008)),('seal_sm','skinswitch',(754,728,822,796)),('seal_dir','nav',(814,176,862,236))]:
    x0,y0,x1,y1=rect; cc=IM[src][y0:y1,x0:x1].copy(); b,g_,rr=[cc[...,i].astype(np.int16) for i in range(3)]
    m=fill(comp_largest(cv2.morphologyEx(((rr-g_>40)|(rr>200)&(g_<200)).astype(np.uint8),cv2.MORPH_CLOSE,K(3))>0))
    put(name,cc,m)
# blank red seal for the category seal text (glyph inpainted)
c,m=red('place_light',(110,934,184,1008)); put('seal_blank',c,m)
# ---- black ink dots (icon bases)
for i,(src,rect) in enumerate([('search',(112,632,206,728)),('search',(112,794,206,888)),('search',(112,956,206,1052)),('search',(112,1120,206,1214)),
    ('skinswitch',(338,858,432,952)),('skinswitch',(338,1000,432,1092)),('skinswitch',(338,1140,432,1234)),('place_light',(138,1480,202,1544))]):
    c,m=dot(src,rect); put(f'dot{i}_light',c,m)
    put(f'dot{i}_dark',recolor_dark(c,~m,m) ,m)
# ---- ornaments: thick dry-brush dividers, title rule with diamond, mountain band
for name,src,rect in [('div0','search',(120,404,818,434)),('div1','drawer_zh',(130,660,575,702)),('rule','drawer_zh',(100,344,590,376)),('ruleP','place_light',(118,1018,810,1054))]:
    c,a=raw(src,rect); 
    if name.startswith('rule'):  # keep the red dot in the diamond
        b,g_,rr=[c[...,i].astype(np.int16) for i in range(3)]; a=np.maximum(a,((rr-g_>50)*255).astype(np.float32))
    save(c,a,name+'_light.png'); dc=c.copy(); dc[:]=(190,205,214); 
    if name.startswith('rule'): dc[(rr-g_>50)]=c[(rr-g_>50)]
    save(dc,a*.9,name+'_dark.png'); meta[name]=dict(w=c.shape[1],h=c.shape[0])
x0,y0,x1,y1=(91,1226,834,1452); c=IM['place_light'][y0:y1,x0:x1].copy(); g=cv2.cvtColor(c,cv2.COLOR_BGR2GRAY).astype(np.float32)
a=np.clip((226-g)/90,0,1); a[:, :30]*=np.linspace(0,1,30)[None]; a[:, -30:]*=np.linspace(1,0,30)[None]; a[:40]*=np.linspace(0,1,40)[:,None]
save(np.full_like(c,(110,118,124)),a*255,'mtnband_light.webp'); save(np.full_like(c,(70,76,82)),a*255*.9,'mtnband_dark.webp')
json.dump(meta,open(f'{OUT}/target_meta.json','w'),indent=0); print('ok',len(meta))
