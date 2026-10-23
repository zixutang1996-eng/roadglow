import asyncio,json,sys
from playwright.async_api import async_playwright
U=sys.argv[1]; ACT=sys.argv[2]
async def m():
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  c=await b.new_context(viewport={'width':412,'height':915},device_scale_factor=2,locale='en-US',service_workers='block')
  await c.add_init_script("localStorage.setItem('theme','\"west\"');localStorage.setItem('mode','\"light\"');localStorage.setItem('lang','en');localStorage.setItem('a2hsSeen','1')")
  pg=await c.new_page(); await pg.goto(U+'#15.2/53.5444/-113.4950'); await pg.wait_for_function('window.__rgMapReady',timeout=120000); await pg.wait_for_timeout(8000)
  await pg.evaluate("document.querySelector('.maplibregl-canvas').style.visibility='hidden'"); await pg.wait_for_timeout(500)
  await b.start_tracing(page=pg,path='/tmp/tr.json',categories=['devtools.timeline','disabled-by-default-devtools.timeline','blink','cc','gpu','viz'])
  await pg.evaluate(ACT); await pg.wait_for_timeout(800)
  await b.stop_tracing(); await b.close()
asyncio.run(m())
d=json.load(open('/tmp/tr.json')); ev=d['traceEvents'] if isinstance(d,dict) else d
from collections import Counter
C=Counter()
for e in ev:
  if e.get('ph')=='X' and e.get('dur',0)>3000: C[(e['name'],e.get('tid'),str(e.get('args',{}).get('data',{}).get('url','') or e.get('args',{}).get('data',{}).get('functionName',''))[-60:])]+=e['dur']//1000
for k,v in C.most_common(25): print(v,'ms',k)
