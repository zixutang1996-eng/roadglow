import asyncio,os
import drawer as DR
s5=open('mk5.py').read(); exec(s5[:s5.index('async def main')])
from playwright.async_api import async_playwright
DR.PAL['n2g']=dict(base='B_base_n2.png',fill='#aca08a',tint='#a09481',txt='#15120e',sub='#30291f',acc='#3d3226',line='#3d3226',sh='0 1px 2px rgba(0,0,0,.55),0 10px 30px rgba(0,0,0,.6)',scrim='rgba(5,8,12,.35)')
DR.PAL['n1g']=dict(base='B_base_n1.png',fill='#564a3e',tint='#615448',txt='#f3ece0',sub='#e4dbcb',acc='#e2c592',line='#e2c592',sh='inset 0 1px 0 rgba(255,240,215,.12),0 1px 2px rgba(0,0,0,.6),0 10px 30px rgba(0,0,0,.6)',scrim='rgba(8,5,2,.35)')
PAL['n2g']="--sh:0 1px 2px rgba(0,0,0,.6),0 8px 22px rgba(0,0,0,.6);--fill:#aca08a;--fill2:#aca08a;--fill3:#a09481;--txt:#15120e;--sub:#30291f;--rule:#3d3226;--rule2:rgba(21,18,14,.25);--brass:#3d3226;--ink2:#1c1610;--oxb:#8e2f26;--btn:#6e2a22;--btxt:#f3e6cc;"
F='fonts/'
FF={'IMFellPica':'IMFePIrm28P.ttf','LibreCaslon':'LibreCaslonText.ttf','OldStd':'OldStandard-Regular.ttf','OldStdB':'OldStandard-Bold.ttf','Alegreya':'Alegreya.ttf','Rye':'Rye-Regular.ttf','WenKai':'LXGWWenKai-Regular.ttf','WenKaiM':'LXGWWenKai-Medium.ttf','NotoSC':'NotoSerifSC.ttf'}
FACE=''.join(f"@font-face{{font-family:{k};src:url({F}{v})}}" for k,v in FF.items())
PAIR={1:('IMFellPica','LibreCaslon','WenKai'),2:('OldStd','OldStd','NotoSC'),3:('Alegreya','Alegreya','WenKaiM'),4:('Rye','LibreCaslon','NotoSC')}
def css(n):
  d,b,c=PAIR[n]
  return f"<style>{FACE} body,body *{{font-family:{b},{c},serif!important;font-variant-numeric:lining-nums}} .disp,.disp *,[style*='font-family:Fell']{{font-family:{d},{c},serif!important}}</style>"
def fix_drawer(h,n): return h.replace('<span style="font-family:Fell;font-size:26px">','<span class="disp" style="font-size:26px">').replace('</head>',css(n)+'</head>')
def fix_a(h,n): return h.replace('url(A_base.png)','url(A_base_n2.png)').replace('</head>',css(n)+'</head>')
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome'); pg=await b.new_page(viewport={'width':461,'height':1024},device_scale_factor=2)
    async def shot(h,out):
      open('f.html','w').write(h); await pg.goto('file://'+os.path.abspath('f.html')); await pg.evaluate('document.fonts.ready'); await pg.wait_for_timeout(1200)
      st=await pg.evaluate("[...document.fonts].map(f=>f.family+':'+f.status).join(' ')"); print(out,st)
      await pg.screenshot(path='../'+out)
    for n in PAIR:
      await shot(fix_drawer(DR.html(2,'n2g'),n),f'font{n}_drawer_n2grey.png')
      await shot(fix_a(page('A',4,'n2g'),n),f'font{n}_navA_n2grey.png')
    import sys; best=int(sys.argv[1])
    await shot(fix_drawer(DR.html(2,'n2g'),best),'drawer_grey_n2.png')
    await shot(fix_drawer(DR.html(2,'n1g'),best),'drawer_grey_n1.png')
    await b.close()
if __name__=="__main__": asyncio.run(main())
