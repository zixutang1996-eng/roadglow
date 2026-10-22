import asyncio
from playwright.async_api import async_playwright
ICON={
'menu':'<path d="M4 6h16M4 12h16M4 18h16"/>',
'dir':'<path d="M12 3l9 9-9 9-9-9z"/><path d="M9 13v-2h5V9l3 3-3 3v-2"/>',
'layers':'<path d="M12 4l9 5-9 5-9-5z"/><path d="M3 14l9 5 9-5"/>',
'loc':'<circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2" fill="currentColor"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
'plus':'<path d="M12 5v14M5 12h14"/>','minus':'<path d="M5 12h14"/>',
'search':'<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/>',
'x':'<path d="M6 6l12 12M18 6L6 18"/>','left':'<path d="M20 12H5M11 5l-7 7 7 7"/>','up':'<path d="M12 20V5M6 11l6-6 6 6"/>'}
def ic(n,s=24): return f'<svg width="{s}" height="{s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">{ICON[n]}</svg>'
COMPASS='''<svg width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="20" r="17" fill="none" stroke="var(--brass)" stroke-width="1.2"/><circle cx="20" cy="20" r="14" fill="none" stroke="var(--brass)" stroke-width=".6" stroke-dasharray="1 2"/>
<path d="M20 3 L23 20 L20 37 L17 20Z" fill="var(--ink2)"/><path d="M20 3 L23 20 L17 20Z" fill="var(--oxb)"/><path d="M3 20 L20 17.5 L37 20 L20 22.5Z" fill="var(--brass)" opacity=".8"/><circle cx="20" cy="20" r="2" fill="var(--brass)"/>
<text x="20" y="11" font-size="0" /></svg>'''
CSS={
# Option 1: clean cartouche
1:'''
.p{background:var(--fill);color:var(--txt);border:1.5px solid var(--rule);outline:1px solid var(--rule);outline-offset:-5px;
 clip-path:polygon(10px 0,calc(100% - 10px) 0,100% 10px,100% calc(100% - 10px),calc(100% - 10px) 100%,10px 100%,0 calc(100% - 10px),0 10px);
 filter:drop-shadow(0 2px 3px rgba(0,0,0,.35))}
.wrap{filter:drop-shadow(0 3px 6px rgba(0,0,0,.35))}
.chip{background:var(--fill);border:1px solid var(--rule);color:var(--txt);border-radius:2px 2px 10px 10px/2px 2px 6px 6px;border-top:3px solid var(--brass)}
.strip .b+.b{border-top:1px solid var(--rule2)}
''',
# Option 2: ledger / map legend
2:'''
.p{background:var(--fill2);color:var(--txt);border:2px solid var(--ink2);box-shadow:inset 0 0 0 3px var(--fill2),inset 0 0 0 4px var(--rule),0 3px 8px rgba(0,0,0,.35);border-radius:3px}
.p.lined{background-image:repeating-linear-gradient(var(--fill2) 0 27px,var(--rule2) 27px 28px)}
.chip{background:transparent;border:none;border-bottom:2px solid var(--rule);border-radius:0;color:var(--txt);padding:0 8px!important;font-variant:small-caps}
.chips{background:var(--fill2);border:1px solid var(--rule);box-shadow:0 2px 5px rgba(0,0,0,.3);padding:4px 6px;border-radius:3px;gap:2px!important}
.strip .b+.b{border-top:1px dashed var(--rule)}
.hd{font-family:'Fell';letter-spacing:.06em;font-size:13px!important;text-transform:uppercase}
'''}
PAL={'dark':'--fill:rgba(46,38,29,.94);--fill2:rgba(52,43,32,.95);--txt:#efe2c6;--sub:#cdbb98;--rule:#a8885a;--rule2:rgba(168,136,90,.45);--brass:#c9a35e;--ink2:#1c1610;--oxb:#8e2f26;--btn:#6e2a22;',
     'light':'--fill:rgba(236,224,194,.95);--fill2:rgba(240,229,200,.96);--txt:#2e2216;--sub:#5a4630;--rule:#7a5c38;--rule2:rgba(122,92,56,.4);--brass:#8a6a32;--ink2:#3a2a1a;--oxb:#8e2f26;--btn:#7a2e25;'}
