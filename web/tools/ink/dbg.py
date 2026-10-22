import asyncio,sys
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    c=await b.new_context(viewport={'width':412,'height':915},locale='zh-CN',service_workers='block')
    await c.add_init_script("localStorage.setItem('theme','\"west\"');localStorage.setItem('lang','zh');localStorage.setItem('skin','\"sanguo\"')")
    pg=await c.new_page(); pg.on('pageerror',lambda e:print('ERR',e))
    await pg.goto(sys.argv[1]); await pg.wait_for_timeout(7000)
    await pg.click('#menuBtn'); await pg.wait_for_timeout(600)
    await pg.mouse.click(400,500); await pg.wait_for_timeout(600)
    print(await pg.evaluate("[document.querySelector('#drawer').className, document.querySelector('#scrim').className, JSON.stringify(document.querySelector('#q').getBoundingClientRect()), getComputedStyle(document.querySelector('#top')).visibility, document.elementFromPoint(200,40)?.id, document.body.className]"))
    await b.close()
asyncio.run(main())
