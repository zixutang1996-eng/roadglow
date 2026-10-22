import asyncio,os
import frost as F
from playwright.async_api import async_playwright
fg2='radial-gradient(120% 80% at 70% 40%,rgba(120,100,70,.05),transparent)'
J=[('n2_deeper','B_base_n2.png',2,'rgba(8,10,14,.14)',fg2,.15,'drawer_softfrost_n2_2px.png'),
   ('n2_deeper','B_base_n2.png',4,'rgba(8,10,14,.16)',fg2,.18,'drawer_softfrost_n2_4px.png'),
   ('n1_deeper','B_base_n1.png',4,'rgba(12,8,4,.16)','radial-gradient(120% 80% at 70% 40%,rgba(150,110,60,.06),transparent)',.18,'drawer_softfrost_n1.png'),
   ('dayF','C_base.png',4,'rgba(236,224,194,.15)','linear-gradient(rgba(245,236,214,.06),rgba(245,236,214,.06))',.12,'drawer_softfrost_day.png')]
async def main():
  async with async_playwright() as p:
    br=await p.chromium.launch(executable_path='/usr/bin/google-chrome'); pg=await br.new_page(viewport={'width':461,'height':1024},device_scale_factor=2)
    for k,base,bl,tn,fg,gr,out in J:
      open('f.html','w').write(F.frost(F.fix_drawer(F.DR.html(2,k),3),base,bl,tn,fg,gr)); await pg.goto('file://'+os.path.abspath('f.html')); await pg.evaluate('document.fonts.ready'); await pg.wait_for_timeout(1000); await pg.screenshot(path='../'+out)
    await br.close()
asyncio.run(main())
