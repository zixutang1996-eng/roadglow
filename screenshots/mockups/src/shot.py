import asyncio
from playwright.async_api import async_playwright
URL="https://zixutang1996-eng.github.io/roadglow/"
V={'A':('dark','#17.2/49.6735/-112.8985'),'B':('dark','#15.3/49.6765/-112.8975'),'C':('light','#15.6/49.6800/-112.8930')}
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    for k,(mode,h) in V.items():
      c=await b.new_context(viewport={'width':461,'height':1024},device_scale_factor=2,locale='zh-CN')
      await c.add_init_script(f"localStorage.setItem('theme','\"west\"');localStorage.setItem('mode','\"{mode}\"');localStorage.setItem('lang','zh');")
      pg=await c.new_page(); await pg.goto(URL+h); await pg.wait_for_timeout(14000)
      await pg.screenshot(path=f'{k}_orig.png')
      await pg.add_style_tag(content='body>*:not(#map):not(#paper):not(#torn){visibility:hidden!important}')
      await pg.wait_for_timeout(500); await pg.screenshot(path=f'{k}_base.png'); await c.close()
    await b.close()
asyncio.run(main())
