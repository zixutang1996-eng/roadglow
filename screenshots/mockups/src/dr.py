import asyncio
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    c=await b.new_context(viewport={'width':461,'height':1024},device_scale_factor=2,locale='zh-CN')
    await c.add_init_script("localStorage.setItem('theme','\"west\"');localStorage.setItem('mode','\"dark\"');localStorage.setItem('lang','zh');")
    pg=await c.new_page(); await pg.goto("https://zixutang1996-eng.github.io/roadglow/#15.3/49.6765/-112.8975"); await pg.wait_for_timeout(12000)
    await pg.click('#menuBtn'); await pg.wait_for_timeout(1500)
    await pg.screenshot(path='drawer_orig.png')
    print(await pg.evaluate("document.querySelector('#drawer').innerText"))
    print(await pg.evaluate("JSON.stringify(document.querySelector('#drawer').getBoundingClientRect())"))
    await b.close()
asyncio.run(main())
