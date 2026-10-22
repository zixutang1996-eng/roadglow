# v0.9.3 perf harness: 461x1024@2x, CPU 4x throttle. Usage: python3 perf093.py <label> [url]
import asyncio,json,sys,statistics
from playwright.async_api import async_playwright
LABEL=sys.argv[1]; URL=sys.argv[2] if len(sys.argv)>2 else 'http://127.0.0.1:18781/'
FR="""(ms)=>new Promise(res=>{const t=[];let s=performance.now();const f=n=>{t.push(n);if(n-s<ms)requestAnimationFrame(f);else{const d=t.slice(1).map((x,i)=>x-t[i]);res({frames:t.length,fps:+(1000*(t.length-1)/(t[t.length-1]-t[0])).toFixed(1),dropped:d.filter(x=>x>25).length,worst:+Math.max(...d).toFixed(1)})}};requestAnimationFrame(f)})"""
async def run(theme,mode):
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    c=await b.new_context(viewport={'width':461,'height':1024},device_scale_factor=2,locale='zh-CN',has_touch=False,service_workers='block')
    await c.add_init_script(f"localStorage.setItem('theme','\"{theme}\"');localStorage.setItem('mode','\"{mode}\"');localStorage.setItem('lang','zh');window.__t0=performance.now();"+
      "const _i=setInterval(()=>{if(window._map){clearInterval(_i);_map.once('render',()=>window.__fr=performance.now());_map.once('idle',()=>window.__idle=performance.now());}},5);")
    pg=await c.new_page(); cdp=await c.new_cdp_session(pg); await cdp.send('Emulation.setCPUThrottlingRate',{'rate':4})
    await pg.goto(URL+'#15.3/49.6765/-112.8975'); await pg.wait_for_function('window.__idle',timeout=120000)
    r={'first_render_ms':round(await pg.evaluate('__fr')),'map_idle_ms':round(await pg.evaluate('__idle'))}
    await pg.wait_for_timeout(1500)
    # drawer open: frames during 500ms after tap
    fr=pg.evaluate(FR,600); await pg.click('#menuBtn'); r['drawer_open']=await fr
    r['drawer_open_ms']=await pg.evaluate("new Promise(res=>{const d=document.querySelector('#drawer');const t0=performance.now();requestAnimationFrame(()=>requestAnimationFrame(()=>res(Math.round(performance.now()-t0))))})")
    await pg.wait_for_timeout(500); fr=pg.evaluate(FR,600); await pg.mouse.click(440,500); r['drawer_close']=await fr
    await pg.wait_for_timeout(500)
    # tap response: pointerdown -> next painted frame, on layers button and a chip
    async def tap(sel):
      await pg.evaluate("s=>{const e=document.querySelector(s);window.__tap=null;e.addEventListener('pointerdown',()=>{const t=performance.now();requestAnimationFrame(()=>setTimeout(()=>window.__tap=performance.now()-t,0))},{once:true,capture:true})}",sel)
      await pg.click(sel); await pg.wait_for_function('window.__tap!==null'); return round(await pg.evaluate('__tap'),1)
    r['tap_layers_ms']=await tap('#layersBtn'); await pg.click('#layersBtn')
    r['tap_chip_ms']=await tap('#chips .chip'); await pg.wait_for_timeout(1500)
    # pan fps
    fr=pg.evaluate(FR,1500); await pg.mouse.move(230,600); await pg.mouse.down()
    for i in range(30): await pg.mouse.move(230-i*6,600-i*4); await pg.wait_for_timeout(40)
    await pg.mouse.up(); r['pan']=await fr
    fr=pg.evaluate(FR,1500); await pg.evaluate("_map.zoomTo(_map.getZoom()+1.5,{duration:1200})"); r['zoom']=await fr
    await b.close(); return r
async def main():
  out={}
  for th,md in [('west','dark'),('neon','dark')]:
    out[f'{th}_{md}']=await run(th,md); print(th,md,json.dumps(out[f'{th}_{md}']),flush=True)
  json.dump(out,open(f'/workspace/gamenav/screenshots/perf_{LABEL}.json','w'),indent=1)
asyncio.run(main())
