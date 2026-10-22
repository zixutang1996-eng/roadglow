import asyncio,sys,json
from playwright.async_api import async_playwright
U='http://127.0.0.1:18781/'; JS=sys.argv[1]; MODE=sys.argv[2] if len(sys.argv)>2 else 'light'
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    c=await b.new_context(viewport={'width':461,'height':1024},device_scale_factor=2,locale='zh-CN',service_workers='block')
    await c.add_init_script(f"localStorage.setItem('theme','\"west\"');localStorage.setItem('mode','\"{MODE}\"');localStorage.setItem('lang','zh');localStorage.setItem('a2hsSeen','1');")
    pg=await c.new_page(); pg.on('pageerror',lambda e:print('PAGEERR',e)); pg.on('console',lambda m:print('LOG',m.text) if m.type in('error','warning') else None)
    await pg.goto(U+'#15.2/53.5444/-113.4950'); await pg.wait_for_timeout(3000)
    await pg.evaluate("async()=>{const r=await fetch('packs/index.json');const c=await r.json();const e=c.packs.find(x=>x.id==='sanguo');const u8=new Uint8Array(await (await fetch('packs/'+e.url)).arrayBuffer());await window._app.installPackBytes(u8,e.sha256)}")
    await pg.evaluate("localStorage.setItem('skin','\"sanguo\"')"); await pg.reload(); await pg.wait_for_function('window.__rgMapReady',timeout=90000); await pg.wait_for_timeout(3000)
    globals()['pg']=pg
    r=await pg.evaluate(JS); print(json.dumps(r,ensure_ascii=False,indent=1))
    await b.close()
asyncio.run(main())
