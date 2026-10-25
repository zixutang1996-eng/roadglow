# v0.9.13 overflow + island audit: every built-in skin (5 x dark/light) and every downloadable pack x surfaces x nav-card sizes (1, 1.5).
# Runs tools/ovf.js on each surface; screenshots only the failing surfaces (+ nav card samples) -> screenshots/v0913/audit/. Writes audit.json.
import asyncio, json, sys, hashlib
from playwright.async_api import async_playwright
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:18793/'; OUT = '/workspace/gamenav/screenshots/v0913/audit/'
OVF = open('/tmp/rg13/web/tools/ovf.js').read()
REC = [{'name':'Rexall','address':'10060 Jasper Ave NW, Edmonton','lat':53.5413,'lng':-113.4935,'category':'amenity=pharmacy'},
       {'name':'Quarters','address':'','lat':53.5446,'lng':-113.4813,'category':'railway=station'}]
INIT = """(([th,md,pal,rec])=>{const s=(k,v)=>localStorage.setItem(k,JSON.stringify(v));s('theme',th);s('mode',md);s('pal',pal);localStorage.setItem('lang','zh');s('a2hsSeen','1');s('recents',rec);s('saved',[rec[0]]);s('drawerOpen',{});
const pos={coords:{latitude:53.5444,longitude:-113.4909,accuracy:10,heading:null,speed:null}};Object.defineProperty(navigator,'geolocation',{value:{getCurrentPosition:s=>setTimeout(()=>s(pos),10),watchPosition:s=>{setTimeout(()=>s(pos),10);return 1},clearWatch(){}}});})(%s)"""
DEST = "{name:'埃德蒙顿谷动物园',lat:53.5232,lng:-113.5263}"
PACKS = json.load(open('/tmp/rg13/web/public/packs/index.json'))['packs']
SKINP = [p for p in PACKS if p.get('type') == 'skin' and not p.get('builtin')]
VARS = [(t, m, None) for t in ['neon','west','space','nord','tac'] for m in ['dark','light']] + [(p.get('base','west'), m, p) for p in SKINP for m in ['dark','light']]
RES = []
async def check(p, v, n, shot=False):
    await p.wait_for_timeout(600); bad = await p.evaluate(OVF)
    if bad or shot: await p.screenshot(path=f'{OUT}{v}_{n}.png')
    RES.append({'v': v, 'surface': n, 'bad': bad}); print(v, n, len(bad), bad[:3], flush=True)
async def run(b, th, md, pk, sc):
    v = f"{pk['id'] if pk else th}_{md}_s{sc}"
    c = await b.new_context(viewport={'width':393,'height':873}, device_scale_factor=2, is_mobile=True, has_touch=True, service_workers='block')
    p = await c.new_page(); await p.add_init_script(INIT % json.dumps([th, md, 'n2', REC])); await p.add_init_script(f"localStorage.setItem('navCard', JSON.stringify({{scale:{sc}}}))")
    await p.goto(BASE + '#14/53.5444/-113.4909'); await p.wait_for_function('window._map&&_map.loaded()', timeout=90000); await p.wait_for_timeout(1500)
    if pk:
        u8 = list(open('/tmp/rg13/web/public/packs/' + pk['url'].split('/')[-1], 'rb').read())
        await p.evaluate("async ([u8]) => { await window._app.installPackBytes(new Uint8Array(u8)); }", [u8])
        await p.evaluate(f"localStorage.setItem('skin', JSON.stringify('{pk['id']}'))"); await p.reload(); await p.wait_for_function('window._map&&_map.loaded()', timeout=90000); await p.wait_for_timeout(2000)
    if sc == 1:
        await check(p, v, '00_home')
        await p.click('#q'); await check(p, v, '01_search_history')
        await p.fill('#q', '1581 coalbanks blvd w, lethbridge'); await p.wait_for_timeout(2500); await check(p, v, '02_search_addr')
        await p.fill('#q', ''); await p.evaluate("document.querySelector('#q').blur();document.querySelector('#suggest').classList.add('hidden')")
        await p.click('#layersBtn'); await check(p, v, '03_layers'); await p.evaluate("document.querySelector('#layersPop').classList.add('hidden')")
        await p.evaluate("window._app.showPlace({name:'Real Canadian Superstore with a very long name for wrapping tests',address:'3515 Mayor Magrath Drive South, Lethbridge, Alberta T1K 8A3',lat:49.66,lng:-112.79,category:'shop=supermarket'})"); await p.wait_for_timeout(2000); await check(p, v, '04_place')
        await p.evaluate("document.querySelector('#panelX')?.click()")
        for k, secs in [('05_drawer_a', {'mine':1,'explore':1,'tools':1}), ('06_drawer_settings', {'settings':1}), ('07_drawer_navcard', {'navcard':1}), ('08_drawer_b', {'settings2':1,'about':1})]:
            await p.evaluate(f"localStorage.setItem('drawerOpen','{json.dumps(secs)}');window._app.openDrawer()"); await check(p, v, k); await p.evaluate("window._app.closeDrawer()"); await p.wait_for_timeout(300)
    await p.evaluate(f"(()=>{{const a=window._app;a.S.from={{name:'A',lat:53.5444,lng:-113.4909}};a.openDirections({DEST},true)}})()"); await p.wait_for_timeout(8000)
    await check(p, v, '10_nav', shot=(sc != 1 or th == 'west'))
    isl = await p.evaluate("""(()=>{const r=e=>{const x=document.querySelector(e);if(!x||x.classList.contains('hidden'))return null;const b=x.getBoundingClientRect();return b.width?b:null};const c=r('#controls');const o=['#navBanner','#navFoot'].map(r).filter(Boolean);return {ctl:c&&[c.left,c.top,c.right,c.bottom].map(Math.round),hit:o.some(b=>c&&c.left<b.right&&c.right>b.left&&c.top<b.bottom&&c.bottom>b.top)}})()""")
    RES.append({'v': v, 'surface': 'island', 'bad': [['island-overlaps-navcard', isl]] if isl['hit'] else []}); print(v, 'island', isl, flush=True)
    await c.close()
async def main():
    only = sys.argv[2].split(',') if len(sys.argv) > 2 else None
    async with async_playwright() as pw:
        b = await pw.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        for th, md, pk in VARS:
            if only and (pk['id'] if pk else th) not in only: continue
            for sc in [1, 1.5]:
                try: await run(b, th, md, pk, sc)
                except Exception as e: print(th, md, pk and pk['id'], sc, 'ERR', str(e)[:200], flush=True); RES.append({'v': f"{pk and pk['id'] or th}_{md}_s{sc}", 'surface': 'ERR', 'bad': [str(e)[:200]]})
        await b.close()
    json.dump(RES, open(OUT + 'audit.json', 'w'), indent=1)
    print('TOTAL surfaces', len(RES), 'with issues', sum(1 for r in RES if r['bad']))
asyncio.run(main())
