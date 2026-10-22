import asyncio,os,sys
sys.argv=['x','3']
import fonts_r as FR
from fonts_r import DR,PAL,page,fix_drawer,fix_a
from playwright.async_api import async_playwright
def hl(c): return f'inset 0 1px 0 {c},0 1px 2px rgba(0,0,0,.7),0 12px 34px rgba(0,0,0,.75),0 0 0 1px rgba(0,0,0,.25)'
V={'n2_dark':('B_base_n2.png','#2a2e33','#353a40','#ece4d4','#c9c0ae','#d9b36a','rgba(220,228,240,.14)'),
   'n2_deeper':('B_base_n2.png','#1c1f23','#272b30','#ece4d4','#c4bba9','#d9b36a','rgba(220,228,240,.16)'),
   'n1_dark':('B_base_n1.png','#2f2a25','#3a342e','#efe5d2','#cbbfa9','#e0b468','rgba(255,236,200,.14)'),
   'n1_deeper':('B_base_n1.png','#201c19','#2b2622','#efe5d2','#c7bba5','#e0b468','rgba(255,236,200,.16)')}
for k,(b,f,t,x,s,a,h) in V.items():
  DR.PAL[k]=dict(base=b,fill=f,tint=t,txt=x,sub=s,acc=a,line='rgba(217,179,106,.55)',sh=hl(h),scrim='rgba(0,0,0,.3)')
f,t,x,s,a,h=V['n2_deeper'][1:]
PAL['n2dk']=f"--sh:{hl(h)};--fill:{f};--fill2:{f};--fill3:{t};--txt:{x};--sub:{s};--rule:{a};--rule2:rgba(236,228,212,.16);--brass:{a};--ink2:#1c1610;--oxb:#8e2f26;--btn:#6e2a22;--btxt:#f3e6cc;"
async def main():
  async with async_playwright() as p:
    br=await p.chromium.launch(executable_path='/usr/bin/google-chrome'); pg=await br.new_page(viewport={'width':461,'height':1024},device_scale_factor=2)
    async def shot(hh,out):
      open('f.html','w').write(hh); await pg.goto('file://'+os.path.abspath('f.html')); await pg.evaluate('document.fonts.ready'); await pg.wait_for_timeout(1000); await pg.screenshot(path='../'+out)
    for k in V: await shot(fix_drawer(DR.html(2,k),3),f'drawer_dkgrey_{k}.png')
    await shot(fix_a(page('A',4,'n2dk'),3),'navA_dkgrey_n2.png')
    await br.close()
if __name__=="__main__": asyncio.run(main())
