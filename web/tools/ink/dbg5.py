import asyncio,sys
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    c=await b.new_context(viewport={'width':461,'height':1024},locale='zh-CN',service_workers='block')
    await c.add_init_script("localStorage.setItem('theme','\"west\"');localStorage.setItem('lang','zh');localStorage.setItem('mode','\"dark\"');")
    pg=await c.new_page(); pg.on('pageerror',lambda e:print('ERR',e)); pg.on('console',lambda m:print('CON',m.text) if m.type in('error','warning') else None)
    await pg.goto(sys.argv[1]); await pg.wait_for_timeout(4000)
    await pg.evaluate("""async()=>{const PK=await import('/src/packs.js');const c=await PK.catalog(location.href);const e=c.find(x=>x.id==='sanguo');await PK.installFromUrl(e.url,e.sha256,'0.9.6')}""")
    await pg.evaluate("localStorage.setItem('skin','\"sanguo\"')"); await pg.reload(); await pg.wait_for_timeout(7000)
    await pg.click('#menuBtn'); await pg.wait_for_timeout(700); await pg.mouse.click(440,500); await pg.wait_for_timeout(700)
    print(await pg.evaluate("[document.querySelector('#drawer').className,document.querySelector('#scrim').className,getComputedStyle(document.querySelector('#controls')).display,getComputedStyle(document.querySelector('#layersBtn')).visibility,document.body.className, document.elementFromPoint(420,170)?.id||document.elementFromPoint(420,170)?.className, JSON.stringify(document.querySelector('#layersBtn').getBoundingClientRect())]"))
    await b.close()
asyncio.run(main())
