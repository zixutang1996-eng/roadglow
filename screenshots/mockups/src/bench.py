import asyncio
from playwright.async_api import async_playwright
JS="""async()=>{const W=1080,H=2400;const src=document.createElement('canvas');src.width=W;src.height=H;const c=src.getContext('2d');for(let i=0;i<4000;i++){c.fillStyle=`hsl(${i%360},30%,30%)`;c.fillRect(Math.random()*W,Math.random()*H,40,40)}
const r=[];for(let k=0;k<10;k++){const t=performance.now();const d=document.createElement('canvas');d.width=W/4;d.height=H/4;const x=d.getContext('2d');x.filter='blur(3px)';x.drawImage(src,0,0,W/4,H/4);const url=d.toDataURL('image/jpeg',.7);r.push(performance.now()-t)}r.sort((a,b)=>a-b);return r[5].toFixed(1)}"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome'); pg=await b.new_page(); print('median ms',await pg.evaluate(JS)); await b.close()
asyncio.run(main())
