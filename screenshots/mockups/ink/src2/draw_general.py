from general import *
cv=Canvas(); red=Canvas()
L=lambda a,b:(lambda t:a+(b-a)*t)
# --- horse body mass ---
body=spline([(1000,268),(985,240),(935,182),(905,164),(855,174),(800,220),(760,268),(722,298),(650,318),(560,322),(470,304),(410,316),(374,370),(382,440),(422,488),(480,482),(560,500),(680,500),(782,490),(842,470),(860,410),(878,340),(905,284),(940,272),(978,288),(996,284),(1000,268)],n=12)
wash(cv,body,.2,blur=4,wet=.45,seed=1)
# shadow masses: neck underside / chest, belly, hindquarter
wash(cv,spline([(940,272),(905,284),(870,370),(842,468),(800,470),(815,400),(845,320),(890,270),(940,272)],n=10),.45,blur=10,wet=.2,seed=2)
wash(cv,spline([(422,488),(382,440),(374,370),(410,330),(450,350),(470,420),(460,480),(422,488)],n=10),.5,blur=9,wet=.25,seed=3)
wash(cv,spline([(480,482),(560,500),(680,500),(760,492),(700,470),(560,470),(480,482)],n=10),.45,blur=8,seed=4)
# head dark
wash(cv,spline([(1000,268),(985,240),(935,182),(918,196),(950,240),(975,282),(1000,268)],n=10),.6,blur=3,wet=.3,seed=5)
# contour strokes (economy: few confident strokes)
stroke(cv,spline([(905,166),(855,174),(800,220),(760,268),(722,298)],n=20),20,.9,seed=11,taper=(.05,.4),dry=.5)
stroke(cv,spline([(712,302),(640,320),(560,322),(470,304),(412,316),(378,368)],n=20),12,.75,seed=12,taper=(.1,.3),dry=.6)
stroke(cv,spline([(930,180),(965,215),(992,248),(1000,268)],n=14),10,.95,seed=13,taper=(.15,.2))
stroke(cv,spline([(996,284),(965,290),(935,274),(905,286)],n=12),9,.9,seed=14,taper=(.1,.35))
stroke(cv,spline([(900,290),(872,360),(856,420),(842,466)],n=12),16,.7,seed=15,taper=(.1,.3))
stroke(cv,spline([(560,498),(680,502),(780,490)],n=12),8,.55,seed=16,taper=(.3,.3),dry=.8)
stroke(cv,spline([(906,166),(896,140),(890,122)],n=8),11,1,seed=17,taper=(.05,.7),core=.8)
stroke(cv,spline([(918,170),(916,146),(915,132)],n=8),9,.85,seed=18,taper=(.05,.7),core=.8)
d=ImageDraw.Draw(m:=Image.new('L',(W*S,H*S),0)); d.ellipse([928*S,196*S,942*S,206*S],fill=255); d.ellipse([986*S,256*S,996*S,264*S],fill=200); cv.add(m.filter(ImageFilter.GaussianBlur(S)),1)
# --- legs: thick upper, slender cannon, knobby joints ---
def leg(pts,w0,w1,tone,seed):
    def wf(t): return (w0+(w1-w0)*min(1,t*1.8))*(1+.25*math.exp(-((t-.45)/.06)**2))
    stroke(cv,spline(pts,n=14),wf,tone,seed=seed,taper=(.01,.03),dry=.3,core=1,nb=14,mod=.04)
    for j in []:
        m=Image.new('L',(W*S,H*S),0); r=w1*.75; ImageDraw.Draw(m).ellipse([(j[0]-r)*S,(j[1]-r)*S,(j[0]+r)*S,(j[1]+r)*S],fill=230); cv.add(m.filter(ImageFilter.GaussianBlur(1.5*S)),tone)
    h=pts[-1]; m=Image.new('L',(W*S,H*S),0); ImageDraw.Draw(m).polygon([((h[0]-12)*S,(h[1]-8)*S),((h[0]+16)*S,(h[1]-4)*S),((h[0]+14)*S,(h[1]+10)*S),((h[0]-10)*S,(h[1]+8)*S)],fill=255); cv.add(m,tone)
leg([(790,470),(792,540),(800,598),(770,636),(742,652),(724,676)],34,13,.5,21)   # far fore folded
leg([(530,478),(530,555),(505,612),(548,682),(585,716),(604,742)],38,13,.5,22)   # far hind reaching
leg([(838,462),(862,540),(906,592),(950,624),(976,640),(1000,666)],38,14,.92,23) # near fore extended
leg([(420,450),(392,520),(352,566),(302,620),(266,648),(236,666)],46,14,.92,24)  # near hind pushing
# --- mane: flying dry brush ---
for i,(x,y) in enumerate([(900,168),(868,176),(836,196),(806,222),(778,250),(752,278)]):
    stroke(cv,spline([(x,y),(x-50,y-40-i*4),(x-110,y-55-i*6)],n=18),30-i*2,.8,seed=31+i,taper=(.03,.8),dry=1.1,core=.3,nb=80,mod=.3)
