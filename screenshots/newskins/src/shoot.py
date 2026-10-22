import asyncio,sys
from playwright.async_api import async_playwright
OUT='/workspace/gamenav/screenshots/newskins/'
SK=sys.argv[1].split(',') if len(sys.argv)>1 else ['space','nord','tac']
SC=sys.argv[2].split(',') if len(sys.argv)>2 else ['map','drawer','nav','place','search','style']
async def main():
  async with async_playwright() as pw:
    b=await pw.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    c=await b.new_context(viewport={'width':461,'height':1024},device_scale_factor=2)
    for s in SK:
      import os;os.makedirs(OUT+s,exist_ok=True)
      for m in ['light','dark']:
        for sc in SC:
          p=await c.new_page();p.on('pageerror',lambda e:print('ERR',e))
          await p.goto(f'http://127.0.0.1:18790/screenshots/newskins/src/page.html?skin={s}&mode={m}&scr={sc}')
          try: await p.wait_for_function('window._ready',timeout=40000)
          except Exception as e: print('timeout',s,m,sc)
          await p.evaluate('document.fonts.ready');await p.wait_for_timeout(800)
          await p.screenshot(path=f'{OUT}{s}/{s}_{m}_{sc}_v8.png');await p.close();print(s,m,sc)
    await b.close()
asyncio.run(main())
