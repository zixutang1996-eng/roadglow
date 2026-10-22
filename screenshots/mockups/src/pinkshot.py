import asyncio,json
from playwright.async_api import async_playwright
from neonmap import L,style
from pink import C
URL="https://zixutang1996-eng.github.io/roadglow/#15.0/49.6790/-112.8800"
def lstyle(n,mot):
  L[n]['mot']=mot; return style(n)
def dstyle(m):
  s=json.load(open('/workspace/gamenav/web/public/styles/neon_dark.json'))
  for l in s['layers']:
    if l['id'] in ('motorway','motorway-glow'): l['paint']['line-color']=m
  return json.dumps(s)
J=[(f'L1_{k}','light','neon_light',lstyle(1,p['mot'])) for k,p in C.items()]+[('L2_P2','light','neon_light',lstyle(2,C['P2']['mot'])),('dark_P2','dark','neon_dark',dstyle(C['P2']['dmot']))]
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    for tag,mode,sn,st in J:
      c=await b.new_context(viewport={'width':461,'height':1024},device_scale_factor=2,locale='zh-CN')
      await c.add_init_script(f"localStorage.setItem('theme','\"neon\"');localStorage.setItem('mode','\"{mode}\"');localStorage.setItem('lang','zh');")
      await c.route(f'**/styles/{sn}.json*',lambda r,*_,st=st: r.fulfill(status=200,content_type='application/json',body=st))
      pg=await c.new_page(); await pg.goto(URL); await pg.wait_for_timeout(13000)
      await pg.add_style_tag(content='body>*:not(#map):not(#paper):not(#torn){visibility:hidden!important}')
      await pg.wait_for_timeout(400); await pg.screenshot(path=f'nbase_{tag}.png'); await c.close()
    await b.close()
asyncio.run(main())
