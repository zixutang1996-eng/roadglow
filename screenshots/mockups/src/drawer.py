import asyncio,os
from playwright.async_api import async_playwright
I={'star':'<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/>','list':'<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>','clock':'<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/>',
'compass':'<circle cx="12" cy="12" r="8.5"/><path d="M15 9l-2 4-4 2 2-4z"/>','tool':'<path d="M4 17L17 4l3 3L7 20z"/><path d="M8 13l1.5 1.5M11 10l1.5 1.5M14 7l1.5 1.5"/>','gear':'<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>',
'nav':'<path d="M12 3l9 9-9 9-9-9z"/><path d="M9 13v-2h5V9l3 3-3 3v-2"/>','layers':'<path d="M12 4l9 5-9 5-9-5z"/><path d="M3 14l9 5 9-5"/>','info':'<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/>',
'x':'<path d="M6 6l12 12M18 6L6 18"/>','chev':'<path d="M9 6l6 6-6 6"/>','down':'<path d="M6 9l6 6 6-6"/>','tri':'<path d="M9 7l6 5-6 5z" fill="currentColor"/>'}
def ic(n,s=22,col='var(--acc)'): return f'<svg width="{s}" height="{s}" viewBox="0 0 24 24" fill="none" stroke="{col}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="flex:none">{I[n]}</svg>'
PAL={
'n2':dict(base='B_base_n2.png',fill='#b9a57e',tint='#ad986f',txt='#150e07',sub='#33261a',acc='#4a3418',line='#4a3418',sh='0 1px 2px rgba(0,0,0,.55),0 10px 30px rgba(0,0,0,.6)',scrim='rgba(5,8,12,.35)'),
'n1':dict(base='B_base_n1.png',fill='#614c37',tint='#6c5641',txt='#f7eedb',sub='#ecdfc2',acc='#f0c780',line='#f0c780',sh='inset 0 1px 0 rgba(255,236,200,.14),0 1px 2px rgba(0,0,0,.6),0 10px 30px rgba(0,0,0,.6)',scrim='rgba(8,5,2,.35)'),
'light':dict(base='C_base.png',fill='#ece0c2',tint='#e2d4b2',txt='#2e2216',sub='#4f3d29',acc='#7a5a28',line='#7a5a28',sh='0 1px 2px rgba(60,40,15,.3),0 10px 28px rgba(60,40,15,.3)',scrim='rgba(40,28,12,.18)'),
}
def div(v):
  if v==1: return '<div class="dv1"></div>'
  if v==2: return '<div class="dv2"><span></span><svg width="14" height="10" viewBox="0 0 14 10"><path d="M7 1l4 4-4 4-4-4z" fill="none" stroke="var(--line)" stroke-width="1.2"/><circle cx="7" cy="5" r="1.1" fill="var(--line)"/></svg><span></span></div>'
  return '<div style="height:10px"></div>'
def grp(inner,v): return f'<div class="{"g3" if v==3 else "g"}">{inner}</div>'
def row(icn,t,right='',big=True): return f'<div class="row">{ic(icn)}<span style="font-size:19px;font-weight:600">{t}</span><span style="margin-left:auto">{right}</span></div>'
def sub(t,pre=''): return f'<div class="sub">{pre}<span>{t}</span></div>'
def html(v,pal):
  P=PAL[pal]; D=div(v)
  g1=grp(row('star','我的地点',ic('down',20))+row('star','已保存')+sub('空'),v)
  g2=grp(row('list','我的列表')+sub('收藏 · 0',ic('tri',14))+sub('想去 · 0',ic('tri',14)),v)
  g3=grp(row('clock','最近')+sub('空'),v)
  g4=grp(''.join(row(a,b,ic('chev',20)) for a,b in [('compass','探索'),('tool','工具'),('gear','设置')]),v)
  g5=grp(''.join(row(a,b,ic('chev',20)) for a,b in [('nav','导航卡片'),('layers','皮肤插件与语言'),('info','关于与版权')]),v)
  body=D.join([g1,g2,g3,g4,g5])
  return f'''<html><head><style>@font-face{{font-family:Fell;src:url(IMFellEnglish-400n.woff2)}}
body{{margin:0;width:461px;height:1024px;position:relative;background:url({P['base']}) 0 0/461px 1024px;font-family:"Noto Serif CJK SC",serif;--line:{P['line']};--acc:{P['acc']}}}
.scrim{{position:absolute;inset:0;background:{P['scrim']}}}
.dr{{position:absolute;left:12px;top:20px;bottom:20px;width:318px;background:{P['fill']};color:{P['txt']};border-radius:22px;box-shadow:{P['sh']};padding:14px 14px;box-sizing:border-box;overflow:hidden}}
.hd{{display:flex;align-items:center;padding:4px 6px 10px}} .row{{display:flex;align-items:center;gap:12px;height:50px;padding:0 8px}}
.sub{{display:flex;align-items:center;gap:8px;height:40px;padding:0 8px 0 42px;font-size:17px;color:{P['sub']}}}
.dv1{{height:1px;margin:8px 10px;background:linear-gradient(90deg,transparent,var(--line) 20%,var(--line) 80%,transparent);opacity:.55;transform:scaleY(1.4);clip-path:polygon(0 50%,8% 0,92% 0,100% 50%,92% 100%,8% 100%)}}
.dv2{{display:flex;align-items:center;gap:6px;margin:6px 18px;opacity:.75}} .dv2 span{{flex:1;height:1px}} .dv2 span:first-child{{background:linear-gradient(90deg,transparent,var(--line))}} .dv2 span:last-child{{background:linear-gradient(90deg,var(--line),transparent)}}
.g3{{background:{P['tint']};border-radius:14px;padding:4px 0}}
</style></head><body><div class="scrim"></div><div class="dr">
<div class="hd"><span style="font-family:Fell;font-size:26px">RoadGlow</span><span style="margin-left:auto;width:40px;height:40px;border-radius:12px;background:{P['tint']};display:grid;place-items:center">{ic('x',22,P['txt'])}</span></div>
{body}</div></body></html>'''
JOBS=[(1,'n2'),(2,'n2'),(3,'n2')]
import sys
if len(sys.argv)>1: JOBS+= [(int(sys.argv[1]),'n1'),(int(sys.argv[1]),'light')]
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome'); pg=await b.new_page(viewport={'width':461,'height':1024},device_scale_factor=2)
    for v,pal in JOBS:
      open('d.html','w').write(html(v,pal)); await pg.goto('file://'+os.path.abspath('d.html')); await pg.wait_for_timeout(400)
      await pg.screenshot(path=f'../drawer_div{v}_{pal}.png')
    await b.close()
if __name__=="__main__": asyncio.run(main())
