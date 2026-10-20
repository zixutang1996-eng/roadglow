// v0.8 iPhone emulation test: Playwright WebKit + iPhone 15 device descriptor (NOT a real iPhone / not real iOS Safari).
const { webkit, devices } = require('/workspace/pw/node_modules/playwright');
const out = '/workspace/gamenav/screenshots/v08/'; const BASE = process.env.URL || 'http://127.0.0.1:18781/';
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await webkit.launch(); const dev = devices['iPhone 15'] || devices['iPhone 14'];
  for (const [th, md] of [['west', 'light'], ['west', 'dark'], ['neon', 'light'], ['neon', 'dark']]) {
    const ctx = await b.newContext({ ...dev, locale: 'zh-CN', geolocation: { latitude: 53.5444, longitude: -113.4909 }, permissions: [] });
    await ctx.addInitScript(([th, md]) => { localStorage.setItem('theme', JSON.stringify(th)); localStorage.setItem('mode', JSON.stringify(md)); }, [th, md]);
    const p = await ctx.newPage(); p.on('pageerror', e => console.log('ERR', e.message));
    await p.goto(BASE + '#15/53.5444/-113.4909', { waitUntil: 'load', timeout: 90000 }); await sleep(6000);
    const info = await p.evaluate(() => ({ ua: navigator.userAgent.slice(0, 60), ios: window._app.ios.IOS, safari: window._app.ios.SAFARI, standalone: window._app.ios.STANDALONE,
      guide: !!document.querySelector('#iosGuide'), theme: document.getElementById('themeColor').content, manifest: !!document.querySelector('link[rel=manifest]'),
      ati: document.querySelector('link[rel=apple-touch-icon]')?.getAttribute('href'), splash: document.querySelectorAll('link[rel=apple-touch-startup-image]').length,
      bodyOver: getComputedStyle(document.body).overscrollBehaviorY || getComputedStyle(document.body).overscrollBehavior, wake: 'wakeLock' in navigator, doe: typeof DeviceOrientationEvent?.requestPermission }));
    console.log(th, md, JSON.stringify(info));
    await p.screenshot({ path: `${out}iphone_a2hs_${th}_${md}.png` });
    if (th === 'west' && md === 'light') {
      await p.click('#iosGuide .x'); await sleep(300); console.log('guide dismissed', !(await p.$('#iosGuide')), 'persisted flag', await p.evaluate(() => localStorage.getItem('a2hsSeen')));
      await p.reload(); await sleep(5000); console.log('guide after reload (should be false)', !!(await p.$('#iosGuide')));
      await p.click('#locBtn'); await sleep(2500); console.log('geo denied -> help panel', !!(await p.$('#geoHelp')), (await p.$eval('#panelBody', e => e.innerText)).slice(0, 120).replace(/\n/g, ' / '));
      await p.screenshot({ path: `${out}iphone_geo_help.png` });
    }
    if (th === 'neon' && md === 'dark') { await p.click('#iosGuide .x').catch(() => {});
      await ctx.grantPermissions(['geolocation']);
      await p.evaluate(() => { const a = window._app; a.S.from = { name: 'A', lat: 53.5444, lng: -113.4909 }; a.openDirections({ name: '阿尔伯塔大学医院', lat: 53.5203, lng: -113.5237 }, true); }); await sleep(9000);
      console.log('nav banner', await p.$eval('#navBanner', e => !e.classList.contains('hidden')), 'wake', JSON.stringify(await p.evaluate(() => window._app.ios.wakeState())), 'toast', await p.$eval('#toast', e => e.textContent.slice(0, 60)));
      await p.screenshot({ path: `${out}iphone_nav_neon_dark.png` });
      await p.click('#endBtn'); await sleep(800); console.log('after end wake', JSON.stringify(await p.evaluate(() => window._app.ios.wakeState())));
    }
    await ctx.close();
  }
  // standalone emulation: navigator.standalone = true -> no guide
  const ctx = await b.newContext({ ...devices['iPhone 15'] || devices['iPhone 14'] }); await ctx.addInitScript(() => Object.defineProperty(navigator, 'standalone', { get: () => true }));
  const p = await ctx.newPage(); await p.goto(BASE, { waitUntil: 'load' }); await sleep(5000);
  console.log('standalone: guide shown?', !!(await p.$('#iosGuide')), 'standalone flag', await p.evaluate(() => window._app.ios.STANDALONE));
  await p.screenshot({ path: `${out}iphone_standalone_west_or_default.png` });
  const man = await (await p.request.get(BASE + 'manifest.webmanifest')).json(); console.log('manifest', man.display, man.icons.length, man.theme_color);
  await b.close();
})().catch(e => { console.log('FAIL', e.message); process.exit(1); });
