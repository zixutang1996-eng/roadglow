# Synth packs (synthb/synthc) screen shots matching the v4 mockup screens: map, search, drawer, skins, place, nav.
# Usage: python3 shoot.py <base-url> <outdir> <skin> [WxH] [langs] [modes]
import asyncio,sys,os,json
from playwright.async_api import async_playwright
U,OUT,SK=sys.argv[1:4];W,H=map(int,(sys.argv[4] if len(sys.argv)>4 else '412x915').split('x'));LANGS=(sys.argv[5] if len(sys.argv)>5 else 'zh,en').split(',');MODES=(sys.argv[6] if len(sys.argv)>6 else 'dark,light').split(',')
os.makedirs(OUT,exist_ok=True);OVL=open(os.path.join(os.path.dirname(__file__),'../ink/overlap.js')).read()
async def one(p,mode,lang,res):
  b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  c=await b.new_context(viewport={'width':W,'height':H},device_scale_factor=2,locale='zh-CN' if lang=='zh' else 'en-US',service_workers='block')
  await c.add_init_script(f"localStorage.setItem('mode','\"{mode}\"');localStorage.setItem('lang','{lang}');localStorage.setItem('a2hsSeen','1');"
    +"const pos={coords:{latitude:53.5444,longitude:-113.4909,accuracy:10,heading:null,speed:null}};Object.defineProperty(navigator,'geolocation',{value:{getCurrentPosition:s=>setTimeout(()=>s(pos),10),watchPosition:s=>{setTimeout(()=>s(pos),10);return 1},clearWatch(){}}});")
  pg=await c.new_page();pg.on('pageerror',lambda e:print('PAGEERR',e,flush=True))
  await pg.goto(U+'#15.2/53.5444/-113.4950');await pg.wait_for_function('window.__rgMapReady',timeout=120000)
  await pg.evaluate("""async id=>{const c=await (await fetch('packs/index.json')).json();const e=c.packs.find(x=>x.id===id);const u8=new Uint8Array(await (await fetch('packs/'+e.url)).arrayBuffer());await window._app.installPackBytes(u8,e.sha256)}""",SK)
  await pg.evaluate(f"localStorage.setItem('skin','\"{SK}\"')");await pg.reload();await pg.wait_for_function('window.__rgMapReady',timeout=120000);await pg.wait_for_timeout(7000)
  sfx=f'{mode}_{lang}';R=res.setdefault(sfx,{})
  async def shot(n,wait=900):
    await pg.wait_for_timeout(wait);await pg.screenshot(path=f'{OUT}/{n}_{sfx}.png');R[n]=await pg.evaluate(OVL)
  await shot('map',100)
  await pg.evaluate("window._app.openDrawer()");await shot('drawer');await pg.evaluate("window._app.closeDrawer()")
  await pg.evaluate("window._app.tools.packs()");await shot('skins',1800);await pg.evaluate("document.querySelector('#panelX')?.click()");await pg.wait_for_timeout(400)
  await pg.fill('#q','coffee' if lang=='en' else '咖啡');await pg.wait_for_timeout(2500);await shot('search');await pg.fill('#q','');await pg.evaluate("document.activeElement.blur()")
  await pg.evaluate("window._app.showPlace({name:'Rexall',address:'10060 Jasper Ave NW, Edmonton',lat:53.5413,lng:-113.4935,category:'amenity=pharmacy'})");await shot('place',1800)
  await pg.evaluate("document.querySelector('#panelX')?.click()");await pg.wait_for_timeout(400)
  await pg.evaluate("()=>{const a=window._app;a.S.from={name:'A',lat:53.5444,lng:-113.4909};a.openDirections({name:'B',lat:53.5232,lng:-113.5065},true)}");await shot('nav',14000)
  await b.close()
async def main():
  res={}
  async with async_playwright() as p:
    for m in MODES:
      for l in LANGS: await one(p,m,l,res);print(SK,m,l,{k:len(v) for k,v in res[f'{m}_{l}'].items()},flush=True)
  json.dump(res,open(f'{OUT}/overlap_{SK}.json','w'),indent=1,ensure_ascii=False)
asyncio.run(main())