def body(view,opt):
  top=''
  if view=='A':
    top=f'''<div class="p" style="left:16px;right:16px;top:66px;padding:12px 16px">
 <div class="hd" style="font-size:13px;color:var(--sub)">{"当前目标" if opt==1 else "当前目标 · Next Turn"}</div>
 <div style="display:flex;align-items:center;gap:12px;margin-top:2px"><span style="color:var(--brass)">{ic('left',34)}</span>
 <div><div style="font-size:24px;font-weight:700">70 米</div><div style="font-size:17px">左转，进入<span style="font-family:Fell">Firelight Crescent W</span></div></div>
 <div style="margin-left:auto;width:40px;height:40px;border:1px solid var(--rule);display:grid;place-items:center">{ic('x',22)}</div></div>
 <div style="border-top:1px solid var(--rule2);margin-top:8px;padding-top:6px;font-size:14px;color:var(--sub)">前往 Rexall · 还剩 1.3 公里 · 16:23 到达</div></div>
<div class="p" style="left:150px;top:222px;height:44px;padding:0 14px;display:flex;align-items:center;gap:8px;font-size:17px">{ic('search',20)}搜索此区域</div>
<div class="p {'lined' if opt==2 else ''}" style="left:16px;right:16px;top:868px;height:76px;padding:0 14px;display:flex;align-items:center;gap:12px">
 <div><div style="font-size:24px;font-weight:700">3 分钟</div><div style="font-size:14px;color:var(--sub)">1.3 公里 · 16:23</div></div>
 <div style="margin-left:auto;width:46px;height:46px;border:1px solid var(--rule);display:grid;place-items:center;color:var(--brass)">{ic('up',24)}</div>
 <div style="background:var(--btn);color:#f6ead2;height:46px;padding:0 16px;display:flex;align-items:center;gap:8px;font-size:18px;border:1px solid #c9a35e;box-shadow:inset 0 0 0 2px var(--btn),inset 0 0 0 3px rgba(246,234,210,.35)">■ 结束导航</div></div>'''
  else:
    chips=''.join(f'<div class="chip" style="height:38px;padding:0 12px;display:flex;align-items:center;font-size:17px">{c}</div>' for c in ['餐厅','咖啡','超市','加油站','酒店','公园'])
    top=f'''<div class="p" style="left:16px;right:16px;top:66px;height:56px;padding:0 10px;display:flex;align-items:center;gap:10px">
 <span style="color:var(--brass)">{ic('menu')}</span><span style="font-size:19px;color:var(--sub)">搜索地点或地址</span><span style="margin-left:auto;color:var(--brass)">{ic('dir')}</span></div>
<div class="chips" style="position:absolute;left:16px;right:{0 if opt==1 else 16}px;top:132px;display:flex;gap:8px;overflow:hidden">{chips}</div>
<div class="p" style="left:150px;top:{186 if opt==1 else 190}px;height:44px;padding:0 14px;display:flex;align-items:center;gap:8px;font-size:17px">{ic('search',20)}搜索此区域</div>'''
  strip=f'''<div class="p strip" style="right:16px;top:{300 if view!='A' else 300}px;width:52px;padding:0">
 <div class="b">{ic('layers')}</div><div class="b" style="height:58px">{COMPASS}</div><div class="b">{ic('loc')}</div><div class="b">{ic('plus')}</div><div class="b">{ic('minus')}</div></div>'''
  return top+strip
def page(view,opt,mode):
  return f'''<html><head><style>@font-face{{font-family:Fell;src:url(IMFellEnglish-400n.woff2)}}
body{{margin:0;width:461px;height:1024px;position:relative;background:url({view}_base.png) 0 0/461px 1024px;font-family:"Noto Serif CJK SC",serif;{PAL[mode]}}}
.p{{position:absolute;box-sizing:border-box}} .strip .b{{height:50px;display:grid;place-items:center;color:var(--txt)}}
.chip{{flex:none;box-sizing:border-box}}
{CSS[opt]}</style></head><body>{body(view,opt)}</body></html>'''
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome')
    pg=await b.new_page(viewport={'width':461,'height':1024},device_scale_factor=2)
    for opt in (1,2):
      for v,m in (('A','dark'),('B','dark'),('C','light')):
        open(f'm.html','w').write(page(v,opt,m))
        import os; await pg.goto('file://'+os.path.abspath('m.html')); await pg.wait_for_timeout(400)
        await pg.screenshot(path=f'{v}_opt{opt}.png')
    await b.close()
asyncio.run(main())
from PIL import Image,ImageDraw,ImageFont
f=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSerifCJK-Bold.ttc',36)
for opt in (1,2):
  W,H=922,2048; out=Image.new('RGB',(W*6+70,H+90),'#1a1510'); d=ImageDraw.Draw(out)
  for i,v in enumerate('ABC'):
    for j,s in enumerate(['orig',f'opt{opt}']):
      x=10+(i*2+j)*(W+10)+(i*15); out.paste(Image.open(f'{v}_{s}.png').convert('RGB').resize((W,H)),(x,85))
      d.text((x+10,20),f'{v} · '+('现在' if j==0 else f'方案{opt}'),fill='#efe2c6',font=f)
  out=out.resize((out.width//2,out.height//2)); out.save(f'../option{opt}_compare.png')
