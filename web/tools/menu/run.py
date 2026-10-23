# v0.9.9 menu cleanup test: drawer / Map skins / Layers sheet per skin × mode × lang, overlap + clip audit + timings.
# Usage: python3 run.py <base-url> <outdir> <skins comma> [w x h] [shots 0/1]
import asyncio,json,sys,os
from playwright.async_api import async_playwright
U,OUT=sys.argv[1],sys.argv[2]; SK=sys.argv[3].split(','); W,H=map(int,(sys.argv[4] if len(sys.argv)>4 else '412x915').split('x')); SHOTS=(sys.argv[5] if len(sys.argv)>5 else '1')=='1'; LANGS=(sys.argv[6] if len(sys.argv)>6 else 'zh,en').split(','); MODES=(sys.argv[7] if len(sys.argv)>7 else 'light,dark').split(',')
os.makedirs(OUT,exist_ok=True); D=os.path.dirname(__file__)
OVL=open(os.path.join(D,'../ink/overlap.js')).read(); CLIP=open(os.path.join(D,'clip.js')).read()
FR="""window.__fr=[];window.__lt=[];if(!window.__frOn){window.__frOn=1;let t=performance.now();const f=n=>{window.__fr.push(n-t);t=n;requestAnimationFrame(f)};requestAnimationFrame(f);
 try{new PerformanceObserver(l=>l.getEntries().forEach(e=>window.__lt.push(Math.round(e.duration)))).observe({type:'longtask',buffered:false})}catch(e){}}"""
async def timed(pg,js,wait=700):
  await pg.evaluate("window.__fr=[];window.__lt=[]"); await pg.evaluate(js); await pg.wait_for_timeout(wait)
  r=await pg.evaluate("({max:Math.round(Math.max(0,...window.__fr.slice(1))),n50:window.__fr.slice(1).filter(x=>x>50).length,lt:window.__lt.slice()})"); return r
