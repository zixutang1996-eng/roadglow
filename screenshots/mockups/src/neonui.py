import asyncio,os
from playwright.async_api import async_playwright
from nskull import svg as skull
I={'menu':'<path d="M4 6h16M4 12h16M4 18h16"/>','dir':'<path d="M12 3l9 9-9 9-9-9z"/><path d="M9 13v-2h5V9l3 3-3 3v-2"/>','layers':'<path d="M12 4l9 5-9 5-9-5z"/><path d="M3 14l9 5 9-5"/>',
'loc':'<circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>','plus':'<path d="M12 5v14M5 12h14"/>','minus':'<path d="M5 12h14"/>','search':'<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/>',
'x':'<path d="M6 6l12 12M18 6L6 18"/>','chev':'<path d="M9 6l6 6-6 6"/>','star':'<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/>','compass':'<circle cx="12" cy="12" r="8.5"/><path d="M15 9l-2 4-4 2 2-4z"/>',
'tool':'<path d="M4 17L17 4l3 3L7 20z"/>','gear':'<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>','nav':'<path d="M12 3l9 9-9 9-9-9z"/>','info':'<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/>'}
def ic(n,s=22,c='var(--acc)'): return f'<svg width="{s}" height="{s}" viewBox="0 0 24 24" fill="none" stroke="{c}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" style="flex:none">{I[n]}</svg>'
NEEDLE='<svg width="26" height="26" viewBox="0 0 24 24"><path d="M12 2l4 10h-8z" fill="var(--mag)"/><path d="M12 22l-4-10h8z" fill="var(--sub)"/></svg>'
PAL={
'dark':dict(base='nbase_dark.png',fill='#141824',fill3='#1d2333',txt='#e2e9f3',sub='#a3b2c6',acc='#4fd6e8',mag='#e0569e',line='rgba(79,214,232,.32)',glow='rgba(79,214,232,.16)',sh='drop-shadow(0 2px 3px rgba(0,0,0,.6)) drop-shadow(0 8px 18px rgba(0,0,0,.55))'),
'L1':dict(base='nbase_L1.png',fill='#f6f1e8',fill3='#ebe4d8',txt='#1d1a22',sub='#4a4452',acc='#0b6f75',mag='#a8245f',line='rgba(11,111,117,.35)',glow='rgba(11,111,117,.10)',sh='drop-shadow(0 1px 2px rgba(60,45,30,.28)) drop-shadow(0 6px 14px rgba(60,45,30,.20))'),
'L2':dict(base='nbase_L2.png',fill='#e9edf1',fill3='#dde3e9',txt='#161b23',sub='#3f4752',acc='#0a6a80',mag='#8e2a70',line='rgba(10,106,128,.35)',glow='rgba(10,106,128,.10)',sh='drop-shadow(0 1px 2px rgba(20,30,45,.28)) drop-shadow(0 6px 14px rgba(20,30,45,.20))'),
'L3':dict(base='nbase_L3.png',fill='#f3eadc',fill3='#e7dccb',txt='#2a221d',sub='#54473d',acc='#136f6d',mag='#962f60',line='rgba(19,111,109,.35)',glow='rgba(19,111,109,.10)',sh='drop-shadow(0 1px 2px rgba(70,50,30,.28)) drop-shadow(0 6px 14px rgba(70,50,30,.20))'),
}
def poly(c,i=0): return f"polygon({c-i*.4}px 0,100% 0,100% calc(100% - {c-i*.4}px),calc(100% - {c-i*.4}px) 100%,0 100%,0 {c-i*.4}px)"
def css(P,outline):
  o=f"var(--line)" if outline else "var(--fill)"
  return f'''@font-face{{font-family:Raj;src:url(Rajdhani-700n.woff2)}} @font-face{{font-family:Raj6;src:url(Rajdhani-600n.woff2)}}
body{{margin:0;width:461px;height:1024px;position:relative;background:url({P['base']}) 0 0/461px 1024px;font-family:Raj6,"Noto Sans CJK SC",sans-serif;--fill:{P['fill']};--fill3:{P['fill3']};--txt:{P['txt']};--sub:{P['sub']};--acc:{P['acc']};--mag:{P['mag']};--line:{P['line']};color:var(--txt)}}
.c{{position:absolute;filter:{P['sh']}{' drop-shadow(0 0 '+P.get('gr','6px')+' '+P['glow']+')' if outline else ''};isolation:isolate}}
.c::before{{content:'';position:absolute;inset:0;background:{o};clip-path:var(--cp);z-index:-2}}
.c::after{{content:'';position:absolute;inset:1px;background:var(--fill);clip-path:var(--cpi);z-index:-1}}
.in{{position:relative;display:flex;align-items:center;height:100%}}'''
def C(c,style,inner,extra=''): return f'<div class="c" style="--cp:{poly(c)};--cpi:{poly(c,1)};{style}">{"<div class=in style=\"%s\">%s</div>"%(extra,inner)}</div>'
def map_ui(P,outline):
  chips=''.join(C(7,f'position:relative;height:38px;flex:none',f'<span style="font-size:17px;padding:0 13px">{t}</span>') for t in ['餐厅','咖啡','超市','加油站','酒店','公园'])
  strip=''.join(f'<div style="height:50px;display:grid;place-items:center;{"border-top:1px solid var(--line)" if i else ""}">{x}</div>' for i,x in enumerate([ic('layers'),NEEDLE,ic('loc'),ic('plus',22,'var(--txt)'),ic('minus',22,'var(--txt)')]))
  return (C(14,'left:16px;right:16px;top:66px;height:56px',f'{ic("menu")}<span style="font-size:19px;color:var(--sub);margin-left:12px">搜索地点或地址</span><span style="margin-left:auto">{ic("dir",22,"var(--mag)")}</span>','padding:0 14px')
   +f'<div style="position:absolute;left:16px;right:0;top:134px;display:flex;gap:8px;padding:4px 0 10px">{chips}</div>'
   +C(9,'left:150px;top:194px;height:44px',f'{ic("search",20)}<span style="font-size:17px;margin-left:8px">搜索此区域</span>','padding:0 14px')
   +C(12,'right:16px;top:300px;width:54px',f'<div style="width:100%">{strip}</div>'))