# --- tail: sweeping 飞白 ---
for i,pts in enumerate([[(420,314),(340,268),(250,262),(160,300)],[(418,322),(330,300),(250,316),(170,360)],[(416,318),(350,250),(270,220),(190,226)]]):
    stroke(cv,spline(pts,n=20),34-i*6,.8,seed=41+i,taper=(.04,.75),dry=1.1,core=.2,nb=90,mod=.3)
# --- rider ---
wash(cv,spline([(590,215),(560,140),(500,96),(420,112),(350,190),(330,250),(420,215),(520,215),(590,215)],n=10),.32,blur=6,wet=.5,seed=51)  # cape
for i,pts in enumerate([[(670,140),(560,100),(430,112),(345,195)],[(660,160),(560,150),(450,170),(360,240)]]):
    stroke(cv,spline(pts,n=20),16,.55,seed=52+i,taper=(.05,.6),dry=1.0,core=.25,nb=60)
wash(cv,spline([(612,300),(622,210),(660,140),(722,142),(730,215),(706,300),(612,300)],n=10),.8,blur=2.5,wet=.2,seed=53)  # armoured torso
wash(cv,spline([(596,296),(720,312),(708,362),(600,344),(596,296)],n=8),.65,blur=2.5,wet=.35,seed=54)  # armour skirt
for y in (220,250,280): stroke(cv,[(626,y),(716,y+4)],5,.35,seed=y,taper=(.2,.2),core=.6,nb=8)  # lamellar hint (light)
stroke(cv,spline([(650,318),(700,340),(738,362)],n=10),40,.9,seed=55,taper=(.02,.1),core=.75,dry=.2)  # thigh
stroke(cv,spline([(738,362),(732,410),(722,446)],n=10),26,.92,seed=56,taper=(.02,.1),core=.75,dry=.2)  # shin
stroke(cv,[(712,450),(758,456)],14,1,seed=57,taper=(.05,.2),core=.8)
# head + helmet
m=Image.new('L',(W*S,H*S),0); ImageDraw.Draw(m).ellipse([690*S,88*S,734*S,136*S],fill=255); cv.add(m.filter(ImageFilter.GaussianBlur(1.5*S)),.95)
stroke(cv,spline([(686,104),(712,76),(740,104)],n=10),16,1,seed=58,taper=(.1,.1),core=.8)
stroke(cv,[(712,78),(714,58)],5,1,seed=59,core=.8)
stroke(red,spline([(714,60),(680,40),(630,40),(590,58)],n=14),16,.95,seed=60,taper=(.05,.7),dry=.9,core=.3)
# arms
stroke(cv,spline([(712,160),(760,206),(800,214)],n=10),24,.9,seed=61,taper=(.05,.15),core=.75)
stroke(cv,spline([(680,156),(640,212),(656,268)],n=10),22,.85,seed=62,taper=(.05,.15),core=.75)
# spear: one long confident stroke
sp=lambda x:(x,360-270*(x-420)/730)
stroke(cv,[sp(420+i*7.3) for i in range(101)],8,1,seed=63,taper=(.02,.02),core=.85,dry=.15,nb=20,mod=.05)
m=Image.new('L',(W*S,H*S),0); ImageDraw.Draw(m).polygon([(1140*S,92*S),(1196*S,62*S),(1150*S,104*S)],fill=255); cv.add(m,1)
for i in range(3): stroke(red,spline([sp(1110),(1100+i*6,120+i*8),(1080+i*4,150+i*12)],n=10),12-i*2,.9,seed=64+i,taper=(.05,.6),dry=.8,core=.4)
# ground: one dry stroke
stroke(cv,spline([(120,700),(500,690),(900,700),(1150,694)],n=30),14,.25,seed=70,taper=(.05,.6),dry=1.2,core=.2)
def compose(path,ink=(22,19,17),rc=(170,40,30),bg=None,scale=1):
    a=Image.fromarray((np.clip(cv.D,0,1)*255).astype('uint8')); r=Image.fromarray((np.clip(red.D,0,1)*255).astype('uint8'))
    im=Image.new('RGBA',a.size,ink+(0,)); im.putalpha(a); ri=Image.new('RGBA',a.size,rc+(0,)); ri.putalpha(r)
    im=Image.alpha_composite(im,ri).resize((int(W*scale),int(H*scale)),Image.LANCZOS)
    if bg: b=Image.new('RGBA',im.size,bg+(255,)); im=Image.alpha_composite(b,im)
    im.save(path)
import sys
tag=sys.argv[1] if len(sys.argv)>1 else 'x'
compose(f'/tmp/ink_gen_{tag}.png',bg=(241,233,214),scale=.6)
compose('a/general_A.png',scale=.5); compose('a/general_C.png',ink=(226,216,196),rc=(206,84,60),scale=.5)
