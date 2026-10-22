# v0.9.4 update screen + drawer entry + start view (web build, 461x1024; GitHub API mocked for the "new version" state)
import asyncio, json
from playwright.async_api import async_playwright
BASE='http://127.0.0.1:18781/'; OUT='/workspace/gamenav/screenshots/v094/'
INIT="""(([th,md])=>{const s=(k,v)=>localStorage.setItem(k,JSON.stringify(v));s('theme',th);s('mode',md);s('pal','n2');localStorage.setItem('lang','zh');s('a2hsSeen','1');s('view',{c:[116.4864,39.9215],z:13});s('drawerOpen',{});})(%s)"""
REL={'tag_name':'v0.9.5','name':'RoadGlow 0.9.5','published_at':'2026-10-22T03:00:00Z','body':'## 新功能\n- 菜单里新增“检查更新”\n- 新图标\n- 定位关闭时一键开启','assets':[{'name':'RoadGlow.apk','size':12300000}],'html_url':'x'}
async def run(b,v):
    th,md=v.split('_'); c=await b.new_context(viewport={'width':461,'height':1024},is_mobile=True,has_touch=True,service_workers='block')
    async def gh(route): await route.fulfill(status=200,content_type='application/json',body=json.dumps(REL))
    await c.route('https://api.github.com/**',gh)
    p=await c.new_page(); await p.add_init_script(INIT%json.dumps([th,md]))
    await p.goto(BASE); await p.wait_for_function('window._map&&_map.loaded()',timeout=90000); await p.wait_for_timeout(2500)
    await p.evaluate("window._app.openDrawer()"); await p.wait_for_timeout(800); await p.evaluate("document.querySelector('#drawer').scrollTop=9999"); await p.wait_for_timeout(400); await p.screenshot(path=f'{OUT}{v}_drawer_update_entry.png')
    await p.click('[data-tool="update"]'); await p.wait_for_timeout(1500); await p.screenshot(path=f'{OUT}{v}_update_new.png')
    await c.unroute('https://api.github.com/**')
    async def gh2(route): r=dict(REL,tag_name='v0.9.4',name='RoadGlow 0.9.4'); await route.fulfill(status=200,content_type='application/json',body=json.dumps(r))
    await c.route('https://api.github.com/**',gh2)
    await p.evaluate("window._app.tools.update()"); await p.wait_for_timeout(1500); await p.screenshot(path=f'{OUT}{v}_update_uptodate.png')
    await c.close()
async def start(b):
    c=await b.new_context(viewport={'width':461,'height':1024},service_workers='block'); p=await c.new_page()
    log=[]; p.on('request',lambda r: log.append(r.url) if 'ipapi' in r.url else None)
    await p.goto(BASE); await p.wait_for_function('window._map&&_map.loaded()',timeout=90000)
    c0=await p.evaluate("[_map.getCenter().lng,_map.getCenter().lat,_map.getZoom()]"); await p.wait_for_timeout(4000)
    c1=await p.evaluate("[_map.getCenter().lng,_map.getCenter().lat,_map.getZoom()]"); await p.screenshot(path=f'{OUT}start_fresh_ip.png')
    print('start first render',c0,'after',c1,'ipapi requests',log); await c.close()
async def main():
    async with async_playwright() as pw:
        b=await pw.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        for v in ['neon_dark','neon_light','west_dark','west_light']: await run(b,v)
        await start(b); await b.close()
asyncio.run(main())
