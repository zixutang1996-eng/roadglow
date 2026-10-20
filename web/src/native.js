// v0.9.2 Android (Capacitor) bridge. Loaded first; does nothing in a normal browser.
// Polyfills the Web APIs the app already uses (geolocation, wakeLock, speech) with native plugins,
// so the web code stays identical on web / Android / (later) iOS.
import { Capacitor, registerPlugin } from '@capacitor/core';
// v0.9.2h: if storage is blocked (tracking prevention / strict privacy), fall back to memory so boot never throws
try { const k = '__rg_t'; localStorage.setItem(k, '1'); localStorage.removeItem(k); } catch {
  const m = new Map(); try { Object.defineProperty(window, 'localStorage', { configurable: true, value: { getItem: k => m.has(k) ? m.get(k) : null, setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k), clear: () => m.clear(), key: i => [...m.keys()][i] ?? null, get length() { return m.size; } } }); } catch {} }
export const NATIVE = Capacitor.isNativePlatform();
let ZH = false; try { ZH = String(localStorage.getItem('lang')?.replace(/"/g, '') || navigator.language || '').toLowerCase().startsWith('zh'); } catch { ZH = (navigator.language || '').startsWith('zh'); }
const L = (z, e) => ZH ? z : e;

if (NATIVE) {
  const [{ Geolocation }, { App }, { StatusBar, Style }, { KeepAwake }, { TextToSpeech }, { SplashScreen }] = await Promise.all([
    import('@capacitor/geolocation'), import('@capacitor/app'), import('@capacitor/status-bar'), import('@capacitor-community/keep-awake'), import('@capacitor-community/text-to-speech'), import('@capacitor/splash-screen')]);
  const BG = registerPlugin('BackgroundGeolocation');
  document.documentElement.classList.add('native', 'android');

  // ---- geolocation: one-shot via @capacitor/geolocation, continuous (navigation) via a foreground service
  const toPos = p => ({ coords: { latitude: p.latitude ?? p.coords?.latitude, longitude: p.longitude ?? p.coords?.longitude, accuracy: p.accuracy ?? p.coords?.accuracy, speed: p.speed ?? p.coords?.speed ?? null, heading: p.bearing ?? p.coords?.heading ?? null, altitude: p.altitude ?? null }, timestamp: p.time || p.timestamp || Date.now() });
  const perm = async () => { try { let s = await Geolocation.checkPermissions(); if (s.location !== 'granted') s = await Geolocation.requestPermissions({ permissions: ['location'] }); return s.location === 'granted' || s.coarseLocation === 'granted'; } catch { return false; } };
  const geoErr = (cb, code, msg) => cb?.({ code, message: msg, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 });
  const g = navigator.geolocation || {};
  const watches = new Map(); let wid = 1;
  const native = {
    getCurrentPosition(ok, err, o = {}) { perm().then(granted => { if (!granted) return geoErr(err, 1, 'denied'); Geolocation.getCurrentPosition({ enableHighAccuracy: o.enableHighAccuracy !== false, timeout: o.timeout || 10000, maximumAge: o.maximumAge || 0 }).then(p => ok(toPos(p)), e => geoErr(err, /timeout/i.test(e.message) ? 3 : 2, e.message)); }); },
    watchPosition(ok, err) {
      const id = wid++;
      (async () => {
        try { const { LocalNotifications } = await import('@capacitor/local-notifications'); await LocalNotifications.requestPermissions(); } catch {}
        const w = await BG.addWatcher({ backgroundTitle: 'RoadGlow', backgroundMessage: L('导航中 · 点按返回 RoadGlow', 'Navigating · tap to return to RoadGlow'), requestPermissions: true, stale: false, distanceFilter: 0 },
          (loc, e) => { if (e) { if (e.code === 'NOT_AUTHORIZED' && confirm(L('需要定位权限才能导航。打开设置？', 'Location permission is needed for navigation. Open settings?'))) BG.openSettings(); return geoErr(err, e.code === 'NOT_AUTHORIZED' ? 1 : 2, e.message); } loc && ok(toPos(loc)); });
        if (watches.has(id)) watches.set(id, w); else BG.removeWatcher({ id: w });
      })();
      watches.set(id, null); return id;
    },
    clearWatch(id) { const w = watches.get(id); watches.delete(id); if (w) BG.removeWatcher({ id: w }); },
  };
  try { Object.defineProperty(navigator, 'geolocation', { value: native, configurable: true }); } catch { Object.assign(g, native); }
  // the web code asks navigator.permissions for 'geolocation' on boot; answer from the native permission state
  const pq = navigator.permissions?.query?.bind(navigator.permissions);
  if (navigator.permissions) navigator.permissions.query = async d => d?.name === 'geolocation' ? { state: ({ granted: 'granted', denied: 'denied' })[(await Geolocation.checkPermissions().catch(() => ({}))).location] || 'prompt', addEventListener() {} } : pq(d);

  // ---- keep screen on (Screen Wake Lock API shim)
  Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: { request: async () => { await KeepAwake.keepAwake(); const s = { released: false, release: async () => { s.released = true; await KeepAwake.allowSleep(); }, addEventListener() {} }; return s; } } });

  // ---- speech: native Android TTS (WebView has no speechSynthesis)
  window.__nativeSay = (text, lang, rate = 1, pitch = 1) => { TextToSpeech.stop().catch(() => {}); TextToSpeech.speak({ text, lang, rate: Math.min(2, Math.max(0.5, rate)), pitch, volume: 1, category: 'playback', queueStrategy: 0 }).catch(() => {}); };

  // ---- status / navigation bars: draw edge-to-edge, insets come in as --safe-area-inset-* (Capacitor SystemBars)
  const bars = () => { const dk = document.body.classList.contains('dark'); StatusBar.setStyle({ style: dk ? Style.Dark : Style.Light }).catch(() => {}); };
  new MutationObserver(bars).observe(document.body, { attributes: true, attributeFilter: ['class'] }); bars();

  // ---- Android back button closes the top-most panel instead of quitting
  const vis = s => { const e = document.querySelector(s); return e && !e.classList.contains('hidden') && e.offsetParent !== null ? e : null; };
  App.addListener('backButton', () => {
    const steps = [
      () => document.querySelector('#drawer.open') && (document.querySelector('#scrim').click(), 1),
      () => { const d = document.querySelector('#iosGuide,.card[role=dialog]'); if (d) { (d.querySelector('.x,.xbig,[data-close]') || { click: () => d.remove() }).click(); return 1; } },
      () => vis('#layersPop') && (vis('#layersPop').classList.add('hidden'), 1),
      () => vis('#suggest') && (document.activeElement?.blur(), vis('#suggest').classList.add('hidden'), 1),
      () => vis('#panel') && (document.querySelector('#panelX').click(), 1),
    ];
    for (const s of steps) if (s()) return;
    App.minimizeApp(); // keep navigation (foreground service) running instead of exiting
  });
  window.addEventListener('load', () => setTimeout(() => SplashScreen.hide().catch(() => {}), 300));
}
