# v0.9.5 skin shots: map / drawer / search / layers / place / nav per skin x mode -> screenshots/v095/<skin>/
import asyncio, json, sys, os
from playwright.async_api import async_playwright
BASE = os.environ.get('RG_BASE','http://127.0.0.1:18785/'); ROOT='/workspace/gamenav/screenshots/v095/'
exec(open(os.path.dirname(os.path.abspath(__file__))+'/audit093.py').read().split('async def shot')[0].split("BASE = ")[0])
exec("REC="+open(os.path.dirname(os.path.abspath(__file__))+'/audit093.py').read().split('REC = ')[1].split('\nINIT')[0])
INIT = open(os.path.dirname(os.path.abspath(__file__))+'/audit093.py').read().split('INIT = ')[1].split('\nDEST')[0]
exec('INIT='+INIT)
DEST = "{name:'埃德蒙顿谷动物园',lat:53.5232,lng:-113.5263}"
SCR = sys.argv[2].split(',') if len(sys.argv)>2 else ['map','drawer','search','layers','place','packs','update','toast','nav']
async def run(b, v):
    th, md = v.split('_'); out = ROOT+th+'/'; os.makedirs(out, exist_ok=True)
    c = await b.new_context(viewport={'width':461,'height':1024}, device_scale_factor=1, is_mobile=True, has_touch=True, service_workers='block')
    p = await c.new_page(); await p.add_init_script(INIT % json.dumps([th, md, 'n2', REC]))
    await p.goto(BASE + '#14/53.5444/-113.4909'); await p.wait_for_function('window._map&&_map.loaded()', timeout=90000); await p.wait_for_timeout(3000)
    sh = lambda n: p.screenshot(path=f'{out}{v}_{n}.png')
    if 'map' in SCR: await p.evaluate("window._app.locate&&0"); await sh('map')
    if 'drawer' in SCR:
        await p.evaluate("localStorage.setItem('drawerOpen','{}');window._app.openDrawer()"); await p.wait_for_timeout(900); await sh('drawer')
        await p.evaluate("window._app.closeDrawer()"); await p.wait_for_timeout(400)
    if 'search' in SCR:
        await p.click('#q'); await p.wait_for_timeout(700); await sh('search')
        await p.evaluate("document.querySelector('#q').blur();document.querySelector('#suggest').classList.add('hidden')")
    if 'layers' in SCR:
        await p.click('#layersBtn'); await p.wait_for_timeout(700); await sh('layers'); await p.evaluate("document.querySelector('#layersPop').classList.add('hidden')")
    if 'place' in SCR:
        await p.evaluate("window._app.showPlace({name:'Rexall',address:'10060 Jasper Ave NW, Edmonton',lat:53.5413,lng:-113.4935,category:'amenity=pharmacy'})"); await p.wait_for_timeout(2500); await sh('place')
    if 'packs' in SCR:
        await p.evaluate("window._app.tools.packs()"); await p.wait_for_timeout(1500); await sh('packs')
    if 'update' in SCR:
        await p.evaluate("window._app.tools.update()"); await p.wait_for_timeout(2500); await sh('update')
    if 'toast' in SCR:
        await p.evaluate("document.querySelector('#panelX')?.click();const t=document.querySelector('#toast');t.textContent='已复制';t.classList.remove('hidden')"); await sh('toast')
        await p.evaluate("document.querySelector('#toast').classList.add('hidden')")
    if 'nav' in SCR:
        await p.evaluate(f"(()=>{{const a=window._app;a.S.from={{name:'A',lat:53.5444,lng:-113.4909}};a.openDirections({DEST},true)}})()"); await p.wait_for_timeout(9000); await sh('nav')
    await c.close()
async def main():
    async with async_playwright() as pw:
        b = await pw.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        for v in sys.argv[1].split(','):
            try: await run(b, v)
            except Exception as e: print(v, 'ERR', e)
        await b.close()
asyncio.run(main())