def drawer(P,sk=None):
  rows=[('star','我的地点'),('compass','探索'),('tool','工具'),('gear','设置'),('nav','导航卡片'),('layers','皮肤插件与语言'),('info','关于与版权')]
  dv='<div style="display:flex;align-items:center;margin:2px 10px;gap:0"><span style="width:1px;height:7px;background:var(--acc);opacity:.6"></span><span style="flex:1;height:1px;background:linear-gradient(90deg,var(--line),rgba(0,0,0,0) 85%)"></span></div>'
  body=dv.join(f'<div style="display:flex;align-items:center;gap:14px;height:52px;padding:0 10px"><span class="c" style="position:relative;width:34px;height:34px;--cp:{poly(7)};--cpi:{poly(7,1)};--fill:var(--fill3)"><span class="in" style="justify-content:center">{ic(a,19)}</span></span><span style="font-size:19px">{b}</span><span style="margin-left:auto">{ic("chev",20,"var(--sub)")}</span></div>' for a,b in rows)
  head=f'<div style="display:flex;align-items:center;padding:6px 10px 12px"><span style="font-family:Raj;font-size:28px;letter-spacing:.04em;color:var(--acc);text-shadow:0 0 8px {P["glow"]}">RoadGlow</span><span class="c" style="position:relative;margin-left:auto;width:42px;height:42px;--cp:{poly(9)};--cpi:{poly(9,1)};--fill:var(--fill3)"><span class="in" style="justify-content:center">{ic("x",22,"var(--txt)")}</span></span></div>'
  skh=''
  if sk:
    skh=f'<div style="position:absolute;left:0;right:0;bottom:70px;display:flex;flex-direction:column;align-items:center;gap:14px"><div style="display:flex;align-items:center;gap:6px;width:130px"><span style="flex:1;height:1px;background:linear-gradient(90deg,transparent,var(--line))"></span><span style="width:6px;height:6px;border:1px solid var(--acc);transform:rotate(45deg);opacity:.7"></span><span style="flex:1;height:1px;background:linear-gradient(90deg,var(--line),transparent)"></span></div>'+skull(sk).replace('width="100" height="100"','width="130" height="130" style="color:var(--acc);opacity:.6;filter:drop-shadow(0 0 3px '+P['glow']+')"')+'</div>'
  frost=f'<div style="position:absolute;inset:0;overflow:hidden"><div style="position:absolute;inset:-20px;background:url({P["base"]}) 20px 20px/461px 1024px no-repeat;filter:blur(4px)"></div><div style="position:absolute;inset:0;background:rgba(6,8,14,.18)"></div></div>'
  return frost+C(18,'left:12px;top:20px;bottom:20px;width:322px',f'<div style="width:100%;height:100%;padding:12px 8px;box-sizing:border-box;position:relative">{head}{body}{skh}</div>','align-items:stretch')
def page(P,body,outline): return f'<html><head><style>{css(P,outline)}</style></head><body>{body}</body></html>'
JOBS=[('neon_map_dark_A_shadow.png','dark',lambda P:map_ui(P,False),False),('neon_map_dark_B_softline.png','dark',lambda P:map_ui(P,True),True),
 ('neon_drawer_dark.png','dark',lambda P:drawer(P),True)]
JOBS+=[(f'neon_drawer_dark_skull_{s}.png','dark',(lambda s: lambda P:drawer(P,s))(s),True) for s in ('S1','S2','S3')]
JOBS+=[(f'neon_light_{k}.png',k,lambda P:map_ui(P,True),True) for k in ('L1','L2','L3')]
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome'); pg=await b.new_page(viewport={'width':461,'height':1024},device_scale_factor=2)
    for out,k,fn,ol in JOBS:
      open('n.html','w').write(page(PAL[k],fn(PAL[k]),ol)); await pg.goto('file://'+os.path.abspath('n.html')); await pg.evaluate('document.fonts.ready'); await pg.wait_for_timeout(600); await pg.screenshot(path='../'+out)
    await b.close()
if __name__=="__main__": asyncio.run(main())
