import asyncio,os,re
import dk
from dk import DR,fix_drawer
from playwright.async_api import async_playwright
GRAIN="url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .55  0 0 0 0 .42  0 0 0 0 .28  0 0 0 .55 0'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E\")"
def frost(h,base,blur,tint,fog,grain):
  h=re.sub(r'\.scrim\{[^}]*\}', '', h)
  css=f".scrim{{position:absolute;inset:0;overflow:hidden}} .scrim .bl{{position:absolute;inset:-30px;background:url({base}) 30px 30px/461px 1024px no-repeat;filter:blur({blur}px)}} .scrim .tn{{position:absolute;inset:0;background:{tint}}} .scrim .fg{{position:absolute;inset:0;background:{fog}}} .scrim .gr{{position:absolute;inset:0;background:{GRAIN};opacity:{grain};mix-blend-mode:soft-light}}"
  h=h.replace('</style>',css+'</style>',1).replace('<div class="scrim"></div>','<div class="scrim"><div class="bl"></div><div class="tn"></div><div class="fg"></div><div class="gr"></div></div>')
  return h
DR.PAL['dayF']=dict(DR.PAL['light'])
J=[('n2_deeper','B_base_n2.png',6,'rgba(8,10,14,.30)','radial-gradient(120% 80% at 70% 40%,rgba(120,100,70,.10),transparent)',.35,'drawer_frost_n2_light.png'),
   ('n2_deeper','B_base_n2.png',12,'rgba(8,10,14,.38)','radial-gradient(120% 80% at 70% 40%,rgba(120,100,70,.12),transparent)',.4,'drawer_frost_n2_strong.png'),
   ('n1_deeper','B_base_n1.png',12,'rgba(12,8,4,.36)','radial-gradient(120% 80% at 70% 40%,rgba(150,110,60,.12),transparent)',.4,'drawer_frost_n1.png'),
   ('dayF','C_base.png',10,'rgba(236,224,194,.35)','linear-gradient(rgba(245,236,214,.15),rgba(245,236,214,.15))',.25,'drawer_frost_day.png')]
async def main():
  async with async_playwright() as p:
    br=await p.chromium.launch(executable_path='/usr/bin/google-chrome'); pg=await br.new_page(viewport={'width':461,'height':1024},device_scale_factor=2)
    for k,base,bl,tn,fg,gr,out in J:
      open('f.html','w').write(frost(fix_drawer(DR.html(2,k),3),base,bl,tn,fg,gr)); await pg.goto('file://'+os.path.abspath('f.html')); await pg.evaluate('document.fonts.ready'); await pg.wait_for_timeout(1000); await pg.screenshot(path='../'+out)
    await br.close()
if __name__=="__main__": asyncio.run(main())
