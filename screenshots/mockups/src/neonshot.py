import asyncio
from playwright.async_api import async_playwright
from neonmap import style
URL="https://zixutang1996-eng.github.io/roadglow/#15.0/49.6790/-112.8800"
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    for tag,mode,st in [(f'L{n}','light',style(n)) for n in (1,2,3)]:
      c=await b.new_context(viewport={'width':461,'height':1024},device_scale_factor=2,locale='zh-CN')
      await c.add_init_script(f"localStorage.setItem('theme','\"neon\"');localStorage.setItem('mode','\"{mode}\"');localStorage.setItem('lang','zh');")
      if st: await c.route('**/styles/neon_light.json*',lambda r,*_,st=st: r.fulfill(status=200,content_type='application/json',body=st))
      pg=await c.new_page(); await pg.goto(URL); await pg.wait_for_timeout(13000)
      await pg.add_style_tag(content='body>*:not(#map):not(#paper):not(#torn){visibility:hidden!important}')
      await pg.wait_for_timeout(400); await pg.screenshot(path=f'nbase_{tag}.png'); await c.close()
    await b.close()
asyncio.run(main())
