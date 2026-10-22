import asyncio,os
import neonui as N
from pink import C
from playwright.async_api import async_playwright
J=[]
for k,p in C.items(): J.append((f'neon_light_L1_pink{k}.png',dict(N.PAL['L1'],base=f'nbase_L1_{k}.png',mag=p['acc']),True))
J.append(('neon_light_L2_pinkP2.png',dict(N.PAL['L2'],base='nbase_L2_P2.png',mag=C['P2']['acc']),True))
J.append(('neon_map_dark_B_pinkP2.png',dict(N.PAL['dark'],base='nbase_dark_P2.png',mag='#c77a9a'),True))
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome'); pg=await b.new_page(viewport={'width':461,'height':1024},device_scale_factor=2)
    for out,P,ol in J:
      open('n.html','w').write(N.page(P,N.map_ui(P,ol),ol)); await pg.goto('file://'+os.path.abspath('n.html')); await pg.evaluate('document.fonts.ready'); await pg.wait_for_timeout(600); await pg.screenshot(path='../'+out)
    await b.close()
asyncio.run(main())
