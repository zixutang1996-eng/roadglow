import asyncio,sys
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    c=await b.new_context(viewport={'width':412,'height':915},locale='zh-CN',service_workers='block')
    await c.add_init_script("localStorage.setItem('theme','\"west\"');localStorage.setItem('lang','zh');")
    pg=await c.new_page(); pg.on('console',lambda m: print('CON',m.text) if m.type=='error' else None); pg.on('pageerror',lambda e:print('ERR',e))
    await pg.goto(sys.argv[1]); await pg.wait_for_timeout(6000)
    await pg.click('#menuBtn'); await pg.wait_for_timeout(600)
    print(await pg.evaluate("[...document.querySelectorAll('#drawer .dsh')].map(h=>h.dataset.sech+':'+h.textContent.trim())"))
    await pg.evaluate("document.querySelectorAll('#drawer .dsec:not(.open) .dsh').forEach(h=>h.click())"); await pg.wait_for_timeout(1500)
    print(await pg.evaluate("[document.querySelector('#toast').textContent, document.querySelector('#panel').className, document.querySelector('#panelTitle').textContent]"))
    await b.close()
asyncio.run(main())
