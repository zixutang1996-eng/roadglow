import asyncio,os
import neonui as N
from playwright.async_api import async_playwright
P=dict(N.PAL['dark'],line='rgba(79,214,232,.20)',glow='rgba(79,214,232,.08)',gr='4px',mag='#c77a9a')
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome'); pg=await b.new_page(viewport={'width':461,'height':1024},device_scale_factor=2)
    for out,body,base in [('neon_map_dark_B_dim.png',lambda Q:N.map_ui(Q,True),'nbase_dark_P2.png'),('neon_drawer_dark_dim.png',lambda Q:N.drawer(Q,'S2'),'nbase_dark_P2.png')]:
      Q=dict(P,base=base); open('n.html','w').write(N.page(Q,body(Q),True)); await pg.goto('file://'+os.path.abspath('n.html')); await pg.evaluate('document.fonts.ready'); await pg.wait_for_timeout(600); await pg.screenshot(path='../'+out)
    await b.close()
asyncio.run(main())
