import asyncio,sys,json
from playwright.async_api import async_playwright
OUT='/workspace/gamenav/screenshots/mockups/synth/'
async def main():
  res={}
  async with async_playwright() as pw:
    b=await pw.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    c=await b.new_context(viewport={'width':412,'height':915},device_scale_factor=2)
    for d in sys.argv[1]:
     for m in 'dl':
      for scr in sys.argv[3].split(','):
       for lang in (['zh','en'] if scr in sys.argv[2].split(',') else ['zh']):
        p=await c.new_page();p.on('pageerror',lambda e:print('ERR',e))
        await p.goto(f'http://127.0.0.1:18855/screenshots/mockups/synth/src/page.html?d={d}&m={m}&scr={scr}&lang={lang}')
        try: await p.wait_for_function('window._ready',timeout=45000)
        except Exception: print('timeout',d,m,scr)
        await p.evaluate('document.fonts.ready');await p.wait_for_timeout(500)
        n=f'{d}/{scr}_{"dark" if m=="d" else "light"}_{lang}'
        res[n]=await p.evaluate('_overlap()')
        await p.screenshot(path=OUT+n+'.png');await p.close();print(n,res[n],flush=True)
    await b.close()
  json.dump(res,open(OUT+f'overlap_{sys.argv[1]}.json','w'),indent=1,ensure_ascii=False)
asyncio.run(main())
