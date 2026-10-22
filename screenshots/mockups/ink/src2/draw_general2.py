from general import *
import sys
cv=Canvas(); red=Canvas()
def dot(c,x,y,rx,ry,tone,blur=1.2,rot=None):
    m=Image.new('L',(W*S,H*S),0); ImageDraw.Draw(m).ellipse([(x-rx)*S,(y-ry)*S,(x+rx)*S,(y+ry)*S],fill=255); c.add(m.filter(ImageFilter.GaussianBlur(blur*S)),tone)
def poly(c,pts,tone,blur=1):
    m=Image.new('L',(W*S,H*S),0); ImageDraw.Draw(m).polygon([(x*S,y*S) for x,y in pts],fill=255); c.add(m.filter(ImageFilter.GaussianBlur(blur*S)),tone)
WET=dict(dry=.35,core=.9,nb=40,mod=.12)
# ===== HORSE (galloping right): anatomical silhouette + tonal wash =====
SIL=[(1004,266),(990,240),(962,206),(936,178),(926,130),(914,168),(902,170),(870,178),(835,200),(800,232),(770,268),(740,292),
(690,306),(630,312),(560,306),(500,296),(450,300),(420,312),(395,340),(382,380),(388,420),(395,450),(372,500),(340,546),(302,590),
(276,610),(252,628),(238,642),(264,646),(284,630),(302,622),(328,600),(362,562),(400,516),(430,482),(456,466),(500,478),(560,490),
(640,492),(720,488),(780,472),(800,484),(832,522),(864,556),(906,590),(934,608),(956,626),(978,646),(994,632),(972,612),(950,594),
(918,572),(884,540),(856,502),(846,466),(858,420),(864,372),(868,334),(884,300),(906,276),(928,262),(952,268),(978,280),(998,284),(1006,276)]
# far legs first (lighter grey)
def leg(pts,ws,tone,seed):
    stroke(cv,spline(pts,n=10),ws,tone,seed=seed,taper=(.01,.01),dry=.3,core=1,nb=0,mod=.03)
    h=pts[-1]; p=pts[-2]; ang=math.atan2(h[1]-p[1],h[0]-p[0])
    poly(cv,[(h[0]+math.cos(ang+1.4)*9,h[1]+math.sin(ang+1.4)*9),(h[0]+math.cos(ang)*15,h[1]+math.sin(ang)*15),(h[0]+math.cos(ang-1.4)*9,h[1]+math.sin(ang-1.4)*9)],min(1,tone*1.1),1)
