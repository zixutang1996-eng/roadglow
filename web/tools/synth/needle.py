# Pixel test: compass needle drawn centre vs #compassBtn centre, by diffing shots with needle visible/hidden.
# Usage: python3 needle.py <base-url> <outdir> skin[,skin]   -> prints per (skin,mode,lang,bearing) dx,dy in CSS px
import asyncio,sys,os,io
from PIL import Image,ImageChops
from playwright.async_api import async_playwright
U,OUT,SK=sys.argv[1],sys.argv[2],sys.argv[3].split(',');os.makedirs(OUT,exist_ok=True);worst=0
async def main():
  global worst
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    for sk in SK:
     for mode in ['dark','light']:
      for lang in ['zh','en']:
        c=await b.new_context(viewport={'width':412,'height':915},device_scale_factor=3,service_workers='block');pg=await c.new_page()
        await c.add_init_script(f"localStorage.setItem('mode','\"{mode}\"');localStorage.setItem('lang','{lang}')")
        await pg.goto(U);await pg.wait_for_function('window.__rgMapReady',timeout=120000)
        await pg.evaluate("""async id=>{const c=await (await fetch('packs/index.json')).json();const e=c.packs.find(x=>x.id===id);const u8=new Uint8Array(await (await fetch('packs/'+(e.url||e.file||(id+'-'+e.version+'.rgpack')))).arrayBuffer());await window._app.installPackBytes(u8,e.sha256)}""",sk)
        await pg.evaluate(f"localStorage.setItem('skin','\"{sk}\"')");await pg.reload();await pg.wait_for_function('window.__rgMapReady',timeout=120000);await pg.wait_for_timeout(3000)
        C={}
        for br in [0,90,180,270,45,225,135,315]:
          await pg.evaluate(f"window._map.jumpTo({{bearing:{br}}})");await pg.wait_for_timeout(600)
          r=await pg.evaluate("(()=>{const r=document.querySelector('#compassBtn').getBoundingClientRect();return [r.x,r.y,r.width,r.height]})()")
          clip={'x':r[0],'y':r[1],'width':r[2],'height':r[3]}
          await pg.evaluate("document.querySelector('#map').style.visibility='hidden'")
          a=Image.open(io.BytesIO(await pg.screenshot(clip=clip))).convert('RGB')
          await pg.evaluate("document.querySelector('#needle').style.visibility='hidden'")
          h=Image.open(io.BytesIO(await pg.screenshot(clip=clip))).convert('RGB')
          await pg.evaluate("document.querySelector('#needle').style.visibility='';document.querySelector('#map').style.visibility=''")
          d=ImageChops.difference(a,h).convert('L').point(lambda v:255 if v>24 else 0);bb=d.getbbox()
          if br in(0,45,90):a.resize((a.width*3,a.height*3),Image.NEAREST).save(f'{OUT}/{sk}_{mode}_{lang}_b{br}.png')
          if not bb:print(sk,mode,lang,br,'NO NEEDLE PIXELS');worst=99;continue
          dx=((bb[0]+bb[2])/2-a.width/2)/3;dy=((bb[1]+bb[3])/2-a.height/2)/3;C[br]=(dx,dy)
          if br%90==0: worst=max(worst,abs(dx),abs(dy))  # axis-aligned: bbox centre must be on button centre
          print(sk,mode,lang,br,f'dx={dx:+.2f} dy={dy:+.2f}',flush=True)
        for a1,a2 in[(45,225),(135,315)]:  # diagonal: an asymmetric arrow's bbox shifts, so check the pivot = midpoint of opposite rotations
          px=(C[a1][0]+C[a2][0])/2;py=(C[a1][1]+C[a2][1])/2;worst=max(worst,abs(px),abs(py));print(sk,mode,lang,f'pivot {a1}/{a2} dx={px:+.2f} dy={py:+.2f}',flush=True)
        await c.close()
    await b.close()
  print('WORST',round(worst,2),'PASS' if worst<=1 else 'FAIL')
asyncio.run(main())