async def run(p,skin,mode,lang,res,perf):
  b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  c=await b.new_context(viewport={'width':W,'height':H},device_scale_factor=2,locale='zh-CN' if lang=='zh' else 'en-US',service_workers='block')
  th=skin if skin in ('neon','west','space','nord','tac') else 'west'
  await c.add_init_script(f"localStorage.setItem('theme','\"{th}\"');localStorage.setItem('mode','\"{mode}\"');localStorage.setItem('lang','{lang}');localStorage.setItem('a2hsSeen','1');localStorage.setItem('drawerOpen',JSON.stringify({{mine:1,map:1,explore:1,navv:1,settings:1,about:1}}));localStorage.setItem('recents',JSON.stringify([{{name:'Rexall',address:'10060 Jasper Ave NW, Edmonton',lat:53.5413,lng:-113.4935,category:'amenity=pharmacy'}}]));"
    +"const pos={coords:{latitude:53.5444,longitude:-113.4909,accuracy:10,heading:null,speed:null}};Object.defineProperty(navigator,'geolocation',{value:{getCurrentPosition:s=>setTimeout(()=>s(pos),10),watchPosition:s=>{setTimeout(()=>s(pos),10);return 1},clearWatch(){}}});")
  pg=await c.new_page(); pg.on('pageerror',lambda e:print('PAGEERR',skin,e,flush=True))
  await pg.goto(U+'#15.2/53.5444/-113.4950'); await pg.wait_for_function('window.__rgMapReady',timeout=120000)
  if skin not in ('neon','west','space','nord','tac'):
    await pg.evaluate("""async id=>{const c=await (await fetch('packs/index.json')).json();const e=c.packs.find(x=>x.id===id);const u8=new Uint8Array(await (await fetch('packs/'+e.url)).arrayBuffer());await window._app.installPackBytes(u8,e.sha256)}""",skin)
    await pg.evaluate(f"localStorage.setItem('skin','\"{skin}\"')"); await pg.reload(); await pg.wait_for_function('window.__rgMapReady',timeout=120000)
  await pg.wait_for_timeout(int(os.environ.get('SETTLE','3500'))); await pg.evaluate(FR)
  if os.environ.get('HIDEMAP'): await pg.evaluate("document.querySelector('.maplibregl-canvas').style.visibility='hidden'")
  sfx=f'{skin}_{mode}_{lang}'; R=res.setdefault(sfx,{}); P=perf.setdefault(sfx,{})
  async def check(n):
    if SHOTS: await pg.screenshot(path=f'{OUT}/{n}_{sfx}.png')
    R[n]={'overlap':await pg.evaluate(OVL),'clip':await pg.evaluate(CLIP)}
  for i in range(3):
    P.setdefault('drawer_open',[]).append(await timed(pg,"window._app.openDrawer?window._app.openDrawer():document.querySelector('#menuBtn').click()",600))
    if i==0:
      if skin=='sanguo': await pg.evaluate("document.querySelector('[data-ink=all]')?.click()"); await pg.wait_for_timeout(300)
      await check('drawer'); P.setdefault('drawer_scroll',[]).append(await timed(pg,"(async()=>{const d=document.querySelector('#drawer');for(let k=0;k<20;k++){d.scrollTop+=60;await new Promise(r=>requestAnimationFrame(r))}})()",900))
      await check('drawer_bottom'); await pg.evaluate("document.querySelector('#drawer').scrollTop=0")
    P.setdefault('drawer_close',[]).append(await timed(pg,"window._app.closeDrawer()",500))
  for i in range(3):
    P.setdefault('sheet_open',[]).append(await timed(pg,"document.querySelector('#layersBtn').click()",500))
    if i==0:
      await check('layers'); await pg.evaluate("document.querySelector('#layersPop').classList.add('full')"); await pg.wait_for_timeout(300); await check('layers_full'); await pg.evaluate("document.querySelector('#layersPop').classList.remove('full')")
    P.setdefault('sheet_close',[]).append(await timed(pg,"document.querySelector('#layersBtn').click()",500))
  for i in range(2):
    P.setdefault('mapskins_open',[]).append(await timed(pg,"window._app.tools.packs()",1800))
    if i==0: await check('mapskins'); await pg.evaluate("document.querySelector('#panel')&&(document.querySelector('#panel').scrollTop=0)")
    await pg.evaluate("document.querySelector('#panelX')?.click()"); await pg.wait_for_timeout(400)
  for i in range(3):
    P.setdefault('place_open',[]).append(await timed(pg,"window._app.showPlace({name:'Rexall',address:'10060 Jasper Ave NW, Edmonton',lat:53.5413,lng:-113.4935,category:'amenity=pharmacy'})",1500))
    if i==0: await check('place')
    await pg.evaluate("document.querySelector('#panelX')?.click()"); await pg.wait_for_timeout(400)
  P['day_night']=[await timed(pg,"window._sheet.open();document.querySelector('#layersPop [data-md=%s]').click()"%('dark' if mode=='light' else 'light'),2500)]
  await pg.evaluate("window._sheet.close()"); await pg.wait_for_timeout(400)
  await pg.evaluate("document.querySelector('.maplibregl-canvas').style.visibility=''")
  P['zoom']=[await timed(pg,"window._map.zoomIn({duration:350})",900),await timed(pg,"window._map.zoomOut({duration:350})",900)]
  P['pan']=[await timed(pg,"window._map.panBy([200,120],{duration:500})",1000),await timed(pg,"window._map.panBy([-200,-120],{duration:500})",1000)]
  await b.close()
async def main():
  res,perf={},{}
  async with async_playwright() as p:
    for s in SK:
      for m in MODES:
        for l in LANGS:
          await run(p,s,m,l,res,perf); r=res[f'{s}_{m}_{l}']
          print(s,m,l,{k:(len(v['overlap']),len(v['clip'])) for k,v in r.items()},flush=True)
  tag=('ui_' if os.environ.get('HIDEMAP') else '')+f'{W}x{H}_'+'-'.join(SK)+'_'+'-'.join(MODES)+'_'+'-'.join(LANGS); json.dump(res,open(f'{OUT}/audit_{tag}.json','w'),indent=1,ensure_ascii=False); json.dump(perf,open(f'{OUT}/perf_{tag}.json','w'),indent=1)
asyncio.run(main())
