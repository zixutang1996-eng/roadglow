# Ink pack screenshots + overlap check. Usage: python3 shot.py <base-url> <outdir> [modes] [langs] [scale]
import asyncio,json,sys,os
from playwright.async_api import async_playwright
U=sys.argv[1]; OUT=sys.argv[2]; os.makedirs(OUT,exist_ok=True)
MODES=(sys.argv[3] if len(sys.argv)>3 else 'light,dark').split(','); LANGS=(sys.argv[4] if len(sys.argv)>4 else 'zh').split(',')
SCALE=sys.argv[5] if len(sys.argv)>5 else '1'
OVL=open(os.path.join(os.path.dirname(__file__),'overlap.js')).read()
async def install(pg):
  r=await pg.evaluate("""async()=>{const PK=await import('/src/packs.js');const c=await PK.catalog(location.href);const e=c.find(x=>x.id==='sanguo');
    const r=await PK.installFromUrl(e.url,e.sha256,'0.9.6');return r.id}""")
  return r
async def run(p,mode,lang):
  b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  c=await b.new_context(viewport={'width':412,'height':915},device_scale_factor=2,locale='zh-CN' if lang=='zh' else 'en-US',service_workers='block')
  await c.add_init_script(f"localStorage.setItem('theme','\"west\"');localStorage.setItem('mode','\"{mode}\"');localStorage.setItem('lang','{lang}');localStorage.setItem('textScale','{SCALE}');localStorage.setItem('a2hsSeen','1');localStorage.setItem('recents',JSON.stringify([{{name:'Rexall',address:'10060 Jasper Ave NW, Edmonton',lat:53.5413,lng:-113.4935,category:'amenity=pharmacy'}},{{name:'Edmonton Valley Zoo Long Name Test Pavilion',address:'13315 Buena Vista Rd NW',lat:53.5232,lng:-113.5263}}]));"
    +f"const pos={{coords:{{latitude:53.5444,longitude:-113.4909,accuracy:10,heading:null,speed:null}}}};Object.defineProperty(navigator,'geolocation',{{value:{{getCurrentPosition:s=>setTimeout(()=>s(pos),10),watchPosition:s=>{{setTimeout(()=>s(pos),10);return 1}},clearWatch(){{}}}}}});")
  pg=await c.new_page(); pg.on('pageerror',lambda e:print('PAGEERR',e))
  await pg.goto(U+'#15.2/53.5444/-113.4950'); await pg.wait_for_timeout(4000)
  await install(pg); await pg.evaluate("localStorage.setItem('skin','\"sanguo\"')")
  await pg.reload(); await pg.wait_for_function('window.__rgMapReady',timeout=90000); await pg.wait_for_timeout(5000)
  sfx=f'{mode}_{lang}'+('' if SCALE=='1' else f'_x{SCALE}'); res={}
  async def shot(n):
    await pg.screenshot(path=f'{OUT}/{n}_{sfx}.png'); res[n]=await pg.evaluate(OVL)
  await shot('map')
  await pg.click('#menuBtn',force=True); await pg.wait_for_timeout(90); await pg.screenshot(path=f'{OUT}/drawer_mid_{sfx}.png'); await pg.wait_for_timeout(700); await shot('drawer')
  await pg.evaluate("document.querySelectorAll('#drawer .dsec:not(.open) .dsh[data-sech]').forEach(h=>h.click())"); await pg.wait_for_timeout(300)
  await pg.evaluate("document.querySelector('#drawer').scrollTop=99999"); await pg.wait_for_timeout(200); await shot('drawer_bottom')
  await pg.evaluate("document.querySelector('#drawer').scrollTop=0;document.querySelector('[data-sec=settings]').scrollIntoView()"); await pg.wait_for_timeout(200); await shot('settings')
  await pg.mouse.click(400,500); await pg.wait_for_timeout(600)
  await pg.evaluate('window._app.closeDrawer()'); await pg.wait_for_timeout(600); await pg.focus('#q'); await pg.keyboard.type('coffee' if lang=='en' else 'cafe'); await pg.wait_for_timeout(3500); await shot('search')
  await pg.keyboard.press('Escape'); await pg.wait_for_timeout(500)
  await pg.evaluate("document.querySelector('#layersBtn').click()"); await pg.wait_for_timeout(120); await pg.screenshot(path=f'{OUT}/skin_mid_{sfx}.png'); await pg.wait_for_timeout(500); await shot('skinswitch')
  await pg.evaluate("document.querySelector('#layersPop [data-x]').click()"); await pg.wait_for_timeout(500)
  await pg.evaluate("window._app.showPlace({name:'Rexall',address:'10060 Jasper Ave NW, Edmonton',lat:53.5413,lng:-113.4935,category:'amenity=pharmacy'})"); await pg.wait_for_timeout(120); await pg.screenshot(path=f'{OUT}/place_mid_{sfx}.png'); await pg.wait_for_timeout(3000); await shot('place')
  await pg.evaluate("document.querySelector('#panelX')?.click()"); await pg.wait_for_timeout(700)
  await pg.evaluate("window._app.tools.packs()"); await pg.wait_for_timeout(2500); await shot('packs')
  await pg.evaluate("document.querySelector('#panelX')?.click()"); await pg.wait_for_timeout(700)
  await pg.evaluate("window._app.tools.update()"); await pg.wait_for_timeout(2500); await shot('update')
  await pg.evaluate("document.querySelector('#panelX')?.click()"); await pg.wait_for_timeout(700)
  await pg.evaluate("(()=>{const a=window._app;a.S.from={name:'A',lat:53.5444,lng:-113.4909};a.openDirections({name:'埃德蒙顿谷动物园',lat:53.5232,lng:-113.5263},true)})()"); await pg.wait_for_timeout(9000); await shot('nav')
  json.dump(res,open(f'{OUT}/overlap_{sfx}.json','w'),indent=1)
  await b.close(); return res
async def main():
  async with async_playwright() as p:
    for m in MODES:
      for l in LANGS:
        r=await run(p,m,l); print(m,l,{k:len(v) for k,v in r.items()},flush=True)
asyncio.run(main())
