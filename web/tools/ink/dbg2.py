import asyncio,sys
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    c=await b.new_context(viewport={'width':412,'height':915},locale='zh-CN',service_workers='block')
    await c.add_init_script("localStorage.setItem('theme','\"west\"');localStorage.setItem('lang','zh');")
    pg=await c.new_page(); pg.on('pageerror',lambda e:print('ERR',e)); pg.on('console',lambda m:print('CON',m.text) if m.type in('error','warning') else None)
    await pg.goto(sys.argv[1]); await pg.wait_for_timeout(4000)
    await pg.evaluate("""async()=>{const PK=await import('/src/packs.js');const c=await PK.catalog(location.href);const e=c.find(x=>x.id==='sanguo');await PK.installFromUrl(e.url,e.sha256,'0.9.6')}""")
    await pg.evaluate("localStorage.setItem('skin','\"sanguo\"')"); await pg.reload(); await pg.wait_for_timeout(7000)
    L=lambda: pg.evaluate("(()=>{const e=document.querySelector('#layersPop');return [e.className,e._rgClosing,e._rgMute,getComputedStyle(e).animationName,window.__dbg]})()")
    await pg.evaluate("document.querySelector('#layersBtn').click()"); await pg.wait_for_timeout(600); print(await L())
    await pg.evaluate("(()=>{const e=document.querySelector('#layersPop');window.__dbg=[];const ot=window.setTimeout;e.addEventListener('animationend',x=>__dbg.push('ae:'+x.animationName));document.querySelector('#layersPop [data-x]').click()})()"); 
    for t in (50,200,400,800): await pg.wait_for_timeout(t); print(t,await L())
    await pg.click('#q',force=True); await pg.keyboard.type('cafe'); await pg.wait_for_timeout(3000); print('sug',await L(), await pg.evaluate("document.querySelector('#suggest').innerHTML.length"))
    await b.close()
asyncio.run(main())
