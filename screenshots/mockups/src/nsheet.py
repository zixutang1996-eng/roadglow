import asyncio
from playwright.async_api import async_playwright
async def m():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome'); pg=await b.new_page(viewport={'width':1380,'height':470},device_scale_factor=2)
    s=''.join('<div style="display:inline-block;margin:20px 10px;width:420px;text-align:center;color:#8fa3b8;font:16px sans-serif">'+open(f'../neon_skull_S{i}.svg').read().replace('width="100" height="100"','width="400" height="400" style="color:#4fd6e8;--mag:#e0569e;opacity:.85;filter:drop-shadow(0 0 4px rgba(79,214,232,.35))"')+f'<div>S{i}</div></div>' for i in (1,2,3))
    await pg.set_content('<body style="margin:0;background:#141824;white-space:nowrap">'+s+'</body>')
    await pg.screenshot(path='../neon_skull_sheet.png'); await b.close()
asyncio.run(m())