leg([(782,450),(790,520),(798,560),(772,592),(752,602),(738,620)],[46,30,20,12,16,10],.55,21)
leg([(520,440),(514,512),(500,560),(530,604),(556,628),(570,646)],[62,40,20,12,16,10],.55,22)
# silhouette mask & tone map
m=Image.new('L',(W*S,H*S),0); ImageDraw.Draw(m).polygon([(x*S,y*S) for x,y in spline(SIL+[SIL[0]],n=6)],fill=255)
M=np.asarray(m.filter(ImageFilter.GaussianBlur(1.2*S)),np.float32)/255
yy,xx=np.mgrid[0:H*S,0:W*S]/S
def g(cx,cy,sx,sy,a): return a*np.exp(-(((xx-cx)/sx)**2+((yy-cy)/sy)**2))
T=.12+g(850,330,90,140,.55)+g(950,235,60,50,.55)+g(430,390,70,90,.5)+g(640,320,220,30,.25)+np.clip((yy-500)/70,0,1)*.75
T=np.clip(T,0,.97)
# wet edge darkening
E=np.asarray(m.filter(ImageFilter.GaussianBlur(7*S)),np.float32)/255; edge=np.clip((M-E)*2.2,0,1)*.45
nz=np.asarray(Image.fromarray((np.random.default_rng(3).random((H//5,W//5))*255).astype('uint8')).resize((W*S,H*S),Image.BICUBIC).filter(ImageFilter.GaussianBlur(4*S)),np.float32)/255
A=np.clip(M*(T+edge)*(.85+.3*(nz-.5)*2),0,1); cv.D=1-(1-cv.D)*(1-A)
# 飞白: paper streaks through the barrel and neck (dry brush lifting)
fb=Canvas()
stroke(fb,spline([(760,420),(680,430),(580,430),(500,410)],n=20),[30,40,30,20],.45,seed=81,taper=(.1,.3),dry=1.5,core=0,nb=60)
stroke(fb,spline([(780,300),(820,250),(870,200)],n=14),[40,34,20],.6,seed=82,taper=(.1,.4),dry=1.2,core=0,nb=40)
cv.D*=1-fb.D*M
# confident dark accents
stroke(cv,spline([(902,168),(855,178),(805,224),(765,272),(730,298)],n=18),[16,22,18,10,4],.95,seed=6,taper=(.03,.3),dry=.5,core=.8,nb=30)
stroke(cv,spline([(950,194),(985,230),(1004,262)],n=12),[10,9,7],.9,seed=7,taper=(.1,.2),core=.9,nb=8)
def hole(x,y,rx,ry,k=.9):
    m=Image.new('L',(W*S,H*S),0); ImageDraw.Draw(m).ellipse([(x-rx)*S,(y-ry)*S,(x+rx)*S,(y+ry)*S],fill=255); cv.D*= 1-np.asarray(m.filter(ImageFilter.GaussianBlur(S)),np.float32)/255*k
dot(cv,950,214,5,3.5,1,.6); hole(994,264,4,2.5,.7)
stroke(cv,[(930,174),(942,138),(946,124)],[10,7,2],.85,seed=88,taper=(.01,.3),core=1,nb=4)
# mane: flying back, dry brush
for i,(x,y) in enumerate([(898,168),(870,174),(842,190),(814,214),(788,240),(764,268)]):
    stroke(cv,spline([(x,y),(x-40,y-34-i*3),(x-95-i*4,y-46-i*6)],n=18),[30-i*2,24,6],.95,seed=31+i,taper=(.02,.55),dry=1.1,core=.55,nb=60,mod=.25)
# tail: 2-3 sweeping 飞白 strokes
for i,pts in enumerate([[(430,318),(350,300),(260,320),(190,372)],[(426,322),(340,330),(270,372),(230,430)],[(432,314),(360,270),(280,262),(200,286)]]):
    stroke(cv,spline(pts,n=22),[46-i*8,36,20,6],.8,seed=41+i,taper=(.03,.5),dry=1.3,core=.3,nb=100,mod=.25)
# ===== RIDER (armoured, leaning forward) =====
# cape: one long rippling stroke behind the rider
stroke(cv,spline([(684,150),(610,118),(530,124),(460,150),(390,140),(340,170)],n=20),[30,62,72,60,36,8],.42,seed=51,taper=(.02,.35),dry=1.0,core=.75,nb=70,mod=.1)
stroke(cv,spline([(684,152),(600,122),(520,128),(452,156),(386,146)],n=20),[8,10,8,6,2],.8,seed=52,taper=(.05,.4),dry=1.1,core=.6,nb=20)
# armoured rider silhouette
RID=[(722,74),(742,86),(750,104),(752,116),(744,128),(740,138),(760,160),(764,200),(750,240),(738,270),(752,300),(764,330),(762,362),(754,410),(772,446),(780,458),(730,458),(724,412),(730,374),(684,344),(628,322),(612,300),(616,250),(630,192),(662,150),(706,132),(700,98)]
m=Image.new('L',(W*S,H*S),0); ImageDraw.Draw(m).polygon([(x*S,y*S) for x,y in spline(RID+[RID[0]],n=6)],fill=255)
Mr=np.asarray(m.filter(ImageFilter.GaussianBlur(1.1*S)),np.float32)/255
Tr=.82+g(690,200,40,50,-.25)
cv.D=1-(1-cv.D)*(1-np.clip(Mr*Tr,0,1))
# lamellar armour: light dry streaks lifted out of the torso
fb=Canvas()
for i,y in enumerate((186,206,226,246)): stroke(fb,[(636+i*2,y),(700,y+2),(748-i*3,y-2)],7,.55,seed=90+i,taper=(.2,.3),dry=1.0,core=.3,nb=14)
cv.D*=1-fb.D*Mr
stroke(cv,[(626,268),(742,276)],6,1,seed=95,core=1,nb=4)  # belt
dot(cv,700,158,26,16,1,1.4)  # pauldron
# head with helmet (looking forward)
stroke(cv,spline([(698,98),(724,70),(754,96)],n=10),[10,12,10],1,seed=58,taper=(.1,.1),core=1,nb=6)
hole(742,110,4,2,.5)
stroke(cv,[(724,72),(726,48)],[6,3],1,seed=59,core=1,nb=0)
stroke(red,spline([(726,50),(690,30),(640,30),(590,50)],n=14),[18,15,4],.95,seed=60,taper=(.05,.5),dry=1.0,core=.35,nb=40)
# spear line
sp=lambda x:(x,372-280*(x-400)/760)
# rear arm (behind spear) and fore arm gripping
stroke(cv,spline([(690,160),(660,212),(668,262)],n=10),[26,22,18],.85,seed=62,taper=(.05,.1),core=1,nb=8)
stroke(cv,[sp(400+i*7.4) for i in range(101)],[9,8,7,6],1,seed=63,taper=(.02,.02),core=1,dry=.1,nb=10,mod=.04)
stroke(cv,spline([(716,162),(766,200),(812,218)],n=10),[28,24,18],.92,seed=61,taper=(.05,.1),core=1,nb=8)
dot(cv,812,219,11,10,1); dot(cv,668,264,10,10,.9)
tip=sp(1160); poly(cv,[(tip[0]-8,tip[1]+2),(tip[0]+48,tip[1]-22),(tip[0]-2,tip[1]+14)],1,.8)
for i in range(3): stroke(red,spline([sp(1150),(1130-i*10,124+i*10),(1100-i*18,150+i*16)],n=10),[12-i*2,9,3],.92,seed=64+i,taper=(.05,.5),dry=.8,core=.5,nb=20)
# ground: one dry stroke
stroke(cv,spline([(140,660),(500,650),(900,662),(1150,656)],n=30),[18,14,10,4],.25,seed=70,taper=(.05,.6),dry=1.3,core=.2,nb=60)
def compose(path,ink=(22,19,17),rc=(170,40,30),bg=None,scale=1):
    a=Image.fromarray((np.clip(cv.D,0,1)*255).astype('uint8')); r=Image.fromarray((np.clip(red.D,0,1)*255).astype('uint8'))
    im=Image.new('RGBA',a.size,ink+(0,)); im.putalpha(a); ri=Image.new('RGBA',a.size,rc+(0,)); ri.putalpha(r)
    im=Image.alpha_composite(im,ri).resize((int(W*scale),int(H*scale)),Image.LANCZOS)
    if bg: b=Image.new('RGBA',im.size,bg+(255,)); im=Image.alpha_composite(b,im)
    im.save(path)
tag=sys.argv[1] if len(sys.argv)>1 else 'x'
compose(f'/tmp/ink_gen_{tag}.png',bg=(241,233,214),scale=.6)
compose('a/general_A.png',scale=.5); compose('a/general_C.png',ink=(226,216,196),rc=(206,84,60),scale=.5)
compose('../v2/ink_v2_general.png',bg=(241,233,214),scale=1)

