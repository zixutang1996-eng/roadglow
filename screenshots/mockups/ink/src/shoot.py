import asyncio
from playwright.async_api import async_playwright
OUT='/workspace/gamenav/screenshots/mockups/ink/'
import sys
V=sys.argv[1];S=sys.argv[2].split(',')
async def main():
  async with async_playwright() as pw:
    b=await pw.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    c=await b.new_context(viewport={'width':461,'height':1024},device_scale_factor=2)
    for v in V:
      for sc in S:
        p=await c.new_page();p.on('pageerror',lambda e:print('ERR',e))
        await p.goto(f'http://127.0.0.1:18855/screenshots/mockups/ink/src/page.html?v={v}&scr={sc}')
        try: await p.wait_for_function('window._ready',timeout=45000)
        except Exception: print('timeout',v,sc)
        await p.evaluate('document.fonts.ready');await p.wait_for_timeout(700)
        await p.screenshot(path=f'{OUT}{v}/ink_{v}_{sc}.png');await p.close();print(v,sc,flush=True)
    await b.close()
asyncio.run(main())
