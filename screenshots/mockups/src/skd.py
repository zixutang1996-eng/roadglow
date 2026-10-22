import asyncio,os
import frost as F
from skull import svg
from playwright.async_api import async_playwright
fg='radial-gradient(120% 80% at 70% 40%,rgba(120,100,70,.05),transparent)'
def place(h,v,col,op):
  sk=svg(v).replace('width="200" height="116" style="color:#3a2a1a"',f'width="140" height="81" style="color:{col};opacity:{op}"')
  orn=f'<div style="position:absolute;left:12px;width:318px;top:846px;z-index:5;display:flex;flex-direction:column;align-items:center;gap:14px"><div class="dv2" style="width:120px;margin:0"><span></span><svg width="14" height="10" viewBox="0 0 14 10"><path d="M7 1l4 4-4 4-4-4z" fill="none" stroke="var(--line)" stroke-width="1.2"/><circle cx="7" cy="5" r="1.1" fill="var(--line)"/></svg><span></span></div>{sk}</div>'
  i=h.rindex('</body>'); return h[:i]+orn+h[i:]
J=[('n2_deeper','B_base_n2.png','rgba(8,10,14,.16)',fg,'A','#d9c08a',.6,'drawer_skull_A_n2.png'),
   ('n2_deeper','B_base_n2.png','rgba(8,10,14,.16)',fg,'B','#d9c08a',.6,'drawer_skull_B_n2.png')]
import sys; best=sys.argv[1]
J+=[('n1_deeper','B_base_n1.png','rgba(12,8,4,.16)','radial-gradient(120% 80% at 70% 40%,rgba(150,110,60,.06),transparent)',best,'#e2c592',.58,'drawer_skull_n1.png'),
    ('dayF','C_base.png','rgba(236,224,194,.15)','linear-gradient(rgba(245,236,214,.06),rgba(245,236,214,.06))',best,'#4a3420',.7,'drawer_skull_day.png')]
async def main():
  async with async_playwright() as p:
    br=await p.chromium.launch(executable_path='/usr/bin/google-chrome'); pg=await br.new_page(viewport={'width':461,'height':1024},device_scale_factor=2)
    for k,base,tn,fgg,v,col,op,out in J:
      h=F.frost(F.fix_drawer(F.DR.html(2,k),3),base,4,tn,fgg,.18 if k!='dayF' else .12)
      open('f.html','w').write(place(h,v,col,op)); await pg.goto('file://'+os.path.abspath('f.html')); await pg.evaluate('document.fonts.ready'); await pg.wait_for_timeout(1000); await pg.screenshot(path='../'+out)
    await br.close()
if __name__=="__main__": asyncio.run(main())
