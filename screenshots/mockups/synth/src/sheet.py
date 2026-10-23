import sys
from PIL import Image,ImageDraw,ImageFont
d,title,ver=sys.argv[1],sys.argv[2],sys.argv[3];O='/workspace/gamenav/screenshots/mockups/synth/'
S=['map','search','drawer','skins','place','nav'];rows=[(m,l) for m in ['dark','light'] for l in ['zh','en']]
W,H=412,915;w,h=W//2+50,H//2+111;pad=12
im=Image.new('RGB',(6*w+7*pad,4*h+5*pad+40),'#111');dr=ImageDraw.Draw(im);f=ImageFont.truetype(O+'src/fonts/Audiowide-Regular.ttf',26)
dr.text((pad,8),title,fill='#fff',font=f)
for r,(m,l) in enumerate(rows):
  for c,s in enumerate(S):
    try: x=Image.open(f'{O}{d}/{s}_{m}_{l}.png').resize((w,h),Image.LANCZOS)
    except FileNotFoundError: continue
    im.paste(x,(pad+c*(w+pad),40+pad+r*(h+pad)))
im.save(f'{O}{d}/contact_{d}_{ver}.png');print('ok')
