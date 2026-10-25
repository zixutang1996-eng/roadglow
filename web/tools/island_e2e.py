from playwright.sync_api import sync_playwright
import json
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']); pg=b.new_page(viewport={'width':400,'height':860},has_touch=False)
    pg.goto('http://127.0.0.1:18793/'); pg.wait_for_timeout(4000)
    r=pg.eval_on_selector('#controls','e=>{const r=e.getBoundingClientRect();return [r.left,r.top,r.width,r.height]}'); print('start',r)
    cx,cy=r[0]+r[2]/2,r[1]+20
    pg.mouse.move(cx,cy); pg.mouse.down(); pg.wait_for_timeout(300); pg.mouse.move(cx-150,cy+200,steps=5); pg.mouse.up()
    r1=pg.eval_on_selector('#controls','e=>{const r=e.getBoundingClientRect();return [r.left,r.top]}'); print('short press (should not move)',r1)
    pg.mouse.move(cx,cy); pg.mouse.down(); pg.wait_for_timeout(1100); pg.mouse.move(cx-250,cy+250,steps=10); pg.mouse.up(); pg.wait_for_timeout(300)
    r2=pg.eval_on_selector('#controls','e=>{const r=e.getBoundingClientRect();return [r.left,r.top]}'); print('after hold-drag',r2, 'stored',pg.evaluate("Object.keys(localStorage).filter(k=>k.includes('ctlPos')).map(k=>localStorage[k])"))
    pg.screenshot(path='/workspace/gamenav/screenshots/v0913/island_dragged.png')
    pg.reload(); pg.wait_for_timeout(4000)
    r3=pg.eval_on_selector('#controls','e=>{const r=e.getBoundingClientRect();return [r.left,r.top]}'); print('after reload',r3)
    b.close()
