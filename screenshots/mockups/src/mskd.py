import asyncio,os,sys
sys.argv=['x','B']
import skd, frost as F, skull
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    br=await p.chromium.launch(executable_path='/usr/bin/google-chrome'); pg=await br.new_page(viewport={'width':461,'height':1024},device_scale_factor=2)
    for k in ('M1','M2','M3'):
      sv=open(f'../mskull_{k}.svg').read().replace('width="130" height="78"','width="200" height="116" style="color:#3a2a1a"')
      skull.svg=lambda v,sv=sv: sv; skd.svg=skull.svg
      h=F.frost(F.fix_drawer(F.DR.html(2,'n2_deeper'),3),'B_base_n2.png',4,'rgba(8,10,14,.16)',skd.fg,.18)
      h=skd.place(h,'x','#d9c08a',.6).replace('width="140" height="81"','width="130" height="78"')
      open('f.html','w').write(h); await pg.goto('file://'+os.path.abspath('f.html')); await pg.evaluate('document.fonts.ready'); await pg.wait_for_timeout(900); await pg.screenshot(path=f'../drawer_mskull_{k}.png')
    await br.close()
asyncio.run(main())
