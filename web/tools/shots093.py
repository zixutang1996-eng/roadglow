import asyncio, json, sys
from playwright.async_api import async_playwright
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:18781/'
OUT = '/workspace/gamenav/screenshots/v093/'
INIT = """(([th,md,pal])=>{localStorage.setItem('theme',JSON.stringify(th));localStorage.setItem('mode',JSON.stringify(md));localStorage.setItem('pal',JSON.stringify(pal));localStorage.setItem('a2hsSeen','1');localStorage.setItem('lang','zh');localStorage.setItem('drawerOpen',JSON.stringify({mine:1,settings:1}));
const pos={coords:{latitude:53.5444,longitude:-113.4909,accuracy:10,heading:null,speed:null}};Object.defineProperty(navigator,'geolocation',{value:{getCurrentPosition:s=>setTimeout(()=>s(pos),10),watchPosition:s=>{setTimeout(()=>s(pos),10);return 1},clearWatch(){}}});})(%s)"""
async def one(b, th, md, pal, nav=True, tag=''):
    c = await b.new_context(viewport={'width':461,'height':1024}, device_scale_factor=1, is_mobile=True, has_touch=True, service_workers='block')
    p = await c.new_page(); await p.add_init_script(INIT % json.dumps([th,md,pal]))
    await p.goto(BASE + '#14/53.5444/-113.4909', wait_until='load'); 
    await p.wait_for_function('window._map && window._map.loaded() && document.documentElement.classList.contains("f093") || window._map && window._map.loaded() && !document.body.classList.contains("west")', timeout=60000)
    await p.wait_for_timeout(2500)
    n = f'{th}_{md}{tag}'
    await p.screenshot(path=OUT+n+'_map.png')
    if not nav: return await c.close()
    await p.evaluate('window._app.openDrawer()'); await p.wait_for_timeout(900)
    await p.screenshot(path=OUT+n+'_drawer.png')
    await p.evaluate('document.querySelector("#drawer").scrollTop=1e5'); await p.wait_for_timeout(300)
    await p.screenshot(path=OUT+n+'_drawer_bottom.png')
    await p.evaluate('window._app.closeDrawer()'); await p.wait_for_timeout(500)
    await p.evaluate("""()=>{const a=window._app;a.S.from={name:'A',lat:53.5444,lng:-113.4909};a.openDirections({name:'埃德蒙顿谷动物园',lat:53.5232,lng:-113.5263},true);}""")
    await p.wait_for_timeout(9000)
    await p.screenshot(path=OUT+n+'_nav.png')
    await c.close()
async def main():
    async with async_playwright() as pw:
        b = await pw.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        for th, md in [('west','light'),('west','dark'),('neon','light'),('neon','dark')]:
            await one(b, th, md, 'n2')
        for pal in ['n1','n3','n4']:
            await one(b, 'west', 'dark', pal, nav=(pal=='n1'), tag='_'+pal)
        await b.close()
asyncio.run(main())
