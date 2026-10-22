# v0.9.3 UI surface audit: every surface x skin x mode at 461x1024 -> screenshots/v093/audit/
import asyncio, json, sys
from playwright.async_api import async_playwright
BASE = 'http://127.0.0.1:18781/'; OUT = '/workspace/gamenav/screenshots/v093/audit/'
VARS = sys.argv[1].split(',') if len(sys.argv) > 1 else ['neon_dark','neon_light','west_dark','west_light']
REC = [{'name':'Rexall','address':'10060 Jasper Ave NW, Edmonton','lat':53.5413,'lng':-113.4935,'category':'amenity=pharmacy'},
       {'name':'Quarters','address':'','lat':53.5446,'lng':-113.4813,'category':'railway=station'}]
INIT = """(([th,md,pal,rec])=>{const s=(k,v)=>localStorage.setItem(k,JSON.stringify(v));s('theme',th);s('mode',md);s('pal',pal);localStorage.setItem('lang','zh');s('a2hsSeen','1');s('recents',rec);s('saved',[rec[0]]);s('drawerOpen',{});
const pos={coords:{latitude:53.5444,longitude:-113.4909,accuracy:10,heading:null,speed:null}};Object.defineProperty(navigator,'geolocation',{value:{getCurrentPosition:s=>setTimeout(()=>s(pos),10),watchPosition:s=>{setTimeout(()=>s(pos),10);return 1},clearWatch(){}}});})(%s)"""
DEST = "{name:'埃德蒙顿谷动物园',lat:53.5232,lng:-113.5263}"
async def shot(p, n, v): await p.wait_for_timeout(700); await p.screenshot(path=f'{OUT}{v}_{n}.png')
async def fresh(c, v, th, md, pal):
    p = await c.new_page(); await p.add_init_script(INIT % json.dumps([th, md, pal, REC]))
    await p.goto(BASE + '#14/53.5444/-113.4909'); await p.wait_for_function('window._map&&_map.loaded()', timeout=90000); await p.wait_for_timeout(2500); return p
async def run(b, v, pal='n2'):
    th, md = v.split('_')[:2]
    c = await b.new_context(viewport={'width':461,'height':1024}, is_mobile=True, has_touch=True, service_workers='block')
    p = await fresh(c, v, th, md, pal)
    await p.click('#q'); await shot(p, '01_search_history', v)
    await p.fill('#q', 'coffee'); await p.wait_for_timeout(2500); await shot(p, '02_search_typed', v)
    await p.fill('#q', ''); await p.evaluate("document.querySelector('#q').blur();document.querySelector('#suggest').classList.add('hidden')")
    await p.click('#layersBtn'); await shot(p, '03_layers_popup', v); await p.evaluate("document.querySelector('#layersPop').classList.add('hidden')")
    await p.evaluate("window._app.showPlace({name:'Rexall',address:'10060 Jasper Ave NW, Edmonton',lat:53.5413,lng:-113.4935,category:'amenity=pharmacy'})"); await p.wait_for_timeout(2500); await shot(p, '04_place_card', v)
    await p.evaluate("document.querySelector('#panel').scrollTop=600"); await shot(p, '04b_place_card_lower', v)
    await p.evaluate(f"window._app.openDirections({DEST})"); await p.wait_for_timeout(6000); await shot(p, '05_route_planner', v)
    await p.evaluate("const s=document.querySelector('#steps');s&&s.scrollIntoView()"); await shot(p, '06_turn_list', v)
    await p.evaluate("window._app.tools.weather()"); await p.wait_for_timeout(3000); await shot(p, '07_weather', v)
    await p.evaluate("window._app.tools.list('收藏')"); await shot(p, '08_list_page', v)
    await p.evaluate("window._app.openSideQuests()"); await p.wait_for_timeout(2500); await shot(p, '09_side_quests', v)
    await p.evaluate("window._app.tools.measure()"); await shot(p, '10_measure_tool', v)
    await p.evaluate("document.querySelector('#panelX')?.click()")
    for k, secs in [('11_drawer_mine_explore_tools', {'mine':1,'explore':1,'tools':1}), ('12_drawer_settings', {'settings':1}), ('13_drawer_navcard', {'navcard':1}), ('14_drawer_skins_lang_about', {'settings2':1,'about':1})]:
        await p.evaluate(f"localStorage.setItem('drawerOpen','{json.dumps(secs)}');window._app.openDrawer()"); await shot(p, k, v)
        if k == '12_drawer_settings': await p.evaluate("document.querySelector('#drawer').scrollTop=520"); await shot(p, '12b_drawer_settings_lower', v)
        await p.evaluate("window._app.closeDrawer()"); await p.wait_for_timeout(300)
    await p.evaluate("const t=document.querySelector('#toast');t.textContent='已复制';t.classList.remove('hidden')"); await shot(p, '15_toast', v)
    await p.evaluate("document.querySelector('#toast').classList.add('hidden')")
    await p.evaluate(f"(()=>{{const a=window._app;a.S.from={{name:'A',lat:53.5444,lng:-113.4909}};a.openDirections({DEST},true)}})()"); await p.wait_for_timeout(8000); await shot(p, '16_nav_card', v)
    await c.close()
async def nogl(b, v):
    th, md = v.split('_')[:2]
    c = await b.new_context(viewport={'width':461,'height':1024}, service_workers='block'); p = await c.new_page()
    await p.add_init_script(INIT % json.dumps([th, md, 'n2', REC])); await p.goto(BASE); await p.wait_for_timeout(4000); await shot(p, '17_no_webgl', v); await c.close()
async def main():
    async with async_playwright() as pw:
        b = await pw.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        b2 = await pw.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--disable-3d-apis','--disable-webgl'])
        for v in VARS:
            if v.startswith('west_dark_n'):
                pal = v.split('_')[2]; c = await b.new_context(viewport={'width':461,'height':1024}, is_mobile=True, has_touch=True, service_workers='block')
                p = await fresh(c, v, 'west', 'dark', pal); await p.click('#q'); await shot(p, '01_search_history', v)
                await p.evaluate("document.querySelector('#q').blur();document.querySelector('#suggest').classList.add('hidden')"); await p.click('#layersBtn'); await shot(p, '03_layers_popup', v); await c.close(); continue
            try: await run(b, v)
            except Exception as e: print(v, 'ERR', e)
            await nogl(b2, v)
        await b.close(); await b2.close()
asyncio.run(main())
