from PIL import Image,ImageDraw,ImageFont
F=lambda s:ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',s)
names={'A':'Neon nav arrow','B':'Pin + circuit','C':'Chamfered compass','D':'West/Neon split compass','E':'Longhorn skull compass','F':'Road "R" monogram'}
def mask(sz,kind):
    m=Image.new('L',(sz*4,sz*4),0);d=ImageDraw.Draw(m);S=sz*4
    if kind=='circle':d.ellipse((0,0,S-1,S-1),fill=255)
    elif kind=='squircle':d.rounded_rectangle((0,0,S-1,S-1),radius=int(S*.36),fill=255)
    else:d.rounded_rectangle((0,0,S-1,S-1),radius=int(S*.18),fill=255)
    return m.resize((sz,sz),Image.LANCZOS)
def icon(k,sz,kind):
    im=Image.open(f'icon_{k}.png').convert('RGBA')
    # adaptive: visible area is inner 72/108 of canvas
    c=512*18/108;im=im.crop((c,c,512-c,512-c)).resize((sz,sz),Image.LANCZOS)
    im.putalpha(mask(sz,kind));return im
def wall(w,h,dark):
    g=Image.new('RGB',(w,h));d=ImageDraw.Draw(g)
    for y in range(h):
        t=y/h
        c=(int(20+30*t),int(24+20*t),int(48+40*t)) if dark else (int(236-30*t),int(226-10*t),int(240-20*t))
        d.line((0,y,w,y),fill=c)
    return g
for k in 'ABCDEF':
    W,H=1600,1000;s=Image.new('RGB',(W,H),(30,32,38));d=ImageDraw.Draw(s)
    d.text((40,24),f'Concept {k} — {names[k]}',font=F(40),fill='white')
    s.paste(Image.open(f'icon_{k}.png').convert('RGB'),(40,100))
    d.text((40,620),'full 108dp canvas (box = 66dp safe zone)',font=F(20),fill=(170,170,180))
    o=40+512*21/108;d.rectangle((o,100+512*21/108,o+512*66/108,100+512*87/108),outline=(255,255,255))
    x=600
    for kind in ['circle','squircle','rounded']:
        im=icon(k,192,kind);s.paste(im,(x,100),im);d.text((x,300),kind,font=F(20),fill=(200,200,210))
        sm=icon(k,48,kind);s.paste(sm,(x+72,340),sm);x+=230
    d.text((600,400),'192px masks / 48px actual size',font=F(20),fill=(170,170,180))
    for i,dark in enumerate([False,True]):
        ph=wall(440,520,dark);pd=ImageDraw.Draw(ph);fg=(255,255,255) if dark else (30,30,40)
        for r in range(2):
            for c in range(4):
                kk=k if (r,c)==(0,1) else None;px,py=30+c*105,40+r*130
                if kk:
                    im=icon(k,72,'squircle');ph.paste(im,(px,py),im);pd.text((px+2,py+80),'RoadGlow',font=F(15),fill=fg)
                else:
                    pd.rounded_rectangle((px,py,px+72,py+72),radius=26,fill=(200,200,210) if not dark else (70,78,100))
        dock=520-110;pd.rounded_rectangle((15,dock,425,dock+90),radius=30,fill=(255,255,255,) if not dark else (40,46,64))
        im=icon(k,72,'circle');ph.paste(im,(40,dock+9),im)
        for c in range(1,4):pd.ellipse((40+c*100,dock+9,112+c*100,dock+81),fill=(190,190,200) if not dark else (70,78,100))
        s.paste(ph,(600+i*480,460))
    s.save(f'sheet_{k}.png')
