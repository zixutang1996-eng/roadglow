import asyncio,os,json
src=open('mk5.py').read(); exec(src[:src.index('async def main')])
from night import N,style
from playwright.async_api import async_playwright
URL="https://zixutang1996-eng.github.io/roadglow/"
V={'A':'#17.2/49.6735/-112.8985','B':'#15.3/49.6765/-112.8975'}
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    for n,pp in N.items():
      P=pp['P']; PAL[f'n{n}']=f"--sh:{P['sh']};--fill:{P['fill']};--fill2:{P['fill']};--fill3:{P['fill3']};--txt:{P['txt']};--sub:{P['sub']};--rule:{P['brass']};--rule2:{P['rule2']};--brass:{P['brass']};--ink2:#1c1610;--oxb:#8e2f26;--btn:{P['btn']};--btxt:{P['btxt']};"
      st=style(n)
      for v,h in V.items():
        c=await b.new_context(viewport={'width':461,'height':1024},device_scale_factor=2,locale='zh-CN')
        await c.add_init_script("localStorage.setItem('theme','\"west\"');localStorage.setItem('mode','\"dark\"');localStorage.setItem('lang','zh');")
        await c.route('**/styles/west_dark.json*',lambda r,*_,st=st: r.fulfill(status=200,content_type='application/json',body=st))
        pg=await c.new_page(); await pg.goto(URL+h); await pg.wait_for_timeout(14000)
        await pg.add_style_tag(content='body>*:not(#map):not(#paper):not(#torn){visibility:hidden!important}')
        await pg.wait_for_timeout(500); await pg.screenshot(path=f'{v}_base_n{n}.png'); await c.close()
        html=page(v,4,f'n{n}').replace(f'url({v}_base.png)',f'url({v}_base_n{n}.png)')
        open('m.html','w').write(html)
        c=await b.new_context(viewport={'width':461,'height':1024},device_scale_factor=2); pg=await c.new_page()
        await pg.goto('file://'+os.path.abspath('m.html')); await pg.wait_for_timeout(500)
        await pg.screenshot(path=f'../{v}_night{n}.png'); await c.close()
    await b.close()
asyncio.run(main())
