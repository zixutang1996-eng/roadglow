import asyncio,sys
from playwright.async_api import async_playwright
U=sys.argv[1]
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    c=await b.new_context(viewport={'width':461,'height':1024},device_scale_factor=1,locale='zh-CN',service_workers='block')
    await c.add_init_script("localStorage.setItem('theme','\"west\"');localStorage.setItem('mode','\"light\"');localStorage.setItem('lang','zh');")
    pg=await c.new_page(); await pg.goto(U+'#15/53.5444/-113.4909'); await pg.wait_for_timeout(6000)
    print(await pg.evaluate("document.querySelector('#top').outerHTML.slice(0,3000)"))
    print(await pg.evaluate("document.querySelector('#controls').outerHTML.slice(0,1500)"))
    await pg.click('#menuBtn'); await pg.wait_for_timeout(800)
    print(await pg.evaluate("document.querySelector('#drawer').outerHTML.replace(/<svg.*?<\\/svg>/g,'<svg/>').slice(0,6000)"))
    await pg.evaluate("document.querySelector('#drawer').classList.remove('open')")
    await pg.evaluate("document.querySelector('#layersBtn').click()"); await pg.wait_for_timeout(500)
    print(await pg.evaluate("document.querySelector('#layersPop').outerHTML.replace(/<svg.*?<\\/svg>/g,'<svg/>').slice(0,3000)"))
    await b.close()
asyncio.run(main())
