# Bakes the mockup-v4 art (exact synth.js SVG) to PNG/WebP for the synthb / synthc packs. Run from web/packsrc/synth.
import asyncio,json,os
from playwright.async_api import async_playwright
from PIL import Image
NAMES=['restaurant','cafe','bar','library','supermarket','fuel','hotel','hospital','pharmacy','school','park','bank','parking','transit','ferry','museum','shop','generic','airport','quest']
U='http://127.0.0.1:18801/web/packsrc/synth/bake.html'
async def main():
  async with async_playwright() as pw:
    b=await pw.chromium.launch(executable_path='/usr/bin/google-chrome')
    c=await b.new_context(viewport={'width':800,'height':800},device_scale_factor=2)
    for d in 'BC':
      O=f'out{d}';os.makedirs(O,exist_ok=True)
      for m in 'dl':
        mode='dark' if m=='d' else 'light'
        p=await c.new_page();p.on('pageerror',lambda e:print('ERR',e))
        await p.goto(f'{U}?d={d}&m={m}');await p.wait_for_function('window.ART');await p.evaluate('document.fonts.load("40px Kaushan")');await p.evaluate('document.fonts.ready')
        async def shot(html,fn,w,h):
          await p.evaluate('([h,w,hh])=>{const s=document.getElementById("s");s.innerHTML=`<div style="width:${w}px;height:${hh}px;position:relative;overflow:visible">${h}</div>`}',[html,w,h])
          await p.wait_for_timeout(60);await p.locator('#s>div').screenshot(path=fn,omit_background=True)
        for k,fn,w,h in [('art()',f'{O}/art_{mode}.png',318,206),('foot()',f'{O}/foot_{mode}.png',318,150),('me()',f'{O}/puck_{mode}.png',64,64),('compass()',f'{O}/compass_{mode}.png',30,30)]:
          await shot(await p.evaluate('ART.'+k),fn,w,h)
        # POI sprite: 46x44 css px cells @2x; 4px padding so the neon outline is not clipped
        J={};cells=[]
        for n in NAMES:
          await shot('<div style="padding:4px">'+await p.evaluate('k=>ART.poi(k)',n)+'</div>',f'/tmp/c.png',54,52); cells.append(Image.open('/tmp/c.png').convert('RGBA'))
        cw,ch=cells[0].size;cols=10;sheet=Image.new('RGBA',(cw*cols,ch*((len(cells)+cols-1)//cols)),(0,0,0,0))
        for i,(n,im) in enumerate(zip(NAMES,cells)):
          x,y=(i%cols)*cw,(i//cols)*ch;sheet.alpha_composite(im,(x,y));J[n]=dict(x=x,y=y,width=cw,height=ch,pixelRatio=2)
        sheet.save(f'{O}/icons_{mode}.png',optimize=True);json.dump(J,open(f'{O}/icons_{mode}.json','w'))
        json.dump({'V':await p.evaluate('ART.V'),'S':await p.evaluate('ART.SLV'),'P':await p.evaluate('ART.P')},open(f'{O}/vars_{mode}.json','w'),indent=0)
        await p.close();print(d,mode,'ok',flush=True)
    await b.close()
asyncio.run(main())
