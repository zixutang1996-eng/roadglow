# v1.1 scroll-window stress test + frame timings + chip tap latency. Usage: python3 anim11.py <out.json> [cpu-throttle]
import asyncio,sys,json
from playwright.async_api import async_playwright
U='http://127.0.0.1:18781/'; OUT=sys.argv[1]; THR=int(sys.argv[2]) if len(sys.argv)>2 else 1
CHK="""()=>['#panel','#suggest','#layersPop','#toast'].map(s=>{const e=document.querySelector(s);if(!e)return null;const h=e.classList.contains('hidden'),cs=getComputedStyle(e);
 const bad=[];if(e.classList.contains('rg-unroll')||e.classList.contains('rg-rollup'))bad.push('stuck-anim');if(h&&cs.display!=='none')bad.push('hidden-but-shown');if(h&&e.style.display)bad.push('inline-display-left');
 if(!h&&cs.display==='none')bad.push('open-but-none');return {s,h,bad}}).filter(Boolean)"""
FR="""(fn)=>new Promise(res=>{const t=[];const s=performance.now();const f=n=>{t.push(n);if(n-s<700)requestAnimationFrame(f);else{const d=t.slice(1).map((x,i)=>x-t[i]);res({frames:t.length,worst:+Math.max(...d).toFixed(1),over25:d.filter(x=>x>25).length,p50:+d.sort((a,b)=>a-b)[d.length>>1].toFixed(1)})}};requestAnimationFrame(f);eval(fn)})"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    c=await b.new_context(viewport={'width':461,'height':1024},device_scale_factor=2,locale='zh-CN',service_workers='block')
    await c.add_init_script("localStorage.setItem('theme','\"west\"');localStorage.setItem('mode','\"light\"');localStorage.setItem('lang','zh');localStorage.setItem('a2hsSeen','1');localStorage.setItem('recents',JSON.stringify([{name:'Rexall',address:'10060 Jasper Ave NW',lat:53.5413,lng:-113.4935,category:'amenity=pharmacy'}]));")
    pg=await c.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.goto(U+'#15.2/53.5444/-113.4950'); await pg.wait_for_timeout(3000)
    await pg.evaluate("async()=>{const r=await fetch('packs/index.json');const c=await r.json();const e=c.packs.find(x=>x.id==='sanguo');const u8=new Uint8Array(await (await fetch('packs/'+e.url)).arrayBuffer());await window._app.installPackBytes(u8,e.sha256)}")
    await pg.evaluate("localStorage.setItem('skin','\"sanguo\"')"); await pg.reload(); await pg.wait_for_function('window.__rgMapReady',timeout=90000); await pg.wait_for_timeout(3000)
    cdp=await c.new_cdp_session(pg)
    if THR>1: await cdp.send('Emulation.setCPUThrottlingRate',{'rate':THR})
    R={'throttle':THR,'tests':{}}
    async def settle(name):
      await pg.wait_for_timeout(700); r=await pg.evaluate(CHK); R['tests'][name]=r; return r
    T="document.querySelector('#layersPop').classList.toggle('hidden')"; LP="(()=>{const e=document.querySelector('#layersPop');if(e.classList.contains('hidden'))document.querySelector('#layersBtn').click()})()"; RST="document.querySelector('#layersPop').classList.add('hidden')"
    # frame timings: open / close each window
    R['frames']={}
    for rnd in ('cold','warm'):
      R['frames'][rnd+'_layers_open']=await pg.evaluate(FR,LP); R['frames'][rnd+'_layers_close']=await pg.evaluate(FR,"document.querySelector('#layersPop [data-x]').click()")
      await pg.wait_for_timeout(400)
      R['frames'][rnd+'_place_open']=await pg.evaluate(FR,"window._app.showPlace({name:'Rexall',address:'10060 Jasper Ave NW',lat:53.5413,lng:-113.4935,category:'amenity=pharmacy'})")
      R['frames'][rnd+'_place_close']=await pg.evaluate(FR,"document.querySelector('#panelX').click()")
      await pg.wait_for_timeout(400)
      R['frames'][rnd+'_drawer_open']=await pg.evaluate(FR,"window._app.openDrawer()"); R['frames'][rnd+'_drawer_close']=await pg.evaluate(FR,"window._app.closeDrawer()")
      await pg.wait_for_timeout(400)
      await pg.focus('#q'); R['frames'][rnd+'_suggest_open']=await pg.evaluate(FR,"document.querySelector('#q').dispatchEvent(new Event('focus'))")
      await pg.keyboard.press('Escape'); await pg.wait_for_timeout(600)
    await pg.evaluate(RST); await pg.wait_for_timeout(600)
    # rapid toggles: 9 toggles 30 ms apart → open
    for i in range(9): await pg.evaluate(T); await pg.wait_for_timeout(30)
    r=await settle('rapid9'); R['tests']['rapid9_expect_open']=not [x for x in r if x['s']=='#layersPop'][0]['h']
    for i in range(10): await pg.evaluate(T); await pg.wait_for_timeout(16)
    await settle('rapid10_same_frame_pairs'); await pg.evaluate(RST); await pg.wait_for_timeout(600)
    # open during close (reverse mid-way), close during open
    await pg.evaluate(LP); await pg.wait_for_timeout(500); await pg.evaluate(T); await pg.wait_for_timeout(120); await pg.evaluate(LP)
    r=await settle('open_during_close'); R['tests']['open_during_close_open']=not [x for x in r if x['s']=='#layersPop'][0]['h']
    await pg.evaluate(RST); await pg.wait_for_timeout(600); await pg.evaluate(LP); await pg.wait_for_timeout(100); await pg.evaluate(T); r=await settle('close_during_open'); R['tests']['close_during_open_closed']=[x for x in r if x['s']=='#layersPop'][0]['h']
    # resize / rotation during the unroll
    await pg.evaluate(LP); await pg.wait_for_timeout(100); await pg.set_viewport_size({'width':1024,'height':461}); await pg.wait_for_timeout(100); await pg.set_viewport_size({'width':461,'height':1024}); r=await settle('resize_during_open'); R['tests']['resize_open']=not [x for x in r if x['s']=='#layersPop'][0]['h']
    # back button (same chain as native.js) during and after the roll-up
    BACK="""(()=>{const vis=s=>{const e=document.querySelector(s);return e&&!e.classList.contains('hidden')&&e.offsetParent!==null?e:null};for(const s of ['#layersPop','#suggest','#panel']){const e=vis(s);if(e){e.classList.add('hidden');return s}}return null})()"""
    a=await pg.evaluate(BACK); await pg.wait_for_timeout(60); b2=await pg.evaluate(BACK); R['tests']['back_twice']=[a,b2]; await settle('back_during_close')
    # every window open+close
    for nm,o,x in [('panel',"window._app.showPlace({name:'Rexall',address:'x',lat:53.5413,lng:-113.4935,category:'amenity=pharmacy'})","document.querySelector('#panelX').click()"),('toast',"document.querySelector('#toast').classList.remove('hidden')","document.querySelector('#toast').classList.add('hidden')")]:
      await pg.evaluate(o); await pg.wait_for_timeout(80); await pg.evaluate(x); await pg.wait_for_timeout(40); await pg.evaluate(o); await settle(nm+'_reopen'); await pg.evaluate(x); await settle(nm+'_closed')
    # chip tap latency: pointerdown → next painted frame, and click → next frame (5 taps)
    lat=[]
    for i in range(5):
      v=await pg.evaluate("""()=>new Promise(res=>{const ch=[...document.querySelectorAll('#chips .chip')][1];const t0=performance.now();ch.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));ch.click();requestAnimationFrame(()=>setTimeout(()=>res(+(performance.now()-t0).toFixed(1)),0))})""")
      lat.append(v); await pg.wait_for_timeout(900); await pg.evaluate("document.querySelector('#suggest')?.classList.add('hidden');document.querySelector('#panel')?.classList.add('hidden')"); await pg.wait_for_timeout(500)
    R['chip_tap_to_frame_ms']=lat
    R['errors']=errs; R['bad']=[ (k,x) for k,v in R['tests'].items() if isinstance(v,list) and v and isinstance(v[0],dict) for x in v if x['bad']]
    json.dump(R,open(OUT,'w'),indent=1,ensure_ascii=False); print(json.dumps({k:R[k] for k in ('frames','chip_tap_to_frame_ms','bad','errors')},indent=0)); print({k:v for k,v in R['tests'].items() if not isinstance(v,list) or (v and not isinstance(v[0],dict))})
    await b.close()
asyncio.run(main())
