import asyncio,sys
from playwright.async_api import async_playwright
OUT='/workspace/gamenav/screenshots/mockups/ink/v4/'
J=[x.split(':') for x in sys.argv[1].split(',')]
async def main():
  async with async_playwright() as pw:
    b=await pw.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    c=await b.new_context(viewport={'width':461,'height':1024},device_scale_factor=2)
    for v,sc in J:
        p=await c.new_page();p.on('pageerror',lambda e:print('ERR',e))
        await p.goto(f'http://127.0.0.1:18855/screenshots/mockups/ink/src4/page.html?v={v}&scr={sc}'+('&lang=en' if len(sys.argv)>2 else ''))
        try: await p.wait_for_function('window._ready',timeout=45000)
        except Exception: print('timeout',v,sc)
        await p.evaluate('document.fonts.ready');await p.wait_for_timeout(700)
        n=f'ink_v4_{sc}' + ('_dark' if v=='C' else '') + ('_en' if len(sys.argv)>2 else '')
        await p.screenshot(path=f'{OUT}{n}.png');await p.close();print(n,flush=True)
    await b.close()
asyncio.run(main())
