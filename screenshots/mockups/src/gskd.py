import asyncio,os,sys
sys.argv=['x','B']
import skd, frost as F, skull
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    br=await p.chromium.launch(executable_path='/usr/bin/google-chrome'); pg=await br.new_page(viewport={'width':461,'height':1024},device_scale_factor=2)
    for k in ('G1','G2','G3'):
      sv=open(f'../mskull_{k}.svg').read().replace('width="150" height="56"','width="200" height="116" style="color:#3a2a1a"')
      skd.svg=lambda v,sv=sv: sv
      h=F.frost(F.fix_drawer(F.DR.html(2,'n2_deeper'),3),'B_base_n2.png',4,'rgba(8,10,14,.16)',skd.fg,.18)
      h=skd.place(h,'x','#d9c08a',.6).replace('width="140" height="81"','width="150" height="56"').replace('top:846px','top:862px')
      open('f.html','w').write(h); await pg.goto('file://'+os.path.abspath('f.html')); await pg.evaluate('document.fonts.ready'); await pg.wait_for_timeout(900); await pg.screenshot(path=f'../drawer_gskull_{k}.png')
    sh=''.join('<div style="display:inline-block;width:400px;margin:24px 12px">'+open(f'../mskull_G{i}.svg').read().replace('width="150" height="56"','width="400" height="150" style="color:#d9c08a;opacity:.85"')+'</div>' for i in (1,2,3))
    pg2=await br.new_page(viewport={'width':1272,'height':200},device_scale_factor=2)
    await pg2.set_content('<body style="margin:0;background:#1c1f23">'+sh+'</body>'); await pg2.screenshot(path='../gskull_sheet.png')
    await br.close()
asyncio.run(main())
